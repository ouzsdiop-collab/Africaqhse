/**
 * Métriques et payloads du tableau de bord — logique pure extraite de dashboard.js.
 */

import { asDashboardCount, isNcOpen } from './reconcileDashboardStats.js';

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
 * }} args
 */
export function buildOperationalTiles({ stats, incidents, actions: _actions, audits, ncs, permits, docs }) {
  const criticalInc = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
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
    : 76;
  const subcontractors = Math.max(
    3,
    Math.min(22, Math.round((safeNum(stats?.actions) + safeNum(stats?.incidents)) / 3))
  );
  const habilitationsSoon = Math.max(
    1,
    Math.min(18, Math.round((Array.isArray(incidents) ? incidents.length : 0) / 2))
  );
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
      v: criticalInc,
      d: 'Priorité terrain immédiate',
      tone: toneByValue(criticalInc, 1, 3),
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

/** @param {unknown} raw */
export function normalizeDashboardPayload(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return {
    incidents: asDashboardCount(/** @type {any} */ (raw).incidents),
    actions: asDashboardCount(/** @type {any} */ (raw).actions),
    overdueActions: asDashboardCount(/** @type {any} */ (raw).overdueActions),
    nonConformities: asDashboardCount(/** @type {any} */ (raw).nonConformities),
    criticalIncidents: Array.isArray(/** @type {any} */ (raw).criticalIncidents)
      ? /** @type {any} */ (raw).criticalIncidents
      : [],
    overdueActionItems: Array.isArray(/** @type {any} */ (raw).overdueActionItems)
      ? /** @type {any} */ (raw).overdueActionItems
      : []
  };
}

/**
 * @param {Record<string, unknown>} lastStats
 * @param {unknown[]} audits
 * @param {unknown[]} risks
 */
export function buildMistralDashboardStatsPayload(lastStats, audits, risks) {
  const critSrc = lastStats?.criticalIncidents;
  const criticalIncidents = Array.isArray(critSrc) ? critSrc.length : Number(critSrc) || 0;
  let avgAuditScore = 'N/A';
  if (Array.isArray(audits) && audits.length) {
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
  return {
    incidents: asDashboardCount(lastStats?.incidents),
    criticalIncidents,
    risksOpen,
    actionsOverdue: asDashboardCount(lastStats?.overdueActions),
    avgAuditScore
  };
}

export function formatDashboardCount(v) {
  return typeof v === 'number' && !Number.isNaN(v) ? String(v) : '—';
}
