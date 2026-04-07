/**
 * Bloc « Audit readiness » — pilotage certification (front, données conformityStore).
 * Prêt pour enrichissement API (timestamps, preuves serveur).
 */

import {
  computeComplianceSummary,
  DOCUMENT_ATTENTION,
  getRequirements
} from '../data/conformityStore.js';
import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * @typedef {'pret'|'fragile'|'non_pret'} AuditReadinessLevel
 */

/**
 * @returns {{
 *   readiness: AuditReadinessLevel;
 *   pct: number;
 *   ncCount: number;
 *   partialCount: number;
 *   missingDocsCount: number;
 *   message: string;
 *   ctaHint: string;
 * }}
 */
export function computeAuditReadiness() {
  const s = computeComplianceSummary();
  const reqs = getRequirements();
  const ncCount = reqs.filter((r) => r.status === 'non_conforme').length;
  const partialCount = reqs.filter((r) => r.status === 'partiel').length;
  const missingDocsCount = DOCUMENT_ATTENTION.missing.length;
  const obsoleteCount = DOCUMENT_ATTENTION.obsolete.length;

  /** @type {AuditReadinessLevel} */
  let readiness = 'pret';
  if (s.nonOk > 0 || missingDocsCount > 0 || s.pct < 62) {
    readiness = 'non_pret';
  } else if (partialCount > 0 || s.pct < 86 || obsoleteCount > 0) {
    readiness = 'fragile';
  }

  let message = 'Votre dossier est cohérent pour une lecture audit documentaire.';
  if (readiness === 'non_pret') {
    message = 'Audit risqué si lancé aujourd’hui — écarts ou pièces manquantes à traiter.';
  } else if (readiness === 'fragile') {
    message = 'Préparation à consolider : exigences partielles ou documents à vérifier avant la fenêtre audit.';
  }

  const ctaHint =
    readiness === 'pret'
      ? 'Maintenir les preuves et le calendrier audit.'
      : 'Prioriser les écarts et les preuves avant la prochaine visite.';

  return {
    readiness,
    pct: s.pct,
    ncCount,
    partialCount,
    missingDocsCount,
    message,
    ctaHint
  };
}

const READINESS_LABEL = {
  pret: 'Prêt',
  fragile: 'Fragile',
  non_pret: 'Non prêt'
};

/**
 * @param {ReturnType<typeof computeAuditReadiness>} state
 * @param {{ onTreat: () => void }} [hooks]
 */
export function createAuditReadinessBanner(state, hooks) {
  const sec = document.createElement('section');
  sec.className = `iso-audit-readiness iso-audit-readiness--${state.readiness}`;
  sec.setAttribute('aria-label', 'Préparation audit — statut global');
  sec.innerHTML = `
    <div class="iso-audit-readiness-inner">
      <div class="iso-audit-readiness-top">
        <span class="iso-audit-readiness-kicker">Toujours visible · Préparation audit</span>
        <span class="iso-audit-readiness-pill iso-audit-readiness-pill--${state.readiness}">${escapeHtml(READINESS_LABEL[state.readiness])}</span>
      </div>
      <div class="iso-audit-readiness-mid">
        <div class="iso-audit-readiness-score" aria-label="Score conformité">
          <span class="iso-audit-readiness-pct">${escapeHtml(String(state.pct))}</span>
          <span class="iso-audit-readiness-pct-suffix">%</span>
          <span class="iso-audit-readiness-score-cap">conformité</span>
        </div>
        <ul class="iso-audit-readiness-stats" aria-label="Synthèse">
          <li><strong>${escapeHtml(String(state.ncCount))}</strong> non-conformité(s)</li>
          <li><strong>${escapeHtml(String(state.partialCount))}</strong> exigence(s) partielle(s)</li>
          <li><strong>${escapeHtml(String(state.missingDocsCount))}</strong> document(s) manquant(s)</li>
        </ul>
      </div>
      <p class="iso-audit-readiness-msg">${escapeHtml(state.message)}</p>
      <p class="iso-audit-readiness-hint">${escapeHtml(state.ctaHint)}</p>
      <div class="iso-audit-readiness-actions">
        <button type="button" class="btn btn-primary iso-audit-readiness-cta">Traiter maintenant</button>
      </div>
    </div>
  `;
  sec.querySelector('.iso-audit-readiness-cta')?.addEventListener('click', () => {
    hooks?.onTreat?.();
  });
  return sec;
}

/**
 * Met à jour le contenu d’un bandeau existant (sans recréer le nœud).
 * @param {HTMLElement} el
 * @param {ReturnType<typeof computeAuditReadiness>} state
 */
export function updateAuditReadinessBanner(el, state) {
  if (!el?.classList?.contains('iso-audit-readiness')) return;
  el.className = `iso-audit-readiness iso-audit-readiness--${state.readiness}`;
  const pill = el.querySelector('.iso-audit-readiness-pill');
  if (pill) {
    pill.className = `iso-audit-readiness-pill iso-audit-readiness-pill--${state.readiness}`;
    pill.textContent = READINESS_LABEL[state.readiness];
  }
  const pct = el.querySelector('.iso-audit-readiness-pct');
  if (pct) pct.textContent = String(state.pct);
  const stats = el.querySelectorAll('.iso-audit-readiness-stats li strong');
  if (stats[0]) stats[0].textContent = String(state.ncCount);
  if (stats[1]) stats[1].textContent = String(state.partialCount);
  if (stats[2]) stats[2].textContent = String(state.missingDocsCount);
  const msg = el.querySelector('.iso-audit-readiness-msg');
  if (msg) msg.textContent = state.message;
  const hint = el.querySelector('.iso-audit-readiness-hint');
  if (hint) hint.textContent = state.ctaHint;
}
