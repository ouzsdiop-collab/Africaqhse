/**
 * Abonnements par défaut au bus métier — extensible (notifications, analytics externes).
 */

import { onAnyBusinessEvent } from '../services/businessEvents.service.js';
import { writeAuditLog } from '../services/auditLog.service.js';

function auditLogEnabled() {
  return (
    process.env.BUSINESS_EVENT_AUDIT_LOG === 'true' ||
    process.env.BUSINESS_EVENT_AUDIT_LOG === '1'
  );
}

/**
 * Duplique les événements dans audit_logs (désactivé par défaut — évite le bruit).
 */
export function registerBusinessEventListeners() {
  if (!auditLogEnabled()) return;

  onAnyBusinessEvent((evt) => {
    if (!evt || typeof evt !== 'object') return;
    const { type, payload } = evt;
    const p =
      payload && typeof payload === 'object' ? /** @type {Record<string, unknown>} */ (payload) : {};
    const tenantId =
      typeof p.tenantId === 'string' && p.tenantId.trim() !== '' ? p.tenantId.trim() : null;
    void writeAuditLog({
      tenantId,
      userId: typeof p.userId === 'string' ? p.userId : null,
      resource: 'business_event',
      resourceId: String(type).slice(0, 200),
      action: 'emit',
      metadata: { eventType: type, ...p }
    });
  });
}
