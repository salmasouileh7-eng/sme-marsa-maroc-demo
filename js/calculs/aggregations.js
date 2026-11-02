/**
 * aggregations.js - Moteur d'agrégation hiérarchique avec filtre anti-double comptage certifié
 * Règle métier : Ne jamais additionner les compteurs généraux (Arrivées Transfo)
 * et les sous-compteurs divisionnaires (Départs outillage / existants SCADA)
 * dans le bilan énergétique global d'un poste ou du site.
 */

import { Store } from "../storage/store.js";

export class AggregationEngine {
  /**
   * Calcule le bilan instantané d'un poste électrique donné
   * @param {string} posteId 
   * @param {Map} telemetryMap Dictionnaire des dernières mesures { meterId -> telemetryPoint }
   * @returns {Object}
   */
  static getPosteBilan(posteId, telemetryMap) {
    const site = Store.get("site", {});
    const poste = site.postes ? site.postes.find(p => p.id === posteId) : null;
    if (!poste) return null;

    let puissanceActiveTotaleKW = 0;
    let puissanceReactiveTotaleKvar = 0;
    let energieActiveTotaleKWh = 0;
    let cosPhiMoyenPondere = 0;
    let compteursEnDefaut = 0;
    let totalCompteursPoste = 0;
    let lastContactTime = null;

    const arrivesMeters = [];
    const departuresMeters = [];

    // Parcourir les tableaux et départs
    if (poste.tableaux) {
      for (const t of poste.tableaux) {
        for (const dep of t.departs) {
          totalCompteursPoste++;
          const telem = telemetryMap ? telemetryMap.get(dep.compteurId) : null;

          if (!telem || telem.qualite === "ABSENTE") {
            compteursEnDefaut++;
          }

          if (telem && telem.horodatageMesure) {
            if (!lastContactTime || new Date(telem.horodatageMesure) > new Date(lastContactTime)) {
              lastContactTime = telem.horodatageMesure;
            }
          }

          if (dep.type === "ARRIVEE") {
            arrivesMeters.push({ dep, telem });
          } else {
            departuresMeters.push({ dep, telem });
          }
        }
      }
    }

    // CONTRÔLE ANTI-DOUBLE COMPTAGE :
    // Pour le bilan officiel du poste, on prend STRICTEMENT la somme des arrivées transfo
    let sommationArriveesKW = 0;
    let sommationDepartsKW = 0;

    for (const item of arrivesMeters) {
      if (item.telem && item.telem.qualite === "OK") {
        sommationArriveesKW += (item.telem.valeurs.P_ACTIVE || 0);
        puissanceReactiveTotaleKvar += (item.telem.valeurs.P_REACTIVE || 0);
        energieActiveTotaleKWh += (item.telem.valeurs.EA_IMPORT || 0);
        cosPhiMoyenPondere = item.telem.valeurs.COS_PHI || 0.92;
      }
    }

    for (const item of departuresMeters) {
      if (item.telem && item.telem.qualite === "OK") {
        sommationDepartsKW += (item.telem.valeurs.P_ACTIVE || 0);
      }
    }

    // Le bilan officiel est uniquement les arrivées pour éviter de compter 2 fois l'énergie
    puissanceActiveTotaleKW = sommationArriveesKW;

    // Détermination de l'état SCADA du poste
    let status = "OK";
    if (compteursEnDefaut > 0) {
      status = compteursEnDefaut === totalCompteursPoste ? "DANGER" : "WARNING";
    } else if (puissanceActiveTotaleKW > (poste.puissanceSouscriteKVA * 0.95)) {
      status = "DANGER"; // Surcharge
    } else if (cosPhiMoyenPondere < 0.85) {
      status = "WARNING"; // Cos phi dégradé
    }

    return {
      posteId: poste.id,
      posteNom: poste.nom,
      puissanceActiveKW: Math.round(puissanceActiveTotaleKW * 10) / 10,
      puissanceReactiveKvar: Math.round(puissanceReactiveTotaleKvar * 10) / 10,
      energieActiveKWh: Math.round(energieActiveTotaleKWh * 10) / 10,
      puissanceSouscriteKVA: poste.puissanceSouscriteKVA,
      tauxChargePourcent: Math.round((puissanceActiveTotaleKW / poste.puissanceSouscriteKVA) * 100),
      cosPhiMoyen: cosPhiMoyenPondere,
      compteursTotal: totalCompteursPoste,
      compteursEnDefaut: compteursEnDefaut,
      statut: status,
      dernierContact: lastContactTime,
      // Données de vérification de l'anti-double comptage
      verificationAntiDoubleComptage: {
        totalArriveesKW: Math.round(sommationArriveesKW * 10) / 10,
        totalSousComptageDepartsKW: Math.round(sommationDepartsKW * 10) / 10,
        ecartNonDistribueKW: Math.round((sommationArriveesKW - sommationDepartsKW) * 10) / 10,
        doubleComptageEvite: true,
        regleAppliquee: "Somme exclusive des arrivées MT/BT (les départs analytiques sont isolés)"
      }
    };
  }

  /**
   * Calcule le bilan global du Site Port d'Agadir
   */
  static getSiteGlobalBilan(telemetryMap) {
    const site = Store.get("site", {});
    if (!site || !site.postes) return null;

    let puissanceSiteKW = 0;
    let puissanceReactiveSiteKvar = 0;
    let energieSiteKWh = 0;
    let totalCompteursSite = 0;
    let compteursEnLigne = 0;
    let postesEnAlerte = 0;

    const bilansPostes = [];

    for (const p of site.postes) {
      const bilanP = this.getPosteBilan(p.id, telemetryMap);
      if (bilanP) {
        bilansPostes.push(bilanP);
        puissanceSiteKW += bilanP.puissanceActiveKW;
        puissanceReactiveSiteKvar += bilanP.puissanceReactiveKvar;
        energieSiteKWh += bilanP.energieActiveKWh;
        totalCompteursSite += bilanP.compteursTotal;
        compteursEnLigne += (bilanP.compteursTotal - bilanP.compteursEnDefaut);
        if (bilanP.statut !== "OK") postesEnAlerte++;
      }
    }

    const cosPhiGlobal = puissanceSiteKW > 0 
      ? Math.cos(Math.atan(puissanceReactiveSiteKvar / puissanceSiteKW))
      : 0.92;

    const tauxComModbus = totalCompteursSite > 0 
      ? Math.round((compteursEnLigne / totalCompteursSite) * 100) 
      : 100;

    return {
      puissanceSiteKW: Math.round(puissanceSiteKW * 10) / 10,
      puissanceReactiveSiteKvar: Math.round(puissanceReactiveSiteKvar * 10) / 10,
      energieSiteMWh: Math.round((energieSiteKWh / 1000) * 100) / 100,
      cosPhiGlobal: Math.round(cosPhiGlobal * 1000) / 1000,
      tauxComModbus: tauxComModbus,
      totalCompteurs: totalCompteursSite,
      compteursEnLigne: compteursEnLigne,
      postesEnAlerte: postesEnAlerte,
      bilansPostes: bilansPostes
    };
  }
}
