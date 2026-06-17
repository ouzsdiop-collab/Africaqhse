import { showToast } from '../components/toast.js';

/**
 * Génère le PDF côté serveur (Chromium headless via Puppeteer).
 * Bascule automatiquement sur html2canvas en cas d'échec.
 * @param {string} html
 * @param {string} filename
 * @param {{
 *   landscape?: boolean;
 *   headerTemplate?: string;
 *   footerTemplate?: string;
 * }} [opts]
 */
export async function downloadQhsePremiumPdf(html, filename, opts = {}) {
  const safe = String(filename || 'export').replace(/[^\w.-]+/g, '_');
  const name = safe.endsWith('.pdf') ? safe : `${safe}.pdf`;
  showToast('Génération du PDF en cours...', 'info');
  try {
    const { qhseFetch } = await import('./qhseFetch.js');
    const fullHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(html)
      ? html
      : `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    const body = {
      html: fullHtml,
      filename: name,
      landscape: opts.landscape,
    };
    if (opts.headerTemplate) body.headerTemplate = opts.headerTemplate;
    if (opts.footerTemplate) body.footerTemplate = opts.footerTemplate;
    const res = await qhseFetch('/api/pdf/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('PDF téléchargé avec succès', 'success');
  } catch (e) {
    console.error('[qhsePdfPremiumDelivery] server pdf render failed, fallback html2canvas', e);
    const { downloadQhseChromePdf } = await import('./qhsePdfChrome.js');
    await downloadQhseChromePdf(html, name, {}, { silentToasts: true });
    showToast('PDF téléchargé avec succès', 'success');
  }
}
