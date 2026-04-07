/**
 * Règle « action en retard » alignée sur `isActionOverdueDashboardRow` côté API
 * (`backend/src/services/kpiCore.service.js`) : action non clôturée et
 * (statut contient « retard » **ou** échéance `dueDate` dans le passé).
 *
 * @param {{ status?: string; dueDate?: string | Date | null }} row
 * @returns {boolean}
 */
export function isActionOverdueDashboardRow(row) {
  const st = String(row?.status ?? '');
  if (isActionClosedForDashboardKpi(st)) return false;
  if (st.toLowerCase().includes('retard')) return true;
  if (row?.dueDate == null || row.dueDate === '') return false;
  const t = new Date(row.dueDate).getTime();
  return Number.isFinite(t) && t < Date.now();
}

/**
 * Statuts considérés comme terminés pour le KPI retard (ne comptent pas comme « en retard »).
 * @param {string} st
 */
function isActionClosedForDashboardKpi(st) {
  return /termin|clos|ferm|fait|complete|réalis|realis|clôtur|clotur|résolu|resolu|done|effectu|complété/i.test(
    String(st)
  );
}
