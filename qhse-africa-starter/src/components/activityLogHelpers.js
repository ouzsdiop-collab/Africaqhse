/**
 * Métadonnées modules : un seul endroit pour labels / styles (badges).
 * Les filtres / tri futurs pourront réutiliser ces clés.
 */
export const MODULE_META = {
  incidents: { label: 'Incidents', short: 'INC', className: 'mod-incidents' },
  actions: { label: 'Actions', short: 'ACT', className: 'mod-actions' },
  audits: { label: 'Audits', short: 'AUD', className: 'mod-audits' },
  iso: { label: 'Conformité ISO', short: 'ISO', className: 'mod-iso' },
  'iso-ai': { label: 'ISO · trace IA', short: 'IA', className: 'mod-iso-ai' },
  risks: { label: 'Risques', short: 'RSK', className: 'mod-risks' },
  products: { label: 'Produits / FDS', short: 'PRD', className: 'mod-products' },
  context: { label: 'Contexte site', short: 'CTX', className: 'mod-context' },
  system: { label: 'Système', short: 'SYS', className: 'mod-system' },
  'ai-center': { label: 'Synthèse et assist.', short: 'Synth.', className: 'mod-ai-center' }
};

export function moduleMeta(moduleId) {
  return MODULE_META[moduleId] || { label: moduleId || 'Non renseigné', short: 'N/A', className: 'mod-default' };
}

/**
 * Libellés affichables pour les entrées `entityType === ai_suggestion`.
 * @param {{ entityType?: string; aiTraceType?: string; userActionLabel?: string }} entry
 * @returns {{ typeIa: string; userAction: string } | null}
 */
export function aiSuggestionJournalDisplay(entry) {
  if (!entry || entry.entityType !== 'ai_suggestion') return null;
  const t = String(entry.aiTraceType || '');
  const typeIa =
    t === 'suggestion_generated'
      ? 'IA · suggestion'
      : t === 'user_validated'
        ? 'IA · validation'
        : t === 'user_modified'
          ? 'IA · ajustement'
          : t === 'audit_report_generated'
            ? 'IA · rapport audit'
            : 'IA';
  const userAction = String(entry.userActionLabel || '—').trim() || '—';
  return { typeIa, userAction };
}

/**
 * Repère les actions sensibles pour la traçabilité (mise en avant visuelle légère).
 */
export function classifyActionImportance(action) {
  if (!action) return 'normal';
  const a = action.toLowerCase();
  const triggers = [
    'créé',
    'création',
    'supprim',
    'audit',
    'conformité',
    'initialis',
    'changement de site',
    'préparation',
    'incident',
    'sécurité'
  ];
  if (triggers.some((k) => a.includes(k))) return 'high';
  return 'normal';
}

/**
 * Synthèse affichable à partir de la liste courante (ordre antichronologique attendu).
 * @param {Array<{ module?: string, timestamp?: string }>} entries
 */
export function buildActivityLogSnapshot(entries) {
  const total = entries.length;
  const lastActivity = total ? entries[0].timestamp || 'Non disponible' : 'Non disponible';

  const recentModuleKeys = [];
  const seen = new Set();
  for (let i = 0; i < entries.length && recentModuleKeys.length < 6; i++) {
    const m = entries[i].module;
    if (m && !seen.has(m)) {
      seen.add(m);
      recentModuleKeys.push(m);
    }
  }

  return { total, lastActivity, recentModuleKeys };
}

/** @typedef {'24h' | '7j' | 'all'} ActivityLogPeriod */

/**
 * Filtre temporel best-effort sur l’horodatage affiché (données locales).
 * @param {{ timestamp?: string }} entry
 * @param {ActivityLogPeriod} period
 */
export function matchesActivityPeriod(entry, period) {
  if (period === 'all') return true;
  const t = String(entry.timestamp || '');
  const instant = /à l['\u2019]instant/i.test(t);
  const today = /aujourd/i.test(t);
  if (period === '24h') return instant || today;
  if (period === '7j') {
    if (instant || today) return true;
    if (/semaine|cette semaine|7\s*derniers/i.test(t)) return true;
    return !/^\d{2}\/\d{2}\/\d{4}/.test(t) && !/^\d{4}-\d{2}-\d{2}/.test(t);
  }
  return true;
}

/**
 * @param {string} [action]
 * @returns {'create' | 'modify' | 'close' | 'other'}
 */
export function classifyEntryKind(action) {
  const a = String(action || '').toLowerCase();
  if (/(clôtur|fermé|clos|terminé|résolu|archiv)/i.test(a)) return 'close';
  if (/(créé|création|enregistré|ajouté|ouvert|lancé|nouveau|nouvelle)/i.test(a)) return 'create';
  if (/(modifi|mis à jour|affecté|changé|édité|mise à jour)/i.test(a)) return 'modify';
  return 'other';
}

/**
 * Classification filtre journal : prend en charge `entityType === ai_suggestion`.
 * @param {{ action?: string; entityType?: string; aiTraceType?: string }} entry
 */
export function classifyEntryKindExtended(entry) {
  if (entry?.entityType === 'ai_suggestion') {
    const t = String(entry.aiTraceType || '');
    if (t === 'suggestion_generated' || t === 'audit_report_generated') return 'create';
    if (t === 'user_modified') return 'modify';
    if (t === 'user_validated') return 'close';
  }
  return classifyEntryKind(entry?.action);
}

/**
 * @param {{ action?: string, module?: string, detail?: string }} entry
 */
export function isActivityEntryCritical(entry) {
  const blob = `${entry.action || ''} ${entry.detail || ''}`.toLowerCase();
  if (/critique|critical|sécurité|grave|majeur/.test(blob)) return true;
  if (entry.module === 'incidents' && classifyActionImportance(entry.action) === 'high') return true;
  return false;
}

/**
 * @param {Array<{ module?: string, action?: string, detail?: string }>} entries
 * @param {ActivityLogPeriod} period
 */
export function computeActivityQuickCounts(entries, period) {
  const slice = entries.filter((e) => matchesActivityPeriod(e, period));
  let incCreated = 0;
  let actMod = 0;
  let audLaunched = 0;
  let crit = 0;
  let actLate = 0;
  slice.forEach((e) => {
    const k = classifyEntryKindExtended(e);
    if (e.module === 'incidents' && (k === 'create' || /créé|création|enregistré/i.test(e.action || ''))) {
      incCreated += 1;
    }
    if (e.module === 'actions' && (k === 'modify' || /modifi/i.test(e.action || ''))) {
      actMod += 1;
    }
    if (e.module === 'actions') {
      const blob = `${e.action || ''} ${e.detail || ''}`.toLowerCase();
      if (/retard|échéance|en retard|dépass|depass|overdue|late/i.test(blob)) {
        actLate += 1;
      }
    }
    if (
      e.module === 'audits' &&
      (k === 'create' || /lanc|prépar|planif|programmé|démarré|planifié/i.test(e.action || ''))
    ) {
      audLaunched += 1;
    }
    if (isActivityEntryCritical(e)) crit += 1;
  });
  return { incCreated, actMod, audLaunched, crit, actLate };
}

/**
 * @param {{ incCreated: number; actMod: number; audLaunched: number; crit: number; actLate?: number }} counts
 * @param {string} periodLabel
 */
export function buildActivityLogDigest(counts, periodLabel) {
  const parts = [];
  if (counts.crit > 0) {
    parts.push(`${counts.crit} incident(s) ou anomalie(s) critique(s) sur ${periodLabel}`);
  }
  if (counts.incCreated > 0) {
    parts.push(`${counts.incCreated} incident(s) créé(s)`);
  }
  if (counts.actLate > 0) {
    parts.push(`${counts.actLate} action(s) en retard (mentions dans le journal)`);
  }
  if (counts.actMod > 0) {
    parts.push(`${counts.actMod} action(s) modifiée(s)`);
  }
  if (counts.audLaunched > 0) {
    parts.push(`${counts.audLaunched} mouvement(s) sur audits`);
  }
  if (parts.length === 0) {
    return `Aucun fait marquant détecté sur ${periodLabel} avec les règles actuelles.`;
  }
  return `${parts.join(' + ')}.`;
}

/**
 * @param {Array<{ user?: string }>} entries
 */
export function uniqueActivityUsers(entries) {
  const s = new Set();
  entries.forEach((e) => {
    if (e.user && String(e.user).trim()) s.add(String(e.user).trim());
  });
  return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
}

/**
 * @param {Array} entries
 * @param {{
 *   period: ActivityLogPeriod;
 *   kind: 'all' | 'create' | 'modify' | 'close';
 *   user: string;
 *   module?: string;
 *   auditMode?: boolean;
 * }} opts
 */
export function filterActivityLogEntries(entries, opts) {
  const moduleKey =
    opts.module === undefined || opts.module === null
      ? ''
      : String(opts.module).trim();
  return entries.filter((e) => {
    if (!matchesActivityPeriod(e, opts.period)) return false;
    if (opts.kind !== 'all' && classifyEntryKindExtended(e) !== opts.kind) return false;
    if (opts.user && String(e.user || '').trim() !== opts.user) return false;
    if (moduleKey && moduleKey !== 'all') {
      if (moduleKey === 'iso') {
        if (e.module !== 'iso' && e.module !== 'iso-ai') return false;
      } else if (e.module !== moduleKey) {
        return false;
      }
    }
    if (opts.auditMode && !isActivityEntryAuditMode(e)) return false;
    return true;
  });
}

/**
 * @param {string} [moduleId]
 * @returns {string} hash sans #
 */
export function activityModuleHash(moduleId) {
  const map = {
    incidents: 'incidents',
    actions: 'actions',
    audits: 'audits',
    iso: 'iso',
    'iso-ai': 'iso',
    risks: 'risks',
    products: 'products',
    context: 'settings',
    system: 'settings',
    'ai-center': 'ai-center'
  };
  return map[moduleId] || 'dashboard';
}

/**
 * Repère une mention « action en retard » dans le journal (texte libre).
 * @param {{ module?: string; action?: string; detail?: string }} entry
 */
export function isActivityLateActionMention(entry) {
  if (entry.module !== 'actions') return false;
  const blob = `${entry.action || ''} ${entry.detail || ''}`.toLowerCase();
  return /retard|échéance|en retard|dépass|depass|overdue|late/i.test(blob);
}

/**
 * Repère une mention de non-conformité dans le libellé journal.
 * @param {{ action?: string; detail?: string }} entry
 */
export function isActivityNcMention(entry) {
  const blob = `${entry.action || ''} ${entry.detail || ''}`.toLowerCase();
  return /non[- ]?conform|nc ouverte|non-conformité|non conformité/i.test(blob);
}

/**
 * Mode audit : événements exploitables (correctifs, validations, audits, changements majeurs).
 * @param {{ module?: string; action?: string; detail?: string; entityType?: string; aiTraceType?: string; requirementId?: string }} entry
 */
export function isActivityEntryAuditMode(entry) {
  if (!entry || typeof entry !== 'object') return false;

  if (isActivityEntryCritical(entry)) return true;
  if (isActivityNcMention(entry) || isActivityLateActionMention(entry)) return true;

  if (entry.module === 'audits') return true;
  if (entry.module === 'actions') return true;

  if (entry.entityType === 'ai_suggestion') {
    const t = String(entry.aiTraceType || '');
    if (t === 'suggestion_generated') return false;
    return true;
  }

  const blob = `${entry.action || ''} ${entry.detail || ''}`.toLowerCase();

  if (entry.module === 'iso' || entry.module === 'iso-ai') {
    if (entry.entityType === 'iso_requirement') return true;
    if (
      /statut|validation|exigence|conformité|export|pdf|rapport|preuve|assistant|mise à jour.*exigence/i.test(
        blob
      )
    ) {
      return true;
    }
  }

  const k = classifyEntryKindExtended(entry);

  if (entry.module === 'incidents') {
    if (k === 'create' || k === 'close') return true;
    if (k === 'modify') {
      if (classifyActionImportance(entry.action) === 'high') return true;
      if (/gravité|critique|majeur|sévérité|élevé/i.test(blob)) return true;
      return false;
    }
  }

  if (entry.module === 'risks' && (k === 'create' || k === 'modify' || k === 'close')) return true;

  if (entry.module === 'products' && (k === 'modify' || k === 'close')) return true;

  return false;
}

/**
 * Jusqu’à `limit` événements « critiques » pour mise en avant (ordre conservé = antichro du flux).
 * @param {Array<{ module?: string; action?: string; detail?: string }>} entries
 * @param {number} [limit]
 */
export function pickCriticalSpotlightEntries(entries, limit = 3) {
  const out = [];
  for (const e of entries) {
    if (out.length >= limit) break;
    if (
      isActivityEntryCritical(e) ||
      isActivityLateActionMention(e) ||
      isActivityNcMention(e)
    ) {
      out.push(e);
    }
  }
  return out;
}

/**
 * Lignes courtes pour le bloc « Analyse du journal » (lecture ISO / pilotage).
 * @param {{
 *   incCreated: number;
 *   actMod: number;
 *   audLaunched: number;
 *   crit: number;
 *   actLate?: number;
 * }} counts
 * @param {{ total: number; lastActivity: string; recentModuleKeys: string[] }} snapshot
 * @param {string} periodLabel
 * @returns {string[]}
 */
export function buildJournalAnalysisLines(counts, snapshot, periodLabel) {
  const lines = [];
  const anomalie =
    (counts.crit || 0) + (counts.actLate || 0) > 0
      ? `${(counts.crit || 0) + (counts.actLate || 0)} signal(x) sensible(s) (${periodLabel}) : incidents critiques, retards ou NC mentionnés.`
      : `Aucune anomalie forte détectée sur ${periodLabel} avec les règles textuelles actuelles.`;
  lines.push(anomalie);

  lines.push(
    snapshot.total > 0
      ? `Activité : ${snapshot.total} entrée(s) affichée(s) · dernière trace : ${snapshot.lastActivity}.`
      : 'Activité : journal vide sur les filtres courants.'
  );

  const mods = snapshot.recentModuleKeys || [];
  const trend =
    mods.length > 0
      ? `Tendances : modules les plus actifs récemment : ${mods.slice(0, 4).map((k) => moduleMeta(k).label).join(', ')}.`
      : 'Tendances : pas assez de données pour une répartition modules.';
  lines.push(trend);

  return lines;
}
