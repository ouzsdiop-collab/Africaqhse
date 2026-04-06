/**
 * Bloc « À faire maintenant » — relances opérationnelles (mêmes sources que les alertes).
 */

function formatShortDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  } catch {
    return '—';
  }
}

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

function go(hash) {
  const id = String(hash || '').replace(/^#/, '');
  if (id) window.location.hash = id;
}

const MAX_ITEMS = 7;

function isLateAudit(a) {
  const s = String(a?.status || '').toLowerCase();
  return /retard|late|overdue|dépass|reprogram|échéance|à planifier|non réalis/i.test(s);
}

/**
 * Nombre total de lignes éligibles (avant plafond d’affichage).
 */
function computeRawPriorityCount(stats, ncs, audits) {
  const crit = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
  const overdue = Array.isArray(stats?.overdueActionItems) ? stats.overdueActionItems.length : 0;
  const ncList = Array.isArray(ncs) ? ncs.filter(isNcOpen) : [];
  const lateAudits = Array.isArray(audits) ? audits.filter(isLateAudit) : [];
  return crit + overdue + ncList.length + lateAudits.length;
}

/**
 * @returns {{ kind: 'urgent'|'delay'|'nc'; title: string; meta: string; hash: string }[]}
 */
function buildPriorityItems(stats, ncs, audits) {
  /** @type {{ kind: 'urgent'|'delay'|'nc'; title: string; meta: string; hash: string }[]} */
  const out = [];

  const crit = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents : [];
  crit.forEach((row) => {
    if (out.length >= MAX_ITEMS) return;
    out.push({
      kind: 'urgent',
      title: `${row.ref || 'Incident'} — ${row.type || 'gravité élevée'}`,
      meta: [row.site, formatShortDate(row.createdAt)].filter(Boolean).join(' · ') || 'À traiter sans délai',
      hash: 'incidents'
    });
  });

  const overdue = Array.isArray(stats?.overdueActionItems) ? stats.overdueActionItems : [];
  overdue.forEach((row) => {
    if (out.length >= MAX_ITEMS) return;
    const metaParts = [];
    if (row.dueDate) metaParts.push(`Échéance ${formatShortDate(row.dueDate)}`);
    if (row.owner) metaParts.push(row.owner);
    out.push({
      kind: 'delay',
      title: row.title || 'Action en retard',
      meta: metaParts.length ? metaParts.join(' · ') : 'Plan d’actions',
      hash: 'actions'
    });
  });

  const ncList = Array.isArray(ncs) ? ncs.filter(isNcOpen) : [];
  ncList.forEach((nc) => {
    if (out.length >= MAX_ITEMS) return;
    out.push({
      kind: 'nc',
      title: nc.title || 'Non-conformité ouverte',
      meta: nc.auditRef ? `Lien audit ${nc.auditRef}` : formatShortDate(nc.createdAt),
      hash: 'audits'
    });
  });

  const audList = Array.isArray(audits) ? audits : [];
  const lateAudits = audList.filter(isLateAudit);
  lateAudits.forEach((a) => {
    if (out.length >= MAX_ITEMS) return;
    out.push({
      kind: 'urgent',
      title: a.ref ? `Audit ${a.ref} — à cadrer` : 'Audit à finaliser',
      meta: [a.site, a.status].filter(Boolean).join(' · ').slice(0, 72) || 'Module Audits',
      hash: 'audits'
    });
  });

  return out;
}

export function createDashboardPriorityNow() {
  const root = document.createElement('article');
  root.className = 'content-card card-soft dashboard-priority-now';
  root.setAttribute('aria-labelledby', 'dashboard-priority-now-title');

  const head = document.createElement('header');
  head.className = 'dashboard-priority-now__head';
  head.innerHTML = `
    <div>
      <span class="section-kicker dashboard-priority-now__kicker">Décision</span>
      <h2 id="dashboard-priority-now-title" class="dashboard-priority-now__title">À traiter immédiatement</h2>
      <p class="dashboard-priority-now__sub">File prioritaire : chaque ligne ouvre le module concerné. Les chiffres ci-dessous = totaux visibles (serveur + listes chargées).</p>
    </div>
  `;

  const summary = document.createElement('div');
  summary.className = 'dashboard-priority-now__summary';
  summary.setAttribute('aria-label', 'Synthèse chiffrée');

  const host = document.createElement('div');
  host.className = 'dashboard-priority-now__list';
  host.setAttribute('role', 'list');

  const footer = document.createElement('div');
  footer.className = 'dashboard-priority-now__footer';
  const cta = document.createElement('button');
  cta.type = 'button';
  cta.className = 'btn btn-primary dashboard-priority-now__cta';
  cta.textContent = 'Voir les actions prioritaires';
  cta.addEventListener('click', () => go('actions'));
  footer.append(cta);

  root.append(head, summary, host, footer);

  /**
   * @param {string} label
   * @param {string | number} value
   * @param {string} tone
   */
  function makePill(label, value, tone) {
    const el = document.createElement('div');
    el.className = `dashboard-priority-now__pill dashboard-priority-now__pill--${tone}`;
    const v = document.createElement('span');
    v.className = 'dashboard-priority-now__pill-value';
    v.textContent = String(value);
    const lb = document.createElement('span');
    lb.className = 'dashboard-priority-now__pill-label';
    lb.textContent = label;
    el.append(v, lb);
    return el;
  }

  function update({ stats, ncs = [], audits = [] }) {
    const critN = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
    const lateAudN = Array.isArray(audits) ? audits.filter(isLateAudit).length : 0;
    const urgentSignals = critN + lateAudN;
    const overdueSrv = Math.max(0, Number(stats?.overdueActions) || 0);
    const ncOpen = Array.isArray(ncs) ? ncs.filter(isNcOpen).length : 0;

    summary.replaceChildren();
    summary.append(
      makePill('Urgences', urgentSignals, urgentSignals > 0 ? 'urgent' : 'calm'),
      makePill('Actions en retard', overdueSrv, overdueSrv > 0 ? 'delay' : 'calm'),
      makePill('NC ouvertes', ncOpen, ncOpen > 0 ? 'nc' : 'calm')
    );

    const rawTotal = computeRawPriorityCount(stats, ncs, audits);
    if (rawTotal > MAX_ITEMS) {
      const more = document.createElement('p');
      more.className = 'dashboard-priority-now__summary-more';
      more.textContent = `${rawTotal - MAX_ITEMS} autre(s) non listé(s) ici — ouvrez incidents, actions ou audits.`;
      summary.append(more);
    }

    host.replaceChildren();
    const items = buildPriorityItems(stats, ncs, audits);

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'dashboard-priority-now__empty';
      empty.textContent =
        'Rien d’imminent sur les listes chargées : consolidez le suivi courant et les échéances à venir.';
      host.append(empty);
      return;
    }

    items.forEach((it) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dashboard-priority-now__row dashboard-priority-now__row--${it.kind}`;
      btn.setAttribute('role', 'listitem');

      const chip = document.createElement('span');
      chip.className = 'dashboard-priority-now__chip';
      chip.textContent =
        it.kind === 'urgent' ? 'Urgence' : it.kind === 'delay' ? 'Retard' : 'NC';

      const main = document.createElement('span');
      main.className = 'dashboard-priority-now__main';
      const t = document.createElement('span');
      t.className = 'dashboard-priority-now__row-title';
      t.textContent = it.title;
      const m = document.createElement('span');
      m.className = 'dashboard-priority-now__row-meta';
      m.textContent = it.meta;
      main.append(t, m);

      const goLbl = document.createElement('span');
      goLbl.className = 'dashboard-priority-now__go';
      goLbl.textContent = 'Ouvrir →';

      btn.append(chip, main, goLbl);
      btn.addEventListener('click', () => go(it.hash));
      host.append(btn);
    });
  }

  return { root, update };
}
