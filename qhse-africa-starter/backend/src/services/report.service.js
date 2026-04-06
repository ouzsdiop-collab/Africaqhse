import PDFDocument from 'pdfkit';

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

function normalizeChecklist(raw) {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x.point === 'string')
    .map((x) => ({
      point: x.point,
      conforme: Boolean(x.conforme)
    }));
}

/** @param {object} audit Prisma Audit (ref, site, score, status, createdAt, checklist?)
 * @param {{ nonConformities?: object[] }} options */
export function generateAuditReport(audit, { nonConformities = [] } = {}) {
  const checklistItems = normalizeChecklist(audit.checklist);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 50, size: 'A4', info: { Title: 'Rapport d\'audit' } });
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Rapport d\'audit');
    doc.moveDown(0.75);
    doc.fontSize(11);
    doc.text(`Référence : ${audit.ref}`);
    doc.text(`Site : ${audit.site}`);
    doc.text(`Date : ${formatFrDate(audit.createdAt)}`);
    doc.text(`Score : ${audit.score} %`);
    doc.text(`Statut : ${audit.status}`);
    doc.moveDown();

    doc.fontSize(14).text('Checklist');
    doc.moveDown(0.35);
    doc.fontSize(11);
    if (checklistItems.length === 0) {
      doc.fillColor('#555555').text('Aucun point de checklist enregistré pour cet audit.');
      doc.fillColor('#000000');
    } else {
      checklistItems.forEach((item) => {
        const label = item.conforme ? 'Conforme' : 'Non conforme';
        doc.text(`• ${item.point} — ${label}`);
      });
    }

    doc.moveDown();
    doc.fontSize(14).text('Non-conformités');
    doc.moveDown(0.35);
    doc.fontSize(11);
    if (!nonConformities.length) {
      doc.fillColor('#555555').text('Aucune non-conformité liée à cet audit.');
      doc.fillColor('#000000');
    } else {
      nonConformities.forEach((nc, i) => {
        doc.text(`${i + 1}. ${nc.title}`);
        if (nc.detail && String(nc.detail).trim()) {
          doc.fontSize(10).fillColor('#333333');
          doc.text(`   ${String(nc.detail).trim()}`, { indent: 12 });
          doc.fontSize(11).fillColor('#000000');
        }
        doc.moveDown(0.25);
      });
    }

    doc.end();
  });
}
