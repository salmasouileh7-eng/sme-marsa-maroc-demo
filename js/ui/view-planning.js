/**
 * view-planning.js - Planning d'Exécution & Diagramme de Gantt Interactif
 * Jalons de déploiement du projet SME Marsa Maroc (Port d'Agadir)
 */

export class PlanningView {
  static render(container) {
    this.container = container;

    const tasks = [
      { id: "J01", label: "Visite technique & inventaire des 6 postes", debut: 1, duree: 3, avancement: 100, responsable: "Chef de projet / DEPA" },
      { id: "J02", label: "Validation des études & architecture 7 couches", debut: 3, duree: 3, avancement: 100, responsable: "Bureau d'études / DSI" },
      { id: "J03", label: "Fourniture des centrales Classe 0.5S & tores", debut: 5, duree: 4, avancement: 100, responsable: "Adjudicataire" },
      { id: "J04", label: "Pose des compteurs & tirage des câbles blindés", debut: 8, duree: 5, avancement: 80, responsable: "Électriciens sous-station" },
      { id: "J05", label: "Paramétrage Modbus TCP & segmentation VLAN 10", debut: 12, duree: 3, avancement: 70, responsable: "Ingénieur Réseau OT" },
      { id: "J06", label: "Plateforme SME & intégration GTC existante", debut: 14, duree: 4, avancement: 65, responsable: "Intégrateur Logiciel" },
      { id: "J07", label: "Essais contradictoires de recette (T01-T15)", debut: 17, duree: 3, avancement: 40, responsable: "Comité de Recette DEPA" },
      { id: "J08", label: "Formation des exploitants & Resp. Énergie", debut: 19, duree: 2, avancement: 20, responsable: "Formateur Métrologie" },
      { id: "J09", label: "Marche à blanc 30j & Réception Provisoire", debut: 21, duree: 4, avancement: 0, responsable: "Direction Port Agadir" }
    ];

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 class="page-title">Planning Prévisionnel d'Exécution & Diagramme de Gantt</h2>
        <p class="page-subtitle">Déploiement sur 24 semaines (6 mois) — Jalons contractuels de l'appel d'offres n° 12/DEPA/2026</p>
      </div>

      <!-- BANDEAU EXEMPLE INDICATIF -->
      <div class="card" style="background: rgba(2, 132, 199, 0.08); border-left: 4px solid var(--color-primary); padding: 12px; margin-bottom: 16px;">
        <strong>NOTE DE CALENDRIER :</strong>
        Les durées et enchaînements ci-dessous constituent un <em>« Exemple indicatif réaliste conforme à l'article 11 du RC — à ajuster lors de l'établissement du Plan Assurance Qualité (PAQ) »</em>.
      </div>

      <!-- DIAGRAMME DE GANTT INTERACTIF SVG -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-title">Diagramme de Gantt — Déploiement des 6 Postes MT/BT (Semaines 1 à 24)</div>
          <div class="card-subtitle">Barres d'avancement réel vs prévisionnel</div>
        </div>

        <div style="overflow-x: auto; padding: 10px 0;">
          <svg viewBox="0 0 950 360" style="width: 100%; min-width: 750px; height: auto;">
            <!-- Axe temporel (Semaines 1 à 24) -->
            ${[...Array(25).keys()].slice(1).map(s => {
              const x = 320 + (s - 1) * 25;
              return `
                <line x1="${x}" y1="25" x2="${x}" y2="340" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="2,2" />
                <text x="${x}" y="20" fill="var(--text-muted)" font-size="9" text-anchor="middle" font-family="sans-serif">S${s}</text>
              `;
            }).join("")}

            <!-- Jalons / Tâches -->
            ${tasks.map((t, idx) => {
              const y = 40 + idx * 32;
              const startX = 320 + (t.debut - 1) * 25;
              const width = t.duree * 25;
              const progressWidth = (width * t.avancement) / 100;
              const isFinished = t.avancement === 100;

              return `
                <g>
                  <!-- Libellé de la tâche -->
                  <text x="10" y="${y + 14}" fill="var(--text-primary)" font-size="11" font-weight="600" font-family="sans-serif">
                    ${t.id} - ${t.label}
                  </text>

                  <!-- Barre de durée totale prévue -->
                  <rect x="${startX}" y="${y}" width="${width}" height="18" rx="4" fill="var(--bg-hover)" stroke="var(--border-color)" />

                  <!-- Barre d'avancement effectif -->
                  <rect x="${startX}" y="${y}" width="${progressWidth}" height="18" rx="4" fill="${isFinished ? 'var(--color-success)' : 'var(--color-primary)'}" />

                  <!-- Pourcentage -->
                  <text x="${startX + width + 8}" y="${y + 13}" fill="var(--text-muted)" font-size="10" font-family="sans-serif">
                    ${t.avancement}%
                  </text>
                </g>
              `;
            }).join("")}

            <!-- Ligne de date actuelle (Semaine 15) -->
            <line x1="670" y1="20" x2="670" y2="340" stroke="#ef4444" stroke-width="2" />
            <text x="670" y="355" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle" font-family="sans-serif">
              Aujourd'hui (S15)
            </text>
          </svg>
        </div>
      </div>

      <!-- TABLEAU DES JALONS ET RESPONSABILITÉS -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Matrice de Responsabilité des Jalons (RACI Indicatif)</div>
          <div class="card-subtitle">Coordination entre Marsa Maroc DEPA et l'adjudicataire</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Jalon</th>
                <th>Phase Contractuelle</th>
                <th>Semaines</th>
                <th>Responsable Principal</th>
                <th>Livrable Exigible</th>
                <th>Avancement</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(t => `
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 700;">${t.id}</td>
                  <td><strong>${t.label}</strong></td>
                  <td>S${t.debut} à S${t.debut + t.duree - 1}</td>
                  <td>${t.responsable}</td>
                  <td style="font-size: 11px; color: var(--text-secondary);">Rapport contradictoire / PV validé</td>
                  <td>
                    <span class="status-pill ${t.avancement === 100 ? 'status-ok' : t.avancement > 0 ? 'status-warning' : 'status-offline'}">
                      ${t.avancement}%
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  static destroy() {}
}
