import { getApiBase } from '../config.js';
import { setAuthToken, getAuthToken, clearStoredAccessTokens } from '../data/sessionUser.js';

/**
 * Après un login réussi : stockage explicite + synchro sessionUser (Bearer).
 * Le refresh est posé en cookie httpOnly par le serveur (plus dans le JSON).
 * @param {{ accessToken?: string, token?: string }} data
 */
export function persistTokensFromLoginResponse(data) {
  if (!data || typeof data !== 'object') return;
  const access = typeof data.accessToken === 'string' ? data.accessToken : '';
  const legacy = typeof data.token === 'string' ? data.token : '';
  const accessToken = access || legacy;
  persistAuthTokensAfterLogin(accessToken);
}

/**
 * @param {string} accessToken
 */
export function persistAuthTokensAfterLogin(accessToken) {
  try {
    if (accessToken) setAuthToken(accessToken);
  } catch {
    /* ignore */
  }
}

export function getAccessTokenForRequest() {
  return getAuthToken();
}

/**
 * Rafraîchit l’access token via le cookie httpOnly `qhse_refresh` (sans body, sans Bearer).
 * @returns {Promise<string | null>}
 */
export async function refreshAccessToken() {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      clearStoredAccessTokens();
      return null;
    }
    const data = await res.json();
    const access = typeof data.accessToken === 'string' ? data.accessToken : '';
    if (!access) return null;
    try {
      setAuthToken(access);
    } catch {
      /* ignore */
    }
    return access;
  } catch {
    return null;
  }
}
