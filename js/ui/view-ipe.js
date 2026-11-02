/**
 * view-ipe.js - Gestion & Suivi des Indicateurs de Performance Énergétique (IPE)
 * Conforme à la norme ISO 50001 (Système de Management de l'Énergie)
 */

import { Store } from "../storage/store.js";
import { IPEManager } from "../calculs/ipe.js";
import { simEngine } from "../simulation/engine.js";
import { AuthManager } from "../auth/auth.js";

export class IPEView {
  static render(container) {
    this.container = container;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 class="page-title">Indicateurs de Performance Énergétique (IPE — ISO 50001)</h2>
          <p class="page-subtitle">Suivi des ratios d'intensité énergétique par unité d'œuvre portuaire</p>
        </div>
        <button class="btn btn-primary" id="btn-add-ipe">➕ Configurer un Nouvel IPE</button>
      </div>

      <!-- BANDEAU EXEMPLE ILLUSTRATIF -->
      <div class="card" style="background: rgba(2, 132, 199, 0.08); border-left: 4px solid var(--color-primary); padding: 12px;">
        <strong>NOTE MÉTHODOLOGIQUE ISO 50001 :</strong>
        Les 3 IPE présentés ci-dessous constituent des <em>exemples illustratifs réalistes</em> calibrés pour les activités du Port d'Agadir. Les formules définitives, cibles et seuils d'alertes seront arrêtés contradictoirement avec le Responsable Énergie de la DEPA.
      </div>

      <!-- CARTES DES IPE -->
      <div class="grid-3" id="ipe-cards-container">
        <!-- Rempli dynamiquement -->
      </div>

      <!-- TABLEAU COMPARATIF ET HISTORIQUE DES VERSIONS -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Détail des Formules & Traitement des Données Manquantes</div>
          <div class="card-subtitle">Exigence ISO 50006 : documentation mathématique et traçabilité des modifications</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th>Périmètre Électrique</th>
                <th>Formule Documentée</th>
                <th>Cible ISO 50001</th>
                <th>Politique Données Manquantes</th>
                <th>Date d'Effet</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody id="ipe-table-body">
              <!-- Rempli dynamiquement -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CRÉATION / ÉDITION IPE -->
      <div id="ipe-modal-container"></div>
    `;

    document.getElementById("btn-add-ipe")?.addEventListener("click", () => {
      if (!AuthManager.checkPermission("edit_ipe", "créer un IPE")) return;
      this.openIPEModal();
    });

    this.updateView();

    this.unsubscribe = simEngine.subscribe(() => {
      this.updateView();
    });
  }

  static updateView() {
    const ipes = Store.get("ipes", []);
    const cardsContainer = document.getElementById("ipe-cards-container");
    const tbody = document.getElementById("ipe-table-body");

    if (cardsContainer) {
      cardsContainer.innerHTML = ipes.map(ipe => {
        const evalResult = IPEManager.evaluateIPE(ipe, simEngine.latestTelemetry);
        const isConform = evalResult.estConforme;
        const statusClass = isConform ? "status-ok" : "status-danger";
        const statusText = isConform ? "Conforme" : "Dérive / Alerte";

        return `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: var(--color-primary);">${ipe.code}</span>
                  <h4 style="font-size: 14px; font-weight: 700; margin-top: 2px;">${ipe.nom}</h4>
                </div>
                <span class="status-pill ${statusClass}"><span class="status-dot"></span>${statusText}</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 12px;">${ipe.description}</p>
            </div>

            <div style="background: var(--bg-main); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Valeur Observée</span>
                <span style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary);">
                  ${evalResult.valeur !== null ? evalResult.valeur.toFixed(2) : "N/A"}
                  <small style="font-size: 11px; font-weight: 600; color: var(--text-muted);">${ipe.unite}</small>
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 6px; color: var(--text-secondary);">
                <span>Cible contractuelle : <strong>${ipe.cibleISO} ${ipe.unite}</strong></span>
                <span style="color: ${evalResult.ecartPourcentCible > 0 ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight: 700;">
                  ${evalResult.ecartPourcentCible > 0 ? '+' : ''}${evalResult.ecartPourcentCible}%
                </span>
              </div>
            </div>

            <div>
              <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 8px;">
                <span>Périmètre : ${ipe.perimetre}</span><br>
                <span>Complétude : ${evalResult.tauxCompletude}% — ${evalResult.messageQualite}</span>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.editIpe('${ipe.id}')">✏️ Modifier</button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    if (tbody) {
      tbody.innerHTML = ipes.map(ipe => `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700;">${ipe.code}</td>
          <td><strong>${ipe.nom}</strong></td>
          <td>${ipe.perimetre}</td>
          <td><code>${ipe.formuleAffichee || ipe.formule}</code></td>
          <td style="font-family: var(--font-mono); font-weight: 700;">${ipe.cibleISO} ${ipe.unite}</td>
          <td><span style="font-size: 11px; background: var(--bg-hover); padding: 2px 6px; border-radius: 4px;">${ipe.traitementManquant}</span></td>
          <td>${ipe.dateVigueur}</td>
          <td><span class="status-pill status-ok">${ipe.statut}</span></td>
        </tr>
      `).join("");
    }

    window.editIpe = (id) => {
      if (!AuthManager.checkPermission("edit_ipe", "modifier cet IPE")) return;
      this.openIPEModal(id);
    };
  }

  static openIPEModal(ipeId = null) {
    const ipes = Store.get("ipes", []);
    const ipe = ipeId ? ipes.find(i => i.id === ipeId) : {
      code: `IPE-0${ipes.length + 1}`,
      nom: "Nouvel Indicateur de Performance",
      description: "Description de l'usage énergétique ciblé",
      perimetre: "Poste 5 (Terminal Conteneurs)",
      postesInclus: ["P5"],
      formule: "E_tot_P5 / EVP_jour",
      formuleAffichee: "Énergie (kWh) / Unité d'œuvre",
      unite: "kWh / UO",
      cibleISO: 15.0,
      seuilAlerte: 18.0,
      traitementManquant: "EXCLUSION_PROPOSITION_DEPA",
      dateVigueur: new Date().toISOString().split("T")[0]
    };

    const modalContainer = document.getElementById("ipe-modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">${ipeId ? "Modifier l'IPE ISO 50001" : "Créer un IPE ISO 50001"}</h3>
            <button class="btn btn-secondary btn-sm" id="btn-close-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Code IPE :</label>
                <input type="text" id="modal-ipe-code" class="form-input" value="${ipe.code}">
              </div>
              <div class="form-group">
                <label class="form-label">Date d'Entrée en Vigueur :</label>
                <input type="date" id="modal-ipe-date" class="form-input" value="${ipe.dateVigueur}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nom de l'Indicateur :</label>
              <input type="text" id="modal-ipe-nom" class="form-input" value="${ipe.nom}">
            </div>

            <div class="form-group">
              <label class="form-label">Description & Objectif ISO 50001 :</label>
              <textarea id="modal-ipe-desc" class="form-textarea" rows="2">${ipe.description}</textarea>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Formule Mathématique :</label>
                <input type="text" id="modal-ipe-formule" class="form-input" value="${ipe.formule}">
              </div>
              <div class="form-group">
                <label class="form-label">Unité d'Œuvre (ex: kWh/EVP, kWh/Tonne) :</label>
                <input type="text" id="modal-ipe-unite" class="form-input" value="${ipe.unite}">
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Cible de Référence ISO 50001 :</label>
                <input type="number" id="modal-ipe-cible" class="form-input" value="${ipe.cibleISO}" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">Seuil de Dérive Alarme :</label>
                <input type="number" id="modal-ipe-seuil" class="form-input" value="${ipe.seuilAlerte}" step="0.1">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Politique de Traitement des Données Manquantes :</label>
              <select id="modal-ipe-manquant" class="form-select">
                <option value="EXCLUSION_PROPOSITION_DEPA" ${ipe.traitementManquant === "EXCLUSION_PROPOSITION_DEPA" ? "selected" : ""}>Exclusion de la plage horaire avec traçabilité</option>
                <option value="INTERPOLATION_LINEAIRE" ${ipe.traitementManquant === "INTERPOLATION_LINEAIRE" ? "selected" : ""}>Interpolation linéaire (lacunes < 2h)</option>
                <option value="REJET_SI_LACUNE" ${ipe.traitementManquant === "REJET_SI_LACUNE" ? "selected" : ""}>Rejet strict si complétude < 95%</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-modal">Annuler</button>
            <button class="btn btn-primary" id="btn-save-ipe">Enregistrer l'IPE ✓</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-modal")?.addEventListener("click", () => modalContainer.innerHTML = "");
    document.getElementById("btn-cancel-modal")?.addEventListener("click", () => modalContainer.innerHTML = "");

    document.getElementById("btn-save-ipe")?.addEventListener("click", () => {
      const updatedData = {
        id: ipeId || "IPE_" + Date.now(),
        code: document.getElementById("modal-ipe-code").value,
        nom: document.getElementById("modal-ipe-nom").value,
        description: document.getElementById("modal-ipe-desc").value,
        formule: document.getElementById("modal-ipe-formule").value,
        formuleAffichee: document.getElementById("modal-ipe-formule").value,
        unite: document.getElementById("modal-ipe-unite").value,
        cibleISO: Number(document.getElementById("modal-ipe-cible").value),
        seuilAlerte: Number(document.getElementById("modal-ipe-seuil").value),
        traitementManquant: document.getElementById("modal-ipe-manquant").value,
        dateVigueur: document.getElementById("modal-ipe-date").value,
        perimetre: ipe.perimetre || "Poste 5",
        postesInclus: ipe.postesInclus || ["P5"],
        statut: "ACTIF"
      };

      IPEManager.saveIPE(updatedData);
      modalContainer.innerHTML = "";
      this.updateView();
    });
  }

  static destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
