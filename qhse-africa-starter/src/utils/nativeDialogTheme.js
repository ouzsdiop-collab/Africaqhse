/**
 * Aligne scrollbars / contrôles natifs du <dialog> sur le thème actif (clair / sombre).
 * @param {HTMLElement} dialog
 */
export function applyNativeDialogColorScheme(dialog) {
  if (!(dialog instanceof HTMLElement)) return;
  const themeAttr = document.documentElement.getAttribute('data-theme');
  const useDark =
    themeAttr === 'dark' ||
    (themeAttr !== 'light' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  dialog.style.colorScheme = useDark ? 'dark' : 'light';
}
