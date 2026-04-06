import { getApiBase } from '../config.js';
import {
  getSessionUserId,
  setSessionUser,
  getAuthToken,
  clearAuthSession
} from '../data/sessionUser.js';

/**
 * fetch API — priorité au jeton JWT (Authorization), sinon X-User-Id (démo).
 * @param {string} path — ex. `/api/actions` ou URL absolue
 * @param {RequestInit} [init]
 */
export async function qhseFetch(path, init = {}) {
  const base = getApiBase();
  const url = path.startsWith('http')
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers || undefined);
  const token = getAuthToken();
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
  const res = await fetch(url, { ...init, headers });
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
