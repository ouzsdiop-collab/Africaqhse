import { prisma } from '../db.js';
import { fetchPilotageRecipientEmailsForTenant } from '../lib/emailRecipients.js';
import { isSmtpConfigured, sendMailText } from './email.service.js';
import { emitBusinessEvent } from './businessEvents.service.js';
import { getEmailNotificationPrefs } from '../lib/emailNotificationPrefs.js';
import { buildPeriodicReport } from './periodicReporting.service.js';

function includesRetard(status) {
  return String(status ?? '').toLowerCase().includes('retard');
}

/** Évite de relancer des actions déjà terminées / clôturées si le libellé contient encore « retard ». */
function isActionStillOpenish(status) {
  const s = String(status ?? '').toLowerCase();
  if (s.includes('termin')) return false;
  if (s.includes('clos')) return false;
  if (s.includes('fermé') || s.includes('ferme')) return false;
  return true;
}

function formatWeeklyEmailBody(report) {
  const m = report.meta || {};
  const s = report.summary || {};
  const lines = [
    'Synthèse hebdomadaire QHSE (automatisation)',
    `Période : ${m.startDate?.slice(0, 10) ?? '—'} → ${m.endDate?.slice(0, 10) ?? '—'}`,
    '',
    `Incidents créés : ${s.incidentsCreated ?? '—'}`,
    `Audits enregistrés : ${s.auditsRecorded ?? '—'}`,
    `Score moyen audits (période) : ${s.auditScoreAvg != null ? `${s.auditScoreAvg} %` : '—'}`,
    `Non-conformités créées : ${s.nonConformitiesCreated ?? '—'} (ouvertes parmi elles : ${s.nonConformitiesOpenAmongCreated ?? '—'})`,
    `Actions créées : ${s.actionsCreated ?? '—'}`,
    `Actions en retard (stock fin période) : ${s.actionsOverdueStock ?? '—'}`,
    `Incidents critiques (période) : ${s.criticalIncidentsInPeriod ?? '—'}`,
    '',
    '—',
    'Message généré automatiquement par QHSE Africa.'
  ];
  return lines.join('\n');
}

/**
 * @returns {{ sent: number, skipped: number, detail: string[] }}
 */
export async function runWeeklySummaryEmail() {
  const detail = [];
  if (!getEmailNotificationPrefs().weeklySummary) {
    detail.push('Synthèse hebdomadaire désactivée (préférences notifications).');
    return { sent: 0, skipped: 0, detail };
  }
  if (!isSmtpConfigured()) {
    detail.push('SMTP non configuré — e-mail non envoyé.');
    return { sent: 0, skipped: 0, detail };
  }

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true }
  });
  if (!tenants.length) {
    detail.push('Aucune organisation en base.');
    return { sent: 0, skipped: 0, detail };
  }

  let sent = 0;
  for (const t of tenants) {
    const report = await buildPeriodicReport({ tenantId: t.id, period: 'weekly' });
    const body = formatWeeklyEmailBody(report);
    const recipients = await fetchPilotageRecipientEmailsForTenant(t.id);
    if (!recipients.length) {
      detail.push(`Synthèse « ${t.slug} » : aucun destinataire pilotage.`);
      continue;
    }
    const subject = `[QHSE] ${t.name} — synthèse hebdomadaire (${report.meta?.startDate?.slice(0, 10) ?? ''})`;
    for (const r of recipients) {
      await sendMailText({
        to: [r.email],
        subject,
        text: body
      });
      sent += 1;
    }
    detail.push(`Synthèse « ${t.slug} » : ${recipients.length} e-mail(s).`);
  }

  if (!sent) {
    detail.push('Aucun e-mail envoyé (pas de destinataires par organisation).');
  }
  return { sent, skipped: 0, detail };
}

/**
 * Un e-mail par responsable ayant au moins une action en retard (statut contient « retard »).
 * @returns {{ emailsSent: number, assignees: number, detail: string[] }}
 */
export async function runOverdueActionReminders() {
  const detail = [];
  if (!isSmtpConfigured()) {
    detail.push('SMTP non configuré — relances non envoyées.');
    return { emailsSent: 0, assignees: 0, detail };
  }
  if (!getEmailNotificationPrefs().actionOverdue) {
    detail.push('Relances actions en retard désactivées (préférences notifications).');
    return { emailsSent: 0, assignees: 0, detail };
  }

  const actions = await prisma.action.findMany({
    where: {
      assigneeId: { not: null },
      tenantId: { not: null }
    },
    include: {
      assignee: { select: { id: true, email: true, name: true } }
    },
    orderBy: { dueDate: 'asc' }
  });

  const overdue = actions.filter(
    (a) => includesRetard(a.status) && isActionStillOpenish(a.status)
  );
  const byAssignee = new Map();
  for (const a of overdue) {
    const id = a.assigneeId;
    if (!id || !a.assignee?.email) continue;
    if (!byAssignee.has(id)) {
      byAssignee.set(id, { user: a.assignee, items: [] });
    }
    byAssignee.get(id).items.push(a);
  }

  let emailsSent = 0;
  for (const { user, items } of byAssignee.values()) {
    const email = String(user.email ?? '').trim();
    if (!email) continue;
    for (const act of items) {
      void emitBusinessEvent('action.overdue', {
        tenantId: act.tenantId ?? null,
        actionId: act.id,
        action: {
          id: act.id,
          title: act.title,
          status: act.status,
          dueDate: act.dueDate,
          siteId: act.siteId ?? null
        },
        assignee: { id: user.id, email: user.email, name: user.name }
      });
      emailsSent += 1;
    }
  }

  detail.push(
    `${emailsSent} événement(s) action.overdue émis (${byAssignee.size} responsable(s)) — e-mails via listeners.`
  );
  return { emailsSent, assignees: byAssignee.size, detail };
}

/**
 * @param {{ weeklySummary?: boolean, overdueReminders?: boolean }} [opts]
 */
export async function runAutomationJobs(opts = {}) {
  const weeklySummary = opts.weeklySummary !== false;
  const overdueReminders = opts.overdueReminders !== false;

  /** @type {{ weeklySummary?: object, overdueReminders?: object, errors: string[] }} */
  const out = { errors: [] };

  if (weeklySummary) {
    try {
      out.weeklySummary = await runWeeklySummaryEmail();
    } catch (e) {
      const msg = e?.message || String(e);
      out.errors.push(`weeklySummary: ${msg}`);
      out.weeklySummary = { sent: 0, skipped: 0, detail: [msg] };
    }
  }

  if (overdueReminders) {
    try {
      out.overdueReminders = await runOverdueActionReminders();
    } catch (e) {
      const msg = e?.message || String(e);
      out.errors.push(`overdueReminders: ${msg}`);
      out.overdueReminders = { emailsSent: 0, assignees: 0, detail: [msg] };
    }
  }

  return out;
}
