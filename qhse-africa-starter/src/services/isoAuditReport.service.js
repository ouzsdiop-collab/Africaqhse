/**
 * Rapport « audit IA » : synthèse globale certification à partir des données déjà chargées
 * (registre exigences, preuves locales, documents, actions/risques/incidents API).
 * Pas de LLM externe : règles et agrégation déterministes.
 */
import {
  getRequirements,
  getNormById,
  getImportedDocumentProofs
} from '../data/conformityStore.js';
import { isoRequirementStatusNormKey } from '../utils/isoRequirementStatus.js';
import { computeIsoScore } from '../utils/isoScore.js';
import { riskCriticalityFromMeta } from '../utils/riskMatrixCore.js';

function actionIsDone(status) {
  const s = String(status || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (
    /\b(termine|clos|clotur|ferme|complete|realise|valide|fait|acheve|done|closed)\b/.test(s)
  ) {
    return true;
  }
  if (s.includes('termine') || s.includes('clotur') || s.includes('ferme')) return true;
  return false;
}

function actionIsOverdue(row) {
  if (!row?.dueDate || actionIsDone(row.status)) return false;
  const d = new Date(row.dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < t;
}

function riskIsCritical(row) {
  const c = riskCriticalityFromMeta(row?.meta);
  if (c && c.tier >= 4) return true;
  const g = Number(row?.gravity ?? row?.severity ?? 0);
  return Number.isFinite(g) && g >= 4;
}

/**
 * @param {{
 *   docRows?: object[];
 *   actions?: object[] | null;
 *   risks?: object[] | null;
 *   incidents?: object[] | null;
 *   audits?: object[] | null;
 * }} input
 */
export function buildIsoAuditReport(input = {}) {
  const reqs = getRequirements();
  const docRows = Array.isArray(input.docRows) ? input.docRows : [];
  const actions = Array.isArray(input.actions) ? input.actions : [];
  const risks = Array.isArray(input.risks) ? input.risks : [];
  const incidents = Array.isArray(input.incidents) ? input.incidents : [];
  const audits = Array.isArray(input.audits) ? input.audits : [];

  const score = computeIsoScore({
    docRows,
    actions: actions.length ? actions : null,
    audits: audits.length ? audits : null
  });

  /** @type {Map<string, object[]>} */
  const byReq = new Map();
  for (const p of getImportedDocumentProofs()) {
    const id = String(p.requirementId || '').trim();
    if (!id) continue;
    if (!byReq.has(id)) byReq.set(id, []);
    byReq.get(id).push(p);
  }

  const conformingPoints = reqs
    .filter((r) => isoRequirementStatusNormKey(r.status) === 'conforme')
    .map((r) => ({
      clause: r.clause,
      title: r.title,
      normCode: getNormById(r.normId)?.code || r.normId,
      detail: String(r.evidence || '').trim() || 'Exigence au vert sur le registre.'
    }));

  const nonConformities = reqs
    .filter((r) => isoRequirementStatusNormKey(r.status) === 'non_conforme')
    .map((r) => ({
      clause: r.clause,
      title: r.title,
      normCode: getNormById(r.normId)?.code || r.normId,
      detail: String(r.actionNote || r.auditNote || r.summary || '').trim() || 'Non-conformité déclarée : traiter en priorité.'
    }));

  const partialGaps = reqs
    .filter((r) => isoRequirementStatusNormKey(r.status) === 'partiel')
    .map((r) => ({
      clause: r.clause,
      title: r.title,
      normCode: getNormById(r.normId)?.code || r.normId,
      detail: String(r.summary || r.evidence || '').trim() || 'Couverture partielle : compléter preuves ou actions.'
    }));

  /** @type {{ clause: string; title: string; normCode: string; detail: string }[]} */
  const missingEvidence = [];
  for (const r of reqs) {
    const plist = byReq.get(r.id) || [];
    const st = isoRequirementStatusNormKey(r.status);
    if (!plist.length) {
      if (st !== 'conforme' || !String(r.evidence || '').trim()) {
        missingEvidence.push({
          clause: r.clause,
          title: r.title,
          normCode: getNormById(r.normId)?.code || r.normId,
          detail:
            st === 'conforme'
              ? 'Conforme déclaré mais aucune preuve importée : prévoir pièce jointe ou référence maîtrisée.'
              : 'Aucune preuve importée pour cette exigence.'
        });
      }
    } else if (!plist.some((p) => p.proofStatus === 'present')) {
      missingEvidence.push({
        clause: r.clause,
        title: r.title,
        normCode: getNormById(r.normId)?.code || r.normId,
        detail: 'Preuve uniquement « à vérifier » ou « manquante » sur les imports.'
      });
    } else if (!plist.some((p) => p.proofStatus === 'present' && String(p.validatedBy || '').trim())) {
      missingEvidence.push({
        clause: r.clause,
        title: r.title,
        normCode: getNormById(r.normId)?.code || r.normId,
        detail: 'Preuve présente mais sans validateur enregistré sur l’import.'
      });
    }
  }

  const openActs = actions.filter((a) => !actionIsDone(a?.status));
  const sortedActs = [...openActs].sort((a, b) => {
    const ao = actionIsOverdue(a) ? 1 : 0;
    const bo = actionIsOverdue(b) ? 1 : 0;
    return bo - ao;
  });
  const priorityActions = sortedActs.slice(0, 25).map((a) => ({
    title: String(a.title || 'Action'),
    status: String(a.status || ''),
    due: a.dueDate || null,
    overdue: actionIsOverdue(a)
  }));

  const criticalRisks = risks.filter((r) => riskIsCritical(r)).slice(0, 20).map((r) => {
    const c = riskCriticalityFromMeta(r?.meta);
    return {
      ref: r.ref || '',
      title: String(r.title || ''),
      label: c?.label || 'Criticité élevée (gravité)',
      status: String(r.status || '')
    };
  });

  const openIncidents = incidents.filter((i) => {
    const s = String(i?.status || '').toLowerCase();
    return !/clos|clôt|ferm|archiv|résolu/.test(s);
  }).length;

  const summaryParts = [
    `Score ISO consolidé ${score.pct} % (référence statuts ${score.legacyPct} %, volet terrain ~${score.operationalPct} %).`,
    `${conformingPoints.length} exigence(s) conforme(s), ${nonConformities.length} non-conforme(s) déclarée(s), ${partialGaps.length} partielle(s).`,
    `${missingEvidence.length} point(s) à renforcer côté preuves (imports / validation).`,
    `${priorityActions.length} action(s) ouverte(s) dans le périmètre chargé${openActs.some((a) => actionIsOverdue(a)) ? ', dont des retards' : ''}.`,
    `${criticalRisks.length} risque(s) critique(s) ou très élevé(s).`,
    openIncidents ? `${openIncidents} incident(s) encore ouvert(s) sur les données chargées (indicateur transverse).` : null
  ].filter(Boolean);

  const summary = summaryParts.join(' ');

  return {
    type: 'iso_audit_report',
    generatedAt: new Date().toISOString(),
    summary,
    score: {
      pct: score.pct,
      legacyPct: score.legacyPct,
      operationalPct: score.operationalPct
    },
    conformingPoints,
    nonConformities,
    partialGaps,
    missingEvidence,
    priorityActions,
    criticalRisks,
    meta: {
      requirementCount: reqs.length,
      openIncidentsHint: openIncidents,
      method: 'rules-aggregate'
    }
  };
}
