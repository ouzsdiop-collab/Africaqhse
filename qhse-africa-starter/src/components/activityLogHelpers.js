/**
 * Métadonnées modules — un seul endroit pour labels / styles (badges).
 * Les filtres / tri futurs pourront réutiliser ces clés.
 */
export const MODULE_META = {
  incidents: { label: 'Incidents', short: 'INC', className: 'mod-incidents' },
  actions: { label: 'Actions', short: 'ACT', className: 'mod-actions' },
  audits: { label: 'Audits', short: 'AUD', className: 'mod-audits' },
  iso: { label: 'Conformité ISO', short: 'ISO', className: 'mod-iso' },
  products: { label: 'Produits / FDS', short: 'PRD', className: 'mod-products' },
  context: { label: 'Contexte site', short: 'CTX', className: 'mod-context' },
  system: { label: 'Système', short: 'SYS', className: 'mod-system' },
  'ai-center': { label: 'Centre IA', short: 'IA', className: 'mod-ai-center' }
};

export function moduleMeta(moduleId) {
  return MODULE_META[moduleId] || { label: moduleId || '—', short: '—', className: 'mod-default' };
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
  const lastActivity = total ? entries[0].timestamp || '—' : '—';

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
 * Filtre temporel best-effort sur l’horodatage affiché (données locales / mock).
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
    const k = classifyEntryKind(e.action);
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
 *   criticalOnly: boolean;
 * }} opts
 */
export function filterActivityLogEntries(entries, opts) {
  return entries.filter((e) => {
    if (!matchesActivityPeriod(e, opts.period)) return false;
    if (opts.kind !== 'all' && classifyEntryKind(e.action) !== opts.kind) return false;
    if (opts.user && String(e.user || '').trim() !== opts.user) return false;
    if (opts.criticalOnly && !isActivityEntryCritical(e)) return false;
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
    products: 'products',
    context: 'settings',
    system: 'settings',
    'ai-center': 'ai-center'
  };
  return map[moduleId] || 'dashboard';
}
