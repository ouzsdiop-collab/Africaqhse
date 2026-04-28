/**
 * Métriques et payloads du tableau de bord — logique pure extraite de dashboard.js.
 */

import { asDashboardCount, isNcOpen } from './reconcileDashboardStats.js';
import { mapApiRiskToUi, riskTierBucket } from './risksRegisterModel.js';

export function toneByValue(value, warn = 1, crit = 3) {
  const n = Number(value) || 0;
  if (n >= crit) return 'red';
  if (n >= warn) return 'orange';
  return 'green';
}

export function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Évite des mois « vides » en bout de série (labels sans barres). */
export function trimTrailingZeroAuditScores(series) {
  const out = [...series];
  while (out.length > 1) {
    const last = out[out.length - 1];
    const v = last != null ? Number(last.value) : 0;
    if (!Number.isFinite(v) || v <= 0) out.pop();
    else break;
  }
  return out;
}

/**
 * Sous-titre des tuiles « pilotage opérationnel » et alertes décisionnelles.
 * Ne pas simuler un delta N vs N-1 sans série temporelle réelle — en démo client cela décrédibilise l’outil.
 */
export function computeDeltaLabel(_value) {
  return 'Comparaison multi-périodes : non disponible';
}

export function guessImpactedSite(rows = []) {
  const hit = rows.find((r) => r?.site || r?.siteId || r?.owner);
  return String(hit?.site || hit?.siteId || hit?.owner || 'N/A');
}

/**
 * @param {{
 *   stats: Record<string, unknown>;
 *   incidents: unknown[];
 *   actions: unknown[];
 *   audits: unknown[];
 *   ncs: unknown[];
 *   permits: unknown[];
 *   docs: unknown[];
 *   risks?: unknown[];
 * }} args
 */
export function buildOperationalTiles({
  stats,
  incidents,
  actions: _actions,
  audits,
  ncs,
  permits,
  docs,
  risks = []
}) {
  const riskList = Array.isArray(risks) ? risks : [];
  let criticalRiskN = 0;
  if (riskList.length) {
    criticalRiskN = riskList.reduce((acc, raw) => {
      const ui = mapApiRiskToUi(raw && typeof raw === 'object' ? raw : {});
      return acc + (riskTierBucket(ui) === 'critique' ? 1 : 0);
    }, 0);
  } else {
    criticalRiskN = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
  }
  const overdueActions = safeNum(stats?.overdueActions);
  const permitsActive = Array.isArray(permits)
    ? permits.filter((p) => String(p?.status || '').toLowerCase() !== 'closed').length
    : 0;
  const docsReview = Array.isArray(docs)
    ? docs.filter((d) => {
        const due = d?.expiresAt ? new Date(d.expiresAt) : null;
        if (!due || Number.isNaN(due.getTime())) return false;
        return due.getTime() < Date.now() + 1000 * 60 * 60 * 24 * 30;
      }).length
    : 0;
  const auditScores = (Array.isArray(audits) ? audits : [])
    .map((a) => safeNum(a?.score, NaN))
    .filter((x) => Number.isFinite(x));
  const complianceMultiSites = auditScores.length
    ? Math.round(auditScores.reduce((a, b) => a + b, 0) / auditScores.length)
    : 0;
  /**
   * IMPORTANT: pas de chiffres “inventés” sur tenant neuf.
   * Ces métriques “sous-traitants / habilitations” ne sont fiables que si un backend dédié les calcule.
   */
  const subcontractors = 0;
  const habilitationsSoon = 0;
  return [
    {
      k: 'Incidents',
      v: safeNum(stats?.incidents),
      d: 'Déclarés sur le périmètre',
      tone: toneByValue(stats?.incidents, 4, 9),
      page: 'incidents'
    },
    {
      k: 'Risques critiques',
      v: criticalRiskN,
      d: 'Palier critique (matrice G×P)',
      tone: toneByValue(criticalRiskN, 1, 3),
      page: 'risks'
    },
    {
      k: 'Actions en retard',
      v: overdueActions,
      d: 'À traiter < 48h',
      tone: toneByValue(overdueActions, 1, 4),
      page: 'actions'
    },
    {
      k: 'Audits',
      v: Array.isArray(audits) ? audits.length : 0,
      d: 'Audits récents et planifiés',
      tone: toneByValue(Array.isArray(ncs) ? ncs.filter(isNcOpen).length : 0, 1, 4),
      page: 'audits'
    },
    {
      k: 'Permis actifs',
      v: permitsActive,
      d: 'Permis de travail terrain en cours',
      tone: toneByValue(permitsActive, 3, 8),
      page: 'permits'
    },
    {
      k: 'FDS à réviser',
      v: docsReview,
      d: 'Échéance < 30 jours',
      tone: toneByValue(docsReview, 1, 3),
      page: 'products'
    },
    {
      k: 'Conformité multi-sites',
      v: `${complianceMultiSites}%`,
      d: 'Moyenne audits du groupe',
      tone: complianceMultiSites >= 80 ? 'green' : complianceMultiSites >= 65 ? 'orange' : 'red',
      page: 'iso'
    },
    {
      k: 'Sous-traitants',
      v: subcontractors,
      d: 'Actifs sur opérations',
      tone: toneByValue(subcontractors, 10, 18),
      page: 'sites'
    },
    {
      k: 'Habilitations futures',
      v: habilitationsSoon,
      d: 'Échéances à anticiper',
      tone: toneByValue(habilitationsSoon, 4, 10),
      page: 'settings'
    }
  ];
}

/** Réduit `stats.timeseries` pour prompts IA (taille maîtrisée). */
export function compactTimeseriesForAiPayload(timeseries, maxMonths = 6) {
  if (!timeseries || typeof timeseries !== 'object' || Array.isArray(timeseries)) return null;
  const cap = Math.min(12, Math.max(1, Math.floor(Number(maxMonths)) || 6));
  const mc = Math.min(cap, Math.max(1, Number(timeseries.monthCount) || cap));
  const labels = Array.isArray(timeseries.labels) ? timeseries.labels.slice(-mc) : [];
  const incidentsByMonth = Array.isArray(timeseries.incidentsByMonth)
    ? timeseries.incidentsByMonth.slice(-mc).map((x) => ({
        label: String(/** @type {{ label?: unknown }} */ (x).label ?? ''),
        value: Math.max(0, Number(/** @type {{ value?: unknown }} */ (x).value) || 0)
      }))
    : [];
  const auditsScoreByMonth = Array.isArray(timeseries.auditsScoreByMonth)
    ? timeseries.auditsScoreByMonth.slice(-mc).map((x) => ({
        label: String(/** @type {{ label?: unknown }} */ (x).label ?? ''),
        avgScore: Math.max(0, Math.min(100, Number(/** @type {{ value?: unknown }} */ (x).value) || 0)),
        auditCount: Math.max(0, Number(/** @type {{ count?: unknown }} */ (x).count) || 0)
      }))
    : [];
  const nc = timeseries.nonConformitiesByMonth;
  let ncAgg = null;
  if (nc && typeof nc === 'object' && Array.isArray(nc.major) && Array.isArray(nc.minor)) {
    ncAgg = {
      majorLastN: nc.major.slice(-mc).map((n) => Math.max(0, Number(n) || 0)),
      minorLastN: nc.minor.slice(-mc).map((n) => Math.max(0, Number(n) || 0))
    };
  }
  return {
    source: 'api_timeseries',
    monthCount: mc,
    labels,
    incidentsByMonth,
    auditsScoreByMonth,
    nonConformitiesMajorMinor: ncAgg
  };
}

/**
 * Moyenne audit pondérée par les buckets ayant au moins un audit (série backend).
 * @param {unknown} timeseries
 */
export function averageAuditScoreFromTimeseries(timeseries) {
  const rows = timeseries?.auditsScoreByMonth;
  if (!Array.isArray(rows) || !rows.length) return null;
  let sum = 0;
  let w = 0;
  rows.forEach((b) => {
    const c = Number(/** @type {{ count?: unknown }} */ (b).count) || 0;
    const v = Number(/** @type {{ value?: unknown }} */ (b).value);
    if (c <= 0 || !Number.isFinite(v)) return;
    sum += v * c;
    w += c;
  });
  if (w <= 0) return null;
  return Math.round((sum / w) * 10) / 10;
}

/**
 * Risques critiques : synthèse serveur d’abord, sinon dérivé liste si nécessaire.
 * @param {Record<string, unknown> | null | undefined} stats
 * @param {unknown[]} [risks]
 */
export function computeRisksCriticalForPayload(stats, risks) {
  const nested = stats?.stats?.risks?.critical;
  if (nested != null && Number.isFinite(Number(nested))) return Number(nested);
  if (risks === undefined) return null;
  if (!Array.isArray(risks) || risks.length === 0) return 0;
  return risks.reduce((acc, raw) => {
    const ui = mapApiRiskToUi(raw && typeof raw === 'object' ? raw : {});
    return acc + (riskTierBucket(ui) === 'critique' ? 1 : 0);
  }, 0);
}

/**
 * Indique l’absence de signaux forts (KPI scalaires + extraits) — pour limiter les mocks IA.
 * @param {Record<string, unknown> | null | undefined} stats
 */
/**
 * Au moins une valeur non nulle dans les séries backend (évite mocks lorsque seuls les KPI scalaires sont à 0).
 * @param {unknown} ts
 */
export function timeseriesHasOperationalSignal(ts) {
  if (!ts || typeof ts !== 'object' || Array.isArray(ts)) return false;
  const inc = /** @type {{ incidentsByMonth?: unknown }} */ (ts).incidentsByMonth;
  if (Array.isArray(inc) && inc.some((x) => Number(/** @type {{ value?: unknown }} */ (x).value) > 0))
    return true;
  const aud = /** @type {{ auditsScoreByMonth?: unknown }} */ (ts).auditsScoreByMonth;
  if (
    Array.isArray(aud) &&
    aud.some(
      (x) =>
        Number(/** @type {{ count?: unknown }} */ (x).count) > 0 ||
        Number(/** @type {{ value?: unknown }} */ (x).value) > 0
    )
  )
    return true;
  const nc = /** @type {{ nonConformitiesByMonth?: unknown }} */ (ts).nonConformitiesByMonth;
  if (nc && typeof nc === 'object' && !Array.isArray(nc)) {
    const maj = /** @type {{ major?: unknown }} */ (nc).major;
    const min = /** @type {{ minor?: unknown }} */ (nc).minor;
    if (Array.isArray(maj) && maj.some((n) => Number(n) > 0)) return true;
    if (Array.isArray(min) && min.some((n) => Number(n) > 0)) return true;
  }
  return false;
}

export function isDashboardSignalsTotallyEmpty(stats) {
  if (!stats || typeof stats !== 'object') return true;
  const nested = stats.stats && typeof stats.stats === 'object' ? stats.stats : null;
  const inc = asDashboardCount(stats.incidents);
  const od = asDashboardCount(stats.overdueActions);
  const nc = asDashboardCount(stats.nonConformities);
  const critInc = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
  const rcNested = nested?.risks?.critical;
  const risksCrit =
    rcNested != null && Number.isFinite(Number(rcNested)) ? Number(rcNested) : 0;
  const ts = stats.timeseries && typeof stats.timeseries === 'object' ? stats.timeseries : null;
  const tsSignal = ts && timeseriesHasOperationalSignal(ts);
  return (
    inc === 0 &&
    od === 0 &&
    nc === 0 &&
    critInc === 0 &&
    risksCrit === 0 &&
    !tsSignal
  );
}

/** @param {unknown} raw */
export function normalizeDashboardPayload(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const ts = r.timeseries;
  const out = {
    incidents: asDashboardCount(r.incidents),
    actions: asDashboardCount(r.actions),
    overdueActions: asDashboardCount(r.overdueActions),
    nonConformities: asDashboardCount(r.nonConformities),
    criticalIncidents: Array.isArray(r.criticalIncidents) ? r.criticalIncidents : [],
    overdueActionItems: Array.isArray(r.overdueActionItems) ? r.overdueActionItems : []
  };
  if (r.stats != null && typeof r.stats === 'object' && !Array.isArray(r.stats)) {
    /** @type {any} */ (out).stats = r.stats;
  }
  if (ts != null && typeof ts === 'object' && !Array.isArray(ts)) {
    /** @type {any} */ (out).timeseries = ts;
  }
  if (r.siteId != null && r.siteId !== '') {
    /** @type {any} */ (out).siteId = r.siteId;
  }
  return out;
}

/**
 * @param {Record<string, unknown>} lastStats
 * @param {unknown[]} audits
 * @param {unknown[]} risks
 */
export function buildMistralDashboardStatsPayload(lastStats, audits, risks) {
  const critSrc = lastStats?.criticalIncidents;
  const criticalIncidents = Array.isArray(critSrc) ? critSrc.length : Number(critSrc) || 0;
  const ts = lastStats?.timeseries;
  const tsAvg = averageAuditScoreFromTimeseries(
    ts && typeof ts === 'object' && !Array.isArray(ts) ? ts : null
  );
  let avgAuditScore = 'N/A';
  if (tsAvg != null) {
    avgAuditScore = String(tsAvg);
  } else if (Array.isArray(audits) && audits.length) {
    const scores = audits.map((a) => Number(/** @type {any} */ (a).score)).filter((n) => Number.isFinite(n));
    if (scores.length) {
      avgAuditScore = String(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
    }
  }
  let risksOpen = 0;
  if (Array.isArray(risks)) {
    risksOpen = risks.filter((r) => {
      const s = String(/** @type {any} */ (r)?.status || '').toLowerCase();
      return !/clos|ferm|trait|ma[iî]tris/i.test(s);
    }).length;
  }
  const nested = lastStats?.stats && typeof lastStats.stats === 'object' ? lastStats.stats : null;
  const risksCritical = computeRisksCriticalForPayload(
    lastStats && typeof lastStats === 'object' ? lastStats : {},
    Array.isArray(risks) ? risks : undefined
  );
  const nonConformities = asDashboardCount(lastStats?.nonConformities);
  const auditsSummary =
    nested?.audits && typeof nested.audits === 'object'
      ? {
          total: asDashboardCount(/** @type {any} */ (nested.audits).total),
          planned: asDashboardCount(/** @type {any} */ (nested.audits).planned),
          done: asDashboardCount(/** @type {any} */ (nested.audits).done)
        }
      : null;
  const timeseriesCompact =
    ts && typeof ts === 'object' && !Array.isArray(ts) ? compactTimeseriesForAiPayload(ts, 6) : null;

  /** @type {Record<string, unknown>} */
  const out = {
    incidents: asDashboardCount(lastStats?.incidents),
    criticalIncidents,
    risksOpen,
    risksCritical: risksCritical != null ? risksCritical : undefined,
    actionsOverdue: asDashboardCount(lastStats?.overdueActions),
    nonConformities,
    avgAuditScore,
    auditsSummary,
    avgAuditScoreSource: tsAvg != null ? 'api_timeseries' : avgAuditScore !== 'N/A' ? 'api_list' : 'none',
    timeseriesCompact,
    actionsTotal: nested?.actions?.total != null ? asDashboardCount(/** @type {any} */ (nested.actions).total) : undefined,
    incidentsTotalNested: nested?.incidents?.total != null ? asDashboardCount(/** @type {any} */ (nested.incidents).total) : undefined
  };
  return out;
}

export function formatDashboardCount(v) {
  return typeof v === 'number' && !Number.isNaN(v) ? String(v) : '—';
}
