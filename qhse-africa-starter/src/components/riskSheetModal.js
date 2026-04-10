/**
 * Fiche risque QHSE (ISO 45001 / 14001) — modal lecture + contexte opérationnel.
 */

import { parseRiskMatrixGp, riskCriticalityFromMeta } from './riskMatrixPanel.js';
import {
  computeEvolutionBadgeKind,
  EVOLUTION_BADGE_LABELS,
  formatGpHistoryArrow
} from '../utils/riskGpEvolution.js';
import { addMockIncidentRefToRisk } from '../utils/riskMockIncidentLinks.js';
import { showToast } from './toast.js';

export { openRiskCreateDialog as openRiskDialog } from './riskFormDialog.js';

const STYLE_ID = 'qhse-risk-sheet-modal-styles';

const CSS = `
.risk-sheet-modal::backdrop{background:rgba(0,0,0,.55)}
.risk-sheet-modal{border:none;border-radius:16px;max-width:min(640px,96vw);max-height:min(90vh,840px);padding:0;background:var(--bg,#0f172a);color:var(--text);box-shadow:0 24px 48px rgba(0,0,0,.5)}
.risk-sheet-modal__inner{padding:18px 20px 20px;overflow:auto;max-height:min(90vh,840px)}
.risk-sheet-modal__head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(148,163,184,.15)}
.risk-sheet-modal__title{margin:0;font-size:17px;font-weight:800;line-height:1.25;max-width:42ch}
.risk-sheet-modal__close{border:1px solid rgba(148,163,184,.25);background:rgba(0,0,0,.2);color:var(--text2);border-radius:10px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:700}
.risk-sheet-modal__close:hover{border-color:rgba(45,212,191,.4);color:var(--text)}
.risk-sheet-modal__grid{display:grid;gap:12px}
.risk-sheet-modal__section{padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.15)}
.risk-sheet-modal__section h4{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.risk-sheet-modal__section p,.risk-sheet-modal__section ul{margin:0;font-size:12px;line-height:1.45;color:var(--text2)}
.risk-sheet-modal__gp-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.risk-sheet-modal__gp-pill{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;padding:6px 10px;border-radius:10px;background:rgba(45,212,191,.12);border:1px solid rgba(45,212,191,.25)}
.risk-sheet-modal__gxp-hint{font-size:11px;color:var(--text3);max-width:52ch;line-height:1.4}
.risk-sheet-modal__gxp-help{cursor:help;border-bottom:1px dashed rgba(148,163,184,.4)}
.risk-sheet-modal__status{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:800}
.risk-sheet-modal__status--ok{background:rgba(34,197,94,.15);color:#bbf7d0}
.risk-sheet-modal__status--run{background:rgba(59,130,246,.18);color:#bfdbfe}
.risk-sheet-modal__status--crit{background:rgba(239,68,68,.2);color:#fecaca}
.risk-sheet-modal__hist{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.risk-sheet-modal__hist li{font-size:11px;padding:8px;border-radius:8px;background:rgba(0,0,0,.2);border-left:3px solid rgba(45,212,191,.35)}
.risk-sheet-modal__hist-when{display:block;font-size:10px;color:var(--text3);margin-bottom:4px}
.risk-sheet-modal__evolution-badges{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}
.risk-evolution-badge{font-size:10px;font-weight:800;padding:4px 10px;border-radius:999px;letter-spacing:.02em}
.risk-evolution-badge--improve{background:rgba(34,197,94,.2);color:#bbf7d0;border:1px solid rgba(34,197,94,.35)}
.risk-evolution-badge--drift{background:rgba(245,158,11,.18);color:#fde68a;border:1px solid rgba(245,158,11,.35)}
.risk-evolution-badge--worse{background:rgba(239,68,68,.2);color:#fecaca;border:1px solid rgba(239,68,68,.35)}
.risk-sheet-modal__gp-timeline{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:11px}
.risk-sheet-modal__gp-timeline li{padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.2);border-left:3px solid rgba(45,212,191,.3)}
.risk-sheet-modal__inc-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.risk-sheet-modal__inc-count{font-size:11px;font-weight:700;color:var(--text3)}
.risk-sheet-modal__gxp-long{font-size:11px;color:var(--text3);line-height:1.45;margin-top:8px;padding:8px;border-radius:8px;background:rgba(0,0,0,.15);border:1px dashed rgba(148,163,184,.2)}
.risk-sheet-modal__gxp-long strong{color:var(--text2)}
`;

function ensureRiskSheetModalStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}

function dash(v) {
  const s = v != null ? String(v).trim() : '';
  return s || '—';
}

/**
 * Statut opérationnel affiché (pas de libellés réglementaires hors contexte africain).
 * @param {object} r
 */
export function riskOperationalStatusLabel(r) {
  if (r?.pilotageState === 'traite') return { key: 'maitrise', label: 'Maîtrisé' };
  const crit = riskCriticalityFromMeta(r?.meta);
  if (crit && crit.tier >= 4) return { key: 'critique', label: 'Critique' };
  const st = String(r?.status || '').toLowerCase();
  if (st.includes('critique')) return { key: 'critique', label: 'Critique' };
  return { key: 'encours', label: 'En cours' };
}

function defaultHistory(r) {
  if (Array.isArray(r.history) && r.history.length) return r.history;
  return [
    {
      when: r.updatedAt || '—',
      who: 'Système',
      what: 'Dernière mise à jour affichée sur la fiche.'
    }
  ];
}

/**
 * @param {object} risk
 * @param {{
 *   linkedIncidents?: object[];
 *   incidentsLinkNote?: string;
 *   onRefresh?: () => void;
 *   onCreatePreventiveAction?: (riskTitle: string) => void;
 *   onClose?: () => void;
 *   onEdit?: (risk: object) => void;
 *   onSheetBodyReady?: (inner: HTMLElement, risk: object) => void;
 * }} ctx
 */
export function openRiskSheetModal(risk, ctx = {}) {
  ensureRiskSheetModalStyles();
  const gp = parseRiskMatrixGp(risk.meta);
  const crit = riskCriticalityFromMeta(risk.meta);
  const prod = gp ? gp.g * gp.p : crit?.product ?? '—';
  const statusOp = riskOperationalStatusLabel(risk);
  const { main: desc } = splitDetail(risk.detail);

  const dialog = document.createElement('dialog');
  dialog.className = 'risk-sheet-modal';
  dialog.setAttribute('aria-labelledby', 'risk-sheet-modal-title');

  const inner = document.createElement('div');
  inner.className = 'risk-sheet-modal__inner';

  const head = document.createElement('div');
  head.className = 'risk-sheet-modal__head';
  const h2 = document.createElement('h2');
  h2.className = 'risk-sheet-modal__title';
  h2.id = 'risk-sheet-modal-title';
  h2.textContent = risk.title || 'Fiche risque';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'risk-sheet-modal__close';
  closeBtn.textContent = 'Fermer';
  closeBtn.addEventListener('click', () => dialog.close());
  if (typeof ctx.onEdit === 'function') {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'risk-sheet-modal__close';
    editBtn.textContent = 'Modifier';
    editBtn.style.marginRight = '8px';
    editBtn.addEventListener('click', () => {
      ctx.onEdit(risk);
    });
    head.append(h2, editBtn, closeBtn);
  } else {
    head.append(h2, closeBtn);
  }

  const grid = document.createElement('div');
  grid.className = 'risk-sheet-modal__grid';

  function section(title, bodyNode) {
    const sec = document.createElement('section');
    sec.className = 'risk-sheet-modal__section';
    const h = document.createElement('h4');
    h.textContent = title;
    sec.append(h, bodyNode);
    return sec;
  }

  const pDesc = document.createElement('p');
  pDesc.textContent = desc || '—';
  grid.append(section('Description du risque', pDesc));

  const pCauses = document.createElement('p');
  pCauses.textContent = risk.causes != null ? String(risk.causes) : '—';
  grid.append(section('Causes', pCauses));

  const pCons = document.createElement('p');
  pCons.textContent =
    risk.impacts != null ? String(risk.impacts) : '—';
  grid.append(section('Conséquences', pCons));

  const gpHist = Array.isArray(risk.gpHistory) ? risk.gpHistory : [];
  const evoKind = computeEvolutionBadgeKind(gpHist, risk);
  if (evoKind) {
    const wrap = document.createElement('div');
    wrap.className = 'risk-sheet-modal__evolution-badges';
    const spec = EVOLUTION_BADGE_LABELS[evoKind];
    const span = document.createElement('span');
    span.className = `risk-evolution-badge ${spec.className}`;
    span.textContent = spec.label;
    wrap.append(span);
    const arrow = document.createElement('span');
    arrow.style.fontSize = '11px';
    arrow.style.color = 'var(--text3)';
    arrow.textContent = formatGpHistoryArrow(gpHist, risk);
    wrap.append(arrow);
    grid.append(section('Tendance d’évaluation (G×P)', wrap));
  }

  if (gpHist.length) {
    const ul = document.createElement('ul');
    ul.className = 'risk-sheet-modal__gp-timeline';
    gpHist.forEach((h) => {
      const li = document.createElement('li');
      li.textContent = `${h.when} — G${h.g}×P${h.p}${h.note ? ` · ${h.note}` : ''}`;
      ul.append(li);
    });
    grid.append(section('Historique Gravité / Probabilité', ul));
  }

  const gpBlock = document.createElement('div');
  gpBlock.className = 'risk-sheet-modal__gp-row';
  const gVal = gp ? `G = ${gp.g}` : '—';
  const pVal = gp ? `P = ${gp.p}` : '—';
  const gEl = document.createElement('span');
  gEl.className = 'risk-sheet-modal__gp-pill';
  gEl.textContent = gVal;
  const pEl = document.createElement('span');
  pEl.className = 'risk-sheet-modal__gp-pill';
  pEl.textContent = pVal;
  const critEl = document.createElement('span');
  critEl.className = 'risk-sheet-modal__gp-pill';
  const abbrGx = document.createElement('abbr');
  abbrGx.className = 'risk-sheet-modal__gxp-help';
  abbrGx.title =
    'Produit Gravité × Probabilité (score 1–25). Palier lu sur la matrice ISO 45001 / 14001.';
  abbrGx.textContent = 'G×P';
  const strongGx = document.createElement('strong');
  strongGx.textContent = String(prod);
  critEl.append(
    document.createTextNode('Criticité '),
    abbrGx,
    document.createTextNode(' = '),
    strongGx
  );
  const hint = document.createElement('p');
  hint.className = 'risk-sheet-modal__gxp-hint';
  hint.textContent =
    'Score G×P : indicateur de priorisation relative (matrice ISO). Les seuils dépendent de votre politique QHSE.';
  gpBlock.append(gEl, pEl, critEl);
  const gpSec = section('Évaluation', gpBlock);
  gpSec.append(hint);
  const gxpEdu = document.createElement('p');
  gxpEdu.className = 'risk-sheet-modal__gxp-long';
  gxpEdu.innerHTML =
    '<strong>Pourquoi G×P ?</strong> La gravité (G) estime l’ampleur si le risque se réalise ; la probabilité (P) estime la fréquence ou la vraisemblance. Le produit classe la priorité sur la matrice (ISO 45001 / 14001). Ce n’est pas une obligation légale unique : c’est un outil de pilotage à adapter au site.';
  gpSec.append(gxpEdu);
  grid.append(gpSec);

  const mesures = document.createElement('p');
  mesures.textContent =
    risk.mesuresExistantes != null
      ? String(risk.mesuresExistantes)
      : extractMesuresFromDetail(risk.detail);
  grid.append(section('Mesures de maîtrise existantes', mesures));

  const actSec = document.createElement('div');
  const al = risk.actionLinked;
  if (al && typeof al === 'object') {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = dash(al.ref);
    p.append(
      strong,
      document.createTextNode(
        ` — ${dash(al.status)} · échéance ${dash(al.due)} · ${dash(al.owner)}`
      )
    );
    actSec.append(p);
  } else {
    const em = document.createElement('p');
    em.textContent = 'Aucune action liée dans le registre actions.';
    actSec.append(em);
  }
  if (typeof ctx.onCreatePreventiveAction === 'function') {
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.style.marginTop = '10px';
    prevBtn.style.fontSize = '11px';
    prevBtn.style.padding = '6px 10px';
    prevBtn.textContent = 'Créer action préventive';
    prevBtn.title =
      'Ouvre le formulaire Plan d’actions avec type préventif et risque pré-rempli.';
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      ctx.onCreatePreventiveAction(String(risk.title || ''));
      dialog.close();
    });
    actSec.append(prevBtn);
  }
  grid.append(section('Actions associées', actSec));

  const own = document.createElement('p');
  own.textContent = dash(risk.responsible);
  grid.append(section('Responsable', own));

  const stWrap = document.createElement('div');
  const badge = document.createElement('span');
  badge.className = `risk-sheet-modal__status risk-sheet-modal__status--${
    statusOp.key === 'maitrise' ? 'ok' : statusOp.key === 'critique' ? 'crit' : 'run'
  }`;
  badge.textContent = statusOp.label;
  stWrap.append(badge);
  grid.append(section('Statut (pilotage)', stWrap));

  const linked = Array.isArray(ctx.linkedIncidents) ? ctx.linkedIncidents : [];

  const incSection = document.createElement('section');
  incSection.className = 'risk-sheet-modal__section';
  const incH = document.createElement('h4');
  incH.textContent = 'Incidents liés';
  const incHead = document.createElement('div');
  incHead.className = 'risk-sheet-modal__inc-head';
  const incCount = document.createElement('span');
  incCount.className = 'risk-sheet-modal__inc-count';
  incCount.textContent = `${linked.length} lien(s)`;
  const assocBtn = document.createElement('button');
  assocBtn.type = 'button';
  assocBtn.className = 'btn btn-secondary';
  assocBtn.style.fontSize = '11px';
  assocBtn.style.padding = '6px 10px';
  assocBtn.textContent = 'Associer un incident';
  assocBtn.title = 'Ajoute une référence locale — à synchroniser avec votre SI si besoin.';
  assocBtn.addEventListener('click', () => {
    const ref = window.prompt('Référence incident (ex. INC-204) :');
    if (!ref || !String(ref).trim()) return;
    addMockIncidentRefToRisk(risk.title, String(ref).trim());
    showToast(`Incident ${String(ref).trim()} associé (stockage local).`, 'info');
    ctx.onRefresh?.();
    dialog.close();
  });
  incHead.append(incCount, assocBtn);
  const incList = document.createElement('ul');
  incList.className = 'risk-sheet-modal__hist';
  if (linked.length === 0) {
    const li = document.createElement('li');
    li.textContent =
      'Aucun incident lié — bouton ci-dessus ou marqueur dans le module Incidents.';
    incList.append(li);
  } else {
    linked.forEach((inc) => {
      const li = document.createElement('li');
      const when = document.createElement('span');
      when.className = 'risk-sheet-modal__hist-when';
      when.textContent = `${dash(inc.ref)} · ${dash(inc.date)}`;
      li.append(when, document.createTextNode(`${dash(inc.type)} — ${dash(inc.status)}`));
      incList.append(li);
    });
  }
  const incNote = document.createElement('p');
  incNote.style.marginTop = '8px';
  incNote.style.fontSize = '11px';
  incNote.style.color = 'var(--text3)';
  incNote.textContent = ctx.incidentsLinkNote || '';
  incSection.append(incH, incHead, incList, incNote);
  grid.append(incSection);

  const auditP = document.createElement('p');
  auditP.className = 'risk-sheet-modal__audit-placeholder';
  auditP.textContent =
    'Liaison audits : utilisez le marqueur dans les constats (structure « Audit → risque ») ou une future clé API — aucune donnée locale sur cette fiche.';
  grid.append(section('Audits associés', auditP));

  const histUl = document.createElement('ul');
  histUl.className = 'risk-sheet-modal__hist';
  defaultHistory(risk).forEach((h) => {
    const li = document.createElement('li');
    const when = document.createElement('span');
    when.className = 'risk-sheet-modal__hist-when';
    when.textContent = `${dash(h.when)} · ${dash(h.who)}`;
    li.append(when, document.createTextNode(dash(h.what)));
    histUl.append(li);
  });
  grid.append(section('Historique des modifications', histUl));

  inner.append(head, grid);
  if (typeof ctx.onSheetBodyReady === 'function') {
    try {
      ctx.onSheetBodyReady(inner, risk);
    } catch (e) {
      console.warn('[riskSheetModal] onSheetBodyReady', e);
    }
  }
  dialog.append(inner);
  document.body.append(dialog);

  dialog.addEventListener('close', () => {
    try {
      ctx.onClose?.();
    } finally {
      dialog.remove();
    }
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.showModal();
  requestAnimationFrame(() => closeBtn.focus());
}

function splitDetail(detail) {
  const d = String(detail || '');
  const idx = d.indexOf('— Mesures envisagées —');
  if (idx < 0) return { main: d.trim() };
  return { main: d.slice(0, idx).trim() };
}

function extractMesuresFromDetail(detail) {
  const d = String(detail || '');
  const idx = d.indexOf('— Mesures envisagées —');
  if (idx < 0) return '—';
  return d.slice(idx + '— Mesures envisagées —'.length).trim() || '—';
}
