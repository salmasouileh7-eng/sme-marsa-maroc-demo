/**
 * profiles.js - Profils de charge électriques portuaires 24h
 * Simule l'activité du Port d'Agadir selon les cycles opérationnels réels :
 * - Escales navires et grues (manutention de 08h à 18h et shift de nuit)
 * - Racks frigorifiques conteneurs reefers (cycle thermodynamique)
 * - Bureaux et administration (heures ouvrées)
 * - Talon de veille nocturne
 */

export class LoadProfiles {
  /**
   * Retourne le facteur de charge (0.1 à 1.0) en fonction de l'heure et du type d'usage
   * @param {Date} date 
   * @param {string} usageType 
   * @returns {number} multiplicateur de charge de base
   */
  static getBaseLoadFactor(date, usageType) {
    const hours = date.getHours() + date.getMinutes() / 60;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    switch (usageType) {
      case "PORTIQUE":
      case "OUTILLAGE":
        // Forte activité en journée (08h - 12h et 14h - 19h), activité réduite la nuit
        if (hours >= 8 && hours < 12) return 0.75 + Math.sin((hours - 8) * Math.PI / 4) * 0.2;
        if (hours >= 12 && hours < 14) return 0.45; // Pause méridienne équipes quai
        if (hours >= 14 && hours < 19) return 0.85 + Math.sin((hours - 14) * Math.PI / 5) * 0.12;
        if (hours >= 19 && hours < 23) return 0.40; // Shift léger
        return 0.15; // Nuit

      case "REEFERS":
        // Conteneurs frigos : charge constante avec modulation selon température ambiante
        const tempModulation = Math.sin((hours - 6) * Math.PI / 12) * 0.15; // Plus chaud l'après-midi
        return 0.65 + tempModulation;

      case "TRACTION":
      case "BRANCHEMENT":
        // Ro-Ro et branchement navires : pics aux arrivées des ferries/rouliers (07h-10h et 17h-21h)
        if ((hours >= 7 && hours <= 10) || (hours >= 17 && hours <= 21)) return 0.80;
        return 0.25;

      case "ATELIER":
      case "COMPRESSEUR":
        if (isWeekend) return 0.10;
        if (hours >= 7.5 && hours <= 17.5) return 0.65;
        return 0.08;

      case "HVAC":
      case "DATA_CENTER":
        if (usageType === "DATA_CENTER") return 0.85; // Charge quasi-constante
        if (hours >= 8 && hours <= 18 && !isWeekend) return 0.70;
        return 0.20;

      case "ECLAIRAGE":
      case "SERVICES":
        // Allumé la nuit (19h à 07h)
        if (hours >= 19 || hours < 7) return 0.85;
        return 0.10;

      case "ARRIVEE":
      default:
        // Profil global mixe portuaire
        if (hours >= 8 && hours < 18) return 0.70;
        if (hours >= 18 && hours < 22) return 0.50;
        return 0.28;
    }
  }

  /**
   * Ajoute un bruit gaussien maîtrisé
   */
  static addNoise(val, amplitudePercent = 0.04) {
    const u1 = Math.random() || 0.001;
    const u2 = Math.random() || 0.001;
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return Math.max(0, val * (1 + randStdNormal * amplitudePercent));
  }
}
