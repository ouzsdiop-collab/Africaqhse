import { getApiBase } from '../config.js';
import {
  getSessionUserId,
  setSessionUser,
  getAuthToken,
  clearAuthSession
} from '../data/sessionUser.js';
import { getAccessTokenForRequest } from './auth.js';
import { isDemoMode } from '../services/demoMode.service.js';
import { tryDemoFetchResponse } from '../services/demoModeFetch.js';

let isRefreshing = false;

/**
 * fetch API — priorité au jeton JWT (Authorization), sinon X-User-Id (session / dev).
 * @param {string} path — ex. `/api/actions` ou URL absolue
 * @param {RequestInit & { _retry?: boolean }} [init]
 */
export async function qhseFetch(path, init = {}) {
  const { _retry, ...fetchInit } = init;

  if (isDemoMode()) {
    const demoRes = await tryDemoFetchResponse(path, fetchInit);
    if (demoRes) return demoRes;
  }

  const base = getApiBase();
  const url = path.startsWith('http')
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(fetchInit.headers || undefined);

  const token = getAccessTokenForRequest() || getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    const uid = getSessionUserId();
    if (uid) headers.set('X-User-Id', uid);
  }
  if (fetchInit.body instanceof FormData) {
    headers.delete('Content-Type');
  }
  const sentBearer = Boolean(token);

  const isRefreshUrl = url.includes('/api/auth/refresh');
  const isLoginUrl = url.includes('/api/auth/login');

  let res = await fetch(url, { ...fetchInit, headers });

  if (
    res.status === 401 &&
    sentBearer &&
    !_retry &&
    !isRefreshing &&
    !isRefreshUrl &&
    !isLoginUrl
  ) {
    isRefreshing = true;
    try {
      const { refreshAccessToken } = await import('./auth.js');
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryHeaders = new Headers(fetchInit.headers || undefined);
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return qhseFetch(path, { ...fetchInit, _retry: true, headers: retryHeaders });
      }
    } catch {
      /* ignore */
    } finally {
      isRefreshing = false;
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
