/**
 * Exports registre habilitations (CSV / XLSX / PDF) — génération côté navigateur.
 * Respecte les lignes passées (déjà filtrées par l’écran).
 */

import { escapeHtml } from '../utils/escapeHtml.js';
import { saveElementAsPdf } from '../utils/html2pdfExport.js';
import { HABILITATIONS_STATUS_LABEL } from '../data/habilitationsDemo.js';

const CSV_COLS = [
  'collaborateur',
  'entreprise',
  'poste',
  'site',
  'service',
  'type',
  'niveau',
  'expiration',
  'statut',
  'justificatif',
  'matricule'
];

/** @param {Record<string, unknown>} state */
export function formatHabilitationsFiltersSummary(state) {
  if (!state || typeof state !== 'object') return 'Aucun filtre';
  const parts = [];
  if (state.q) parts.push(`Recherche : « ${state.q} »`);
  if (state.site) parts.push(`Site : ${state.site}`);
  if (state.service) parts.push(`Service : ${state.service}`);
  if (state.entreprise) parts.push(`Entreprise : ${state.entreprise}`);
  if (state.type) parts.push(`Type : ${state.type}`);
  if (state.statut) parts.push(`Statut : ${HABILITATIONS_STATUS_LABEL[state.statut] || state.statut}`);
  if (state.expiration) {
    const m = { expired: 'Expirées', lt30: 'Expiration < 30 j', '30_90': '30–90 j', gt90: '> 90 j' };
    parts.push(`Échéance : ${m[state.expiration] || state.expiration}`);
  }
  if (state.subcontractorOnly) parts.push('Sous-traitants : filtre actif');
  return parts.length ? parts.join(' · ') : 'Périmètre : toutes les lignes visibles à l’écran';
}

/** @param {Record<string, unknown>[]} rows */
function rowsToPlainObjects(rows) {
  return rows.map((r) => ({
    collaborateur: r.collaborateur ?? '',
    entreprise: r.entreprise ?? '',
    poste: r.poste ?? '',
    site: r.site ?? '',
    service: r.service ?? '',
    type: r.type ?? '',
    niveau: r.niveau ?? '',
    expiration: r.expiration ?? '',
    statut: HABILITATIONS_STATUS_LABEL[r.statut] || r.statut || '',
    justificatif: r.justificatif ? 'Oui' : 'Non',
    matricule: r.matricule ?? ''
  }));
}

/** @param {Record<string, unknown>[]} rows */
export function downloadHabilitationsCsv(rows, filename = 'habilitations-export') {
  const data = rowsToPlainObjects(rows);
  const header = CSV_COLS.join(';');
  const lines = data.map((row) =>
    CSV_COLS.map((k) => {
      const v = String(row[k] ?? '').replace(/"/g, '""');
      return `"${v}"`;
    }).join(';')
  );
  const blob = new Blob([`\ufeff${header}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename.replace(/[^\w-]+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** @param {Record<string, unknown>[]} rows */
export async function downloadHabilitationsXlsx(rows, filename = 'habilitations-export') {
  const XLSX = await import('xlsx');
  const data = rowsToPlainObjects(rows);
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Habilitations');
  XLSX.writeFile(wb, `${filename.replace(/[^\w-]+/g, '_')}.xlsx`);
}

/**
 * @param {{
 *   title: string;
 *   filtersText: string;
 *   rows: Record<string, unknown>[];
 *   subtitle?: string;
 * }} opts
 */
export function buildHabilitationsPdfHtml({ title, subtitle = '', filtersText, rows }) {
  const data = rowsToPlainObjects(rows);
  const thead = `<tr>${CSV_COLS.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
  const tbody = data
    .map(
      (row) =>
        `<tr>${CSV_COLS.map((k) => `<td>${escapeHtml(String(row[k] ?? ''))}</td>`).join('')}</tr>`
    )
    .join('');
  const dateStr = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short'
  });
  return `
<div class="hab-pdf-root">
  <header class="hab-pdf-header">
    <div class="hab-pdf-logo" aria-hidden="true">◈ QHSE Control</div>
    <div>
      <h1 class="hab-pdf-title">${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="hab-pdf-sub">${escapeHtml(subtitle)}</p>` : ''}
      <p class="hab-pdf-meta">Édition : ${escapeHtml(dateStr)}</p>
      <p class="hab-pdf-filters"><strong>Filtres :</strong> ${escapeHtml(filtersText)}</p>
    </div>
  </header>
  <table class="hab-pdf-table">
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>
  <footer class="hab-pdf-footer">Document généré localement — à conserver selon votre politique documentaire.</footer>
</div>`;
}

/**
 * @param {{
 *   title: string;
 *   filtersText: string;
 *   rows: Record<string, unknown>[];
 *   subtitle?: string;
 *   filename?: string;
 * }} opts
 */
export async function downloadHabilitationsPdf(opts) {
  const html = buildHabilitationsPdfHtml(opts);
  const host = document.createElement('div');
  host.className = 'hab-pdf-host-hidden';
  host.innerHTML = html;
  Object.assign(host.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '190mm',
    padding: '8px',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '10px'
  });
  document.body.append(host);

  const safeName = String(opts.filename || 'rapport-habilitations').replace(/[^\w-]+/g, '_');
  try {
    await saveElementAsPdf(host, `${safeName}.pdf`, {
      margin: [10, 10, 10, 10],
      html2canvas: { backgroundColor: '#0f172a' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    });
  } finally {
    host.remove();
  }
}

/** KPI + par site pour export « conformité » */
export function buildConformitePdfHtml({ filtersText, kpis, bySite }) {
  const dateStr = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  const siteRows = (bySite || [])
    .map(
      (b) =>
        `<tr><td>${escapeHtml(b.site)}</td><td>${b.score}%</td><td>${b.total}</td><td>${b.nonConf}</td></tr>`
    )
    .join('');
  return `
<div class="hab-pdf-root">
  <header class="hab-pdf-header">
    <div class="hab-pdf-logo">◈ QHSE Control</div>
    <div>
      <h1 class="hab-pdf-title">Synthèse conformité habilitations</h1>
      <p class="hab-pdf-meta">Édition : ${escapeHtml(dateStr)}</p>
      <p class="hab-pdf-filters"><strong>Filtres :</strong> ${escapeHtml(filtersText)}</p>
    </div>
  </header>
  <div class="hab-pdf-kpis">
    <p><strong>Actives :</strong> ${kpis.actifs} · <strong>Expirées :</strong> ${kpis.expirees} · <strong>&lt; 30 j :</strong> ${kpis.exp30}</p>
    <p><strong>Non conformes :</strong> ${kpis.nonConformes} · <strong>Taux :</strong> ${kpis.taux}% · <strong>Blocages critiques :</strong> ${kpis.blocCrit}</p>
  </div>
  <table class="hab-pdf-table">
    <thead><tr><th>Site</th><th>Score</th><th>Total hab.</th><th>Non conformes</th></tr></thead>
    <tbody>${siteRows}</tbody>
  </table>
  <footer class="hab-pdf-footer">Document généré localement — à conserver selon votre politique documentaire.</footer>
</div>`;
}

export async function downloadHabilitationsConformitePdf({ filtersText, kpis, bySite, filename }) {
  const host = document.createElement('div');
  host.innerHTML = buildConformitePdfHtml({ filtersText, kpis, bySite });
  Object.assign(host.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '190mm',
    padding: '12px',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '10px'
  });
  document.body.append(host);
  const safeName = String(filename || 'conformite-habilitations').replace(/[^\w-]+/g, '_');
  try {
    await saveElementAsPdf(host, `${safeName}.pdf`, {
      margin: [10, 10, 10, 10],
      html2canvas: { backgroundColor: '#0f172a' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    });
  } finally {
    host.remove();
  }
}
