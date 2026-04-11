/**
 * Extensions premium module Audits (terrain, PDF ISO client, workflow) — sans backend dédié.
 */

import { saveElementAsPdf, buildHtml2PdfOptions } from '../utils/html2pdfExport.js';
import { showToast } from './toast.js';

const PDF_BRAND = '#1D9E75';

const STYLE_ID = 'qhse-audit-premium-saas-styles';

const CSS = `
.audit-terrain-workflow{
  display:none;margin:0 0 16px;padding:12px 14px;border-radius:14px;
  border:1px solid rgba(45,212,191,.22);
  background:linear-gradient(165deg,rgba(13,148,136,.1),rgba(15,23,42,.45));
}
.audit-premium-page--terrain .audit-terrain-workflow{display:block}
.audit-terrain-workflow__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.audit-terrain-workflow__title{margin:0;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.audit-terrain-workflow__steps{display:flex;flex-wrap:wrap;gap:8px}
.audit-terrain-step{
  font-size:11px;font-weight:700;padding:8px 12px;border-radius:999px;
  border:1px solid rgba(148,163,184,.25);background:rgba(0,0,0,.15);color:var(--text2);
  cursor:pointer;transition:background .15s ease,border-color .15s ease,transform .12s ease;
}
.audit-terrain-step:hover{border-color:rgba(45,212,191,.4);transform:translateY(-1px)}
.audit-terrain-step--active{border-color:rgba(45,212,191,.5);background:rgba(45,212,191,.12);color:var(--text)}

.audit-constat-ex-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;padding-top:8px;border-top:1px dashed rgba(148,163,184,.15)}
.audit-constat-ex-actions .btn,.audit-constat-ex-actions .text-button{font-size:11px!important;padding:6px 10px!important}
.audit-severity-toggle{display:inline-flex;border-radius:8px;overflow:hidden;border:1px solid rgba(148,163,184,.2)}
.audit-severity-toggle button{
  border:none;background:transparent;color:var(--text2);font-size:10px;font-weight:800;padding:6px 10px;cursor:pointer;
}
.audit-severity-toggle button:first-child.audit-severity--on{background:rgba(45,212,191,.18);color:#99f6e4}
.audit-severity-toggle button:last-child.audit-severity--on{background:rgba(239,68,68,.2);color:#fecaca}

.audit-human-trace{margin-top:10px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.18);border:1px solid rgba(148,163,184,.12)}
.audit-human-trace-meta{font-size:11px;color:var(--text3);margin:0 0 6px;line-height:1.4}
.audit-human-trace-comment{width:100%;min-height:52px;box-sizing:border-box;border-radius:8px;border:1px solid rgba(148,163,184,.2);background:rgba(15,23,42,.6);color:var(--text);font:inherit;font-size:12px;padding:8px}

.audit-score-delta{display:block;font-size:12px;font-weight:800;margin-top:4px;letter-spacing:.02em}
.audit-score-delta--up{color:#6ee7b7;animation:audit-score-pulse .6s ease}
.audit-score-delta--down{color:#fca5a5;animation:audit-score-pulse .6s ease}
@keyframes audit-score-pulse{0%{opacity:.4;transform:translateY(2px)}100%{opacity:1;transform:translateY(0)}}

.audit-prio-audit-block .audit-cockpit-prio__detail{cursor:pointer;transition:opacity .15s}
.audit-prio-audit-block .audit-cockpit-prio__detail:hover{opacity:.88}

.audit-proof-gen-actions{margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.1)}
.audit-plan-row--click{cursor:pointer;transition:background .15s ease}
.audit-plan-row--click:hover{background:rgba(20,184,166,.08)}
`;

export function ensureAuditPremiumSaaSStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}

/**
 * @param {HTMLElement} pageRoot
 * @param {{ onActivate?: () => void }} [opts]
 */
export function createAuditTerrainWorkflowStrip(pageRoot, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'audit-terrain-workflow';
  wrap.setAttribute('role', 'navigation');
  wrap.setAttribute('aria-label', 'Workflow audit terrain');
  const steps = [
    { label: '1. Détection', sel: '.audit-cockpit-notifs' },
    { label: '2. Constat', sel: '.audit-cockpit-checklist' },
    { label: '3. Preuve', sel: '.audit-cockpit-proofs' },
    { label: '4. Validation', sel: '.audit-iso-trace-card' }
  ];
  let active = 0;
  const head = document.createElement('div');
  head.className = 'audit-terrain-workflow__head';
  const h = document.createElement('h4');
  h.className = 'audit-terrain-workflow__title';
  h.textContent = 'Parcours terrain';
  head.append(h);
  const row = document.createElement('div');
  row.className = 'audit-terrain-workflow__steps';
  const btns = [];
  steps.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'audit-terrain-step';
    b.textContent = s.label;
    b.addEventListener('click', () => {
      active = i;
      btns.forEach((x, j) => x.classList.toggle('audit-terrain-step--active', j === active));
      const el = pageRoot.querySelector(s.sel) || document.querySelector(s.sel);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      opts.onActivate?.();
    });
    btns.push(b);
    row.append(b);
  });
  if (btns[0]) btns[0].classList.add('audit-terrain-step--active');
  wrap.append(head, row);
  return wrap;
}

export async function downloadAuditIsoPdfFromHtml(htmlString, fileBase) {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-9999px';
  host.style.top = '0';
  host.style.width = '210mm';
  host.style.background = '#fff';
  host.innerHTML = htmlString;
  document.body.appendChild(host);
  const safeName = String(fileBase || 'audit-iso').replace(/[^\w-]+/g, '_');
  const pdfName = `${safeName}.pdf`;
  try {
    showToast('Génération du PDF en cours...', 'info');
    await saveElementAsPdf(
      host,
      pdfName,
      buildHtml2PdfOptions(pdfName, {
        margin: [14, 12, 18, 12],
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
    );
    showToast('PDF téléchargé avec succès', 'success');
  } catch (e) {
    console.error(e);
    showToast('Échec de la génération du PDF.', 'error');
    throw e;
  } finally {
    host.remove();
  }
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
  const scoreLabel = Number.isFinite(score) ? `${Math.round(score)} / 100` : '—';
  let interp = '—';
  if (Number.isFinite(score)) {
    if (score >= 85) interp = 'Excellent';
    else if (score >= 70) interp = 'Bon';
    else if (score >= 50) interp = 'À améliorer';
    else interp = 'Critique';
  }

  const itemStatus = (c) => {
    if (c.partial) return { t: '⚠ Partiel', bg: '#fef9c3', fg: '#854d0e' };
    if (c.conforme) return { t: '✓ Conforme', bg: '#dcfce7', fg: '#166534' };
    return { t: '✗ Non conforme', bg: '#fee2e2', fg: '#991b1b' };
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
    checklistHtml += `<h3 class="qhse-pdf-h3">${esc(sec)}</h3>`;
    for (const c of bySection.get(sec) || []) {
      idx += 1;
      const st = itemStatus(c);
      const proof = c.proofRef ? esc(c.proofRef) : '—';
      const obs = c.comment ? `<p class="qhse-pdf-obs"><strong>Observation :</strong> ${esc(c.comment)}</p>` : '';
      const photo =
        c.photo && /^data:image\//i.test(String(c.photo))
          ? `<div class="qhse-pdf-photo"><img src="${esc(c.photo)}" alt="" /></div>`
          : '';
      checklistHtml += `
        <div class="qhse-pdf-check-item">
          <div class="qhse-pdf-check-head">
            <span class="qhse-pdf-check-no">${idx}.</span>
            <span class="qhse-pdf-check-title">${esc(c.point)}</span>
            <span class="qhse-pdf-badge" style="background:${st.bg};color:${st.fg}">${esc(st.t)}</span>
          </div>
          <p class="qhse-pdf-preuve"><strong>Preuve / réf. :</strong> ${proof}</p>
          ${obs}
          ${photo}
        </div>`;
    }
  }

  const strengths = (data.checklist || []).filter((c) => c.conforme && !c.partial).slice(0, 5);
  const weak = (data.checklist || []).filter((c) => !c.conforme || c.partial).slice(0, 5);

  const strengthsRows = strengths
    .map((c, i) => `<tr><td class="qhse-pdf-td-n">${i + 1}</td><td>${esc(c.point)}</td></tr>`)
    .join('');
  const weakRows = weak
    .map((c, i) => `<tr><td class="qhse-pdf-td-n">${i + 1}</td><td>${esc(c.point)}</td></tr>`)
    .join('');

  const proofs = (data.proofs || [])
    .map((p) => `<li>${esc(p.name)} — <span class="qhse-pdf-muted">${esc(p.status)}</span></li>`)
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

  const gaugePct = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

  return `
<style>
  .qhse-pdf-root { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 10.5pt; color: #0f172a; background: #fff; line-height: 1.35; }
  .qhse-pdf-band { height: 10px; background: ${PDF_BRAND}; margin: -8px -8px 16px -8px; }
  .qhse-pdf-page { page-break-after: always; padding: 8px 12px 24px; min-height: 260mm; box-sizing: border-box; }
  .qhse-pdf-page:last-child { page-break-after: auto; }
  .qhse-pdf-title { font-size: 22pt; font-weight: 800; text-align: center; margin: 0 0 8px; letter-spacing: 0.02em; }
  .qhse-pdf-sub { text-align: center; color: #475569; font-size: 10pt; margin: 0 0 20px; }
  .qhse-pdf-meta p { margin: 4px 0; font-size: 10.5pt; }
  .qhse-pdf-gauge-wrap { margin: 16px 0; }
  .qhse-pdf-gauge-label { font-size: 10pt; font-weight: 700; margin-bottom: 6px; }
  .qhse-pdf-gauge-track { height: 18px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; overflow: hidden; max-width: 320px; display: inline-block; vertical-align: middle; width: 72%; }
  .qhse-pdf-gauge-fill { height: 100%; background: ${PDF_BRAND}; border-radius: 3px; width: ${gaugePct}%; }
  .qhse-pdf-gauge-val { font-weight: 800; margin-left: 12px; font-size: 12pt; }
  .qhse-pdf-h2 { font-size: 13pt; color: #0f172a; border-bottom: 2px solid ${PDF_BRAND}; padding-bottom: 4px; margin: 18px 0 10px; }
  .qhse-pdf-h3 { font-size: 11pt; color: ${PDF_BRAND}; margin: 14px 0 8px; font-weight: 800; }
  .qhse-pdf-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 8px; }
  .qhse-pdf-table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 6px; text-align: left; }
  .qhse-pdf-table td { border: 1px solid #e2e8f0; padding: 8px 6px; vertical-align: top; }
  .qhse-pdf-td-n { width: 28px; text-align: center; font-weight: 700; background: #f8fafc; }
  .qhse-pdf-muted { color: #64748b; }
  .qhse-pdf-check-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 10px 8px; margin-bottom: 10px; page-break-inside: avoid; }
  .qhse-pdf-check-head { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
  .qhse-pdf-check-no { font-weight: 800; min-width: 22px; }
  .qhse-pdf-check-title { flex: 1; font-weight: 700; }
  .qhse-pdf-badge { font-size: 8pt; font-weight: 800; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
  .qhse-pdf-preuve, .qhse-pdf-obs { margin: 4px 0; font-size: 9.5pt; color: #334155; }
  .qhse-pdf-photo img { max-width: 160px; max-height: 120px; border-radius: 4px; border: 1px solid #e2e8f0; margin-top: 6px; }
  .qhse-pdf-footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; text-align: center; }
  .qhse-pdf-brand { color: ${PDF_BRAND}; font-weight: 800; font-size: 10pt; margin-top: 8px; text-align: center; }
</style>
<div class="qhse-pdf-root">
  <section class="qhse-pdf-page">
    <div class="qhse-pdf-band"></div>
    <h1 class="qhse-pdf-title">RAPPORT D'AUDIT QHSE</h1>
    <p class="qhse-pdf-sub">Synthèse ISO — export terrain</p>
    <div class="qhse-pdf-meta">
      <p><strong>Référence :</strong> ${esc(data.auditRef)}</p>
      <p><strong>Site audité :</strong> ${esc(data.site)}</p>
      <p><strong>Date :</strong> ${esc(data.date)}</p>
      <p><strong>Auditeur responsable :</strong> ${esc(data.auditeur)}</p>
    </div>
    <div class="qhse-pdf-gauge-wrap">
      <div class="qhse-pdf-gauge-label">Score de conformité</div>
      <div class="qhse-pdf-gauge-track"><div class="qhse-pdf-gauge-fill"></div></div>
      <span class="qhse-pdf-gauge-val">${esc(scoreLabel)}</span>
    </div>
    <p class="qhse-pdf-brand">QHSE Control Africa</p>
    <p class="qhse-pdf-footer">QHSE Control Africa — Confidentiel — document généré localement le ${esc(new Date().toLocaleString('fr-FR'))}</p>
  </section>

  <section class="qhse-pdf-page">
    <div class="qhse-pdf-band"></div>
    <h2 class="qhse-pdf-h2">Résumé exécutif</h2>
    <p><strong>Lecture du score :</strong> ${esc(interp)}</p>
    <p class="qhse-pdf-muted">Points forts et écarts ci-dessous sont dérivés de la checklist affichée dans le module Audits.</p>
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:12px">
      <div style="flex:1;min-width:200px">
        <h3 class="qhse-pdf-h3">Points forts</h3>
        <table class="qhse-pdf-table">${strengthsRows || '<tr><td class="qhse-pdf-td-n">—</td><td class="qhse-pdf-muted">Aucun extrait</td></tr>'}</table>
      </div>
      <div style="flex:1;min-width:200px">
        <h3 class="qhse-pdf-h3">Points faibles / écarts</h3>
        <table class="qhse-pdf-table">${weakRows || '<tr><td class="qhse-pdf-td-n">—</td><td class="qhse-pdf-muted">Aucun extrait</td></tr>'}</table>
      </div>
    </div>
    ${
      norms.length
        ? `<h2 class="qhse-pdf-h2">Scores par norme (indicatif)</h2>
    <table class="qhse-pdf-table"><tr><th>Norme</th><th>Score</th></tr>${norms.join('')}</table>`
        : ''
    }
    <h2 class="qhse-pdf-h2">Preuves documentaires</h2>
    <ul style="margin:0;padding-left:20px;font-size:10pt">${proofs || '<li class="qhse-pdf-muted">—</li>'}</ul>
  </section>

  <section class="qhse-pdf-page">
    <div class="qhse-pdf-band"></div>
    <h2 class="qhse-pdf-h2">Détail de la checklist</h2>
    ${checklistHtml || '<p class="qhse-pdf-muted">Aucun point.</p>'}
  </section>

  <section class="qhse-pdf-page">
    <div class="qhse-pdf-band"></div>
    <h2 class="qhse-pdf-h2">Plan d'actions &amp; NC</h2>
    <table class="qhse-pdf-table">
      <tr><th>NC</th><th>Action</th><th>Responsable</th><th>Échéance</th><th>Priorité</th></tr>
      ${ncs || '<tr><td colspan="5" class="qhse-pdf-muted">—</td></tr>'}
    </table>
    <h2 class="qhse-pdf-h2">Traçabilité</h2>
    <table class="qhse-pdf-table">
      <tr><th>Qui</th><th>Quand</th><th>Action</th><th>Commentaire</th></tr>
      ${traces || '<tr><td colspan="4" class="qhse-pdf-muted">—</td></tr>'}
    </table>
    <p style="margin-top:24px;font-size:10pt"><strong>Signature / visa :</strong> ${esc(data.signerName || 'À compléter — responsable audit')}</p>
    <p class="qhse-pdf-footer">QHSE Control Africa — Confidentiel</p>
    <p class="qhse-pdf-brand">QHSE Control Africa</p>
  </section>
</div>`;
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
  return `
<style>
  .qhse-pdf-root { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 10.5pt; color: #0f172a; background: #fff; line-height: 1.35; }
  .qhse-pdf-band { height: 10px; background: ${PDF_BRAND}; margin: -8px -8px 16px -8px; }
  .qhse-pdf-page { page-break-after: always; padding: 8px 12px 24px; min-height: 260mm; box-sizing: border-box; }
  .qhse-pdf-page:last-child { page-break-after: auto; }
  .qhse-pdf-title { font-size: 22pt; font-weight: 800; text-align: center; margin: 0 0 8px; }
  .qhse-pdf-h2 { font-size: 13pt; color: #0f172a; border-bottom: 2px solid ${PDF_BRAND}; padding-bottom: 4px; margin: 18px 0 10px; }
  .qhse-pdf-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 8px; }
  .qhse-pdf-table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 6px; text-align: left; }
  .qhse-pdf-table td { border: 1px solid #e2e8f0; padding: 8px 6px; vertical-align: top; }
  .qhse-pdf-muted { color: #64748b; }
  .qhse-pdf-brand { color: ${PDF_BRAND}; font-weight: 800; font-size: 10pt; margin-top: 16px; text-align: center; }
  .qhse-pdf-footer { margin-top: 20px; font-size: 9pt; color: #64748b; text-align: center; }
</style>
<div class="qhse-pdf-root">
  <section class="qhse-pdf-page">
    <div class="qhse-pdf-band"></div>
    <h1 class="qhse-pdf-title">RAPPORT DE CONFORMITÉ ISO</h1>
    <p class="qhse-pdf-muted" style="text-align:center;margin:0 0 20px">Vue pilotage — QHSE Control Africa</p>
    <p><strong>Score global (écran) :</strong> ${esc(data.globalScoreLabel || '—')}</p>
    <p><strong>Exigences en écart (écran) :</strong> ${esc(data.gapsLabel || '—')}</p>
    <h2 class="qhse-pdf-h2">Scores par norme</h2>
    <table class="qhse-pdf-table"><tr><th>Référentiel</th><th>Score indicatif</th></tr>${
      norms.length ? norms.join('') : '<tr><td colspan="2" class="qhse-pdf-muted">—</td></tr>'
    }</table>
    <p class="qhse-pdf-footer">QHSE Control Africa — Confidentiel — ${esc(new Date().toLocaleString('fr-FR'))}</p>
    <p class="qhse-pdf-brand">QHSE Control Africa</p>
  </section>
  <section class="qhse-pdf-page">
    <div class="qhse-pdf-band"></div>
    <h2 class="qhse-pdf-h2">Registre des exigences (extrait)</h2>
    <p class="qhse-pdf-muted">Jusqu'à 40 lignes issues du tableau affiché sur la page ISO lors de l'export.</p>
    <table class="qhse-pdf-table">
      <tr><th>Clause</th><th>Exigence</th><th>Statut</th></tr>
      ${reqs.length ? reqs.join('') : '<tr><td colspan="3" class="qhse-pdf-muted">Ouvrez le registre sur la page ISO puis relancez l’export pour alimenter ce tableau.</td></tr>'}
    </table>
    <p class="qhse-pdf-footer">QHSE Control Africa — Confidentiel</p>
  </section>
</div>`;
}
