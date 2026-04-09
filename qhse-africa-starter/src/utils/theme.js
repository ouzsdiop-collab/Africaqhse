const STORAGE_KEY = 'qhse.theme';

/** @typedef {'light' | 'dark'} QhseTheme */

export const THEME_CHANGED_EVENT = 'qhse-theme-changed';

/** @returns {QhseTheme} */
export function getStoredThemePreference() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return 'dark';
}

/** @returns {QhseTheme} */
export function getTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return getStoredThemePreference();
}

/**
 * @param {QhseTheme} theme
 * @param {{ persist?: boolean }} [opts]
 */
export function applyTheme(theme, { persist = true } = {}) {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta instanceof HTMLMetaElement) {
    meta.content = theme === 'light' ? '#eef1f7' : '#0f172a';
  }
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme } }));
}

export function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  if (typeof window === 'undefined') return;
  applyTheme(getStoredThemePreference(), { persist: false });
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    if (e.newValue === 'light' || e.newValue === 'dark') {
      applyTheme(e.newValue, { persist: false });
    }
  });
}
