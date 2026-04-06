/**
 * Filigrane sur export PDF — métadonnée utilisateur + date (traçabilité).
 * Dépendance optionnelle pdf-lib ; repli : buffer inchangé + en-tête HTTP côté contrôleur.
 */

/**
 * @param {Buffer} pdfBuffer
 * @param {{ label: string }} opts
 * @returns {Promise<Buffer>}
 */
export async function addWatermarkToPdf(pdfBuffer, opts) {
  const label = String(opts.label || '').slice(0, 500);
  try {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const doc = await PDFDocument.load(pdfBuffer);
    const pages = doc.getPages();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 9;
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(label, {
        x: 36,
        y: 24,
        size: fontSize,
        font,
        color: rgb(0.45, 0.45, 0.45),
        opacity: 0.85
      });
      page.drawText(label, {
        x: width / 2 - Math.min(width * 0.35, 180),
        y: height / 2,
        size: 11,
        font,
        color: rgb(0.75, 0.2, 0.2),
        opacity: 0.12,
        rotate: { angleInRadians: -0.35 }
      });
    }
    const out = await doc.save();
    return Buffer.from(out);
  } catch (e) {
    console.warn('[documentWatermark] pdf-lib indisponible ou PDF invalide — export sans filigrane intégré.', e?.message);
    return pdfBuffer;
  }
}
