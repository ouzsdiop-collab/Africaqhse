import { getApiBase } from '../config.js';
import {
  getSessionUserId,
  setSessionUser,
  getAuthToken,
  clearAuthSession
} from '../data/sessionUser.js';
import { refreshAccessToken, getAccessTokenForRequest } from './auth.js';
import { isDemoMode } from '../services/demoMode.service.js';
import { tryDemoFetchResponse } from '../services/demoModeFetch.js';

/**
 * fetch API — priorité au jeton JWT (Authorization), sinon X-User-Id (session / dev).
 * @param {string} path — ex. `/api/actions` ou URL absolue
 * @param {RequestInit} [init]
 */
export async function qhseFetch(path, init = {}) {
  if (isDemoMode()) {
    const demoRes = await tryDemoFetchResponse(path, init);
    if (demoRes) return demoRes;
  }

  const base = getApiBase();
  const url = path.startsWith('http')
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers || undefined);

  const token = getAccessTokenForRequest() || getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    const uid = getSessionUserId();
    if (uid) headers.set('X-User-Id', uid);
  }
  if (init.body instanceof FormData) {
    headers.delete('Content-Type');
  }
  const sentBearer = Boolean(token);

  const isRefreshUrl = url.includes('/api/auth/refresh');
  const isLoginUrl = url.includes('/api/auth/login');

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && sentBearer && !isRefreshUrl && !isLoginUrl) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || undefined);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (init.body instanceof FormData) {
        retryHeaders.delete('Content-Type');
      }
      res = await fetch(url, { ...init, headers: retryHeaders });
    }
  }

  if (res.status === 401 && sentBearer) {
    clearAuthSession();
  }
  if (res.status === 403) {
    try {
      const data = await res.clone().json();
      const msg = typeof data?.error === 'string' ? data.error : '';
      if (msg.includes('Profil inconnu')) {
        setSessionUser(null);
      }
    } catch {
      /* ignore */
    }
  }
  return res;
}
