/**
 * Abonnements par défaut au bus métier — extensible (notifications, analytics externes).
 */

import { onAnyBusinessEvent, onBusinessEvent } from '../services/businessEvents.service.js';
import { writeAuditLog } from '../services/auditLog.service.js';
import {
  isSmtpConfigured,
  sendIncidentAlert,
  sendActionOverdueReminder,
  sendAuditScheduled,
  sendEquipmentSignalementAlert,
  sendEquipmentSignalementReviewed
} from '../services/email.service.js';
import { fetchPilotageRecipientEmailsForTenant } from '../lib/emailRecipients.js';
import { normalizeTenantId } from '../lib/tenantScope.js';
import { getEmailNotificationPrefs } from '../lib/emailNotificationPrefs.js';
import { prisma } from '../db.js';

function auditLogEnabled() {
  return (
    process.env.BUSINESS_EVENT_AUDIT_LOG === 'true' ||
    process.env.BUSINESS_EVENT_AUDIT_LOG === '1'
  );
}

function registerEmailBusinessListeners() {
  onBusinessEvent('incident.created', (payload) => {
    void (async () => {
      try {
        if (!getEmailNotificationPrefs().criticalIncidents) return;
        if (!isSmtpConfigured()) return;
        const p = payload && typeof payload === 'object' ? payload : {};
        const sev = String(p.severity ?? '')
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase();
        const alertSeverities = new Set(['CRITIQUE', 'CRITICAL', 'GRAVE']);
        if (!alertSeverities.has(sev)) return;
        const tid = normalizeTenantId(p.tenantId);
        if (!tid) return;
        const recipients = await fetchPilotageRecipientEmailsForTenant(tid);
        const emails = recipients.map((r) => r.email);
        await sendIncidentAlert(
          {
            id: p.incidentId,
            ref: p.ref,
            site: p.site,
            severity: p.severity,
            description: p.description
          },
          emails
        );
      } catch (e) {
        console.error('[email] incident.created', e);
      }
    })();
  });

  onBusinessEvent('action.overdue', (payload) => {
    void (async () => {
      try {
        if (!getEmailNotificationPrefs().actionOverdue) return;
        if (!isSmtpConfigured()) return;
        const p = payload && typeof payload === 'object' ? payload : {};
        await sendActionOverdueReminder(p.action, p.assignee);
      } catch (e) {
        console.error('[email] action.overdue', e);
      }
    })();
  });

  onBusinessEvent('audit.scheduled', (payload) => {
    void (async () => {
      try {
        if (!getEmailNotificationPrefs().auditScheduled) return;
        if (!isSmtpConfigured()) return;
        const p = payload && typeof payload === 'object' ? payload : {};
        const raw = p.participantEmails;
        /** @type {{ email: string, name?: string | null }[]} */
        let participants = [];
        if (Array.isArray(raw)) {
          participants = raw
            .map((e) => ({ email: String(e ?? '').trim() }))
            .filter((x) => x.email);
        }
        if (!participants.length) {
          const tid = normalizeTenantId(p.tenantId);
          if (tid) {
            participants = await fetchPilotageRecipientEmailsForTenant(tid);
          }
        }
        await sendAuditScheduled(
          {
            ref: p.ref,
            site: p.site,
            status: p.status,
            score: p.score
          },
          participants
        );
      } catch (e) {
        console.error('[email] audit.scheduled', e);
      }
    })();
  });

  onBusinessEvent('equipment.signalement_created', (payload) => {
    void (async () => {
      try {
        if (!getEmailNotificationPrefs().equipmentSignalement) return;
        if (!isSmtpConfigured()) return;
        const p = payload && typeof payload === 'object' ? payload : {};
        const tid = normalizeTenantId(p.tenantId);
        if (!tid) return;
        const recipients = await fetchPilotageRecipientEmailsForTenant(tid);
        const emails = recipients.map((r) => r.email);
        await sendEquipmentSignalementAlert(
          {
            equipmentName: p.equipmentName,
            category: p.category,
            severity: p.severity,
            description: p.description
          },
          emails
        );
      } catch (e) {
        console.error('[email] equipment.signalement_created', e);
      }
    })();
  });

  onBusinessEvent('equipment.signalement_reviewed', (payload) => {
    void (async () => {
      try {
        if (!getEmailNotificationPrefs().equipmentSignalement) return;
        if (!isSmtpConfigured()) return;
        const p = payload && typeof payload === 'object' ? payload : {};
        const reportedByUserId = typeof p.reportedByUserId === 'string' ? p.reportedByUserId : null;
        if (!reportedByUserId) return;
        const reporter = await prisma.user.findUnique({
          where: { id: reportedByUserId },
          select: { email: true, name: true }
        });
        if (!reporter?.email) return;
        await sendEquipmentSignalementReviewed(
          {
            equipmentName: p.equipmentName,
            status: p.status,
            qhseComment: p.qhseComment
          },
          reporter
        );
      } catch (e) {
        console.error('[email] equipment.signalement_reviewed', e);
      }
    })();
  });
}

/**
 * Duplique les événements dans audit_logs (désactivé par défaut — évite le bruit).
 * Les abonnements e-mail écoutent le bus en permanence (envoi effectif selon préférences + SMTP).
 */
export function registerBusinessEventListeners() {
  registerEmailBusinessListeners();

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
