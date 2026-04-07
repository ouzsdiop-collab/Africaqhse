/**
 * Matrice G × P + outil de pilotage : priorités, raccourcis vers les cases occupées, filtre registre.
 */

import { escapeHtml } from '../utils/escapeHtml.js';

const GP_RE = /G\s*([1-5])\s*[×xX*]\s*P\s*([1-5])/;

export function parseRiskMatrixGp(meta) {
  const m = GP_RE.exec(String(meta ?? '').trim());
  if (!m) return null;
  const g = Number(m[1]);
  const p = Number(m[2]);
  if (!Number.isFinite(g) || !Number.isFinite(p)) return null;
  if (g < 1 || g > 5 || p < 1 || p > 5) return null;
  return { g, p };
}

export function riskScoreProduct(g, p) {
  return g * p;
}

export function riskTierFromGp(g, p) {
  const s = g * p;
  if (s >= 20) return 5;
  if (s >= 12) return 4;
  if (s >= 7) return 3;
  if (s >= 3) return 2;
  return 1;
}

const TIER_LABELS = {
  1: 'Faible',
  2: 'Modéré',
  3: 'Élevé',
  4: 'Très élevé',
  5: 'Critique'
};

export function riskLevelLabelFromTier(tier) {
  return TIER_LABELS[Math.min(5, Math.max(1, tier))] || '—';
}

export function riskCriticalityFromMeta(meta) {
  const gp = parseRiskMatrixGp(meta);
  if (!gp) return null;
  const product = riskScoreProduct(gp.g, gp.p);
  const tier = riskTierFromGp(gp.g, gp.p);
  return {
    g: gp.g,
    p: gp.p,
    product,
    tier,
    label: riskLevelLabelFromTier(tier)
  };
}

const P_TITLE = {
  1: 'Improbable',
  2: 'Rare',
  3: 'Occasionnelle',
  4: 'Probable',
  5: 'Fréquente'
};
const G_TITLE = {
  1: 'Négligeable',
  2: 'Mineure',
  3: 'Modérée',
  4: 'Majeure',
  5: 'Catastrophique'
};

function tierForCell(g, p) {
  return riskTierFromGp(g, p);
}

/** @param {Array<{ trend?: string }>} risks */
function trendArrowForRisks(risks) {
  if (!risks.length) return '';
  let up = 0;
  let down = 0;
  risks.forEach((r) => {
    const t = r?.trend;
    if (t === 'up') up += 1;
    else if (t === 'down') down += 1;
  });
  if (up > down) return '↑';
  if (down > up) return '↓';
  return '→';
}

/**
 * @param {object} opts
 * @param {(filter: { g: number, p: number } | null) => void} [opts.onFilterChange]
 * @param {'default'|'embedded'} [opts.variant] — `embedded` : libellés courts + espacements resserrés (panneau secondaire)
 * @param {boolean} [opts.showRiskDots] — pastilles par fiche dans chaque case (couleur = palier)
 * @param {(info: { g: number, p: number, count: number }) => void} [opts.onCellActivate] — après sélection d’une case avec fiches (ex. scroll registre)
 */
export function createRiskMatrixPanel(opts = {}) {
  const { onFilterChange, variant = 'default', showRiskDots = false, onCellActivate } = opts;

  const wrap = document.createElement('div');
  wrap.className =
    variant === 'embedded'
      ? 'risk-matrix-panel risk-matrix-panel--embedded'
      : 'risk-matrix-panel';

  const tool = document.createElement('div');
  tool.className = 'risk-matrix-tool';

  const toolHead = document.createElement('div');
  toolHead.className = 'risk-matrix-tool__head';
  toolHead.innerHTML =
    variant === 'embedded'
      ? '<strong class="risk-matrix-tool__title">Synthèse G×P</strong><p class="risk-matrix-tool__lede">Compteurs et pastilles filtrent le registre. Grille ci-dessous pour affiner par case.</p>'
      : '<strong class="risk-matrix-tool__title">Pilotage par criticité</strong><p class="risk-matrix-tool__lede">Les compteurs ci-dessous suivent vos fiches (G×P). Les pastilles ouvrent le filtre sur le registre — pas besoin de chercher la case dans la grille.</p>';

  const priorityRow = document.createElement('div');
  priorityRow.className = 'risk-matrix-priority-row';
  priorityRow.setAttribute('aria-label', 'Répartition par palier');

  const hotspotsSection = document.createElement('div');
  hotspotsSection.className = 'risk-matrix-hotspots-section';

  const hotspotsLabel = document.createElement('div');
  hotspotsLabel.className = 'risk-matrix-hotspots-section__label';
  hotspotsLabel.textContent = 'Raccourcis — cases avec fiches';

  const hotspots = document.createElement('div');
  hotspots.className = 'risk-matrix-hotspots';
  hotspots.setAttribute('role', 'toolbar');
  hotspots.setAttribute('aria-label', 'Filtrer par case G×P');

  const statusRow = document.createElement('div');
  statusRow.className = 'risk-matrix-status-row';

  const stats = document.createElement('p');
  stats.className = 'risk-matrix-panel__stats';
  stats.setAttribute('aria-live', 'polite');

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'btn btn-secondary risk-matrix-panel__reset';
  resetBtn.textContent = 'Tout afficher';
  resetBtn.hidden = true;

  statusRow.append(stats, resetBtn);

  hotspotsSection.append(hotspotsLabel, hotspots);
  tool.append(toolHead, priorityRow, hotspotsSection, statusRow);

  const gridWrap = document.createElement('div');
  gridWrap.className = 'risk-matrix-grid-wrap';

  const gridLabel = document.createElement('div');
  gridLabel.className = 'risk-matrix-grid-wrap__label';
  gridLabel.innerHTML =
    'Grille criticité <span class="risk-matrix-grid-wrap__hint">(survol : liste des fiches · densité relative au portefeuille)</span>';

  const grid = document.createElement('div');
  grid.className = 'risk-matrix-grid risk-matrix-grid--premium';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', 'Matrice gravité × probabilité');

  const cellTooltip = document.createElement('div');
  cellTooltip.className = 'risk-matrix-cell-tooltip';
  cellTooltip.setAttribute('role', 'tooltip');
  cellTooltip.hidden = true;
  gridWrap.style.position = 'relative';

  let tooltipHideTimer = 0;
  function hideCellTooltip() {
    cellTooltip.replaceChildren();
    cellTooltip.hidden = true;
  }
  function positionTooltipNear(btn) {
    const r = btn.getBoundingClientRect();
    const wr = gridWrap.getBoundingClientRect();
    const top = r.bottom - wr.top + gridWrap.scrollTop + 6;
    const left = Math.min(
      Math.max(8, r.left - wr.left + gridWrap.scrollLeft + r.width / 2 - 120),
      gridWrap.clientWidth - 248
    );
    cellTooltip.style.top = `${top}px`;
    cellTooltip.style.left = `${left}px`;
  }
  function fillCellTooltip(btn) {
    cellTooltip.replaceChildren();
    const n = Number(btn.dataset.count || '0');
    const g = Number(btn.dataset.g);
    const p = Number(btn.dataset.p);
    const prod = g * p;
    const tier = tierForCell(g, p);
    const lvl = riskLevelLabelFromTier(tier);
    const names = (btn.dataset.riskNames || '').split('\x1e').filter(Boolean);

    const titleEl = document.createElement('strong');
    titleEl.className = 'risk-matrix-cell-tooltip__title';
    titleEl.textContent = `G${g} × P${p}`;
    const metaEl = document.createElement('span');
    metaEl.className = 'risk-matrix-cell-tooltip__meta';
    metaEl.textContent = `Score ${prod} · ${lvl}`;
    cellTooltip.append(titleEl, metaEl);

    if (n > 0) {
      const countSpan = document.createElement('span');
      countSpan.className = 'risk-matrix-cell-tooltip__count';
      countSpan.textContent = `${n} risque(s)`;
      const previewKicker = document.createElement('span');
      previewKicker.className = 'risk-matrix-cell-tooltip__preview-kicker';
      previewKicker.textContent = 'Aperçu';
      const ul = document.createElement('ul');
      ul.className = 'risk-matrix-cell-tooltip__list';
      names.slice(0, 6).forEach((name, idx) => {
        const li = document.createElement('li');
        li.textContent = name;
        if (idx === 0) li.classList.add('risk-matrix-cell-tooltip__preview');
        ul.append(li);
      });
      if (names.length > 6) {
        const li = document.createElement('li');
        li.textContent = '…';
        ul.append(li);
      }
      const hint = document.createElement('span');
      hint.className = 'risk-matrix-cell-tooltip__hint';
      hint.textContent =
        'Clic : filtrer le registre ci-dessous · Actions liées dans le tableau';
      cellTooltip.append(countSpan, previewKicker, ul, hint);
    } else {
      const empty = document.createElement('span');
      empty.className = 'risk-matrix-cell-tooltip__empty';
      empty.textContent = `Aucune fiche — case ${lvl} (score théorique ${prod})`;
      cellTooltip.append(empty);
    }
  }
  grid.addEventListener('pointerenter', (e) => {
    const btn = e.target.closest('.risk-matrix-cell');
    if (!btn || !grid.contains(btn)) return;
    clearTimeout(tooltipHideTimer);
    fillCellTooltip(btn);
    cellTooltip.hidden = false;
    positionTooltipNear(btn);
  }, true);
  grid.addEventListener('pointerleave', (e) => {
    const related = e.relatedTarget;
    if (related && (cellTooltip === related || cellTooltip.contains(related))) return;
    tooltipHideTimer = window.setTimeout(hideCellTooltip, 120);
  });
  cellTooltip.addEventListener('pointerenter', () => clearTimeout(tooltipHideTimer));
  cellTooltip.addEventListener('pointerleave', () => {
    tooltipHideTimer = window.setTimeout(hideCellTooltip, 120);
  });

  const legend = document.createElement('div');
  legend.className = 'risk-matrix-legend';
  legend.innerHTML = `
    <span class="risk-matrix-legend__compact" title="Couleur selon score G×P (1–25)">
      <span class="risk-matrix-legend__compact-label">Palier</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--1">F</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--2">M</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--3">É</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--4">T</span>
      <span class="risk-matrix-legend__sw risk-matrix-legend__sw--5">C</span>
    </span>
  `;

  gridWrap.append(gridLabel, grid, cellTooltip);

  let activeFilter = null;
  /** @type {Array<{ title?: string, meta?: string }>} */
  let lastRisks = [];

  const cellButtons = new Map();

  function cellKey(g, p) {
    return `${g}-${p}`;
  }

  function selectCellFilter(g, p) {
    const btn = cellButtons.get(cellKey(g, p));
    const n = Number(btn?.dataset.count || '0');
    if (n === 0) return;
    activeFilter = { g, p };
    if (typeof onFilterChange === 'function') onFilterChange(activeFilter);
    if (typeof onCellActivate === 'function') onCellActivate({ g, p, count: n });
    sync();
  }

  function buildGrid() {
    grid.replaceChildren();
    cellButtons.clear();

    const corner = document.createElement('div');
    corner.className = 'risk-matrix-grid__corner risk-matrix-grid__corner--premium';
    corner.innerHTML =
      '<span class="risk-matrix-grid__corner-g">Gravité <small>↑ forte</small></span><span class="risk-matrix-grid__corner-p">Probabilité <small>→</small></span>';
    corner.title = 'Lignes : gravité 5 (haut) → 1. Colonnes : probabilité 1 → 5.';

    grid.append(corner);

    let cellIndex = 0;
    for (let p = 1; p <= 5; p++) {
      const h = document.createElement('div');
      h.className = 'risk-matrix-grid__colhead risk-matrix-grid__colhead--premium';
      h.innerHTML = `<span class="risk-matrix-grid__axis-main">P${p}</span><span class="risk-matrix-grid__axis-sub">${escapeHtml(P_TITLE[p])}</span>`;
      h.title = `Probabilité ${p}/5 — ${P_TITLE[p]}`;
      grid.append(h);
    }

    for (let g = 5; g >= 1; g--) {
      const rh = document.createElement('div');
      rh.className = 'risk-matrix-grid__rowhead risk-matrix-grid__rowhead--premium';
      rh.innerHTML = `<span class="risk-matrix-grid__axis-main">G${g}</span><span class="risk-matrix-grid__axis-sub">${escapeHtml(G_TITLE[g])}</span>`;
      rh.title = `Gravité ${g}/5 — ${G_TITLE[g]}`;
      grid.append(rh);

      for (let p = 1; p <= 5; p++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'risk-matrix-cell risk-matrix-cell--premium';
        btn.dataset.g = String(g);
        btn.dataset.p = String(p);
        btn.style.setProperty('--rm-stagger', String(cellIndex * 0.025));
        cellIndex += 1;
        const tier = tierForCell(g, p);
        btn.classList.add(`risk-matrix-cell--t${tier}`);
        const prod = g * p;
        btn.dataset.score = String(prod);
        btn.setAttribute(
          'aria-label',
          `Gravité ${g}, probabilité ${p}, score ${prod}, ${riskLevelLabelFromTier(tier)}`
        );
        btn.addEventListener('click', () => onCellClick(g, p));
        grid.append(btn);
        cellButtons.set(cellKey(g, p), btn);
      }
    }
  }

  function onCellClick(g, p) {
    const at = cellKey(g, p);
    const btn = cellButtons.get(at);
    const n = Number(btn?.dataset.count || '0');
    if (n === 0) {
      if (activeFilter && activeFilter.g === g && activeFilter.p === p) {
        activeFilter = null;
        if (typeof onFilterChange === 'function') onFilterChange(null);
        sync();
      }
      return;
    }
    if (activeFilter && activeFilter.g === g && activeFilter.p === p) {
      activeFilter = null;
    } else {
      activeFilter = { g, p };
    }
    if (typeof onFilterChange === 'function') onFilterChange(activeFilter);
    if (activeFilter && typeof onCellActivate === 'function' && n > 0) {
      onCellActivate({ g, p, count: n });
    }
    sync();
  }

  resetBtn.addEventListener('click', () => {
    activeFilter = null;
    if (typeof onFilterChange === 'function') onFilterChange(null);
    sync();
  });

  function sync() {
    const bucket = {};
    let unplaced = 0;
    for (let g = 1; g <= 5; g++) {
      for (let p = 1; p <= 5; p++) {
        bucket[cellKey(g, p)] = { titles: [], risks: [], gp: { g, p } };
      }
    }

    let zCrit = 0;
    let zElev = 0;
    let zLow = 0;

    lastRisks.forEach((r) => {
      const gp = parseRiskMatrixGp(r.meta);
      if (!gp) {
        unplaced += 1;
        return;
      }
      const c = riskCriticalityFromMeta(r.meta);
      if (c) {
        if (c.tier >= 5) zCrit += 1;
        else if (c.tier >= 3) zElev += 1;
        else zLow += 1;
      }
      const k = cellKey(gp.g, gp.p);
      if (!bucket[k]) return;
      const t = (r.title || 'Sans titre').trim();
      if (t) bucket[k].titles.push(t);
      bucket[k].risks.push(r);
    });

    let maxCellCount = 1;
    for (let gi = 1; gi <= 5; gi++) {
      for (let pi = 1; pi <= 5; pi++) {
        const nk = bucket[cellKey(gi, pi)].risks.length;
        if (nk > maxCellCount) maxCellCount = nk;
      }
    }

    priorityRow.replaceChildren();

    function addPriorityCard(classMod, value, label, hint) {
      const card = document.createElement('div');
      card.className = `risk-matrix-priority-card ${classMod}`;
      const v = document.createElement('span');
      v.className = 'risk-matrix-priority-card__value';
      v.textContent = String(value);
      const txt = document.createElement('div');
      txt.className = 'risk-matrix-priority-card__text';
      const lb = document.createElement('span');
      lb.className = 'risk-matrix-priority-card__label';
      lb.textContent = label;
      const ht = document.createElement('span');
      ht.className = 'risk-matrix-priority-card__hint';
      ht.textContent = hint;
      txt.append(lb, ht);
      card.append(v, txt);
      priorityRow.append(card);
    }

    addPriorityCard(
      'risk-matrix-priority-card--crit',
      zCrit,
      'Critique',
      'Palier max (score G×P ≥ 20)'
    );
    addPriorityCard(
      'risk-matrix-priority-card--warn',
      zElev,
      'Élevé',
      'Palier 3–4 (score 7 à 19)'
    );
    addPriorityCard(
      'risk-matrix-priority-card--ok',
      zLow,
      'Modéré / faible',
      'Palier 1–2 (score ≤ 6)'
    );

    if (unplaced > 0) {
      const card = document.createElement('div');
      card.className = 'risk-matrix-priority-card risk-matrix-priority-card--muted';
      const v = document.createElement('span');
      v.className = 'risk-matrix-priority-card__value';
      v.textContent = String(unplaced);
      const txt = document.createElement('div');
      txt.className = 'risk-matrix-priority-card__text';
      const lb = document.createElement('span');
      lb.className = 'risk-matrix-priority-card__label';
      lb.textContent = 'Sans G×P';
      const ht = document.createElement('span');
      ht.className = 'risk-matrix-priority-card__hint';
      ht.textContent = 'Non visibles sur la matrice';
      txt.append(lb, ht);
      card.append(v, txt);
      priorityRow.append(card);
    }

    hotspots.replaceChildren();
    const occupied = [];
    for (let g = 1; g <= 5; g++) {
      for (let p = 1; p <= 5; p++) {
        const k = cellKey(g, p);
        const n = bucket[k].risks.length;
        if (n > 0) {
          occupied.push({
            g,
            p,
            n,
            product: g * p,
            tier: tierForCell(g, p),
            titles: bucket[k].titles
          });
        }
      }
    }
    occupied.sort((a, b) => b.product - a.product || b.n - a.n);

    if (occupied.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'risk-matrix-hotspots-empty';
      empty.textContent =
        'Aucune fiche positionnée : renseignez G×P (ex. G3 × P4) sur chaque risque pour activer la matrice et ces raccourcis.';
      hotspots.append(empty);
    } else {
      occupied.forEach(({ g, p, n, product, tier, titles }) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `risk-matrix-hotspot-chip risk-matrix-hotspot-chip--t${tier}`;
        if (activeFilter && activeFilter.g === g && activeFilter.p === p) {
          chip.classList.add('risk-matrix-hotspot-chip--active');
        }
        chip.innerHTML = `<span class="risk-matrix-hotspot-chip__gp">G${g}×P${p}</span><span class="risk-matrix-hotspot-chip__mid"><strong>${escapeHtml(String(n))}</strong> fiche${n > 1 ? 's' : ''}</span><span class="risk-matrix-hotspot-chip__score">score ${escapeHtml(String(product))}</span>`;
        chip.title = `${riskLevelLabelFromTier(tier)} — ${titles.slice(0, 3).join(' · ')}${titles.length > 3 ? '…' : ''}`;
        chip.addEventListener('click', () => selectCellFilter(g, p));
        hotspots.append(chip);
      });
    }

    let placed = 0;
    for (let g = 1; g <= 5; g++) {
      for (let p = 1; p <= 5; p++) {
        const k = cellKey(g, p);
        const btn = cellButtons.get(k);
        if (!btn) continue;
        const { titles, risks: cellRisks } = bucket[k];
        const n = cellRisks.length;
        placed += n;
        btn.dataset.count = String(n);
        btn.classList.toggle('risk-matrix-cell--empty', n === 0);
        btn.classList.toggle('risk-matrix-cell--has-data', n > 0);
        btn.classList.toggle(
          'risk-matrix-cell--active',
          Boolean(activeFilter && activeFilter.g === g && activeFilter.p === p)
        );
        const prod = g * p;
        const lvl = riskLevelLabelFromTier(tierForCell(g, p));
        const heat = maxCellCount > 0 ? n / maxCellCount : 0;
        btn.style.setProperty('--rm-heat', String(heat));
        btn.dataset.riskNames = cellRisks.map((r) => (r.title || 'Sans titre').trim()).join('\x1e');
        btn.replaceChildren();
        const scoreEl = document.createElement('span');
        scoreEl.className = 'risk-matrix-cell__score';
        scoreEl.textContent = String(prod);
        btn.append(scoreEl);
        if (n > 0) {
          const mid = document.createElement('span');
          mid.className = 'risk-matrix-cell__mid';
          const countEl = document.createElement('span');
          countEl.className = 'risk-matrix-cell__count';
          countEl.textContent = String(n);
          const trendEl = document.createElement('span');
          trendEl.className = 'risk-matrix-cell__trend';
          trendEl.setAttribute('aria-hidden', 'true');
          trendEl.textContent = trendArrowForRisks(cellRisks);
          mid.append(countEl, trendEl);
          btn.append(mid);
          if (showRiskDots) {
            const dotWrap = document.createElement('span');
            dotWrap.className = 'risk-matrix-cell__dots';
            cellRisks.slice(0, 6).forEach((risk) => {
              const c = riskCriticalityFromMeta(risk.meta);
              const tierDot = c?.tier ?? 1;
              const d = document.createElement('span');
              d.className = `risk-matrix-cell__dot risk-matrix-cell__dot--t${tierDot}`;
              d.title = String(risk.title || 'Risque');
              dotWrap.append(d);
            });
            if (n > 6) {
              const more = document.createElement('span');
              more.className = 'risk-matrix-cell__dot-more';
              more.textContent = `+${n - 6}`;
              dotWrap.append(more);
            }
            btn.append(dotWrap);
          }
        } else {
          const trendEl = document.createElement('span');
          trendEl.className = 'risk-matrix-cell__trend risk-matrix-cell__trend--muted';
          trendEl.setAttribute('aria-hidden', 'true');
          trendEl.textContent = '—';
          btn.append(trendEl);
        }
        btn.setAttribute(
          'title',
          n === 0
            ? `Case G${g}×P${p} — score ${prod} (${lvl}) — vide`
            : `G${g}×P${p} — score ${prod} (${lvl}) — ${n} fiche(s). Clic : filtre registre et actions · second clic : tout afficher.`
        );
      }
    }

    const total = lastRisks.length;
    if (activeFilter) {
      const m = lastRisks.filter((r) => {
        const gp = parseRiskMatrixGp(r.meta);
        return gp && gp.g === activeFilter.g && gp.p === activeFilter.p;
      }).length;
      const sc = activeFilter.g * activeFilter.p;
      const lv = riskLevelLabelFromTier(riskTierFromGp(activeFilter.g, activeFilter.p));
      stats.textContent = `Liste filtrée : G${activeFilter.g}×P${activeFilter.p} · score ${sc} (${lv}) · ${m} fiche(s).`;
      resetBtn.hidden = false;
    } else {
      const parts = [`${total} fiche(s)`, `${placed} sur la matrice`];
      if (unplaced > 0) parts.push(`${unplaced} sans position`);
      stats.textContent = parts.join(' · ');
      resetBtn.hidden = true;
    }
  }

  buildGrid();
  wrap.append(tool, gridWrap, legend);

  return {
    element: wrap,
    setRisks(risks) {
      lastRisks = Array.isArray(risks) ? [...risks] : [];
      if (activeFilter) {
        const still = lastRisks.some((r) => {
          const gp = parseRiskMatrixGp(r.meta);
          return gp && gp.g === activeFilter.g && gp.p === activeFilter.p;
        });
        if (!still) {
          activeFilter = null;
          if (typeof onFilterChange === 'function') onFilterChange(null);
        }
      }
      sync();
    },
    clearFilter() {
      activeFilter = null;
      if (typeof onFilterChange === 'function') onFilterChange(null);
      sync();
    },
    getFilter() {
      return activeFilter;
    }
  };
}
