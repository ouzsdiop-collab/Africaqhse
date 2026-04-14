/**
 * Bascule « Vue essentielle / Vue avancée » par page — persistance localStorage.
 * Les zones à masquer portent la classe `.qhse-page-advanced-only` sur le conteneur.
 */

const PREFIX = 'qhse.pageViewMode.';

/** @param {string} pageId */
export function getPageViewMode(pageId) {
  try {
    const v = localStorage.getItem(PREFIX + pageId);
    return v === 'advanced' ? 'advanced' : 'essential';
  } catch {
    return 'essential';
  }
}

/**
 * @param {string} pageId
 * @param {'essential' | 'advanced'} mode
 */
export function setPageViewMode(pageId, mode) {
  try {
    localStorage.setItem(PREFIX + pageId, mode === 'advanced' ? 'advanced' : 'essential');
  } catch {
    /* ignore */
  }
}

/**
 * @param {HTMLElement} pageRoot
 * @param {'essential' | 'advanced'} mode
 */
export function applyPageViewDataset(pageRoot, mode) {
  pageRoot.dataset.qhsePageView = mode;
}

/**
 * Barre de bascule — à placer en tête de page (après bannières éventuelles).
 * @param {{
 *   pageId: string;
 *   pageRoot: HTMLElement;
 *   hintEssential?: string;
 *   hintAdvanced?: string;
 *   onChange?: (mode: 'essential' | 'advanced') => void;
 * }} opts
 */
export function mountPageViewModeSwitch(opts) {
  const {
    pageId,
    pageRoot,
    hintEssential =
      'Essentiel : ce qui compte pour décider vite sur cette page — le reste est masqué (indépendant du mode global en haut à droite).',
    hintAdvanced =
      'Expert : filtres étendus, analyses, journaux et blocs avancés visibles sur cette page seulement.',
    onChange
  } = opts;

  let mode = getPageViewMode(pageId);
  applyPageViewDataset(pageRoot, mode);

  const bar = document.createElement('div');
  bar.className = 'qhse-page-view-bar';

  const inner = document.createElement('div');
  inner.className = 'qhse-page-view-bar__inner';

  const group = document.createElement('div');
  group.className = 'qhse-page-view-switch';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Vue de cette page : Essentiel ou Expert');

  const lab = document.createElement('span');
  lab.className = 'qhse-page-view-switch__label';
  lab.textContent = 'Cette page';

  function mkBtn(value, text) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'qhse-page-view-switch__btn';
    b.dataset.mode = value;
    b.textContent = text;
    return b;
  }

  const bEss = mkBtn('essential', 'Essentiel');
  const bAdv = mkBtn('advanced', 'Expert');

  const hint = document.createElement('p');
  hint.className = 'qhse-page-view-bar__hint';

  function syncPressed() {
    const isE = mode === 'essential';
    bEss.setAttribute('aria-pressed', isE ? 'true' : 'false');
    bAdv.setAttribute('aria-pressed', !isE ? 'true' : 'false');
    bEss.classList.toggle('qhse-page-view-switch__btn--on', isE);
    bAdv.classList.toggle('qhse-page-view-switch__btn--on', !isE);
    hint.textContent = isE ? hintEssential : hintAdvanced;
  }

  function setMode(m) {
    const next = m === 'advanced' ? 'advanced' : 'essential';
    if (next === mode) return;
    mode = next;
    setPageViewMode(pageId, mode);
    applyPageViewDataset(pageRoot, mode);
    syncPressed();
    onChange?.(mode);
  }

  bEss.addEventListener('click', () => setMode('essential'));
  bAdv.addEventListener('click', () => setMode('advanced'));

  group.append(lab, bEss, bAdv);
  inner.append(group, hint);
  bar.append(inner);
  syncPressed();

  return {
    bar,
    getMode: () => mode,
    setMode
  };
}
