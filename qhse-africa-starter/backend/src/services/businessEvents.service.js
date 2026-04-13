/**
 * Bus d’événements métier — hooks pour logs analytiques, notifications (extensions futures).
 * Les contrôleurs conservent leurs writeAuditLog existants ; les événements sont additifs.
 */

import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.setMaxListeners(80);

/**
 * @typedef {{
 *   'incident.created': { tenantId?: string | null, incidentId: string, ref: string, siteId: string | null, site?: string, severity?: string, description?: string | null, userId: string | null },
 *   'action.created': { tenantId?: string | null, actionId: string, siteId: string | null, userId: string | null },
 *   'action.overdue': { actionId: string, action: object, assignee: { id: string, email: string, name?: string | null }, tenantId?: string | null },
 *   'audit.scheduled': { tenantId?: string | null, auditId: string, ref: string, site: string, siteId: string | null, status: string, score: number, userId: string | null, participantEmails?: string[] | null },
 *   'audit.validated': { tenantId?: string | null, auditId: string, ref: string, siteId: string | null, userId: string | null },
 *   'controlled_document.export': { tenantId?: string | null, documentId: string, userId: string | null, classification?: string | null, siteId?: string | null }
 * }} BusinessEventMap
 */

/**
 * @param {string} type
 * @param {Record<string, unknown>} payload
 */
export function emitBusinessEvent(type, payload) {
  try {
    bus.emit(type, payload);
    bus.emit('*', { type, payload });
  } catch (e) {
    console.error('[businessEvents] emit failed', type, e);
  }
}

/**
 * @param {string} type
 * @param {(payload: Record<string, unknown>) => void} fn
 */
export function onBusinessEvent(type, fn) {
  bus.on(type, fn);
}

/**
 * @param {(evt: { type: string, payload: Record<string, unknown> }) => void} fn
 */
export function onAnyBusinessEvent(fn) {
  bus.on('*', fn);
}
