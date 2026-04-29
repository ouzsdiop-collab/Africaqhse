/**
 * Configuration locale : accès renforcé par code.
 * Compatible futur branchement API : mêmes clés et formes d’objet.
 */

export const LS_SENSITIVE_ACCESS = 'qhse_cfg_sensitive_access_v1';
export const LS_SENSITIVE_PIN = 'qhse_sensitive_access_pin_v1';
const SK_SESSION_OK = 'qhse_sa_session_ok';
const SK_LAST_OK = 'qhse_sa_last_ok_ts';

/** @typedef {'always' | 'per_session' | 'interval_15m'} SensitiveAccessFrequency */
/** @typedef {'standard' | 'strict'} SensitiveAccessProtection */

/**
 * @type {{
 *   enabled: boolean;
 *   protectionLevel: SensitiveAccessProtection;
 *   frequency: SensitiveAccessFrequency;
 *   actions: Record<string, boolean>;
 * }}
 */
export const DEFAULT_SENSITIVE_ACCESS = {
  enabled: false,
  protectionLevel: 'standard',
  /** Par défaut : une seule saisie par onglet. Limite la lourdeur UX. */
  frequency: 'per_session',
  actions: {
    confidential_document: true,
    export_sensitive: true,
    critical_validation: true,
    /** Simulations IA fréquentes : désactivé par défaut, activable dans Paramètres. */
    security_zone: false,
    sensitive_mutation: true
  }
};

/** Libellés pour Paramètres (aucune logique métier). */
export const SENSITIVE_ACCESS_ACTION_META = [
  {
    key: 'confidential_document',
    label: 'Documents confidentiels',
    hint: 'Validation d’import / rattachement de preuves sensibles.'
  },
  {
    key: 'export_sensitive',
    label: 'Exports de rapports sensibles',
    hint: 'PDF audit, reporting périodique, exports CSV liés aux constats.'
  },
  {
    key: 'critical_validation',
    label: 'Validation d’actions critiques',
    hint: 'Changement de statut d’exigence depuis l’assistance conformité.'
  },
  {
    key: 'security_zone',
    label: 'Zones synthèse et analyses',
    hint: 'Lancement d’analyses ou de scénarios depuis Synthèse et assistance : désactivé par défaut (usage fréquent).'
  },
  {
    key: 'sensitive_mutation',
    label: 'Enregistrements sensibles après import',
    hint: 'Confirmation d’import vers la base (incidents, audits, etc.).'
  }
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

/** @returns {typeof DEFAULT_SENSITIVE_ACCESS} */
export function loadSensitiveAccessConfig() {
  const raw = readJson(LS_SENSITIVE_ACCESS, {});
  const actions = { ...DEFAULT_SENSITIVE_ACCESS.actions, ...(raw.actions || {}) };
  return {
    enabled: Boolean(raw.enabled),
    protectionLevel:
      raw.protectionLevel === 'strict' ? 'strict' : DEFAULT_SENSITIVE_ACCESS.protectionLevel,
    frequency: ['always', 'per_session', 'interval_15m'].includes(raw.frequency)
      ? raw.frequency
      : DEFAULT_SENSITIVE_ACCESS.frequency,
    actions
  };
}

/** @param {typeof DEFAULT_SENSITIVE_ACCESS} cfg */
export function saveSensitiveAccessConfig(cfg) {
  try {
    localStorage.setItem(LS_SENSITIVE_ACCESS, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

/** @returns {string} code 6 chiffres ou chaîne vide */
export function loadSensitiveAccessPin() {
  try {
    const p = localStorage.getItem(LS_SENSITIVE_PIN);
    return p && /^\d{6}$/.test(p) ? p : '';
  } catch {
    return '';
  }
}

/** @param {string} pin */
export function saveSensitiveAccessPin(pin) {
  try {
    if (pin && /^\d{6}$/.test(pin)) {
      localStorage.setItem(LS_SENSITIVE_PIN, pin);
    } else {
      localStorage.removeItem(LS_SENSITIVE_PIN);
    }
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} actionKey
 * @param {ReturnType<typeof loadSensitiveAccessConfig>} cfg
 */
export function isSensitiveActionEnabled(actionKey, cfg) {
  return Boolean(cfg.actions[actionKey]);
}

/**
 * @param {ReturnType<typeof loadSensitiveAccessConfig>} cfg
 */
export function shouldPromptSensitiveAccess(cfg) {
  if (!cfg.enabled) return false;
  if (!loadSensitiveAccessPin()) return true;

  if (cfg.frequency === 'always') return true;

  try {
    if (cfg.frequency === 'per_session') {
      return sessionStorage.getItem(SK_SESSION_OK) !== '1';
    }
    if (cfg.frequency === 'interval_15m') {
      const ts = Number(sessionStorage.getItem(SK_LAST_OK));
      if (!Number.isFinite(ts)) return true;
      return Date.now() - ts > 15 * 60 * 1000;
    }
  } catch {
    return true;
  }
  return true;
}

/** @param {ReturnType<typeof loadSensitiveAccessConfig>} cfg */
export function recordSensitiveAccessSuccess(cfg) {
  try {
    if (cfg.frequency === 'per_session') {
      sessionStorage.setItem(SK_SESSION_OK, '1');
    }
    if (cfg.frequency === 'interval_15m') {
      sessionStorage.setItem(SK_LAST_OK, String(Date.now()));
    }
  } catch {
    /* ignore */
  }
}

/** Réinitialise l’exemption de session (désactivation du renfort ou changement de code). */
export function clearSensitiveAccessSessionCache() {
  try {
    sessionStorage.removeItem(SK_SESSION_OK);
    sessionStorage.removeItem(SK_LAST_OK);
  } catch {
    /* ignore */
  }
}
