/**
 * Bandeau hero direction : site actif, messages hiérarchisés, export.
 * leads[0] = message principal ; leads[1] = précision (optionnel).
 * kickerText — remplace le libellé au-dessus du titre (sinon « Comité QHSE · site »).
 */
import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';

/**
 * @param {{
 *   siteName: string;
 *   headline: string;
 *   leads: string[];
 *   kickerText?: string;
 *   exportButtonClass?: string;
 *   quickLinks?: { label: string; pageId: string }[];
 * }} p
 */
export function createDashboardHero({
  siteName,
  headline,
  leads,
  kickerText,
  exportButtonClass = 'dashboard-export-btn',
  quickLinks = null
}) {
  const hero = document.createElement('section');
  hero.className = 'hero card-soft dashboard-hero';

  const inner = document.createElement('div');
  inner.className = 'dashboard-hero__shell';

  const copy = document.createElement('div');
  copy.className = 'dashboard-hero__copy';

  const kickerEl = document.createElement('div');
  kickerEl.className = 'section-kicker dashboard-hero__kicker';
  const kt = kickerText != null && String(kickerText).trim() !== '' ? String(kickerText).trim() : '';
  kickerEl.textContent = kt || `Comité QHSE · ${siteName}`;

  const h1 = document.createElement('h1');
  h1.className = 'dashboard-hero__title';
  h1.textContent = headline;

  copy.append(kickerEl, h1);

  leads.forEach((text, i) => {
    const p = document.createElement('p');
    const isPrimary = i === 0;
    p.className = isPrimary
      ? 'dashboard-hero__lead dashboard-hero__lead--primary'
      : 'dashboard-hero__lead dashboard-hero__lead--secondary';
    p.textContent = text;
    copy.append(p);
  });

  const actions = document.createElement('div');
  actions.className = 'dashboard-hero__actions';

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = `btn btn-primary dashboard-hero__cta dashboard-hero__cta--featured ${exportButtonClass}`;
  exportBtn.textContent = 'Exporter le reporting';

  actions.append(exportBtn);

  if (Array.isArray(quickLinks) && quickLinks.length) {
    const ql = createDashboardBlockActions(quickLinks, {
      className: 'dashboard-block-actions dashboard-block-actions--hero'
    });
    if (ql) actions.append(ql);
  }

  inner.append(copy, actions);
  hero.append(inner);

  return hero;
}
