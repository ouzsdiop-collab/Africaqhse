import { prisma } from '../db.js';
import { normalizeTenantId } from '../lib/tenantScope.js';
import {
  countNonConformitiesOpenHeuristic,
  countRisksCriticalForKpi,
  isActionOverdueDashboardRow,
  prismaTenantSiteWhere
} from './kpiCore.service.js';
import { isFinalAuditStatus } from './auditAutoReport.service.js';
import { buildQhseIntelligenceSnapshot } from './qhseIntelligence.service.js';

const LIST_MAX = 5;
const DASHBOARD_TIMESERIES_MONTHS = 6;

/**
 * Aligné sur `ncTextIsMajor` (dashboardCharts.js) — heuristique texte titre+détail.
 * @param {{ title?: string | null; detail?: string | null }} nc
 */
function ncTextIsMajorForTimeseries(nc) {
  const t = `${nc?.title || ''} ${nc?.detail || ''}`.toLowerCase();
  if (
    /criticité\s*:\s*mineure|criticité\s*:\s*mineur|\bmineure\b|\bmineur\b|\bfaible\b|\bminor\b/.test(
      t
    )
  ) {
    return false;
  }
  if (
    /criticité\s*:\s*majeure|criticité\s*:\s*majeur|\bmajeure\b|\bmajeur\b|\bcritique\b|\bmajor\b|\bgrave\b/.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

function frShortMonthLabel(d) {
  return d.toLocaleDateString('fr-FR', { month: 'short' });
}

/**
 * @param {number} monthCount
 * @param {Date} now
 */
function buildMonthSlots(monthCount, now) {
  const n = Math.max(1, Math.min(24, Math.floor(Number(monthCount)) || DASHBOARD_TIMESERIES_MONTHS));
  /** @type {{ key: string; label: string; year: number; monthIndex: number }[]} */
  const slots = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    slots.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: frShortMonthLabel(d),
      year: d.getFullYear(),
      monthIndex: d.getMonth()
    });
  }
  return slots;
}

/**
 * Même priorité que `getAuditTimestampMs` côté front (schéma Audit : pas de updatedAt → createdAt).
 * @param {{ createdAt?: Date; updatedAt?: Date }} a
 * @returns {number | null}
 */
function getAuditTimestampMsForTimeseries(a) {
  if (!a || typeof a !== 'object') return null;
  const candidates = [a.updatedAt, a.createdAt];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    const t = new Date(c).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

function normalizeAuditScoreValue(raw) {
  if (raw == null || raw === '') return NaN;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN;
  const n = Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Agrégations mensuelles pilotage graphiques — **uniquement** avec `tenantId` non vide.
 * @param {string} tenantId
 * @param {string | null} [siteId]
 * @param {number} [monthCount]
 */
export async function buildDashboardTimeseries(tenantId, siteId = null, monthCount = DASHBOARD_TIMESERIES_MONTHS) {
  const tid = normalizeTenantId(tenantId);
  const now = new Date();
  const slots = buildMonthSlots(monthCount, now);
  if (!tid) {
    return {
      monthCount: slots.length,
      labels: slots.map((s) => s.label),
      incidentsByMonth: slots.map((s) => ({ label: s.label, value: 0 })),
      auditsScoreByMonth: slots.map((s) => ({ label: s.label, value: 0, count: 0 })),
      nonConformitiesByMonth: {
        labels: slots.map((s) => s.label),
        major: slots.map(() => 0),
        minor: slots.map(() => 0)
      }
    };
  }

  const siteFilter = prismaTenantSiteWhere(tenantId, siteId);
  const startDate = new Date(slots[0].year, slots[0].monthIndex, 1);

  const [incidents, audits, ncs] = await Promise.all([
    prisma.incident.findMany({
      where: { ...siteFilter, createdAt: { gte: startDate } },
      select: { createdAt: true }
    }),
    prisma.audit.findMany({
      where: { ...siteFilter, createdAt: { gte: startDate } },
      select: { createdAt: true, score: true }
    }),
    prisma.nonConformity.findMany({
      where: { ...siteFilter, createdAt: { gte: startDate } },
      select: { createdAt: true, title: true, detail: true }
    })
  ]);

  const incByIdx = slots.map(() => 0);
  for (const row of incidents) {
    const dt = new Date(row.createdAt);
    if (Number.isNaN(dt.getTime())) continue;
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const idx = slots.findIndex((s) => s.key === key);
    if (idx >= 0) incByIdx[idx] += 1;
  }

  const sumByIdx = slots.map(() => 0);
  const cntByIdx = slots.map(() => 0);
  for (const a of audits) {
    const sc = normalizeAuditScoreValue(a?.score);
    if (!Number.isFinite(sc)) continue;
    const tms = getAuditTimestampMsForTimeseries(a);
    if (tms == null) continue;
    const dt = new Date(tms);
    if (Number.isNaN(dt.getTime())) continue;
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const idx = slots.findIndex((s) => s.key === key);
    if (idx < 0) continue;
    sumByIdx[idx] += sc;
    cntByIdx[idx] += 1;
  }

  const majorByIdx = slots.map(() => 0);
  const minorByIdx = slots.map(() => 0);
  for (const nc of ncs) {
    const dt = new Date(nc.createdAt);
    if (Number.isNaN(dt.getTime())) continue;
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const idx = slots.findIndex((s) => s.key === key);
    if (idx < 0) continue;
    if (ncTextIsMajorForTimeseries(nc)) majorByIdx[idx] += 1;
    else minorByIdx[idx] += 1;
  }

  return {
    monthCount: slots.length,
    labels: slots.map((s) => s.label),
    incidentsByMonth: slots.map((s, i) => ({ label: s.label, value: incByIdx[i] })),
    auditsScoreByMonth: slots.map((s, i) => ({
      label: s.label,
      value: cntByIdx[i] > 0 ? Math.round((sumByIdx[i] / cntByIdx[i]) * 10) / 10 : 0,
      count: cntByIdx[i]
    })),
    nonConformitiesByMonth: {
      labels: slots.map((s) => s.label),
      major: majorByIdx,
      minor: minorByIdx
    }
  };
}

/** Statuts action considérés comme clos (aligné kpiCore / overdue). */
function prismaActionNotClosedWhere() {
  return {
    NOT: {
      OR: [
        { status: { contains: 'termin', mode: 'insensitive' } },
        { status: { contains: 'clos', mode: 'insensitive' } },
        { status: { contains: 'ferm', mode: 'insensitive' } },
        { status: { contains: 'fait', mode: 'insensitive' } },
        { status: { contains: 'complete', mode: 'insensitive' } },
        { status: { contains: 'réalis', mode: 'insensitive' } },
        { status: { contains: 'realis', mode: 'insensitive' } },
        { status: { contains: 'clôtur', mode: 'insensitive' } },
        { status: { contains: 'clotur', mode: 'insensitive' } },
        { status: { contains: 'résolu', mode: 'insensitive' } },
        { status: { contains: 'resolu', mode: 'insensitive' } },
        { status: { contains: 'done', mode: 'insensitive' } },
        { status: { contains: 'effectu', mode: 'insensitive' } },
        { status: { contains: 'complété', mode: 'insensitive' } }
      ]
    }
  };
}

function actionOverdueWhere(now) {
  return {
    AND: [
      prismaActionNotClosedWhere(),
      { dueDate: { not: null, lt: now } }
    ]
  };
}

/**
 * @param {string} tenantId
 * @param {string | null} [siteId] — filtre strict sur siteId Prisma ; null = tous périmètres
 */
export async function getDashboardStats(tenantId, siteId = null) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const siteFilter = prismaTenantSiteWhere(tenantId, siteId);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const overdueWhere = { ...siteFilter, ...actionOverdueWhere(now) };

  const [
    incidentsTotal,
    incidentsOpenCount,
    incidentsLast30days,
    risksTotal,
    risksCritical,
    actionsTotal,
    actionsOverdue,
    nonConformities,
    auditGroups,
    criticalIncidentRows,
    overdueActionCandidates,
    timeseries,
    intelligenceIncidents,
    intelligenceRisks,
    intelligenceActions,
    intelligenceAudits,
    intelligenceProducts
  ] = await Promise.all([
    prisma.incident.count({ where: siteFilter }),
    prisma.incident.count({
      where: {
        ...siteFilter,
        NOT: { status: 'Clôturé' }
      }
    }),
    prisma.incident.count({
      where: {
        ...siteFilter,
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
    prisma.risk.count({ where: siteFilter }),
    countRisksCriticalForKpi(tenantId, siteId),
    prisma.action.count({ where: siteFilter }),
    prisma.action.count({ where: overdueWhere }),
    countNonConformitiesOpenHeuristic(tenantId, siteId),
    prisma.audit.groupBy({
      by: ['status'],
      where: siteFilter,
      _count: { _all: true }
    }),
    prisma.incident.findMany({
      where: {
        ...siteFilter,
        severity: { contains: 'critique', mode: 'insensitive' }
      },
      select: {
        ref: true,
        type: true,
        site: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: LIST_MAX
    }),
    prisma.action.findMany({
      where: overdueWhere,
      select: {
        id: true,
        title: true,
        detail: true,
        status: true,
        owner: true,
        dueDate: true,
        createdAt: true,
        siteId: true
      },
      orderBy: { dueDate: 'asc' },
      take: LIST_MAX
    }),
    buildDashboardTimeseries(tenantId, siteId),
    // Intelligence (read-only, additif). Limite volontaire pour rester "léger".
    prisma.incident.findMany({
      where: { ...siteFilter, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, ref: true, type: true, site: true, siteId: true, severity: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    }),
    prisma.risk.findMany({
      where: siteFilter,
      select: { id: true, ref: true, title: true, probability: true, gravity: true, severity: true, gp: true, status: true },
      orderBy: { updatedAt: 'desc' },
      take: 200
    }),
    prisma.action.findMany({
      where: siteFilter,
      select: { id: true, title: true, detail: true, status: true, owner: true, dueDate: true, siteId: true },
      orderBy: { dueDate: 'asc' },
      take: 200
    }),
    prisma.audit.findMany({
      where: siteFilter,
      select: { id: true, status: true, score: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.product.findMany({
      where: siteFilter,
      select: { id: true, name: true, fdsFileUrl: true, expiresAt: true },
      take: 200
    })
  ]);

  let auditsTotal = 0;
  let auditsDone = 0;
  for (const row of auditGroups) {
    const c = row._count._all;
    auditsTotal += c;
    if (isFinalAuditStatus(row.status)) auditsDone += c;
  }
  const auditsPlanned = auditsTotal - auditsDone;

  const criticalIncidents = criticalIncidentRows.map(
    ({ severity: _s, ...rest }) => rest
  );

  const overdueActionItems = overdueActionCandidates
    .filter((row) => isActionOverdueDashboardRow(row))
    .map((row) => ({
      id: row.id,
      ref: row.ref ?? null,
      title: row.title,
      detail: row.detail ?? null,
      status: row.status,
      dueDate: row.dueDate ?? null,
      priority: row.priority ?? null,
      owner: row.owner ?? null,
      siteId: row.siteId ?? null,
      createdAt: row.createdAt ?? null
    }));

  const stats = {
    incidents: {
      total: incidentsTotal,
      openCount: incidentsOpenCount,
      last30days: incidentsLast30days
    },
    risks: {
      total: risksTotal,
      critical: risksCritical
    },
    actions: {
      total: actionsTotal,
      overdue: actionsOverdue
    },
    audits: {
      total: auditsTotal,
      planned: auditsPlanned,
      done: auditsDone
    }
  };

  // Bloc intelligence additif (ne casse pas l’ancien format).
  // Tenant obligatoire pour le calcul : si absent/invalid, on n’expose pas l’intelligence.
  let intelligence = null;
  if (normalizeTenantId(tenantId)) {
    try {
      intelligence = buildQhseIntelligenceSnapshot({
        tenantId,
        incidents: intelligenceIncidents,
        risks: intelligenceRisks,
        actions: intelligenceActions,
        audits: intelligenceAudits,
        products: intelligenceProducts,
        now
      });
    } catch {
      intelligence = null;
    }
  }

  return {
    incidents: incidentsTotal,
    actions: actionsTotal,
    overdueActions: actionsOverdue,
    nonConformities,
    criticalIncidents,
    overdueActionItems,
    siteId: siteFilter?.siteId ?? null,
    stats,
    timeseries,
    ...(intelligence ? { intelligence } : {})
  };
}
