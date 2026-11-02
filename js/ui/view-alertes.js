/**
 * view-alertes.js - Console de gestion des alarmes et événements SCADA
 * Cycle de vie : NOUVELLE -> PRISE EN CHARGE -> CLÔTURÉE
 * Acquittement avec commentaire, configuration des règles de seuils, simulation de notifications.
 */

import { Store } from "../storage/store.js";
import { AlertManager } from "../alertes/alertManager.js";
import { AuthManager } from "../auth/auth.js";
import { simEngine } from "../simulation/engine.js";

export class AlertesView {
  static render(container) {
    this.container = container;
    this.currentFilter = "ACTIVE"; // "ALL" | "ACTIVE" | "CLOTUREE"

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 class="page-title">Console des Alarmes & Événements</h2>
          <p class="page-subtitle">Cycle de vie des alertes : Nouvelle > Prise en charge > Clôturée (avec traçabilité)</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary ${this.currentFilter === 'ACTIVE' ? 'btn-primary' : ''}" id="filter-active">Alertes Actives</button>
          <button class="btn btn-secondary ${this.currentFilter === 'ALL' ? 'btn-primary' : ''}" id="filter-all">Toutes</button>
          <button class="btn btn-secondary ${this.currentFilter === 'CLOTUREE' ? 'btn-primary' : ''}" id="filter-closed">Historique Clôturées</button>
        </div>
      </div>

      <!-- BANDEAU CANAUX NOTIFICATIONS -->
      <div class="card" style="background: rgba(2, 132, 199, 0.08); border-left: 4px solid var(--color-primary); padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>DISPOSITIF DE NOTIFICATION :</strong>
            Notifications sonores et visuelles IHM actives. Canaux d'alerte distants (serveur SMTP / passerelle SMS GSM locale) : <em>« Exemple illustratif — à valider avec la DSI et la DEPA »</em>.
          </div>
          <span class="status-pill status-ok">Passerelle Simulée Prête</span>
        </div>
      </div>

      <!-- TABLEAU DES ALERTES -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Flux des Alarmes Énergétiques & Métrologiques</div>
          <div class="card-subtitle">Triées par antériorité d'apparition</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Gravité</th>
                <th>Statut</th>
                <th>Date / Heure</th>
                <th>Poste / Équipement</th>
                <th>Intitulé du Défaut</th>
                <th>Détails & Commentaire d'Exploitation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="alerts-tbody">
              <!-- Rempli dynamiquement -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- RÈGLES DE SEUILS CONFIGURABLES -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">⚙️ Règles & Seuils d'Alarmes Configurables</div>
          <div class="card-subtitle">Seuils déclencheurs modifiables par les profils autorisés</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Désignation de la Règle</th>
                <th>Grandeur Surveillée</th>
                <th>Seuil de Déclenchement</th>
                <th>Gravité</th>
                <th>État</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="rules-tbody">
              <!-- Rempli dynamiquement -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL ACQUITTEMENT / CLÔTURE -->
      <div id="alert-modal-container"></div>
    `;

    this.attachFilterEvents();
    this.updateView();

    this.unsubscribe = simEngine.subscribe(() => {
      this.updateView();
    });
  }

  static attachFilterEvents() {
    document.getElementById("filter-active")?.addEventListener("click", () => {
      this.currentFilter = "ACTIVE";
      this.render(this.container);
    });
    document.getElementById("filter-all")?.addEventListener("click", () => {
      this.currentFilter = "ALL";
      this.render(this.container);
    });
    document.getElementById("filter-closed")?.addEventListener("click", () => {
      this.currentFilter = "CLOTUREE";
      this.render(this.container);
    });
  }

  static updateView() {
    const alerts = AlertManager.getAlerts();
    const rules = AlertManager.getRules();
    const tbodyAlerts = document.getElementById("alerts-tbody");
    const tbodyRules = document.getElementById("rules-tbody");

    // Filtrer les alertes
    let filteredAlerts = alerts;
    if (this.currentFilter === "ACTIVE") {
      filteredAlerts = alerts.filter(a => a.statut !== "CLOTUREE");
    } else if (this.currentFilter === "CLOTUREE") {
      filteredAlerts = alerts.filter(a => a.statut === "CLOTUREE");
    }

    if (tbodyAlerts) {
      if (filteredAlerts.length === 0) {
        tbodyAlerts.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
              Aucune alarme dans cette catégorie. Système fonctionnant dans les paramètres nominaux.
            </td>
          </tr>
        `;
      } else {
        tbodyAlerts.innerHTML = filteredAlerts.map(a => {
          let gravPill = a.gravite === "CRITIQUE" 
            ? '<span class="status-pill status-danger"><span class="status-dot"></span>Critique</span>'
            : '<span class="status-pill status-warning"><span class="status-dot"></span>Avertissement</span>';

          let statPill = "";
          if (a.statut === "NOUVELLE") {
            statPill = '<span class="status-pill status-danger">NOUVELLE</span>';
          } else if (a.statut === "PRISE_EN_CHARGE") {
            statPill = `<span class="status-pill status-warning" title="Prise en charge par ${a.acquittePar}">EN COURS (${a.acquittePar || ''})</span>`;
          } else {
            statPill = '<span class="status-pill status-ok">CLÔTURÉE</span>';
          }

          let actionsHtml = "";
          if (a.statut === "NOUVELLE") {
            actionsHtml = `<button class="btn btn-secondary btn-sm" onclick="window.ackAlert('${a.id}')">✋ Prendre en charge</button>`;
          } else if (a.statut === "PRISE_EN_CHARGE") {
            actionsHtml = `<button class="btn btn-primary btn-sm" onclick="window.closeAlert('${a.id}')">✓ Clôturer</button>`;
          } else {
            actionsHtml = `<span style="font-size: 11px; color: var(--text-muted);">Archivée</span>`;
          }

          return `
            <tr>
              <td>${gravPill}</td>
              <td>${statPill}</td>
              <td style="font-size: 11px; white-space: nowrap;">${new Date(a.dateCreation).toLocaleTimeString("fr-FR")}</td>
              <td><strong>${a.posteNom || a.posteId || 'Site'}</strong></td>
              <td><strong>${a.titre}</strong></td>
              <td style="font-size: 12px; max-width: 300px;">
                <div>${a.description}</div>
                ${a.commentaire ? `<div style="font-size: 11px; color: var(--color-primary); margin-top: 4px; font-style: italic;">Note : ${a.commentaire}</div>` : ''}
              </td>
              <td>${actionsHtml}</td>
            </tr>
          `;
        }).join("");
      }
    }

    if (tbodyRules) {
      tbodyRules.innerHTML = rules.map(r => `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700;">${r.code}</td>
          <td><strong>${r.nom}</strong></td>
          <td>${r.type}</td>
          <td style="font-family: var(--font-mono); font-weight: 700;">
            ${r.seuilVal !== undefined ? `${r.operateur || '>'} ${r.seuilVal}` : `${r.seuilSec} s`}
          </td>
          <td>${r.gravite}</td>
          <td><span class="status-pill status-ok">Active</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.editRuleModal('${r.id}')">✏️ Modifier Seuil</button>
          </td>
        </tr>
      `).join("");
    }

    window.ackAlert = (id) => this.openAckModal(id);
    window.closeAlert = (id) => this.openCloseModal(id);
    window.editRuleModal = (id) => this.openEditRuleModal(id);
  }

  static openAckModal(alertId) {
    if (!AuthManager.checkPermission("ack_alerts", "prendre en charge une alarme")) return;

    const modalContainer = document.getElementById("alert-modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Prise en Charge de l'Alarme</h3>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('alert-modal-container').innerHTML = ''">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13px; margin-bottom: 12px;">
              Veuillez consigner vos constatations ou les consignes d'intervention transmises à l'équipe de quart :
            </p>
            <div class="form-group">
              <label class="form-label">Commentaire d'Exploitation (Obligatoire) :</label>
              <textarea id="ack-comment" class="form-textarea" rows="3" placeholder="Ex: Électricien dépêché sur le Poste 4. Vérification du disjoncteur départ et de la liaison Modbus."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('alert-modal-container').innerHTML = ''">Annuler</button>
            <button class="btn btn-primary" id="btn-confirm-ack">Confirmer la Prise en Charge ✓</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-confirm-ack")?.addEventListener("click", () => {
      const comment = document.getElementById("ack-comment").value.trim();
      if (!comment) {
        alert("La saisie d'un commentaire est obligatoire pour la traçabilité SCADA.");
        return;
      }
      AlertManager.acknowledgeAlert(alertId, comment);
      modalContainer.innerHTML = "";
      this.updateView();
    });
  }

  static openCloseModal(alertId) {
    if (!AuthManager.checkPermission("ack_alerts", "clôturer une alarme")) return;

    const modalContainer = document.getElementById("alert-modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Clôture Définitive de l'Alarme</h3>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('alert-modal-container').innerHTML = ''">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13px; margin-bottom: 12px;">
              Confirmez le retour à des conditions d'exploitation normales :
            </p>
            <div class="form-group">
              <label class="form-label">Rapport de Résolution / Motif de Clôture :</label>
              <textarea id="close-comment" class="form-textarea" rows="3" placeholder="Ex: Câble réseau reconnecté, mesures Modbus reçues normalement, pas de récidive constatée."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('alert-modal-container').innerHTML = ''">Annuler</button>
            <button class="btn btn-primary" id="btn-confirm-close">Clôturer l'Alarme ✓</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-confirm-close")?.addEventListener("click", () => {
      const comment = document.getElementById("close-comment").value.trim();
      AlertManager.closeAlert(alertId, comment);
      modalContainer.innerHTML = "";
      this.updateView();
    });
  }

  static openEditRuleModal(ruleId) {
    if (!AuthManager.checkPermission("manage_alerts", "modifier un seuil d'alarme")) return;

    const rules = AlertManager.getRules();
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const modalContainer = document.getElementById("alert-modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Modifier la Règle [${rule.nom}]</h3>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('alert-modal-container').innerHTML = ''">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Valeur du Seuil de Déclenchement :</label>
              <input type="number" id="modal-rule-val" class="form-input" value="${rule.seuilVal !== undefined ? rule.seuilVal : rule.seuilSec}" step="0.05">
            </div>
            <div class="form-group">
              <label class="form-label">Niveau de Gravité :</label>
              <select id="modal-rule-grav" class="form-select">
                <option value="AVERTISSEMENT" ${rule.gravite === "AVERTISSEMENT" ? "selected" : ""}>Avertissement</option>
                <option value="CRITIQUE" ${rule.gravite === "CRITIQUE" ? "selected" : ""}>Critique</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('alert-modal-container').innerHTML = ''">Annuler</button>
            <button class="btn btn-primary" id="btn-save-rule">Enregistrer ✓</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-save-rule")?.addEventListener("click", () => {
      const newVal = Number(document.getElementById("modal-rule-val").value);
      const newGrav = document.getElementById("modal-rule-grav").value;
      
      const updateData = { gravite: newGrav };
      if (rule.seuilVal !== undefined) updateData.seuilVal = newVal;
      if (rule.seuilSec !== undefined) updateData.seuilSec = newVal;

      AlertManager.updateRule(ruleId, updateData);
      modalContainer.innerHTML = "";
      this.updateView();
      alert("Seuil modifié avec succès et consigné dans le journal d'audit.");
    });
  }

  static destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
