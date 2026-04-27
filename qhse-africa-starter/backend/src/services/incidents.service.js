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
  const t = normalizeTenantId(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const rows = await prisma.incident.findMany({
    where: { tenantId: t },
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
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const siteId = await assertSiteExistsOrNull(tenantId, data.siteId);
  return prisma.incident.create({
    data: {
      tenantId: t,
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
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
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
  return prisma.incident.update({
    where: { tenantId_ref: { tenantId: t, ref } },
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
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  return prisma.incident.delete({
    where: { tenantId_ref: { tenantId: t, ref: refStr } }
  });
}

/** Heures travaillées de référence / an (mining & pétrole) — surchargeable par env. */
const DEFAULT_HEURES_TRAVAILLEES_AN =
  Number(process.env.QHSE_HEURES_TRAVAILLEES_AN) > 0
    ? Number(process.env.QHSE_HEURES_TRAVAILLEES_AN)
    : 200_000;

const DEFAULT_OBJECTIF_TF =
  Number(process.env.QHSE_OBJECTIF_TF) > 0 ? Number(process.env.QHSE_OBJECTIF_TF) : 2.0;

const DEFAULT_OBJECTIF_TG =
  Number(process.env.QHSE_OBJECTIF_TG) > 0 ? Number(process.env.QHSE_OBJECTIF_TG) : 0.5;

/**
 * Accident avec arrêt : libellé type / description, ou Accident + sévérité lourde (données seed).
 * @param {{ type?: string | null; description?: string | null; severity?: string | null }} row
 */
export function isAccidentAvecArretRow(row) {
  const type = String(row?.type ?? '').trim();
  const typeL = type.toLowerCase();
  const desc = String(row?.description ?? '').toLowerCase();
  const sev = String(row?.severity ?? '');
  const hay = `${typeL} ${desc}`;
  if (/quasi[-\s]?accident/.test(typeL)) return false;
  if (/accident\s+avec\s+arr[eê]t/i.test(type)) return true;
  if (/\baccident\b/.test(typeL) && /\b(arr[eê]t|itt|jours?\s*perdus?|incapacit|work\s*stoppage)\b/.test(hay)) {
    return true;
  }
  if (typeL === 'accident' && /(élev|elev|critique|majeur|grave|mortel)/i.test(sev)) return true;
  return false;
}

/**
 * @param {string | null | undefined} description
 * @returns {number}
 */
export function extractJoursPerdusFromDescription(description) {
  const d = String(description ?? '');
  const re1 =
    /(\d+[.,]?\d*)\s*(?:j\.?\s*(?:ouvrables?\s*)?|jours?\s*(?:perdus?|d['']absence)?)\b/i.exec(d);
  const re2 = /(?:itt|arr[eê]t)\s*[:(]?\s*(\d+[.,]?\d*)/i.exec(d);
  const m = re1 || re2;
  if (m) {
    const n = parseFloat(String(m[1]).replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) return Math.round(n * 100) / 100;
  }
  return 1;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {number} y
 * @returns {{ start: Date; end: Date }}
 */
function utcYearBounds(y) {
  const year = Math.floor(y);
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
  };
}

/**
 * TF = (accidents avec arrêt × 1 000 000) / heures travaillées
 * TG = (jours perdus × 1 000) / heures travaillées
 *
 * @param {string | null | undefined} tenantId
 * @param {string | null | undefined} siteId
 * @param {{
 *   periodDays?: number | null,
 *   year?: number | null,
 *   heuresTravaillees?: number | null,
 *   objectifTF?: number | null,
 *   objectifTG?: number | null
 * }} [options]
 */
export async function computeTfTg(tenantId, siteId, options = {}) {
  const tf = prismaTenantFilter(tenantId);
  const sid =
    siteId != null && String(siteId).trim() !== '' ? String(siteId).trim() : null;

  const now = new Date();
  let start;
  let end;
  /** @type {string} */
  let periode;

  const rawYear = options.year;
  const y =
    rawYear != null && Number.isFinite(Number(rawYear)) ? Math.floor(Number(rawYear)) : null;
  const pd =
    options.periodDays != null && Number.isFinite(Number(options.periodDays))
      ? Math.max(1, Math.min(3660, Math.floor(Number(options.periodDays))))
      : null;

  if (y != null) {
    ({ start, end } = utcYearBounds(y));
    periode = `Année ${y}`;
  } else if (pd != null) {
    end = now;
    start = new Date(now.getTime() - pd * 86400000);
    periode = `${pd} dernier${pd > 1 ? 's' : ''} jour${pd > 1 ? 's' : ''}`;
  } else {
    const cy = now.getUTCFullYear();
    ({ start, end } = utcYearBounds(cy));
    periode = `Année ${cy}`;
  }

  const objectifTF =
    options.objectifTF != null && Number.isFinite(Number(options.objectifTF))
      ? Number(options.objectifTF)
      : DEFAULT_OBJECTIF_TF;
  const objectifTG =
    options.objectifTG != null && Number.isFinite(Number(options.objectifTG))
      ? Number(options.objectifTG)
      : DEFAULT_OBJECTIF_TG;

  let heuresTravaillees =
    options.heuresTravaillees != null && Number.isFinite(Number(options.heuresTravaillees))
      ? Math.max(1, Number(options.heuresTravaillees))
      : null;

  if (heuresTravaillees == null) {
    if (y != null || (pd == null && y == null)) {
      heuresTravaillees = DEFAULT_HEURES_TRAVAILLEES_AN;
    } else {
      heuresTravaillees = Math.max(
        1,
        Math.round(DEFAULT_HEURES_TRAVAILLEES_AN * (pd / 365.25))
      );
    }
  }

  const baseWhere = {
    ...tf,
    ...(sid ? { siteId: sid } : {}),
    createdAt: { gte: start, lte: end }
  };

  const rows = await prisma.incident.findMany({
    where: baseWhere,
    select: {
      type: true,
      description: true,
      severity: true
    }
  });

  let accidentsAvecArret = 0;
  let joursPerdus = 0;
  for (const row of rows) {
    if (!isAccidentAvecArretRow(row)) continue;
    accidentsAvecArret += 1;
    joursPerdus += extractJoursPerdusFromDescription(row.description);
  }
  joursPerdus = round2(joursPerdus);

  const H = heuresTravaillees;
  const tfVal = H > 0 ? round2((accidentsAvecArret * 1_000_000) / H) : 0;
  const tgVal = H > 0 ? round2((joursPerdus * 1000) / H) : 0;

  let prevStart;
  let prevEnd;
  if (y != null) {
    ({ start: prevStart, end: prevEnd } = utcYearBounds(y - 1));
  } else {
    const len = end.getTime() - start.getTime();
    prevEnd = new Date(start.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - len);
  }

  const prevRows = await prisma.incident.findMany({
    where: {
      ...tf,
      ...(sid ? { siteId: sid } : {}),
      createdAt: { gte: prevStart, lte: prevEnd }
    },
    select: { type: true, description: true, severity: true }
  });
  let prevAcc = 0;
  let prevJours = 0;
  for (const row of prevRows) {
    if (!isAccidentAvecArretRow(row)) continue;
    prevAcc += 1;
    prevJours += extractJoursPerdusFromDescription(row.description);
  }
  prevJours = round2(prevJours);

  let prevH = H;
  if (pd != null) {
    prevH = Math.max(1, Math.round(DEFAULT_HEURES_TRAVAILLEES_AN * (pd / 365.25)));
  } else if (y != null) {
    prevH = DEFAULT_HEURES_TRAVAILLEES_AN;
  }

  const tfPrev = prevH > 0 ? round2((prevAcc * 1_000_000) / prevH) : 0;
  const tgPrev = prevH > 0 ? round2((prevJours * 1000) / prevH) : 0;

  return {
    tf: tfVal,
    tg: tgVal,
    accidentsAvecArret,
    joursPerdus,
    heuresTravaillees: H,
    periode,
    objectifTF,
    objectifTG,
    tfPrev,
    tgPrev,
    prevPeriode:
      y != null ? `Année ${y - 1}` : pd != null ? 'Période précédente de même durée' : 'Période précédente'
  };
}
