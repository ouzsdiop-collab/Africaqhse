import { ensureQhsePilotageStyles } from './qhsePilotageStyles.js';

/**
 * Bandeau de synthèse : classes existantes du design system.
 * items: { label, value, tone?: 'red'|'amber'|'blue'|'green', hint?: string, hintTitle?: string,
 *   kpiKey?: string, selected?: boolean, onClick?: (kpiKey: string) => void }
 * hintTitle : infobulle native sur la carte (utile quand hint visible est vide pour alléger la grille).
 * Si onClick + kpiKey : carte cliquable (filtre pilotage).
 */
export function createQhseKpiStrip(items) {
  ensureQhsePilotageStyles();

  const wrap = document.createElement('div');
  wrap.className = 'qhse-kpi-strip ds-kpi-grid';

  items.forEach(
    ({
      label,
      value,
      tone = 'blue',
      hint = '',
      hintTitle = '',
      kpiKey = '',
      selected = false,
      onClick
    }) => {
      const interactive = typeof onClick === 'function' && kpiKey;
      const card = interactive ? document.createElement('button') : document.createElement('div');
      if (interactive) card.type = 'button';
      const toneClass =
        tone === 'red' ? 'red' : tone === 'amber' ? 'amber' : tone === 'green' ? 'green' : 'blue';
      card.className =
        'metric-card card-soft dashboard-kpi-card dashboard-kpi-card--tone-' + toneClass;
      if (interactive) {
        card.classList.add('metric-card--kpi-click', 'dashboard-kpi-card--interactive');
        card.setAttribute('aria-pressed', selected ? 'true' : 'false');
        if (selected) card.classList.add('metric-card--kpi-click--on');
      }
      if (hintTitle) card.title = hintTitle;

      const lbl = document.createElement('div');
      lbl.className = 'metric-label';
      lbl.textContent = label;

      const val = document.createElement('div');
      val.className = `metric-value ${toneClass}`;
      val.textContent = String(value);

      const stack = document.createElement('div');
      stack.className = 'dashboard-kpi-card__stack';
      stack.append(lbl, val);
      if (hint) {
        const note = document.createElement('p');
        note.className = 'metric-note metric-note--kpi';
        note.textContent = hint;
        stack.append(note);
      }
      card.append(stack);

      if (interactive) {
        card.addEventListener('click', () => onClick(kpiKey));
      }

      wrap.append(card);
    }
  );

  return wrap;
}
