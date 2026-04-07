/**
 * Modal native (<dialog>) — centre de pilotage : détail KPI, liste filtrée, badges métier, CTA module.
 * Données = listes déjà chargées par le dashboard (getData). Pas d’appel API ici.
 * Backend futur : injecter getData depuis un service / fetch paginé sans changer la structure UI.
 */

const DATE_PRESETS = [
  { id: 'all', label: 'Toutes dates' },
  { id: '7', label: '7 jours' },
  { id: '30', label: '30 jours' },
  { id: '90', label: '90 jours' }
];

/** @typedef {{ incidents: unknown[]; actions: unknown[]; audits: unknown[]; ncs: unknown[] }} DashboardLists */

/** @param {unknown} row @param {string} k */
function field(row, k) {
  if (row == null || typeof row !== 'object') return '';
  const v = /** @type {Record<string, unknown>} */ (row)[k];
  return v == null ? '' : String(v);
}

/** @param {string} text @param {'info'|'blue'|'red'|'amber'|'green'} tone */
function makeBadge(text, tone) {
  const span = document.createElement('span');
  const t = tone === 'blue' ? 'blue' : tone;
  span.className = `badge ${t}`;
  span.textContent = text.length > 36 ? `${text.slice(0, 34)}…` : text;
  if (text.length > 36) span.title = text;
  return span;
}

/** @param {string} raw */
function badgeSeverity(raw) {
  const s = raw.toLowerCase();
  if (s.includes('critique')) return makeBadge(raw || '—', 'red');
  if (s.includes('moyen')) return makeBadge(raw || '—', 'amber');
  if (s.includes('faible')) return makeBadge(raw || '—', 'green');
  return makeBadge(raw || '—', 'info');
}

/** @param {string} raw */
function badgeStatus(raw) {
  const s = raw.toLowerCase();
  if (/(clos|ferm|done|termin|clôtur|résolu|fait|complete)/i.test(s)) {
    return makeBadge(raw || '—', 'green');
  }
  if (/(retard|urgent|critique|investigation)/i.test(s)) {
    return makeBadge(raw || '—', 'red');
  }
  if (/(cours|nouveau|open|ouverte|à lancer)/i.test(s)) {
    return makeBadge(raw || '—', 'amber');
  }
  return makeBadge(raw || '—', 'info');
}

/** @param {unknown} row */
function inferActionPriority(row) {
  const st = field(row, 'status').toLowerCase();
  const blob = `${field(row, 'detail')} ${field(row, 'title')} ${st}`.toLowerCase();
  if (blob.includes('critique')) return { label: 'Critique', tone: /** @type {'red'} */ ('red') };
  if (st.includes('retard')) return { label: 'Urgent', tone: 'amber' };
  if (/(termin|clos|fait|done|compl)/i.test(st)) return { label: 'Clôture', tone: 'green' };
  return { label: 'Standard', tone: 'info' };
}

/** @param {string} scoreRaw */
function badgeAuditScore(scoreRaw) {
  const n = Number(scoreRaw);
  const label = Number.isFinite(n) ? `${Math.round(n)} %` : '—';
  if (!Number.isFinite(n)) return makeBadge(label, 'info');
  if (n >= 80) return makeBadge(label, 'green');
  if (n >= 60) return makeBadge(label, 'amber');
  return makeBadge(label, 'red');
}

function isNcOpenRow(row) {
  const s = field(row, 'status').toLowerCase();
  if (!s) return true;
  return !/(clos|ferm|done|termin|clôtur|résolu|resolu|complete|trait)/i.test(s);
}

function isActionLate(row) {
  const st = field(row, 'status').toLowerCase();
  if (st.includes('retard')) return true;
  const due = field(row, 'dueDate');
  if (!due) return false;
  if (/(termin|clos|done|fait|complèt|complete)/i.test(st)) return false;
  const t = new Date(due).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

function isClosedIncidentStatus(st) {
  return /(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(String(st || ''));
}

/** Incident critique encore ouvert (périmètre Performance / cockpit). */
function isIncidentCriticalOpen(row) {
  if (!field(row, 'severity').toLowerCase().includes('critique')) return false;
  return !isClosedIncidentStatus(field(row, 'status'));
}

function parseCreatedMs(row) {
  const c = field(row, 'createdAt') || field(row, 'dueDate');
  if (!c) return 0;
  const t = new Date(c).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function inDatePreset(ms, preset) {
  if (preset === 'all' || !ms) return true;
  const days = Number(preset);
  if (!Number.isFinite(days)) return true;
  return ms >= Date.now() - days * 86400000;
}

function uniqSites(rows, siteKey) {
  const s = new Set();
  rows.forEach((r) => {
    const v = field(r, siteKey).trim();
    if (v) s.add(v);
  });
  return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
}

function uniqStatus(rows, statusKey) {
  const s = new Set();
  rows.forEach((r) => {
    const v = field(r, statusKey).trim();
    if (v) s.add(v);
  });
  return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Sites + responsables (vue conformité mixte). */
function uniqMixedSites(rows) {
  const s = new Set();
  rows.forEach((r) => {
    const mix = /** @type {Record<string, unknown>} */ (r)._mix;
    if (mix === 'action') {
      const v = field(r, 'owner').trim();
      if (v) s.add(v);
    } else {
      const v = field(r, 'site').trim() || field(r, 'siteId').trim();
      if (v) s.add(v);
    }
  });
  return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
}

/**
 * @param {unknown[]} rows
 * @param {{ q: string; datePreset: string; severity: string; site: string; status: string; sort: string }} f
 * @param {'incident'|'nc'|'action'|'audit'|'mixed'} kind
 */
function filterAndSort(rows, f, kind) {
  let out = rows.slice();
  const q = f.q.trim().toLowerCase();
  if (q) {
    out = out.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }
  out = out.filter((r) => inDatePreset(parseCreatedMs(r), f.datePreset));

  if (f.site && f.site !== 'all') {
    if (kind === 'action') {
      out = out.filter((r) => field(r, 'owner') === f.site);
    } else if (kind === 'mixed') {
      out = out.filter((r) => {
        const mix = /** @type {Record<string, unknown>} */ (r)._mix;
        if (mix === 'action') return field(r, 'owner') === f.site;
        return field(r, 'site') === f.site || field(r, 'siteId') === f.site;
      });
    } else {
      out = out.filter(
        (r) => field(r, 'site') === f.site || field(r, 'siteId') === f.site
      );
    }
  }

  if (f.status && f.status !== 'all') {
    out = out.filter((r) => field(r, 'status') === f.status);
  }

  if (f.severity && f.severity !== 'all' && (kind === 'incident' || kind === 'mixed')) {
    out = out.filter((r) => {
      if (kind === 'mixed' && /** @type {Record<string, unknown>} */ (r)._mix !== 'incident') {
        return true;
      }
      return field(r, 'severity').toLowerCase().includes(f.severity.toLowerCase());
    });
  }

  const dir = f.sort.endsWith('asc') ? 1 : -1;
  if (f.sort.startsWith('date')) {
    out.sort((a, b) => (parseCreatedMs(a) - parseCreatedMs(b)) * (f.sort === 'date-asc' ? 1 : -1));
  } else if (f.sort === 'ref') {
    out.sort((a, b) => {
      const ar = field(a, 'ref') || field(a, 'title') || field(a, 'id');
      const br = field(b, 'ref') || field(b, 'title') || field(b, 'id');
      return ar.localeCompare(br, 'fr') * dir;
    });
  } else if (f.sort === 'label') {
    if (kind === 'mixed') {
      out.sort((a, b) => {
        const la =
          /** @type {Record<string, unknown>} */ (a)._mix === 'incident'
            ? `${field(a, 'ref')} ${field(a, 'type')}`
            : field(a, 'title') || field(a, 'type');
        const lb =
          /** @type {Record<string, unknown>} */ (b)._mix === 'incident'
            ? `${field(b, 'ref')} ${field(b, 'type')}`
            : field(b, 'title') || field(b, 'type');
        return la.localeCompare(lb, 'fr') * dir;
      });
    } else {
      out.sort(
        (a, b) =>
          (field(a, 'title') || field(a, 'type')).localeCompare(
            field(b, 'title') || field(b, 'type'),
            'fr'
          ) * dir
      );
    }
  }

  return out;
}

/**
 * @param {string} kpiKey
 * @param {DashboardLists} ctx
 */
function resolveKpiDataset(kpiKey, ctx) {
  const inc = Array.isArray(ctx.incidents) ? ctx.incidents : [];
  const act = Array.isArray(ctx.actions) ? ctx.actions : [];
  const aud = Array.isArray(ctx.audits) ? ctx.audits : [];
  const ncs = Array.isArray(ctx.ncs) ? ctx.ncs : [];

  switch (kpiKey) {
    case 'incidents':
      return {
        kind: /** @type {'incident'} */ ('incident'),
        rows: inc,
        title: 'Incidents — pilotage',
        newHash: 'incidents',
        newLabel: '➕ Nouveau incident'
      };
    case 'ncOpen':
      return {
        kind: 'nc',
        rows: ncs.filter(isNcOpenRow),
        title: 'Non-conformités ouvertes',
        newHash: 'audits',
        newLabel: '➕ Vers audits / NC'
      };
    case 'actionsLate':
      return {
        kind: 'action',
        rows: act.filter(isActionLate),
        title: 'Actions en retard',
        newHash: 'actions',
        newLabel: '➕ Nouvelle action'
      };
    case 'actions':
      return {
        kind: 'action',
        rows: act,
        title: 'Plan d’actions',
        newHash: 'actions',
        newLabel: '➕ Nouvelle action'
      };
    case 'auditScore':
    case 'auditsN':
      return {
        kind: 'audit',
        rows: aud,
        title: kpiKey === 'auditScore' ? 'Audits — scores' : 'Audits — registre',
        newHash: 'audits',
        newLabel: '➕ Nouvel audit'
      };
    case 'incidentsCritical':
      return {
        kind: 'incident',
        rows: inc.filter((r) => isIncidentCriticalOpen(r)),
        title: 'Incidents critiques ouverts',
        newHash: 'incidents',
        newLabel: '➕ Nouveau incident'
      };
    case 'actionsOnTrack':
      return {
        kind: 'action',
        rows: act.filter((r) => !isActionLate(r)),
        title: 'Actions dans les temps (hors retard)',
        newHash: 'actions',
        newLabel: '➕ Nouvelle action'
      };
    case 'ncTreated':
      return {
        kind: 'nc',
        rows: ncs.filter((r) => !isNcOpenRow(r)),
        title: 'NC traitées / closes',
        newHash: 'audits',
        newLabel: '➕ Vers audits / NC'
      };
    case 'conformity': {
      /** @type {unknown[]} */
      const mixed = [];
      inc
        .filter((r) => isIncidentCriticalOpen(r))
        .forEach((r) =>
          mixed.push(
            Object.assign({}, r, { _mix: /** @type {'incident'} */ ('incident') })
          )
        );
      act
        .filter((r) => isActionLate(r))
        .forEach((r) =>
          mixed.push(Object.assign({}, r, { _mix: /** @type {'action'} */ ('action') }))
        );
      ncs
        .filter((r) => isNcOpenRow(r))
        .forEach((r) =>
          mixed.push(Object.assign({}, r, { _mix: /** @type {'nc'} */ ('nc') }))
        );
      mixed.sort((a, b) => parseCreatedMs(b) - parseCreatedMs(a));
      return {
        kind: /** @type {'mixed'} */ ('mixed'),
        rows: mixed,
        title: 'Leviers conformité — extraits croisés',
        newHash: 'analytics',
        newLabel: '➕ Synthèse Analytics'
      };
    }
    default:
      return {
        kind: 'incident',
        rows: [],
        title: 'Détail',
        newHash: 'dashboard',
        newLabel: 'Fermer'
      };
  }
}

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR');
  } catch {
    return '—';
  }
};

/**
 * @param {unknown[]} rows — éléments avec `_mix` : incident | action | nc
 */
function buildMixedTable(rows) {
  const table = document.createElement('table');
  table.className = 'kpi-detail-table';

  const thead = document.createElement('thead');
  const thr = document.createElement('tr');
  ['Origine', 'Résumé', 'Statut / gravité', 'Date clé'].forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    thr.append(th);
  });
  thead.append(thr);

  const tbody = document.createElement('tbody');
  rows.forEach((r) => {
    const mix = /** @type {Record<string, unknown>} */ (r)._mix;
    const tr = document.createElement('tr');
    if (mix === 'incident') {
      tr.append(
        cellText('Incident critique'),
        cellText(`${field(r, 'ref')} — ${field(r, 'type')}`),
        cellNode(badgeSeverity(field(r, 'severity'))),
        cellText(fmtDate(field(r, 'createdAt')))
      );
    } else if (mix === 'action') {
      const pr = inferActionPriority(r);
      tr.append(
        cellText('Action en retard'),
        cellText(field(r, 'title') || '—'),
        cellNode(makeBadge(pr.label, pr.tone)),
        cellText(fmtDate(field(r, 'dueDate')))
      );
    } else if (mix === 'nc') {
      tr.append(
        cellText('NC ouverte'),
        cellText(field(r, 'title') || '—'),
        cellNode(badgeStatus(field(r, 'status'))),
        cellText(fmtDate(field(r, 'createdAt')))
      );
    } else {
      tr.append(cellText('—'), cellText('—'), cellText('—'), cellText('—'));
    }
    tbody.append(tr);
  });

  table.append(thead, tbody);
  return table;
}

/**
 * @param {'incident'|'nc'|'action'|'audit'} kind
 * @param {unknown[]} rows
 */
function buildTable(kind, rows) {
  const table = document.createElement('table');
  table.className = 'kpi-detail-table';

  const thead = document.createElement('thead');
  const thr = document.createElement('tr');

  const headers =
    kind === 'incident'
      ? ['Réf.', 'Type', 'Gravité', 'Statut', 'Site / service', 'Date']
      : kind === 'nc'
        ? ['Titre', 'Statut', 'Réf. audit', 'Date']
        : kind === 'action'
          ? ['Titre', 'Priorité', 'Statut', 'Responsable', 'Échéance', 'Créé le']
          : ['Réf.', 'Site / service', 'Score', 'Statut', 'Date'];

  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    thr.append(th);
  });
  thead.append(thr);

  const tbody = document.createElement('tbody');

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    if (kind === 'incident') {
      tr.append(
        cellText(field(r, 'ref')),
        cellText(field(r, 'type')),
        cellNode(badgeSeverity(field(r, 'severity'))),
        cellNode(badgeStatus(field(r, 'status'))),
        cellText(field(r, 'site')),
        cellText(fmtDate(field(r, 'createdAt')))
      );
    } else if (kind === 'nc') {
      const tit = document.createElement('td');
      tit.className = 'kpi-detail-cell--main';
      tit.textContent = field(r, 'title') || '—';
      tr.append(
        tit,
        cellNode(badgeStatus(field(r, 'status'))),
        cellText(field(r, 'auditRef')),
        cellText(fmtDate(field(r, 'createdAt')))
      );
    } else if (kind === 'action') {
      const pr = inferActionPriority(r);
      tr.append(
        cellText(field(r, 'title') || '—'),
        cellNode(makeBadge(pr.label, pr.tone)),
        cellNode(badgeStatus(field(r, 'status'))),
        cellText(field(r, 'owner') || '—'),
        cellText(fmtDate(field(r, 'dueDate'))),
        cellText(fmtDate(field(r, 'createdAt')))
      );
    } else {
      tr.append(
        cellText(field(r, 'ref')),
        cellText(field(r, 'site')),
        cellNode(badgeAuditScore(field(r, 'score'))),
        cellNode(badgeStatus(field(r, 'status'))),
        cellText(fmtDate(field(r, 'createdAt')))
      );
    }
    tbody.append(tr);
  });

  table.append(thead, tbody);
  return table;
}

function cellText(s) {
  const td = document.createElement('td');
  td.textContent = s;
  return td;
}

/** @param {HTMLElement} node */
function cellNode(node) {
  const td = document.createElement('td');
  td.append(node);
  return td;
}

/**
 * @param {{ getData: () => DashboardLists }} opts
 */
export function createKpiDetailDrawer(opts) {
  const getData =
    typeof opts.getData === 'function'
      ? opts.getData
      : () => ({ incidents: [], actions: [], audits: [], ncs: [] });

  const dialog = document.createElement('dialog');
  dialog.className = 'kpi-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'kpi-detail-dialog-title');

  const panel = document.createElement('div');
  panel.className = 'kpi-detail-dialog__panel';
  panel.setAttribute('role', 'document');

  const head = document.createElement('header');
  head.className = 'kpi-detail-dialog__head';
  const titleEl = document.createElement('h2');
  titleEl.id = 'kpi-detail-dialog-title';
  titleEl.className = 'kpi-detail-dialog__title';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'kpi-detail-dialog__close';
  closeBtn.setAttribute('aria-label', 'Fermer');
  closeBtn.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  head.append(titleEl, closeBtn);

  const toolbar = document.createElement('div');
  toolbar.className = 'kpi-detail-toolbar';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'control-input kpi-detail-search';
  search.placeholder = 'Rechercher dans les champs…';
  search.setAttribute('aria-label', 'Recherche dans la liste');

  const dateSel = document.createElement('select');
  dateSel.className = 'control-select kpi-detail-select';
  dateSel.setAttribute('aria-label', 'Période');
  DATE_PRESETS.forEach((p) => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.label;
    dateSel.append(o);
  });

  const sevSel = document.createElement('select');
  sevSel.className = 'control-select kpi-detail-select';
  sevSel.setAttribute('aria-label', 'Gravité (incidents)');
  [
    { v: 'all', t: 'Toutes gravités' },
    { v: 'critique', t: 'Critique' },
    { v: 'moyen', t: 'Moyen' },
    { v: 'faible', t: 'Faible' }
  ].forEach((x) => {
    const o = document.createElement('option');
    o.value = x.v;
    o.textContent = x.t;
    sevSel.append(o);
  });

  const siteSel = document.createElement('select');
  siteSel.className = 'control-select kpi-detail-select';
  siteSel.setAttribute('aria-label', 'Site ou responsable');

  const statusSel = document.createElement('select');
  statusSel.className = 'control-select kpi-detail-select';
  statusSel.setAttribute('aria-label', 'Statut');

  const sortSel = document.createElement('select');
  sortSel.className = 'control-select kpi-detail-select';
  sortSel.setAttribute('aria-label', 'Tri');
  [
    { v: 'date-desc', t: 'Date ↓' },
    { v: 'date-asc', t: 'Date ↑' },
    { v: 'ref', t: 'Référence' },
    { v: 'label', t: 'Libellé' }
  ].forEach((x) => {
    const o = document.createElement('option');
    o.value = x.v;
    o.textContent = x.t;
    sortSel.append(o);
  });

  toolbar.append(search, dateSel, sevSel, siteSel, statusSel, sortSel);

  const countEl = document.createElement('p');
  countEl.className = 'kpi-detail-count';
  countEl.setAttribute('aria-live', 'polite');

  const scroll = document.createElement('div');
  scroll.className = 'kpi-detail-scroll';

  const emptyEl = document.createElement('div');
  emptyEl.className = 'kpi-detail-empty';
  emptyEl.hidden = true;
  const emptyTitle = document.createElement('p');
  emptyTitle.className = 'kpi-detail-empty__title';
  const emptySub = document.createElement('p');
  emptySub.className = 'kpi-detail-empty__sub';
  emptyEl.append(emptyTitle, emptySub);

  const foot = document.createElement('footer');
  foot.className = 'kpi-detail-foot';
  const btnNew = document.createElement('button');
  btnNew.type = 'button';
  btnNew.className = 'btn btn-primary kpi-detail-new';
  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  btnClose.className = 'btn btn-secondary';
  btnClose.textContent = 'Fermer';
  foot.append(btnNew, btnClose);

  panel.append(head, toolbar, countEl, scroll, emptyEl, foot);
  dialog.append(panel);

  /** @type {{ kind: string; rows: unknown[]; title: string; newHash: string; newLabel: string } | null} */
  let current = null;
  /** @type {string} */
  let activeKpiKey = 'incidents';

  const state = {
    q: '',
    datePreset: 'all',
    severity: 'all',
    site: 'all',
    status: 'all',
    sort: 'date-desc'
  };

  function refillSiteStatus(kind, baseRows) {
    siteSel.innerHTML = '';
    const o0 = document.createElement('option');
    o0.value = 'all';
    o0.textContent =
      kind === 'action'
        ? 'Tous responsables'
        : kind === 'mixed'
          ? 'Tous sites / responsables'
          : 'Tous sites / services';
    siteSel.append(o0);
    if (kind === 'action') {
      uniqStatus(baseRows, 'owner').forEach((s) => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        siteSel.append(o);
      });
    } else if (kind === 'mixed') {
      uniqMixedSites(baseRows).forEach((s) => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        siteSel.append(o);
      });
    } else {
      uniqSites(baseRows, 'site').forEach((s) => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        siteSel.append(o);
      });
    }

    statusSel.innerHTML = '';
    const s0 = document.createElement('option');
    s0.value = 'all';
    s0.textContent = 'Tous statuts';
    statusSel.append(s0);
    uniqStatus(baseRows, 'status').forEach((s) => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = s.length > 42 ? `${s.slice(0, 40)}…` : s;
      statusSel.append(o);
    });

    const sevOn = kind === 'incident' || kind === 'mixed';
    sevSel.disabled = !sevOn;
    sevSel.style.opacity = sevOn ? '' : '0.55';
  }

  function render() {
    if (!current) return;
    const ctx = getData();
    const resolved = resolveKpiDataset(activeKpiKey, ctx);
    const base = resolved.rows;
    state.q = search.value;
    state.datePreset = dateSel.value;
    state.severity = sevSel.value;
    state.site = siteSel.value;
    state.status = statusSel.value;
    state.sort = sortSel.value;

    const filtered = filterAndSort(base, state, resolved.kind);
    countEl.textContent = `${filtered.length} résultat${filtered.length > 1 ? 's' : ''} · ${base.length} au total pour cet indicateur`;

    scroll.replaceChildren();
    if (filtered.length === 0) {
      emptyEl.hidden = false;
      if (base.length === 0) {
        emptyTitle.textContent = 'Aucune donnée sur ce périmètre';
        emptySub.textContent =
          'Les listes du tableau de bord ne contiennent pas encore d’éléments pour cet indicateur, ou le chargement API est incomplet. Vérifiez le site actif, la connexion au serveur (npm run dev), puis rechargez le dashboard.';
      } else {
        emptyTitle.textContent = 'Aucun résultat avec ces filtres';
        emptySub.textContent =
          'Élargissez la période, réinitialisez le statut ou la gravité, ou effacez la recherche. Les enregistrements existent mais ne correspondent pas aux critères actuels.';
      }
    } else {
      emptyEl.hidden = true;
      if (resolved.kind === 'mixed') {
        scroll.append(buildMixedTable(filtered));
      } else {
        scroll.append(buildTable(resolved.kind, filtered));
      }
    }
  }

  /**
   * @param {string} kpiKey
   * @param {{
   *   severity?: string;
   *   status?: string;
   *   site?: string;
   *   datePreset?: string;
   *   sort?: string;
   *   q?: string;
   * } | null} [preset]
   */
  function open(kpiKey, preset) {
    const ctx = getData();
    activeKpiKey = kpiKey;
    current = resolveKpiDataset(kpiKey, ctx);
    dialog.dataset.kpiKey = kpiKey;
    titleEl.textContent = current.title;
    btnNew.textContent = current.newLabel;

    refillSiteStatus(current.kind, current.rows);
    search.value = '';
    dateSel.value = 'all';
    sevSel.value = 'all';
    siteSel.value = 'all';
    statusSel.value = 'all';
    sortSel.value = 'date-desc';
    Object.assign(state, {
      q: '',
      datePreset: 'all',
      severity: 'all',
      site: 'all',
      status: 'all',
      sort: 'date-desc'
    });

    if (preset && typeof preset === 'object') {
      if (preset.q != null) search.value = String(preset.q);
      if (preset.datePreset != null) dateSel.value = String(preset.datePreset);
      if (preset.severity != null) sevSel.value = String(preset.severity);
      if (preset.site != null) siteSel.value = String(preset.site);
      if (preset.status != null) statusSel.value = String(preset.status);
      if (preset.sort != null) sortSel.value = String(preset.sort);
      Object.assign(state, {
        q: search.value,
        datePreset: dateSel.value,
        severity: sevSel.value,
        site: siteSel.value,
        status: statusSel.value,
        sort: sortSel.value
      });
    }

    render();
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  [search, dateSel, sevSel, siteSel, statusSel, sortSel].forEach((el) => {
    el.addEventListener('input', () => render());
    el.addEventListener('change', () => render());
  });

  closeBtn.addEventListener('click', () => dialog.close());
  btnClose.addEventListener('click', () => dialog.close());
  btnNew.addEventListener('click', () => {
    if (!current) return;
    const h = current.newHash;
    dialog.close();
    if (h && h !== 'dashboard') {
      window.location.hash = h;
    }
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    current = null;
  });

  return {
    /** @param {string} kpiKey */
    open,
    element: dialog
  };
}
