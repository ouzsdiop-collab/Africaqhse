/**
 * PDF ISO / conformité : chargé à la demande (html2canvas + jsPDF) pour alléger le bundle page ISO / Audits.
 * Même pipeline hôte + capture que les exports chrome (registre risques, performance).
 * `qhsePdfChrome` est importé dynamiquement à l’export pour ne pas lier ce chunk lourd au parse du module.
 */

import { generatePremiumPdf } from '../utils/pdfPremiumTemplate.js';

export async function downloadAuditIsoPdfFromHtml(htmlString, fileBase) {
  const { downloadQhseChromePdf } = await import('../utils/qhsePdfChrome.js');
  const safeName = String(fileBase || 'audit-iso').replace(/[^\w.-]+/g, '_');
  const pdfName = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
  await downloadQhseChromePdf(htmlString, pdfName, {
    margin: [14, 12, 18, 12],
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });
}

/**
 * @param {{
 *   auditRef: string;
 *   site: string;
 *   auditeur: string;
 *   date: string;
 *   score: number;
 *   checklist: { point: string; conforme: boolean; partial?: boolean; proofRef?: string; section?: string; comment?: string; photo?: string }[];
 *   proofs: { name: string; status: string }[];
 *   treatmentRows: { nc: string; action: string; owner: string; due: string; priority?: string }[];
 *   traceRows: { who: string; when: string; action: string; comment: string }[];
 *   signerName?: string;
 *   normScores?: { norm: string; score: number }[];
 * }} data
 */
export function buildAuditIsoPdfHtml(data) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const score = Number(data.score);
  const scoreLabel = Number.isFinite(score) ? `${Math.round(score)} / 100` : 'Non disponible';
  let interp = 'Non disponible';
  if (Number.isFinite(score)) {
    if (score >= 85) interp = 'Excellent';
    else if (score >= 70) interp = 'Bon';
    else if (score >= 50) interp = 'À améliorer';
    else interp = 'Critique';
  }

  const itemStatus = (c) => {
    if (c.partial) return { t: 'Partiel', bg: '#fef9c3', fg: '#854d0e' };
    if (c.conforme) return { t: 'Conforme', bg: '#dcfce7', fg: '#166534' };
    return { t: 'Non conforme', bg: '#fee2e2', fg: '#991b1b' };
  };

  const bySection = new Map();
  for (const c of data.checklist || []) {
    const sec = (c.section && String(c.section).trim()) || 'Checklist';
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec).push(c);
  }
  const sections = [...bySection.keys()].sort((a, b) => a.localeCompare(b, 'fr'));

  let checklistHtml = '';
  let idx = 0;
  for (const sec of sections) {
    checklistHtml += `<h3 class="qhse-premium-h3">${esc(sec)}</h3>`;
    for (const c of bySection.get(sec) || []) {
      idx += 1;
      const st = itemStatus(c);
      const proof = c.proofRef ? esc(c.proofRef) : 'Non disponible';
      const obs = c.comment ? `<p class="qhse-premium-obs"><strong>Observation :</strong> ${esc(c.comment)}</p>` : '';
      const photo =
        c.photo && /^data:image\//i.test(String(c.photo))
          ? `<div class="qhse-premium-photo"><img src="${esc(c.photo)}" alt="" /></div>`
          : '';
      checklistHtml += `
        <div class="qhse-premium-check-item">
          <div class="qhse-premium-check-head">
            <span class="qhse-premium-check-no">${idx}.</span>
            <span class="qhse-premium-check-title">${esc(c.point)}</span>
            <span class="qhse-premium-badge" style="background:${st.bg};color:${st.fg}">${esc(st.t)}</span>
          </div>
          <p class="qhse-premium-preuve"><strong>Preuves associées :</strong> ${proof}</p>
          ${obs}
          ${photo}
        </div>`;
    }
  }

  const strengths = (data.checklist || []).filter((c) => c.conforme && !c.partial).slice(0, 5);
  const weak = (data.checklist || []).filter((c) => !c.conforme || c.partial).slice(0, 5);

  const strengthsRows = strengths
    .map((c, i) => `<tr><td class="qhse-premium-td-n">${i + 1}</td><td>${esc(c.point)}</td></tr>`)
    .join('');
  const weakRows = weak
    .map((c, i) => `<tr><td class="qhse-premium-td-n">${i + 1}</td><td>${esc(c.point)}</td></tr>`)
    .join('');

  const proofs = (data.proofs || [])
    .map((p) => `<li>${esc(p.name)} : <span class="qhse-premium-muted">${esc(p.status)}</span></li>`)
    .join('');
  const ncs = (data.treatmentRows || [])
    .map(
      (r) =>
        `<tr><td>${esc(r.nc)}</td><td>${esc(r.action)}</td><td>${esc(r.owner)}</td><td>${esc(r.due)}</td><td>${esc(r.priority || 'Moyenne')}</td></tr>`
    )
    .join('');
  const traces = (data.traceRows || [])
    .map(
      (t) =>
        `<tr><td>${esc(t.who)}</td><td>${esc(t.when)}</td><td>${esc(t.action)}</td><td>${esc(t.comment)}</td></tr>`
    )
    .join('');

  const norms = (data.normScores || []).map(
    (n) =>
      `<tr><td>${esc(n.norm)}</td><td style="font-weight:700">${esc(Math.round(Number(n.score) || 0))} / 100</td></tr>`
  );

  const summaryHtml = `
    <p><strong>Référence :</strong> ${esc(data.auditRef)}</p>
    <p><strong>Site audité :</strong> ${esc(data.site)}</p>
    <p><strong>Auditeur responsable :</strong> ${esc(data.auditeur)}</p>
    <p><strong>Score brut :</strong> ${esc(scoreLabel)}</p>
    <p><strong>Lecture du score :</strong> ${esc(interp)}</p>
    <p class="qhse-premium-muted">Extraits issus de la checklist du module Audits.</p>
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:12px">
      <div style="flex:1;min-width:200px">
        <h3 class="qhse-premium-h3">Points forts</h3>
        <table class="qhse-premium-table">${strengthsRows || '<tr><td class="qhse-premium-td-n">-</td><td class="qhse-premium-muted">Aucun extrait</td></tr>'}</table>
      </div>
      <div style="flex:1;min-width:200px">
        <h3 class="qhse-premium-h3">Points de vigilance</h3>
        <table class="qhse-premium-table">${weakRows || '<tr><td class="qhse-premium-td-n">-</td><td class="qhse-premium-muted">Aucun extrait</td></tr>'}</table>
      </div>
    </div>`;

  const normsSection =
    norms.length > 0
      ? `<table class="qhse-premium-table"><tr><th>Norme</th><th>Score</th></tr>${norms.join('')}</table>`
      : '<p class="qhse-premium-muted">Aucune norme agrégée pour cet export.</p>';

  const proofsSection = `<ul class="qhse-premium-ul" style="margin-top:0">${proofs || '<li class="qhse-premium-muted">Non disponible</li>'}</ul>`;

  const ncActions = `<table class="qhse-premium-table">
      <tr><th>NC</th><th>Action</th><th>Responsable</th><th>Échéance</th><th>Priorité</th></tr>
      ${ncs || '<tr><td colspan="5" class="qhse-premium-muted">Non disponible</td></tr>'}
    </table>`;

  const traceSection = `<table class="qhse-premium-table">
      <tr><th>Intervenant</th><th>Date / heure</th><th>Action</th><th>Commentaire</th></tr>
      ${traces || '<tr><td colspan="4" class="qhse-premium-muted">Non disponible</td></tr>'}
    </table>`;

  const conclusionHtml = `<p><strong>Signature / visa :</strong> ${esc(data.signerName || 'À compléter par le responsable audit')}</p>
    <p class="qhse-premium-muted">Le présent document reflète l'état des données à la date d'édition indiquée en couverture.</p>`;

  return generatePremiumPdf({
    title: "Rapport d'audit QHSE",
    company: String(data.site || ''),
    date: String(data.date || ''),
    subtitle: 'Synthèse terrain et exigences ISO',
    summary: summaryHtml,
    narrative: null,
    compliancePct: Number.isFinite(score) ? score : null,
    sections: [
      { title: 'Scores par norme (indicatif)', html: normsSection },
      { title: 'Preuves associées', html: proofsSection },
      { title: 'Constats et checklist', html: checklistHtml || '<p class="qhse-premium-muted">Aucun point.</p>' }
    ],
    actions: ncActions,
    traceability: traceSection,
    conclusion: conclusionHtml,
    footer: `QHSE Control Africa. Confidentiel. Généré le ${esc(new Date().toLocaleString('fr-FR'))}.`
  });
}

/**
 * @param {{
 *   globalScoreLabel?: string;
 *   gapsLabel?: string;
 *   normScores?: { norm: string; score: number }[];
 *   requirementLines?: { clause: string; title: string; status: string }[];
 * }} data
 */
export function buildIsoConformityPdfHtml(data) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const norms = (data.normScores || []).map(
    (n) =>
      `<tr><td>${esc(n.norm)}</td><td style="font-weight:700">${esc(Math.round(Number(n.score) || 0))} / 100</td></tr>`
  );
  const reqs = (data.requirementLines || []).slice(0, 40).map(
    (r) =>
      `<tr><td>${esc(r.clause)}</td><td>${esc(r.title)}</td><td>${esc(r.status)}</td></tr>`
  );
  const summaryHtml = `
    <p><strong>Score global (vue application) :</strong> ${esc(data.globalScoreLabel || 'Non disponible')}</p>
    <p><strong>Exigences en écart (vue application) :</strong> ${esc(data.gapsLabel || 'Non disponible')}</p>`;

  const normsSection = `<table class="qhse-premium-table"><tr><th>Référentiel</th><th>Score indicatif</th></tr>${
    norms.length ? norms.join('') : '<tr><td colspan="2" class="qhse-premium-muted">Non disponible</td></tr>'
  }</table>`;

  const regSection = `<p class="qhse-premium-muted">Jusqu'à 40 lignes issues du tableau affiché sur la page ISO au moment de l'export.</p>
    <table class="qhse-premium-table">
      <tr><th>Clause</th><th>Exigence</th><th>Statut</th></tr>
      ${reqs.length ? reqs.join('') : '<tr><td colspan="3" class="qhse-premium-muted">Ouvrez le registre sur la page ISO puis relancez l\'export pour alimenter ce tableau.</td></tr>'}
    </table>`;

  const pctMatch = String(data.globalScoreLabel || '').match(/(\d+(?:[.,]\d+)?)/);
  const compliancePct = pctMatch ? Math.round(Number(pctMatch[1].replace(',', '.'))) : null;

  return generatePremiumPdf({
    title: 'Rapport de conformité ISO',
    date: new Date().toLocaleString('fr-FR'),
    subtitle: 'Vue pilotage registre et scores',
    summary: summaryHtml,
    narrative: null,
    compliancePct: Number.isFinite(compliancePct) ? compliancePct : null,
    sections: [
      { title: 'Scores par référentiel', html: normsSection },
      { title: 'Registre des exigences (extrait)', html: regSection }
    ],
    conclusion:
      '<p class="qhse-premium-muted" style="margin:0">Les indicateurs correspondent à la vue application à la date d\'édition.</p>',
    footer: `QHSE Control Africa. Confidentiel. ${esc(new Date().toLocaleString('fr-FR'))}.`
  });
}

/**
 * Rapport « audit IA » : synthèse multi-blocs (même pipeline PDF que la conformité ISO).
 * @param {ReturnType<typeof import('../services/isoAuditReport.service.js').buildIsoAuditReport>} report
 * @param {{ narrative?: { summary?: string; strengths?: string[]; weaknesses?: string[]; priorityActions?: string[]; confidence?: number } | null; narrativeSource?: 'ai' | 'fallback' | '' }} [opts]
 */
export function buildIsoAuditReportPdfHtml(report, opts = {}) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const cap = (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []);

  const ul = (items, fmt, max = 30) => {
    const rows = cap(items, max);
    if (!rows.length) return '<p class="qhse-premium-muted">Aucun élément.</p>';
    return `<ul class="qhse-premium-ul">${rows.map((it) => `<li>${fmt(it)}</li>`).join('')}</ul>`;
  };

  const conform = ul(
    report.conformingPoints || [],
    (x) =>
      `<strong>${esc(x.clause)}</strong> (${esc(x.normCode)}) - ${esc(x.title)}. <span class="qhse-premium-muted">${esc(x.detail)}</span>`,
    35
  );
  const nc = ul(report.nonConformities || [], (x) => `<strong>${esc(x.clause)}</strong> - ${esc(x.title)}. ${esc(x.detail)}`, 35);
  const partial = ul(report.partialGaps || [], (x) => `<strong>${esc(x.clause)}</strong> - ${esc(x.title)}. ${esc(x.detail)}`, 25);
  const miss = ul(
    report.missingEvidence || [],
    (x) => `<strong>${esc(x.clause)}</strong> - ${esc(x.title)} : ${esc(x.detail)}`,
    35
  );
  const acts = ul(
    report.priorityActions || [],
    (x) =>
      `${esc(x.title)} <span class="qhse-premium-muted">(${esc(x.status)})</span>${x.overdue ? ' <strong>(retard)</strong>' : ''}`,
    30
  );
  const risks = ul(
    report.criticalRisks || [],
    (x) => `${esc(x.ref || 'N/A')} - ${esc(x.title)} <span class="qhse-premium-muted">(${esc(x.label)})</span>`,
    25
  );

  const genAt = report.generatedAt
    ? new Date(report.generatedAt).toLocaleString('fr-FR')
    : new Date().toLocaleString('fr-FR');

  const narSrc =
    opts.narrativeSource === 'ai' ? 'ai' : opts.narrativeSource === 'fallback' ? 'fallback' : '';

  const summaryHtml = `
    <p><strong>Date de production :</strong> ${esc(genAt)}</p>
    <p><strong>Indicateurs :</strong> consolidé ${esc(String(report.score?.pct ?? 'N/A'))} %, statuts ${esc(String(report.score?.legacyPct ?? 'N/A'))} %, terrain ${esc(String(report.score?.operationalPct ?? 'N/A'))} %.</p>
    <p style="margin-top:10px">${esc(report.summary || '')}</p>`;

  const pct = report.score?.pct;
  const compliancePct = typeof pct === 'number' && Number.isFinite(pct) ? pct : null;

  return generatePremiumPdf({
    title: "Rapport d'audit (préparation certification)",
    date: genAt,
    subtitle: 'Synthèse registre, preuves et indicateurs terrain',
    summary: summaryHtml,
    narrative: opts.narrative ?? null,
    narrativeSource: narSrc,
    compliancePct,
    sections: [
      { title: 'Points conformes', html: conform },
      { title: 'Non-conformités', html: nc },
      { title: 'Écarts partiels', html: partial },
      { title: 'Preuves à renforcer', html: miss },
      { title: 'Risques critiques et très élevés', html: risks }
    ],
    actions: acts,
    conclusion:
      '<p class="qhse-premium-muted" style="margin:0">Document de travail. À valider par l\'auditeur ou la direction avant toute décision.</p>',
    footer: 'QHSE Control Africa. Confidentiel. Usage interne.'
  });
}
