import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { normalizeSiteId } from './kpiCore.service.js';
import { getReportingSummary } from './reportingSummary.service.js';
import { buildPeriodicReport } from './periodicReporting.service.js';

const TOP_RISKS_COUNT = 5;
const UPCOMING_HABILITATIONS_DAYS = 60;
const UPCOMING_HABILITATIONS_COUNT = 10;

const PERIOD_SPAN_MONTHS = { month: 1, quarter: 3 };

/**
 * Période courante (N derniers mois calendaires, N selon period) et période précédente
 * de même longueur, pour comparaison. `period: 'month'` reproduit exactement l'ancien
 * comportement (mois en cours vs mois précédent).
 * @param {'month' | 'quarter'} period
 */
function periodRanges(period) {
  const span = PERIOD_SPAN_MONTHS[period] || PERIOD_SPAN_MONTHS.month;
  const now = new Date();
  const current = {
    start: new Date(now.getFullYear(), now.getMonth() - (span - 1), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  };
  const previous = {
    start: new Date(now.getFullYear(), now.getMonth() - (span * 2 - 1), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() - span + 1, 0, 23, 59, 59, 999)
  };
  return { current, previous };
}

/**
 * @param {string} period
 * @returns {'month' | 'quarter'}
 */
function normalizeDirectionPeriod(period) {
  return period === 'quarter' ? 'quarter' : 'month';
}

function pctDelta(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * @param {string} tenantId
 * @param {string | null} siteId
 */
async function getTopUnmanagedRisks(tenantId, siteId) {
  const tf = prismaTenantFilter(tenantId);
  const sid = normalizeSiteId(siteId);
  const where = { ...tf, ...(sid ? { siteId: sid } : {}), status: { not: 'closed' } };
  const rows = await prisma.risk.findMany({
    where,
    select: { id: true, ref: true, title: true, category: true, gravity: true, severity: true, probability: true, gp: true, status: true, owner: true, siteId: true },
    take: 300
  });
  return rows
    .map((r) => ({ ...r, computedScore: Number.isFinite(r.gp) ? r.gp : (r.severity || 1) * (r.probability || 1) }))
    .sort((a, b) => b.computedScore - a.computedScore)
    .slice(0, TOP_RISKS_COUNT);
}

/**
 * @param {string} tenantId
 * @param {string | null} siteId
 */
async function getUpcomingDeadlines(tenantId, siteId) {
  const tf = prismaTenantFilter(tenantId);
  const sid = normalizeSiteId(siteId);
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + UPCOMING_HABILITATIONS_DAYS);

  const habilitations = await prisma.habilitation.findMany({
    where: {
      ...tf,
      ...(sid ? { siteId: sid } : {}),
      status: { not: 'expired' },
      validUntil: { gte: now, lte: horizon }
    },
    select: { id: true, type: true, level: true, validUntil: true, user: { select: { name: true, email: true } } },
    orderBy: { validUntil: 'asc' },
    take: UPCOMING_HABILITATIONS_COUNT
  });

  return habilitations.map((h) => ({
    type: h.type,
    level: h.level,
    validUntil: h.validUntil ? h.validUntil.toISOString() : null,
    holder: h.user?.name || h.user?.email || '—'
  }));
}

/**
 * Synthèse direction : KPIs de la période sélectionnée, comparaison avec la période
 * précédente de même longueur, top risques non maîtrisés et échéances critiques à venir.
 * @param {string | null | undefined} tenantId
 * @param {string | null} [siteId]
 * @param {'month' | 'quarter'} [period]
 */
export async function getDirectionSummary(tenantId, siteId = null, period = 'month') {
  const tid = normalizeTenantId(tenantId);
  const sid = normalizeSiteId(siteId);
  const normalizedPeriod = normalizeDirectionPeriod(period);

  const { current, previous } = periodRanges(normalizedPeriod);

  const [currentPeriod, previousPeriod, reportingSummary, topRisks, upcomingDeadlines] = await Promise.all([
    buildPeriodicReport({
      tenantId: tid,
      period: 'custom',
      startDateInput: current.start.toISOString(),
      endDateInput: current.end.toISOString(),
      siteId: sid
    }),
    buildPeriodicReport({
      tenantId: tid,
      period: 'custom',
      startDateInput: previous.start.toISOString(),
      endDateInput: previous.end.toISOString(),
      siteId: sid
    }),
    getReportingSummary(tid, sid, { emptyIfNoTenant: true }),
    getTopUnmanagedRisks(tid, sid),
    getUpcomingDeadlines(tid, sid)
  ]);

  const trends = {
    incidentsCreated: {
      current: currentPeriod.summary.incidentsCreated,
      previous: previousPeriod.summary.incidentsCreated,
      deltaPct: pctDelta(currentPeriod.summary.incidentsCreated, previousPeriod.summary.incidentsCreated)
    },
    auditScoreAvg: {
      current: currentPeriod.summary.auditScoreAvg,
      previous: previousPeriod.summary.auditScoreAvg,
      deltaPct: pctDelta(currentPeriod.summary.auditScoreAvg, previousPeriod.summary.auditScoreAvg)
    },
    actionsOverdueStock: {
      current: currentPeriod.summary.actionsOverdueStock,
      previous: previousPeriod.summary.actionsOverdueStock,
      deltaPct: pctDelta(currentPeriod.summary.actionsOverdueStock, previousPeriod.summary.actionsOverdueStock)
    },
    nonConformitiesCreated: {
      current: currentPeriod.summary.nonConformitiesCreated,
      previous: previousPeriod.summary.nonConformitiesCreated,
      deltaPct: pctDelta(currentPeriod.summary.nonConformitiesCreated, previousPeriod.summary.nonConformitiesCreated)
    }
  };

  return {
    generatedAt: new Date().toISOString(),
    siteId: sid,
    period: normalizedPeriod,
    currentPeriod: currentPeriod.summary,
    previousPeriod: previousPeriod.summary,
    trends,
    counts: reportingSummary.counts,
    kpis: reportingSummary.kpis,
    priorityAlerts: [...currentPeriod.alerts, ...reportingSummary.priorityAlerts].slice(0, 8),
    topRisks,
    upcomingDeadlines
  };
}
