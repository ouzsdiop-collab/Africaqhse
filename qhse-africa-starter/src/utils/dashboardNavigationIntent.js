/**
 * Intent de navigation depuis le tableau de bord vers d’autres modules (localStorage).
 * Centralise la clé et les helpers pour éviter la duplication entre pages (incidents, risques, audits…).
 *
 * Champs optionnels pour les deep-links (ex. « À traiter immédiatement ») :
 * - `source`: `'dashboard_priority_now'` — avec `scrollToId`, filtres ciblés selon le module.
 * - `scrollToId`: id DOM à faire défiler après rendu.
 * - `incidentSeverityFilter`: `'critique'` sur la page incidents.
 * - `actionsColumnFilter`: `'overdue'` sur la page actions (filtre colonne Kanban).
 * - `focusActionId` (alias `openActionId`) : après chargement du plan d’actions, ouvrir la fiche de
 *   l’action dont l’`id` API correspond. Optionnel : `focusActionTitle` pour repère texte si
 *   l’id n’est pas trouvé (recherche par titre partiel, côté client).
 *   Fallback : si l’action n’existe pas dans la liste reçue, la page affiche la liste (filtres
 *   assouplis) et un toast d’avertissement — pas d’erreur bloquante.
 * - `focusIncidentId`, `focusIncidentRef` (alias `openIncidentRef`) : ouvrir le panneau détail de
 *   l’incident après rendu du registre. Optionnel : `focusIncidentHintTitle` pour recherche douce.
 *   Fallback : liste inchangée + toast si aucune correspondance.
 * - `linkedIncidentRef` : contexte décoratif / liaison — peut accompagner une navigation « Actions ».
 * - `focusRiskId`, `focusRiskTitle` : après chargement du registre risques, ouvrir la fiche dont l’id ou le
 *   titre correspond (recherche douce sur le titre). Fallback : liste + toast si aucune correspondance.
 * - `linkedRiskId`, `linkedRiskTitle` : contexte risque pour une navigation « Produits / FDS » (recherche ou hint UI).
 * - `focusAuditId`, `focusAuditRef`, `focusAuditTitle` : cibler l’audit affiché (cockpit démo ou ligne
 *   planification) — scroll / rappel fiche si la référence correspond.
 * - `linkedAuditId`, `linkedAuditTitle` : contexte audit transmis au plan d’actions (hint / liaison affichée).
 * - `linkedNonConformity` : libellé court (point de contrôle ou ref. NC) pour contextualiser une action.
 * - `openRiskCreateFromIntent`, `riskPrefillTitle`, `riskPrefillDescription` : ouvrir le dialogue de création
 *   risque avec brouillon (navigation depuis audit / NC).
 * - `riskBannerKpi` : `'critique'` — active le filtre « Critiques » des cartes pilotage sur la page risques
 *   (équivalent clic bannière).
 * - `dashboardIncidentPeriodPreset` : `'7' | '30'` — synchronise le filtre période du registre incidents
 *   (sous-ensemble de l’UI 7/30 j. existant).
 * - `productsFdsValidity` : `'expired' | 'missing' | 'review'` — filtre client sur Produits & FDS (sans backend).
 * - Champs décoratifs utiles au débogage / UX : `source` identifiant la zone UI ayant poussé l’intent.
 */

export const DASHBOARD_INTENT_STORAGE_KEY = 'qhse.dashboard.intent';

/** @returns {Record<string, unknown> | null} */
export function consumeDashboardIntent() {
  try {
    const raw = localStorage.getItem(DASHBOARD_INTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    localStorage.removeItem(DASHBOARD_INTENT_STORAGE_KEY);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown>} intent */
export function pushDashboardIntent(intent) {
  try {
    const payload = JSON.stringify({
      ...intent,
      at: new Date().toISOString()
    });
    localStorage.setItem(DASHBOARD_INTENT_STORAGE_KEY, payload);
    localStorage.setItem(`${DASHBOARD_INTENT_STORAGE_KEY}.last`, payload);
  } catch {
    // no-op
  }
}
