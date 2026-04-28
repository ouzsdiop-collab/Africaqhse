import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { linkModules } from '../services/moduleLinks.service.js';
import { qhseFetch } from './qhseFetch.js';
import { qhseNavigate } from './qhseNavigate.js';
import { mergeActionOverlay, appendActionHistory } from './actionPilotageMock.js';
import { openActionCreateDialog } from '../components/actionCreateDialog.js';
import { buildActionDefaultsFromIncident } from './qhseAssistantFormSuggestions.js';
import { fetchUsers } from '../services/users.service.js';
import { applyAiSuggestionToForm } from './aiPrefillIntent.js';

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
  // Raccourci incident → action : pas de création directe.
  // On pré-remplit le formulaire Action; l’utilisateur valide au submit.
  const defaults = buildActionDefaultsFromIncident(inc);
  applyAiSuggestionToForm(
    'actions',
    { defaults, users: cachedUsersForActions || [] },
    { skipDefaults: true }
  );
  showToast('Formulaire action lié prérempli. Vérifiez avant validation.', 'info');

  activityLogStore.add({
    module: 'incidents',
    action: 'Préremplissage action liée (sans création auto)',
    detail: `Depuis incident ${inc.ref}`,
    user: getSessionUser()?.name || 'Utilisateur'
  });
}

/**
 * @param {object} inc
 */
export async function proposeCorrectiveActionViaAssistant(inc) {
  await ensureUsersCached();
  const defaults = buildActionDefaultsFromIncident(inc);
  applyAiSuggestionToForm(
    'actions',
    { defaults, users: cachedUsersForActions || [] },
    { skipDefaults: true }
  );
  showToast('Formulaire action prérempli (assistant). Vérifiez avant validation.', 'info');

  activityLogStore.add({
    module: 'incidents',
    action: 'Préremplissage action (assistant guidé)',
    detail: inc.ref,
    user: getSessionUser()?.name || 'Utilisateur'
  });
}

/**
 * @param {object} inc
 */
export async function createCorrectiveAction(inc) {
  await ensureUsersCached();

  // P0 sécurité produit : plus de création directe (POST) depuis une suggestion / raccourci.
  // On force un passage par le formulaire (validation humaine au submit).
  const defaults = buildActionDefaultsFromIncident(inc);
  applyAiSuggestionToForm(
    'actions',
    { defaults, users: cachedUsersForActions || [] },
    { skipDefaults: true }
  );
  showToast('Formulaire action corrective prérempli. Vérifiez avant validation.', 'info');

  activityLogStore.add({
    module: 'incidents',
    action: 'Préremplissage action corrective (sans création auto)',
    detail: inc.ref,
    user: getSessionUser()?.name || 'Utilisateur'
  });
}
