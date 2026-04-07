/**
 * Mode démo — présentation client sans dépendre du backend (données servies par qhseFetch).
 */

import { resetDemoRuntime } from './demoModeRuntime.service.js';

const STORAGE_KEY = 'qhse-demo-mode-v1';
/** Aligné sur notificationIntelligence.service.js — évite import circulaire. */
const NOTIF_SYNTH_READ_KEY = 'qhse-notif-synthetic-read-v1';

/** @returns {boolean} */
export function isDemoMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** @param {boolean} on */
export function setDemoMode(on) {
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
 * Réinitialise l’état local du scénario démo (patches Kanban, lectures notif, overlay actions).
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
