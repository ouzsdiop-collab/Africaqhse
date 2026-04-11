/**
 * Intent de navigation depuis le tableau de bord vers d’autres modules (localStorage).
 * Centralise la clé et les helpers pour éviter la duplication entre pages (incidents, risques, audits…).
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
