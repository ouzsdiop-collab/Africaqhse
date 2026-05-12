import nodemailer from 'nodemailer';
import { MONO_ORG } from './auth.service.js';

let transporter = null;

export function getMailFrom() {
  const f = process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  return f || '';
}

/** Reply-To des notifications (assistance). Priorité : SMTP_REPLY_TO puis SUPPORT_EMAIL. */
export function getSmtpReplyTo() {
  return process.env.SMTP_REPLY_TO?.trim() || process.env.SUPPORT_EMAIL?.trim() || '';
}

export function isSmtpConfigured() {
  const host = process.env.SMTP_HOST && String(process.env.SMTP_HOST).trim();
  const user = process.env.SMTP_USER?.trim();
  return Boolean(host && getMailFrom() && user);
}

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure =
    process.env.SMTP_SECURE === 'true' || String(port) === '465';
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? '';

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined
  });
  return transporter;
}

/** @param {string} [s] */
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getFrontendBaseUrl() {
  const u = process.env.FRONTEND_URL?.trim();
  if (u) return u.replace(/\/$/, '');
  const cors = (process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS)?.split(',')[0]?.trim();
  if (cors) return cors.replace(/\/$/, '');
  return 'http://localhost:5173';
}

/**
 * @param {string} toEmail
 * @param {string} resetUrl — lien complet avec jeton (hash SPA)
 */
export async function sendPasswordResetEmail(toEmail, resetUrl) {
  const to = String(toEmail ?? '').trim().toLowerCase();
  if (!to) return;
  const html = buildHtmlEmailLayout({
    tone: 'info',
    title: 'Réinitialisation du mot de passe',
    bodyHtml: `<p style="margin:0 0 12px">Vous avez demandé à réinitialiser votre mot de passe sur QHSE Control.</p>
<p style="margin:0 0 12px">Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>
<p style="margin:0;font-size:13px;color:#64748b">Le lien expire dans une heure.</p>`,
    ctaLabel: 'Choisir un nouveau mot de passe',
    ctaUrl: resetUrl
  });
  await sendMailHtml({
    to: [to],
    subject: 'QHSE Control — réinitialisation du mot de passe',
    html,
    text: `Réinitialisation du mot de passe : ${resetUrl}\n\nLe lien expire dans une heure.`
  });
}

/**
 * Envoi des accès provisoires (création ou reset) — secret transmis uniquement par e-mail.
 * @param {{
 *  toEmail: string,
 *  userName?: string,
 *  tenantName?: string,
 *  temporaryPassword: string,
 *  expiresAt: Date
 * }} p
 */
export async function sendProvisioningAccessEmail(p) {
  const to = String(p?.toEmail ?? '')
    .trim()
    .toLowerCase();
  if (!to) return;
  const exp = p?.expiresAt instanceof Date ? p.expiresAt : new Date(Date.now() + 48 * 60 * 60 * 1000);
  const html = buildHtmlEmailLayout({
    tone: 'info',
    title: 'Accès à votre espace QHSE Control',
    bodyHtml: `<p style="margin:0 0 12px">Bonjour ${escapeHtml(p?.userName || '')},</p>
<p style="margin:0 0 12px">Votre compte pour ${escapeHtml(p?.tenantName || 'votre organisation')} est prêt.</p>
<p style="margin:0 0 12px"><strong>Mot de passe provisoire :</strong> <code style="font-size:14px">${escapeHtml(p?.temporaryPassword || '')}</code></p>
<p style="margin:0 0 12px">Ce mot de passe expire le <strong>${exp.toLocaleString('fr-FR')}</strong> et devra être changé lors de la première connexion.</p>`,
    ctaLabel: 'Se connecter',
    ctaUrl: `${getFrontendBaseUrl()}/`
  });
  await sendMailHtml({
    to: [to],
    subject: 'QHSE Control — accès à votre compte',
    html,
    text: `Votre mot de passe provisoire: ${p?.temporaryPassword || ''}\nExpire le: ${exp.toISOString()}\nConnexion: ${getFrontendBaseUrl()}/`
  });
}

/**
 * @param {'critique'|'high'|'info'|'success'} tone
 */
function headerColorForTone(tone) {
  if (tone === 'critique') return '#991b1b';
  if (tone === 'high') return '#c2410c';
  if (tone === 'success') return '#166534';
  return '#0369a1';
}

/**
 * @param {{
 *   tone?: 'critique'|'high'|'info'|'success',
 *   title: string,
 *   bodyHtml: string,
 *   ctaLabel?: string | null,
 *   ctaUrl?: string | null
 * }} p
 */
export function buildHtmlEmailLayout(p) {
  const tone = p.tone ?? 'info';
  const color = headerColorForTone(tone);
  const ctaBlock =
    p.ctaLabel && p.ctaUrl
      ? `<p style="margin:24px 0 0">
          <a href="${escapeHtml(p.ctaUrl)}" style="display:inline-block;padding:12px 20px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            ${escapeHtml(p.ctaLabel)}
          </a>
        </p>`
      : '';
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:${color};padding:20px 24px;color:#fff;">
              <table width="100%"><tr>
                <td style="vertical-align:middle;">
                  <div style="font-size:20px;font-weight:800;letter-spacing:0.02em;">QHSE Control</div>
                  <div style="font-size:13px;opacity:0.95;margin-top:4px;">${escapeHtml(MONO_ORG.name)}</div>
                </td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 8px;color:#0f172a;font-size:18px;font-weight:700;">
              ${escapeHtml(p.title)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px;color:#334155;font-size:15px;line-height:1.55;">
              ${p.bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 20px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
              QHSE Control · assistance : support@qhsecontrol.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * @param {{ to: string[], subject: string, html: string, text?: string }} opts
 */
export async function sendMailHtml(opts) {
  if (!isSmtpConfigured()) {
    const err = new Error(
      'Configuration SMTP incomplète (SMTP_HOST, SMTP_USER, SMTP_FROM ou EMAIL_FROM).'
    );
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }
  const t = getTransporter();
  if (!t) {
    const err = new Error('Transport e-mail indisponible');
    err.code = 'SMTP_TRANSPORT';
    throw err;
  }

  const from = getMailFrom();
  const replyTo = getSmtpReplyTo();
  const to = opts.to.filter(Boolean);
  if (!to.length) {
    const err = new Error('Aucun destinataire');
    err.code = 'NO_RECIPIENTS';
    throw err;
  }

  return t.sendMail({
    from,
    ...(replyTo ? { replyTo } : {}),
    to: to.join(', '),
    subject: opts.subject,
    html: opts.html,
    text: opts.text ?? ''
  });
}

/**
 * @param {{ to: string[], subject: string, text: string, pdfBuffer: Buffer, filename: string }} opts
 */
export async function sendMailWithPdfAttachment(opts) {
  if (!isSmtpConfigured()) {
    const err = new Error(
      'Configuration SMTP incomplète (SMTP_HOST, SMTP_USER, SMTP_FROM ou EMAIL_FROM).'
    );
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }
  const t = getTransporter();
  if (!t) {
    const err = new Error('Transport e-mail indisponible');
    err.code = 'SMTP_TRANSPORT';
    throw err;
  }

  const from = getMailFrom();
  const replyTo = getSmtpReplyTo();
  const to = opts.to.filter(Boolean);
  if (!to.length) {
    const err = new Error('Aucun destinataire');
    err.code = 'NO_RECIPIENTS';
    throw err;
  }

  return t.sendMail({
    from,
    ...(replyTo ? { replyTo } : {}),
    to: to.join(', '),
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        filename: opts.filename,
        content: opts.pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
}

/**
 * E-mail texte simple (synthèses, relances) — même configuration SMTP que les PDF.
 * @param {{ to: string[], subject: string, text: string }} opts
 */
export async function sendMailText(opts) {
  if (!isSmtpConfigured()) {
    const err = new Error(
      'Configuration SMTP incomplète (SMTP_HOST, SMTP_USER, SMTP_FROM ou EMAIL_FROM).'
    );
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }
  const t = getTransporter();
  if (!t) {
    const err = new Error('Transport e-mail indisponible');
    err.code = 'SMTP_TRANSPORT';
    throw err;
  }

  const from = getMailFrom();
  const replyTo = getSmtpReplyTo();
  const to = opts.to.filter(Boolean);
  if (!to.length) {
    const err = new Error('Aucun destinataire');
    err.code = 'NO_RECIPIENTS';
    throw err;
  }

  return t.sendMail({
    from,
    ...(replyTo ? { replyTo } : {}),
    to: to.join(', '),
    subject: opts.subject,
    text: opts.text
  });
}

/**
 * @param {unknown} incident
 * @param {string[]} recipients — adresses e-mail
 */
export async function sendIncidentAlert(incident, recipients) {
  const inc = incident && typeof incident === 'object' ? incident : {};
  const ref = String(inc.ref ?? inc.id ?? '—');
  const site = String(inc.site ?? '—');
  const severity = String(inc.severity ?? '—');
  const description = inc.description != null ? String(inc.description) : '';
  const base = getFrontendBaseUrl();
  const id = typeof inc.id === 'string' ? inc.id : '';
  const ctaUrl = `${base}/#incidents`;
  const bodyHtml = `
    <p><strong>Gravité :</strong> ${escapeHtml(severity)}</p>
    <p><strong>Site :</strong> ${escapeHtml(site)}</p>
    <p><strong>Référence :</strong> ${escapeHtml(ref)}</p>
    ${description ? `<p><strong>Description :</strong><br/>${escapeHtml(description).replace(/\n/g, '<br/>')}</p>` : ''}
    ${id ? `<p style="font-size:13px;color:#64748b">ID : ${escapeHtml(id)}</p>` : ''}
  `;
  const html = buildHtmlEmailLayout({
    tone: 'critique',
    title: 'Alerte : incident critique',
    bodyHtml,
    ctaLabel: 'Ouvrir le registre des incidents',
    ctaUrl
  });
  const to = [...new Set(recipients.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
  if (!to.length) return;
  await sendMailHtml({
    to,
    subject: `[QHSE Control] Incident critique : ${ref} (${site})`,
    html,
    text: `Incident critique\nGravité : ${severity}\nSite : ${site}\nRéf : ${ref}\n\n${description}\n\n${ctaUrl}`
  });
}

/**
 * @param {unknown} action
 * @param {unknown} assignee — { email, name? }
 */
export async function sendActionOverdueReminder(action, assignee) {
  const act = action && typeof action === 'object' ? action : {};
  const user = assignee && typeof assignee === 'object' ? assignee : {};
  const email = String(user.email ?? '').trim();
  if (!email) return;
  const title = String(act.title ?? 'Action');
  const status = String(act.status ?? '—');
  const due = act.dueDate
    ? new Date(act.dueDate).toLocaleDateString('fr-FR')
    : 'sans échéance';
  const base = getFrontendBaseUrl();
  const ctaUrl = `${base}/#actions`;
  const greet = user.name ? `Bonjour ${escapeHtml(String(user.name))},` : 'Bonjour,';
  const bodyHtml = `
    <p>${greet}</p>
    <p>Une action du plan QHSE est signalée <strong>en retard</strong> :</p>
    <p><strong>${escapeHtml(title)}</strong></p>
    <p>Échéance : ${escapeHtml(due)}<br/>Statut : ${escapeHtml(status)}</p>
  `;
  const html = buildHtmlEmailLayout({
    tone: 'high',
    title: 'Rappel : action en retard',
    bodyHtml,
    ctaLabel: 'Voir le plan d’actions',
    ctaUrl
  });
  await sendMailHtml({
    to: [email],
    subject: `[QHSE Control] Action en retard : ${title.slice(0, 60)}`,
    html,
    text: `${String(user.name || '')}\n\nAction en retard : ${title}\nÉchéance : ${due}\nStatut : ${status}\n\n${ctaUrl}`
  });
}

/**
 * @param {unknown} audit
 * @param {{ email: string, name?: string | null }[]} participants
 */
export async function sendAuditScheduled(audit, participants) {
  const a = audit && typeof audit === 'object' ? audit : {};
  const ref = String(a.ref ?? '—');
  const site = String(a.site ?? '—');
  const status = String(a.status ?? '—');
  const score =
    a.score != null && !Number.isNaN(Number(a.score)) ? String(a.score) : '—';
  const base = getFrontendBaseUrl();
  const ctaUrl = `${base}/#audits`;
  const list = (Array.isArray(participants) ? participants : [])
    .map((p) => String(p?.email ?? '').trim())
    .filter(Boolean);
  const to = [...new Set(list.map((e) => e.toLowerCase()))];
  if (!to.length) return;
  const bodyHtml = `
    <p>Un audit est enregistré ou planifié dans QHSE Control.</p>
    <p><strong>Référence :</strong> ${escapeHtml(ref)}</p>
    <p><strong>Site :</strong> ${escapeHtml(site)}</p>
    <p><strong>Statut :</strong> ${escapeHtml(status)} &nbsp;·&nbsp; <strong>Score :</strong> ${escapeHtml(score)}</p>
  `;
  const html = buildHtmlEmailLayout({
    tone: 'info',
    title: 'Convocation : audit planifié',
    bodyHtml,
    ctaLabel: 'Consulter les audits',
    ctaUrl
  });
  await sendMailHtml({
    to,
    subject: `[QHSE Control] Audit planifié : ${ref} (${site})`,
    html,
    text: `Audit planifié\nRéf : ${ref}\nSite : ${site}\nStatut : ${status}\nScore : ${score}\n\n${ctaUrl}`
  });
}

/**
 * @param {unknown} stats — typiquement report.summary + meta dates
 * @param {string[]} recipients
 * @param {{ organizationName?: string | null }} [opts]
 */
export async function sendWeeklyQhseSummary(stats, recipients, opts) {
  const s = stats && typeof stats === 'object' ? stats : {};
  const meta = s.meta && typeof s.meta === 'object' ? s.meta : {};
  const summary = s.summary && typeof s.summary === 'object' ? s.summary : s;
  const start = meta.startDate ? String(meta.startDate).slice(0, 10) : '—';
  const end = meta.endDate ? String(meta.endDate).slice(0, 10) : '—';
  const incidents = summary.incidentsCreated ?? '—';
  const actions = summary.actionsCreated ?? '—';
  const overdue = summary.actionsOverdueStock ?? '—';
  const score =
    summary.auditScoreAvg != null
      ? `${summary.auditScoreAvg} %`
      : '—';
  const crit = summary.criticalIncidentsInPeriod ?? '—';
  const base = getFrontendBaseUrl();
  const ctaUrl = `${base}/#dashboard`;
  const bodyHtml = `
    <p><strong>Période :</strong> ${escapeHtml(start)} → ${escapeHtml(end)}</p>
    <ul style="margin:12px 0;padding-left:20px;">
      <li>Incidents créés : <strong>${escapeHtml(String(incidents))}</strong></li>
      <li>Incidents critiques (période) : <strong>${escapeHtml(String(crit))}</strong></li>
      <li>Actions créées : <strong>${escapeHtml(String(actions))}</strong></li>
      <li>Actions en retard (stock fin période) : <strong>${escapeHtml(String(overdue))}</strong></li>
      <li>Score moyen audits : <strong>${escapeHtml(String(score))}</strong></li>
    </ul>
  `;
  const html = buildHtmlEmailLayout({
    tone: 'success',
    title: 'Résumé hebdomadaire QHSE',
    bodyHtml,
    ctaLabel: 'Ouvrir le tableau de bord',
    ctaUrl
  });
  const org =
    opts && typeof opts === 'object' && opts.organizationName
      ? String(opts.organizationName).trim()
      : '';
  const orgSeg = org ? ` — ${org}` : '';

  const to = [...new Set(recipients.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
  if (!to.length) return;
  await sendMailHtml({
    to,
    subject: `[QHSE Control] Synthèse QHSE${orgSeg} : semaine ${start} → ${end}`,
    html,
    text: `Synthèse QHSE ${start} → ${end}\nIncidents : ${incidents}\nCritiques : ${crit}\nActions : ${actions}\nRetard : ${overdue}\nScore audits : ${score}\n\n${ctaUrl}`
  });
}

export { fetchPilotageRecipientEmailsForTenant } from '../lib/emailRecipients.js';
