/**
 * Mode exploration locale — données servies par interception qhseFetch lorsque le backend n’est pas utilisé.
 */

import { resetDemoRuntime } from './demoModeRuntime.service.js';

const STORAGE_KEY = 'qhse-demo-mode-v1';
/** Aligné sur notificationIntelligence.service.js — évite import circulaire. */
const NOTIF_SYNTH_READ_KEY = 'qhse-notif-synthetic-read-v1';

/**
 * Le mode exploration (données locales hors API) est réservé aux builds non production.
 * @returns {boolean}
 */
export function isDemoModeAllowed() {
  try {
    return Boolean(import.meta.env && import.meta.env.DEV);
  } catch {
    return true;
  }
}

/**
 * Désactive le stockage exploration en production et réinitialise l’état runtime associé.
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
