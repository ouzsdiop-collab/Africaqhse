import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { parseListLimit } from '../lib/validation.js';
import { emitBusinessEvent } from './businessEvents.service.js';

const include = {
  equipment: { select: { id: true, name: true, category: true, siteId: true } },
  reportedBy: { select: { id: true, name: true, email: true } },
  validatedBy: { select: { id: true, name: true, email: true } }
};

function serializeRow(row) {
  if (!row) return row;
  return {
    ...row,
    validatedAt: row.validatedAt ? row.validatedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ equipmentId?: string, siteId?: string, status?: string, limit?: number }} [filters]
 */
export async function listEquipmentSignalements(tenantId, filters = {}) {
  const tf = prismaTenantFilter(tenantId);
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (filters.equipmentId != null && String(filters.equipmentId).trim()) {
    where.equipmentId = String(filters.equipmentId).trim();
  }
  if (filters.siteId != null && String(filters.siteId).trim()) {
    where.siteId = String(filters.siteId).trim();
  }
  if (filters.status != null && String(filters.status).trim()) {
    where.status = String(filters.status).trim();
  }
  const rows = await prisma.equipmentSignalement.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
    take: parseListLimit(filters.limit)
  });
  return rows.map(serializeRow);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {Record<string, unknown>} data
 * @param {string | null | undefined} reportedByUserId
 */
export async function createEquipmentSignalement(tenantId, data, reportedByUserId) {
  const tid = normalizeTenantId(tenantId);
  const tf = prismaTenantFilter(tenantId);
  const equipmentId = String(data.equipmentId ?? '').trim();
  if (!equipmentId) {
    const err = new Error('equipmentId requis');
    err.statusCode = 400;
    throw err;
  }
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, ...tf },
    select: { id: true, siteId: true, name: true }
  });
  if (!equipment) {
    const err = new Error('Équipement introuvable');
    err.statusCode = 404;
    throw err;
  }
  const category = String(data.category ?? '').trim();
  if (!category) {
    const err = new Error('category requis');
    err.statusCode = 400;
    throw err;
  }
  const severity = String(data.severity ?? 'medium').trim() || 'medium';
  const description =
    data.description != null && String(data.description).trim() ? String(data.description).trim() : null;
  const attachments = Array.isArray(data.attachments) ? data.attachments : [];

  const created = await prisma.equipmentSignalement.create({
    data: {
      tenantId: tid,
      equipmentId: equipment.id,
      siteId: equipment.siteId ?? null,
      reportedByUserId: reportedByUserId ?? null,
      category,
      severity,
      description,
      attachments,
      status: 'pending'
    },
    include
  });

  emitBusinessEvent('equipment.signalement_created', {
    tenantId: tid,
    signalementId: created.id,
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    siteId: equipment.siteId ?? null,
    category,
    severity,
    userId: reportedByUserId ?? null
  });

  return serializeRow(created);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {{ status: string, qhseComment?: string }} input
 * @param {string | null | undefined} validatedByUserId
 */
export async function reviewEquipmentSignalement(tenantId, id, input, validatedByUserId) {
  const sid = String(id ?? '').trim();
  if (!sid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.equipmentSignalement.findFirst({ where: { id: sid, ...tf } });
  if (!existing) {
    const err = new Error('Signalement introuvable');
    err.statusCode = 404;
    throw err;
  }
  const status = String(input.status ?? '').trim();
  if (!['validated', 'needs_info', 'rejected'].includes(status)) {
    const err = new Error('status invalide');
    err.statusCode = 400;
    throw err;
  }
  const qhseComment =
    input.qhseComment != null && String(input.qhseComment).trim() ? String(input.qhseComment).trim() : null;

  const updated = await prisma.equipmentSignalement.update({
    where: { id: existing.id },
    data: {
      status,
      qhseComment,
      validatedByUserId: validatedByUserId ?? null,
      validatedAt: new Date()
    },
    include
  });

  emitBusinessEvent('equipment.signalement_reviewed', {
    tenantId: normalizeTenantId(tenantId),
    signalementId: updated.id,
    equipmentId: updated.equipmentId,
    equipmentName: updated.equipment?.name ?? null,
    status,
    qhseComment,
    reportedByUserId: updated.reportedByUserId,
    userId: validatedByUserId ?? null
  });

  return serializeRow(updated);
}
