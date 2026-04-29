/**
 * Exports PDF premium : registre risques, incidents, performance, analytics.
 * Conteneur racine (794px, padding 40px 48px, border-box) : `downloadQhseChromePdf` dans `qhsePdfChrome.js`.
 * Options html2canvas (largeur 794, x/y 0) : `html2pdfExport.js`.
 */

import { escapeHtml } from '../utils/escapeHtml.js';
import {
  chunkRowsForPdf,
  downloadQhseChromePdf,
  formatQhsePdfGenerationDate,
  QHSE_PDF_EMPTY_MESSAGE
} from '../utils/qhsePdfChrome.js';
import { assemblePremiumPdfDocument, normalizePdfTypography } from '../utils/pdfPremiumTemplate.js';
import {
  parseRiskMatrixGp,
  riskCriticalityFromMeta,
  riskTierFromGp
} from '../utils/riskMatrixCore.js';
import { sortRisksByPriority } from '../utils/risksSort.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';

/** Texte cellule PDF : tirets normalisés puis échappement. */
function pdfCell(s) {
  return escapeHtml(normalizePdfTypography(String(s ?? '')));
}

/** @param {unknown} r */
function riskGpProduct(r) {
  const gp = parseRiskMatrixGp(r?.meta);
  if (!gp) return null;
  return gp.g * gp.p;
}

/** @param {unknown[]} list */
function countRiskTiersPdf(list) {
  let critique = 0;
  let eleve = 0;
  let moyen = 0;
  let faible = 0;
  let sans = 0;
  (list || []).forEach((r) => {
    const c = riskCriticalityFromMeta(r?.meta);
    if (!c) {
      sans += 1;
      return;
    }
    if (c.tier >= 5) critique += 1;
    else if (c.tier >= 3) eleve += 1;
    else if (c.tier === 2) moyen += 1;
    else faible += 1;
  });
  return { critique, eleve, moyen, faible, sans };
}

/** @param {unknown[]} list */
function buildRiskMatrixCounts(list) {
  /** @type {number[][]} */
  const grid = Array.from({ length: 5 }, () => Array(5).fill(0));
  (list || []).forEach((r) => {
    const gp = parseRiskMatrixGp(r?.meta);
    if (!gp) return;
    const gi = Math.max(0, Math.min(4, gp.g - 1));
    const pi = Math.max(0, Math.min(4, gp.p - 1));
    grid[gi][pi] += 1;
  });
  return grid;
}

function matrixCellStyle(g, p) {
  const t = riskTierFromGp(g, p);
  if (t >= 5) return '#fee2e2';
  if (t >= 4) return '#ffedd5';
  if (t >= 3) return '#fef9c3';
  if (t >= 2) return '#e0f2fe';
  return '#f0fdf4';
}

/**
 * @param {unknown[]} risks : lignes UI registre (title, meta, type, status, responsible…)
 * @param {{ siteLabel?: string }} [opts]
 */
export async function downloadRisksRegisterPdf(risks, opts = {}) {
  const list = Array.isArray(risks) ? [...risks] : [];
  const sorted = sortRisksByPriority(list);
  const counts = countRiskTiersPdf(list);
  const docTitle = 'Registre des risques QHSE';
  const siteNote = opts.siteLabel
    ? `<p class="qhse-premium-muted"><strong>Périmètre :</strong> ${pdfCell(opts.siteLabel)}</p>`
    : '';

  const summary = `
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    <p class="qhse-premium-muted">Vue agrégée du registre des risques pour le périmètre exporté.</p>
    ${siteNote}
    <h2 class="qhse-premium-h2">Indicateurs clés</h2>
    <div class="qhse-premium-kpi-grid">
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#991b1b">${counts.critique}</div><div class="qhse-premium-kpi-lbl">Critiques</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#c2410c">${counts.eleve}</div><div class="qhse-premium-kpi-lbl">Élevés</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#a16207">${counts.moyen}</div><div class="qhse-premium-kpi-lbl">Moyens</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#166534">${counts.faible}</div><div class="qhse-premium-kpi-lbl">Faibles</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${counts.sans}</div><div class="qhse-premium-kpi-lbl">Sans G×P</div></div>
    </div>
  `;

  const grid = buildRiskMatrixCounts(list);
  let matrixHtml = '<table class="qhse-premium-table qhse-premium-matrix-table"><thead><tr><th>G \\ P</th>';
  for (let p = 1; p <= 5; p += 1) {
    matrixHtml += `<th>P${p}</th>`;
  }
  matrixHtml += '</tr></thead><tbody>';
  for (let g = 1; g <= 5; g += 1) {
    matrixHtml += `<tr><th>G${g}</th>`;
    for (let p = 1; p <= 5; p += 1) {
      const n = grid[g - 1][p - 1];
      const bg = matrixCellStyle(g, p);
      matrixHtml += `<td style="background:${bg}"><strong>${n || '0'}</strong></td>`;
    }
    matrixHtml += '</tr>';
  }
  matrixHtml += '</tbody></table>';

  const matrixSection = `
    <h2 class="qhse-premium-h2">Analyse (matrice G × P)</h2>
    <p class="qhse-premium-muted">Effectifs par case gravité (G) et probabilité (P).</p>
    ${matrixHtml}
    <h2 class="qhse-premium-h2">Conclusion</h2>
    <p class="qhse-premium-muted">Le détail des fiches figure aux pages suivantes. Les identifiants sont ceux du registre applicatif.</p>
  `;

  function rowHtml(r) {
    const gp = parseRiskMatrixGp(r?.meta);
    const g = gp ? gp.g : 'Non disponible';
    const p = gp ? gp.p : 'Non disponible';
    const prod = riskGpProduct(r);
    const ref = r?.id != null ? String(r.id).slice(0, 12) : 'Non disponible';
    const st = String(r?.status || 'Non disponible');
    let badgeBg = '#e2e8f0';
    let badgeFg = '#334155';
    if (/critique/i.test(st)) {
      badgeBg = '#fee2e2';
      badgeFg = '#991b1b';
    } else if (/élev|elev/i.test(st)) {
      badgeBg = '#ffedd5';
      badgeFg = '#c2410c';
    }
    return `<tr>
      <td>${escapeHtml(ref)}</td>
      <td>${escapeHtml(String(r?.title || 'Non renseigné'))}</td>
      <td>${escapeHtml(String(r?.type || 'Non renseigné'))}</td>
      <td style="text-align:center">${escapeHtml(String(g))}</td>
      <td style="text-align:center">${escapeHtml(String(p))}</td>
      <td style="text-align:center">${prod != null ? escapeHtml(String(prod)) : 'Non disponible'}</td>
      <td><span class="qhse-premium-badge" style="background:${badgeBg};color:${badgeFg}">${escapeHtml(st)}</span></td>
      <td>${escapeHtml(String(r?.responsible || 'Non renseigné'))}</td>
    </tr>`;
  }

  const chunks = chunkRowsForPdf(sorted, 16);
  const pages = [];
  chunks.forEach((chunk, idx) => {
    if (idx === 0) {
      pages.push(
        `${summary}${matrixSection}<h2 class="qhse-premium-h2">Détail du registre</h2>${
          chunk.length
            ? `<table class="qhse-premium-table"><thead><tr><th>Réf.</th><th>Titre</th><th>Cat.</th><th>G</th><th>P</th><th>G×P</th><th>Statut</th><th>Resp.</th></tr></thead><tbody>${chunk.map(rowHtml).join('')}</tbody></table>`
            : `<p class="qhse-premium-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`
        }`
      );
    } else {
      pages.push(
        `<h2 class="qhse-premium-h2">Traçabilité et détail (suite)</h2><table class="qhse-premium-table"><thead><tr><th>Réf.</th><th>Titre</th><th>Cat.</th><th>G</th><th>P</th><th>G×P</th><th>Statut</th><th>Resp.</th></tr></thead><tbody>${chunk.map(rowHtml).join('')}</tbody></table>`
      );
    }
  });
  if (!pages.length) {
    pages.push(`${summary}${matrixSection}<p class="qhse-premium-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`);
  }

  const html = assemblePremiumPdfDocument(docTitle, pages, {
    company: opts.siteLabel || '',
    siteLabel: opts.siteLabel || '',
    reportDate: formatQhsePdfGenerationDate(),
    coverSubtitle: 'Export registre risques'
  });
  await downloadQhseChromePdf(html, 'registre-risques.pdf', {
    margin: [12, 12, 16, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  });
}

/**
 * @param {unknown[]} incidents
 * @param {{ filtersSummary?: string }} [opts]
 */
export async function downloadIncidentsRegisterPdf(incidents, opts = {}) {
  const list = Array.isArray(incidents) ? incidents : [];
  const docTitle = 'Registre des incidents QHSE';
  const fil = opts.filtersSummary
    ? `<p class="qhse-premium-muted"><strong>Filtres :</strong> ${pdfCell(opts.filtersSummary)}</p>`
    : '';

  const crit = list.filter((i) => String(i?.severity || '').toLowerCase().includes('crit')).length;
  const open = list.filter((i) => !/cl[oô]tur|clos|ferm/i.test(String(i?.status || ''))).length;

  const summary = `
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    <p class="qhse-premium-muted">Synthèse du registre des incidents pour les filtres appliqués.</p>
    ${fil}
    <h2 class="qhse-premium-h2">Indicateurs clés</h2>
    <div class="qhse-premium-kpi-grid">
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${list.length}</div><div class="qhse-premium-kpi-lbl">Fiches (vue)</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#991b1b">${crit}</div><div class="qhse-premium-kpi-lbl">Gravité critique</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val" style="color:#c2410c">${open}</div><div class="qhse-premium-kpi-lbl">Non clôturés</div></div>
    </div>
    <h2 class="qhse-premium-h2">Conclusion</h2>
    <p class="qhse-premium-muted">Le tableau détaillé reprend les fiches visibles. Références internes au module incidents.</p>
  `;

  function rowHtml(inc) {
    const ref = pdfCell(String(inc?.ref ?? inc?.id ?? 'Non disponible'));
    const date = inc?.createdAtMs
      ? new Date(inc.createdAtMs).toLocaleDateString('fr-FR')
      : inc?.createdAt
        ? new Date(String(inc.createdAt)).toLocaleDateString('fr-FR')
        : 'Non disponible';
    const desc = normalizePdfTypography(String(inc?.description || inc?.title || 'Non disponible')).slice(0, 120);
    return `<tr>
      <td>${ref}</td>
      <td>${pdfCell(String(inc?.type || 'Non renseigné'))}</td>
      <td>${pdfCell(String(inc?.status || 'Non disponible'))}</td>
      <td>${pdfCell(String(inc?.severity || 'Non renseigné'))}</td>
      <td>${pdfCell(String(inc?.site || 'Non renseigné'))}</td>
      <td>${pdfCell(date)}</td>
      <td>${escapeHtml(desc)}</td>
    </tr>`;
  }

  const chunks = chunkRowsForPdf(list, 18);
  const pages = [];
  chunks.forEach((chunk, idx) => {
    const table = chunk.length
      ? `<table class="qhse-premium-table"><thead><tr><th>Réf.</th><th>Type</th><th>Statut</th><th>Gravité</th><th>Site</th><th>Date</th><th>Description</th></tr></thead><tbody>${chunk.map(rowHtml).join('')}</tbody></table>`
      : `<p class="qhse-premium-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`;
    pages.push(idx === 0 ? `${summary}<h2 class="qhse-premium-h2">Constats et détail</h2>${table}` : `<h2 class="qhse-premium-h2">Constats et détail (suite)</h2>${table}`);
  });
  if (!pages.length) pages.push(`${summary}<p class="qhse-premium-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`);

  const html = assemblePremiumPdfDocument(docTitle, pages, {
    reportDate: formatQhsePdfGenerationDate(),
    coverSubtitle: 'Export registre incidents'
  });
  await downloadQhseChromePdf(html, 'registre-incidents.pdf', {
    margin: [12, 12, 16, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  });
}

/**
 * Export premium: Audit ISO 45001 + pilotage QHSE (backend-only).
 * Source: GET /api/reports/iso-45001-pilotage-premium
 *
 * @param {{ organizationName?: string; siteLabel?: string }} [opts]
 */
export async function downloadIso45001PilotagePremiumPdf(opts = {}) {
  return downloadIsoPremiumPdf('iso-45001', opts, {
    // Compat: garder l’endpoint historique ISO 45001, mais sans dupliquer la logique front.
    endpoint: '/api/reports/iso-45001-pilotage-premium',
    filenameBase: 'rapport-iso-45001-pilotage-premium'
  });
}

const ISO_PREMIUM_ALLOWED = new Set(['iso-45001', 'iso-14001', 'iso-9001']);

function assertIsoPremiumStandard(standard) {
  const s = String(standard || '').trim().toLowerCase();
  if (!ISO_PREMIUM_ALLOWED.has(s)) {
    const allowed = [...ISO_PREMIUM_ALLOWED].join(', ');
    throw new Error(`Norme non supportée. Valeurs possibles : ${allowed}.`);
  }
  return s;
}

/**
 * Export premium: Audit ISO (45001/14001/9001) + pilotage QHSE (backend-only).
 * Source (par défaut): GET /api/reports/iso-premium?standard=...
 *
 * @param {'iso-45001'|'iso-14001'|'iso-9001'|string} standard
 * @param {{ organizationName?: string; siteLabel?: string }} [opts]
 * @param {{ endpoint?: string; filenameBase?: string }} [overrides]
 */
export async function downloadIsoPremiumPdf(standard, opts = {}, overrides = {}) {
  const std = assertIsoPremiumStandard(standard);
  const org = opts?.organizationName != null ? String(opts.organizationName).trim() : '';
  const siteLabel = opts?.siteLabel != null ? String(opts.siteLabel).trim() : '';

  const endpoint = overrides?.endpoint
    ? String(overrides.endpoint)
    : `/api/reports/iso-premium?standard=${encodeURIComponent(std)}`;
  const url = withSiteQuery(endpoint);
  const res = await qhseFetch(url);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof payload?.error === 'string' && payload.error.trim() ? payload.error.trim() : `Erreur ${res.status}`;
    throw new Error(msg);
  }

  const { buildIsoPilotagePremiumPdfHtml, downloadAuditIsoPdfFromHtml } = await import(
    '../components/auditPremiumSaaS.pdf.js'
  );

  const html = buildIsoPilotagePremiumPdfHtml({
    ...payload,
    // force standard pour le renderer (utile si endpoint compat ne renvoie pas meta.standard)
    meta: { ...(payload?.meta || {}), standard: payload?.meta?.standard || std },
    organizationName: org || payload?.organizationName,
    siteLabel: siteLabel || payload?.siteLabel,
    appName: 'QHSE Control Africa'
  });

  const base = overrides?.filenameBase ? String(overrides.filenameBase) : `rapport-${std}-pilotage-premium`;
  await downloadAuditIsoPdfFromHtml(html, base);
}

/**
 * @param {{
 *   periodMonths: number;
 *   siteLabel: string;
 *   conformity: number;
 *   counts: Record<string, unknown>;
 *   kpis: Record<string, unknown>;
 *   auditLineSeries: { label: string; value: number }[];
 *   goalRows: { label: string; realText: string; goalText: string }[];
 * }} ctx
 */
export async function downloadPerformanceQhsePdf(ctx) {
  const docTitle = 'Rapport de performance QHSE';
  const period = `Derniers ${ctx.periodMonths} mois (audits) · ${escapeHtml(ctx.siteLabel || 'Périmètre')}`;

  const kpiRows = (ctx.goalRows || [])
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.label)}</td><td><strong>${escapeHtml(r.realText)}</strong></td><td>${escapeHtml(r.goalText)}</td></tr>`
    )
    .join('');

  const trendRows = (ctx.auditLineSeries || [])
    .map((p) => `<tr><td>${escapeHtml(p.label)}</td><td><strong>${escapeHtml(String(p.value))} %</strong></td></tr>`)
    .join('');

  const counts = ctx.counts || {};
  const kpis = ctx.kpis || {};

  const page1 = `
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    <p class="qhse-premium-muted">Synthèse des indicateurs de performance pour la période couverte.</p>
    <p class="qhse-premium-muted"><strong>Période :</strong> ${period}</p>
    <h2 class="qhse-premium-h2">Indicateurs clés</h2>
    <div class="qhse-premium-kpi-grid">
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(ctx.conformity ?? '0'))}%</div><div class="qhse-premium-kpi-lbl">Niveau de conformité (indice)</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(kpis.auditScoreAvg ?? 'N/A'))}</div><div class="qhse-premium-kpi-lbl">Score audit moyen</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(counts.actionsOverdue ?? '0'))}</div><div class="qhse-premium-kpi-lbl">Actions en retard</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(counts.nonConformitiesOpen ?? '0'))}</div><div class="qhse-premium-kpi-lbl">NC ouvertes</div></div>
    </div>
    <h2 class="qhse-premium-h2">Indicateurs et objectifs</h2>
    <table class="qhse-premium-table">
      <thead><tr><th>Indicateur</th><th>Valeur</th><th>Objectif</th></tr></thead>
      <tbody>${kpiRows || `<tr><td colspan="3" class="qhse-premium-muted">Non disponible</td></tr>`}</tbody>
    </table>
    <p class="qhse-premium-muted" style="margin-top:10px">Les graphiques de l'écran ne sont pas reproduits ici. La tendance du score audit est donnée en tableau page suivante.</p>
  `;

  const page2 = `
    <h2 class="qhse-premium-h2">Analyse</h2>
    <h3 class="qhse-premium-h3">Tendance du score audit (série mensuelle)</h3>
    <table class="qhse-premium-table">
      <thead><tr><th>Mois</th><th>Score moyen %</th></tr></thead>
      <tbody>${trendRows || `<tr><td colspan="2" class="qhse-premium-muted">Aucune donnée sérielle.</td></tr>`}</tbody>
    </table>
    <h3 class="qhse-premium-h3">Volumes (extraits système)</h3>
    <table class="qhse-premium-table">
      <tbody>
        <tr><td>Incidents (échantillon chargé)</td><td>${escapeHtml(String(counts.incidentsTotal ?? '0'))}</td></tr>
        <tr><td>Actions</td><td>${escapeHtml(String(counts.actionsTotal ?? '0'))}</td></tr>
        <tr><td>Audits</td><td>${escapeHtml(String(counts.auditsTotal ?? '0'))}</td></tr>
        <tr><td>Incidents 30 jours</td><td>${escapeHtml(String(counts.incidentsLast30Days ?? '0'))}</td></tr>
      </tbody>
    </table>
    <h2 class="qhse-premium-h2">Conclusion</h2>
    <p class="qhse-premium-muted">Document d'appui à la revue de direction. Données figées à l'export.</p>
  `;

  const html = assemblePremiumPdfDocument(docTitle, [page1, page2], {
    company: ctx.siteLabel || '',
    siteLabel: ctx.siteLabel || '',
    reportDate: formatQhsePdfGenerationDate(),
    coverSubtitle: 'Pilotage performance'
  });
  await downloadQhseChromePdf(html, 'rapport-performance-qhse.pdf', {
    margin: [12, 12, 16, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });
}

/**
 * @param {Record<string, unknown>} data : réponse /api/reports/summary
 */
export async function downloadAnalyticsSummaryPdf(data) {
  const docTitle = 'Synthèse analytique QHSE';
  const gen = data?.generatedAt
    ? new Date(String(data.generatedAt)).toLocaleString('fr-FR')
    : new Date().toLocaleString('fr-FR');
  const counts = data?.counts || {};
  const kpis = data?.kpis || {};

  const page1 = `
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    <p class="qhse-premium-muted">Agrégation issue de l'API synthèse. Horodatage : ${escapeHtml(gen)}.</p>
    <h2 class="qhse-premium-h2">Indicateurs clés</h2>
    <div class="qhse-premium-kpi-grid">
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(kpis.auditScoreAvg ?? 'N/A'))}</div><div class="qhse-premium-kpi-lbl">Score audit moyen</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(counts.actionsOverdue ?? '0'))}</div><div class="qhse-premium-kpi-lbl">Actions en retard</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(counts.nonConformitiesOpen ?? '0'))}</div><div class="qhse-premium-kpi-lbl">NC ouvertes</div></div>
      <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${escapeHtml(String(counts.incidentsLast30Days ?? '0'))}</div><div class="qhse-premium-kpi-lbl">Incidents 30 jours</div></div>
    </div>
  `;

  const alerts = Array.isArray(data.priorityAlerts) ? data.priorityAlerts.slice(0, 12) : [];
  const alertRows = alerts.length
    ? alerts
        .map(
          (a) =>
            `<tr><td>${escapeHtml(String(a.code || 'N/A'))}</td><td>${escapeHtml(String(a.message || ''))}</td><td>${escapeHtml(String(a.level || ''))}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="3" class="qhse-premium-muted">Aucune alerte.</td></tr>`;

  const page2 = `
    <h2 class="qhse-premium-h2">Analyse</h2>
    <h3 class="qhse-premium-h3">Points de vigilance (alertes)</h3>
    <table class="qhse-premium-table"><thead><tr><th>Code</th><th>Message</th><th>Niveau</th></tr></thead><tbody>${alertRows}</tbody></table>
    <p class="qhse-premium-muted" style="margin-top:12px">Les graphiques du cockpit ne sont pas inclus. Pour la série audits, utiliser l'export Performance.</p>
    <h2 class="qhse-premium-h2">Conclusion</h2>
    <p class="qhse-premium-muted">Vue instantanée à la génération. Usage interne.</p>
  `;

  const html = assemblePremiumPdfDocument(docTitle, [page1, page2], {
    reportDate: formatQhsePdfGenerationDate(),
    coverSubtitle: 'Cockpit analytique'
  });
  await downloadQhseChromePdf(html, 'analytics-synthese-qhse.pdf', {
    margin: [12, 12, 16, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });
}

/**
 * @param {Record<string, unknown>} data
 * @param {Record<string, unknown>} meta
 */
export async function downloadAnalyticsPeriodicPdf(data, meta) {
  const docTitle = 'Reporting périodique QHSE';
  const summary = data?.summary || {};
  const start = meta?.startDate ? formatPdfIsoDate(meta.startDate) : 'Non disponible';
  const end = meta?.endDate ? formatPdfIsoDate(meta.endDate) : 'Non disponible';

  const keys = Object.keys(summary);
  const sumRows = keys.length
    ? keys
        .map(
          (k) =>
            `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(summary[k] ?? 'Non disponible'))}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="2" class="qhse-premium-muted">Résumé vide.</td></tr>`;

  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const alertRows = alerts.length
    ? alerts
        .slice(0, 20)
        .map(
          (a) =>
            `<tr><td>${escapeHtml(String(a.code || 'Non disponible'))}</td><td>${escapeHtml(String(a.message || ''))}</td><td>${escapeHtml(String(a.level || ''))}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="3" class="qhse-premium-muted">Aucune alerte.</td></tr>`;

  const page1 = `
    <h2 class="qhse-premium-h2">Résumé exécutif</h2>
    <p class="qhse-premium-muted"><strong>Période :</strong> ${escapeHtml(start)} à ${escapeHtml(end)}</p>
    <h2 class="qhse-premium-h2">Indicateurs agrégés</h2>
    <table class="qhse-premium-table"><thead><tr><th>Indicateur</th><th>Valeur</th></tr></thead><tbody>${sumRows}</tbody></table>
  `;

  const page2 = `
    <h2 class="qhse-premium-h2">Analyse</h2>
    <h3 class="qhse-premium-h3">Alertes sur la période</h3>
    <table class="qhse-premium-table"><thead><tr><th>Code</th><th>Message</th><th>Niveau</th></tr></thead><tbody>${alertRows}</tbody></table>
    <h2 class="qhse-premium-h2">Conclusion</h2>
    <p class="qhse-premium-muted">Synthèse périodique. Données limitées au périmètre interrogé.</p>
  `;

  const html = assemblePremiumPdfDocument(docTitle, [page1, page2], {
    reportDate: formatQhsePdfGenerationDate(),
    coverSubtitle: 'Reporting périodique'
  });
  await downloadQhseChromePdf(html, 'reporting-periodique-qhse.pdf', {
    margin: [12, 12, 16, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });
}

function formatPdfIsoDate(v) {
  try {
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString('fr-FR');
  } catch {
    return String(v);
  }
}
