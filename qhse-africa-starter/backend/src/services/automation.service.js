import { prisma } from '../db.js';
import { isSmtpConfigured, sendMailText } from './email.service.js';
import { buildPeriodicReport } from './periodicReporting.service.js';

const WEEKLY_RECIPIENT_ROLES = ['ADMIN', 'QHSE', 'DIRECTION'];

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
 * Destinataires synthèse : profils pilotage (e-mail renseigné).
 */
async function fetchWeeklyRecipientEmails(tenantId) {
  const tid = String(tenantId ?? '').trim();
  if (!tid) return [];
  const memberships = await prisma.userTenant.findMany({
    where: {
      tenantId: tid,
      role: { in: WEEKLY_RECIPIENT_ROLES }
    },
    include: {
      user: { select: { email: true, name: true } }
    }
  });
  const seen = new Set();
  const out = [];
  for (const m of memberships) {
    const u = m.user;
    const e = String(u?.email ?? '').trim().toLowerCase();
    if (!e || seen.has(e)) continue;
    seen.add(e);
    out.push({ email: e, name: u?.name, role: m.role });
  }
  return out;
}

/**
 * @returns {{ sent: number, skipped: number, detail: string[] }}
 */
export async function runWeeklySummaryEmail() {
  const detail = [];
  if (!isSmtpConfigured()) {
    detail.push('SMTP non configuré — e-mail non envoyé.');
    return { sent: 0, skipped: 0, detail };
  }

  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  let sent = 0;
  for (const tenant of tenants) {
    const report = await buildPeriodicReport({ tenantId: tenant.id, period: 'weekly' });
    const body = formatWeeklyEmailBody(report);
    const recipients = await fetchWeeklyRecipientEmails(tenant.id);
    if (!recipients.length) {
      detail.push(`[${tenant.name}] Aucun destinataire (rôles pilotage).`);
      continue;
    }
    const subject = `[QHSE] ${tenant.name} — synthèse hebdomadaire (${report.meta?.startDate?.slice(0, 10) ?? ''})`;
    for (const r of recipients) {
      await sendMailText({
        to: [r.email],
        subject,
        text: body
      });
      sent += 1;
    }
  }

  detail.push(`${sent} e-mail(s) envoyé(s) sur ${tenants.length} organisation(s).`);
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

  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  let emailsSent = 0;
  let assigneesTotal = 0;

  for (const tenant of tenants) {
    const actions = await prisma.action.findMany({
      where: { tenantId: tenant.id, assigneeId: { not: null } },
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

    assigneesTotal += byAssignee.size;

    for (const { user, items } of byAssignee.values()) {
      const email = String(user.email ?? '').trim();
      if (!email) continue;

      const lines = [
        `Bonjour ${user.name || ''},`,
        '',
        `[${tenant.name}] Vous avez ${items.length} action(s) signalée(s) en retard :`,
        ''
      ];
      items.forEach((act, i) => {
        const due = act.dueDate
          ? new Date(act.dueDate).toLocaleDateString('fr-FR')
          : 'sans échéance';
        lines.push(`${i + 1}. ${act.title} — échéance ${due} — statut « ${act.status} »`);
      });
      lines.push('', '—', 'Message automatique — merci de mettre à jour le plan d’actions.');

      await sendMailText({
        to: [email],
        subject: `[QHSE] ${tenant.name} — relance : ${items.length} action(s) en retard`,
        text: lines.join('\n')
      });
      emailsSent += 1;
    }
  }

  detail.push(
    `${emailsSent} e-mail(s) de relance sur ${assigneesTotal} binôme(s) org/responsable.`
  );
  return { emailsSent, assignees: assigneesTotal, detail };
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
