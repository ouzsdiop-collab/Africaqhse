import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';

const SYNC_QUEUE_KEY = 'qhse.ptw.signatures.syncQueue.v1';

/** @type {Array<Record<string, any>>} */
let permitsCache = [];

/**
 * @returns {Array<Record<string, any>>}
 */
function readQueue() {
  try {
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {Array<Record<string, any>>} queue
 */
function writeQueue(queue) {
  window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * @returns {boolean}
 */
function isOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

/**
 * @param {Record<string, any>} permit
 * @param {string} event
 * @param {Record<string, any>} [meta]
 */
function appendAuditTrail(permit, event, meta = {}) {
  permit.auditTrail = Array.isArray(permit.auditTrail) ? permit.auditTrail : [];
  permit.auditTrail.push({
    event,
    at: new Date().toISOString(),
    ...meta
  });
}

/**
 * @param {Record<string, any>} row
 */
function upsertCacheRow(row) {
  if (!row || !row.id) return;
  const i = permitsCache.findIndex((p) => p && p.id === row.id);
  if (i >= 0) permitsCache[i] = row;
  else permitsCache.unshift(row);
}

/**
 * @param {Record<string, any>} permit
 */
function apiBodyFromPermit(permit) {
  const body = { ...permit };
  delete body.id;
  delete body.ref;
  delete body.synced;
  delete body.syncState;
  delete body.syncPendingCount;
  delete body.createdAt;
  delete body.updatedAt;
  return body;
}

/**
 * Charge les permis depuis l’API et fusionne avec les fiches locales non synchronisées.
 * @returns {Promise<void>}
 */
export async function refreshPermitsFromApi() {
  try {
    const res = await qhseFetch(withSiteQuery('/api/ptw'));
    if (!res.ok) return;
    const rows = await res.json().catch(() => null);
    if (!Array.isArray(rows)) return;
    const locals = permitsCache.filter((p) => p && p.synced === false);
    const merged = [...rows];
    for (const l of locals) {
      if (!rows.some((r) => r && r.id === l.id)) merged.push(l);
    }
    permitsCache = merged;
  } catch {
    /* hors-ligne */
  }
}

/**
 * @returns {Promise<{ flushed: number; pending: number }>}
 */
export async function flushSyncQueue() {
  if (!isOnline()) return { flushed: 0, pending: readQueue().length };
  const q = readQueue();
  if (!q.length) return { flushed: 0, pending: 0 };
  /** @type {Map<string, string>} */
  const idMap = new Map();
  const remaining = [];
  let flushed = 0;

  for (const item of q) {
    if (item && item.kind === 'create' && item.body) {
      try {
        const res = await qhseFetch(withSiteQuery('/api/ptw'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body)
        });
        if (!res.ok) {
          remaining.push(item);
          continue;
        }
        const row = await res.json();
        const tempId = typeof item.tempId === 'string' ? item.tempId : '';
        if (tempId && row.id) idMap.set(tempId, row.id);
        permitsCache = permitsCache.filter((p) => p && p.id !== tempId);
        upsertCacheRow(row);
        flushed += 1;
      } catch {
        remaining.push(item);
      }
      continue;
    }

    if (item && item.kind === 'sign' && item.permitId && item.role && item.data) {
      const mapped = idMap.get(item.permitId) || item.permitId;
      try {
        const res = await qhseFetch(`/api/ptw/${encodeURIComponent(mapped)}/sign`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: item.role,
            name: item.data.name,
            signatureDataUrl: item.data.signatureDataUrl || '',
            userId: item.data.userId || '',
            userLabel: item.data.userLabel || ''
          })
        });
        if (!res.ok) {
          remaining.push(item);
          continue;
        }
        const row = await res.json();
        upsertCacheRow(row);
        flushed += 1;
      } catch {
        remaining.push(item);
      }
      continue;
    }

    if (item && item.permitId && item.signatureId) {
      const pid = idMap.get(item.permitId) || item.permitId;
      const p = permitsCache.find((x) => x && x.id === pid);
      const sig = p?.signatures?.find((s) => s && s.id === item.signatureId);
      if (!p || !sig) {
        remaining.push(item);
        continue;
      }
      try {
        const res = await qhseFetch(`/api/ptw/${encodeURIComponent(pid)}/sign`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: sig.role,
            name: sig.name,
            signatureDataUrl: sig.signatureDataUrl || '',
            userId: sig.userId || '',
            userLabel: sig.userLabel || ''
          })
        });
        if (!res.ok) {
          remaining.push(item);
          continue;
        }
        const row = await res.json();
        upsertCacheRow(row);
        sig.syncStatus = 'synced';
        flushed += 1;
      } catch {
        remaining.push(item);
      }
      continue;
    }

    remaining.push(item);
  }

  writeQueue(remaining);
  return { flushed, pending: remaining.length };
}

function installOnlineFlushOnce() {
  if (typeof window === 'undefined' || window.__qhsePtwOnlineFlush) return;
  window.__qhsePtwOnlineFlush = true;
  window.addEventListener('online', () => {
    void flushSyncQueue();
  });
}

installOnlineFlushOnce();

/**
 * @returns {Array<Record<string, any>>}
 */
export function listPermits() {
  return [...permitsCache].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
}

/**
 * @param {{
 *  type: string;
 *  description: string;
 *  zone: string;
 *  date: string;
 *  team: string;
 *  checklist: string[];
 *  epi: string[];
 *  safetyConditions: string[];
 *  status: string;
 * }} payload
 */
export async function createPermit(payload) {
  const now = new Date().toISOString();
  const permit = {
    type: payload.type,
    description: payload.description,
    zone: payload.zone,
    date: payload.date,
    team: payload.team,
    checklist: payload.checklist || [],
    epi: payload.epi || [],
    safetyConditions: payload.safetyConditions || [],
    status: payload.status || 'pending',
    riskAnalysis: payload.riskAnalysis || '',
    validationMode: payload.validationMode || 'double',
    activatedAt: '',
    closedAt: '',
    closedBy: '',
    validations: {
      supervisor: { signed: false, name: '', signedAt: '', signatureDataUrl: '' },
      qhse: { signed: false, name: '', signedAt: '', signatureDataUrl: '' },
      responsable: { signed: false, name: '', signedAt: '', signatureDataUrl: '' }
    },
    signatures: [],
    synced: false,
    syncState: 'local',
    syncPendingCount: 0,
    auditTrail: [],
    createdAt: now,
    updatedAt: now
  };
  appendAuditTrail(permit, 'permit_created', { status: permit.status });

  if (isOnline()) {
    try {
      const res = await qhseFetch(withSiteQuery('/api/ptw'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBodyFromPermit(permit))
      });
      if (res.ok) {
        const row = await res.json();
        upsertCacheRow(row);
        return row;
      }
    } catch {
      /* file d’attente terrain */
    }
  }

  const tempId = `ptw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  permit.id = tempId;
  permit.ref = `LOCAL-${tempId}`;
  permitsCache.push(permit);
  const queue = readQueue();
  queue.push({
    kind: 'create',
    tempId,
    body: apiBodyFromPermit(permit),
    queuedAt: now
  });
  writeQueue(queue);
  return permit;
}

/**
 * @param {string} id
 * @param {Record<string, any>} patch
 */
export async function patchPermit(id, patch) {
  const hit = permitsCache.find((x) => x && x.id === id);
  if (!hit) return null;
  Object.assign(hit, patch || {});
  hit.updatedAt = new Date().toISOString();
  appendAuditTrail(hit, 'permit_patched', { keys: Object.keys(patch || {}) });

  if (isOnline() && hit.synced !== false) {
    try {
      const res = await qhseFetch(`/api/ptw/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch || {})
      });
      if (res.ok) {
        const row = await res.json();
        upsertCacheRow(row);
        return row;
      }
    } catch {
      /* ignore */
    }
  }
  return hit;
}

/**
 * @param {string} id
 * @param {string} status
 */
export async function updatePermitStatus(id, status) {
  return patchPermit(id, { status });
}

/**
 * @param {string} id
 * @param {'supervisor'|'qhse'|'responsable'|string} role
 * @param {{ name: string; signatureDataUrl?: string; userId?: string; userLabel?: string }} data
 */
export async function signPermit(id, role, data) {
  const hit = permitsCache.find((x) => x && x.id === id);
  if (!hit) return null;
  const online = isOnline();
  const signedAt = new Date().toISOString();
  const signatureId = `ptw_sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  hit.signatures = Array.isArray(hit.signatures) ? hit.signatures : [];
  hit.signatures.push({
    id: signatureId,
    role,
    name: data.name || '',
    signedAt,
    signatureDataUrl: data.signatureDataUrl || '',
    userId: data.userId || '',
    userLabel: data.userLabel || '',
    syncStatus: online ? 'synced' : 'pending_sync'
  });

  hit.validations = hit.validations || {};
  if (role === 'supervisor' || role === 'qhse' || role === 'responsable') {
    hit.validations[role] = {
      signed: true,
      name: data.name || '',
      signedAt,
      signatureDataUrl: data.signatureDataUrl || ''
    };
  }

  let signedViaApi = false;
  if (online && hit.synced !== false) {
    try {
      const res = await qhseFetch(`/api/ptw/${encodeURIComponent(id)}/sign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name: data.name || '',
          signatureDataUrl: data.signatureDataUrl || '',
          userId: data.userId || '',
          userLabel: data.userLabel || ''
        })
      });
      if (res.ok) {
        const row = await res.json();
        upsertCacheRow(row);
        signedViaApi = true;
      }
    } catch {
      /* file d’attente */
    }
  }

  if (!signedViaApi) {
    const queue = readQueue();
    queue.push({
      kind: 'sign',
      permitId: id,
      role,
      data: {
        name: data.name || '',
        signatureDataUrl: data.signatureDataUrl || '',
        userId: data.userId || '',
        userLabel: data.userLabel || ''
      },
      signatureId,
      queuedAt: signedAt
    });
    writeQueue(queue);
  }

  if (signedViaApi) {
    return permitsCache.find((x) => x && x.id === id) || hit;
  }

  const bothSigned = hit.validations.supervisor?.signed && hit.validations.qhse?.signed;
  if (bothSigned && (hit.status === 'open' || hit.status === 'pending')) hit.status = 'validated';
  hit.syncPendingCount = hit.signatures.filter((s) => s.syncStatus === 'pending_sync').length;
  hit.syncState = hit.syncPendingCount > 0 ? 'pending_sync' : 'synced';
  appendAuditTrail(hit, 'permit_signed', {
    role,
    signedBy: data.name || '',
    syncStatus: online ? 'synced' : 'pending_sync'
  });
  hit.updatedAt = new Date().toISOString();
  return hit;
}

export function getSyncState() {
  return {
    online: isOnline(),
    pendingCount: readQueue().length
  };
}

/**
 * @deprecated Utiliser {@link flushSyncQueue} (async).
 */
export function syncPendingSignatures() {
  return { synced: 0, pending: readQueue().length };
}
