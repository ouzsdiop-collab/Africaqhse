import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

/**
 * @param {string | null | undefined} tenantId
 * @param {string | null | undefined} incidentId
 * @returns {Promise<string | null>}
 */
export async function assertIncidentExistsOrNull(tenantId, incidentId) {
  if (incidentId == null || String(incidentId).trim() === '') {
    return null;
  }
  const id = String(incidentId).trim();
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.incident.findFirst({
    where: { id, ...tf },
    select: { id: true }
  });
  if (!row) {
    const err = new Error('Incident lié introuvable');
    err.statusCode = 400;
    throw err;
  }
  return id;
}

/**
 * @param {string | null | undefined} tenantId
 */
export async function computeNextIncidentRef(tenantId) {
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.incident.findMany({
    where: Object.keys(tf).length ? tf : {},
    select: { ref: true },
    orderBy: { createdAt: 'desc' },
    take: 3000
  });
  const nums = rows.map((r) => {
    const m = /^INC-(\d+)$/i.exec(r.ref);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 200;
  return `INC-${max + 1}`;
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string | null, limit?: number }} [filters]
 */
export async function findAllIncidents(tenantId, filters = {}) {
  const siteId =
    filters.siteId != null && String(filters.siteId).trim() !== ''
      ? String(filters.siteId).trim()
      : null;
  const raw =
    typeof filters.limit === 'number' &&
    Number.isFinite(filters.limit) &&
    filters.limit >= 1
      ? Math.floor(filters.limit)
      : 300;
  const take = Math.min(raw, 500);
  const tf = prismaTenantFilter(tenantId);
  return prisma.incident.findMany({
    where: { ...tf, ...(siteId ? { siteId } : {}) },
    orderBy: { createdAt: 'desc' },
    take
  });
}

export async function createIncident(tenantId, data) {
  const t = normalizeTenantId(tenantId);
  const siteId = await assertSiteExistsOrNull(tenantId, data.siteId);
  return prisma.incident.create({
    data: {
      tenantId: t || null,
      ref: data.ref,
      type: data.type,
      site: data.site,
      siteId,
      severity: data.severity,
      description: data.description ?? null,
      status: data.status ?? 'Nouveau',
      location: data.location ?? null,
      causes: data.causes ?? null,
      causeCategory: data.causeCategory ?? null,
      photosJson: data.photosJson ?? null,
      responsible: data.responsible ?? null
    }
  });
}

const CAUSE_CATS = new Set(['humain', 'materiel', 'organisation', 'mixte']);

/**
 * @param {string | null | undefined} tenantId
 * @param {string} ref
 * @param {{
 *   status?: string,
 *   causes?: string | null,
 *   causeCategory?: string | null,
 *   location?: string | null,
 *   responsible?: string | null,
 *   photosJson?: string | null
 * }} data
 */
export async function updateIncidentByRef(tenantId, ref, data) {
  const t = normalizeTenantId(tenantId);
  const patch = {};
  if (data.status != null && String(data.status).trim() !== '') {
    patch.status = data.status;
  }
  if ('causes' in data) {
    patch.causes = data.causes;
  }
  if ('causeCategory' in data) {
    const c = data.causeCategory;
    if (c == null || c === '') {
      patch.causeCategory = null;
    } else if (CAUSE_CATS.has(String(c).toLowerCase())) {
      patch.causeCategory = String(c).toLowerCase();
    } else {
      const err = new Error('causeCategory invalide (humain, materiel, organisation, mixte)');
      err.statusCode = 400;
      throw err;
    }
  }
  if ('location' in data) {
    patch.location = data.location;
  }
  if ('responsible' in data) {
    patch.responsible = data.responsible;
  }
  if ('photosJson' in data) {
    patch.photosJson = data.photosJson;
  }
  if (Object.keys(patch).length === 0) {
    const err = new Error('Aucun champ valide à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  if (t) {
    return prisma.incident.update({
      where: { tenantId_ref: { tenantId: t, ref } },
      data: patch
    });
  }

  const matches = await prisma.incident.findMany({
    where: { ref },
    select: { id: true },
    take: 2
  });
  if (matches.length === 0) {
    const err = new Error('Incident introuvable');
    err.code = 'P2025';
    throw err;
  }
  if (matches.length > 1) {
    const err = new Error('Référence incident ambiguë — contactez l’administrateur.');
    err.statusCode = 409;
    throw err;
  }
  return prisma.incident.update({
    where: { id: matches[0].id },
    data: patch
  });
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} ref
 */
export async function deleteIncident(tenantId, ref) {
  const t = normalizeTenantId(tenantId);
  const refStr = String(ref ?? '').trim();
  if (!refStr) {
    const err = new Error('Référence incident requise');
    err.statusCode = 400;
    throw err;
  }
  if (t) {
    return prisma.incident.delete({
      where: { tenantId_ref: { tenantId: t, ref: refStr } }
    });
  }

  const matches = await prisma.incident.findMany({
    where: { ref: refStr },
    select: { id: true },
    take: 2
  });
  if (matches.length === 0) {
    const err = new Error('Incident introuvable');
    err.code = 'P2025';
    throw err;
  }
  if (matches.length > 1) {
    const err = new Error('Référence incident ambiguë — contactez l’administrateur.');
    err.statusCode = 409;
    throw err;
  }
  return prisma.incident.delete({ where: { id: matches[0].id } });
}
