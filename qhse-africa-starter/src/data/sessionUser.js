import { getApiBase } from '../config.js';

const STORAGE_KEY = 'qhseSessionUser';
const TOKEN_KEY = 'qhseAuthToken';
const TENANT_KEY = 'qhseSessionTenant';
const TENANTS_KEY = 'qhseSessionTenants';

/** Fetch navigateur d’origine (capturé avant le patch global ci-dessous) — utilisé par qhseFetch pour éviter les boucles. */
export const nativeFetch = globalThis.fetch.bind(globalThis);

/**
 * Profil utilisateur — alimenté par connexion JWT (/api/auth/login) ou sélection manuelle (hors JWT).
 * @typedef {{ id: string, name: string, role: string, email?: string }} SessionUser
 */

/**
 * Organisation active (claim JWT `tid`).
 * @typedef {{ id: string, slug: string, name: string }} SessionTenant
 */

/** @returns {SessionTenant | null} */
export function getActiveTenant() {
  try {
    const raw = sessionStorage.getItem(TENANT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.id === 'string' && typeof o.slug === 'string') {
      return {
        id: o.id,
        slug: o.slug,
        name: typeof o.name === 'string' ? o.name : ''
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** @returns {SessionTenant[]} */
export function getSessionTenants() {
  try {
    const raw = sessionStorage.getItem(TENANTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (x) =>
          x &&
          typeof x === 'object' &&
          typeof x.id === 'string' &&
          typeof x.slug === 'string'
      )
      .map((x) => ({
        id: x.id,
        slug: x.slug,
        name: typeof x.name === 'string' ? x.name : '',
        role: typeof x.role === 'string' ? String(x.role).trim().toUpperCase() : ''
      }));
  } catch {
    return [];
  }
}

/**
 * @param {SessionTenant | null | undefined} tenant
 * @param {SessionTenant[] | null | undefined} tenants
 */
function persistTenantContext(tenant, tenants) {
  if (tenant && typeof tenant.id === 'string' && typeof tenant.slug === 'string') {
    sessionStorage.setItem(
      TENANT_KEY,
      JSON.stringify({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name || ''
      })
    );
  } else {
    sessionStorage.removeItem(TENANT_KEY);
  }
  if (Array.isArray(tenants) && tenants.length) {
    const normalized = tenants.map((x) => ({
      id: String(x.id),
      slug: String(x.slug),
      name: typeof x.name === 'string' ? x.name : '',
      role: typeof x.role === 'string' ? String(x.role).trim().toUpperCase() : ''
    }));
    sessionStorage.setItem(TENANTS_KEY, JSON.stringify(normalized));
  } else {
    sessionStorage.removeItem(TENANTS_KEY);
  }
}

/** @returns {SessionUser | null} */
export function getSessionUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.id === 'string' && typeof o.role === 'string') {
      return {
        id: o.id,
        name: typeof o.name === 'string' ? o.name : '',
        email: typeof o.email === 'string' ? o.email : '',
        role: String(o.role ?? '').trim().toUpperCase()
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** @param {SessionUser | null} user */
export function setSessionUser(user) {
  if (!user || !user.id) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: String(user.role ?? '').trim().toUpperCase()
    })
  );
}

export function getSessionUserId() {
  return getSessionUser()?.id || '';
}

export function getAuthToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  if (!token) {
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  sessionStorage.setItem(TOKEN_KEY, token);
}

/** Supprime le jeton et le profil stocké (déconnexion). Le refresh httpOnly est effacé côté serveur via POST /api/auth/logout. */
export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TENANT_KEY);
  sessionStorage.removeItem(TENANTS_KEY);
  setSessionUser(null);
}

/** Access / refresh (clés auth.js) + session utilisateur, puis écran de connexion. */
export function clearSession() {
  clearAuthSession();
  try {
    sessionStorage.removeItem('qhse_access_token');
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    const { origin, pathname } = window.location;
    window.location.assign(`${origin}${pathname || '/'}#login`);
  }
}

/**
 * @param {SessionUser} user
 * @param {string} token
 * @param {{ tenant?: SessionTenant | null, tenants?: SessionTenant[] | null }} [ctx]
 */
export function setAuthSession(user, token, ctx = {}) {
  setAuthToken(token);
  setSessionUser(user);
  if (ctx && (ctx.tenant != null || ctx.tenants != null)) {
    persistTenantContext(ctx.tenant ?? null, ctx.tenants ?? null);
  }
}

/**
 * Change d’organisation sans redemander le mot de passe (JWT actif requis).
 * @param {string} tenantSlug
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function switchActiveTenant(tenantSlug) {
  const slug = typeof tenantSlug === 'string' ? tenantSlug.trim().toLowerCase() : '';
  if (!slug) {
    return { ok: false, error: 'slug_requis' };
  }
  const token = getAuthToken();
  if (!token) {
    return { ok: false, error: 'no_token' };
  }
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), 12000);
  try {
    const res = await fetch(`${getApiBase()}/api/auth/switch-tenant`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tenantSlug: slug }),
      signal: ac.signal
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuthSession();
      return { ok: false, error: typeof body.error === 'string' ? body.error : 'session_invalid' };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: typeof body.error === 'string' ? body.error : `http_${res.status}`
      };
    }
    if (!body.token || !body.user?.id) {
      return { ok: false, error: 'invalid_response' };
    }
    setAuthSession(
      {
        id: body.user.id,
        name: body.user.name || '',
        email: body.user.email || '',
        role: body.user.role || ''
      },
      body.token,
      {
        tenant: body.tenant,
        tenants: body.tenants
      }
    );
    return { ok: true };
  } catch (e) {
    if (e?.name === 'AbortError') {
      return { ok: false, error: 'timeout' };
    }
    return { ok: false, error: 'network' };
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Au chargement : si un jeton est présent, resynchronise le profil avec GET /api/auth/me.
 */
export async function restoreSessionFromToken() {
  const t = getAuthToken();
  if (!t) return;
  const ac = new AbortController();
  const ms = 8000;
  const tid = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(`${getApiBase()}/api/auth/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${t}` },
      signal: ac.signal
    });
    /* 401 seul = jeton refusé. Autres erreurs (5xx, 502, coupure) : ne pas vider la session. */
    if (res.status === 401) {
      clearAuthSession();
      return;
    }
    if (!res.ok) {
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data?.user?.id) {
      setSessionUser({
        id: data.user.id,
        name: data.user.name || '',
        email: data.user.email || '',
        role: data.user.role || ''
      });
      if (data.tenant) {
        persistTenantContext(data.tenant, data.tenants);
      }
    } else {
      clearAuthSession();
    }
  } catch (e) {
    /* Timeout / réseau : ne pas supprimer le jeton ; l’UI doit quand même s’afficher. */
    if (e?.name === 'AbortError') return;
  } finally {
    clearTimeout(tid);
  }
}

function resolveFetchUrl(input) {
  if (typeof input === 'string') return input;
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return '';
}

/**
 * Extrait le chemin `/api/...` (+ query) pour déléguer au client API (mode démo, refresh, etc.).
 * @param {string} url
 * @returns {string | null}
 */
function toRelativeApiPath(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://qhse.local';
    const u = s.startsWith('http') ? new URL(s) : new URL(s, base);
    if (!u.pathname.startsWith('/api')) return null;
    return `${u.pathname}${u.search}`;
  } catch {
    return s.startsWith('/api') ? s : null;
  }
}

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 */
async function qhseFetchWithRefresh(input, init) {
  const url = resolveFetchUrl(input);
  const apiPath = toRelativeApiPath(url);
  if (apiPath) {
    const { qhseFetch } = await import('../utils/qhseFetch.js');
    return qhseFetch(apiPath, init || {});
  }
  return nativeFetch(input, init || {});
}

globalThis.fetch = qhseFetchWithRefresh;
