import { getApiBase } from '../config.js';
import { setAuthToken } from '../data/sessionUser.js';

const ACCESS_KEY = 'qhse_access_token';

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
    if (accessToken) {
      sessionStorage.setItem(ACCESS_KEY, accessToken);
    }
    if (accessToken) setAuthToken(accessToken);
  } catch {
    /* ignore */
  }
}

export function getAccessTokenForRequest() {
  try {
    return sessionStorage.getItem(ACCESS_KEY) || '';
  } catch {
    return '';
  }
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
      try {
        sessionStorage.removeItem(ACCESS_KEY);
      } catch {
        /* ignore */
      }
      return null;
    }
    const data = await res.json();
    const access = typeof data.accessToken === 'string' ? data.accessToken : '';
    if (!access) return null;
    try {
      sessionStorage.setItem(ACCESS_KEY, access);
      setAuthToken(access);
    } catch {
      /* ignore */
    }
    return access;
  } catch {
    return null;
  }
}
