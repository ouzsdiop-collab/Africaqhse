import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';
import * as auditAutoReport from '../services/auditAutoReport.service.js';
import * as emailService from '../services/email.service.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRouteId(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

async function loadAuditForReport(tenantId, rawParam) {
  const param = normalizeRouteId(rawParam);
  if (!param) {
    return null;
  }
  const tf = prismaTenantFilter(tenantId);
  const audit = await prisma.audit.findFirst({
    where: {
      ...tf,
      OR: [{ id: param }, { ref: param }]
    }
  });
  if (!audit) return null;
  return { audit };
}

function parseRecipientsFromBody(body) {
  const raw = body?.to ?? body?.recipients;
  if (raw == null) return [];
  const list = Array.isArray(raw)
    ? raw.map((x) => String(x).trim()).filter(Boolean)
    : String(raw)
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
  return [...new Set(list)];
}

function filterValidEmails(addresses) {
  return addresses.filter((e) => EMAIL_RE.test(e));
}

export async function getAuditReport(req, res, next) {
  try {
    const loaded = await loadAuditForReport(req.qhseTenantId, req.params.id);
    if (!loaded) {
      return res.status(404).json({ error: 'Audit introuvable' });
    }
    const { audit } = loaded;
    const buffer = await auditAutoReport.generateAuditPdfReport(audit.id, req.qhseTenantId);
    const safeRef = String(audit.ref).replace(/[^a-zA-Z0-9._-]/g, '_');
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'reports',
      resourceId: audit.id,
      action: 'export_pdf',
      metadata: { auditRef: audit.ref, kind: 'audit_report' }
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapport-audit-${safeRef}.pdf"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/audits/:id/send-report
 * Body: { to: string | string[] } — une ou plusieurs adresses (virgule acceptée dans la chaîne).
 */
export async function sendAuditReportEmail(req, res, next) {
  try {
    const loaded = await loadAuditForReport(req.qhseTenantId, req.params.id);
    if (!loaded) {
      return res.status(404).json({ error: 'Audit introuvable' });
    }
    const { audit } = loaded;

    const rawList = parseRecipientsFromBody(req.body || {});
    const recipients = filterValidEmails(rawList);
    if (!rawList.length) {
      return res.status(400).json({
        error: 'Indiquez au moins un destinataire (champ « to » ou « recipients »).'
      });
    }
    if (!recipients.length) {
      return res.status(400).json({
        error: 'Aucune adresse e-mail valide.'
      });
    }

    if (!emailService.isSmtpConfigured()) {
      return res.status(503).json({
        error:
          'Envoi e-mail non configuré : renseignez SMTP_HOST et EMAIL_FROM (voir .env.example).'
      });
    }

    const pdfBuffer = await auditAutoReport.generateAuditPdfReport(audit.id, req.qhseTenantId);
    const safeRef = String(audit.ref).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `rapport-audit-${safeRef}.pdf`;

    const subject = `[QHSE] Rapport d'audit ${audit.ref} — ${audit.site}`;
    const text = [
      'Bonjour,',
      '',
      `Veuillez trouver en pièce jointe le rapport PDF de l'audit ${audit.ref}.`,
      `Site : ${audit.site}`,
      `Score : ${audit.score} % — Statut : ${audit.status}`,
      '',
      '— Message envoyé depuis l’application QHSE (envoi à la demande).'
    ].join('\n');

    try {
      const info = await emailService.sendMailWithPdfAttachment({
        to: recipients,
        subject,
        text,
        pdfBuffer,
        filename
      });

      void writeAuditLog({
        tenantId: req.qhseTenantId,
        userId: auditUserIdFromRequest(req),
        resource: 'reports',
        resourceId: audit.id,
        action: 'send_email',
        metadata: {
          auditRef: audit.ref,
          recipientsCount: recipients.length
        }
      });
      res.status(200).json({
        ok: true,
        message: 'Rapport envoyé par e-mail.',
        sentTo: recipients,
        auditRef: audit.ref,
        messageId: info.messageId ?? null
      });
    } catch (sendErr) {
      if (
        sendErr.code === 'SMTP_NOT_CONFIGURED' ||
        sendErr.code === 'SMTP_TRANSPORT'
      ) {
        return res.status(503).json({ error: sendErr.message });
      }
      if (sendErr.code === 'NO_RECIPIENTS') {
        return res.status(400).json({ error: sendErr.message });
      }
      console.error('[reports] sendAuditReportEmail SMTP', sendErr);
      return res.status(502).json({
        error:
          "L'envoi e-mail a échoué. Vérifiez la configuration SMTP et les logs serveur."
      });
    }
  } catch (err) {
    next(err);
  }
}
