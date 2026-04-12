import { parseRiskMatrixGp, riskCriticalityFromMeta } from './riskMatrixPanel.js';
import { openRiskDetail } from './riskDetailPanel.js';
import { getLinksFor } from '../services/moduleLinks.service.js';
import { riskWorkflowStatusLabelFr } from '../utils/risksRegisterModel.js';

function toneClass(tone) {
  if (tone === 'red') return 'red';
  if (tone === 'amber') return 'amber';
  return 'blue';
}

/** @param {number} tier 1..5 */
function tierToRowTone(tier) {
  if (tier >= 5) return 'red';
  if (tier >= 3) return 'amber';
  return 'blue';
}

function dash(v) {
  const s = v != null ? String(v).trim() : '';
  return s || '—';
}

function hasActionLinked(r) {
  return r?.actionLinked != null && typeof r.actionLinked === 'object';
}

/**
 * Alertes visuelles — pilotage opérationnel.
 * @param {object} r
 */
export function computeRiskRowAlerts(r) {
  const crit = riskCriticalityFromMeta(r.meta);
  const criticalNoAction =
    Boolean(crit && crit.tier >= 4 && !hasActionLinked(r));
  const sansAction = !hasActionLinked(r);
  const derive = r.pilotageState === 'derive' || r.trend === 'up';
  let stale = false;
  if (r.updatedAt) {
    const d = new Date(r.updatedAt);
    if (!Number.isNaN(d.getTime())) {
      const days = (Date.now() - d.getTime()) / 86400000;
      stale = days > 60;
    }
  }
  return { criticalNoAction, sansAction, derive, stale };
}

/**
 * Ligne registre : clic → fiche modal QHSE.
 * @param {object} risk
 * @param {object} [opts]
 * @param {Array<{ ref: string, type: string, status: string, date: string }>} [opts.linkedIncidents]
 * @param {string} [opts.incidentsLinkNote]
 * @param {() => void} [opts.onRefresh]
 * @param {(riskTitle: string) => void} [opts.onCreatePreventiveAction]
 * @param {(riskTitle: string) => void} [opts.onCreatePtwFromRisk]
 * @param {(inner: HTMLElement, risk: object) => void} [opts.onSheetBodyReady]
 * @param {'essential'|'full'} [opts.tableColumnMode]
 */
export function createRiskRegisterRow(risk, opts = {}) {
  const tableColumnMode = opts.tableColumnMode === 'full' ? 'full' : 'essential';
  const linkedIncidents = Array.isArray(opts.linkedIncidents) ? opts.linkedIncidents : [];
  const incidentsLinkNote =
    typeof opts.incidentsLinkNote === 'string'
      ? opts.incidentsLinkNote
      : 'Les incidents affichés suivent le filtre site global (comme le module Incidents).';
  const crit = riskCriticalityFromMeta(risk.meta);
  const gp = parseRiskMatrixGp(risk.meta);
  const toneKey = crit ? tierToRowTone(crit.tier) : toneClass(risk.tone);
  const alerts = computeRiskRowAlerts(risk);
  const relLinks = getLinksFor('risks', risk.title || '');

  const tr = document.createElement('tr');
  tr.className = `risk-register-table-row risk-register-table-row--${toneKey}`;
  if (risk.title) tr.setAttribute('data-risk-title', String(risk.title));
  if (alerts.sansAction) {
    tr.classList.add('risk-register-table-row--no-action');
    if (!alerts.criticalNoAction) tr.classList.add('risk-register-table-row--pulse-soft');
  }
  if (alerts.criticalNoAction) {
    tr.classList.add('risk-register-table-row--pulse-crit');
    tr.title = 'Risque critique sans action liée — prioriser.';
  }
  if (alerts.derive) tr.classList.add('risk-register-table-row--warn-derive');
  if (alerts.stale) tr.classList.add('risk-register-table-row--stale-update');

  const tdName = document.createElement('td');
  tdName.className = 'risk-register-table-row__name';
  const titleEl = document.createElement('strong');
  titleEl.className = 'risk-register-table-row__title';
  titleEl.textContent = risk.title || 'Sans titre';
  tdName.append(titleEl);
  if (risk.type) {
    const tag = document.createElement('span');
    tag.className = 'risk-register-table-row__type-tag';
    tag.textContent = String(risk.type);
    tdName.append(tag);
  }
  if (alerts.stale) {
    const st = document.createElement('span');
    st.className = 'risk-register-table-row__stale-badge';
    st.textContent = 'À actualiser';
    st.title = 'Dernière mise à jour ancienne — revoir la fiche.';
    tdName.append(st);
  }
  if (alerts.derive) {
    const w = document.createElement('span');
    w.className = 'risk-register-table-row__derive-badge';
    w.textContent = 'Dérive';
    w.title = 'Tendance à la hausse ou état de dérive — vérifier le pilotage.';
    tdName.append(w);
  }
  if (tableColumnMode === 'essential') {
    const bits = [];
    if (crit) bits.push(crit.label);
    if (gp) bits.push(`G${gp.g}×P${gp.p}`);
    const own = dash(risk.responsible);
    if (own !== '—') bits.push(own);
    const meta = document.createElement('div');
    meta.className = 'risk-register-table-row__meta-inline';
    meta.textContent = bits.length ? bits.join(' · ') : '—';
    tdName.append(meta);
  }

  const tdCrit = document.createElement('td');
  tdCrit.className = 'risk-register-table-row__crit';
  if (crit) {
    const lbl = document.createElement('span');
    lbl.className = 'risk-register-table-row__crit-label';
    lbl.textContent = crit.label;
    const sc = document.createElement('span');
    sc.className = 'risk-register-table-row__crit-score';
    sc.title = 'Produit G×P';
    sc.textContent = `×${crit.product}`;
    tdCrit.append(lbl, sc);
  } else {
    const na = document.createElement('span');
    na.className = 'risk-register-table-row__crit-na';
    na.textContent = dash(risk.meta);
    tdCrit.append(na);
  }
  if (tableColumnMode === 'essential') tdCrit.classList.add('qhse-col-adv');

  const tdGp = document.createElement('td');
  tdGp.className = 'risk-register-table-row__gp';
  const gpAbbr = document.createElement('abbr');
  gpAbbr.className = 'risk-register-table-row__gxp-abbr';
  gpAbbr.title =
    'G×P = Gravité × Probabilité (1 à 25). On multiplie deux notes : plus le produit est élevé, plus la priorité de traitement augmente sur la matrice (ISO 45001 / 14001).';
  gpAbbr.textContent = gp ? `G${gp.g}×P${gp.p}` : '—';
  tdGp.append(gpAbbr);
  if (tableColumnMode === 'essential') tdGp.classList.add('qhse-col-adv');

  const tdStatus = document.createElement('td');
  tdStatus.className = 'risk-register-table-row__status';
  const stBadge = document.createElement('span');
  stBadge.className = `badge ${toneKey} risk-register-table-row__badge`;
  stBadge.textContent = riskWorkflowStatusLabelFr(risk.status);
  tdStatus.append(stBadge);

  const tdOwner = document.createElement('td');
  tdOwner.className = 'risk-register-table-row__owner';
  tdOwner.textContent = dash(risk.responsible);
  if (tableColumnMode === 'essential') tdOwner.classList.add('qhse-col-adv');

  const tdAction = document.createElement('td');
  tdAction.className = 'risk-register-table-row__action';
  const al = risk.actionLinked;

  const primaryAct = document.createElement('div');
  primaryAct.className = 'risk-register-table-row__act-primary';

  const more = document.createElement('details');
  more.className = 'risk-register-row__more';
  const moreSum = document.createElement('summary');
  moreSum.className = 'risk-register-row__more-summary';
  moreSum.textContent = 'Liens & actions';
  const moreBody = document.createElement('div');
  moreBody.className = 'risk-register-row__more-body';

  const rel = document.createElement('div');
  rel.className = 'risk-register-table-row__act-meta';
  rel.textContent = `Vue 360° : ${relLinks.length} lien(s)`;
  moreBody.append(rel);

  if (alerts.criticalNoAction && typeof opts.onCreatePreventiveAction === 'function') {
    const autoBtn = document.createElement('button');
    autoBtn.type = 'button';
    autoBtn.className = 'risk-register-table-row__act-nav';
    autoBtn.textContent = 'Créer action';
    autoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onCreatePreventiveAction(String(risk.title || ''));
    });
    moreBody.append(autoBtn);
  }
  if (typeof opts.onCreatePtwFromRisk === 'function') {
    const ptwBtn = document.createElement('button');
    ptwBtn.type = 'button';
    ptwBtn.className = 'risk-register-table-row__act-nav';
    ptwBtn.textContent = 'Créer un permis de travail';
    ptwBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onCreatePtwFromRisk(String(risk.title || ''));
    });
    moreBody.append(ptwBtn);
  }

  const adminSlot = document.createElement('div');
  adminSlot.setAttribute('data-risk-admin-actions', '');
  moreBody.append(adminSlot);

  more.append(moreSum, moreBody);

  if (al && typeof al === 'object') {
    const refEl = document.createElement('span');
    refEl.className = 'risk-register-table-row__act-ref';
    refEl.textContent = dash(al.ref);
    const line = document.createElement('span');
    line.className = 'risk-register-table-row__act-meta';
    line.textContent = `${dash(al.status)} · ${dash(al.due)}`;
    const goAct = document.createElement('button');
    goAct.type = 'button';
    goAct.className = 'risk-register-table-row__act-nav';
    goAct.textContent = 'Plan d’actions';
    goAct.title = 'Ouvrir le module Plan d’actions';
    goAct.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.hash = 'actions';
    });
    primaryAct.append(refEl, line, goAct);
  } else {
    const none = document.createElement('span');
    none.className = 'risk-register-table-row__act-none';
    none.textContent = 'Sans action liée';
    primaryAct.append(none);
  }

  tdAction.append(primaryAct, more);

  tr.append(tdName, tdCrit, tdGp, tdStatus, tdOwner, tdAction);

  function openSheet(e) {
    if (e.target.closest('button,a,summary,details')) return;
    openRiskDetail(risk, {
      linkedIncidents,
      incidentsLinkNote,
      onRefresh: opts.onRefresh,
      onCreatePreventiveAction: opts.onCreatePreventiveAction,
      onSheetBodyReady: opts.onSheetBodyReady
    });
  }

  tr.addEventListener('click', openSheet);
  tr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openSheet(e);
    }
  });
  tr.tabIndex = 0;
  tr.setAttribute('role', 'button');
  tr.setAttribute(
    'aria-label',
    `Ouvrir la fiche : ${risk.title || 'Risque'}`
  );

  const frag = document.createDocumentFragment();
  frag.append(tr);
  return frag;
}
