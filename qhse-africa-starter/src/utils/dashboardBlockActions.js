/**
 * Liens d’action discrets pour les cartes dashboard (hash = même navigation que la sidebar).
 */

import { getSessionUser } from '../data/sessionUser.js';
import { canAccessNavPage } from './permissionsUi.js';

export function goDashboardPage(pageId) {
  const id = String(pageId || '').replace(/^#/, '');
  if (id) window.location.hash = id;
}

/**
 * Barre d’actions texte (max recommandé : 2 liens).
 * @param {{ label: string; pageId: string }[]} links
 * @param {{ role?: string | null; className?: string }} [opts]
 * @returns {HTMLDivElement | null}
 */
export function createDashboardBlockActions(links, opts = {}) {
  if (!Array.isArray(links) || !links.length) return null;
  const take = links.slice(0, 2);
  const role = opts.role !== undefined ? opts.role : getSessionUser()?.role ?? null;
  const filtered = take.filter((l) => l?.pageId && canAccessNavPage(role, l.pageId));
  if (!filtered.length) return null;

  const wrap = document.createElement('div');
  wrap.className = opts.className || 'dashboard-block-actions';

  filtered.forEach((item, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'dashboard-block-actions-sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '·';
      wrap.append(sep);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dashboard-block-link';
    b.textContent = item.label;
    b.addEventListener('click', () => goDashboardPage(item.pageId));
    wrap.append(b);
  });

  return wrap;
}
