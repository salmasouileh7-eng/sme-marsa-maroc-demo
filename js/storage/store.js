/**
 * store.js - Gestionnaire de persistance localStorage pour le SME Marsa Maroc
 * Permet l'initialisation des données de seed, la réinitialisation et la sauvegarde/restauration.
 */

const STORAGE_PREFIX = "marsa_sme_";

// Profils utilisateurs disponibles
export const PROFILES = {
  ADMIN: {
    id: "admin",
    name: "Karim EL ALAMI",
    role: "Administrateur technique",
    badge: "Admin",
    permissions: ["all"]
  },
  ENERGY_MGR: {
    id: "energy_mgr",
    name: "Fatima ZAHRA BENANI",
    role: "Responsable énergie (ISO 50001)",
    badge: "Resp. Énergie",
    permissions: ["view_all", "edit_ipe", "edit_ser", "manage_alerts", "generate_reports", "execute_tests"]
  },
  OPERATOR: {
    id: "operator",
    name: "Youssef TAZI",
    role: "Exploitant / Chef de quart",
    badge: "Exploitant",
    permissions: ["view_all", "commissioning", "ack_alerts", "view_reports", "execute_tests"]
  },
  VIEWER: {
    id: "viewer",
    name: "Observateur DEPA",
    role: "Lecteur / Auditeur",
    badge: "Lecteur",
    permissions: ["view_all", "view_reports"]
  }
};

// Seed initial des 6 postes et de leur hiérarchie
export const INITIAL_SITE_DATA = {
  id: "SITE_AGADIR",
  nom: "Port d'Agadir — Marsa Maroc DEPA",
  description: "Système de Monitoring Énergétique (SME) - 6 Postes MT/BT",
  postes: [
    {
      id: "P1",
      code: "POSTE_1",
      nom: "Poste 1 — Quai Nord",
      usage: "Alimentation bord à quai et grues Nord",
      tensionNominaleKV: 22.0,
      puissanceSouscriteKVA: 2000,
      tableaux: [
        {
          id: "TGBT_P1",
          nom: "TGBT 1 Quai Nord",
          departs: [
            { id: "DEP_P1_01", nom: "Arrivée Transfo MT/BT 1", type: "ARRIVEE", compteurId: "CPT_P1_01", estExistantScada: false },
            { id: "DEP_P1_02", nom: "Départ Grues Quai Nord 1 & 2", type: "OUTILLAGE", compteurId: "CPT_P1_02", estExistantScada: true },
            { id: "DEP_P1_03", nom: "Départ Pompage & Auxiliaires Quai", type: "SERVICES", compteurId: "CPT_P1_03", estExistantScada: false }
          ]
        }
      ]
    },
    {
      id: "P2",
      code: "POSTE_2",
      nom: "Poste 2 — Quai Sud",
      usage: "Manutention vrac solide & liquide",
      tensionNominaleKV: 22.0,
      puissanceSouscriteKVA: 2200,
      tableaux: [
        {
          id: "TGBT_P2",
          nom: "TGBT 2 Quai Sud",
          departs: [
            { id: "DEP_P2_01", nom: "Arrivée Transfo MT/BT 2", type: "ARRIVEE", compteurId: "CPT_P2_01", estExistantScada: false },
            { id: "DEP_P2_02", nom: "Départ Convoyeurs & Grues Sud", type: "OUTILLAGE", compteurId: "CPT_P2_02", estExistantScada: false },
            { id: "DEP_P2_03", nom: "Départ Éclairage Terre-plein Sud", type: "ECLAIRAGE", compteurId: "CPT_P2_03", estExistantScada: true }
          ]
        }
      ]
    },
    {
      id: "P3",
      code: "POSTE_3",
      nom: "Poste 3 — Terminal Roulier (Ro-Ro)",
      usage: "Rampes d'accostage et prises navires",
      tensionNominaleKV: 22.0,
      puissanceSouscriteKVA: 1800,
      tableaux: [
        {
          id: "TGBT_P3",
          nom: "TGBT 3 Ro-Ro",
          departs: [
            { id: "DEP_P3_01", nom: "Arrivée Transfo MT/BT 3", type: "ARRIVEE", compteurId: "CPT_P3_01", estExistantScada: false },
            { id: "DEP_P3_02", nom: "Départ Rampe Roulier Mobile", type: "TRACTION", compteurId: "CPT_P3_02", estExistantScada: false },
            { id: "DEP_P3_03", nom: "Départ Prises Alimentation Navires", type: "BRANCHEMENT", compteurId: "CPT_P3_03", estExistantScada: true }
          ]
        }
      ]
    },
    {
      id: "P4",
      code: "POSTE_4",
      nom: "Poste 4 — Ateliers & Outillage",
      usage: "Maintenance engins et servitudes",
      tensionNominaleKV: 22.0,
      puissanceSouscriteKVA: 1200,
      tableaux: [
        {
          id: "TGBT_P4",
          nom: "TGBT 4 Ateliers",
          departs: [
            { id: "DEP_P4_01", nom: "Arrivée Transfo MT/BT 4", type: "ARRIVEE", compteurId: "CPT_P4_01", estExistantScada: false },
            { id: "DEP_P4_02", nom: "Départ Atelier Machines & Soudure", type: "ATELIER", compteurId: "CPT_P4_02", estExistantScada: false },
            { id: "DEP_P4_03", nom: "Départ Compresseurs & Station Huile", type: "COMPRESSEUR", compteurId: "CPT_P4_03", estExistantScada: false }
          ]
        }
      ]
    },
    {
      id: "P5",
      code: "POSTE_5",
      nom: "Poste 5 — Terminal Conteneurs",
      usage: "Portiques STS, cavaliers et parc reefers",
      tensionNominaleKV: 22.0,
      puissanceSouscriteKVA: 3500,
      tableaux: [
        {
          id: "TGBT_P5",
          nom: "TGBT 5 Conteneurs",
          departs: [
            { id: "DEP_P5_01", nom: "Arrivée Transfo MT/BT 5", type: "ARRIVEE", compteurId: "CPT_P5_01", estExistantScada: false },
            { id: "DEP_P5_02", nom: "Départ Portiques de Quai STS", type: "PORTIQUE", compteurId: "CPT_P5_02", estExistantScada: true },
            { id: "DEP_P5_03", nom: "Départ Parc à Conteneurs Frigorifiques (Reefers)", type: "REEFERS", compteurId: "CPT_P5_03", estExistantScada: false }
          ]
        }
      ]
    },
    {
      id: "P6",
      code: "POSTE_6",
      nom: "Poste 6 — Direction & Services Généraux",
      usage: "Bâtiment administratif, informatique, capitainerie",
      tensionNominaleKV: 22.0,
      puissanceSouscriteKVA: 800,
      tableaux: [
        {
          id: "TGBT_P6",
          nom: "TGBT 6 Administration",
          departs: [
            { id: "DEP_P6_01", nom: "Arrivée Transfo MT/BT 6", type: "ARRIVEE", compteurId: "CPT_P6_01", estExistantScada: false },
            { id: "DEP_P6_02", nom: "Départ Climatisation Siège DEPA", type: "HVAC", compteurId: "CPT_P6_02", estExistantScada: false },
            { id: "DEP_P6_03", nom: "Départ Onduleur Salle Serveurs & Radar", type: "DATA_CENTER", compteurId: "CPT_P6_03", estExistantScada: true }
          ]
        }
      ]
    }
  ]
};

// Seed des compteurs (18 compteurs au total, 3 par poste)
export const INITIAL_METERS = [
  // Poste 1
  {
    id: "CPT_P1_01", posteId: "P1", code: "P1-CPT-01", designation: "Centrale Mesure Tête Transfo 1",
    classePrecision: "0.5S", certEtalonnage: "CERT-2026-AG-101", dateValidite: "2027-04-15",
    reseau: { ip: "192.168.10.11", port: 502, unitId: 1, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" },
      { grandeur: "P_REACTIVE", nom: "Puissance Réactive Totale", adresse: 30015, format: "FLOAT32", echelle: 0.001, unite: "kvar" },
      { grandeur: "U_TENSION", nom: "Tension composée U12", adresse: 30019, format: "FLOAT32", echelle: 1.0, unite: "V" },
      { grandeur: "I_COURANT", nom: "Courant moyen", adresse: 30025, format: "FLOAT32", echelle: 1.0, unite: "A" },
      { grandeur: "COS_PHI", nom: "Facteur de Puissance", adresse: 30031, format: "FLOAT32", echelle: 0.001, unite: "" },
      { grandeur: "FREQ", nom: "Fréquence Réseau", adresse: 30035, format: "FLOAT32", echelle: 0.01, unite: "Hz" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P1_02", posteId: "P1", code: "P1-CPT-02", designation: "Compteur Grues Quai Nord (SCADA Existant)",
    classePrecision: "1", certEtalonnage: "CERT-2025-AG-044", dateValidite: "2026-12-31",
    reseau: { ip: "192.168.10.12", port: 502, unitId: 2, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P1_03", posteId: "P1", code: "P1-CPT-03", designation: "Compteur Pompage & Auxiliaires",
    classePrecision: "1", certEtalonnage: "CERT-2026-AG-103", dateValidite: "2027-04-15",
    reseau: { ip: "192.168.10.13", port: 502, unitId: 3, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  
  // Poste 2
  {
    id: "CPT_P2_01", posteId: "P2", code: "P2-CPT-01", designation: "Centrale Mesure Tête Transfo 2",
    classePrecision: "0.5S", certEtalonnage: "CERT-2026-AG-201", dateValidite: "2027-05-10",
    reseau: { ip: "192.168.10.21", port: 502, unitId: 1, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" },
      { grandeur: "P_REACTIVE", nom: "Puissance Réactive Totale", adresse: 30015, format: "FLOAT32", echelle: 0.001, unite: "kvar" },
      { grandeur: "U_TENSION", nom: "Tension composée U12", adresse: 30019, format: "FLOAT32", echelle: 1.0, unite: "V" },
      { grandeur: "I_COURANT", nom: "Courant moyen", adresse: 30025, format: "FLOAT32", echelle: 1.0, unite: "A" },
      { grandeur: "COS_PHI", nom: "Facteur de Puissance", adresse: 30031, format: "FLOAT32", echelle: 0.001, unite: "" },
      { grandeur: "FREQ", nom: "Fréquence Réseau", adresse: 30035, format: "FLOAT32", echelle: 0.01, unite: "Hz" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P2_02", posteId: "P2", code: "P2-CPT-02", designation: "Compteur Grues & Convoyeurs Sud",
    classePrecision: "1", certEtalonnage: "CERT-2026-AG-202", dateValidite: "2027-05-10",
    reseau: { ip: "192.168.10.22", port: 502, unitId: 2, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P2_03", posteId: "P2", code: "P2-CPT-03", designation: "Compteur Éclairage Terre-plein Sud (Existant)",
    classePrecision: "1", certEtalonnage: "CERT-2025-AG-188", dateValidite: "2026-11-20",
    reseau: { ip: "192.168.10.23", port: 502, unitId: 3, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },

  // Poste 3
  {
    id: "CPT_P3_01", posteId: "P3", code: "P3-CPT-01", designation: "Centrale Mesure Tête Transfo 3",
    classePrecision: "0.5S", certEtalonnage: "CERT-2026-AG-301", dateValidite: "2027-06-01",
    reseau: { ip: "192.168.10.31", port: 502, unitId: 1, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" },
      { grandeur: "P_REACTIVE", nom: "Puissance Réactive Totale", adresse: 30015, format: "FLOAT32", echelle: 0.001, unite: "kvar" },
      { grandeur: "U_TENSION", nom: "Tension composée U12", adresse: 30019, format: "FLOAT32", echelle: 1.0, unite: "V" },
      { grandeur: "I_COURANT", nom: "Courant moyen", adresse: 30025, format: "FLOAT32", echelle: 1.0, unite: "A" },
      { grandeur: "COS_PHI", nom: "Facteur de Puissance", adresse: 30031, format: "FLOAT32", echelle: 0.001, unite: "" },
      { grandeur: "FREQ", nom: "Fréquence Réseau", adresse: 30035, format: "FLOAT32", echelle: 0.01, unite: "Hz" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P3_02", posteId: "P3", code: "P3-CPT-02", designation: "Compteur Rampe Ro-Ro",
    classePrecision: "1", certEtalonnage: "CERT-2026-AG-302", dateValidite: "2027-06-01",
    reseau: { ip: "192.168.10.32", port: 502, unitId: 2, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P3_03", posteId: "P3", code: "P3-CPT-03", designation: "Compteur Prises Navires (Existant)",
    classePrecision: "1", certEtalonnage: "CERT-2025-AG-303", dateValidite: "2026-10-15",
    reseau: { ip: "192.168.10.33", port: 502, unitId: 3, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },

  // Poste 4
  {
    id: "CPT_P4_01", posteId: "P4", code: "P4-CPT-01", designation: "Centrale Mesure Tête Transfo 4",
    classePrecision: "0.5S", certEtalonnage: "CERT-2026-AG-401", dateValidite: "2027-07-20",
    reseau: { ip: "192.168.10.41", port: 502, unitId: 1, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" },
      { grandeur: "P_REACTIVE", nom: "Puissance Réactive Totale", adresse: 30015, format: "FLOAT32", echelle: 0.001, unite: "kvar" },
      { grandeur: "U_TENSION", nom: "Tension composée U12", adresse: 30019, format: "FLOAT32", echelle: 1.0, unite: "V" },
      { grandeur: "I_COURANT", nom: "Courant moyen", adresse: 30025, format: "FLOAT32", echelle: 1.0, unite: "A" },
      { grandeur: "COS_PHI", nom: "Facteur de Puissance", adresse: 30031, format: "FLOAT32", echelle: 0.001, unite: "" },
      { grandeur: "FREQ", nom: "Fréquence Réseau", adresse: 30035, format: "FLOAT32", echelle: 0.01, unite: "Hz" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P4_02", posteId: "P4", code: "P4-CPT-02", designation: "Compteur Ateliers Machines & Mécanique",
    classePrecision: "1", certEtalonnage: "CERT-2026-AG-402", dateValidite: "2027-07-20",
    reseau: { ip: "192.168.10.42", port: 502, unitId: 2, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P4_03", posteId: "P4", code: "P4-CPT-03", designation: "Compteur Centrale d'Air & Compresseurs",
    classePrecision: "1", certEtalonnage: "CERT-2026-AG-403", dateValidite: "2027-07-20",
    reseau: { ip: "192.168.10.43", port: 502, unitId: 3, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },

  // Poste 5
  {
    id: "CPT_P5_01", posteId: "P5", code: "P5-CPT-01", designation: "Centrale Mesure Tête Transfo 5 (Conteneurs)",
    classePrecision: "0.5S", certEtalonnage: "CERT-2026-AG-501", dateValidite: "2027-08-15",
    reseau: { ip: "192.168.10.51", port: 502, unitId: 1, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" },
      { grandeur: "P_REACTIVE", nom: "Puissance Réactive Totale", adresse: 30015, format: "FLOAT32", echelle: 0.001, unite: "kvar" },
      { grandeur: "U_TENSION", nom: "Tension composée U12", adresse: 30019, format: "FLOAT32", echelle: 1.0, unite: "V" },
      { grandeur: "I_COURANT", nom: "Courant moyen", adresse: 30025, format: "FLOAT32", echelle: 1.0, unite: "A" },
      { grandeur: "COS_PHI", nom: "Facteur de Puissance", adresse: 30031, format: "FLOAT32", echelle: 0.001, unite: "" },
      { grandeur: "FREQ", nom: "Fréquence Réseau", adresse: 30035, format: "FLOAT32", echelle: 0.01, unite: "Hz" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P5_02", posteId: "P5", code: "P5-CPT-02", designation: "Compteur Portiques STS (SCADA Existant)",
    classePrecision: "0.5S", certEtalonnage: "CERT-2025-AG-502", dateValidite: "2026-11-30",
    reseau: { ip: "192.168.10.52", port: 502, unitId: 2, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P5_03", posteId: "P5", code: "P5-CPT-03", designation: "Compteur Racks Frigorifiques Reefers",
    classePrecision: "1", certEtalonnage: "CERT-2026-AG-503", dateValidite: "2027-08-15",
    reseau: { ip: "192.168.10.53", port: 502, unitId: 3, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },

  // Poste 6
  {
    id: "CPT_P6_01", posteId: "P6", code: "P6-CPT-01", designation: "Centrale Mesure Tête Transfo 6",
    classePrecision: "0.5S", certEtalonnage: "CERT-2026-AG-601", dateValidite: "2027-09-01",
    reseau: { ip: "192.168.10.61", port: 502, unitId: 1, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" },
      { grandeur: "P_REACTIVE", nom: "Puissance Réactive Totale", adresse: 30015, format: "FLOAT32", echelle: 0.001, unite: "kvar" },
      { grandeur: "U_TENSION", nom: "Tension simple V1", adresse: 30019, format: "FLOAT32", echelle: 1.0, unite: "V" },
      { grandeur: "I_COURANT", nom: "Courant moyen", adresse: 30025, format: "FLOAT32", echelle: 1.0, unite: "A" },
      { grandeur: "COS_PHI", nom: "Facteur de Puissance", adresse: 30031, format: "FLOAT32", echelle: 0.001, unite: "" },
      { grandeur: "FREQ", nom: "Fréquence Réseau", adresse: 30035, format: "FLOAT32", echelle: 0.01, unite: "Hz" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P6_02", posteId: "P6", code: "P6-CPT-02", designation: "Compteur HVAC & Climatisation Siège",
    classePrecision: "1", certEtalonnage: "CERT-2026-AG-602", dateValidite: "2027-09-01",
    reseau: { ip: "192.168.10.62", port: 502, unitId: 2, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  },
  {
    id: "CPT_P6_03", posteId: "P6", code: "P6-CPT-03", designation: "Compteur Onduleur Serveurs & Radar (Existant)",
    classePrecision: "1", certEtalonnage: "CERT-2025-AG-603", dateValidite: "2026-12-15",
    reseau: { ip: "192.168.10.63", port: 502, unitId: 3, pollingSec: 5, timeoutMs: 1000, reconnectSec: 15 },
    registres: [
      { grandeur: "EA_IMPORT", nom: "Énergie Active Importée", adresse: 30001, format: "FLOAT32", echelle: 0.001, unite: "kWh" },
      { grandeur: "P_ACTIVE", nom: "Puissance Active Totale", adresse: 30013, format: "FLOAT32", echelle: 0.001, unite: "kW" }
    ],
    etatCom: "OK", dernierContact: new Date().toISOString()
  }
];

// Seed des 3 IPE Exemples
export const INITIAL_IPES = [
  {
    id: "IPE_01",
    code: "IPE-01",
    nom: "Performance Énergétique Terminal Conteneurs",
    description: "Consommation spécifique par conteneur manutentionné (portiques et terre-plein)",
    perimetre: "Poste 5 (Terminal Conteneurs)",
    postesInclus: ["P5"],
    formule: "E_tot_P5 / EVP_traites",
    formuleAffichee: "Énergie Active P5 (kWh) / Conteneurs (EVP)",
    unite: "kWh / EVP",
    cibleISO: 28.5,
    seuilAlerte: 35.0,
    periodeAgregation: "JOURNALIERE",
    traitementManquant: "EXCLUSION_PROPOSITION_DEPA",
    dateVigueur: "2026-01-01",
    statut: "ACTIF",
    remarque: "Exemple illustratif — à valider avec la DEPA"
  },
  {
    id: "IPE_02",
    code: "IPE-02",
    nom: "Intensité Énergétique Manutention Vrac",
    description: "Consommation spécifique par tonne de vrac solide ou liquide débarquée",
    perimetre: "Postes 1 & 2 (Quais Nord et Sud)",
    postesInclus: ["P1", "P2"],
    formule: "(E_tot_P1 + E_tot_P2) / Tonnes_vrac",
    formuleAffichee: "[Énergie P1 + Énergie P2] (kWh) / Tonnage (Tonnes)",
    unite: "kWh / Tonne",
    cibleISO: 2.10,
    seuilAlerte: 2.65,
    periodeAgregation: "JOURNALIERE",
    traitementManquant: "INTERPOLATION_LINEAIRE",
    dateVigueur: "2026-01-01",
    statut: "ACTIF",
    remarque: "Exemple illustratif — à valider avec la DEPA"
  },
  {
    id: "IPE_03",
    code: "IPE-03",
    nom: "Talon de Veille Nocturne Global",
    description: "Surveillance de la puissance de base minimale consommée hors opérations portuaires majeures",
    perimetre: "Global Site (Postes 1 à 6)",
    postesInclus: ["P1", "P2", "P3", "P4", "P5", "P6"],
    formule: "P_min_nocturne_site",
    formuleAffichee: "Puissance active moyenne observée de 01h00 à 05h00",
    unite: "kW",
    cibleISO: 450.0,
    seuilAlerte: 620.0,
    periodeAgregation: "NOCTURNE",
    traitementManquant: "REJET_SI_LACUNE",
    dateVigueur: "2026-01-01",
    statut: "ACTIF",
    remarque: "Exemple illustratif — à valider avec la DEPA"
  }
];

// Seed de la Situation Énergétique de Référence (SER)
export const INITIAL_SER = {
  id: "SER_AGADIR_2025",
  nom: "SER Baseline Année 2025 (DEPA)",
  description: "Modélisation de régression multi-variable selon la norme ISO 50006",
  periodeReference: "01/01/2025 au 31/12/2025",
  perimetre: "Ensemble des 6 Postes Électriques",
  coefficients: {
    alphaEVP: 26.4,      // kWh / EVP
    betaTonnage: 1.95,   // kWh / Tonne
    gammaTemp: 18.2,     // kWh / °C d'écart climatique
    baseFixeE0: 8450.0   // kWh / jour de consommation talon inconditionnelle
  },
  r2Correlation: 0.942,
  versions: [
    { version: "v1.0", date: "2026-01-15", motif: "Établissement initial d'après les factures et bilans ONEE 2025", auteur: "Bureau d'études Énergie" },
    { version: "v1.1", date: "2026-03-01", motif: "Ajustement suite au raccordement du nouveau quai Ro-Ro", auteur: "DEPA / Resp. Énergie" }
  ],
  remarque: "Méthode mathématique à valider avec la DEPA lors des études de recette"
};

// Seed des 15 Tests de Recette T01 à T15
export const INITIAL_RECETTE_TESTS = [
  { id: "T01", titre: "Ping & Découverte Modbus TCP/IP", categorie: "RÉSEAU", prerequis: "Switchs configurés sur VLAN 10", procedure: "Interroger les 18 adresses IP sur le port 502", critere: "Réponse reçue dans un délai < 200 ms pour chaque compteur", statut: "VALIDE", date: "2026-10-20", testeur: "Youssef TAZI", commentaire: "Les 18 centrales répondent sans gigue excessive." },
  { id: "T02", titre: "Exactitude Lecture Registres & Facteurs d'Échelle", categorie: "MÉTROLOGIE", prerequis: "Générateur de signaux ou injection calibrée", procedure: "Vérifier la conversion flottante Big-Endian et le facteur x0.001", critere: "Écart de conversion nul par rapport à l'afficheur local", statut: "VALIDE", date: "2026-10-20", testeur: "Youssef TAZI", commentaire: "Conforme IEEE 754." },
  { id: "T03", titre: "Détection Rupture Com & Requalification Périmée", categorie: "ROBUSTESSE", prerequis: "Bouton d'injection de panne de com", procedure: "Déconnecter CPT_P1_01 pendant 45s", critere: "Badge 'ABSENTE' après 15s puis 'PÉRIMÉE' après 30s", statut: "VALIDE", date: "2026-10-21", testeur: "Karim EL ALAMI", commentaire: "Alarme déclenchée et badge visuel instantané." },
  { id: "T04", titre: "Contrôle Anti-Double Comptage", categorie: "CALCUL", prerequis: "Poste avec arrivées et départs équipés", procedure: "Vérifier le calcul total du poste", critere: "L'énergie totale n'additionne pas arrivées ET départs simultanément", statut: "VALIDE", date: "2026-10-21", testeur: "Fatima BENANI", commentaire: "Arrivées seules comptabilisées dans le bilan du site." },
  { id: "T05", titre: "Alerte Dépassement Puissance Souscrite", categorie: "ALARME", prerequis: "Seuil réglé à 90% sur Poste 5", procedure: "Injecter une puissance dépassant 3150 kW", critere: "Alarme critique NOUVELLE générée dans les 5 secondes", statut: "VALIDE", date: "2026-10-22", testeur: "Fatima BENANI", commentaire: "Notification SCADA visible en haut de l'écran." },
  { id: "T06", titre: "Alerte Facteur de Puissance Dégradé (cos φ < 0.85)", categorie: "QUALITÉ ÉNERGIE", prerequis: "Régime fortement inductif simulé", procedure: "Simuler cos φ = 0.78 sur Poste 4", critere: "Alarme d'énergie réactive et mention risque pénalité ONEE", statut: "VALIDE", date: "2026-10-22", testeur: "Fatima BENANI", commentaire: "Déclenchement immédiat avec journalisation." },
  { id: "T07", titre: "Calcul Conforme de l'IPE-01 (kWh / EVP)", categorie: "ISO 50001", prerequis: "Données de comptage P5 et déclaration EVP", procedure: "Calculer le ratio sur 24h glissantes", critere: "Valeur calculée rigoureusement égale à E_tot_P5 / EVP_jour", statut: "VALIDE", date: "2026-10-23", testeur: "Fatima BENANI", commentaire: "Conforme à la formule documentée." },
  { id: "T08", titre: "Gestion des Données Manquantes dans l'IPE", categorie: "ISO 50001", prerequis: "Compteur manquant pendant 4 heures", procedure: "Recalculer l'IPE selon la règle d'exclusion paramétrée", critere: "Indicateur qualifié 'Incomplet' et traçabilité du motif", statut: "A_VERIFIER", date: null, testeur: null, commentaire: "À tester avec le bouton de perte de données." },
  { id: "T09", titre: "Comparaison SER vs Réel & Écart CUSUM", categorie: "ISO 50001", prerequis: "Modèle de régression configuré", procedure: "Comparer la journée observée à la baseline théorique", critere: "Calcul exact de l'économie ou de la surconsommation en kWh et %", statut: "A_VERIFIER", date: null, testeur: null, commentaire: "Écarts visibles sur la courbe SER." },
  { id: "T10", titre: "Génération & Export de Rapport CSV", categorie: "REPORTING", prerequis: "Sélection d'une plage temporelle", procedure: "Cliquer sur 'Exporter CSV'", critere: "Fichier CSV téléchargé avec horodatages, unités et séparateur point-virgule", statut: "VALIDE", date: "2026-10-24", testeur: "Youssef TAZI", commentaire: "Ouvrable directement sous Excel." },
  { id: "T11", titre: "Impression Conforme du Rapport PDF", categorie: "REPORTING", prerequis: "Navigateur standard", procedure: "Déclencher l'impression via 'Imprimer / PDF'", critere: "Feuille de style print appliquée, cartouche DEPA et masquage IHM", statut: "VALIDE", date: "2026-10-24", testeur: "Youssef TAZI", commentaire: "Mise en page A4 impeccable." },
  { id: "T12", titre: "Contrôle RBAC & Cloisonnement Profil Lecteur", categorie: "SÉCURITÉ", prerequis: "Session connectée en 'Lecteur'", procedure: "Tenter d'acquitter une alarme ou modifier un seuil", critere: "Boutons masqués ou désactivés, aucune écriture possible", statut: "VALIDE", date: "2026-10-25", testeur: "Karim EL ALAMI", commentaire: "Principe du moindre privilège respecté." },
  { id: "T13", titre: "Immuabilité & Traçabilité du Journal d'Audit", categorie: "SÉCURITÉ", prerequis: "Modification d'un seuil d'alarme", procedure: "Consulter la page Journal d'Audit", critere: "Événement présent avec utilisateur, date/heure et valeurs avant/après", statut: "VALIDE", date: "2026-10-25", testeur: "Karim EL ALAMI", commentaire: "Journal persistant en localStorage." },
  { id: "T14", titre: "Sauvegarde & Restauration Intégrale JSON", categorie: "EXPLOITATION", prerequis: "Modifications de paramètres effectuées", procedure: "Exporter le fichier JSON puis le réimporter", critere: "Restauration à l'identique de l'ensemble de la base", statut: "VALIDE", date: "2026-10-26", testeur: "Karim EL ALAMI", commentaire: "Sauvegarde légère et complète." },
  { id: "T15", titre: "Bouton Réinitialisation Usine de la Démonstration", categorie: "EXPLOITATION", prerequis: "Défauts injectés et alertes modifiées", procedure: "Cliquer sur 'Réinitialiser la démo'", critere: "Remise à zéro immédiate sans rechargement cassé", statut: "VALIDE", date: "2026-10-26", testeur: "Karim EL ALAMI", commentaire: "Nettoyage complet vérifié." }
];

// Seed des règles d'alertes par défaut
export const INITIAL_ALERT_RULES = [
  { id: "R_COM_TIMEOUT", code: "R01", nom: "Perte de Communication Modbus", type: "COMMUNICATION", equipement: "TOUS_COMPTEURS", seuilSec: 30, gravite: "CRITIQUE", active: true },
  { id: "R_COS_PHI", code: "R02", nom: "Facteur de Puissance Dégradé", type: "COS_PHI", equipement: "ARRIVEES_TRANSFOS", seuilVal: 0.85, operateur: "<", gravite: "AVERTISSEMENT", active: true },
  { id: "R_SURCHARGE_P5", code: "R03", nom: "Surcharge Puissance Poste 5", type: "PUISSANCE_ACTIVE", equipement: "CPT_P5_01", seuilVal: 3200, operateur: ">", gravite: "CRITIQUE", active: true },
  { id: "R_DERIVE_SER", code: "R04", nom: "Dérive Consommation vs SER > 10%", type: "SER_DERIVE", equipement: "SITE_GLOBAL", seuilVal: 10.0, operateur: ">", gravite: "AVERTISSEMENT", active: true },
  { id: "R_TENSION_MIN", code: "R05", nom: "Baisse de Tension BT < 210V", type: "TENSION_BT", equipement: "TOUS_COMPTEURS", seuilVal: 210, operateur: "<", gravite: "AVERTISSEMENT", active: true }
];

// Seed des alertes existantes initiales pour la démo
export const INITIAL_ALERTS = [
  {
    id: "ALT_2026_001",
    regleId: "R_COS_PHI",
    compteurId: "CPT_P4_01",
    posteId: "P4",
    posteNom: "Poste 4 — Ateliers & Outillage",
    titre: "Facteur de puissance dégradé (cos φ = 0.79)",
    description: "Le cos φ mesuré à l'arrivée TGBT 4 est inférieur au seuil contractuel de 0.85 (Risque de facturation réactif ONEE).",
    gravite: "AVERTISSEMENT",
    statut: "PRISE_EN_CHARGE",
    dateCreation: new Date(Date.now() - 3600000 * 2).toISOString(),
    datePriseEnCharge: new Date(Date.now() - 1800000).toISOString(),
    dateCloture: null,
    acquittePar: "Youssef TAZI",
    commentaire: "Batterie de condensateurs gradin 2 en défaut fusible à l'atelier mécanique. Électricien dépêché."
  },
  {
    id: "ALT_2026_002",
    regleId: "R_COM_TIMEOUT",
    compteurId: "CPT_P3_03",
    posteId: "P3",
    posteNom: "Poste 3 — Terminal Roulier (Ro-Ro)",
    titre: "Silence de communication Modbus (> 45s)",
    description: "Le compteur existant Prises Navires P3 ne répond plus aux requêtes Modbus TCP (192.168.10.33:502).",
    gravite: "CRITIQUE",
    statut: "NOUVELLE",
    dateCreation: new Date(Date.now() - 600000).toISOString(),
    datePriseEnCharge: null,
    dateCloture: null,
    acquittePar: null,
    commentaire: null
  }
];

// Gestionnaire du Store
export class Store {
  static init() {
    if (!this.get("site")) {
      this.resetToDefaults();
    }
    // S'assurer qu'un utilisateur est connecté
    if (!this.getCurrentUser()) {
      this.setCurrentUser(PROFILES.ADMIN.id);
    }
  }

  static get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Erreur lecture localStorage [${key}]:`, e);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Erreur écriture localStorage [${key}]:`, e);
      return false;
    }
  }

  static remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }

  static resetToDefaults() {
    this.set("site", INITIAL_SITE_DATA);
    this.set("meters", INITIAL_METERS);
    this.set("ipes", INITIAL_IPES);
    this.set("ser", INITIAL_SER);
    this.set("recette_tests", INITIAL_RECETTE_TESTS);
    this.set("alert_rules", INITIAL_ALERT_RULES);
    this.set("alerts", INITIAL_ALERTS);
    this.set("audit_logs", [
      {
        id: "AUDIT_001",
        horodatage: new Date().toISOString(),
        utilisateur: "Système",
        role: "Init",
        action: "INITIALISATION_DEMO",
        cible: "Base complète",
        valeurAvant: "-",
        valeurApres: "Données de seed chargées avec succès"
      }
    ]);
    this.set("sim_config", {
      vitesse: 1, // 1, 10, 60
      periodeSec: 5,
      bruitActif: true,
      defauts: {} // compteurId -> { type: 'COMM_CUT' | 'ABERRANT' | 'STALE' }
    });
    this.set("theme", "dark");
  }

  static getCurrentUser() {
    const userId = this.get("current_user_id", "admin");
    return Object.values(PROFILES).find(p => p.id === userId) || PROFILES.ADMIN;
  }

  static setCurrentUser(userId) {
    const user = Object.values(PROFILES).find(p => p.id === userId) || PROFILES.ADMIN;
    this.set("current_user_id", user.id);
    this.logAudit("CHANGEMENT_UTILISATEUR", "Session", "Session précédente", `${user.name} (${user.role})`);
    return user;
  }

  static getTheme() {
    return this.get("theme", "dark");
  }

  static setTheme(theme) {
    this.set("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }

  static logAudit(action, cible, avant, apres) {
    const logs = this.get("audit_logs", []);
    const currentUser = this.getCurrentUser();
    const newLog = {
      id: "AUDIT_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      horodatage: new Date().toISOString(),
      utilisateur: currentUser ? currentUser.name : "Anonyme",
      role: currentUser ? currentUser.role : "Inconnu",
      action: action,
      cible: cible,
      valeurAvant: typeof avant === "object" ? JSON.stringify(avant) : String(avant),
      valeurApres: typeof apres === "object" ? JSON.stringify(apres) : String(apres)
    };
    logs.unshift(newLog);
    // Garder les 500 derniers logs
    if (logs.length > 500) logs.pop();
    this.set("audit_logs", logs);
  }

  static exportBackupJSON() {
    const backup = {
      exportDate: new Date().toISOString(),
      app: "SME_Marsa_Maroc_12DEPA2026",
      version: "1.0-DEMO",
      site: this.get("site"),
      meters: this.get("meters"),
      ipes: this.get("ipes"),
      ser: this.get("ser"),
      recette_tests: this.get("recette_tests"),
      alert_rules: this.get("alert_rules"),
      alerts: this.get("alerts"),
      audit_logs: this.get("audit_logs"),
      sim_config: this.get("sim_config")
    };
    return JSON.stringify(backup, null, 2);
  }

  static importBackupJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.site || !data.meters) {
        throw new Error("Format de sauvegarde JSON invalide pour le SME Marsa Maroc.");
      }
      if (data.site) this.set("site", data.site);
      if (data.meters) this.set("meters", data.meters);
      if (data.ipes) this.set("ipes", data.ipes);
      if (data.ser) this.set("ser", data.ser);
      if (data.recette_tests) this.set("recette_tests", data.recette_tests);
      if (data.alert_rules) this.set("alert_rules", data.alert_rules);
      if (data.alerts) this.set("alerts", data.alerts);
      if (data.audit_logs) this.set("audit_logs", data.audit_logs);
      if (data.sim_config) this.set("sim_config", data.sim_config);
      this.logAudit("RESTAURATION_SAUVEGARDE", "Base globale", "-", `Fichier exporté le ${data.exportDate || 'date inconnue'}`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
