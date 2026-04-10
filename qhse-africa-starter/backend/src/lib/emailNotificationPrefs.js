/**
 * Préférences d’envoi e-mail (mémoire processus — redémarrage = défauts).
 * À terme : persistance base / tenant.
 */
const defaults = {
  criticalIncidents: true,
  actionOverdue: true,
  auditScheduled: true,
  weeklySummary: true
};

/** @type {typeof defaults} */
let prefs = { ...defaults };

export function getEmailNotificationPrefs() {
  return { ...prefs };
}

/**
 * @param {Partial<typeof defaults>} patch
 */
export function setEmailNotificationPrefs(patch) {
  if (!patch || typeof patch !== 'object') return getEmailNotificationPrefs();
  for (const k of Object.keys(defaults)) {
    if (k in patch && typeof patch[k] === 'boolean') {
      prefs[k] = patch[k];
    }
  }
  return getEmailNotificationPrefs();
}
