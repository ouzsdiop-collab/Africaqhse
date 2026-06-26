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
        backgroundColor: `${ds.color}22`,
        tension: 0.3,
        fill: false,
        pointRadius: 3
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label} : ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
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
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: rows.map((s) => TYPE_LABELS[s.type] || s.type),
      datasets: [
        {
          data: rows.map((s) => Number(s.totalQuantity) || 0),
          backgroundColor: rows.map((s) => TYPE_COLORS[s.type] || '#999'),
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const row = rows[ctx.dataIndex];
              return ` ${ctx.label} : ${ctx.parsed} ${row?.unit || ''}`.trim();
            }
          }
        }
      }
    }
  });
}
