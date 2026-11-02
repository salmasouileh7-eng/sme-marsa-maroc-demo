/**
 * view-formation.js - Programme de Formation (Section 9 CPS) & Quiz Interactif Exploitant
 */

export class FormationView {
  static render(container) {
    this.container = container;
    this.score = null;

    const quizQuestions = [
      {
        q: "1. En cas de perte de communication Modbus sur un compteur tête de poste, quelle est la règle d'intégrité de la mesure ?",
        options: [
          "Remplacer immédiatement la valeur par zéro sans alerter.",
          "Requalifier la mesure en « ABSENTE » puis « PÉRIMÉE » sans l'afficher faussement comme temps réel.",
          "Extrapoler indéfiniment la dernière valeur en masquant l'incident."
        ],
        correct: 1,
        explication: "Règle absolue d'honnêteté industrielle : Ne jamais présenter une donnée ancienne comme temps réel."
      },
      {
        q: "2. Dans le calcul du bilan énergétique d'un poste électrique, comment évite-t-on le double comptage ?",
        options: [
          "En additionnant le compteur arrivée et tous les sous-compteurs divisionnaires.",
          "En ne sommant que les arrivées transformateurs exclusives pour le bilan du poste.",
          "En divisant l'énergie totale par le nombre de départs."
        ],
        correct: 1,
        explication: "Le sous-comptage divisionnaire est analytique et ne doit jamais être additionné à la mesure de tête."
      },
      {
        q: "3. Quelle est la valeur minimale contractuelle du facteur de puissance (cos φ) pour éviter les pénalités d'énergie réactive ONEE ?",
        options: [
          "cos φ ≥ 0.70",
          "cos φ ≥ 0.85",
          "cos φ ≥ 0.99"
        ],
        correct: 1,
        explication: "En deçà de 0.85, les pénalités pour consommation excessive d'énergie réactive s'appliquent."
      },
      {
        q: "4. Pourquoi le réseau de mesure Modbus TCP (VLAN 10) doit-il être strictement cloisonné du réseau bureautique ?",
        options: [
          "Parce que Modbus TCP est un protocole non chiffré et sans authentification native.",
          "Uniquement pour économiser la bande passante Internet.",
          "Parce que les câbles électriques interfèrent avec le WiFi."
        ],
        correct: 0,
        explication: "Modbus TCP circule en clair : une isolation stricte en VLAN et filtrage pare-feu est indispensable."
      }
    ];

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 class="page-title">Programme de Formation & Quiz Exploitant</h2>
        <p class="page-subtitle">Conforme à la section 9 du cahier des charges — Transfert de compétences aux équipes Marsa Maroc</p>
      </div>

      <!-- MODULES PÉDAGOGIQUES -->
      <div class="grid-3" style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <div>
              <span style="font-size: 10px; font-weight: 700; color: var(--color-primary); text-transform: uppercase;">Module 1 (2 Jours)</span>
              <h4 style="font-size: 14px; font-weight: 700; margin-top: 2px;">Exploitation & Supervision SCADA</h4>
            </div>
            <span class="status-pill status-ok">Exploitants</span>
          </div>
          <ul style="padding-left: 18px; font-size: 12px; line-height: 1.8; color: var(--text-primary);">
            <li>Navigation dans l'IHM et interprétation des synoptiques.</li>
            <li>Gestion du cycle de vie des alarmes et acquittements.</li>
            <li>Diagnostic rapide des ruptures de communication Modbus.</li>
            <li>Édition et interprétation des fiches d'incidents.</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <span style="font-size: 10px; font-weight: 700; color: var(--color-warning); text-transform: uppercase;">Module 2 (3 Jours)</span>
              <h4 style="font-size: 14px; font-weight: 700; margin-top: 2px;">Management ISO 50001 (IPE & SER)</h4>
            </div>
            <span class="status-pill status-ok">Resp. Énergie</span>
          </div>
          <ul style="padding-left: 18px; font-size: 12px; line-height: 1.8; color: var(--text-primary);">
            <li>Définition mathématique des indicateurs IPE (ISO 50006).</li>
            <li>Ajustement et révision de la baseline de référence (SER).</li>
            <li>Analyse des dérives de consommation et courbes CUSUM.</li>
            <li>Préparation des revues énergétiques annuelles.</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <span style="font-size: 10px; font-weight: 700; color: var(--color-danger); text-transform: uppercase;">Module 3 (2 Jours)</span>
              <h4 style="font-size: 14px; font-weight: 700; margin-top: 2px;">Administration, Métrologie & Sécurité</h4>
            </div>
            <span class="status-pill status-ok">Admin / DSI</span>
          </div>
          <ul style="padding-left: 18px; font-size: 12px; line-height: 1.8; color: var(--text-primary);">
            <li>Procédure pas-à-pas de mise en service de nouveaux compteurs.</li>
            <li>Contrôle de conformité métrologique et validité étalonnage.</li>
            <li>Gestion des sauvegardes, restaurations et du journal d'audit.</li>
            <li>Sécurisation du réseau OT (VLAN et règles pare-feu).</li>
          </ul>
        </div>
      </div>

      <!-- QUIZ D'ÉVALUATION INTERACTIF -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📝 Test d'Auto-Évaluation des Exploitants (Quiz Court)</div>
          <div class="card-subtitle">Vérification de l'appropriation des principes fondamentaux</div>
        </div>

        <div id="quiz-form">
          ${quizQuestions.map((q, qIdx) => `
            <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
              <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">${q.q}</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${q.options.map((opt, optIdx) => `
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                    <input type="radio" name="quiz_q_${qIdx}" value="${optIdx}">
                    <span>${opt}</span>
                  </label>
                `).join("")}
              </div>
              <div id="quiz-feedback-${qIdx}" style="margin-top: 8px; font-size: 11px; display: none;"></div>
            </div>
          `).join("")}

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button class="btn btn-primary" id="btn-submit-quiz">Valider mes Réponses ✓</button>
            <div id="quiz-score-badge"></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-submit-quiz")?.addEventListener("click", () => {
      let score = 0;
      quizQuestions.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="quiz_q_${idx}"]:checked`);
        const feedbackEl = document.getElementById(`quiz-feedback-${idx}`);
        if (!feedbackEl) return;

        feedbackEl.style.display = "block";
        if (selected && Number(selected.value) === q.correct) {
          score++;
          feedbackEl.className = "status-pill status-ok";
          feedbackEl.innerHTML = `✓ Exact ! ${q.explication}`;
        } else {
          feedbackEl.className = "status-pill status-danger";
          feedbackEl.innerHTML = `✗ Réponse incorrecte. ${q.explication}`;
        }
      });

      const scoreBadge = document.getElementById("quiz-score-badge");
      if (scoreBadge) {
        const isSuccess = score >= 3;
        scoreBadge.innerHTML = `
          <span class="status-pill ${isSuccess ? 'status-ok' : 'status-danger'}" style="font-size: 13px; padding: 6px 12px;">
            Score obtenu : <strong>${score} / ${quizQuestions.length}</strong> (${isSuccess ? 'Attestation d\'aptitude délivrée ✓' : 'Révision conseillée'})
          </span>
        `;
      }
    });
  }

  static destroy() {}
}
