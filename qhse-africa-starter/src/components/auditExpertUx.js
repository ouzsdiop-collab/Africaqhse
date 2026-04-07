/**
 * Couche UX expert QHSE — module Audits (front uniquement, sans backend).
 */

import { showToast } from './toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const STYLE_ID = 'qhse-audit-expert-ux-styles';

const CSS = `
.audit-expert-cockpit{
  margin-bottom:14px;padding:14px 16px;border-radius:16px;
  border:1px solid rgba(45,212,191,.22);
  background:linear-gradient(155deg,rgba(13,148,136,.12),rgba(15,23,42,.55));
}
.audit-expert-cockpit__head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.audit-expert-cockpit__title{margin:0;font-size:15px;font-weight:800;letter-spacing:.02em;color:var(--text)}
.audit-expert-cockpit__sub{margin:4px 0 0;font-size:11px;color:var(--text3);max-width:52ch;line-height:1.4}
.audit-expert-cockpit__kpis{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;width:100%;
}
.audit-expert-kpi{
  padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.2);
}
.audit-expert-kpi__lbl{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.audit-expert-kpi__val{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text);margin-top:4px}
.audit-expert-kpi__val--warn{color:#fbbf24}
.audit-expert-kpi__val--danger{color:#f87171}
.audit-expert-cockpit__chart-wrap{
  margin-top:12px;display:grid;grid-template-columns:minmax(0,1fr) minmax(160px,220px);gap:14px;align-items:center;
}
@media (max-width:720px){
  .audit-expert-cockpit__chart-wrap{grid-template-columns:1fr}
}
.audit-expert-cockpit__chart-legend{font-size:11px;color:var(--text3);line-height:1.45}
.audit-expert-cockpit__canvas-wrap{position:relative;min-height:160px;max-width:220px;margin:0 auto}
.audit-expert-cockpit__canvas-wrap canvas{max-height:200px!important}

.audit-exigence-heatmap{margin:10px 0 14px}
.audit-exigence-heatmap__label{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.audit-exigence-heatmap__row{display:flex;flex-wrap:wrap;gap:6px}
.audit-exigence-heatmap__cell{
  min-width:40px;min-height:40px;padding:4px;border-radius:10px;border:1px solid rgba(148,163,184,.2);
  background:rgba(0,0,0,.2);cursor:pointer;font-size:18px;line-height:1;display:inline-flex;align-items:center;justify-content:center;
  transition:transform .12s ease,border-color .15s ease,box-shadow .15s ease;
}
.audit-exigence-heatmap__cell:hover{transform:translateY(-2px);border-color:rgba(45,212,191,.45);box-shadow:0 4px 12px rgba(0,0,0,.25)}
.audit-exigence-heatmap__cell:focus-visible{outline:2px solid rgba(45,212,191,.6);outline-offset:2px}
.audit-exigence-heatmap__cell--ok{border-color:rgba(34,197,94,.35)}
.audit-exigence-heatmap__cell--warn{border-color:rgba(234,179,8,.45)}
.audit-exigence-heatmap__cell--bad{border-color:rgba(239,68,68,.45)}

.audit-process-scores{margin-top:12px}
.audit-process-scores__grid{display:grid;gap:8px}
.audit-process-scores__row{
  display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;
  border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.12);font-size:12px;
}
.audit-process-scores__name{font-weight:700;color:var(--text)}
.audit-process-scores__bar{flex:1;min-width:48px;height:8px;border-radius:999px;background:rgba(0,0,0,.35);overflow:hidden}
.audit-process-scores__fill{height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(45,212,191,.3),rgba(45,212,191,.85))}
.audit-process-scores__pct{font-weight:800;font-variant-numeric:tabular-nums;min-width:3ch;text-align:right;color:var(--text2)}

.audit-page-alert-strip{
  display:none;align-items:center;flex-wrap:wrap;gap:8px 12px;padding:8px 12px;margin-bottom:10px;border-radius:12px;
  border:1px solid rgba(251,191,36,.35);background:rgba(251,191,36,.08);
}
.audit-premium-page--expert-alert .audit-page-alert-strip{display:flex}
.audit-page-alert-strip__badge{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:8px;background:rgba(239,68,68,.2);color:#fecaca}
.audit-page-alert-strip__text{font-size:12px;color:var(--text2);line-height:1.4}

.audit-premium-page--direction .audit-expert-hide-direction{display:none!important}
.audit-premium-page--direction .audit-premium-header__progress-wrap{opacity:.85}

.audit-history-timeline{margin:6px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:0}
.audit-history-timeline__item{
  display:grid;grid-template-columns:32px minmax(0,1fr);gap:10px;padding:10px 0;border-left:2px solid rgba(148,163,184,.15);
  margin-left:14px;padding-left:14px;position:relative;
}
.audit-history-timeline__item:last-child{border-left-color:transparent}
.audit-history-timeline__icon{
  width:32px;height:32px;margin-left:-27px;border-radius:10px;background:rgba(0,0,0,.25);
  border:1px solid rgba(148,163,184,.2);display:flex;align-items:center;justify-content:center;font-size:15px;
}
.audit-history-timeline__when{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.audit-history-timeline__title{font-size:13px;font-weight:700;margin:2px 0 0;color:var(--text)}
.audit-history-timeline__detail{font-size:11px;color:var(--text2);margin:4px 0 0;line-height:1.4}

.audit-nc-risk-btn{margin-top:6px!important;font-size:10px!important;padding:4px 8px!important;width:100%;max-width:200px}

.audit-excel-import-backdrop{
  position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;
}
.audit-excel-import-modal{
  width:min(640px,100%);max-height:min(88vh,900px);overflow:auto;border-radius:16px;border:1px solid rgba(148,163,184,.2);
  background:var(--bg,#0f172a);padding:16px 18px;box-shadow:0 24px 48px rgba(0,0,0,.45);
}
.audit-excel-import-modal h4{margin:0 0 8px;font-size:16px}
.audit-excel-import-modal__preview{margin-top:10px;max-height:240px;overflow:auto;border-radius:10px;border:1px solid rgba(148,163,184,.15)}
.audit-excel-import-modal__preview table{width:100%;border-collapse:collapse;font-size:11px}
.audit-excel-import-modal__preview th,.audit-excel-import-modal__preview td{padding:6px 8px;border:1px solid rgba(148,163,184,.1);text-align:left}

.audit-ia-expert-suggest{
  margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.12);
}
.audit-ia-expert-suggest__title{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin:0 0 8px}
.audit-ia-expert-suggest__list{margin:0;padding-left:18px;font-size:12px;color:var(--text2);line-height:1.5}
.audit-ia-expert-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
`;

export function ensureAuditExpertUxStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}

/**
 * @param {{
 *   score: number;
 *   ncMajeures: number;
 *   ncMineures: number;
 *   preuvesManquantes: number;
 *   actionsCritiques: number;
 *   chartLabels: string[];
 *   chartValues: number[];
 * }} model
 */
export function createAuditExpertCockpitBlock(model) {
  const article = document.createElement('article');
  article.className = 'content-card card-soft audit-expert-cockpit';
  article.setAttribute('aria-labelledby', 'audit-expert-cockpit-title');
  article.id = 'audit-expert-cockpit-block';

  const head = document.createElement('div');
  head.className = 'audit-expert-cockpit__head';
  head.innerHTML = `
    <div>
      <h3 id="audit-expert-cockpit-title" class="audit-expert-cockpit__title">Cockpit audit</h3>
      <p class="audit-expert-cockpit__sub">Synthèse direction — indicateurs consolidés (maquette locale).</p>
    </div>
  `;

  const kpis = document.createElement('div');
  kpis.className = 'audit-expert-cockpit__kpis';

  function addKpi(lbl, val, tone) {
    const k = document.createElement('div');
    k.className = 'audit-expert-kpi';
    const l = document.createElement('span');
    l.className = 'audit-expert-kpi__lbl';
    l.textContent = lbl;
    const v = document.createElement('span');
    v.className = 'audit-expert-kpi__val';
    if (tone === 'warn') v.classList.add('audit-expert-kpi__val--warn');
    if (tone === 'danger') v.classList.add('audit-expert-kpi__val--danger');
    v.textContent = String(val);
    k.append(l, v);
    kpis.append(k);
  }

  addKpi('Score global', `${Math.round(model.score)}%`, model.score < 80 ? 'warn' : undefined);
  addKpi('NC majeures', model.ncMajeures, model.ncMajeures > 0 ? 'danger' : undefined);
  addKpi('NC mineures', model.ncMineures, undefined);
  addKpi('Preuves manquantes', model.preuvesManquantes, model.preuvesManquantes > 0 ? 'warn' : undefined);
  addKpi('Actions critiques', model.actionsCritiques, model.actionsCritiques > 0 ? 'danger' : undefined);

  const chartWrap = document.createElement('div');
  chartWrap.className = 'audit-expert-cockpit__chart-wrap';
  const legend = document.createElement('div');
  legend.className = 'audit-expert-cockpit__chart-legend';
  legend.innerHTML =
    '<strong>Répartition des constats (checklist)</strong><br/>Donut : répartition par statut. Alternative : évolution du score sur les audits précédents via l’historique.';

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'audit-expert-cockpit__canvas-wrap';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Graphique répartition statuts audit');
  canvasWrap.append(canvas);

  chartWrap.append(legend, canvasWrap);

  article.append(head, kpis, chartWrap);

  queueMicrotask(() => {
    void mountAuditStatusDoughnut(canvas, model.chartLabels, model.chartValues);
  });

  return article;
}

async function mountAuditStatusDoughnut(canvas, labels, values) {
  try {
    const { default: Chart } = await import('chart.js/auto');
    const safeLabels = labels?.length ? labels : ['—'];
    const safeVals = values?.length ? values : [1];
    // eslint-disable-next-line no-new
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: safeLabels,
        datasets: [
          {
            data: safeVals,
            backgroundColor: [
              'rgba(45,212,191,0.75)',
              'rgba(234,179,8,0.8)',
              'rgba(239,91,107,0.85)',
              'rgba(148,163,184,0.5)'
            ],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10 }
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                const raw = safeVals[ctx.dataIndex] ?? 0;
                return ` ${ctx.label}: ${raw} exigence(s)`;
              }
            }
          }
        }
      }
    });
  } catch (e) {
    console.warn('Chart.js indisponible', e);
    canvas.replaceWith(document.createTextNode('Graphique indisponible.'));
  }
}

/**
 * @param {Array<{ conforme?: boolean; partial?: boolean }>} checklist
 */
export function createExigenceHeatmap(checklist) {
  const wrap = document.createElement('div');
  wrap.className = 'audit-exigence-heatmap';
  wrap.setAttribute('aria-label', 'Heatmap des exigences');
  const lab = document.createElement('div');
  lab.className = 'audit-exigence-heatmap__label';
  lab.textContent = 'Heatmap exigences (clic → constat)';
  const row = document.createElement('div');
  row.className = 'audit-exigence-heatmap__row';

  checklist.forEach((item, i) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'audit-exigence-heatmap__cell';
    let tone = 'bad';
    let sym = '🔴';
    if (item.partial === true) {
      tone = 'warn';
      sym = '🟡';
    } else if (item.conforme === true) {
      tone = 'ok';
      sym = '🟢';
    }
    cell.classList.add(`audit-exigence-heatmap__cell--${tone}`);
    cell.textContent = sym;
    cell.title = `Exigence ${i + 1} — voir la checklist`;
    cell.addEventListener('click', () => {
      document.getElementById(`audit-exigence-${i}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
    row.append(cell);
  });

  wrap.append(lab, row);
  return wrap;
}

/**
 * @param {Array<{ domain: string; score: number }>} rows
 */
export function createProcessScoresBlock(rows) {
  const block = document.createElement('div');
  block.className = 'audit-process-scores content-card card-soft';
  block.style.padding = '12px 14px';
  block.style.marginBottom = '12px';
  block.innerHTML = `
    <div class="section-kicker">Pilotage processus</div>
    <h4 style="margin:4px 0 8px;font-size:14px">Scores par domaine</h4>
  `;
  const grid = document.createElement('div');
  grid.className = 'audit-process-scores__grid';

  rows.forEach((r) => {
    const line = document.createElement('div');
    line.className = 'audit-process-scores__row';
    const name = document.createElement('span');
    name.className = 'audit-process-scores__name';
    name.textContent = r.domain;
    const bar = document.createElement('div');
    bar.className = 'audit-process-scores__bar';
    const fill = document.createElement('div');
    fill.className = 'audit-process-scores__fill';
    fill.style.width = `${Math.min(100, Math.max(0, r.score))}%`;
    bar.append(fill);
    const pct = document.createElement('span');
    pct.className = 'audit-process-scores__pct';
    pct.textContent = `${Math.round(r.score)}%`;
    line.append(name, bar, pct);
    grid.append(line);
  });

  block.append(grid);
  return block;
}

/**
 * @param {HTMLElement} pageRoot
 * @param {HTMLElement} host — ex. hero CTAs
 */
export function attachModeDirectionButton(pageRoot, host) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-secondary';
  btn.textContent = 'Mode direction';
  btn.title = 'Vue simplifiée : scores, écarts, décisions';
  let on = false;
  btn.addEventListener('click', () => {
    on = !on;
    pageRoot.classList.toggle('audit-premium-page--direction', on);
    btn.classList.toggle('btn-primary', on);
    btn.textContent = on ? 'Quitter mode direction' : 'Mode direction';
  });
  host?.append(btn);
}

/**
 * @param {{
 *   page: HTMLElement;
 * score: number;
 * hasCriticalNc: boolean;
 * auditsEnRetard: number;
 * }} opts
 */
export function runAuditExpertAlerts(opts) {
  const { page, score, hasCriticalNc, auditsEnRetard } = opts;
  const reasons = [];
  if (score < 80) reasons.push(`Score < 80 % (${Math.round(score)} %)`);
  if (hasCriticalNc) reasons.push('NC critique détectée');
  if (auditsEnRetard > 0) reasons.push(`${auditsEnRetard} audit(s) en retard`);

  if (!reasons.length) return;

  page.classList.add('audit-premium-page--expert-alert');
  const strip = document.createElement('div');
  strip.className = 'audit-page-alert-strip';
  strip.setAttribute('role', 'status');
  const badge = document.createElement('span');
  badge.className = 'audit-page-alert-strip__badge';
  badge.textContent = 'Alertes pilotage';
  const text = document.createElement('span');
  text.className = 'audit-page-alert-strip__text';
  text.textContent = reasons.join(' · ');
  strip.append(badge, text);
  page.prepend(strip);

  const msg = `Alertes audit : ${reasons.join(' — ')}`;
  showToast(msg, 'error');

  const hero = page.querySelector('.audit-premium-header');
  hero?.classList.add('audit-premium-header--alert-pulse');
}

/**
 * @param {Array<{ when: string; icon: string; title: string; detail: string }>} events
 */
export function buildAuditTimeline(events) {
  const ul = document.createElement('ul');
  ul.className = 'audit-history-timeline';
  events.forEach((ev) => {
    const li = document.createElement('li');
    li.className = 'audit-history-timeline__item';
    const ic = document.createElement('div');
    ic.className = 'audit-history-timeline__icon';
    ic.setAttribute('aria-hidden', 'true');
    ic.textContent = ev.icon || '•';
    const body = document.createElement('div');
    const when = document.createElement('div');
    when.className = 'audit-history-timeline__when';
    when.textContent = ev.when || '—';
    const title = document.createElement('div');
    title.className = 'audit-history-timeline__title';
    title.textContent = ev.title || '—';
    const detail = document.createElement('div');
    detail.className = 'audit-history-timeline__detail';
    detail.textContent = ev.detail || '—';
    body.append(when, title, detail);
    li.append(ic, body);
    ul.append(li);
  });
  return ul;
}

/**
 * @param {(data: { exigences: string[]; ncs: string[]; preuves: string[] }) => void} onValidate
 */
export function openAuditExcelImportModal(onValidate) {
  const backdrop = document.createElement('div');
  backdrop.className = 'audit-excel-import-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  const modal = document.createElement('div');
  modal.className = 'audit-excel-import-modal';

  modal.innerHTML = `
    <h4>Importer un audit (Excel)</h4>
    <p style="margin:0 0 10px;font-size:12px;color:var(--text3);line-height:1.45">
      Fichier .xlsx / .xls — détection heuristique des colonnes (exigences, NC, preuves). Aperçu local avant validation.
    </p>
    <input type="file" accept=".xlsx,.xls" class="control-input" data-audit-xlsx-file style="width:100%;margin-bottom:10px" />
    <div data-audit-xlsx-preview class="audit-excel-import-modal__preview"></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;justify-content:flex-end">
      <button type="button" class="btn btn-secondary" data-audit-xlsx-cancel>Annuler</button>
      <button type="button" class="btn btn-primary" data-audit-xlsx-ok disabled>Valider l’import</button>
    </div>
  `;

  const fileInput = modal.querySelector('[data-audit-xlsx-file]');
  const preview = modal.querySelector('[data-audit-xlsx-preview]');
  const okBtn = modal.querySelector('[data-audit-xlsx-ok]');
  const cancelBtn = modal.querySelector('[data-audit-xlsx-cancel]');

  /** @type {{ exigences: string[]; ncs: string[]; preuves: string[] }} */
  let parsed = { exigences: [], ncs: [], preuves: [] };

  function close() {
    backdrop.remove();
  }

  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    okBtn.disabled = true;
    preview.innerHTML = '';
    parsed = { exigences: [], ncs: [], preuves: [] };
    if (!f) return;
    try {
      const XLSX = await import('xlsx');
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const headers = (rows[0] || []).map((c) => String(c).toLowerCase());
      let iEx = headers.findIndex((h) => /exigence|point|critère/.test(h));
      let iNc = headers.findIndex((h) => /nc|non.?conform/.test(h));
      let iPr = headers.findIndex((h) => /preuve|justif|doc/.test(h));
      if (iEx < 0) iEx = 0;
      if (iNc < 0) iNc = 1;
      if (iPr < 0) iPr = 2;

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const ex = String(row[iEx] ?? '').trim();
        const nc = String(row[iNc] ?? '').trim();
        const pr = String(row[iPr] ?? '').trim();
        if (ex) parsed.exigences.push(ex);
        if (nc) parsed.ncs.push(nc);
        if (pr) parsed.preuves.push(pr);
      }

      const table = document.createElement('table');
      table.innerHTML = `<thead><tr><th>Exigences (${escapeHtml(String(parsed.exigences.length))})</th><th>NC (${escapeHtml(String(parsed.ncs.length))})</th><th>Preuves (${escapeHtml(String(parsed.preuves.length))})</th></tr></thead>`;
      const tbody = document.createElement('tbody');
      const n = Math.min(12, Math.max(parsed.exigences.length, parsed.ncs.length, parsed.preuves.length, 1));
      for (let i = 0; i < n; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(parsed.exigences[i] || '—')}</td><td>${escapeHtml(parsed.ncs[i] || '—')}</td><td>${escapeHtml(parsed.preuves[i] || '—')}</td>`;
        tbody.append(tr);
      }
      table.append(tbody);
      preview.append(table);
      okBtn.disabled = parsed.exigences.length + parsed.ncs.length + parsed.preuves.length === 0;
    } catch (e) {
      console.error(e);
      preview.innerHTML = `<p style="padding:8px;color:#f87171;font-size:12px">Lecture impossible — vérifiez le format.</p>`;
    }
  });

  okBtn.addEventListener('click', () => {
    onValidate(parsed);
    close();
  });

  backdrop.append(modal);
  document.body.append(backdrop);
}

/**
 * @param {HTMLElement} iaCard
 * @param {{ missingProofs: number; criticalNc: number; recommendations: string[] }} model
 * @param {{ onPlan: () => void; onReport: () => void; onPrior: () => void }} actions
 */
export function enhanceAuditAssistantCard(iaCard, model, actions) {
  const box = document.createElement('div');
  box.className = 'audit-ia-expert-suggest';
  box.innerHTML = `<p class="audit-ia-expert-suggest__title">Suggestions expert</p>`;
  const ul = document.createElement('ul');
  ul.className = 'audit-ia-expert-suggest__list';
  const lines = [
    `Preuves manquantes : ${model.missingProofs} point(s) à compléter.`,
    `NC critiques : ${model.criticalNc} — prioriser la clôture.`,
    ...model.recommendations
  ];
  lines.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.append(li);
  });
  const btns = document.createElement('div');
  btns.className = 'audit-ia-expert-btns';
  [['Générer plan d’action', actions.onPlan], ['Générer rapport', actions.onReport], ['Prioriser', actions.onPrior]].forEach(
    ([label, fn]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary';
      b.textContent = label;
      b.addEventListener('click', fn);
      btns.append(b);
    }
  );
  box.append(ul, btns);
  iaCard.append(box);
}
