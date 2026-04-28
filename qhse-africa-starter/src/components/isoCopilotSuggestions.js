/**
 * Suggestions dynamiques « Assistant conformité » : audit / preuves / NC.
 * Jusqu’à 3 entrées orientées action.
 */

import {
  AUDITS_TO_SCHEDULE,
  DOCUMENT_ATTENTION,
  getNormById,
  getRequirements
} from '../data/conformityStore.js';

/**
 * @param {{
 *   onScrollTo: (selector: string) => void;
 *   onOpenFirstNc: () => void;
 *   onHash: (hash: string) => void;
 * }} hooks
 */
export function buildIsoCopilotSuggestions(hooks) {
  /** @type {{ id: string; label: string; onClick: () => void }[]} */
  const out = [];

  const nMissing = DOCUMENT_ATTENTION.missing.length;
  if (nMissing > 0) {
    const iso14001 = DOCUMENT_ATTENTION.missing.some((d) =>
      /14001|environnement|déversement/i.test(`${d.name} ${d.note}`)
    );
    out.push({
      id: 'proofs-missing',
      label: iso14001
        ? `${nMissing} preuve(s) manquante(s) : ISO 14001 à consolider`
        : `${nMissing} preuve(s) manquante(s) : rattacher au registre`,
      onClick: () => hooks.onScrollTo('.iso-docs-priority')
    });
  }

  const ncFirst = getRequirements().find((r) => r.status === 'non_conforme');
  if (ncFirst) {
    const norm = getNormById(ncFirst.normId);
    out.push({
      id: 'nc-open',
      label: `Non-conformité à traiter : ${ncFirst.clause} (${norm ? norm.code : ncFirst.normId})`,
      onClick: () => hooks.onOpenFirstNc()
    });
  }

  if (AUDITS_TO_SCHEDULE.length) {
    const a = AUDITS_TO_SCHEDULE[0];
    out.push({
      id: 'audit-schedule',
      label: `Audit interne à planifier : ${a.title}`,
      onClick: () => hooks.onHash('audits')
    });
  }

  if (out.length < 3) {
    out.push({
      id: 'gaps',
      label: 'Analyser les écarts du registre',
      onClick: () => hooks.onScrollTo('.iso-cockpit-priorities')
    });
  }

  return out.slice(0, 3);
}
