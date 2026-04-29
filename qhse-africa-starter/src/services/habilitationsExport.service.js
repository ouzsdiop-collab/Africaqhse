/**
 * Exports registre habilitations (CSV / PDF) · génération côté navigateur.
 * PDF : gabarit premium QHSE Control Africa (bandeau #1D9E75, pied de page confidentiel).
 */

import { escapeHtml } from '../utils/escapeHtml.js';
import { HABILITATIONS_STATUS_LABEL, habDaysUntil } from '../data/habilitationsDemo.js';
import { assemblePremiumPdfDocument } from '../utils/pdfPremiumTemplate.js';
import { formatQhsePdfGenerationDate } from '../utils/qhsePdfChrome.js';

/** @returns {Promise<typeof import('../utils/qhsePdfChrome.js')>} */
function loadQhsePdfChrome() {
  return import('../utils/qhsePdfChrome.js');
}

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
    const m = { expired: 'Expirées', lt30: 'Expiration < 30 j', '30_90': '30-90 j', gt90: '> 90 j' };
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

function daysUntilRow(r) {
  return habDaysUntil(r.expiration);
}

/** @param {string} statutKey */
function habStatusBadgeClass(statutKey) {
  if (statutKey === 'expiree') return { bg: '#fee2e2', fg: '#991b1b', label: HABILITATIONS_STATUS_LABEL.expiree };
  if (statutKey === 'expire_bientot')
    return { bg: '#ffedd5', fg: '#c2410c', label: HABILITATIONS_STATUS_LABEL.expire_bientot };
  if (statutKey === 'suspendue')
    return { bg: '#fef3c7', fg: '#b45309', label: HABILITATIONS_STATUS_LABEL.suspendue };
  if (statutKey === 'incomplete')
    return { bg: '#fce7f3', fg: '#9d174d', label: HABILITATIONS_STATUS_LABEL.incomplete };
  if (statutKey === 'en_attente')
    return { bg: '#e0e7ff', fg: '#3730a3', label: HABILITATIONS_STATUS_LABEL.en_attente };
  return { bg: '#dcfce7', fg: '#166534', label: HABILITATIONS_STATUS_LABEL.valide };
}

/** @param {Record<string, unknown>} r */
function habBadgeForRow(r) {
  const st = String(r.statut || '');
  const d = daysUntilRow(r);
  if (st === 'expiree' || d < 0) return habStatusBadgeClass('expiree');
  if (st === 'expire_bientot' || (d >= 0 && d <= 30)) return habStatusBadgeClass('expire_bientot');
  return habStatusBadgeClass(st === 'valide' ? 'valide' : st);
}

/** @param {Record<string, unknown>[]} rows */
function computeHabilitationsSummary(rows) {
  const total = rows.length;
  const expired = rows.filter((r) => r.statut === 'expiree' || daysUntilRow(r) < 0).length;
  const renew30 = rows.filter((r) => {
    const d = daysUntilRow(r);
    return d >= 0 && d <= 30;
  }).length;
  return { total, expired, renew30 };
}

/** @param {Record<string, unknown>[]} rows */
function criticalAlertRows(rows) {
  const out = [];
  rows.forEach((r) => {
    const d = daysUntilRow(r);
    const critical =
      r.statut === 'expiree' ||
      d < 0 ||
      (d >= 0 && d <= 7) ||
      !r.justificatif ||
      r.statut === 'suspendue';
    if (critical) out.push({ ...r, _d: d });
  });
  const seen = new Set();
  return out.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/** @param {Record<string, unknown>[]} rows */
function computeByType(rows) {
  const types = [...new Set(rows.map((r) => String(r.type || 'Non renseigné')))];
  return types
    .map((type) => {
      const bucket = rows.filter((r) => String(r.type || 'Non renseigné') === type);
      const nonConf = bucket.filter((r) =>
        ['expiree', 'suspendue', 'incomplete'].includes(String(r.statut))
      ).length;
      const score = bucket.length ? Math.round(((bucket.length - nonConf) / bucket.length) * 100) : 0;
      return { type, score, total: bucket.length, nonConf };
    })
    .sort((a, b) => b.total - a.total);
}

/** @param {Record<string, unknown>[]} rows */
function nonConformiteRows(rows) {
  return rows.filter((r) => ['expiree', 'suspendue', 'incomplete'].includes(String(r.statut)));
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

/** @param {Record<string, unknown>[]} rows @param {string} emptyMessage */
function buildRegistreTableHtml(rows, emptyMessage) {
  const head = `<tr>
    <th>Collaborateur</th><th>Poste</th><th>Type</th><th>Site</th><th>Expiration</th><th>Statut</th>
  </tr>`;
  if (!rows.length) {
    return `<p class="qhse-premium-muted">${escapeHtml(emptyMessage)}</p>`;
  }
  const body = rows
    .map((r) => {
      const b = habBadgeForRow(r);
      return `<tr>
        <td>${escapeHtml(String(r.collaborateur ?? ''))}</td>
        <td>${escapeHtml(String(r.poste ?? ''))}</td>
        <td>${escapeHtml(String(r.type ?? ''))}</td>
        <td>${escapeHtml(String(r.site ?? ''))}</td>
        <td>${escapeHtml(String(r.expiration ?? ''))}</td>
        <td><span class="qhse-premium-badge" style="background:${b.bg};color:${b.fg}">${escapeHtml(b.label)}</span></td>
      </tr>`;
    })
    .join('');
  return `<table class="qhse-premium-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function buildAlertsSectionHtml(rows) {
  const crit = criticalAlertRows(rows).slice(0, 25);
  if (!crit.length) {
    return `<h2 class="qhse-premium-h2">Points de vigilance (échéances)</h2><p class="qhse-premium-muted">Aucune alerte critique dans ce périmètre.</p>`;
  }
  const lines = crit
    .map((r) => {
      const d = r._d;
      const reason =
        r.statut === 'expiree' || d < 0
          ? 'Expirée'
          : d <= 7
            ? `Échéance &lt;= 7 j (${d} j)`
            : !r.justificatif
              ? 'Justificatif manquant'
              : r.statut === 'suspendue'
                ? 'Suspendue'
                : 'À surveiller';
      return `<tr>
        <td>${escapeHtml(String(r.collaborateur ?? ''))}</td>
        <td>${escapeHtml(String(r.type ?? ''))}</td>
        <td>${escapeHtml(String(r.expiration ?? ''))}</td>
        <td>${escapeHtml(reason)}</td>
      </tr>`;
    })
    .join('');
  return `<h2 class="qhse-premium-h2">Points de vigilance (échéances)</h2>
    <p class="qhse-premium-muted">Fiches à traiter en priorité (extrait ${crit.length} max.).</p>
    <table class="qhse-premium-table">
      <thead><tr><th>Collaborateur</th><th>Type</th><th>Expiration</th><th>Motif</th></tr></thead>
      <tbody>${lines}</tbody>
    </table>`;
}

/**
 * @param {{
 *   title: string;
 *   filtersText: string;
 *   rows: Record<string, unknown>[];
 *   subtitle?: string;
 * }} opts
 * @param {typeof import('../utils/qhsePdfChrome.js')} pdf
 */
async function buildHabilitationsPdfHtml({ title, subtitle = '', filtersText, rows }, pdf) {
  const { chunkRowsForPdf, QHSE_PDF_EMPTY_MESSAGE } = pdf;
  const summary = computeHabilitationsSummary(rows);
  const h1 = title.toLowerCase().includes('alerte')
    ? 'RAPPORT ALERTES HABILITATIONS'
    : title.toLowerCase().includes('fiche')
      ? 'FICHE HABILITATIONS'
      : 'REGISTRE DES HABILITATIONS';

  const docTitle =
    h1 === 'RAPPORT ALERTES HABILITATIONS'
      ? 'Alertes habilitations'
      : h1 === 'FICHE HABILITATIONS'
        ? 'Fiche habilitations'
        : 'Registre des Habilitations';

  const summaryHtml = `
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    ${subtitle ? `<p class="qhse-premium-muted">${escapeHtml(subtitle)}</p>` : ''}
    <p class="qhse-premium-muted"><strong>Filtres :</strong> ${escapeHtml(filtersText)}</p>
    <h2 class="qhse-premium-h2">Indicateurs clés</h2>
    <div class="qhse-premium-kpi-grid">
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${summary.total}</div><div class="qhse-premium-kpi-lbl">Total</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#991b1b">${summary.expired}</div><div class="qhse-premium-kpi-lbl">Expirées</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#c2410c">${summary.renew30}</div><div class="qhse-premium-kpi-lbl">À renouveler &lt;= 30 j</div></div>
    </div>
    ${buildAlertsSectionHtml(rows)}
    <h2 class="qhse-premium-h2">Conclusion</h2>
    <p class="qhse-premium-muted">Export des fiches visibles. Traçabilité : collaborateurs et dates d'expiration du registre.</p>
  `;

  const chunks = chunkRowsForPdf(rows, 18);
  const pageBodies = [];
  chunks.forEach((chunk, idx) => {
    if (idx === 0) {
      pageBodies.push(
        `${summaryHtml}<h2 class="qhse-premium-h2">Traçabilité et détail</h2>${buildRegistreTableHtml(chunk, QHSE_PDF_EMPTY_MESSAGE)}`
      );
    } else {
      pageBodies.push(
        `<h2 class="qhse-premium-h2">Traçabilité et détail (suite)</h2>${buildRegistreTableHtml(chunk, QHSE_PDF_EMPTY_MESSAGE)}`
      );
    }
  });

  if (pageBodies.length === 0) {
    pageBodies.push(
      `${summaryHtml}<h2 class="qhse-premium-h2">Traçabilité et détail</h2>${buildRegistreTableHtml([], QHSE_PDF_EMPTY_MESSAGE)}`
    );
  }

  return assemblePremiumPdfDocument(docTitle, pageBodies, {
    reportDate: formatQhsePdfGenerationDate(),
    coverSubtitle: 'Registre habilitations'
  });
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
  const pdf = await loadQhsePdfChrome();
  const html = await buildHabilitationsPdfHtml(opts, pdf);
  const safeName = String(opts.filename || 'rapport-habilitations').replace(/[^\w-]+/g, '_');
  await pdf.downloadQhseChromePdf(html, `${safeName}.pdf`, {
    margin: [12, 12, 16, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  });
}

/**
 * @param {{
 *   filtersText: string;
 *   kpis: Record<string, number>;
 *   bySite: { site: string; score: number; total: number; nonConf: number }[];
 *   rows?: Record<string, unknown>[];
 * }} opts
 */
function buildConformitePdfHtml({ filtersText, kpis, bySite, rows = [] }) {
  const docTitle = 'Rapport de conformité Habilitations';
  const taux = Math.round(Number(kpis.taux) || 0);
  const byType = computeByType(rows);
  const ncList = nonConformiteRows(rows).slice(0, 40);

  const gauge = `
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    <p class="qhse-premium-muted"><strong>Filtres :</strong> ${escapeHtml(filtersText)}</p>
    <h2 class="qhse-premium-h2">Niveau de conformité</h2>
    <p><strong>${taux} %</strong></p>
    <div class="qhse-premium-gauge-track" style="max-width:280px;margin-top:8px"><div class="qhse-premium-gauge-fill" style="width:${Math.min(100, Math.max(0, taux))}%"></div></div>
    <h2 class="qhse-premium-h2">Indicateurs clés</h2>
    <div class="qhse-premium-kpi-grid">
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${kpis.actifs ?? 0}</div><div class="qhse-premium-kpi-lbl">Actives</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${kpis.expirees ?? 0}</div><div class="qhse-premium-kpi-lbl">Expirées</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${kpis.exp30 ?? 0}</div><div class="qhse-premium-kpi-lbl">&lt; 30 j</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${kpis.nonConformes ?? 0}</div><div class="qhse-premium-kpi-lbl">Non conformes</div></div>
    </div>
  `;

  const typeRows = byType.length
    ? byType
        .map(
          (t) =>
            `<tr><td>${escapeHtml(t.type)}</td><td>${t.total}</td><td>${t.nonConf}</td><td><strong>${t.score} %</strong></td></tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="qhse-premium-muted">Non disponible</td></tr>`;

  const typeTable = `
    <h2 class="qhse-premium-h2">Analyse par type</h2>
    <table class="qhse-premium-table">
      <thead><tr><th>Type</th><th>Total</th><th>Non conformes</th><th>Taux</th></tr></thead>
      <tbody>${typeRows}</tbody>
    </table>
  `;

  const siteRows = (bySite || []).length
    ? (bySite || [])
        .map(
          (b) =>
            `<tr><td>${escapeHtml(b.site)}</td><td>${b.score}%</td><td>${b.total}</td><td>${b.nonConf}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="qhse-premium-muted">Non disponible</td></tr>`;

  const siteTable = `
    <h2 class="qhse-premium-h2">Synthèse par site</h2>
    <table class="qhse-premium-table">
      <thead><tr><th>Site</th><th>Score</th><th>Total</th><th>Non conformes</th></tr></thead>
      <tbody>${siteRows}</tbody>
    </table>
  `;

  const ncRows = ncList.length
    ? ncList
        .map(
          (r) =>
            `<tr><td>${escapeHtml(String(r.collaborateur ?? ''))}</td><td>${escapeHtml(String(r.type ?? ''))}</td><td>${escapeHtml(String(HABILITATIONS_STATUS_LABEL[r.statut] || r.statut || ''))}</td><td>${escapeHtml(String(r.expiration ?? ''))}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="qhse-premium-muted">Aucune non-conformité structurée dans ce périmètre.</td></tr>`;

  const ncSection = `
    <h2 class="qhse-premium-h2">Actions prioritaires (non-conformités)</h2>
    <table class="qhse-premium-table">
      <thead><tr><th>Collaborateur</th><th>Type</th><th>Statut</th><th>Expiration</th></tr></thead>
      <tbody>${ncRows}</tbody>
    </table>
  `;

  const page1 = `${gauge}${typeTable}`;
  const page2 = `${siteTable}${ncSection}<h2 class="qhse-premium-h2">Conclusion</h2><p class="qhse-premium-muted">État des habilitations au moment de l'export. Usage interne.</p>`;
  return assemblePremiumPdfDocument(docTitle, [page1, page2], {
    reportDate: formatQhsePdfGenerationDate(),
    coverSubtitle: 'Conformité habilitations'
  });
}

export async function downloadHabilitationsConformitePdf({
  filtersText,
  kpis,
  bySite,
  rows = [],
  filename
}) {
  const pdf = await loadQhsePdfChrome();
  const html = buildConformitePdfHtml({ filtersText, kpis, bySite, rows });
  const safeName = String(filename || 'conformite-habilitations').replace(/[^\w-]+/g, '_');
  await pdf.downloadQhseChromePdf(html, `${safeName}.pdf`, {
    margin: [12, 12, 16, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });
}
