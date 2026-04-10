import { createQhseKpiStrip } from '../components/qhseKpiStrip.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { createActionKanbanCard, getActionPriorityFilterKey } from '../components/actionKanbanCard.js';
import { createActionDetailDialog } from '../components/actionDetailDialog.js';
import { openActionCreateDialog } from '../components/actionCreateDialog.js';
import { createActionManagerReadingCard } from '../components/actionManagerReading.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { fetchUsers } from '../services/users.service.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { getSessionUserId, getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import {
  appendActionHistory,
  getActionOverlay,
  getResolvedActionType,
  normalizeRiskTitleKey
} from '../utils/actionPilotageMock.js';
import { getRiskTitlesForSelect } from '../utils/riskIncidentLinks.js';
import { createSkeletonCard, createEmptyState } from '../utils/designSystem.js';
import { isOnline } from '../utils/networkStatus.js';

const COLUMN_META = {
  todo: { label: 'À lancer', hint: 'Non démarré — prioriser le cadrage' },
  doing: { label: 'En cours', hint: 'Suivi actif — tenir les jalons' },
  overdue: { label: 'En retard', hint: 'Relance et escalade' },
  done: { label: 'Terminé', hint: 'Actions clôturées (statut métier)' }
};

/** En retard en premier : lecture immédiate du risque, sans changer la logique de partition. */
const COLUMN_ORDER = ['overdue', 'todo', 'doing', 'done'];

const EMPTY_COLUMNS = { todo: [], doing: [], overdue: [], done: [] };

const COLUMN_EMPTY_COPY = {
  overdue: 'Aucune fiche en retard sur ce périmètre.',
  todo: 'Rien en attente de démarrage — ou filtre masque la colonne.',
  doing: 'Aucune action suivie en cours.',
  done: 'Aucune action terminée ne correspond aux filtres.'
};

const ACTIONS_LIST_CACHE_KEY = 'qhse.cache.actions.list.v1';

function readActionsListCache() {
  try {
    const raw = localStorage.getItem(ACTIONS_LIST_CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    return Array.isArray(j?.rows) ? j.rows : null;
  } catch {
    return null;
  }
}

function saveActionsListCache(rows) {
  try {
    localStorage.setItem(ACTIONS_LIST_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows }));
  } catch {
    /* ignore */
  }
}

function normalizedUserRole(role) {
  return String(role ?? '').trim().toUpperCase();
}

function isTerrainSessionRole(role) {
  return normalizedUserRole(role) === 'TERRAIN';
}

function summarizeManagerKpis(columns) {
  const aLancer = columns.todo.length;
  const enCours = columns.doing.length;
  const enRetard = columns.overdue.length;
  const terminees = columns.done.length;
  return { aLancer, enCours, enRetard, terminees };
}

function formatDueForDetail(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return null;
  }
}

/**
 * Statut API → colonne Kanban. Les libellés « terminé » / « clos » / etc. alimentent la colonne Terminé.
 */
/** Colonne Kanban → libellé statut API (PATCH drag & drop). */
function columnKeyToStatus(columnKey) {
  if (columnKey === 'todo') return 'À lancer';
  if (columnKey === 'doing') return 'En cours';
  if (columnKey === 'overdue') return 'En retard';
  if (columnKey === 'done') return 'Terminé';
  return 'À lancer';
}

function statusToColumnKey(status) {
  const s = String(status || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (/\bnon[\s-]*termine\b/.test(s)) return 'todo';
  if (
    /\b(termine|clos|clotur|ferme|complete|realise|valide|fait|acheve|done|closed)\b/.test(s) ||
    s.includes('termine') ||
    s.includes('clotur') ||
    s.includes('ferme') ||
    s.includes('realise') ||
    s.includes('valide')
  ) {
    return 'done';
  }
  if (s.includes('retard')) return 'overdue';
  if (s.includes('cours')) return 'doing';
  if (s.includes('lancer')) return 'todo';
  return 'todo';
}

/** Actions à traiter en priorité : urgent (≤ 3 j) ou retard (hors terminé). */
function countCritiqueActions(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((row) => {
    const col = statusToColumnKey(row.status);
    if (col === 'done') return false;
    const pk = getActionPriorityFilterKey(col, row.dueDate);
    return pk === 'retard' || pk === 'urgent';
  }).length;
}

function isSameLocalCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Actions non terminées dont l’échéance tombe aujourd’hui (fuseau local). */
function countDueTodayOpen(rows) {
  if (!Array.isArray(rows)) return 0;
  const today = new Date();
  return rows.filter((row) => {
    if (statusToColumnKey(row.status) === 'done') return false;
    if (!row.dueDate) return false;
    const d = new Date(row.dueDate);
    if (Number.isNaN(d.getTime())) return false;
    return isSameLocalCalendarDay(d, today);
  }).length;
}

function countOpenActions(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((row) => statusToColumnKey(row.status) !== 'done').length;
}

function countSansResponsable(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => {
    const o = String(r.owner || '').trim();
    return !r.assigneeId && (!o || o === 'À assigner' || o === '—');
  }).length;
}

function countPreventiveOpen(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => {
    if (statusToColumnKey(r.status) === 'done') return false;
    return getResolvedActionType(r, r.id) === 'preventive';
  }).length;
}

function countCorrectiveOpen(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => {
    if (statusToColumnKey(r.status) === 'done') return false;
    return getResolvedActionType(r, r.id) === 'corrective';
  }).length;
}

function preventionRatioHint(rows) {
  if (!Array.isArray(rows)) return '—';
  const p = countPreventiveOpen(rows);
  const c = countCorrectiveOpen(rows);
  if (p + c === 0) return 'Pas d’action ouverte prév./corr.';
  return `Prév. ${p} / corr. ${c}`;
}

function countRisksWithoutOpenPreventiveAction(actionRows) {
  const titles = getRiskTitlesForSelect().map(normalizeRiskTitleKey).filter(Boolean);
  if (!titles.length) return 0;
  const openActs = (actionRows || []).filter((r) => statusToColumnKey(r.status) !== 'done');
  let n = 0;
  for (const tk of titles) {
    const has = openActs.some((r) => {
      const id = String(r?.id || '').trim();
      if (!id) return false;
      if (getResolvedActionType(r, id) !== 'preventive') return false;
      const lr = normalizeRiskTitleKey(getActionOverlay(id).linkedRisk);
      return lr === tk;
    });
    if (!has) n += 1;
  }
  return n;
}

function buildActionsSummaryLine(filteredRows, critiques) {
  const n = Array.isArray(filteredRows) ? filteredRows.length : 0;
  if (n === 0) {
    return 'Aucune action dans ce périmètre — élargissez le filtre responsable ou créez une fiche.';
  }
  const aTraiter = countOpenActions(filteredRows);
  const today = countDueTodayOpen(filteredRows);
  const parts = [
    `${n} affichée${n > 1 ? 's' : ''}`,
    `${aTraiter} à traiter`,
    today > 0 ? `${today} échéance${today > 1 ? 's' : ''} aujourd’hui` : null,
    critiques > 0 ? `${critiques} critique${critiques > 1 ? 's' : ''}` : null
  ].filter(Boolean);
  return parts.join(' · ');
}

function mapApiRowToKanbanItem(row, users, onAssign, canAssign, hooks) {
  const respName = row.assignee?.name ?? row.owner ?? '—';
  const parts = ['Pilotage QHSE', `Resp. ${respName}`];
  const due = formatDueForDetail(row.dueDate);
  if (due) parts.push(`Échéance ${due}`);
  return {
    actionId: row.id,
    title: row.title,
    detail: parts.join(' • '),
    assigneeId: row.assigneeId ?? null,
    assigneeName: row.assignee?.name ?? null,
    dueDateIso: row.dueDate ?? null,
    statusLabel: String(row.status || '—').trim() || '—',
    rawRow: row,
    onOpenDetail: hooks.onOpenDetail,
    onOpenEdit: hooks.onOpenEdit,
    users,
    onAssign,
    canAssign,
    canDrag: canAssign !== false
  };
}

function partitionActions(rows, users, onAssign, canAssign, hooks) {
  const columns = {
    todo: [],
    doing: [],
    overdue: [],
    done: []
  };
  if (!Array.isArray(rows)) return columns;
  rows.forEach((row) => {
    const item = mapApiRowToKanbanItem(row, users, onAssign, canAssign, hooks);
    const key = statusToColumnKey(row.status);
    columns[key].push(item);
  });
  return columns;
}

/**
 * @param {Record<string, object[]>} actionColumns
 * @param {{ onColumnDrop?: (actionId: string, targetColumnKey: string) => void }} [opts]
 */
function buildKanbanBoard(actionColumns, opts = {}) {
  const { onColumnDrop } = opts;
  const board = document.createElement('div');
  board.className = 'kanban-board kanban-board--pilotage kanban-board--pilotage-premium';

  COLUMN_ORDER.forEach((key) => {
    const items = actionColumns[key] || [];
    const meta = COLUMN_META[key];
    const column = document.createElement('section');
    column.className = `kanban-column kanban-column--pilotage kanban-column--pilotage-premium kanban-column--${key}`;
    column.dataset.kanbanColumn = key;
    column.addEventListener('dragover', (e) => {
      if (!onColumnDrop) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.classList.add('kanban-column--drag-over');
    });
    column.addEventListener('dragleave', (e) => {
      if (!column.contains(e.relatedTarget)) column.classList.remove('kanban-column--drag-over');
    });
    column.addEventListener('drop', (e) => {
      if (!onColumnDrop) return;
      e.preventDefault();
      column.classList.remove('kanban-column--drag-over');
      const id =
        e.dataTransfer.getData('application/x-qhse-action-id') ||
        e.dataTransfer.getData('text/plain');
      if (id) onColumnDrop(id, key);
    });

    const head = document.createElement('div');
    head.className = 'kanban-column-head';

    const h4 = document.createElement('h4');
    h4.className = 'kanban-column-title';
    h4.textContent = `${meta.label} (${items.length})`;
    h4.title = meta.hint;

    const hintEl = document.createElement('p');
    hintEl.className = 'kanban-column-hint';
    hintEl.textContent = meta.hint;

    head.append(h4, hintEl);
    column.append(head);

    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'kanban-column-empty';
      empty.textContent = COLUMN_EMPTY_COPY[key] || 'Aucune fiche.';
      column.append(empty);
    } else {
      items.forEach((item) => column.append(createActionKanbanCard(item, key)));
    }
    board.append(column);
  });

  return board;
}

const ACTIONS_SKELETON_COLUMN_KEYS = ['overdue', 'todo', 'doing'];

function buildActionsKanbanSkeletonBoard() {
  const board = document.createElement('div');
  board.className = 'kanban-board kanban-board--pilotage kanban-board--pilotage-premium';
  ACTIONS_SKELETON_COLUMN_KEYS.forEach((key) => {
    const meta = COLUMN_META[key];
    const column = document.createElement('section');
    column.className = `kanban-column kanban-column--pilotage kanban-column--pilotage-premium kanban-column--${key}`;
    const head = document.createElement('div');
    head.className = 'kanban-column-head';
    const h4 = document.createElement('h4');
    h4.className = 'kanban-column-title';
    h4.textContent = `${meta.label} (…)`;
    h4.title = meta.hint;
    const hintEl = document.createElement('p');
    hintEl.className = 'kanban-column-hint';
    hintEl.textContent = meta.hint;
    head.append(h4, hintEl);
    column.append(head, createSkeletonCard(3), createSkeletonCard(3));
    board.append(column);
  });
  return board;
}

function buildFilterToolbar(users, refs, opts = {}) {
  const { terrainOnly = false, onTogglePrevention } = opts;
  const wrap = document.createElement('div');
  wrap.className = 'actions-filter-toolbar actions-filter-toolbar--premium';

  const g2 = document.createElement('div');
  g2.className = 'actions-filter-group';
  const l2 = document.createElement('label');
  l2.htmlFor = 'qhse-actions-view';
  l2.textContent = 'Responsable';
  const selView = document.createElement('select');
  selView.id = 'qhse-actions-view';

  const addOpt = (value, label) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    selView.append(o);
  };

  if (terrainOnly) {
    addOpt('mine', 'Mes actions (profil terrain)');
    selView.title =
      'Votre rôle limite la liste aux actions qui vous sont assignées.';
  } else {
    addOpt('all', 'Toutes les actions');
    addOpt('unassigned', 'Sans responsable déclaré');
    addOpt('mine', 'Mes actions (profil latéral)');
    const og = document.createElement('optgroup');
    og.label = 'Par responsable';
    users.forEach((u) => {
      const o = document.createElement('option');
      o.value = `user:${u.id}`;
      o.textContent = u.name;
      og.append(o);
    });
    selView.append(og);
  }

  g2.append(l2, selView);

  const g3 = document.createElement('div');
  g3.className = 'actions-filter-group';
  const l3 = document.createElement('label');
  l3.htmlFor = 'qhse-actions-status';
  l3.textContent = 'Statut';
  const selStatus = document.createElement('select');
  selStatus.id = 'qhse-actions-status';
  selStatus.setAttribute('aria-label', 'Filtrer par colonne Kanban');
  [
    ['all', 'Toutes les colonnes'],
    ['todo', 'À lancer'],
    ['doing', 'En cours'],
    ['overdue', 'En retard'],
    ['done', 'Terminé']
  ].forEach(([value, label]) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    selStatus.append(o);
  });
  g3.append(l3, selStatus);

  const g4 = document.createElement('div');
  g4.className = 'actions-filter-group';
  const l4 = document.createElement('label');
  l4.htmlFor = 'qhse-actions-priority';
  l4.textContent = 'Priorité';
  const selPriority = document.createElement('select');
  selPriority.id = 'qhse-actions-priority';
  selPriority.title = 'Dérivée de l’échéance et de la colonne (filtre local, sans requête API)';
  [
    ['all', 'Toutes'],
    ['retard', 'Retard / dépassé'],
    ['urgent', 'Urgent (≤ 3 j)'],
    ['normal', 'Normale (≤ 14 j)'],
    ['planifie', 'Planifié']
  ].forEach(([value, label]) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    selPriority.append(o);
  });
  g4.append(l4, selPriority);

  const g5 = document.createElement('div');
  g5.className = 'actions-filter-group actions-filter-group--prevention';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'btn btn-secondary actions-filter-prevention-btn';
  prevBtn.textContent = 'Voir prévention';
  prevBtn.title = 'N’afficher que les actions de type préventif (pilotage QHSE).';
  prevBtn.setAttribute('aria-pressed', 'false');
  prevBtn.addEventListener('click', () => onTogglePrevention?.());
  g5.append(prevBtn);
  refs.preventionBtn = prevBtn;

  const gExp = document.createElement('div');
  gExp.className = 'actions-filter-group';
  const exportBtnAct = document.createElement('button');
  exportBtnAct.type = 'button';
  exportBtnAct.textContent = 'Export Excel';
  exportBtnAct.className = 'btn btn-secondary btn-sm';
  exportBtnAct.addEventListener('click', async () => {
    try {
      const res = await qhseFetch(withSiteQuery('/api/export/actions'));
      if (!res.ok) {
        showToast('Export impossible', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'actions-export.xlsx';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Erreur réseau', 'error');
    }
  });
  gExp.append(exportBtnAct);

  wrap.append(g2, g3, g4, g5, gExp);

  refs.view = selView;
  refs.status = selStatus;
  refs.priority = selPriority;

  return wrap;
}

export function renderActions() {
  ensureQhsePilotageStyles();
  ensureDashboardStyles();

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--actions-premium';

  if (!isOnline()) {
    const banner = document.createElement('div');
    banner.style.cssText =
      'background:#f59e0b22;border:1px solid #f59e0b;border-radius:8px;padding:10px 16px;margin-bottom:16px;color:#f59e0b;font-size:13px;font-weight:600';
    banner.textContent = 'Mode hors connexion — affichage des dernieres donnees en cache';
    page.prepend(banner);
  }

  const offlineCacheBanner = document.createElement('p');
  offlineCacheBanner.className = 'content-card card-soft qhse-offline-cache-banner';
  offlineCacheBanner.dataset.qhseOfflineCacheBanner = '';
  offlineCacheBanner.hidden = true;
  offlineCacheBanner.setAttribute('role', 'status');
  offlineCacheBanner.style.cssText =
    'margin:0 0 14px;padding:12px 16px;font-weight:600;font-size:14px;border:1px solid var(--color-border-info, #38bdf8);';
  offlineCacheBanner.textContent = '📡 Mode hors connexion — données en cache';

  const managerHost = document.createElement('div');
  managerHost.className = 'actions-manager-reading-host';

  const main = document.createElement('article');
  main.className = 'content-card card-soft actions-page__main-card';
  main.innerHTML = `
    <div class="content-card-head content-card-head--split">
      <div>
        <div class="section-kicker">Pilotage QHSE</div>
        <h3>Plan d’actions</h3>
        <p class="content-card-lead content-card-lead--narrow">
          Vue synthèse puis colonnes : retards en premier, cliquez une carte pour le détail.
        </p>
        <p class="qhse-simple-alt-lead">
          Commencez par la colonne « En retard », puis ouvrez une carte pour voir quoi faire.
        </p>
      </div>
      <button type="button" class="btn btn-primary actions-create-btn btn--pilotage-cta">
        Créer une action
      </button>
    </div>
  `;

  const lead = main.querySelector('.content-card-lead');
  const summaryEl = document.createElement('p');
  summaryEl.className = 'actions-page__summary';
  summaryEl.setAttribute('aria-live', 'polite');
  const kpiHost = document.createElement('div');
  kpiHost.className = 'actions-page__kpi-host';
  const filterHost = document.createElement('div');
  filterHost.className = 'actions-filter-toolbar-host';
  lead.after(summaryEl);
  summaryEl.after(kpiHost);
  kpiHost.after(filterHost);

  const boardHost = document.createElement('div');
  boardHost.className = 'actions-page__board-host';
  filterHost.after(boardHost);

  let cachedRows = [];
  let actionsFirstLoadPending = true;
  let usersList = [];
  const filterRefs = { view: null, status: null, priority: null, preventionBtn: null };
  let filterView = isTerrainSessionRole(getSessionUser()?.role) ? 'mine' : 'all';
  let filterStatus = 'all';
  let filterPriority = 'all';
  let onAssignHandler = async () => {};
  let canAssignActions = true;
  /** @type {'critiques'|'retard'|'en_cours'|'a_lancer'|'prevention'|'sans_resp'|null} */
  let kpiStripFilterKey = null;

  let loadActionsFromApi = async () => {};

  const actionDetailDialog = createActionDetailDialog({
    onRefresh: () => {
      void loadActionsFromApi();
    },
    getUserName: () => getSessionUser()?.name || 'Utilisateur'
  });

  const kanbanHooks = {
    onOpenDetail: (row, col) => actionDetailDialog.show(row, col),
    onOpenEdit: (row, col) => {
      actionDetailDialog.show(row, col);
      showToast(
        'Champs éditables : liaisons et avancement via « Modifier » (stockage local session).',
        'info'
      );
    }
  };

  function passesKpiStripFilter(row) {
    if (!kpiStripFilterKey) return true;
    const col = statusToColumnKey(row.status);
    if (kpiStripFilterKey === 'critiques') {
      if (col === 'done') return false;
      const pk = getActionPriorityFilterKey(col, row.dueDate);
      return pk === 'retard' || pk === 'urgent';
    }
    if (kpiStripFilterKey === 'retard') {
      if (col === 'done') return false;
      return col === 'overdue' || getActionPriorityFilterKey(col, row.dueDate) === 'retard';
    }
    if (kpiStripFilterKey === 'en_cours') return col === 'doing';
    if (kpiStripFilterKey === 'a_lancer') return col === 'todo';
    if (kpiStripFilterKey === 'prevention') {
      return getResolvedActionType(row, row.id) === 'preventive';
    }
    if (kpiStripFilterKey === 'sans_resp') {
      const o = String(row.owner || '').trim();
      return !row.assigneeId && (!o || o === 'À assigner' || o === '—');
    }
    return true;
  }

  function applyClientFilters(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => {
      if (!passesKpiStripFilter(row)) return false;
      const col = statusToColumnKey(row.status);
      if (filterStatus !== 'all' && col !== filterStatus) return false;
      if (filterPriority !== 'all') {
        if (col === 'done') return false;
        if (getActionPriorityFilterKey(col, row.dueDate) !== filterPriority) return false;
      }
      return true;
    });
  }

  function renderManagerReading() {
    const base = cachedRows.filter((row) => {
      if (filterView === 'unassigned') return true;
      if (filterView === 'mine') {
        const id = getSessionUserId();
        return id && row.assigneeId === id;
      }
      if (filterView.startsWith('user:')) {
        return row.assigneeId === filterView.slice(5);
      }
      return true;
    });
    const gapCount = countRisksWithoutOpenPreventiveAction(cachedRows);
    managerHost.replaceChildren(
      createActionManagerReadingCard(base, {
        risksWithoutPreventiveCount: gapCount,
        onSelectFilter: (key) => {
          if (key === 'preventive_gap') {
            window.location.hash = 'risks';
            showToast(
              'Risques : ouvrez une fiche ou le bouton « Créer action préventive » du registre.',
              'info'
            );
            return;
          }
          kpiStripFilterKey = kpiStripFilterKey === key ? null : key;
          refreshWithFilters();
        }
      })
    );
  }

  function syncPreventionToolbar() {
    const b = filterRefs.preventionBtn;
    if (!b) return;
    const on = kpiStripFilterKey === 'prevention';
    b.classList.toggle('actions-filter-prevention-btn--on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function toggleKpiStripFilter(key) {
    kpiStripFilterKey = kpiStripFilterKey === key ? null : key;
    refreshWithFilters();
  }

  async function patchActionStatusFromDnD(actionId, targetColumnKey) {
    if (!canAssignActions) {
      showToast('Changement de statut réservé aux profils avec écriture sur Actions.', 'warning');
      return;
    }
    const row = cachedRows.find((r) => r.id === actionId);
    if (!row) return;
    const fromCol = statusToColumnKey(row.status);
    if (fromCol === targetColumnKey) return;
    const status = columnKeyToStatus(targetColumnKey);
    try {
      const res = await qhseFetch(`/api/actions/${encodeURIComponent(actionId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        let msg = 'Erreur serveur';
        try {
          const b = await res.json();
          if (b.error) msg = b.error;
        } catch {
          /* ignore */
        }
        showToast(msg, 'error');
        return;
      }
      appendActionHistory(actionId, `Glisser-déposer Kanban → ${status}`);
      showToast(`Statut : ${status}`, 'success');
      activityLogStore.add({
        module: 'actions',
        action: 'Changement statut (Kanban)',
        detail: String(actionId),
        user: getSessionUser()?.name || 'Pilotage QHSE'
      });
      await loadActionsFromApi();
    } catch (err) {
      console.error('[actions] PATCH status', err);
      showToast('Erreur serveur', 'error');
    }
  }

  function refreshWithFilters() {
    renderManagerReading();
    syncPreventionToolbar();
    const filtered = applyClientFilters(cachedRows);
    refreshUi(
      partitionActions(filtered, usersList, onAssignHandler, canAssignActions, kanbanHooks)
    );
  }

  function refreshUi(actionColumns) {
    const filtered = applyClientFilters(cachedRows);
    const critiques = countCritiqueActions(filtered);
    summaryEl.textContent = buildActionsSummaryLine(filtered, critiques);
    const k = summarizeManagerKpis(actionColumns);
    const nSans = countSansResponsable(filtered);
    const nPrevOpen = countPreventiveOpen(cachedRows);
    const prevRatio = preventionRatioHint(cachedRows);
    kpiHost.replaceChildren(
      createQhseKpiStrip([
        {
          label: 'Critiques',
          value: critiques,
          tone: 'red',
          hint: 'Cliquer pour filtrer',
          hintTitle: 'Urgent (≤ 3 j) ou retard — hors terminé',
          kpiKey: 'critiques',
          selected: kpiStripFilterKey === 'critiques',
          onClick: toggleKpiStripFilter
        },
        {
          label: 'En retard',
          value: k.enRetard,
          tone: 'amber',
          hint: 'Cliquer pour filtrer',
          hintTitle: 'Colonne retard ou échéance dépassée',
          kpiKey: 'retard',
          selected: kpiStripFilterKey === 'retard',
          onClick: toggleKpiStripFilter
        },
        {
          label: 'En cours',
          value: k.enCours,
          tone: 'blue',
          hint: 'Cliquer pour filtrer',
          hintTitle: 'Colonne « En cours »',
          kpiKey: 'en_cours',
          selected: kpiStripFilterKey === 'en_cours',
          onClick: toggleKpiStripFilter
        },
        {
          label: 'À lancer',
          value: k.aLancer,
          tone: 'green',
          hint: 'Cliquer pour filtrer',
          hintTitle: 'Colonne « À lancer »',
          kpiKey: 'a_lancer',
          selected: kpiStripFilterKey === 'a_lancer',
          onClick: toggleKpiStripFilter
        },
        {
          label: 'Prévention',
          value: nPrevOpen,
          tone: 'green',
          hint: prevRatio,
          hintTitle:
            'Actions préventives ouvertes (hors terminé). Ratio préventif vs correctif sur le même périmètre.',
          kpiKey: 'prevention',
          selected: kpiStripFilterKey === 'prevention',
          onClick: toggleKpiStripFilter
        },
        {
          label: 'Sans resp.',
          value: nSans,
          tone: 'amber',
          hint: 'Cliquer pour filtrer',
          hintTitle: 'Pas d’assignation utilisateur claire',
          kpiKey: 'sans_resp',
          selected: kpiStripFilterKey === 'sans_resp',
          onClick: toggleKpiStripFilter
        }
      ])
    );
    if (actionsFirstLoadPending) {
      boardHost.replaceChildren(buildActionsKanbanSkeletonBoard());
      return;
    }
    if (cachedRows.length === 0) {
      boardHost.replaceChildren(createEmptyState('✓', 'Aucune action en cours', ''));
      return;
    }
    boardHost.replaceChildren(
      buildKanbanBoard(actionColumns, {
        onColumnDrop: (id, targetKey) => {
          void patchActionStatusFromDnD(id, targetKey);
        }
      })
    );
  }

  refreshWithFilters();

  loadActionsFromApi = async function loadActionsFromApi() {
    if (!isOnline()) {
      offlineCacheBanner.hidden = false;
      const cached = readActionsListCache();
      cachedRows = cached?.length ? cached : [];
      if (actionsFirstLoadPending) actionsFirstLoadPending = false;
      refreshWithFilters();
      return;
    }
    offlineCacheBanner.hidden = true;
    try {
      if (filterView === 'mine' && !getSessionUserId()) {
        showToast(
          'Choisissez un profil dans le menu latéral pour utiliser « Mes actions ».',
          'warning'
        );
        const sel = filterRefs.view;
        const terrainToolbarOnly =
          sel && sel.options.length === 1 && sel.options[0]?.value === 'mine';
        if (terrainToolbarOnly) {
          cachedRows = [];
          return;
        }
        if (sel) sel.value = 'all';
        filterView = 'all';
      }

      const params = new URLSearchParams();
      params.set('limit', '500');
      if (filterView === 'unassigned') {
        params.set('unassigned', '1');
      } else if (filterView === 'mine') {
        const p = getSessionUserId();
        if (p) params.set('assigneeId', p);
      } else if (filterView.startsWith('user:')) {
        params.set('assigneeId', filterView.slice(5));
      }

      const qs = params.toString();
      const path = `/api/actions${qs ? `?${qs}` : ''}`;
      const res = await qhseFetch(path);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      cachedRows = Array.isArray(data) ? data : [];
      saveActionsListCache(cachedRows);
    } catch (err) {
      console.error('[actions] GET /api/actions', err);
      const fallback = readActionsListCache();
      if (fallback?.length) {
        offlineCacheBanner.hidden = false;
        cachedRows = fallback;
      } else {
        showToast('Erreur serveur', 'error');
        cachedRows = [];
      }
    } finally {
      if (actionsFirstLoadPending) actionsFirstLoadPending = false;
      refreshWithFilters();
    }
  }

  onAssignHandler = async (actionId, assigneeId) => {
    try {
      const res = await qhseFetch(`/api/actions/${encodeURIComponent(actionId)}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: assigneeId ?? null })
      });
      if (!res.ok) {
        let msg = 'Erreur serveur';
        try {
          const body = await res.json();
          if (body.error) msg = body.error;
        } catch {
          /* ignore */
        }
        showToast(msg, 'error');
        return;
      }
      showToast(assigneeId ? 'Responsable assigné' : 'Assignation retirée', 'info');
      activityLogStore.add({
        module: 'actions',
        action: assigneeId ? 'Assignation action' : 'Retrait assignation',
        detail: `Action ${actionId}`,
        user: 'Pilotage QHSE'
      });
      await loadActionsFromApi();
    } catch (err) {
      console.error('[actions] PATCH assign', err);
      showToast('Erreur serveur', 'error');
    }
  };

  (async function initUsersAndFilters() {
    try {
      usersList = await fetchUsers();
    } catch (err) {
      console.error('[actions] GET /api/users', err);
      showToast('Liste utilisateurs indisponible — assignation désactivée', 'error');
      usersList = [];
    }

    const su = getSessionUser();
    canAssignActions = canResource(su?.role, 'actions', 'write');
    if (!canAssignActions && su) {
      createBtn.disabled = true;
      createBtn.title = 'Création réservée (rôle lecture ou limité)';
      createBtn.style.opacity = '0.55';
    } else {
      createBtn.disabled = false;
      createBtn.removeAttribute('title');
      createBtn.style.opacity = '';
    }

    const terrainOnly = isTerrainSessionRole(su?.role);
    if (terrainOnly) filterView = 'mine';

    const toolbar = buildFilterToolbar(usersList, filterRefs, {
      terrainOnly,
      onTogglePrevention: () => {
        kpiStripFilterKey = kpiStripFilterKey === 'prevention' ? null : 'prevention';
        refreshWithFilters();
      }
    });
    filterHost.append(toolbar);
    filterRefs.view.value = filterView;
    filterRefs.status.value = filterStatus;
    filterRefs.priority.value = filterPriority;
    syncPreventionToolbar();

    filterRefs.view.addEventListener('change', () => {
      filterView = filterRefs.view.value;
      loadActionsFromApi();
    });

    filterRefs.status.addEventListener('change', () => {
      filterStatus = filterRefs.status.value;
      refreshWithFilters();
    });

    filterRefs.priority.addEventListener('change', () => {
      filterPriority = filterRefs.priority.value;
      refreshWithFilters();
    });

    await loadActionsFromApi();
  })();

  const createBtn = main.querySelector('.actions-create-btn');

  createBtn.addEventListener('click', () => {
    if (createBtn.disabled) return;
    openActionCreateDialog({
      users: usersList,
      onCreated: () => {
        activityLogStore.add({
          module: 'actions',
          action: 'Création action',
          detail: 'Formulaire pilotage — liaisons risque / audit / incident',
          user: getSessionUser()?.name || 'Responsable QHSE'
        });
        void loadActionsFromApi();
      }
    });
  });

  page.append(
    offlineCacheBanner,
    createSimpleModeGuide({
      title: 'Plan d’actions — par où commencer ?',
      hint: 'Les filtres avancés sont réduits : gardez « Responsable » et « Statut » pour cadrer votre liste.',
      nextStep: 'Action principale : traiter d’abord les retards, puis les cartes « À lancer ».'
    }),
    managerHost,
    main
  );
  return page;
}
