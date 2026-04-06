import { getApiBase } from '../config.js';

const STORAGE_KEY = 'qhseSessionUser';
const TOKEN_KEY = 'qhseAuthToken';

/**
 * Profil utilisateur — alimenté par connexion JWT (/api/auth/login) ou sélection manuelle (démo).
 * @typedef {{ id: string, name: string, role: string, email?: string }} SessionUser
 */

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

/** Supprime le jeton et le profil stocké (déconnexion). */
export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  setSessionUser(null);
}

/** @param {SessionUser} user @param {string} token */
export function setAuthSession(user, token) {
  setAuthToken(token);
  setSessionUser(user);
}

/**
 * Au chargement : si un jeton est présent, resynchronise le profil avec GET /api/auth/me.
 */
export async function restoreSessionFromToken() {
  const t = getAuthToken();
  if (!t) return;
  try {
    const res = await fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${t}` }
    });
    if (!res.ok) {
      clearAuthSession();
      return;
    }
    const data = await res.json();
    if (data?.user?.id) {
      setSessionUser({
        id: data.user.id,
        name: data.user.name || '',
        email: data.user.email || '',
        role: data.user.role || ''
      });
    } else {
      clearAuthSession();
    }
  } catch {
    /* Erreur réseau : ne pas supprimer le jeton (API lente au boot ou coupure temporaire). */
  }
}
