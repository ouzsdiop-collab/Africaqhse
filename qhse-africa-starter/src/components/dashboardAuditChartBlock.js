/**
 * Bloc graphiques audit (dashboard) — Chart.js, données API + jeu démo si vide.
 */

import {
  buildMonthlyAuditScoreAvgSeries,
  buildNcMajorMinorMonthlySeries,
  interpretAuditScoreSeries
} from './dashboardCharts.js';
import { getDemoAuditChartData } from '../data/dashboardAuditDemoDataset.js';

const MONTH_COUNT = 6;

const CHART_TEXT = '#cbd5e1';
const CHART_GRID = 'rgba(148, 163, 184, 0.14)';

/**
 * @param {object[] | null | undefined} audits
 * @param {object[] | null | undefined} ncs
 */
function prepareModel(audits, ncs) {
  const scoreBuckets = buildMonthlyAuditScoreAvgSeries(audits, MONTH_COUNT);
  const labels = scoreBuckets.map((b) => b.label);
  const scoreHits = scoreBuckets.reduce((a, b) => a + (b.count || 0), 0);

  let scores = scoreBuckets.map((b) => b.value);
  let usingDemoScore = false;
  if (scoreHits === 0) {
    const demo = getDemoAuditChartData(MONTH_COUNT);
    usingDemoScore = true;
    scores = demo.scores.slice(0, labels.length);
  }

  const ncSeries = buildNcMajorMinorMonthlySeries(ncs, MONTH_COUNT);
  let major = ncSeries.major.slice(0, labels.length);
  let minor = ncSeries.minor.slice(0, labels.length);
  let usingDemoNc = false;
  const ncTotal = major.reduce((a, b) => a + b, 0) + minor.reduce((a, b) => a + b, 0);
  if (ncTotal === 0) {
    const demo = getDemoAuditChartData(MONTH_COUNT);
    usingDemoNc = true;
    major = demo.major.slice(0, labels.length);
    minor = demo.minor.slice(0, labels.length);
  }

  const seriesForInterpret = labels.map((label, i) => ({
    label,
    value: Number(scores[i]) || 0
  }));

  return {
    labels,
    scores,
    major,
    minor,
    usingDemoScore,
    usingDemoNc,
    interpret: interpretAuditScoreSeries(seriesForInterpret)
  };
}

/**
 * @returns {{ root: HTMLElement; update: (input: { audits?: object[]; ncs?: object[] }) => void }}
 */
export function createDashboardAuditChartBlock() {
  const root = document.createElement('div');
  root.className = 'dashboard-audit-charts-block';

  const skeleton = document.createElement('div');
  skeleton.className = 'dashboard-audit-charts-skeleton';
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.innerHTML = `
    <div class="dashboard-audit-charts-skeleton__panel">
      <div class="dashboard-audit-charts-skeleton__bar"></div>
      <div class="dashboard-audit-charts-skeleton__bar dashboard-audit-charts-skeleton__bar--2"></div>
    </div>
    <div class="dashboard-audit-charts-skeleton__panel">
      <div class="dashboard-audit-charts-skeleton__bars"></div>
    </div>
  `;

  const chartsHost = document.createElement('div');
  chartsHost.className = 'dashboard-audit-charts-block__charts';
  chartsHost.hidden = true;

  const linePanel = document.createElement('div');
  linePanel.className = 'dashboard-audit-chart-panel';
  const lineTitle = document.createElement('h4');
  lineTitle.className = 'dashboard-audit-chart-panel__title';
  lineTitle.textContent = 'Évolution du score audit';
  const lineCanvasWrap = document.createElement('div');
  lineCanvasWrap.className = 'dashboard-audit-chart-panel__canvas';
  const lineCanvas = document.createElement('canvas');
  lineCanvas.setAttribute('role', 'img');
  lineCanvas.setAttribute('aria-label', 'Courbe du score audit en pourcentage par mois');
  lineCanvasWrap.append(lineCanvas);

  const barPanel = document.createElement('div');
  barPanel.className = 'dashboard-audit-chart-panel';
  const barTitle = document.createElement('h4');
  barTitle.className = 'dashboard-audit-chart-panel__title';
  barTitle.textContent = 'Non-conformités (audit)';
  const barCanvasWrap = document.createElement('div');
  barCanvasWrap.className = 'dashboard-audit-chart-panel__canvas';
  const barCanvas = document.createElement('canvas');
  barCanvas.setAttribute('role', 'img');
  barCanvas.setAttribute('aria-label', 'Histogramme des NC majeures et mineures par mois');
  barCanvasWrap.append(barCanvas);

  linePanel.append(lineTitle, lineCanvasWrap);
  barPanel.append(barTitle, barCanvasWrap);
  chartsHost.append(linePanel, barPanel);

  const emptyEl = document.createElement('div');
  emptyEl.className = 'dashboard-audit-charts-block__empty';
  emptyEl.hidden = true;
  emptyEl.setAttribute('role', 'status');
  emptyEl.innerHTML =
    '<p class="dashboard-audit-charts-block__empty-title">Aucune donnée disponible</p><p class="dashboard-audit-charts-block__empty-sub">Le module graphique n’a pas pu s’afficher.</p>';

  const interpret = document.createElement('p');
  interpret.className = 'dashboard-chart-interpret dashboard-audit-charts-block__interpret';

  const foot = document.createElement('p');
  foot.className = 'dashboard-chart-foot dashboard-chart-foot--tight dashboard-audit-charts-block__foot';

  root.append(skeleton, chartsHost, emptyEl, interpret, foot);

  /** @type {{ destroy: () => void } | null} */
  let lineChart = null;
  /** @type {{ destroy: () => void } | null} */
  let barChart = null;

  /**
   * Certains resets CSS peuvent neutraliser [hidden] ; on force aussi display:none.
   * @param {HTMLElement} el
   * @param {boolean} visible
   */
  function setVisible(el, visible) {
    el.hidden = !visible;
    el.style.display = visible ? '' : 'none';
  }

  function destroyCharts() {
    lineChart?.destroy();
    barChart?.destroy();
    lineChart = null;
    barChart = null;
  }

  /**
   * @param {{ audits?: object[]; ncs?: object[] }} input
   */
  function update(input = {}) {
    const audits = input.audits || [];
    const ncs = input.ncs || [];
    const model = prepareModel(audits, ncs);

    interpret.textContent = model.interpret || '';
    const footBits = [];
    if (model.usingDemoScore) footBits.push('courbe score : jeu de démonstration');
    if (model.usingDemoNc) footBits.push('NC majeures / mineures : jeu de démonstration');
    foot.textContent = footBits.length
      ? `Note — ${footBits.join(' · ')}. Les données réelles remplacent la démo dès qu’elles existent sur la période.`
      : 'Données issues des audits et NC chargés pour les six derniers mois.';

    setVisible(skeleton, true);
    setVisible(chartsHost, false);
    setVisible(emptyEl, false);

    void (async () => {
      try {
        const { default: Chart } = await import('chart.js/auto');
        destroyCharts();

        lineChart = new Chart(lineCanvas, {
          type: 'line',
          data: {
            labels: model.labels,
            datasets: [
              {
                label: 'Score audit',
                data: model.scores,
                borderColor: 'rgba(129, 140, 248, 0.95)',
                backgroundColor: 'rgba(99, 102, 241, 0.18)',
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: 'rgba(15, 23, 42, 0.95)',
                pointBorderColor: 'rgba(129, 140, 248, 1)',
                pointBorderWidth: 2,
                borderWidth: 2.5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 620, easing: 'easeOutCubic' },
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: {
                ticks: { color: CHART_TEXT, maxRotation: 0, font: { size: 10 } },
                grid: { color: CHART_GRID }
              },
              y: {
                min: 0,
                max: 100,
                ticks: {
                  color: CHART_TEXT,
                  callback: (v) => `${v} %`,
                  font: { size: 10 }
                },
                grid: { color: CHART_GRID }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                titleColor: '#f1f5f9',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(99, 102, 241, 0.35)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  title(items) {
                    return items?.[0]?.label ? `Période : ${items[0].label}` : '';
                  },
                  label(ctx) {
                    return ` Score audit : ${ctx.parsed.y} %`;
                  },
                  afterLabel(ctx) {
                    const tgt = 80;
                    const y = Number(ctx.parsed.y);
                    if (!Number.isFinite(y)) return '';
                    const d = y - tgt;
                    if (Math.abs(d) < 1) return `Objectif référence : ${tgt} % (à l’objectif)`;
                    return `Objectif référence : ${tgt} % (${d >= 0 ? '+' : ''}${d.toFixed(0)} pt)`;
                  }
                }
              }
            }
          }
        });

        barChart = new Chart(barCanvas, {
          type: 'bar',
          data: {
            labels: model.labels,
            datasets: [
              {
                label: 'NC majeures',
                data: model.major,
                backgroundColor: 'rgba(239, 91, 107, 0.88)',
                borderColor: 'rgba(248, 113, 113, 0.5)',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 28
              },
              {
                label: 'NC mineures',
                data: model.minor,
                backgroundColor: 'rgba(234, 179, 8, 0.82)',
                borderColor: 'rgba(251, 191, 36, 0.45)',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 28
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 580, easing: 'easeOutCubic' },
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: {
                stacked: false,
                ticks: { color: CHART_TEXT, maxRotation: 0, font: { size: 10 } },
                grid: { display: false }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  color: CHART_TEXT,
                  stepSize: 1,
                  precision: 0,
                  font: { size: 10 }
                },
                grid: { color: CHART_GRID }
              }
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: CHART_TEXT,
                  font: { size: 11 },
                  boxWidth: 10,
                  padding: 14
                }
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                titleColor: '#f1f5f9',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(148, 163, 184, 0.25)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  title(items) {
                    return items?.[0]?.label ? `Mois : ${items[0].label}` : '';
                  },
                  label(ctx) {
                    const v = ctx.parsed.y;
                    const name = ctx.dataset.label || 'Série';
                    return ` ${name} : ${v} NC`;
                  },
                  footer(items) {
                    if (!items?.length) return '';
                    const idx = items[0].dataIndex;
                    const m = model.major[idx] || 0;
                    const n = model.minor[idx] || 0;
                    return `Total mois : ${m + n} NC`;
                  }
                }
              }
            }
          }
        });

        setVisible(skeleton, false);
        setVisible(chartsHost, true);
      } catch (e) {
        console.warn('[dashboard] Chart.js audit block', e);
        destroyCharts();
        setVisible(skeleton, false);
        setVisible(chartsHost, false);
        setVisible(emptyEl, true);
        foot.textContent = '';
      }
    })();
  }

  return { root, update };
}
