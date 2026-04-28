/**
 * Persistance JSON localStorage (paramètres) : extrait de pages/settings.js.
 */

import { showToast } from '../components/toast.js';

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    showToast('Paramètres enregistrés', 'success');
  } catch {
    showToast('Impossible d’enregistrer les paramètres', 'error');
  }
}
