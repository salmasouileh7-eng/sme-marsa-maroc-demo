/**
 * view-cybersecurite.js - Page Cybersécurité, Fiabilité des données & Sauvegarde/Restauration
 * Analyse des risques Modbus TCP, mesures palliatives, cloisonnement réseau et gestion des sauvegardes.
 */

import { Store } from "../storage/store.js";
import { AuthManager } from "../auth/auth.js";

export class CybersecuriteView {
  static render(container) {
    this.container = container;

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 class="page-title">Cybersécurité Industrielle & Fiabilité des Données</h2>
        <p class="page-subtitle">Dispositifs de protection OT/IT, analyse des limites de Modbus TCP et gestion des sauvegardes</p>
      </div>

      <!-- SAUVEGARDE & RESTAURATION JSON -->
      <div class="card" style="border: 2px solid var(--color-primary); margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-title">💾 Sauvegarde & Restauration Complète du Système (JSON)</div>
          <div class="card-subtitle">Export/Import autonome en local (sans serveur)</div>
        </div>
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btn-export-backup" style="padding: 10px 18px;">
            📥 Exporter une Sauvegarde JSON
          </button>
          
          <label class="btn btn-secondary" style="padding: 10px 18px; cursor: pointer; margin-bottom: 0;">
            📤 Restaurer une Sauvegarde JSON
            <input type="file" id="file-import-backup" accept=".json" style="display: none;">
          </label>

          <button class="btn btn-danger" id="btn-reset-demo" style="padding: 10px 18px; margin-left: auto;">
            🔄 Réinitialiser la Démo (Valeurs Usine)
          </button>
        </div>
      </div>

      <!-- MATRICE DES VULNÉRABILITÉS MODBUS TCP & MESURES PALLIATIVES -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-title">🛡️ Analyse de Vulnérabilités Modbus TCP/IP & Architecture Défensive</div>
          <div class="card-subtitle">Directives de durcissement conformes aux recommandations ANSSI / DGSSI Maroc</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vulnérabilité Intrinsèque Modbus</th>
                <th>Risque pour le Port d'Agadir</th>
                <th>Mesure Technique Palliative Implémentée</th>
                <th>Efficacité</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Protocole en clair (non chiffré)</strong></td>
                <td>Écoute clandestine des puissances et télégrammes d'énergie.</td>
                <td>VLAN étanche dédié (VLAN 10 Mesure). Aucun routage direct vers le réseau bureautique ou Internet.</td>
                <td><span class="status-pill status-ok">Élevée</span></td>
              </tr>
              <tr>
                <td><strong>Absence d'authentification native</strong></td>
                <td>Injection de fausses trames ou spoofing d'unit ID esclave.</td>
                <td>Filtrage strict sur les switchs administrables par adresses MAC / IP fixes autorisées (Port Security 802.1X).</td>
                <td><span class="status-pill status-ok">Élevée</span></td>
              </tr>
              <tr>
                <td><strong>Déni de service (DoS par flood)</strong></td>
                <td>Saturation du buffer des centrales de mesure provoquant une perte de supervision.</td>
                <td>Rate-limiting sur le pare-feu industriel DMZ. Période de scrutation plafonnée à 5s.</td>
                <td><span class="status-pill status-ok">Moyenne</span></td>
              </tr>
              <tr>
                <td><strong>Dérive d'horloge temporelle</strong></td>
                <td>Incohérence des bilans horaires et contestation des pointes de facturation.</td>
                <td>Synchronisation horaire stricte par protocole NTP sécurisé sur horloge maître locale DEPA.</td>
                <td><span class="status-pill status-ok">Maximale</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MATRICE RBAC & CONTRÔLE D'ACCÈS -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Matrice des Privilèges RBAC (Moindre Privilège)</div>
            <div class="card-subtitle">Cloisonnement des fonctionnalités par rôle</div>
          </div>
          <table class="data-table" style="font-size: 11px;">
            <thead>
              <tr>
                <th>Fonctionnalité</th>
                <th>Admin</th>
                <th>Resp. Énergie</th>
                <th>Exploitant</th>
                <th>Lecteur</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Consultation Dashboard & Postes</td>
                <td>✓</td><td>✓</td><td>✓</td><td>✓</td>
              </tr>
              <tr>
                <td>Acquittement / Clôture Alarmes</td>
                <td>✓</td><td>✓</td><td>✓</td><td>✗</td>
              </tr>
              <tr>
                <td>Mise en Service Nouveau Compteur</td>
                <td>✓</td><td>✗</td><td>✓</td><td>✗</td>
              </tr>
              <tr>
                <td>Édition Formules IPE & Révision SER</td>
                <td>✓</td><td>✓</td><td>✗</td><td>✗</td>
              </tr>
              <tr>
                <td>Modification des Seuils d'Alarmes</td>
                <td>✓</td><td>✓</td><td>✗</td><td>✗</td>
              </tr>
              <tr>
                <td>Sauvegarde & Restauration Système</td>
                <td>✓</td><td>✗</td><td>✗</td><td>✗</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Garanties d'Intégrité & Immuabilité</div>
            <div class="card-subtitle">Conformité aux audits contradictoires ISO 50001</div>
          </div>
          <ul style="padding-left: 20px; font-size: 12px; line-height: 1.8; color: var(--text-primary);">
            <li><strong>Double Horodatage :</strong> Chaque mesure stocke distinctement l'instant de la mesure par le tore (source) et l'instant de réception par le superviseur.</li>
            <li><strong>Historique Infalsifiable :</strong> Tout acquittement ou clôture d'alarme est lié à l'identité du profil connecté avec note horodatée.</li>
            <li><strong>Filtre Anti-Doublon :</strong> Lors de la reprise après rupture de communication, les télégrammes réémis sont dédoublonnés sur clé primaire `(compteurId, horodatageMesure)`.</li>
            <li><strong>Zéro Requête Réseau Externe :</strong> L'application ne charge aucune ressource externe (zéro CDN, zéro telemetry externe, étanchéité totale).</li>
          </ul>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  static attachEvents() {
    // Export sauvegarde JSON
    document.getElementById("btn-export-backup")?.addEventListener("click", () => {
      if (!AuthManager.checkPermission("all", "exporter une sauvegarde")) return;

      const backupStr = Store.exportBackupJSON();
      const blob = new Blob([backupStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SME_MarsaMaroc_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Import restauration JSON
    document.getElementById("file-import-backup")?.addEventListener("change", (e) => {
      if (!AuthManager.checkPermission("all", "restaurer une sauvegarde")) return;

      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = Store.importBackupJSON(event.target.result);
        if (res.success) {
          alert("Sauvegarde restaurée avec succès ! L'application va se recharger.");
          window.location.reload();
        } else {
          alert(`Erreur de restauration : ${res.error}`);
        }
      };
      reader.readAsText(file);
    });

    // Réinitialisation de la démo
    document.getElementById("btn-reset-demo")?.addEventListener("click", () => {
      if (confirm("Attention : Voulez-vous vraiment réinitialiser toutes les données de la démo aux réglages d'usine ? Les modifications, pannes et alertes seront remises à zéro.")) {
        Store.resetToDefaults();
        alert("Démo réinitialisée avec succès aux valeurs d'usine !");
        window.location.reload();
      }
    });
  }

  static destroy() {}
}
