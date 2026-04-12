/**
 * Exports PDF premium — Registre risques, incidents, performance, analytics.
 */

import { escapeHtml } from '../utils/escapeHtml.js';
import {
  assembleQhsePdfDocument,
  chunkRowsForPdf,
  downloadQhseChromePdf,
  QHSE_PDF_EMPTY_MESSAGE
} from '../utils/qhsePdfChrome.js';
import {
  parseRiskMatrixGp,
  riskCriticalityFromMeta,
  riskTierFromGp
} from '../components/riskMatrixPanel.js';
import { sortRisksByPriority } from '../utils/risksRegisterModel.js';

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
 * @param {unknown[]} risks — lignes UI registre (title, meta, type, status, responsible…)
 * @param {{ siteLabel?: string }} [opts]
 */
export async function downloadRisksRegisterPdf(risks, opts = {}) {
  const list = Array.isArray(risks) ? [...risks] : [];
  const sorted = sortRisksByPriority(list);
  const counts = countRiskTiersPdf(list);
  const docTitle = 'Registre des risques';
  const siteNote = opts.siteLabel
    ? `<p class="qhse-chrome-muted"><strong>Périmètre :</strong> ${escapeHtml(opts.siteLabel)}</p>`
    : '';

  const summary = `
    <h1 class="qhse-chrome-h1">REGISTRE DES RISQUES</h1>
    ${siteNote}
    <div class="qhse-chrome-kpi-grid">
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val" style="color:#991b1b">${counts.critique}</div><div class="qhse-chrome-kpi-lbl">Critiques</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val" style="color:#c2410c">${counts.eleve}</div><div class="qhse-chrome-kpi-lbl">Élevés</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val" style="color:#ca8a04">${counts.moyen}</div><div class="qhse-chrome-kpi-lbl">Moyens</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val" style="color:#166534">${counts.faible}</div><div class="qhse-chrome-kpi-lbl">Faibles</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${counts.sans}</div><div class="qhse-chrome-kpi-lbl">Sans G×P</div></div>
    </div>
  `;

  const grid = buildRiskMatrixCounts(list);
  let matrixHtml = '<table class="qhse-chrome-table qhse-matrix-table"><thead><tr><th>G \\ P</th>';
  for (let p = 1; p <= 5; p += 1) {
    matrixHtml += `<th>P${p}</th>`;
  }
  matrixHtml += '</tr></thead><tbody>';
  for (let g = 1; g <= 5; g += 1) {
    matrixHtml += `<tr><th>G${g}</th>`;
    for (let p = 1; p <= 5; p += 1) {
      const n = grid[g - 1][p - 1];
      const bg = matrixCellStyle(g, p);
      matrixHtml += `<td style="background:${bg}"><strong>${n || '—'}</strong></td>`;
    }
    matrixHtml += '</tr>';
  }
  matrixHtml += '</tbody></table>';

  const matrixSection = `
    <h2 class="qhse-chrome-h2">Matrice G × P (effectifs par case)</h2>
    <p class="qhse-chrome-muted">Nombre de risques positionnés par gravité (G) et probabilité (P).</p>
    ${matrixHtml}
  `;

  function rowHtml(r) {
    const gp = parseRiskMatrixGp(r?.meta);
    const g = gp ? gp.g : '—';
    const p = gp ? gp.p : '—';
    const prod = riskGpProduct(r);
    const ref = r?.id != null ? String(r.id).slice(0, 12) : '—';
    const st = String(r?.status || '—');
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
      <td>${escapeHtml(String(r?.title || '—'))}</td>
      <td>${escapeHtml(String(r?.type || '—'))}</td>
      <td style="text-align:center">${escapeHtml(String(g))}</td>
      <td style="text-align:center">${escapeHtml(String(p))}</td>
      <td style="text-align:center">${prod != null ? escapeHtml(String(prod)) : '—'}</td>
      <td><span class="qhse-chrome-badge" style="background:${badgeBg};color:${badgeFg}">${escapeHtml(st)}</span></td>
      <td>${escapeHtml(String(r?.responsible || '—'))}</td>
    </tr>`;
  }

  const chunks = chunkRowsForPdf(sorted, 16);
  const pages = [];
  chunks.forEach((chunk, idx) => {
    if (idx === 0) {
      pages.push(
        `${summary}${matrixSection}<h2 class="qhse-chrome-h2">Détail du registre</h2>${
          chunk.length
            ? `<table class="qhse-chrome-table"><thead><tr><th>Réf.</th><th>Titre</th><th>Cat.</th><th>G</th><th>P</th><th>G×P</th><th>Statut</th><th>Resp.</th></tr></thead><tbody>${chunk.map(rowHtml).join('')}</tbody></table>`
            : `<p class="qhse-chrome-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`
        }`
      );
    } else {
      pages.push(
        `<h2 class="qhse-chrome-h2">Détail du registre (suite)</h2><table class="qhse-chrome-table"><thead><tr><th>Réf.</th><th>Titre</th><th>Cat.</th><th>G</th><th>P</th><th>G×P</th><th>Statut</th><th>Resp.</th></tr></thead><tbody>${chunk.map(rowHtml).join('')}</tbody></table>`
      );
    }
  });
  if (!pages.length) {
    pages.push(`${summary}${matrixSection}<p class="qhse-chrome-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`);
  }

  const html = assembleQhsePdfDocument(docTitle, pages);
  await downloadQhseChromePdf(html, 'registre-risques.pdf', {
    margin: [12, 10, 16, 10],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  });
}

/**
 * @param {unknown[]} incidents
 * @param {{ filtersSummary?: string }} [opts]
 */
export async function downloadIncidentsRegisterPdf(incidents, opts = {}) {
  const list = Array.isArray(incidents) ? incidents : [];
  const docTitle = 'Registre des incidents';
  const fil = opts.filtersSummary
    ? `<p class="qhse-chrome-muted"><strong>Filtres :</strong> ${escapeHtml(opts.filtersSummary)}</p>`
    : '';

  const crit = list.filter((i) => String(i?.severity || '').toLowerCase().includes('crit')).length;
  const open = list.filter((i) => !/cl[oô]tur|clos|ferm/i.test(String(i?.status || ''))).length;

  const summary = `
    <h1 class="qhse-chrome-h1">REGISTRE DES INCIDENTS</h1>
    ${fil}
    <div class="qhse-chrome-kpi-grid">
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${list.length}</div><div class="qhse-chrome-kpi-lbl">Fiches (vue)</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val" style="color:#991b1b">${crit}</div><div class="qhse-chrome-kpi-lbl">Gravité critique</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val" style="color:#c2410c">${open}</div><div class="qhse-chrome-kpi-lbl">Non clôturés</div></div>
    </div>
  `;

  function rowHtml(inc) {
    const ref = escapeHtml(String(inc?.ref ?? inc?.id ?? '—'));
    const date = inc?.createdAtMs
      ? new Date(inc.createdAtMs).toLocaleDateString('fr-FR')
      : inc?.createdAt
        ? new Date(String(inc.createdAt)).toLocaleDateString('fr-FR')
        : '—';
    const desc = String(inc?.description || inc?.title || '—').slice(0, 120);
    return `<tr>
      <td>${ref}</td>
      <td>${escapeHtml(String(inc?.type || '—'))}</td>
      <td>${escapeHtml(String(inc?.status || '—'))}</td>
      <td>${escapeHtml(String(inc?.severity || '—'))}</td>
      <td>${escapeHtml(String(inc?.site || '—'))}</td>
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(desc)}</td>
    </tr>`;
  }

  const chunks = chunkRowsForPdf(list, 18);
  const pages = [];
  chunks.forEach((chunk, idx) => {
    const table = chunk.length
      ? `<table class="qhse-chrome-table"><thead><tr><th>Réf.</th><th>Type</th><th>Statut</th><th>Gravité</th><th>Site</th><th>Date</th><th>Description</th></tr></thead><tbody>${chunk.map(rowHtml).join('')}</tbody></table>`
      : `<p class="qhse-chrome-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`;
    pages.push(idx === 0 ? `${summary}<h2 class="qhse-chrome-h2">Tableau détaillé</h2>${table}` : `<h2 class="qhse-chrome-h2">Tableau détaillé (suite)</h2>${table}`);
  });
  if (!pages.length) pages.push(`${summary}<p class="qhse-chrome-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`);

  const html = assembleQhsePdfDocument(docTitle, pages);
  await downloadQhseChromePdf(html, 'registre-incidents.pdf', {
    margin: [12, 10, 16, 10],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  });
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
  const period = `Derniers ${ctx.periodMonths} mois (graphique audits) · ${escapeHtml(ctx.siteLabel || 'Périmètre')}`;

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
    <h1 class="qhse-chrome-h1">RAPPORT DE PERFORMANCE QHSE</h1>
    <p class="qhse-chrome-muted"><strong>Période couverte :</strong> ${period}</p>
    <div class="qhse-chrome-kpi-grid">
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(ctx.conformity ?? '—'))}%</div><div class="qhse-chrome-kpi-lbl">Conformité (indice)</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(kpis.auditScoreAvg ?? '—'))}</div><div class="qhse-chrome-kpi-lbl">Score audit moy.</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(counts.actionsOverdue ?? '—'))}</div><div class="qhse-chrome-kpi-lbl">Actions retard</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(counts.nonConformitiesOpen ?? '—'))}</div><div class="qhse-chrome-kpi-lbl">NC ouvertes</div></div>
    </div>
    <h2 class="qhse-chrome-h2">Indicateurs vs objectifs</h2>
    <table class="qhse-chrome-table">
      <thead><tr><th>Indicateur</th><th>Valeur</th><th>Objectif</th></tr></thead>
      <tbody>${kpiRows || `<tr><td colspan="3" class="qhse-chrome-muted">—</td></tr>`}</tbody>
    </table>
    <p class="qhse-chrome-muted" style="margin-top:10px">Les graphiques interactifs de l’écran ne sont pas vectorisés ici ; tendance score audit synthétisée ci-dessous.</p>
  `;

  const page2 = `
    <h2 class="qhse-chrome-h2">Tendance score audit (série mensuelle)</h2>
    <table class="qhse-chrome-table">
      <thead><tr><th>Mois</th><th>Score moy. %</th></tr></thead>
      <tbody>${trendRows || `<tr><td colspan="2" class="qhse-chrome-muted">Aucune donnée sérielle.</td></tr>`}</tbody>
    </table>
    <h2 class="qhse-chrome-h2">Volumes bruts (extraits API)</h2>
    <table class="qhse-chrome-table">
      <tbody>
        <tr><td>Incidents (échantillon chargé)</td><td>${escapeHtml(String(counts.incidentsTotal ?? '—'))}</td></tr>
        <tr><td>Actions</td><td>${escapeHtml(String(counts.actionsTotal ?? '—'))}</td></tr>
        <tr><td>Audits</td><td>${escapeHtml(String(counts.auditsTotal ?? '—'))}</td></tr>
        <tr><td>Incidents 30 j</td><td>${escapeHtml(String(counts.incidentsLast30Days ?? '—'))}</td></tr>
      </tbody>
    </table>
  `;

  const html = assembleQhsePdfDocument(docTitle, [page1, page2]);
  await downloadQhseChromePdf(html, 'rapport-performance-qhse.pdf', {
    margin: [12, 10, 16, 10],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });
}

/**
 * @param {Record<string, unknown>} data — réponse /api/reports/summary
 */
export async function downloadAnalyticsSummaryPdf(data) {
  const docTitle = 'Synthèse analytique QHSE';
  const gen = data?.generatedAt
    ? new Date(String(data.generatedAt)).toLocaleString('fr-FR')
    : new Date().toLocaleString('fr-FR');
  const counts = data?.counts || {};
  const kpis = data?.kpis || {};

  const kpiGrid = `
    <h1 class="qhse-chrome-h1">RAPPORT DE PERFORMANCE QHSE</h1>
    <p class="qhse-chrome-muted"><strong>Synthèse API</strong> — généré ${escapeHtml(gen)}</p>
    <h2 class="qhse-chrome-h2">KPIs principaux</h2>
    <div class="qhse-chrome-kpi-grid">
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(kpis.auditScoreAvg ?? '—'))}</div><div class="qhse-chrome-kpi-lbl">Score audit moy.</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(counts.actionsOverdue ?? '—'))}</div><div class="qhse-chrome-kpi-lbl">Actions retard</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(counts.nonConformitiesOpen ?? '—'))}</div><div class="qhse-chrome-kpi-lbl">NC ouvertes</div></div>
      <div class="qhse-chrome-kpi"><div class="qhse-chrome-kpi-val">${escapeHtml(String(counts.incidentsLast30Days ?? '—'))}</div><div class="qhse-chrome-kpi-lbl">Incidents 30 j</div></div>
    </div>
  `;

  const alerts = Array.isArray(data.priorityAlerts) ? data.priorityAlerts.slice(0, 12) : [];
  const alertRows = alerts.length
    ? alerts
        .map(
          (a) =>
            `<tr><td>${escapeHtml(String(a.code || '—'))}</td><td>${escapeHtml(String(a.message || ''))}</td><td>${escapeHtml(String(a.level || ''))}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="3" class="qhse-chrome-muted">Aucune alerte.</td></tr>`;

  const page2 = `
    <h2 class="qhse-chrome-h2">Alertes prioritaires</h2>
    <table class="qhse-chrome-table"><thead><tr><th>Code</th><th>Message</th><th>Niveau</th></tr></thead><tbody>${alertRows}</tbody></table>
    <p class="qhse-chrome-muted" style="margin-top:12px">Les graphiques du cockpit en ligne ne sont pas inclus ; exportez depuis Performance pour la série audits si besoin.</p>
  `;

  const html = assembleQhsePdfDocument(docTitle, [kpiGrid, page2]);
  await downloadQhseChromePdf(html, 'analytics-synthese-qhse.pdf', {
    margin: [12, 10, 16, 10],
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
  const start = meta?.startDate ? formatPdfIsoDate(meta.startDate) : '—';
  const end = meta?.endDate ? formatPdfIsoDate(meta.endDate) : '—';

  const keys = Object.keys(summary);
  const sumRows = keys.length
    ? keys
        .map(
          (k) =>
            `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(summary[k] ?? '—'))}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="2" class="qhse-chrome-muted">Résumé vide.</td></tr>`;

  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const alertRows = alerts.length
    ? alerts
        .slice(0, 20)
        .map(
          (a) =>
            `<tr><td>${escapeHtml(String(a.code || '—'))}</td><td>${escapeHtml(String(a.message || ''))}</td><td>${escapeHtml(String(a.level || ''))}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="3" class="qhse-chrome-muted">Aucune alerte.</td></tr>`;

  const page1 = `
    <h1 class="qhse-chrome-h1">RAPPORT DE PERFORMANCE QHSE</h1>
    <p class="qhse-chrome-muted"><strong>Période :</strong> ${escapeHtml(start)} → ${escapeHtml(end)}</p>
    <h2 class="qhse-chrome-h2">Indicateurs agrégés</h2>
    <table class="qhse-chrome-table"><thead><tr><th>Indicateur</th><th>Valeur</th></tr></thead><tbody>${sumRows}</tbody></table>
  `;

  const page2 = `
    <h2 class="qhse-chrome-h2">Alertes (période)</h2>
    <table class="qhse-chrome-table"><thead><tr><th>Code</th><th>Message</th><th>Niveau</th></tr></thead><tbody>${alertRows}</tbody></table>
  `;

  const html = assembleQhsePdfDocument(docTitle, [page1, page2]);
  await downloadQhseChromePdf(html, 'reporting-periodique-qhse.pdf', {
    margin: [12, 10, 16, 10],
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
