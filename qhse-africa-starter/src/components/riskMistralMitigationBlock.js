/**
 * Bloc « suggestions prévention IA » sur fiche risque (extrait de risks.js).
 */

import { parseRiskMatrixGp } from '../utils/riskMatrixCore.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { appState } from '../utils/state.js';
import { mergeActionOverlay, appendActionHistory } from '../utils/actionPilotageMock.js';
import { linkModules } from '../services/moduleLinks.service.js';
import { activityLogStore } from '../data/activityLog.js';
import { showToast } from './toast.js';

/**
 * @param {HTMLElement} inner
 * @param {object} risk
 */
export function attachRiskMistralMitigationSection(inner, risk) {
  inner.querySelectorAll('[data-qhse-mistral-risk]').forEach((el) => el.remove());
  const host = document.createElement('div');
  host.setAttribute('data-qhse-mistral-risk', '1');
  host.style.marginTop = '12px';

  const aiBtn = document.createElement('button');
  aiBtn.type = 'button';
  aiBtn.textContent = 'Suggestions de prévention IA';
  aiBtn.className = 'btn btn-primary btn-sm';
  aiBtn.style.marginTop = '12px';

  let aiLoading = false;
  aiBtn.addEventListener('click', async () => {
    if (aiLoading) return;
    aiLoading = true;
    aiBtn.textContent = 'Analyse en cours...';
    aiBtn.disabled = true;
    const gp = parseRiskMatrixGp(risk.meta);
    const payload = {
      title: risk.title,
      category: risk.type || '',
      probability: gp?.p ?? 'N/A',
      severity: gp?.g ?? 'N/A',
      description: String(risk.detail || '').trim() || 'Non precise'
    };
    try {
      const res = await qhseFetch('/api/ai/risk-mitigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('api');
      const { suggestion } = await res.json();
      const box = document.createElement('div');
      box.style.cssText =
        'margin-top:12px;padding:16px;background:var(--surface-2,#eff6ff);border-left:3px solid var(--color-primary,#3b82f6);border-radius:8px;font-size:13px;line-height:1.6;color:var(--text-primary,#1e293b);white-space:pre-wrap';
      box.textContent = suggestion;
      aiBtn.parentNode.insertBefore(box, aiBtn.nextSibling);
      aiBtn.style.display = 'none';

      const createActionBtn = document.createElement('button');
      createActionBtn.type = 'button';
      createActionBtn.className = 'btn btn-primary btn-sm';
      createActionBtn.textContent = 'Créer une action corrective';
      createActionBtn.style.marginTop = '10px';
      createActionBtn.addEventListener('click', async () => {
        const user = getSessionUser();
        const siteFromRisk =
          risk.siteId != null && String(risk.siteId).trim() ? String(risk.siteId).trim() : '';
        const siteFromState =
          appState.activeSiteId != null && String(appState.activeSiteId).trim()
            ? String(appState.activeSiteId).trim()
            : '';
        const siteId = siteFromRisk || siteFromState || undefined;
        /** @type {Record<string, string>} */
        const body = {
          title: `Mitigation — ${risk.title}`,
          detail: String(box.textContent || '').slice(0, 8000),
          status: 'À lancer'
        };
        if (siteId) body.siteId = siteId;
        if (user?.id) {
          body.assigneeId = user.id;
          if (user.name) body.owner = user.name;
        } else {
          body.owner = 'À désigner (suggestion IA risque)';
        }
        try {
          const actionRes = await qhseFetch('/api/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!actionRes.ok) throw new Error('api');
          const created = await actionRes.json();
          const id = created?.id != null ? String(created.id) : '';
          const riskTitle = String(risk.title || '').trim() || 'Sans titre';
          const gpForPrio = parseRiskMatrixGp(risk.meta);
          const priority =
            gpForPrio && gpForPrio.g * gpForPrio.p >= 12 ? 'haute' : 'normale';
          if (id) {
            mergeActionOverlay(id, {
              actionType: 'corrective',
              origin: 'risk',
              priority,
              progressPct: 0,
              linkedRisk: riskTitle,
              comments: [],
              history: []
            });
            appendActionHistory(
              id,
              'Action créée depuis suggestion IA mitigation (fiche risque).'
            );
            linkModules({
              fromModule: 'risks',
              fromId: riskTitle,
              toModule: 'actions',
              toId: id,
              kind: 'risk_to_action',
              label: 'Action corrective (suggestion IA)'
            });
          }
          createActionBtn.textContent = '✓ Action créée';
          createActionBtn.disabled = true;
          showToast('Action créée — suivi dans le plan d’actions.', 'success');
          activityLogStore.add({
            module: 'risks',
            action: 'Création action depuis suggestion IA mitigation',
            detail: riskTitle,
            user: getSessionUser()?.name || 'Pilotage QHSE'
          });
        } catch {
          createActionBtn.textContent = 'Erreur — réessayer';
        }
      });
      box.parentNode?.appendChild(createActionBtn);
    } catch {
      aiBtn.textContent = 'Erreur — Réessayer';
      aiBtn.disabled = false;
      aiLoading = false;
    }
  });

  host.append(aiBtn);
  inner.append(host);
}
