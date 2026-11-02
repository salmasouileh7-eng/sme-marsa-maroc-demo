/**
 * engine.js - Moteur central de simulation temps réel pour le SME Marsa Maroc
 * Génère les grandeurs électriques triphasées toutes les N secondes (paramétrable, x1/x10/x60)
 * Gère la qualité des données (OK / ABSENTE / INVALIDE / PERIMEE), les horodatages distincts
 * et la couche Modbus TCP/IP.
 */

import { Store } from "../storage/store.js";
import { LoadProfiles } from "./profiles.js";
import { ModbusTCPSimulator } from "./modbus.js";
import { FaultInjector } from "./faults.js";

export class SimulationEngine {
  constructor() {
    this.intervalId = null;
    this.listeners = new Set();
    this.currentSpeed = 1;
    this.nominalIntervalMs = 5000;
    
    // Dernières mesures instantanées en mémoire par compteur
    this.latestTelemetry = new Map();
    // Historique glissant (60 derniers points par compteur pour courbes temps réel)
    this.telemetryHistory = new Map();
    
    // Cumuls d'énergie de départ (simule des compteurs en exploitation depuis plusieurs mois)
    this.energyAccumulators = new Map();
    
    // Horloge virtuelle pour l'accélération temporelle
    this.virtualTime = new Date();
  }

  init() {
    const simConfig = Store.get("sim_config", { vitesse: 1, periodeSec: 5 });
    this.currentSpeed = simConfig.vitesse || 1;
    this.nominalIntervalMs = (simConfig.periodeSec || 5) * 1000;

    // Initialiser les accumulateurs d'énergie avec des index de départ réalistes (MWh)
    const meters = Store.get("meters", []);
    meters.forEach(meter => {
      // Entre 150 000 et 850 000 kWh selon le calibre du poste
      const seedKWh = 250000 + Math.floor(Math.random() * 500000);
      this.energyAccumulators.set(meter.id, seedKWh);
      this.telemetryHistory.set(meter.id, []);
    });

    // Générer un premier lot de données historiques pour initialiser les graphiques
    this.seedHistoricalBuffer();

    // Démarrer la boucle de simulation
    this.start();
  }

  /**
   * Génère 30 points historiques préalables pour avoir des courbes prêtes immédiatement
   */
  seedHistoricalBuffer() {
    const meters = Store.get("meters", []);
    const now = Date.now();
    for (let i = 30; i >= 1; i--) {
      const pastTime = new Date(now - i * 60000);
      for (const meter of meters) {
        const raw = this.computePhysicalQuantities(meter, pastTime);
        const measurement = {
          compteurId: meter.id,
          posteId: meter.posteId,
          valeurs: raw,
          horodatageMesure: pastTime.toISOString(),
          horodatageReception: new Date(pastTime.getTime() + 150).toISOString(),
          qualite: "OK"
        };
        const hist = this.telemetryHistory.get(meter.id);
        if (hist) hist.push(measurement);
      }
    }
  }

  start() {
    this.stop();
    const tickInterval = Math.max(250, this.nominalIntervalMs / this.currentSpeed);
    this.intervalId = setInterval(() => this.tick(), tickInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSpeed(multiplier) {
    this.currentSpeed = Number(multiplier);
    const simConfig = Store.get("sim_config", {});
    simConfig.vitesse = this.currentSpeed;
    Store.set("sim_config", simConfig);
    Store.logAudit("CHANGEMENT_VITESSE_SIMULATION", "Moteur", `x${this.currentSpeed}`, `Accélération x${multiplier}`);
    this.start();
  }

  /**
   * Calcule les grandeurs physiques électriques nominales d'un compteur selon le profil
   */
  computePhysicalQuantities(meter, timeReference) {
    const site = Store.get("site", {});
    const poste = site.postes ? site.postes.find(p => p.id === meter.posteId) : null;
    const puissanceMaxPoste = poste ? poste.puissanceSouscriteKVA : 1500;

    // Trouver le type d'usage du départ associé à ce compteur
    let usageType = "ARRIVEE";
    if (poste && poste.tableaux) {
      for (const t of poste.tableaux) {
        const dep = t.departs.find(d => d.compteurId === meter.id);
        if (dep) {
          usageType = dep.type;
          break;
        }
      }
    }

    const loadFactor = LoadProfiles.getBaseLoadFactor(timeReference, usageType);
    
    // Détermination de la puissance de base selon que c'est une tête de poste ou un départ
    let nominalPowerKW = 0;
    if (usageType === "ARRIVEE") {
      nominalPowerKW = puissanceMaxPoste * 0.70;
    } else {
      nominalPowerKW = puissanceMaxPoste * 0.35;
    }

    // Puissance active avec bruit
    let pActive = LoadProfiles.addNoise(nominalPowerKW * loadFactor, 0.035);

    // Facteur de puissance cos phi (entre 0.86 et 0.96 selon charge)
    let cosPhi = 0.91 + (Math.sin(timeReference.getTime() / 600000) * 0.05);
    cosPhi = Math.max(0.78, Math.min(0.99, cosPhi));

    // Puissance réactive Q = P * tan(phi)
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
    const tanPhi = sinPhi / cosPhi;
    const pReactive = pActive * tanPhi;

    // Tension MT/BT
    const isMT = meter.registres.some(r => r.grandeur === "U_TENSION" && r.unite === "V");
    const tensionBase = 400.0; // Tension composée BT 400V
    const uTension = LoadProfiles.addNoise(tensionBase, 0.008);

    // Courant moyen I = P / (U * sqrt(3) * cos phi)
    const iCourant = (pActive * 1000) / (uTension * Math.sqrt(3) * cosPhi);

    // Fréquence réseau stable (50 Hz ± 0.05 Hz)
    const freq = LoadProfiles.addNoise(50.0, 0.001);

    // Incrément d'énergie active consommée depuis le dernier pas
    const deltaHours = (this.nominalIntervalMs / 1000 / 3600) * this.currentSpeed;
    const currentAccum = this.energyAccumulators.get(meter.id) || 300000;
    const newAccum = currentAccum + (pActive * deltaHours);
    this.energyAccumulators.set(meter.id, newAccum);

    return {
      P_ACTIVE: Math.round(pActive * 10) / 10,
      P_REACTIVE: Math.round(pReactive * 10) / 10,
      EA_IMPORT: Math.round(newAccum * 100) / 100,
      U_TENSION: Math.round(uTension * 10) / 10,
      I_COURANT: Math.round(iCourant * 10) / 10,
      COS_PHI: Math.round(cosPhi * 1000) / 1000,
      FREQ: Math.round(freq * 100) / 100
    };
  }

  /**
   * Cycle d'exécution principal du moteur
   */
  async tick() {
    // Avancer l'horloge virtuelle
    const timeStepMs = this.nominalIntervalMs * this.currentSpeed;
    this.virtualTime = new Date(this.virtualTime.getTime() + timeStepMs);

    const meters = Store.get("meters", []);
    const simConfig = Store.get("sim_config", {});
    const defauts = simConfig.defauts || {};

    const updatedBatch = [];

    for (const meter of meters) {
      const fault = defauts[meter.id];
      const timeMeasure = new Date(this.virtualTime);
      const timeReceived = new Date(this.virtualTime.getTime() + 120 + Math.random() * 80);

      let rawValues = this.computePhysicalQuantities(meter, timeMeasure);
      let quality = "OK";

      // Gestion des pannes injectées
      if (fault) {
        if (fault.type === "COMM_CUT") {
          quality = "ABSENTE";
          // Mettre la mesure dans le buffer de coupure pour le rattrapage sans doublon
          if (fault.buffer && fault.buffer.length < 200) {
            fault.buffer.push({
              compteurId: meter.id,
              posteId: meter.posteId,
              valeurs: rawValues,
              horodatageMesure: timeMeasure.toISOString(),
              horodatageReception: timeReceived.toISOString(),
              qualite: "OK"
            });
          }
        } else if (fault.type === "ABERRANT") {
          rawValues.P_ACTIVE = 99999.0; // Valeur impossible
          rawValues.I_COURANT = 85000.0;
          quality = "INVALIDE";
        } else if (fault.type === "MISSING") {
          quality = "ABSENTE";
          continue; // Pas de télémétrie envoyée
        } else if (fault.type === "STALE") {
          quality = "PERIMEE";
          // Fige la date de mesure 10 minutes dans le passé
          timeMeasure.setMinutes(timeMeasure.getMinutes() - 10);
        }
      }

      // Requête de communication Modbus TCP/IP
      const isComCut = fault && fault.type === "COMM_CUT";
      const modbusResponse = await ModbusTCPSimulator.queryMeter(meter, rawValues, isComCut);

      const telemetryPoint = {
        compteurId: meter.id,
        posteId: meter.posteId,
        code: meter.code,
        valeurs: rawValues,
        modbusResponse: modbusResponse,
        horodatageMesure: timeMeasure.toISOString(),
        horodatageReception: timeReceived.toISOString(),
        qualite: quality
      };

      this.latestTelemetry.set(meter.id, telemetryPoint);

      // Mémorisation dans l'historique glissant
      let hist = this.telemetryHistory.get(meter.id);
      if (!hist) {
        hist = [];
        this.telemetryHistory.set(meter.id, hist);
      }
      hist.push(telemetryPoint);
      if (hist.length > 80) hist.shift();

      updatedBatch.push(telemetryPoint);
    }

    // Sauvegarder les défauts si les buffers ont bougé
    Store.set("sim_config", simConfig);

    // Déclencher l'évaluation des règles d'alarmes en temps réel
    this.evaluateAlerts(updatedBatch);

    // Notifier tous les composants abonnés (vues, graphiques)
    this.notifyListeners(updatedBatch);
  }

  /**
   * Évaluation des règles d'alertes SCADA
   */
  evaluateAlerts(batch) {
    const rules = Store.get("alert_rules", []);
    const existingAlerts = Store.get("alerts", []);
    let alertsModified = false;

    for (const item of batch) {
      if (item.qualite === "ABSENTE") {
        // Alerte perte com si non existante
        const ruleTimeout = rules.find(r => r.id === "R_COM_TIMEOUT");
        if (ruleTimeout && ruleTimeout.active) {
          const alreadyOpen = existingAlerts.some(a => a.compteurId === item.compteurId && a.regleId === "R_COM_TIMEOUT" && a.statut !== "CLOTUREE");
          if (!alreadyOpen) {
            existingAlerts.unshift({
              id: "ALT_" + Date.now() + "_" + item.compteurId,
              regleId: "R_COM_TIMEOUT",
              compteurId: item.compteurId,
              posteId: item.posteId,
              titre: `Perte de communication Modbus [${item.code}]`,
              description: `Aucune réponse sur le port 502 (${item.horodatageMesure}). Qualité requalifiée en ABSENTE.`,
              gravite: ruleTimeout.gravite,
              statut: "NOUVELLE",
              dateCreation: new Date().toISOString(),
              datePriseEnCharge: null,
              dateCloture: null,
              acquittePar: null,
              commentaire: null
            });
            alertsModified = true;
          }
        }
      } else if (item.qualite === "OK") {
        // Règle cos phi < 0.85
        const ruleCosPhi = rules.find(r => r.id === "R_COS_PHI");
        if (ruleCosPhi && ruleCosPhi.active && item.valeurs.COS_PHI < 0.85) {
          const alreadyOpen = existingAlerts.some(a => a.compteurId === item.compteurId && a.regleId === "R_COS_PHI" && a.statut !== "CLOTUREE");
          if (!alreadyOpen) {
            existingAlerts.unshift({
              id: "ALT_" + Date.now() + "_" + item.compteurId,
              regleId: "R_COS_PHI",
              compteurId: item.compteurId,
              posteId: item.posteId,
              titre: `Facteur de puissance dégradé (cos φ = ${item.valeurs.COS_PHI})`,
              description: `Le cos φ mesuré sur le compteur ${item.code} est tombé en dessous du seuil de 0.85.`,
              gravite: ruleCosPhi.gravite,
              statut: "NOUVELLE",
              dateCreation: new Date().toISOString(),
              datePriseEnCharge: null,
              dateCloture: null,
              acquittePar: null,
              commentaire: null
            });
            alertsModified = true;
          }
        }
      }
    }

    if (alertsModified) {
      Store.set("alerts", existingAlerts);
    }
  }

  subscribe(listenerFn) {
    this.listeners.add(listenerFn);
    return () => this.listeners.delete(listenerFn);
  }

  notifyListeners(batch) {
    for (const fn of this.listeners) {
      try {
        fn(batch);
      } catch (err) {
        console.error("Erreur dans listener de simulation :", err);
      }
    }
  }

  getLatestForMeter(meterId) {
    return this.latestTelemetry.get(meterId) || null;
  }

  getHistoryForMeter(meterId) {
    return this.telemetryHistory.get(meterId) || [];
  }
}

// Instance singleton
export const simEngine = new SimulationEngine();
