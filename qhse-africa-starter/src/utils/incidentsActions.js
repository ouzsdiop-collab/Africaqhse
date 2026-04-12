import { appState } from './state.js';
import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { linkModules } from '../services/moduleLinks.service.js';
import { qhseFetch } from './qhseFetch.js';
import { mergeActionOverlay, appendActionHistory } from './actionPilotageMock.js';
import { openActionCreateDialog } from '../components/actionCreateDialog.js';
import { buildActionDefaultsFromIncident } from './qhseAssistantFormSuggestions.js';
import { fetchUsers } from '../services/users.service.js';

function normalizedUserRole(role) {
  return String(role ?? '').trim().toUpperCase();
}

/** @type {object[] | null} */
let cachedUsersForActions = null;

export async function ensureUsersCached() {
  if (cachedUsersForActions) return cachedUsersForActions;
  try {
    cachedUsersForActions = await fetchUsers();
  } catch (e) {
    console.warn('[incidents] fetchUsers', e);
    cachedUsersForActions = [];
  }
  return cachedUsersForActions;
}

/** Liste utilisateurs mise en cache pour actions (lecture synchrone après ensureUsersCached). */
export function getCachedUsersForActionsList() {
  return cachedUsersForActions || [];
}

/**
 * @param {object} inc
 */
export async function createLinkedAction(inc) {
  await ensureUsersCached();
  const qhse = cachedUsersForActions?.find((u) => normalizedUserRole(u.role) === 'QHSE');
  const detailParts = [
    `Incident ${inc.ref}`,
    `${inc.type} · ${inc.site}`,
    inc.severity ? `Gravité : ${inc.severity}` : '',
    inc.description ? inc.description.slice(0, 400) : ''
  ].filter(Boolean);

  /**
   * Repli : siteId ou assigneeId peuvent être absents en base (ex. id démo vs API réelle).
   * @param {{ useAssignee: boolean; useSite: boolean }} o
   */
  function buildActionBody(o) {
    const body = {
      title: `Suite incident ${inc.ref}`,
      detail: detailParts.join(' — '),
      status: 'À lancer',
      owner: 'Responsable QHSE'
    };
    if (o.useAssignee && qhse) {
      body.assigneeId = qhse.id;
      body.owner = qhse.name;
    }
    if (o.useSite && appState.activeSiteId) {
      body.siteId = appState.activeSiteId;
    }
    return body;
  }

  const variants = [
    { useAssignee: true, useSite: true },
    { useAssignee: true, useSite: false },
    { useAssignee: false, useSite: false }
  ];

  let res = new Response(null, { status: 599 });
  for (const v of variants) {
    res = await qhseFetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildActionBody(v))
    });
    if (res.ok) break;
  }

  if (!res.ok) {
    try {
      const errBody = await res.json();
      console.error('[incidents] POST action liée', res.status, errBody);
    } catch {
      console.error('[incidents] POST action liée', res.status);
    }
    showToast('Impossible de créer l’action', 'error');
    return;
  }
  showToast(`Action créée — liée à ${inc.ref}`, 'info');
  linkModules({
    fromModule: 'incidents',
    fromId: inc.ref,
    toModule: 'actions',
    toId: `action_for_${inc.ref}`,
    kind: 'incident_to_action'
  });
  activityLogStore.add({
    module: 'incidents',
    action: 'Création action liée',
    detail: `Depuis incident ${inc.ref}`,
    user: getSessionUser()?.name || 'Responsable QHSE'
  });
}

/**
 * @param {object} inc
 */
export async function proposeCorrectiveActionViaAssistant(inc) {
  await ensureUsersCached();
  openActionCreateDialog({
    users: cachedUsersForActions || [],
    defaults: buildActionDefaultsFromIncident(inc),
    onCreated: () => {
      showToast('Action enregistrée — issue du formulaire assistant.', 'success');
      activityLogStore.add({
        module: 'incidents',
        action: 'Création action (assistant guidé)',
        detail: inc.ref,
        user: getSessionUser()?.name || 'Utilisateur'
      });
    }
  });
}

/**
 * @param {object} inc
 */
export async function createCorrectiveAction(inc) {
  await ensureUsersCached();
  const qhse = cachedUsersForActions?.find((u) => normalizedUserRole(u.role) === 'QHSE');
  const detailParts = [
    `Action corrective — incident ${inc.ref}`,
    `${inc.type} · ${inc.site}`,
    inc.severity ? `Gravité : ${inc.severity}` : '',
    inc.description ? inc.description.slice(0, 400) : ''
  ].filter(Boolean);
  const body = {
    title: `Corrective — ${inc.ref}`,
    detail: detailParts.join(' — '),
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
    showToast('Impossible de créer l’action corrective', 'error');
    return;
  }
  const created = await res.json();
  const id = created?.id;
  if (id) {
    mergeActionOverlay(String(id), {
      actionType: 'corrective',
      origin: 'incident',
      priority: inc.severity === 'critique' ? 'haute' : 'normale',
      progressPct: 0,
      linkedIncident: inc.ref
    });
    appendActionHistory(String(id), `Créée depuis incident ${inc.ref} (corrective).`);
  }
  showToast(`Action corrective créée — ${inc.ref}`, 'success');
  linkModules({
    fromModule: 'incidents',
    fromId: inc.ref,
    toModule: 'actions',
    toId: `corrective_for_${inc.ref}`,
    kind: 'incident_to_action'
  });
  activityLogStore.add({
    module: 'incidents',
    action: 'Création action corrective',
    detail: inc.ref,
    user: getSessionUser()?.name || 'Responsable QHSE'
  });
}
