/**
 * Liaisons transverses : registre des risques QHSE (ISO 45001 / 14001).
 */

export { formatRiskLinkTag as formatIncidentToRiskTag } from './riskIncidentLinks.js';

/**
 * @param {string} auditRef
 * @param {string} riskTitle
 */
export function formatAuditToRiskTag(auditRef, riskTitle) {
  return `[Audit ${String(auditRef).trim()} → risque: ${String(riskTitle).trim()}]`;
}

export const riskLinkEntityKeys = {
  incidentToRisk: 'incidentId:riskRegisterId',
  auditFindingToRisk: 'auditRef:requirementId:riskRegisterId'
};
