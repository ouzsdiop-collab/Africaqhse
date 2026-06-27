import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { qhseNavigate } from './qhseNavigate.js';
import { applyAiSuggestionToForm } from './aiPrefillIntent.js';
import { buildActionDefaultsFromPreventionPlan } from './qhseAssistantFormSuggestions.js';
import { ensureUsersCached, getCachedUsersForActionsList } from './incidentsActions.js';

/**
 * @param {{ ref?: string, externalCompanyName?: string, endDate?: string }} plan
 */
export async function createLinkedActionFromPreventionPlan(plan) {
  await ensureUsersCached();
  // Raccourci plan de prévention → action : pas de création directe.
  // On pré-remplit le formulaire Action; l'utilisateur valide au submit.
  const defaults = buildActionDefaultsFromPreventionPlan(plan);
  applyAiSuggestionToForm(
    'actions',
    { defaults, users: getCachedUsersForActionsList() },
    { skipDefaults: true }
  );
  showToast('Formulaire action lié prérempli. Vérifiez avant validation.', 'info');
  qhseNavigate('actions', {
    skipDefaults: true,
    linkedPreventionPlanRef: String(plan?.ref || '').slice(0, 200),
    source: 'prevention_plan_create_linked_action'
  });

  activityLogStore.add({
    module: 'preventionPlans',
    action: 'Préremplissage action liée (sans création auto)',
    detail: `Depuis plan de prévention ${plan?.ref || ''} — ${plan?.externalCompanyName || ''}`,
    user: getSessionUser()?.name || 'Utilisateur'
  });
}
