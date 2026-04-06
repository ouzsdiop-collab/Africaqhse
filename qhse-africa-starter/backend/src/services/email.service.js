import nodemailer from 'nodemailer';

let transporter = null;

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    String(process.env.SMTP_HOST).trim() &&
    process.env.EMAIL_FROM &&
    String(process.env.EMAIL_FROM).trim()
  );
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

/**
 * @param {{ to: string[], subject: string, text: string, pdfBuffer: Buffer, filename: string }} opts
 */
export async function sendMailWithPdfAttachment(opts) {
  if (!isSmtpConfigured()) {
    const err = new Error(
      'Configuration SMTP incomplète (SMTP_HOST, EMAIL_FROM).'
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

  const from = String(process.env.EMAIL_FROM).trim();
  const to = opts.to.filter(Boolean);
  if (!to.length) {
    const err = new Error('Aucun destinataire');
    err.code = 'NO_RECIPIENTS';
    throw err;
  }

  return t.sendMail({
    from,
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
      'Configuration SMTP incomplète (SMTP_HOST, EMAIL_FROM).'
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

  const from = String(process.env.EMAIL_FROM).trim();
  const to = opts.to.filter(Boolean);
  if (!to.length) {
    const err = new Error('Aucun destinataire');
    err.code = 'NO_RECIPIENTS';
    throw err;
  }

  return t.sendMail({
    from,
    to: to.join(', '),
    subject: opts.subject,
    text: opts.text
  });
}
