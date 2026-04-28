/**
 * Agrégats risques (stats API) — séparé pour éviter dépendances circulaires et garder `risks.service` CRUD.
 */
import { findAllRisks } from './risks.service.js';
import { isCriticalRisk } from './kpiCore.service.js';

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string|null, status?: string|null, category?: string|null }} [filters]
 */
export async function getRiskStats(tenantId, filters = {}) {
  const rows = await findAllRisks(tenantId, { ...filters, limit: 5000 });
  const byStatus = {};
  const byCategory = {};
  let critical = 0;
  rows.forEach((r) => {
    const status = String(r.status || 'unknown');
    const category = String(r.category || 'Autre');
    byStatus[status] = (byStatus[status] || 0) + 1;
    byCategory[category] = (byCategory[category] || 0) + 1;
    if (isCriticalRisk(r)) critical += 1;
  });
  return {
    total: rows.length,
    critical,
    byStatus,
    byCategory
  };
}
