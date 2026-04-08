import { escapeHtml } from '../utils/escapeHtml.js';

export function createDashboardKpiCard({
  label,
  value,
  note = '',
  tone = 'blue',
  deltaLabel = '',
  impactLabel = '',
  kpiKey = '',
  onOpen
}) {
  const card = document.createElement('article');
  card.className = 'metric-card card-soft dashboard-kpi-card dashboard-kpi-card--interactive';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  if (kpiKey) card.dataset.kpiKey = kpiKey;
  card.setAttribute(
    'aria-label',
    `${label} — ouvrir le détail (recherche et filtres)`
  );
  card.title = 'Cliquer : liste détaillée, filtres, tri — Entrée ou Espace au clavier';
  card.innerHTML = `
    <div class="metric-label">${escapeHtml(label)}</div>
    <div class="metric-value ${escapeHtml(tone)}">${escapeHtml(String(value ?? '—'))}</div>
    <div class="metric-note">${escapeHtml(note)}</div>
    <div class="dashboard-kpi-subline">
      <span class="dashboard-kpi-subline__delta">${escapeHtml(deltaLabel || 'Variation: —')}</span>
      <span class="dashboard-kpi-subline__impact">${escapeHtml(impactLabel || 'Site impacté: —')}</span>
    </div>
  `;
  const open = () => {
    if (typeof onOpen === 'function') onOpen(kpiKey);
  };
  card.addEventListener('click', open);
  card.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      open();
    }
  });
  return card;
}
