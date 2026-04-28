const STORAGE_KEY = 'qhse-display-mode';

/** Aligné sur les breakpoints shell mobile (flat-app, topbar). */
export const VIEWPORT_TERRAIN_ONLY_MQ = '(max-width: 1024px)';

function rootEl() {
  return document.documentElement;
}

function readStoredDisplayMode() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'terrain' || s === 'expert') return s;
    if (s === 'simple') return 'terrain';
  } catch {
    /* ignore */
  }
  return 'expert';
}

/**
 * Mobile : toujours mode Essentiel (`terrain`). Évite le mode Expert et ses layouts bureau.
 * Bureau : préférence utilisateur (localStorage).
 */
export function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(VIEWPORT_TERRAIN_ONLY_MQ).matches;
}

export function applyEffectiveDisplayMode() {
  const stored = readStoredDisplayMode();
  const effective = isMobileViewport() ? 'terrain' : stored;
  rootEl().setAttribute('data-display-mode', effective);
}

/**
 * @returns {'terrain' | 'expert'}
 */
export function getDisplayMode() {
  const v = rootEl().getAttribute('data-display-mode');
  if (v === 'terrain' || v === 'expert') return v;
  if (v === 'simple') return 'terrain';
  return isMobileViewport() ? 'terrain' : 'expert';
}

export function setDisplayMode(mode) {
  const m = mode === 'terrain' ? 'terrain' : 'expert';
  try {
    localStorage.setItem(STORAGE_KEY, m);
  } catch {
    /* ignore */
  }
  applyEffectiveDisplayMode();
}

export function initDisplayMode() {
  applyEffectiveDisplayMode();
}

/**
 * Recalcule le mode effectif (ex. passage mobile ↔ bureau) et notifie pour re-render.
 * @param {() => void} listener
 * @returns {() => void} désabonnement
 */
export function subscribeDisplayModeViewport(listener) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mq = window.matchMedia(VIEWPORT_TERRAIN_ONLY_MQ);
  const onChange = () => {
    applyEffectiveDisplayMode();
    listener();
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
