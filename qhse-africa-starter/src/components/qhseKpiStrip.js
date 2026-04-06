import { ensureQhsePilotageStyles } from './qhsePilotageStyles.js';

/**
 * Bandeau de synthèse (3 indicateurs) — classes existantes du design system.
 * items: { label, value, tone?: 'red'|'amber'|'blue'|'green', hint?: string, hintTitle?: string }
 * hintTitle : infobulle native sur la carte (utile quand hint visible est vide pour alléger la grille).
 */
export function createQhseKpiStrip(items) {
  ensureQhsePilotageStyles();

  const wrap = document.createElement('div');
  wrap.className = 'qhse-kpi-strip ds-kpi-grid';

  items.forEach(({ label, value, tone = 'blue', hint = '', hintTitle = '' }) => {
    const card = document.createElement('div');
    card.className = 'metric-card card-soft';
    if (hintTitle) card.title = hintTitle;

    const lbl = document.createElement('div');
    lbl.className = 'metric-label';
    lbl.textContent = label;

    const val = document.createElement('div');
    const toneClass =
      tone === 'red' ? 'red' : tone === 'amber' ? 'amber' : tone === 'green' ? 'green' : 'blue';
    val.className = `metric-value ${toneClass}`;
    val.textContent = String(value);

    card.append(lbl, val);

    if (hint) {
      const note = document.createElement('div');
      note.className = 'metric-note';
      note.textContent = hint;
      card.append(note);
    }

    wrap.append(card);
  });

  return wrap;
}
