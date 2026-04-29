/**
 * Assistant pilotage QHSE : règles métier + enrichissement optionnel via
 * POST /api/ai-suggestions/suggest/actions (body { dashboardContext }).
 */

import { computeQhseGlobalScore } from '../utils/dashboardDecisionLayer.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { risks as seedRisks } from '../data/mock.js';
import { AUDITS_TO_SCHEDULE } from '../data/conformityStore.js';
import {
  riskCriticalityFromMeta,
  riskTierFromGp,
  riskLevelLabelFromTier
} from '../utils/riskMatrixCore.js';
import {
  fetchControlledDocumentsFromApi,
  mergeControlledDocumentRows,
  computeDocumentRegistrySummary
} from './documentRegistry.service.js';
import {
  buildActionDefaultsFromIncident,
  buildActionDefaultsFromCriticalRisk,
  buildActionDefaultsFromExpiredDocument,
  buildActionDefaultsFromOverdueItem,
  buildActionDefaultsFromAuditPrep,
  buildActionDefaultsFromRenewingDocument
} from '../utils/qhseAssistantFormSuggestions.js';
import { mapApiRiskToUi, riskTierBucket } from '../utils/risksRegisterModel.js';
import {
  compactTimeseriesForAiPayload,
  computeRisksCriticalForPayload
} from '../utils/dashboardMetrics.js';
import { isDemoMode } from './demoMode.service.js';
import { asDashboardCount } from '../utils/reconcileDashboardStats.js';

/**
 * @param {object} r
 */
function riskIsCritique(r) {
  const c = riskCriticalityFromMeta(r?.meta);
  if (c && c.tier >= 5) return true;
  const s = String(r?.status || '').toLowerCase();
  return s.includes('critique') || (s.includes('très') && s.includes('élev'));
}

/**
 * Aligné sur le mapping API risques (G/P numériques → meta « Gn × Pm »).
 * @param {object} row
 */
function mapApiRiskRowForAssistant(row) {
  const gRaw = Number(row?.gravity ?? row?.severity ?? 3);
  const pRaw = Number(row?.probability ?? 3);
  const g = Number.isFinite(gRaw) && gRaw > 0 ? Math.max(1, Math.min(5, Math.round(gRaw))) : 3;
  const p = Number.isFinite(pRaw) && pRaw > 0 ? Math.max(1, Math.min(5, Math.round(pRaw))) : 3;
  const meta = `G${g} × P${p}`;
  const tier = riskTierFromGp(g, p);
  const statusLabel = row?.status != null ? String(row.status) : riskLevelLabelFromTier(tier);
  return {
    title: String(row?.title || 'Sans titre'),
    type: String(row?.category || ''),
    meta,
    status: statusLabel,
    actionLinked: row?.actionLinked ?? null
  };
}

/**
 * @param {object[]} actions
 */
function countActionsClosed(actions) {
  if (!Array.isArray(actions)) return 0;
  return actions.filter((a) =>
    /clos|ferm|termin|done|compl|achev|résolu|clôtur/i.test(String(a?.status || ''))
  ).length;
}

/**
 * Première action jugée en retard (liste API) si les stats n’exposent pas encore d’aperçu.
 * @param {object[]} actions
 */
function pickFirstOverdueFromActions(actions) {
  if (!Array.isArray(actions) || !actions.length) return null;
  const now = Date.now();
  for (const a of actions) {
    const st = String(a?.status || '').toLowerCase();
    if (/clos|ferm|termin|done|compl|achev|résolu|clôtur/i.test(st)) continue;
    if (/retard/i.test(st)) return a;
    const raw = a?.dueDate;
    if (raw == null || String(raw).trim() === '') continue;
    const t = new Date(raw).getTime();
    if (Number.isFinite(t) && t < now) return a;
  }
  return null;
}

/**
 * @param {number} internalScore
 */
export function priorityLabelFromScore(internalScore) {
  if (internalScore >= 72) return { key: 'urgent', label: 'Urgent' };
  if (internalScore >= 38) return { key: 'prioritaire', label: 'Prioritaire' };
  return { key: 'normal', label: 'Normal' };
}

/**
 * @typedef {'deterministic' | 'heuristic' | 'ai'} InsightSource
 * @typedef {'low' | 'medium' | 'high'} InsightConfidence
 * @typedef {'complete' | 'partial' | 'unavailable'} InsightDataQuality
 * @typedef {'low' | 'medium' | 'high' | 'critical'} InsightSeverity
 */

/**
 * @param {unknown} dataSource
 * @returns {InsightSource}
 */
function insightSourceFromDataSource(dataSource) {
  const ds = String(dataSource || '').toLowerCase();
  if (ds.startsWith('api_')) return 'deterministic';
  if (ds === 'heuristic' || ds === 'demo' || ds === 'unavailable') return 'heuristic';
  return 'heuristic';
}

/**
 * @param {unknown} dataSource
 * @returns {InsightDataQuality}
 */
function dataQualityFromDataSource(dataSource) {
  const ds = String(dataSource || '').toLowerCase();
  if (ds === 'api_stats') return 'complete';
  if (ds === 'api_list') return 'partial';
  if (ds === 'heuristic') return 'unavailable';
  if (ds === 'demo') return 'unavailable';
  return 'unavailable';
}

/**
 * @param {number} internalScore
 * @param {unknown} dataSource
 * @returns {InsightConfidence}
 */
function confidenceFromInternalScore(internalScore, dataSource) {
  const ds = String(dataSource || '').toLowerCase();
  if (ds === 'api_stats' && internalScore >= 70) return 'high';
  if (ds.startsWith('api_')) return internalScore >= 72 ? 'high' : internalScore >= 38 ? 'medium' : 'low';
  if (ds === 'heuristic') return internalScore >= 60 ? 'medium' : 'low';
  return 'low';
}

/**
 * Agrège une qualité data "globale" lisible (sans calcul lourd).
 * @param {{ overdue: number; risksSource: string }} meta
 * @param {object} stats
 * @returns {{
 *  incidents: InsightDataQuality;
 *  actions: InsightDataQuality;
 *  risks: InsightDataQuality;
 *  habilitations: InsightDataQuality;
 *  audits: InsightDataQuality;
 * }}
 */
function computeGlobalDataQuality(meta, stats) {
  const incidentsQ = Number.isFinite(Number(stats?.incidents)) ? 'complete' : 'unavailable';
  const actionsQ = Number.isFinite(Number(stats?.overdueActions))
    ? 'complete'
    : meta.overdue > 0
      ? 'partial'
      : 'unavailable';
  const rs = String(meta?.risksSource || '').toLowerCase();
  const risksQ = rs === 'api' || rs === 'api_empty' ? 'partial' : 'unavailable';
  const auditsQ =
    stats?.stats && typeof stats.stats === 'object' && stats.stats.audits && typeof stats.stats.audits === 'object'
      ? 'partial'
      : 'unavailable';
  // Pas branché sur un KPI habilitations côté dashboard pour l’instant → limited (améliorable plus tard).
  const habilitationsQ = 'unavailable';
  return { incidents: incidentsQ, actions: actionsQ, risks: risksQ, habilitations: habilitationsQ, audits: auditsQ };
}

/**
 * @param {number} internalScore
 * @returns {InsightSeverity}
 */
function severityFromInternalScore(internalScore) {
  if (internalScore >= 85) return 'critical';
  if (internalScore >= 72) return 'high';
  if (internalScore >= 38) return 'medium';
  return 'low';
}

/**
 * @param {string} navigateHash
 * @returns {string}
 */
function recommendedActionFromNavigateHash(navigateHash) {
  const h = String(navigateHash || '').trim().toLowerCase();
  if (!h) return 'Ouvrir le module concerné et traiter la priorité.';
  if (h === 'actions') return 'Ouvrir le plan d’actions, traiter les retards, réassigner si nécessaire.';
  if (h === 'incidents') return 'Ouvrir le registre incidents, vérifier le dossier critique et décider des actions.';
  if (h === 'risks') return 'Ouvrir le registre risques, confirmer la criticité et lancer une action préventive.';
  if (h === 'audits') return 'Ouvrir le cockpit audits, prioriser les NC et consolider les preuves.';
  if (h === 'iso') return 'Ouvrir la conformité ISO, compléter preuves et priorités.';
  if (h === 'products') return 'Ouvrir Produits/FDS, traiter les FDS expirées ou à revoir.';
  return 'Ouvrir le module concerné et traiter la priorité.';
}

/**
 * @param {{
 *   stats: object,
 *   incidents: object[],
 *   actions: object[],
 *   audits: object[],
 *   ncs: object[],
 *   risks?: object[]|null,
 *   siteLabel?: string
 * }} input
 */
export async function buildAssistantSnapshot(input) {
  const stats = input.stats || {};
  const incidents = input.incidents || [];
  const actions = input.actions || [];
  const audits = input.audits || [];
  const ncs = input.ncs || [];

  const ncOpen = ncs.filter((r) => {
    const s = String(r?.status || '').toLowerCase();
    if (/(clos|ferm|done|termin)/i.test(s)) return false;
    return true;
  }).length;

  const scores = audits.map((a) => Number(a.score)).filter((n) => Number.isFinite(n));
  const avgAuditScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const baseCtx = {
    stats,
    ncOpenCount: ncOpen,
    avgAuditScore,
    hasAuditScores: scores.length > 0
  };
  const baseScore = computeQhseGlobalScore(baseCtx);

  let apiDocs = [];
  try {
    apiDocs = await fetchControlledDocumentsFromApi();
  } catch {
    apiDocs = [];
  }
  const docRows = mergeControlledDocumentRows(apiDocs);
  const docSum = computeDocumentRegistrySummary(docRows);
  const expiredDocs = docRows.filter((d) => d.complianceStatus === 'expire');
  const renewDocs = docRows.filter((d) => d.complianceStatus === 'a_renouveler');

  const critInc = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
  const overdue = Math.max(0, Number(stats.overdueActions) || 0);
  const totInc = Math.max(0, Number(stats.incidents) || 0);
  const overduePreview = Array.isArray(stats.overdueActionItems) ? stats.overdueActionItems : [];
  const overdueForDialog =
    overduePreview[0] ||
    (overdue > 0 ? pickFirstOverdueFromActions(actions) : null);

  const apiRiskRows = Array.isArray(input.risks) ? input.risks : null;
  /** Liste API (y compris vide) : pas de seed. Hors chargement + pas démo → pas de fantôme démo. */
  let risksForAssistant;
  /** @type {'api' | 'api_empty' | 'demo' | 'unavailable'} */
  let risksSourceMeta;
  if (Array.isArray(input.risks)) {
    risksForAssistant = input.risks.length ? input.risks.map(mapApiRiskRowForAssistant) : [];
    risksSourceMeta = input.risks.length ? 'api' : 'api_empty';
  } else if (isDemoMode()) {
    risksForAssistant = seedRisks;
    risksSourceMeta = 'demo';
  } else {
    risksForAssistant = [];
    risksSourceMeta = 'unavailable';
  }
  const criticalRisks = risksForAssistant.filter(riskIsCritique);
  const risksSansAction = risksForAssistant.filter((r) => !r.actionLinked).length;
  const risksCriticalKpi =
    stats.stats?.risks != null && typeof stats.stats.risks === 'object'
      ? Number(/** @type {{ critical?: unknown }} */ (stats.stats.risks).critical)
      : NaN;
  const hasKpiRiskCritical =
    Number.isFinite(risksCriticalKpi) && risksCriticalKpi > 0;

  const auditsSoon = AUDITS_TO_SCHEDULE.length;

  let enriched = baseScore;
  enriched -= Math.min(docSum.expire * 4, 14);
  enriched -= Math.min(criticalRisks.length * 3, 10);
  enriched -= Math.min(Math.max(0, auditsSoon - 2) * 2, 6);
  enriched = Math.max(0, Math.min(100, Math.round(enriched)));

  /** @type {{ message: string; level: 'warn'|'err' }[]} */
  const anomalies = [];
  if (totInc >= 14) {
    anomalies.push({
      level: 'err',
      message: `Volume d’incidents élevé (${totInc}). Vérifiez la tendance et les causes récurrentes.`
    });
  }
  const closed = countActionsClosed(actions);
  const openish = actions.length - closed;
  if (actions.length >= 6 && closed === 0) {
    anomalies.push({
      level: 'warn',
      message: 'Aucune action en état « clôturé » malgré un plan chargé. Risque de dérive de suivi.'
    });
  }
  if (risksSourceMeta === 'api' && risksSansAction >= 2) {
    anomalies.push({
      level: 'warn',
      message: `${risksSansAction} risque(s) sans action liée. Rattachez des actions dans le registre.`
    });
  }
  if (openish > 12 && overdue > 4) {
    anomalies.push({
      level: 'warn',
      message: 'Charge actions importante avec retards cumulés. Priorisez l’arbitrage et les relances.'
    });
  }

  /** @type {object[]} */
  const recRaw = [];

  const criticalRiskRawRow =
    apiRiskRows && apiRiskRows.length
      ? apiRiskRows.find((rw) =>
          riskTierBucket(mapApiRiskToUi(rw && typeof rw === 'object' ? rw : {})) === 'critique'
        )
      : null;

  if (overdue > 0) {
    const od = overdueForDialog && typeof overdueForDialog === 'object' ? overdueForDialog : null;
    const oid = od?.id ?? od?._id;
    const ot = od?.title != null ? String(od.title).trim().slice(0, 240) : '';
    /** @type {Record<string, unknown>} */
    const overdueNav = {
      actionsColumnFilter: 'overdue',
      scrollToId: 'qhse-actions-col-overdue',
      source: 'dashboard_assistant'
    };
    if (oid != null && String(oid).trim()) {
      overdueNav.focusActionId = String(oid).trim();
      if (ot) overdueNav.focusActionTitle = ot;
    } else if (ot) {
      overdueNav.focusActionTitle = ot;
    }
    /** @type {'api_stats' | 'api_list'} */
    const odSrc =
      Array.isArray(overduePreview) && overduePreview.length > 0 ? 'api_stats' : 'api_list';
    recRaw.push({
      id: 'rec-actions-retard',
      dataSource: odSrc,
      internalScore: 60 + Math.min(overdue * 5, 30),
      title: overdue > 1 ? `${overdue} actions en retard` : 'Une action en retard',
      detail: 'Traiter ou réaffecter depuis le plan d’actions. Crédibilité du SMS.',
      navigateHash: 'actions',
      navigateIntent: overdueNav,
      dialogDefaults: overdueForDialog ? buildActionDefaultsFromOverdueItem(overdueForDialog) : null
    });
  }

  if (docSum.expire > 0) {
    const first = expiredDocs[0];
    const docType = String(first?.type || '').toLowerCase();
    const fdsLike = docType.includes('fds') || docType.includes('sds');
    recRaw.push({
      id: 'rec-docs-expire',
      dataSource: 'api_list',
      internalScore: 78 + Math.min(docSum.expire * 2, 20),
      title:
        docSum.expire > 1 ? `${docSum.expire} documents expirés` : 'Document expiré. Mise à jour requise',
      detail: 'Conformité documentaire : renouvellement ou révision à planifier.',
      navigateHash: fdsLike ? 'products' : 'iso',
      navigateIntent: fdsLike
        ? { productsFdsValidity: 'expired', source: 'dashboard_assistant' }
        : { scrollToId: 'iso-cockpit-priorities-anchor', source: 'dashboard_assistant' },
      dialogDefaults: first ? buildActionDefaultsFromExpiredDocument(first) : null
    });
  }

  if (criticalRisks.length > 0) {
    const r0 = criticalRisks[0];
    /** @type {Record<string, unknown>} */
    const riskNav = {
      riskBannerKpi: 'critique',
      source: 'dashboard_assistant'
    };
    if (criticalRiskRawRow?.id != null && String(criticalRiskRawRow.id).trim()) {
      riskNav.focusRiskId = String(criticalRiskRawRow.id).trim();
      riskNav.focusRiskTitle = String(criticalRiskRawRow.title || r0.title || '').slice(0, 400);
    }
    recRaw.push({
      id: 'rec-risque-critique',
      dataSource: risksSourceMeta === 'demo' ? 'demo' : 'api_list',
      internalScore: 70,
      title:
        criticalRisks.length > 1
          ? `${criticalRisks.length} risques critiques (registre affiché)`
          : `Risque critique : ${r0.title}`,
      detail: 'Renforcer mesures ou lancer action préventive ciblée.',
      navigateHash: 'risks',
      navigateIntent: riskNav,
      dialogDefaults: buildActionDefaultsFromCriticalRisk({
        title: r0.title,
        category: r0.type,
        meta: r0.meta,
        status: r0.status
      })
    });
  }

  if (
    criticalRisks.length === 0 &&
    hasKpiRiskCritical &&
    apiRiskRows &&
    apiRiskRows.length === 0
  ) {
    recRaw.push({
      id: 'rec-risque-critique-kpi',
      dataSource: 'api_stats',
      internalScore: 68,
      title:
        risksCriticalKpi > 1
          ? `${risksCriticalKpi} risques critiques (synthèse serveur)`
          : 'Risque critique (synthèse serveur)',
      detail:
        'Le registre chargé ne contient pas de fiche sur ce périmètre. Ouvrez le module risques pour le détail des fiches critiques.',
      navigateHash: 'risks',
      navigateIntent: { riskBannerKpi: 'critique', source: 'dashboard_assistant' },
      dialogDefaults: null
    });
  }

  if (critInc > 0) {
    const inc0 = incidents.find((i) => String(i.severity || '').toLowerCase().includes('crit')) || incidents[0];
    /** @type {Record<string, unknown>} */
    const incNav = {
      incidentSeverityFilter: 'critique',
      dashboardIncidentPeriodPreset: '30',
      source: 'dashboard_assistant'
    };
    if (inc0 && typeof inc0 === 'object') {
      const iref = inc0.ref != null ? String(inc0.ref).trim() : '';
      const iid = inc0.id != null ? String(inc0.id).trim() : '';
      const ihint = String(inc0.title || inc0.type || '').trim().slice(0, 240);
      if (iref) incNav.focusIncidentRef = iref;
      if (iid) incNav.focusIncidentId = iid;
      if (ihint) incNav.focusIncidentHintTitle = ihint;
    }
    recRaw.push({
      id: 'rec-incident-critique',
      dataSource: 'api_stats',
      internalScore: 85,
      title: critInc > 1 ? `${critInc} incidents à gravité élevée` : 'Incident à gravité élevée',
      detail: 'Sécuriser la réponse terrain et la traçabilité des décisions.',
      navigateHash: 'incidents',
      navigateIntent: incNav,
      dialogDefaults: inc0 ? buildActionDefaultsFromIncident(inc0) : null
    });
  }

  if (auditsSoon > 0 && recRaw.length < 3) {
    const a0 = AUDITS_TO_SCHEDULE[0];
    /** @type {Record<string, unknown>} */
    const audNav = {
      scrollToId: 'audit-cockpit-planning-block',
      source: 'dashboard_assistant'
    };
    if (a0?.title) audNav.focusAuditTitle = String(a0.title).slice(0, 200);
    recRaw.push({
      id: 'rec-audits-proches',
      dataSource: isDemoMode() ? 'demo' : 'heuristic',
      internalScore: 42 + Math.min(auditsSoon * 4, 20),
      title:
        auditsSoon > 1 ? `${auditsSoon} audits à anticiper` : 'Audit à anticiper',
      detail: 'Consolidez preuves et plans d’actions avant la fenêtre audit.',
      navigateHash: 'audits',
      navigateIntent: audNav,
      dialogDefaults: a0 ? buildActionDefaultsFromAuditPrep(a0) : null
    });
  }

  if (renewDocs.length > 0 && recRaw.length < 3) {
    const r0 = renewDocs[0];
    const drType = String(r0?.type || '').toLowerCase();
    const fdsRenew = drType.includes('fds') || drType.includes('sds');
    recRaw.push({
      id: 'rec-docs-renouveler',
      dataSource: 'api_list',
      internalScore: 45,
      title: `${renewDocs.length} document(s) à renouveler bientôt`,
      detail: 'Anticipez la revue documentaire avant échéance.',
      navigateHash: fdsRenew ? 'products' : 'iso',
      navigateIntent: fdsRenew
        ? { productsFdsValidity: 'review', source: 'dashboard_assistant' }
        : { scrollToId: 'iso-cockpit-priorities-anchor', source: 'dashboard_assistant' },
      dialogDefaults: r0 ? buildActionDefaultsFromRenewingDocument(r0) : null
    });
  }

  if (ncOpen >= 3 && recRaw.length < 4) {
    recRaw.push({
      id: 'rec-nc-stock',
      dataSource: 'api_list',
      internalScore: 52 + Math.min(ncOpen * 2, 18),
      title:
        ncOpen > 5 ? `${ncOpen} NC ouvertes. Arbitrage recommandé` : `${ncOpen} NC ouvertes`,
      detail: 'Prioriser par criticité et jalons de clôture ; éviter l’empilement sans plan.',
      navigateHash: 'audits',
      navigateIntent: { scrollToId: 'audit-cockpit-tier-critical', source: 'dashboard_assistant' },
      dialogDefaults: null
    });
  }

  recRaw.sort((a, b) => b.internalScore - a.internalScore);
  const recommendations = recRaw.slice(0, 3).map((r) => {
    const pr = priorityLabelFromScore(r.internalScore);
    const src = insightSourceFromDataSource(r.dataSource);
    const dq = dataQualityFromDataSource(r.dataSource);
    const conf = confidenceFromInternalScore(Number(r.internalScore) || 0, r.dataSource);
    const reason = String(r.detail || '').trim() || String(r.title || '').trim();
    const severity = severityFromInternalScore(Number(r.internalScore) || 0);
    const label = String(r.title || '').trim() || 'Priorité';
    const recommendedAction = recommendedActionFromNavigateHash(String(r.navigateHash || ''));
    return {
      ...r,
      // Compat: champs existants conservés
      priorityKey: pr.key,
      priorityLabel: pr.label,
      // Nouveaux champs (audit confiance)
      source: src,
      confidence: conf,
      dataQuality: dq,
      reason,
      // Normalisation "priorité principale" (compatible)
      label,
      severity,
      recommendedAction
    };
  });

  // Couche unifiée (déterministe) : priorités principales explicables, max 3.
  const topPriorities = recommendations
    .filter((r) => r && typeof r === 'object' && r.source === 'deterministic')
    .slice(0, 3)
    .map((r) => ({
      label: String(r?.label || r?.title || 'Priorité').trim() || 'Priorité',
      reason: String(r?.reason || r?.detail || r?.title || '').trim() || 'À traiter en priorité.',
      severity: r?.severity || severityFromInternalScore(Number(r?.internalScore) || 0),
      source: r?.source || 'deterministic',
      confidence: r?.confidence || confidenceFromInternalScore(Number(r?.internalScore) || 0, r?.dataSource)
    }));

  const site =
    input.siteLabel && String(input.siteLabel).trim()
      ? String(input.siteLabel).trim()
      : 'le périmètre';
  const synthesisParts = [];
  synthesisParts.push(
    `Score pilotage assisté : ${enriched} % (intègre retards, incidents critiques, documents et risques de la vue).`
  );
  if (overdue || docSum.expire || critInc || criticalRisks.length) {
    synthesisParts.push(
      `Points sous tension sur ${site} : ${[
        overdue && `${overdue} retard(s)`,
        docSum.expire && `${docSum.expire} doc. expiré(s)`,
        critInc && `${critInc} incident(s) critique(s)`,
        criticalRisks.length && `${criticalRisks.length} risque(s) critique(s) (registre)`
      ]
        .filter(Boolean)
        .join(', ') || 'à surveiller'}.`
    );
  } else {
    synthesisParts.push(`Situation relativement maîtrisée sur ${site}. Maintenir le suivi des plans.`);
  }
  if (risksSourceMeta === 'api' && apiRiskRows && apiRiskRows.length > 0 && risksSansAction >= 2) {
    synthesisParts.push(
      `${risksSansAction} fiche(s) risque sans action liée. Renforcer le lien registre risques / plan d’actions.`
    );
  }
  if (auditsSoon) {
    synthesisParts.push(`${auditsSoon} échéance(s) audit à garder en tête sur le planning affiché.`);
  }

  const globalDataQuality = computeGlobalDataQuality(
    { overdue, risksSource: risksSourceMeta },
    /** @type {any} */ (stats)
  );

  return {
    enrichedScore: enriched,
    baseScore,
    docSummary: docSum,
    synthesis: synthesisParts.join(' '),
    recommendations,
    topPriorities,
    anomalies,
    // Compat: dataQuality conservé, mais valeurs alignées (complete/partial/unavailable).
    dataQuality: globalDataQuality,
    // Nouveau: dataQualityGlobal demandé (sans habilitations).
    dataQualityGlobal: {
      incidents: globalDataQuality.incidents,
      actions: globalDataQuality.actions,
      audits: globalDataQuality.audits,
      risks: globalDataQuality.risks
    },
    meta: {
      overdue,
      expiredDocs: docSum.expire,
      criticalIncidents: critInc,
      auditsSoon,
      criticalRisksCount: criticalRisks.length,
      risksSource: risksSourceMeta,
      risksCriticalKpi: Number.isFinite(risksCriticalKpi) ? risksCriticalKpi : null,
      timeseriesPresent: Boolean(input.stats?.timeseries && typeof input.stats.timeseries === 'object')
    }
  };
}

/**
 * Contexte compact pour l’IA pilotage (Mistral / fallback heuristique via backend).
 * @param {{
 *   stats?: object;
 *   incidents?: object[];
 *   actions?: object[];
 *   siteLabel?: string;
 *   risks?: object[] | null;
 *   allowGenericPilotageMocks?: boolean;
 *   isDemoContext?: boolean;
 * }} input
 */
export function buildDashboardPilotageAiContext(input) {
  const stats = input.stats || {};
  const incidents = Array.isArray(input.incidents) ? input.incidents : [];
  const actions = Array.isArray(input.actions) ? input.actions : [];
  const risksList = Array.isArray(input.risks) ? input.risks : null;

  const nested = stats.stats && typeof stats.stats === 'object' ? stats.stats : null;
  const incidentsTotal = Math.max(0, asDashboardCount(stats.incidents));
  const actionsOverdue = Math.max(0, asDashboardCount(stats.overdueActions));
  const nonConformities = Math.max(0, asDashboardCount(stats.nonConformities));
  const risksCriticalResolved = computeRisksCriticalForPayload(
    stats,
    risksList !== null ? risksList : undefined
  );
  const auditsSummary =
    nested?.audits && typeof nested.audits === 'object'
      ? {
          total: asDashboardCount(/** @type {{ total?: unknown }} */ (nested.audits).total),
          planned: asDashboardCount(/** @type {{ planned?: unknown }} */ (nested.audits).planned),
          done: asDashboardCount(/** @type {{ done?: unknown }} */ (nested.audits).done)
        }
      : null;

  const timeseries = compactTimeseriesForAiPayload(
    stats.timeseries && typeof stats.timeseries === 'object' && !Array.isArray(stats.timeseries)
      ? /** @type {Record<string, unknown>} */ (stats.timeseries)
      : null,
    6
  );

  let criticalPreview = [];
  const critArr = stats.criticalIncidents;
  if (Array.isArray(critArr) && critArr.length && typeof critArr[0] === 'object') {
    criticalPreview = critArr.slice(0, 5).map((i) => ({
      ref: i.ref ?? i.id ?? 'Non disponible',
      type: i.type,
      severity: i.severity,
      status: i.status
    }));
  } else {
    criticalPreview = incidents
      .filter((i) => String(i.severity || '').toLowerCase().includes('crit'))
      .slice(0, 5)
      .map((i) => ({
        ref: i.ref ?? i.id ?? 'Non disponible',
        type: i.type,
        severity: i.severity,
        status: i.status
      }));
  }

  /** @type {object[]} */
  let overduePreview = (Array.isArray(stats.overdueActionItems) ? stats.overdueActionItems : [])
    .slice(0, 5)
    .map((a) => ({
      title: a.title,
      status: a.status,
      dueDate: a.dueDate
    }));

  if (overduePreview.length === 0) {
    const now = Date.now();
    for (const a of actions) {
      if (overduePreview.length >= 5) break;
      const st = String(a?.status || '').toLowerCase();
      if (/clos|ferm|termin|done|compl|achev|résolu|clôtur/i.test(st)) continue;
      if (/retard/i.test(st)) {
        overduePreview.push({ title: a.title, status: a.status, dueDate: a.dueDate });
        continue;
      }
      const raw = a?.dueDate;
      if (raw == null || String(raw).trim() === '') continue;
      const t = new Date(raw).getTime();
      if (Number.isFinite(t) && t < now) {
        overduePreview.push({ title: a.title, status: a.status, dueDate: a.dueDate });
      }
    }
  }

  const siteRaw = input.siteLabel && String(input.siteLabel).trim() ? String(input.siteLabel).trim() : '';
  const site = siteRaw.length > 120 ? `${siteRaw.slice(0, 117)}…` : siteRaw;

  const signalSources = {
    incidentsTotal: 'api_stats',
    actionsOverdue: 'api_stats',
    nonConformities: 'api_stats',
    risksCritical:
      nested?.risks?.critical != null && Number.isFinite(Number(nested.risks.critical))
        ? 'api_stats'
        : Array.isArray(risksList) && risksList.length > 0
          ? 'api_list'
          : 'unavailable',
    auditsSummary: auditsSummary ? 'api_stats' : 'unavailable',
    timeseries: timeseries ? 'api_timeseries' : 'unavailable',
    criticalIncidentsPreview:
      Array.isArray(critArr) && critArr.length ? 'api_stats' : criticalPreview.length ? 'api_list' : 'unavailable',
    overdueActionsPreview:
      Array.isArray(stats.overdueActionItems) && stats.overdueActionItems.length
        ? 'api_stats'
        : overduePreview.length
          ? 'api_list'
          : 'unavailable'
  };

  /**
   * @param {Record<string, unknown>} ss
   * @returns {{
   *  incidents: InsightDataQuality;
   *  actions: InsightDataQuality;
   *  risks: InsightDataQuality;
   *  habilitations: InsightDataQuality;
   *  audits: InsightDataQuality;
   * }}
   */
  function dataQualityFromSignalSources(ss) {
    const inc =
      ss?.incidentsTotal === 'api_stats' ? 'complete' : ss?.incidentsTotal === 'api_list' ? 'partial' : 'unavailable';
    const act =
      ss?.actionsOverdue === 'api_stats' ? 'complete' : ss?.actionsOverdue === 'api_list' ? 'partial' : 'unavailable';
    const rk =
      ss?.risksCritical === 'api_stats'
        ? 'complete'
        : ss?.risksCritical === 'api_list'
          ? 'partial'
          : 'unavailable';
    const aud = ss?.auditsSummary === 'api_stats' ? 'partial' : 'unavailable';
    const hab = 'unavailable';
    return { incidents: inc, actions: act, risks: rk, habilitations: hab, audits: aud };
  }

  /** @type {Record<string, unknown>} */
  const ctxOut = {
    siteLabel: site,
    incidentsTotal,
    actionsOverdue,
    nonConformities,
    auditsSummary,
    timeseries,
    signalSources,
    dataQualityGlobal: dataQualityFromSignalSources(signalSources),
    // Préparation injection future des packs (non activée)
    sectorPackUsed: false,
    compliancePackUsed: false,
    complianceContext: null,
    allowGenericPilotageMocks: input.allowGenericPilotageMocks === true,
    isDemoContext: input.isDemoContext === true,
    criticalIncidentsPreview: criticalPreview,
    overdueActionsPreview: overduePreview
  };
  if (typeof risksCriticalResolved === 'number') {
    ctxOut.risksCritical = risksCriticalResolved;
  }
  return ctxOut;
}

/**
 * @param {Record<string, unknown>} dashboardContext
 * @returns {Promise<{ mode?: string; narrative?: string; actions?: object[]; provider?: string; error?: string|null }>}
 */
export async function fetchPilotageAiSuggestActions(dashboardContext) {
  const res = await qhseFetch('/api/ai-suggestions/suggest/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dashboardContext })
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const msg = typeof j.error === 'string' && j.error.trim() ? j.error.trim() : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}
