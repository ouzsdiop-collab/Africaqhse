import { createQhseKpiStrip } from '../components/qhseKpiStrip.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { createActionKanbanCard, getActionPriorityFilterKey } from '../components/actionKanbanCard.js';
import { createActionDetailDialog } from '../components/actionDetailDialog.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { fetchUsers } from '../services/users.service.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { appState } from '../utils/state.js';
import { getSessionUserId, getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';

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
    canAssign
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

function buildKanbanBoard(actionColumns) {
  const board = document.createElement('div');
  board.className = 'kanban-board kanban-board--pilotage kanban-board--pilotage-premium';

  COLUMN_ORDER.forEach((key) => {
    const items = actionColumns[key] || [];
    const meta = COLUMN_META[key];
    const column = document.createElement('section');
    column.className = `kanban-column kanban-column--pilotage kanban-column--pilotage-premium kanban-column--${key}`;

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

function buildFilterToolbar(users, refs, opts = {}) {
  const { terrainOnly = false } = opts;
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

  wrap.append(g2, g3, g4);

  refs.view = selView;
  refs.status = selStatus;
  refs.priority = selPriority;

  return wrap;
}

export function renderActions() {
  ensureQhsePilotageStyles();
  ensureDashboardStyles();

  const actionDetailDialog = createActionDetailDialog();
  const kanbanHooks = {
    onOpenDetail: (row, col) => actionDetailDialog.show(row, col),
    onOpenEdit: (row, col) => {
      actionDetailDialog.show(row, col);
      showToast(
        'Édition complète : prévoir un PATCH /api/actions/:id côté API (hors périmètre actuel).',
        'info'
      );
    }
  };

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--actions-premium';

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
  let usersList = [];
  const filterRefs = { view: null, status: null, priority: null };
  let filterView = isTerrainSessionRole(getSessionUser()?.role) ? 'mine' : 'all';
  let filterStatus = 'all';
  let filterPriority = 'all';
  let onAssignHandler = async () => {};
  let canAssignActions = true;

  function applyClientFilters(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => {
      const col = statusToColumnKey(row.status);
      if (filterStatus !== 'all' && col !== filterStatus) return false;
      if (filterPriority !== 'all') {
        if (col === 'done') return false;
        if (getActionPriorityFilterKey(col, row.dueDate) !== filterPriority) return false;
      }
      return true;
    });
  }

  function refreshWithFilters() {
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
    kpiHost.replaceChildren(
      createQhseKpiStrip([
        {
          label: 'Critiques',
          value: critiques,
          tone: 'red',
          hint: '',
          hintTitle: 'Urgent (≤ 3 j) ou retard — hors terminé, périmètre filtré actuel'
        },
        {
          label: 'En retard',
          value: k.enRetard,
          tone: 'amber',
          hint: '',
          hintTitle: 'Nombre de fiches dans la colonne « En retard » (filtre actif)'
        },
        {
          label: 'En cours',
          value: k.enCours,
          tone: 'blue',
          hint: '',
          hintTitle: 'Colonne « En cours » — périmètre filtré'
        },
        {
          label: 'À lancer',
          value: k.aLancer,
          tone: 'green',
          hint: '',
          hintTitle: 'Colonne « À lancer » — backlog à démarrer'
        }
      ])
    );
    boardHost.replaceChildren(buildKanbanBoard(actionColumns));
  }

  refreshUi(EMPTY_COLUMNS);

  async function loadActionsFromApi() {
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
          refreshWithFilters();
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
      refreshWithFilters();
    } catch (err) {
      console.error('[actions] GET /api/actions', err);
      showToast('Erreur serveur', 'error');
      cachedRows = [];
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
      terrainOnly
    });
    filterHost.append(toolbar);
    filterRefs.view.value = filterView;
    filterRefs.status.value = filterStatus;
    filterRefs.priority.value = filterPriority;

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

  createBtn.addEventListener('click', async () => {
    try {
      const qhse = usersList.find((u) => normalizedUserRole(u.role) === 'QHSE');
      const body = {
        title: 'Nouvelle action',
        detail: 'Pilotage QHSE • Resp. Responsable QHSE',
        status: 'À lancer',
        owner: 'Responsable QHSE'
      };
      if (qhse) {
        body.assigneeId = qhse.id;
        body.owner = qhse.name;
      }
      if (appState.activeSiteId) {
        body.siteId = appState.activeSiteId;
      }

      const res = await qhseFetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        try {
          const errBody = await res.json();
          console.error('[actions] POST /api/actions', res.status, errBody);
        } catch {
          console.error('[actions] POST /api/actions', res.status);
        }
        showToast('Erreur serveur', 'error');
        return;
      }

      showToast('Action enregistrée', 'info');
      activityLogStore.add({
        module: 'actions',
        action: 'Création action',
        detail: 'Depuis le plan d’actions — API',
        user: 'Responsable QHSE'
      });

      await loadActionsFromApi();
    } catch (err) {
      console.error('[actions] POST /api/actions', err);
      showToast('Erreur serveur', 'error');
    }
  });

  page.append(
    createSimpleModeGuide({
      title: 'Plan d’actions — par où commencer ?',
      hint: 'Les filtres avancés sont réduits : gardez « Responsable » et « Statut » pour cadrer votre liste.',
      nextStep: 'Action principale : traiter d’abord les retards, puis les cartes « À lancer ».'
    }),
    main
  );
  return page;
}
