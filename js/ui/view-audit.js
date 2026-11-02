/**
 * view-audit.js - Journal d'Audit & Traçabilité des Actions Sensibles
 * Enregistrement immuable de toutes les modifications (seuils, IPE, SER, acquittements, utilisateurs)
 */

import { Store } from "../storage/store.js";

export class AuditView {
  static render(container) {
    this.container = container;
    const logs = Store.get("audit_logs", []);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h2 class="page-title">Journal d'Audit & Traçabilité des Actions Sensibles</h2>
          <p class="page-subtitle">Historique infalsifiable des modifications de seuils, calculs, acquittements et sessions</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <input type="text" id="audit-search" class="form-input" placeholder="🔍 Rechercher dans l'audit..." style="width: 250px;">
          <button class="btn btn-secondary" id="btn-export-audit">📥 Exporter CSV</button>
        </div>
      </div>

      <!-- TABLEAU DES LOGS D'AUDIT -->
      <div class="card">
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Horodatage (UTC)</th>
                <th>Opérateur</th>
                <th>Rôle</th>
                <th>Action Réalisée</th>
                <th>Cible / Équipement</th>
                <th>Valeur Avant</th>
                <th>Valeur Après</th>
              </tr>
            </thead>
            <tbody id="audit-tbody">
              ${this.renderLogRows(logs)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("audit-search")?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = logs.filter(l => 
        l.action.toLowerCase().includes(q) ||
        l.utilisateur.toLowerCase().includes(q) ||
        l.cible.toLowerCase().includes(q) ||
        l.valeurApres.toLowerCase().includes(q)
      );
      const tbody = document.getElementById("audit-tbody");
      if (tbody) tbody.innerHTML = this.renderLogRows(filtered);
    });

    document.getElementById("btn-export-audit")?.addEventListener("click", () => {
      let csv = "\uFEFFHorodatage;Utilisateur;Role;Action;Cible;Valeur Avant;Valeur Apres\r\n";
      for (const l of logs) {
        csv += `"${l.horodatage}";"${l.utilisateur}";"${l.role}";"${l.action}";"${l.cible}";"${l.valeurAvant}";"${l.valeurApres}"\r\n`;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SME_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  static renderLogRows(logs) {
    if (logs.length === 0) {
      return `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Aucun événement enregistré.</td></tr>`;
    }
    return logs.map(l => `
      <tr>
        <td style="font-size: 11px; font-family: var(--font-mono); white-space: nowrap;">
          ${new Date(l.horodatage).toLocaleString("fr-FR")}
        </td>
        <td><strong>${l.utilisateur}</strong></td>
        <td><span class="user-role-badge">${l.role}</span></td>
        <td><code style="font-weight: 700;">${l.action}</code></td>
        <td>${l.cible}</td>
        <td style="font-size: 11px; color: var(--text-muted); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${l.valeurAvant}
        </td>
        <td style="font-size: 11px; color: var(--color-primary); max-width: 250px;">
          ${l.valeurApres}
        </td>
      </tr>
    `).join("");
  }

  static destroy() {}
}
