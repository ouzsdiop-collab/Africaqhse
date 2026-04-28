import { saveImportDraft, readImportDraft, clearImportDraft } from './importDraft.js';
import { qhseNavigate } from './qhseNavigate.js';

const AI_PREFILL_SOURCE = 'ai_prefill';

/**
 * Transport minimal inter-pages (sessionStorage) pour préremplir un formulaire métier.
 * S'appuie sur le mécanisme existant `importDraft` (déjà consommé par incidents/audits).
 *
 * @param {'actions'|'risks'|'incidents'|'audits'} targetPageId
 * @param {Record<string, unknown>} prefillData
 * @param {Record<string, unknown>} [navOverrides]
 */
export function applyAiSuggestionToForm(targetPageId, prefillData, navOverrides = {}) {
  saveImportDraft({
    source: AI_PREFILL_SOURCE,
    targetPageId,
    prefillData
  });
  qhseNavigate(targetPageId, { skipDefaults: true, ...navOverrides, source: 'ai_prefill' });
}

/**
 * @param {'actions'|'risks'|'incidents'|'audits'} targetPageId
 * @returns {Record<string, unknown> | null}
 */
export function consumeAiPrefillForPage(targetPageId) {
  const draft = readImportDraft();
  if (!draft || draft.targetPageId !== targetPageId || !draft.prefillData) return null;
  if (draft.source !== AI_PREFILL_SOURCE) return null;
  const p = draft.prefillData;
  clearImportDraft();
  return p && typeof p === 'object' && !Array.isArray(p) ? p : null;
}

function normText(v) {
  const t = v == null ? '' : String(v).trim();
  return t;
}

function joinLines(arr, prefix = '- ') {
  if (!Array.isArray(arr)) return '';
  const lines = arr
    .map((x) => normText(x))
    .filter(Boolean)
    .map((x) => `${prefix}${x}`);
  return lines.join('\n');
}

function clamp01(n, fallback = 0.5) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(1, v));
}

function riskSeverityFromGravity(gravity) {
  const g = Number(String(gravity ?? '').replace(',', '.'));
  if (Number.isFinite(g)) {
    if (g >= 4) return 'élevée';
    if (g >= 3) return 'moyenne';
    return 'faible';
  }
  const txt = normText(gravity).toLowerCase();
  if (/(crit|élev|high|fort)/.test(txt)) return 'élevée';
  if (/(faib|low)/.test(txt)) return 'faible';
  return 'moyenne';
}

function riskProbabilityFromFrequency(freq) {
  const txt = normText(freq).toLowerCase();
  if (/(élev|high|frequent)/.test(txt)) return 'élevée';
  if (/(faib|low|rare)/.test(txt)) return 'faible';
  return 'moyenne';
}

/**
 * Mapping P2 : transforme un structured `risk_analysis` (type/confidence/content) vers les
 * champs existants du formulaire risque (title/description/category/severity/probability/actions).
 *
 * @param {Record<string, unknown>} structured
 * @returns {{ defaults: Record<string, unknown> } | null}
 */
export function buildRiskDefaultsFromStructured(structured) {
  if (!structured || typeof structured !== 'object') return null;
  const type = normText(structured.type);
  const content = structured.content && typeof structured.content === 'object' ? structured.content : null;
  if (type !== 'risk_analysis' || !content) return null;

  const c = /** @type {Record<string, unknown>} */ (content);
  const conf = clamp01(structured.confidence, 0.5);

  const danger = normText(c.danger);
  const haz = normText(c.hazardousSituation);
  const summary = normText(c.summary);
  const gravity = c.gravity;
  const frequency = c.frequency;
  const consequences = Array.isArray(c.consequences) ? c.consequences : [];
  const controls = Array.isArray(c.controls) ? c.controls : [];
  const findings = Array.isArray(c.findings) ? c.findings : [];

  const recActions = Array.isArray(c.recommendedActions) ? c.recommendedActions : [];
  const actionLines = recActions
    .map((a) => (a && typeof a === 'object' ? a : null))
    .filter(Boolean)
    .map((a) => {
      const aa = /** @type {Record<string, unknown>} */ (a);
      const act = normText(aa.action);
      const role = normText(aa.responsibleRole);
      const due = aa.dueInDays != null ? `${String(aa.dueInDays).trim()} j` : '';
      const evidence = Array.isArray(aa.evidenceExpected) ? aa.evidenceExpected : [];
      const ev = evidence.length ? `preuves: ${evidence.map((x) => normText(x)).filter(Boolean).join(', ')}` : '';
      const cc = normText(aa.closureCriteria);
      const tail = [role && `resp: ${role}`, due && `échéance: ${due}`, ev, cc && `clôture: ${cc}`]
        .filter(Boolean)
        .join(' | ');
      return tail ? `${act} — ${tail}` : act;
    })
    .filter(Boolean);

  const blocks = [];
  blocks.push(`[Suggestion IA à valider] Confiance: ${Math.round(conf * 100)}%`);
  if (summary) blocks.push(`Synthèse\n${summary}`);
  if (danger) blocks.push(`Danger\n${danger}`);
  if (haz) blocks.push(`Situation dangereuse\n${haz}`);
  if (consequences.length) blocks.push(`Conséquences (proposées)\n${joinLines(consequences)}`);
  if (controls.length) blocks.push(`Moyens de maîtrise / contrôles\n${joinLines(controls)}`);
  if (findings.length) blocks.push(`Constats\n${joinLines(findings)}`);
  if (actionLines.length) blocks.push(`Actions recommandées (IA)\n${joinLines(actionLines)}`);

  const description = blocks.filter(Boolean).join('\n\n');
  const title =
    normText(structured.title) ||
    (danger ? danger.slice(0, 72) : '') ||
    (summary ? summary.slice(0, 72) : '') ||
    'Risque (prérempli IA)';

  // Category: best-effort only (on ne force pas si absent/inconnu)
  const category = normText(c.category);

  return {
    defaults: {
      title,
      description,
      ...(category ? { category } : {}),
      severity: riskSeverityFromGravity(gravity),
      probability: riskProbabilityFromFrequency(frequency),
      actions: actionLines.join('\n')
    }
  };
}

function incidentSeverityFromConfidence(conf) {
  const c = clamp01(conf, 0.5);
  if (c >= 0.82) return 'fort';
  if (c >= 0.55) return 'moyen';
  return 'faible';
}

/**
 * Mapping P2 : structured `incident_analysis` → champs existants de déclaration incident.
 * Champs supportés par `incidentFormDialog`: type, site, gravite/severity, description.
 *
 * @param {Record<string, unknown>} structured
 * @returns {{ type?: string, site?: string, severity?: string, description?: string } | null}
 */
export function buildIncidentPrefillFromStructured(structured) {
  if (!structured || typeof structured !== 'object') return null;
  const type = normText(structured.type);
  const content = structured.content && typeof structured.content === 'object' ? structured.content : null;
  if (type !== 'incident_analysis' || !content) return null;

  const c = /** @type {Record<string, unknown>} */ (content);
  const conf = clamp01(structured.confidence, 0.5);

  const summary = normText(c.summary);
  const findings = Array.isArray(c.findings) ? c.findings : [];
  const rec = Array.isArray(c.recommendedActions) ? c.recommendedActions : [];

  const blocks = [];
  blocks.push(`[Suggestion IA à valider] Confiance: ${Math.round(conf * 100)}%`);
  if (summary) blocks.push(`Résumé\n${summary}`);
  if (findings.length) blocks.push(`Constats\n${joinLines(findings)}`);
  if (rec.length) blocks.push(`Actions proposées\n${joinLines(rec)}`);
  const description = blocks.filter(Boolean).join('\n\n').slice(0, 2000);

  return {
    // best-effort: si l’IA met type/site dans content on les utilise
    type: normText(c.incidentType || c.type) || undefined,
    site: normText(c.site) || undefined,
    severity: incidentSeverityFromConfidence(conf),
    description
  };
}

/**
 * Mapping P2 : structured `audit_analysis` → champs existants audit (notes + méta simple).
 *
 * @param {Record<string, unknown>} structured
 * @returns {{ defaults: Record<string, unknown> } | null}
 */
export function buildAuditDefaultsFromStructured(structured) {
  if (!structured || typeof structured !== 'object') return null;
  const type = normText(structured.type);
  const content = structured.content && typeof structured.content === 'object' ? structured.content : null;
  if (type !== 'audit_analysis' || !content) return null;

  const c = /** @type {Record<string, unknown>} */ (content);
  const conf = clamp01(structured.confidence, 0.5);
  const summary = normText(c.summary);
  const findings = Array.isArray(c.findings) ? c.findings : [];
  const rec = Array.isArray(c.recommendedActions) ? c.recommendedActions : [];

  const blocks = [];
  blocks.push(`[Suggestion IA à valider] Confiance: ${Math.round(conf * 100)}%`);
  if (summary) blocks.push(`Synthèse\n${summary}`);
  if (findings.length) blocks.push(`Constats / écarts\n${joinLines(findings)}`);
  if (rec.length) blocks.push(`Actions recommandées\n${joinLines(rec)}`);

  const aiGrid = blocks.filter(Boolean).join('\n\n').slice(0, 4000);
  const site = normText(c.site);
  const auditType = normText(c.auditType || c.referential || c.typeLabel);

  return {
    defaults: {
      ...(site ? { site } : {}),
      ...(auditType ? { type: auditType } : {}),
      aiGrid
    }
  };
}

