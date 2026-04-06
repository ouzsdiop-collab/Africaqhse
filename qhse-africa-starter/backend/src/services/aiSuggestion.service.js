/**
 * Suggestions IA — seule table `AiSuggestion` est écrite ici.
 * Aucune création / mise à jour directe sur incidents, actions, audits (validation humaine requise).
 */

import { prisma } from '../db.js';
import { requestJsonCompletion, isExternalAiEnabled } from './aiProvider.service.js';

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
    type,
    context = {},
    targetIncidentId,
    targetActionId,
    targetAuditId,
    importHistoryId,
    riskRef,
    userId
  } = opts;

  const t = String(type || 'generic').slice(0, 64);
  let structured = buildStructuredContent({
    summary: `Suggestion générée (type « ${t} ») — revue obligatoire avant toute action.`,
    confidence: 0.45,
    items: [{ label: 'Contexte', value: JSON.stringify(context).slice(0, 3000), source: 'heuristic' }],
    proposedPatch: null,
    warnings: ["Brouillon IA — ne pas appliquer sans validation humaine."]
  });

  let providerMeta = { mode: 'local', externalAttempted: false };

  if (isExternalAiEnabled()) {
    const sys =
      'Tu es un assistant QHSE. Réponds uniquement par un JSON objet avec les clés : summary (string), confidence (0-1), items (array of {label,value}), warnings (array of strings), proposedPatch (object or null). Aucune clé sensible supplémentaire.';
    const user = JSON.stringify({ type: t, context });
    const ext = await requestJsonCompletion({ system: sys, user });
    providerMeta = {
      mode: 'openai',
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
      type: t,
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
 *   text: string,
 *   fileName?: string,
 *   importHistoryId?: string | null,
 *   userId: string | null
 * }} opts
 */
export async function analyzeDocument(opts) {
  const { text, fileName = '', importHistoryId, userId } = opts;
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
    providerMeta = { mode: 'openai', externalAttempted: true, error: ext.error ?? null };
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
 *   targetIncidentId?: string | null,
 *   targetAuditId?: string | null,
 *   userId: string | null,
 *   note?: string
 * }} opts
 */
export async function proposeActions(opts) {
  const { targetIncidentId, targetAuditId, userId, note = '' } = opts;

  const items = [];
  let summary = 'Propositions d’actions (brouillon) — validation requise.';

  if (targetIncidentId) {
    const inc = await prisma.incident.findUnique({
      where: { id: targetIncidentId },
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
    const au = await prisma.audit.findUnique({
      where: { id: targetAuditId },
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

/**
 * Validation humaine — met à jour uniquement `AiSuggestion`.
 * @param {{
 *   id: string,
 *   status: string,
 *   validatedByUserId: string,
 *   editedContent?: Record<string, unknown> | null
 * }} opts
 */
export async function reviewSuggestion(opts) {
  const { id, status, validatedByUserId, editedContent } = opts;
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

  return prisma.aiSuggestion.update({
    where: { id },
    data: updateData
  });
}
