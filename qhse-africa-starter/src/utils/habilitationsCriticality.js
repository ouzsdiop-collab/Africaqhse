/**
 * Tri et scoring criticité : pilotage terrain (sans backend).
 * Ordre : expiré → urgence calendaire → justificatif manquant → statut fragile.
 */

import { habDaysUntil } from '../data/habilitationsDemo.js';

/** @param {{ statut?: string; expiration?: string; justificatif?: boolean; remarques?: string }} r */
export function habRowIsBlockedCritical(r) {
  const st = String(r?.statut || '');
  if (st === 'expiree' || st === 'suspendue') return true;
  const rem = String(r?.remarques || '').toLowerCase();
  return rem.includes('bloqué') || rem.includes('bloque');
}

/**
 * Score bas (plus critique en premier). Pour tri `sort()`.
 * @param {Record<string, unknown>} r
 */
export function habCriticalityScore(r) {
  const d = habDaysUntil(r.expiration);
  const st = String(r?.statut || '');
  if (st === 'expiree' || d < 0) return 0;
  if (d <= 7) return 1;
  if (d <= 30 || st === 'expire_bientot') return 2;
  if (!r.justificatif) return 3;
  if (st === 'suspendue') return 4;
  if (st === 'incomplete') return 5;
  if (st === 'en_attente') return 6;
  return 100 + Math.min(d, 999);
}

/** @param {Record<string, unknown>[]} rows */
export function sortHabilitationsByCriticality(rows) {
  return [...rows].sort((a, b) => habCriticalityScore(a) - habCriticalityScore(b));
}
