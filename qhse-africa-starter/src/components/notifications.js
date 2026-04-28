import { ensureNotificationsPanelStyles } from './notificationsPanelStyles.js';
import { createNotificationRow } from './notificationRow.js';
import { getSessionUser } from '../data/sessionUser.js';
import { AUDITS_TO_SCHEDULE } from '../data/conformityStore.js';
import {
  NOTIF_TIER,
  buildPresentationFeed,
  filterByTier,
  appendDigestSummary,
  getDigestPayload,
  markAllSyntheticGroupsRead
} from '../services/notificationIntelligence.service.js';

/**
 * Panneau notifications : centre premium, filtres par priorité, regroupement, digest.
 * @param {object} params
 * @param {Array} params.notifications : typiquement notificationsStore.all()
 * @param {() => void} params.onMarkAllRead
 * @param {() => void} params.onClose
 * @param {() => void} [params.onPresentationChange] : rafraîchir le shell (badge, etc.)
 * @param {(payload: { id: number|string, page: string, ref: string|null }) => void} [params.onOpenLink]
 */
export function createNotificationsPanel({
  notifications,
  onMarkAllRead,
  onClose,
  onPresentationChange,
  onOpenLink
}) {
  ensureNotificationsPanelStyles();

  const role = getSessionUser()?.role;
  /** @type {NotificationTier | 'all'} */
  let activeFilter = 'all';

  const panel = document.createElement('section');
  panel.className = 'floating-panel card-soft notif-panel notif-panel--premium';

  panel.innerHTML = `
    <div class="floating-panel-head notif-panel__head">
      <div>
        <div class="section-kicker">Notifications</div>
        <h3>Centre de notifications</h3>
        <p class="notif-panel-head-lead">
          Priorités regroupées, moins de bruit. Les synthèses remplacent les doublons ; le digest résume le pilotage.
        </p>
      </div>
      <div class="inline-actions">
        <button type="button" class="text-button mark-all">Tout lire</button>
        <button type="button" class="text-button close-panel">Fermer</button>
      </div>
    </div>
    <div class="notif-panel__filters" role="tablist" aria-label="Filtrer par priorité"></div>
    <div class="stack notifications-list notif-panel__list"></div>
    <details class="notif-panel__digest">
      <summary class="notif-panel__digest-summary">
        <span class="notif-panel__digest-kicker">${NOTIF_TIER.DIGEST}</span>
        <span class="notif-panel__digest-title">Digest pilotage</span>
        <span class="notif-panel__digest-hint">Résumé quotidien / hebdo</span>
      </summary>
      <div class="notif-panel__digest-body"></div>
    </details>
  `;

  const filterHost = panel.querySelector('.notif-panel__filters');
  const list = panel.querySelector('.notifications-list');
  const digestBody = panel.querySelector('.notif-panel__digest-body');

  const filters = [
    { id: 'all', label: 'Tout' },
    { id: NOTIF_TIER.CRITIQUE, label: 'Critique' },
    { id: NOTIF_TIER.ATTENTION, label: 'Attention' },
    { id: NOTIF_TIER.INFO, label: 'Info' }
  ];

  filters.forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'notif-panel__filter-btn';
    b.dataset.tier = f.id;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', f.id === 'all' ? 'true' : 'false');
    b.textContent = f.label;
    b.addEventListener('click', () => {
      activeFilter = f.id;
      filterHost.querySelectorAll('.notif-panel__filter-btn').forEach((el) => {
        el.classList.toggle('notif-panel__filter-btn--active', el.dataset.tier === f.id);
        el.setAttribute('aria-selected', el.dataset.tier === f.id ? 'true' : 'false');
      });
      renderList();
    });
    filterHost?.append(b);
  });
  filterHost?.querySelector('.notif-panel__filter-btn')?.classList.add('notif-panel__filter-btn--active');

  function getPresentation() {
    return buildPresentationFeed(notifications, { role });
  }

  function renderList() {
    if (!list) return;
    list.replaceChildren();
    const pres = getPresentation();
    const rows = filterByTier(pres, activeFilter);
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'notif-panel__empty';
      empty.textContent = 'Aucune notification dans ce filtre.';
      list.append(empty);
      return;
    }
    rows.forEach((item) => {
      list.append(
        createNotificationRow(item, {
          onOpenLink,
          onAfterMarkRead: () => {
            if (typeof onPresentationChange === 'function') onPresentationChange();
          }
        })
      );
    });
  }

  if (digestBody) {
    appendDigestSummary(digestBody, getDigestPayload(), {
      plannedAuditsCount: AUDITS_TO_SCHEDULE.length
    });
  }

  renderList();

  panel.querySelector('.mark-all')?.addEventListener('click', () => {
    markAllSyntheticGroupsRead();
    onMarkAllRead();
  });
  panel.querySelector('.close-panel')?.addEventListener('click', onClose);

  return panel;
}
