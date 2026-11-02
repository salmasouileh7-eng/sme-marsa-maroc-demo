/**
 * view-recette.js - Plan de Recette & Validation des 15 Tests Contractuels (T01 à T15)
 * Checklist interactive avec calcul du score global de conformité, traçabilité et validation.
 */

import { Store } from "../storage/store.js";
import { AuthManager } from "../auth/auth.js";

export class RecetteView {
  static render(container) {
    this.container = container;
    const tests = Store.get("recette_tests", []);

    const validesCount = tests.filter(t => t.statut === "VALIDE").length;
    const scorePercent = Math.round((validesCount / tests.length) * 100);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h2 class="page-title">Plan de Recette Technique (Essais T01 à T15)</h2>
          <p class="page-subtitle">Grille d'évaluation contradictoire conforme à l'article 11 du Règlement de Consultation (RC)</p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; background: var(--bg-card); padding: 8px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">Score Global de Recette :</span>
          <span style="font-size: 20px; font-weight: 800; font-family: var(--font-mono); color: ${scorePercent >= 85 ? 'var(--color-success)' : 'var(--color-warning)'};">
            ${validesCount} / ${tests.length} (${scorePercent}%)
          </span>
        </div>
      </div>

      <!-- TABLEAU DES 15 TESTS DE RECETTE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Matrice des 15 Tests de Qualification & Recette Usine / Site</div>
          <div class="card-subtitle">Cliquez sur « Valider » pour consigner les résultats contradictoires</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Intitulé du Test & Procédure</th>
                <th>Catégorie</th>
                <th>Critère de Succès</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Testeur</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${tests.map(t => {
                let statusPill = '<span class="status-pill status-ok"><span class="status-dot"></span>VALIDÉ</span>';
                if (t.statut === "A_VERIFIER") {
                  statusPill = '<span class="status-pill status-warning"><span class="status-dot"></span>À vérifier</span>';
                } else if (t.statut === "ECHOUE") {
                  statusPill = '<span class="status-pill status-danger"><span class="status-dot"></span>Échoué</span>';
                }

                return `
                  <tr>
                    <td style="font-family: var(--font-mono); font-weight: 800; font-size: 13px;">${t.id}</td>
                    <td style="max-width: 320px;">
                      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${t.titre}</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">${t.procedure}</div>
                      ${t.commentaire ? `<div style="font-size: 11px; color: var(--color-primary); margin-top: 4px; font-style: italic;">Note : ${t.commentaire}</div>` : ''}
                    </td>
                    <td><span style="font-size: 10px; background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; font-weight: 600;">${t.categorie}</span></td>
                    <td style="font-size: 11px; color: var(--text-secondary); max-width: 220px;">${t.critere}</td>
                    <td>${statusPill}</td>
                    <td style="font-size: 11px; font-family: var(--font-mono);">${t.date || '—'}</td>
                    <td style="font-size: 11px;">${t.testeur || '—'}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="window.openTestModal('${t.id}')">✏️ Valider</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL VALIDATION TEST -->
      <div id="test-modal-container"></div>
    `;

    window.openTestModal = (id) => this.openModal(id);
  }

  static openModal(testId) {
    if (!AuthManager.checkPermission("execute_tests", "valider un test de recette")) return;

    const tests = Store.get("recette_tests", []);
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const modalContainer = document.getElementById("test-modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Validation Contradictoire [${test.id}] — ${test.titre}</h3>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('test-modal-container').innerHTML = ''">✕</button>
          </div>
          <div class="modal-body">
            <div style="background: var(--bg-main); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 12px; margin-bottom: 16px;">
              <strong>Procédure d'essai :</strong> ${test.procedure}<br>
              <strong>Critère d'acceptation :</strong> ${test.critere}
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Statut du Test :</label>
                <select id="modal-test-statut" class="form-select">
                  <option value="VALIDE" ${test.statut === "VALIDE" ? "selected" : ""}>VALIDÉ (Conforme au CPS)</option>
                  <option value="A_VERIFIER" ${test.statut === "A_VERIFIER" ? "selected" : ""}>À VÉRIFIER (En cours de test)</option>
                  <option value="ECHOUE" ${test.statut === "ECHOUE" ? "selected" : ""}>ÉCHOUÉ (Non-conformité relevée)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Date du Test :</label>
                <input type="date" id="modal-test-date" class="form-input" value="${test.date || new Date().toISOString().split("T")[0]}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nom du Testeur / Contrôleur DEPA :</label>
              <input type="text" id="modal-test-testeur" class="form-input" value="${test.testeur || Store.getCurrentUser().name}">
            </div>

            <div class="form-group">
              <label class="form-label">Observations & Commentaires d'Essai :</label>
              <textarea id="modal-test-comment" class="form-textarea" rows="3">${test.commentaire || ""}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('test-modal-container').innerHTML = ''">Annuler</button>
            <button class="btn btn-primary" id="btn-save-test">Enregistrer le Procès-Verbal ✓</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-save-test")?.addEventListener("click", () => {
      test.statut = document.getElementById("modal-test-statut").value;
      test.date = document.getElementById("modal-test-date").value;
      test.testeur = document.getElementById("modal-test-testeur").value;
      test.commentaire = document.getElementById("modal-test-comment").value;

      Store.set("recette_tests", tests);
      Store.logAudit("VALIDATION_TEST_RECETTE", test.id, "-", `Statut: ${test.statut} - Testeur: ${test.testeur}`);
      modalContainer.innerHTML = "";
      this.render(this.container);
      alert(`Test ${test.id} mis à jour avec succès.`);
    });
  }

  static destroy() {}
}
