import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { qhseNavigate } from './qhseNavigate.js';
import { applyAiSuggestionToForm } from './aiPrefillIntent.js';
import { buildActionDefaultsFromEquipmentAlert } from './qhseAssistantFormSuggestions.js';
import { ensureUsersCached, getCachedUsersForActionsList } from './incidentsActions.js';

/**
 * @param {{ message?: string, type?: string, date?: string }} alert
 */
export async function createLinkedActionFromEquipmentAlert(alert) {
  await ensureUsersCached();
  // Raccourci alerte équipement → action : pas de création directe.
  // On pré-remplit le formulaire Action; l'utilisateur valide au submit.
  const defaults = buildActionDefaultsFromEquipmentAlert(alert);
  applyAiSuggestionToForm(
    'actions',
    { defaults, users: getCachedUsersForActionsList() },
    { skipDefaults: true }
  );
  showToast('Formulaire action lié prérempli. Vérifiez avant validation.', 'info');
  qhseNavigate('actions', {
    skipDefaults: true,
    linkedEquipmentAlertRef: String(alert?.message || '').slice(0, 200),
    source: 'equipment_alert_create_linked_action'
  });

  activityLogStore.add({
    module: 'equipment',
    action: 'Préremplissage action liée (sans création auto)',
    detail: `Depuis alerte équipement ${alert?.message || ''}`,
    user: getSessionUser()?.name || 'Utilisateur'
  });
}
