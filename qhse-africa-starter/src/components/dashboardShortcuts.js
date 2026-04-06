import { getSessionUser } from '../data/sessionUser.js';
import { canAccessNavPage } from '../utils/permissionsUi.js';

function goPage(pageId) {
  if (!pageId) return;
  window.location.hash = pageId;
}

/**
 * Raccourcis compacts sous le cockpit — mêmes `pageId` que la navigation (hash), sans nouvelle route.
 *
 * @param {{
 *   onExportDirection?: () => void;
 *   overdueCount?: number;
 *   ncCount?: number;
 * }} [opts]
 */
export function createDashboardShortcutsSection(opts = {}) {
  const onExport = typeof opts.onExportDirection === 'function' ? opts.onExportDirection : () => {};
  let overdueCount = Math.max(0, Number(opts.overdueCount) || 0);
  let ncCount = Math.max(0, Number(opts.ncCount) || 0);

  /** @type {{ key: string; label: string; hint: string; page?: string; variant?: string }[]} */
  const specs = [
    {
      key: 'incident',
      label: '+ Créer un incident',
      hint: 'Déclaration terrain',
      page: 'incidents',
      variant: 'incident'
    },
    {
      key: 'action',
      label: '+ Créer une action',
      hint: 'Plan d’actions',
      page: 'actions',
      variant: 'action'
    },
    {
      key: 'audit',
      label: '+ Lancer un audit',
      hint: 'Module audits',
      page: 'audits',
      variant: 'audit'
    },
    {
      key: 'nc',
      label: 'Non-conformités',
      hint: 'Suivi NC & constats',
      page: 'audits',
      variant: 'nc'
    },
    {
      key: 'export',
      label: 'Export / rapport',
      hint: 'Direction',
      variant: 'export'
    }
  ];

  const section = document.createElement('section');
  section.className = 'dashboard-section dashboard-shortcuts';
  section.setAttribute('aria-labelledby', 'dashboard-shortcuts-title');

  const head = document.createElement('header');
  head.className = 'dashboard-section-head';
  const k = document.createElement('span');
  k.className = 'dashboard-section-kicker';
  k.textContent = 'Accès rapide';
  const h = document.createElement('h2');
  h.id = 'dashboard-shortcuts-title';
  h.className = 'dashboard-section-title';
  h.textContent = 'Raccourcis utiles';
  const sub = document.createElement('p');
  sub.className = 'dashboard-section-sub';
  sub.textContent = 'Raccourcis vers les modules.';
  head.append(k, h, sub);

  const grid = document.createElement('div');
  grid.className = 'dashboard-shortcuts__grid ds-action-grid';
  grid.setAttribute('role', 'toolbar');
  grid.setAttribute('aria-label', 'Raccourcis vers les modules QHSE');

  const role = getSessionUser()?.role ?? null;

  /** @type {HTMLSpanElement | undefined} */
  let badgeActions;
  /** @type {HTMLSpanElement | undefined} */
  let badgeNc;

  specs.forEach((def) => {
    if (def.page && !canAccessNavPage(role, def.page)) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    const featured = def.key === 'incident' ? ' dashboard-shortcuts__tile--featured' : '';
    btn.className = `dashboard-shortcuts__tile dashboard-shortcuts__tile--${def.variant || 'default'}${featured}`;
    btn.setAttribute('aria-label', `${def.label} — ${def.hint}`);

    const lab = document.createElement('span');
    lab.className = 'dashboard-shortcuts__tile-label';
    lab.textContent = def.label;
    const hint = document.createElement('span');
    hint.className = 'dashboard-shortcuts__tile-hint';
    hint.textContent = def.hint;
    btn.append(lab);

    if (def.key === 'action') {
      const b = document.createElement('span');
      b.className = 'shortcut-live-badge';
      b.hidden = overdueCount <= 0;
      b.textContent = String(overdueCount);
      badgeActions = b;
      btn.append(b);
    } else if (def.key === 'nc') {
      const b = document.createElement('span');
      b.className = 'shortcut-live-badge';
      b.hidden = ncCount <= 0;
      b.textContent = String(ncCount);
      badgeNc = b;
      btn.append(b);
    }

    btn.append(hint);

    if (def.key === 'export') {
      btn.addEventListener('click', () => onExport());
    } else if (def.page) {
      btn.addEventListener('click', () => goPage(def.page));
    }

    grid.append(btn);
  });

  section.append(head, grid);

  function updateShortcutBadges(next = {}) {
    if (next.overdueCount != null) overdueCount = Math.max(0, Number(next.overdueCount) || 0);
    if (next.ncCount != null) ncCount = Math.max(0, Number(next.ncCount) || 0);
    if (badgeActions) {
      badgeActions.textContent = String(overdueCount);
      badgeActions.hidden = overdueCount <= 0;
    }
    if (badgeNc) {
      badgeNc.textContent = String(ncCount);
      badgeNc.hidden = ncCount <= 0;
    }
  }

  return { root: section, updateShortcutBadges };
}
