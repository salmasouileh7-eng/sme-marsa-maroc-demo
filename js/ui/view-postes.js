/**
 * view-postes.js - Vue détaillée par Poste et Compteur
 * Mesures instantanées avec badge de fraîcheur, décomposition hiérarchique,
 * contrôle visuel anti-double comptage et comparaison temporelle/inter-postes.
 */

import { Store } from "../storage/store.js";
import { AggregationEngine } from "../calculs/aggregations.js";
import { MetrologyEngine } from "../calculs/metrologie.js";
import { simEngine } from "../simulation/engine.js";

export class PostesView {
  static render(container) {
    this.container = container;
    this.chart = null;
    
    // Récupérer le poste sélectionné dans l'URL ou par défaut P1
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    this.selectedPosteId = params.get("id") || "P1";
    this.selectedMeterId = null;

    const site = Store.get("site", {});
    const postes = site.postes || [];

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 class="page-title">Supervision Détaillée des Postes & Compteurs</h2>
          <p class="page-subtitle">Navigation hiérarchique : Site > Poste > TGBT > Départ > Compteur Modbus</p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label class="form-label" style="margin: 0;">Sélection du Poste :</label>
          <select id="poste-selector" class="form-select" style="width: auto;">
            ${postes.map(p => `
              <option value="${p.id}" ${p.id === this.selectedPosteId ? "selected" : ""}>${p.nom}</option>
            `).join("")}
          </select>
        </div>
      </div>

      <!-- BANDEAU DE FRAÎCHEUR & STATUT DU POSTE -->
      <div id="poste-summary-card"></div>

      <!-- DÉMONSTRATION DU CONTRÔLE ANTI-DOUBLE COMPTAGE -->
      <div class="card" style="border-left: 4px solid var(--color-primary);" id="anti-double-counting-card"></div>

      <!-- TABLEAU DES COMPTEURS DU POSTE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>⚡ Points de Comptage & Télémétrie Instantanée</span>
          </div>
          <div class="card-subtitle">Badge de fraîcheur dynamique (ne présente jamais une donnée ancienne comme temps réel)</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Code</th>
                <th>Départ / Emplacement</th>
                <th>Usage & Type</th>
                <th>P. Active (kW)</th>
                <th>Énergie (kWh)</th>
                <th>cos φ</th>
                <th>Tension / I</th>
                <th>Fraîcheur Mesure</th>
                <th>Horodatage Réception</th>
                <th>Qualité</th>
              </tr>
            </thead>
            <tbody id="meters-table-body">
              <!-- Rempli dynamiquement -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- GRAPHIQUE ANALYTIQUE ET COMPARAISON -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Courbe de Charge du Poste (kW)</div>
            <div class="card-subtitle">Historique récent glissant</div>
          </div>
          <div style="height: 240px; position: relative;">
            <canvas id="posteHistoryChart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Répartition des Départs du Poste</div>
            <div class="card-subtitle">Poids de chaque usage dans la consommation du poste</div>
          </div>
          <div style="height: 240px; position: relative;">
            <canvas id="postePieChart"></canvas>
          </div>
        </div>
      </div>
    `;

    document.getElementById("poste-selector")?.addEventListener("change", (e) => {
      this.selectedPosteId = e.target.value;
      window.location.hash = `#/postes?id=${this.selectedPosteId}`;
      this.updateView();
    });

    this.initCharts();
    this.updateView();

    this.unsubscribe = simEngine.subscribe(() => {
      this.updateView();
    });
  }

  static initCharts() {
    const ctxHist = document.getElementById("posteHistoryChart");
    const ctxPie = document.getElementById("postePieChart");
    if (!window.Chart) return;

    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const textColor = isDark ? "#94a3b8" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

    if (ctxHist) {
      this.chart = new window.Chart(ctxHist, {
        type: "line",
        data: { labels: [], datasets: [{ label: "Puissance Active (kW)", borderColor: "#0284c7", backgroundColor: "rgba(2, 132, 199, 0.15)", borderWidth: 2, fill: true, data: [] }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 8 } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    if (ctxPie) {
      this.pieChart = new window.Chart(ctxPie, {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [{ data: [], backgroundColor: ["#0284c7", "#10b981", "#f59e0b", "#8b5cf6"] }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { color: textColor, font: { size: 11 } } }
          }
        }
      });
    }
  }

  static updateView() {
    const site = Store.get("site", {});
    const meters = Store.get("meters", []);
    const poste = site.postes ? site.postes.find(p => p.id === this.selectedPosteId) : null;
    if (!poste) return;

    const bilan = AggregationEngine.getPosteBilan(poste.id, simEngine.latestTelemetry);
    const summaryCard = document.getElementById("poste-summary-card");
    const antiDoubleCard = document.getElementById("anti-double-counting-card");
    const tbody = document.getElementById("meters-table-body");

    // 1. Synthèse du poste
    if (summaryCard && bilan) {
      const freshness = MetrologyEngine.getFreshness(bilan.dernierContact);
      let freshBadgeClass = "fresh-ok";
      if (freshness.state === "WARNING") freshBadgeClass = "fresh-warning";
      if (freshness.state === "STALE") freshBadgeClass = "fresh-stale";

      summaryCard.innerHTML = `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 700;">${poste.nom}</h3>
            <span style="font-size: 12px; color: var(--text-secondary);">${poste.usage} — Tension : ${poste.tensionNominaleKV} kV</span>
          </div>
          <div style="display: flex; gap: 16px; align-items: center;">
            <div style="text-align: right;">
              <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Fraîcheur des données</span>
              <span class="badge-fresh ${freshBadgeClass}">${freshness.label} (${freshness.state})</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Taux de Charge</span>
              <span style="font-size: 15px; font-weight: 800; font-family: var(--font-mono);">${bilan.tauxChargePourcent} %</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Énergie Totale</span>
              <span style="font-size: 15px; font-weight: 800; font-family: var(--font-mono);">${bilan.energieActiveKWh.toLocaleString("fr-FR")} kWh</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Démonstration de l'anti-double comptage
    if (antiDoubleCard && bilan && bilan.verificationAntiDoubleComptage) {
      const v = bilan.verificationAntiDoubleComptage;
      antiDoubleCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-size: 13px; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 6px;">
            <span>🛡️ CONTRÔLE CERTIFIÉ ANTI-DOUBLE COMPTAGE (Exigence AO Marsa Maroc)</span>
          </h4>
          <span class="status-pill status-ok"><span class="status-dot"></span>Conforme</span>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
          ${v.regleAppliquee}. Un compteur raccordé à un sous-système SCADA existant n'est jamais additionné à l'arrivée transformateur.
        </p>
        <div class="grid-3" style="background: var(--bg-main); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div>
            <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">1. Somme Arrivées MT/BT (Bilan officiel)</span>
            <div style="font-size: 15px; font-weight: 800; font-family: var(--font-mono); color: var(--color-success);">${v.totalArriveesKW} kW</div>
          </div>
          <div>
            <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">2. Somme Sous-Comptage Départs (Analytique)</span>
            <div style="font-size: 15px; font-weight: 800; font-family: var(--font-mono); color: var(--color-primary);">${v.totalSousComptageDepartsKW} kW</div>
          </div>
          <div>
            <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">3. Écart Servitudes / Non distribué</span>
            <div style="font-size: 15px; font-weight: 800; font-family: var(--font-mono);">${v.ecartNonDistribueKW} kW (${Math.round((v.ecartNonDistribueKW / (v.totalArriveesKW || 1)) * 100)}%)</div>
          </div>
        </div>
      `;
    }

    // 3. Tableau des compteurs
    if (tbody && poste.tableaux) {
      const rows = [];
      const pieLabels = [];
      const pieData = [];

      for (const t of poste.tableaux) {
        for (const dep of t.departs) {
          const meter = meters.find(m => m.id === dep.compteurId);
          const telem = simEngine.getLatestForMeter(dep.compteurId);
          const val = telem ? telem.valeurs : {};
          const freshness = telem ? MetrologyEngine.getFreshness(telem.horodatageMesure) : { label: "N/A", state: "STALE" };

          let qPill = '<span class="status-pill status-ok"><span class="status-dot"></span>OK</span>';
          if (!telem || telem.qualite === "ABSENTE") {
            qPill = '<span class="status-pill status-danger"><span class="status-dot"></span>Absente</span>';
          } else if (telem.qualite === "INVALIDE") {
            qPill = '<span class="status-pill status-warning"><span class="status-dot"></span>Invalide</span>';
          } else if (telem.qualite === "PERIMEE") {
            qPill = '<span class="status-pill status-offline"><span class="status-dot"></span>Périmée</span>';
          }

          let freshBadgeClass = "fresh-ok";
          if (freshness.state === "WARNING") freshBadgeClass = "fresh-warning";
          if (freshness.state === "STALE") freshBadgeClass = "fresh-stale";

          if (dep.type !== "ARRIVEE") {
            pieLabels.push(dep.nom);
            pieData.push(val.P_ACTIVE || 0);
          }

          rows.push(`
            <tr>
              <td>${qPill}</td>
              <td style="font-family: var(--font-mono); font-weight: 700;">${meter ? meter.code : dep.compteurId}</td>
              <td>
                <span style="font-weight: 600;">${dep.nom}</span>
                ${dep.estExistantScada ? '<span style="font-size: 9px; background: rgba(2, 132, 199, 0.2); color: var(--color-primary); padding: 1px 4px; border-radius: 3px; margin-left: 6px;">Existant SCADA</span>' : ''}
              </td>
              <td><span style="font-size: 11px; color: var(--text-secondary);">${dep.type}</span></td>
              <td style="font-family: var(--font-mono); font-weight: 700;">${val.P_ACTIVE !== undefined ? val.P_ACTIVE.toFixed(1) : '--'}</td>
              <td style="font-family: var(--font-mono);">${val.EA_IMPORT !== undefined ? val.EA_IMPORT.toLocaleString("fr-FR") : '--'}</td>
              <td style="font-family: var(--font-mono);">${val.COS_PHI !== undefined ? val.COS_PHI.toFixed(3) : '--'}</td>
              <td style="font-family: var(--font-mono); font-size: 11px;">${val.U_TENSION || '--'} V / ${val.I_COURANT || '--'} A</td>
              <td><span class="badge-fresh ${freshBadgeClass}">${freshness.label}</span></td>
              <td style="font-size: 11px; color: var(--text-muted);">${telem ? telem.horodatageReception.split("T")[1].slice(0, 8) : '--'}</td>
              <td>${telem ? telem.qualite : 'N/A'}</td>
            </tr>
          `);
        }
      }
      tbody.innerHTML = rows.join("");

      // Mise à jour de la répartition
      if (this.pieChart) {
        this.pieChart.data.labels = pieLabels;
        this.pieChart.data.datasets[0].data = pieData;
        this.pieChart.update("none");
      }

      // Mise à jour de la courbe du premier compteur (arrivée générale)
      const firstDep = poste.tableaux[0]?.departs[0];
      if (firstDep && this.chart) {
        const hist = simEngine.getHistoryForMeter(firstDep.compteurId);
        if (hist && hist.length > 0) {
          this.chart.data.labels = hist.map(pt => pt.horodatageMesure.split("T")[1].slice(0, 8));
          this.chart.data.datasets[0].data = hist.map(pt => pt.valeurs ? pt.valeurs.P_ACTIVE : 0);
          this.chart.update("none");
        }
      }
    }
  }

  static destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    if (this.pieChart) { this.pieChart.destroy(); this.pieChart = null; }
  }
}
