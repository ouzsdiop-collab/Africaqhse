import { prisma } from '../db.js';
import {
  countNonConformitiesOpenHeuristic,
  isActionOverdueDashboardRow,
  prismaTenantSiteWhere
} from './kpiCore.service.js';
import { isFinalAuditStatus } from './auditAutoReport.service.js';

const LIST_MAX = 5;

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
    overdueActionCandidates
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
    prisma.risk.count({
      where: {
        ...siteFilter,
        OR: [{ gp: { gte: 16 } }, { severity: { gte: 4 } }]
      }
    }),
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
        title: true,
        detail: true,
        status: true,
        owner: true,
        dueDate: true,
        createdAt: true
      },
      orderBy: { dueDate: 'asc' },
      take: LIST_MAX
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

  const overdueActionItems = overdueActionCandidates.filter((row) =>
    isActionOverdueDashboardRow(row)
  );

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

  return {
    incidents: incidentsTotal,
    actions: actionsTotal,
    overdueActions: actionsOverdue,
    nonConformities,
    criticalIncidents,
    overdueActionItems,
    siteId: siteFilter?.siteId ?? null,
    stats
  };
}
