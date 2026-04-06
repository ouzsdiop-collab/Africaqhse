/**
 * Points de vigilance — tendances, anomalies, dérives (données dashboard existantes).
 */

import { MS_DAY, computeIncidentWeekMetrics } from '../utils/dashboardIncidentMetrics.js';
import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';

const MAX_ITEMS = 5;

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

function isActionDone(a) {
  const s = String(a?.status || '').toLowerCase();
  if (s.includes('retard')) return false;
  return /termin|clos|ferm|clôtur|realis|réalis|effectu|complete|complété|fait/.test(s);
}

function go(hash) {
  const id = String(hash || '').replace(/^#/, '');
  if (id) window.location.hash = id;
}

/**
 * @typedef {{ variant: 'trend' | 'anomaly' | 'drift'; headline: string; detail: string; hash: string }} VigilanceItem
 */

/**
 * @param {{
 *   stats?: { overdueActions?: number };
 *   incidents?: unknown[];
 *   actions?: unknown[];
 *   audits?: unknown[];
 *   ncs?: unknown[];
 * }} input
 * @returns {VigilanceItem[]}
 */
export function computeVigilanceItems(input) {
  const stats = input?.stats || {};
  const incidents = Array.isArray(input?.incidents) ? input.incidents : [];
  const actions = Array.isArray(input?.actions) ? input.actions : [];
  const audits = Array.isArray(input?.audits) ? input.audits : [];
  const ncs = Array.isArray(input?.ncs) ? input.ncs : [];

  const now = Date.now();
  const { spike } = computeIncidentWeekMetrics(incidents, now);

  /** @type {VigilanceItem[]} */
  const out = [];

  if (spike) {
    out.push({
      variant: 'trend',
      headline: 'Les incidents accélèrent sur 7 jours',
      detail:
        'La fenêtre récente dépasse la période précédente : vérifier les causes récurrentes et le terrain.',
      hash: 'incidents'
    });
  }

  const openNc = ncs.filter(isNcOpen);
  const bySite = new Map();
  const byAuditRef = new Map();
  openNc.forEach((nc) => {
    const sid = nc?.siteId != null && String(nc.siteId).trim() ? String(nc.siteId) : '';
    if (sid) bySite.set(sid, (bySite.get(sid) || 0) + 1);
    const ar = nc?.auditRef != null && String(nc.auditRef).trim() ? String(nc.auditRef).trim() : '';
    if (ar) byAuditRef.set(ar, (byAuditRef.get(ar) || 0) + 1);
  });
  const siteVals = [...bySite.values()];
  const maxSite = siteVals.length ? Math.max(...siteVals) : 0;
  const auditVals = [...byAuditRef.values()];
  const maxAuditRef = auditVals.length ? Math.max(...auditVals) : 0;
  if (maxSite >= 2) {
    out.push({
      variant: 'anomaly',
      headline: 'NC ouvertes concentrées sur un même site',
      detail: 'Le volume par site sort du schéma habituel : prioriser une revue locale et le plan d’actions.',
      hash: 'audits'
    });
  } else if (maxAuditRef >= 2) {
    out.push({
      variant: 'anomaly',
      headline: 'Même filière d’audit : NC qui se répètent',
      detail: 'Plusieurs ouvertures sur un même contexte : creuser la cause système, pas seulement le symptôme.',
      hash: 'audits'
    });
  }

  const cutoff30 = now - 30 * MS_DAY;
  let stale30 = 0;
  actions.forEach((a) => {
    if (isActionDone(a)) return;
    if (!a?.dueDate) return;
    const d = new Date(a.dueDate).getTime();
    if (Number.isNaN(d) || d >= cutoff30) return;
    stale30 += 1;
  });
  const overdueKpi = Math.max(0, Number(stats.overdueActions) || 0);
  if (stale30 >= 3 || overdueKpi >= 6) {
    out.push({
      variant: 'drift',
      headline: 'File d’actions qui vieillit',
      detail:
        'Nombre élevé d’actions anciennes ou en retard côté agrégat : risque de dérive du plan — arbitrage nécessaire.',
      hash: 'actions'
    });
  } else if (stale30 >= 2 || overdueKpi >= 4) {
    out.push({
      variant: 'drift',
      headline: 'Plusieurs actions sans clôture prolongée',
      detail: 'Échéances dépassées ou anciennes : relancer les porteurs et séquencer les clôtures.',
      hash: 'actions'
    });
  }

  const lateAudits = audits.filter(isAuditLate);
  if (lateAudits.length >= 2) {
    const sites = new Set(
      lateAudits.map((a) => (a?.site != null && String(a.site).trim() ? String(a.site).trim() : ''))
    );
    sites.delete('');
    out.push({
      variant: 'drift',
      headline:
        sites.size >= 2
          ? 'Audits en retard sur plusieurs sites'
          : 'Plusieurs audits à finaliser ou à replanifier',
      detail: 'Le calendrier audit s’écarte : sécuriser les dates ou ajuster les ressources.',
      hash: 'audits'
    });
  }

  const scored = audits
    .map((a) => ({
      t: a?.createdAt ? new Date(a.createdAt).getTime() : NaN,
      score: Number(a?.score)
    }))
    .filter((x) => Number.isFinite(x.t) && !Number.isNaN(x.t) && Number.isFinite(x.score));
  scored.sort((a, b) => a.t - b.t);
  if (scored.length >= 8) {
    const mid = Math.floor(scored.length / 2);
    const older = scored.slice(0, mid);
    const newer = scored.slice(mid);
    const avg = (arr) => arr.reduce((s, x) => s + x.score, 0) / arr.length;
    const aOld = avg(older);
    const aNew = avg(newer);
    if (aOld >= 55 && aNew < aOld - 7) {
      out.push({
        variant: 'trend',
        headline: 'Les scores audit baissent sur les dossiers récents',
        detail: 'Écart significatif vs périodes plus anciennes : renforcer le cadrage ou la formation terrain.',
        hash: 'audits'
      });
    }
  }

  return out.slice(0, MAX_ITEMS);
}

/** @deprecated Utiliser computeVigilanceItems — conservé pour compatibilité éventuelle. */
export function computeVigilanceMessages(input) {
  return computeVigilanceItems(input).map((x) => x.headline);
}

const VARIANT_ICON = { trend: '📈', anomaly: '⚠', drift: '↘' };
const VARIANT_LABEL = { trend: 'Tendance', anomaly: 'Anomalie', drift: 'Dérive' };

export function createDashboardVigilancePoints() {
  const card = document.createElement('article');
  card.className = 'content-card card-soft dashboard-vigilance-card';
  const host = document.createElement('div');
  host.className = 'dashboard-vigilance-host';
  card.append(host);

  function update(payload) {
    card.querySelector('.dashboard-vigilance-actions')?.remove();
    const items = computeVigilanceItems(payload || {});
    host.replaceChildren();

    if (!items.length) {
      const emptyWrap = document.createElement('div');
      emptyWrap.className = 'dashboard-vigilance-empty-block';
      const p = document.createElement('p');
      p.className = 'dashboard-vigilance-empty-lead';
      p.textContent = 'Aucun signal fort sur les règles actuelles';
      const sub = document.createElement('p');
      sub.className = 'dashboard-vigilance-empty-detail';
      sub.textContent = 'Données dans la norme.';
      emptyWrap.append(p, sub);
      host.append(emptyWrap);
    } else {
      const list = document.createElement('ul');
      list.className = 'dashboard-vigilance-rich-list';
      items.forEach((it) => {
        const li = document.createElement('li');
        li.className = `dashboard-vigilance-rich-item dashboard-vigilance-rich-item--${it.variant}`;

        const top = document.createElement('div');
        top.className = 'dashboard-vigilance-rich-top';
        const ic = document.createElement('span');
        ic.className = 'dashboard-vigilance-rich-icon';
        ic.setAttribute('aria-hidden', 'true');
        ic.textContent = VARIANT_ICON[it.variant] || '•';
        const lab = document.createElement('span');
        lab.className = 'dashboard-vigilance-rich-variant';
        lab.textContent = VARIANT_LABEL[it.variant] || 'Veille';
        top.append(ic, lab);

        const hl = document.createElement('p');
        hl.className = 'dashboard-vigilance-rich-headline';
        hl.textContent = it.headline;

        const det = document.createElement('p');
        det.className = 'dashboard-vigilance-rich-detail';
        det.textContent = it.detail;

        const row = document.createElement('div');
        row.className = 'dashboard-vigilance-rich-cta';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dashboard-vigilance-investigate';
        btn.textContent = 'Investiguer';
        btn.addEventListener('click', () => go(it.hash));
        const hint = document.createElement('span');
        hint.className = 'dashboard-vigilance-rich-hint';
        hint.textContent = 'Voir le détail dans le module';
        row.append(btn, hint);

        li.append(top, hl, det, row);
        list.append(li);
      });
      host.append(list);
    }

    const actWrap = document.createElement('div');
    actWrap.className = 'dashboard-vigilance-actions';
    const linkSpecs = items.length
      ? [
          { label: 'Vue audits & NC', pageId: 'audits' },
          { label: 'Vue incidents', pageId: 'incidents' }
        ]
      : [
          { label: 'Explorer les incidents', pageId: 'incidents' },
          { label: 'Ouvrir les actions', pageId: 'actions' }
        ];
    const bar = createDashboardBlockActions(linkSpecs, {
      className: 'dashboard-block-actions dashboard-block-actions--tight'
    });
    if (bar) actWrap.append(bar);
    if (actWrap.childNodes.length) card.append(actWrap);
  }

  return { root: card, update };
}
