/** Fenêtre « à renouveler » (jours) — alignée sur le service API. */
export const RENEW_DAYS = 30;

/**
 * @param {Date | string | null | undefined} expiresAt
 * @returns {{ key: 'valide'|'a_renouveler'|'expire'|'sans_echeance', label: string, daysUntil: number | null }}
 */
export function computeDocumentComplianceStatus(expiresAt) {
  if (expiresAt == null || String(expiresAt).trim() === '') {
    return { key: 'sans_echeance', label: 'Sans échéance', daysUntil: null };
  }
  const end = expiresAt instanceof Date ? expiresAt : new Date(String(expiresAt));
  if (Number.isNaN(end.getTime())) {
    return { key: 'sans_echeance', label: 'Sans échéance', daysUntil: null };
  }
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const days = Math.round((startOf(end).getTime() - startOf(now).getTime()) / 86400000);
  if (days < 0) {
    return { key: 'expire', label: 'Expiré', daysUntil: days };
  }
  if (days <= RENEW_DAYS) {
    return { key: 'a_renouveler', label: 'À renouveler', daysUntil: days };
  }
  return { key: 'valide', label: 'Valide', daysUntil: days };
}
