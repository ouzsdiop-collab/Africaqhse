import { getApiBase } from '../config.js';
import { nativeFetch, clearAuthSession, clearSession } from '../data/sessionUser.js';

/**
 * Déconnexion robuste :
 * - tente toujours le POST /api/auth/logout (efface le cookie refresh httpOnly côté serveur),
 * - nettoie toujours toutes les clés locales (y compris legacy),
 * - redirige vers #login par défaut.
 *
 * @param {{ redirectToLogin?: boolean }} [opts]
 */
export async function logoutAndClear(opts = {}) {
  const redirectToLogin = opts?.redirectToLogin !== false;
  try {
    await nativeFetch(`${getApiBase()}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {});
  } finally {
    try {
      const purgePrefixes = ['qhse.dashboard.intent', 'qhse.cache.risks.list.v1'];
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (typeof k === 'string' && k) keys.push(k);
      }
      for (const k of keys) {
        if (purgePrefixes.some((p) => k === p || k.startsWith(`${p}:`) || k.startsWith(`${p}.`))) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore storage access errors
    }
    if (redirectToLogin) {
      clearSession();
    } else {
      clearAuthSession();
    }
  }
}
