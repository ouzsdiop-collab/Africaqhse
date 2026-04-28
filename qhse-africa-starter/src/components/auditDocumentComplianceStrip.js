import {
  fetchControlledDocumentsFromApi,
  mergeControlledDocumentRows,
  computeDocumentRegistrySummary
} from '../services/documentRegistry.service.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

/**
 * Bandeau audits : lien documents expirés / renouvellement et impact conformité.
 */
export function createAuditDocumentComplianceStrip() {
  const el = document.createElement('div');
  el.className = 'audit-doc-compliance-strip';
  el.setAttribute('aria-label', 'Documents maîtrisés — impact conformité audit');
  el.innerHTML = `
    <div class="audit-doc-compliance-strip__inner">
      <span class="audit-doc-compliance-strip__kicker">Documentation</span>
      <p class="audit-doc-compliance-strip__text">Chargement du statut documentaire…</p>
      <button type="button" class="btn btn-secondary audit-doc-compliance-strip__btn">Ouvrir ISO &amp; conformité</button>
    </div>
  `;
  const textEl = el.querySelector('.audit-doc-compliance-strip__text');
  const btn = el.querySelector('.audit-doc-compliance-strip__btn');
  btn?.addEventListener('click', () => {
    qhseNavigate('iso');
  });

  void (async () => {
    const api = await fetchControlledDocumentsFromApi();
    const rows = mergeControlledDocumentRows(api);
    const s = computeDocumentRegistrySummary(rows);
    if (textEl) {
      const parts = [
        `${s.total} document(s) suivis`,
        s.expire ? `<strong class="audit-doc-compliance-strip--bad">${s.expire} expiré(s)</strong>` : null,
        s.aRenouveler ? `<span class="audit-doc-compliance-strip--warn">${s.aRenouveler} à renouveler</span>` : null,
        s.pctValide != null ? `${s.pctValide} % valides (sur échéance)` : null
      ].filter(Boolean);
      textEl.innerHTML =
        parts.join(' · ') +
        (s.expire > 0
          ? ' — <em>impact direct sur les preuves attendues en audit.</em>'
          : ' — alignez les preuves avant la visite.');
    }
  })();

  return el;
}
