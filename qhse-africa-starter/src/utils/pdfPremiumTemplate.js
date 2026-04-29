/**
 * Gabarit PDF premium commun : fond clair, lisibilité impression, structure type livrable QHSE.
 * Les fragments HTML (summary, sections, actions, etc.) doivent être échappés côté appelant
 * lorsqu'ils contiennent des données utilisateur.
 */

import { escapeHtml } from './escapeHtml.js';
import { formatQhsePdfGenerationDate, QHSE_PDF_BRAND } from './qhsePdfChrome.js';

export { QHSE_PDF_BRAND as PREMIUM_PDF_BRAND };

/** Pied de page standard livrables (cohérent tous exports premium). */
export const QHSE_PDF_FOOTER_TAGLINE = 'QHSE Control Africa · Document confidentiel · Usage interne';

/**
 * Supprime tirets typographiques et espaces insécables problématiques pour l'impression PDF.
 * @param {unknown} s
 */
export function normalizePdfTypography(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('\u2014', '-')
    .replaceAll('\u2013', '-')
    .replaceAll('\u00a0', ' ');
}

/**
 * Texte PDF : normalisation typographique puis échappement HTML.
 * @param {unknown} s
 */
export function escapePdfText(s) {
  return escapeHtml(normalizePdfTypography(s));
}

/** Couleurs secondaires sobres (bleu / cyan) en complément du vert marque */
const PREMIUM_ACCENT = '#0e7490';
const PREMIUM_ACCENT_SOFT = '#e0f2fe';

/** @param {number | null | undefined} pct */
function clampPct(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Styles globaux (thème clair, impression, évitement de coupure).
 */
export function premiumPdfStyles() {
  const brand = QHSE_PDF_BRAND;
  return `<style>
    .qhse-premium-doc,
    .qhse-premium-doc *,
    .qhse-premium-doc *::before,
    .qhse-premium-doc *::after { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .qhse-premium-doc {
      font-family: inherit;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      width: 100%;
      max-width: 100%;
      overflow: visible;
    }
    .qhse-premium-body {
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-premium-page-shell { page-break-after: always; padding-bottom: 18px; }
    .qhse-premium-page-shell:last-child { page-break-after: auto; }
    .qhse-premium-topbar {
      height: 4px;
      background: linear-gradient(90deg, ${brand} 0%, ${PREMIUM_ACCENT} 55%, #2dd4bf 100%);
      margin: 0 0 14px 0;
      border-radius: 2px;
    }
    .qhse-premium-head {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qhse-premium-head--compact { padding: 10px 14px; margin-bottom: 12px; }
    .qhse-premium-head-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .qhse-premium-logo-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .qhse-premium-logo-img { max-height: 40px; max-width: 140px; object-fit: contain; }
    .qhse-premium-logo {
      font-weight: 800;
      font-size: 10pt;
      letter-spacing: 0.04em;
      color: ${brand};
      text-transform: uppercase;
    }
    .qhse-premium-client { font-size: 9.5pt; color: #475569; margin-top: 4px; }
    .qhse-premium-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: 0.01em;
      line-height: 1.25;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-premium-sub { font-size: 9pt; color: #64748b; margin: 0 0 8px 0; }
    .qhse-premium-date { font-size: 9pt; color: #64748b; text-align: right; }
    .qhse-premium-h2 {
      font-size: 11.5pt;
      font-weight: 800;
      color: #0f172a;
      margin: 18px 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid ${brand};
      page-break-after: avoid;
      break-after: avoid;
    }
    .qhse-premium-h3 { font-size: 10pt; font-weight: 700; color: ${PREMIUM_ACCENT}; margin: 12px 0 6px 0; }
    .qhse-premium-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin: 10px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qhse-premium-muted { color: #64748b; font-size: 9.5pt; }
    .qhse-premium-disclaimer {
      font-size: 9pt;
      color: #475569;
      background: ${PREMIUM_ACCENT_SOFT};
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 8px 10px;
      margin: 0 0 10px 0;
      page-break-inside: avoid;
    }
    .qhse-premium-ul { margin: 8px 0 0; padding-left: 1.15rem; }
    .qhse-premium-ul li { margin-bottom: 6px; }
    .qhse-premium-compliance {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 20px;
      margin: 12px 0 16px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qhse-premium-compliance-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 92px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 2px solid ${brand};
      border-radius: 8px;
    }
    .qhse-premium-compliance-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
    .qhse-premium-compliance-pct { font-size: 19pt; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .qhse-premium-gauge-track {
      flex: 1;
      min-width: 160px;
      max-width: 340px;
      height: 12px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }
    .qhse-premium-gauge-fill { height: 100%; background: linear-gradient(90deg, ${brand}, #14b8a6); border-radius: 5px; }
    .qhse-premium-table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 8px;
      table-layout: fixed;
      word-wrap: break-word;
    }
    .qhse-premium-table th {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      padding: 8px 6px;
      text-align: left;
      font-weight: 700;
    }
    .qhse-premium-table td { border: 1px solid #e2e8f0; padding: 8px 6px; vertical-align: top; color: #1e293b; }
    .qhse-premium-td-n { width: 32px; text-align: center; font-weight: 700; background: #f8fafc; color: #64748b; }
    .qhse-premium-badge {
      font-size: 7.5pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      white-space: normal;
      max-width: 100%;
      word-break: break-word;
      display: inline-block;
    }
    .qhse-premium-foot {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5pt;
      color: #64748b;
      text-align: center;
    }
    .qhse-premium-brand-foot { color: ${brand}; font-weight: 700; font-size: 9pt; text-align: center; margin-top: 8px; }
    .qhse-premium-kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
    .qhse-premium-kpi {
      flex: 1;
      min-width: 100px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      background: #fafbfc;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qhse-premium-kpi-val { font-size: 14pt; font-weight: 800; color: #0f172a; }
    .qhse-premium-kpi-lbl { font-size: 7.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
    .qhse-premium-check-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qhse-premium-check-head { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
    .qhse-premium-check-no { font-weight: 800; color: ${brand}; min-width: 22px; }
    .qhse-premium-check-title {
      flex: 1;
      font-weight: 700;
      color: #0f172a;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-premium-preuve, .qhse-premium-obs { margin: 4px 0; font-size: 9pt; color: #334155; }
    .qhse-premium-photo img { max-width: 160px; max-height: 120px; border-radius: 4px; border: 1px solid #e2e8f0; margin-top: 6px; }
    .qhse-premium-matrix-table td, .qhse-premium-matrix-table th { text-align: center; padding: 4px; font-size: 7.5pt; }
    .qhse-premium-cover-wrap .qhse-premium-cover {
      min-height: 280px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 32px 24px;
      page-break-inside: avoid;
    }
    .qhse-premium-cover-product { font-size: 9pt; font-weight: 700; color: ${brand}; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
    .qhse-premium-cover-logo { margin-bottom: 12px; }
    .qhse-premium-cover-logo img { max-height: 56px; max-width: 200px; object-fit: contain; }
    .qhse-premium-cover-title {
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 12px 0;
      line-height: 1.2;
      max-width: 100%;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-premium-cover-sub {
      font-size: 10.5pt;
      color: #475569;
      margin: 0 0 20px 0;
      max-width: 520px;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-premium-cover-meta { font-size: 10pt; color: #334155; text-align: left; width: 100%; max-width: 400px; margin: 0 auto; }
    .qhse-premium-cover-meta p { margin: 6px 0; }
    .qhse-premium-cover-confid { font-size: 9pt; color: #94a3b8; margin-top: 28px; }
    .qhse-premium-cover-page { font-size: 8.5pt; color: #94a3b8; margin-top: 8px; }
    @media print {
      .qhse-premium-page-shell { page-break-after: always; }
      .qhse-premium-page-shell:last-child { page-break-after: auto; }
      .qhse-premium-card,
      .qhse-premium-check-item,
      .qhse-premium-kpi,
      .qhse-premium-head,
      .qhse-premium-compliance { break-inside: avoid; page-break-inside: avoid; }
      .qhse-premium-table thead { display: table-header-group; }
      .qhse-premium-table tr { break-inside: auto; page-break-inside: auto; }
      .qhse-premium-table td, .qhse-premium-table th { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>`;
}

/**
 * @param {{
 *   documentTitle: string;
 *   subtitle?: string;
 *   organizationName?: string;
 *   siteLabel?: string;
 *   editionDate: string;
 *   logoUrl?: string;
 *   pageIndex: number;
 *   totalPages: number;
 * }} p
 */
export function premiumPdfCoverSection(p) {
  const logo =
    p.logoUrl && String(p.logoUrl).trim()
      ? `<div class="qhse-premium-cover-logo"><img src="${escapeHtml(p.logoUrl)}" alt="" /></div>`
      : '';
  const org = p.organizationName
    ? `<p><strong>Organisation :</strong> ${escapePdfText(p.organizationName)}</p>`
    : '';
  const site = p.siteLabel ? `<p><strong>Site / périmètre :</strong> ${escapePdfText(p.siteLabel)}</p>` : '';
  const sub = p.subtitle ? `<p class="qhse-premium-cover-sub">${escapePdfText(p.subtitle)}</p>` : '';
  return `<section class="qhse-premium-page-shell qhse-premium-cover-wrap">
    <div class="qhse-premium-topbar"></div>
    <div class="qhse-premium-cover">
      ${logo}
      <div class="qhse-premium-cover-product">QHSE Control Africa</div>
      <h1 class="qhse-premium-cover-title">${escapePdfText(p.documentTitle)}</h1>
      ${sub}
      <div class="qhse-premium-cover-meta">
        ${org}
        ${site}
        <p><strong>Date d'édition :</strong> ${escapePdfText(p.editionDate)}</p>
      </div>
      <p class="qhse-premium-cover-confid">Document confidentiel - usage interne</p>
      <p class="qhse-premium-cover-page">Section couverture (${escapePdfText(String(p.pageIndex))} / ${escapePdfText(String(p.totalPages))})</p>
    </div>
    <footer class="qhse-premium-foot">${QHSE_PDF_FOOTER_TAGLINE}</footer>
  </section>`;
}

export function buildPremiumComplianceBlock(compliancePct) {
  const pct = clampPct(compliancePct);
  if (pct == null) {
    return `<div class="qhse-premium-compliance">
      <div class="qhse-premium-compliance-badge">
        <span class="qhse-premium-compliance-label">Niveau de conformité</span>
        <span class="qhse-premium-compliance-pct">N/A</span>
      </div>
      <p class="qhse-premium-muted" style="margin:0;flex:1">Indicateur non calculé pour cet export.</p>
    </div>`;
  }
  return `<div class="qhse-premium-compliance">
    <div class="qhse-premium-compliance-badge">
      <span class="qhse-premium-compliance-label">Niveau de conformité</span>
      <span class="qhse-premium-compliance-pct">${escapeHtml(String(pct))}%</span>
    </div>
    <div style="flex:1;min-width:200px">
      <div class="qhse-premium-muted" style="margin-bottom:6px;font-size:8.5pt">Lecture consolidée des indicateurs exportés (pilotage interne)</div>
      <div class="qhse-premium-gauge-track"><div class="qhse-premium-gauge-fill" style="width:${pct}%"></div></div>
    </div>
  </div>`;
}

/**
 * @param {null | undefined | { summary?: string; strengths?: string[]; weaknesses?: string[]; priorityActions?: string[]; confidence?: number }} narrative
 * @param {string} [narrativeSource] 'ai' | 'fallback' | ''
 */
export function buildPremiumNarrativeBlock(narrative, narrativeSource = '') {
  const hasSummary = narrative && String(narrative.summary || '').trim();
  if (!hasSummary) {
    return `<h2 class="qhse-premium-h2">Analyse globale</h2>
      <div class="qhse-premium-card">
        <p class="qhse-premium-muted" style="margin:0">Aucune analyse rédigée n'est disponible pour cet export. Se reporter au résumé exécutif et au détail des constats.</p>
      </div>`;
  }
  const aiNote =
    narrativeSource === 'ai'
      ? `<p class="qhse-premium-disclaimer">Éléments d'analyse issus du traitement des données du rapport. Revue et validation par le responsable QHSE recommandées.</p>`
      : narrativeSource === 'fallback'
        ? `<p class="qhse-premium-disclaimer">Synthèse construite à partir des indicateurs agrégés du rapport. Revue et validation par le responsable QHSE recommandées.</p>`
        : '';
  const conf =
    typeof narrative.confidence === 'number' && Number.isFinite(narrative.confidence)
      ? `<p class="qhse-premium-muted" style="margin:0 0 8px">Complétude indicative des données sources : ${Math.round(narrative.confidence * 100)} % (non interprétable comme score statistique).</p>`
      : '';
  const list = (label, items) => {
    const rows = Array.isArray(items) ? items.filter(Boolean).slice(0, 12) : [];
    if (!rows.length) return '';
    return `<p class="qhse-premium-muted" style="margin:10px 0 4px"><strong>${escapePdfText(label)}</strong></p>
      <ul class="qhse-premium-ul">${rows.map((t) => `<li>${escapePdfText(t)}</li>`).join('')}</ul>`;
  };
  return `<h2 class="qhse-premium-h2">Analyse globale</h2>
    <div class="qhse-premium-card">
      ${aiNote}
      ${conf}
      <p style="margin:0;color:#1e293b">${escapePdfText(String(narrative.summary).trim())}</p>
      ${list('Points forts', narrative.strengths)}
      ${list('Points de vigilance', narrative.weaknesses)}
      ${list('Actions prioritaires', narrative.priorityActions)}
    </div>`;
}

/**
 * @param {{
 *   reportTitle: string;
 *   company?: string;
 *   organizationName?: string;
 *   reportDate?: string;
 *   pageIndex: number;
 *   totalPages: number;
 *   bodyHtml: string;
 *   subtitle?: string;
 *   logoUrl?: string;
 * }} p
 */
export function premiumPdfPageShell(p) {
  const company = p.company != null ? String(p.company) : '';
  const org = p.organizationName != null ? String(p.organizationName) : '';
  const dateStr = p.reportDate != null ? String(p.reportDate) : formatQhsePdfGenerationDate();
  const sub = p.subtitle ? `<p class="qhse-premium-sub">${escapePdfText(p.subtitle)}</p>` : '';
  const logo =
    p.logoUrl && String(p.logoUrl).trim()
      ? `<img class="qhse-premium-logo-img" src="${escapeHtml(p.logoUrl)}" alt="" />`
      : '';
  return `<section class="qhse-premium-page-shell">
    <div class="qhse-premium-topbar"></div>
    <header class="qhse-premium-head">
      <div class="qhse-premium-head-row">
        <div style="flex:1;min-width:200px">
          <div class="qhse-premium-logo-row">
            ${logo}
            <span class="qhse-premium-logo">QHSE Control Africa</span>
          </div>
          ${org ? `<div class="qhse-premium-client"><strong>Organisation :</strong> ${escapePdfText(org)}</div>` : ''}
          ${company ? `<div class="qhse-premium-client"><strong>Site / périmètre :</strong> ${escapePdfText(company)}</div>` : ''}
          <h1 class="qhse-premium-title" style="margin-top:10px">${escapePdfText(p.reportTitle)}</h1>
          ${sub}
        </div>
        <div class="qhse-premium-date">
          <div>${escapePdfText(dateStr)}</div>
          <div class="qhse-premium-muted" style="margin-top:6px">Section ${escapePdfText(String(p.pageIndex))} / ${escapePdfText(String(p.totalPages))}</div>
        </div>
      </div>
    </header>
    <div class="qhse-premium-body">${p.bodyHtml}</div>
    <footer class="qhse-premium-foot">${QHSE_PDF_FOOTER_TAGLINE} · Édition ${escapePdfText(dateStr)}</footer>
    <div class="qhse-premium-brand-foot">QHSE Control Africa</div>
  </section>`;
}

/**
 * @param {string} reportTitle
 * @param {string[]} pageBodies
 * @param {{
 *   company?: string;
 *   organizationName?: string;
 *   siteLabel?: string;
 *   reportDate?: string;
 *   subtitle?: string;
 *   logoUrl?: string;
 *   includeCover?: boolean;
 *   coverTitle?: string;
 *   coverSubtitle?: string;
 * }} [meta]
 */
export function assemblePremiumPdfDocument(reportTitle, pageBodies, meta = {}) {
  const includeCover = meta.includeCover !== false;
  const dateStr = meta.reportDate != null ? meta.reportDate : formatQhsePdfGenerationDate();
  const totalPages = Math.max(1, (includeCover ? 1 : 0) + pageBodies.length);
  const parts = [];

  if (includeCover) {
    parts.push(
      premiumPdfCoverSection({
        documentTitle: meta.coverTitle || reportTitle,
        subtitle: meta.coverSubtitle || meta.subtitle,
        organizationName: meta.organizationName,
        siteLabel: meta.siteLabel || meta.company,
        editionDate: dateStr,
        logoUrl: meta.logoUrl,
        pageIndex: 1,
        totalPages
      })
    );
  }

  pageBodies.forEach((body, i) => {
    parts.push(
      premiumPdfPageShell({
        reportTitle,
        company: meta.company,
        organizationName: meta.organizationName,
        reportDate: dateStr,
        subtitle: i === 0 ? meta.subtitle : undefined,
        logoUrl: meta.logoUrl,
        pageIndex: includeCover ? i + 2 : i + 1,
        totalPages,
        bodyHtml: body
      })
    );
  });

  return `${premiumPdfStyles()}<div class="qhse-premium-doc">${parts.join('')}</div>`;
}

/**
 * @param {{
 *   title: string;
 *   company?: string;
 *   organizationName?: string;
 *   siteLabel?: string;
 *   date?: string;
 *   subtitle?: string;
 *   logoUrl?: string;
 *   includeCover?: boolean;
 *   summary: string;
 *   kpisHtml?: string;
 *   narrative?: null | { summary?: string; strengths?: string[]; weaknesses?: string[]; priorityActions?: string[]; confidence?: number };
 *   narrativeSource?: string;
 *   sections?: { title: string; html: string }[];
 *   actions?: string;
 *   traceability?: string;
 *   conclusion?: string;
 *   footer?: string;
 *   compliancePct?: number | null;
 * }} opts
 */
export function generatePremiumPdf(opts) {
  const includeCover = opts.includeCover !== false;
  const title = normalizePdfTypography(String(opts.title || 'Rapport QHSE'));
  const company = opts.company != null ? normalizePdfTypography(String(opts.company)) : '';
  const org = opts.organizationName != null ? normalizePdfTypography(String(opts.organizationName)) : '';
  const site = opts.siteLabel != null ? normalizePdfTypography(String(opts.siteLabel)) : '';
  const dateStr = opts.date != null ? normalizePdfTypography(String(opts.date)) : formatQhsePdfGenerationDate();
  const subtitle = opts.subtitle != null ? normalizePdfTypography(String(opts.subtitle)) : '';
  const summary = String(opts.summary || '');
  const sections = Array.isArray(opts.sections) ? opts.sections : [];
  const actions = String(opts.actions || '');
  const trace = String(opts.traceability || '');
  const conclusion = String(opts.conclusion || '');
  const footerExtra = opts.footer != null ? String(opts.footer) : '';
  const kpisBlock = String(opts.kpisHtml || '').trim();

  const logo =
    opts.logoUrl && String(opts.logoUrl).trim()
      ? `<img class="qhse-premium-logo-img" src="${escapeHtml(opts.logoUrl)}" alt="" />`
      : '';

  let sectionsHtml = '';
  for (const s of sections) {
    const t = normalizePdfTypography(String(s.title || ''));
    const h = String(s.html || '');
    if (!t && !h) continue;
    sectionsHtml += `<h2 class="qhse-premium-h2">${escapeHtml(t)}</h2><div class="qhse-premium-card">${h || '<p class="qhse-premium-muted">N/A</p>'}</div>`;
  }

  const actionsBlock =
    actions.trim() !== ''
      ? `<h2 class="qhse-premium-h2">Actions prioritaires</h2><div class="qhse-premium-card">${actions}</div>`
      : '';

  const traceBlock =
    trace.trim() !== ''
      ? `<h2 class="qhse-premium-h2">Traçabilité</h2><div class="qhse-premium-card">${trace}</div>`
      : '';

  const conclusionBlock =
    conclusion.trim() !== ''
      ? `<h2 class="qhse-premium-h2">Conclusion</h2><div class="qhse-premium-card">${conclusion}</div>`
      : '';

  const kpisSection =
    kpisBlock !== ''
      ? `<h2 class="qhse-premium-h2">Indicateurs clés</h2><div class="qhse-premium-card">${kpisBlock}</div>`
      : '';

  const footNorm = footerExtra ? normalizePdfTypography(footerExtra) : '';
  const foot = footNorm
    ? `<footer class="qhse-premium-foot">${escapeHtml(footNorm)}</footer>`
    : `<footer class="qhse-premium-foot">${QHSE_PDF_FOOTER_TAGLINE} · ${escapePdfText(dateStr)}</footer>`;

  const totalPages = includeCover ? 2 : 1;

  const cover = includeCover
    ? premiumPdfCoverSection({
        documentTitle: title,
        subtitle,
        organizationName: org || undefined,
        siteLabel: site || company || undefined,
        editionDate: dateStr,
        logoUrl: opts.logoUrl,
        pageIndex: 1,
        totalPages
      })
    : '';

  const innerMain = `<section class="qhse-premium-page-shell">
    <div class="qhse-premium-topbar"></div>
    <header class="qhse-premium-head qhse-premium-head--compact">
      <div class="qhse-premium-head-row">
        <div class="qhse-premium-logo-row" style="flex:1">
          ${logo}
          <div>
            <div class="qhse-premium-logo">QHSE Control Africa</div>
            ${org ? `<div class="qhse-premium-client"><strong>Organisation :</strong> ${escapePdfText(org)}</div>` : ''}
            ${site || company
              ? `<div class="qhse-premium-client"><strong>Site / périmètre :</strong> ${escapePdfText(site || company)}</div>`
              : ''}
            <h1 class="qhse-premium-title" style="margin-top:8px;font-size:13pt">${escapePdfText(title)}</h1>
          </div>
        </div>
        <div class="qhse-premium-date">
          ${escapeHtml(dateStr)}
          ${
            includeCover
              ? `<div class="qhse-premium-muted" style="margin-top:6px">Corps du document - pagination PDF automatique</div>`
              : ''
          }
        </div>
      </div>
    </header>
    ${buildPremiumComplianceBlock(opts.compliancePct ?? null)}
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    <div class="qhse-premium-card">${summary || '<p class="qhse-premium-muted">Non renseigné.</p>'}</div>
    ${kpisSection}
    ${buildPremiumNarrativeBlock(opts.narrative ?? null, opts.narrativeSource || '')}
    ${sectionsHtml}
    ${actionsBlock}
    ${traceBlock}
    ${conclusionBlock}
    ${foot}
    <div class="qhse-premium-brand-foot">QHSE Control Africa</div>
  </section>`;

  const docInner = includeCover ? `${cover}${innerMain}` : innerMain;

  return `${premiumPdfStyles()}<div class="qhse-premium-doc">${docInner}</div>`;
}
