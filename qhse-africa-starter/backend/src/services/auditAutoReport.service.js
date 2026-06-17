import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';
import * as emailService from './email.service.js';
import { renderHtmlToPdf } from '../lib/pdfRenderer.js';

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAuditPdfHeaderFooterTemplates(auditRef) {
  const headerTemplate = `<div style="-webkit-print-color-adjust:exact;width:100%;padding:0 14mm;display:flex;justify-content:space-between;align-items:flex-end;font-family:Helvetica,Arial,sans-serif;font-size:9px;border-bottom:1.5px solid #e2e8f0;padding-bottom:3px;box-sizing:border-box;">
    <span style="font-weight:800;color:${QHSE_GREEN};text-transform:uppercase;letter-spacing:0.06em;">QHSE Control Africa</span>
    <span style="color:#334155;font-weight:600;">Rapport d'audit · ${escapeHtml(auditRef)}</span>
  </div>`;
  const footerTemplate = `<div style="-webkit-print-color-adjust:exact;width:100%;padding:0 14mm;display:flex;justify-content:space-between;align-items:flex-start;font-family:Helvetica,Arial,sans-serif;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:3px;box-sizing:border-box;">
    <span>Document confidentiel · Usage interne</span>
    <span style="color:#64748b;font-weight:700;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;
  return { headerTemplate, footerTemplate };
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

  const listBlock = (title, rows) => `
    <div class="list-block">
      <h3>${escapeHtml(title)}</h3>
      <table class="tbl">
        <thead><tr><th style="width:32px">#</th><th>Libellé</th></tr></thead>
        <tbody>
          ${
            rows.length
              ? rows.map((line, idx) => `<tr><td>${idx + 1}.</td><td>${escapeHtml(line)}</td></tr>`).join('')
              : `<tr><td colspan="2" class="empty">—</td></tr>`
          }
        </tbody>
      </table>
    </div>`;

  const checklistSectionsHtml = !checklistItems.length
    ? `<p class="muted">Aucun point de checklist structuré pour cet audit.</p>`
    : sectionOrder
        .map((sec) => {
          const items = bySection.get(sec) || [];
          const itemsHtml = items
            .map((item) => {
              const badgeClass =
                item.statusToken === 'C'
                  ? 'badge-ok'
                  : item.statusToken === 'NC'
                    ? 'badge-nc'
                    : item.statusToken === 'P'
                      ? 'badge-partial'
                      : 'badge-na';
              const imgBuf = item.photo ? tryDecodeDataUrlImage(item.photo) : null;
              const imgHtml = imgBuf
                ? `<img class="ck-photo" src="${escapeHtml(item.photo)}" alt="" />`
                : '';
              return `
                <div class="ck-item">
                  <div class="ck-item-head">
                    <span class="ck-point">${escapeHtml(item.point)}</span>
                    <span class="badge ${badgeClass}">${escapeHtml(item.statusLabel)}</span>
                  </div>
                  ${item.comment ? `<p class="ck-comment">Observation : ${escapeHtml(item.comment)}</p>` : ''}
                  ${imgHtml}
                </div>`;
            })
            .join('');
          return `
            <div class="ck-section">
              <h3 class="ck-section-title">${escapeHtml(sec)}</h3>
              ${itemsHtml}
            </div>`;
        })
        .join('');

  const actionsTableHtml = !actionsLinked.length
    ? `<p class="muted">Aucune action liée à cet audit.</p>`
    : `<table class="tbl">
        <thead><tr><th>Description</th><th style="width:120px">Responsable</th><th style="width:90px">Échéance</th><th style="width:80px">Priorité</th></tr></thead>
        <tbody>
          ${actionsLinked
            .map((a) => {
              const owner = a.assignee?.name || a.owner || '—';
              const due = a.dueDate ? formatFrDate(a.dueDate) : '—';
              const pri = inferActionPriority(a);
              const title = String(a.title || '—');
              const detail = a.detail && String(a.detail).trim() ? String(a.detail).trim().slice(0, 200) : '';
              const priClass =
                pri === 'Critique' ? 'pri-critical' : pri === 'Haute' ? 'pri-high' : pri === 'Faible' ? 'pri-low' : 'pri-mid';
              return `<tr>
                <td>${escapeHtml(title)}${detail ? `<br/><span class="muted-inline">${escapeHtml(detail)}</span>` : ''}</td>
                <td>${escapeHtml(owner)}</td>
                <td>${escapeHtml(due)}</td>
                <td><span class="pri ${priClass}">${escapeHtml(pri)}</span></td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>`;

  const ncOverviewHtml = audit.nonConformities?.length
    ? `<div class="list-block">
        <h3>Non-conformités référencées (aperçu)</h3>
        <ul class="nc-list">
          ${audit.nonConformities
            .slice(0, 6)
            .map((nc, i) => `<li>${i + 1}. ${escapeHtml(nc.title)}${nc.status ? ` — ${escapeHtml(nc.status)}` : ''}</li>`)
            .join('')}
        </ul>
        ${audit.nonConformities.length > 6 ? `<p class="muted">… ${audit.nonConformities.length - 6} autre(s).</p>` : ''}
      </div>`
    : '';

  const scorePct = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Rapport d'audit ${escapeHtml(audit.ref)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; }
    body { margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; color: #0f172a; font-size: 10pt; }
    .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 24pt; }
    .cover h1 { font-size: 22pt; margin: 0 0 18pt; }
    .cover dl { font-size: 11pt; line-height: 1.7; margin: 0 0 18pt; }
    .cover dl b { color: #334155; }
    .score-bar-wrap { display: flex; align-items: center; gap: 12pt; margin: 8pt 0 18pt; }
    .score-bar { width: 220pt; height: 16pt; border: 1pt solid #cbd5e1; border-radius: 8pt; overflow: hidden; background: #f1f5f9; }
    .score-bar-fill { height: 100%; background: ${gaugeColor}; }
    .score-label { font-size: 13pt; font-weight: 700; }
    .cover-footer { color: #64748b; font-size: 9pt; }
    .cover-brand { color: ${QHSE_GREEN}; font-weight: 800; font-size: 11pt; margin-top: 6pt; }
    .section { padding: 4pt 0 18pt; }
    h2 { font-size: 15pt; margin: 0 0 8pt; }
    .muted { color: #64748b; font-size: 9pt; }
    .muted-inline { color: #64748b; font-size: 8pt; }
    .tbl { width: 100%; border-collapse: collapse; margin-top: 6pt; font-size: 9pt; }
    .tbl th { background: ${QHSE_GREEN}; color: #fff; text-align: left; padding: 5pt 6pt; font-size: 8pt; text-transform: uppercase; }
    .tbl td { border: 0.5pt solid #e2e8f0; padding: 5pt 6pt; vertical-align: top; }
    .tbl td.empty { color: #64748b; text-align: center; }
    .tbl tbody tr { break-inside: avoid; page-break-inside: avoid; }
    .list-block { margin-top: 10pt; }
    .nc-list { margin: 4pt 0; padding-left: 16pt; font-size: 9pt; color: #334155; }
    .ck-section { margin-top: 12pt; break-inside: avoid-page; }
    .ck-section-title { color: ${QHSE_GREEN}; font-size: 11pt; margin: 0 0 4pt; }
    .ck-item { padding: 6pt 0; border-bottom: 0.5pt solid #e2e8f0; break-inside: avoid; page-break-inside: avoid; }
    .ck-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8pt; }
    .ck-point { font-weight: 700; font-size: 10pt; }
    .badge { font-size: 8pt; font-weight: 700; padding: 2pt 6pt; border-radius: 3pt; white-space: nowrap; }
    .badge-ok { color: #166534; background: #dcfce7; }
    .badge-nc { color: #991b1b; background: #fee2e2; }
    .badge-partial { color: #854d0e; background: #fef3c7; }
    .badge-na { color: #475569; background: #f1f5f9; }
    .ck-comment { color: #334155; font-size: 9pt; margin: 4pt 0 0; }
    .ck-photo { max-width: 180pt; max-height: 130pt; margin-top: 6pt; border: 0.5pt solid #e2e8f0; }
    .pri { font-size: 8pt; font-weight: 700; padding: 2pt 5pt; border-radius: 3pt; }
    .pri-critical { color: #991b1b; background: #fee2e2; }
    .pri-high { color: #c2410c; background: #ffedd5; }
    .pri-mid { color: #0f766e; background: #ccfbf1; }
    .pri-low { color: #64748b; background: #f1f5f9; }
  </style></head><body>

  <div class="cover">
    <h1>RAPPORT D'AUDIT QHSE</h1>
    <dl>
      <div><b>Référence audit :</b> ${escapeHtml(audit.ref)}</div>
      <div><b>Site audité :</b> ${escapeHtml(audit.site)}</div>
      ${audit.siteRecord?.name ? `<div><b>Site référentiel :</b> ${escapeHtml(audit.siteRecord.name)}</div>` : ''}
      <div><b>Date de l'audit :</b> ${escapeHtml(auditDateDisplay)}</div>
      <div><b>Statut :</b> ${escapeHtml(statusCategory)}${audit.status && audit.status !== statusCategory ? ` (${escapeHtml(audit.status)})` : ''}</div>
      <div><b>Auditeur responsable :</b> ${escapeHtml(auditeurDisplay)}</div>
    </dl>
    <div class="score-bar-wrap">
      <div class="score-bar"><div class="score-bar-fill" style="width:${scorePct}%"></div></div>
      <span class="score-label">${Number.isFinite(score) ? Math.round(score) : '—'} / 100</span>
    </div>
    <p class="cover-footer">Document généré le ${escapeHtml(formatFrDateTime(new Date()))} — usage confidentiel.</p>
    <p class="cover-brand">QHSE Control Africa</p>
  </div>

  <div class="section">
    <h2>Résumé exécutif</h2>
    <p>Score global : ${Number.isFinite(score) ? `${Math.round(score)} / 100` : '—'} — Lecture : ${escapeHtml(interp.label)}</p>
    <p class="muted">${escapeHtml(interp.detail)}</p>
    <h3>Synthèse chiffrée</h3>
    <p class="muted">Points checklist : ${checklistItems.length} — ✓ ${conformCount} conforme(s) · ✗ ${ncCount} non conforme(s) · ⚠ ${partialCount} partiel(s) · N/A ${naCount}</p>
    <p class="muted">Non-conformités (fiches) : ${ncFiches} — Points checklist NC / partiel : ${checklistNcPoints}</p>
    <p class="muted">Actions correctives recensées : ${actionsLinked.length} (dont ${openActions.length} à traiter au sens statut). Réf. audit citée : « ${escapeHtml(refToken)} ».</p>
    ${listBlock('Points forts (extraits checklist — conformes)', strengths)}
    ${listBlock('Points faibles / écarts (extraits checklist)', weaknesses)}
    ${ncOverviewHtml}
  </div>

  <div class="section">
    <h2>Détail de la checklist</h2>
    <p class="muted">Groupé par section / thème. Statuts : ✓ Conforme · ✗ Non conforme · ⚠ Partiel · N/A. Les photos encodées en base64 dans la checklist sont reproduites ci-dessous lorsque possible.</p>
    ${checklistSectionsHtml}
  </div>

  <div class="section">
    <h2>Plan d'actions</h2>
    <p class="muted">Actions liées (relation audit ou mention de la référence dans le titre / le détail). Priorité déduite des libellés lorsque non structurée.</p>
    ${actionsTableHtml}
  </div>

  </body></html>`;

  const { headerTemplate, footerTemplate } = buildAuditPdfHeaderFooterTemplates(audit.ref);
  return renderHtmlToPdf(html, { headerTemplate, footerTemplate });
}
