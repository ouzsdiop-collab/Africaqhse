import PDFDocument from 'pdfkit';
import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';
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
async function collectAutomaticRecipientEmails(tenantId) {
  const tf = prismaTenantFilter(tenantId);
  const t = tf.tenantId;
  if (!t) return [];
  const members = await prisma.tenantMember.findMany({
    where: {
      tenantId: t,
      role: { in: Array.from(RECIPIENT_ROLES) }
    },
    include: { user: { select: { email: true } } }
  });
  const out = [];
  const seen = new Set();
  for (const m of members) {
    const e = String(m?.user?.email ?? '').trim().toLowerCase();
    if (!e || !EMAIL_RE.test(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(String(m.user.email).trim());
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

  const recipients = await collectAutomaticRecipientEmails(current.tenantId);
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
    const pdfBuffer = await generateAuditPdfReport(current.id, current.tenantId);
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

const QHSE_GREEN = '#1D9E75';

/**
 * @param {unknown} raw
 * @returns {{ items: object[], meta: { auditeur: string, auditDate: string } }}
 */
function extractChecklistPayload(raw) {
  const meta = { auditeur: '', auditDate: '' };
  if (!raw) return { items: [], meta };
  if (Array.isArray(raw)) return { items: raw, meta };
  if (typeof raw === 'object' && raw !== null) {
    const o = /** @type {Record<string, unknown>} */ (raw);
    if (typeof o.auditeur === 'string') meta.auditeur = o.auditeur.trim();
    if (!meta.auditeur && typeof o.auditeurName === 'string') meta.auditeur = o.auditeurName.trim();
    if (typeof o.auditDate === 'string') meta.auditDate = o.auditDate.trim();
    else if (typeof o.date === 'string') meta.auditDate = o.date.trim();
    if (Array.isArray(o.items)) return { items: o.items, meta };
  }
  return { items: [], meta };
}

/**
 * @param {object[]} items
 * @returns {Array<{
 *   point: string;
 *   section: string;
 *   statusToken: 'C' | 'NC' | 'P' | 'NA';
 *   statusLabel: string;
 *   comment: string;
 *   photo: string;
 * }>}
 */
function normalizeChecklistForPdf(items) {
  const out = [];
  for (const x of items) {
    if (!x || typeof x !== 'object') continue;
    const point = typeof x.point === 'string' ? x.point.trim() : '';
    if (!point) continue;
    const sectionRaw =
      typeof x.section === 'string'
        ? x.section.trim()
        : typeof x.theme === 'string'
          ? x.theme.trim()
          : typeof x.rubrique === 'string'
            ? x.rubrique.trim()
            : '';
    const section = sectionRaw || 'Checklist';
    let statusToken = 'NC';
    let statusLabel = '✗ Non conforme';
    if (x.na === true || String(x.status || '').toLowerCase() === 'na') {
      statusToken = 'NA';
      statusLabel = 'N/A';
    } else if (x.partial === true || String(x.status || '').toLowerCase() === 'partial') {
      statusToken = 'P';
      statusLabel = '⚠ Partiel';
    } else if (x.conforme === true) {
      statusToken = 'C';
      statusLabel = '✓ Conforme';
    }
    const parts = [];
    if (typeof x.comment === 'string' && x.comment.trim()) parts.push(x.comment.trim());
    if (typeof x.observation === 'string' && x.observation.trim()) parts.push(x.observation.trim());
    if (typeof x.proofRef === 'string' && x.proofRef.trim()) parts.push(`Preuve : ${x.proofRef.trim()}`);
    const comment = parts.join(' — ');
    const photo =
      typeof x.photo === 'string'
        ? x.photo.trim()
        : typeof x.photoUrl === 'string'
          ? x.photoUrl.trim()
          : typeof x.image === 'string'
            ? x.image.trim()
            : '';
    out.push({ point, section, statusToken, statusLabel, comment, photo });
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

function scoreInterpretation(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) {
    return { label: '—', detail: 'Score non disponible.' };
  }
  if (n >= 85) return { label: 'Excellent', detail: 'Niveau de maîtrise élevé — maintenir et capitaliser.' };
  if (n >= 70) return { label: 'Bon', detail: 'Conformité satisfaisante — quelques axes d’amélioration ciblés.' };
  if (n >= 50)
    return { label: 'À améliorer', detail: 'Écarts significatifs — plan d’action et suivi renforcés recommandés.' };
  return { label: 'Critique', detail: 'Situation à traiter en priorité — risques élevés pour la conformité.' };
}

/** @param {string | undefined} status */
function formatAuditStatusCategory(status) {
  const tokens = tokenizeStatus(status);
  if (tokens.some((t) => BLOCK_TOKENS.has(t))) return String(status ?? '—').trim() || '—';
  if (tokens.some((t) => FINAL_TOKENS.has(t))) return 'Terminé';
  if (tokens.some((t) => /planif|prevu|program/.test(t))) return 'Planifié';
  if (tokens.some((t) => /cours|encours|progress|ouvert/.test(t))) return 'En cours';
  const s = String(status ?? '').trim();
  return s || '—';
}

/**
 * @param {{ title?: string; detail?: string | null; status?: string }} action
 * @returns {string}
 */
function inferActionPriority(action) {
  const blob = `${String(action.title ?? '')} ${String(action.detail ?? '')} ${String(action.status ?? '')}`.toLowerCase();
  if (/\bp0\b|critique|critical|urgent|imm[eé]diat/.test(blob)) return 'Critique';
  if (/\bp1\b|haute|high|priorit[eé]\s*haute/.test(blob)) return 'Haute';
  if (/\bp3\b|basse|low|faible/.test(blob)) return 'Faible';
  if (/\bp2\b|moyenne|medium|normale/.test(blob)) return 'Moyenne';
  return 'Moyenne';
}

function tryDecodeDataUrlImage(dataUrl) {
  const m = /^data:image\/(\w+);base64,([\s\S]+)$/i.exec(String(dataUrl));
  if (!m) return null;
  try {
    return Buffer.from(m[2].replace(/\s/g, ''), 'base64');
  } catch {
    return null;
  }
}

function isActionOpenStatus(status) {
  const s = String(status ?? '').toLowerCase();
  if (!s.trim()) return true;
  return !/\b(termin|clos|cl[oô]tur|ferm|done|compl[eè]t|r[eé]alis)\w*/i.test(s);
}

function drawPageHeader(doc, auditRef) {
  const w = doc.page.width;
  doc.save();
  doc.rect(0, 0, w, 42).fill(QHSE_GREEN);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('RAPPORT D’AUDIT QHSE', 48, 14, { continued: true });
  doc.font('Helvetica').fontSize(8);
  doc.text(`  ·  ${String(auditRef)}`, { continued: false });
  doc.restore();
  doc.fillColor('#000000');
}

function drawPageFooter(doc, pageIndex, totalPages) {
  const y = doc.page.height - 36;
  doc.save();
  doc.fontSize(8).fillColor('#475569').font('Helvetica');
  doc.text(
    `QHSE Control Africa — Confidentiel — Page ${pageIndex + 1} / ${totalPages}`,
    48,
    y,
    { width: doc.page.width - 96, align: 'center' }
  );
  doc.restore();
  doc.fillColor('#000000');
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

  const { items: rawItems, meta: checklistMeta } = extractChecklistPayload(audit.checklist);
  const checklistItems = normalizeChecklistForPdf(rawItems);
  const conformCount = checklistItems.filter((i) => i.statusToken === 'C').length;
  const ncCount = checklistItems.filter((i) => i.statusToken === 'NC').length;
  const partialCount = checklistItems.filter((i) => i.statusToken === 'P').length;
  const naCount = checklistItems.filter((i) => i.statusToken === 'NA').length;
  const openActions = actionsLinked.filter((a) => isActionOpenStatus(a.status));

  const auditeurDisplay =
    checklistMeta.auditeur ||
    (typeof audit.checklist === 'object' &&
    audit.checklist !== null &&
    !Array.isArray(audit.checklist) &&
    typeof /** @type {Record<string, unknown>} */ (audit.checklist).auditeur === 'string'
      ? String(/** @type {Record<string, unknown>} */ (audit.checklist).auditeur).trim()
      : '') ||
    '—';
  const auditDateDisplay =
    checklistMeta.auditDate && checklistMeta.auditDate.length > 0
      ? checklistMeta.auditDate
      : formatFrDate(audit.createdAt);
  const score = Number(audit.score);
  const gaugeColor = scoreGaugeColor(score);
  const interp = scoreInterpretation(score);
  const statusCategory = formatAuditStatusCategory(audit.status);
  const strengths = checklistItems.filter((i) => i.statusToken === 'C').map((i) => i.point).slice(0, 5);
  const weaknesses = checklistItems
    .filter((i) => i.statusToken === 'NC' || i.statusToken === 'P')
    .map((i) => i.point)
    .slice(0, 5);
  const ncFiches = audit.nonConformities?.length ?? 0;
  const checklistNcPoints = ncCount + partialCount;

  /** @type {Map<string, typeof checklistItems>} */
  const bySection = new Map();
  for (const it of checklistItems) {
    if (!bySection.has(it.section)) bySection.set(it.section, []);
    bySection.get(it.section).push(it);
  }
  const sectionOrder = [...bySection.keys()].sort((a, b) => a.localeCompare(b, 'fr'));

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      margin: { top: 56, bottom: 56, left: 48, right: 48 },
      size: 'A4',
      info: {
        Title: `Rapport d'audit ${audit.ref}`,
        Author: 'QHSE Control Africa'
      },
      bufferPages: true
    });

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentWidth = doc.page.width - 96;
    const innerTop = 56;

    const drawListTable = (title, rows) => {
      doc.moveDown(0.35);
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text(title);
      const x0 = 48;
      let y = doc.y + 4;
      const w = contentWidth;
      doc.rect(x0, y, w, 16).fill(QHSE_GREEN);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text('  #', x0 + 4, y + 4, { width: 20 });
      doc.text('  Libellé', x0 + 24, y + 4, { width: w - 28 });
      y += 16;
      if (!rows.length) {
        doc.rect(x0, y, w, 22).stroke('#e2e8f0');
        doc.fillColor('#64748b').font('Helvetica').fontSize(9).text('  —', x0 + 4, y + 6, { width: w - 8 });
        y += 22;
      } else {
        rows.forEach((line, idx) => {
          const rowH = 26;
          doc.rect(x0, y, w, rowH).stroke('#e2e8f0');
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8).text(`  ${idx + 1}.`, x0 + 4, y + 8, { width: 18 });
          doc.font('Helvetica').fontSize(9).text(line, x0 + 24, y + 6, { width: w - 32 });
          y += rowH;
        });
      }
      doc.y = y + 6;
    };

    // —— PAGE 1 — Couverture ——
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(24);
    doc.text('RAPPORT D’AUDIT QHSE', 48, innerTop, { width: contentWidth, align: 'center' });
    doc.moveDown(1.1);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Référence audit : ${audit.ref}`);
    doc.text(`Site audité : ${audit.site}`);
    if (audit.siteRecord?.name) {
      doc.text(`Site référentiel : ${audit.siteRecord.name}`);
    }
    doc.text(`Date de l’audit : ${auditDateDisplay}`);
    doc.text(`Statut : ${statusCategory}${audit.status && audit.status !== statusCategory ? ` (${audit.status})` : ''}`);
    doc.text(`Auditeur responsable : ${auditeurDisplay}`);
    doc.moveDown(0.7);
    doc.font('Helvetica-Bold').fontSize(11).text('Score de conformité');
    const barX = 48;
    const barY = doc.y + 4;
    const barW = Math.min(280, contentWidth - 88);
    const barH = 20;
    doc.roundedRect(barX, barY, barW, barH, 4).stroke('#cbd5e1');
    const fillW = Math.max(0, Math.min(barW, (Math.min(100, Math.max(0, score)) / 100) * barW));
    if (fillW > 0) {
      doc.roundedRect(barX + 1, barY + 1, fillW - 2, barH - 2, 3).fill(gaugeColor);
    }
    doc.fillColor('#000000').fontSize(13).font('Helvetica-Bold');
    doc.text(
      `${Number.isFinite(score) ? `${Math.round(score)}` : '—'} / 100`,
      barX + barW + 12,
      barY + 3,
      { lineBreak: false }
    );
    doc.font('Helvetica').fontSize(9).fillColor('#64748b');
    doc.text(
      `Document généré le ${formatFrDateTime(new Date())} — usage confidentiel.`,
      48,
      doc.page.height - 118,
      { width: contentWidth, align: 'center' }
    );
    doc.fillColor(QHSE_GREEN).font('Helvetica-Bold').fontSize(11);
    doc.text('QHSE Control Africa', 48, doc.page.height - 90, { width: contentWidth, align: 'center' });
    doc.fillColor('#000000');

    // —— PAGE 2 — Résumé exécutif ——
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).text('Résumé exécutif');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica');
    doc.text(
      `Score global : ${Number.isFinite(score) ? `${Math.round(score)} / 100` : '—'} — Lecture : ${interp.label}`,
      { width: contentWidth }
    );
    doc.fontSize(10).fillColor('#334155');
    doc.text(interp.detail, { width: contentWidth });
    doc.fillColor('#000000');
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(11).text('Synthèse chiffrée');
    doc.font('Helvetica').fontSize(10).fillColor('#334155');
    doc.text(
      `Points checklist : ${checklistItems.length} — ✓ ${conformCount} conforme(s) · ✗ ${ncCount} non conforme(s) · ⚠ ${partialCount} partiel(s) · N/A ${naCount}`
    );
    doc.text(`Non-conformités (fiches) : ${ncFiches} — Points checklist NC / partiel : ${checklistNcPoints}`);
    doc.text(
      `Actions correctives recensées : ${actionsLinked.length} (dont ${openActions.length} à traiter au sens statut). Réf. audit citée : « ${refToken} ».`
    );
    doc.fillColor('#000000');
    drawListTable('Points forts (extraits checklist — conformes)', strengths);
    drawListTable('Points faibles / écarts (extraits checklist)', weaknesses);

    if (audit.nonConformities?.length) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11).text('Non-conformités référencées (aperçu)');
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      audit.nonConformities.slice(0, 6).forEach((nc, i) => {
        doc.text(`${i + 1}. ${nc.title}${nc.status ? ` — ${nc.status}` : ''}`, { width: contentWidth });
      });
      if (audit.nonConformities.length > 6) {
        doc.fillColor('#64748b').text(`… ${audit.nonConformities.length - 6} autre(s).`);
      }
      doc.fillColor('#000000');
    }

    // —— Détail checklist par section ——
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).text('Détail de la checklist');
    doc.moveDown(0.35);
    doc.font('Helvetica').fontSize(9).fillColor('#64748b');
    doc.text(
      'Groupé par section / thème. Statuts : ✓ Conforme · ✗ Non conforme · ⚠ Partiel · N/A. Les photos encodées en base64 dans la checklist sont reproduites ci-dessous lorsque possible.',
      { width: contentWidth }
    );
    doc.fillColor('#000000');
    doc.moveDown(0.4);

    let globalIdx = 0;
    if (!checklistItems.length) {
      doc.fontSize(10).fillColor('#64748b').text('Aucun point de checklist structuré pour cet audit.');
    } else {
      for (const sec of sectionOrder) {
        const items = bySection.get(sec) || [];
        if (doc.y > doc.page.height - 72) doc.addPage();
        doc.fillColor(QHSE_GREEN).font('Helvetica-Bold').fontSize(11).text(sec, { width: contentWidth });
        doc.fillColor('#000000');
        doc.moveDown(0.2);
        for (const item of items) {
          globalIdx += 1;
          if (doc.y > doc.page.height - 120) doc.addPage();
          doc.font('Helvetica-Bold').fontSize(10).text(`${globalIdx}. ${item.point}`, { width: contentWidth });
          const badgeFg =
            item.statusToken === 'C'
              ? '#166534'
              : item.statusToken === 'NC'
                ? '#991b1b'
                : item.statusToken === 'P'
                  ? '#854d0e'
                  : '#475569';
          doc.font('Helvetica-Bold').fontSize(8).fillColor(badgeFg).text(`   ${item.statusLabel}`, {
            width: contentWidth,
            indent: 6
          });
          doc.fillColor('#000000');
          if (item.comment) {
            doc.font('Helvetica').fontSize(9).fillColor('#334155');
            doc.text(`Observation : ${item.comment}`, { width: contentWidth, indent: 10 });
            doc.fillColor('#000000');
          }
          const imgBuf = item.photo ? tryDecodeDataUrlImage(item.photo) : null;
          if (imgBuf) {
            try {
              const iy = doc.y + 4;
              doc.image(imgBuf, 56, iy, { fit: [140, 100] });
              doc.y = iy + 104;
            } catch {
              doc.fontSize(8).fillColor('#94a3b8').text('(Photo non affichable)', { indent: 10 });
            }
          }
          doc.moveDown(0.25);
          doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(48, doc.y).lineTo(48 + contentWidth, doc.y).stroke();
          doc.moveDown(0.3);
        }
      }
    }

    // —— Plan d’actions ——
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).text('Plan d’actions');
    doc.moveDown(0.35);
    doc.font('Helvetica').fontSize(9).fillColor('#64748b');
    doc.text(
      'Actions liées (relation audit ou mention de la référence dans le titre / le détail). Priorité déduite des libellés lorsque non structurée.',
      { width: contentWidth }
    );
    doc.fillColor('#000000');
    doc.moveDown(0.45);

    if (!actionsLinked.length) {
      doc.fontSize(10).fillColor('#64748b').text('Aucune action liée à cet audit.');
    } else {
      const colDesc = contentWidth * 0.42;
      const colOwn = contentWidth * 0.22;
      const colDue = contentWidth * 0.18;
      const colPri = contentWidth * 0.14;
      let ty = doc.y;
      const rowHeader = () => {
        doc.rect(48, ty, contentWidth, 18).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8);
        doc.text('Description', 52, ty + 5, { width: colDesc - 8 });
        doc.text('Responsable', 48 + colDesc, ty + 5, { width: colOwn - 4 });
        doc.text('Échéance', 48 + colDesc + colOwn, ty + 5, { width: colDue - 4 });
        doc.text('Priorité', 48 + colDesc + colOwn + colDue, ty + 5, { width: colPri - 4 });
        ty += 18;
      };
      rowHeader();
      for (const a of actionsLinked) {
        const owner = a.assignee?.name || a.owner || '—';
        const due = a.dueDate ? formatFrDate(a.dueDate) : '—';
        const pri = inferActionPriority(a);
        const title = String(a.title || '—');
        const detail = a.detail && String(a.detail).trim() ? String(a.detail).trim().slice(0, 200) : '';
        const descBlock = detail ? `${title}\n${detail}` : title;
        const priColor =
          pri === 'Critique' ? '#991b1b' : pri === 'Haute' ? '#c2410c' : pri === 'Faible' ? '#64748b' : '#0f766e';
        const estLines = Math.max(
          2,
          Math.ceil(descBlock.length / 52) + (descBlock.includes('\n') ? 1 : 0)
        );
        const rowH = Math.min(120, 14 + estLines * 10);
        if (ty + rowH > doc.page.height - 56) {
          doc.addPage();
          ty = doc.y;
          rowHeader();
        }
        const y0 = ty;
        doc.rect(48, y0, contentWidth, rowH).stroke('#e2e8f0');
        doc.fillColor('#000000').font('Helvetica').fontSize(8);
        doc.text(descBlock, 52, y0 + 4, { width: colDesc - 8, lineGap: 1 });
        doc.text(owner, 48 + colDesc, y0 + 4, { width: colOwn - 4, lineGap: 1 });
        doc.text(due, 48 + colDesc + colOwn, y0 + 4, { width: colDue - 4, lineGap: 1 });
        doc.fillColor(priColor).font('Helvetica-Bold');
        doc.text(pri, 48 + colDesc + colOwn + colDue, y0 + 4, { width: colPri - 4 });
        doc.fillColor('#000000');
        ty = y0 + rowH;
        doc.y = ty;
      }
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(range.start + i);
      drawPageHeader(doc, audit.ref);
      drawPageFooter(doc, i, range.count);
    }

    doc.end();
  });
}
