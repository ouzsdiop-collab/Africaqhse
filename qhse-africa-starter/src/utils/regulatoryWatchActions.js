import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { qhseNavigate } from './qhseNavigate.js';
import { applyAiSuggestionToForm } from './aiPrefillIntent.js';
import { buildActionDefaultsFromRegulatoryWatch } from './qhseAssistantFormSuggestions.js';
import { ensureUsersCached, getCachedUsersForActionsList } from './incidentsActions.js';

/**
 * @param {object} rw
 */
export async function createLinkedActionFromRegulatoryWatch(rw) {
  await ensureUsersCached();
  // Raccourci veille réglementaire → action : pas de création directe.
  // On pré-remplit le formulaire Action; l’utilisateur valide au submit.
  const defaults = buildActionDefaultsFromRegulatoryWatch(rw);
  applyAiSuggestionToForm(
    'actions',
    { defaults, users: getCachedUsersForActionsList() },
    { skipDefaults: true }
  );
  showToast('Formulaire action lié prérempli. Vérifiez avant validation.', 'info');
  qhseNavigate('actions', {
    skipDefaults: true,
    linkedRegulatoryWatchRef: String(rw.title || '').slice(0, 200),
    source: 'regulatory_watch_create_linked_action'
  });

  activityLogStore.add({
    module: 'regulatory-watch',
    action: 'Préremplissage action liée (sans création auto)',
    detail: `Depuis texte réglementaire ${rw.title || ''}`,
    user: getSessionUser()?.name || 'Utilisateur'
  });
}
