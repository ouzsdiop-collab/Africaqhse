/**
 * Préférences d’affichage table ISO (exigences) : extrait de iso.js.
 */

export const LS_ISO_REQ_TABLE_COLS = 'qhse.iso.reqTableCols';

export function readIsoReqColumnMode() {
  try {
    return localStorage.getItem(LS_ISO_REQ_TABLE_COLS) === 'full' ? 'full' : 'essential';
  } catch {
    return 'essential';
  }
}
