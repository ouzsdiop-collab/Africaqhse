/**
 * Bloc « suggestions prévention IA » sur fiche risque (extrait de risks.js).
 */

import { parseRiskMatrixGp } from './riskMatrixPanel.js';
import { qhseFetch } from '../utils/qhseFetch.js';

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
  aiBtn.textContent = 'Suggestions de prevention IA';
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
    } catch {
      aiBtn.textContent = 'Erreur — Reessayer';
      aiBtn.disabled = false;
      aiLoading = false;
    }
  });

  host.append(aiBtn);
  inner.append(host);
}
