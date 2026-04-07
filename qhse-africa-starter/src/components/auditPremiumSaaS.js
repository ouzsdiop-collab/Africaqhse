/**
 * Extensions premium module Audits (terrain, PDF ISO client, workflow) — sans backend dédié.
 */

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
  const mod = await import('html2pdf.js');
  const html2pdf = mod.default || mod;
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-9999px';
  host.style.top = '0';
  host.style.width = '210mm';
  host.innerHTML = htmlString;
  document.body.append(host);
  const safeName = String(fileBase || 'audit-iso').replace(/[^\w-]+/g, '_');
  try {
    await html2pdf()
      .set({
        margin: [12, 12, 12, 12],
        filename: `${safeName}.pdf`,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(host)
      .save();
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
 *   checklist: { point: string; conforme: boolean; proofRef?: string }[];
 *   proofs: { name: string; status: string }[];
 *   treatmentRows: { nc: string; action: string; owner: string; due: string }[];
 *   traceRows: { who: string; when: string; action: string; comment: string }[];
 *   signerName?: string;
 * }} data
 */
export function buildAuditIsoPdfHtml(data) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const rows = (data.checklist || [])
    .map(
      (c) =>
        `<tr><td>${esc(c.point)}</td><td>${c.conforme ? 'Conforme' : 'NC'}</td><td>${esc(c.proofRef)}</td></tr>`
    )
    .join('');
  const proofs = (data.proofs || [])
    .map((p) => `<li>${esc(p.name)} — ${esc(p.status)}</li>`)
    .join('');
  const ncs = (data.treatmentRows || [])
    .map(
      (r) =>
        `<tr><td>${esc(r.nc)}</td><td>${esc(r.action)}</td><td>${esc(r.owner)}</td><td>${esc(r.due)}</td></tr>`
    )
    .join('');
  const traces = (data.traceRows || [])
    .map(
      (t) =>
        `<tr><td>${esc(t.who)}</td><td>${esc(t.when)}</td><td>${esc(t.action)}</td><td>${esc(t.comment)}</td></tr>`
    )
    .join('');
  return `
<div style="font-family:system-ui,sans-serif;font-size:11px;color:#111;padding:8px">
  <h1 style="font-size:16px;margin:0 0 8px">Rapport d'audit ISO — synthèse complète</h1>
  <p style="margin:0 0 12px"><strong>Réf.</strong> ${esc(data.auditRef)} · <strong>Site</strong> ${esc(data.site)} · <strong>Date</strong> ${esc(data.date)}</p>
  <p style="margin:0 0 12px"><strong>Auditeur</strong> ${esc(data.auditeur)} · <strong>Score</strong> ${esc(data.score)}%</p>
  <h2 style="font-size:13px;margin:16px 0 6px">Checklist / constats</h2>
  <table style="width:100%;border-collapse:collapse;font-size:10px" border="1" cellpadding="6">
    <tr style="background:#f4f4f5"><th>Point</th><th>Statut</th><th>Preuve</th></tr>
    ${rows}
  </table>
  <h2 style="font-size:13px;margin:16px 0 6px">Preuves documentaires</h2>
  <ul style="margin:0;padding-left:18px">${proofs || '<li>—</li>'}</ul>
  <h2 style="font-size:13px;margin:16px 0 6px">Non-conformités &amp; actions</h2>
  <table style="width:100%;border-collapse:collapse;font-size:10px" border="1" cellpadding="6">
    <tr style="background:#f4f4f5"><th>NC</th><th>Action</th><th>Resp.</th><th>Échéance</th></tr>
    ${ncs}
  </table>
  <h2 style="font-size:13px;margin:16px 0 6px">Traçabilité décisions</h2>
  <table style="width:100%;border-collapse:collapse;font-size:10px" border="1" cellpadding="6">
    <tr style="background:#f4f4f5"><th>Qui</th><th>Quand</th><th>Action</th><th>Commentaire</th></tr>
    ${traces}
  </table>
  <p style="margin-top:28px;border-top:1px solid #ccc;padding-top:10px;font-size:10px">
    <strong>Signature / visa</strong> : ${esc(data.signerName || 'À compléter — responsable audit')}
  </p>
  <p style="font-size:9px;color:#666;margin-top:8px">Document généré localement (démo) — ${esc(new Date().toLocaleString('fr-FR'))}</p>
</div>`;
}
