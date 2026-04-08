import { prisma } from '../db.js';
import {
  buildPriorityAlerts,
  countActionsOverdue,
  countNonConformitiesOpenHeuristic,
  includesInsensitive,
  isIncidentLikelyOpen,
  isNcOpen,
  normalizeSiteId,
  prismaTenantSiteWhere
} from './kpiCore.service.js';

const LIST_AUDITS = 6;
const LIST_NC = 8;
const LIST_ACTIONS = 8;
const LIST_CRITICAL_INCIDENTS = 6;
const RECENT_INCIDENT_SCAN = 400;
const DEFAULT_PERIOD_DAYS = 30;

/**
 * Réponse vide (même forme que getReportingSummary) — ex. hors auth / sans tenant en base.
 */
export function buildEmptyReportingSummary(siteIdNormalized = null) {
  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    siteId: siteIdNormalized,
    counts: {
      incidentsTotal: 0,
      incidentsLast30Days: 0,
      incidentsCriticalOpen: 0,
      nonConformitiesTotal: 0,
      nonConformitiesOpen: 0,
      actionsTotal: 0,
      actionsOverdue: 0,
      auditsTotal: 0
    },
    kpis: {
      auditScoreAvg: null,
      auditScoreMin: null,
      auditScoreMax: null
    },
    recentAudits: [],
    openNonConformities: [],
    overdueActions: [],
    criticalIncidents: [],
    priorityAlerts: [],
    export: {
      documentTitle: siteIdNormalized
        ? 'Synthèse QHSE — périmètre site'
        : 'Synthèse QHSE consolidée',
      schemaVersion: 1,
      sectionsOrder: [
        'counts',
        'kpis',
        'priorityAlerts',
        'criticalIncidents',
        'overdueActions',
        'openNonConformities',
        'recentAudits'
      ]
    }
  };
}

/**
 * Synthèse consolidée pour pilotage QHSE / direction.
 * @param {string | null | undefined} tenantId
 * @param {string | null} [siteId] — filtre strict ; null = groupe (comportement historique)
 * @param {{ emptyIfNoTenant?: boolean, periodDays?: number }} [options]
 */
export async function getReportingSummary(tenantId, siteId = null, options = {}) {
  const emptyIfNoTenant = options.emptyIfNoTenant === true;
  const rawDays = Number(options.periodDays);
  const periodDays =
    Number.isFinite(rawDays) && rawDays > 0 && rawDays <= 366
      ? Math.floor(rawDays)
      : DEFAULT_PERIOD_DAYS;

  const tid = tenantId == null || tenantId === '' ? '' : String(tenantId).trim();
  if (!tid) {
    if (emptyIfNoTenant) {
      return buildEmptyReportingSummary(normalizeSiteId(siteId));
    }
    throw Object.assign(new Error('Tenant requis'), { statusCode: 400 });
  }
  const sid = normalizeSiteId(siteId);
  const siteWhere = prismaTenantSiteWhere(tenantId, siteId);

  const sincePeriod = new Date();
  sincePeriod.setDate(sincePeriod.getDate() - periodDays);

  const [
    incidentsTotal,
    incidentsLast30Days,
    nonConformitiesTotal,
    nonConformitiesOpen,
    actionsTotal,
    actionsOverdue,
    auditsTotal,
    auditAggregate,
    recentAudits,
    nonConformityRows,
    overdueActionsRows,
    recentIncidents
  ] = await Promise.all([
    prisma.incident.count({ where: siteWhere }),
    prisma.incident.count({
      where: {
        ...(siteWhere || {}),
        createdAt: { gte: sincePeriod }
      }
    }),
    prisma.nonConformity.count({ where: siteWhere }),
    countNonConformitiesOpenHeuristic(tenantId, siteId),
    prisma.action.count({ where: siteWhere }),
    countActionsOverdue(tenantId, siteId),
    prisma.audit.count({ where: siteWhere }),
    prisma.audit.aggregate({
      where: siteWhere,
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true }
    }),
    prisma.audit.findMany({
      where: siteWhere,
      select: {
        ref: true,
        site: true,
        score: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: LIST_AUDITS
    }),
    prisma.nonConformity.findMany({
      where: siteWhere,
      select: {
        id: true,
        title: true,
        detail: true,
        status: true,
        auditRef: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    }),
    sid
      ? prisma.$queryRaw`
      SELECT title, detail, status, owner, dueDate, createdAt FROM actions
      WHERE tenantId = ${tid} AND LOWER(status) LIKE '%retard%' AND siteId = ${sid}
      ORDER BY COALESCE(dueDate, createdAt) ASC
      LIMIT ${LIST_ACTIONS}
    `
      : prisma.$queryRaw`
      SELECT title, detail, status, owner, dueDate, createdAt FROM actions
      WHERE tenantId = ${tid} AND LOWER(status) LIKE '%retard%'
      ORDER BY COALESCE(dueDate, createdAt) ASC
      LIMIT ${LIST_ACTIONS}
    `,
    prisma.incident.findMany({
      where: siteWhere,
      select: {
        ref: true,
        type: true,
        site: true,
        severity: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_INCIDENT_SCAN
    })
  ]);

  const openNonConformities = nonConformityRows.filter((r) => isNcOpen(r.status));

  const overdueActions = (Array.isArray(overdueActionsRows) ? overdueActionsRows : []).map(
    (row) => ({
      title: row.title,
      detail: row.detail,
      status: row.status,
      owner: row.owner,
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString()
    })
  );

  const criticalIncidents = recentIncidents.filter(
    (row) =>
      includesInsensitive(row.severity, 'critique') && isIncidentLikelyOpen(row.status)
  );

  const incidentsCriticalOpen = criticalIncidents.length;

  const criticalIncidentsList = criticalIncidents.slice(0, LIST_CRITICAL_INCIDENTS).map((row) => ({
    ref: row.ref,
    type: row.type,
    site: row.site,
    status: row.status,
    createdAt: row.createdAt.toISOString()
  }));

  const openNcSample = openNonConformities.slice(0, LIST_NC).map((row) => ({
    id: row.id,
    title: row.title,
    detail: row.detail,
    status: row.status,
    auditRef: row.auditRef,
    createdAt: row.createdAt.toISOString()
  }));

  const avg = auditAggregate._avg.score;
  const auditScoreAvg = avg != null && !Number.isNaN(avg) ? Math.round(avg * 10) / 10 : null;

  const recentAuditsOut = recentAudits.map((a) => ({
    ref: a.ref,
    site: a.site,
    score: a.score,
    status: a.status,
    createdAt: a.createdAt.toISOString()
  }));

  const priorityAlerts = buildPriorityAlerts({
    incidentsCriticalOpen,
    actionsOverdue,
    nonConformitiesOpen,
    auditScoreAvg,
    auditsTotal,
    incidentsLast30Days
  });

  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    siteId: sid,
    counts: {
      incidentsTotal,
      incidentsLast30Days,
      incidentsCriticalOpen,
      nonConformitiesTotal,
      nonConformitiesOpen,
      actionsTotal,
      actionsOverdue,
      auditsTotal
    },
    kpis: {
      auditScoreAvg,
      auditScoreMin: auditAggregate._min.score,
      auditScoreMax: auditAggregate._max.score
    },
    recentAudits: recentAuditsOut,
    openNonConformities: openNcSample,
    overdueActions,
    criticalIncidents: criticalIncidentsList,
    priorityAlerts,
    export: {
      documentTitle: sid ? 'Synthèse QHSE — périmètre site' : 'Synthèse QHSE consolidée',
      schemaVersion: 1,
      sectionsOrder: [
        'counts',
        'kpis',
        'priorityAlerts',
        'criticalIncidents',
        'overdueActions',
        'openNonConformities',
        'recentAudits'
      ]
    }
  };
}
