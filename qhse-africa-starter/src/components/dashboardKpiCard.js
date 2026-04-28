import { escapeHtml } from '../utils/escapeHtml.js';

const VALID_TONES = new Set(['blue', 'red', 'amber', 'green', 'success']);

/**
 * Carte KPI dashboard : hiérarchie valeur, label, note courte ; accent latéral discret (pilotage pro).
 * @param {{ zeroSuccessMessage?: string }} opts : si défini et valeur à 0, vue « succès » à la place du compteur.
 */
export function createDashboardKpiCard({
  label,
  value,
  note = '',
  tone = 'blue',
  kpiKey = '',
  zeroSuccessMessage = '',
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
  card.setAttribute('aria-label', `${label} : ouvrir le détail`);
  card.title = 'Détail et filtres : clic ou Entrée';

  const noteTrim = String(note || '').trim();
  const successTrim = String(zeroSuccessMessage || '').trim();
  const successBlock =
    successTrim &&
    `<div class="dashboard-kpi-zero-success" hidden>
      <p class="dashboard-kpi-zero-success__msg">${escapeHtml(successTrim)}</p>
    </div>`;
  card.innerHTML = `
    <div class="dashboard-kpi-card__stack">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="dashboard-kpi-default">
        <div class="metric-value ${escapeHtml(safeTone)}">${escapeHtml(String(value ?? 'Non disponible'))}</div>
        <p class="dashboard-kpi-empty-hint" hidden></p>
      </div>
      ${successBlock || ''}
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
