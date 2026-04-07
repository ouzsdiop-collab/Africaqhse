const STORAGE_KEY = 'qhse.ptw.permits.v1';
const SYNC_QUEUE_KEY = 'qhse.ptw.signatures.syncQueue.v1';

/**
 * @typedef {'pending'|'open'|'validated'|'in_progress'|'closed'} PtwStatus
 */

/**
 * @returns {Array<Record<string, any>>}
 */
function readRaw() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {Array<Record<string, any>>} items
 */
function writeRaw(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * @returns {boolean}
 */
function isOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

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
 * @returns {Array<Record<string, any>>}
 */
export function listPermits() {
  return readRaw().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
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
 *  status: PtwStatus;
 * }} payload
 */
export function createPermit(payload) {
  const now = new Date().toISOString();
  const permit = {
    id: `ptw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
      qhse: { signed: false, name: '', signedAt: '', signatureDataUrl: '' }
    },
    signatures: [],
    syncState: 'synced',
    syncPendingCount: 0,
    auditTrail: [],
    createdAt: now,
    updatedAt: now
  };
  appendAuditTrail(permit, 'permit_created', { status: permit.status });
  const items = readRaw();
  items.push(permit);
  writeRaw(items);
  return permit;
}

/**
 * @param {string} id
 * @param {Record<string, any>} patch
 */
export function patchPermit(id, patch) {
  const items = readRaw();
  const hit = items.find((x) => x.id === id);
  if (!hit) return null;
  Object.assign(hit, patch || {});
  hit.updatedAt = new Date().toISOString();
  appendAuditTrail(hit, 'permit_patched', { keys: Object.keys(patch || {}) });
  writeRaw(items);
  return hit;
}

/**
 * @param {string} id
 * @param {PtwStatus} status
 */
export function updatePermitStatus(id, status) {
  const items = readRaw();
  const hit = items.find((x) => x.id === id);
  if (!hit) return null;
  hit.status = status;
  hit.updatedAt = new Date().toISOString();
  appendAuditTrail(hit, 'status_updated', { status });
  writeRaw(items);
  return hit;
}

/**
 * @param {string} id
 * @param {'supervisor'|'qhse'|'responsable'|string} role
 * @param {{ name: string; signatureDataUrl?: string; userId?: string; userLabel?: string }} data
 */
export function signPermit(id, role, data) {
  const items = readRaw();
  const hit = items.find((x) => x.id === id);
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

  if (!online) {
    const queue = readQueue();
    queue.push({ permitId: id, signatureId, queuedAt: signedAt });
    writeQueue(queue);
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
  writeRaw(items);
  return hit;
}

export function getSyncState() {
  return {
    online: isOnline(),
    pendingCount: readQueue().length
  };
}

export function syncPendingSignatures() {
  if (!isOnline()) return { synced: 0, pending: readQueue().length };
  const queue = readQueue();
  if (!queue.length) return { synced: 0, pending: 0 };
  const items = readRaw();
  let synced = 0;
  queue.forEach((q) => {
    const permit = items.find((x) => x.id === q.permitId);
    if (!permit || !Array.isArray(permit.signatures)) return;
    const sig = permit.signatures.find((s) => s.id === q.signatureId);
    if (!sig || sig.syncStatus === 'synced') return;
    sig.syncStatus = 'synced';
    synced += 1;
    appendAuditTrail(permit, 'signature_synced', {
      signatureId: sig.id,
      role: sig.role,
      signedBy: sig.name || ''
    });
    permit.syncPendingCount = permit.signatures.filter((s) => s.syncStatus === 'pending_sync').length;
    permit.syncState = permit.syncPendingCount > 0 ? 'pending_sync' : 'synced';
    permit.updatedAt = new Date().toISOString();
  });
  writeRaw(items);
  writeQueue([]);
  return { synced, pending: 0 };
}
