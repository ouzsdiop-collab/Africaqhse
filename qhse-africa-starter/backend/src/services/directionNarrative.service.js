/**
 * Synthèse direction : métriques uniquement vers le LLM, fallback déterministe si échec ou mock.
 * Même garde-fou que isoAuditNarrative.service.js : aucune écriture automatique, étiquetée "IA — à valider".
 */
import { callAiProvider, isExternalAiEnabled } from './aiProvider.service.js';

function clamp(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return lo;
  return Math.min(hi, Math.max(lo, x));
}

const MAX_SUMMARY = 800;

/**
 * @param {Awaited<ReturnType<typeof import('./direction.service.js').getDirectionSummary>>} direction
 */
export function extractDirectionMetrics(direction) {
  const t = direction?.trends || {};
  return {
    period: direction?.period === 'quarter' ? 'quarter' : 'month',
    incidentsCreated: Number(direction?.currentPeriod?.incidentsCreated) || 0,
    incidentsCreatedDeltaPct: Number.isFinite(t?.incidentsCreated?.deltaPct) ? t.incidentsCreated.deltaPct : null,
    nonConformitiesOpen: Number(direction?.counts?.nonConformitiesOpen) || 0,
    actionsOverdue: Number(direction?.counts?.actionsOverdue) || 0,
    actionsOverdueDeltaPct: Number.isFinite(t?.actionsOverdueStock?.deltaPct) ? t.actionsOverdueStock.deltaPct : null,
    auditScoreAvg: Number.isFinite(direction?.kpis?.auditScoreAvg) ? direction.kpis.auditScoreAvg : null,
    auditScoreAvgDeltaPct: Number.isFinite(t?.auditScoreAvg?.deltaPct) ? t.auditScoreAvg.deltaPct : null,
    criticalIncidentsOpen: Number(direction?.counts?.incidentsCriticalOpen) || 0,
    topRisksCount: Array.isArray(direction?.topRisks) ? direction.topRisks.length : 0,
    upcomingDeadlinesCount: Array.isArray(direction?.upcomingDeadlines) ? direction.upcomingDeadlines.length : 0,
    priorityAlertsCount: Array.isArray(direction?.priorityAlerts) ? direction.priorityAlerts.length : 0
  };
}

/**
 * @param {ReturnType<typeof extractDirectionMetrics>} m
 */
export function buildDeterministicDirectionSummary(m) {
  const isQuarter = m.period === 'quarter';
  const periodPrefix = isQuarter ? 'Ce trimestre-ci' : 'Ce mois-ci';
  const vsPrevious = isQuarter ? 'vs trimestre précédent' : 'vs mois précédent';

  const parts = [];
  parts.push(`${m.incidentsCreated} incident(s) ${isQuarter ? 'ce trimestre' : 'ce mois'}`);
  if (m.incidentsCreatedDeltaPct != null) {
    parts[parts.length - 1] += ` (${m.incidentsCreatedDeltaPct >= 0 ? '+' : ''}${m.incidentsCreatedDeltaPct}% ${vsPrevious})`;
  }
  if (m.criticalIncidentsOpen > 0) {
    parts.push(`dont ${m.criticalIncidentsOpen} critique(s) encore ouvert(s)`);
  }
  if (m.auditScoreAvg != null) {
    parts.push(`score d'audit moyen ${m.auditScoreAvg}%`);
  }
  if (m.actionsOverdue > 0) {
    let s = `${m.actionsOverdue} action(s) en retard`;
    if (m.actionsOverdueDeltaPct != null) {
      s += ` (${m.actionsOverdueDeltaPct >= 0 ? '+' : ''}${m.actionsOverdueDeltaPct}% ${vsPrevious})`;
    }
    parts.push(s);
  }
  if (m.nonConformitiesOpen > 0) {
    parts.push(`${m.nonConformitiesOpen} non-conformité(s) ouverte(s)`);
  }
  if (m.upcomingDeadlinesCount > 0) {
    parts.push(`${m.upcomingDeadlinesCount} échéance(s) d'habilitation à surveiller dans les 60 jours`);
  }
  const summary = `${periodPrefix} : ${parts.join(', ')}.`;
  return { summary: summary.length > MAX_SUMMARY ? `${summary.slice(0, MAX_SUMMARY - 1)}…` : summary, confidence: 1 };
}

const SYSTEM_PROMPT = `Tu es un assistant QHSE qui prépare une synthèse pour une réunion de direction. Tu rédiges en français professionnel, factuel, en 2 à 4 phrases maximum.
Règles absolues :
- N'invente AUCUN fait, aucun nom, aucune cause, aucune référence normative non fournie dans les métriques.
- Ne cite que des conclusions qui découlent logiquement des nombres fournis.
- Mentionne en priorité ce qui se dégrade (deltaPct positif sur incidents/retards, ou deltaPct négatif sur le score d'audit).
- Réponds par un UNIQUE objet JSON valide, sans markdown, sans texte avant ou après, avec exactement les clés :
{"summary":"string","confidence":0.85}
- "confidence" : ton niveau de confiance dans la pertinence de cette synthèse étant donné la pauvreté des données (nombres uniquement).`;

/**
 * @param {ReturnType<typeof extractDirectionMetrics>} metrics
 */
async function tryAiDirectionSummary(metrics) {
  const userPayload = JSON.stringify({
    _instruction: 'Utilise exclusivement ces champs numériques. Aucune autre source. Réponse = JSON du format demandé.',
    metrics
  });
  const res = await callAiProvider(SYSTEM_PROMPT, userPayload, 400);
  if (res.error || res.rawText == null || !String(res.rawText).trim()) return null;
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
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const summary = String(parsed.summary ?? '').trim();
  if (!summary) return null;
  let confidence = Number(parsed.confidence);
  if (!Number.isFinite(confidence)) confidence = 0.75;
  return {
    summary: summary.length > MAX_SUMMARY ? `${summary.slice(0, MAX_SUMMARY - 1)}…` : summary,
    confidence: clamp(confidence, 0, 1)
  };
}

/**
 * @param {Awaited<ReturnType<typeof import('./direction.service.js').getDirectionSummary>>} direction
 * @returns {Promise<{ narrative: { summary: string; confidence: number }; source: 'ai' | 'fallback' }>}
 */
export async function generateDirectionNarrativeWithSource(direction) {
  const metrics = extractDirectionMetrics(direction);
  const fallback = buildDeterministicDirectionSummary(metrics);

  if (!isExternalAiEnabled()) {
    return { narrative: fallback, source: 'fallback' };
  }

  try {
    const ai = await tryAiDirectionSummary(metrics);
    if (ai) return { narrative: ai, source: 'ai' };
  } catch {
    /* fall through */
  }
  return { narrative: fallback, source: 'fallback' };
}
