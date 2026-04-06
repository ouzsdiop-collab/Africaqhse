import { qhseFetch } from '../utils/qhseFetch.js';
import { showToast } from '../components/toast.js';

/** @type {Array<object>} */
const items = [];

function linkFor(item) {
  switch (item.kind) {
    case 'incident': {
      const m = /^Incident critique — (.+)$/.exec(item.title);
      return { page: 'incidents', ref: m ? m[1].trim() : null };
    }
    case 'action':
    case 'action_assigned':
      return { page: 'actions', ref: null };
    case 'nonconformity': {
      const m = /^Non-conformité ouverte — (.+)$/.exec(item.title);
      return { page: 'audits', ref: m ? m[1].trim() : null };
    }
    case 'audit': {
      const m = /^Audit récent — (.+)$/.exec(item.title);
      return { page: 'audits', ref: m ? m[1].trim() : null };
    }
    default:
      return null;
  }
}

function priorityFromLevel(level) {
  if (level === 'critical') return 'critical';
  if (level === 'warning') return 'high';
  return 'normal';
}

function hydrateFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id;
  const kind = raw.kind;
  const title = raw.title;
  const detail = raw.detail;
  const level = raw.level;
  const read = Boolean(raw.read);
  const timestamp = raw.timestamp ?? '';
  if (typeof id !== 'string' || typeof kind !== 'string') return null;

  const link = linkFor({ kind, title });
  return {
    id,
    kind,
    title: String(title ?? ''),
    detail: String(detail ?? ''),
    level: String(level ?? 'info'),
    read,
    timestamp,
    priority: priorityFromLevel(level),
    ...(link ? { link } : {})
  };
}

export async function loadNotificationsFromApi() {
  try {
    const res = await qhseFetch('/api/notifications');
    if (res.status === 401 || res.status === 403) {
      items.splice(0, items.length);
      return;
    }
    if (!res.ok) {
      items.splice(0, items.length);
      if (res.status >= 500) {
        showToast('Notifications indisponibles (serveur).', 'warning');
      }
      return;
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      items.splice(0, items.length);
      return;
    }
    const next = data.map(hydrateFromApi).filter(Boolean);
    items.splice(0, items.length, ...next);
  } catch (err) {
    console.error('[notifications] GET /api/notifications', err);
    items.splice(0, items.length);
    showToast('Réseau ou API indisponible (notifications).', 'warning');
  }
}

export const notificationsStore = {
  all() {
    return items;
  },
  unreadCount() {
    return items.filter((item) => !item.read).length;
  },
  markRead(id) {
    const entry = items.find((item) => String(item.id) === String(id));
    if (entry) entry.read = true;
  },
  markAllRead() {
    items.forEach((item) => {
      item.read = true;
    });
  }
};
