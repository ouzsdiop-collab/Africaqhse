/**
 * Score ISO cockpit : combine le score historique (statuts d’exigences) et des signaux terrain
 * (preuves, actions, audits, documents maîtrisés) pour limiter le pur « déclaratif ».
 */
import {
  computeComplianceSummary,
  getImportedDocumentProofs,
  getRequirements
} from '../data/conformityStore.js';
import { computeDocumentRegistrySummary } from '../services/documentRegistry.service.js';
import { isoRequirementStatusNormKey } from '../utils/isoRequirementStatus.js';

/** Poids du volet « statuts exigences » (inchangé conceptuellement vs ancien %). */
const WEIGHT_LEGACY_STATUS = 0.48;
/** Audits considérés comme « récents » (jours). */
const AUDIT_RECENT_DAYS = 200;

/**
 * @param {string|undefined|null} status
 */
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

/**
 * @param {{ status?: string; dueDate?: string | Date | null }} row
 */
function actionIsOverdue(row) {
  if (!row?.dueDate || actionIsDone(row.status)) return false;
  const d = new Date(row.dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < t;
}

/**
 * @param {{
 *   docRows?: Array<{ complianceStatus?: string }>;
 *   actions?: object[] | null;
 *   audits?: object[] | null;
 * }} [input]
 */
export function computeIsoScore(input = {}) {
  const legacy = computeComplianceSummary();
  const reqs = getRequirements();
  const proofs = getImportedDocumentProofs();
  /** @type {Map<string, typeof proofs>} */
  const byReq = new Map();
  for (const p of proofs) {
    const rid = String(p.requirementId || '').trim();
    if (!rid) continue;
    if (!byReq.has(rid)) byReq.set(rid, []);
    byReq.get(rid).push(p);
  }

  let proofPts = 0;
  let proofN = 0;
  for (const r of reqs) {
    proofN += 1;
    const plist = byReq.get(r.id) || [];
    if (plist.some((p) => p.proofStatus === 'present')) {
      const validated = plist.some((p) => p.proofStatus === 'present' && String(p.validatedBy || '').trim());
      proofPts += validated ? 100 : 82;
    } else if (plist.some((p) => p.proofStatus === 'verify')) {
      proofPts += 68;
    } else if (plist.length) {
      proofPts += 42;
    } else {
      const k = isoRequirementStatusNormKey(r.status);
      if (k === 'conforme') proofPts += 52;
      else if (k === 'partiel') proofPts += 38;
      else proofPts += 22;
    }
  }
  const proofCoveragePct = proofN ? Math.round(proofPts / proofN) : legacy.pct;

  const presentImports = proofs.filter((p) => p.proofStatus === 'present');
  const validatedImports = presentImports.filter((p) => String(p.validatedBy || '').trim());
  const proofValidatedPct = presentImports.length
    ? Math.round((100 * validatedImports.length) / presentImports.length)
    : proofs.length
      ? Math.round((100 * proofs.filter((p) => String(p.validatedBy || '').trim()).length) / proofs.length)
      : Math.min(legacy.pct, 85);

  /** @type {number | null} */
  let actionsScore = null;
  let openActions = 0;
  let overdueActions = 0;
  if (Array.isArray(input.actions)) {
    openActions = input.actions.filter((a) => !actionIsDone(a?.status)).length;
    overdueActions = input.actions.filter((a) => actionIsOverdue(a)).length;
    actionsScore = Math.max(
      0,
      Math.min(100, 100 - Math.min(38, openActions * 2.8) - Math.min(42, overdueActions * 9))
    );
  }

  /** @type {number | null} */
  let auditsScore = null;
  let auditsRecent = false;
  if (Array.isArray(input.audits)) {
    const now = Date.now();
    const horizon = AUDIT_RECENT_DAYS * 86400000;
    auditsRecent = input.audits.some((a) => {
      const t = new Date(a?.updatedAt || a?.createdAt || a?.date || 0).getTime();
      return Number.isFinite(t) && now - t <= horizon;
    });
    if (input.audits.length === 0) {
      auditsScore = 58;
    } else {
      auditsScore = auditsRecent ? 96 : 72;
    }
  }

  /** @type {number | null} */
  let docsScore = null;
  let docSummary = null;
  if (Array.isArray(input.docRows) && input.docRows.length > 0) {
    docSummary = computeDocumentRegistrySummary(input.docRows);
    const t = Math.max(1, docSummary.total);
    const val = docSummary.valide / t;
    const exp = docSummary.expire / t;
    const ren = docSummary.aRenouveler / t;
    docsScore = Math.round(100 * val - 32 * exp - 12 * ren);
    docsScore = Math.max(0, Math.min(100, docsScore));
  }

  const operationalParts = [proofCoveragePct, proofValidatedPct];
  if (actionsScore != null) operationalParts.push(actionsScore);
  if (auditsScore != null) operationalParts.push(auditsScore);
  if (docsScore != null) operationalParts.push(docsScore);

  const operationalPct = operationalParts.length
    ? Math.round(operationalParts.reduce((a, b) => a + b, 0) / operationalParts.length)
    : legacy.pct;

  const pct = Math.round(legacy.pct * WEIGHT_LEGACY_STATUS + operationalPct * (1 - WEIGHT_LEGACY_STATUS));

  /** @type {'ok'|'watch'|'risk'} */
  let globalTone = 'ok';
  let globalLabel = 'Situation saine';
  let message =
    'Score consolidé : statuts d’exigences, preuves importées, pilotage documentaire et signaux terrain (actions / audits) lorsque disponibles.';

  if (legacy.nonOk > 0) {
    globalTone = 'risk';
    globalLabel = 'Action requise';
    message = `${legacy.nonOk} exigence(s) en non-conformité : elles pèsent fortement sur le score, même si d’autres indicateurs sont au vert.`;
  } else if (pct < 58 || (docSummary && docSummary.expire > 0 && (docSummary.expire / Math.max(1, docSummary.total)) > 0.15)) {
    globalTone = 'risk';
    globalLabel = 'Fragilité notable';
    message =
      'Écarts sur preuves, documents expirés ou actions : consolidez avant une lecture audit.';
  } else if (pct < 78 || legacy.partial > 0 || overdueActions > 0) {
    globalTone = 'watch';
    globalLabel = 'À consolider';
    message =
      legacy.partial > 0
        ? `${legacy.partial} exigence(s) partielle(s) et/ou signaux terrain à renforcer (preuves, actions, documents).`
        : 'Quelques signaux terrain méritent attention (retards, audits anciens, preuves à valider).';
  }

  /** @type {{ key: string; label: string; pct: number | null; detail: string }[]} */
  const breakdown = [
    {
      key: 'requirements',
      label: 'Statuts d’exigences (référence)',
      pct: legacy.pct,
      detail: `${legacy.ok} conforme(s), ${legacy.partial} partiel(le)(s), ${legacy.nonOk} non conforme(s).`
    },
    {
      key: 'proofs',
      label: 'Preuves rattachées (par exigence)',
      pct: proofCoveragePct,
      detail:
        proofN > 0
          ? `Moyenne pondérée : imports locaux + repli sur le statut déclaré si aucune preuve.`
          : 'Non calculé.'
    },
    {
      key: 'proof_validated',
      label: 'Preuves « présentes » validées',
      pct: proofValidatedPct,
      detail:
        presentImports.length > 0
          ? `${validatedImports.length} / ${presentImports.length} preuve(s) présente(s) avec validateur.`
          : proofs.length
            ? 'Aucune preuve au statut « présent » : import ou mise à jour recommandée.'
            : 'Aucune preuve importée pour l’instant.'
    },
    {
      key: 'actions',
      label: 'Actions (ouvertes / retards)',
      pct: actionsScore,
      detail:
        actionsScore != null
          ? `${openActions} ouverte(s), dont ${overdueActions} en retard (échéance dépassée).`
          : 'Données actions non chargées sur ce volet (score neutre sur cet axe).'
    },
    {
      key: 'audits',
      label: 'Audits récents',
      pct: auditsScore,
      detail:
        auditsScore != null
          ? input.audits && input.audits.length
            ? auditsRecent
              ? `Activité d’audit dans les ${AUDIT_RECENT_DAYS} derniers jours.`
              : 'Dernier mouvement d’audit jugé ancien ou date non lisible.'
            : 'Aucune ligne d’audit renvoyée par l’API (pénalité légère).'
          : 'Données audits non chargées (score neutre sur cet axe).'
    },
    {
      key: 'documents',
      label: 'Documents maîtrisés (à jour)',
      pct: docsScore,
      detail:
        docsScore != null && docSummary
          ? `${docSummary.valide} valide(s), ${docSummary.aRenouveler} à renouveler, ${docSummary.expire} expiré(s) sur ${docSummary.total}.`
          : 'Aucune ligne documentaire sur ce périmètre (score neutre).'
    }
  ];

  const detailLines = [
    `Score fusionné ${pct} % (exigences ${legacy.pct} % × ${Math.round(100 * WEIGHT_LEGACY_STATUS)} % + terrain ~${operationalPct} %).`,
    ...breakdown
      .filter((b) => b.pct != null)
      .map((b) => `${b.label} : ${b.pct} % · ${b.detail}`)
  ];

  return {
    pct,
    legacyPct: legacy.pct,
    operationalPct,
    globalLabel,
    globalTone,
    message,
    ok: legacy.ok,
    partial: legacy.partial,
    nonOk: legacy.nonOk,
    breakdown,
    detailLines,
    /** Synthèse chiffrée pour affichage court */
    counts: {
      openActions,
      overdueActions,
      auditsRecent,
      proofImports: proofs.length,
      validatedPresentProofs: validatedImports.length
    }
  };
}
