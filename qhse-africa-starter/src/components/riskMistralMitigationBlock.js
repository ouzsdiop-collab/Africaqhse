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
import { applyAiSuggestionToForm } from '../utils/aiPrefillIntent.js';

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

  const status = document.createElement('div');
  status.style.cssText = 'margin-top:8px;font-size:12px;color:var(--color-text-muted);display:none';
  host.append(status);

  let aiLoading = false;
  aiBtn.addEventListener('click', async () => {
    if (aiLoading) return;
    aiLoading = true;
    aiBtn.textContent = 'Analyse en cours…';
    aiBtn.disabled = true;
    status.style.display = 'block';
    status.innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:14px;height:14px;border-radius:999px;border:2px solid rgba(148,163,184,.25);border-top-color:rgba(56,189,248,.95);animation:qhseAiSpin .9s linear infinite"></span>Analyse en cours</span>';
    if (!document.getElementById('qhse-ai-mini-spin')) {
      const s = document.createElement('style');
      s.id = 'qhse-ai-mini-spin';
      s.textContent = '@keyframes qhseAiSpin{to{transform:rotate(360deg)}}';
      document.head.append(s);
    }
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
      const body = await res.json().catch(() => ({}));
      const suggestion = typeof body?.suggestion === 'string' ? body.suggestion : '';
      const structured = body?.structured && typeof body.structured === 'object' ? body.structured : null;
      const providerMeta = body?.providerMeta && typeof body.providerMeta === 'object' ? body.providerMeta : null;

      const c = Math.max(0, Math.min(1, Number(structured?.confidence) || 0.5));
      const confLabel = c >= 0.8 ? 'Confiance élevée' : c >= 0.5 ? 'Confiance moyenne' : 'Confiance faible';
      const confTone = c >= 0.8 ? '#10b981' : c >= 0.5 ? '#f59e0b' : '#ef4444';
      const mode = providerMeta?.mode && providerMeta.mode !== 'openai' ? ` · fallback (${providerMeta.mode})` : '';
      status.innerHTML = `<span style="display:inline-flex;align-items:center;gap:10px">
        <span style="display:inline-flex;align-items:center;gap:8px;padding:3px 10px;border-radius:999px;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.08);font-weight:900">Suggestion assistée à valider</span>
        <span style="font-weight:900;color:${confTone}">${confLabel}</span>
        <span style="opacity:.9">(${Math.round(c * 100)}%${mode})</span>
      </span>
      <div style="margin-top:6px">Lecture assistée à titre indicatif. La validation finale reste humaine.</div>`;

      const box = document.createElement('div');
      box.style.cssText =
        'margin-top:12px;padding:16px;background:var(--surface-2,#eff6ff);border-left:3px solid var(--color-primary,#3b82f6);border-radius:8px;font-size:13px;line-height:1.6;color:var(--text-primary,#1e293b);white-space:pre-wrap';
      box.textContent = suggestion;
      aiBtn.parentNode.insertBefore(box, aiBtn.nextSibling);
      aiBtn.style.display = 'none';

      const createActionBtn = document.createElement('button');
      createActionBtn.type = 'button';
      createActionBtn.className = 'btn btn-primary btn-sm';
      createActionBtn.textContent = 'Appliquer au formulaire (action)';
      createActionBtn.style.marginTop = '10px';
      createActionBtn.addEventListener('click', async () => {
        const structuredFallback = structured || {
          type: 'risk_analysis',
          confidence: 0.35,
          content: {
            summary: String(suggestion || '').slice(0, 1200),
            findings: [],
            recommendedActions: [],
            humanValidationRequired: true,
            disclaimer: 'Suggestion assistée à valider par un responsable habilité.'
          }
        };

        const { openAiStructuredValidationDialog } = await import('./aiStructuredValidationDialog.js');
        openAiStructuredValidationDialog({
          title: `Risque : mesures de maîtrise`,
          ai: { structured: structuredFallback, providerMeta, suggestionText: suggestion },
          primaryLabel: 'Appliquer au formulaire',
          secondaryLabel: 'Ignorer',
          onApply: async ({ recommendedActionsText, confidence }) => {
            const gpForPrio = parseRiskMatrixGp(risk.meta);
            const priority = gpForPrio && gpForPrio.g * gpForPrio.p >= 12 ? 'haute' : 'normale';
            const riskTitle = String(risk.title || '').trim() || 'Sans titre';
            const defaults = {
              title: `Mitigation : ${riskTitle}`.slice(0, 240),
              origin: 'risk',
              actionType: 'corrective',
              priority,
              description: [
                String(recommendedActionsText || '').trim() || String(suggestion || '').trim(),
                '',
                `[Suggestion assistée à valider · confiance ~${Math.round((Number(confidence) || 0.35) * 100)} %]`,
                `Risque lié : ${riskTitle}`
              ]
                .filter(Boolean)
                .join('\n')
                .slice(0, 8000),
              linkedRisk: riskTitle
            };
            applyAiSuggestionToForm('actions', { defaults }, { skipDefaults: true });
            showToast('Formulaire action prérempli. Vérifiez avant validation.', 'info');
          }
        });
      });
      box.parentNode?.appendChild(createActionBtn);
    } catch {
      aiBtn.textContent = 'Relancer l’analyse';
      aiBtn.disabled = false;
      aiLoading = false;
      status.style.display = 'block';
      status.innerHTML =
        'IA indisponible pour le moment. Vous pouvez relancer ou saisir manuellement les mesures.';
    }
  });

  host.prepend(aiBtn);
  inner.append(host);
}
