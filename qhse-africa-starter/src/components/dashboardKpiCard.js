import { escapeHtml } from '../utils/escapeHtml.js';

const VALID_TONES = new Set(['blue', 'red', 'amber', 'green']);

/**
 * Carte KPI dashboard — hiérarchie valeur, label, note courte ; accent latéral discret (pilotage pro).
 */
export function createDashboardKpiCard({
  label,
  value,
  note = '',
  tone = 'blue',
  kpiKey = '',
  onOpen
}) {
  const safeTone = VALID_TONES.has(tone) ? tone : 'blue';
  const card = document.createElement('article');
  card.className =
    'metric-card card-soft dashboard-kpi-card dashboard-kpi-card--interactive dashboard-kpi-card--tone-' +
    safeTone;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  if (kpiKey) card.dataset.kpiKey = kpiKey;
  card.setAttribute('aria-label', `${label} — ouvrir le détail`);
  card.title = 'Détail et filtres — clic ou Entrée';

  const noteTrim = String(note || '').trim();
  card.innerHTML = `
    <div class="dashboard-kpi-card__stack">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value ${escapeHtml(safeTone)}">${escapeHtml(String(value ?? '—'))}</div>
      ${
        noteTrim
          ? `<p class="metric-note metric-note--kpi">${escapeHtml(noteTrim)}</p>`
          : ''
      }
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
