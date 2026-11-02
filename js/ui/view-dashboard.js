/**
 * view-dashboard.js - Tableau de bord de supervision générale du site Port d'Agadir
 * KPI globaux, synthèse des 6 postes électriques, courbes temps réel Chart.js
 */

import { Store } from "../storage/store.js";
import { AggregationEngine } from "../calculs/aggregations.js";
import { simEngine } from "../simulation/engine.js";
import { AlertManager } from "../alertes/alertManager.js";

export class DashboardView {
  static render(container) {
    this.container = container;
    this.chart = null;

    container.innerHTML = `
      <div class="page-title-row">
        <div>
          <h2 class="page-title">Supervision Énergétique — Site Port d'Agadir</h2>
          <p class="page-subtitle">Vue d'ensemble en temps réel des 6 postes électriques MT/BT (Marsa Maroc DEPA)</p>
        </div>
      </div>

      <!-- KPI SCADA BAR -->
      <div class="grid-4" id="kpi-grid">
        <div class="scada-kpi" id="kpi-puissance">
          <span class="kpi-title">Puissance Active Site</span>
          <div class="kpi-value-row">
            <span class="kpi-value" id="val-puissance">--</span>
            <span class="kpi-unit">kW</span>
          </div>
          <span class="kpi-trend trend-neutral" id="trend-puissance">Surveillance globale</span>
        </div>

        <div class="scada-kpi kpi-success" id="kpi-energie">
          <span class="kpi-title">Énergie Totale Cumulée</span>
          <div class="kpi-value-row">
            <span class="kpi-value" id="val-energie">--</span>
            <span class="kpi-unit">MWh</span>
          </div>
          <span class="kpi-trend trend-down">Bilan 6 Postes</span>
        </div>

        <div class="scada-kpi" id="kpi-cosphi">
          <span class="kpi-title">Facteur de Puissance (cos φ)</span>
          <div class="kpi-value-row">
            <span class="kpi-value" id="val-cosphi">--</span>
            <span class="kpi-unit"></span>
          </div>
          <span class="kpi-trend trend-down" id="trend-cosphi">Cible ONEE ≥ 0.85</span>
        </div>

        <div class="scada-kpi kpi-modbus" id="kpi-com">
          <span class="kpi-title">Disponibilité Modbus TCP</span>
          <div class="kpi-value-row">
            <span class="kpi-value" id="val-com">--</span>
            <span class="kpi-unit">%</span>
          </div>
          <span class="kpi-trend trend-neutral" id="trend-com">18 centrales interrogées</span>
        </div>
      </div>

      <!-- COURBE TEMPS RÉEL SITE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>⚡ Appel de Puissance Site en Temps Réel (kW)</span>
          </div>
          <div class="card-subtitle">Échantillonnage continu toutes les 5s (accélération disponible en haut à droite)</div>
        </div>
        <div style="height: 260px; position: relative;">
          <canvas id="siteRealtimeChart"></canvas>
        </div>
      </div>

      <!-- SYNTHÈSE DES 6 POSTES ÉLECTRIQUES -->
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-size: 15px; font-weight: 700;">État des 6 Postes MT/BT</h3>
          <span style="font-size: 12px; color: var(--text-muted);">Cliquez sur un poste pour accéder au détail analytique</span>
        </div>
        <div class="grid-3" id="postes-grid">
          <!-- Injecté dynamiquement -->
        </div>
      </div>
    `;

    this.initChart();
    this.update();

    // Abonnement aux ticks du moteur de simulation
    this.unsubscribe = simEngine.subscribe(() => {
      this.update();
    });

    // Écoute du changement de thème clair/sombre pour adapter Chart.js
    this.themeHandler = () => {
      if (this.chart) {
        this.chart.destroy();
        this.initChart();
        this.update();
      }
    };
    window.addEventListener("themeChanged", this.themeHandler);
  }

  static initChart() {
    const ctx = document.getElementById("siteRealtimeChart");
    if (!ctx || !window.Chart) return;

    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const textColor = isDark ? "#94a3b8" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

    this.chart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Puissance Active (kW)",
            borderColor: "#0284c7",
            backgroundColor: "rgba(2, 132, 199, 0.15)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            data: []
          },
          {
            label: "Puissance Réactive (kvar)",
            borderColor: "#f59e0b",
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderDash: [4, 4],
            tension: 0.3,
            data: []
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxTicksLimit: 10 }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor }
          }
        },
        plugins: {
          legend: {
            labels: { color: textColor, font: { size: 11 } }
          }
        }
      }
    });
  }

  static update() {
    const siteBilan = AggregationEngine.getSiteGlobalBilan(simEngine.latestTelemetry);
    if (!siteBilan) return;

    // Mise à jour des KPI
    const elP = document.getElementById("val-puissance");
    const elE = document.getElementById("val-energie");
    const elCos = document.getElementById("val-cosphi");
    const elCom = document.getElementById("val-com");

    if (elP) elP.textContent = siteBilan.puissanceSiteKW.toLocaleString("fr-FR");
    if (elE) elE.textContent = siteBilan.energieSiteMWh.toLocaleString("fr-FR");
    if (elCos) {
      elCos.textContent = siteBilan.cosPhiGlobal.toFixed(3);
      const kpiCos = document.getElementById("kpi-cosphi");
      if (kpiCos) {
        kpiCos.className = siteBilan.cosPhiGlobal >= 0.85 ? "scada-kpi" : "scada-kpi kpi-danger";
      }
    }
    if (elCom) {
      elCom.textContent = siteBilan.tauxComModbus;
      const kpiCom = document.getElementById("kpi-com");
      if (kpiCom) {
        kpiCom.className = siteBilan.tauxComModbus >= 95 ? "scada-kpi kpi-modbus" : "scada-kpi kpi-warning";
      }
    }

    // Mise à jour du graphique temps réel
    if (this.chart) {
      // Reconstitution à partir de l'historique du premier compteur tête de poste pour l'horodatage
      const refHist = simEngine.getHistoryForMeter("CPT_P1_01");
      if (refHist && refHist.length > 0) {
        const labels = refHist.map(pt => pt.horodatageMesure.split("T")[1].slice(0, 8));
        // Calcul pour chaque point dans le temps
        const pValues = [];
        const qValues = [];

        for (let i = 0; i < refHist.length; i++) {
          let sumP = 0;
          let sumQ = 0;
          // Somme des 6 arrivées de poste
          ["CPT_P1_01", "CPT_P2_01", "CPT_P3_01", "CPT_P4_01", "CPT_P5_01", "CPT_P6_01"].forEach(mId => {
            const h = simEngine.getHistoryForMeter(mId);
            if (h && h[i] && h[i].valeurs) {
              sumP += h[i].valeurs.P_ACTIVE || 0;
              sumQ += h[i].valeurs.P_REACTIVE || 0;
            }
          });
          pValues.push(Math.round(sumP));
          qValues.push(Math.round(sumQ));
        }

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = pValues;
        this.chart.data.datasets[1].data = qValues;
        this.chart.update("none");
      }
    }

    // Mise à jour de la grille des 6 postes
    const grid = document.getElementById("postes-grid");
    if (grid && siteBilan.bilansPostes) {
      grid.innerHTML = siteBilan.bilansPostes.map(p => {
        let statusClass = "status-ok";
        let statusLabel = "Normal";
        if (p.statut === "WARNING") { statusClass = "status-warning"; statusLabel = "Avertissement"; }
        if (p.statut === "DANGER") { statusClass = "status-danger"; statusLabel = "Défaut / Alarme"; }

        return `
          <div class="poste-card" onclick="window.location.hash = '#/postes?id=${p.posteId}'">
            <div class="poste-card-header">
              <div>
                <div class="poste-card-title">${p.posteNom}</div>
                <div class="poste-card-sub">Puissance souscrite : ${p.puissanceSouscriteKVA} kVA</div>
              </div>
              <span class="status-pill ${statusClass}">
                <span class="status-dot"></span>
                <span>${statusLabel}</span>
              </span>
            </div>

            <div class="poste-telemetry-grid">
              <div class="telem-item">
                <span class="telem-label">Puissance</span>
                <span class="telem-val">${p.puissanceActiveKW.toLocaleString("fr-FR")} kW</span>
              </div>
              <div class="telem-item">
                <span class="telem-label">Taux Charge</span>
                <span class="telem-val">${p.tauxChargePourcent} %</span>
              </div>
              <div class="telem-item">
                <span class="telem-label">cos φ</span>
                <span class="telem-val">${p.cosPhiMoyen.toFixed(3)}</span>
              </div>
              <div class="telem-item">
                <span class="telem-label">Compteurs</span>
                <span class="telem-val">${p.compteursTotal - p.compteursEnDefaut} / ${p.compteursTotal} en ligne</span>
              </div>
            </div>

            <div style="font-size: 10px; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>Anti-double comptage : Actif ✓</span>
              <span>Dernière trame : ${p.dernierContact ? p.dernierContact.split("T")[1].slice(0, 8) : 'N/A'}</span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  static destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.themeHandler) {
      window.removeEventListener("themeChanged", this.themeHandler);
    }
  }
}
