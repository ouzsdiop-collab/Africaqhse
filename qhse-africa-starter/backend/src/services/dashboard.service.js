import { prisma } from '../db.js';
import {
  countActionsOverdue,
  includesInsensitive,
  prismaSiteWhere
} from './kpiCore.service.js';

const LIST_MAX = 5;
/** Fenêtre récente pour appliquer filtres insensibles à la casse sans scanner toute la base. */
const RECENT_SCAN = 500;

/**
 * @param {string | null} [siteId] — filtre strict sur siteId Prisma ; null = tous périmètres
 */
export async function getDashboardStats(siteId = null) {
  const siteFilter = prismaSiteWhere(siteId);

  const [incidents, actions, nonConformities, overdueActions, incidentRows, actionRows] =
    await Promise.all([
      prisma.incident.count({ where: siteFilter }),
      prisma.action.count({ where: siteFilter }),
      prisma.nonConformity.count({ where: siteFilter }),
      countActionsOverdue(siteId),
      prisma.incident.findMany({
        where: siteFilter,
        select: {
          ref: true,
          type: true,
          site: true,
          status: true,
          createdAt: true,
          severity: true
        },
        orderBy: { createdAt: 'desc' },
        take: RECENT_SCAN
      }),
      prisma.action.findMany({
        where: siteFilter,
        select: {
          title: true,
          detail: true,
          status: true,
          owner: true,
          dueDate: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: RECENT_SCAN
      })
    ]);

  const criticalIncidents = incidentRows
    .filter((row) => includesInsensitive(row.severity, 'critique'))
    .slice(0, LIST_MAX)
    .map(({ severity: _s, ...rest }) => rest);

  const overdueActionItems = actionRows
    .filter((row) => includesInsensitive(row.status, 'retard'))
    .slice(0, LIST_MAX);

  return {
    incidents,
    actions,
    overdueActions,
    nonConformities,
    criticalIncidents,
    overdueActionItems,
    siteId: siteFilter?.siteId ?? null
  };
}
