/**
 * Courbe « Incidents (6 mois) » : Chart.js (interaction, tooltip, annotations légères).
 */

import { Chart } from 'chart.js';
import {
  computeIncidentSeriesNarrative,
  buildIncidentExecutiveInterpret
} from '../utils/dashboardIncidentSeriesNarrative.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

/**
 * @param {number} i
 * @param {{ label: string; value: number }[]} safe
 * @param {ReturnType<typeof computeIncidentSeriesNarrative>} nar
 */
function hoverInterpretLine(i, safe, nar) {
  const row = safe[i];
  if (!row) return buildIncidentExecutiveInterpret(safe, nar);
  const v = Number.isFinite(row.value) ? row.value : 0;
  const vig = nar.vigilance[i] || 'Normale';
  const d = nar.deltas[i];
  let ev = '';
  if (d == null) ev = 'Premier mois de la fenêtre.';
  else if (d === 0) ev = 'Stable vs mois précédent.';
  else if (d > 0) ev = `+${d} vs mois précédent, surveiller la trajectoire.`;
  else ev = `${d} vs mois précédent, confirmer la qualité de remontée.`;
  return `${row.label} : ${v} incident${v > 1 ? 's' : ''} · ${vig}. ${ev} Vue globale : ${nar.badgeLabel}.`;
}

/**
 * @param {{ label: string; value: number }[]} safe
 * @param {{
 *   ariaLabel?: string;
 *   interpretText?: string;
 *   footText?: string | null;
 * }} [options]
 */
export function createIncidentsMonthlyLineChartChartJs(safe, options = {}) {
  const narrative = computeIncidentSeriesNarrative(safe);
  const labels = safe.map((p) => p.label || 'Non disponible');
  const values = safe.map((p) => (Number.isFinite(p.value) ? Math.max(0, p.value) : 0));
  const maxVal = Math.max(1, ...values);
  const suggestedMax = Math.max(maxVal + 1, Math.ceil(maxVal * 1.12));

  const wrap = document.createElement('div');
  wrap.className =
    'dashboard-line-chart-wrap dashboard-line-chart-wrap--theme-incidents dashboard-incidents-chartjs';
  wrap.setAttribute('data-qhse-chartjs', '1');

  const metaHead = document.createElement('div');
  metaHead.className = 'dashboard-incidents-chart-meta';
  const badge = document.createElement('span');
  badge.className = `dashboard-incidents-badge ${narrative.badgeCls}`;
  badge.textContent = narrative.badgeLabel;
  const sub = document.createElement('span');
  sub.className = 'dashboard-incidents-chart-meta__sub';
  sub.textContent =
    narrative.total === 0
      ? 'Aucun incident sur la fenêtre'
      : `${narrative.total} cumulés · pic ${narrative.peakVal} (${narrative.peakLabel})`;
  metaHead.append(badge, sub);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'dashboard-incidents-chartjs-canvas-wrap';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    options.ariaLabel ||
      `Tendance incidents six mois : ${narrative.badgeLabel}, ${narrative.total} incidents cumulés, pic ${narrative.peakVal} en ${narrative.peakLabel}.`
  );
  canvasWrap.append(canvas);

  const frame = document.createElement('div');
  frame.className = 'dashboard-line-chart-frame dashboard-line-chart-frame--enter dashboard-incidents-chartjs-frame';
  frame.append(canvasWrap);

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
  const defaultInterpret =
    options.interpretText !== undefined && options.interpretText !== null && String(options.interpretText).trim()
      ? String(options.interpretText)
      : buildIncidentExecutiveInterpret(safe, narrative);
  interpret.textContent = defaultInterpret;

  const ctaRow = document.createElement('div');
  ctaRow.className = 'dashboard-incidents-chartjs-cta';
  const mkCta = (label, hash) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary dashboard-incidents-chartjs-cta__btn';
    b.textContent = label;
    b.addEventListener('click', () => {
      qhseNavigate(hash);
    });
    return b;
  };
  ctaRow.append(
    mkCta('Voir les incidents', 'incidents'),
    mkCta('Plan d’actions', 'actions')
  );

  const annotationPlugin = {
    id: 'qhseIncidentsLightAnnotations',
    /** @param {import('chart.js').Chart} chart */
    afterDatasetsDraw(chart) {
      const nar = narrative;
      if (nar.peakVal <= 0) return;
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data?.length) return;
      const peakEl = meta.data[nar.peakIdx];
      if (!peakEl) return;
      const { ctx } = chart;
      const x = peakEl.x;
      const top = chart.chartArea.top;
      const bottom = chart.chartArea.bottom;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.38)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, top + 2);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '800 9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(251, 146, 60, 0.92)';
      ctx.textAlign = 'left';
      const lx = Math.min(x + 6, chart.chartArea.right - 40);
      ctx.fillText('PIC', lx, Math.max(top + 12, peakEl.y - 10));

      if (nar.trendKey === 'degradation' && meta.data.length >= 3) {
        const a = meta.data[meta.data.length - 3];
        const b = meta.data[meta.data.length - 1];
        if (a && b) {
          const xm = (a.x + b.x) / 2;
          ctx.font = '600 9px system-ui, sans-serif';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.88)';
          ctx.textAlign = 'center';
          ctx.fillText('Fenêtre récente', xm, top + 13);
        }
      }
      ctx.restore();
    }
  };

  const refLinePlugin = {
    id: 'qhseIncidentsRefLine',
    /** @param {import('chart.js').Chart} chart */
    afterDatasetsDraw(chart) {
      const rc = narrative.refCeiling;
      if (rc == null || rc < 0 || rc > suggestedMax) return;
      const yScale = chart.scales.y;
      if (!yScale) return;
      const y = yScale.getPixelForValue(rc);
      const { left, right } = chart.chartArea;
      const { ctx } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1;
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '700 8px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.95)';
      ctx.textAlign = 'left';
      ctx.fillText(`Réf. ${rc}/mois`, left + 4, y - 5);
      ctx.restore();
    }
  };

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  canvasWrap.addEventListener('mouseleave', () => {
    interpret.textContent = defaultInterpret;
  });

  /** @type {import('chart.js').ChartConfiguration<'line'>} */
  const config = {
    type: 'line',
    plugins: [annotationPlugin, refLinePlugin],
    data: {
      labels,
      datasets: [
        {
          label: 'Incidents',
          data: values,
          tension: 0.36,
          fill: true,
          borderWidth: 2.6,
          borderColor: '#f97316',
          pointBackgroundColor: (ctx) =>
            ctx.dataIndex === narrative.peakIdx && narrative.peakVal > 0 ? '#fff7ed' : '#ffffff',
          pointBorderColor: '#ea580c',
          pointBorderWidth: 2,
          pointRadius: (ctx) =>
            ctx.dataIndex === narrative.peakIdx && narrative.peakVal > 0 ? 5.2 : 4,
          pointHoverRadius: 9,
          pointHitRadius: 32,
          pointHoverBorderWidth: 2.4,
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return 'rgba(249, 115, 22, 0.12)';
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
            g.addColorStop(0.45, 'rgba(251, 146, 60, 0.1)');
            g.addColorStop(1, 'rgba(249, 115, 22, 0)');
            return g;
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reducedMotion
        ? false
        : {
            duration: 900,
            easing: 'easeOutQuart'
          },
      interaction: {
        mode: 'nearest',
        intersect: false,
        axis: 'x'
      },
      layout: {
        padding: { left: 2, right: 4, top: 6, bottom: 2 }
      },
      scales: {
        x: {
          offset: false,
          grid: { display: false, drawTicks: true },
          ticks: {
            maxRotation: 0,
            autoSkip: false,
            font: { size: 11, weight: '600' },
            color: 'rgba(148, 163, 184, 0.95)',
            padding: 4
          },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          suggestedMax,
          grace: '4%',
          grid: {
            color: 'rgba(148, 163, 184, 0.14)',
            drawBorder: false
          },
          ticks: {
            precision: 0,
            font: { size: 10, weight: '600' },
            color: 'rgba(148, 163, 184, 0.9)',
            padding: 6
          },
          border: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          position: 'nearest',
          intersect: false,
          displayColors: false,
          caretPadding: 10,
          caretSize: 7,
          cornerRadius: 11,
          padding: { top: 11, right: 14, bottom: 11, left: 14 },
          titleFont: { size: 13, weight: '800' },
          bodyFont: { size: 12, weight: '600' },
          footerFont: { size: 11, weight: '500' },
          titleMarginBottom: 8,
          footerMarginTop: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          footerColor: '#94a3b8',
          borderColor: 'rgba(251, 146, 60, 0.35)',
          borderWidth: 1,
          callbacks: {
            title: (items) => items[0]?.label || 'Non disponible',
            label: (ctx) => {
              const v = ctx.parsed.y ?? 0;
              return `${v} incident${v > 1 ? 's' : ''}`;
            },
            afterBody: (items) => {
              const i = items[0]?.dataIndex ?? 0;
              const d = narrative.deltas[i];
              if (d == null) return '';
              if (d === 0) return 'vs mois précédent : stable';
              if (d > 0) return `vs mois précédent : +${d}`;
              return `vs mois précédent : ${d}`;
            },
            footer: (items) => {
              const i = items[0]?.dataIndex ?? 0;
              const vig = narrative.vigilance[i] || 'Normale';
              const hint = narrative.microHints[i] || '';
              return `Vigilance : ${vig}\n${hint}`;
            }
          }
        }
      },
      onHover: (_event, elements) => {
        if (!elements?.length) {
          interpret.textContent = defaultInterpret;
          return;
        }
        const idx = elements[0].index;
        interpret.textContent = hoverInterpretLine(idx, safe, narrative);
      }
    }
  };

  const chart = new Chart(canvas, config);

  wrap.__qhseChartDestroy = () => {
    try {
      chart.destroy();
    } catch {
      /* ignore */
    }
    wrap.__qhseChartDestroy = undefined;
  };

  wrap.append(metaHead, frame);
  if (String(foot.textContent || '').trim()) wrap.append(foot);
  wrap.append(interpret, ctaRow);

  return wrap;
}
