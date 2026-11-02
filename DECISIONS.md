# Registre des Décisions & Hypothèses de Démonstration (DECISIONS.md)
## Appel d'Offres Marsa Maroc n° 12/DEPA/2026 — Port d'Agadir
### Système de Monitoring Énergétique (SME) conforme ISO 50001

> [!IMPORTANT]
> **RÈGLE D'HONNÊTETÉ DES DONNÉES :**
> Cette application est une démonstration technique 100 % statique simulant le SME. Aucune donnée n'est prélevée sur le réseau de production réel de Marsa Maroc. Les noms d'équipements, adresses IP, registres d'automates, seuils, constantes métrologiques et modèles d'IPE/SER constituent des **exemples illustratifs réalistes à valider impérativement avec la Direction de l'Exploitation au Port d'Agadir (DEPA)** lors de la phase d'études d'exécution.

---

## 1. Périmètre Géographique & Postes Électriques
- **Hypothèse retenue :** Modélisation de 6 postes électriques MT/BT couvrant les principales zones opérationnelles du Port d'Agadir :
  1. **Poste 1** : Quai Nord (Arrivée MT 22 kV, TGBT 1, alimentation outillage bord à quai).
  2. **Poste 2** : Quai Sud (Arrivée MT, TGBT 2, grues mobiles et éclairage terre-plein).
  3. **Poste 3** : Terminal Roulier / Ro-Ro (Rampe d'accostage, traction, prises navires frigorifiques).
  4. **Poste 4** : Zone Outillage & Ateliers de maintenance (Compresseurs, machines-outils, ponts roulants).
  5. **Poste 5** : Terminal Conteneurs & Parc à Reefers (Portiques de quai, cavaliers, racks frigorifiques conteneurs reefers).
  6. **Poste 6** : Bâtiments Administratifs, Capitainerie & Auxiliaires généraux.
- **Point à confirmer avec la DEPA :** Schéma unifilaire contractuel précis, calibres des disjoncteurs principaux, puissances souscrites par poste (valeurs par défaut simulées entre 800 kVA et 3 200 kVA).

---

## 2. Métrologie & Modèle des Compteurs
- **Hypothèse retenue :**
  - Mesures en tête de poste : Centrales de mesure multifonctions Classe 0.5S (norme CEI 62053-22), mesure 4 quadrants 3P4W, avec analyse harmonique THD.
  - Mesures divisionnaires / départs : Compteurs d'énergie communicants Classe 1 (norme CEI 62053-21) montés sur rail DIN.
  - Ratios des Transformateurs de Courant (TC) et Transformateurs de Tension (TT) paramétrables dans l'interface de mise en service.
- **Point à confirmer avec la DEPA :** Liste exacte des marques/modèles déjà en place sur les postes rénovés, état des certificats d'étalonnage périodiques et conformité des tores existants.

---

## 3. Protocole Modbus TCP/IP & Cartographie des Registres
- **Hypothèse retenue :**
  - Protocole : Modbus TCP/IP standard sur port 502, Unit ID configurable (défaut = 1).
  - Format des données : Flottants IEEE 754 32 bits en Big-Endian (2 registres 16 bits consécutifs : Holding Registers à partir de l'adresse 30001 ou 40001).
  - Période d'interrogation nominale : 5 secondes (paramétrable de 1 à 60s par équipement).
  - Facteurs d'échelle normalisés : x0.001 pour conversion W -> kW et Wh -> kWh.
  - Détection de rupture de communication : Si aucune réponse reçue après un timeout de 1000 ms x 3 tentatives (délai de grâce 15s), la qualité de la mesure bascule en `ABSENTE`, puis `PÉRIMÉE` après 60s.
- **Point à confirmer avec la DEPA :** Plan d'adressage IP du réseau OT de Marsa Maroc, segmentation par sous-réseau / VLAN et tables de registres fournies par les constructeurs de compteurs.

---

## 4. Prévention Stricte du Double Comptage
- **Règle de gestion :**
  - Dans un tableau électrique, une énergie ne doit être comptée qu'une seule fois dans le bilan de zone.
  - L'énergie totale du poste est issue des **arrivées transformateurs** (niveau 1).
  - Les compteurs divisionnaires des départs (niveau 2) et les sous-compteurs raccordés aux automates GTC existants sont taggés comme **sous-comptage analytique**.
  - Le moteur de calcul applique un filtre logique qui empêche l'addition simultanée d'un compteur amont et de ses sous-compteurs aval dans le total global du site.

---

## 5. Indicateurs de Performance Énergétique (IPE — ISO 50001)
- **Hypothèse retenue — 3 IPE d'exemple illustratifs :**
  1. `IPE-01` : **Consommation spécifique Conteneurs** (`kWh / EVP manutentionné`) — Périmètre : Poste 5 (Terminal Conteneurs).
  2. `IPE-02` : **Consommation spécifique Manutention Vrac** (`kWh / Tonne débarquée`) — Périmètre : Postes 1 & 2 (Quais Nord et Sud).
  3. `IPE-03` : **Talon de veille portuaire hors escale** (`kW talon / heure`) — Périmètre : Ensemble des postes en période nocturne ou d'inactivité navire.
- **Traitement des données manquantes :**
  - Si le taux de complétude des mesures d'un poste est inférieur à 90 % sur la période d'échantillonnage, l'IPE est marqué « Invalide pour motif d'incomplétude » ou recalculé par exclusion/interpolation documentée.
- **Point à confirmer avec la DEPA :** Définition contractuelle des unités d'œuvre (EVP pleins vs vides, tonnes métriques, heures de mise à disposition des branchements reefers).

---

## 6. Situation Énergétique de Référence (SER — ISO 50001)
- **Hypothèse retenue :**
  - Période de référence simulée : Année précédente (N-1) servant de baseline énergétique.
  - Modélisation de la consommation théorique de référence :
    $$E_{ref} = \alpha \cdot \text{EVP} + \beta \cdot \text{Tonnes} + \gamma \cdot T_{ext} + E_0$$
  - Calcul de l'écart `Conso Observée - Conso Réf` et indicateur CUSUM (somme cumulée des écarts).
- **Point à confirmer avec la DEPA :** Validation de la méthodologie d'ajustement statique (degrés-jours unifiés ou température locale à Agadir, tonnage de transit vs vrac liquide).

---

## 7. Règles & Cycle de Vie des Alertes
- **Seuils par défaut (exemples illustratifs) :**
  - Dépassement de puissance atteinte : 90 % (Avertissement) et 98 % (Alarme critique).
  - Facteur de puissance : $\cos \varphi < 0.85$ (Pénalité ONEE / réactif excessif).
  - Taux de distorsion harmonique : $THD_U > 5\%$ ou $THD_I > 15\%$.
  - Perte de communication Modbus : Silence $> 30$ secondes.
- **Cycle de vie SCADA :**
  - `NOUVELLE` : Alerte active non vue.
  - `PRISE_EN_CHARGE` : Acquittée par un exploitant avec saisie obligatoire d'un commentaire d'investigation.
  - `CLOTUREE` : Retour à la normale validé et incident archivé.
- **Point à confirmer avec la DEPA :** Canaux de notification distants (passerelle SMS GSM sur site ou serveur SMTP interne Marsa Maroc).

---

## 8. Cybersécurité & Cloisonnement Réseau (ANSSI / CNDP)
- **Mesures de protection recommandées :**
  - Cloisonnement physique ou logique (VLAN étanche 802.1Q) séparant le réseau de mesure industriel (OT) du réseau bureautique (IT).
  - Filtrage au niveau du pare-feu industriel (autoriser uniquement les ports Modbus 502 et NTP 123 entre les passerelles d'acquisition et les centrales de mesure).
  - Absence d'accès direct des compteurs vers Internet.
  - Protection des données à caractère personnel : Journalisation des connexions utilisateurs sans conservation excessive de traces sensibles.
- **Point à confirmer avec la DEPA / DSI :** Politique de sécurité des systèmes d'information (PSSI) du groupe Marsa Maroc et rattachement au SI central.

---

## 9. Planning & Jalons Contractuels
- **Hypothèse de déploiement (6 mois indicatifs) :**
  - Mois 1 : Visite technique contradictoire des 6 postes, inventaire métrologique, validation de l'architecture.
  - Mois 2 : Fourniture des matériels, validation des études d'exécution & schémas de raccordement.
  - Mois 3 : Travaux d'installation, pose des tores et compteurs, tirage des câbles blindés RS485 / fibre optique.
  - Mois 4 : Paramétrage des passerelles Modbus TCP/IP, configuration du logiciel SME, intégration GTC existante.
  - Mois 5 : Essais de recette usine et site (tests T01 à T15), étalonnage contradictoire, formation des équipes.
  - Mois 6 : Période d'observation (marche à blanc 30 jours), levée des réserves et Réception Provisoire.
- **Point à confirmer avec la DEPA :** Contraintes d'exploitation pour les coupures électriques requises lors de la pose des tores de mesure en tête de poste.

---

## 10. Suivi des 15 Tests de Recette Contractuels (T01 à T15)
Chaque test T01 à T15 de la checklist interactive dispose d'un protocole d'essai précis, d'un critère de succès sans ambiguïté et d'un lien vers la fonction de démonstration correspondante dans l'application.
