import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { CONTROLLED_DOCUMENTS, getRequirements, getImportedDocumentProofs } from '../data/conformityStore.js';
import { computeDocumentComplianceStatus } from '../utils/controlledDocumentCompliance.js';
import { setDocComplianceGroupedNotification } from '../data/notifications.js';
import { getSessionUser } from '../data/sessionUser.js';

/** Libellés FR pour statuts documents parfois renvoyés en anglais par l’API. */
const DOC_COMPLIANCE_STATUS_LABEL_FR = {
  pending: 'En attente',
  review: 'En révision',
  draft: 'Brouillon',
  approved: 'Approuvé',
  valid: 'Valide',
  expired: 'Expiré',
  missing: 'Manquant'
};

/**
 * @param {string|undefined|null} status
 * @param {string|undefined|null} apiLabel
 * @param {string} fallbackLabel
 */
function resolvedDocumentComplianceLabel(status, apiLabel, fallbackLabel) {
  const sk = String(status || '')
    .toLowerCase()
    .trim()
    .replace(/-/g, '_');
  if (DOC_COMPLIANCE_STATUS_LABEL_FR[sk]) return DOC_COMPLIANCE_STATUS_LABEL_FR[sk];
  const lbl = String(apiLabel || '').trim();
  const lk = lbl.toLowerCase().replace(/-/g, '_');
  if (DOC_COMPLIANCE_STATUS_LABEL_FR[lk]) return DOC_COMPLIANCE_STATUS_LABEL_FR[lk];
  return apiLabel || fallbackLabel;
}

/**
 * @param {unknown} row
 */
function enrichUnifiedRow(row) {
  const expiresAt = row.expiresAt != null ? row.expiresAt : null;
  const comp = computeDocumentComplianceStatus(expiresAt);
  const statusKey = row.complianceStatus || comp.key;
  return {
    ...row,
    complianceStatus: statusKey,
    complianceLabel: resolvedDocumentComplianceLabel(statusKey, row.complianceLabel, comp.label),
    daysUntilExpiry: row.daysUntilExpiry != null ? row.daysUntilExpiry : comp.daysUntil
  };
}

/**
 * @param {object[]} apiRows
 */
export function mergeControlledDocumentRows(apiRows) {
  if (Array.isArray(apiRows) && apiRows.length > 0) {
    return apiRows.map((r) =>
      enrichUnifiedRow({
        id: r.id,
        name: r.name || 'Sans titre',
        version: r.version ?? '—',
        type: r.type || 'other',
        classification: r.classification ?? null,
        pendingValidation: Boolean(r.pendingValidation),
        rejected: Boolean(r.rejected),
        createdAt: r.createdAt ?? null,
        updatedAt: r.updatedAt ?? null,
        expiresAt: r.expiresAt ?? null,
        responsible: r.responsible ?? null,
        source: 'api',
        complianceStatus: r.complianceStatus,
        complianceLabel: r.complianceLabel,
        daysUntilExpiry: r.daysUntilExpiry
      })
    );
  }
  return CONTROLLED_DOCUMENTS.map((d, i) => {
    const expiresAt = d.expiresAt != null ? d.expiresAt : null;
    const comp = computeDocumentComplianceStatus(expiresAt);
    return enrichUnifiedRow({
      id: `demo-doc-${i}`,
      name: d.name,
      version: d.version || '—',
      type: d.type || 'procedure',
      createdAt: d.createdAt ?? null,
      updatedAt: d.updatedAt ?? null,
      expiresAt,
      responsible: d.responsible ?? null,
      source: 'demo',
      complianceStatus: comp.key,
      complianceLabel: comp.label,
      daysUntilExpiry: comp.daysUntil
    });
  });
}

/**
 * @param {{ complianceStatus?: string }[]} rows
 */
export function computeDocumentRegistrySummary(rows) {
  let valide = 0;
  let aRenouveler = 0;
  let expire = 0;
  let sans = 0;
  rows.forEach((r) => {
    const k = r.complianceStatus || 'sans_echeance';
    if (k === 'valide') valide += 1;
    else if (k === 'a_renouveler') aRenouveler += 1;
    else if (k === 'expire') expire += 1;
    else sans += 1;
  });
  const withE = rows.filter((r) => r.complianceStatus && r.complianceStatus !== 'sans_echeance');
  const denom = withE.length;
  const pctValide = denom ? Math.round((valide / denom) * 100) : null;
  return {
    valide,
    aRenouveler,
    expire,
    sans,
    total: rows.length,
    pctValide,
    withExpiryCount: denom
  };
}

export function countMissingIsoProofs() {
  const reqs = getRequirements();
  const proofs = getImportedDocumentProofs();
  const covered = new Set(proofs.map((p) => p.requirementId));
  return reqs.filter((r) => r.status !== 'conforme' && !covered.has(r.id)).length;
}

export async function fetchControlledDocumentsFromApi() {
  const ac = new AbortController();
  const tid = window.setTimeout(() => ac.abort(), 12000);
  try {
    const res = await qhseFetch(withSiteQuery('/api/controlled-documents'), { signal: ac.signal });
    if (res.status === 401 || res.status === 403 || !res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  } finally {
    window.clearTimeout(tid);
  }
}

/**
 * Met à jour la notification locale groupée (documents + preuves ISO).
 */
export async function refreshDocComplianceNotifications() {
  const api = await fetchControlledDocumentsFromApi();
  const rows = mergeControlledDocumentRows(api);
  const missingProofs = countMissingIsoProofs();
  setDocComplianceGroupedNotification(rows, missingProofs, getSessionUser()?.role);
}
