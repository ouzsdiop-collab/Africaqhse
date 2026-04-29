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

function clampScore100(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function stripLongDashes(s) {
  return String(s || '').replaceAll('—', '-').replaceAll('–', '-');
}

/**
 * Cockpit Essentiel: priorités déterministes, explicables, léger.
 * @param {{
 *  stats: any;
 *  nonConformitiesOpen: number;
 *  criticalIncidents: any[];
 *  overdueActions: number;
 *  risksCritical: number;
 * }} input
 */
function buildEssentialPilotageSnapshot(input) {
  const overdue = Math.max(0, Number(input?.overdueActions) || 0);
  const ncOpen = Math.max(0, Number(input?.nonConformitiesOpen) || 0);
  const critInc = Array.isArray(input?.criticalIncidents) ? input.criticalIncidents.length : 0;
  const risksCrit = Math.max(0, Number(input?.risksCritical) || 0);

  // Score simple (0-100) : pénalités graduelles, explicables.
  const score = clampScore100(
    100 - Math.min(overdue * 7, 49) - Math.min(critInc * 20, 60) - Math.min(ncOpen * 6, 36) - Math.min(risksCrit * 5, 35)
  );

  /** @type {{ label: string; reason: string; severity: 'low'|'medium'|'high'|'critical'; source:'deterministic'; confidence:'low'|'medium'|'high' }[]} */
  const topPriorities = [];
  if (critInc > 0) {
    topPriorities.push({
      label: 'Incidents critiques',
      reason: stripLongDashes(`${critInc} incident(s) critique(s) à traiter et sécuriser.`),
      severity: critInc >= 3 ? 'critical' : 'high',
      source: 'deterministic',
      confidence: 'high'
    });
  }
  if (overdue > 0) {
    topPriorities.push({
      label: 'Actions en retard',
      reason: stripLongDashes(`${overdue} action(s) en retard. Débloquer, réassigner ou replanifier.`),
      severity: overdue >= 6 ? 'critical' : overdue >= 3 ? 'high' : 'medium',
      source: 'deterministic',
      confidence: 'high'
    });
  }
  if (ncOpen > 0) {
    topPriorities.push({
      label: 'Non-conformités ouvertes',
      reason: stripLongDashes(`${ncOpen} NC ouverte(s). Prioriser la clôture et la preuve.`),
      severity: ncOpen >= 5 ? 'high' : 'medium',
      source: 'deterministic',
      confidence: 'medium'
    });
  }
  if (risksCrit > 0) {
    topPriorities.push({
      label: 'Risques critiques',
      reason: stripLongDashes(`${risksCrit} risque(s) critique(s) au registre. Vérifier les actions liées.`),
      severity: risksCrit >= 4 ? 'high' : 'medium',
      source: 'deterministic',
      confidence: 'medium'
    });
  }

  topPriorities.sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    return (rank[b.severity] || 0) - (rank[a.severity] || 0);
  });

  const priorities3 = topPriorities.slice(0, 3);

  const executiveSummaryParts = [];
  executiveSummaryParts.push(`Score QHSE: ${score}/100.`);
  if (priorities3.length) {
    executiveSummaryParts.push(
      `Priorités: ${priorities3.map((p) => p.label.toLowerCase()).join(', ')}.`
    );
  } else {
    executiveSummaryParts.push('Aucune priorité majeure détectée sur cette vue.');
  }
  const executiveSummary = stripLongDashes(executiveSummaryParts.join(' ').trim());

  const recommendedActions = priorities3.map((p) => {
    if (p.label.toLowerCase().includes('incident')) return 'Ouvrir les incidents critiques et décider des actions.';
    if (p.label.toLowerCase().includes('retard')) return 'Ouvrir le plan d’actions et traiter les retards.';
    if (p.label.toLowerCase().includes('non-conform')) return 'Ouvrir les audits/NC et définir un plan de clôture.';
    if (p.label.toLowerCase().includes('risque')) return 'Ouvrir le registre risques et lier des actions aux risques critiques.';
    return 'Ouvrir le module concerné et traiter la priorité.';
  });

  // Qualité données: cette synthèse est basée sur compteurs DB (fiable). Timeseries reste optionnel.
  const dataQuality = {
    incidents: 'complete',
    actions: 'complete',
    audits: 'complete',
    risks: 'complete'
  };

  return { score, topPriorities: priorities3, dataQuality, recommendedActions, executiveSummary };
}

/**
 * Pilotage unifié (mode expert) : plus détaillé, toujours déterministe et explicable.
 * @param {{
 *  nonConformitiesOpen: number;
 *  criticalIncidents: any[];
 *  overdueActions: number;
 *  risksCritical: number;
 *  timeseriesPresent: boolean;
 *  auditsTotal: number;
 * }} input
 */
function buildExpertPilotageSnapshot(input) {
  const overdue = Math.max(0, Number(input?.overdueActions) || 0);
  const ncOpen = Math.max(0, Number(input?.nonConformitiesOpen) || 0);
  const critInc = Array.isArray(input?.criticalIncidents) ? input.criticalIncidents.length : 0;
  const risksCrit = Math.max(0, Number(input?.risksCritical) || 0);
  const auditsTotal = Math.max(0, Number(input?.auditsTotal) || 0);

  const subScores = {
    actions: clampScore100(100 - Math.min(overdue * 7, 49)),
    incidents: clampScore100(100 - Math.min(critInc * 20, 60)),
    conformity: clampScore100(100 - Math.min(ncOpen * 6, 36)),
    risks: clampScore100(100 - Math.min(risksCrit * 7, 49))
  };

  const score = clampScore100(
    0.32 * subScores.actions +
      0.28 * subScores.incidents +
      0.22 * subScores.conformity +
      0.18 * subScores.risks
  );

  /** @type {{ id: string; label: string; reason: string; severity: 'low'|'medium'|'high'|'critical'; source:'deterministic'; confidence:'low'|'medium'|'high'; navigateHash?: string; navigateIntent?: Record<string,unknown> }[]} */
  const priorities = [];

  if (critInc > 0) {
    priorities.push({
      id: 'incidents_critical',
      label: 'Incidents critiques',
      reason: stripLongDashes(`${critInc} incident(s) critique(s) détecté(s). Analyse et actions immédiates attendues.`),
      severity: critInc >= 3 ? 'critical' : 'high',
      source: 'deterministic',
      confidence: 'high',
      navigateHash: 'incidents',
      navigateIntent: { incidentSeverityFilter: 'critique', dashboardIncidentPeriodPreset: '30', source: 'pilotage_expert' }
    });
  }
  if (overdue > 0) {
    priorities.push({
      id: 'actions_overdue',
      label: 'Actions en retard',
      reason: stripLongDashes(`${overdue} action(s) en retard. Débloquer, réassigner ou replanifier.`),
      severity: overdue >= 6 ? 'critical' : overdue >= 3 ? 'high' : 'medium',
      source: 'deterministic',
      confidence: 'high',
      navigateHash: 'actions',
      navigateIntent: { actionsColumnFilter: 'overdue', scrollToId: 'qhse-actions-col-overdue', source: 'pilotage_expert' }
    });
  }
  if (ncOpen > 0) {
    priorities.push({
      id: 'nc_open',
      label: 'Non-conformités ouvertes',
      reason: stripLongDashes(`${ncOpen} NC ouverte(s). Prioriser la clôture avec preuve et délais.`),
      severity: ncOpen >= 5 ? 'high' : 'medium',
      source: 'deterministic',
      confidence: 'medium',
      navigateHash: 'audits',
      navigateIntent: { scrollToId: 'audit-cockpit-tier-critical', source: 'pilotage_expert' }
    });
  }
  if (risksCrit > 0) {
    priorities.push({
      id: 'risks_critical',
      label: 'Risques critiques',
      reason: stripLongDashes(`${risksCrit} risque(s) critique(s) au registre. Vérifier les actions liées.`),
      severity: risksCrit >= 4 ? 'high' : 'medium',
      source: 'deterministic',
      confidence: 'medium',
      navigateHash: 'iso',
      navigateIntent: { source: 'pilotage_expert' }
    });
  }

  priorities.sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    return (rank[b.severity] || 0) - (rank[a.severity] || 0);
  });

  const topPriorities = priorities.slice(0, 3);

  const executiveSummary = stripLongDashes(
    [
      `Score QHSE: ${score}/100.`,
      topPriorities.length
        ? `Priorités: ${topPriorities.map((p) => p.label.toLowerCase()).join(', ')}.`
        : 'Aucune priorité majeure détectée sur cette vue.',
      auditsTotal > 0 ? `Audits: ${auditsTotal} au total sur le périmètre.` : ''
    ]
      .filter(Boolean)
      .join(' ')
      .trim()
  );

  const dataQuality = {
    incidents: 'complete',
    actions: 'complete',
    audits: auditsTotal > 0 ? 'complete' : 'partial',
    risks: 'complete'
  };

  // signalSources (lisible + compatible avec le vocabulaire existant côté front)
  const signalSources = {
    incidentsTotal: 'api_stats',
    actionsOverdue: 'api_stats',
    nonConformities: 'api_stats',
    risksCritical: 'api_stats',
    auditsSummary: auditsTotal > 0 ? 'api_stats' : 'unavailable',
    timeseries: input?.timeseriesPresent ? 'api_timeseries' : 'unavailable'
  };

  return { score, subScores, priorities, topPriorities, dataQuality, signalSources, executiveSummary };
}

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
    intelligenceProducts,
    intelligenceFdsDocuments
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
      select: {
        id: true,
        title: true,
        detail: true,
        status: true,
        owner: true,
        dueDate: true,
        siteId: true,
        riskId: true
      },
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
      // Product n'a pas d'expiresAt : le suivi conformité FDS se fait via ControlledDocument.
      select: { id: true, name: true, fdsFileUrl: true, casNumber: true, hStatements: true },
      take: 200
    }),
    prisma.controlledDocument.findMany({
      where: {
        ...siteFilter,
        OR: [
          { type: { contains: 'fds', mode: 'insensitive' } },
          { type: { contains: 'fiche', mode: 'insensitive' } },
          { type: { contains: 'données de sécurité', mode: 'insensitive' } },
          { type: { contains: 'donnees de securite', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        type: true,
        expiresAt: true,
        fdsProductRef: true,
        productId: true,
        siteId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 300
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

  const pilotageEssential = buildEssentialPilotageSnapshot({
    stats,
    nonConformitiesOpen: nonConformities,
    criticalIncidents,
    overdueActions: actionsOverdue,
    risksCritical
  });

  const pilotageExpert = buildExpertPilotageSnapshot({
    nonConformitiesOpen: nonConformities,
    criticalIncidents,
    overdueActions: actionsOverdue,
    risksCritical,
    timeseriesPresent: Boolean(timeseries),
    auditsTotal
  });

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
        // Products: contexte chimique seulement (pas conformité FDS).
        products: intelligenceProducts,
        // FDS: conformité uniquement via ControlledDocument.
        fdsDocuments: intelligenceFdsDocuments,
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
    pilotageEssential,
    pilotageExpert,
    ...(intelligence ? { intelligence } : {})
  };
}
