import { qhseNavigate } from '../utils/qhseNavigate.js';
import { notificationsStore } from '../data/notifications.js';
import {
  deriveTierFromItem,
  markSyntheticNotificationRead,
  NOTIF_TIER
} from '../services/notificationIntelligence.service.js';

const KIND_META = {
  incident: { chip: 'Incident critique', icon: '!', className: 'notif-item--incident' },
  incident_group: { chip: 'Incidents', icon: '!!', className: 'notif-item--incident' },
  action: { chip: 'Action en retard', icon: '⏱', className: 'notif-item--action' },
  action_group: { chip: 'Actions', icon: '⏱', className: 'notif-item--action' },
  action_assigned: { chip: 'Action assignée', icon: '✓', className: 'notif-item--info' },
  audit: { chip: 'Audit', icon: '☑', className: 'notif-item--audit' },
  nonconformity: { chip: 'Non-conformité', icon: '⚠', className: 'notif-item--action' },
  doc_compliance: { chip: 'Documents', icon: '📄', className: 'notif-item--audit' },
  info: { chip: 'Information', icon: '◆', className: 'notif-item--info' }
};

const PRIORITY_META = {
  critical: { label: 'Critique', className: 'notif-prio-tag--critical' },
  high: { label: 'Attention', className: 'notif-prio-tag--high' },
  normal: { label: 'Info', className: 'notif-prio-tag--normal' },
  low: { label: 'Faible', className: 'notif-prio-tag--low' }
};

const TIER_TAG = {
  [NOTIF_TIER.CRITIQUE]: { label: 'Critique', className: 'notif-tier-tag--critique' },
  [NOTIF_TIER.ATTENTION]: { label: 'Attention', className: 'notif-tier-tag--attention' },
  [NOTIF_TIER.INFO]: { label: 'Info', className: 'notif-tier-tag--info' },
  [NOTIF_TIER.DIGEST]: { label: 'Récapitulatif', className: 'notif-tier-tag--digest' }
};

const ALLOWED_NOTIF_TIERS = new Set(Object.values(NOTIF_TIER));

/** Évite l’injection dans les classes CSS si `tier` provient de l’API. */
function sanitizeNotificationTier(tier) {
  return tier && ALLOWED_NOTIF_TIERS.has(tier) ? tier : NOTIF_TIER.INFO;
}

function resolveKind(item) {
  if (item.kind === 'doc_compliance') return 'doc_compliance';
  if (item.kind === 'action_group') return 'action_group';
  if (item.kind === 'incident_group') return 'incident_group';
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
  const tier = item.tier || deriveTierFromItem(item);
  if (tier === NOTIF_TIER.CRITIQUE) return 'critical';
  if (tier === NOTIF_TIER.ATTENTION) return 'high';
  const k = resolveKind(item);
  if (k === 'incident' || k === 'incident_group') return 'critical';
  if (k === 'action' || k === 'action_group' || k === 'audit') return 'high';
  return 'normal';
}

function badgeTone(item, kind) {
  if (item.read) return 'blue';
  const tier = item.tier || deriveTierFromItem(item);
  if (tier === NOTIF_TIER.CRITIQUE) return 'red';
  if (kind === 'incident' || kind === 'incident_group') return 'red';
  if (kind === 'action' || kind === 'action_group' || kind === 'nonconformity') return 'amber';
  if (kind === 'audit') return 'blue';
  return 'blue';
}

function linkButtonLabel(link) {
  if (!link || !link.page) return '';
  if (link.ref) return 'Ouvrir';
  return 'Voir le module';
}

/**
 * @param {object} item : notification (store ou présentation)
 * @param {{ onOpenLink?: (payload: { page: string, ref: string|null, id: string|number }) => void; onAfterMarkRead?: () => void }} options
 */
export function createNotificationRow(item, options = {}) {
  const { onOpenLink, onAfterMarkRead } = options;
  const kind = resolveKind(item);
  const km = KIND_META[kind] || KIND_META.info;
  const prioKey = resolvePriority(item);
  const prio = PRIORITY_META[prioKey];
  const tierRaw = item.tier || deriveTierFromItem(item);
  const tier = sanitizeNotificationTier(tierRaw);
  const tierTag = TIER_TAG[tier] || TIER_TAG[NOTIF_TIER.INFO];

  const row = document.createElement('article');
  row.className = `notif-item ${km.className} ${item.read ? '' : 'unread'} notif-item--tier-${tier}`;
  if (item.synthetic) row.classList.add('notif-item--synthetic');

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
  const tierEl = document.createElement('span');
  tierEl.className = `notif-tier-tag ${tierTag.className}`;
  tierEl.textContent = tierTag.label;
  const prioTag = document.createElement('span');
  prioTag.className = `notif-prio-tag ${prio.className}`;
  prioTag.textContent = prio.label;
  topRow.append(chip, tierEl, prioTag);
  if (item.groupedCount && item.groupedCount > 1) {
    const g = document.createElement('span');
    g.className = 'notif-group-badge';
    g.textContent = `${item.groupedCount} regroupées`;
    topRow.append(g);
  }

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
  timeEl.textContent = item.timestamp || 'Non disponible';
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
      if (item.synthetic) {
        markSyntheticNotificationRead(item.id);
      } else {
        notificationsStore.markRead(item.id);
      }
      if (typeof onAfterMarkRead === 'function') onAfterMarkRead();
      const payload = {
        id: item.id,
        page: item.link.page,
        ref: item.link.ref || null
      };
      if (typeof onOpenLink === 'function') {
        onOpenLink(payload);
      } else {
        qhseNavigate(payload.page);
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
