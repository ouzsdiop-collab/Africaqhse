import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';

function tid(tenantId) {
  return tenantId == null || tenantId === '' ? '' : String(tenantId).trim();
}

function normalizeInt(value, fallback = 1, min = 1, max = 5) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function parseIntOrNull(value, min = 1, max = 5) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    const err = new Error(`Valeur entière attendue entre ${min} et ${max}`);
    err.statusCode = 400;
    throw err;
  }
  return Math.round(n);
}

function computeGp(probability, gravity) {
  if (probability == null || gravity == null) return null;
  return Number(probability) * Number(gravity);
}

function withDerivedRiskFields(row) {
  if (!row) return row;
  const gravity = row.gravity ?? row.severity ?? null;
  const probability = row.probability ?? null;
  return {
    ...row,
    gravity,
    gp: row.gp ?? computeGp(probability, gravity)
  };
}

export async function computeNextRiskRef(tenantId) {
  const t = tid(tenantId);
  if (!t) return 'RSK-1';
  const rows = await prisma.risk.findMany({
    where: { tenantId: t, ref: { not: null } },
    select: { ref: true }
  });
  let max = 100;
  rows.forEach((r) => {
    const m = /^RSK-(\d+)$/i.exec(String(r.ref || '').trim());
    if (!m) return;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  });
  return `RSK-${max + 1}`;
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string|null, limit?: number, q?: string|null, status?: string|null, category?: string|null }} [filters]
 */
export async function findAllRisks(tenantId, filters = {}) {
  const t = tid(tenantId);
  if (!t) return [];
  const siteId =
    filters.siteId != null && String(filters.siteId).trim() !== ''
      ? String(filters.siteId).trim()
      : null;
  const q =
    filters.q != null && String(filters.q).trim() !== '' ? String(filters.q).trim() : null;
  const status =
    filters.status != null && String(filters.status).trim() !== ''
      ? String(filters.status).trim()
      : null;
  const category =
    filters.category != null && String(filters.category).trim() !== ''
      ? String(filters.category).trim()
      : null;
  const raw =
    typeof filters.limit === 'number' && Number.isFinite(filters.limit) && filters.limit >= 1
      ? Math.floor(filters.limit)
      : 300;
  const take = Math.min(raw, 500);

  /** @type {Record<string, unknown>} */
  const where = { tenantId: t };
  if (siteId) where.siteId = siteId;
  if (status) where.status = status;
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { owner: { contains: q } },
      { category: { contains: q } }
    ];
  }

  const rows = await prisma.risk.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take
  });
  return rows.map(withDerivedRiskFields);
}

export async function findRiskById(tenantId, id) {
  const t = tid(tenantId);
  if (!t || !id) return null;
  const row = await prisma.risk.findFirst({ where: { id, tenantId: t } });
  return withDerivedRiskFields(row);
}

export async function createRisk(tenantId, data) {
  const t = tid(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation manquant');
    err.statusCode = 400;
    throw err;
  }
  const siteId = await assertSiteExistsOrNull(t, data.siteId);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) {
    const err = new Error('Champ title requis');
    err.statusCode = 400;
    throw err;
  }
  const probability = parseIntOrNull(data.probability, 1, 5);
  const gravity = parseIntOrNull(data.gravity ?? data.severity, 1, 5);
  const ref = await computeNextRiskRef(t);
  const created = await prisma.risk.create({
    data: {
      tenantId: t,
      ref,
      title,
      description: data.description ?? null,
      category: data.category ?? null,
      gravity,
      severity: gravity ?? normalizeInt(data.severity, 1, 1, 5),
      probability: probability ?? normalizeInt(data.probability, 1, 1, 5),
      gp: computeGp(probability, gravity),
      status: data.status ?? 'open',
      owner: data.owner ?? null,
      siteId
    }
  });
  return withDerivedRiskFields(created);
}

export async function updateRiskById(tenantId, id, patch) {
  const t = tid(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation manquant');
    err.statusCode = 400;
    throw err;
  }
  /** @type {Record<string, unknown>} */
  const data = {};
  if ('title' in patch && patch.title != null) data.title = patch.title;
  if ('description' in patch) data.description = patch.description ?? null;
  if ('category' in patch) data.category = patch.category ?? null;
  if ('severity' in patch || 'gravity' in patch) {
    const g = parseIntOrNull(patch.gravity ?? patch.severity, 1, 5);
    if (g != null) {
      data.gravity = g;
      data.severity = g;
    }
  }
  if ('probability' in patch) {
    const p = parseIntOrNull(patch.probability, 1, 5);
    if (p != null) data.probability = p;
  }
  if ('status' in patch && patch.status != null) data.status = patch.status;
  if ('owner' in patch) data.owner = patch.owner ?? null;
  if ('siteId' in patch) data.siteId = await assertSiteExistsOrNull(t, patch.siteId);

  if (!Object.keys(data).length) {
    const err = new Error('Aucun champ valide à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  const current = await prisma.risk.findFirst({ where: { id, tenantId: t } });
  if (!current) {
    const err = new Error('Risque introuvable');
    err.code = 'P2025';
    throw err;
  }
  const nextProbability = data.probability ?? current.probability ?? null;
  const nextGravity = data.gravity ?? current.gravity ?? current.severity ?? null;
  if ('probability' in data || 'gravity' in data || 'severity' in data) {
    data.gp = computeGp(nextProbability, nextGravity);
  }
  const updated = await prisma.risk.update({ where: { id: current.id }, data });
  return withDerivedRiskFields(updated);
}

export async function deleteRiskById(tenantId, id) {
  const t = tid(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation manquant');
    err.statusCode = 400;
    throw err;
  }
  const row = await prisma.risk.findFirst({ where: { id, tenantId: t }, select: { id: true } });
  if (!row) {
    const err = new Error('Risque introuvable');
    err.code = 'P2025';
    throw err;
  }
  await prisma.risk.delete({ where: { id: row.id } });
  return { deleted: true, id: row.id };
}

export async function getRiskStats(tenantId, filters = {}) {
  const rows = await findAllRisks(tenantId, { ...filters, limit: 5000 });
  const byStatus = {};
  const byCategory = {};
  let critical = 0;
  rows.forEach((r) => {
    const status = String(r.status || 'unknown');
    const category = String(r.category || 'Autre');
    byStatus[status] = (byStatus[status] || 0) + 1;
    byCategory[category] = (byCategory[category] || 0) + 1;
    if (Number(r.gp) >= 15) critical += 1;
  });
  return {
    total: rows.length,
    critical,
    byStatus,
    byCategory
  };
}
