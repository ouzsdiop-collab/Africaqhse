const STORAGE_KEY = 'qhse-display-mode';

function rootEl() {
  return document.documentElement;
}

export function getDisplayMode() {
  const v = rootEl().getAttribute('data-display-mode');
  if (v === 'terrain' || v === 'expert') return v;
  if (v === 'simple') return 'terrain';
  return 'expert';
}

export function setDisplayMode(mode) {
  const m = mode === 'terrain' ? 'terrain' : 'expert';
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
    if (s === 'terrain' || s === 'expert') m = s;
    if (s === 'simple') m = 'terrain';
  } catch {
    /* ignore */
  }
  setDisplayMode(m);
}
