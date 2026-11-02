/**
 * reportGenerator.js - Générateur de bilans, rapports énergétiques et exports
 * Permet l'export de fichiers CSV exploitables sous Excel et l'impression PDF via CSS dédié.
 */

import { Store } from "../storage/store.js";
import { AggregationEngine } from "../calculs/aggregations.js";
import { IPEManager } from "../calculs/ipe.js";
import { SERManager } from "../calculs/ser.js";

export class ReportGenerator {
  /**
   * Génère les données consolidées d'un rapport pour une période donnée
   */
  static generateReportData(typeRapport, periode, telemetryMap) {
    const siteBilan = AggregationEngine.getSiteGlobalBilan(telemetryMap);
    const ipes = Store.get("ipes", []);
    const ipesEvaluated = ipes.map(i => IPEManager.evaluateIPE(i, telemetryMap));
    const serBilan = SERManager.getSERComparison(telemetryMap);
    const currentUser = Store.getCurrentUser();

    return {
      referenceAO: "Marsa Maroc — Appel d'Offres n° 12/DEPA/2026",
      titre: `Rapport Énergétique : ${typeRapport}`,
      periode: periode,
      dateGeneration: new Date().toLocaleString("fr-FR"),
      editePar: `${currentUser.name} (${currentUser.role})`,
      site: siteBilan,
      ipes: ipesEvaluated,
      ser: serBilan
    };
  }

  /**
   * Génère et télécharge un fichier CSV dans le navigateur
   */
  static exportCSV(reportData) {
    let csvContent = "\uFEFF"; // BOM UTF-8 pour ouverture correcte dans Microsoft Excel
    csvContent += "MARSA MAROC - DIRECTION DE L'EXPLOITATION AU PORT D'AGADIR\r\n";
    csvContent += `SYSTÈME DE MONITORING ÉNERGÉTIQUE (SME) - AO N° 12/DEPA/2026\r\n`;
    csvContent += `Rapport:;${reportData.titre}\r\n`;
    csvContent += `Période:;${reportData.periode}\r\n`;
    csvContent += `Date d'édition:;${reportData.dateGeneration}\r\n`;
    csvContent += `Opérateur:;${reportData.editePar}\r\n\r\n`;

    // 1. Synthèse des Postes Électriques
    csvContent += "SYNTHÈSE DES POSTES ÉLECTRIQUES\r\n";
    csvContent += "Identifiant;Nom du Poste;Puissance Souscrite (kVA);Puissance Active (kW);Taux de Charge (%);Cos Phi;Statut SCADA\r\n";

    if (reportData.site && reportData.site.bilansPostes) {
      for (const p of reportData.site.bilansPostes) {
        csvContent += `${p.posteId};${p.posteNom};${p.puissanceSouscriteKVA};${p.puissanceActiveKW.toFixed(1).replace(".", ",")};${p.tauxChargePourcent}%;${p.cosPhiMoyen.toFixed(3).replace(".", ",")};${p.statut}\r\n`;
      }
    }

    csvContent += "\r\n";

    // 2. Indicateurs IPE (ISO 50001)
    csvContent += "INDICATEURS DE PERFORMANCE ÉNERGÉTIQUE (ISO 50001)\r\n";
    csvContent += "Code;Nom de l'IPE;Valeur Observée;Unité;Cible ISO;Écart (%);Statut\r\n";
    for (const ipe of reportData.ipes) {
      csvContent += `${ipe.code};${ipe.nom};${ipe.valeur !== null ? ipe.valeur.toFixed(2).replace(".", ",") : "N/A"};${ipe.unite};${ipe.cibleISO.toFixed(2).replace(".", ",")};${ipe.ecartPourcentCible}%;${ipe.statut}\r\n`;
    }

    csvContent += "\r\n";

    // 3. Situation Énergétique de Référence (SER)
    csvContent += "SITUATION ÉNERGÉTIQUE DE RÉFÉRENCE (BASELINE)\r\n";
    csvContent += `Consommation Référence (kWh);${reportData.ser.consoTheoriqueKWh}\r\n`;
    csvContent += `Consommation Réelle Mesurée (kWh);${reportData.ser.consoReelleKWh}\r\n`;
    csvContent += `Écart Net (kWh);${reportData.ser.ecartKWh}\r\n`;
    csvContent += `Écart Relatif (%);${reportData.ser.ecartPourcent}%\r\n`;
    csvContent += `Performance;${reportData.ser.performance}\r\n`;

    // Déclenchement du téléchargement
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `SME_MarsaMaroc_Rapport_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Store.logAudit("EXPORT_RAPPORT_CSV", reportData.titre, "-", filename);
  }

  /**
   * Ouvre la boîte d'impression du navigateur configurée avec le style print.css
   */
  static triggerPrint() {
    Store.logAudit("IMPRESSION_RAPPORT_PDF", "Fenêtre d'impression", "-", "Génération PDF A4 lancée");
    window.print();
  }
}
