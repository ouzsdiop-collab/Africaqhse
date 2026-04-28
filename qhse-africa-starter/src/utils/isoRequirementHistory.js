/**
 * Chronologie « Historique » par exigence ISO : journal d’activité + preuves importées (local).
 */
import { activityLogStore } from '../data/activityLog.js';
import { getImportedDocumentProofs } from '../data/conformityStore.js';

/** @typedef {'status_changed'|'proof_added'|'proof_validated'|'proof_event'|'action_linked'|'audit_done'|'ai_trace'|'other'} IsoHistoryKind */

const KIND_LABELS = /** @type {Record<IsoHistoryKind, string>} */ ({
  status_changed: 'Statut modifié',
  proof_added: 'Preuve ajoutée',
  proof_validated: 'Preuve validée',
  proof_event: 'Preuve (import)',
  action_linked: 'Action liée',
  audit_done: 'Audit réalisé',
  ai_trace: 'Assistant IA',
  other: 'Activité'
});

/**
 * @param {string} clause
 * @returns {RegExp | null}
 */
function clauseTokenRegex(clause) {
  const c = String(clause || '').trim();
  if (!c) return null;
  const esc = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return new RegExp(`\\b${esc.replace(/\./g, '\\.')}\\b|\\b${esc.replace(/\./g, '[._]')}\\b`, 'i');
  } catch {
    return null;
  }
}

/**
 * @param {{ action?: string; detail?: string }} entry
 * @param {{ clause?: string; id?: string }} row
 */
function textMentionsRequirement(entry, row) {
  const id = String(row.id || '').trim().toLowerCase();
  const blob = `${entry.action || ''}\n${entry.detail || ''}`.toLowerCase();
  if (id && blob.includes(id)) return true;
  const re = clauseTokenRegex(row.clause);
  return Boolean(re && re.test(blob));
}

/**
 * @param {{ requirementId?: string }} entry
 * @param {string} reqId
 */
function explicitRequirementMatch(entry, reqId) {
  return String(entry.requirementId || '').trim() === reqId;
}

/**
 * @param {object} entry
 * @param {string} reqId
 * @param {{ clause?: string; id?: string }} row
 */
function journalEntryMatchesRequirement(entry, reqId, row) {
  if (explicitRequirementMatch(entry, reqId)) return true;
  if (entry.entityType === 'ai_suggestion' && String(entry.requirementId || '').trim() === reqId) return true;
  if (entry.module === 'iso' && entry.detail && String(entry.detail).includes(reqId)) return true;
  if (entry.module === 'actions' && textMentionsRequirement(entry, row)) {
    const a = `${entry.action || ''}`.toLowerCase();
    if (/action|créé|création|liée|corrective|plan/i.test(a)) return true;
  }
  if (entry.module === 'audits' && textMentionsRequirement(entry, row)) {
    const a = `${entry.action || ''}`.toLowerCase();
    if (/export|pdf|final|réalis|realis|termin|clôtur|clotur|sauvegard|enregistr|rapport/i.test(a))
      return true;
  }
  return false;
}

/**
 * @param {{ action?: string; detail?: string; module?: string; isoHistoryKind?: string }} entry
 * @returns {IsoHistoryKind}
 */
export function inferIsoHistoryKind(entry) {
  const hinted = entry.isoHistoryKind;
  if (hinted && KIND_LABELS[/** @type {IsoHistoryKind} */ (hinted)]) {
    return /** @type {IsoHistoryKind} */ (hinted);
  }
  if (entry.entityType === 'ai_suggestion') return 'ai_trace';
  const blob = `${entry.action || ''} ${entry.detail || ''}`.toLowerCase();
  if (/statut.*exigence|exigence.*statut|validation humaine.*statut/i.test(blob)) return 'status_changed';
  if (/import.*validé|preuve validée|validated/i.test(blob)) return 'proof_validated';
  if (/import document|preuve ajoutée|preuve enregistrée|rattaché.*preuve/i.test(blob)) return 'proof_added';
  if (/preuve|import/i.test(blob) && entry.module === 'iso') return 'proof_event';
  if (/action créée|action liée|depuis document|document maîtrisé/i.test(blob)) return 'action_linked';
  if (entry.module === 'audits' && /export|pdf|final|réalis|realis|termin|clôtur|rapport/i.test(blob))
    return 'audit_done';
  return 'other';
}

/**
 * @param {IsoHistoryKind} kind
 */
export function isoHistoryKindLabel(kind) {
  return KIND_LABELS[kind] || KIND_LABELS.other;
}

function entrySortKey(e) {
  if (e.at != null && Number.isFinite(Number(e.at))) return Number(e.at);
  if (typeof e.id === 'number' && e.id > 1e11) return e.id;
  if (typeof e.id === 'number') return e.id;
  return 0;
}

/**
 * @param {string} requirementId
 * @param {{ id: string; clause?: string; title?: string }} row
 * @returns {Array<{ at: number; kind: IsoHistoryKind; label: string; user: string; detail: string; source: 'journal'|'proof' }>}
 */
export function buildIsoRequirementHistoryTimeline(requirementId, row) {
  const reqId = String(requirementId || '').trim();
  if (!reqId || !row) return [];

  /** @type {Array<{ at: number; kind: IsoHistoryKind; label: string; user: string; detail: string; source: 'journal'|'proof' }>} */
  const out = [];

  for (const e of activityLogStore.all()) {
    if (!journalEntryMatchesRequirement(e, reqId, row)) continue;
    const kind = inferIsoHistoryKind(e);
    const label = isoHistoryKindLabel(kind);
    const detailJoin =
      e.entityType === 'ai_suggestion'
        ? [
            e.userActionLabel ? `Action : ${e.userActionLabel}` : '',
            e.action,
            e.detail
          ]
            .filter(Boolean)
            .join(' — ')
        : [e.action, e.detail].filter(Boolean).join(' — ');
    out.push({
      at: entrySortKey(e),
      kind,
      label,
      user: String(e.user || '—'),
      detail: detailJoin,
      source: 'journal'
    });
  }

  for (const p of getImportedDocumentProofs()) {
    if (String(p.requirementId || '').trim() !== reqId) continue;
    const fn = String(p.fileName || 'Document');
    const alreadyInJournal = out.some(
      (o) => o.source === 'journal' && fn && o.detail.includes(fn)
    );
    if (alreadyInJournal) continue;
    const t = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
    const validated = Boolean(String(p.validatedBy || '').trim());
    const present = p.proofStatus === 'present';
    const kind =
      present && validated ? 'proof_validated' : present ? 'proof_added' : 'proof_event';
    out.push({
      at: Number.isFinite(t) ? t : Date.now(),
      kind,
      label: isoHistoryKindLabel(kind),
      user: String(p.validatedBy || 'Utilisateur'),
      detail: fn,
      source: 'proof'
    });
  }

  out.sort((a, b) => b.at - a.at);
  return out;
}
