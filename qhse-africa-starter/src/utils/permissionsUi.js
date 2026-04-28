/**
 * Règles UI alignées sur backend/src/lib/permissions.js (V1 : à maintenir en parallèle).
 */

import { getDisplayMode } from './displayMode.js';
import { TERRAIN_ALLOWED_PAGE_IDS } from './terrainModePages.js';

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
    actions: ALL,
    audits: ALL,
    nonconformities: ALL,
    sites: ALL,
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ALL,
    controlled_documents: ALL,
    ptw: ALL,
    ai_suggestions: ALL,
    notifications: ['read'],
    users: ALL,
    reports: ALL,
    imports: ALL
  },
  QHSE: {
    audit_logs: ['read'],
    settings: ['read'],
    incidents: ALL,
    risks: ALL,
    actions: ALL,
    audits: ALL,
    nonconformities: ALL,
    sites: ALL,
    dashboard: ['read'],
    compliance: ['read'],
    controlled_documents: ALL,
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
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
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
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    conformity: ['read'],
    ptw: ['read'],
    controlled_documents: ['read'],
    ai_suggestions: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  USER: {
    settings: ['read'],
    incidents: ALL,
    risks: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  },
  ASSISTANT: {
    settings: ['read'],
    incidents: ALL,
    risks: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ALL,
    sites: ALL,
    dashboard: ['read'],
    compliance: ['read'],
    controlled_documents: ALL,
    ai_suggestions: ALL,
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ALL
  },
  TERRAIN: {
    settings: ['read'],
    incidents: ALL,
    risks: ALL,
    actions: ['read'],
    audits: ['read'],
    nonconformities: ['read'],
    sites: ['read'],
    dashboard: ['read'],
    compliance: ['read'],
    notifications: ['read'],
    users: ['read'],
    reports: ['read'],
    imports: ['read']
  }
};

/**
 * Menu profil TERRAIN en mode Expert : accès à tous les modules de la navigation métier
 * (le mode global Essentiel réduit via {@link TERRAIN_ALLOWED_PAGE_IDS} + filtre sidebar).
 */
const TERRAIN_NAV_EXPERT_PAGES = new Set([
  'dashboard',
  'mines-demo',
  'terrain-mode',
  'analytics',
  'performance',
  'activity-log',
  'audits',
  'incidents',
  'permits',
  'risks',
  'actions',
  'iso',
  'products',
  'habilitations',
  'ai-center',
  'settings',
  'sites',
  'imports'
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
  const r = String(role).toUpperCase();
  if (pageId === 'saas-clients' && r !== 'SUPER_ADMIN') return false;
  if (pageId === 'first-password') return true;
  if (r === 'TERRAIN') {
    return getDisplayMode() === 'terrain'
      ? TERRAIN_ALLOWED_PAGE_IDS.has(pageId)
      : TERRAIN_NAV_EXPERT_PAGES.has(pageId);
  }
  return true;
}
