/**
 * Graphiques dashboard — SVG / barres CSS + Chart.js (courbe incidents 6 mois).
 */

import { Chart, registerables } from 'chart.js';
import { isActionOverdueDashboardRow } from '../utils/actionOverdueDashboard.js';
import { interpretIncidentTrend } from '../utils/dashboardIncidentSeriesNarrative.js';
import { createIncidentsMonthlyLineChartChartJs } from './dashboardIncidentsLineChart.js';

let qhseDashboardChartJsReady = false;

/**
 * Enregistre Chart.js pour les graphiques canvas du dashboard (idempotent).
 * @param {object} [_stats] — réservé (pré-calculs futurs).
 */
export function initDashboardCharts(_stats) {
  if (qhseDashboardChartJsReady) return;
  Chart.register(...registerables);
  qhseDashboardChartJsReady = true;
}

/** Score audit API / formulaire — tolère chaîne, virgule décimale. */
function normalizeAuditScoreValue(raw) {
  if (raw == null || raw === '') return NaN;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN;
  const n = Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Date d’audit pour séries temporelles — préfère updatedAt si présent.
 * @returns {number | null} timestamp ms
 */
function getAuditTimestampMs(a) {
  if (!a || typeof a !== 'object') return null;
  const candidates = [a.updatedAt, a.createdAt, a.auditDate, a.date, a.performedAt];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    const t = new Date(c).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

function createChartTooltipEl() {
  const tip = document.createElement('div');
  tip.className = 'qhse-chart-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('data-visible', 'false');
  tip.hidden = true;
  return tip;
}

function bindMixSegmentHover(el) {
  if (!el || !el.classList?.contains('dashboard-mix-seg')) return;
  el.addEventListener('mouseenter', () => el.classList.add('dashboard-mix-seg--active'));
  el.addEventListener('mouseleave', () => el.classList.remove('dashboard-mix-seg--active'));
}

/**
 * @param {HTMLElement} wrap
 * @param {SVGSVGElement} svg
 * @param {HTMLElement} tip
 * @param {Array<{ x: number; y: number; label: string; value: number }>} pts
 * @param {Array<{ label: string; value: number }>} safe
 * @param {{ valueTitle?: (p: { label: string; value: number }) => string; lineTheme?: string }} options
 * @param {{ w: number; h: number }} geom
 */
function bindDashboardLineChartHover(wrap, svg, tip, pts, safe, options, geom) {
  const { w, h } = geom;
  const valueSpans = wrap.querySelectorAll('.dashboard-line-chart-values .dashboard-line-chart-value-cell');
  const labelSpans = wrap.querySelectorAll('.dashboard-line-chart-labels .dashboard-line-chart-label-cell');
  const dotEls = svg.querySelectorAll('.dashboard-line-chart-dot');
  const lineEl = svg.querySelector('.dashboard-line-chart-line');
  let raf = 0;

  function hide() {
    tip.hidden = true;
    tip.setAttribute('data-visible', 'false');
    wrap.classList.remove('dashboard-line-chart-wrap--hovering');
    valueSpans.forEach((s) => s.classList.remove('dashboard-line-chart-value-cell--active'));
    labelSpans.forEach((s) => s.classList.remove('dashboard-line-chart-label-cell--active'));
    dotEls.forEach((d) => d.classList.remove('dashboard-line-chart-dot--active'));
    lineEl?.classList.remove('dashboard-line-chart-line--dim');
  }

  /**
   * @param {number} idx
   */
  function show(idx) {
    const p = safe[idx];
    if (!p) return;
    const valStr = options.valueTitle ? options.valueTitle(p) : String(p.value);
    const seriesLine =
      options.lineTheme === 'incidents'
        ? 'Incidents déclarés'
        : options.lineTheme === 'audits'
          ? 'Score d’audit'
          : 'Valeur';

    tip.replaceChildren();
    const ks = document.createElement('div');
    ks.className = 'qhse-chart-tooltip__k';
    ks.textContent = 'Série';
    const vs = document.createElement('div');
    vs.className = 'qhse-chart-tooltip__v';
    vs.style.fontSize = '11px';
    vs.style.fontWeight = '600';
    vs.style.marginBottom = '8px';
    vs.textContent = seriesLine;

    const k1 = document.createElement('div');
    k1.className = 'qhse-chart-tooltip__k';
    k1.textContent = 'Période';
    const v1 = document.createElement('div');
    v1.className = 'qhse-chart-tooltip__v';
    v1.textContent = p.label || '—';
    const k2 = document.createElement('div');
    k2.className = 'qhse-chart-tooltip__k';
    k2.textContent = 'Valeur';
    const v2 = document.createElement('div');
    v2.className = 'qhse-chart-tooltip__v';
    v2.textContent = valStr;

    tip.append(ks, vs, k1, v1, k2, v2);
    if (
      options.targetYPercent != null &&
      Number.isFinite(Number(options.targetYPercent)) &&
      options.lineTheme === 'audits'
    ) {
      const tgt = Math.round(Number(options.targetYPercent));
      const ko = document.createElement('div');
      ko.className = 'qhse-chart-tooltip__k';
      ko.textContent = 'Objectif';
      const vo = document.createElement('div');
      vo.className = 'qhse-chart-tooltip__v';
      vo.style.fontSize = '11px';
      vo.style.opacity = '0.92';
      vo.textContent =
        typeof options.targetLabel === 'string' && options.targetLabel.trim()
          ? options.targetLabel.trim()
          : `${tgt} %`;
      const gap = p.value - tgt;
      const cmp = document.createElement('div');
      cmp.className = 'qhse-chart-tooltip__delta';
      cmp.textContent =
        gap >= 0.5
          ? `+${gap.toFixed(0)} pt vs objectif`
          : gap <= -0.5
            ? `${gap.toFixed(0)} pt vs objectif`
            : 'À l’objectif';
      tip.append(ko, vo, cmp);
    }
    tip.hidden = false;
    tip.setAttribute('data-visible', 'true');

    const rect = svg.getBoundingClientRect();
    const px = (pts[idx].x / w) * rect.width + rect.left;
    const py = (pts[idx].y / h) * rect.height + rect.top;
    tip.style.left = `${Math.min(window.innerWidth - 246, px + 14)}px`;
    tip.style.top = `${Math.max(10, py - 8)}px`;

    wrap.classList.add('dashboard-line-chart-wrap--hovering');
    valueSpans.forEach((s, i) => s.classList.toggle('dashboard-line-chart-value-cell--active', i === idx));
    labelSpans.forEach((s, i) => s.classList.toggle('dashboard-line-chart-label-cell--active', i === idx));
    dotEls.forEach((d, i) => d.classList.toggle('dashboard-line-chart-dot--active', i === idx));
    lineEl?.classList.remove('dashboard-line-chart-line--dim');
  }

  function onMove(e) {
    const rect = svg.getBoundingClientRect();
    const scaleX = w / rect.width;
    const xSvg = (e.clientX - rect.left) * scaleX;
    let best = 0;
    let bestD = Infinity;
    pts.forEach((p, i) => {
      const dx = Math.abs(p.x - xSvg);
      if (dx < bestD) {
        bestD = dx;
        best = i;
      }
    });
    if (bestD > 72) {
      hide();
      return;
    }
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => show(best));
  }

  svg.addEventListener('mousemove', onMove);
  svg.addEventListener('mouseleave', hide);
}

/**
 * @param {SVGSVGElement} svg
 * @param {HTMLElement} tip
 * @param {string[]} labs
 * @param {{ name: string; color: string; values: number[] }[]} series
 * @param {SVGElement[][]} dotsByCol
 * @param {number} w
 * @param {number} h
 * @param {number[]} ptsX
 * @param {{ padV?: number; crosshair?: SVGLineElement | null; valueDecimals?: number; snapPx?: number }} [opts]
 */
function bindKpiMultiLineHover(svg, tip, labs, series, dotsByCol, w, h, ptsX, opts = {}) {
  let raf = 0;
  const safeSeries = Array.isArray(series) ? series : [];
  const padV = Number.isFinite(opts.padV) ? opts.padV : 14;
  const crosshair = opts.crosshair || null;
  const decimals =
    opts.valueDecimals != null && Number.isFinite(opts.valueDecimals) ? opts.valueDecimals : 1;
  const snapPx =
    opts.snapPx != null && Number.isFinite(opts.snapPx)
      ? opts.snapPx
      : ptsX.length > 1
        ? Math.min(56, Math.abs(ptsX[1] - ptsX[0]) * 0.55)
        : 48;

  function hide() {
    tip.hidden = true;
    tip.setAttribute('data-visible', 'false');
    dotsByCol.flat().forEach((d) => d.classList.remove('dashboard-line-chart-dot--active'));
    if (crosshair) {
      crosshair.setAttribute('visibility', 'hidden');
    }
  }

  /**
   * @param {number} col
   * @param {MouseEvent | Touch} e
   */
  function show(col, e) {
    tip.replaceChildren();
    const k1 = document.createElement('div');
    k1.className = 'qhse-chart-tooltip__k';
    k1.textContent = 'Période';
    const v1 = document.createElement('div');
    v1.className = 'qhse-chart-tooltip__v';
    v1.textContent = labs[col] || '—';
    tip.append(k1, v1);

    safeSeries.forEach((s) => {
      const vals = Array.isArray(s.values) ? s.values : [];
      const val = Math.max(0, Math.min(100, Number(vals[col]) || 0));
      const row = document.createElement('div');
      row.className = 'qhse-chart-tooltip__series';
      const name = document.createElement('span');
      name.className = 'qhse-chart-tooltip__series-name';
      const dot = document.createElement('span');
      dot.className = 'qhse-chart-tooltip__series-dot';
      dot.style.background = s.color || '#94a3b8';
      const nl = document.createElement('span');
      nl.textContent = s.name || '—';
      name.append(dot, nl);
      const valEl = document.createElement('span');
      valEl.className = 'qhse-chart-tooltip__series-val';
      const numStr =
        decimals <= 0
          ? String(Math.round(val))
          : Number(val.toFixed(decimals)).toString();
      valEl.textContent = `${numStr} %`;
      row.append(name, valEl);
      tip.append(row);
    });

    tip.hidden = false;
    tip.setAttribute('data-visible', 'true');
    const rect = svg.getBoundingClientRect();
    const px = (ptsX[col] / w) * rect.width + rect.left;
    const clientY = 'clientY' in e ? e.clientY : rect.top + 20;
    tip.style.left = `${Math.min(window.innerWidth - 240, Math.max(8, px - 110))}px`;
    tip.style.top = `${Math.min(window.innerHeight - 100, Math.max(8, clientY - 48))}px`;
    dotsByCol[col]?.forEach((d) => d.classList.add('dashboard-line-chart-dot--active'));
    if (crosshair) {
      const x = ptsX[col];
      crosshair.setAttribute('x1', String(x));
      crosshair.setAttribute('x2', String(x));
      crosshair.setAttribute('y1', String(padV));
      crosshair.setAttribute('y2', String(h - padV));
      crosshair.setAttribute('visibility', 'visible');
    }
  }

  function onPointer(e) {
    const rect = svg.getBoundingClientRect();
    const cx = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX;
    if (cx == null) return;
    const scaleX = w / rect.width;
    const xSvg = (cx - rect.left) * scaleX;
    let best = 0;
    let bestD = Infinity;
    ptsX.forEach((x, i) => {
      const dx = Math.abs(x - xSvg);
      if (dx < bestD) {
        bestD = dx;
        best = i;
      }
    });
    if (bestD > snapPx) {
      hide();
      return;
    }
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => show(best, e));
  }

  svg.addEventListener('mousemove', onPointer);
  svg.addEventListener('mouseleave', hide);
  svg.addEventListener('touchstart', onPointer, { passive: true });
  svg.addEventListener('touchmove', onPointer, { passive: true });
  svg.addEventListener('touchend', hide);
}

/**
 * @template T
 * @param {T[] | null | undefined} items
 * @param {(item: T) => string | undefined | null} getDateIso
 * @param {number} [monthCount=6]
 * @returns {{ label: string; value: number }[]}
 */
export function buildMonthlyCountSeries(items, getDateIso, monthCount = 6) {
  const n = Math.max(1, Math.min(24, Math.floor(Number(monthCount)) || 6));
  const now = new Date();
  const buckets = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short' })
    });
  }
  const counts = buckets.map((b) => ({ label: b.label, value: 0 }));
  if (!Array.isArray(items)) return counts;
  items.forEach((item) => {
    const raw = getDateIso(item);
    if (!raw) return;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return;
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const idx = buckets.findIndex((b) => b.key === key);
    if (idx >= 0) counts[idx].value += 1;
  });
  return counts;
}

/**
 * @param {Array<{ createdAt?: string }>} incidents
 * @returns {{ label: string; value: number }[]}
 */
export function buildIncidentMonthlySeries(incidents) {
  return buildMonthlyCountSeries(incidents, (inc) => inc?.createdAt, 6);
}

/**
 * NC majeures vs mineures par mois (texte « criticité » dans title/detail — aligné seed Prisma).
 * @param {object[]} ncs
 * @param {number} [monthCount=6]
 * @returns {{ labels: string[]; major: number[]; minor: number[] }}
 */
export function buildNcMajorMinorMonthlySeries(ncs, monthCount = 6) {
  const n = Math.max(1, Math.min(24, Math.floor(Number(monthCount)) || 6));
  const now = new Date();
  /** @type {{ key: string; label: string }[]} */
  const buckets = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short' })
    });
  }
  const major = buckets.map(() => 0);
  const minor = buckets.map(() => 0);
  if (!Array.isArray(ncs)) {
    return { labels: buckets.map((b) => b.label), major, minor };
  }
  for (const nc of ncs) {
    const raw = nc?.createdAt;
    if (!raw) continue;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) continue;
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const idx = buckets.findIndex((b) => b.key === key);
    if (idx < 0) continue;
    if (ncTextIsMajor(nc)) major[idx] += 1;
    else minor[idx] += 1;
  }
  return { labels: buckets.map((b) => b.label), major, minor };
}

/**
 * @param {object} nc
 */
function ncTextIsMajor(nc) {
  const t = `${nc?.title || ''} ${nc?.detail || ''}`.toLowerCase();
  if (
    /criticité\s*:\s*mineure|criticité\s*:\s*mineur|\bmineure\b|\bmineur\b|\bfaible\b|\bminor\b/.test(
      t
    )
  ) {
    return false;
  }
  if (
    /criticité\s*:\s*majeure|criticité\s*:\s*majeur|\bmajeure\b|\bmajeur\b|\bcritique\b|\bmajor\b|\bgrave\b/.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Score moyen des audits par mois calendaire (fenêtre glissante).
 * @param {Array<{ score?: unknown; createdAt?: string; updatedAt?: string }>} audits
 * @param {number} [monthCount=6]
 * @returns {{ label: string; value: number; count: number }[]}
 */
export function buildMonthlyAuditScoreAvgSeries(audits, monthCount = 6) {
  const n = Math.max(1, Math.min(24, Math.floor(Number(monthCount)) || 6));
  const now = new Date();
  /** @type {{ key: string; label: string; sum: number; cnt: number }[]} */
  const buckets = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      sum: 0,
      cnt: 0
    });
  }
  (audits || []).forEach((a) => {
    const score = normalizeAuditScoreValue(a?.score);
    if (!Number.isFinite(score)) return;
    const tms = getAuditTimestampMs(a);
    if (tms == null) return;
    const dt = new Date(tms);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const b = buckets.find((x) => x.key === key);
    if (!b) return;
    b.sum += score;
    b.cnt += 1;
  });
  return buckets.map((b) => ({
    label: b.label,
    value: b.cnt > 0 ? Math.round((b.sum / b.cnt) * 10) / 10 : 0,
    count: b.cnt
  }));
}

/**
 * Courbe multi-séries (0–100), même axe — pour tendances comparées.
 * @param {string[]} labels
 * @param {{ name: string; color: string; values: number[] }[]} series
 * @param {string} [footNote]
 * @param {{
 *   variant?: 'analytics';
 *   interpretText?: string;
 *   targetYPercent?: number;
 * }} [options]
 */
export function createKpiMultiLineChart(labels, series, footNote, options = {}) {
  const wrap = document.createElement('div');
  const analytics = options.variant === 'analytics';
  wrap.className = analytics
    ? 'kpi-multi-line-wrap kpi-multi-line-wrap--analytics'
    : 'kpi-multi-line-wrap';

  const labs = Array.isArray(labels) && labels.length ? labels : ['—'];
  const m = labs.length;
  const w = analytics ? 528 : 392;
  const h = analytics ? 204 : 176;
  const padL = 36;
  const padR = 12;
  const padV = analytics ? 16 : 14;
  const plotW = w - padL - padR;
  const step = m > 1 ? plotW / (m - 1) : 0;

  const yAt = (val) => {
    const v = Math.max(0, Math.min(100, Number(val) || 0));
    return h - padV - (v / 100) * (h - padV * 2);
  };
  const xAt = (i) => padL + (m === 1 ? plotW / 2 : i * step);
  const ptsX = labs.map((_, i) => xAt(i));

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', analytics ? 'kpi-multi-line-svg kpi-multi-line-svg--analytics' : 'kpi-multi-line-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    'Évolution comparée sur la période (une ou plusieurs séries).'
  );

  [100, 75, 50, 25, 0].forEach((gv) => {
    if (!analytics && (gv === 75 || gv === 25)) return;
    const gy = yAt(gv);
    const gl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gl.setAttribute('x1', String(padL));
    gl.setAttribute('y1', String(gy.toFixed(1)));
    gl.setAttribute('x2', String(w - padR));
    gl.setAttribute('y2', String(gy.toFixed(1)));
    const isBase = gv === 0;
    const isMid = gv === 50;
    gl.setAttribute(
      'class',
      isBase
        ? 'dashboard-line-chart-grid dashboard-line-chart-grid--base'
        : isMid
          ? 'dashboard-line-chart-grid dashboard-line-chart-grid--mid'
          : 'dashboard-line-chart-grid dashboard-line-chart-grid--soft'
    );
    svg.append(gl);
    const tk = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tk.setAttribute('x', String(padL - 6));
    tk.setAttribute('y', String(gy + 3.5));
    tk.setAttribute('text-anchor', 'end');
    tk.setAttribute('class', 'dashboard-line-chart-y-tick');
    tk.textContent = `${gv}`;
    svg.append(tk);
  });

  if (analytics) {
    labs.forEach((_, i) => {
      const xv = xAt(i);
      const vl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vl.setAttribute('x1', String(xv.toFixed(1)));
      vl.setAttribute('y1', String(padV));
      vl.setAttribute('x2', String(xv.toFixed(1)));
      vl.setAttribute('y2', String(h - padV));
      vl.setAttribute('class', 'kpi-multi-line-vgrid');
      vl.setAttribute('pointer-events', 'none');
      svg.append(vl);
    });
  }

  /** @type {SVGLineElement | null} */
  let crosshair = null;
  if (analytics) {
    crosshair = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    crosshair.setAttribute('class', 'kpi-multi-line-crosshair');
    crosshair.setAttribute('stroke', 'rgba(94, 234, 212, 0.45)');
    crosshair.setAttribute('stroke-width', '1.25');
    crosshair.setAttribute('pointer-events', 'none');
    crosshair.setAttribute('visibility', 'hidden');
    svg.append(crosshair);
  }

  const tgt =
    analytics && options.targetYPercent != null && Number.isFinite(Number(options.targetYPercent))
      ? Math.max(0, Math.min(100, Number(options.targetYPercent)))
      : null;
  if (tgt != null) {
    const yT = yAt(tgt);
    const ref = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ref.setAttribute('x1', String(padL));
    ref.setAttribute('y1', String(yT.toFixed(1)));
    ref.setAttribute('x2', String(w - padR));
    ref.setAttribute('y2', String(yT.toFixed(1)));
    ref.setAttribute('class', 'kpi-multi-line-target');
    ref.setAttribute('stroke-dasharray', '4 6');
    svg.append(ref);
  }

  const strokeW = analytics ? '2.15' : '2.65';
  const dotR = analytics ? '3.35' : '4.15';

  const maxY = 100;
  /** @type {SVGElement[][]} */
  const dotsByCol = labs.map(() => []);

  (series || []).forEach((s) => {
    const vals = Array.isArray(s.values) ? s.values : [];
    const pts = labs.map((_, i) => {
      const v = Math.max(0, Math.min(maxY, Number(vals[i]) || 0));
      const x = xAt(i);
      const y = yAt(v);
      return { x, y };
    });
    if (pts.length === 0) return;
    const d = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'kpi-multi-line-path');
    path.setAttribute('stroke-width', s.strokeWidth != null ? String(s.strokeWidth) : strokeW);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke', s.color || 'rgba(96,165,250,0.9)');
    if (s.lineStyle === 'dashed') {
      path.setAttribute('stroke-dasharray', '5 5');
      path.setAttribute('opacity', '0.92');
    }
    svg.append(path);
    if (s.showDots === false) return;
    pts.forEach((p, colIdx) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(p.x));
      c.setAttribute('cy', String(p.y));
      c.setAttribute('r', dotR);
      c.setAttribute('class', 'dashboard-line-chart-dot');
      c.setAttribute('fill', s.color || 'rgba(96,165,250,0.95)');
      c.setAttribute('stroke', analytics ? 'rgba(15,23,42,0.45)' : 'rgba(15,23,42,0.35)');
      c.setAttribute('stroke-width', '1.15');
      svg.append(c);
      if (dotsByCol[colIdx]) dotsByCol[colIdx].push(c);
    });
  });

  const tip = createChartTooltipEl();
  const frame = document.createElement('div');
  frame.className = 'dashboard-line-chart-frame';
  frame.append(svg, tip);

  const labelsRow = document.createElement('div');
  labelsRow.className = 'kpi-multi-line-labels';
  labs.forEach((lb) => {
    const sp = document.createElement('span');
    sp.textContent = lb;
    labelsRow.append(sp);
  });

  const legend = document.createElement('ul');
  legend.className = 'kpi-multi-line-legend';
  (series || []).forEach((s) => {
    const li = document.createElement('li');
    li.className = 'kpi-multi-line-legend-item';
    const dot = document.createElement('span');
    dot.className = 'kpi-multi-line-legend-dot';
    dot.style.background = s.color || '#2dd4bf';
    const tx = document.createElement('span');
    tx.textContent = s.name;
    li.append(dot, tx);
    legend.append(li);
  });

  wrap.append(frame, labelsRow, legend);

  if (footNote && String(footNote).trim()) {
    const foot = document.createElement('p');
    foot.className = 'dashboard-chart-foot dashboard-chart-foot--tight';
    foot.textContent = footNote;
    wrap.append(foot);
  }

  if (options.interpretText && String(options.interpretText).trim()) {
    const interp = document.createElement('p');
    interp.className = 'dashboard-chart-interpret';
    interp.textContent = String(options.interpretText).trim();
    wrap.append(interp);
  }

  bindKpiMultiLineHover(svg, tip, labs, series || [], dotsByCol, w, h, ptsX, {
    padV,
    crosshair,
    valueDecimals: analytics ? 1 : 0
  });
  return wrap;
}

/**
 * @param {{ overdue: number; done: number; other: number }} parts
 */
function interpretActionsMixParts(parts) {
  const o = Math.max(0, Number(parts.overdue) || 0);
  const d = Math.max(0, Number(parts.done) || 0);
  const r = Math.max(0, Number(parts.other) || 0);
  const sum = o + d + r;
  if (sum === 0) return 'Aucune donnée sur cette période.';
  const ratio = o / sum;
  if (ratio > 0.28) {
    return 'Une part importante des actions est en retard.';
  }
  if (o === 0) {
    return 'Aucun retard sur les actions affichées.';
  }
  return `Environ ${Math.round(ratio * 100)} % des actions sont en retard.`;
}

/**
 * @param {Array<{ type: string; count: number }>} list
 */
function interpretIncidentTypesList(list) {
  if (!list.length) return '';
  const top = list[0];
  const second = list[1];
  if (second && top.count >= second.count * 1.6) {
    return `Le type « ${top.type} » domine (${top.count} cas) : un focus causes sur ce thème peut payer vite.`;
  }
  return `Répartition hétérogène ; le type le plus fréquent est « ${top.type} » (${top.count}).`;
}

/**
 * @param {{ label: string; value: number }[]} series
 * @param {{
 *   ariaLabel?: string;
 *   interpretText?: string;
 *   valueTitle?: (p: { label: string; value: number }) => string;
 *   footText?: string | null;
 *   variant?: 'analytics';
 *   lineTheme?: 'incidents' | 'audits';
 * }} [options]
 */
export function createDashboardLineChart(series, options = {}) {
  /** Courbe lisse (équivalent line.tension Chart.js). */
  function buildSmoothLinePathD(points, tension) {
    const T = Math.max(0, Math.min(1, tension));
    if (!points.length) return '';
    if (points.length === 1) {
      return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    }
    if (points.length === 2) {
      const a = points[0];
      const b = points[1];
      return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const c = (T * 4) / 6;
      const cp1x = p1.x + (p2.x - p0.x) * c;
      const cp1y = p1.y + (p2.y - p0.y) * c;
      const cp2x = p2.x - (p3.x - p1.x) * c;
      const cp2y = p2.y - (p3.y - p1.y) * c;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  if (!document.getElementById('qhse-dash-line-chart-keyframes')) {
    const ks = document.createElement('style');
    ks.id = 'qhse-dash-line-chart-keyframes';
    ks.textContent =
      '@keyframes qhseDashLineChartIn{from{opacity:0}to{opacity:1}}@keyframes qhseDashAreaPremiumIn{from{opacity:0}to{opacity:1}}@media (prefers-reduced-motion:reduce){.dashboard-line-chart-frame--enter,.dashboard-line-chart-area--premium{animation:none!important;opacity:1!important}}';
    document.head.append(ks);
  }

  const lineTheme = options.lineTheme;

  if (lineTheme === 'incidents') {
    const safeInc = Array.isArray(series) && series.length ? series : [{ label: '—', value: 0 }];
    return createIncidentsMonthlyLineChartChartJs(safeInc, options);
  }

  const wrap = document.createElement('div');
  const wrapScopedId = `qhse-dlc-${Math.random().toString(36).slice(2, 11)}`;
  wrap.id = wrapScopedId;
  wrap.className = 'dashboard-line-chart-wrap';
  if (options.variant === 'analytics') {
    wrap.classList.add('dashboard-line-chart-wrap--analytics');
  }
  if (lineTheme === 'audits') {
    wrap.classList.add('dashboard-line-chart-wrap--theme-audits');
  }

  if (lineTheme === 'audits' && (!Array.isArray(series) || series.length === 0)) {
    const empty = document.createElement('div');
    empty.className = 'dashboard-audit-chart-empty';
    empty.setAttribute('role', 'img');
    empty.setAttribute(
      'aria-label',
      'Aucune série de scores d’audit — saisir des audits avec note pour afficher la courbe.'
    );
    const inner = document.createElement('div');
    inner.className = 'dashboard-audit-chart-empty__inner';
    const icon = document.createElement('span');
    icon.className = 'dashboard-audit-chart-empty__glyph';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '☑';
    const t = document.createElement('p');
    t.className = 'dashboard-audit-chart-empty__title';
    t.textContent = 'Aucune donnée de score sur les audits chargés';
    const sub = document.createElement('p');
    sub.className = 'dashboard-audit-chart-empty__sub';
    sub.textContent =
      'La courbe affiche l’évolution des scores (0–100 %) par période. Vérifiez que les audits ont une note et une date.';
    inner.append(icon, t, sub);
    const interpret = document.createElement('p');
    interpret.className = 'dashboard-chart-interpret';
    interpret.textContent =
      options.interpretText !== undefined && options.interpretText !== null
        ? String(options.interpretText)
        : interpretAuditScoreSeries([]);
    empty.append(inner);
    wrap.append(empty, interpret);
    return wrap;
  }

  const safe = Array.isArray(series) && series.length ? series : [{ label: '—', value: 0 }];
  const w = 400;
  const h = 188;
  const padL = 12;
  const padR = 12;
  const padV = 14;
  const plotW = w - padL - padR;
  const values = safe.map((p) => (Number.isFinite(p.value) ? p.value : 0));
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  let vmin;
  let vmax;
  if (lineTheme === 'audits') {
    vmin = 0;
    vmax = 100;
  } else {
    const span = Math.max(rawMax - rawMin, 1e-9);
    const padY = span * 0.1;
    vmin = rawMin - padY;
    vmax = rawMax + padY;
    if (rawMin >= 0 && vmin < 0) vmin = 0;
    if (vmax - vmin < 1e-6) {
      vmax = vmin + 1;
    }
  }
  const yScale = (v) => {
    const t = (v - vmin) / (vmax - vmin);
    return h - padV - t * (h - padV * 2);
  };

  const n = safe.length;
  const step = n > 1 ? plotW / (n - 1) : 0;
  const pts = safe.map((p, i) => {
    const x = padL + (n === 1 ? plotW / 2 : i * step);
    const v = Number.isFinite(p.value) ? p.value : 0;
    const y = yScale(v);
    return { x, y, ...p };
  });
  const lineTension = 0.4;
  const d = buildSmoothLinePathD(pts, lineTension);
  const baseY = yScale(Math.max(0, vmin));
  const lastX = pts[pts.length - 1].x;
  const firstX = pts[0].x;
  const areaD = `${d} L ${lastX.toFixed(1)} ${baseY.toFixed(1)} L ${firstX.toFixed(1)} ${baseY.toFixed(1)} Z`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'dashboard-line-chart-svg');
  svg.setAttribute('role', 'img');
  svg.style.display = 'block';
  svg.style.width = '100%';
  svg.style.minHeight = '180px';
  svg.style.height = '180px';
  svg.setAttribute(
    'aria-label',
    options.ariaLabel ||
      (lineTheme === 'audits'
        ? 'Courbe des scores d’audit par période.'
        : 'Courbe des valeurs par période.')
  );

  const gradId = `dlaf-${Math.random().toString(36).slice(2, 11)}`;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const lg = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  lg.setAttribute('id', gradId);
  lg.setAttribute('x1', '0');
  lg.setAttribute('y1', '0');
  lg.setAttribute('x2', '0');
  lg.setAttribute('y2', '1');
  const gradStops =
    lineTheme === 'audits'
      ? [
          { off: '0%', color: 'rgba(99, 102, 241, 0.25)' },
          { off: '60%', color: 'rgba(45, 212, 191, 0.1)' },
          { off: '100%', color: 'rgba(13, 148, 136, 0)' }
        ]
      : [
          { off: '0%', color: 'rgba(20, 184, 166, 0.22)' },
          { off: '60%', color: 'rgba(20, 184, 166, 0.08)' },
          { off: '100%', color: 'rgba(20, 184, 166, 0)' }
        ];
  const lgKids = gradStops.map((gs) => {
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop.setAttribute('offset', gs.off);
    stop.setAttribute('stop-color', gs.color);
    return stop;
  });
  lg.append(...lgKids);
  defs.append(lg);

  const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  areaPath.setAttribute('d', areaD);
  areaPath.setAttribute('class', 'dashboard-line-chart-area');
  areaPath.setAttribute('fill', `url(#${gradId})`);

  const lineStroke = lineTheme === 'audits' ? '#6366f1' : 'rgb(20, 184, 166)';
  const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  linePath.setAttribute('d', d);
  linePath.setAttribute('fill', 'none');
  linePath.setAttribute('class', 'dashboard-line-chart-line');
  linePath.style.stroke = lineStroke;
  linePath.style.strokeWidth = '2.5px';
  linePath.setAttribute('stroke-linecap', 'round');
  linePath.setAttribute('stroke-linejoin', 'round');

  svg.append(defs);

  svg.append(areaPath, linePath);
  if (lineTheme === 'audits') {
    const tgt =
      options.targetYPercent != null && Number.isFinite(Number(options.targetYPercent))
        ? Math.max(0, Math.min(100, Number(options.targetYPercent)))
        : 80;
    const ty = yScale(tgt);
    const tl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tl.setAttribute('x1', String(padL));
    tl.setAttribute('y1', String(ty.toFixed(1)));
    tl.setAttribute('x2', String(w - padR));
    tl.setAttribute('y2', String(ty.toFixed(1)));
    tl.setAttribute('class', 'dashboard-line-chart-target-80');
    tl.setAttribute('pointer-events', 'none');
    svg.append(tl);
    const tlab = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tlab.setAttribute('x', String(w - padR - 2));
    tlab.setAttribute('y', String(ty - 5));
    tlab.setAttribute('text-anchor', 'end');
    tlab.setAttribute('class', 'dashboard-line-chart-target-80-label');
    const tlabStr =
      typeof options.targetLabel === 'string' && options.targetLabel.trim()
        ? options.targetLabel.trim()
        : `Objectif ${tgt} %`;
    tlab.textContent = tlabStr;
    svg.append(tlab);
  }

  const dotR =
    options.variant === 'analytics' && n > 5
      ? '3.6'
      : '4';
  const dotStroke = lineTheme === 'audits' ? '#6366f1' : 'rgb(20, 184, 166)';
  pts.forEach((p) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', String(p.x));
    c.setAttribute('cy', String(p.y));
    c.setAttribute('r', dotR);
    c.setAttribute('class', 'dashboard-line-chart-dot');
    c.setAttribute('fill', '#ffffff');
    c.setAttribute('stroke', dotStroke);
    c.setAttribute('stroke-width', '2');
    svg.append(c);
  });

  const tip = createChartTooltipEl();
  const frame = document.createElement('div');
  frame.className = 'dashboard-line-chart-frame dashboard-line-chart-frame--enter';
  frame.style.opacity = '0';
  frame.style.animation = 'qhseDashLineChartIn 800ms cubic-bezier(0.76, 0, 0.24, 1) forwards';
  frame.append(svg, tip);

  const labels = document.createElement('div');
  labels.className = 'dashboard-line-chart-labels';
  labels.style.fontSize = '11px';
  labels.style.color = '#94a3b8';
  labels.style.display = 'flex';
  labels.style.justifyContent = 'space-between';
  labels.style.width = '100%';
  labels.style.boxSizing = 'border-box';
  labels.style.paddingLeft = `${padL}px`;
  labels.style.paddingRight = `${padR}px`;
  labels.style.marginTop = '6px';
  safe.forEach((p) => {
    const s = document.createElement('span');
    s.className = 'dashboard-line-chart-label-cell';
    s.textContent = p.label;
    labels.append(s);
  });

  const foot = document.createElement('p');
  foot.className = 'dashboard-chart-foot dashboard-chart-foot--tight';
  if (options.footText !== undefined && options.footText !== null) {
    foot.textContent = options.footText;
  } else {
    const total = safe.reduce((a, p) => a + p.value, 0);
    foot.textContent = total === 0 ? 'Aucune donnée sur cette période.' : '';
  }

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent =
    options.interpretText !== undefined
      ? options.interpretText
      : lineTheme === 'audits'
        ? interpretAuditScoreSeries(safe)
        : interpretIncidentTrend(safe);

  const tail = [frame, labels];
  if (String(foot.textContent || '').trim()) tail.push(foot);
  if (String(interpret.textContent || '').trim()) tail.push(interpret);
  const dotHoverStyle = document.createElement('style');
  dotHoverStyle.textContent = `#${wrapScopedId} .dashboard-line-chart-dot--active{r:6px}`;
  wrap.prepend(dotHoverStyle);
  wrap.append(...tail);
  bindDashboardLineChartHover(wrap, svg, tip, pts, safe, options, { w, h });
  return wrap;
}

/**
 * @param {{ overdue: number; done: number; other: number }} parts
 */
export function createActionsMixChart(parts) {
  const wrap = document.createElement('div');
  wrap.className = 'dashboard-mix-chart-wrap';

  const o = Math.max(0, Number(parts.overdue) || 0);
  const d = Math.max(0, Number(parts.done) || 0);
  const r = Math.max(0, Number(parts.other) || 0);
  const sum = o + d + r || 1;

  const bar = document.createElement('div');
  bar.className = 'dashboard-mix-bar';
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', 'Répartition des actions : en retard, terminées, autres statuts.');

  const segO = document.createElement('div');
  segO.className = 'dashboard-mix-seg dashboard-mix-seg--overdue';
  segO.style.flex = `${(o / sum) * 100}`;
  segO.title = `En retard : ${o}`;
  bindMixSegmentHover(segO);

  const segD = document.createElement('div');
  segD.className = 'dashboard-mix-seg dashboard-mix-seg--done';
  segD.style.flex = `${(d / sum) * 100}`;
  segD.title = `Terminées : ${d}`;
  bindMixSegmentHover(segD);

  const segR = document.createElement('div');
  segR.className = 'dashboard-mix-seg dashboard-mix-seg--other';
  segR.style.flex = `${(r / sum) * 100}`;
  segR.title = `Autres : ${r}`;
  bindMixSegmentHover(segR);

  bar.append(segO, segD, segR);

  const legend = document.createElement('ul');
  legend.className = 'dashboard-mix-legend';
  [
    { label: 'En retard', value: o, cls: 'dashboard-mix-dot--overdue' },
    { label: 'Terminées / clos', value: d, cls: 'dashboard-mix-dot--done' },
    { label: 'En cours / autre', value: r, cls: 'dashboard-mix-dot--other' }
  ].forEach(({ label, value, cls }) => {
    const li = document.createElement('li');
    li.className = 'dashboard-mix-legend-item';
    const dot = document.createElement('span');
    dot.className = `dashboard-mix-dot ${cls}`;
    const txt = document.createElement('span');
    txt.textContent = `${label} — ${value}`;
    li.append(dot, txt);
    legend.append(li);
  });

  const foot = document.createElement('p');
  foot.className = 'dashboard-chart-foot dashboard-mix-foot';
  foot.textContent = '';

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent = interpretActionsMixParts({ overdue: o, done: d, other: r });

  wrap.append(bar, legend, foot, interpret);
  return wrap;
}

/**
 * @param {Array<{ type: string; count: number }>} entries max 5
 */
export function createIncidentTypeBreakdown(entries) {
  const wrap = document.createElement('div');
  wrap.className = 'dashboard-breakdown-wrap';

  const list = Array.isArray(entries) ? entries.slice(0, 5) : [];
  const max = Math.max(1, ...list.map((e) => Number(e.count) || 0));

  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'dashboard-situation-note';
    p.textContent = 'Aucune donnée sur cette période.';
    wrap.append(p);
    return wrap;
  }

  list.forEach((e, rowIdx) => {
    const row = document.createElement('div');
    row.className = 'dashboard-breakdown-row';
    const lab = document.createElement('div');
    lab.className = 'dashboard-breakdown-label';
    lab.textContent = e.type || '—';
    const track = document.createElement('div');
    track.className = 'dashboard-breakdown-track';
    const fill = document.createElement('div');
    const slot = rowIdx % 5;
    fill.className = `dashboard-breakdown-fill dashboard-breakdown-fill--tone-${slot}`;
    const c = Number(e.count) || 0;
    fill.style.width = `${Math.round((c / max) * 100)}%`;
    const num = document.createElement('span');
    num.className = 'dashboard-breakdown-count';
    num.textContent = String(c);
    track.append(fill);
    row.append(lab, track, num);
    wrap.append(row);
  });

  const foot = document.createElement('p');
  foot.className = 'dashboard-chart-foot dashboard-chart-foot--tight';
  foot.textContent = '';

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent = interpretIncidentTypesList(list);

  wrap.append(foot, interpret);

  return wrap;
}

/**
 * @param {Array<{ status?: string; dueDate?: string | null }>} actions
 */
export function classifyActionsForMix(actions) {
  if (!Array.isArray(actions)) return { overdue: 0, done: 0, other: 0 };
  let overdue = 0;
  let done = 0;
  let other = 0;
  actions.forEach((a) => {
    const s = String(a?.status || '').toLowerCase();
    if (isActionOverdueDashboardRow(a)) overdue += 1;
    else if (
      /termin|clos|ferm|clôtur|realis|réalis|effectu|complete|complété|fait/.test(s)
    )
      done += 1;
    else other += 1;
  });
  return { overdue, done, other };
}

/**
 * @param {Array<{ type?: string }>} incidents
 */
export function buildTopIncidentTypes(incidents, take = 5) {
  if (!Array.isArray(incidents)) return [];
  const map = new Map();
  incidents.forEach((inc) => {
    const t = String(inc?.type || 'Autre').trim() || 'Autre';
    map.set(t, (map.get(t) || 0) + 1);
  });
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, take);
}

/**
 * Série temporelle des scores d’audit (API) — derniers enregistrements chronologiques.
 * @param {Array<{ score?: unknown; updatedAt?: string; createdAt?: string }>} audits
 * @returns {{ label: string; value: number }[]}
 */
export function buildAuditScoreSeriesFromAudits(audits) {
  if (!Array.isArray(audits) || !audits.length) return [];
  const rows = audits
    .map((a) => {
      const score = normalizeAuditScoreValue(a?.score);
      if (!Number.isFinite(score)) return null;
      const tms = getAuditTimestampMs(a);
      const t = tms == null ? 0 : tms;
      return { t, score };
    })
    .filter(Boolean);
  rows.sort((a, b) => a.t - b.t);

  /** Dernier score par mois calendaire — évite les libellés « nov. nov. » en doublon. */
  const byMonth = new Map();
  rows.forEach((r) => {
    if (r.t <= 0) return;
    const d = new Date(r.t);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, { t: r.t, score: r.score });
  });
  const monthKeys = [...byMonth.keys()].sort();
  const sliceKeys = monthKeys.slice(-8);
  if (sliceKeys.length) {
    return sliceKeys.map((key) => {
      const r = byMonth.get(key);
      const d = new Date(r.t);
      return {
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        value: Math.round(Math.max(0, Math.min(100, r.score)))
      };
    });
  }

  return rows.slice(-8).map((r, i) => ({
    label:
      r.t > 0
        ? new Date(r.t).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
        : `${i + 1}`,
    value: Math.round(Math.max(0, Math.min(100, r.score)))
  }));
}

/**
 * @param {{ label: string; value: number }[]} series
 */
export function interpretAuditScoreSeries(series) {
  if (!Array.isArray(series) || series.length === 0) {
    return 'Aucun score d’audit exploitable sur la période chargée.';
  }
  const vals = series.map((p) => p.value).filter(Number.isFinite);
  if (!vals.length) return 'Scores non numériques — vérifiez les données.';
  const first = vals[0];
  const last = vals[vals.length - 1];
  const delta = last - first;
  if (vals.length === 1) {
    return `Dernier score enregistré : ${last} % — chargez plus d’audits pour une tendance.`;
  }
  if (delta >= 4) {
    return `Tendance à la hausse : ${first} % → ${last} % sur la série affichée.`;
  }
  if (delta <= -4) {
    return `Tendance à la baisse : ${first} % → ${last} % — creuser les causes et le plan d’actions.`;
  }
  return `Scores stables autour de ${last} % (fourchette ${Math.min(...vals)}–${Math.max(...vals)} %).`;
}

function interpretPilotageTri(c, o, n) {
  const sum = c + o + n;
  if (sum === 0) {
    return 'Aucun signal sur ces trois indicateurs — données à enrichir.';
  }
  const max = Math.max(c, o, n);
  if (max === o && o >= c && o >= n && o > 0) {
    return 'Les actions en retard pèsent fortement — prioriser l’exécution et les relances.';
  }
  if (max === n && n > 0) {
    return 'Volume notable de NC ouvertes — aligner audits et plans d’actions.';
  }
  if (max === c && c > 0) {
    return 'Incidents critiques à traiter en priorité avec la hiérarchie et les équipes.';
  }
  return 'Charge répartie entre incidents critiques, retards d’actions et NC ouvertes.';
}

/**
 * Charges prioritaires : incidents critiques (liste), actions en retard (compteur), NC ouvertes.
 * @param {{ criticalIncidents?: number; overdueActions?: number; ncOpen?: number }} parts
 * @param {{ compact?: boolean }} [options]
 */
export function createPilotageLoadMixChart(parts, options = {}) {
  const compact = !!options.compact;
  const c = Math.max(0, Number(parts.criticalIncidents) || 0);
  const o = Math.max(0, Number(parts.overdueActions) || 0);
  const n = Math.max(0, Number(parts.ncOpen) || 0);
  const sum = c + o + n || 1;

  const wrap = document.createElement('div');
  wrap.className = compact
    ? 'dashboard-pilot-load dashboard-pilot-load--compact'
    : 'dashboard-pilot-load';

  const inner = document.createElement('div');
  inner.className = 'dashboard-pilot-load-inner';

  const main = document.createElement('div');
  main.className = 'dashboard-pilot-load-main';

  const bar = document.createElement('div');
  bar.className = compact
    ? 'dashboard-mix-bar dashboard-mix-bar--pilot dashboard-mix-bar--pilot-compact'
    : 'dashboard-mix-bar dashboard-mix-bar--pilot';
  bar.setAttribute('role', 'img');
  bar.setAttribute(
    'aria-label',
    'Répartition relative : incidents critiques, actions en retard, non-conformités ouvertes.'
  );

  const segC = document.createElement('div');
  segC.className = 'dashboard-mix-seg dashboard-mix-seg--pilot-crit';
  segC.style.flex = `${(c / sum) * 100}`;
  segC.title = `Incidents critiques (liste) : ${c}`;
  bindMixSegmentHover(segC);

  const segO = document.createElement('div');
  segO.className = 'dashboard-mix-seg dashboard-mix-seg--pilot-watch';
  segO.style.flex = `${(o / sum) * 100}`;
  segO.title = `Actions en retard : ${o}`;
  bindMixSegmentHover(segO);

  const segN = document.createElement('div');
  segN.className = 'dashboard-mix-seg dashboard-mix-seg--pilot-nc';
  segN.style.flex = `${(n / sum) * 100}`;
  segN.title = `NC ouvertes : ${n}`;
  bindMixSegmentHover(segN);

  bar.append(segC, segO, segN);

  const legend = document.createElement('ul');
  legend.className = compact
    ? 'dashboard-mix-legend dashboard-mix-legend--pilot-compact'
    : 'dashboard-mix-legend dashboard-mix-legend--pilot';
  [
    { label: 'Incidents critiques (liste)', value: c, cls: 'dashboard-mix-dot--pilot-crit' },
    { label: 'Actions en retard', value: o, cls: 'dashboard-mix-dot--pilot-watch' },
    { label: 'NC ouvertes', value: n, cls: 'dashboard-mix-dot--pilot-nc' }
  ].forEach(({ label, value, cls }) => {
    const li = document.createElement('li');
    li.className = 'dashboard-mix-legend-item';
    const dot = document.createElement('span');
    dot.className = `dashboard-mix-dot ${cls}`;
    const txt = document.createElement('span');
    txt.textContent = `${label} — ${value}`;
    li.append(dot, txt);
    legend.append(li);
  });

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent = interpretPilotageTri(c, o, n);

  if (compact) {
    wrap.append(bar, legend, interpret);
    return wrap;
  }

  main.append(bar, legend);

  const side = document.createElement('div');
  side.className = 'dashboard-pilot-load-side';
  function pilotStat(mod, value, kicker, sub) {
    const el = document.createElement('div');
    el.className = `dashboard-pilot-stat dashboard-pilot-stat--${mod}`;
    const v = document.createElement('span');
    v.className = 'dashboard-pilot-stat-val';
    v.textContent = String(value);
    const k = document.createElement('span');
    k.className = 'dashboard-pilot-stat-kicker';
    k.textContent = kicker;
    const s = document.createElement('span');
    s.className = 'dashboard-pilot-stat-sub';
    s.textContent = sub;
    el.append(v, k, s);
    return el;
  }
  side.append(
    pilotStat('crit', c, 'Critiques', 'liste chargée'),
    pilotStat('watch', o, 'Retards', 'plan d’actions'),
    pilotStat('nc', n, 'NC ouvertes', 'non conformités')
  );

  inner.append(main, side);
  wrap.append(inner);

  wrap.append(interpret);
  return wrap;
}

/**
 * Comparaison visuelle des volumes clés (données synthèse `counts` uniquement).
 * @param {Record<string, unknown>} counts
 */
export function createAnalyticsKeyCountsBarChart(counts) {
  const items = [
    {
      label: 'Incidents (30 j.)',
      value: Math.max(0, Number(counts.incidentsLast30Days) || 0),
      tone: 'inc'
    },
    {
      label: 'NC ouvertes',
      value: Math.max(0, Number(counts.nonConformitiesOpen) || 0),
      tone: 'nc'
    },
    {
      label: 'Actions en retard',
      value: Math.max(0, Number(counts.actionsOverdue) || 0),
      tone: 'late'
    },
    {
      label: 'Audits (base)',
      value: Math.max(0, Number(counts.auditsTotal) || 0),
      tone: 'aud'
    }
  ];
  const max = Math.max(1, ...items.map((i) => i.value));

  const wrap = document.createElement('div');
  wrap.className = 'analytics-key-bars';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute(
    'aria-label',
    'Volumes relatifs : incidents sur 30 jours, NC ouvertes, actions en retard, audits en base.'
  );

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = `analytics-key-bars-row analytics-key-bars-row--${item.tone}`;
    row.title = `${item.label} : ${item.value} (échelle relative au plus grand des quatre volumes affichés)`;
    const lab = document.createElement('span');
    lab.className = 'analytics-key-bars-label';
    lab.textContent = item.label;
    const track = document.createElement('div');
    track.className = 'analytics-key-bars-track';
    const fill = document.createElement('div');
    fill.className = 'analytics-key-bars-fill';
    fill.style.width = `${Math.round((item.value / max) * 100)}%`;
    const num = document.createElement('span');
    num.className = 'analytics-key-bars-val';
    num.textContent = String(item.value);
    track.append(fill);
    row.append(lab, track, num);
    wrap.append(row);
  });

  const foot = document.createElement('p');
  foot.className = 'dashboard-chart-foot dashboard-chart-foot--tight';
  foot.style.marginTop = '10px';
  foot.textContent =
    'Échelle relative au plus grand des quatre volumes — pour comparer rapidement les ordres de grandeur.';

  wrap.append(foot);
  return wrap;
}

function interpretRequirementMix(ok, part, nc) {
  const t = ok + part + nc;
  if (t === 0) return 'Aucune exigence suivie.';
  const ratioNc = nc / t;
  if (ratioNc > 0.2) return 'Part importante d’exigences non conformes — plan de correction urgent.';
  if (part > nc * 2) return 'Nombreuses exigences partielles — consolider les preuves et jalons.';
  return `${ok} exigence(s) au vert sur ${t} — poursuivre le cycle de preuve.`;
}

/**
 * @param {{ conforme: number; partiel: number; nonConforme: number }} counts
 */
export function createRequirementStatusMixChart(counts) {
  const ok = Math.max(0, Number(counts.conforme) || 0);
  const part = Math.max(0, Number(counts.partiel) || 0);
  const nc = Math.max(0, Number(counts.nonConforme) || 0);
  const sum = ok + part + nc || 1;

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-mix-chart-wrap';

  const bar = document.createElement('div');
  bar.className = 'dashboard-mix-bar';
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', 'Répartition des exigences : conforme, partiel, non conforme.');

  const segOk = document.createElement('div');
  segOk.className = 'dashboard-mix-seg dashboard-mix-seg--req-ok';
  segOk.style.flex = `${(ok / sum) * 100}`;
  segOk.title = `Conformes : ${ok}`;
  bindMixSegmentHover(segOk);

  const segP = document.createElement('div');
  segP.className = 'dashboard-mix-seg dashboard-mix-seg--req-part';
  segP.style.flex = `${(part / sum) * 100}`;
  segP.title = `Partiels : ${part}`;
  bindMixSegmentHover(segP);

  const segNc = document.createElement('div');
  segNc.className = 'dashboard-mix-seg dashboard-mix-seg--req-nc';
  segNc.style.flex = `${(nc / sum) * 100}`;
  segNc.title = `Non conformes : ${nc}`;
  bindMixSegmentHover(segNc);

  bar.append(segOk, segP, segNc);

  const legend = document.createElement('ul');
  legend.className = 'dashboard-mix-legend';
  [
    { label: 'Conforme', value: ok, cls: 'dashboard-mix-dot--req-ok' },
    { label: 'Partiel', value: part, cls: 'dashboard-mix-dot--req-part' },
    { label: 'Non conforme', value: nc, cls: 'dashboard-mix-dot--req-nc' }
  ].forEach(({ label, value, cls }) => {
    const li = document.createElement('li');
    li.className = 'dashboard-mix-legend-item';
    const dot = document.createElement('span');
    dot.className = `dashboard-mix-dot ${cls}`;
    const txt = document.createElement('span');
    txt.textContent = `${label} — ${value}`;
    li.append(dot, txt);
    legend.append(li);
  });

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent = interpretRequirementMix(ok, part, nc);

  wrap.append(bar, legend, interpret);
  return wrap;
}

function interpretDocAttention(m, obs, crit) {
  const t = m + obs + crit;
  if (t === 0) return 'Aucun document signalé en alerte sur ce périmètre.';
  if (m >= obs && m >= crit) return 'Des preuves manquantes dominent — prioriser la collecte.';
  return `${t} point(s) documentaire(s) à traiter (manquants, obsolètes ou critiques).`;
}

/**
 * @param {{ missing: number; obsolete: number; critical: number }} counts
 */
export function createDocumentAttentionMixChart(counts) {
  const m = Math.max(0, Number(counts.missing) || 0);
  const obs = Math.max(0, Number(counts.obsolete) || 0);
  const crit = Math.max(0, Number(counts.critical) || 0);
  const sum = m + obs + crit || 1;

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-mix-chart-wrap';

  const bar = document.createElement('div');
  bar.className = 'dashboard-mix-bar';
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', 'Documents : manquants, obsolètes, critiques.');

  const segM = document.createElement('div');
  segM.className = 'dashboard-mix-seg dashboard-mix-seg--doc-miss';
  segM.style.flex = `${(m / sum) * 100}`;
  segM.title = `Manquants : ${m}`;
  bindMixSegmentHover(segM);

  const segO = document.createElement('div');
  segO.className = 'dashboard-mix-seg dashboard-mix-seg--doc-obs';
  segO.style.flex = `${(obs / sum) * 100}`;
  segO.title = `Obsolètes : ${obs}`;
  bindMixSegmentHover(segO);

  const segC = document.createElement('div');
  segC.className = 'dashboard-mix-seg dashboard-mix-seg--doc-crit';
  segC.style.flex = `${(crit / sum) * 100}`;
  segC.title = `Critiques : ${crit}`;
  bindMixSegmentHover(segC);

  bar.append(segM, segO, segC);

  const legend = document.createElement('ul');
  legend.className = 'dashboard-mix-legend';
  [
    { label: 'Manquants', value: m, cls: 'dashboard-mix-dot--doc-miss' },
    { label: 'Obsolètes', value: obs, cls: 'dashboard-mix-dot--doc-obs' },
    { label: 'Critiques', value: crit, cls: 'dashboard-mix-dot--doc-crit' }
  ].forEach(({ label, value, cls }) => {
    const li = document.createElement('li');
    li.className = 'dashboard-mix-legend-item';
    const dot = document.createElement('span');
    dot.className = `dashboard-mix-dot ${cls}`;
    const txt = document.createElement('span');
    txt.textContent = `${label} — ${value}`;
    li.append(dot, txt);
    legend.append(li);
  });

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent = interpretDocAttention(m, obs, crit);

  wrap.append(bar, legend, interpret);
  return wrap;
}

function interpretPlanningMix(av, ec, te) {
  const t = av + ec + te;
  if (t === 0) return 'Aucun audit planifié dans les données affichées.';
  if (ec > av && ec >= te) return 'Charge d’audits en cours élevée — sécuriser ressources et preuves.';
  if (av > ec + te) return 'Beaucoup d’audits à venir — préparer calendrier et équipes.';
  return 'Répartition équilibrée entre planifiés, en cours et clôturés (extrait).';
}

/**
 * Barres horizontales — scores par norme ISO (cockpit audit).
 * @param {{ norm: string; score: number }[]} entries
 */
export function createAuditIsoNormBarsChart(entries) {
  const wrap = document.createElement('div');
  wrap.className = 'dashboard-audit-iso-bars';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', 'Scores indicatifs par référentiel ISO');

  const safe =
    Array.isArray(entries) && entries.length
      ? entries
      : [{ norm: '—', score: 0 }];

  const scores = safe.map((e) =>
    Math.round(Math.max(0, Math.min(100, Number(e.score) || 0)))
  );
  const minS = Math.min(...scores);
  const weak = safe.find(
    (e) =>
      Math.round(Math.max(0, Math.min(100, Number(e.score) || 0))) === minS
  );

  safe.forEach((e) => {
    const row = document.createElement('div');
    row.className = 'dashboard-audit-iso-bar-row';
    const lab = document.createElement('span');
    lab.className = 'dashboard-audit-iso-bar-label';
    lab.textContent = e.norm != null ? String(e.norm) : '—';
    const track = document.createElement('div');
    track.className = 'dashboard-audit-iso-bar-track';
    const fill = document.createElement('span');
    fill.className = 'dashboard-audit-iso-bar-fill';
    const v = Math.round(Math.max(0, Math.min(100, Number(e.score) || 0)));
    fill.style.width = `${v}%`;
    fill.title = `${v} %`;
    const val = document.createElement('span');
    val.className = 'dashboard-audit-iso-bar-value';
    val.textContent = `${v}%`;
    track.append(fill);
    row.append(lab, track, val);
    wrap.append(row);
  });

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent = weak
    ? `Écart principal : ${weak.norm} (${Math.round(Math.max(0, Math.min(100, Number(weak.score) || 0)))} %).`
    : 'Répartition par norme (vue stratégique).';
  wrap.append(interpret);
  return wrap;
}

/**
 * @param {{ aVenir: number; enCours: number; termine: number }} counts
 */
export function createPlanningStatusMixChart(counts) {
  const av = Math.max(0, Number(counts.aVenir) || 0);
  const ec = Math.max(0, Number(counts.enCours) || 0);
  const te = Math.max(0, Number(counts.termine) || 0);
  const sum = av + ec + te || 1;

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-mix-chart-wrap';

  const bar = document.createElement('div');
  bar.className = 'dashboard-mix-bar';
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', 'Audits : à venir, en cours, terminés.');

  const segA = document.createElement('div');
  segA.className = 'dashboard-mix-seg dashboard-mix-seg--plan-pending';
  segA.style.flex = `${(av / sum) * 100}`;
  segA.title = `À venir : ${av}`;
  bindMixSegmentHover(segA);

  const segE = document.createElement('div');
  segE.className = 'dashboard-mix-seg dashboard-mix-seg--plan-run';
  segE.style.flex = `${(ec / sum) * 100}`;
  segE.title = `En cours : ${ec}`;
  bindMixSegmentHover(segE);

  const segT = document.createElement('div');
  segT.className = 'dashboard-mix-seg dashboard-mix-seg--plan-done';
  segT.style.flex = `${(te / sum) * 100}`;
  segT.title = `Terminés : ${te}`;
  bindMixSegmentHover(segT);

  bar.append(segA, segE, segT);

  const legend = document.createElement('ul');
  legend.className = 'dashboard-mix-legend';
  [
    { label: 'À venir', value: av, cls: 'dashboard-mix-dot--plan-pending' },
    { label: 'En cours', value: ec, cls: 'dashboard-mix-dot--plan-run' },
    { label: 'Terminés', value: te, cls: 'dashboard-mix-dot--plan-done' }
  ].forEach(({ label, value, cls }) => {
    const li = document.createElement('li');
    li.className = 'dashboard-mix-legend-item';
    const dot = document.createElement('span');
    dot.className = `dashboard-mix-dot ${cls}`;
    const txt = document.createElement('span');
    txt.textContent = `${label} — ${value}`;
    li.append(dot, txt);
    legend.append(li);
  });

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret';
  interpret.textContent = interpretPlanningMix(av, ec, te);

  wrap.append(bar, legend, interpret);
  return wrap;
}
