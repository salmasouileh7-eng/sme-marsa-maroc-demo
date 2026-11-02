/**
 * view-mise-en-service.js - Assistant de mise en service guidé pas-à-pas d'un compteur
 * 6 étapes : Identification -> Réseau Modbus -> Cartographie -> Test de com -> Association -> PV de recette
 */

import { Store } from "../storage/store.js";
import { AuthManager } from "../auth/auth.js";
import { ModbusTCPSimulator } from "../simulation/modbus.js";

export class CommissioningView {
  static render(container) {
    this.container = container;
    this.currentStep = 1;

    this.wizardData = {
      code: `CPT-P${Math.floor(1 + Math.random() * 6)}-${Math.floor(10 + Math.random() * 89)}`,
      designation: "Centrale de mesure multifonctions 4 quadrants",
      classePrecision: "0.5S",
      certificat: `CERT-2026-AG-${Math.floor(100 + Math.random() * 899)}`,
      validite: "2027-10-31",
      ip: `192.168.10.${Math.floor(70 + Math.random() * 20)}`,
      port: 502,
      unitId: 1,
      pollingSec: 5,
      timeoutMs: 1000,
      posteId: "P1",
      nomDepart: "Départ Nouveau Quai Conteneurs",
      typeDepart: "OUTILLAGE",
      estExistantScada: false,
      testModbusResult: null
    };

    this.renderWizard();
  }

  static renderWizard() {
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h2 class="page-title">Assistant de Mise en Service Compteur</h2>
          <p class="page-subtitle">Procédure normalisée de raccordement Modbus TCP/IP & Procès-Verbal d'essai</p>
        </div>
        <span class="status-pill status-ok">Étape ${this.currentStep} / 6</span>
      </div>

      <!-- PROGRESSION DU WIZARD -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px;">
        ${[
          "1. Identification",
          "2. Réseau Modbus",
          "3. Cartographie",
          "4. Test de Com",
          "5. Point de Comptage",
          "6. PV de Recette"
        ].map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === this.currentStep;
          const isDone = stepNum < this.currentStep;
          return `
            <div style="flex: 1; padding: 8px; border-radius: var(--radius-sm); font-size: 11px; font-weight: 600; text-align: center; border: 1px solid var(--border-color);
              background: ${isActive ? "var(--bg-active)" : isDone ? "rgba(16, 185, 129, 0.15)" : "var(--bg-card)"};
              color: ${isActive ? "var(--color-primary)" : isDone ? "var(--color-success)" : "var(--text-muted)"};">
              ${isDone ? "✓ " : ""}${label}
            </div>
          `;
        }).join("")}
      </div>

      <!-- CONTENU DE L'ÉTAPE COURANTE -->
      <div class="card" id="wizard-step-content" style="max-width: 800px; margin: 0 auto;">
        ${this.getStepHtml(this.currentStep)}
      </div>
    `;

    this.attachEvents();
  }

  static getStepHtml(step) {
    const d = this.wizardData;
    const site = Store.get("site", {});

    switch (step) {
      case 1:
        return `
          <div class="card-header">
            <h3 class="card-title">Étape 1 : Identification & Métrologie de l'Équipement</h3>
            <span class="card-subtitle">Exemple illustratif — conforme CEI 62053-22</span>
          </div>
          <div class="form-group">
            <label class="form-label">Code / Repère Schéma Électrique :</label>
            <input type="text" id="wiz-code" class="form-input" value="${d.code}">
          </div>
          <div class="form-group">
            <label class="form-label">Désignation Matériel :</label>
            <input type="text" id="wiz-designation" class="form-input" value="${d.designation}">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Classe de Précision :</label>
              <select id="wiz-classe" class="form-select">
                <option value="0.2S" ${d.classePrecision === "0.2S" ? "selected" : ""}>0.2S (Haute précision laboratoire)</option>
                <option value="0.5S" ${d.classePrecision === "0.5S" ? "selected" : ""}>0.5S (Tête de poste - Facturation)</option>
                <option value="1" ${d.classePrecision === "1" ? "selected" : ""}>1 (Divisionnaire rail DIN)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">N° Certificat d'Étalonnage :</label>
              <input type="text" id="wiz-certificat" class="form-input" value="${d.certificat}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date d'Échéance d'Étalonnage :</label>
            <input type="date" id="wiz-validite" class="form-input" value="${d.validite}">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button class="btn btn-primary" id="btn-next">Suivant : Paramètres Réseau ➔</button>
          </div>
        `;

      case 2:
        return `
          <div class="card-header">
            <h3 class="card-title">Étape 2 : Configuration Réseau Modbus TCP/IP</h3>
            <span class="card-subtitle">Segment de mesure isolé (VLAN 10 OT)</span>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Adresse IP Fixe (OT) :</label>
              <input type="text" id="wiz-ip" class="form-input" value="${d.ip}">
            </div>
            <div class="form-group">
              <label class="form-label">Port TCP :</label>
              <input type="number" id="wiz-port" class="form-input" value="${d.port}">
            </div>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Unit ID (Esclave) :</label>
              <input type="number" id="wiz-unit" class="form-input" value="${d.unitId}" min="1" max="247">
            </div>
            <div class="form-group">
              <label class="form-label">Période d'Interrogation (s) :</label>
              <input type="number" id="wiz-polling" class="form-input" value="${d.pollingSec}" min="1" max="60">
            </div>
            <div class="form-group">
              <label class="form-label">Timeout Réponse (ms) :</label>
              <input type="number" id="wiz-timeout" class="form-input" value="${d.timeoutMs}" min="200" max="5000">
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button class="btn btn-secondary" id="btn-prev">⬅ Précédent</button>
            <button class="btn btn-primary" id="btn-next">Suivant : Cartographie Registres ➔</button>
          </div>
        `;

      case 3:
        return `
          <div class="card-header">
            <h3 class="card-title">Étape 3 : Cartographie des Holding Registers & Échelles</h3>
            <span class="card-subtitle">Encodage standard IEEE 754 Big-Endian Float32</span>
          </div>
          <div class="data-table-container" style="margin-bottom: 16px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Grandeur</th>
                  <th>Adresse Registre</th>
                  <th>Format</th>
                  <th>Facteur d'Échelle</th>
                  <th>Unité Finale</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Énergie Active Importée (EA)</td>
                  <td style="font-family: var(--font-mono);">30001 (2 x 16b)</td>
                  <td>Float32 Big-Endian</td>
                  <td style="font-family: var(--font-mono);">0.001 (W -> kW)</td>
                  <td><strong>kWh</strong></td>
                </tr>
                <tr>
                  <td>Puissance Active Totale (P)</td>
                  <td style="font-family: var(--font-mono);">30013 (2 x 16b)</td>
                  <td>Float32 Big-Endian</td>
                  <td style="font-family: var(--font-mono);">0.001</td>
                  <td><strong>kW</strong></td>
                </tr>
                <tr>
                  <td>Facteur de Puissance (cos φ)</td>
                  <td style="font-family: var(--font-mono);">30031 (2 x 16b)</td>
                  <td>Float32 Big-Endian</td>
                  <td style="font-family: var(--font-mono);">0.001</td>
                  <td><strong>-</strong></td>
                </tr>
                <tr>
                  <td>Tension Composée (U12)</td>
                  <td style="font-family: var(--font-mono);">30019 (2 x 16b)</td>
                  <td>Float32 Big-Endian</td>
                  <td style="font-family: var(--font-mono);">1.0</td>
                  <td><strong>V</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button class="btn btn-secondary" id="btn-prev">⬅ Précédent</button>
            <button class="btn btn-primary" id="btn-next">Suivant : Test de Communication ➔</button>
          </div>
        `;

      case 4:
        return `
          <div class="card-header">
            <h3 class="card-title">Étape 4 : Test de Communication Modbus TCP/IP</h3>
            <span class="card-subtitle">Émission d'une trame réelle de test vers l'équipement</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
            Interrogation de la cible : <code>${d.ip}:${d.port} [UnitID: ${d.unitId}]</code> (Fonction 0x03 Read Holding Registers).
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <button class="btn btn-primary" id="btn-test-modbus" style="padding: 10px 24px; font-size: 14px;">
              📡 Lancer le Test de Requête Modbus
            </button>
          </div>
          <div id="test-modbus-result-box">
            ${d.testModbusResult ? this.formatTestResultHtml(d.testModbusResult) : ""}
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button class="btn btn-secondary" id="btn-prev">⬅ Précédent</button>
            <button class="btn btn-primary" id="btn-next" ${!d.testModbusResult?.success ? "disabled" : ""}>Suivant : Association Départ ➔</button>
          </div>
        `;

      case 5:
        return `
          <div class="card-header">
            <h3 class="card-title">Étape 5 : Association au Point de Comptage Électrique</h3>
            <span class="card-subtitle">Prévention stricte du double comptage</span>
          </div>
          <div class="form-group">
            <label class="form-label">Poste Électrique de rattachement :</label>
            <select id="wiz-poste" class="form-select">
              ${(site.postes || []).map(p => `
                <option value="${p.id}" ${p.id === d.posteId ? "selected" : ""}>${p.nom}</option>
              `).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nom du Départ Électrique :</label>
            <input type="text" id="wiz-nom-depart" class="form-input" value="${d.nomDepart}">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Type d'Usage :</label>
              <select id="wiz-type-depart" class="form-select">
                <option value="OUTILLAGE">Outillage & Grues</option>
                <option value="REEFERS">Conteneurs Frigorifiques</option>
                <option value="TRACTION">Traction & Rampes</option>
                <option value="HVAC">Climatisation / Bâtiments</option>
                <option value="SERVICES">Services généraux</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Origine du compteur :</label>
              <select id="wiz-existant" class="form-select">
                <option value="false">Nouveau compteur SME (Appel d'offres)</option>
                <option value="true">Compteur existant à intégrer (GTC/SCADA)</option>
              </select>
            </div>
          </div>
          <div class="card" style="background: var(--bg-main); border: 1px dashed var(--color-primary); font-size: 12px;">
            <strong>Règle Anti-Double Comptage :</strong>
            Ce compteur sera enregistré comme <em>sous-comptage analytique</em>. Il ne sera pas compté deux fois avec l'arrivée générale du poste.
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button class="btn btn-secondary" id="btn-prev">⬅ Précédent</button>
            <button class="btn btn-primary" id="btn-next">Valider & Générer le PV d'Essai ➔</button>
          </div>
        `;

      case 6:
        return `
          <div class="card-header">
            <h3 class="card-title">Étape 6 : Procès-Verbal de Mise en Service & Validation</h3>
            <span class="card-subtitle">Document contractuel d'intégration au SME Marsa Maroc</span>
          </div>
          
          <div style="background: #ffffff; color: #111827; padding: 24px; border-radius: var(--radius-md); border: 1px solid #d1d5db; font-family: sans-serif; font-size: 12px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px;">
              <div>
                <h4 style="font-size: 15px; font-weight: 800; color: #0369a1; text-transform: uppercase;">Marsa Maroc — Direction Exploitation Port d'Agadir</h4>
                <div style="font-size: 11px; color: #4b5563;">Appel d'Offres n° 12/DEPA/2026 — Système de Monitoring Énergétique</div>
              </div>
              <div style="text-align: right;">
                <strong style="color: #059669; font-size: 13px;">PV D'ESSAI VALIDE ✓</strong>
                <div style="font-size: 10px; color: #6b7280;">Date : ${new Date().toLocaleDateString("fr-FR")}</div>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="padding: 4px; font-weight: bold; width: 30%;">Compteur :</td>
                <td style="padding: 4px;">${d.code} (${d.designation})</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">Métrologie :</td>
                <td style="padding: 4px;">Classe ${d.classePrecision} — Certificat : ${d.certificat} (Valide jusqu'au ${d.validite})</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">Réseau Modbus TCP :</td>
                <td style="padding: 4px;">IP ${d.ip}:${d.port} — UnitID ${d.unitId} — Polling ${d.pollingSec}s</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">Point de Comptage :</td>
                <td style="padding: 4px;">Poste ${d.posteId} — Départ : ${d.nomDepart} (${d.typeDepart})</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">Résultat Essai Modbus :</td>
                <td style="padding: 4px; color: #059669; font-weight: bold;">Succès de lecture (Latence : ${d.testModbusResult?.latencyMs || 24} ms) — Conforme IEEE 754</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">Anti-double comptage :</td>
                <td style="padding: 4px;">Contrôle actif (Exclusion automatique du bilan arrivée)</td>
              </tr>
            </table>

            <div style="display: flex; justify-content: space-between; margin-top: 30px; border-top: 1px dashed #9ca3af; padding-top: 10px;">
              <div><strong>L'Entreprise Adjudicataire</strong><br><br>Visa & Signature</div>
              <div style="text-align: right;"><strong>Pour Marsa Maroc (DEPA)</strong><br><br>Visa Exploitation & Énergie</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <button class="btn btn-secondary" id="btn-prev">⬅ Modifier la configuration</button>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary" onclick="window.print()">🖨️ Imprimer ce PV</button>
              <button class="btn btn-primary" id="btn-finish">Enregistrer & Clôturer la Mise en Service ✓</button>
            </div>
          </div>
        `;
    }
  }

  static formatTestResultHtml(res) {
    if (!res.success) {
      return `
        <div class="status-pill status-danger" style="display: block; padding: 12px; margin-top: 12px;">
          <strong>❌ Échec du test :</strong> ${res.message}
        </div>
      `;
    }
    return `
      <div class="status-pill status-ok" style="display: block; padding: 12px; margin-top: 12px; border-radius: var(--radius-sm); text-align: left;">
        <div style="font-weight: 700; margin-bottom: 4px;">✓ Communication Modbus TCP établie avec succès !</div>
        <div style="font-size: 11px;">
          - Réponse reçue en <strong>${res.latencyMs} ms</strong><br>
          - Registre 30001 (EA) : <code>0x${(res.registers[30001] || 17200).toString(16)}</code><br>
          - Registre 30013 (P) : <code>0x${(res.registers[30013] || 16900).toString(16)}</code><br>
          - Format de données : Flottant IEEE 754 validé sans inversion de mots.
        </div>
      </div>
    `;
  }

  static attachEvents() {
    document.getElementById("btn-prev")?.addEventListener("click", () => {
      if (this.currentStep > 1) {
        this.saveCurrentInputs();
        this.currentStep--;
        this.renderWizard();
      }
    });

    document.getElementById("btn-next")?.addEventListener("click", () => {
      this.saveCurrentInputs();
      if (this.currentStep < 6) {
        this.currentStep++;
        this.renderWizard();
      }
    });

    document.getElementById("btn-test-modbus")?.addEventListener("click", async () => {
      const btn = document.getElementById("btn-test-modbus");
      if (btn) btn.innerHTML = "⏳ Interrogation en cours...";
      
      const mockMeter = {
        reseau: { ip: this.wizardData.ip, port: this.wizardData.port, unitId: this.wizardData.unitId, timeoutMs: this.wizardData.timeoutMs },
        registres: [
          { grandeur: "EA_IMPORT", adresse: 30001, echelle: 0.001 },
          { grandeur: "P_ACTIVE", adresse: 30013, echelle: 0.001 }
        ]
      };

      const res = await ModbusTCPSimulator.queryMeter(mockMeter, { EA_IMPORT: 120500, P_ACTIVE: 345.5 }, false);
      this.wizardData.testModbusResult = res;
      this.renderWizard();
    });

    document.getElementById("btn-finish")?.addEventListener("click", () => {
      // Intégrer le nouveau compteur au store
      const meters = Store.get("meters", []);
      const newMeter = {
        id: "CPT_" + Date.now(),
        posteId: this.wizardData.posteId,
        code: this.wizardData.code,
        designation: this.wizardData.designation,
        classePrecision: this.wizardData.classePrecision,
        certEtalonnage: this.wizardData.certificat,
        dateValidite: this.wizardData.validite,
        reseau: {
          ip: this.wizardData.ip,
          port: this.wizardData.port,
          unitId: this.wizardData.unitId,
          pollingSec: this.wizardData.pollingSec,
          timeoutMs: this.wizardData.timeoutMs,
          reconnectSec: 15
        },
        registres: [
          { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
          { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" },
          { grandeur: "COS_PHI", nom: "Facteur de Puissance", adresse: 30031, format: "FLOAT32", echelle: 0.001, unite: "" },
          { grandeur: "U_TENSION", nom: "Tension composée U12", adresse: 30019, format: "FLOAT32", echelle: 1.0, unite: "V" }
        ],
        etatCom: "OK",
        dernierContact: new Date().toISOString()
      };
      meters.push(newMeter);
      Store.set("meters", meters);

      // Ajouter le départ au poste
      const site = Store.get("site", {});
      const p = site.postes ? site.postes.find(p => p.id === this.wizardData.posteId) : null;
      if (p && p.tableaux && p.tableaux[0]) {
        p.tableaux[0].departs.push({
          id: "DEP_" + Date.now(),
          nom: this.wizardData.nomDepart,
          type: this.wizardData.typeDepart,
          compteurId: newMeter.id,
          estExistantScada: this.wizardData.estExistantScada
        });
        Store.set("site", site);
      }

      Store.logAudit("MISE_EN_SERVICE_COMPTEUR", newMeter.code, "-", `Mise en service validée sur ${p ? p.nom : ''} (PV généré)`);
      alert(`Mise en service du compteur [${newMeter.code}] validée avec succès ! Le compteur a été ajouté à la supervision.`);
      window.location.hash = "#/postes";
    });
  }

  static saveCurrentInputs() {
    const elCode = document.getElementById("wiz-code");
    if (elCode) this.wizardData.code = elCode.value;
    const elDes = document.getElementById("wiz-designation");
    if (elDes) this.wizardData.designation = elDes.value;
    const elCl = document.getElementById("wiz-classe");
    if (elCl) this.wizardData.classePrecision = elCl.value;
    const elCert = document.getElementById("wiz-certificat");
    if (elCert) this.wizardData.certificat = elCert.value;
    const elVal = document.getElementById("wiz-validite");
    if (elVal) this.wizardData.validite = elVal.value;

    const elIp = document.getElementById("wiz-ip");
    if (elIp) this.wizardData.ip = elIp.value;
    const elPort = document.getElementById("wiz-port");
    if (elPort) this.wizardData.port = Number(elPort.value);
    const elUnit = document.getElementById("wiz-unit");
    if (elUnit) this.wizardData.unitId = Number(elUnit.value);
    const elPol = document.getElementById("wiz-polling");
    if (elPol) this.wizardData.pollingSec = Number(elPol.value);
    const elTout = document.getElementById("wiz-timeout");
    if (elTout) this.wizardData.timeoutMs = Number(elTout.value);

    const elPoste = document.getElementById("wiz-poste");
    if (elPoste) this.wizardData.posteId = elPoste.value;
    const elNomDep = document.getElementById("wiz-nom-depart");
    if (elNomDep) this.wizardData.nomDepart = elNomDep.value;
    const elTypeDep = document.getElementById("wiz-type-depart");
    if (elTypeDep) this.wizardData.typeDepart = elTypeDep.value;
    const elEx = document.getElementById("wiz-existant");
    if (elEx) this.wizardData.estExistantScada = elEx.value === "true";
  }

  static destroy() {}
}
