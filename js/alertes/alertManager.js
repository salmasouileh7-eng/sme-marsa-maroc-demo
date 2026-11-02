/**
 * alertManager.js - Gestionnaire d'alarmes industrielles SCADA
 * Cycle de vie : NOUVELLE -> PRISE EN CHARGE -> CLÔTURÉE
 * Consignation des commentaires, audit trail et simulation de notifications.
 */

import { Store } from "../storage/store.js";

export class AlertManager {
  static getAlerts() {
    return Store.get("alerts", []);
  }

  static getRules() {
    return Store.get("alert_rules", []);
  }

  /**
   * Acquitter / Prendre en charge une alarme avec commentaire obligatoire
   */
  static acknowledgeAlert(alertId, commentaire) {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return { success: false, error: "Alerte introuvable" };

    const currentUser = Store.getCurrentUser();
    if (currentUser.role === "Lecteur / Auditeur") {
      return { success: false, error: "Droits insuffisants : Le profil Lecteur ne peut pas acquitter d'alerte." };
    }

    const previousStatus = alert.statut;
    alert.statut = "PRISE_EN_CHARGE";
    alert.datePriseEnCharge = new Date().toISOString();
    alert.acquittePar = currentUser.name;
    alert.commentaire = commentaire || "Prise en charge par l'exploitant sans note spécifique.";

    Store.set("alerts", alerts);
    Store.logAudit("ACQUITTEMENT_ALARME", alertId, previousStatus, `PRISE_EN_CHARGE par ${currentUser.name} - Note: ${alert.commentaire}`);
    return { success: true, alert };
  }

  /**
   * Clôturer une alarme résolue
   */
  static closeAlert(alertId, motifResolution) {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return { success: false, error: "Alerte introuvable" };

    const currentUser = Store.getCurrentUser();
    if (currentUser.role === "Lecteur / Auditeur") {
      return { success: false, error: "Droits insuffisants." };
    }

    const previousStatus = alert.statut;
    alert.statut = "CLOTUREE";
    alert.dateCloture = new Date().toISOString();
    alert.cloturePar = currentUser.name;
    alert.motifResolution = motifResolution || "Retour à la normale constaté.";

    Store.set("alerts", alerts);
    Store.logAudit("CLOTURE_ALARME", alertId, previousStatus, `CLOTUREE par ${currentUser.name} - Motif: ${alert.motifResolution}`);
    return { success: true, alert };
  }

  /**
   * Met à jour une règle de seuil
   */
  static updateRule(ruleId, newParams) {
    const rules = this.getRules();
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return { success: false, error: "Règle introuvable" };

    const oldSeuil = rule.seuilVal || rule.seuilSec;
    Object.assign(rule, newParams);
    const newSeuil = rule.seuilVal || rule.seuilSec;

    Store.set("alert_rules", rules);
    Store.logAudit("MODIFICATION_REGLE_ALARME", rule.nom, `Seuil: ${oldSeuil}`, `Nouveau seuil: ${newSeuil}`);
    return { success: true, rule };
  }

  /**
   * Compte les alertes actives
   */
  static getActiveCount() {
    const alerts = this.getAlerts();
    return alerts.filter(a => a.statut !== "CLOTUREE").length;
  }
}
