const STORAGE_KEY = 'qhse-display-mode';

function rootEl() {
  return document.documentElement;
}

export function getDisplayMode() {
  const v = rootEl().getAttribute('data-display-mode');
  if (v === 'simple' || v === 'expert') return v;
  return 'expert';
}

export function setDisplayMode(mode) {
  const m = mode === 'simple' ? 'simple' : 'expert';
  rootEl().setAttribute('data-display-mode', m);
  try {
    localStorage.setItem(STORAGE_KEY, m);
  } catch {
    /* ignore */
  }
}

export function initDisplayMode() {
  let m = 'expert';
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'simple' || s === 'expert') m = s;
  } catch {
    /* ignore */
  }
  setDisplayMode(m);
}
