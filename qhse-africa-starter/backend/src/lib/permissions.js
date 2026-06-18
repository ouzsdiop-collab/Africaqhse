/**
 * Matrice V1 — extensible. Verbes : read | write (write = création / mise à jour / assignation).
 * Sans en-tête X-User-Id, le middleware laisse passer (rétrocompatibilité).
 *
 * Phase 2 SaaS : granularité fine (site × module × action) pourra s’appuyer sur la même matrice
 * en ajoutant des sous-ressources (ex. controlled_documents:read:site) ou une table en base —
 * sans renommer les ressources actuelles tant que le front n’est pas migré.
 */

const ALL = ['read', 'write'];

/** @type {Record<string, Record<string, string[] | true>>} */
const MATRIX = {
  SUPER_ADMIN: { '*': true },
  ADMIN: { '*': true },
  CLIENT_ADMIN: {
    audit_logs: ['read'],
    settings: ['read'],
    incidents: ALL,
    risks: ALL,
    processes: ALL,
    actions: ALL,
    audits: ALL,
    nonconformities: ALL,
    habilitations: ALL,
    equipment: ALL,
    environmental: ALL,
    trainings: ALL,
    sites: ALL,
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ALL,
    controlled_documents: ALL,
    ptw: ALL,
    preventionPlans: ALL,
    regulatoryWatch: ALL,
    ai_suggestions: ALL,
    notifications: ['read'],
    users: ALL,
    reports: ALL,
    imports: ALL
  },
  QHSE: {
    audit_logs: ['read'],
    incidents: ALL,
    risks: ALL,
    processes: ALL,
    actions: ALL,
    audits: ALL,
    nonconformities: ALL,
    habilitations: ALL,
    equipment: ALL,
    environmental: ALL,
    trainings: ALL,
    sites: ALL,
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ALL,
    controlled_documents: ALL,
    ptw: ALL,
    preventionPlans: ALL,
    regulatoryWatch: ALL,
    ai_suggestions: ALL,
    notifications: ['read'],
    users: ALL,
    reports: ALL,
    imports: ALL
  },
  DIRECTION: {
    incidents: ['read'],
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    habilitations: ['read'],
    equipment: ['read'],
    environmental: ['read'],
    trainings: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ['read'],
    processes: ['read'],
    ptw: ['read'],
    preventionPlans: ['read'],
    regulatoryWatch: ['read'],
    controlled_documents: ['read'],
    ai_suggestions: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  MANAGER: {
    incidents: ['read'],
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    habilitations: ['read'],
    equipment: ['read'],
    environmental: ['read'],
    trainings: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ['read'],
    processes: ['read'],
    ptw: ['read'],
    preventionPlans: ['read'],
    regulatoryWatch: ['read'],
    controlled_documents: ['read'],
    ai_suggestions: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  AUDITEUR: {
    incidents: ['read'],
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    habilitations: ['read'],
    equipment: ['read'],
    environmental: ['read'],
    trainings: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ['read'],
    processes: ['read'],
    ptw: ['read'],
    preventionPlans: ['read'],
    regulatoryWatch: ['read'],
    controlled_documents: ['read'],
    ai_suggestions: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  ASSISTANT: {
    incidents: ALL,
    risks: ALL,
    processes: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ALL,
    habilitations: ALL,
    equipment: ALL,
    environmental: ALL,
    trainings: ALL,
    sites: ALL,
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ALL,
    controlled_documents: ALL,
    ptw: ALL,
    preventionPlans: ALL,
    ai_suggestions: ALL,
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ALL
  },
  TERRAIN: {
    incidents: ALL,
    risks: ALL,
    processes: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    habilitations: ['read'],
    equipment: ['read'],
    environmental: ['read'],
    trainings: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ['read'],
    ptw: ALL,
    preventionPlans: ALL,
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  OPERATEUR: {
    incidents: ALL,
    risks: ALL,
    processes: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    habilitations: ['read'],
    equipment: ['read'],
    environmental: ['read'],
    trainings: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  /** Rôle « utilisateur » standard — aligné sur OPERATEUR (création via cockpit super-admin). */
  USER: {
    incidents: ALL,
    risks: ALL,
    processes: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    habilitations: ['read'],
    equipment: ['read'],
    environmental: ['read'],
    trainings: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  }
};

/**
 * @param {string | null | undefined} role
 * @param {string} resource
 * @param {'read' | 'write'} verb
 */
export function can(role, resource, verb) {
  if (role === null || role === undefined) return true;
  const r = String(role).trim().toUpperCase();
  if (!r) return false;
  const row = MATRIX[r];
  if (!row) return false;
  if (row['*'] === true) return true;
  const perms = row[resource];
  if (perms === true) return true;
  if (!Array.isArray(perms)) return false;
  return perms.includes(verb);
}

export const PERMISSION_RESOURCES = [
  'audit_logs',
  'incidents',
  'risks',
  'actions',
  'audits',
  'nonconformities',
  'habilitations',
  'equipment',
  'environmental',
  'trainings',
  'preventionPlans',
  'regulatoryWatch',
  'sites',
  'dashboard',
  'compliance',
  'conformity',
  'ptw',
  'controlled_documents',
  'ai_suggestions',
  'notifications',
  'users',
  'reports',
  'imports',
  'processes'
];
