import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState, createSkeletonCard } from '../utils/designSystem.js';
import { canResource } from '../utils/permissionsUi.js';
import { getSessionUser } from '../data/sessionUser.js';

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
    .proc-type-section{border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:14px;background:var(--surface2, rgba(148,163,184,0.04))}
    .proc-type-section h4{margin:0 0 10px;font-size:14px;font-weight:800}
    .proc-card{border:1px solid var(--border);border-radius:10px;padding:12px 14px;background:var(--surface1,#fff);transition:box-shadow .15s, border-color .15s}
    .proc-card:hover{box-shadow:0 2px 10px rgba(15,23,42,.08);border-color:var(--app-accent,#14b8a6)}
    .proc-summary-tile{border:1px solid var(--border);border-radius:10px;padding:12px;background:var(--surface2, rgba(148,163,184,0.04))}
    .proc-section{border:1px solid var(--border);border-radius:12px;padding:14px;margin-top:14px;background:var(--surface2, rgba(148,163,184,0.04))}
    .proc-section h4{margin:0 0 10px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:var(--text2)}
    .proc-link-group{border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:8px;background:var(--surface1,#fff)}
    .proc-link-group h5{margin:0 0 4px;font-size:12px;font-weight:700}
    .proc-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--border);border-radius:10px;overflow:hidden}
    .proc-table th{text-align:left;font-size:11px;text-transform:uppercase;color:var(--text2);background:var(--surface2, rgba(148,163,184,0.06));padding:10px 12px}
    .proc-table td{padding:10px 12px;border-top:1px solid var(--border);font-size:13px}
    .proc-table tbody tr:hover{background:var(--surface2, rgba(148,163,184,0.06))}
    .proc-graph-line{stroke-dasharray:4 4;animation:proc-graph-flow 12s linear infinite}
    @keyframes proc-graph-flow{to{stroke-dashoffset:-200}}
    .proc-graph-node{transition:transform .2s ease}
    .proc-graph-node:hover{transform:scale(1.12)}
    .proc-graph-node circle.proc-graph-ring{animation:proc-graph-pulse 2.4s ease-in-out infinite}
    @keyframes proc-graph-pulse{0%,100%{opacity:.35;r:16}50%{opacity:0;r:26}}
    .proc-graph-node circle.proc-graph-core{transition:filter .2s ease}
    .proc-graph-node:hover circle.proc-graph-core{filter:brightness(1.15)}
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
      </div>
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

  const summaryHost = page.querySelector('.proc-summary-host');
  const listHost = page.querySelector('.proc-list-host');
  const drawerCard = page.querySelector('.proc-drawer');
  const drawerHost = page.querySelector('.proc-drawer-host');
  const formCard = page.querySelector('.proc-form');
  const formHost = page.querySelector('.proc-form-host');
  const typeFilter = page.querySelector('.proc-filter-type');
  const statusFilter = page.querySelector('.proc-filter-status');
  const searchInput = page.querySelector('.proc-search');
  const btnTable = page.querySelector('.proc-btn-table');
  const btnMap = page.querySelector('.proc-btn-map');
  const btnNew = page.querySelector('.proc-btn-new');

  /** @type {Map<string, any[]>} */
  const linkCandidatesCache = new Map();
  async function fetchLinkCandidates(type) {
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
      renderSummary();
      renderList();
    } catch (err) {
      console.error('[processes] GET', err);
      listHost.replaceChildren();
      listHost.append(
        createEmptyState('⚠', 'Liste indisponible', 'Vérifiez la connexion à l’API et réessayez.')
      );
    }
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
    right.style.textAlign = 'right';
    const scoreEl = document.createElement('div');
    scoreEl.style.fontSize = '20px';
    scoreEl.style.fontWeight = '800';
    scoreEl.style.color = scoreColor(p.score);
    scoreEl.textContent = Number.isFinite(Number(p.score)) ? `${p.score}/100` : 'NA';
    const scoreSub = document.createElement('div');
    scoreSub.style.fontSize = '11px';
    scoreSub.style.color = 'var(--text2)';
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
      renderDrawer(proc);
    } catch (err) {
      console.error('[processes] GET by id', err);
      drawerHost.replaceChildren();
      drawerHost.append(createEmptyState('⚠', 'Fiche indisponible', 'Impossible de charger ce processus.'));
    }
  }

  function renderDrawer(proc) {
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
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.className = 'btn btn-secondary';
    pdfBtn.textContent = 'Export PDF';
    actions.append(aiBtn, pdfBtn);
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
        sparkHost.innerHTML = `
          <div style="font-size:11px;color:var(--text2);text-transform:uppercase;margin-bottom:2px">Évolution du score</div>
          <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block">
            <polyline points="${points}" fill="none" stroke="${scoreColor(last)}" stroke-width="2" />
          </svg>
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

    pdfBtn.addEventListener('click', async () => {
      pdfBtn.disabled = true;
      try {
        const { saveElementAsPdf } = await import('../utils/html2pdfExport.js');
        await saveElementAsPdf(exportEl, `processus-${(proc.name || 'fiche').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`);
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
          span.textContent = `${l.linkedId}${l.role ? ` (${l.role})` : ''}`;
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
