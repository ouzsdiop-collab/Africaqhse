/**
 * Narration « audit ISO » : métriques uniquement vers le LLM, fallback déterministe si échec ou mock.
 */
import { callAiProvider, isExternalAiEnabled } from './aiProvider.service.js';

function clamp(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return lo;
  return Math.min(hi, Math.max(lo, x));
}

function safeLen(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

/**
 * Extrait uniquement des compteurs et scores numériques (pas de texte métier) pour le prompt IA et le fallback.
 * @param {Record<string, unknown>} report — sortie typique de buildIsoAuditReport (client)
 */
export function extractNarrativeMetrics(report) {
  if (!report || typeof report !== 'object') {
    return {
      scorePct: 0,
      legacyPct: 0,
      operationalPct: 0,
      nConformes: 0,
      nPartiels: 0,
      nNonConformes: 0,
      nMissingEvidence: 0,
      nOpenActions: 0,
      nOverdueActions: 0,
      nCriticalRisks: 0,
      nOpenIncidents: 0,
      nRequirements: 0
    };
  }

  const score = /** @type {Record<string, unknown>} */ (report.score || {});
  const meta = /** @type {Record<string, unknown>} */ (report.meta || {});
  const pa = report.priorityActions;
  let nOverdue = 0;
  if (Array.isArray(pa)) {
    nOverdue = pa.filter((a) => a && typeof a === 'object' && a.overdue === true).length;
  }

  const nReq =
    typeof meta.requirementCount === 'number' && Number.isFinite(meta.requirementCount)
      ? Math.max(0, Math.floor(meta.requirementCount))
      : safeLen(report.conformingPoints) +
        safeLen(report.partialGaps) +
        safeLen(report.nonConformities);

  return {
    scorePct: clamp(score.pct, 0, 100),
    legacyPct: clamp(score.legacyPct, 0, 100),
    operationalPct: clamp(score.operationalPct, 0, 100),
    nConformes: safeLen(report.conformingPoints),
    nPartiels: safeLen(report.partialGaps),
    nNonConformes: safeLen(report.nonConformities),
    nMissingEvidence: safeLen(report.missingEvidence),
    nOpenActions: safeLen(report.priorityActions),
    nOverdueActions: nOverdue,
    nCriticalRisks: safeLen(report.criticalRisks),
    nOpenIncidents:
      typeof meta.openIncidentsHint === 'number' && Number.isFinite(meta.openIncidentsHint)
        ? Math.max(0, Math.floor(meta.openIncidentsHint))
        : 0,
    nRequirements: Math.max(0, nReq)
  };
}

/**
 * @param {ReturnType<typeof extractNarrativeMetrics>} m
 */
export function buildDeterministicNarrative(m) {
  const strengths = [];
  const weaknesses = [];
  const priorityActions = [];

  if (m.nConformes > 0) {
    strengths.push(
      `${m.nConformes} exigence(s) au statut conforme sur ${m.nRequirements || 'le périmètre'} enregistré(s) dans l’agrégat.`
    );
  }
  if (m.scorePct >= 75) {
    strengths.push(
      `Score consolidé ${m.scorePct} % : niveau relativement soutenu au vu des seuls indicateurs chiffrés transmis.`
    );
  } else if (m.scorePct >= 60) {
    strengths.push(
      `Score consolidé ${m.scorePct} % : marge de progression identifiable mais situation non maximale sur les métriques fournies.`
    );
  }

  if (m.nNonConformes > 0) {
    weaknesses.push(`${m.nNonConformes} non-conformité(s) déclarée(s) dans les données agrégées.`);
  }
  if (m.nPartiels > 0) {
    weaknesses.push(`${m.nPartiels} exigence(s) en écart partiel : compléter preuves ou actions selon le registre.`);
  }
  if (m.nMissingEvidence > 0) {
    weaknesses.push(
      `${m.nMissingEvidence} point(s) de preuves à renforcer (imports / validation) d’après les règles de calcul.`
    );
  }
  if (m.nCriticalRisks > 0) {
    weaknesses.push(
      `${m.nCriticalRisks} risque(s) critique(s) ou très élevé(s) dans le jeu de données chargé.`
    );
  }
  if (m.nOpenIncidents > 0) {
    weaknesses.push(`${m.nOpenIncidents} incident(s) encore ouvert(s) (indicateur transverse).`);
  }

  if (m.nOverdueActions > 0) {
    priorityActions.push(
      `Traiter en priorité les ${m.nOverdueActions} action(s) signalée(s) en retard dans l’extrait chargé.`
    );
  }
  if (m.nNonConformes > 0) {
    priorityActions.push('Planifier la levée ou le pilotage des non-conformités déclarées sur le registre.');
  }
  if (m.nMissingEvidence > 0) {
    priorityActions.push('Sécuriser les preuves et validateurs sur les exigences encore fragiles côté imports.');
  }
  if (priorityActions.length === 0 && m.nOpenActions > 0) {
    priorityActions.push(
      `Poursuivre le suivi des ${m.nOpenActions} action(s) ouverte(s) recensée(s) dans le périmètre.`
    );
  }

  let niveau = 'modéré';
  if (m.scorePct < 50 || (m.nNonConformes > 2 && m.nOverdueActions > 2)) niveau = 'critique';
  else if (m.scorePct < 60 || m.nOverdueActions > 0 || m.nNonConformes > 0) niveau = 'sensible';

  const summary = [
    `Synthèse déterministe (fiabilité maximale) : niveau ${niveau} au regard du score consolidé ${m.scorePct} %,`,
    `des statuts ${m.legacyPct} % et du volet terrain ~${m.operationalPct} %.`,
    `Conformes ${m.nConformes}, partiels ${m.nPartiels}, non-conformes ${m.nNonConformes}.`,
    `Preuves à renforcer : ${m.nMissingEvidence}. Actions ouvertes : ${m.nOpenActions} (dont ${m.nOverdueActions} en retard).`,
    `Risques critiques : ${m.nCriticalRisks}.`
  ].join(' ');

  return {
    summary,
    strengths: strengths.length ? strengths : ['Aucun point positif distinctif ressorti des seuls compteurs fournis.'],
    weaknesses: weaknesses.length
      ? weaknesses
      : ['Aucun écart chiffré supplémentaire au-delà du résumé global.'],
    priorityActions: priorityActions.length
      ? priorityActions
      : ['Maintenir la revue du registre et la cohérence des statuts avec les preuves disponibles.'],
    confidence: 1
  };
}

const MAX_SUMMARY = 1200;
const MAX_ITEM = 320;
const MAX_LIST = 6;

/**
 * @param {unknown} v
 * @returns {string[]}
 */
function asStringList(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .slice(0, MAX_LIST)
    .map((s) => (s.length > MAX_ITEM ? `${s.slice(0, MAX_ITEM - 1)}…` : s));
}

/**
 * @param {unknown} parsed
 * @returns {{ summary: string; strengths: string[]; weaknesses: string[]; priorityActions: string[]; confidence: number } | null}
 */
function normalizeAiNarrativePayload(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const o = /** @type {Record<string, unknown>} */ (parsed);
  const summary = String(o.summary ?? '').trim();
  if (!summary) return null;
  const strengths = asStringList(o.strengths);
  const weaknesses = asStringList(o.weaknesses);
  const priorityActions = asStringList(o.priorityActions);
  let confidence = Number(o.confidence);
  if (!Number.isFinite(confidence)) confidence = 0.75;
  confidence = clamp(confidence, 0, 1);
  return {
    summary: summary.length > MAX_SUMMARY ? `${summary.slice(0, MAX_SUMMARY - 1)}…` : summary,
    strengths: strengths.length ? strengths : ['(Aucune force explicite renvoyée par le modèle — vérifier la sortie.)'],
    weaknesses: weaknesses.length ? weaknesses : ['(Aucune faiblesse explicite — croiser avec le tableau de bord.)'],
    priorityActions: priorityActions.length
      ? priorityActions
      : ['(Aucune action prioritaire explicite — utiliser la liste détaillée du rapport.)'],
    confidence
  };
}

const SYSTEM_PROMPT = `Tu es un auditeur QHSE senior. Tu rédiges en français professionnel, factuel et synthétique.
Tu reçois UNIQUEMENT un objet JSON de métriques agrégées (pourcentages et compteurs entiers).
Règles absolues :
- N’invente AUCUN fait, aucun écart, aucun domaine, aucune référence normative, aucun nom d’organisation.
- Ne cite que des conclusions qualitatives générales qui découlent logiquement des nombres fournis (ex. « plusieurs non-conformités » si le compteur est > 0).
- Ne mentionne pas de clauses ISO ni d’exigences précises : les métriques ne contiennent pas ces détails.
- Réponds par un UNIQUE objet JSON valide, sans markdown, sans texte avant ou après, avec exactement les clés :
{"summary":"string","strengths":["string"],"weaknesses":["string"],"priorityActions":["string"],"confidence":0.85}
- "summary" : 2 à 4 phrases maximum.
- "strengths", "weaknesses", "priorityActions" : tableaux de 1 à 5 phrases courtes chacun.
- "confidence" : ton niveau de confiance dans la pertinence de cette narration étant donné la pauvreté des données (nombre uniquement).`;

/**
 * @param {ReturnType<typeof extractNarrativeMetrics>} metrics
 */
async function tryAiNarrative(metrics) {
  const userPayload = JSON.stringify({
    _instruction:
      'Utilise exclusivement ces champs numériques. Aucune autre source. Réponse = JSON du format demandé.',
    metrics
  });
  const res = await callAiProvider(SYSTEM_PROMPT, userPayload, 1100);
  if (res.error || res.rawText == null || !String(res.rawText).trim()) {
    return null;
  }
  let text = String(res.rawText).trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return normalizeAiNarrativePayload(parsed);
}

/**
 * @param {Record<string, unknown>} report
 * @returns {Promise<{ narrative: ReturnType<typeof buildDeterministicNarrative>; source: 'ai' | 'fallback' }>}
 */
export async function generateIsoAuditNarrativeWithSource(report) {
  const metrics = extractNarrativeMetrics(report);
  const fallback = buildDeterministicNarrative(metrics);

  if (!isExternalAiEnabled()) {
    return { narrative: fallback, source: 'fallback' };
  }

  try {
    const ai = await tryAiNarrative(metrics);
    if (ai) {
      return { narrative: ai, source: 'ai' };
    }
  } catch {
    /* fall through */
  }
  return { narrative: fallback, source: 'fallback' };
}
