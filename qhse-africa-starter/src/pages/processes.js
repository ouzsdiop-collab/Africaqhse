import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState, createSkeletonCard } from '../utils/designSystem.js';
import { canResource } from '../utils/permissionsUi.js';
import { getSessionUser } from '../data/sessionUser.js';
import { saveElementAsPdf } from '../utils/html2pdfExport.js';

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
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-secondary proc-btn-table" aria-pressed="false">Vue tableau</button>
          <button type="button" class="btn btn-secondary proc-btn-map" aria-pressed="true">Vue cartographie</button>
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
      </div>
      <div class="proc-list-host stack" style="margin-top:14px"></div>
    </article>
    <article class="content-card card-soft proc-drawer" hidden>
      <div class="proc-drawer-host"></div>
    </article>
    <article class="content-card card-soft proc-form" hidden>
      <div class="proc-form-host"></div>
    </article>
  `;

  const listHost = page.querySelector('.proc-list-host');
  const drawerCard = page.querySelector('.proc-drawer');
  const drawerHost = page.querySelector('.proc-drawer-host');
  const formCard = page.querySelector('.proc-form');
  const formHost = page.querySelector('.proc-form-host');
  const typeFilter = page.querySelector('.proc-filter-type');
  const btnTable = page.querySelector('.proc-btn-table');
  const btnMap = page.querySelector('.proc-btn-map');
  const btnNew = page.querySelector('.proc-btn-new');

  /** @type {any[]} */
  let processes = [];
  let viewMode = 'map'; // 'map' | 'table'

  function setViewMode(mode) {
    viewMode = mode;
    btnTable.setAttribute('aria-pressed', mode === 'table' ? 'true' : 'false');
    btnMap.setAttribute('aria-pressed', mode === 'map' ? 'true' : 'false');
    renderList();
  }
  btnTable.addEventListener('click', () => setViewMode('table'));
  btnMap.addEventListener('click', () => setViewMode('map'));
  typeFilter.addEventListener('change', renderList);

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
      renderList();
    } catch (err) {
      console.error('[processes] GET', err);
      listHost.replaceChildren();
      listHost.append(
        createEmptyState('⚠', 'Liste indisponible', 'Vérifiez la connexion à l’API et réessayez.')
      );
    }
  }

  function filteredProcesses() {
    const t = typeFilter.value;
    return t ? processes.filter((p) => p.type === t) : processes;
  }

  function processCard(p) {
    const card = document.createElement('article');
    card.className = 'list-row';
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
      table.className = 'data-table';
      table.style.width = '100%';
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
    // Vue cartographie : groupée par type
    ['management', 'realisation', 'support'].forEach((type) => {
      const group = rows.filter((p) => p.type === type);
      if (!group.length) return;
      const section = document.createElement('div');
      section.style.marginBottom = '14px';
      const h = document.createElement('h4');
      h.style.margin = '0 0 8px';
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
    scoreBlock.append(scoreNum, scoreLabel);
    exportEl.append(scoreBlock);

    if (Array.isArray(proc.penalties) && proc.penalties.length) {
      const pen = document.createElement('div');
      pen.style.marginBottom = '14px';
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
    infoGrid.style.display = 'grid';
    infoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
    infoGrid.style.gap = '10px';
    infoGrid.style.marginBottom = '14px';
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
    exportEl.append(
      listField('Entrées', proc.inputs),
      listField('Sorties', proc.outputs),
      listField('Parties intéressées', proc.interestedParties)
    );

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
        block.className = 'content-card-soft';
        block.style.border = '1px solid var(--border)';
        block.style.borderRadius = '10px';
        block.style.padding = '12px';
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
    linksSection.style.marginTop = '16px';
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
      block.style.marginBottom = '10px';
      const h = document.createElement('div');
      h.style.fontSize = '12px';
      h.style.fontWeight = '700';
      h.style.marginBottom = '4px';
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
        <input type="text" class="control-input proc-link-id" placeholder="Identifiant de l’élément lié" style="max-width:240px" />
        <button type="button" class="btn btn-secondary proc-link-add">Lier</button>
      `;
      linksSection.append(addForm);
      addForm.querySelector('.proc-link-add').addEventListener('click', async () => {
        const linkedType = addForm.querySelector('.proc-link-type').value;
        const linkedId = addForm.querySelector('.proc-link-id').value.trim();
        if (!linkedId) {
          showToast('Identifiant requis', 'error');
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
