/**
 * Bandeau d’aide « vue simplifiée » — la visibilité est pilotée par
 * `[data-display-mode="simple"]` dans displayModes.css (pas de logique métier).
 */

/**
 * @param {{ title?: string, hint?: string, nextStep?: string }} copy
 * @returns {HTMLElement}
 */
export function createSimpleModeGuide(copy = {}) {
  const { title, hint, nextStep } = copy;
  const aside = document.createElement('aside');
  aside.className = 'qhse-simple-guide';
  aside.setAttribute('role', 'note');
  aside.setAttribute('aria-label', 'Guide — vue simplifiée');

  if (title) {
    const t = document.createElement('p');
    t.className = 'qhse-simple-guide__title';
    t.textContent = title;
    aside.append(t);
  }
  if (hint) {
    const h = document.createElement('p');
    h.className = 'qhse-simple-guide__hint';
    h.textContent = hint;
    aside.append(h);
  }
  if (nextStep) {
    const n = document.createElement('p');
    n.className = 'qhse-simple-guide__next';
    n.textContent = nextStep;
    aside.append(n);
  }

  return aside;
}
