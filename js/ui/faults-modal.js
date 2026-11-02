/**
 * faults-modal.js - Boîte de dialogue d'injection de pannes pour la démonstration
 * Permet de tester en direct la robustesse SCADA : coupure com, valeur aberrante,
 * donnée manquante, péremption et rattrapage de buffer sans doublon.
 */

import { Store } from "../storage/store.js";
import { FaultInjector } from "../simulation/faults.js";
import { simEngine } from "../simulation/engine.js";

export class FaultsModal {
  static open() {
    const meters = Store.get("meters", []);
    const activeFaults = FaultInjector.getFaults();
    const activeFaultCount = Object.keys(activeFaults).length;

    const modalDiv = document.createElement("div");
    modalDiv.id = "faults-modal-root";
    modalDiv.className = "modal-overlay";

    modalDiv.innerHTML = `
      <div class="modal-dialog" style="max-width: 650px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">⚡ Console d'Injection de Pannes & Défauts (Démonstration)</h3>
            <span class="card-subtitle">Testez en direct la réaction du système de supervision</span>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-close-faults">✕</button>
        </div>

        <div class="modal-body">
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
            Choisissez un compteur et injectez une anomalie pour observer le changement de statut en temps réel, le déclenchement des alarmes SCADA et le badge de fraîcheur.
          </p>

          <div class="form-group">
            <label class="form-label">Compteur Cible :</label>
            <select id="fault-meter-select" class="form-select">
              ${meters.map(m => {
                const hasFault = activeFaults[m.id];
                return `<option value="${m.id}">${m.code} — ${m.designation} (${m.posteId})${hasFault ? ` [DÉFAUT: ${hasFault.type}]` : ''}</option>`;
              }).join("")}
            </select>
          </div>

          <div class="grid-2" style="margin-bottom: 16px;">
            <button class="btn btn-secondary" id="btn-cut-com" style="border-color: var(--color-danger); color: var(--color-danger);">
              🔌 Coupure Com Modbus (Timeout > 30s)
            </button>
            <button class="btn btn-secondary" id="btn-aberrant" style="border-color: var(--color-warning); color: var(--color-warning);">
              📈 Valeur Aberrante (Pic 99 999 kW)
            </button>
            <button class="btn btn-secondary" id="btn-missing" style="border-color: var(--color-offline);">
              ⚠️ Donnée Manquante (Lacune)
            </button>
            <button class="btn btn-secondary" id="btn-stale" style="border-color: var(--color-offline);">
              ⏱️ Donnée Périmée (Gel horodatage)
            </button>
          </div>

          <!-- SECTION RATTRAPAGE SANS DOUBLON -->
          <div class="card" style="background: var(--bg-main); border: 1px dashed var(--color-primary); margin-bottom: 16px;">
            <div style="font-weight: 700; font-size: 13px; color: var(--color-primary); margin-bottom: 4px;">
              🔄 Démonstration : Reprise après coupure sans doublons
            </div>
            <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 10px;">
              Lors d'une reconnexion, le compteur déverse son tampon local. Le filtre anti-doublon certifie qu'aucun point n'est comptabilisé deux fois dans les séries temporelles.
            </p>
            <button class="btn btn-primary btn-sm" id="btn-replay-buffer">
              📥 Vidanger le Tampon du Compteur Cible (Rattrapage sans doublon)
            </button>
          </div>

          <!-- DÉFAUTS ACTIFS ACTUELLEMENT -->
          <div>
            <div style="font-weight: 700; font-size: 12px; margin-bottom: 6px;">
              Défauts actifs actuellement (${activeFaultCount}) :
            </div>
            <div style="background: var(--bg-input); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 11px;">
              ${activeFaultCount === 0 ? '<span style="color: var(--color-success);">Aucun défaut actif. Fonctionnement 100% nominal.</span>' : `
                <ul style="padding-left: 18px; margin: 0;">
                  ${Object.entries(activeFaults).map(([mId, f]) => `
                    <li><strong>${mId}</strong> : Type <code>${f.type}</code> (depuis ${new Date(f.startTime).toLocaleTimeString("fr-FR")}) - Buffer: ${f.buffer ? f.buffer.length : 0} pts</li>
                  `).join("")}
                </ul>
              `}
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: space-between;">
          <button class="btn btn-danger btn-sm" id="btn-clear-all-faults">🧹 Réinitialiser Tous les Défauts</button>
          <button class="btn btn-secondary" id="btn-close-faults-footer">Fermer</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);

    const closeFn = () => modalDiv.remove();
    document.getElementById("btn-close-faults")?.addEventListener("click", closeFn);
    document.getElementById("btn-close-faults-footer")?.addEventListener("click", closeFn);

    const getSelectedMeterId = () => document.getElementById("fault-meter-select").value;

    document.getElementById("btn-cut-com")?.addEventListener("click", () => {
      const mId = getSelectedMeterId();
      FaultInjector.toggleFault(mId, "COMM_CUT");
      closeFn();
      FaultsModal.open();
    });

    document.getElementById("btn-aberrant")?.addEventListener("click", () => {
      const mId = getSelectedMeterId();
      FaultInjector.toggleFault(mId, "ABERRANT");
      closeFn();
      FaultsModal.open();
    });

    document.getElementById("btn-missing")?.addEventListener("click", () => {
      const mId = getSelectedMeterId();
      FaultInjector.toggleFault(mId, "MISSING");
      closeFn();
      FaultsModal.open();
    });

    document.getElementById("btn-stale")?.addEventListener("click", () => {
      const mId = getSelectedMeterId();
      FaultInjector.toggleFault(mId, "STALE");
      closeFn();
      FaultsModal.open();
    });

    document.getElementById("btn-replay-buffer")?.addEventListener("click", () => {
      const mId = getSelectedMeterId();
      const hist = simEngine.getHistoryForMeter(mId);
      const res = FaultInjector.replayBufferWithoutDuplicates(mId, hist);
      alert(`Rattrapage terminé pour ${mId} :\n✓ Points réintégrés : ${res.replayedCount}\n✓ Doublons bloqués et éliminés : ${res.duplicatesBlocked}`);
      closeFn();
    });

    document.getElementById("btn-clear-all-faults")?.addEventListener("click", () => {
      FaultInjector.clearAllFaults();
      alert("Tous les défauts ont été supprimés.");
      closeFn();
    });
  }
}
