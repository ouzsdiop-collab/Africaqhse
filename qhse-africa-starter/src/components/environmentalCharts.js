/**
 * Graphiques Chart.js du module Environnement : tendance mensuelle (par type) + répartition par type.
 */

import { Chart, registerables } from 'chart.js';

const TYPE_LABELS = {
  waste: 'Déchets',
  water: 'Eau',
  energy: 'Énergie'
};

const TYPE_COLORS = {
  waste: '#c2752c',
  water: '#2f7fd6',
  energy: '#2e7d32'
};

let chartJsReady = false;

function ensureChartJsReady() {
  if (chartJsReady) return;
  Chart.register(...registerables);
  chartJsReady = true;
}

/**
 * @param {{ periodDate: string, type: string, quantity: number }[]} records
 * @returns {{ labels: string[], datasets: { type: string, label: string, color: string, data: number[] }[] }}
 */
export function buildMonthlyTrendData(records) {
  const months = [];
  const monthKeySet = new Set();
  (records || []).forEach((r) => {
    if (!r?.periodDate) return;
    const d = new Date(r.periodDate);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthKeySet.has(key)) {
      monthKeySet.add(key);
      months.push({ key, year: d.getFullYear(), month: d.getMonth() });
    }
  });
  months.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const labels = months.map((m) =>
    new Date(m.year, m.month, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
  );

  const types = Object.keys(TYPE_LABELS);
  const datasets = types.map((type) => {
    const data = months.map((m) => {
      const total = (records || [])
        .filter((r) => {
          if (r.type !== type || !r.periodDate) return false;
          const d = new Date(r.periodDate);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
      return total;
    });
    return { type, label: TYPE_LABELS[type], color: TYPE_COLORS[type], data };
  });

  return { labels, datasets };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ periodDate: string, type: string, quantity: number }[]} records
 * @returns {Chart}
 */
export function createEnvironmentalMonthlyTrendChart(canvas, records) {
  ensureChartJsReady();
  const { labels, datasets } = buildMonthlyTrendData(records);
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: `${ds.color}1f`,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: ds.color,
        pointBorderWidth: 2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 600 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 12, weight: '500' } }
        },
        tooltip: {
          backgroundColor: 'rgba(20,24,32,0.92)',
          padding: 10,
          cornerRadius: 8,
          titleFont: { weight: '600' },
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label} : ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
      }
    }
  });
}

/**
 * Éclaircit ou fonce une couleur hexadécimale d'un facteur donné (-1..1).
 * @param {string} hex
 * @param {number} amount
 */
function shadeColor(hex, amount) {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const adjust = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * amount)));
  r = adjust(r);
  g = adjust(g);
  b = adjust(b);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Construit des libellés et couleurs distincts par ligne (type + unité), pour éviter
 * les doublons de légende quand un même type a plusieurs unités (ex : Énergie en kWh et en L).
 * @param {{ type: string, totalQuantity: number, unit: string }[]} rows
 */
function buildBreakdownPresentation(rows) {
  const countByType = new Map();
  rows.forEach((s) => countByType.set(s.type, (countByType.get(s.type) || 0) + 1));
  const seenIndexByType = new Map();
  return rows.map((s) => {
    const typeLabel = TYPE_LABELS[s.type] || s.type;
    const multiUnit = (countByType.get(s.type) || 0) > 1;
    const label = multiUnit ? `${typeLabel} (${s.unit || 'unité ?'})` : typeLabel;
    const idx = seenIndexByType.get(s.type) || 0;
    seenIndexByType.set(s.type, idx + 1);
    const base = TYPE_COLORS[s.type] || '#999999';
    const color = idx === 0 ? base : shadeColor(base, idx % 2 === 1 ? 0.22 : -0.18);
    return { label, color };
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ type: string, totalQuantity: number, unit: string }[]} summary
 * @returns {Chart}
 */
export function createEnvironmentalTypeBreakdownChart(canvas, summary) {
  ensureChartJsReady();
  const rows = Array.isArray(summary) ? summary : [];
  const presentation = buildBreakdownPresentation(rows);
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: presentation.map((p) => p.label),
      datasets: [
        {
          data: rows.map((s) => Number(s.totalQuantity) || 0),
          backgroundColor: presentation.map((p) => p.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 10,
          hoverBorderWidth: 3,
          spacing: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      animation: { animateRotate: true, duration: 600 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 14,
            font: { size: 12, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(20,24,32,0.92)',
          padding: 10,
          cornerRadius: 8,
          titleFont: { weight: '600' },
          callbacks: {
            label: (ctx) => {
              const row = rows[ctx.dataIndex];
              const total = rows.reduce((sum, r) => sum + (Number(r.totalQuantity) || 0), 0);
              const pct = total > 0 ? Math.round(((Number(row?.totalQuantity) || 0) / total) * 100) : 0;
              return ` ${ctx.label} : ${ctx.parsed} ${row?.unit || ''} (${pct} %)`.trim();
            }
          }
        }
      }
    }
  });
}
