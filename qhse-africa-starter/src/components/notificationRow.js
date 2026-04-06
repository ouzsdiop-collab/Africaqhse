import { notificationsStore } from '../data/notifications.js';

const KIND_META = {
  incident: { chip: 'Incident critique', icon: '!', className: 'notif-item--incident' },
  action: { chip: 'Action en retard', icon: '⏱', className: 'notif-item--action' },
  action_assigned: { chip: 'Action assignée', icon: '✓', className: 'notif-item--info' },
  audit: { chip: 'Audit', icon: '☑', className: 'notif-item--audit' },
  nonconformity: { chip: 'Non-conformité', icon: '⚠', className: 'notif-item--action' },
  info: { chip: 'Information', icon: '◆', className: 'notif-item--info' }
};

const PRIORITY_META = {
  critical: { label: 'Priorité critique', className: 'notif-prio-tag--critical' },
  high: { label: 'Priorité élevée', className: 'notif-prio-tag--high' },
  normal: { label: 'Priorité normale', className: 'notif-prio-tag--normal' },
  low: { label: 'Priorité basse', className: 'notif-prio-tag--low' }
};

function resolveKind(item) {
  if (item.kind && KIND_META[item.kind]) return item.kind;
  const t = `${item.title || ''} ${item.detail || ''}`.toLowerCase();
  if (t.includes('audit')) return 'audit';
  if (item.kind === 'action_assigned') return 'action_assigned';
  if (t.includes('action') && t.includes('retard')) return 'action';
  if (t.includes('assignée') || t.includes('assignee')) return 'action_assigned';
  if (t.includes('incident') || item.level === 'critical') return 'incident';
  return 'info';
}

function resolvePriority(item) {
  if (item.priority && PRIORITY_META[item.priority]) return item.priority;
  const k = resolveKind(item);
  if (k === 'incident') return 'critical';
  if (k === 'action' || k === 'audit') return 'high';
  return 'normal';
}

function badgeTone(item, kind) {
  if (item.read) return 'blue';
  if (kind === 'incident') return 'red';
  if (kind === 'action' || kind === 'nonconformity') return 'amber';
  if (kind === 'audit') return 'blue';
  return 'blue';
}

function linkButtonLabel(link) {
  if (!link || !link.page) return '';
  if (link.ref) return 'Ouvrir';
  return 'Voir le module';
}

/**
 * @param {object} item — notification (store)
 * @param {{ onOpenLink?: (payload: { page: string, ref: string|null, id: string|number }) => void }} options
 */
export function createNotificationRow(item, options = {}) {
  const { onOpenLink } = options;
  const kind = resolveKind(item);
  const km = KIND_META[kind];
  const prioKey = resolvePriority(item);
  const prio = PRIORITY_META[prioKey];

  const row = document.createElement('article');
  row.className = `notif-item ${km.className} ${item.read ? '' : 'unread'}`;

  const icon = document.createElement('div');
  icon.className = 'notif-item__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = km.icon;

  const body = document.createElement('div');
  body.className = 'notif-item__body';

  const topRow = document.createElement('div');
  topRow.className = 'notif-item__type-row';
  const chip = document.createElement('span');
  chip.className = 'notif-item__chip';
  chip.textContent = km.chip;
  const prioTag = document.createElement('span');
  prioTag.className = `notif-prio-tag ${prio.className}`;
  prioTag.textContent = prio.label;
  topRow.append(chip, prioTag);

  const title = document.createElement('p');
  title.className = 'notif-item__title';
  title.textContent = item.title;

  const detail = document.createElement('p');
  detail.className = 'notif-item__detail';
  detail.textContent = item.detail;

  const meta = document.createElement('div');
  meta.className = 'notif-item__meta';
  const timeEl = document.createElement('span');
  timeEl.className = 'notif-item__time';
  timeEl.textContent = item.timestamp || '—';
  meta.append(timeEl);
  if (item.link && item.link.ref) {
    const sep = document.createElement('span');
    sep.className = 'notif-item__meta-sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '·';
    const refEl = document.createElement('span');
    refEl.className = 'notif-item__ref';
    refEl.textContent = `Réf. ${item.link.ref}`;
    meta.append(sep, refEl);
  }

  body.append(topRow, title, detail, meta);

  if (item.link && item.link.page) {
    const actions = document.createElement('div');
    actions.className = 'notif-item__actions';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'text-button notif-item__link-btn';
    btn.textContent = linkButtonLabel(item.link);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      notificationsStore.markRead(item.id);
      const payload = {
        id: item.id,
        page: item.link.page,
        ref: item.link.ref || null
      };
      if (typeof onOpenLink === 'function') {
        onOpenLink(payload);
      } else {
        window.location.hash = payload.page;
      }
    });
    actions.append(btn);
    body.append(actions);
  }

  const status = document.createElement('div');
  status.className = 'notif-item__status';
  const badge = document.createElement('span');
  badge.className = `badge ${badgeTone(item, kind)}`;
  badge.textContent = item.read ? 'Lu' : 'Nouveau';
  status.append(badge);
  if (!item.read) {
    const dot = document.createElement('span');
    dot.className = 'notif-item__dot';
    dot.title = 'Non lu';
    status.append(dot);
  }

  row.append(icon, body, status);
  return row;
}
