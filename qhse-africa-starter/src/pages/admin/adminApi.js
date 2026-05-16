import { qhseFetch } from '../../utils/qhseFetch.js';

export async function adminApi(path, options = {}) {
  return qhseFetch(`/api/admin${path}`, options);
}

export async function authApi(path, options = {}) {
  return qhseFetch(`/api/auth${path}`, options);
}

export function jsonOrEmpty(response) {
  return response.json().catch(() => ({}));
}

export function extractOneTimePassword(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const pwd = typeof payload.temporaryPasswordOneTime === 'string' ? payload.temporaryPasswordOneTime.trim() : '';
  if (!pwd) return null;
  return {
    email: payload?.user?.email || payload?.email || '—',
    password: pwd,
    expiresAt: payload?.temporaryPasswordExpiresAt || payload?.temporaryPassword?.expiresAt || null,
    emailSent: payload?.invitation?.sent ?? payload?.emailSent ?? null
  };
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
