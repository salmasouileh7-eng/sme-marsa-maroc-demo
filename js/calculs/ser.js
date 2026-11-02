/**
 * ser.js - Moteur de la Situation Énergétique de Référence (SER)
 * Conforme à la norme ISO 50001 / ISO 50006 pour la modélisation des consommations de référence.
 */

import { Store } from "../storage/store.js";
import { AggregationEngine } from "./aggregations.js";

export class SERManager {
  /**
   * Calcule la consommation théorique de référence (Baseline) pour des variables d'activité données
   * Formule : E_ref = alpha * EVP + beta * Tonnes + gamma * TempExt + E0
   * @param {Object} serConfig Configuration SER
   * @param {number} evp Nombre de conteneurs EVP
   * @param {number} tonnes Tonnage vrac
   * @param {number} tempExtC Température extérieure moyenne
   * @returns {number} Consommation de référence théorique en kWh
   */
  static computeBaselineKWh(serConfig, evp, tonnes, tempExtC) {
    const c = serConfig.coefficients;
    const eTheorique = (c.alphaEVP * evp) + (c.betaTonnage * tonnes) + (c.gammaTemp * tempExtC) + c.baseFixeE0;
    return Math.round(eTheorique);
  }

  /**
   * Analyse comparative entre la consommation observée et la baseline SER
   * @param {Map} telemetryMap Télémétries instantanées
   * @param {Object} inputVars Variables opérationnelles du jour
   * @returns {Object} Bilan SER complet avec écart et CUSUM
   */
  static getSERComparison(telemetryMap, inputVars = null) {
    const serConfig = Store.get("ser", {});
    const vars = inputVars || {
      evp: 450,
      tonnes: 7200,
      tempExtC: 23.5
    };

    // Consommation théorique calculée d'après le modèle mathématique ISO 50006
    const consoTheoriqueKWh = this.computeBaselineKWh(serConfig, vars.evp, vars.tonnes, vars.tempExtC);

    // Consommation réelle mesurée (somme sur les 6 postes)
    const siteBilan = AggregationEngine.getSiteGlobalBilan(telemetryMap);
    // Simulation réaliste de la journée courante : proportionnelle à la charge instantanée
    const ratioCharge = siteBilan ? (siteBilan.puissanceSiteKW / 4500) : 0.65;
    const consoReelleKWh = Math.round(consoTheoriqueKWh * (0.92 + (ratioCharge * 0.12)));

    // Écart brut = Réel - Référence (une valeur négative indique une économie)
    const ecartKWh = consoReelleKWh - consoTheoriqueKWh;
    const ecartPourcent = Math.round(((consoReelleKWh - consoTheoriqueKWh) / consoTheoriqueKWh) * 1000) / 10;

    // Simulation de la courbe CUSUM sur les 7 derniers jours (somme cumulée des écarts)
    const cusumDays = [
      { jour: "J-6", evp: 380, tonnes: 6100, refKWh: 30500, reelKWh: 29800, delta: -700, cusum: -700 },
      { jour: "J-5", evp: 410, tonnes: 6900, refKWh: 32800, reelKWh: 32100, delta: -700, cusum: -1400 },
      { jour: "J-4", evp: 500, tonnes: 8200, refKWh: 37600, reelKWh: 38200, delta: +600, cusum: -800 },
      { jour: "J-3", evp: 440, tonnes: 7000, refKWh: 33700, reelKWh: 33400, delta: -300, cusum: -1100 },
      { jour: "J-2", evp: 390, tonnes: 6400, refKWh: 31200, reelKWh: 30700, delta: -500, cusum: -1600 },
      { jour: "J-1", evp: 460, tonnes: 7400, refKWh: 35000, reelKWh: 34200, delta: -800, cusum: -2400 },
      { jour: "Aujourd'hui", evp: vars.evp, tonnes: vars.tonnes, refKWh: consoTheoriqueKWh, reelKWh: consoReelleKWh, delta: ecartKWh, cusum: -2400 + ecartKWh }
    ];

    return {
      serId: serConfig.id,
      serNom: serConfig.nom,
      periodeReference: serConfig.periodeReference,
      r2Correlation: serConfig.r2Correlation,
      variablesDuJour: vars,
      consoTheoriqueKWh: consoTheoriqueKWh,
      consoReelleKWh: consoReelleKWh,
      ecartKWh: ecartKWh,
      ecartPourcent: ecartPourcent,
      performance: ecartKWh <= 0 ? "ECONOMIE" : "SURCONSOMMATION",
      cusumTotalKWh: cusumDays[cusumDays.length - 1].cusum,
      historiqueCusum: cusumDays,
      versions: serConfig.versions || [],
      remarque: "Méthode mathématique à valider avec la DEPA"
    };
  }

  /**
   * Enregistre une nouvelle révision de la SER avec traçabilité obligatoire
   */
  static addRevision(motif, newCoeffs) {
    const ser = Store.get("ser", {});
    const currentUser = Store.getCurrentUser();
    
    if (!ser.versions) ser.versions = [];
    const nextVersionNum = `v1.${ser.versions.length}`;
    
    ser.versions.push({
      version: nextVersionNum,
      date: new Date().toISOString().split("T")[0],
      motif: motif,
      auteur: `${currentUser.name} (${currentUser.role})`
    });

    if (newCoeffs) {
      ser.coefficients = { ...ser.coefficients, ...newCoeffs };
    }

    Store.set("ser", ser);
    Store.logAudit("REVISION_SER", ser.id, ser.versions[ser.versions.length - 2]?.version || "Initial", `${nextVersionNum} : ${motif}`);
    return ser;
  }
}
