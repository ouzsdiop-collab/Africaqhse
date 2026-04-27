/**
 * Suggestions IA — seule table `AiSuggestion` est écrite ici.
 * Aucune création / mise à jour directe sur incidents, actions, audits (validation humaine requise).
 */

import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import {
  callAiProvider,
  requestJsonCompletion,
  isExternalAiEnabled,
  resolveAiProvider
} from './aiProvider.service.js';

export const AI_SUGGESTION_STATUS = {
  PENDING: 'pending_review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EDITED: 'edited'
};

/** Version du schéma JSON stocké dans `content` / `editedContent`. */
export const CONTENT_SCHEMA_VERSION = 1;

/**
 * Enveloppe structurée obligatoire pour toute suggestion.
 * @param {Record<string, unknown>} partial
 */
export function buildStructuredContent(partial) {
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    summary: typeof partial.summary === 'string' ? partial.summary.slice(0, 2000) : '',
    confidence:
      typeof partial.confidence === 'number' && partial.confidence >= 0 && partial.confidence <= 1
        ? partial.confidence
        : 0.5,
    items: Array.isArray(partial.items)
      ? partial.items.slice(0, 50).map((x) => ({
          label: String(x?.label ?? '').slice(0, 200),
          value: String(x?.value ?? '').slice(0, 4000),
          source: x?.source === 'llm' ? 'llm' : 'heuristic'
        }))
      : [],
    proposedPatch:
      partial.proposedPatch != null && typeof partial.proposedPatch === 'object'
        ? partial.proposedPatch
        : null,
    warnings: Array.isArray(partial.warnings)
      ? partial.warnings.map((w) => String(w).slice(0, 500)).slice(0, 20)
      : []
  };
}

/**
 * @param {{
 *   tenantId?: string | null,
 *   type: string,
 *   context?: Record<string, unknown>,
 *   targetIncidentId?: string | null,
 *   targetActionId?: string | null,
 *   targetAuditId?: string | null,
 *   importHistoryId?: string | null,
 *   riskRef?: string | null,
 *   userId: string | null
 * }} opts
 */
export async function generateSuggestion(opts) {
  const {
    tenantId,
    type,
    context = {},
    targetIncidentId,
    targetActionId,
    targetAuditId,
    importHistoryId,
    riskRef,
    userId
  } = opts;
  const tenantRow = normalizeTenantId(tenantId);
  if (!tenantRow) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }

  const typeKey = String(type || 'generic').slice(0, 64);
  let structured = buildStructuredContent({
       summary: `Suggestion générée (type « ${typeKey} ») — revue obligatoire avant toute action.`,
    confidence: 0.45,
    items: [{ label: 'Contexte', value: JSON.stringify(context).slice(0, 3000), source: 'heuristic' }],
    proposedPatch: null,
    warnings: ["Brouillon IA — ne pas appliquer sans validation humaine."]
  });

  let providerMeta = { mode: 'local', externalAttempted: false };

  if (isExternalAiEnabled()) {
    const sys =
      typeKey === 'analytics_quad'
        ? 'Tu es un analyste QHSE senior. On te fournit un contexte JSON agrégé (actions, incidents, NC, audits, répartition types / statuts) issu du tableau Analytics — pas de données personnelles. Rédige une synthèse en français : 3 à 5 phrases courtes, reliant retards d’actions, volumes relatifs, incidents critiques et statuts d’audits ; ton professionnel, orienté pilotage. Réponds uniquement par un JSON objet avec les clés : summary (string), confidence (0-1), items (array optionnel de {label,value} pour 2 à 4 pistes), warnings (array of strings), proposedPatch (null).'
        : 'Tu es un assistant QHSE. Réponds uniquement par un JSON objet avec les clés : summary (string), confidence (0-1), items (array of {label,value}), warnings (array of strings), proposedPatch (object or null). Aucune clé sensible supplémentaire.';
    const user = JSON.stringify({ type: typeKey, context });
    const ext = await requestJsonCompletion({ system: sys, user });
    providerMeta = {
      mode: ext.provider || resolveAiProvider(),
      externalAttempted: true,
      error: ext.error ?? null
    };
    if (ext.rawText) {
      try {
        const parsed = JSON.parse(ext.rawText);
        structured = buildStructuredContent({
          summary: parsed.summary,
          confidence: parsed.confidence,
          items: parsed.items,
          proposedPatch: parsed.proposedPatch,
          warnings: parsed.warnings
        });
      } catch {
        structured.warnings.push('Réponse LLM non JSON exploitable — contenu local conservé.');
      }
    }
  }

  const row = await prisma.aiSuggestion.create({
    data: {
      tenantId: tenantRow,
      type: typeKey,
      content: structured,
      status: AI_SUGGESTION_STATUS.PENDING,
      createdBySource: userId ? 'user' : 'system',
      createdByUserId: userId,
      targetIncidentId: targetIncidentId ?? null,
      targetActionId: targetActionId ?? null,
      targetAuditId: targetAuditId ?? null,
      importHistoryId: importHistoryId ?? null,
      riskRef: riskRef ? String(riskRef).slice(0, 200) : null,
      providerMeta
    }
  });

  return row;
}

/**
 * Analyse document interne — ne stocke pas le texte brut hors JSON structuré (extraits limités).
 * @param {{
 *   tenantId?: string | null,
 *   text: string,
 *   fileName?: string,
 *   importHistoryId?: string | null,
 *   userId: string | null
 * }} opts
 */
export async function analyzeDocument(opts) {
  const { tenantId, text, fileName = '', importHistoryId, userId } = opts;
  const tenantRow = normalizeTenantId(tenantId);
  if (!tenantRow) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const excerpt = String(text || '')
    .trim()
    .slice(0, 12000);
  const wordCount = excerpt.split(/\s+/).filter(Boolean).length;

  const keywords = ['nc', 'non-conformité', 'audit', 'danger', 'sécurité', 'environnement'];
  const lower = excerpt.toLowerCase();
  const hits = keywords.filter((k) => lower.includes(k));

  let structured = buildStructuredContent({
    summary: `Analyse locale (${wordCount} mots extraits) — ${hits.length} thèmes détectés.`,
    confidence: Math.min(0.55 + hits.length * 0.05, 0.9),
    items: [
      { label: 'Fichier', value: String(fileName).slice(0, 240), source: 'heuristic' },
      { label: 'Thèmes', value: hits.join(', ') || '—', source: 'heuristic' }
    ],
    proposedPatch: {
      kind: 'document_review',
      recommendedActions: ['Valider les extraits avec le responsable QHSE.']
    },
    warnings: [
      'Ne pas transmettre de données confidentielles à un LLM sans validation juridique.',
      'Ce résultat est une aide à la lecture, pas une preuve.'
    ]
  });

  let providerMeta = { mode: 'local', externalAttempted: false };

  if (isExternalAiEnabled() && excerpt.length > 50) {
    const ext = await requestJsonCompletion({
      system:
        'Assistant QHSE. JSON uniquement : summary, confidence (0-1), items[{label,value}], warnings[], proposedPatch. Pas de données personnelles dans la sortie.',
      user: excerpt.slice(0, 8000)
    });
    providerMeta = {
      mode: ext.provider || resolveAiProvider(),
      externalAttempted: true,
      error: ext.error ?? null
    };
    if (ext.rawText) {
      try {
        const parsed = JSON.parse(ext.rawText);
        structured = buildStructuredContent(parsed);
      } catch {
        structured.warnings.push('Analyse LLM non structurée — heuristique conservée.');
      }
    }
  }

  const row = await prisma.aiSuggestion.create({
    data: {
      tenantId: tenantRow,
      type: 'document',
      content: structured,
      status: AI_SUGGESTION_STATUS.PENDING,
      createdBySource: userId ? 'user' : 'system',
      createdByUserId: userId,
      importHistoryId: importHistoryId ?? null,
      providerMeta
    }
  });

  return row;
}

/**
 * Propose des actions correctives (brouillon) à partir du périmètre métier — sans écriture dans `actions`.
 * @param {{
 *   tenantId?: string | null,
 *   targetIncidentId?: string | null,
 *   targetAuditId?: string | null,
 *   userId: string | null,
 *   note?: string
 * }} opts
 */
export async function proposeActions(opts) {
  const { tenantId, targetIncidentId, targetAuditId, userId, note = '' } = opts;
  const tenantRow = normalizeTenantId(tenantId);
  if (!tenantRow) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);

  const items = [];
  let summary = 'Propositions d’actions (brouillon) — validation requise.';

  if (targetIncidentId) {
    const inc = await prisma.incident.findFirst({
      where: { id: targetIncidentId, ...tf },
      select: { ref: true, type: true, severity: true, status: true }
    });
    if (inc) {
      items.push({
        label: 'Incident',
        value: `${inc.ref} — ${inc.type} (${inc.severity}) — ${inc.status}`,
        source: 'heuristic'
      });
      summary = `Actions possibles liées à ${inc.ref} — à valider avant création dans le plan d’actions.`;
    }
  }

  if (targetAuditId) {
    const au = await prisma.audit.findFirst({
      where: { id: targetAuditId, ...tf },
      select: { ref: true, score: true, status: true, site: true }
    });
    if (au) {
      items.push({
        label: 'Audit',
        value: `${au.ref} — ${au.site} — score ${au.score}% — ${au.status}`,
        source: 'heuristic'
      });
    }
  }

  if (note) {
    items.push({ label: 'Note opérateur', value: String(note).slice(0, 2000), source: 'heuristic' });
  }

  const structured = buildStructuredContent({
    summary,
    confidence: 0.5,
    items:
      items.length > 0
        ? items
        : [{ label: 'Info', value: 'Aucun incident ou audit cible fourni.', source: 'heuristic' }],
    proposedPatch: {
      kind: 'action_plan_draft',
      steps: [
        { order: 1, title: 'Valider le périmètre', owner: 'QHSE' },
        { order: 2, title: 'Créer les fiches via le module Actions (API existante)', owner: 'QHSE' }
      ]
    },
    warnings: ["Créer les actions via POST /api/actions après validation — pas d'écriture automatique depuis l'IA."]
  });

  const row = await prisma.aiSuggestion.create({
    data: {
      tenantId: tenantRow,
      type: 'action',
      content: structured,
      status: AI_SUGGESTION_STATUS.PENDING,
      createdBySource: userId ? 'user' : 'system',
      createdByUserId: userId,
      targetIncidentId: targetIncidentId ?? null,
      targetAuditId: targetAuditId ?? null,
      providerMeta: { mode: 'local' }
    }
  });

  return row;
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0.5;
  return Math.min(1, Math.max(0, x));
}

function parseJsonObjectFromLlm(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

function mockRootCausesForIncident(inc) {
  const ref = inc?.ref || '—';
  return [
    {
      cause: `Manque de barrières / signalisation adaptée au contexte (${ref})`,
      category: 'materiel',
      confidence: 0.68
    },
    {
      cause: 'Formation / habilitation non actualisée ou non vérifiée sur le poste',
      category: 'humain',
      confidence: 0.61
    },
    {
      cause: 'Procédure existante mais non appliquée ou non adaptée au chantier',
      category: 'organisation',
      confidence: 0.74
    },
    {
      cause: 'Communication insuffisante entre équipes (brief, permis, coordination)',
      category: 'organisation',
      confidence: 0.55
    },
    {
      cause: 'Maintenance / contrôle périodique incomplet sur l’équipement ou zone concernée',
      category: 'mixte',
      confidence: 0.52
    }
  ];
}

function mockCorrectiveActions(inc, _risks) {
  const ref = inc?.ref || 'INC';
  const sev = String(inc?.severity || '').toLowerCase();
  const crit = sev.includes('crit');
  return [
    {
      title: `Sécurisation immédiate — ${ref}`,
      description:
        'Isoler la zone, vérifier EPI, consigner les énergies si applicable, informer encadrement et QHSE.',
      delayDays: 1,
      ownerRole: 'Chef de site',
      confidence: crit ? 0.88 : 0.76
    },
    {
      title: `Analyse causes et mise à jour du plan de maîtrise — ${ref}`,
      description:
        'Compléter l’analyse (5M), rattacher aux risques du registre, proposer mesures préventives et indicateurs de suivi.',
      delayDays: 7,
      ownerRole: 'Responsable QHSE',
      confidence: 0.71
    },
    {
      title: 'Communication et retour d’expérience terrain',
      description:
        'Partager les enseignements (toolbox, flash sécurité), mettre à jour TBM / consignes locales.',
      delayDays: 14,
      ownerRole: 'Encadrement',
      confidence: 0.64
    }
  ];
}

function mockRiskAssessment(risk) {
  const g = Number(risk?.gravity) || 3;
  const p = Number(risk?.probability) || 3;
  const gp = Math.min(25, g * p);
  return {
    suggestedGp: gp,
    suggestedSeverity: Math.min(5, Math.max(1, g)),
    suggestedProbability: Math.min(5, Math.max(1, p)),
    justification: `Évaluation heuristique : gravité ${g}, probabilité ${p} — GP indicatif ${gp} (à valider avec le registre).`,
    confidence: 0.58
  };
}

/**
 * @param {string} rawText
 * @returns {{ rootCauses: Array<{ cause: string, category: string, confidence: number }> }}
 */
function parseRootCausesResponse(rawText) {
  const obj = parseJsonObjectFromLlm(rawText);
  const arr = obj?.rootCauses ?? obj?.causes ?? obj?.items;
  if (!Array.isArray(arr)) return { rootCauses: [] };
  const rootCauses = arr
    .map((x) => ({
      cause: String(x?.cause ?? x?.label ?? '').slice(0, 500),
      category: String(x?.category ?? 'mixte').toLowerCase(),
      confidence: clamp01(x?.confidence)
    }))
    .filter((x) => x.cause.length > 0)
    .slice(0, 8);
  return { rootCauses };
}

function parseActionsResponse(rawText) {
  const obj = parseJsonObjectFromLlm(rawText);
  const arr = obj?.actions ?? obj?.correctiveActions;
  if (!Array.isArray(arr)) return { actions: [] };
  const actions = arr
    .map((x) => ({
      title: String(x?.title ?? '').slice(0, 240),
      description: String(x?.description ?? x?.detail ?? '').slice(0, 4000),
      delayDays: Math.min(365, Math.max(0, Math.floor(Number(x?.delayDays) || 7))),
      ownerRole: String(x?.ownerRole ?? x?.responsibleType ?? 'QHSE').slice(0, 120),
      confidence: clamp01(x?.confidence)
    }))
    .filter((x) => x.title.length > 0)
    .slice(0, 6);
  return { actions };
}

function parseRiskLevelResponse(rawText) {
  const obj = parseJsonObjectFromLlm(rawText);
  if (!obj || typeof obj !== 'object') return null;
  return {
    suggestedGp: Math.min(25, Math.max(1, Math.round(Number(obj.suggestedGp ?? obj.gp) || 1))),
    suggestedSeverity: Math.min(5, Math.max(1, Math.round(Number(obj.suggestedSeverity) || 1))),
    suggestedProbability: Math.min(5, Math.max(1, Math.round(Number(obj.suggestedProbability) || 1))),
    justification: String(obj.justification ?? obj.rationale ?? '').slice(0, 2000),
    confidence: clamp01(obj.confidence)
  };
}

/**
 * @param {{ incidentId: string, tenantId?: string | null }} opts
 */
export async function suggestRootCauses(opts) {
  const { incidentId, tenantId } = opts;
  const tf = prismaTenantFilter(tenantId);
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, ...tf },
    select: {
      id: true,
      ref: true,
      type: true,
      site: true,
      severity: true,
      status: true,
      description: true,
      causes: true,
      causeCategory: true,
      location: true
    }
  });
  if (!incident) {
    const err = new Error('Incident introuvable');
    err.statusCode = 404;
    throw err;
  }

  const systemPrompt = `Tu es un expert QHSE (ISO 45001 / SST) avec expérience terrain mines et industrie lourde.
Tu reçois un incident sous forme JSON. Propose exactement 5 causes racines probables (méthode 5M / Ishikawa), en français.
Réponds UNIQUEMENT par un JSON objet valide avec la clé "rootCauses" : tableau de 5 éléments.
Chaque élément : { "cause": string (court, factuel), "category": "humain" | "materiel" | "organisation" | "mixte", "confidence": nombre entre 0 et 1 }.
Sans texte hors JSON.`;

  const userMessage = JSON.stringify({ incident });
  const res = await callAiProvider(systemPrompt, userMessage, 900);
  let rootCauses = [];
  if (res.rawText) {
    rootCauses = parseRootCausesResponse(res.rawText).rootCauses;
  }
  if (rootCauses.length < 3) {
    rootCauses = mockRootCausesForIncident(incident);
  }

  return {
    incidentId: incident.id,
    ref: incident.ref,
    provider: res.provider,
    error: res.error ?? null,
    rootCauses
  };
}

/**
 * @param {{ incidentId: string, tenantId?: string | null }} opts
 */
export async function suggestCorrectiveActions(opts) {
  const { incidentId, tenantId } = opts;
  const tf = prismaTenantFilter(tenantId);
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, ...tf },
    select: {
      id: true,
      ref: true,
      type: true,
      site: true,
      severity: true,
      status: true,
      description: true,
      location: true,
      causeCategory: true
    }
  });
  if (!incident) {
    const err = new Error('Incident introuvable');
    err.statusCode = 404;
    throw err;
  }

  const existingRisks = await prisma.risk.findMany({
    where: { ...tf },
    take: 15,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      ref: true,
      title: true,
      category: true,
      severity: true,
      probability: true,
      gravity: true,
      gp: true,
      status: true
    }
  });

  const systemPrompt = `Tu es un responsable QHSE senior. On te donne un incident et un extrait du registre des risques.
Propose exactement 3 actions correctives prioritaires, réalisables, en français.
Réponds UNIQUEMENT par un JSON objet avec la clé "actions" : tableau de 3 éléments.
Chaque élément : { "title": string, "description": string, "delayDays": entier (jours calendaires), "ownerRole": string (ex. "Chef de site", "Responsable QHSE", "Maintenance"), "confidence": nombre 0-1 }.
Sans markdown ni texte hors JSON.`;

  const userMessage = JSON.stringify({ incident, existingRisks });
  const res = await callAiProvider(systemPrompt, userMessage, 900);
  let actions = [];
  if (res.rawText) {
    actions = parseActionsResponse(res.rawText).actions;
  }
  if (actions.length < 2) {
    actions = mockCorrectiveActions(incident, existingRisks).slice(0, 3);
  } else {
    actions = actions.slice(0, 3);
  }

  return {
    incidentId: incident.id,
    ref: incident.ref,
    provider: res.provider,
    error: res.error ?? null,
    actions
  };
}

function buildHeuristicPilotageNarrative(dashboardContext) {
  const ctx = dashboardContext && typeof dashboardContext === 'object' ? dashboardContext : {};
  const overdue = Number(ctx.actionsOverdue ?? ctx.overdueActions ?? 0) || 0;
  const crit = Array.isArray(ctx.criticalIncidentsPreview) ? ctx.criticalIncidentsPreview.length : 0;
  const parts = [
    'Synthèse automatique (IA locale ou fournisseur indisponible) : maintenir le pilotage sur les indicateurs affichés.'
  ];
  if (overdue) {
    parts.push(`${overdue} action(s) en retard — prioriser arbitrage, réaffectation et jalons.`);
  }
  if (crit) {
    parts.push(`${crit} incident(s) critique(s) dans les extraits — sécuriser la réponse terrain et la traçabilité.`);
  }
  if (!overdue && !crit) {
    parts.push('Aucun signal critique majeur dans le contexte transmis — poursuivre le suivi habituel des plans.');
  }
  return parts.join(' ');
}

function mockPilotageActionsFromDashboard(dashboardContext) {
  const ctx = dashboardContext && typeof dashboardContext === 'object' ? dashboardContext : {};
  const overdue = Number(ctx.actionsOverdue ?? 0) || 0;
  /** @type {Array<{ title: string; description: string; delayDays: number; ownerRole: string; confidence: number }>} */
  const out = [];
  if (overdue > 0) {
    out.push({
      title: 'Arbitrage plan d’actions',
      description:
        'Point direction / QHSE sur les retards : réaffectation, nouvelles échéances réalistes et communication aux porteurs.',
      delayDays: 3,
      ownerRole: 'Direction site',
      confidence: 0.72
    });
  }
  out.push({
    title: 'Revue incidents à gravité élevée',
    description:
      'Vérifier mesures immédiates, statuts et rattachement au registre risques ; compléter les analyses si besoin.',
    delayDays: 5,
    ownerRole: 'Responsable QHSE',
    confidence: 0.66
  });
  out.push({
    title: 'Cohérence indicateurs & terrain',
    description:
      'Aligner les chiffres du tableau de bord avec les retours terrain (briefs, visites) pour éviter les angles morts.',
    delayDays: 7,
    ownerRole: 'Encadrement',
    confidence: 0.58
  });
  return out.slice(0, 3);
}

/**
 * Pilotage tableau de bord (sans incident ciblé) — même route POST que suggest/actions avec `dashboardContext`.
 * @param {{ dashboardContext?: Record<string, unknown>, tenantId?: string | null }} opts
 */
export async function suggestDashboardPilotageActions(opts) {
  const dashboardContext =
    opts?.dashboardContext && typeof opts.dashboardContext === 'object' ? opts.dashboardContext : {};
  const systemPrompt = `Tu es un directeur QHSE senior. On te fournit un JSON "dashboardContext" (compteurs, extraits d'incidents critiques, actions en retard, site).
Rédige une synthèse opérationnelle en français (3 à 5 phrases courtes) dans la clé "narrative".
Propose jusqu'à 3 actions de pilotage prioritaires (gestion du système QHSE, pas des actions correctives détaillées sur un seul dossier) dans "actions" : chaque élément { "title", "description", "delayDays", "ownerRole", "confidence" }.
Réponds UNIQUEMENT par un JSON objet valide avec les clés "narrative" (string) et "actions" (tableau, max 3). Sans markdown ni texte hors JSON.`;

  const userMessage = JSON.stringify({ dashboardContext });
  const res = await callAiProvider(systemPrompt, userMessage, 900);
  let narrative = '';
  let actions = [];
  if (res.rawText) {
    const obj = parseJsonObjectFromLlm(res.rawText);
    if (obj && typeof obj === 'object') {
      narrative = String(obj.narrative ?? obj.summary ?? '').slice(0, 2500);
    }
    const parsed = parseActionsResponse(res.rawText);
    actions = parsed.actions.slice(0, 3);
  }
  if (!narrative.trim()) {
    narrative = buildHeuristicPilotageNarrative(dashboardContext);
  }
  if (actions.length < 1) {
    actions = mockPilotageActionsFromDashboard(dashboardContext);
  }
  return {
    mode: 'dashboard',
    provider: res.provider,
    error: res.error ?? null,
    narrative: narrative.trim(),
    actions
  };
}

/**
 * @param {{ riskId: string, tenantId?: string | null }} opts
 */
export async function assessRiskLevel(opts) {
  const { riskId, tenantId } = opts;
  const tf = prismaTenantFilter(tenantId);
  const risk = await prisma.risk.findFirst({
    where: { id: riskId, ...tf },
    select: {
      id: true,
      ref: true,
      title: true,
      description: true,
      category: true,
      gravity: true,
      severity: true,
      probability: true,
      gp: true,
      status: true,
      owner: true
    }
  });
  if (!risk) {
    const err = new Error('Risque introuvable');
    err.statusCode = 404;
    throw err;
  }

  const systemPrompt = `Tu es un analyste risques QHSE. Tu reçois une fiche risque (JSON).
Calcule une grille type gravité × probabilité (échelle 1-5 chacune) et un niveau GP = gravité × probabilité (max 25).
Réponds UNIQUEMENT par un JSON objet :
{ "suggestedGp": entier 1-25, "suggestedSeverity": entier 1-5 (gravité), "suggestedProbability": entier 1-5, "justification": string court en français, "confidence": 0-1 }.
Cohérence : suggestedGp doit être proche de suggestedSeverity * suggestedProbability.`;

  const userMessage = JSON.stringify({ risk });
  const res = await callAiProvider(systemPrompt, userMessage, 600);
  let assessment = res.rawText ? parseRiskLevelResponse(res.rawText) : null;
  if (!assessment || !assessment.justification) {
    assessment = mockRiskAssessment(risk);
  }

  return {
    riskId: risk.id,
    ref: risk.ref,
    title: risk.title,
    provider: res.provider,
    error: res.error ?? null,
    assessment
  };
}

/**
 * Validation humaine — met à jour uniquement `AiSuggestion`.
 * @param {{
 *   tenantId?: string | null,
 *   id: string,
 *   status: string,
 *   validatedByUserId: string,
 *   editedContent?: Record<string, unknown> | null
 * }} opts
 */
export async function reviewSuggestion(opts) {
  const { tenantId, id, status, validatedByUserId, editedContent } = opts;
  const tf = prismaTenantFilter(tenantId);
  const tenantRow =
    tenantId != null && String(tenantId).trim() !== '' ? String(tenantId).trim() : null;
  const st = String(status || '').trim();
  if (
    ![AI_SUGGESTION_STATUS.ACCEPTED, AI_SUGGESTION_STATUS.REJECTED, AI_SUGGESTION_STATUS.EDITED].includes(
      st
    )
  ) {
    const err = new Error('Statut de validation invalide');
    err.statusCode = 400;
    throw err;
  }
  if (!tenantRow) {
    const err = new Error('Contexte organisation manquant');
    err.statusCode = 400;
    throw err;
  }

  const updateData = {
    status: st,
    validatedByUserId,
    validatedAt: new Date()
  };
  if (st === AI_SUGGESTION_STATUS.EDITED && editedContent != null) {
    updateData.editedContent = buildStructuredContent(
      typeof editedContent === 'object' ? editedContent : {}
    );
  }

  const existing = await prisma.aiSuggestion.findFirst({ where: { id, ...tf } });
  if (!existing) {
    const err = new Error('Suggestion introuvable');
    err.statusCode = 404;
    err.code = 'P2025';
    throw err;
  }

  return prisma.aiSuggestion.update({
    where: { id: existing.id },
    data: updateData
  });
}
