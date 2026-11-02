/**
 * view-ser.js - Situation Énergétique de Référence (SER — ISO 50001)
 * Modélisation mathématique de la baseline, comparaison Conso Réelle vs Référence,
 * courbe CUSUM et gestion des versions.
 */

import { Store } from "../storage/store.js";
import { SERManager } from "../calculs/ser.js";
import { simEngine } from "../simulation/engine.js";
import { AuthManager } from "../auth/auth.js";

export class SERView {
  static render(container) {
    this.container = container;
    this.chart = null;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 class="page-title">Situation Énergétique de Référence (SER — ISO 50001)</h2>
          <p class="page-subtitle">Modélisation de la consommation théorique (Baseline) et suivi du cumul des écarts (CUSUM)</p>
        </div>
        <button class="btn btn-primary" id="btn-add-ser-rev">📝 Nouvelle Révision de la SER</button>
      </div>

      <!-- BANDEAU DE RÉSERVE MÉTHODOLOGIQUE -->
      <div class="card" style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid var(--color-warning); padding: 12px;">
        <strong>VALIDATION CONTRACTUELLE :</strong>
        Modèle de régression multi-linéaire basé sur la norme ISO 50006. <em>« Méthode mathématique à valider avec la DEPA lors des études d'exécution »</em>.
      </div>

      <!-- SYNTHÈSE DE LA BASELINE ACTIVE -->
      <div class="grid-4" id="ser-kpi-grid">
        <!-- Rempli dynamiquement -->
      </div>

      <!-- GRAPHIQUE CUSUM & COMPARAISON RÉEL VS BASELINE -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Comparaison Journalière : Réel vs Baseline (kWh)</div>
            <div class="card-subtitle">Surconsommation ou économie constatée par jour</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="serComparisonChart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Courbe CUSUM (Somme Cumulée des Écarts)</div>
            <div class="card-subtitle">Pente descendante = Économies d'énergie durables</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="serCusumChart"></canvas>
          </div>
        </div>
      </div>

      <!-- PARAMÈTRES DU MODÈLE ET HISTORIQUE DES RÉVISIONS -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Paramètres Mathématiques de la SER (ISO 50006)</div>
            <div class="card-subtitle">Régression linéaire multiple sur variables d'activité</div>
          </div>
          <div style="background: var(--bg-main); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 13px; margin-bottom: 12px;">
            E_ref (kWh) = α · EVP + β · Tonnes + γ · T_ext + E_0
          </div>
          <table class="data-table">
            <tbody>
              <tr>
                <td>Facteur α (Trafic conteneurs)</td>
                <td style="font-family: var(--font-mono); font-weight: 700;">26.4 kWh / EVP</td>
                <td>Poste 5</td>
              </tr>
              <tr>
                <td>Facteur β (Manutention vrac)</td>
                <td style="font-family: var(--font-mono); font-weight: 700;">1.95 kWh / Tonne</td>
                <td>Postes 1 & 2</td>
              </tr>
              <tr>
                <td>Facteur γ (Sensibilité thermique)</td>
                <td style="font-family: var(--font-mono); font-weight: 700;">18.2 kWh / °C</td>
                <td>Reefers & Climatisation</td>
              </tr>
              <tr>
                <td>Talon Fixe E_0 (Consommation incompressible)</td>
                <td style="font-family: var(--font-mono); font-weight: 700;">8 450 kWh / jour</td>
                <td>Auxiliaires permanents</td>
              </tr>
              <tr>
                <td>Coefficient de corrélation R²</td>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-success);">0.942</td>
                <td>Modèle robuste (R² > 0.80)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Registre des Révisions de la SER</div>
            <div class="card-subtitle">Traçabilité ISO 50001 des motifs de recalcul</div>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Date</th>
                  <th>Auteur</th>
                  <th>Motif de la Révision</th>
                </tr>
              </thead>
              <tbody id="ser-versions-tbody">
                <!-- Rempli dynamiquement -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL NOUVELLE RÉVISION -->
      <div id="ser-modal-container"></div>
    `;

    document.getElementById("btn-add-ser-rev")?.addEventListener("click", () => {
      if (!AuthManager.checkPermission("edit_ser", "créer une révision de la SER")) return;
      this.openRevisionModal();
    });

    this.initCharts();
    this.updateView();

    this.unsubscribe = simEngine.subscribe(() => {
      this.updateView();
    });
  }

  static initCharts() {
    const ctxComp = document.getElementById("serComparisonChart");
    const ctxCusum = document.getElementById("serCusumChart");
    if (!window.Chart) return;

    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const textColor = isDark ? "#94a3b8" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

    if (ctxComp) {
      this.compChart = new window.Chart(ctxComp, {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            { label: "Consommation Référence (kWh)", backgroundColor: "rgba(100, 116, 139, 0.5)", data: [] },
            { label: "Consommation Réelle (kWh)", backgroundColor: "#0284c7", data: [] }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          },
          plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } }
        }
      });
    }

    if (ctxCusum) {
      this.cusumChart = new window.Chart(ctxCusum, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "CUSUM Cumulé (kWh)",
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              borderWidth: 2,
              fill: true,
              data: []
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          },
          plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } }
        }
      });
    }
  }

  static updateView() {
    const serBilan = SERManager.getSERComparison(simEngine.latestTelemetry);
    const kpiGrid = document.getElementById("ser-kpi-grid");
    const tbodyVersions = document.getElementById("ser-versions-tbody");

    if (kpiGrid && serBilan) {
      kpiGrid.innerHTML = `
        <div class="scada-kpi">
          <span class="kpi-title">Conso Référence Jour</span>
          <div class="kpi-value-row">
            <span class="kpi-value">${serBilan.consoTheoriqueKWh.toLocaleString("fr-FR")}</span>
            <span class="kpi-unit">kWh</span>
          </div>
          <span class="kpi-trend trend-neutral">Baseline ISO 50006</span>
        </div>

        <div class="scada-kpi">
          <span class="kpi-title">Conso Réelle Observée</span>
          <div class="kpi-value-row">
            <span class="kpi-value">${serBilan.consoReelleKWh.toLocaleString("fr-FR")}</span>
            <span class="kpi-unit">kWh</span>
          </div>
          <span class="kpi-trend trend-neutral">Comptage 6 Postes</span>
        </div>

        <div class="scada-kpi ${serBilan.ecartKWh <= 0 ? 'kpi-success' : 'kpi-danger'}">
          <span class="kpi-title">Écart Net (Réel - Réf)</span>
          <div class="kpi-value-row">
            <span class="kpi-value">${serBilan.ecartKWh > 0 ? '+' : ''}${serBilan.ecartKWh.toLocaleString("fr-FR")}</span>
            <span class="kpi-unit">kWh</span>
          </div>
          <span class="kpi-trend ${serBilan.ecartKWh <= 0 ? 'trend-down' : 'trend-up'}">
            ${serBilan.ecartPourcent > 0 ? '+' : ''}${serBilan.ecartPourcent}% (${serBilan.performance})
          </span>
        </div>

        <div class="scada-kpi kpi-success">
          <span class="kpi-title">Économie CUSUM 7 Jours</span>
          <div class="kpi-value-row">
            <span class="kpi-value">${Math.abs(serBilan.cusumTotalKWh).toLocaleString("fr-FR")}</span>
            <span class="kpi-unit">kWh</span>
          </div>
          <span class="kpi-trend trend-down">Cumul d'économies certifié</span>
        </div>
      `;
    }

    // Graphiques
    if (serBilan && serBilan.historiqueCusum) {
      const labels = serBilan.historiqueCusum.map(d => d.jour);
      const refData = serBilan.historiqueCusum.map(d => d.refKWh);
      const reelData = serBilan.historiqueCusum.map(d => d.reelKWh);
      const cusumData = serBilan.historiqueCusum.map(d => d.cusum);

      if (this.compChart) {
        this.compChart.data.labels = labels;
        this.compChart.data.datasets[0].data = refData;
        this.compChart.data.datasets[1].data = reelData;
        this.compChart.update("none");
      }

      if (this.cusumChart) {
        this.cusumChart.data.labels = labels;
        this.cusumChart.data.datasets[0].data = cusumData;
        this.cusumChart.update("none");
      }
    }

    // Tableau des versions
    if (tbodyVersions && serBilan.versions) {
      tbodyVersions.innerHTML = serBilan.versions.map(v => `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700;">${v.version}</td>
          <td>${v.date}</td>
          <td>${v.auteur}</td>
          <td>${v.motif}</td>
        </tr>
      `).join("");
    }
  }

  static openRevisionModal() {
    const modalContainer = document.getElementById("ser-modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Créer une Révision de la Situation Énergétique de Référence</h3>
            <button class="btn btn-secondary btn-sm" id="btn-close-ser-modal">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
              Conformément à l'ISO 50001, toute modification de la SER nécessite la traçabilité d'un motif technique (raccordement d'équipement neuf, modification de process, audit contradictoire).
            </p>
            <div class="form-group">
              <label class="form-label">Motif Explicatif de la Révision (Obligatoire) :</label>
              <textarea id="modal-ser-motif" class="form-textarea" rows="3" placeholder="Ex: Raccordement de 2 nouveaux portiques de quai au Poste 5 avec réajustement du facteur alpha."></textarea>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nouveau Facteur α (kWh/EVP) :</label>
                <input type="number" id="modal-ser-alpha" class="form-input" value="26.4" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">Nouveau Facteur β (kWh/Tonne) :</label>
                <input type="number" id="modal-ser-beta" class="form-input" value="1.95" step="0.05">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-ser-modal">Annuler</button>
            <button class="btn btn-primary" id="btn-save-ser-revision">Valider la Révision ✓</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-ser-modal")?.addEventListener("click", () => modalContainer.innerHTML = "");
    document.getElementById("btn-cancel-ser-modal")?.addEventListener("click", () => modalContainer.innerHTML = "");

    document.getElementById("btn-save-ser-revision")?.addEventListener("click", () => {
      const motif = document.getElementById("modal-ser-motif").value.trim();
      if (!motif) {
        alert("Veuillez saisir un motif explicatif pour valider la révision.");
        return;
      }
      const alpha = Number(document.getElementById("modal-ser-alpha").value);
      const beta = Number(document.getElementById("modal-ser-beta").value);

      SERManager.addRevision(motif, { alphaEVP: alpha, betaTonnage: beta });
      modalContainer.innerHTML = "";
      this.updateView();
      alert("Nouvelle révision de la SER enregistrée et journalisée dans l'audit.");
    });
  }

  static destroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.compChart) { this.compChart.destroy(); this.compChart = null; }
    if (this.cusumChart) { this.cusumChart.destroy(); this.cusumChart = null; }
  }
}
