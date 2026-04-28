/**
 * Panneau modal « Rapport audit IA » : synthèse + export PDF (pipeline existant).
 */

import { escapeHtml } from '../utils/escapeHtml.js';
import { buildIsoAuditReportPdfHtml, downloadAuditIsoPdfFromHtml } from './auditPremiumSaaS.pdf.js';

const STYLE_ID = 'qhse-iso-audit-report-styles';

const CSS = `
.iso-ar-overlay{position:fixed;inset:0;z-index:220;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;backdrop-filter:blur(4px)}
.iso-ar-panel{width:100%;max-width:720px;max-height:min(90vh,820px);overflow:auto;display:flex;flex-direction:column;gap:0;padding:0!important;border:1px solid rgba(148,163,184,.2);box-shadow:0 24px 64px rgba(0,0,0,.45)}
.iso-ar-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(148,163,184,.12)}
.iso-ar-title{margin:0;font-size:18px;font-weight:800}
.iso-ar-sub{margin:6px 0 0;font-size:12px;color:var(--text3);line-height:1.45}
.iso-ar-close{flex-shrink:0}
.iso-ar-body{padding:14px 18px 20px;display:flex;flex-direction:column;gap:14px}
.iso-ar-summary{padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.14);background:rgba(0,0,0,.12);font-size:13px;line-height:1.55;color:var(--text2)}
.iso-ar-scores{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;font-weight:700;color:var(--text3)}
.iso-ar-scores span{padding:4px 10px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(148,163,184,.12)}
.iso-ar-section{margin:0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.iso-ar-list{margin:0;padding-left:1.1rem;font-size:12px;line-height:1.45;color:var(--text2)}
.iso-ar-list li{margin-bottom:6px}
.iso-ar-empty{font-size:12px;color:var(--text3);margin:0}
.iso-ar-actions{display:flex;flex-wrap:wrap;gap:10px;padding-top:8px;border-top:1px solid rgba(148,163,184,.1)}
.iso-ar-prio{color:#fbbf24;font-weight:700}
.iso-ar-muted{opacity:.88;font-size:11px;color:var(--text3)}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}

/**
 * @param {ReturnType<import('../services/isoAuditReport.service.js').buildIsoAuditReport>} report
 */
function sectionList(title, items, formatter) {
  const wrap = document.createElement('div');
  const h = document.createElement('h4');
  h.className = 'iso-ar-section';
  h.textContent = title;
  wrap.append(h);
  if (!items || !items.length) {
    const p = document.createElement('p');
    p.className = 'iso-ar-empty';
    p.textContent = 'Aucun élément dans cette catégorie.';
    wrap.append(p);
    return wrap;
  }
  const ul = document.createElement('ul');
  ul.className = 'iso-ar-list';
  items.forEach((it) => {
    const li = document.createElement('li');
    li.innerHTML = formatter(it);
    ul.append(li);
  });
  wrap.append(ul);
  return wrap;
}

/**
 * @param {ReturnType<import('../services/isoAuditReport.service.js').buildIsoAuditReport>} report
 */
export function openIsoAuditReportModal(report) {
  ensureStyles();
  const overlay = document.createElement('div');
  overlay.className = 'iso-ar-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'iso-ar-title');

  const panel = document.createElement('div');
  panel.className = 'iso-ar-panel content-card card-soft';

  const head = document.createElement('div');
  head.className = 'iso-ar-head';
  head.innerHTML = `
    <div>
      <h2 id="iso-ar-title" class="iso-ar-title">Rapport audit IA</h2>
      <p class="iso-ar-sub">Vue globale indicative pour la préparation certification (agrégation registre, preuves, terrain). À valider par l’auditeur / la direction.</p>
    </div>
    <button type="button" class="btn btn-secondary iso-ar-close" aria-label="Fermer">✕</button>
  `;

  const body = document.createElement('div');
  body.className = 'iso-ar-body';

  const sum = document.createElement('div');
  sum.className = 'iso-ar-summary';
  sum.textContent = report.summary;

  const scores = document.createElement('div');
  scores.className = 'iso-ar-scores';
  scores.innerHTML = `
    <span>Score consolidé ${escapeHtml(String(report.score.pct))} %</span>
    <span>Statuts ${escapeHtml(String(report.score.legacyPct))} %</span>
    <span>Terrain ~${escapeHtml(String(report.score.operationalPct))} %</span>
  `;

  body.append(
    sum,
    scores,
    sectionList(
      'Points conformes',
      report.conformingPoints,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> (${escapeHtml(x.normCode)}) — ${escapeHtml(x.title)}. <span class="iso-ar-muted">${escapeHtml(x.detail)}</span>`
    ),
    sectionList(
      'Non-conformités',
      report.nonConformities,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> — ${escapeHtml(x.title)}. ${escapeHtml(x.detail)}`
    ),
    sectionList(
      'Écarts partiels',
      report.partialGaps,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> — ${escapeHtml(x.title)}. ${escapeHtml(x.detail)}`
    ),
    sectionList(
      'Preuves à renforcer',
      report.missingEvidence,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> — ${escapeHtml(x.title)} : ${escapeHtml(x.detail)}`
    ),
    sectionList(
      'Actions prioritaires (ouvertes)',
      report.priorityActions,
      (x) =>
        `${escapeHtml(x.title)} <span class="iso-ar-muted">(${escapeHtml(x.status)})</span>${x.overdue ? ' <span class="iso-ar-prio">· retard</span>' : ''}`
    ),
    sectionList(
      'Risques critiques / très élevés',
      report.criticalRisks,
      (x) =>
        `${escapeHtml(x.ref || '—')} — ${escapeHtml(x.title)} <span class="iso-ar-muted">(${escapeHtml(x.label)})</span>`
    )
  );

  const actions = document.createElement('div');
  actions.className = 'iso-ar-actions';
  const btnPdf = document.createElement('button');
  btnPdf.type = 'button';
  btnPdf.className = 'btn btn-primary';
  btnPdf.textContent = 'Exporter PDF';
  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  btnClose.className = 'btn btn-secondary';
  btnClose.textContent = 'Fermer';
  actions.append(btnPdf, btnClose);

  body.append(actions);

  panel.append(head, body);
  overlay.append(panel);
  document.body.append(overlay);

  function close() {
    overlay.remove();
  }

  head.querySelector('.iso-ar-close')?.addEventListener('click', close);
  btnClose.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  btnPdf.addEventListener('click', () => {
    void (async () => {
      btnPdf.disabled = true;
      try {
        const html = buildIsoAuditReportPdfHtml(report);
        await downloadAuditIsoPdfFromHtml(html, 'rapport-audit-ia-iso');
      } catch (e) {
        console.error(e);
      } finally {
        btnPdf.disabled = false;
      }
    })();
  });
}
