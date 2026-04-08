/**
 * Options html2pdf.js partagées — netteté et coupure de page plus stables.
 * @param {string} filename
 * @param {Record<string, unknown>} [overrides]
 * @returns {Record<string, unknown>}
 */
export function buildHtml2PdfOptions(filename, overrides = {}) {
  const base = {
    margin: [10, 12, 12, 12],
    filename,
    image: { type: 'jpeg', quality: 0.97 },
    html2canvas: {
      scale: 2.5,
      useCORS: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      allowTaint: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  const out = { ...base, ...overrides };
  if (overrides.html2canvas && typeof overrides.html2canvas === 'object') {
    out.html2canvas = { ...base.html2canvas, ...overrides.html2canvas };
  }
  if (overrides.jsPDF && typeof overrides.jsPDF === 'object') {
    out.jsPDF = { ...base.jsPDF, ...overrides.jsPDF };
  }
  if (overrides.image && typeof overrides.image === 'object') {
    out.image = { ...base.image, ...overrides.image };
  }
  return out;
}

/**
 * @param {HTMLElement} element
 * @param {string} filename
 * @param {Record<string, unknown>} [overrides]
 */
export async function saveElementAsPdf(element, filename, overrides = {}) {
  const mod = await import('html2pdf.js');
  const html2pdf = mod.default || mod;
  const opt = buildHtml2PdfOptions(filename, overrides);
  await html2pdf().set(opt).from(element).save();
}
