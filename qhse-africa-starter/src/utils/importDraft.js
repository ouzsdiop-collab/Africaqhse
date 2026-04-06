/** Brouillon import → module cible (sessionStorage, onglet courant). */

export const IMPORT_DRAFT_STORAGE_KEY = 'qhseImportDraftV1';

/**
 * @param {Record<string, unknown>} payload
 */
export function saveImportDraft(payload) {
  try {
    sessionStorage.setItem(
      IMPORT_DRAFT_STORAGE_KEY,
      JSON.stringify({ v: 1, savedAt: Date.now(), ...payload })
    );
  } catch (e) {
    console.warn('[importDraft] save', e);
  }
}

/**
 * @returns {Record<string, unknown> | null}
 */
export function readImportDraft() {
  try {
    const raw = sessionStorage.getItem(IMPORT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    return typeof o === 'object' && o ? o : null;
  } catch {
    return null;
  }
}

export function clearImportDraft() {
  try {
    sessionStorage.removeItem(IMPORT_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
