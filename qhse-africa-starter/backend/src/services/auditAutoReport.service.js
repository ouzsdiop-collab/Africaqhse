import { prisma } from '../db.js';
import * as reportService from './report.service.js';
import * as emailService from './email.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Jetons normalisés (sans accents) explicites — pas de simple `includes` sur la chaîne entière. */
const FINAL_TOKENS = new Set([
  'termine',
  'terminee',
  'clos',
  'cloture',
  'cloturee',
  'final',
  'finalise',
  'finalises',
  'finalisee',
  'acheve',
  'achevee',
  'valide',
  'validee'
]);

/** Annule un statut final si présent dans le libellé (ex. « non terminé », « sans clôture »). */
const BLOCK_TOKENS = new Set([
  'non',
  'sans',
  'pas',
  'invalide',
  'annule',
  'annulee',
  'refuse',
  'refusee',
  'brouillon'
]);

function tokenizeStatus(status) {
  return String(status ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Statut considéré comme final / clôturé (V1 — chaîne libre, détection par jetons).
 */
export function isFinalAuditStatus(status) {
  const tokens = tokenizeStatus(status);
  if (tokens.some((t) => BLOCK_TOKENS.has(t))) return false;
  return tokens.some((t) => FINAL_TOKENS.has(t));
}

const RECIPIENT_ROLES = new Set(['ADMIN', 'QHSE', 'DIRECTION']);

async function collectAutomaticRecipientEmails() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  const out = [];
  const seen = new Set();
  for (const u of users) {
    const r = String(u.role ?? '')
      .trim()
      .toUpperCase();
    if (!RECIPIENT_ROLES.has(r)) continue;
    const e = String(u.email ?? '').trim().toLowerCase();
    if (!e || !EMAIL_RE.test(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(u.email.trim());
  }
  return out;
}

/**
 * Envoie une seule fois le PDF après passage en statut final (garde-fou : autoReportSentAt).
 * @param {object | null} _previous — réservé évolutions (ex. transition stricte)
 * @param {object} current — ligne Audit Prisma après create/update
 * @returns {Promise<{ sent: boolean, reason?: string, recipients?: string[], audit?: object }>}
 */
export async function trySendFinalAuditReport(_previous, current) {
  if (!current?.id || !current.ref) {
    return { sent: false, reason: 'invalid_audit' };
  }
  if (!isFinalAuditStatus(current.status)) {
    return { sent: false, reason: 'not_final' };
  }
  if (current.autoReportSentAt) {
    return { sent: false, reason: 'already_sent' };
  }

  const recipients = await collectAutomaticRecipientEmails();
  if (!recipients.length) {
    console.warn(
      '[auditAutoReport] Aucun destinataire (rôles ADMIN / QHSE / DIRECTION avec e-mail valide).'
    );
    return { sent: false, reason: 'no_recipients' };
  }

  if (!emailService.isSmtpConfigured()) {
    console.warn(
      '[auditAutoReport] SMTP non configuré — envoi automatique ignoré (réessayez après configuration).'
    );
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const nonConformities = await prisma.nonConformity.findMany({
      where: { auditRef: current.ref },
      orderBy: { createdAt: 'asc' }
    });

    const pdfBuffer = await reportService.generateAuditReport(current, {
      nonConformities
    });
    const safeRef = String(current.ref).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `rapport-audit-${safeRef}.pdf`;

    const subject = `[QHSE] Rapport d'audit ${current.ref} (clôture) — ${current.site}`;
    const text = [
      'Bonjour,',
      '',
      `L'audit ${current.ref} est passé en statut clôturé / final.`,
      'Veuillez trouver en pièce jointe le rapport PDF généré automatiquement.',
      '',
      `Site : ${current.site}`,
      `Score : ${current.score} % — Statut : ${current.status}`,
      '',
      '— Envoi automatique QHSE (ne pas répondre à cet e-mail).'
    ].join('\n');

    await emailService.sendMailWithPdfAttachment({
      to: recipients,
      subject,
      text,
      pdfBuffer,
      filename
    });

    await prisma.audit.update({
      where: { id: current.id },
      data: { autoReportSentAt: new Date() }
    });

    const audit = await prisma.audit.findUnique({ where: { id: current.id } });
    return { sent: true, recipients, audit: audit ?? current };
  } catch (err) {
    console.error('[auditAutoReport] Échec envoi', err);
    return {
      sent: false,
      reason: 'send_failed',
      detail: err.message || String(err)
    };
  }
}
