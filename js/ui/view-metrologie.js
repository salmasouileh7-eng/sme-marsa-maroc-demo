/**
 * view-metrologie.js - Équipements, Métrologie & Fiches Techniques Compteurs
 * Conforme aux normes CEI 62053-22 (0.5S) et CEI 62053-21 (Classe 1).
 */

import { Store } from "../storage/store.js";
import { MetrologyEngine } from "../calculs/metrologie.js";

export class MetrologieView {
  static render(container) {
    this.container = container;
    const meters = Store.get("meters", []);

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 class="page-title">Équipements, Métrologie & Étalonnage</h2>
        <p class="page-subtitle">Fiches techniques des compteurs, classes de précision, conformité CE et traçabilité des certificats</p>
      </div>

      <!-- BANDEAU DE RÉSERVE TECHNIQUE -->
      <div class="card" style="background: rgba(2, 132, 199, 0.08); border-left: 4px solid var(--color-primary); padding: 12px; margin-bottom: 16px;">
        <strong>NOTE TECHNIQUE APPEL D'OFFRES :</strong>
        Les fiches techniques et références ci-dessous représentent des <em>« Exemples illustratifs conformes au CPS — à remplacer par les fiches techniques des constructeurs de l'offre retenue »</em>.
      </div>

      <!-- FICHES DES 3 TYPES D'ÉQUIPEMENTS TYPES -->
      <div class="grid-3" style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <div>
              <span style="font-size: 10px; font-weight: 700; color: var(--color-primary); text-transform: uppercase;">Type A : Tête de Poste</span>
              <h4 style="font-size: 13px; font-weight: 700; margin-top: 2px;">Centrale Multifonctions 4Q</h4>
            </div>
            <span class="status-pill status-ok">Classe 0.5S</span>
          </div>
          <table class="data-table" style="font-size: 11px;">
            <tbody>
              <tr><td>Norme :</td><td><strong>CEI 62053-22</strong></td></tr>
              <tr><td>Classe Énergie Active :</td><td><strong>0.5S (Facturation)</strong></td></tr>
              <tr><td>Classe Énergie Réactive :</td><td>Classe 2 (CEI 62053-23)</td></tr>
              <tr><td>Entrées Mesure :</td><td>3x 100-400V / 5A (TC)</td></tr>
              <tr><td>Harmoniques THD :</td><td>Rang 1 à 63 (U et I)</td></tr>
              <tr><td>Communication :</td><td>Modbus TCP / RJ45 10/100</td></tr>
              <tr><td>Certification :</td><td>CE / Traçabilité LPEE</td></tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <span style="font-size: 10px; font-weight: 700; color: var(--color-modbus); text-transform: uppercase;">Type B : Départs Divisionnaires</span>
              <h4 style="font-size: 13px; font-weight: 700; margin-top: 2px;">Compteur Rail DIN Triphasé</h4>
            </div>
            <span class="status-pill status-ok">Classe 1</span>
          </div>
          <table class="data-table" style="font-size: 11px;">
            <tbody>
              <tr><td>Norme :</td><td><strong>CEI 62053-21</strong></td></tr>
              <tr><td>Classe Énergie Active :</td><td><strong>Classe 1 (Sous-comptage)</strong></td></tr>
              <tr><td>Montage :</td><td>Rail DIN symétrique (4 modules)</td></tr>
              <tr><td>Raccordement :</td><td>Direct 65A ou indirect TC</td></tr>
              <tr><td>Communication :</td><td>RS485 Modbus RTU / Passerelle</td></tr>
              <tr><td>Certification :</td><td>CE / Directive MID</td></tr>
              <tr><td>Précision fréquence :</td><td>± 0.02 Hz</td></tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <span style="font-size: 10px; font-weight: 700; color: var(--color-warning); text-transform: uppercase;">Type C : Capteurs de Courant</span>
              <h4 style="font-size: 13px; font-weight: 700; margin-top: 2px;">Transformateurs de Courant (TC)</h4>
            </div>
            <span class="status-pill status-ok">Classe 0.5</span>
          </div>
          <table class="data-table" style="font-size: 11px;">
            <tbody>
              <tr><td>Type :</td><td><strong>Tores ouvrants (pose sans coupure)</strong></td></tr>
              <tr><td>Norme :</td><td><strong>CEI 61869-2</strong></td></tr>
              <tr><td>Rapports nominaux :</td><td>400/5A à 2000/5A</td></tr>
              <tr><td>Puissance de précision :</td><td>5 VA à 15 VA</td></tr>
              <tr><td>Tension d'isolement :</td><td>0.72 / 3 kV</td></tr>
              <tr><td>Fixation :</td><td>Sur jeu de barres ou câbles MT</td></tr>
              <tr><td>Sécurité :</td><td>Protection surtension secondaire</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABLEAU DE CONTRÔLE DES 18 COMPTEURS ET DE LEUR ÉTALONNAGE -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Inventaire Métrologique des 18 Centrales de Mesure Déployées</div>
          <div class="card-subtitle">Vérification de la validité des certificats d'étalonnage</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Désignation & Emplacement</th>
                <th>Poste</th>
                <th>Classe Précision</th>
                <th>Conformité CEI</th>
                <th>N° Certificat Étalonnage</th>
                <th>Date Validité</th>
                <th>Statut Métrologique</th>
              </tr>
            </thead>
            <tbody>
              ${meters.map(m => {
                const compliance = MetrologyEngine.checkPrecisionCompliance(m.classePrecision, m.code.includes("01") ? "ARRIVEE" : "DEPART");
                const isExpired = new Date(m.dateValidite) < new Date();
                return `
                  <tr>
                    <td style="font-family: var(--font-mono); font-weight: 700;">${m.code}</td>
                    <td><strong>${m.designation}</strong></td>
                    <td>Poste ${m.posteId}</td>
                    <td><span class="status-pill status-ok">${m.classePrecision}</span></td>
                    <td style="font-size: 11px;">${compliance.norme} (${compliance.conforme ? '✓ Conforme' : '✗ Non conforme'})</td>
                    <td style="font-family: var(--font-mono);">${m.certEtalonnage}</td>
                    <td style="font-family: var(--font-mono);">${m.dateValidite}</td>
                    <td>
                      <span class="status-pill ${isExpired ? 'status-danger' : 'status-ok'}">
                        <span class="status-dot"></span>${isExpired ? 'Étalonnage Échu' : 'Certifié Valide'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  static destroy() {}
}
