/**
 * app.js - Orchestrateur principal de l'application SME Marsa Maroc (AO 12/DEPA/2026)
 * Gestion du routage hash, cycle de vie des vues et contrôles de simulation globaux.
 */

import { Store } from "./storage/store.js";
import { simEngine } from "./simulation/engine.js";
import { Navigation } from "./ui/nav.js";
import { FaultsModal } from "./ui/faults-modal.js";

// Vues
import { DashboardView } from "./ui/view-dashboard.js";
import { PostesView } from "./ui/view-postes.js";
import { CommissioningView } from "./ui/view-mise-en-service.js";
import { IPEView } from "./ui/view-ipe.js";
import { SERView } from "./ui/view-ser.js";
import { AlertesView } from "./ui/view-alertes.js";
import { ReportingView } from "./ui/view-reporting.js";
import { ArchitectureView } from "./ui/view-architecture.js";
import { MetrologieView } from "./ui/view-metrologie.js";
import { CybersecuriteView } from "./ui/view-cybersecurite.js";
import { RecetteView } from "./ui/view-recette.js";
import { PlanningView } from "./ui/view-planning.js";
import { FormationView } from "./ui/view-formation.js";
import { AuditView } from "./ui/view-audit.js";

class App {
  static init() {
    console.log("⚡ Démarrage du SME Marsa Maroc (AO 12/DEPA/2026)...");

    // 1. Initialiser le store localStorage
    Store.init();

    // 2. Initialiser le moteur de simulation temps réel
    simEngine.init();

    // 3. Initialiser la navigation
    Navigation.init(window.location.hash, (route) => this.navigateTo(route));

    // 4. Configurer les contrôles de la topbar (Vitesse x1/x10/x60, injection de pannes)
    this.setupSimulationControls();

    // 5. Écouter les changements d'URL par hash
    window.addEventListener("hashchange", () => {
      this.handleRoute();
    });

    // 6. Afficher la route courante
    this.handleRoute();
  }

  static setupSimulationControls() {
    // Boutons de vitesse x1, x10, x60
    const btn1 = document.getElementById("sim-speed-1");
    const btn10 = document.getElementById("sim-speed-10");
    const btn60 = document.getElementById("sim-speed-60");

    const updateSpeedButtons = (speed) => {
      [btn1, btn10, btn60].forEach(b => b?.classList.remove("active"));
      if (speed === 1) btn1?.classList.add("active");
      if (speed === 10) btn10?.classList.add("active");
      if (speed === 60) btn60?.classList.add("active");
    };

    const simConfig = Store.get("sim_config", {});
    updateSpeedButtons(simConfig.vitesse || 1);

    btn1?.addEventListener("click", () => { simEngine.setSpeed(1); updateSpeedButtons(1); });
    btn10?.addEventListener("click", () => { simEngine.setSpeed(10); updateSpeedButtons(10); });
    btn60?.addEventListener("click", () => { simEngine.setSpeed(60); updateSpeedButtons(60); });

    // Bouton console injection défauts
    document.getElementById("btn-fault-modal")?.addEventListener("click", () => {
      FaultsModal.open();
    });

    // Bouton de réinitialisation rapide dans le bandeau de démo
    document.getElementById("btn-reset-quick")?.addEventListener("click", () => {
      if (confirm("Réinitialiser toutes les données de la démo (postes, compteurs, alertes, historique) ?")) {
        Store.resetToDefaults();
        window.location.reload();
      }
    });
  }

  static handleRoute() {
    const hash = window.location.hash || "#/dashboard";
    const route = hash.split("?")[0];
    this.navigateTo(route);
  }

  static navigateTo(route) {
    const mainViewContainer = document.getElementById("page-view-container");
    if (!mainViewContainer) return;

    // Nettoyer la vue active précédente
    if (this.currentView && this.currentView.destroy) {
      try {
        this.currentView.destroy();
      } catch (e) {
        console.warn("Erreur destroy vue :", e);
      }
    }

    Navigation.setActiveRoute(route);

    switch (route) {
      case "#/dashboard":
        this.currentView = DashboardView;
        break;
      case "#/postes":
        this.currentView = PostesView;
        break;
      case "#/mise-en-service":
        this.currentView = CommissioningView;
        break;
      case "#/ipe":
        this.currentView = IPEView;
        break;
      case "#/ser":
        this.currentView = SERView;
        break;
      case "#/alertes":
        this.currentView = AlertesView;
        break;
      case "#/reporting":
        this.currentView = ReportingView;
        break;
      case "#/architecture":
        this.currentView = ArchitectureView;
        break;
      case "#/metrologie":
        this.currentView = MetrologieView;
        break;
      case "#/cybersecurite":
        this.currentView = CybersecuriteView;
        break;
      case "#/recette":
        this.currentView = RecetteView;
        break;
      case "#/planning":
        this.currentView = PlanningView;
        break;
      case "#/formation":
        this.currentView = FormationView;
        break;
      case "#/audit":
        this.currentView = AuditView;
        break;
      default:
        window.location.hash = "#/dashboard";
        return;
    }

    try {
      this.currentView.render(mainViewContainer);
      mainViewContainer.scrollTop = 0;
    } catch (err) {
      console.error(`Erreur rendu vue ${route}:`, err);
      mainViewContainer.innerHTML = `
        <div class="card status-danger" style="padding: 24px;">
          <h3>Erreur d'affichage</h3>
          <p>${err.message}</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/dashboard'">Retourner au Dashboard</button>
        </div>
      `;
    }
  }
}

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
