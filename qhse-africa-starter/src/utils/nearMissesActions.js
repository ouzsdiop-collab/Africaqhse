import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { qhseNavigate } from './qhseNavigate.js';
import { applyAiSuggestionToForm } from './aiPrefillIntent.js';
import { buildActionDefaultsFromNearMiss } from './qhseAssistantFormSuggestions.js';
import { ensureUsersCached, getCachedUsersForActionsList } from './incidentsActions.js';

/**
 * @param {object} nm
 */
export async function createLinkedActionFromNearMiss(nm) {
  await ensureUsersCached();
  // Raccourci presque-accident → action : pas de création directe.
  // On pré-remplit le formulaire Action; l’utilisateur valide au submit.
  const defaults = buildActionDefaultsFromNearMiss(nm);
  applyAiSuggestionToForm(
    'actions',
    { defaults, users: getCachedUsersForActionsList() },
    { skipDefaults: true }
  );
  showToast('Formulaire action lié prérempli. Vérifiez avant validation.', 'info');
  qhseNavigate('actions', {
    skipDefaults: true,
    linkedNearMissRef: String(nm.title || '').slice(0, 200),
    source: 'near_miss_create_linked_action'
  });

  activityLogStore.add({
    module: 'near-misses',
    action: 'Préremplissage action liée (sans création auto)',
    detail: `Depuis presque-accident ${nm.title || ''}`,
    user: getSessionUser()?.name || 'Utilisateur'
  });
}
