/**
 * Bloc « Activité récente » — pilotage : 3 axes, lignes compactes, DOM sûr.
 */

import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

const MAX_PER_SECTION = 4;

function formatShortDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function parseTime(iso) {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/**
 * @template T
 * @param {T[]} arr
 * @param {(row: T) => number} getTime
 */
function sortRecent(arr, getTime) {
  if (!Array.isArray(arr)) return [];
  /** Dates invalides en fin de liste (évite un ordre aléatoire selon le navigateur). */
  const T_MISSING = Number.MIN_SAFE_INTEGER;
  return [...arr].sort((a, b) => {
    const tb = getTime(b);
    const ta = getTime(a);
    const vb = Number.isFinite(tb) ? tb : T_MISSING;
    const va = Number.isFinite(ta) ? ta : T_MISSING;
    return vb - va;
  });
}

function truncate(text, max) {
  const s = String(text || '').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function navigateToPage(hash) {
  const id = String(hash || '').replace(/^#/, '');
  if (id) qhseNavigate(id);
}

function isActionClosed(a) {
  const s = String(a?.status || '').toLowerCase();
  if (s.includes('retard')) return false;
  return /termin|clos|ferm|clôtur|realis|réalis|effectu|complete|complété|fait/.test(s);
}

function actionFootMeta(row) {
  const due = row?.dueDate ? parseTime(row.dueDate) : NaN;
  const now = Date.now();
  if (Number.isFinite(due)) {
    if (!isActionClosed(row) && due < now) {
      return { label: `Échéance ${formatShortDate(row.dueDate)}`, hint: 'En retard', tone: 'amber' };
    }
    return { label: `Échéance ${formatShortDate(row.dueDate)}`, hint: 'Dans le calendrier', tone: 'blue' };
  }
  return {
    label: `Créée ${formatShortDate(row.createdAt)}`,
    hint: row.owner ? `Suivi : ${truncate(row.owner, 24)}` : 'À prioriser selon le plan',
    tone: 'info'
  };
}

function incidentSeverityModifier(severity) {
  const s = String(severity || '').toLowerCase();
  if (/crit|grave|élev|elev|high|majeur|fatal|sévère|severe/.test(s)) return 'activity-row--sev-crit';
  if (/moyen|modéré|modere|medium|mineur/.test(s)) return 'activity-row--sev-warn';
  return '';
}

const KIND_BADGE = {
  Incident: 'Incident',
  Action: 'Action',
  Audit: 'Audit'
};

/**
 * @param {{
 *   kindLabel: string;
 *   title: string;
 *   dateLine: string;
 *   statusLabel: string;
 *   pageHash: string;
 *   rowClass?: string;
 * }} p
 */
function createActivityRow(p) {
  const row = document.createElement('div');
  row.className = ['activity-row', p.rowClass || ''].filter(Boolean).join(' ');
  row.tabIndex = 0;
  row.setAttribute('role', 'link');
  const mod =
    p.pageHash === 'incidents'
      ? 'Incidents'
      : p.pageHash === 'actions'
        ? 'Actions'
        : p.pageHash === 'audits'
          ? 'Audits'
          : p.pageHash;
  row.setAttribute('aria-label', `${p.kindLabel} — ${p.title} — ouvrir ${mod}`);

  const inner = document.createElement('div');
  inner.className = 'activity-row__inner';

  const type = document.createElement('span');
  type.className = 'activity-row__type';
  type.textContent = KIND_BADGE[p.kindLabel] || String(p.kindLabel || '—').slice(0, 8);

  const body = document.createElement('div');
  body.className = 'activity-row__body';

  const titleEl = document.createElement('span');
  titleEl.className = 'activity-row__title';
  const fullTitle = String(p.title || '').trim();
  titleEl.textContent = truncate(fullTitle, 140);
  if (fullTitle.length > 140) titleEl.title = fullTitle;

  const meta = document.createElement('div');
  meta.className = 'activity-row__meta';

  const status = document.createElement('span');
  status.className = 'activity-row__status';
  status.textContent = p.statusLabel || '—';
  if ((p.statusLabel || '').length > 56) status.title = p.statusLabel;

  const date = document.createElement('span');
  date.className = 'activity-row__date';
  date.textContent = p.dateLine || '—';

  meta.append(status, date);
  body.append(titleEl, meta);

  const link = document.createElement('span');
  link.className = 'activity-row__link';
  link.setAttribute('aria-hidden', 'true');
  link.textContent = '→';

  inner.append(type, body, link);
  row.append(inner);

  const go = () => navigateToPage(p.pageHash);
  row.addEventListener('click', go);
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go();
    }
  });

  return row;
}

const COL_CTA_LABELS = {
  incidents: 'Voir les incidents',
  actions: 'Voir les actions',
  audits: 'Voir les audits'
};

function createSectionColumn(title, pageHash) {
  const col = document.createElement('div');
  col.className = 'dashboard-activity-col';

  const h = document.createElement('h4');
  h.className = 'dashboard-activity-col-title';
  h.textContent = title;

  const stack = document.createElement('div');
  stack.className = 'dashboard-activity-stack';

  const empty = document.createElement('p');
  empty.className = 'dashboard-activity-col-empty';
  empty.textContent = 'Aucun élément sur l’échantillon chargé.';

  const footer = document.createElement('div');
  footer.className = 'dashboard-activity-col-footer';
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'dashboard-activity-col-more';
  more.textContent = COL_CTA_LABELS[pageHash] || 'Ouvrir le module';
  more.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateToPage(pageHash);
  });
  footer.append(more);

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'dashboard-activity-col-ctas';
  const cta = createDashboardBlockActions(
    [
      {
        label: COL_CTA_LABELS[pageHash] || 'Ouvrir le module',
        pageId: pageHash
      }
    ],
    { className: 'dashboard-block-actions dashboard-block-actions--tight' }
  );
  if (cta) ctaWrap.append(cta);
  else ctaWrap.hidden = true;

  col.append(h, stack, empty, footer, ctaWrap);
  return { col, stack, empty, ctaWrap, footer };
}

function bindColumn(stack, empty, ctaWrap, footer, hasRows) {
  if (hasRows) {
    empty.hidden = true;
    ctaWrap.hidden = true;
    footer.hidden = false;
  } else {
    empty.hidden = false;
    ctaWrap.hidden = ctaWrap.childNodes.length === 0;
    footer.hidden = true;
  }
}

/**
 * @param {{
 *   incidents?: Array<{
 *     ref?: string;
 *     type?: string;
 *     site?: string;
 *     severity?: string;
 *     status?: string;
 *     createdAt?: string;
 *   }>;
 *   actions?: Array<{
 *     title?: string;
 *     detail?: string;
 *     status?: string;
 *     owner?: string;
 *     dueDate?: string;
 *     createdAt?: string;
 *   }>;
 *   audits?: Array<{
 *     ref?: string;
 *     site?: string;
 *     score?: number;
 *     status?: string;
 *     createdAt?: string;
 *   }>;
 * }} data
 * @param {{ showHeader?: boolean }} [opts]
 */
export function createDashboardActivitySection(data, opts = {}) {
  const showHeader = opts.showHeader !== false;

  const root = document.createElement('section');
  root.className = showHeader
    ? 'dashboard-activity-section content-card card-soft'
    : 'dashboard-activity-section content-card card-soft dashboard-activity-section--body';

  if (showHeader) {
    root.innerHTML = `
    <div class="content-card-head dashboard-activity-head">
      <div>
        <div class="section-kicker">Suivi</div>
        <h3>Activité récente</h3>
        <p class="dashboard-muted-lead"></p>
      </div>
    </div>
  `;
  }

  const incidents = sortRecent(data.incidents || [], (r) => parseTime(r.createdAt)).slice(0, MAX_PER_SECTION);
  const actions = sortRecent(data.actions || [], (r) => parseTime(r.createdAt)).slice(0, MAX_PER_SECTION);
  const audits = sortRecent(data.audits || [], (r) => parseTime(r.createdAt)).slice(0, MAX_PER_SECTION);

  const totalCount = incidents.length + actions.length + audits.length;

  if (totalCount === 0) {
    const wrap = document.createElement('div');
    wrap.className = 'dashboard-activity-global-empty';
    const p = document.createElement('p');
    p.className = 'dashboard-activity-global-empty-msg';
    p.textContent = 'Pas d’entrée récente sur l’échantillon chargé';
    const sub = document.createElement('p');
    sub.className = 'dashboard-activity-global-empty-sub';
    sub.textContent = 'Échantillon limité — ouvrir un module.';
    const ctaRow = document.createElement('div');
    ctaRow.className = 'dashboard-activity-global-ctas';
    const globalActs = createDashboardBlockActions(
      [
        { label: 'Voir les incidents', pageId: 'incidents' },
        { label: 'Voir les actions', pageId: 'actions' }
      ],
      { className: 'dashboard-block-actions dashboard-block-actions--tight' }
    );
    if (globalActs) ctaRow.append(globalActs);
    wrap.append(p, sub, ctaRow);
    root.append(wrap);
    return root;
  }

  const grid = document.createElement('div');
  grid.className = 'dashboard-activity-grid';

  const inc = createSectionColumn('Incidents récents', 'incidents');
  const act = createSectionColumn('Actions récentes', 'actions');
  const aud = createSectionColumn('Audits récents', 'audits');

  incidents.forEach((row) => {
    const title = row.ref || 'Incident';
    const statusShort = String(row.status || '').trim() || 'Statut à suivre';
    const sev = String(row.severity || '').trim();
    const statusLabel = truncate(
      [sev, statusShort].filter((x) => x && x !== '—').join(' · ') || statusShort,
      72
    );
    inc.stack.append(
      createActivityRow({
        kindLabel: 'Incident',
        title,
        dateLine: formatShortDate(row.createdAt),
        statusLabel,
        pageHash: 'incidents',
        rowClass: incidentSeverityModifier(row.severity)
      })
    );
  });

  actions.forEach((row) => {
    const meta = actionFootMeta(row);
    const overdue = meta.tone === 'amber' && meta.hint === 'En retard';
    act.stack.append(
      createActivityRow({
        kindLabel: 'Action',
        title: row.title || 'Action',
        dateLine: meta.label,
        statusLabel: truncate(
          overdue ? String(row.status || 'En retard') : String(row.status || 'En cours'),
          72
        ),
        pageHash: 'actions',
        rowClass: overdue ? 'activity-row--action-late' : ''
      })
    );
  });

  audits.forEach((row) => {
    const scoreN = Number(row.score);
    const statusShort = String(row.status || '').trim() || 'Statut à suivre';
    const scoreBit = Number.isFinite(scoreN) ? `${scoreN} %` : '';
    const statusLabel = truncate([scoreBit, statusShort].filter(Boolean).join(' · '), 72);
    aud.stack.append(
      createActivityRow({
        kindLabel: 'Audit',
        title: row.ref || 'Audit',
        dateLine: formatShortDate(row.createdAt),
        statusLabel,
        pageHash: 'audits'
      })
    );
  });

  bindColumn(inc.stack, inc.empty, inc.ctaWrap, inc.footer, incidents.length > 0);
  bindColumn(act.stack, act.empty, act.ctaWrap, act.footer, actions.length > 0);
  bindColumn(aud.stack, aud.empty, aud.ctaWrap, aud.footer, audits.length > 0);

  grid.append(inc.col, act.col, aud.col);
  root.append(grid);
  return root;
}
