/**
 * metrologie.js - Fonctions métrologiques, conversions d'unités et contrôle des échelles
 * Conforme aux normes CEI 62053-22 (Classe 0.5S) et CEI 62053-21 (Classe 1).
 */

export class MetrologyEngine {
  /**
   * Convertit une puissance en Watt vers kW ou MW avec arrondi
   */
  static formatPower(valInKW) {
    if (valInKW >= 1000) {
      return { val: (valInKW / 1000).toFixed(2), unit: "MW" };
    }
    return { val: valInKW.toFixed(1), unit: "kW" };
  }

  /**
   * Convertit une énergie en kWh vers MWh ou GWh
   */
  static formatEnergy(valInKWh) {
    if (valInKWh >= 1000000) {
      return { val: (valInKWh / 1000000).toFixed(3), unit: "GWh" };
    }
    if (valInKWh >= 1000) {
      return { val: (valInKWh / 1000).toFixed(2), unit: "MWh" };
    }
    return { val: valInKWh.toFixed(1), unit: "kWh" };
  }

  /**
   * Applique le ratio des transformateurs de mesure (TC et TT)
   * @param {number} rawSecondaryValue Valeur mesurée au secondaire (ex: 5A ou 100V)
   * @param {number} tcRatio Ratio transformateur de courant (ex: 400 / 5 = 80)
   * @param {number} ttRatio Ratio transformateur de tension (ex: 22000 / 100 = 220)
   */
  static scaleWithTransformers(rawSecondaryValue, tcRatio = 1, ttRatio = 1) {
    return rawSecondaryValue * tcRatio * ttRatio;
  }

  /**
   * Vérifie la conformité de la classe de précision d'un équipement
   * @param {'0.2S' | '0.5S' | '1' | '2'} classe 
   * @param {string} typeUsage 
   * @returns {Object} Statut de conformité
   */
  static checkPrecisionCompliance(classe, typeUsage) {
    if (typeUsage === "ARRIVEE") {
      // Pour une arrivée générale MT, la classe 0.5S ou 0.2S est requise
      const isConform = classe === "0.2S" || classe === "0.5S";
      return {
        conforme: isConform,
        norme: "CEI 62053-22",
        exigence: "Classe 0.5S obligatoire en tête de poste MT (facturation contradictoire / ISO 50001)",
        remarque: isConform ? "Conforme aux spécifications du cahier des charges" : "Non conforme : Précision insuffisante pour tête de poste"
      };
    } else {
      // Pour un départ divisionnaire, la classe 1 est acceptée
      const isConform = classe === "0.2S" || classe === "0.5S" || classe === "1";
      return {
        conforme: isConform,
        norme: "CEI 62053-21",
        exigence: "Classe 1 acceptée pour sous-comptage analytique des départs",
        remarque: isConform ? "Conforme au sous-comptage divisionnaire" : "Classe 2 insuffisante"
      };
    }
  }

  /**
   * Calcule le délai écoulé en secondes depuis un horodatage
   */
  static getFreshness(timestampISO) {
    if (!timestampISO) return { seconds: 999999, label: "Jamais", state: "STALE" };
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(timestampISO).getTime()) / 1000));
    
    if (diffSec <= 15) {
      return { seconds: diffSec, label: `Il y a ${diffSec}s`, state: "FRESH" };
    } else if (diffSec <= 60) {
      return { seconds: diffSec, label: `Il y a ${diffSec}s`, state: "WARNING" };
    } else {
      const min = Math.floor(diffSec / 60);
      return { seconds: diffSec, label: `Il y a ${min} min`, state: "STALE" };
    }
  }
}
