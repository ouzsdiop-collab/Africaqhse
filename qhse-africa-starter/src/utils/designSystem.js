/**
 * Aligné sur src/styles/design-tokens.css : utile pour SVG inline, canvas ou exports PDF côté front.
 * Import optionnel ; aucune page existante ne dépend de ce module.
 */
export const dsChart = {
  linePrimary: 'rgba(82, 148, 247, 0.88)',
  lineSecondary: 'rgba(61, 184, 154, 0.78)',
  areaFill: 'rgba(82, 148, 247, 0.22)',
  gridStroke: 'rgba(148, 163, 184, 0.12)',
  donutTrack: 'rgba(255, 255, 255, 0.06)'
};

export const dsAlertTone = {
  success: 'ds-alert--success',
  error: 'ds-alert--error',
  info: 'ds-alert--info',
  warning: 'ds-alert--warning'
};

/**
 * Carte placeholder animée (chargement).
 * @param {number} [lines=3]
 * @returns {HTMLDivElement}
 */
export function createSkeletonCard(lines = 3) {
  const card = document.createElement('div');
  card.className = 'skeleton-card';
  const n = Math.max(0, Math.floor(Number(lines)) || 3);
  for (let i = 0; i < n; i++) {
    const bar = document.createElement('div');
    bar.className = 'skeleton-bar';
    if (i === n - 1) bar.style.marginBottom = '0';
    card.append(bar);
  }
  return card;
}

/**
 * Bloc d’état vide cohérent avec le design system.
 * @param {string} icon Texte ou glyphe affiché en en-tête
 * @param {string} title
 * @param {string} subtitle
 * @param {string} [ctaLabel]
 * @param {() => void} [ctaAction]
 * @returns {HTMLDivElement}
 */
export function createEmptyState(icon, title, subtitle, ctaLabel, ctaAction) {
  const root = document.createElement('div');
  root.className = 'empty-state';
  const iconEl = document.createElement('div');
  iconEl.className = 'empty-state__icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icon;
  root.append(iconEl);
  const h = document.createElement('h3');
  h.className = 'empty-state__title';
  h.textContent = title;
  root.append(h);
  if (subtitle) {
    const p = document.createElement('p');
    p.className = 'empty-state__subtitle';
    p.textContent = subtitle;
    root.append(p);
  }
  if (ctaLabel && typeof ctaAction === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary empty-state__cta';
    btn.textContent = ctaLabel;
    btn.addEventListener('click', () => ctaAction());
    root.append(btn);
  }
  return root;
}
