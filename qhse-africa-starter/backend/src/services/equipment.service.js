import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

const equipmentInclude = {
  assignedUser: { select: { id: true, name: true, email: true, role: true } },
  siteRecord: { select: { id: true, name: true, code: true } }
};

function serializeRow(row) {
  if (!row) return row;
  return {
    ...row,
    lastControlDate: row.lastControlDate ? row.lastControlDate.toISOString() : null,
    nextControlDate: row.nextControlDate ? row.nextControlDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string | null | undefined} siteId
 */
export async function findAllEquipment(tenantId, siteId = null) {
  const tf = prismaTenantFilter(tenantId);
  const sid = siteId != null && String(siteId).trim() !== '' ? String(siteId).trim() : null;
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (sid) where.siteId = sid;
  const rows = await prisma.equipment.findMany({
    where,
    include: equipmentInclude,
    orderBy: [{ nextControlDate: 'asc' }, { createdAt: 'desc' }]
  });
  return rows.map(serializeRow);
}

/**
 * Alertes équipements/EPI (contrôle expiré + contrôle proche échéance).
 * Format : { type, severity, message, date }
 *
 * @param {string | null | undefined} tenantId
 * @param {{ daysAhead?: number, limit?: number, siteId?: string | null }} [opts]
 */
export async function getEquipmentAlerts(tenantId, opts = {}) {
  const d = Math.max(1, Math.min(365, Math.floor(Number(opts.daysAhead) || 30)));
  const limit = Math.max(1, Math.min(200, Math.floor(Number(opts.limit) || 50)));
  const now = new Date();
  const end = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  const tf = prismaTenantFilter(tenantId);
  const sid =
    opts.siteId != null && String(opts.siteId).trim() !== '' ? String(opts.siteId).trim() : null;

  const baseWhere = { ...tf, ...(sid ? { siteId: sid } : {}) };

  const [expired, expiring] = await Promise.all([
    prisma.equipment.findMany({
      where: {
        ...baseWhere,
        nextControlDate: { not: null, lt: now }
      },
      select: {
        id: true,
        name: true,
        category: true,
        nextControlDate: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        siteRecord: { select: { id: true, name: true, code: true } }
      },
      orderBy: { nextControlDate: 'desc' },
      take: limit
    }),
    prisma.equipment.findMany({
      where: {
        ...baseWhere,
        nextControlDate: { not: null, gte: now, lte: end }
      },
      select: {
        id: true,
        name: true,
        category: true,
        nextControlDate: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        siteRecord: { select: { id: true, name: true, code: true } }
      },
      orderBy: { nextControlDate: 'asc' },
      take: limit
    })
  ]);

  const alerts = [];

  for (const e of expired) {
    const site = e.siteRecord?.name || e.siteRecord?.code || null;
    const who = e.assignedUser?.name || e.assignedUser?.email || null;
    const date = e.nextControlDate ? e.nextControlDate.toISOString() : null;
    alerts.push({
      type: 'equipment.control_expired',
      severity: 'high',
      message: `Contrôle expiré : ${e.name}${who ? ` (${who})` : site ? ` (${site})` : ''}`,
      date
    });
  }

  for (const e of expiring) {
    const site = e.siteRecord?.name || e.siteRecord?.code || null;
    const who = e.assignedUser?.name || e.assignedUser?.email || null;
    const date = e.nextControlDate ? e.nextControlDate.toISOString() : null;
    alerts.push({
      type: 'equipment.control_expiring',
      severity: 'medium',
      message: `Contrôle proche échéance : ${e.name}${who ? ` (${who})` : site ? ` (${site})` : ''}`,
      date
    });
  }

  return alerts.slice(0, limit);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {Record<string, unknown>} data
 */
export async function createEquipment(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) {
    const err = new Error('name requis');
    err.statusCode = 400;
    throw err;
  }
  const category = typeof data.category === 'string' ? data.category.trim() : '';
  if (!category) {
    const err = new Error('category requis');
    err.statusCode = 400;
    throw err;
  }
  const siteId =
    data.siteId != null && data.siteId !== ''
      ? await assertSiteExistsOrNull(tenantId, data.siteId)
      : null;
  const assignedUserId =
    data.assignedUserId != null && data.assignedUserId !== ''
      ? String(data.assignedUserId).trim()
      : null;
  if (assignedUserId) {
    const userOk = await prisma.user.findUnique({
      where: { id: assignedUserId },
      select: { id: true }
    });
    if (!userOk) {
      const err = new Error('Utilisateur introuvable');
      err.statusCode = 400;
      throw err;
    }
  }
  const serialNumber =
    data.serialNumber == null || data.serialNumber === ''
      ? null
      : String(data.serialNumber).trim() || null;
  const status =
    data.status != null && String(data.status).trim()
      ? String(data.status).trim()
      : 'in_service';
  const lastControlDate =
    data.lastControlDate != null && data.lastControlDate !== ''
      ? new Date(String(data.lastControlDate))
      : null;
  const nextControlDate =
    data.nextControlDate != null && data.nextControlDate !== ''
      ? new Date(String(data.nextControlDate))
      : null;
  if (lastControlDate && Number.isNaN(lastControlDate.getTime())) {
    const err = new Error('lastControlDate invalide');
    err.statusCode = 400;
    throw err;
  }
  if (nextControlDate && Number.isNaN(nextControlDate.getTime())) {
    const err = new Error('nextControlDate invalide');
    err.statusCode = 400;
    throw err;
  }

  const created = await prisma.equipment.create({
    data: {
      tenantId: tid,
      siteId,
      assignedUserId,
      name,
      category,
      serialNumber,
      status,
      lastControlDate: lastControlDate && !Number.isNaN(lastControlDate.getTime()) ? lastControlDate : null,
      nextControlDate: nextControlDate && !Number.isNaN(nextControlDate.getTime()) ? nextControlDate : null
    },
    include: equipmentInclude
  });
  return serializeRow(created);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {Record<string, unknown>} patch
 */
export async function updateEquipment(tenantId, id, patch) {
  const eid = String(id ?? '').trim();
  if (!eid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.equipment.findFirst({
    where: { id: eid, ...tf }
  });
  if (!existing) {
    const err = new Error('Équipement introuvable');
    err.statusCode = 404;
    throw err;
  }

  /** @type {Record<string, unknown>} */
  const data = {};
  if ('name' in patch) {
    const n = typeof patch.name === 'string' ? patch.name.trim() : '';
    if (!n) {
      const err = new Error('name ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.name = n;
  }
  if ('category' in patch) {
    const c = typeof patch.category === 'string' ? patch.category.trim() : '';
    if (!c) {
      const err = new Error('category ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.category = c;
  }
  if ('serialNumber' in patch) {
    data.serialNumber =
      patch.serialNumber == null || patch.serialNumber === ''
        ? null
        : String(patch.serialNumber).trim() || null;
  }
  if ('status' in patch && patch.status != null && String(patch.status).trim()) {
    data.status = String(patch.status).trim();
  }
  if ('lastControlDate' in patch) {
    if (patch.lastControlDate == null || patch.lastControlDate === '') data.lastControlDate = null;
    else {
      const d = new Date(String(patch.lastControlDate));
      if (Number.isNaN(d.getTime())) {
        const err = new Error('lastControlDate invalide');
        err.statusCode = 400;
        throw err;
      }
      data.lastControlDate = d;
    }
  }
  if ('nextControlDate' in patch) {
    if (patch.nextControlDate == null || patch.nextControlDate === '') data.nextControlDate = null;
    else {
      const d = new Date(String(patch.nextControlDate));
      if (Number.isNaN(d.getTime())) {
        const err = new Error('nextControlDate invalide');
        err.statusCode = 400;
        throw err;
      }
      data.nextControlDate = d;
    }
  }
  if ('siteId' in patch) {
    data.siteId =
      patch.siteId == null || patch.siteId === ''
        ? null
        : await assertSiteExistsOrNull(tenantId, patch.siteId);
  }
  if ('assignedUserId' in patch) {
    const uid =
      patch.assignedUserId == null || patch.assignedUserId === ''
        ? null
        : String(patch.assignedUserId).trim();
    if (uid) {
      const userOk = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
      if (!userOk) {
        const err = new Error('Utilisateur introuvable');
        err.statusCode = 400;
        throw err;
      }
    }
    data.assignedUserId = uid;
  }

  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  const upd = await prisma.equipment.updateMany({
    where: { id: eid, ...tf },
    data
  });
  if (!upd?.count) {
    const err = new Error('Équipement introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.equipment.findFirst({
    where: { id: eid, ...tf },
    include: equipmentInclude
  });
  return serializeRow(updated);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 */
export async function deleteEquipment(tenantId, id) {
  const eid = String(id ?? '').trim();
  if (!eid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.equipment.findFirst({
    where: { id: eid, ...tf }
  });
  if (!existing) {
    const err = new Error('Équipement introuvable');
    err.statusCode = 404;
    throw err;
  }
  const del = await prisma.equipment.deleteMany({ where: { id: eid, ...tf } });
  if (!del?.count) {
    const err = new Error('Équipement introuvable');
    err.statusCode = 404;
    throw err;
  }
}
