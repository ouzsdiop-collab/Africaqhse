/**
 * Bloc « Alertes & priorités » — hiérarchie Urgent / À surveiller / Normal.
 * Données : stats API + listes NC / audits (pas de nouvelle route).
 */

import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

const MAX_ROWS = 5;

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

function isAuditLate(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return false;
  return /retard|late|overdue|dépass|reprogram|échéance|à planifier|non réalis/i.test(s);
}


function buildRows(stats, ncs, audits) {
  /** @type {{ tier: 'urgent' | 'watch'; title: string; badge: string; badgeTone: string; meta: string; hash: string; icon: string; navExtras?: Record<string, unknown> }[]} */
  const urgent = [];
  /** @type {{ tier: 'urgent' | 'watch'; title: string; badge: string; badgeTone: string; meta: string; hash: string; icon: string; navExtras?: Record<string, unknown> }[]} */
  const watch = [];

  const crit = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents : [];
  crit.forEach((row) => {
    const ref = row.ref != null ? String(row.ref).trim() : '';
    const iid = row.id != null ? String(row.id).trim() : '';
    const hintTitle = String(row.title || row.type || '').trim().slice(0, 240);
    /** @type {Record<string, unknown>} */
    const navExtras = {
      incidentSeverityFilter: 'critique',
      dashboardIncidentPeriodPreset: '30',
      source: 'dashboard_alerts_prio'
    };
    if (ref) navExtras.focusIncidentRef = ref;
    if (iid) navExtras.focusIncidentId = iid;
    if (hintTitle) navExtras.focusIncidentHintTitle = hintTitle;
    urgent.push({
      tier: 'urgent',
      title: `${row.ref || '—'} — ${row.type || 'Incident'}`,
      badge: 'Critique',
      badgeTone: 'red',
      meta: [row.site, formatShortDate(row.createdAt)].filter(Boolean).join(' · '),
      hash: 'incidents',
      icon: '⚡',
      navExtras
    });
  });

  const overdue = Array.isArray(stats?.overdueActionItems) ? stats.overdueActionItems : [];
  overdue.forEach((row) => {
    const metaParts = [];
    if (row.dueDate) metaParts.push(`Échéance ${formatShortDate(row.dueDate)}`);
    if (row.owner) metaParts.push(`Resp. ${row.owner}`);
    const aid = row.id != null ? String(row.id).trim() : '';
    const ttl = String(row.title || '').trim().slice(0, 240);
    /** @type {Record<string, unknown>} */
    const navExtras = {
      actionsColumnFilter: 'overdue',
      scrollToId: 'qhse-actions-col-overdue',
      source: 'dashboard_alerts_prio'
    };
    if (aid) navExtras.focusActionId = aid;
    if (ttl) navExtras.focusActionTitle = ttl;
    urgent.push({
      tier: 'urgent',
      title: row.title || 'Action en retard',
      badge: 'Retard',
      badgeTone: 'amber',
      meta: metaParts.length ? metaParts.join(' · ') : 'À traiter',
      hash: 'actions',
      icon: '⏱',
      navExtras
    });
  });

  const ncList = Array.isArray(ncs) ? ncs.filter(isNcOpen) : [];
  ncList.forEach((nc) => {
    const nct = String(nc.title || '').trim().slice(0, 120);
    const aref = nc.auditRef != null ? String(nc.auditRef).trim() : '';
    watch.push({
      tier: 'watch',
      title: nc.title || 'Non-conformité',
      badge: 'NC ouverte',
      badgeTone: 'amber',
      meta: nc.auditRef ? `Audit ${nc.auditRef}` : formatShortDate(nc.createdAt),
      hash: 'audits',
      icon: '◎',
      navExtras: {
        scrollToId: 'audit-cockpit-tier-critical',
        source: 'dashboard_alerts_prio',
        ...(aref ? { focusAuditRef: aref } : {}),
        ...(nct ? { linkedNonConformity: nct } : {})
      }
    });
  });

  const audList = Array.isArray(audits) ? audits.filter(isAuditLate) : [];
  audList.forEach((a) => {
    const ar = a.ref != null ? String(a.ref).trim() : '';
    watch.push({
      tier: 'watch',
      title: a.ref ? `Audit ${a.ref}` : 'Audit',
      badge: 'Audit à suivre',
      badgeTone: 'blue',
      meta: [a.site, a.status].filter(Boolean).join(' · ').slice(0, 80),
      hash: 'audits',
      icon: '◉',
      navExtras: {
        scrollToId: 'audit-cockpit-planning-block',
        source: 'dashboard_alerts_prio',
        ...(ar ? { focusAuditRef: ar, focusAuditTitle: ar } : {})
      }
    });
  });

  const merged = [...urgent, ...watch];
  return { merged, urgent, watch, totalAvailable: merged.length };
}

/**
 * @param {{ tier: 'urgent' | 'watch'; title: string; badge: string; badgeTone: string; meta: string; hash: string; icon: string; navExtras?: Record<string, unknown> }} item
 */
function renderAlertRow(item) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = `dashboard-alerts-prio-row dashboard-alerts-prio-row--${item.tier}`;
  row.setAttribute('role', 'listitem');
  row.setAttribute(
    'aria-label',
    `${item.tier === 'urgent' ? 'Urgent' : 'À surveiller'} : ${item.title}`
  );

  const ic = document.createElement('span');
  ic.className = 'dashboard-alerts-prio-icon';
  ic.setAttribute('aria-hidden', 'true');
  ic.textContent = item.icon || '•';

  const tier = document.createElement('span');
  tier.className = 'dashboard-alerts-prio-tier';
  tier.textContent = item.tier === 'urgent' ? 'Urgent' : 'À surveiller';

  const main = document.createElement('div');
  main.className = 'dashboard-alerts-prio-main';
  const title = document.createElement('span');
  title.className = 'dashboard-alerts-prio-title';
  title.textContent = item.title;
  const meta = document.createElement('span');
  meta.className = 'dashboard-alerts-prio-meta';
  meta.textContent = item.meta;
  main.append(title, meta);

  const badge = document.createElement('span');
  badge.className = `dashboard-alerts-prio-badge badge ${item.badgeTone}`;
  badge.textContent = item.badge;

  row.append(ic, tier, main, badge);
  row.addEventListener('click', () =>
    qhseNavigate(item.hash, item.navExtras ? { ...item.navExtras } : {})
  );
  return row;
}

function renderLaneHead(label, count, tone) {
  const h = document.createElement('div');
  h.className = `dashboard-alerts-prio-lane-head dashboard-alerts-prio-lane-head--${tone}`;
  const t = document.createElement('span');
  t.className = 'dashboard-alerts-prio-lane-title';
  t.textContent = label;
  const c = document.createElement('span');
  c.className = 'dashboard-alerts-prio-lane-count';
  c.textContent = String(count);
  h.append(t, c);
  return h;
}

export function createDashboardAlertsPriorites() {
  const sectionInner = document.createElement('article');
  sectionInner.className = 'content-card card-soft dashboard-alerts-prio-card';
  const host = document.createElement('div');
  host.className = 'dashboard-alerts-prio-host';
  host.setAttribute('role', 'list');
  sectionInner.append(host);

  function update({ stats, ncs = [], audits = [] }) {
    sectionInner.querySelector('.dashboard-alerts-prio-footer')?.remove();
    const { merged, urgent, watch, totalAvailable } = buildRows(stats, ncs, audits);
    host.replaceChildren();

    if (merged.length === 0) {
      host.setAttribute('role', 'region');
      host.setAttribute(
        'aria-label',
        'Aucune alerte critique, système stable. Hiérarchie urgent, surveillance, normal.'
      );

      const wrap = document.createElement('div');
      wrap.className = 'dashboard-alerts-prio-normal dashboard-alerts-prio-normal--stable';

      const strip = document.createElement('div');
      strip.className = 'dashboard-alerts-prio-tier-strip';
      strip.setAttribute('aria-hidden', 'true');
      [
        { l: 'Urgent', s: 'Rien à traiter', c: 'urgent-idle' },
        { l: 'À surveiller', s: 'Calme', c: 'watch-idle' },
        { l: 'Normal', s: 'Situation maîtrisée', c: 'normal-active' }
      ].forEach((p) => {
        const pill = document.createElement('div');
        pill.className = `dashboard-alerts-prio-tier-pill dashboard-alerts-prio-tier-pill--${p.c}`;
        const lab = document.createElement('span');
        lab.className = 'dashboard-alerts-prio-tier-pill-label';
        lab.textContent = p.l;
        const sub = document.createElement('span');
        sub.className = 'dashboard-alerts-prio-tier-pill-sub';
        sub.textContent = p.s;
        pill.append(lab, sub);
        strip.append(pill);
      });

      const main = document.createElement('p');
      main.className = 'dashboard-alerts-prio-normal-msg';
      main.textContent = 'Aucune alerte critique — système stable';

      const watchRow = document.createElement('p');
      watchRow.className = 'dashboard-alerts-prio-normal-watch';
      const watchK = document.createElement('span');
      watchK.className = 'dashboard-alerts-prio-normal-watch-k';
      watchK.textContent = 'Synthèse';
      watchRow.append(
        watchK,
        document.createTextNode(' · Priorité sur la prévention et le suivi des plans d’action.')
      );

      const micro = document.createElement('p');
      micro.className = 'dashboard-alerts-prio-micro';
      micro.textContent = 'Actions rapides :';

      const acts = createDashboardBlockActions(
        [
          {
            label: 'Voir les actions',
            pageId: 'actions',
            intent: { actionsColumnFilter: 'overdue', source: 'dashboard_alerts_prio' }
          },
          {
            label: 'Voir les incidents',
            pageId: 'incidents',
            intent: { dashboardIncidentPeriodPreset: '30', source: 'dashboard_alerts_prio' }
          }
        ],
        { className: 'dashboard-block-actions dashboard-block-actions--tight' }
      );
      if (!acts) {
        const fallback = document.createElement('div');
        fallback.className = 'dashboard-block-actions dashboard-block-actions--tight';
        const b1 = document.createElement('button');
        b1.type = 'button';
        b1.className = 'dashboard-block-link';
        b1.textContent = 'Voir les actions';
        b1.addEventListener('click', () =>
          qhseNavigate('actions', { actionsColumnFilter: 'overdue', source: 'dashboard_alerts_prio' })
        );
        const sep = document.createElement('span');
        sep.className = 'dashboard-block-actions-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '·';
        const b2 = document.createElement('button');
        b2.type = 'button';
        b2.className = 'dashboard-block-link';
        b2.textContent = 'Voir les incidents';
        b2.addEventListener('click', () =>
          qhseNavigate('incidents', { dashboardIncidentPeriodPreset: '30', source: 'dashboard_alerts_prio' })
        );
        fallback.append(b1, sep, b2);
        wrap.append(strip, main, watchRow, micro, fallback);
      } else {
        wrap.append(strip, main, watchRow, micro, acts);
      }
      host.append(wrap);
      return;
    }

    host.setAttribute('role', 'list');
    host.removeAttribute('aria-label');

    const urgSlice = urgent.slice(0, MAX_ROWS);
    let rem = MAX_ROWS - urgSlice.length;
    const watchSlice = rem > 0 ? watch.slice(0, rem) : [];

    if (urgSlice.length) {
      host.append(renderLaneHead('Urgent', urgent.length, 'urgent'));
      urgSlice.forEach((item) => host.append(renderAlertRow(item)));
    }

    if (watchSlice.length) {
      host.append(renderLaneHead('À surveiller', watch.length, 'watch'));
      watchSlice.forEach((item) => host.append(renderAlertRow(item)));
    }

    if (totalAvailable > MAX_ROWS) {
      const more = document.createElement('p');
      more.className = 'dashboard-alerts-prio-more';
      more.textContent = `+${totalAvailable - MAX_ROWS} autre(s) — ouvrir les modules concernés.`;
      host.append(more);
    }
  }

  return { root: sectionInner, update };
}
