/**
 * auth.js - Gestion des profils utilisateurs, RBAC et matrice des autorisations
 * 4 profils conformes aux prérogatives du cahier des charges :
 * 1. Administrateur technique (tous droits)
 * 2. Responsable énergie (IPE, SER, alertes, rapports, recette)
 * 3. Exploitant (mise en service, acquittement alarmes, recette)
 * 4. Lecteur (consultation seule, principe du moindre privilège)
 */

import { Store, PROFILES } from "../storage/store.js";

export class AuthManager {
  static getProfiles() {
    return PROFILES;
  }

  static getCurrentUser() {
    return Store.getCurrentUser();
  }

  static switchUser(profileId) {
    return Store.setCurrentUser(profileId);
  }

  /**
   * Vérifie si l'utilisateur actuel dispose d'une permission donnée
   * @param {string} permission 
   * @returns {boolean}
   */
  static can(permission) {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;
    if (user.permissions.includes("all")) return true;
    return user.permissions.includes(permission);
  }

  /**
   * Vérifie l'accès à une action et lève une exception visuelle si non autorisé
   */
  static checkPermission(permission, actionLabel = "cette opération") {
    if (!this.can(permission)) {
      alert(`Accès refusé : Le profil « ${this.getCurrentUser().role} » ne dispose pas des privilèges requis pour ${actionLabel}.`);
      return false;
    }
    return true;
  }
}
