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
    if (redirectToLogin) {
      clearSession();
    } else {
      clearAuthSession();
    }
  }
}

