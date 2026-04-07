/**
 * Règles UI alignées sur backend/src/lib/permissions.js (V1 — à maintenir en parallèle).
 */

const ALL = ['read', 'write'];

/** @type {Record<string, Record<string, string[] | true>>} */
const MATRIX = {
  ADMIN: { '*': true },
  QHSE: {
    settings: ['read'],
    incidents: ALL,
    actions: ALL,
    audits: ALL,
    nonconformities: ALL,
    sites: ALL,
    dashboard: ['read'],
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
    sites: ['read'],
    dashboard: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  ASSISTANT: {
    settings: ['read'],
    incidents: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ALL,
    sites: ALL,
    dashboard: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ALL
  },
  TERRAIN: {
    settings: ['read'],
    incidents: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  }
};

/** Navigation restreinte pour TERRAIN (modules terrain + suivi actions). */
const TERRAIN_PAGES = new Set([
  'dashboard',
  'terrain-mode',
  'incidents',
  'permits',
  'actions',
  'settings'
]);

/**
 * @param {string | null | undefined} role
 * @param {string} resource
 * @param {'read' | 'write'} verb
 */
export function canResource(role, resource, verb) {
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

/**
 * @param {string | null | undefined} role
 * @param {string} pageId
 */
export function canAccessNavPage(role, pageId) {
  if (!role) return true;
  if (String(role).toUpperCase() === 'TERRAIN') {
    return TERRAIN_PAGES.has(pageId);
  }
  return true;
}
