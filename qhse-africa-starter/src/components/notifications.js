import { ensureNotificationsPanelStyles } from './notificationsPanelStyles.js';
import { createNotificationRow } from './notificationRow.js';

/**
 * Panneau notifications flottant.
 * @param {object} params
 * @param {Array} params.notifications — typiquement notificationsStore.all()
 * @param {() => void} params.onMarkAllRead
 * @param {() => void} params.onClose
 * @param {(payload: { id: number, page: string, ref: string|null }) => void} [params.onOpenLink]
 *        Si fourni, remplace la navigation par défaut (hash). Prévu pour brancher router / état global.
 */
export function createNotificationsPanel({ notifications, onMarkAllRead, onClose, onOpenLink }) {
  ensureNotificationsPanelStyles();

  const panel = document.createElement('section');
  panel.className = 'floating-panel card-soft notif-panel';

  panel.innerHTML = `
    <div class="floating-panel-head">
      <div>
        <div class="section-kicker">Notifications</div>
        <h3>Centre d’alertes</h3>
        <p class="notif-panel-head-lead">
          Lecture rapide : type, priorité, horodatage et lien métier (mock). Les actions « Ouvrir » préparent la navigation par module.
        </p>
      </div>
      <div class="inline-actions">
        <button type="button" class="text-button mark-all">Tout lire</button>
        <button type="button" class="text-button close-panel">Fermer</button>
      </div>
    </div>
    <div class="stack notifications-list"></div>
  `;

  const list = panel.querySelector('.notifications-list');
  notifications.forEach((item) => {
    list.append(createNotificationRow(item, { onOpenLink }));
  });

  panel.querySelector('.mark-all').addEventListener('click', onMarkAllRead);
  panel.querySelector('.close-panel').addEventListener('click', onClose);

  return panel;
}
