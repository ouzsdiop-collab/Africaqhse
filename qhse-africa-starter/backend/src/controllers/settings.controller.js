import {
  buildHtmlEmailLayout,
  sendMailHtml,
  isSmtpConfigured,
  getMailFrom
} from '../services/email.service.js';
import {
  getEmailNotificationPrefs,
  setEmailNotificationPrefs
} from '../lib/emailNotificationPrefs.js';

export async function postEmailTest(req, res, next) {
  try {
    const email = String(req.qhseUser?.email ?? '').trim();
    if (!email) {
      return res.status(400).json({
        error: 'Aucune adresse e-mail sur le compte administrateur.'
      });
    }
    if (!isSmtpConfigured()) {
      return res.status(503).json({
        error:
          'SMTP non configuré : renseignez SMTP_HOST et SMTP_FROM (ou EMAIL_FROM) sur le serveur.'
      });
    }
    const html = buildHtmlEmailLayout({
      tone: 'info',
      title: 'E-mail de test AfricaQHSE',
      bodyHtml:
        '<p>Ceci est un message de test pour valider la configuration SMTP.</p><p>Si vous le recevez, l’API peut envoyer des notifications.</p>'
    });
    await sendMailHtml({
      to: [email],
      subject: '[AfricaQHSE] Test de configuration SMTP',
      html,
      text: 'Test SMTP AfricaQHSE — configuration OK.'
    });
    res.json({ ok: true, to: email });
  } catch (err) {
    next(err);
  }
}

function maskFromAddress(from) {
  const s = String(from ?? '').trim();
  if (!s) return '';
  const at = s.lastIndexOf('@');
  if (at <= 0) return `${s.slice(0, 2)}***`;
  const local = s.slice(0, at);
  const domain = s.slice(at);
  return `${local.slice(0, 2)}***${domain}`;
}

export function getEmailNotifications(_req, res) {
  const from = getMailFrom();
  const masked = from ? maskFromAddress(from) : '';
  res.json({
    smtpConfigured: isSmtpConfigured(),
    fromMasked: masked || null,
    prefs: getEmailNotificationPrefs()
  });
}

export function patchEmailNotifications(req, res) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  /** @type {Record<string, boolean>} */
  const patch = {};
  for (const k of ['criticalIncidents', 'actionOverdue', 'auditScheduled', 'weeklySummary']) {
    if (typeof body[k] === 'boolean') patch[k] = body[k];
  }
  const prefs = setEmailNotificationPrefs(patch);
  res.json({ ok: true, prefs });
}
