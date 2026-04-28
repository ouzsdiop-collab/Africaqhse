import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

/**
 * Réexport — la règle « risque critique » est implémentée une seule fois dans `kpiCore.service.js`
 * (`isCriticalRisk`, `RISK_CRITICAL_GP_MIN`, `RISK_CRITICAL_SEVERITY_NUM_MIN`) : le dashboard
 * utilise `countRisksCriticalForKpi` et `getRiskStats` filtre avec la même fonction.
 */
export { isCriticalRisk } from './kpiCore.service.js';

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
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.risk.findMany({
    where: { ref: { not: null }, ...tf },
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

  const tf = prismaTenantFilter(tenantId);
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
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
  if (!id) return null;
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.risk.findFirst({ where: { id, ...tf } });
  return withDerivedRiskFields(row);
}

export async function createRisk(tenantId, data) {
  const t = normalizeTenantId(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const siteId = await assertSiteExistsOrNull(tenantId, data.siteId);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) {
    const err = new Error('Champ title requis');
    err.statusCode = 400;
    throw err;
  }
  const probability = parseIntOrNull(data.probability, 1, 5);
  const gravity = parseIntOrNull(data.gravity ?? data.severity, 1, 5);
  const ref = await computeNextRiskRef(tenantId);
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
  if ('siteId' in patch) data.siteId = await assertSiteExistsOrNull(tenantId, patch.siteId);

  if (!Object.keys(data).length) {
    const err = new Error('Aucun champ valide à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  const tf = prismaTenantFilter(tenantId);
  const current = await prisma.risk.findFirst({ where: { id, ...tf } });
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
  const upd = await prisma.risk.updateMany({ where: { id: current.id, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Risque introuvable');
    err.code = 'P2025';
    throw err;
  }
  const updated = await prisma.risk.findFirst({ where: { id: current.id, ...tf } });
  return withDerivedRiskFields(updated);
}

export async function deleteRiskById(tenantId, id) {
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.risk.findFirst({ where: { id, ...tf }, select: { id: true } });
  if (!row) {
    const err = new Error('Risque introuvable');
    err.code = 'P2025';
    throw err;
  }
  const del = await prisma.risk.deleteMany({ where: { id: row.id, ...tf } });
  if (!del?.count) {
    const err = new Error('Risque introuvable');
    err.code = 'P2025';
    throw err;
  }
  return { deleted: true, id: row.id };
}

/**
 * @deprecated Préférer `getRiskStats` depuis `risks.stats.service.js` (même règle KPI que le dashboard).
 * Conservé pour compatibilité imports tiers éventuels.
 */
export async function getRiskStats(tenantId, filters = {}) {
  const { getRiskStats: aligned } = await import('./risks.stats.service.js');
  return aligned(tenantId, filters);
}
