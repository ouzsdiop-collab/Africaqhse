import { showToast } from '../components/toast.js';

/**
 * Génère le PDF côté serveur (Chromium headless via Puppeteer) : rendu vectoriel net,
 * sauts de page CSS respectés. Bascule automatiquement sur la capture html2canvas
 * (downloadQhseChromePdf) en cas d'échec (timeout, route indisponible, etc.).
 * @param {string} html · document HTML complet (avec balises <style>)
 * @param {string} filename
 * @param {{ landscape?: boolean; margin?: Record<string, string> }} [opts]
 */
export async function downloadQhsePremiumPdf(html, filename, opts = {}) {
  const safe = String(filename || 'export').replace(/[^\w.-]+/g, '_');
  const name = safe.endsWith('.pdf') ? safe : `${safe}.pdf`;
  showToast('Génération du PDF en cours...', 'info');
  try {
    const { qhseFetch } = await import('./qhseFetch.js');
    const fullHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    const res = await qhseFetch('/api/pdf/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: fullHtml, filename: name, landscape: opts.landscape, margin: opts.margin })
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
