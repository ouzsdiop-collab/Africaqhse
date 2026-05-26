import { qhseFetch } from '../../utils/qhseFetch.js';
import { getGateToken, resetAdminGateSession } from '../../utils/adminGateSession.js';

function buildLocalMissingTokenResponse() {
  return {
    status: 428,
    data: {
      error: 'Session admin en cours d’initialisation...',
      code: 'MISSING_GATE_TOKEN_LOCAL'
    }
  };
}

export async function adminGateRequest(path, options = {}, { onAuthError } = {}) {
  const token = getGateToken();
  if (!token) {
    return buildLocalMissingTokenResponse();
  }

  const headers = new Headers(options.headers || undefined);
  headers.set('Authorization', `Bearer ${token}`);

  const response = await qhseFetch(`/api/admin-gate${path}`, { ...options, headers });
  const data = await jsonOrEmpty(response);
  const result = { status: response.status, data };

  if (response.status === 401 || response.status === 403) {
    resetAdminGateSession();
    onAuthError?.();
  }

  if (response.status === 200 || response.status === 201) {
    return result;
  }

  const error = new Error(getApiErrorMessage(response.status, data));
  error.status = response.status;
  error.data = data;
  throw error;
}

export async function adminGateApi(path, options = {}, { onAuthError } = {}) {
  const { status, data } = await adminGateRequest(path, options, { onAuthError });
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
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
  const candidate =
    payload?.temporaryPasswordOneTime
    ?? payload?.temporaryPassword
    ?? payload?.password
    ?? payload?.user?.temporaryPasswordOneTime
    ?? payload?.createdUser?.temporaryPasswordOneTime
    ?? payload?.initialUser?.temporaryPasswordOneTime
    ?? payload?.data?.temporaryPasswordOneTime
    ?? payload?.data?.user?.temporaryPasswordOneTime;
  const pwd = typeof candidate === 'string' ? candidate.trim() : '';
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
