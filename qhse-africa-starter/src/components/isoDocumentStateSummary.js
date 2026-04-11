/**
 * Bloc résumé état documents ISO — extrait de pages/iso.js.
 */

import { computeDocumentRegistrySummary } from '../services/documentRegistry.service.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export function createDocumentStateSummaryBlock() {
  const wrap = document.createElement('div');
  wrap.className = 'iso-doc-summary';
  const summary = computeDocumentRegistrySummary([]);
  const total = summary.total || 0;
  const ok = summary.valide || 0;
  const partial = summary.aRenouveler || 0;
  const ko = summary.expire || 0;
  const pending = summary.sans || 0;
  wrap.innerHTML = `
    <div class="iso-doc-summary__grid">
      <div class="iso-doc-summary__item">
        <span class="iso-doc-summary__label">Documents</span>
        <strong class="iso-doc-summary__value">${escapeHtml(String(total))}</strong>
      </div>
      <div class="iso-doc-summary__item iso-doc-summary__item--ok">
        <span class="iso-doc-summary__label">Conformes</span>
        <strong class="iso-doc-summary__value">${escapeHtml(String(ok))}</strong>
      </div>
      <div class="iso-doc-summary__item iso-doc-summary__item--warn">
        <span class="iso-doc-summary__label">Partiels</span>
        <strong class="iso-doc-summary__value">${escapeHtml(String(partial))}</strong>
      </div>
      <div class="iso-doc-summary__item iso-doc-summary__item--err">
        <span class="iso-doc-summary__label">Non conformes</span>
        <strong class="iso-doc-summary__value">${escapeHtml(String(ko))}</strong>
      </div>
      <div class="iso-doc-summary__item iso-doc-summary__item--pending">
        <span class="iso-doc-summary__label">En attente</span>
        <strong class="iso-doc-summary__value">${escapeHtml(String(pending))}</strong>
      </div>
    </div>
  `;
  return wrap;
}
