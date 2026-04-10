/**
 * Assistant pilotage QHSE — règles simples, extensibles (pas d’IA serveur).
 */

import { computeQhseGlobalScore } from '../utils/dashboardDecisionLayer.js';
import { risks as seedRisks } from '../data/mock.js';
import { AUDITS_TO_SCHEDULE } from '../data/conformityStore.js';
import {
  riskCriticalityFromMeta,
  riskTierFromGp,
  riskLevelLabelFromTier
} from '../components/riskMatrixPanel.js';
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
  const risksForAssistant =
    apiRiskRows && apiRiskRows.length > 0
      ? apiRiskRows.map(mapApiRiskRowForAssistant)
      : seedRisks;
  const criticalRisks = risksForAssistant.filter(riskIsCritique);
  const risksSansAction = risksForAssistant.filter((r) => !r.actionLinked).length;

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
      message: `Volume d’incidents élevé (${totInc}) — vérifiez la tendance et les causes récurrentes.`
    });
  }
  const closed = countActionsClosed(actions);
  const openish = actions.length - closed;
  if (actions.length >= 6 && closed === 0) {
    anomalies.push({
      level: 'warn',
      message: 'Aucune action en état « clôturé » malgré un plan chargé — risque de dérive de suivi.'
    });
  }
  if (risksSansAction >= 2) {
    anomalies.push({
      level: 'warn',
      message: `${risksSansAction} risque(s) sans action liée — rattachez des actions dans le registre.`
    });
  }
  if (openish > 12 && overdue > 4) {
    anomalies.push({
      level: 'warn',
      message: 'Charge actions importante avec retards cumulés — prioriser l’arbitrage et les relances.'
    });
  }

  /** @type {object[]} */
  const recRaw = [];

  if (overdue > 0) {
    recRaw.push({
      id: 'rec-actions-retard',
      internalScore: 60 + Math.min(overdue * 5, 30),
      title: overdue > 1 ? `${overdue} actions en retard` : 'Une action en retard',
      detail: 'Traiter ou réaffecter depuis le plan d’actions — crédibilité du SMS.',
      navigateHash: 'actions',
      dialogDefaults: overdueForDialog ? buildActionDefaultsFromOverdueItem(overdueForDialog) : null
    });
  }

  if (docSum.expire > 0) {
    const first = expiredDocs[0];
    recRaw.push({
      id: 'rec-docs-expire',
      internalScore: 78 + Math.min(docSum.expire * 2, 20),
      title:
        docSum.expire > 1 ? `${docSum.expire} documents expirés` : 'Document expiré — mise à jour requise',
      detail: 'Conformité documentaire : renouvellement ou révision à planifier.',
      navigateHash: 'iso',
      dialogDefaults: first ? buildActionDefaultsFromExpiredDocument(first) : null
    });
  }

  if (criticalRisks.length > 0) {
    const r0 = criticalRisks[0];
    recRaw.push({
      id: 'rec-risque-critique',
      internalScore: 70,
      title:
        criticalRisks.length > 1
          ? `${criticalRisks.length} risques critiques (registre affiché)`
          : `Risque critique : ${r0.title}`,
      detail: 'Renforcer mesures ou lancer action préventive ciblée.',
      navigateHash: 'risks',
      dialogDefaults: buildActionDefaultsFromCriticalRisk({
        title: r0.title,
        category: r0.type,
        meta: r0.meta,
        status: r0.status
      })
    });
  }

  if (critInc > 0) {
    const inc0 = incidents.find((i) => String(i.severity || '').toLowerCase().includes('crit')) || incidents[0];
    recRaw.push({
      id: 'rec-incident-critique',
      internalScore: 85,
      title: critInc > 1 ? `${critInc} incidents à gravité élevée` : 'Incident à gravité élevée',
      detail: 'Sécuriser la réponse terrain et la traçabilité des décisions.',
      navigateHash: 'incidents',
      dialogDefaults: inc0 ? buildActionDefaultsFromIncident(inc0) : null
    });
  }

  if (auditsSoon > 0 && recRaw.length < 3) {
    const a0 = AUDITS_TO_SCHEDULE[0];
    recRaw.push({
      id: 'rec-audits-proches',
      internalScore: 42 + Math.min(auditsSoon * 4, 20),
      title:
        auditsSoon > 1 ? `${auditsSoon} audits à anticiper` : 'Audit à anticiper',
      detail: 'Consolidez preuves et plans d’actions avant la fenêtre audit.',
      navigateHash: 'audits',
      dialogDefaults: a0 ? buildActionDefaultsFromAuditPrep(a0) : null
    });
  }

  if (renewDocs.length > 0 && recRaw.length < 3) {
    const r0 = renewDocs[0];
    recRaw.push({
      id: 'rec-docs-renouveler',
      internalScore: 45,
      title: `${renewDocs.length} document(s) à renouveler bientôt`,
      detail: 'Anticipez la revue documentaire avant échéance.',
      navigateHash: 'iso',
      dialogDefaults: r0 ? buildActionDefaultsFromRenewingDocument(r0) : null
    });
  }

  if (ncOpen >= 3 && recRaw.length < 4) {
    recRaw.push({
      id: 'rec-nc-stock',
      internalScore: 52 + Math.min(ncOpen * 2, 18),
      title:
        ncOpen > 5 ? `${ncOpen} NC ouvertes — arbitrage recommandé` : `${ncOpen} NC ouvertes`,
      detail: 'Prioriser par criticité et jalons de clôture ; éviter l’empilement sans plan.',
      navigateHash: 'audits',
      dialogDefaults: null
    });
  }

  recRaw.sort((a, b) => b.internalScore - a.internalScore);
  const recommendations = recRaw.slice(0, 3).map((r) => {
    const pr = priorityLabelFromScore(r.internalScore);
    return { ...r, priorityKey: pr.key, priorityLabel: pr.label };
  });

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
    synthesisParts.push(`Situation relativement maîtrisée sur ${site} — maintenir le suivi des plans.`);
  }
  if (apiRiskRows && apiRiskRows.length > 0 && risksSansAction >= 2) {
    synthesisParts.push(
      `${risksSansAction} fiche(s) risque sans action liée — renforcer le lien registre risques / plan d’actions.`
    );
  }
  if (auditsSoon) {
    synthesisParts.push(`${auditsSoon} échéance(s) audit à garder en tête sur le planning affiché.`);
  }

  return {
    enrichedScore: enriched,
    baseScore,
    docSummary: docSum,
    synthesis: synthesisParts.join(' '),
    recommendations,
    anomalies,
    meta: {
      overdue,
      expiredDocs: docSum.expire,
      criticalIncidents: critInc,
      auditsSoon,
      criticalRisksCount: criticalRisks.length,
      risksSource: apiRiskRows && apiRiskRows.length > 0 ? 'api' : 'demo'
    }
  };
}
