/**
 * nav.js - Gestionnaire de navigation latérale dynamique, changement de profil et sélecteur de thème
 */

import { Store, PROFILES } from "../storage/store.js";
import { AuthManager } from "../auth/auth.js";
import { AlertManager } from "../alertes/alertManager.js";

export class Navigation {
  static init(currentRoute, onRouteChangeCallback) {
    this.onRouteChange = onRouteChangeCallback;
    this.render();
    this.setupThemeToggle();
  }

  static render() {
    const sidebarNav = document.getElementById("sidebar-nav");
    const userWidget = document.getElementById("sidebar-user-widget");
    if (!sidebarNav) return;

    const currentUser = AuthManager.getCurrentUser();
    const activeAlertsCount = AlertManager.getActiveCount();
    const currentHash = window.location.hash || "#/dashboard";

    const navItems = [
      { section: "SUPERVISION OPÉRATIONNELLE" },
      { route: "#/dashboard", label: "Tableau de Bord Site", icon: "📊" },
      { route: "#/postes", label: "Postes & Compteurs", icon: "⚡" },
      { route: "#/alertes", label: "Alarmes & Événements", icon: "🚨", badge: activeAlertsCount > 0 ? activeAlertsCount : null, badgeClass: "status-danger" },
      
      { section: "MANAGEMENT ÉNERGIE (ISO 50001)" },
      { route: "#/ipe", label: "Indicateurs IPE", icon: "📈" },
      { route: "#/ser", label: "Situation Réf. (SER)", icon: "🎯" },
      { route: "#/reporting", label: "Rapports & Exports", icon: "📑" },
      
      { section: "DÉPLOIEMENT & CONFORMITÉ" },
      { route: "#/mise-en-service", label: "Mise en Service Compteur", icon: "🛠️", requiresPerm: "commissioning" },
      { route: "#/metrologie", label: "Équipements & Métrologie", icon: "📐" },
      { route: "#/architecture", label: "Architecture 7 Couches", icon: "🌐" },
      { route: "#/cybersecurite", label: "Cybersécurité & Sauvegarde", icon: "🔒" },
      { route: "#/recette", label: "Plan de Recette (T01-T15)", icon: "✅" },
      { route: "#/planning", label: "Planning d'Exécution", icon: "📅" },
      { route: "#/formation", label: "Programme de Formation", icon: "🎓" },
      { route: "#/audit", label: "Journal d'Audit", icon: "📜" }
    ];

    let html = "";
    for (const item of navItems) {
      if (item.section) {
        html += `<div class="nav-section-label">${item.section}</div>`;
      } else {
        const isActive = currentHash.startsWith(item.route) ? "active" : "";
        const badgeHtml = item.badge 
          ? `<span class="nav-badge ${item.badgeClass || ''}">${item.badge}</span>` 
          : "";
        html += `
          <a href="${item.route}" class="nav-item ${isActive}" data-route="${item.route}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
            ${badgeHtml}
          </a>
        `;
      }
    }
    sidebarNav.innerHTML = html;

    // Mise à jour de l'encart utilisateur
    if (userWidget) {
      userWidget.innerHTML = `
        <div class="user-widget">
          <div class="user-avatar">${currentUser.name.charAt(0)}</div>
          <div class="user-details">
            <div class="user-name" title="${currentUser.name}">${currentUser.name}</div>
            <span class="user-role-badge">${currentUser.badge}</span>
          </div>
          <select id="user-profile-select" class="form-select" style="width: auto; padding: 2px 4px; font-size: 11px;">
            ${Object.values(PROFILES).map(p => `
              <option value="${p.id}" ${p.id === currentUser.id ? "selected" : ""}>${p.badge}</option>
            `).join("")}
          </select>
        </div>
      `;

      document.getElementById("user-profile-select")?.addEventListener("change", (e) => {
        AuthManager.switchUser(e.target.value);
        this.render();
        if (this.onRouteChange) this.onRouteChange(window.location.hash);
      });
    }
  }

  static setupThemeToggle() {
    const toggleBtn = document.getElementById("btn-theme-toggle");
    if (!toggleBtn) return;

    const currentTheme = Store.getTheme();
    document.documentElement.setAttribute("data-theme", currentTheme);
    toggleBtn.innerHTML = currentTheme === "dark" ? "☀️" : "🌙";

    toggleBtn.onclick = () => {
      const activeTheme = Store.getTheme();
      const newTheme = activeTheme === "dark" ? "light" : "dark";
      Store.setTheme(newTheme);
      toggleBtn.innerHTML = newTheme === "dark" ? "☀️" : "🌙";
      // Déclencher le rafraîchissement des graphiques Chart.js s'il y en a
      window.dispatchEvent(new Event("themeChanged"));
    };
  }

  static setActiveRoute(routeHash) {
    const navLinks = document.querySelectorAll(".nav-item");
    navLinks.forEach(link => {
      if (link.getAttribute("data-route") === routeHash) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }
}
