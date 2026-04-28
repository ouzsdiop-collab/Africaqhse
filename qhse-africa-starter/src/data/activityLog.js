/** Entité métier pour filtrage ISO (exigence registre). */
export const ENTITY_ISO_REQUIREMENT = 'iso_requirement';

/** Traçabilité produit : suggestions / rapports assistés (audit, différenciation). */
export const ENTITY_AI_SUGGESTION = 'ai_suggestion';

/** Sous-types de trace IA (journal + filtres futurs). */
export const AI_TRACE_TYPE = {
  SUGGESTION_GENERATED: 'suggestion_generated',
  USER_VALIDATED: 'user_validated',
  USER_MODIFIED: 'user_modified',
  AUDIT_REPORT_GENERATED: 'audit_report_generated'
};

/** Acteur affiché quand l’événement est côté moteur d’assistance (pas un humain). */
export const AI_TRACE_ACTOR_IA = 'IA (assistant)';

/**
 * Construit une entrée journal pour entityType `ai_suggestion` (ne persiste pas : passer à activityLogStore.add / onAddLog).
 * @param {{
 *   aiTraceType: string;
 *   module?: string;
 *   requirementId?: string;
 *   detail?: string;
 *   user: string;
 *   suggestedStatus?: string;
 *   chosenStatus?: string;
 * }} opts
 */
export function buildAiSuggestionJournalEntry(opts) {
  const trace = String(opts.aiTraceType || '');
  let action = 'Trace IA';
  /** Libellé court « action utilisateur » pour l’affichage (badge). */
  let userActionLabel = '—';

  if (trace === AI_TRACE_TYPE.SUGGESTION_GENERATED) {
    action = 'IA · suggestion générée';
    userActionLabel = 'Généré';
  } else if (trace === AI_TRACE_TYPE.USER_VALIDATED) {
    action = 'Utilisateur · proposition validée';
    userActionLabel = 'Validé';
  } else if (trace === AI_TRACE_TYPE.USER_MODIFIED) {
    action = 'Utilisateur · statut modifié';
    userActionLabel = 'Modifié';
  } else if (trace === AI_TRACE_TYPE.AUDIT_REPORT_GENERATED) {
    action = 'IA · rapport d’audit généré';
    userActionLabel = 'Généré';
  }

  const parts = [];
  if (opts.detail) parts.push(String(opts.detail));
  if (opts.suggestedStatus && trace !== AI_TRACE_TYPE.AUDIT_REPORT_GENERATED) {
    parts.push(`Proposition : ${opts.suggestedStatus}`);
  }
  if (opts.chosenStatus && trace !== AI_TRACE_TYPE.SUGGESTION_GENERATED && trace !== AI_TRACE_TYPE.AUDIT_REPORT_GENERATED) {
    parts.push(`Statut retenu : ${opts.chosenStatus}`);
  }

  return {
    module: opts.module || 'iso-ai',
    action,
    detail: parts.join(' · ') || opts.detail || '',
    user: opts.user,
    entityType: ENTITY_AI_SUGGESTION,
    requirementId: opts.requirementId,
    aiTraceType: trace,
    userActionLabel
  };
}

const entries = [
  {
    id: 1,
    at: 1,
    module: 'incidents',
    action: 'Incident créé',
    detail: 'INC-203 enregistré sur le bassin nord',
    user: 'Responsable HSE',
    timestamp: 'Aujourd’hui · 09:10'
  },
  {
    id: 2,
    at: 2,
    module: 'actions',
    action: 'Action modifiée',
    detail: 'Action corrective affectée à Maintenance',
    user: 'Manager site',
    timestamp: 'Aujourd’hui · 08:40'
  },
  {
    id: 3,
    at: 3,
    module: 'incidents',
    action: 'Incident critique : gravité élevée',
    detail: 'INC-204 zone stockage : sécurité',
    user: 'HSE terrain',
    timestamp: 'Hier · 17:22'
  },
  {
    id: 4,
    at: 4,
    module: 'actions',
    action: 'Relance action en retard',
    detail: 'Échéance dépassée : plan correctif site sud',
    user: 'Coord. QHSE',
    timestamp: 'Hier · 11:05'
  },
  {
    id: 5,
    at: 5,
    module: 'audits',
    action: 'Non-conformité majeure relevée',
    detail: 'Constat NC-12 : suivi audits internes',
    user: 'Auditeur interne',
    timestamp: 'Lun. · 14:30'
  }
];

export const activityLogStore = {
  all() {
    return [...entries].reverse();
  },
  add(entry) {
    const merged = { ...entry };
    const at =
      merged.at != null && Number.isFinite(Number(merged.at)) ? Number(merged.at) : Date.now();
    const ts =
      typeof merged.timestamp === 'string' && merged.timestamp.trim()
        ? merged.timestamp.trim()
        : new Date(at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const id =
      merged.id != null && merged.id !== ''
        ? merged.id
        : Date.now() + Math.floor(Math.random() * 1000);
    entries.push({
      ...merged,
      id,
      at,
      timestamp: ts
    });
  }
};
