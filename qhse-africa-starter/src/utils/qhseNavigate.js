/**
 * Navigation inter-modules avec ancre / filtres cibles (localStorage via `pushDashboardIntent`).
 * Utiliser pour les CTA (dashboard, détail, journal) à la place de `window.location.hash =` seul.
 */
import { pushDashboardIntent } from './dashboardNavigationIntent.js';

/** Pages où l’on ne force pas d’ancre par défaut (connexion, settings, démos…). */
const NO_AUTO_DEEP_LINK = new Set([
  'login',
  'forgot-password',
  'reset-password',
  'first-password',
  'mines-demo',
  'dashboard'
]);

/**
 * Ancrage par défaut lorsque aucune option explicite n’est passée.
 * Les clés correspondent aux ids présents dans les pages (ou ajoutés pour ce besoin).
 */
export const QHSE_NAV_PAGE_DEFAULTS = {
  incidents: { scrollToId: 'incidents-recent-list' },
  /* Avec focusActionId, utiliser skipDefaults:true (appliqué automatiquement par qhseNavigate)
   * pour éviter le filtre « en retard » par défaut, qui masquerait une action toute créée. */
  actions: { scrollToId: 'qhse-actions-col-overdue', actionsColumnFilter: 'overdue' },
  audits: { scrollToId: 'audit-cockpit-tier-score' },
  risks: { scrollToId: 'risks-register-anchor' },
  iso: { scrollToId: 'iso-cockpit-priorities-anchor' },
  permits: { scrollToId: 'permits-lists-anchor' },
  sites: { scrollToId: 'sites-page-anchor' },
  habilitations: { scrollToId: 'habilitations-cockpit-anchor' }
};

/**
 * @param {string} pageId hash sans # (ex. `actions`, `incidents`)
 * @param {Record<string, unknown> & { skipDefaults?: boolean }} [overrides] fusion avec les défauts ; `skipDefaults: true` pour n’envoyer que ces champs
 */
export function qhseNavigate(pageId, overrides = {}) {
  const raw = String(pageId || '').trim();
  const pid = raw.split('?')[0].split('/')[0];
  if (!pid) return;

  let skipDefaults = Boolean(overrides.skipDefaults);
  /** @type {Record<string, unknown>} */
  const { skipDefaults: _sd, ...rest } = overrides;

  const hasFocusAction =
    (rest.focusActionId != null && String(rest.focusActionId).trim() !== '') ||
    (rest.openActionId != null && String(rest.openActionId).trim() !== '');
  const hasFocusIncident =
    (rest.focusIncidentRef != null && String(rest.focusIncidentRef).trim() !== '') ||
    (rest.openIncidentRef != null && String(rest.openIncidentRef).trim() !== '') ||
    (rest.focusIncidentId != null && String(rest.focusIncidentId).trim() !== '');
  const explicitSkipDefaults = Object.prototype.hasOwnProperty.call(overrides, 'skipDefaults');
  if ((hasFocusAction || hasFocusIncident) && !explicitSkipDefaults) {
    skipDefaults = true;
  }

  let merged = /** @type {Record<string, unknown>} */ ({});
  if (!NO_AUTO_DEEP_LINK.has(pid) && !skipDefaults) {
    const def = QHSE_NAV_PAGE_DEFAULTS[pid];
    if (def && typeof def === 'object') merged = { ...def };
  }
  merged = { ...merged, ...rest };
  delete merged.skipDefaults;
  for (const k of Object.keys(merged)) {
    if (merged[k] === undefined || merged[k] === '') delete merged[k];
  }

  const keys = Object.keys(merged);
  if (keys.length > 0) {
    pushDashboardIntent({
      ...merged,
      source: typeof merged.source === 'string' ? merged.source : 'qhse_nav'
    });
  }

  window.location.hash = pid;
}
