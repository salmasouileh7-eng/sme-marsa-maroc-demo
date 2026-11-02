/**
 * faults.js - Injecteur d'anomalies et gestionnaire de rattrapage
 * Permet d'injecter des pannes en 1 clic pour la démonstration de supervision :
 * - Coupure de communication Modbus
 * - Valeur aberrante (pic irréaliste)
 * - Donnée manquante
 * - Donnée périmée (gelée)
 * - Rattrapage de buffer après reconnexion (démontre l'absence de doublons)
 */

import { Store } from "../storage/store.js";

export class FaultInjector {
  /**
   * Récupère la liste des défauts actifs
   */
  static getFaults() {
    const simConfig = Store.get("sim_config", {});
    return simConfig.defauts || {};
  }

  /**
   * Vérifie si un compteur a un défaut actif
   */
  static getFaultForMeter(meterId) {
    const faults = this.getFaults();
    return faults[meterId] || null;
  }

  /**
   * Active ou bascule un défaut sur un compteur
   * @param {string} meterId 
   * @param {'COMM_CUT' | 'ABERRANT' | 'MISSING' | 'STALE'} faultType 
   */
  static toggleFault(meterId, faultType) {
    const simConfig = Store.get("sim_config", {});
    if (!simConfig.defauts) simConfig.defauts = {};

    const currentFault = simConfig.defauts[meterId];
    let actionDesc = "";

    if (currentFault && currentFault.type === faultType) {
      delete simConfig.defauts[meterId];
      actionDesc = `Suppression du défaut [${faultType}]`;
    } else {
      simConfig.defauts[meterId] = {
        type: faultType,
        startTime: new Date().toISOString(),
        buffer: [] // Buffer local stockant les mesures manquées pour le test de rattrapage
      };
      actionDesc = `Injection du défaut [${faultType}]`;
    }

    Store.set("sim_config", simConfig);
    Store.logAudit("INJECTION_DEFAUT", meterId, currentFault ? currentFault.type : "AUCUN", faultType);
    return simConfig.defauts[meterId];
  }

  /**
   * Réinitialise tous les défauts
   */
  static clearAllFaults() {
    const simConfig = Store.get("sim_config", {});
    simConfig.defauts = {};
    Store.set("sim_config", simConfig);
    Store.logAudit("NETTOYAGE_DEFAUTS", "Tous compteurs", "Défauts actifs", "Aucun");
  }

  /**
   * Simule la vidange du buffer d'un compteur après rétablissement de la com
   * Réintègre les mesures enregistrées localement sans aucun doublon d'horodatage
   */
  static replayBufferWithoutDuplicates(meterId, existingHistory) {
    const simConfig = Store.get("sim_config", {});
    const fault = simConfig.defauts ? simConfig.defauts[meterId] : null;

    if (!fault || !fault.buffer || fault.buffer.length === 0) {
      return { replayedCount: 0, duplicatesBlocked: 0 };
    }

    const existingTimestamps = new Set(existingHistory.map(m => m.horodatageMesure));
    let replayedCount = 0;
    let duplicatesBlocked = 0;

    for (const bufferedItem of fault.buffer) {
      if (existingTimestamps.has(bufferedItem.horodatageMesure)) {
        duplicatesBlocked++;
      } else {
        existingHistory.push(bufferedItem);
        existingTimestamps.add(bufferedItem.horodatageMesure);
        replayedCount++;
      }
    }

    // Vider le buffer
    fault.buffer = [];
    Store.set("sim_config", simConfig);

    Store.logAudit("RATTRAPAGE_BUFFER", meterId, "-", `${replayedCount} points réintégrés, ${duplicatesBlocked} doublons bloqués`);
    return { replayedCount, duplicatesBlocked };
  }
}
