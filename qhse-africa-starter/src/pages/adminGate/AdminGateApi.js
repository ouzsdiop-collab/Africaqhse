import { qhseFetch } from '../../utils/qhseFetch.js';
import { getGateToken, resetAdminGateSession } from '../../utils/adminGateSession.js';

export async function adminGateApi(path, options = {}, { onAuthError } = {}) {
  const token = getGateToken();
  if (!token) {
    resetAdminGateSession();
    onAuthError?.();
    return new Response(
      JSON.stringify({
        error: 'Accès admin expiré. Veuillez ressaisir le code.',
        code: 'ADMIN_GATE_TOKEN_MISSING'
      }),
      { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
  const headers = new Headers(options.headers || undefined);
  headers.set('Authorization', `Bearer ${token}`);

  const res = await qhseFetch(`/api/admin-gate${path}`, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    resetAdminGateSession();
    onAuthError?.();
  }
  return res;
}

export async function jsonOrEmpty(response) {
  return response.json().catch(() => ({}));
}

export function getApiErrorMessage(status, payload) {
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
  if (payload?.fieldErrors && typeof payload.fieldErrors === 'object') {
    const first = Object.entries(payload.fieldErrors).find(([, arr]) => Array.isArray(arr) && arr.length);
    if (first) return `${first[0]}: ${first[1][0]}`;
  }
  switch (status) {
    case 400:
    case 422:
      return 'Champ invalide ou manquant.';
    case 401:
      return 'Session expirée.';
    case 403:
      return 'Accès admin refusé.';
    case 404:
      return 'Entreprise introuvable.';
    case 409:
      return 'Entreprise ou e-mail déjà existant.';
    default:
      return status >= 500 ? 'Erreur serveur.' : `Erreur ${status}`;
  }
}

export function extractOneTimePassword(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const pwd = typeof payload.temporaryPasswordOneTime === 'string' ? payload.temporaryPasswordOneTime.trim() : '';
  if (!pwd) return null;
  return pwd;
}

export function normalizeClient(row) {
  const tenant = row?.tenant && typeof row.tenant === 'object' ? row.tenant : row || {};
  const users = Array.isArray(row?.users) ? row.users : [];
  const id = String(tenant.id || row?.id || '').trim();
  const statusRaw = String(tenant.status || row?.status || 'active').toLowerCase();
  const status = ['active', 'trial', 'suspended'].includes(statusRaw) ? statusRaw : 'active';
  const activeUsersCount = users.filter((u) => {
    const st = String(u?.status || '').toLowerCase();
    if (st) return st === 'active';
    return Boolean(u?.isActive);
  }).length;
  return {
    id,
    name: String(tenant.name || row?.companyName || row?.name || '—'),
    status,
    users,
    usersCount: users.length,
    activeUsersCount
  };
}
