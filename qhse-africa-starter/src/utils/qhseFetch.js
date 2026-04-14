import { getApiBase } from '../config.js';
import {
  getSessionUserId,
  setSessionUser,
  getAuthToken,
  getSessionUser,
  clearSession,
  nativeFetch
} from '../data/sessionUser.js';
import { getAccessTokenForRequest, refreshAccessToken } from './auth.js';
import { isDemoMode } from '../services/demoMode.service.js';
import { tryDemoFetchResponse } from '../services/demoModeFetch.js';

/** @type {Promise<string | null> | null} */
let refreshPromise = null;

function sharedRefreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      return await refreshAccessToken();
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/**
 * fetch API — priorité au jeton JWT (Authorization), sinon X-User-Id (session / dev).
 * Sans les deux, le backend répond souvent 403 « Contexte organisation requis » (hors routes exemptées).
 *
 * En navigateur, un 403 dont le JSON `error` évoque le contexte organisation déclenche
 * `CustomEvent` **`qhse:tenant-context-required`** sur `window` (`detail`: `{ path, url }`)
 * pour afficher un message ou rediriger sans coupler ce module à un système de toast.
 *
 * @param {string} path — ex. `/api/actions` ou URL absolue
 * @param {RequestInit & { _retry?: boolean }} [init]
 */
export async function qhseFetch(path, init = {}) {
  const { _retry, ...fetchInit } = init;

  if (isDemoMode()) {
    const demoRes = await tryDemoFetchResponse(path, fetchInit);
    if (demoRes) return demoRes;
    return new Response(
      JSON.stringify({
        error:
          'Cette opération n’est pas simulée en mode exploration — aucun appel réseau effectué.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }

  const base = getApiBase();
  const url = path.startsWith('http')
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(fetchInit.headers || undefined);

  const isRefreshUrl = url.includes('/api/auth/refresh');
  const isLoginUrl = url.includes('/api/auth/login');

  let token = getAccessTokenForRequest() || getAuthToken();

  /* Profil encore en session mais jeton absent (onglet rouvert, clés effacées) : tenter le refresh
   * cookie avant de retomber sur X-User-Id — en production ce dernier est ignoré → 403 « contexte org ». */
  if (!isRefreshUrl && !isLoginUrl && !token && getSessionUser()) {
    const fromRefresh = await sharedRefreshAccessToken();
    if (fromRefresh) {
      token = fromRefresh;
    }
  }

  if (!isRefreshUrl) {
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      const uid = getSessionUserId();
      if (uid) headers.set('X-User-Id', uid);
    }
  }
  if (fetchInit.body instanceof FormData) {
    headers.delete('Content-Type');
  }
  const sentBearer = Boolean(token) && !isRefreshUrl;

  let res = await nativeFetch(url, {
    ...fetchInit,
    headers,
    credentials: 'include'
  });

  if (
    res.status === 401 &&
    sentBearer &&
    !_retry &&
    !isRefreshUrl &&
    !isLoginUrl
  ) {
    const newToken = await sharedRefreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(fetchInit.headers || undefined);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return qhseFetch(path, { ...fetchInit, _retry: true, headers: retryHeaders });
    }
    clearSession();
    return res;
  }

  if (res.status === 401 && sentBearer && !isLoginUrl) {
    clearSession();
  }
  if (res.status === 403) {
    try {
      const data = await res.clone().json();
      const msg = typeof data?.error === 'string' ? data.error : '';
      if (msg.includes('Profil inconnu')) {
        setSessionUser(null);
      }
      if (typeof window !== 'undefined' && msg.includes('Contexte organisation')) {
        window.dispatchEvent(
          new CustomEvent('qhse:tenant-context-required', {
            detail: { path, url }
          })
        );
      }
    } catch {
      /* ignore */
    }
  }
  return res;
}
