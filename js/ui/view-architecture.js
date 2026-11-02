/**
 * view-architecture.js - Schéma d'architecture technique interactive des 7 couches
 * et représentation vectorielle SVG du cloisonnement réseau OT / IT.
 */

export class ArchitectureView {
  static render(container) {
    this.container = container;
    this.selectedLayer = 1;

    const layersData = [
      {
        id: 1,
        title: "Couche 1 : Terrain & Capteurs Métrologiques",
        color: "#059669",
        subtitle: "Mesure physique haute précision 4 quadrants",
        components: ["Transformateurs de Courant (TC ouvrants classe 0.5)", "Transformateurs de Tension (TT MT/BT)", "Tores de détection de courant de fuite", "Centrales de mesure multifonctions"],
        description: "Implantation au niveau des 6 postes électriques MT/BT. Prélèvement des courants et tensions triphasées avec certification d'étalonnage contradictoire."
      },
      {
        id: 2,
        title: "Couche 2 : Communication Industrielle Modbus TCP/IP",
        color: "#0284c7",
        subtitle: "Transmission temps réel sur bus de terrain et Ethernet",
        components: ["Bus RS-485 bifilaire blindé (EIA-485)", "Passerelles industrielles Modbus RTU vers Modbus TCP", "Port standard 502 / Unit ID esclaves", "Commutateurs durcis (Switches rail DIN)"],
        description: "Transport des trames Modbus TCP. Période de scrutation nominale de 5 secondes, détection de timeout et reconnexion automatique avec tampon local."
      },
      {
        id: 3,
        title: "Couche 3 : Acquisition & Normalisation",
        color: "#0891b2",
        subtitle: "Agrégation des flux télémétriques et horodatage",
        components: ["Serveurs d'acquisition redondés", "Passerelle OPC-UA / Modbus", "Synchronisation horaire NTP (Serveur maître DEPA)", "Buffer de rattrapage après rupture"],
        description: "Réception des trames, conversion des registres flottants IEEE 754 Big-Endian, application des facteurs d'échelle et double horodatage (mesure vs réception)."
      },
      {
        id: 4,
        title: "Couche 4 : Données & Intégrité",
        color: "#4f46e5",
        subtitle: "Stockage persistant, contrôle qualité et anti-doublon",
        components: ["Base de données séries temporelles (Time Series)", "Moteur de qualification (OK, Absente, Invalide, Périmée)", "Filtre anti-doublon d'horodatage", "Sauvegarde quotidienne sécurisée"],
        description: "Contrôle de l'intégrité et de la fraîcheur des données. Élimination des valeurs aberrantes avant injection dans les calculs énergétiques."
      },
      {
        id: 5,
        title: "Couche 5 : Métier Énergétique (ISO 50001 / ISO 50006)",
        color: "#d97706",
        subtitle: "Intelligence énergétique et calcul des bilans",
        components: ["Contrôle certifié Anti-Double Comptage", "Moteur de calcul des Indicateurs IPE", "Modélisation SER (Baseline multi-variables)", "Moteur d'alarmes sur seuils et dérives"],
        description: "Application stricte de la règle de sommation exclusive des arrivées. Calcul des ratios d'intensité énergétique (kWh/EVP, kWh/Tonne) et écart CUSUM."
      },
      {
        id: 6,
        title: "Couche 6 : Présentation & Restitution SCADA",
        color: "#ea580c",
        subtitle: "Interface web de supervision industrielle temps réel",
        components: ["IHM Web responsive SCADA (Thème clair/sombre)", "Tableaux de bord synoptiques temps réel", "Console d'acquittement des alarmes", "Assistant guidé de mise en service"],
        description: "Restitution ergonomique pour les exploitants et auditeurs. Badges de fraîcheur temporelle et contrôles d'accès basés sur les rôles (RBAC)."
      },
      {
        id: 7,
        title: "Couche 7 : Exploitation & Gouvernance Portuaire",
        color: "#dc2626",
        subtitle: "Décisions stratégiques et comités énergie Marsa Maroc",
        components: ["Postes opérateurs de quart (DEPA)", "Bureaux du Responsable Énergie ISO 50001", "Génération des rapports officiels PDF/CSV", "Direction de l'Exploitation du Port d'Agadir"],
        description: "Pilotage continu de la trajectoire de décarbonation du Port d'Agadir, suivi des plans d'actions d'efficacité énergétique et audits ISO 50001."
      }
    ];

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 class="page-title">Architecture Système en 7 Couches & Cloisonnement Réseau</h2>
        <p class="page-subtitle">Modèle architectural complet conforme aux spécifications d'interopérabilité et de cybersécurité</p>
      </div>

      <div class="grid-2">
        <!-- SCHÉMA INTERACTIF SVG 7 COUCHES -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Schéma Fonctionnel des 7 Couches (Cliquer pour inspecter)</div>
            <div class="card-subtitle">De la mesure physique terrain aux décisions stratégiques</div>
          </div>
          <div style="text-align: center; padding: 10px 0;">
            <svg viewBox="0 0 500 440" style="width: 100%; max-height: 400px; cursor: pointer;" id="svg-architecture">
              ${layersData.map((layer, idx) => {
                const y = 20 + idx * 56;
                const isSelected = layer.id === this.selectedLayer;
                return `
                  <g class="svg-layer" data-layer-id="${layer.id}">
                    <rect x="25" y="${y}" width="450" height="46" rx="6" 
                          fill="${layer.color}" fill-opacity="${isSelected ? '0.9' : '0.2'}" 
                          stroke="${layer.color}" stroke-width="${isSelected ? '3' : '1.5'}" />
                    <text x="45" y="${y + 28}" fill="#ffffff" font-size="13" font-weight="700" font-family="sans-serif">
                      ${layer.id}. ${layer.title.split(":")[1]}
                    </text>
                    <text x="440" y="${y + 28}" fill="#ffffff" font-size="12" font-weight="700" text-anchor="end" font-family="sans-serif">
                      ${isSelected ? '▶ INSPECTÉ' : 'DÉTAILS'}
                    </text>
                  </g>
                `;
              }).join("")}
            </svg>
          </div>
        </div>

        <!-- PANNEAU DE DÉTAIL DE LA COUCHE SÉLECTIONNÉE -->
        <div class="card" id="layer-detail-card">
          <!-- Rempli dynamiquement -->
        </div>
      </div>

      <!-- SCHÉMA VECTORIEL DE CLOISONNEMENT RÉSEAU OT / IT -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <div class="card-title">🛡️ Segmentation Réseau & Intégration de l'Existant (SCADA / GTC)</div>
          <div class="card-subtitle">Isolation stricte du réseau de mesure OT vis-à-vis du réseau bureautique IT</div>
        </div>

        <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <svg viewBox="0 0 900 240" style="width: 100%; height: auto;">
            <!-- ZONE OT (Réseau de Mesure) -->
            <rect x="20" y="20" width="380" height="200" rx="8" fill="rgba(2, 132, 199, 0.08)" stroke="#0284c7" stroke-dasharray="4,4" />
            <text x="35" y="45" fill="#0284c7" font-weight="bold" font-size="13">ZONE OT — RÉSEAU DE MESURE ISOLÉ (VLAN 10)</text>
            <text x="35" y="65" fill="var(--text-secondary)" font-size="11">Sous-réseau : 192.168.10.0/24 — Port Modbus TCP 502 uniquement</text>
            
            <!-- Compteurs Postes -->
            <rect x="40" y="85" width="150" height="50" rx="4" fill="var(--bg-card)" stroke="var(--border-color)" />
            <text x="50" y="105" fill="var(--text-primary)" font-size="11" font-weight="bold">Postes 1 à 6 (18 Cpt)</text>
            <text x="50" y="122" fill="var(--text-muted)" font-size="10">Centrales Classe 0.5S</text>

            <!-- SCADA Existant -->
            <rect x="220" y="85" width="160" height="50" rx="4" fill="var(--bg-card)" stroke="#f59e0b" />
            <text x="230" y="105" fill="#f59e0b" font-size="11" font-weight="bold">SCADA / GTC Existant</text>
            <text x="230" y="122" fill="var(--text-muted)" font-size="10">Sous-compteurs intégrés</text>

            <!-- Liaison locale -->
            <line x1="190" y1="110" x2="220" y2="110" stroke="#f59e0b" stroke-width="2" />

            <!-- Passerelle / Pare-feu Industriel -->
            <rect x="430" y="70" width="100" height="80" rx="6" fill="#dc2626" />
            <text x="480" y="105" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">PARE-FEU</text>
            <text x="480" y="125" fill="#fff" font-size="10" text-anchor="middle">DMZ OT/IT</text>
            <text x="480" y="138" fill="#fff" font-size="9" text-anchor="middle">(Filtrage IP/Port)</text>

            <!-- ZONE IT (Réseau Bureautique & Utilisateurs) -->
            <rect x="560" y="20" width="320" height="200" rx="8" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" stroke-dasharray="4,4" />
            <text x="575" y="45" fill="#10b981" font-weight="bold" font-size="13">ZONE IT — EXPLOITATION (VLAN 20)</text>
            <text x="575" y="65" fill="var(--text-secondary)" font-size="11">Postes de supervision & serveurs de restitution</text>

            <!-- Serveur SME -->
            <rect x="580" y="85" width="130" height="50" rx="4" fill="var(--bg-card)" stroke="var(--border-color)" />
            <text x="590" y="105" fill="var(--text-primary)" font-size="11" font-weight="bold">Serveur SME</text>
            <text x="590" y="122" fill="var(--text-muted)" font-size="10">Moteur ISO 50001</text>

            <!-- Navigateurs Web -->
            <rect x="740" y="85" width="120" height="50" rx="4" fill="var(--bg-card)" stroke="var(--border-color)" />
            <text x="750" y="105" fill="var(--text-primary)" font-size="11" font-weight="bold">Postes Clients</text>
            <text x="750" y="122" fill="var(--text-muted)" font-size="10">IHM Web (HTTPS)</text>

            <!-- Lignes de raccordement -->
            <line x1="380" y1="110" x2="430" y2="110" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3" />
            <line x1="530" y1="110" x2="580" y2="110" stroke="#10b981" stroke-width="2" />
            <line x1="710" y1="110" x2="740" y2="110" stroke="#10b981" stroke-width="2" />
          </svg>
        </div>
      </div>
    `;

    this.attachEvents(layersData);
    this.updateDetailCard(layersData);
  }

  static attachEvents(layersData) {
    const svgLayers = document.querySelectorAll(".svg-layer");
    svgLayers.forEach(el => {
      el.addEventListener("click", () => {
        this.selectedLayer = Number(el.getAttribute("data-layer-id"));
        this.render(this.container);
      });
    });
  }

  static updateDetailCard(layersData) {
    const card = document.getElementById("layer-detail-card");
    if (!card) return;

    const layer = layersData.find(l => l.id === this.selectedLayer) || layersData[0];

    card.innerHTML = `
      <div class="card-header">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: ${layer.color}; text-transform: uppercase;">Détail Technique Couche ${layer.id}</span>
          <h3 class="card-title" style="margin-top: 2px;">${layer.title}</h3>
        </div>
        <span class="status-pill status-ok">Spécification Validée</span>
      </div>
      <p style="font-size: 13px; color: var(--text-primary); margin-bottom: 16px;">
        ${layer.description}
      </p>
      <h4 style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">
        Composants & Protocoles Clés :
      </h4>
      <ul style="padding-left: 20px; font-size: 12px; line-height: 1.8; color: var(--text-primary); margin-bottom: 16px;">
        ${layer.components.map(c => `<li><strong>${c}</strong></li>`).join("")}
      </ul>
      <div style="background: var(--bg-main); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 11px; color: var(--text-secondary);">
        <strong>Critère d'acceptation AO 12/DEPA/2026 :</strong>
        Garantir l'indépendance de la mesure par rapport aux perturbations électromagnétiques portuaires (blindage des tores, isolation galvanique 2,5 kV et mise à la terre équipotentielle).
      </div>
    `;
  }

  static destroy() {}
}
