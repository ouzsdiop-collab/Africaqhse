import PDFDocument from 'pdfkit';
import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';
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

/** Destinataires des rapports auto : utilisateurs avec rôles pilotage. */
async function collectAutomaticRecipientEmails() {
  const users = await prisma.user.findMany({
    where: { role: { in: Array.from(RECIPIENT_ROLES) } },
    select: { email: true }
  });
  const out = [];
  const seen = new Set();
  for (const u of users) {
    const e = String(u?.email ?? '').trim().toLowerCase();
    if (!e || !EMAIL_RE.test(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(String(u.email).trim());
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
    const ncWhere = { auditRef: current.ref };
    if (current.tenantId) {
      ncWhere.tenantId = current.tenantId;
    }
    const nonConformities = await prisma.nonConformity.findMany({
      where: ncWhere,
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

function formatFrDateTime(value) {
  if (!value) return '—';
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatFrDate(value) {
  if (!value) return '—';
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * @param {unknown} raw
 * @returns {Array<{ point: string, mark: string, comment: string }>}
 */
function normalizeChecklistForPdf(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;
    const point = typeof x.point === 'string' ? x.point.trim() : '';
    if (!point) continue;
    let mark = '✗';
    let comment = '';
    if (x.na === true || String(x.status || '').toLowerCase() === 'na') {
      mark = 'NA';
    } else if (x.partial === true) {
      mark = 'NA';
      comment = comment || 'Partiel';
    } else if (x.conforme === true) {
      mark = '✓';
    } else {
      mark = '✗';
    }
    const c =
      typeof x.comment === 'string'
        ? x.comment.trim()
        : typeof x.proofRef === 'string'
          ? x.proofRef.trim()
          : '';
    if (c) comment = comment ? `${comment} — ${c}` : c;
    out.push({ point, mark, comment });
  }
  return out;
}

function scoreGaugeColor(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return '#64748b';
  if (n >= 80) return '#16a34a';
  if (n >= 50) return '#ca8a04';
  return '#dc2626';
}

function isActionOpenStatus(status) {
  const s = String(status ?? '').toLowerCase();
  if (!s.trim()) return true;
  return !/\b(termin|clos|cl[oô]tur|ferm|done|compl[eè]t|r[eé]alis)\w*/i.test(s);
}

function drawPageFooter(doc, pageIndex, totalPages, generatedAtStr) {
  const y = doc.page.height - 40;
  doc.save();
  doc.fontSize(8).fillColor('#64748b');
  doc.text(
    `Page ${pageIndex + 1} / ${totalPages}  ·  ${generatedAtStr}  ·  Généré par AfricaQHSE`,
    48,
    y,
    { width: doc.page.width - 96, align: 'center' }
  );
  doc.restore();
}

/**
 * Génère un rapport PDF structuré pour un audit (checklist, actions liées par auditId et par référence texte).
 * @param {string} auditId — id ou ref audit
 * @param {string | null | undefined} tenantId
 * @returns {Promise<Buffer>}
 */
export async function generateAuditPdfReport(auditId, tenantId = null) {
  const param = String(auditId ?? '').trim();
  if (!param) {
    const err = new Error('Identifiant audit requis');
    err.statusCode = 400;
    throw err;
  }

  const tf = prismaTenantFilter(tenantId);
  const audit = await prisma.audit.findFirst({
    where: { ...tf, OR: [{ id: param }, { ref: param }] },
    include: {
      nonConformities: { orderBy: { createdAt: 'asc' } },
      siteRecord: { select: { name: true } },
      actions: {
        where: tf,
        include: { assignee: { select: { name: true } } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        take: 80
      }
    }
  });

  if (!audit) {
    const err = new Error('Audit introuvable');
    err.statusCode = 404;
    throw err;
  }

  const refToken = audit.ref;
  const fromRelation = Array.isArray(audit.actions) ? audit.actions : [];
  const relIds = new Set(fromRelation.map((a) => a.id));

  const textWhere = {
    ...tf,
    OR: [
      { title: { contains: refToken, mode: 'insensitive' } },
      { detail: { contains: refToken, mode: 'insensitive' } }
    ]
  };
  if (relIds.size > 0) {
    textWhere.NOT = { id: { in: [...relIds] } };
  }

  const fromTextSearch = await prisma.action.findMany({
    where: textWhere,
    include: { assignee: { select: { name: true } } },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    take: Math.max(0, 80 - fromRelation.length)
  });

  const mergedById = new Map();
  for (const a of fromRelation) {
    mergedById.set(a.id, a);
  }
  for (const a of fromTextSearch) {
    if (!mergedById.has(a.id)) mergedById.set(a.id, a);
  }

  const actionsLinked = Array.from(mergedById.values()).sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const checklistItems = normalizeChecklistForPdf(audit.checklist);
  const conformCount = checklistItems.filter((i) => i.mark === '✓').length;
  const ncCount = checklistItems.filter((i) => i.mark === '✗').length;
  const naCount = checklistItems.filter((i) => i.mark === 'NA').length;
  const openActions = actionsLinked.filter((a) => isActionOpenStatus(a.status));

  const generatedAtStr = `Généré le ${formatFrDateTime(new Date())}`;
  const score = Number(audit.score);
  const gaugeColor = scoreGaugeColor(score);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
      info: {
        Title: `Rapport audit ${audit.ref}`,
        Author: 'AfricaQHSE'
      },
      bufferPages: true
    });

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentWidth = doc.page.width - 96;

    // —— Page de garde ——
    doc.rect(48, 48, 72, 28).fill('#0f766e');
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold');
    doc.text('QHSE', 56, 56, { width: 60, align: 'center' });
    doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold');
    doc.text('Rapport d’audit', 48, 100, { width: contentWidth });
    doc.fontSize(12).font('Helvetica');
    doc.fillColor('#334155');
    doc.text(`Référence : ${audit.ref}`, 48, 138);
    doc.text(`Site : ${audit.site}`, 48, 156);
    if (audit.siteRecord?.name) {
      doc.text(`Site (référentiel) : ${audit.siteRecord.name}`, 48, 172);
    }
    doc.text(`Date de l’audit : ${formatFrDate(audit.createdAt)}`, 48, audit.siteRecord?.name ? 190 : 174);
    doc.text(`Statut : ${audit.status}`, 48, audit.siteRecord?.name ? 208 : 192);

    const gaugeY = audit.siteRecord?.name ? 232 : 216;
    doc.fontSize(11).fillColor('#0f172a').text('Score global', 48, gaugeY);
    const barX = 48;
    const barY = gaugeY + 18;
    const barW = 220;
    const barH = 18;
    doc.roundedRect(barX, barY, barW, barH, 4).stroke('#cbd5e1');
    const fillW = Math.max(0, Math.min(barW, (Math.min(100, Math.max(0, score)) / 100) * barW));
    if (fillW > 0) {
      doc.roundedRect(barX + 1, barY + 1, fillW - 2, barH - 2, 3).fill(gaugeColor);
    }
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold');
    doc.text(`${Number.isFinite(score) ? score : '—'} %`, barX + barW + 16, barY + 2);

    doc.addPage();

    // —— Résumé exécutif ——
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('Résumé exécutif', 48, 48);
    doc.moveDown(0.6);
    doc.fontSize(11).font('Helvetica').fillColor('#334155');
    doc.text(`Score global : ${Number.isFinite(score) ? `${score} %` : '—'}`, { continued: false });
    doc.text(
      `Points checklist : ${checklistItems.length} au total — ${conformCount} conforme(s) (✓), ${ncCount} non conforme(s) (✗), ${naCount} NA / partiel.`
    );
    doc.text(`Actions liées (texte contenant « ${refToken} ») : ${actionsLinked.length} — dont ${openActions.length} ouverte(s) au sens statut.`);
    doc.moveDown();
    if (audit.nonConformities?.length) {
      doc.font('Helvetica-Bold').text('Non-conformités enregistrées :');
      doc.font('Helvetica');
      audit.nonConformities.slice(0, 8).forEach((nc, i) => {
        doc.text(`${i + 1}. ${nc.title}${nc.status ? ` — ${nc.status}` : ''}`);
      });
      if (audit.nonConformities.length > 8) {
        doc.fillColor('#64748b').text(`… et ${audit.nonConformities.length - 8} autre(s).`);
        doc.fillColor('#334155');
      }
    }
    doc.moveDown();

    // —— Détail checklist ——
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('Détail par section — Checklist', 48, 48);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    if (!checklistItems.length) {
      doc.fillColor('#64748b').text('Aucun point de checklist structuré pour cet audit.');
    } else {
      checklistItems.forEach((item, idx) => {
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
          doc.x = 48;
        }
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(`${idx + 1}. [${item.mark}] ${item.point}`, {
          width: contentWidth
        });
        if (item.comment) {
          doc.font('Helvetica').fillColor('#475569').text(`Commentaire : ${item.comment}`, {
            width: contentWidth - 12,
            indent: 10
          });
        }
        doc.moveDown(0.35);
        doc.fillColor('#334155');
      });
    }

    // —— Plan d’actions ——
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('Plan d’actions (actions liées)', 48, 48);
    doc.moveDown(0.6);
    doc.fontSize(9).font('Helvetica');
    if (!actionsLinked.length) {
      doc.fillColor('#64748b').text(
        'Aucune action dont le titre ou le détail contient la référence d’audit.',
        { width: contentWidth }
      );
    } else {
      actionsLinked.forEach((a) => {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          doc.x = 48;
        }
        const owner = a.assignee?.name || a.owner || '—';
        const due = a.dueDate ? formatFrDate(a.dueDate) : '—';
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(String(a.title || '—'), { width: contentWidth });
        doc.font('Helvetica').fillColor('#334155');
        doc.text(`Responsable : ${owner}  ·  Échéance : ${due}  ·  Statut : ${String(a.status || '—')}`, {
          width: contentWidth
        });
        if (a.detail && String(a.detail).trim()) {
          doc.fontSize(8).fillColor('#64748b').text(String(a.detail).trim().slice(0, 320), {
            width: contentWidth
          });
          doc.fontSize(9).fillColor('#334155');
        }
        doc.moveDown(0.55);
      });
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(range.start + i);
      drawPageFooter(doc, i, range.count, generatedAtStr);
    }

    doc.end();
  });
}
