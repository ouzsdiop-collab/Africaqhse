import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

const TOP_COLUMN_KEYS = new Set([
  'type',
  'status',
  'siteId',
  'assignedTo',
  'validFrom',
  'validUntil',
  'signatures',
  'id',
  'ref',
  'tenantId',
  'createdAt',
  'updatedAt',
  'synced',
  'syncState',
  'syncPendingCount'
]);

/**
 * @param {import('@prisma/client').PermitToWork} row
 */
export function toClientShape(row) {
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? { ...row.payload } : {};
  const sigs = Array.isArray(row.signaturesJson) ? row.signaturesJson : [];
  payload.signatures = sigs;
  const vf = row.validFrom ? row.validFrom.toISOString() : '';
  const vu = row.validUntil ? row.validUntil.toISOString() : '';
  return {
    ...payload,
    id: row.id,
    ref: row.ref,
    type: row.type,
    status: row.status,
    siteId: row.siteId ?? undefined,
    assignedTo: row.assignedTo ?? undefined,
    validFrom: vf || undefined,
    validUntil: vu || undefined,
    signatures: sigs,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    synced: true,
    syncState: 'synced',
    syncPendingCount: sigs.filter((s) => s && s.syncStatus === 'pending_sync').length
  };
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string; status?: string }} [query]
 */
export async function listPermitsToWork(tenantId, query = {}) {
  const tf = prismaTenantFilter(tenantId);
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (query.siteId != null && String(query.siteId).trim()) {
    where.siteId = String(query.siteId).trim();
  }
  if (query.status != null && String(query.status).trim()) {
    where.status = String(query.status).trim();
  }
  const rows = await prisma.permitToWork.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  return rows.map(toClientShape);
}

/**
 * @param {string | null | undefined} tenantId
 */
async function nextRef(tenantId) {
  const year = new Date().getUTCFullYear();
  const prefix = `PTW-${year}-`;
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.permitToWork.findMany({
    where: { ...tf, ref: { startsWith: prefix } },
    select: { ref: true }
  });
  let max = 0;
  for (const r of rows) {
    const m = /^PTW-(\d+)-(\d+)$/i.exec(r.ref);
    if (m && Number(m[1]) === year) {
      max = Math.max(max, parseInt(m[2], 10));
    }
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

/**
 * @param {unknown} v
 */
function parseOptDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {string | null | undefined} tenantId
 * @param {Record<string, unknown>} body
 */
export async function createPermitToWork(tenantId, body) {
  const tid = normalizeTenantId(tenantId) || null;
  const ref = await nextRef(tenantId);
  const type = String(body.type ?? 'permis').trim().slice(0, 200) || 'permis';
  const status = String(body.status ?? 'pending').trim().slice(0, 80) || 'pending';
  const siteId =
    body.siteId != null && String(body.siteId).trim() ? String(body.siteId).trim() : null;
  const assignedTo =
    body.assignedTo != null && String(body.assignedTo).trim()
      ? String(body.assignedTo).trim().slice(0, 200)
      : body.team != null && String(body.team).trim()
        ? String(body.team).trim().slice(0, 200)
        : null;
  const validFrom = parseOptDate(body.validFrom);
  const validUntil = parseOptDate(body.validUntil);
  const signaturesJson = Array.isArray(body.signatures) ? body.signatures : [];
  /** @type {Record<string, unknown>} */
  const payload = {};
  for (const [k, val] of Object.entries(body)) {
    if (TOP_COLUMN_KEYS.has(k)) continue;
    payload[k] = val;
  }
  payload.signatures = signaturesJson;

  const row = await prisma.permitToWork.create({
    data: {
      tenantId: tid,
      ref,
      siteId,
      type,
      status,
      assignedTo,
      validFrom,
      validUntil,
      signaturesJson,
      payload
    }
  });
  return toClientShape(row);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {Record<string, unknown>} patch
 */
export async function patchPermitToWork(tenantId, id, patch) {
  const pid = String(id ?? '').trim();
  if (!pid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const existing = await prisma.permitToWork.findFirst({
    where: { id: pid, ...prismaTenantFilter(tenantId) }
  });
  if (!existing) {
    const err = new Error('Permis introuvable');
    err.statusCode = 404;
    throw err;
  }

  /** @type {Record<string, unknown>} */
  const data = {};
  if (patch.type != null && String(patch.type).trim()) {
    data.type = String(patch.type).trim().slice(0, 200);
  }
  if (patch.status != null && String(patch.status).trim()) {
    data.status = String(patch.status).trim().slice(0, 80);
  }
  if ('siteId' in patch) {
    data.siteId =
      patch.siteId == null || String(patch.siteId).trim() === ''
        ? null
        : String(patch.siteId).trim();
  }
  if ('assignedTo' in patch) {
    data.assignedTo =
      patch.assignedTo == null || String(patch.assignedTo).trim() === ''
        ? null
        : String(patch.assignedTo).slice(0, 200);
  }
  if ('validFrom' in patch) data.validFrom = parseOptDate(patch.validFrom);
  if ('validUntil' in patch) data.validUntil = parseOptDate(patch.validUntil);

  const prevPayload =
    existing.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload)
      ? { ...existing.payload }
      : {};
  if (Array.isArray(patch.signatures)) {
    data.signaturesJson = patch.signatures;
    prevPayload.signatures = patch.signatures;
  }
  for (const [k, val] of Object.entries(patch)) {
    if (TOP_COLUMN_KEYS.has(k)) continue;
    prevPayload[k] = val;
  }
  if ('team' in patch && patch.team != null && !('assignedTo' in patch)) {
    data.assignedTo = String(patch.team).trim().slice(0, 200) || null;
  }
  data.payload = prevPayload;

  const updated = await prisma.permitToWork.update({
    where: { id: existing.id },
    data
  });
  return toClientShape(updated);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {{ role: string; name: string; signatureDataUrl?: string; userId?: string; userLabel?: string }} input
 */
export async function signPermitToWork(tenantId, id, input) {
  const existing = await prisma.permitToWork.findFirst({
    where: { id: String(id).trim(), ...prismaTenantFilter(tenantId) }
  });
  if (!existing) {
    const err = new Error('Permis introuvable');
    err.statusCode = 404;
    throw err;
  }
  const sigs = Array.isArray(existing.signaturesJson) ? [...existing.signaturesJson] : [];
  const signedAt = new Date().toISOString();
  const signatureId = `ptw_sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const sig = {
    id: signatureId,
    role: String(input.role || ''),
    name: String(input.name || ''),
    signedAt,
    signatureDataUrl: String(input.signatureDataUrl || ''),
    userId: String(input.userId || ''),
    userLabel: String(input.userLabel || ''),
    syncStatus: 'synced'
  };
  sigs.push(sig);

  const prevPayload =
    existing.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload)
      ? { ...existing.payload }
      : {};
  prevPayload.signatures = sigs;
  prevPayload.validations = prevPayload.validations || {};
  const r = String(input.role || '');
  if (r === 'supervisor' || r === 'qhse' || r === 'responsable') {
    prevPayload.validations[r] = {
      signed: true,
      name: String(input.name || ''),
      signedAt,
      signatureDataUrl: String(input.signatureDataUrl || '')
    };
  }

  let nextStatus = existing.status;
  const v = prevPayload.validations;
  if (
    v &&
    typeof v === 'object' &&
    v.supervisor &&
    v.supervisor.signed &&
    v.qhse &&
    v.qhse.signed &&
    (existing.status === 'open' || existing.status === 'pending')
  ) {
    nextStatus = 'validated';
  }

  const updated = await prisma.permitToWork.update({
    where: { id: existing.id },
    data: {
      signaturesJson: sigs,
      payload: prevPayload,
      status: nextStatus
    }
  });
  return toClientShape(updated);
}
