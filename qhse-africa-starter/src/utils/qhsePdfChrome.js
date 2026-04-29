/**
 * Gabarit visuel commun des exports PDF navigateur (QHSE Control Africa).
 * En-tête bande #1D9E75, pied de page confidentiel + pagination explicite par section.
 */

import { escapeHtml } from './escapeHtml.js';
import { saveElementAsPdf } from './html2pdfExport.js';
import { showToast } from '../components/toast.js';

export const QHSE_PDF_BRAND = '#1D9E75';

export function formatQhsePdfGenerationDate() {
  return new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
}

/** @template T
 * @param {T[]} rows
 * @param {number} pageSize
 * @returns {T[][]}
 */
export function chunkRowsForPdf(rows, pageSize) {
  if (!rows.length) return [[]];
  const out = [];
  for (let i = 0; i < rows.length; i += pageSize) {
    out.push(rows.slice(i, i + pageSize));
  }
  return out;
}

export const QHSE_PDF_EMPTY_MESSAGE =
  'Aucune donnée à exporter pour ce périmètre. Élargissez les filtres ou complétez le registre.';

/** Styles injectés sur l’hôte : enfants directs en border-box, pas de clip implicite */
export const QHSE_PDF_HOST_CHILD_STYLES = `<style>
  .qhse-pdf-capture-host > * { box-sizing: border-box; }
  .qhse-pdf-capture-host { clip-path: none !important; clip: auto !important; }
</style>`;

export function qhsePdfSharedStyles() {
  return `<style>
    .qhse-chrome-doc,
    .qhse-chrome-doc *,
    .qhse-chrome-doc *::before,
    .qhse-chrome-doc *::after { box-sizing: border-box; }
    .qhse-chrome-doc {
      font-family: inherit;
      font-size: 9.5pt;
      color: #1a1a1a;
      line-height: 1.5;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible;
      position: relative;
      left: 0;
    }
    .qhse-chrome-page { page-break-after: auto; padding: 0 0 16px; }
    .qhse-chrome-head { background: ${QHSE_PDF_BRAND}; color: #fff; padding: 10px 14px; margin: 0 0 12px 0; }
    .qhse-chrome-head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .qhse-chrome-brand { font-weight: 800; font-size: 11pt; letter-spacing: 0.02em; }
    .qhse-chrome-right { text-align: right; flex: 1; min-width: 140px; }
    .qhse-chrome-report { font-weight: 700; font-size: 10pt; }
    .qhse-chrome-date { font-size: 8pt; opacity: 0.95; margin-top: 4px; }
    .qhse-chrome-body { padding: 0; overflow-wrap: anywhere; word-break: break-word; }
    .qhse-chrome-foot {
      margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0;
      font-size: 8pt; color: #64748b; text-align: center;
    }
    .qhse-chrome-h1 {
      font-size: 16pt;
      font-weight: 800;
      margin: 0 0 8px;
      color: #0f172a;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-chrome-h2 { font-size: 11pt; font-weight: 800; margin: 14px 0 8px; color: #0f172a; border-bottom: 2px solid ${QHSE_PDF_BRAND}; padding-bottom: 4px; }
    .qhse-chrome-muted { color: #64748b; font-size: 9pt; }
    .qhse-chrome-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 6px;
      table-layout: fixed;
    }
    .qhse-chrome-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 5px;
      text-align: left;
      font-weight: 700;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-chrome-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 5px;
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .qhse-chrome-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 7.5pt;
      white-space: normal;
      max-width: 100%;
      word-break: break-word;
    }
    .qhse-chrome-gauge-track { height: 16px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; max-width: 280px; overflow: hidden; display: inline-block; vertical-align: middle; width: 70%; }
    .qhse-chrome-gauge-fill { height: 100%; background: ${QHSE_PDF_BRAND}; border-radius: 3px; }
    .qhse-chrome-kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
    .qhse-chrome-kpi {
      flex: 1;
      min-width: 120px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      background: #fafafa;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .qhse-chrome-kpi-val { font-size: 14pt; font-weight: 800; color: #0f172a; }
    .qhse-chrome-kpi-lbl { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .qhse-matrix-table td, .qhse-matrix-table th { text-align: center; padding: 4px; font-size: 7.5pt; }
  </style>`;
}

/**
 * @param {{ reportTitle: string; pageIndex: number; totalPages: number; bodyHtml: string }} p
 */
export function qhsePdfPageHtml(p) {
  const date = formatQhsePdfGenerationDate();
  return `
<section class="qhse-chrome-page">
  <header class="qhse-chrome-head">
    <div class="qhse-chrome-head-row">
      <span class="qhse-chrome-brand">QHSE Control Africa</span>
      <div class="qhse-chrome-right">
        <div class="qhse-chrome-report">${escapeHtml(p.reportTitle)}</div>
        <div class="qhse-chrome-date">Généré le ${escapeHtml(date)}</div>
      </div>
    </div>
  </header>
  <div class="qhse-chrome-body">${p.bodyHtml}</div>
  <footer class="qhse-chrome-foot">QHSE Control Africa · Document confidentiel · Usage interne · Section ${p.pageIndex} / ${p.totalPages}</footer>
</section>`;
}

/**
 * @param {string} reportTitle
 * @param {string[]} pageBodies
 */
export function assembleQhsePdfDocument(reportTitle, pageBodies) {
  const n = Math.max(1, pageBodies.length);
  const pages = pageBodies.map((body, i) =>
    qhsePdfPageHtml({
      reportTitle,
      pageIndex: i + 1,
      totalPages: n,
      bodyHtml: body
    })
  );
  return `${qhsePdfSharedStyles()}<div class="qhse-chrome-doc">${pages.join('')}</div>`;
}

/**
 * @param {string} html
 * @param {string} filename
 * @param {Record<string, unknown>} [pdfOverrides] · fusionné dans buildHtml2PdfOptions par saveElementAsPdf
 * @param {{ silentToasts?: boolean }} [opts] · désactive les toasts (ex. appelant gère le message)
 */
export async function downloadQhseChromePdf(html, filename, pdfOverrides = {}, opts = {}) {
  const silent = Boolean(opts.silentToasts);
  const host = document.createElement('div');
  host.className = 'qhse-pdf-capture-host';
  /** ~210mm @96dpi · padding hôte pour éviter tout texte coupé à gauche (capture html2canvas) */
  host.style.cssText = [
    'box-sizing:border-box',
    'width:794px',
    'padding:40px 48px',
    'margin:0',
    'background-color:#ffffff',
    'color:#1a1a1a',
    'font-family:Arial,Helvetica,sans-serif',
    'font-size:12px',
    'line-height:1.5',
    'overflow:visible',
    'clip:auto',
    'position:fixed',
    'left:-9999px',
    'top:0',
    'min-height:0'
  ].join(';');
  host.innerHTML = `${QHSE_PDF_HOST_CHILD_STYLES}${html}`;
  document.body.appendChild(host);
  const safe = String(filename || 'export').replace(/[^\w.-]+/g, '_');
  const name = safe.endsWith('.pdf') ? safe : `${safe}.pdf`;
  try {
    if (!silent) showToast('Génération du PDF en cours...', 'info');
    await new Promise((r) => setTimeout(r, 500));
    await saveElementAsPdf(host, name, pdfOverrides);
    if (!silent) showToast('PDF téléchargé avec succès', 'success');
  } catch (e) {
    console.error(e);
    if (!silent) showToast('Échec de la génération du PDF.', 'error');
    throw e;
  } finally {
    host.remove();
  }
}
