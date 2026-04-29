import { getStandardCompliance } from './compliancePack.service.js';
import { listIsoEvidence } from './isoEvidence.service.js';

const STANDARDS = /** @type {const} */ (['iso-45001', 'iso-14001', 'iso-9001']);

function clampScore(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function statusFromEvidenceCounts(validatedCount, pendingCount) {
  if ((Number(validatedCount) || 0) > 0) return 'conforme';
  if ((Number(pendingCount) || 0) > 0) return 'partiel';
  return 'non_conforme';
}

function pointsFromStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'conforme') return 100;
  if (s === 'partiel') return 50;
  return 0;
}

function normLabelFromCode(stdCode, stdObj) {
  const s = String(stdCode || '').toLowerCase();
  if (stdObj && typeof stdObj === 'object' && String(stdObj?.label || '').trim()) return String(stdObj.label).trim();
  if (s === 'iso-45001') return 'ISO 45001';
  if (s === 'iso-14001') return 'ISO 14001';
  if (s === 'iso-9001') return 'ISO 9001';
  return s.toUpperCase();
}

function normalizePriority(p) {
  const s = String(p || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  return 'medium';
}

function clauseSortKey(clause) {
  const s = String(clause || '').trim();
  if (!s) return 9999;
  const m = s.match(/(\d+(\.\d+)?)/);
  if (!m) return 9999;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : 9999;
}

/**
 * SMI minimal: score par norme = moyenne simple des statuts "preuves".
 * - validated => conforme (100)
 * - pending => partiel (50)
 * - sinon => non_conforme (0)
 *
 * @param {{ tenantId: string, siteId?: string|null }} ctx
 */
export async function getSmiOverview(ctx) {
  const tenantId = String(ctx?.tenantId || '').trim();
  if (!tenantId) {
    const err = new Error('Contexte organisation requis');
    // @ts-ignore
    err.statusCode = 403;
    throw err;
  }

  const [std45001, std14001, std9001, evidences] = await Promise.all([
    getStandardCompliance('iso-45001'),
    getStandardCompliance('iso-14001'),
    getStandardCompliance('iso-9001'),
    listIsoEvidence(tenantId)
  ]);

  /** @type {Map<string, any[]>} */
  const byReq = new Map();
  (Array.isArray(evidences) ? evidences : []).forEach((e) => {
    const rid = String(e?.requirementId || '').trim();
    if (!rid) return;
    if (!byReq.has(rid)) byReq.set(rid, []);
    byReq.get(rid).push(e);
  });

  const computeNormScore = (std) => {
    const reqs = Array.isArray(std?.requirements) ? std.requirements : [];
    if (!reqs.length) return 0;
    let pts = 0;
    for (const r of reqs) {
      const rid = String(r?.id || '').trim();
      const list = rid && byReq.has(rid) ? byReq.get(rid) : [];
      const validatedCount = (list || []).filter((e) => String(e?.status || '').toLowerCase() === 'validated').length;
      const pendingCount = (list || []).filter((e) => String(e?.status || '').toLowerCase() === 'pending').length;
      const st = statusFromEvidenceCounts(validatedCount, pendingCount);
      pts += pointsFromStatus(st);
    }
    return clampScore(pts / reqs.length);
  };

  /**
   * @param {'iso-45001'|'iso-14001'|'iso-9001'} code
   * @param {any} std
   */
  const computeCriticalForNorm = (code, std) => {
    const reqs = Array.isArray(std?.requirements) ? std.requirements : [];
    const normLabel = normLabelFromCode(code, std);
    const rows = [];
    for (const r of reqs) {
      const rid = String(r?.id || '').trim();
      const list = rid && byReq.has(rid) ? byReq.get(rid) : [];
      const validatedCount = (list || []).filter((e) => String(e?.status || '').toLowerCase() === 'validated').length;
      const pendingCount = (list || []).filter((e) => String(e?.status || '').toLowerCase() === 'pending').length;
      const status = statusFromEvidenceCounts(validatedCount, pendingCount);
      const noEvidence = (list || []).length === 0;
      const priority = normalizePriority(r?.priority);
      const isNonConforme = status === 'non_conforme';
      const isCriticalPriority = priority === 'critical';

      const isCritical =
        isNonConforme || (isCriticalPriority && status !== 'conforme') || noEvidence;
      if (!isCritical) continue;

      const clause = String(r?.clause || '').trim();
      const chapter = Number(r?.chapter) || null;
      const title = String(r?.title || '').trim() || 'Exigence';
      const reasonBits = [];
      if (isNonConforme) reasonBits.push('non conforme');
      if (noEvidence) reasonBits.push('sans preuve');
      if (isCriticalPriority) reasonBits.push('priorité critical');
      const reason =
        reasonBits.length > 0
          ? reasonBits.join(' · ')
          : 'à traiter';

      rows.push({
        norm: code,
        normLabel,
        id: rid,
        chapter,
        clause,
        title,
        priority,
        status,
        noEvidence,
        evidence: { validatedCount, pendingCount },
        reason
      });
    }
    return rows;
  };

  const scoresParNorme = {
    'iso-45001': computeNormScore(std45001),
    'iso-14001': computeNormScore(std14001),
    'iso-9001': computeNormScore(std9001)
  };

  const criticalRequirements = [
    ...computeCriticalForNorm('iso-45001', std45001),
    ...computeCriticalForNorm('iso-14001', std14001),
    ...computeCriticalForNorm('iso-9001', std9001)
  ].sort((a, b) => {
    const w = (x) =>
      (x.status === 'non_conforme' ? 100 : 0) + (x.noEvidence ? 10 : 0) + (x.priority === 'critical' ? 1 : 0);
    const dw = w(b) - w(a);
    if (dw !== 0) return dw;
    const cn = clauseSortKey(a.clause) - clauseSortKey(b.clause);
    if (cn !== 0) return cn;
    return String(a.title).localeCompare(String(b.title), 'fr');
  });

  const topPriorities = criticalRequirements.slice(0, 3).map((r) => ({
    norm: r.norm,
    normLabel: r.normLabel,
    label: `${r.clause ? `${r.clause} ` : ''}${r.title}`.trim(),
    reason: r.reason
  }));

  const blockers = criticalRequirements.filter((r) => r.status === 'non_conforme' || r.noEvidence);
  const auditReadiness =
    blockers.length === 0
      ? { status: 'pret', blockersCount: 0, message: 'Aucun point bloquant critique détecté sur les 3 normes.' }
      : blockers.length <= 2
        ? {
            status: 'fragile',
            blockersCount: blockers.length,
            message: 'Quelques points bloquants critiques : audit possible mais fragile sans actions rapides.'
          }
        : {
            status: 'non_pret',
            blockersCount: blockers.length,
            message: 'Plusieurs points bloquants critiques : audit non recommandé sans plan d’actions prioritaire.'
          };

  // Fusion simple: suggestedActions (packs) sur les exigences critiques d'abord, puis le reste si besoin.
  /** @type {string[]} */
  const recommendedActions = [];
  const seen = new Set();

  const pushUnique = (s) => {
    const t = String(s || '').trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    recommendedActions.push(t);
  };

  /** @param {any} std @param {Set<string>} criticalIds */
  const collectActionsFromStd = (std, criticalIds) => {
    const reqs = Array.isArray(std?.requirements) ? std.requirements : [];
    reqs.forEach((r) => {
      const rid = String(r?.id || '').trim();
      if (!rid || !criticalIds.has(rid)) return;
      (Array.isArray(r?.suggestedActions) ? r.suggestedActions : []).forEach(pushUnique);
    });
  };

  const criticalIds = new Set(criticalRequirements.map((r) => r.id).filter(Boolean));
  collectActionsFromStd(std45001, criticalIds);
  collectActionsFromStd(std14001, criticalIds);
  collectActionsFromStd(std9001, criticalIds);

  // Fallback (si peu d'actions): compléter avec les actions "high" (sans complexité).
  const collectActionsHigh = (std) => {
    const reqs = Array.isArray(std?.requirements) ? std.requirements : [];
    reqs.forEach((r) => {
      if (recommendedActions.length >= 12) return;
      const pr = normalizePriority(r?.priority);
      if (pr !== 'high') return;
      (Array.isArray(r?.suggestedActions) ? r.suggestedActions : []).forEach(pushUnique);
    });
  };
  if (recommendedActions.length < 6) {
    collectActionsHigh(std45001);
    collectActionsHigh(std14001);
    collectActionsHigh(std9001);
  }

  // Cap.
  const recommendedActionsCapped = recommendedActions.slice(0, 12);

  const scoreGlobal = clampScore(
    STANDARDS.map((k) => Number(scoresParNorme[k]) || 0).reduce((a, b) => a + b, 0) / STANDARDS.length
  );

  return {
    scoreGlobal,
    scoresParNorme,
    auditReadiness,
    topPriorities,
    recommendedActions: recommendedActionsCapped,
    criticalRequirements: criticalRequirements.slice(0, 20)
  };
}

