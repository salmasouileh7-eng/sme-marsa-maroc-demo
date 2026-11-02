/**
 * view-reporting.js - Centre d'édition de rapports, exports CSV et impression PDF
 * Conforme aux exigences de restitution pour les comités d'énergie Marsa Maroc.
 */

import { Store } from "../storage/store.js";
import { ReportGenerator } from "../rapports/reportGenerator.js";
import { simEngine } from "../simulation/engine.js";

export class ReportingView {
  static render(container) {
    this.container = container;
    this.reportType = "Synthèse Globale & Bilan Énergétique";
    this.periode = "Période Mensuelle en cours (Novembre 2026)";

    container.innerHTML = `
      <!-- EN-TÊTE SPÉCIFIQUE IMPRESSION PDF (Masqué à l'écran, actif à l'impression) -->
      <div class="print-only-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="print-title">MARSA MAROC — PORT D'AGADIR</div>
            <div class="print-subtitle">Direction de l'Exploitation (DEPA) — Système de Monitoring Énergétique (SME)</div>
          </div>
          <div style="text-align: right; font-size: 10pt;">
            <strong>Appel d'Offres n° 12/DEPA/2026</strong><br>
            ISO 50001 — Management de l'Énergie
          </div>
        </div>
      </div>

      <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h2 class="page-title">Édition des Rapports & Bilans Énergétiques</h2>
          <p class="page-subtitle">Génération des rapports dans le navigateur, exports tableur CSV et impression PDF A4</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btn-export-csv">📥 Exporter CSV (Excel)</button>
          <button class="btn btn-primary" id="btn-print-pdf">🖨️ Imprimer / Exporter PDF</button>
        </div>
      </div>

      <!-- FILTRES DE RAPPORT -->
      <div class="card no-print" style="margin-bottom: 20px;">
        <div class="grid-3">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Type de Rapport :</label>
            <select id="report-type-select" class="form-select">
              <option value="Synthèse Globale & Bilan Énergétique">Synthèse Globale & Bilan Énergétique</option>
              <option value="Suivi des IPE & Performance ISO 50001">Suivi des IPE & Performance ISO 50001</option>
              <option value="Comparaison SER & Baseline Référence">Comparaison SER & Baseline Référence</option>
              <option value="Audit Qualité & Complétude des Mesures">Audit Qualité & Complétude des Mesures</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Période d'Échantillonnage :</label>
            <select id="report-period-select" class="form-select">
              <option value="Journée Opérationnelle en Cours">Journée Opérationnelle en Cours</option>
              <option value="7 Derniers Jours Glissants">7 Derniers Jours Glissants</option>
              <option value="Période Mensuelle en cours (Novembre 2026)" selected>Période Mensuelle en cours (Novembre 2026)</option>
              <option value="Bilan Annuel Consolidé 2026">Bilan Annuel Consolidé 2026</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Périmètre d'Agrégation :</label>
            <select id="report-scope-select" class="form-select">
              <option value="SITE_GLOBAL">Ensemble du Port d'Agadir (6 Postes)</option>
              <option value="P1">Poste 1 — Quai Nord</option>
              <option value="P2">Poste 2 — Quai Sud</option>
              <option value="P3">Poste 3 — Ro-Ro</option>
              <option value="P4">Poste 4 — Ateliers</option>
              <option value="P5">Poste 5 — Conteneurs</option>
              <option value="P6">Poste 6 — Administration</option>
            </select>
          </div>
        </div>
      </div>

      <!-- VISUALISATION DU RAPPORT FORMATÉ -->
      <div class="card" id="report-content-card">
        <!-- Rempli dynamiquement -->
      </div>

      <!-- BLOC SIGNATURES OFFICIELLES (Actif en mode print/PDF) -->
      <div class="print-signature-box">
        <div class="signature-block">
          <strong>Le Responsable Énergie (ISO 50001)</strong><br><br><br>
          Fatima ZAHRA BENANI<br>
          <em>Visa & Date</em>
        </div>
        <div class="signature-block">
          <strong>La Direction d'Exploitation (DEPA)</strong><br><br><br>
          Marsa Maroc — Port d'Agadir<br>
          <em>Visa pour approbation</em>
        </div>
      </div>
    `;

    document.getElementById("report-type-select")?.addEventListener("change", (e) => {
      this.reportType = e.target.value;
      this.updateReportPreview();
    });

    document.getElementById("report-period-select")?.addEventListener("change", (e) => {
      this.periode = e.target.value;
      this.updateReportPreview();
    });

    document.getElementById("btn-export-csv")?.addEventListener("click", () => {
      const data = ReportGenerator.generateReportData(this.reportType, this.periode, simEngine.latestTelemetry);
      ReportGenerator.exportCSV(data);
    });

    document.getElementById("btn-print-pdf")?.addEventListener("click", () => {
      ReportGenerator.triggerPrint();
    });

    this.updateReportPreview();
  }

  static updateReportPreview() {
    const reportData = ReportGenerator.generateReportData(this.reportType, this.periode, simEngine.latestTelemetry);
    const container = document.getElementById("report-content-card");
    if (!container) return;

    container.innerHTML = `
      <div style="border-bottom: 2px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--color-primary);">${reportData.titre}</h3>
        <div style="font-size: 12px; color: var(--text-secondary); display: flex; justify-content: space-between; flex-wrap: wrap; margin-top: 4px;">
          <span>Période : <strong>${reportData.periode}</strong></span>
          <span>Date d'édition : <strong>${reportData.dateGeneration}</strong></span>
          <span>Édité par : <strong>${reportData.editePar}</strong></span>
        </div>
      </div>

      <!-- TABLEAU 1 : BILAN POSTES -->
      <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">1. Bilan Énergétique des Postes Électriques MT/BT</h4>
      <div class="data-table-container" style="margin-bottom: 20px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Identifiant</th>
              <th>Nom du Poste</th>
              <th>Puissance Souscrite</th>
              <th>Puissance Active</th>
              <th>Énergie Active</th>
              <th>Taux Charge</th>
              <th>cos φ Moyen</th>
              <th>Statut Réseau</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData.site?.bilansPostes || []).map(p => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700;">${p.posteId}</td>
                <td><strong>${p.posteNom}</strong></td>
                <td>${p.puissanceSouscriteKVA} kVA</td>
                <td style="font-family: var(--font-mono); font-weight: 700;">${p.puissanceActiveKW.toLocaleString("fr-FR")} kW</td>
                <td style="font-family: var(--font-mono);">${p.energieActiveKWh.toLocaleString("fr-FR")} kWh</td>
                <td>${p.tauxChargePourcent} %</td>
                <td style="font-family: var(--font-mono);">${p.cosPhiMoyen.toFixed(3)}</td>
                <td><span class="status-pill status-ok">${p.statut}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- TABLEAU 2 : INDICATEURS IPE -->
      <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">2. Indicateurs de Performance Énergétique (ISO 50001)</h4>
      <div class="data-table-container" style="margin-bottom: 20px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation de l'IPE</th>
              <th>Périmètre</th>
              <th>Valeur Mesurée</th>
              <th>Cible ISO 50001</th>
              <th>Écart Relatif</th>
              <th>Conformité</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.ipes.map(i => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700;">${i.code}</td>
                <td><strong>${i.nom}</strong></td>
                <td>${i.ipeId === 'IPE_01' ? 'Poste 5' : i.ipeId === 'IPE_02' ? 'Postes 1 & 2' : 'Site Global'}</td>
                <td style="font-family: var(--font-mono); font-weight: 700;">${i.valeur !== null ? i.valeur.toFixed(2) : 'N/A'} ${i.unite}</td>
                <td style="font-family: var(--font-mono);">${i.cibleISO} ${i.unite}</td>
                <td style="font-family: var(--font-mono); font-weight: 700; color: ${i.ecartPourcentCible > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
                  ${i.ecartPourcentCible > 0 ? '+' : ''}${i.ecartPourcentCible}%
                </td>
                <td><span class="status-pill ${i.estConforme ? 'status-ok' : 'status-danger'}">${i.statut}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- TABLEAU 3 : SER -->
      <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">3. Situation Énergétique de Référence (SER vs Conso Réelle)</h4>
      <div style="background: var(--bg-main); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Consommation Référence (Baseline)</span>
          <div style="font-size: 16px; font-weight: 800; font-family: var(--font-mono);">${reportData.ser.consoTheoriqueKWh.toLocaleString("fr-FR")} kWh</div>
        </div>
        <div>
          <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Consommation Observée</span>
          <div style="font-size: 16px; font-weight: 800; font-family: var(--font-mono);">${reportData.ser.consoReelleKWh.toLocaleString("fr-FR")} kWh</div>
        </div>
        <div>
          <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Écart Net & Tendance</span>
          <div style="font-size: 16px; font-weight: 800; font-family: var(--font-mono); color: ${reportData.ser.ecartKWh <= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
            ${reportData.ser.ecartKWh > 0 ? '+' : ''}${reportData.ser.ecartKWh.toLocaleString("fr-FR")} kWh (${reportData.ser.performance})
          </div>
        </div>
      </div>
    `;
  }

  static destroy() {}
}
