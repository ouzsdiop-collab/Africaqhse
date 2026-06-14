import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState, createSkeletonCard } from '../utils/designSystem.js';
import { canResource } from '../utils/permissionsUi.js';
import { getSessionUser } from '../data/sessionUser.js';
let conformityModPromise = null;
function loadConformity() {
  if (!conformityModPromise) conformityModPromise = import('../data/conformityStore.js');
  return conformityModPromise;
}
import { consumeDashboardIntent } from '../utils/dashboardNavigationIntent.js';

const TYPE_LABELS = {
  management: 'Processus de management',
  realisation: 'Processus de réalisation',
  support: 'Processus support'
};

const STATUS_LABELS = {
  conforme: 'Conforme',
  a_surveiller: 'À surveiller',
  critique: 'Critique',
  a_revoir: 'À revoir'
};

const LINK_TYPE_LABELS = {
  risk: 'Risque',
  action: 'Action',
  audit: 'Audit',
  document: 'Document',
  indicator: 'Indicateur',
  incident: 'Incident',
  isoRequirement: 'Exigence ISO',
  evidence: 'Preuve',
  conformityStatus: 'Statut de conformité'
};

const LINK_TYPE_ORDER = ['risk', 'action', 'audit', 'document', 'indicator', 'incident', 'isoRequirement', 'evidence', 'conformityStatus'];

const PROCESSES_STYLE_ID = 'qhse-processes-page-styles';
function ensureProcessesPageStyles() {
  if (document.getElementById(PROCESSES_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = PROCESSES_STYLE_ID;
  el.textContent = `
    .proc-view-toggle{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}
    .proc-view-toggle .proc-toggle-btn{border:0;border-radius:0;margin:0;background:transparent;color:var(--text2)}
    .proc-view-toggle .proc-toggle-btn + .proc-toggle-btn{border-left:1px solid var(--border)}
    .proc-view-toggle .proc-toggle-btn.is-active{background:var(--app-accent,#14b8a6);color:#fff;font-weight:700}
    .proc-type-section{border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px;background:linear-gradient(180deg, var(--surface2, rgba(148,163,184,0.05)) 0%, transparent 100%)}
    .proc-type-section h4{margin:0 0 12px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--text2);display:flex;align-items:center;gap:8px}
    .proc-type-section h4::before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--app-accent,#14b8a6)}
    .proc-card{border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:var(--surface1,#fff);transition:box-shadow .2s ease, border-color .2s ease, transform .15s ease}
    .proc-card:hover{box-shadow:0 8px 24px rgba(15,23,42,.10);border-color:var(--app-accent,#14b8a6);transform:translateY(-2px)}
    .proc-score-pill{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:64px;height:64px;border:2px solid;border-radius:50%;background:var(--surface1,#fff)}
    .proc-score-pill-num{font-size:20px;font-weight:800;line-height:1.1}
    .proc-score-pill-label{font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:var(--text2);margin-top:1px}
    .proc-summary-tile{border:1px solid var(--border);border-radius:10px;padding:12px;background:var(--surface2, rgba(148,163,184,0.04))}
    .proc-section{border:1px solid var(--border);border-radius:14px;padding:16px;margin-top:14px;background:var(--surface2, rgba(148,163,184,0.04))}
    .proc-section h4{margin:0 0 10px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text2)}
    .proc-link-group{border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;background:var(--surface1,#fff);transition:border-color .15s ease}
    .proc-link-group:hover{border-color:var(--app-accent,#14b8a6)}
    .proc-link-group h5{margin:0 0 4px;font-size:12px;font-weight:700}
    .proc-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border);border-radius:12px;overflow:hidden}
    .proc-table th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text2);background:var(--surface2, rgba(148,163,184,0.06));padding:12px 14px}
    .proc-table td{padding:12px 14px;border-top:1px solid var(--border);font-size:13px}
    .proc-table tbody tr{transition:background .15s ease}
    .proc-table tbody tr:hover{background:var(--surface2, rgba(148,163,184,0.06))}
    .proc-graph-line{stroke-dasharray:4 4;animation:proc-graph-flow 12s linear infinite}
    @keyframes proc-graph-flow{to{stroke-dashoffset:-200}}
    .proc-graph-node{transition:transform .2s ease}
    .proc-graph-node:hover{transform:scale(1.12)}
    .proc-graph-node circle.proc-graph-ring{animation:proc-graph-pulse 2.4s ease-in-out infinite}
    @keyframes proc-graph-pulse{0%,100%{opacity:.35;r:16}50%{opacity:0;r:26}}
    .proc-graph-node circle.proc-graph-core{transition:filter .2s ease}
    .proc-graph-node:hover circle.proc-graph-core{filter:brightness(1.15)}
    .proc-pilots{margin-top:16px}
    .proc-pilots h4{margin:0 0 8px}
    .proc-pilots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
    .proc-pilot-card{padding:14px;border-radius:12px;transition:box-shadow .2s ease,transform .15s ease}
    .proc-pilot-card:hover{box-shadow:0 8px 24px rgba(15,23,42,.10);transform:translateY(-2px)}
    .proc-pilot-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
    .proc-pilot-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--app-accent,#14b8a6);color:#fff;font-size:12px;font-weight:800;flex:none}
    .proc-pilot-name{font-weight:800}
    .proc-pilot-item{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--border);font-size:13px}
    .proc-pilot-item:last-child{border-bottom:none}
    .proc-pilot-item:hover .proc-pilot-item-name{text-decoration:underline}
    .proc-pilot-item-score{font-weight:800;white-space:nowrap}
    .proc-priorities{padding:14px 16px;border-left:4px solid #e8590c;border-radius:12px;background:linear-gradient(135deg, rgba(232,89,12,0.08), transparent 70%)}
    .proc-priorities h4{margin:0;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text2);font-weight:800}
    .proc-priorities-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap}
    .proc-audit-all-btn{font-size:12px;padding:6px 10px}
    .proc-audit-all-host{margin-top:10px}
    .proc-audit-all-host:empty{display:none}
    .proc-priority-list{display:flex;flex-direction:column;gap:6px}
    .proc-priority-row{display:flex;align-items:baseline;gap:10px;padding:4px 0;border-bottom:1px solid var(--border);font-size:13px;flex-wrap:wrap}
    .proc-priority-row:last-child{border-bottom:none}
    .proc-priority-row:hover .proc-priority-name{text-decoration:underline}
    .proc-priority-score{font-weight:800;min-width:48px}
    .proc-priority-name{font-weight:700}
    .proc-priority-reasons{color:var(--text2);font-size:12px}
    .proc-proof-row{display:flex;align-items:baseline;gap:10px;padding:4px 0;border-bottom:1px solid var(--border);font-size:13px}
    .proc-proof-row:last-child{border-bottom:none}
    .proc-proof-status{font-weight:800;width:18px;text-align:center}
    .proc-proof-status.proc-proof-ok{color:#2f9e44}
    .proc-proof-status.proc-proof-warn{color:#e8590c}
    .proc-proof-status.proc-proof-none{color:var(--text2)}
    .proc-proof-label{font-weight:700;min-width:120px}
    .proc-proof-detail{color:var(--text2);font-size:12px}
    .proc-iso-suggest-host:empty{display:none}
    .proc-iso-suggest-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}
    .proc-iso-suggest-row:last-child{border-bottom:none}
    .proc-filter-mine-toggle{display:flex;align-items:center;gap:6px;height:38px;font-size:13px}
    .proc-filter-mine-toggle input{width:16px;height:16px}
  `;
  document.head.append(el);
}

const LINK_CANDIDATE_ENDPOINTS = {
  risk: '/api/risks',
  action: '/api/actions',
  audit: '/api/audits',
  incident: '/api/incidents',
  document: '/api/controlled-documents'
};

let isoRequirementsById = null;
function getIsoRequirementsMap(iso) {
  if (!isoRequirementsById) {
    isoRequirementsById = new Map(iso.getRequirements().map((r) => [r.id, r]));
  }
  return isoRequirementsById;
}
function isoRequirementLabel(iso, id) {
  const r = getIsoRequirementsMap(iso).get(id);
  if (!r) return id;
  return `${iso.getNormById(r.normId)?.code || r.normId} · ${r.clause} ${r.title}`;
}

const STOPWORDS = new Set(['les','des','aux','une','un','le','la','de','du','et','en','au','pour','sur','par','avec','dans','ce','ces','que','qui','est','son','sa','ses','ou','non']);

function suggestIsoRequirementsForProcess(iso, proc, alreadyLinkedIds) {
  const text = [proc.name, proc.purpose, ...(proc.inputs || []), ...(proc.outputs || [])].join(' ').toLowerCase();
  const words = new Set(text.split(/[^a-zàâçéèêëîïôûùüÿñæœ0-9]+/i).filter((w) => w.length > 3 && !STOPWORDS.has(w)));

  const scored = iso.getRequirements()
    .filter((r) => !alreadyLinkedIds.has(r.id))
    .map((r) => {
      const reqText = `${r.title} ${r.summary}`.toLowerCase();
      let score = 0;
      words.forEach((w) => {
        if (reqText.includes(w)) score += 1;
      });
      return { req: r, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((s) => s.req);
}

function candidateLabel(row) {
  const text = row.title || row.name || row.ref || row.fileName || row.label || row.id;
  return row.ref && row.ref !== text ? `${row.ref} · ${text}` : String(text);
}

function scoreTone(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 'neutral';
  if (n >= 80) return 'good';
  if (n >= 50) return 'warning';
  return 'critical';
}

function scoreColor(score) {
  const tone = scoreTone(score);
  if (tone === 'good') return '#22c55e';
  if (tone === 'warning') return '#f59e0b';
  if (tone === 'critical') return '#ef4444';
  return 'var(--text2)';
}

export function renderProcesses() {
  ensureQhsePilotageStyles();
  ensureProcessesPageStyles();

  const su = getSessionUser();
  const dashboardIntentNav = consumeDashboardIntent();
  let pendingProcessId = dashboardIntentNav?.processId ? String(dashboardIntentNav.processId).trim() : null;
  const canRead = canResource(su?.role, 'processes', 'read');
  const canWrite = canResource(su?.role, 'processes', 'write');

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas processes-page';

  if (!canRead) {
    page.append(
      createEmptyState(
        '🔒',
        'Accès non autorisé',
        'Votre rôle ne permet pas de consulter le pilotage des processus.'
      )
    );
    return page;
  }

  page.innerHTML = `
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Pilotage</div>
          <h3>Pilotage des processus</h3>
          <p class="content-card-lead" style="margin:0;max-width:70ch;font-size:13px">
            Cartographie reliée aux pilotes, documents, risques, actions, audits, indicateurs et preuves ISO,
            avec un score de maîtrise par processus pour savoir où agir en priorité.
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <div class="proc-view-toggle">
            <button type="button" class="btn proc-toggle-btn proc-btn-map is-active" aria-pressed="true">Vue cartographie</button>
            <button type="button" class="btn proc-toggle-btn proc-btn-table" aria-pressed="false">Vue tableau</button>
          </div>
          <button type="button" class="btn btn-secondary proc-btn-export-all">Export PDF (tous les processus)</button>
          ${canWrite ? '<button type="button" class="btn btn-primary proc-btn-new">Nouveau processus</button>' : ''}
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:12px">
        <label class="field">
          <span>Type</span>
          <select class="control-input proc-filter-type">
            <option value="">Tous les types</option>
            <option value="management">Management</option>
            <option value="realisation">Réalisation</option>
            <option value="support">Support</option>
          </select>
        </label>
        <label class="field">
          <span>Statut</span>
          <select class="control-input proc-filter-status">
            <option value="">Tous les statuts</option>
            <option value="maitrise">Maîtrisé</option>
            <option value="a_surveiller">À surveiller</option>
            <option value="a_revoir">À revoir</option>
            <option value="critique">Critique</option>
          </select>
        </label>
        <label class="field">
          <span>Recherche</span>
          <input type="text" class="control-input proc-search" placeholder="Nom, pilote..." />
        </label>
        <label class="field proc-filter-mine-field" style="justify-content:flex-end">
          <span>&nbsp;</span>
          <span class="proc-filter-mine-toggle">
            <input type="checkbox" class="proc-filter-mine" />
            <span>Mes processus</span>
          </span>
        </label>
      </div>
      <div class="proc-priority-host" style="margin-top:14px"></div>
      <div class="proc-summary-host" style="margin-top:14px"></div>
      <div class="proc-list-host stack" style="margin-top:14px"></div>
    </article>
    <article class="content-card card-soft proc-drawer" hidden>
      <div class="proc-drawer-host"></div>
    </article>
    <article class="content-card card-soft proc-form" hidden>
      <div class="proc-form-host"></div>
    </article>
  `;

  const priorityHost = page.querySelector('.proc-priority-host');
  const summaryHost = page.querySelector('.proc-summary-host');
  const listHost = page.querySelector('.proc-list-host');
  const drawerCard = page.querySelector('.proc-drawer');
  const drawerHost = page.querySelector('.proc-drawer-host');
  const formCard = page.querySelector('.proc-form');
  const formHost = page.querySelector('.proc-form-host');
  const typeFilter = page.querySelector('.proc-filter-type');
  const statusFilter = page.querySelector('.proc-filter-status');
  const searchInput = page.querySelector('.proc-search');
  const mineFilter = page.querySelector('.proc-filter-mine');
  const mineFilterField = page.querySelector('.proc-filter-mine-field');
  const btnTable = page.querySelector('.proc-btn-table');
  const btnMap = page.querySelector('.proc-btn-map');
  const btnNew = page.querySelector('.proc-btn-new');
  const btnExportAll = page.querySelector('.proc-btn-export-all');

  /** @type {Map<string, any[]>} */
  const linkCandidatesCache = new Map();
  async function fetchLinkCandidates(type) {
    if (type === 'isoRequirement') {
      if (linkCandidatesCache.has(type)) return linkCandidatesCache.get(type);
      const iso = await loadConformity();
      const rows = iso.getRequirements().map((r) => ({
        id: r.id,
        title: `${(iso.getNormById(r.normId)?.code || r.normId)} · ${r.clause} ${r.title}`
      }));
      linkCandidatesCache.set(type, rows);
      return rows;
    }
    const endpoint = LINK_CANDIDATE_ENDPOINTS[type];
    if (!endpoint) return null;
    if (linkCandidatesCache.has(type)) return linkCandidatesCache.get(type);
    try {
      const res = await qhseFetch(withSiteQuery(`${endpoint}?limit=200`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
      linkCandidatesCache.set(type, rows);
      return rows;
    } catch (err) {
      console.error('[processes] candidates', type, err);
      linkCandidatesCache.set(type, []);
      return [];
    }
  }

  /** @type {any[]} */
  let processes = [];
  let viewMode = 'map'; // 'map' | 'table'

  function setViewMode(mode) {
    viewMode = mode;
    const tableActive = mode === 'table';
    btnTable.setAttribute('aria-pressed', tableActive ? 'true' : 'false');
    btnMap.setAttribute('aria-pressed', tableActive ? 'false' : 'true');
    btnTable.classList.toggle('is-active', tableActive);
    btnMap.classList.toggle('is-active', !tableActive);
    renderList();
  }
  btnTable.addEventListener('click', () => setViewMode('table'));
  btnMap.addEventListener('click', () => setViewMode('map'));
  typeFilter.addEventListener('change', renderList);
  statusFilter.addEventListener('change', renderList);
  searchInput.addEventListener('input', renderList);
  if (su?.id) {
    mineFilter.addEventListener('change', renderList);
  } else if (mineFilterField) {
    mineFilterField.style.display = 'none';
  }

  btnExportAll?.addEventListener('click', async () => {
    if (!processes.length) {
      showToast('Aucun processus à exporter', 'error');
      return;
    }
    btnExportAll.disabled = true;
    const prevLabel = btnExportAll.textContent;
    btnExportAll.textContent = 'Export en cours…';
    try {
      const [{ assemblePremiumPdfDocument }, { downloadQhseChromePdf, chunkRowsForPdf, QHSE_PDF_EMPTY_MESSAGE, formatQhsePdfGenerationDate }] = await Promise.all([
        import('../utils/pdfPremiumTemplate.js'),
        import('../utils/qhsePdfChrome.js')
      ]);
      const sorted = [...processes].sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0));
      const total = sorted.length;
      const moy = total ? Math.round(sorted.reduce((s, p) => s + (Number(p.score) || 0), 0) / total) : null;
      const critiques = sorted.filter((p) => (Number(p.score) || 0) < 50).length;
      const sansPilote = sorted.filter((p) => !p.ownerUserId).length;

      const summary = `
        <h2 class="qhse-premium-h2">Indicateurs clés</h2>
        <div class="qhse-premium-kpi-grid">
          <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${total}</div><div class="qhse-premium-kpi-lbl">Processus</div></div>
          <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${moy != null ? moy : 'N/A'}</div><div class="qhse-premium-kpi-lbl">Score moyen</div></div>
          <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${critiques}</div><div class="qhse-premium-kpi-lbl">Sous 50/100</div></div>
          <div class="qhse-premium-kpi"><div class="qhse-premium-kpi-val">${sansPilote}</div><div class="qhse-premium-kpi-lbl">Sans pilote</div></div>
        </div>
      `;

      const rowHtml = (p) => {
        const penalties = Array.isArray(p.penalties) && p.penalties.length
          ? p.penalties.map((pen) => pen.label).join(', ')
          : 'Aucun point de vigilance';
        const tone = scoreTone(p.score);
        const badgeBg = tone === 'good' ? '#dcfce7' : tone === 'warning' ? '#ffedd5' : tone === 'critical' ? '#fee2e2' : '#f1f5f9';
        const badgeFg = tone === 'good' ? '#166534' : tone === 'warning' ? '#c2410c' : tone === 'critical' ? '#991b1b' : '#475569';
        return `<tr>
          <td style="font-weight:700">${escapeHtml(p.name || '')}</td>
          <td>${escapeHtml(TYPE_LABELS[p.type] || p.type || '')}</td>
          <td>${escapeHtml(STATUS_LABELS[p.status] || p.status || '')}</td>
          <td style="text-align:center"><span class="qhse-premium-badge" style="background:${badgeBg};color:${badgeFg}">${Number.isFinite(Number(p.score)) ? `${p.score}/100` : 'N/A'}</span></td>
          <td>${escapeHtml(p.owner?.name || 'Non renseigné')}</td>
          <td style="font-size:8pt">${escapeHtml(penalties)}</td>
        </tr>`;
      };

      const colgroup = '<colgroup><col style="width:14%"><col style="width:13%"><col style="width:11%"><col style="width:8%"><col style="width:14%"><col style="width:40%"></colgroup>';
      const chunks = chunkRowsForPdf(sorted, 18);
      const pages = [];
      chunks.forEach((chunk, idx) => {
        const table = chunk.length
          ? `<table class="qhse-premium-table" style="font-size:8.5pt">${colgroup}<thead><tr><th>Processus</th><th>Type</th><th>Statut</th><th>Score</th><th>Pilote</th><th>Points de vigilance</th></tr></thead><tbody>${chunk.map(rowHtml).join('')}</tbody></table>`
          : `<p class="qhse-premium-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`;
        if (idx === 0) {
          pages.push(`${summary}<h2 class="qhse-premium-h2">Détail des processus</h2>${table}`);
        } else {
          pages.push(`<h2 class="qhse-premium-h2">Détail des processus (suite)</h2>${table}`);
        }
      });
      if (!pages.length) pages.push(`${summary}<p class="qhse-premium-muted">${escapeHtml(QHSE_PDF_EMPTY_MESSAGE)}</p>`);

      const html = assemblePremiumPdfDocument('Pilotage des processus — synthèse', pages, {
        reportDate: formatQhsePdfGenerationDate(),
        subtitle: 'Synthèse consolidée pour revue de direction',
        includeCover: false
      });
      await downloadQhseChromePdf(html, 'pilotage-processus-synthese.pdf', {
        margin: [12, 12, 16, 12],
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }, { silentToasts: true });
      showToast('PDF téléchargé avec succès', 'success');
    } catch (err) {
      console.error('[processes] export all pdf', err);
      showToast('Export PDF impossible', 'error');
    } finally {
      btnExportAll.disabled = false;
      btnExportAll.textContent = prevLabel;
    }
  });

  if (canWrite && btnNew) {
    btnNew.addEventListener('click', () => openForm(null));
  }

  async function refresh() {
    listHost.replaceChildren();
    listHost.append(createSkeletonCard(4), createSkeletonCard(4));
    try {
      const res = await qhseFetch(withSiteQuery('/api/processes'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      processes = Array.isArray(rows) ? rows : [];
      renderPriorities();
      renderSummary();
      renderList();
      if (pendingProcessId) {
        const target = pendingProcessId;
        pendingProcessId = null;
        if (processes.some((p) => p.id === target)) {
          openDrawer(target);
        }
      }
    } catch (err) {
      console.error('[processes] GET', err);
      listHost.replaceChildren();
      listHost.append(
        createEmptyState('⚠', 'Liste indisponible', 'Vérifiez la connexion à l’API et réessayez.')
      );
    }
  }

  function renderPriorities() {
    priorityHost.replaceChildren();
    if (!processes.length) return;

    const items = [];
    processes.forEach((p) => {
      const reasons = [];
      if (!p.ownerUserId) reasons.push('Sans pilote');
      if (p.status === 'critique') reasons.push('Statut critique');
      if (p.status === 'a_revoir') reasons.push('À revoir');
      (p.penalties || []).forEach((pen) => reasons.push(pen.label));
      if (reasons.length) items.push({ process: p, reasons });
    });

    if (!items.length) return;

    items.sort((a, b) => (Number(a.process.score) || 0) - (Number(b.process.score) || 0));

    const wrap = document.createElement('div');
    wrap.className = 'proc-priorities content-card-soft';

    const headRow = document.createElement('div');
    headRow.className = 'proc-priorities-head';
    const h = document.createElement('h4');
    h.textContent = `À traiter en priorité (${items.length})`;
    headRow.append(h);

    const auditAllBtn = document.createElement('button');
    auditAllBtn.type = 'button';
    auditAllBtn.className = 'btn btn-secondary proc-audit-all-btn';
    auditAllBtn.textContent = '🤖 Préparer l’audit';
    headRow.append(auditAllBtn);
    wrap.append(headRow);

    const auditAllHost = document.createElement('div');
    auditAllHost.className = 'proc-audit-all-host';
    auditAllBtn.addEventListener('click', async () => {
      auditAllBtn.disabled = true;
      auditAllBtn.textContent = 'Préparation en cours…';
      auditAllHost.replaceChildren();
      const targets = items.slice(0, 5);
      for (const { process } of targets) {
        const block = document.createElement('div');
        block.className = 'proc-link-group';
        block.innerHTML = `<h5>${escapeHtml(process.name || '')}</h5><p style="font-size:13px;color:var(--text2);margin:0">Analyse en cours…</p>`;
        auditAllHost.append(block);
        try {
          const res = await qhseFetch(`/api/processes/${encodeURIComponent(process.id)}/audit-prep`, { method: 'POST' });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            block.innerHTML = `<h5>${escapeHtml(process.name || '')}</h5><p style="font-size:13px;color:var(--text2);margin:0">${escapeHtml(body.error || 'Synthèse indisponible')}</p>`;
            continue;
          }
          const checkpointsHtml = Array.isArray(body.checkpoints) && body.checkpoints.length
            ? `<ul style="margin:6px 0 0;padding-left:20px">${body.checkpoints.map((c) => `<li style="font-size:13px">${escapeHtml(c)}</li>`).join('')}</ul>`
            : '';
          block.innerHTML = `
            <h5 style="cursor:pointer">${escapeHtml(process.name || '')}</h5>
            <p style="font-size:13px;margin:0 0 6px">${escapeHtml(body.summary || '')}</p>
            ${checkpointsHtml}
          `;
          block.querySelector('h5').addEventListener('click', () => openDrawer(process.id));
        } catch (err) {
          console.error('[processes] audit-prep all', err);
          block.innerHTML = `<h5>${escapeHtml(process.name || '')}</h5><p style="font-size:13px;color:var(--text2);margin:0">Synthèse indisponible.</p>`;
        }
      }
      auditAllBtn.disabled = false;
      auditAllBtn.textContent = '🤖 Préparer l’audit';
    });
    const list = document.createElement('div');
    list.className = 'proc-priority-list';
    items.slice(0, 8).forEach(({ process, reasons }) => {
      const row = document.createElement('div');
      row.className = 'proc-priority-row';
      row.style.cursor = 'pointer';
      const score = Number.isFinite(Number(process.score)) ? `${process.score}/100` : 'NA';
      row.innerHTML = `
        <span class="proc-priority-score" style="color:${scoreColor(process.score)}">${score}</span>
        <span class="proc-priority-name">${escapeHtml(process.name || '')}</span>
        <span class="proc-priority-reasons">${reasons.map((r) => escapeHtml(r)).join(' · ')}</span>
      `;
      row.addEventListener('click', () => openDrawer(process.id));
      list.append(row);
    });
    wrap.append(list, auditAllHost);

    priorityHost.append(wrap);
  }

  function renderSummary() {
    summaryHost.replaceChildren();
    if (!processes.length) return;

    const scores = processes.map((p) => Number(p.score)).filter((n) => Number.isFinite(n));
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const critical = processes.filter((p) => p.status === 'critique' || (Number.isFinite(Number(p.score)) && Number(p.score) < 50)).length;
    const toWatch = processes.filter((p) => p.status === 'a_surveiller' || p.status === 'a_revoir').length;

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
    grid.style.gap = '10px';

    function tile(label, value, color) {
      const d = document.createElement('div');
      d.className = 'proc-summary-tile';
      d.innerHTML = `<div style="font-size:11px;color:var(--text2);text-transform:uppercase">${escapeHtml(label)}</div><div style="font-size:24px;font-weight:800;color:${color || 'var(--text1)'}">${escapeHtml(String(value))}</div>`;
      return d;
    }

    grid.append(
      tile('Score moyen', avg === null ? 'NA' : `${avg}/100`, avg === null ? undefined : scoreColor(avg)),
      tile('Processus', processes.length),
      tile('Critiques', critical, critical > 0 ? '#ef4444' : undefined),
      tile('À surveiller / revoir', toWatch, toWatch > 0 ? '#f59e0b' : undefined)
    );
    summaryHost.append(grid);

    const sorted = [...processes]
      .filter((p) => Number.isFinite(Number(p.score)))
      .sort((a, b) => Number(a.score) - Number(b.score))
      .slice(0, 3)
      .filter((p) => Number(p.score) < 100);

    if (sorted.length) {
      const prio = document.createElement('div');
      prio.style.marginTop = '10px';
      const h = document.createElement('div');
      h.style.fontSize = '12px';
      h.style.fontWeight = '700';
      h.style.marginBottom = '4px';
      h.textContent = 'Priorités de pilotage';
      prio.append(h);
      const ul = document.createElement('ul');
      ul.style.margin = '0';
      ul.style.paddingLeft = '20px';
      sorted.forEach((p) => {
        const li = document.createElement('li');
        li.style.fontSize = '13px';
        li.style.cursor = 'pointer';
        const mainPenalty = Array.isArray(p.penalties) && p.penalties.length ? p.penalties[0].label : 'Revue à planifier';
        li.textContent = `${p.name} (${p.score}/100) : ${mainPenalty}`;
        li.addEventListener('click', () => openDrawer(p.id));
        ul.append(li);
      });
      prio.append(ul);
      summaryHost.append(prio);
    }
  }

  function filteredProcesses() {
    const t = typeFilter.value;
    const s = statusFilter.value;
    const q = searchInput.value.trim().toLowerCase();
    return processes.filter((p) => {
      if (t && p.type !== t) return false;
      if (s && p.status !== s) return false;
      if (q) {
        const hay = `${p.name || ''} ${p.owner?.name || ''} ${p.deputy?.name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (su?.id && mineFilter?.checked) {
        if (p.ownerUserId !== su.id && p.deputyUserId !== su.id) return false;
      }
      return true;
    });
  }

  function processCard(p) {
    const card = document.createElement('article');
    card.className = 'proc-card';
    card.style.cursor = 'pointer';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'flex-start';
    card.style.gap = '12px';

    const left = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = p.name || 'Sans nom';
    const sub = document.createElement('p');
    sub.style.margin = '6px 0 0';
    sub.style.fontSize = '12px';
    sub.style.color = 'var(--text2)';
    const parts = [];
    if (p.owner?.name) parts.push(`Pilote : ${p.owner.name}`);
    parts.push(`Statut : ${STATUS_LABELS[p.status] || p.status}`);
    parts.push(`Liens : ${p._count?.links ?? (Array.isArray(p.links) ? p.links.length : 0)}`);
    sub.textContent = parts.join(' · ');
    left.append(title, sub);

    const right = document.createElement('div');
    right.className = 'proc-score-pill';
    right.style.borderColor = scoreColor(p.score);
    const scoreEl = document.createElement('div');
    scoreEl.className = 'proc-score-pill-num';
    scoreEl.style.color = scoreColor(p.score);
    scoreEl.textContent = Number.isFinite(Number(p.score)) ? `${p.score}` : 'NA';
    const scoreSub = document.createElement('div');
    scoreSub.className = 'proc-score-pill-label';
    scoreSub.textContent = 'Maîtrise';
    right.append(scoreEl, scoreSub);

    card.append(left, right);
    card.addEventListener('click', () => openDrawer(p.id));
    return card;
  }

  function buildProcessGraph(rows) {
    if (rows.length < 2) return null;

    // Détermine les paires de processus partageant un même élément lié (risque, audit, action...)
    const byKey = new Map();
    rows.forEach((p) => {
      (Array.isArray(p.links) ? p.links : []).forEach((l) => {
        const key = `${l.linkedType}:${l.linkedId}`;
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key).push(p.id);
      });
    });
    const edgeSet = new Set();
    const edges = [];
    byKey.forEach((ids) => {
      const uniq = [...new Set(ids)];
      for (let i = 0; i < uniq.length; i++) {
        for (let j = i + 1; j < uniq.length; j++) {
          const key = [uniq[i], uniq[j]].sort().join('|');
          if (edgeSet.has(key)) continue;
          edgeSet.add(key);
          edges.push([uniq[i], uniq[j]]);
        }
      }
    });

    // Flux directionnel : sortie d'un processus correspondant à une entrée d'un autre.
    const flowEdges = [];
    rows.forEach((from) => {
      const outputs = (Array.isArray(from.outputs) ? from.outputs : []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
      if (!outputs.length) return;
      rows.forEach((to) => {
        if (to.id === from.id) return;
        const inputs = (Array.isArray(to.inputs) ? to.inputs : []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
        if (outputs.some((o) => inputs.includes(o))) {
          flowEdges.push([from.id, to.id]);
        }
      });
    });

    const wrap = document.createElement('div');
    wrap.className = 'proc-section';
    const title = document.createElement('h4');
    title.textContent = 'Cartographie des interactions';
    wrap.append(title);

    // Disposition en couloirs horizontaux par type (management / réalisation / support),
    // plus lisible qu'un cercle unique quand il y a beaucoup de processus.
    const width = 720;
    const laneTypes = ['management', 'realisation', 'support'].filter((t) => rows.some((p) => p.type === t));
    const laneHeight = 125;
    const height = laneTypes.length * laneHeight;
    const positions = new Map();
    laneTypes.forEach((type, laneIdx) => {
      const laneRows = rows.filter((p) => p.type === type);
      const laneY = laneIdx * laneHeight + laneHeight / 2;
      const step = width / (laneRows.length + 1);
      laneRows.forEach((p, i) => {
        positions.set(p.id, { x: step * (i + 1), y: laneY, type });
      });
    });

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.style.display = 'block';
    svg.style.margin = '0 auto';

    laneTypes.forEach((type, laneIdx) => {
      const laneY = laneIdx * laneHeight;
      if (laneIdx > 0) {
        const sep = document.createElementNS(svgNS, 'line');
        sep.setAttribute('x1', '0');
        sep.setAttribute('y1', String(laneY));
        sep.setAttribute('x2', String(width));
        sep.setAttribute('y2', String(laneY));
        sep.setAttribute('stroke', 'var(--border)');
        sep.setAttribute('stroke-width', '1');
        svg.append(sep);
      }
      const laneLabel = document.createElementNS(svgNS, 'text');
      laneLabel.setAttribute('x', '6');
      laneLabel.setAttribute('y', String(laneY + 16));
      laneLabel.setAttribute('font-size', '10');
      laneLabel.setAttribute('font-weight', '800');
      laneLabel.setAttribute('fill', 'var(--text2)');
      laneLabel.setAttribute('text-transform', 'uppercase');
      laneLabel.textContent = (TYPE_LABELS[type] || type).toUpperCase();
      svg.append(laneLabel);
    });

    const defs = document.createElementNS(svgNS, 'defs');
    rows.forEach((p) => {
      const grad = document.createElementNS(svgNS, 'radialGradient');
      grad.setAttribute('id', `proc-grad-${p.id}`);
      const stop1 = document.createElementNS(svgNS, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', scoreColor(p.score));
      stop1.setAttribute('stop-opacity', '0.35');
      const stop2 = document.createElementNS(svgNS, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', scoreColor(p.score));
      stop2.setAttribute('stop-opacity', '0.05');
      grad.append(stop1, stop2);
      defs.append(grad);
    });
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'proc-arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const arrowPath = document.createElementNS(svgNS, 'path');
    arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrowPath.setAttribute('fill', 'var(--app-accent,#14b8a6)');
    marker.append(arrowPath);
    defs.append(marker);
    svg.append(defs);

    edges.forEach(([a, b]) => {
      const pa = positions.get(a);
      const pb = positions.get(b);
      if (!pa || !pb) return;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(pa.x));
      line.setAttribute('y1', String(pa.y));
      line.setAttribute('x2', String(pb.x));
      line.setAttribute('y2', String(pb.y));
      line.setAttribute('stroke', 'var(--app-accent,#14b8a6)');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-opacity', '0.45');
      line.classList.add('proc-graph-line');
      svg.append(line);
    });

    flowEdges.forEach(([a, b]) => {
      const pa = positions.get(a);
      const pb = positions.get(b);
      if (!pa || !pb) return;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(pa.x));
      line.setAttribute('y1', String(pa.y));
      line.setAttribute('x2', String(pb.x));
      line.setAttribute('y2', String(pb.y));
      line.setAttribute('stroke', 'var(--text2)');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('marker-end', 'url(#proc-arrow)');
      svg.append(line);
    });

    rows.forEach((p) => {
      const pos = positions.get(p.id);
      const g = document.createElementNS(svgNS, 'g');
      g.classList.add('proc-graph-node');
      g.style.cursor = 'pointer';
      g.style.transformOrigin = `${pos.x}px ${pos.y}px`;
      g.addEventListener('click', () => openDrawer(p.id));

      if (Number(p.score) < 75) {
        const ring = document.createElementNS(svgNS, 'circle');
        ring.classList.add('proc-graph-ring');
        ring.setAttribute('cx', String(pos.x));
        ring.setAttribute('cy', String(pos.y));
        ring.setAttribute('r', '16');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', scoreColor(p.score));
        ring.setAttribute('stroke-width', '2');
        g.append(ring);
      }

      const glow = document.createElementNS(svgNS, 'circle');
      glow.setAttribute('cx', String(pos.x));
      glow.setAttribute('cy', String(pos.y));
      glow.setAttribute('r', '26');
      glow.setAttribute('fill', `url(#proc-grad-${p.id})`);
      g.append(glow);

      const circle = document.createElementNS(svgNS, 'circle');
      circle.classList.add('proc-graph-core');
      circle.setAttribute('cx', String(pos.x));
      circle.setAttribute('cy', String(pos.y));
      circle.setAttribute('r', '16');
      circle.setAttribute('fill', scoreColor(p.score));
      circle.setAttribute('fill-opacity', '0.18');
      circle.setAttribute('stroke', scoreColor(p.score));
      circle.setAttribute('stroke-width', '2');
      g.append(circle);

      const scoreText = document.createElementNS(svgNS, 'text');
      scoreText.setAttribute('x', String(pos.x));
      scoreText.setAttribute('y', String(pos.y + 4));
      scoreText.setAttribute('text-anchor', 'middle');
      scoreText.setAttribute('font-size', '11');
      scoreText.setAttribute('font-weight', '800');
      scoreText.setAttribute('fill', scoreColor(p.score));
      scoreText.textContent = Number.isFinite(Number(p.score)) ? String(p.score) : 'NA';
      g.append(scoreText);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', String(pos.x));
      label.setAttribute('y', String(pos.y + 32));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', 'var(--text2)');
      const name = p.name || '';
      label.textContent = name.length > 18 ? `${name.slice(0, 17)}…` : name;
      g.append(label);

      if (p.owner?.name) {
        const ownerLabel = document.createElementNS(svgNS, 'text');
        ownerLabel.setAttribute('x', String(pos.x));
        ownerLabel.setAttribute('y', String(pos.y + 44));
        ownerLabel.setAttribute('text-anchor', 'middle');
        ownerLabel.setAttribute('font-size', '9');
        ownerLabel.setAttribute('font-style', 'italic');
        ownerLabel.setAttribute('fill', 'var(--text2)');
        const ownerName = p.owner.name;
        ownerLabel.textContent = ownerName.length > 18 ? `${ownerName.slice(0, 17)}…` : ownerName;
        g.append(ownerLabel);
      }

      svg.append(g);
    });

    wrap.append(svg);

    if (!edges.length) {
      const hint = document.createElement('p');
      hint.style.fontSize = '12px';
      hint.style.color = 'var(--text2)';
      hint.style.margin = '8px 0 0';
      hint.textContent = 'Aucune interaction détectée : liez vos processus aux mêmes risques, audits ou actions pour visualiser les relations.';
      wrap.append(hint);
    }

    return wrap;
  }

  function buildPilotsSection(rows) {
    const groups = new Map();
    rows.forEach((p) => {
      const owner = p.owner;
      const key = owner?.id || '__none__';
      if (!groups.has(key)) groups.set(key, { owner, processes: [] });
      groups.get(key).processes.push(p);
    });
    const withOwner = [...groups.values()].filter((g) => g.owner);
    if (!withOwner.length) return null;

    withOwner.sort((a, b) => (a.owner?.name || '').localeCompare(b.owner?.name || ''));

    const wrap = document.createElement('div');
    wrap.className = 'proc-pilots';

    const h = document.createElement('h4');
    h.textContent = 'Pilotes de processus';
    wrap.append(h);

    const grid = document.createElement('div');
    grid.className = 'proc-pilots-grid';

    withOwner.forEach(({ owner, processes }) => {
      const card = document.createElement('div');
      card.className = 'proc-pilot-card content-card-soft';

      const head = document.createElement('div');
      head.className = 'proc-pilot-head';
      const avatar = document.createElement('div');
      avatar.className = 'proc-pilot-avatar';
      const label = owner.name || owner.email || 'Pilote';
      avatar.textContent = label.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
      const name = document.createElement('div');
      name.className = 'proc-pilot-name';
      name.textContent = label;
      head.append(avatar, name);
      card.append(head);

      const list = document.createElement('div');
      list.className = 'proc-pilot-list';
      processes.forEach((p) => {
        const item = document.createElement('div');
        item.className = 'proc-pilot-item';
        item.style.cursor = 'pointer';
        const score = Number.isFinite(Number(p.score)) ? `${p.score}/100` : 'NA';
        item.innerHTML = `
          <span class="proc-pilot-item-name">${escapeHtml(p.name || '')}</span>
          <span class="proc-pilot-item-score" style="color:${scoreColor(p.score)}">${score}</span>
        `;
        item.addEventListener('click', () => openDrawer(p.id));
        list.append(item);
      });
      card.append(list);
      grid.append(card);
    });

    wrap.append(grid);
    return wrap;
  }

  function renderList() {
    const rows = filteredProcesses();
    listHost.replaceChildren();
    if (!rows.length) {
      listHost.append(
        createEmptyState(
          '\u{1F5C2}',
          'Aucun processus',
          canWrite
            ? 'Créez votre premier processus pour démarrer le pilotage.'
            : 'Aucun processus n’est encore référencé pour ce périmètre.',
          canWrite ? 'Nouveau processus' : undefined,
          canWrite ? () => openForm(null) : undefined
        )
      );
      return;
    }
    if (viewMode === 'table') {
      const table = document.createElement('table');
      table.className = 'proc-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Pilote</th>
            <th>Statut</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');
      rows.forEach((p) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
          <td>${escapeHtml(p.name || '')}</td>
          <td>${escapeHtml(TYPE_LABELS[p.type] || p.type || '')}</td>
          <td>${escapeHtml(p.owner?.name || '')}</td>
          <td>${escapeHtml(STATUS_LABELS[p.status] || p.status || '')}</td>
          <td style="font-weight:800;color:${scoreColor(p.score)}">${Number.isFinite(Number(p.score)) ? `${p.score}/100` : 'NA'}</td>
        `;
        tr.addEventListener('click', () => openDrawer(p.id));
        tbody.append(tr);
      });
      listHost.append(table);
      return;
    }
    // Vue cartographie : graphe des interactions (processus reliés via un même élément SMI)
    const graph = buildProcessGraph(rows);
    if (graph) listHost.append(graph);

    const pilots = buildPilotsSection(rows);
    if (pilots) listHost.append(pilots);

    // Vue cartographie : groupée par type
    ['management', 'realisation', 'support'].forEach((type) => {
      const group = rows.filter((p) => p.type === type);
      if (!group.length) return;
      const section = document.createElement('div');
      section.className = 'proc-type-section';
      const h = document.createElement('h4');
      h.textContent = TYPE_LABELS[type];
      section.append(h);
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gap = '8px';
      group.forEach((p) => grid.append(processCard(p)));
      section.append(grid);
      listHost.append(section);
    });
  }

  function closeDrawer() {
    drawerCard.hidden = true;
    drawerHost.replaceChildren();
  }

  async function openDrawer(id) {
    drawerCard.hidden = false;
    formCard.hidden = true;
    drawerHost.replaceChildren();
    drawerHost.append(createSkeletonCard(6));
    drawerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const res = await qhseFetch(`/api/processes/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const proc = await res.json();
      await renderDrawer(proc);
    } catch (err) {
      console.error('[processes] GET by id', err);
      drawerHost.replaceChildren();
      drawerHost.append(createEmptyState('⚠', 'Fiche indisponible', 'Impossible de charger ce processus.'));
    }
  }

  async function renderDrawer(proc) {
    const iso = await loadConformity();
    drawerHost.replaceChildren();

    const head = document.createElement('div');
    head.className = 'content-card-head';
    head.innerHTML = `
      <div>
        <div class="section-kicker">${escapeHtml(TYPE_LABELS[proc.type] || proc.type || '')}</div>
        <h3>${escapeHtml(proc.name || '')}</h3>
        <p class="content-card-lead" style="margin:0;max-width:70ch;font-size:13px">
          ${escapeHtml(proc.purpose || 'Finalité non renseignée.')}
        </p>
      </div>
    `;
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.flexWrap = 'wrap';
    const aiBtn = document.createElement('button');
    aiBtn.type = 'button';
    aiBtn.className = 'btn btn-secondary';
    aiBtn.textContent = 'Analyser ce processus';
    const auditPrepBtn = document.createElement('button');
    auditPrepBtn.type = 'button';
    auditPrepBtn.className = 'btn btn-secondary';
    auditPrepBtn.textContent = 'Synthèse avant audit';
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.className = 'btn btn-secondary';
    pdfBtn.textContent = 'Export PDF';
    actions.append(aiBtn, auditPrepBtn, pdfBtn);
    if (canWrite) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary';
      editBtn.textContent = 'Modifier';
      editBtn.addEventListener('click', () => openForm(proc));
      actions.append(editBtn);
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-secondary';
      delBtn.textContent = 'Supprimer';
      delBtn.addEventListener('click', () => deleteProcess(proc));
      actions.append(delBtn);
    }
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Fermer';
    closeBtn.addEventListener('click', closeDrawer);
    actions.append(closeBtn);
    head.append(actions);

    const exportEl = document.createElement('div');
    exportEl.className = 'proc-export-root';
    exportEl.style.marginTop = '12px';

    const scoreBlock = document.createElement('div');
    scoreBlock.style.display = 'flex';
    scoreBlock.style.alignItems = 'center';
    scoreBlock.style.gap = '16px';
    scoreBlock.style.margin = '8px 0 14px';
    const scoreNum = document.createElement('div');
    scoreNum.style.fontSize = '32px';
    scoreNum.style.fontWeight = '800';
    scoreNum.style.color = scoreColor(proc.score);
    scoreNum.textContent = Number.isFinite(Number(proc.score)) ? `${proc.score}/100` : 'NA';
    const scoreLabel = document.createElement('div');
    scoreLabel.innerHTML = `<strong>Score de maîtrise</strong><div style="font-size:12px;color:var(--text2)">Statut : ${escapeHtml(STATUS_LABELS[proc.status] || proc.status || '')}</div>`;
    const sparkHost = document.createElement('div');
    sparkHost.className = 'proc-score-spark';
    sparkHost.style.flex = '1';
    sparkHost.style.minWidth = '120px';
    scoreBlock.append(scoreNum, scoreLabel, sparkHost);
    exportEl.append(scoreBlock);

    qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/score-history`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length < 2) return;
        const w = 160;
        const h = 36;
        const scores = rows.map((r) => Number(r.score));
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const range = max - min || 1;
        const points = scores.map((s, i) => {
          const x = (i / (scores.length - 1)) * w;
          const y = h - ((s - min) / range) * h;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        const last = scores[scores.length - 1];

        function trendFor(days) {
          const target = Date.now() - days * 24 * 60 * 60 * 1000;
          let ref = null;
          for (const r of rows) {
            const t = new Date(r.capturedAt).getTime();
            if (Number.isFinite(t) && t <= target) ref = r;
          }
          if (!ref) return '';
          const diff = Math.round(last - Number(ref.score));
          if (diff === 0) return `<span style="color:var(--text2)">${days}j : stable</span>`;
          const arrow = diff > 0 ? '▲' : '▼';
          const color = diff > 0 ? '#22c55e' : '#ef4444';
          return `<span style="color:${color};font-weight:700">${days}j : ${arrow} ${Math.abs(diff)}</span>`;
        }
        const trends = [trendFor(30), trendFor(90)].filter(Boolean).join(' · ');

        sparkHost.innerHTML = `
          <div style="font-size:11px;color:var(--text2);text-transform:uppercase;margin-bottom:2px">Évolution du score</div>
          <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block">
            <polyline points="${points}" fill="none" stroke="${scoreColor(last)}" stroke-width="2" />
          </svg>
          ${trends ? `<div style="font-size:11px;margin-top:2px">${trends}</div>` : ''}
        `;
      })
      .catch(() => {});

    if (Array.isArray(proc.penalties) && proc.penalties.length) {
      const pen = document.createElement('div');
      pen.className = 'proc-section';
      pen.innerHTML = `<strong>Points de vigilance</strong>`;
      const ul = document.createElement('ul');
      ul.style.margin = '6px 0 0';
      ul.style.paddingLeft = '20px';
      proc.penalties.forEach((p) => {
        const li = document.createElement('li');
        li.style.fontSize = '13px';
        li.textContent = `${p.label} (${p.points} pts)`;
        ul.append(li);
      });
      pen.append(ul);
      exportEl.append(pen);
    }

    // Preuves de maîtrise : disponibles vs manquantes
    {
      const links = Array.isArray(proc.links) ? proc.links : [];
      const countLinks = (type) => links.filter((l) => l.linkedType === type).length;
      const penaltyByKey = new Map((proc.penalties || []).map((p) => [p.key, p]));

      const rows = [];
      const docCount = countLinks('document');
      const docExpired = penaltyByKey.get('documentsExpired');
      rows.push({
        label: 'Documents liés',
        ok: docCount > 0,
        detail: docCount ? `${docCount} document(s) lié(s)` : 'Aucun document lié',
        issue: docExpired ? docExpired.label : null
      });

      const isoLinks = links.filter((l) => l.linkedType === 'isoRequirement');
      const isoMissing = penaltyByKey.get('isoEvidenceMissing');
      const normCounts = new Map();
      isoLinks.forEach((l) => {
        const r = getIsoRequirementsMap(iso).get(l.linkedId);
        const code = r ? (iso.getNormById(r.normId)?.code || r.normId) : null;
        if (code) normCounts.set(code, (normCounts.get(code) || 0) + 1);
      });
      const normDetail = [...normCounts.entries()].map(([code, n]) => `${code} (${n})`).join(', ');
      rows.push({
        label: 'Exigences ISO',
        ok: isoLinks.length > 0 && !isoMissing,
        detail: isoLinks.length ? `${isoLinks.length} exigence(s) reliée(s)${normDetail ? ` — ${normDetail}` : ''}` : 'Aucune exigence ISO reliée',
        issue: isoMissing ? isoMissing.label : null
      });

      const auditCount = countLinks('audit');
      const ncOpen = penaltyByKey.get('ncOpen');
      rows.push({
        label: 'Audits liés',
        ok: auditCount > 0 && !ncOpen,
        detail: auditCount ? `${auditCount} audit(s) lié(s)` : 'Aucun audit lié',
        issue: ncOpen ? ncOpen.label : null
      });

      const riskCount = countLinks('risk');
      const risksCritical = penaltyByKey.get('risksCritical');
      rows.push({
        label: 'Risques liés',
        ok: riskCount > 0 && !risksCritical,
        detail: riskCount ? `${riskCount} risque(s) lié(s)` : 'Aucun risque lié',
        issue: risksCritical ? risksCritical.label : null
      });

      const actionCount = countLinks('action');
      const actionsOverdue = penaltyByKey.get('actionsOverdue');
      rows.push({
        label: 'Actions liées',
        ok: actionCount > 0 && !actionsOverdue,
        detail: actionCount ? `${actionCount} action(s) liée(s)` : 'Aucune action liée',
        issue: actionsOverdue ? actionsOverdue.label : null
      });

      const proofSection = document.createElement('div');
      proofSection.className = 'proc-section proc-proofs';
      const proofTitle = document.createElement('h4');
      proofTitle.textContent = 'Preuves de maîtrise';
      proofSection.append(proofTitle);
      rows.forEach((r) => {
        const row = document.createElement('div');
        row.className = 'proc-proof-row';
        const status = r.issue ? '⚠' : r.ok ? '✓' : '–';
        const statusClass = r.issue ? 'proc-proof-warn' : r.ok ? 'proc-proof-ok' : 'proc-proof-none';
        row.innerHTML = `
          <span class="proc-proof-status ${statusClass}">${status}</span>
          <span class="proc-proof-label">${escapeHtml(r.label)}</span>
          <span class="proc-proof-detail">${escapeHtml(r.issue ? r.issue : r.detail)}</span>
        `;
        proofSection.append(row);
      });
      exportEl.append(proofSection);
    }

    const infoGrid = document.createElement('div');
    infoGrid.className = 'proc-section';
    infoGrid.style.display = 'grid';
    infoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
    infoGrid.style.gap = '10px';
    function infoItem(label, value) {
      const d = document.createElement('div');
      d.innerHTML = `<div style="font-size:11px;color:var(--text2);text-transform:uppercase">${escapeHtml(label)}</div><div style="font-size:13px;font-weight:600">${escapeHtml(value || 'Non renseigné')}</div>`;
      return d;
    }
    infoGrid.append(
      infoItem('Pilote', proc.owner?.name),
      infoItem('Suppléant', proc.deputy?.name),
      infoItem('Fréquence de revue', proc.reviewFrequency),
      infoItem('Prochaine revue', proc.nextReviewAt ? new Date(proc.nextReviewAt).toLocaleDateString('fr-FR') : '')
    );
    exportEl.append(infoGrid);

    function listField(label, arr) {
      const d = document.createElement('div');
      d.style.marginBottom = '10px';
      const items = Array.isArray(arr) && arr.length ? arr.map((v) => escapeHtml(String(v))).join(', ') : 'Non renseigné';
      d.innerHTML = `<div style="font-size:11px;color:var(--text2);text-transform:uppercase">${escapeHtml(label)}</div><div style="font-size:13px">${items}</div>`;
      return d;
    }
    const ioSection = document.createElement('div');
    ioSection.className = 'proc-section';
    ioSection.append(
      listField('Entrées', proc.inputs),
      listField('Sorties', proc.outputs),
      listField('Parties intéressées', proc.interestedParties)
    );
    exportEl.append(ioSection);

    drawerHost.append(head, exportEl);

    // AI panel
    const aiHost = document.createElement('div');
    aiHost.style.marginTop = '14px';
    drawerHost.append(aiHost);

    aiBtn.addEventListener('click', async () => {
      aiBtn.disabled = true;
      aiHost.innerHTML = '<p style="font-size:13px;color:var(--text2)">Analyse en cours…</p>';
      try {
        const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/analyze`, { method: 'POST' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          aiHost.innerHTML = `<p style="font-size:13px;color:var(--text2)">${escapeHtml(body.error || 'Analyse indisponible')}</p>`;
          return;
        }
        const block = document.createElement('div');
        block.className = 'proc-link-group';
        const narr = document.createElement('p');
        narr.style.margin = '0 0 10px';
        narr.style.fontSize = '13px';
        narr.textContent = body.narrative || 'Aucune synthèse disponible.';
        block.append(narr);
        if (Array.isArray(body.actions) && body.actions.length) {
          const ul = document.createElement('ul');
          ul.style.margin = '0';
          ul.style.paddingLeft = '20px';
          body.actions.forEach((a) => {
            const li = document.createElement('li');
            li.style.fontSize = '13px';
            li.style.marginBottom = '4px';
            li.textContent = `${a.title || 'Action'} : ${a.description || ''}`;
            ul.append(li);
          });
          block.append(ul);
        }
        aiHost.replaceChildren(block);
      } catch (err) {
        console.error('[processes] analyze', err);
        aiHost.innerHTML = '<p style="font-size:13px;color:var(--text2)">Analyse indisponible.</p>';
      } finally {
        aiBtn.disabled = false;
      }
    });

    auditPrepBtn.addEventListener('click', async () => {
      auditPrepBtn.disabled = true;
      aiHost.innerHTML = '<p style="font-size:13px;color:var(--text2)">Préparation en cours…</p>';
      try {
        const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/audit-prep`, { method: 'POST' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          aiHost.innerHTML = `<p style="font-size:13px;color:var(--text2)">${escapeHtml(body.error || 'Synthèse indisponible')}</p>`;
          return;
        }
        const block = document.createElement('div');
        block.className = 'proc-link-group';
        const h = document.createElement('h5');
        h.textContent = 'Synthèse avant audit';
        block.append(h);
        const summary = document.createElement('p');
        summary.style.margin = '0 0 10px';
        summary.style.fontSize = '13px';
        summary.textContent = body.summary || 'Aucune synthèse disponible.';
        block.append(summary);
        if (Array.isArray(body.checkpoints) && body.checkpoints.length) {
          const ul = document.createElement('ul');
          ul.style.margin = '0';
          ul.style.paddingLeft = '20px';
          body.checkpoints.forEach((c) => {
            const li = document.createElement('li');
            li.style.fontSize = '13px';
            li.style.marginBottom = '4px';
            li.textContent = c;
            ul.append(li);
          });
          block.append(ul);
        }
        aiHost.replaceChildren(block);
      } catch (err) {
        console.error('[processes] audit-prep', err);
        aiHost.innerHTML = '<p style="font-size:13px;color:var(--text2)">Synthèse indisponible.</p>';
      } finally {
        auditPrepBtn.disabled = false;
      }
    });

    pdfBtn.addEventListener('click', async () => {
      pdfBtn.disabled = true;
      try {
        const [{ generatePremiumPdf, escapePdfText }, { downloadQhseChromePdf }] = await Promise.all([
          import('../utils/pdfPremiumTemplate.js'),
          import('../utils/qhsePdfChrome.js')
        ]);

        const links = Array.isArray(proc.links) ? proc.links : [];
        const countLinks = (type) => links.filter((l) => l.linkedType === type).length;
        const penaltyByKey = new Map((proc.penalties || []).map((p) => [p.key, p]));
        const isoLinks = links.filter((l) => l.linkedType === 'isoRequirement');
        const normCounts = new Map();
        isoLinks.forEach((l) => {
          const r = getIsoRequirementsMap(iso).get(l.linkedId);
          const code = r ? (iso.getNormById(r.normId)?.code || r.normId) : null;
          if (code) normCounts.set(code, (normCounts.get(code) || 0) + 1);
        });
        const normDetail = [...normCounts.entries()].map(([code, n]) => `${code} (${n})`).join(', ');

        const proofRows = [
          { label: 'Documents liés', ok: countLinks('document') > 0, detail: countLinks('document') ? `${countLinks('document')} document(s) lié(s)` : 'Aucun document lié', issue: penaltyByKey.get('documentsExpired')?.label },
          { label: 'Exigences ISO', ok: isoLinks.length > 0 && !penaltyByKey.get('isoEvidenceMissing'), detail: isoLinks.length ? `${isoLinks.length} exigence(s) reliée(s)${normDetail ? ` — ${normDetail}` : ''}` : 'Aucune exigence ISO reliée', issue: penaltyByKey.get('isoEvidenceMissing')?.label },
          { label: 'Audits liés', ok: countLinks('audit') > 0 && !penaltyByKey.get('ncOpen'), detail: countLinks('audit') ? `${countLinks('audit')} audit(s) lié(s)` : 'Aucun audit lié', issue: penaltyByKey.get('ncOpen')?.label },
          { label: 'Risques liés', ok: countLinks('risk') > 0 && !penaltyByKey.get('risksCritical'), detail: countLinks('risk') ? `${countLinks('risk')} risque(s) lié(s)` : 'Aucun risque lié', issue: penaltyByKey.get('risksCritical')?.label },
          { label: 'Actions liées', ok: countLinks('action') > 0 && !penaltyByKey.get('actionsOverdue'), detail: countLinks('action') ? `${countLinks('action')} action(s) liée(s)` : 'Aucune action liée', issue: penaltyByKey.get('actionsOverdue')?.label }
        ];
        const proofsHtml = `<ul class="qhse-premium-ul">${proofRows.map((r) => {
          const status = r.issue ? '⚠' : r.ok ? '✓' : '–';
          return `<li>${status} ${escapePdfText(r.label)} : ${escapePdfText(r.issue || r.detail)}</li>`;
        }).join('')}</ul>`;

        const penaltiesHtml = Array.isArray(proc.penalties) && proc.penalties.length
          ? `<ul class="qhse-premium-ul">${proc.penalties.map((p) => `<li>${escapePdfText(p.label)} (${escapePdfText(String(p.points))} pts)</li>`).join('')}</ul>`
          : '<p class="qhse-premium-muted" style="margin:0">Aucun point de vigilance.</p>';

        const infoHtml = `<table class="qhse-premium-table"><tbody>
          <tr><td><strong>Pilote</strong></td><td>${escapePdfText(proc.owner?.name || 'Non renseigné')}</td></tr>
          <tr><td><strong>Suppléant</strong></td><td>${escapePdfText(proc.deputy?.name || 'Non renseigné')}</td></tr>
          <tr><td><strong>Fréquence de revue</strong></td><td>${escapePdfText(proc.reviewFrequency || 'Non renseigné')}</td></tr>
          <tr><td><strong>Prochaine revue</strong></td><td>${escapePdfText(proc.nextReviewAt ? new Date(proc.nextReviewAt).toLocaleDateString('fr-FR') : 'Non renseigné')}</td></tr>
          <tr><td><strong>Entrées</strong></td><td>${escapePdfText(Array.isArray(proc.inputs) && proc.inputs.length ? proc.inputs.join(', ') : 'Non renseigné')}</td></tr>
          <tr><td><strong>Sorties</strong></td><td>${escapePdfText(Array.isArray(proc.outputs) && proc.outputs.length ? proc.outputs.join(', ') : 'Non renseigné')}</td></tr>
          <tr><td><strong>Parties intéressées</strong></td><td>${escapePdfText(Array.isArray(proc.interestedParties) && proc.interestedParties.length ? proc.interestedParties.join(', ') : 'Non renseigné')}</td></tr>
        </tbody></table>`;

        const html = generatePremiumPdf({
          title: proc.name || 'Processus',
          subtitle: `${TYPE_LABELS[proc.type] || proc.type || ''} · ${STATUS_LABELS[proc.status] || proc.status || ''}`,
          summary: `<p style="margin:0">Score de maîtrise : <strong>${Number.isFinite(Number(proc.score)) ? `${proc.score}/100` : 'Non disponible'}</strong></p>`,
          compliancePct: Number.isFinite(Number(proc.score)) ? Number(proc.score) : null,
          sections: [
            { title: 'Points de vigilance', html: penaltiesHtml },
            { title: 'Preuves de maîtrise', html: proofsHtml },
            { title: 'Informations générales', html: infoHtml }
          ]
        });
        await downloadQhseChromePdf(html, `processus-${(proc.name || 'fiche').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`);
      } catch (err) {
        console.error('[processes] export pdf', err);
        showToast('Export PDF impossible', 'error');
      } finally {
        pdfBtn.disabled = false;
      }
    });

    // Links section
    const linksSection = document.createElement('div');
    linksSection.className = 'proc-section';
    const linksTitle = document.createElement('h4');
    linksTitle.textContent = 'Éléments liés';
    linksSection.append(linksTitle);

    const byType = new Map();
    (Array.isArray(proc.links) ? proc.links : []).forEach((l) => {
      if (!byType.has(l.linkedType)) byType.set(l.linkedType, []);
      byType.get(l.linkedType).push(l);
    });

    if (canWrite) {
      const isoSuggestBtn = document.createElement('button');
      isoSuggestBtn.type = 'button';
      isoSuggestBtn.className = 'btn btn-secondary';
      isoSuggestBtn.style.marginBottom = '10px';
      isoSuggestBtn.textContent = '🤖 Suggérer des exigences ISO';
      const isoSuggestHost = document.createElement('div');
      isoSuggestHost.className = 'proc-iso-suggest-host';
      isoSuggestBtn.addEventListener('click', () => {
        const alreadyLinked = new Set((byType.get('isoRequirement') || []).map((l) => l.linkedId));
        const suggestions = suggestIsoRequirementsForProcess(iso, proc, alreadyLinked);
        isoSuggestHost.replaceChildren();
        if (!suggestions.length) {
          isoSuggestHost.innerHTML = '<p style="font-size:13px;color:var(--text2);margin:0">Aucune exigence supplémentaire suggérée pour ce processus.</p>';
          return;
        }
        suggestions.forEach((req) => {
          const row = document.createElement('div');
          row.className = 'proc-iso-suggest-row';
          row.innerHTML = `
            <span class="proc-iso-suggest-label">${escapeHtml(iso.getNormById(req.normId)?.code || req.normId)} · ${escapeHtml(req.clause)} ${escapeHtml(req.title)}</span>
            <button type="button" class="btn btn-secondary proc-iso-suggest-link" style="padding:2px 8px;font-size:11px">Lier</button>
          `;
          row.querySelector('.proc-iso-suggest-link').addEventListener('click', async (ev) => {
            const btn = ev.currentTarget;
            btn.disabled = true;
            try {
              const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/links`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedType: 'isoRequirement', linkedId: req.id })
              });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `HTTP ${res.status}`);
              }
              await openDrawer(proc.id);
              await refresh();
            } catch (err) {
              console.error('[processes] link iso suggestion', err);
              showToast(err.message || 'Liaison impossible', 'error');
              btn.disabled = false;
            }
          });
          isoSuggestHost.append(row);
        });
      });
      linksSection.append(isoSuggestBtn, isoSuggestHost);
    }

    LINK_TYPE_ORDER.forEach((type) => {
      const items = byType.get(type) || [];
      const block = document.createElement('div');
      block.className = 'proc-link-group';
      const h = document.createElement('h5');
      h.textContent = `${LINK_TYPE_LABELS[type]} (${items.length})`;
      block.append(h);
      if (items.length) {
        const ul = document.createElement('ul');
        ul.style.margin = '0';
        ul.style.paddingLeft = '20px';
        items.forEach((l) => {
          const li = document.createElement('li');
          li.style.fontSize = '12px';
          li.style.display = 'flex';
          li.style.justifyContent = 'space-between';
          li.style.gap = '8px';
          const span = document.createElement('span');
          const idLabel = type === 'isoRequirement' ? isoRequirementLabel(iso, l.linkedId) : l.linkedId;
          span.textContent = `${idLabel}${l.role ? ` (${l.role})` : ''}`;
          li.append(span);
          if (canWrite) {
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.className = 'btn btn-secondary';
            rm.style.padding = '2px 8px';
            rm.style.fontSize = '11px';
            rm.textContent = 'Retirer';
            rm.addEventListener('click', async () => {
              try {
                const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/links/${encodeURIComponent(l.id)}`, { method: 'DELETE' });
                if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
                await openDrawer(proc.id);
                await refresh();
              } catch (err) {
                console.error('[processes] remove link', err);
                showToast('Suppression du lien impossible', 'error');
              }
            });
            li.append(rm);
          }
          ul.append(li);
        });
        block.append(ul);
      }
      linksSection.append(block);
    });

    if (canWrite) {
      const addForm = document.createElement('div');
      addForm.style.marginTop = '10px';
      addForm.style.display = 'flex';
      addForm.style.gap = '8px';
      addForm.style.flexWrap = 'wrap';
      addForm.innerHTML = `
        <select class="control-input proc-link-type" style="max-width:180px">
          ${LINK_TYPE_ORDER.map((t) => `<option value="${t}">${escapeHtml(LINK_TYPE_LABELS[t])}</option>`).join('')}
        </select>
        <span class="proc-link-id-host" style="display:inline-flex"></span>
        <button type="button" class="btn btn-secondary proc-link-add">Lier</button>
      `;
      linksSection.append(addForm);
      const typeSelect = addForm.querySelector('.proc-link-type');
      const idHost = addForm.querySelector('.proc-link-id-host');

      async function renderLinkIdField() {
        const type = typeSelect.value;
        const candidates = await fetchLinkCandidates(type);
        idHost.replaceChildren();
        if (candidates) {
          const sel = document.createElement('select');
          sel.className = 'control-input proc-link-id';
          sel.style.maxWidth = '320px';
          sel.innerHTML = `<option value="">Sélectionner...</option>` + candidates
            .map((r) => `<option value="${escapeHtml(String(r.id))}">${escapeHtml(candidateLabel(r))}</option>`)
            .join('');
          idHost.append(sel);
          if (!candidates.length) {
            sel.disabled = true;
            sel.title = 'Aucun élément disponible pour ce type';
          }
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'control-input proc-link-id';
          input.style.maxWidth = '240px';
          input.placeholder = 'Identifiant de l’élément lié';
          idHost.append(input);
        }
      }
      typeSelect.addEventListener('change', renderLinkIdField);
      renderLinkIdField();

      addForm.querySelector('.proc-link-add').addEventListener('click', async () => {
        const linkedType = typeSelect.value;
        const linkedId = (idHost.querySelector('.proc-link-id')?.value || '').trim();
        if (!linkedId) {
          showToast('Élément lié requis', 'error');
          return;
        }
        try {
          const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkedType, linkedId })
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          await openDrawer(proc.id);
          await refresh();
        } catch (err) {
          console.error('[processes] add link', err);
          showToast(err.message || 'Liaison impossible', 'error');
        }
      });
    }

    drawerHost.append(linksSection);

    // Reviews section
    const reviewsSection = document.createElement('div');
    reviewsSection.className = 'proc-section';
    const reviewsTitle = document.createElement('h4');
    reviewsTitle.textContent = `Historique des revues (${(proc.reviews || []).length})`;
    reviewsSection.append(reviewsTitle);

    const reviews = Array.isArray(proc.reviews) ? proc.reviews : [];
    if (reviews.length) {
      reviews.forEach((r) => {
        const block = document.createElement('div');
        block.className = 'proc-link-group';
        const h = document.createElement('h5');
        const date = r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString('fr-FR') : '';
        const by = r.reviewedBy?.name ? ` · ${escapeHtml(r.reviewedBy.name)}` : '';
        h.textContent = `${date}${by}${r.status ? ` · ${STATUS_LABELS[r.status] || r.status}` : ''}`;
        const p = document.createElement('p');
        p.style.margin = '4px 0 0';
        p.style.fontSize = '12px';
        p.textContent = r.conclusion || '';
        block.append(h, p);
        reviewsSection.append(block);
      });
    } else {
      const empty = document.createElement('p');
      empty.style.fontSize = '12px';
      empty.style.color = 'var(--text2)';
      empty.textContent = 'Aucune revue enregistrée pour ce processus.';
      reviewsSection.append(empty);
    }

    if (canWrite) {
      const form = document.createElement('div');
      form.style.marginTop = '10px';
      form.style.display = 'flex';
      form.style.flexDirection = 'column';
      form.style.gap = '8px';
      form.innerHTML = `
        <textarea class="control-input proc-review-conclusion" rows="3" placeholder="Conclusion de la revue..."></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select class="control-input proc-review-status" style="max-width:220px">
            <option value="">Statut inchangé</option>
            <option value="conforme">Maîtrisé</option>
            <option value="a_surveiller">À surveiller</option>
            <option value="a_revoir">À revoir</option>
            <option value="critique">Critique</option>
          </select>
          <label class="field" style="margin:0">
            <span>Prochaine revue</span>
            <input type="date" class="control-input proc-review-next" />
          </label>
          <button type="button" class="btn btn-secondary proc-review-suggest">Suggérer une conclusion</button>
          <button type="button" class="btn btn-primary proc-review-add">Enregistrer la revue</button>
        </div>
      `;
      reviewsSection.append(form);
      form.querySelector('.proc-review-suggest').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const textarea = form.querySelector('.proc-review-conclusion');
        btn.disabled = true;
        const prevText = btn.textContent;
        btn.textContent = 'Rédaction en cours…';
        try {
          const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/reviews/suggest`, { method: 'POST' });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
          textarea.value = body.conclusion || '';
        } catch (err) {
          console.error('[processes] suggest review conclusion', err);
          showToast(err.message || 'Suggestion indisponible', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = prevText;
        }
      });
      form.querySelector('.proc-review-add').addEventListener('click', async () => {
        const conclusion = form.querySelector('.proc-review-conclusion').value.trim();
        const status = form.querySelector('.proc-review-status').value;
        const nextReviewAt = form.querySelector('.proc-review-next').value;
        if (!conclusion) {
          showToast('Conclusion requise', 'error');
          return;
        }
        try {
          const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conclusion,
              status: status || undefined,
              nextReviewAt: nextReviewAt || undefined
            })
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          await openDrawer(proc.id);
          await refresh();
        } catch (err) {
          console.error('[processes] add review', err);
          showToast(err.message || 'Enregistrement de la revue impossible', 'error');
        }
      });
    }

    drawerHost.append(reviewsSection);
  }

  async function deleteProcess(proc) {
    if (!window.confirm(`Supprimer le processus ${proc.name} ?`)) return;
    try {
      const res = await qhseFetch(`/api/processes/${encodeURIComponent(proc.id)}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      showToast('Processus supprimé', 'info');
      closeDrawer();
      await refresh();
    } catch (err) {
      console.error('[processes] delete', err);
      showToast('Suppression impossible', 'error');
    }
  }

  function openForm(proc) {
    drawerCard.hidden = true;
    formCard.hidden = false;
    formHost.replaceChildren();
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const isEdit = Boolean(proc && proc.id);
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="content-card-head">
        <div>
          <div class="section-kicker">${isEdit ? 'Modification' : 'Création'}</div>
          <h3>${isEdit ? 'Modifier le processus' : 'Nouveau processus'}</h3>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:8px">
        <label class="field field-full">
          <span>Nom <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input pf-name" maxlength="200" value="${escapeHtml(proc?.name || '')}" />
        </label>
        <label class="field">
          <span>Type</span>
          <select class="control-input pf-type">
            <option value="management"${proc?.type === 'management' ? ' selected' : ''}>Management</option>
            <option value="realisation"${!proc || proc.type === 'realisation' ? ' selected' : ''}>Réalisation</option>
            <option value="support"${proc?.type === 'support' ? ' selected' : ''}>Support</option>
          </select>
        </label>
        <label class="field">
          <span>Statut</span>
          <select class="control-input pf-status">
            <option value="conforme"${proc?.status === 'conforme' ? ' selected' : ''}>Conforme</option>
            <option value="a_surveiller"${!proc || proc.status === 'a_surveiller' ? ' selected' : ''}>À surveiller</option>
            <option value="critique"${proc?.status === 'critique' ? ' selected' : ''}>Critique</option>
            <option value="a_revoir"${proc?.status === 'a_revoir' ? ' selected' : ''}>À revoir</option>
          </select>
        </label>
        <label class="field field-full">
          <span>Finalité</span>
          <textarea class="control-input pf-purpose" rows="2" maxlength="2000">${escapeHtml(proc?.purpose || '')}</textarea>
        </label>
        <label class="field">
          <span>Fréquence de revue</span>
          <input type="text" class="control-input pf-frequency" maxlength="60" value="${escapeHtml(proc?.reviewFrequency || '')}" placeholder="Annuelle, semestrielle..." />
        </label>
        <label class="field">
          <span>Prochaine revue</span>
          <input type="date" class="control-input pf-next-review" value="${proc?.nextReviewAt ? String(proc.nextReviewAt).slice(0, 10) : ''}" />
        </label>
        <label class="field field-full">
          <span>Entrées (séparées par des virgules)</span>
          <input type="text" class="control-input pf-inputs" value="${escapeHtml((proc?.inputs || []).join(', '))}" />
        </label>
        <label class="field field-full">
          <span>Sorties (séparées par des virgules)</span>
          <input type="text" class="control-input pf-outputs" value="${escapeHtml((proc?.outputs || []).join(', '))}" />
        </label>
        <label class="field field-full">
          <span>Parties intéressées (séparées par des virgules)</span>
          <input type="text" class="control-input pf-parties" value="${escapeHtml((proc?.interestedParties || []).join(', '))}" />
        </label>
        <div class="field-full" style="display:flex;gap:8px;justify-content:flex-end">
          <button type="button" class="btn btn-secondary pf-cancel">Annuler</button>
          <button type="button" class="btn btn-primary pf-save">${isEdit ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </div>
    `;
    formHost.append(wrap);

    wrap.querySelector('.pf-cancel').addEventListener('click', () => {
      formCard.hidden = true;
    });

    wrap.querySelector('.pf-save').addEventListener('click', async () => {
      const name = wrap.querySelector('.pf-name').value.trim();
      if (!name) {
        showToast('Le nom est requis', 'error');
        return;
      }
      const toArr = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = {
        name,
        type: wrap.querySelector('.pf-type').value,
        status: wrap.querySelector('.pf-status').value,
        purpose: wrap.querySelector('.pf-purpose').value.trim() || null,
        reviewFrequency: wrap.querySelector('.pf-frequency').value.trim() || null,
        nextReviewAt: wrap.querySelector('.pf-next-review').value || null,
        inputs: toArr(wrap.querySelector('.pf-inputs').value),
        outputs: toArr(wrap.querySelector('.pf-outputs').value),
        interestedParties: toArr(wrap.querySelector('.pf-parties').value)
      };
      const saveBtn = wrap.querySelector('.pf-save');
      saveBtn.disabled = true;
      try {
        const res = await qhseFetch(isEdit ? `/api/processes/${encodeURIComponent(proc.id)}` : '/api/processes', {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(typeof body.error === 'string' ? body.error : 'Erreur enregistrement', 'error');
          return;
        }
        showToast(isEdit ? 'Processus mis à jour' : 'Processus créé', 'info');
        formCard.hidden = true;
        await refresh();
        if (isEdit) await openDrawer(proc.id);
      } catch (err) {
        console.error('[processes] save', err);
        showToast('Erreur serveur', 'error');
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  refresh();
  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'processes-page-anchor';
  return page;
}
