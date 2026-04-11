/**
 * Mode exploration locale — données servies par interception qhseFetch lorsque le backend n’est pas utilisé.
 */

import { resetDemoRuntime } from './demoModeRuntime.service.js';

const STORAGE_KEY = 'qhse-demo-mode-v1';
/** Aligné sur notificationIntelligence.service.js — évite import circulaire. */
const NOTIF_SYNTH_READ_KEY = 'qhse-notif-synthetic-read-v1';

/**
 * En production (`import.meta.env.PROD`), le mode exploration est désactivé par défaut.
 * Pour l’activer sur un build déployé : définir `VITE_ALLOW_DEMO_MODE=true` au build.
 * En développement, toujours autorisé.
 * @returns {boolean}
 */
export function isDemoModeAllowed() {
  try {
    if (import.meta.env?.DEV) return true;
    if (import.meta.env?.PROD && import.meta.env?.VITE_ALLOW_DEMO_MODE !== 'true') {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * En production sans `VITE_ALLOW_DEMO_MODE=true` : retire le flag local et le runtime démo.
 */
export function ensureProductionDemoModeOff() {
  if (isDemoModeAllowed()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  resetDemoRuntime();
}

/** @returns {boolean} */
export function isDemoMode() {
  if (!isDemoModeAllowed()) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** @param {boolean} on */
export function setDemoMode(on) {
  if (!isDemoModeAllowed()) return;
  try {
    if (on) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent('qhse-demo-mode-changed', { detail: { on: Boolean(on) } })
  );
}

export function toggleDemoMode() {
  setDemoMode(!isDemoMode());
}

/**
 * Réinitialise l’état local du scénario d’exploration (patches Kanban, lectures notif, overlay actions).
 */
export function resetDemoPresentation() {
  resetDemoRuntime();
  try {
    sessionStorage.removeItem('qhse-action-pilotage-overlay-v1');
    sessionStorage.removeItem(NOTIF_SYNTH_READ_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('qhse-demo-reset'));
  window.dispatchEvent(
    new CustomEvent('qhse-demo-mode-changed', { detail: { on: isDemoMode() } })
  );
}
