import { parseActionMeta } from './actionMeta.js';
import { showToast } from './toast.js';

function formatDueShort(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return null;
  }
}

/**
 * @param {string} columnKey
 * @param {string | null | undefined} dueIso
 */
function computePriorityBadge(columnKey, dueIso) {
  if (columnKey === 'overdue') {
    return { label: 'Retard', mod: 'action-card__prio--danger' };
  }
  if (columnKey === 'done') {
    return { label: 'Terminé', mod: 'action-card__prio--ok' };
  }
  if (dueIso) {
    const d = new Date(dueIso);
    if (!Number.isNaN(d.getTime())) {
      const now = Date.now();
      const ms = d.getTime() - now;
      const days = ms / 86400000;
      if (days < 0) return { label: 'Date dépassée', mod: 'action-card__prio--danger' };
      if (days <= 3) return { label: 'Urgent', mod: 'action-card__prio--warn' };
      if (days <= 14) return { label: 'Priorité normale', mod: 'action-card__prio--info' };
    }
  }
  return { label: 'Planifié', mod: 'action-card__prio--neutral' };
}

/**
 * Clé pour filtre client « priorité » (hors colonne Terminé).
 * @param {string} columnKey
 * @param {string | null | undefined} dueIso
 * @returns {'retard'|'urgent'|'normal'|'planifie'}
 */
export function getActionPriorityFilterKey(columnKey, dueIso) {
  if (columnKey === 'overdue') return 'retard';
  if (columnKey === 'done') return 'planifie';
  if (dueIso) {
    const d = new Date(dueIso);
    if (!Number.isNaN(d.getTime())) {
      const days = (d.getTime() - Date.now()) / 86400000;
      if (days < 0) return 'retard';
      if (days <= 3) return 'urgent';
      if (days <= 14) return 'normal';
    }
  }
  return 'planifie';
}

function statusPillClass(columnKey) {
  if (columnKey === 'overdue') return 'action-card__status action-card__status--overdue';
  if (columnKey === 'doing') return 'action-card__status action-card__status--doing';
  if (columnKey === 'done') return 'action-card__status action-card__status--done';
  return 'action-card__status action-card__status--todo';
}

/**
 * Carte action Kanban — lecture claire + actions rapides (détail ; terminer / modifier limités par API).
 * @param {object} item — title, detail, actionId, assigneeId, assigneeName, users, onAssign, canAssign,
 *   dueDateIso?, statusLabel?, rawRow?, onOpenDetail?(row, columnKey)
 * @param {string} columnKey
 */
export function createActionKanbanCard(item, columnKey) {
  const card = document.createElement('article');
  card.className = `action-card action-card--v2 action-card--premium action-card--col-${columnKey}`;
  card.setAttribute('draggable', 'true');
  card.dataset.actionId = item.actionId != null ? String(item.actionId) : '';
  card.dataset.columnKey = columnKey;
  card.classList.add('action-card--dnd-ready');

  const parsed = parseActionMeta(item.detail || '');
  const hasNamedAssignee =
    item.assigneeName != null && String(item.assigneeName).trim() !== '';
  const displayOwner = (hasNamedAssignee ? String(item.assigneeName).trim() : parsed.owner) || '—';

  const dueFormatted = formatDueShort(item.dueDateIso) || parsed.echeance;
  const prio = computePriorityBadge(columnKey, item.dueDateIso);

  let isLate = columnKey === 'overdue';
  if (item.dueDateIso) {
    const d = new Date(item.dueDateIso);
    if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now()) isLate = true;
  }

  const isCriticalAccent =
    columnKey !== 'done' &&
    (columnKey === 'overdue' ||
      prio.mod === 'action-card__prio--danger' ||
      prio.mod === 'action-card__prio--warn');

  if (isCriticalAccent) card.classList.add('action-card--critical-accent');
  if (isLate) card.classList.add('action-card--late-strong');

  const head = document.createElement('div');
  head.className = 'action-card__premium-head';

  const title = document.createElement('h4');
  title.className = 'action-card__title';
  title.textContent = item.title;

  const menuWrap = document.createElement('div');
  menuWrap.className = 'action-card__menu';

  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'action-card__menu-trigger';
  menuBtn.setAttribute('aria-label', 'Autres actions');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-haspopup', 'true');
  menuBtn.textContent = '⋯';

  const menuPanel = document.createElement('div');
  menuPanel.className = 'action-card__menu-panel';
  menuPanel.hidden = true;
  menuPanel.setAttribute('role', 'menu');

  let docClose = null;
  function closeMenu() {
    menuPanel.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    if (docClose) {
      document.removeEventListener('click', docClose, true);
      docClose = null;
    }
  }

  function openMenu() {
    menuPanel.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    docClose = (ev) => {
      if (!menuWrap.contains(ev.target)) closeMenu();
    };
    document.addEventListener('click', docClose, true);
  }

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menuPanel.hidden) openMenu();
    else closeMenu();
  });

  function mkMenuItem(label, onPick, opts = {}) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'action-card__menu-item';
    b.setAttribute('role', 'menuitem');
    b.textContent = label;
    b.disabled = !!opts.disabled;
    if (opts.title) b.title = opts.title;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
      onPick();
    });
    return b;
  }

  menuPanel.append(
    mkMenuItem('Voir le détail', () => {
      if (typeof item.onOpenDetail === 'function' && item.rawRow) {
        item.onOpenDetail(item.rawRow, columnKey);
      }
    }),
    mkMenuItem(
      'Modifier',
      () => {
        if (typeof item.onOpenEdit === 'function' && item.rawRow) {
          item.onOpenEdit(item.rawRow, columnKey);
        } else if (typeof item.onOpenDetail === 'function' && item.rawRow) {
          item.onOpenDetail(item.rawRow, columnKey);
          showToast('Modification en ligne : prévoir endpoint API dédié.', 'info');
        }
      },
      {
        title:
          'Consultation : la mise à jour complète nécessite une évolution API (PATCH action).'
      }
    ),
    mkMenuItem(
      'Terminer',
      () => {
        showToast(
          'Clôture : à brancher sur PATCH /api/actions/:id (statut) — non disponible dans cette version.',
          'info'
        );
      },
      {
        disabled: columnKey === 'done',
        title:
          columnKey === 'done'
            ? 'Action déjà terminée'
            : 'Le passage au statut « terminé » nécessite une API de mise à jour (non exposée ici).'
      }
    )
  );

  if (
    item.canAssign !== false &&
    item.actionId &&
    Array.isArray(item.users) &&
    typeof item.onAssign === 'function'
  ) {
    const assignBlock = document.createElement('div');
    assignBlock.className = 'action-card__menu-assign';
    assignBlock.addEventListener('click', (e) => e.stopPropagation());

    const lab = document.createElement('div');
    lab.className = 'action-card__menu-assign-label';
    lab.textContent = 'Réassigner';

    const sel = document.createElement('select');
    sel.id = `assign-${item.actionId}`;
    sel.className = 'action-card__menu-assign-select';
    sel.setAttribute('aria-label', 'Assigner un responsable');

    const optNone = document.createElement('option');
    optNone.value = '';
    optNone.textContent = 'Non assigné';
    sel.append(optNone);

    item.users.forEach((u) => {
      const o = document.createElement('option');
      o.value = u.id;
      o.textContent = `${u.name} (${u.role})`;
      if (item.assigneeId && u.id === item.assigneeId) o.selected = true;
      sel.append(o);
    });

    if (item.assigneeId && !item.users.some((u) => u.id === item.assigneeId)) {
      const o = document.createElement('option');
      o.value = item.assigneeId;
      o.textContent = item.assigneeName || 'Responsable (hors liste)';
      o.selected = true;
      sel.append(o);
    }

    sel.addEventListener('change', () => {
      item.onAssign(item.actionId, sel.value || null);
    });

    assignBlock.append(lab, sel);
    menuPanel.append(assignBlock);
  }

  menuWrap.append(menuBtn, menuPanel);
  head.append(title, menuWrap);

  const statusEl = document.createElement('span');
  statusEl.className = statusPillClass(columnKey);
  statusEl.textContent = item.statusLabel || '—';

  const metaRow = document.createElement('div');
  metaRow.className = 'action-card__premium-meta';

  const dueSide = document.createElement('div');
  dueSide.className = 'action-card__due-compact';
  if (isLate) dueSide.classList.add('action-card__due-compact--late');
  dueSide.title = dueFormatted ? `Échéance : ${dueFormatted}` : 'Sans échéance';

  const dueText = document.createElement('span');
  dueText.className = 'action-card__due-compact-date';
  dueText.textContent = dueFormatted || '—';
  dueSide.append(dueText);

  if (isLate && columnKey !== 'overdue') {
    const lateBadge = document.createElement('span');
    lateBadge.className = 'action-card__due-badge action-card__due-badge--mini';
    lateBadge.textContent = 'Retard';
    dueSide.append(lateBadge);
  }

  metaRow.append(statusEl, dueSide);

  const ownerEl = document.createElement('p');
  ownerEl.className = 'action-card__owner-lite';
  ownerEl.textContent = displayOwner;

  card.append(head, metaRow, ownerEl);

  card.addEventListener('click', (e) => {
    if (e.target.closest('.action-card__menu')) return;
    if (typeof item.onOpenDetail === 'function' && item.rawRow) {
      item.onOpenDetail(item.rawRow, columnKey);
    }
  });

  card.addEventListener('dragstart', (e) => {
    if (item.actionId != null) {
      e.dataTransfer.setData('application/x-qhse-action-id', String(item.actionId));
      e.dataTransfer.setData('text/plain', String(item.actionId));
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  return card;
}
