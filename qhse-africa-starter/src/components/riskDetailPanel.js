import { openRiskSheetModal } from './riskSheetModal.js';

/**
 * Fiche détail risque (modal) : même contenu que {@link openRiskSheetModal}.
 *
 * @param {object} risk
 * @param {object} [opts]
 * @param {() => void} [opts.onClose]
 * @param {(r: object) => void} [opts.onEdit]
 */
export function openRiskDetail(risk, opts = {}) {
  const { onClose, onEdit, ...sheetCtx } = opts;
  openRiskSheetModal(risk, { ...sheetCtx, onClose, onEdit });
}
