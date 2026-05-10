/**
 * Panneau modal « Rapport audit IA » : synthèse + analyse narrative (API) + export PDF (pipeline existant).
 */

import { escapeHtml } from '../utils/escapeHtml.js';
import { qhseFetch } from '../utils/qhseFetch.js';
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
.iso-ar-narrative{border-radius:12px;border:1px solid rgba(139,92,246,.25);background:rgba(139,92,246,.08);padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.iso-ar-narrative-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
.iso-ar-narrative-badge{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;border:1px solid rgba(139,92,246,.4);color:#c4b5fd;background:rgba(88,28,135,.2)}
.iso-ar-narrative-actions{display:flex;flex-wrap:wrap;gap:8px}
.iso-ar-narrative-summary{margin:0;font-size:13px;line-height:1.5;color:var(--text2)}
.iso-ar-narrative-sub{margin:0;font-size:11px;font-weight:700;color:var(--text3)}
.iso-ar-narrative-loading{margin:0;font-size:12px;color:var(--text3)}
.iso-ar-narrative-err{margin:0;font-size:12px;color:#f87171}
.iso-ar-source-hint{font-size:10px;color:var(--text3);margin:0}
html[data-theme='light'] .iso-ar-panel{
  border-color:rgba(15,23,42,.16);
  background:linear-gradient(180deg,var(--surface-1,#fff) 0%,var(--surface-2,#f8fafc) 100%);
  box-shadow:0 18px 44px -24px rgba(15,23,42,.34);
}
html[data-theme='light'] .iso-ar-head{border-bottom-color:rgba(15,23,42,.14)}
html[data-theme='light'] .iso-ar-summary{
  background:color-mix(in srgb,var(--surface-2,#f8fafc) 86%,white 14%);
  border-color:rgba(15,23,42,.15);
  color:var(--color-text-secondary,#334155);
}
html[data-theme='light'] .iso-ar-scores,
html[data-theme='light'] .iso-ar-muted,
html[data-theme='light'] .iso-ar-empty,
html[data-theme='light'] .iso-ar-source-hint,
html[data-theme='light'] .iso-ar-narrative-loading,
html[data-theme='light'] .iso-ar-narrative-sub{color:var(--color-text-secondary,#334155)}
html[data-theme='light'] .iso-ar-scores span{
  background:color-mix(in srgb,var(--surface-2,#f8fafc) 78%,white 22%);
  border-color:rgba(15,23,42,.17);
}
html[data-theme='light'] .iso-ar-actions{border-top-color:rgba(15,23,42,.14)}
html[data-theme='light'] .iso-ar-narrative{
  background:color-mix(in srgb,var(--surface-2,#f8fafc) 82%,#ede9fe 18%);
  border-color:rgba(109,40,217,.24);
}
html[data-theme='light'] .iso-ar-narrative-badge{
  color:#5b21b6;
  background:color-mix(in srgb,#ddd6fe 72%,white 28%);
  border-color:rgba(109,40,217,.3);
}
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

function narrativeSubList(title, strings) {
  const wrap = document.createElement('div');
  const h = document.createElement('p');
  h.className = 'iso-ar-narrative-sub';
  h.textContent = title;
  wrap.append(h);
  const ul = document.createElement('ul');
  ul.className = 'iso-ar-list';
  (Array.isArray(strings) ? strings : []).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = String(t || '');
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
  /** @type {{ summary?: string; strengths?: string[]; weaknesses?: string[]; priorityActions?: string[]; confidence?: number } | null} */
  let lastNarrative = null;
  /** @type {'ai' | 'fallback' | null} */
  let lastNarrativeSource = null;

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

  const narrativeBox = document.createElement('div');
  narrativeBox.className = 'iso-ar-narrative';
  narrativeBox.setAttribute('aria-busy', 'true');
  narrativeBox.innerHTML = `
    <div class="iso-ar-narrative-head">
      <span class="iso-ar-narrative-badge">Texte assisté : relecture et validation requises</span>
      <div class="iso-ar-narrative-actions">
        <button type="button" class="btn btn-secondary iso-ar-narrative-regen" disabled>Régénérer</button>
      </div>
    </div>
    <h4 class="iso-ar-section" style="margin:0">Analyse narrative</h4>
    <p class="iso-ar-narrative-loading">Génération de la synthèse rédactionnelle…</p>
    <p class="iso-ar-narrative-err" hidden></p>
    <div class="iso-ar-narrative-content" hidden></div>
    <p class="iso-ar-source-hint" hidden></p>
  `;

  const narrLoading = narrativeBox.querySelector('.iso-ar-narrative-loading');
  const narrErr = narrativeBox.querySelector('.iso-ar-narrative-err');
  const narrContent = narrativeBox.querySelector('.iso-ar-narrative-content');
  const narrHint = narrativeBox.querySelector('.iso-ar-source-hint');
  const btnRegen = narrativeBox.querySelector('.iso-ar-narrative-regen');

  function renderNarrative(n, source) {
    lastNarrative = n;
    lastNarrativeSource = source;
    narrContent.replaceChildren();
    if (!n || !String(n.summary || '').trim()) {
      narrContent.hidden = true;
      return;
    }
    narrContent.hidden = false;
    const p = document.createElement('p');
    p.className = 'iso-ar-narrative-summary';
    p.textContent = n.summary;
    narrContent.append(p);
    narrContent.append(narrativeSubList('Forces', n.strengths));
    narrContent.append(narrativeSubList('Faiblesses / points de vigilance', n.weaknesses));
    narrContent.append(narrativeSubList('Actions prioritaires (narratif)', n.priorityActions));
    const conf =
      typeof n.confidence === 'number' && Number.isFinite(n.confidence)
        ? ` · Confiance indicative : ${Math.round(n.confidence * 100)} %`
        : '';
    narrHint.textContent =
      source === 'ai'
        ? `Source : rédaction assistée (métriques agrégées uniquement).${conf}`
        : `Source : synthèse déterministe (aucun appel IA ou réponse invalide).${conf}`;
    narrHint.hidden = false;
  }

  async function loadNarrative() {
    narrLoading.hidden = false;
    narrErr.hidden = true;
    narrErr.textContent = '';
    narrContent.hidden = true;
    narrHint.hidden = true;
    btnRegen.disabled = true;
    narrativeBox.setAttribute('aria-busy', 'true');
    try {
      const res = await qhseFetch('/api/iso/audit/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j.error === 'string' ? j.error : `Erreur ${res.status}`);
      }
      if (!j.success || !j.narrative) {
        throw new Error('Réponse narrative invalide');
      }
      renderNarrative(j.narrative, j.source === 'ai' ? 'ai' : 'fallback');
    } catch (e) {
      console.warn('[iso audit narrative]', e);
      narrErr.textContent =
        e instanceof Error
          ? e.message
          : 'Impossible de charger la narration. Utilisez Régénérer ou exportez le PDF (synthèse structurée inchangée).';
      narrErr.hidden = false;
      lastNarrative = null;
      lastNarrativeSource = null;
    } finally {
      narrLoading.hidden = true;
      btnRegen.disabled = false;
      narrativeBox.setAttribute('aria-busy', 'false');
    }
  }

  btnRegen?.addEventListener('click', () => {
    void loadNarrative();
  });

  body.append(
    sum,
    scores,
    narrativeBox,
    sectionList(
      'Points conformes',
      report.conformingPoints,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> (${escapeHtml(x.normCode)}) : ${escapeHtml(x.title)}. <span class="iso-ar-muted">${escapeHtml(x.detail)}</span>`
    ),
    sectionList(
      'Non-conformités',
      report.nonConformities,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> : ${escapeHtml(x.title)}. ${escapeHtml(x.detail)}`
    ),
    sectionList(
      'Écarts partiels',
      report.partialGaps,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> : ${escapeHtml(x.title)}. ${escapeHtml(x.detail)}`
    ),
    sectionList(
      'Preuves à renforcer',
      report.missingEvidence,
      (x) =>
        `<strong>${escapeHtml(x.clause)}</strong> : ${escapeHtml(x.title)} : ${escapeHtml(x.detail)}`
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
        `${escapeHtml(x.ref || 'n/r')} : ${escapeHtml(x.title)} <span class="iso-ar-muted">(${escapeHtml(x.label)})</span>`
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

  void loadNarrative();

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
        const html = buildIsoAuditReportPdfHtml(report, {
          narrative: lastNarrative,
          narrativeSource: lastNarrativeSource || ''
        });
        await downloadAuditIsoPdfFromHtml(html, 'rapport-audit-ia-iso');
      } catch (e) {
        console.error(e);
      } finally {
        btnPdf.disabled = false;
      }
    })();
  });
}
