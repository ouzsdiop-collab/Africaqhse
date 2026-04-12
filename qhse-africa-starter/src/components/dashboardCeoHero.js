/**
 * Bloc principal « Direction / CEO » : score | colonne principale (intro + accès rapide + graphique audits).
 */

import { buildMonthlyAuditScoreAvgSeries } from './dashboardCharts.js';
import {
  ceoGlobalStatusLabel,
  computeQhseGlobalScore,
  qhseScorePresentation
} from '../utils/dashboardDecisionLayer.js';

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

function prefersChartMotionReduced() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Entrée « premium » : tracé de la courbe, fondu de l’aire, points en cascade, quadrillage.
 * @param {SVGSVGElement} svg
 */
function initCeoAuditTrendAnimations(svg) {
  if (!svg || prefersChartMotionReduced()) return;

  const line = svg.querySelector('.dashboard-ceo-hero__prime-line');
  const area = svg.querySelector('.dashboard-ceo-hero__prime-area');
  const dots = [...svg.querySelectorAll('.dashboard-ceo-hero__prime-dot')];
  const grids = [...svg.querySelectorAll('.dashboard-ceo-hero__prime-grid')];
  const target = svg.querySelector('.dashboard-ceo-hero__prime-target-line');
  const targetLabel = svg.querySelector('.dashboard-ceo-hero__prime-target-label');

  const pathLen =
    line && typeof line.getTotalLength === 'function' ? line.getTotalLength() : 0;
  if (pathLen < 1) {
    if (area) area.setAttribute('opacity', '1');
    grids.forEach((g) => g.setAttribute('opacity', '1'));
    if (target) target.setAttribute('opacity', '1');
    if (targetLabel) targetLabel.setAttribute('opacity', '1');
    dots.forEach((d) => {
      d.setAttribute('r', '5');
      d.setAttribute('opacity', '1');
    });
    return;
  }

  if (line) {
    line.style.strokeDasharray = String(pathLen);
    line.style.strokeDashoffset = String(pathLen);
  }
  if (area) {
    area.setAttribute('opacity', '0');
  }
  grids.forEach((g) => g.setAttribute('opacity', '0'));
  if (target) target.setAttribute('opacity', '0');
  if (targetLabel) targetLabel.setAttribute('opacity', '0');
  dots.forEach((d) => {
    d.setAttribute('r', '0');
    d.setAttribute('opacity', '0');
  });

  const tLine = 780;
  const tArea = 520;
  const t0 = performance.now();

  function frame(now) {
    const elapsed = now - t0;
    const tLineP = Math.min(1, elapsed / tLine);
    const eLine = easeOutCubic(tLineP);

    if (line) {
      line.style.strokeDashoffset = String(pathLen * (1 - eLine));
    }

    const tAreaP = Math.min(1, Math.max(0, elapsed - 120) / tArea);
    if (area) {
      area.setAttribute('opacity', String(0.08 + 0.92 * easeOutCubic(tAreaP)));
    }

    const tGrid = Math.min(1, elapsed / 340);
    const eg = easeOutCubic(tGrid);
    grids.forEach((g) => g.setAttribute('opacity', String(0.35 + 0.65 * eg)));

    const tTgt = Math.min(1, Math.max(0, elapsed - 200) / 420);
    const eTgt = easeOutCubic(tTgt);
    if (target) target.setAttribute('opacity', String(0.5 + 0.5 * eTgt));
    if (targetLabel) targetLabel.setAttribute('opacity', String(0.65 + 0.35 * eTgt));

    dots.forEach((d, i) => {
      const start = 320 + i * 72;
      const td = Math.min(1, Math.max(0, elapsed - start) / 340);
      const ed = easeOutCubic(td);
      d.setAttribute('r', String(4.8 * ed));
      d.setAttribute('opacity', String(ed));
    });

    if (elapsed < tLine + 520) {
      requestAnimationFrame(frame);
    } else {
      if (line) {
        line.style.strokeDasharray = '';
        line.style.strokeDashoffset = '';
      }
    }
  }

  requestAnimationFrame(frame);
}

function buildCeoScoreArc(score, tone) {
  const w = 200;
  const h = 112;
  const r = 78;
  const cx = w / 2;
  const cy = h - 12;
  const stroke =
    tone === 'ok'
      ? 'rgba(52,211,153,.95)'
      : tone === 'watch'
        ? 'rgba(251,191,36,.95)'
        : 'rgba(248,113,113,.95)';
  const track = 'rgba(148,163,184,.18)';
  const circumference = Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'dashboard-ceo-hero__svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-hidden', 'true');

  const arcBg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arcBg.setAttribute('d', `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`);
  arcBg.setAttribute('fill', 'none');
  arcBg.setAttribute('stroke', track);
  arcBg.setAttribute('stroke-width', '12');
  arcBg.setAttribute('stroke-linecap', 'round');

  const arcFg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arcFg.setAttribute('d', `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`);
  arcFg.setAttribute('fill', 'none');
  arcFg.setAttribute('stroke', stroke);
  arcFg.setAttribute('stroke-width', '12');
  arcFg.setAttribute('stroke-linecap', 'round');
  arcFg.setAttribute('stroke-dasharray', `${dash} ${circumference}`);

  svg.append(arcBg, arcFg);
  return svg;
}

/**
 * Tendance scores d’audit (moyenne mensuelle 0–100) — axe fixe, pas de doublon avec la courbe incidents.
 * @param {{ label: string; value: number }[]} series
 * @param {string} gradId id unique pour les définitions SVG (dégradés / filtres)
 */
function buildCeoAuditTrendSvg(series, gradId) {
  const safe =
    Array.isArray(series) && series.length
      ? series
      : [{ label: '—', value: 0 }];
  const vals = safe.map((s) => Math.max(0, Math.min(100, Number(s.value) || 0)));
  const monthHasAudits = (i) =>
    typeof safe[i]?.count === 'number' ? safe[i].count > 0 : vals[i] > 0;
  const w = 640;
  const h = 132;
  const padL = 36;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const n = vals.length;
  const step = n <= 1 ? 0 : plotW / Math.max(1, n - 1);

  const yAt = (v100) => padT + plotH - (Math.max(0, Math.min(100, v100)) / 100) * plotH;
  const pts = vals.map((v, i) => {
    const x = padL + i * step;
    return [x, yAt(v)];
  });

  const lineD = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ');
  const last = pts[pts.length - 1];
  const first = pts[0];
  const floorY = h - padB;
  const areaD = `${lineD} L ${last[0].toFixed(1)} ${floorY} L ${first[0].toFixed(1)} ${floorY} Z`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'dashboard-ceo-hero__prime-svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'img');
  const nonZero = vals.filter((v) => v > 0);
  const avg =
    nonZero.length > 0
      ? Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 10) / 10
      : null;
  svg.setAttribute(
    'aria-label',
    avg != null
      ? `Évolution du score d’audit moyen par mois sur six mois. Moyenne des mois renseignés : ${avg} pour cent.`
      : 'Aucun score d’audit renseigné sur les six derniers mois.'
  );

  const strokeGradId = `${gradId}-stroke`;
  const filterGlowId = `${gradId}-glow`;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  const filterGlow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filterGlow.setAttribute('id', filterGlowId);
  filterGlow.setAttribute('x', '-40%');
  filterGlow.setAttribute('y', '-40%');
  filterGlow.setAttribute('width', '180%');
  filterGlow.setAttribute('height', '180%');
  const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '1.35');
  blur.setAttribute('result', 'b');
  const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
  const mn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  mn1.setAttribute('in', 'b');
  const mn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  mn2.setAttribute('in', 'SourceGraphic');
  merge.append(mn1, mn2);
  filterGlow.append(blur, merge);
  defs.append(filterGlow);

  const strokeGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  strokeGrad.setAttribute('id', strokeGradId);
  strokeGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
  strokeGrad.setAttribute('x1', String(padL));
  strokeGrad.setAttribute('y1', String(padT));
  strokeGrad.setAttribute('x2', String(w - padR));
  strokeGrad.setAttribute('y2', String(padT));
  const s0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s0.setAttribute('offset', '0%');
  s0.setAttribute('stop-color', '#a78bfa');
  const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s1.setAttribute('offset', '45%');
  s1.setAttribute('stop-color', '#818cf8');
  const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s2.setAttribute('offset', '100%');
  s2.setAttribute('stop-color', '#2dd4bf');
  strokeGrad.append(s0, s1, s2);
  defs.append(strokeGrad);

  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', gradId);
  grad.setAttribute('x1', '0');
  grad.setAttribute('y1', '0');
  grad.setAttribute('x2', '0');
  grad.setAttribute('y2', '1');
  const g0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  g0.setAttribute('offset', '0%');
  g0.setAttribute('stop-color', 'rgba(167,139,250,.42)');
  const g1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  g1.setAttribute('offset', '38%');
  g1.setAttribute('stop-color', 'rgba(56,189,248,.2)');
  const g2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  g2.setAttribute('offset', '72%');
  g2.setAttribute('stop-color', 'rgba(20,184,166,.1)');
  const g3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  g3.setAttribute('offset', '100%');
  g3.setAttribute('stop-color', 'rgba(15,23,42,0)');
  grad.append(g0, g1, g2, g3);
  defs.append(grad);
  svg.append(defs);

  [80, 50].forEach((pct) => {
    const yy = yAt(pct);
    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    grid.setAttribute('class', 'dashboard-ceo-hero__prime-grid');
    grid.setAttribute('x1', String(padL));
    grid.setAttribute('y1', String(yy));
    grid.setAttribute('x2', String(w - padR));
    grid.setAttribute('y2', String(yy));
    grid.setAttribute('stroke', 'rgba(148,163,184,.16)');
    grid.setAttribute('stroke-dasharray', '3 7');
    svg.append(grid);
  });

  const targetY = yAt(80);
  const target = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  target.setAttribute('class', 'dashboard-ceo-hero__prime-target-line');
  target.setAttribute('x1', String(padL));
  target.setAttribute('y1', String(targetY));
  target.setAttribute('x2', String(w - padR));
  target.setAttribute('y2', String(targetY));
  target.setAttribute('stroke', 'rgba(52,211,153,.55)');
  target.setAttribute('stroke-width', '1.5');
  target.setAttribute('stroke-dasharray', '7 5');
  target.setAttribute('stroke-linecap', 'round');
  svg.append(target);

  const tgtLab = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  tgtLab.setAttribute('class', 'dashboard-ceo-hero__prime-target-label');
  tgtLab.setAttribute('x', String(w - padR - 4));
  tgtLab.setAttribute('y', String(targetY - 5));
  tgtLab.setAttribute('text-anchor', 'end');
  tgtLab.setAttribute('fill', 'rgba(52,211,153,.78)');
  tgtLab.setAttribute('font-size', '9');
  tgtLab.setAttribute('font-weight', '800');
  tgtLab.setAttribute('letter-spacing', '0.04em');
  tgtLab.textContent = 'Cible 80 %';
  svg.append(tgtLab);

  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', areaD);
  area.setAttribute('fill', `url(#${gradId})`);
  area.setAttribute('class', 'dashboard-ceo-hero__prime-area');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', lineD);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', `url(#${strokeGradId})`);
  line.setAttribute('stroke-width', '3');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('filter', `url(#${filterGlowId})`);
  line.setAttribute('class', 'dashboard-ceo-hero__prime-line');

  svg.append(area, line);
  pts.forEach(([x, y], i) => {
    if (!monthHasAudits(i)) return;
    const label = String(safe[i]?.label || 'Mois');
    const value = Math.max(0, Math.min(100, Number(safe[i]?.value) || 0));
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(x));
    dot.setAttribute('cy', String(y));
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', 'rgba(15,23,42,.96)');
    dot.setAttribute('stroke', value >= 80 ? 'rgba(52,211,153,.95)' : value >= 60 ? 'rgba(251,191,36,.95)' : 'rgba(248,113,113,.92)');
    dot.setAttribute('stroke-width', '2.25');
    dot.setAttribute('class', 'dashboard-ceo-hero__prime-dot');
    dot.setAttribute('data-audit-point', '1');
    dot.setAttribute('data-label', label);
    dot.setAttribute('data-value', String(value));
    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.style.cursor = 'pointer';
    dot.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        dot.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${label} : ${value} % — ouvrir le module Audits`;
    dot.append(title);
    svg.append(dot);
  });
  return svg;
}

/**
 * @param {string} siteName
 * @param {{ onExport?: () => void; onOpenAuditTrendPoint?: (point: { label: string; value: number }) => void }} opts
 */
export function createDashboardCeoHero(siteName, opts = {}) {
  const onExport = typeof opts.onExport === 'function' ? opts.onExport : () => {};
  const onOpenAuditTrendPoint =
    typeof opts.onOpenAuditTrendPoint === 'function' ? opts.onOpenAuditTrendPoint : null;

  const root = document.createElement('article');
  root.className = 'dashboard-ceo-hero';
  root.setAttribute('aria-labelledby', 'dashboard-ceo-title');
  root.style.boxSizing = 'border-box';

  root.innerHTML = `
    <div class="dashboard-ceo-hero__topbar">
      <span class="dashboard-ceo-hero__site" data-ceo-site></span>
      <button type="button" class="btn btn-primary dashboard-ceo-hero__export dashboard-hero__cta--featured dashboard-export-btn">
        Exporter le reporting
      </button>
    </div>
    <div class="dashboard-ceo-hero__body">
      <div class="dashboard-ceo-hero__visual" data-ceo-visual>
        <span class="dashboard-ceo-hero__status" data-ceo-status-badge>—</span>
        <div class="dashboard-ceo-hero__ring-wrap" data-ceo-ring></div>
        <div class="dashboard-ceo-hero__scorenum" data-ceo-score>—</div>
        <p class="dashboard-ceo-hero__scorecaption" data-ceo-caption>Indice QHSE synthétique</p>
        <p class="dashboard-ceo-hero__scorehint" data-ceo-hint></p>
      </div>
      <div class="dashboard-ceo-hero__center">
        <div class="dashboard-ceo-hero__intro">
          <div class="dashboard-ceo-hero__text">
            <p class="dashboard-ceo-hero__eyebrow">Pilotage</p>
            <h1 id="dashboard-ceo-title" class="dashboard-ceo-hero__title">Cockpit QHSE</h1>
            <p class="dashboard-ceo-hero__brief" data-ceo-brief></p>
            <details class="dashboard-ceo-hero__legal-wrap">
              <summary class="dashboard-ceo-hero__legal-summary">À propos de l’indice</summary>
              <p class="dashboard-ceo-hero__legal" data-ceo-legal></p>
            </details>
          </div>
          <nav class="dashboard-ceo-hero__actions" aria-label="Accès rapide aux modules">
            <span class="dashboard-ceo-hero__actions-kicker">Accès rapide</span>
            <div class="dashboard-ceo-hero__quick" role="toolbar">
              <button type="button" class="dashboard-ceo-hero__quick-btn" data-ceo-nav="incidents"><span class="dashboard-ceo-hero__quick-ico" aria-hidden="true">!</span><span>Incidents</span></button>
              <button type="button" class="dashboard-ceo-hero__quick-btn" data-ceo-nav="actions"><span class="dashboard-ceo-hero__quick-ico" aria-hidden="true">✓</span><span>Actions</span></button>
              <button type="button" class="dashboard-ceo-hero__quick-btn" data-ceo-nav="audits"><span class="dashboard-ceo-hero__quick-ico" aria-hidden="true">☑</span><span>Audits</span></button>
              <button type="button" class="dashboard-ceo-hero__quick-btn" data-ceo-nav="analytics"><span class="dashboard-ceo-hero__quick-ico" aria-hidden="true">≈</span><span>Analyses</span></button>
            </div>
          </nav>
        </div>
        <button type="button" class="dashboard-ceo-hero__prime-card" data-ceo-prime-chart aria-label="Ouvrir le module Audits">
          <div class="dashboard-ceo-hero__prime-head">
            <div class="dashboard-ceo-hero__prime-titles">
              <span class="dashboard-ceo-hero__prime-eyebrow">Synthèse conformité</span>
              <span class="dashboard-ceo-hero__prime-title">Performance des audits</span>
              <span class="dashboard-ceo-hero__prime-hint">Moyenne mensuelle des scores sur six mois — même périmètre que la liste chargée.</span>
            </div>
            <span class="dashboard-ceo-hero__prime-badge" data-ceo-audit-avg></span>
          </div>
          <div class="dashboard-ceo-hero__prime-canvas">
            <div class="dashboard-ceo-hero__prime-empty" data-ceo-prime-empty hidden>
              <p class="dashboard-ceo-hero__prime-empty-title">Aucun score sur cette fenêtre</p>
              <p class="dashboard-ceo-hero__prime-empty-sub">Les audits datés et notés alimenteront cette courbe. Cliquez pour ouvrir le module.</p>
            </div>
            <div class="dashboard-ceo-hero__prime-surface" data-ceo-prime-surface></div>
          </div>
          <div class="dashboard-ceo-hero__prime-labels" data-ceo-prime-labels></div>
          <div class="dashboard-ceo-hero__prime-foot">
            <span data-ceo-prime-foot-hint>Ouvrir le module Audits</span>
            <span class="dashboard-ceo-hero__prime-foot-arrow" aria-hidden="true">→</span>
          </div>
        </button>
      </div>
    </div>
  `;

  const siteEl = root.querySelector('[data-ceo-site]');
  const badgeEl = root.querySelector('[data-ceo-status-badge]');
  const ringHost = root.querySelector('[data-ceo-ring]');
  const scoreEl = root.querySelector('[data-ceo-score]');
  const captionEl = root.querySelector('[data-ceo-caption]');
  const hintEl = root.querySelector('[data-ceo-hint]');
  const briefEl = root.querySelector('[data-ceo-brief]');
  const visual = root.querySelector('[data-ceo-visual]');
  const primeSurface = root.querySelector('[data-ceo-prime-surface]');
  const primeEmpty = root.querySelector('[data-ceo-prime-empty]');
  const primeLabels = root.querySelector('[data-ceo-prime-labels]');
  const auditAvgBadge = root.querySelector('[data-ceo-audit-avg]');
  const primeFootHint = root.querySelector('[data-ceo-prime-foot-hint]');
  const primeCard = root.querySelector('[data-ceo-prime-chart]');

  scoreEl.style.fontSize = 'clamp(64px, 7vw, 88px)';
  scoreEl.style.fontWeight = '900';
  scoreEl.style.letterSpacing = '-0.04em';
  scoreEl.style.lineHeight = '1';

  siteEl.textContent = `Périmètre · ${siteName || 'Tous sites'}`;

  root.querySelector('.dashboard-ceo-hero__export')?.addEventListener('click', () => onExport());

  root.addEventListener('click', (e) => {
    const q = e.target && /** @type {HTMLElement} */ (e.target).closest('[data-ceo-nav]');
    if (q) {
      const id = q.getAttribute('data-ceo-nav');
      if (id) {
        e.preventDefault();
        window.location.hash = id;
      }
      return;
    }
    const card = e.target && /** @type {HTMLElement} */ (e.target).closest('[data-ceo-prime-chart]');
    if (card) {
      e.preventDefault();
      window.location.hash = 'audits';
    }
  });

  function update(payload) {
    const stats = payload?.stats || {};
    const ncs = Array.isArray(payload?.ncs) ? payload.ncs : [];
    const audits = Array.isArray(payload?.audits) ? payload.audits : [];
    const ncOpenCount = ncs.filter(isNcOpen).length;
    const scores = audits.map((a) => Number(a.score)).filter((n) => Number.isFinite(n));
    const hasAuditScores = scores.length > 0;
    const avgAuditScore = hasAuditScores
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    const siteLabel =
      payload?.siteLabel != null && String(payload.siteLabel).trim()
        ? String(payload.siteLabel).trim()
        : siteName || '';

    siteEl.textContent = `Périmètre · ${siteLabel || 'Tous sites'}`;

    const criticalCount = Array.isArray(stats.criticalIncidents)
      ? stats.criticalIncidents.length
      : 0;
    const overdueCount = Math.max(0, Number(stats.overdueActions) || 0);
    const parts = [];
    if (criticalCount > 0) parts.push(`${criticalCount} critique(s) ouverte(s)`);
    if (overdueCount > 0) parts.push(`${overdueCount} action(s) en retard`);
    if (ncOpenCount > 0) parts.push(`${ncOpenCount} NC ouverte(s)`);
    const summaryLine = parts.length ? parts.join(' · ') : 'Aucune alerte — situation maîtrisée';
    briefEl.textContent = summaryLine;

    const score = computeQhseGlobalScore({
      stats,
      ncOpenCount,
      avgAuditScore,
      hasAuditScores
    });
    const meta = qhseScorePresentation(score);
    const statusShort = ceoGlobalStatusLabel(meta.tone);

    scoreEl.textContent = String(score);
    captionEl.textContent = meta.label;
    hintEl.textContent = meta.hint;
    badgeEl.textContent = statusShort;
    badgeEl.className = `dashboard-ceo-hero__status dashboard-ceo-hero__status--${meta.tone}`;

    visual.classList.remove(
      'dashboard-ceo-hero__visual--ok',
      'dashboard-ceo-hero__visual--watch',
      'dashboard-ceo-hero__visual--risk'
    );
    visual.classList.add(`dashboard-ceo-hero__visual--${meta.tone}`);

    ringHost.replaceChildren();
    ringHost.append(buildCeoScoreArc(score, meta.tone));

    const auditTrend = buildMonthlyAuditScoreAvgSeries(audits, 6);
    /** Mois avec au moins un audit daté — la moyenne peut être 0 % (ex. audits planifiés). */
    const hasAuditTrendData = auditTrend.some((x) => (x.count ?? 0) > 0);
    const scored = auditTrend.filter((x) => (x.count ?? 0) > 0).map((x) => x.value);
    const gradId = `ceo-audit-fill-${Math.random().toString(36).slice(2, 9)}`;
    if (primeEmpty) {
      primeEmpty.hidden = hasAuditTrendData;
      primeEmpty.setAttribute('aria-hidden', hasAuditTrendData ? 'true' : 'false');
    }
    if (primeCard) {
      primeCard.classList.toggle('dashboard-ceo-hero__prime-card--filled', hasAuditTrendData);
    }
    if (primeSurface) {
      primeSurface.replaceChildren();
      if (hasAuditTrendData) {
        const trendSvg = buildCeoAuditTrendSvg(auditTrend, gradId);
        trendSvg.querySelectorAll('circle[data-audit-point]').forEach((dot) => {
          dot.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (!onOpenAuditTrendPoint) return;
            const label = dot.getAttribute('data-label') || 'Mois';
            const value = Number(dot.getAttribute('data-value')) || 0;
            onOpenAuditTrendPoint({ label, value });
          });
        });
        primeSurface.append(trendSvg);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => initCeoAuditTrendAnimations(trendSvg));
        });
      }
    }
    if (primeLabels) {
      primeLabels.replaceChildren();
      auditTrend.forEach((m) => {
        const s = document.createElement('span');
        s.className = 'dashboard-ceo-hero__prime-label';
        s.textContent = m.label;
        s.title =
          (m.count ?? 0) > 0
            ? `${m.label} : moy. ${m.value} %`
            : `${m.label} : pas de données`;
        primeLabels.append(s);
      });
      primeLabels.style.opacity = hasAuditTrendData ? '' : '0.45';
    }
    if (auditAvgBadge) {
      if (scored.length > 0) {
        const m =
          Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10;
        auditAvgBadge.textContent = `Moy. ${m} %`;
      } else {
        auditAvgBadge.textContent = 'N/A';
      }
    }
    if (primeFootHint) {
      primeFootHint.textContent = hasAuditTrendData
        ? 'Ouvrir le module Audits'
        : 'Vers les audits — saisir des scores';
    }
  }

  return { root, update };
}
