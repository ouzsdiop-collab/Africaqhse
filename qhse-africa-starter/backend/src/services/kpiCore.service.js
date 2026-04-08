/**
 * Noyau KPI / règles métier partagées — dashboard, rapports, analytics.
 * Centralise les définitions pour éviter les écarts entre écrans.
 */

import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

/**
 * @param {unknown} siteId
 * @returns {string | null}
 */
export function normalizeSiteId(siteId) {
  if (siteId == null || siteId === '') return null;
  const s = String(siteId).trim();
  return s === '' ? null : s;
}

/**
 * Filtre Prisma `where` pour entités avec `siteId` optionnel.
 * @param {string | null} siteId
 * @returns {{ siteId: string } | undefined}
 */
export function prismaSiteWhere(siteId) {
  const sid = normalizeSiteId(siteId);
  return sid ? { siteId: sid } : undefined;
}

/**
 * Filtre tenant (+ site optionnel) pour listes Prisma.
 * @param {string | null | undefined} tenantId
 * @param {string | null} siteId
 * @returns {Record<string, unknown> | undefined}
 */
export function prismaTenantSiteWhere(tenantId, siteId) {
  const tid = normalizeTenantId(tenantId);
  const sid = normalizeSiteId(siteId);
  const tf = prismaTenantFilter(tenantId);
  if (!tid) {
    return sid ? { siteId: sid } : {};
  }
  return sid ? { ...tf, siteId: sid } : { ...tf };
}

/**
 * @param {unknown} haystack
 * @param {unknown} needle
 */
export function includesInsensitive(haystack, needle) {
  if (haystack == null || needle == null) return false;
  return String(haystack).toLowerCase().includes(String(needle).toLowerCase());
}

/**
 * @param {unknown} status
 */
export function isIncidentLikelyOpen(status) {
  const s = String(status ?? '').toLowerCase();
  if (!s) return true;
  if (s.includes('clos')) return false;
  if (s.includes('clôt')) return false;
  if (s.includes('archive')) return false;
  return true;
}

/**
 * NC considérée comme ouverte (V1 — statut texte libre).
 * @param {unknown} status
 */
export function isNcOpen(status) {
  const s = String(status ?? '').toLowerCase();
  if (!s || s === 'open' || s === 'ouverte') return true;
  if (s.includes('clos')) return false;
  if (s.includes('clôt')) return false;
  if (s.includes('traité')) return false;
  return true;
}

/**
 * Action « en retard » (dashboard / synthèse) : hors clôture, et
 * statut contenant « retard » **ou** échéance `dueDate` dépassée (SQLite `datetime('now')`).
 * Aligné avec la dérivation client (`actionOverdueDashboard.js`).
 *
 * @param {{ status?: string; dueDate?: Date | string | null }} row
 */
export function isActionOverdueDashboardRow(row) {
  const st = String(row?.status ?? '');
  if (isActionClosedForDashboardKpiSqlMirror(st)) return false;
  if (includesInsensitive(row?.status, 'retard')) return true;
  if (row?.dueDate == null || row.dueDate === '') return false;
  const t = new Date(row.dueDate).getTime();
  return Number.isFinite(t) && t < Date.now();
}

function isActionClosedForDashboardKpiSqlMirror(st) {
  return /termin|clos|ferm|fait|complete|réalis|realis|clôtur|clotur|résolu|resolu|done|effectu|complété/i.test(
    String(st)
  );
}

/** Fragment SQL : statuts considérés comme clôturés (miroir de `isActionClosedForDashboardKpiSqlMirror`). */
const SQL_ACTION_NOT_CLOSED_FOR_OVERDUE = `NOT (
  LOWER(COALESCE(status, '')) LIKE '%termin%'
  OR LOWER(COALESCE(status, '')) LIKE '%clos%'
  OR LOWER(COALESCE(status, '')) LIKE '%ferm%'
  OR LOWER(COALESCE(status, '')) LIKE '%fait%'
  OR LOWER(COALESCE(status, '')) LIKE '%complete%'
  OR LOWER(COALESCE(status, '')) LIKE '%réalis%'
  OR LOWER(COALESCE(status, '')) LIKE '%realis%'
  OR LOWER(COALESCE(status, '')) LIKE '%clôtur%'
  OR LOWER(COALESCE(status, '')) LIKE '%clotur%'
  OR LOWER(COALESCE(status, '')) LIKE '%résolu%'
  OR LOWER(COALESCE(status, '')) LIKE '%resolu%'
  OR LOWER(COALESCE(status, '')) LIKE '%done%'
  OR LOWER(COALESCE(status, '')) LIKE '%effectu%'
  OR LOWER(COALESCE(status, '')) LIKE '%complété%'
)`;

const SQL_ACTION_OVERDUE_BODY = `(
  LOWER(COALESCE(status, '')) LIKE '%retard%'
  OR (dueDate IS NOT NULL AND datetime(dueDate) < datetime('now'))
)`;

/**
 * Compte les actions en retard (dashboard / reportingSummary — même règle que les listes `overdueActionItems`).
 * @param {string | null | undefined} tenantId
 * @param {string | null} siteId
 */
export async function countActionsOverdue(tenantId, siteId) {
  const tid = normalizeTenantId(tenantId);
  const sid = normalizeSiteId(siteId);
  if (!tid) {
    const tf = prismaTenantFilter(tenantId);
    const rows = await prisma.action.findMany({
      where: { ...tf, ...(sid ? { siteId: sid } : {}) },
      select: { status: true, dueDate: true }
    });
    return rows.filter(isActionOverdueDashboardRow).length;
  }
  const where = `tenantId = ? AND ${SQL_ACTION_NOT_CLOSED_FOR_OVERDUE} AND ${SQL_ACTION_OVERDUE_BODY}`;
  const rows = sid
    ? await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS c FROM actions WHERE ${where} AND siteId = ?`,
        tid,
        sid
      )
    : await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM actions WHERE ${where}`, tid);
  return Number(rows[0]?.c ?? 0);
}

/**
 * NC « ouvertes » selon heuristique SQL (alignée sur reportingSummary).
 * @param {string | null | undefined} tenantId
 * @param {string | null} siteId
 */
export async function countNonConformitiesOpenHeuristic(tenantId, siteId) {
  const tid = normalizeTenantId(tenantId);
  const sid = normalizeSiteId(siteId);
  if (!tid) {
    const tf = prismaTenantFilter(tenantId);
    const rows = await prisma.nonConformity.findMany({
      where: { ...tf, ...(sid ? { siteId: sid } : {}) },
      select: { status: true }
    });
    return rows.filter((r) => isNcOpen(r.status)).length;
  }
  const rows = sid
    ? await prisma.$queryRaw`
        SELECT COUNT(*) AS c FROM non_conformities
        WHERE tenantId = ${tid}
          AND LOWER(COALESCE(status, '')) NOT LIKE '%clos%'
          AND LOWER(COALESCE(status, '')) NOT LIKE '%clôt%'
          AND LOWER(COALESCE(status, '')) NOT LIKE '%trait%'
          AND siteId = ${sid}
      `
    : await prisma.$queryRaw`
        SELECT COUNT(*) AS c FROM non_conformities
        WHERE tenantId = ${tid}
          AND LOWER(COALESCE(status, '')) NOT LIKE '%clos%'
          AND LOWER(COALESCE(status, '')) NOT LIKE '%clôt%'
          AND LOWER(COALESCE(status, '')) NOT LIKE '%trait%'
      `;
  return Number(rows[0]?.c ?? 0);
}

/**
 * Alertes prioritaires — même logique que l’ancienne synthèse (pour cohérence exports / UI).
 */
export function buildPriorityAlerts({
  incidentsCriticalOpen,
  actionsOverdue,
  nonConformitiesOpen,
  auditScoreAvg,
  auditsTotal,
  incidentsLast30Days
}) {
  /** @type {{ level: 'critical'|'high'|'info', code: string, message: string }[]} */
  const alerts = [];

  if (incidentsCriticalOpen > 0) {
    alerts.push({
      level: 'critical',
      code: 'INCIDENTS_CRITIQUES',
      message: `${incidentsCriticalOpen} incident(s) critique(s) encore ouverts (périmètre récent analysé).`
    });
  }

  if (actionsOverdue > 0) {
    alerts.push({
      level: 'high',
      code: 'ACTIONS_RETARD',
      message: `${actionsOverdue} action(s) en retard — relance plan d’actions.`
    });
  }

  if (nonConformitiesOpen > 0) {
    alerts.push({
      level: nonConformitiesOpen >= 5 ? 'high' : 'info',
      code: 'NC_OUVERTES',
      message: `${nonConformitiesOpen} non-conformité(s) ouverte(s) à suivre.`
    });
  }

  if (auditsTotal > 0 && auditScoreAvg != null && auditScoreAvg < 70) {
    alerts.push({
      level: 'high',
      code: 'SCORE_AUDIT_FAIBLE',
      message: `Score moyen des audits : ${auditScoreAvg} % — prioriser les plans d’amélioration.`
    });
  }

  if (incidentsLast30Days >= 10) {
    alerts.push({
      level: 'info',
      code: 'VOLUME_INCIDENTS',
      message: `${incidentsLast30Days} incident(s) sur les 30 derniers jours — à contextualiser en comité.`
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: 'info',
      code: 'SITUATION_STABLE',
      message: 'Aucune alerte prioritaire automatique — vérifier les listes de détail pour le comité.'
    });
  }

  return alerts;
}
