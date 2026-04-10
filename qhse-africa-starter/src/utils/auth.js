import { getApiBase } from '../config.js';
import { setAuthToken, setRefreshToken } from '../data/sessionUser.js';

const ACCESS_KEY = 'qhse_access_token';
const REFRESH_KEY = 'qhse_refresh_token';

/** Clé historique (sessionUser) pour compatibilité. */
const LEGACY_REFRESH_KEY = 'qhseRefreshToken';

/**
 * Après un login réussi : access en sessionStorage, refresh en localStorage.
 * Synchronise aussi les clés utilisées par sessionUser (Bearer / logout).
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export function persistAuthTokensAfterLogin(accessToken, refreshToken) {
  try {
    if (accessToken) sessionStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (accessToken) setAuthToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
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

export async function refreshAccessToken() {
  let refreshToken = '';
  try {
    refreshToken =
      localStorage.getItem(REFRESH_KEY) || localStorage.getItem(LEGACY_REFRESH_KEY) || '';
  } catch {
    refreshToken = '';
  }
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${getApiBase()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) {
      try {
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(LEGACY_REFRESH_KEY);
      } catch {
        /* ignore */
      }
      return null;
    }
    const data = await res.json();
    const access = typeof data.accessToken === 'string' ? data.accessToken : '';
    const nextRt = typeof data.refreshToken === 'string' ? data.refreshToken : '';
    if (!access) return null;
    try {
      sessionStorage.setItem(ACCESS_KEY, access);
      if (nextRt) localStorage.setItem(REFRESH_KEY, nextRt);
      setAuthToken(access);
      if (nextRt) setRefreshToken(nextRt);
    } catch {
      /* ignore */
    }
    return access;
  } catch {
    return null;
  }
}
