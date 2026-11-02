# Système de Monitoring Énergétique (SME) — Marsa Maroc (Port d'Agadir)
### Application de Démonstration Technique — Appel d'Offres n° 12/DEPA/2026

> [!IMPORTANT]
> **ACCÈS EN LIGNE (GITHUB PAGES) :**
> - **URL de l'application en direct :** [https://salmasouileh7-eng.github.io/sme-marsa-maroc-demo/](https://salmasouileh7-eng.github.io/sme-marsa-maroc-demo/)
> - **Dépôt GitHub source :** [https://github.com/salmasouileh7-eng/sme-marsa-maroc-demo](https://github.com/salmasouileh7-eng/sme-marsa-maroc-demo)
> - **Mention d'honnêteté industrielle :** Données simulées — Démonstration technique (aucune connexion au réseau de production de Marsa Maroc).

Cette application web est une démonstration front-end autonome et 100 % statique simulant le **Système de Monitoring Énergétique (SME)** pour les 6 postes électriques MT/BT de **Marsa Maroc — Direction de l'Exploitation au Port d'Agadir (DEPA)**, conformément aux exigences de la norme **ISO 50001 / ISO 50006**.

---

## 1. Objectifs & Cadre de la Démonstration

1. **Simulation Industrielle Fidèle :**
   - 6 postes électriques MT/BT instrumentés (Poste 1 Quai Nord à Poste 6 Administration).
   - 18 compteurs électriques générant en continu des mesures 4 quadrants réalistes (puissance active, réactive, tension, courant, facteur de puissance $\cos \varphi$, fréquence, énergie active cumulée).
   - Simulation de la couche réseau **Modbus TCP/IP** (port 502, Unit ID, Holding Registers flottants IEEE 754 Big-Endian, facteurs d'échelle et latence).

2. **Règle Absolue d'Honnêteté des Données :**
   - Bandeau supérieur permanent : **« DONNÉES SIMULÉES — DÉMONSTRATION TECHNIQUE »**.
   - Aucune mesure ancienne n'est présentée comme du temps réel (badges de fraîcheur dynamique).
   - Toutes les mentions contractuelles, marques d'équipements, adresses IP et constantes sont balisées : *« Exemple illustratif — à valider avec la DEPA »*.
   - Registre des hypothèses consigné dans [`DECISIONS.md`](./DECISIONS.md).

3. **100 % Statique & Zéro Dépendance Externe :**
   - Hébergeable directement sur GitHub Pages (ou tout serveur web statique).
   - JavaScript vanilla en modules ES (`import` / `export`), aucun outil de compilation obligatoire (zéro npm build, zéro Webpack/Vite).
   - Tous les chemins d'accès sont relatifs (`./css/`, `./js/`, `./vendor/`).
   - Bibliothèque graphique **Chart.js** embarquée en local dans `./vendor/chart.umd.min.js` (zéro appel CDN).
   - Persistance intégrale dans le `localStorage` du navigateur avec bouton de réinitialisation usine en 1 clic.

---

## 2. Démarrage Rapide en Local

### Option A : Serveur local Python (Recommandé pour les modules ES)
Dans un terminal, placez-vous à la racine du projet et lancez :
```bash
# Avec Python 3
python3 -m http.server 8080

# Ou avec Node.js (npx)
npx serve .
```
Ouvrez ensuite votre navigateur sur : [http://localhost:8080](http://localhost:8080)

### Option B : Suite de tests automatisés sans build
Pour exécuter la suite de tests unitaires et fonctionnels (conversions, anti-double comptage, IPE, SER, alertes, buffer) :
Ouvrez directement dans votre navigateur : [http://localhost:8080/tests.html](http://localhost:8080/tests.html)

---

## 3. Structure du Projet

```text
/
├── index.html                   # Point d'entrée principal de la supervision
├── tests.html                   # Suite de tests unitaires et fonctionnels automatisés
├── .nojekyll                    # Neutralisation de Jekyll pour GitHub Pages
├── README.md                    # Documentation complète du projet
├── DECISIONS.md                 # Registre des hypothèses et arbitrages techniques
├── css/
│   ├── main.css                 # Layout, typographie, composants réactifs, accessibilité
│   ├── scada-theme.css          # Palettes SCADA clair/sombre, badges d'état et alarmes
│   └── print.css                # Feuille de style dédiée pour l'impression A4 et export PDF
├── vendor/
│   └── chart.umd.min.js         # Bibliothèque Chart.js locale autonome
└── js/
    ├── app.js                   # Orchestrateur central, routeur hash et contrôles généraux
    ├── auth/
    │   └── auth.js              # 4 profils utilisateurs, matrice RBAC et permissions
    ├── storage/
    │   └── store.js             # Gestionnaire localStorage, seed, export/import JSON
    ├── simulation/
    │   ├── engine.js            # Moteur de génération temps réel (5s, x1/x10/x60)
    │   ├── profiles.js          # Profils de charge portuaires 24h et bruit gaussien
    │   ├── modbus.js            # Simulation de la pile Modbus TCP/IP (IEEE 754 Big-Endian)
    │   └── faults.js            # Injection de défauts et déversement de tampon sans doublon
    ├── calculs/
    │   ├── aggregations.js      # Agrégations de postes avec filtre anti-double comptage certifié
    │   ├── metrologie.js        # Conversions échelles/unités et contrôle de précision CEI
    │   ├── ipe.js               # Moteur IPE ISO 50001 et gestion des données manquantes
    │   └── ser.js               # Modélisation SER (Baseline multi-variables) et CUSUM
    ├── alertes/
    │   └── alertManager.js      # Cycle de vie des alarmes SCADA (Nouvelle > Prise en charge > Clôturée)
    ├── rapports/
    │   └── reportGenerator.js   # Édition des rapports, exports CSV et impression PDF
    └── ui/
        ├── nav.js               # Navigation latérale dynamique et sélecteur de rôle/thème
        ├── faults-modal.js      # Boîte de dialogue d'injection de pannes pour la démo
        ├── view-dashboard.js    # Écran 2 : Tableau de bord site & KPI temps réel
        ├── view-postes.js       # Écran 3 : Vue Poste / Compteur, fraîcheur, courbes, comparaison
        ├── view-mise-en-service.js # Écran 4 : Assistant pas-à-pas de mise en service & PV d'essai
        ├── view-ipe.js          # Écran 5 : Gestion & calcul des IPE (3 IPE exemples)
        ├── view-ser.js          # Écran 6 : Gestion de la SER (ISO 50001), baseline vs réel
        ├── view-alertes.js      # Écran 7 : Console des alarmes, filtres, acquittement
        ├── view-reporting.js    # Écran 8 : Centre d'édition de rapports et exports
        ├── view-architecture.js # Écran 9 : Schéma interactif SVG des 7 couches & cloisonnement OT/IT
        ├── view-metrologie.js   # Écran 10 : Fiches métrologiques, classes de précision, étalonnage
        ├── view-cybersecurite.js # Écran 11 : Matrice de sécurité, sauvegarde/restauration JSON
        ├── view-recette.js      # Écran 12 : Checklist d'évaluation interactive (tests T01 à T15)
        ├── view-planning.js     # Écran 13 : Diagramme de Gantt interactif du déploiement
        ├── view-formation.js    # Écran 14 : Programme de formation & mini quiz exploitant
        └── view-audit.js        # Vue transverse : Journal d'audit des actions sensibles
```

---

## 4. Parcours des 14 Écrans et Fonctionnalités Clés

| N° | Écran | URL Hash | Fonctionnalités Clés |
|---|---|---|---|
| **1** | **Profils & Sessions** | En bas du menu | Sélecteur instantané parmi 4 profils (Admin, Resp. Énergie, Exploitant, Lecteur). |
| **2** | **Tableau de Bord Site** | `#/dashboard` | KPI en direct (kW, MWh, $\cos \varphi$, % com Modbus), courbe de charge temps réel, état des 6 postes. |
| **3** | **Postes & Compteurs** | `#/postes` | Hiérarchie Site > Poste > TGBT > Départ. **Démonstration certifiée anti-double comptage** et badges de fraîcheur. |
| **4** | **Mise en Service** | `#/mise-en-service` | Assistant en 6 étapes : identification, réseau Modbus, cartographie, test de communication, affectation et **PV d'essai officiel**. |
| **5** | **Indicateurs IPE** | `#/ipe` | Suivi ISO 50001 : 3 IPE types (kWh/EVP, kWh/Tonne, Talon nocturne), éditeur de formule et gestion des manques. |
| **6** | **Situation Réf. (SER)** | `#/ser` | Modélisation multi-variables ISO 50006 ($E_{ref} = \alpha \cdot EVP + \beta \cdot Tonnes + \gamma \cdot T_{ext} + E_0$), écarts et **CUSUM**. |
| **7** | **Alarmes & Événements** | `#/alertes` | Console SCADA avec cycle complet (*Nouvelle* $\to$ *Prise en charge avec note* $\to$ *Clôturée*), seuils paramétrables. |
| **8** | **Rapports & Exports** | `#/reporting` | Bilans paramétrables, **export CSV direct**, impression optimisée A4 via CSS `print.css`. |
| **9** | **Architecture 7 Couches** | `#/architecture` | **Schéma interactif SVG** des 7 couches (Terrain à Exploitation) et synoptique de segmentation réseau OT (VLAN 10) / IT (VLAN 20). |
| **10** | **Métrologie & Fiches** | `#/metrologie` | Fiches constructeurs types (Classe 0.5S et Classe 1), conformité CEI 62053-22 et inventaire des certificats d'étalonnage. |
| **11** | **Cybersécurité** | `#/cybersecurite` | Analyse des risques Modbus TCP, mesures palliatives, matrice RBAC, **export & restauration complète en JSON**. |
| **12** | **Plan de Recette** | `#/recette` | Matrice d'évaluation interactive des **15 tests contractuels T01 à T15** avec score global en % et PV de test. |
| **13** | **Planning d'Exécution** | `#/planning` | **Diagramme de Gantt interactif SVG** sur 24 semaines avec jalons clés et matrice des responsabilités. |
| **14** | **Formation & Quiz** | `#/formation` | 3 modules de formation conformes à la section 9 du CPS et **mini-quiz interactif pour les exploitants**. |
| **-** | **Journal d'Audit** | `#/audit` | Historique des modifications (utilisateur, rôle, date/heure, action, valeurs avant/après). |

---

## 5. Console d'Injection de Pannes (Démonstration en Direct)

En cliquant sur le bouton **« ⚡ Injecter Défaut »** dans la barre supérieure, vous pouvez injecter instantanément sur n'importe quel compteur :
1. **Coupure Com Modbus :** Silence réseau $> 30$s, requalification de la mesure en `ABSENTE`, bascule de la pastille SCADA et déclenchement de l'alarme critique T03.
2. **Valeur Aberrante :** Injection d'un pic irréaliste (ex. 99 999 kW) requalifié en `INVALIDE` et rejeté par les calculs d'IPE.
3. **Donnée Manquante / Périmée :** Gel de l'horodatage pour vérifier le passage du badge de fraîcheur de vert (`Il y a 5s`) à rouge (`Périmée`).
4. **Reprise après coupure sans doublons :** Déversement du tampon local du compteur avec vérification du blocage strict des doublons d'horodatage.

---

## 6. Limites de la Simulation

- Les données électriques sont générées par un algorithme stochastique modélisant les profils d'activité portuaire (activités de quai, escales navires, conteneurs frigorifiques, variations diurnes/nocturnes).
- Les adresses IP (sous-réseau `192.168.10.0/24`), calibres de puissance et noms de départs sont illustratifs et doivent être raccordés aux éléments d'ingénierie réels lors de la visite contradictoire sur site.
- Les canaux de notification distants (passerelle SMS GSM / serveur SMTP Marsa Maroc) sont simulés visuellement dans l'application.
