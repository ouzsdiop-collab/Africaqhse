import { parseRiskMatrixGp, riskCriticalityFromMeta } from './riskMatrixPanel.js';

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

/**
 * @param {string} [detail]
 * @returns {{ main: string, mesures: string }}
 */
function splitRiskDetail(detail) {
  const d = String(detail || '');
  const idx = d.indexOf('— Mesures envisagées —');
  if (idx < 0) return { main: d.trim(), mesures: '' };
  return {
    main: d.slice(0, idx).trim(),
    mesures: d.slice(idx + '— Mesures envisagées —'.length).trim()
  };
}

/**
 * Ligne registre : titre, criticité, G×P, statut, responsable, action liée — détail structuré au clic.
 * @param {object} risk
 * @param {object} [opts]
 * @param {Array<{ ref: string, type: string, status: string, date: string }>} [opts.linkedIncidents]
 * @param {string} [opts.incidentsLinkNote]
 */
export function createRiskRegisterRow(risk, opts = {}) {
  const linkedIncidents = Array.isArray(opts.linkedIncidents) ? opts.linkedIncidents : [];
  const incidentsLinkNote =
    typeof opts.incidentsLinkNote === 'string'
      ? opts.incidentsLinkNote
      : 'Les incidents affichés suivent le filtre site global (comme le module Incidents).';
  const crit = riskCriticalityFromMeta(risk.meta);
  const gp = parseRiskMatrixGp(risk.meta);
  const toneKey = crit ? tierToRowTone(crit.tier) : toneClass(risk.tone);
  const { main: infoMain, mesures } = splitRiskDetail(risk.detail);

  const tr = document.createElement('tr');
  tr.className = `risk-register-table-row risk-register-table-row--${toneKey}`;

  const tdName = document.createElement('td');
  tdName.className = 'risk-register-table-row__name';
  const titleEl = document.createElement('strong');
  titleEl.className = 'risk-register-table-row__title';
  titleEl.textContent = risk.title || 'Sans titre';
  tdName.append(titleEl);

  const tdCrit = document.createElement('td');
  tdCrit.className = 'risk-register-table-row__crit';
  if (crit) {
    tdCrit.innerHTML = `<span class="risk-register-table-row__crit-label">${crit.label}</span><span class="risk-register-table-row__crit-score" title="Score G×P">×${crit.product}</span>`;
  } else {
    tdCrit.innerHTML = `<span class="risk-register-table-row__crit-na">${dash(risk.meta)}</span>`;
  }

  const tdGp = document.createElement('td');
  tdGp.className = 'risk-register-table-row__gp';
  tdGp.textContent = gp ? `G${gp.g}×P${gp.p}` : '—';

  const tdStatus = document.createElement('td');
  tdStatus.className = 'risk-register-table-row__status';
  const stBadge = document.createElement('span');
  stBadge.className = `badge ${toneKey} risk-register-table-row__badge`;
  stBadge.textContent = risk.status || '—';
  tdStatus.append(stBadge);

  const tdOwner = document.createElement('td');
  tdOwner.className = 'risk-register-table-row__owner';
  tdOwner.textContent = dash(risk.responsible);

  const tdAction = document.createElement('td');
  tdAction.className = 'risk-register-table-row__action';
  const al = risk.actionLinked;
  if (al && typeof al === 'object') {
    tdAction.innerHTML = `<span class="risk-register-table-row__act-ref">${dash(al.ref)}</span><span class="risk-register-table-row__act-meta">${dash(al.status)} · ${dash(al.due)}</span><span class="risk-register-table-row__act-owner">${dash(al.owner)}</span>`;
    const goAct = document.createElement('button');
    goAct.type = 'button';
    goAct.className = 'risk-register-table-row__act-nav';
    goAct.textContent = 'Actions';
    goAct.title = 'Ouvrir le module Plan d’actions';
    goAct.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.hash = 'actions';
    });
    tdAction.append(goAct);
  } else {
    tdAction.innerHTML = '<span class="risk-register-table-row__act-none">—</span>';
    const hint = document.createElement('span');
    hint.className = 'risk-register-table-row__act-hint';
    hint.textContent = 'À lier';
    tdAction.append(hint);
  }

  const actSummary =
    al && typeof al === 'object'
      ? `${dash(al.ref)} · ${dash(al.status)} · ${dash(al.owner)}`
      : 'Sans action liée';
  tr.title = `${risk.title || 'Risque'} — ${actSummary}`;

  tr.append(tdName, tdCrit, tdGp, tdStatus, tdOwner, tdAction);

  const trDetail = document.createElement('tr');
  trDetail.className = 'risk-register-table-row--detail';
  const tdDetail = document.createElement('td');
  tdDetail.colSpan = 6;
  tdDetail.className = 'risk-register-table-row__detail-cell';

  const shell = document.createElement('div');
  shell.className = 'risk-detail-premium';

  function addSection(title, bodyHtmlOrText, emptyHint) {
    const sec = document.createElement('section');
    sec.className = 'risk-detail-premium__section';
    const h = document.createElement('h4');
    h.className = 'risk-detail-premium__section-title';
    h.textContent = title;
    const body = document.createElement('div');
    body.className = 'risk-detail-premium__section-body';
    const text = typeof bodyHtmlOrText === 'string' ? bodyHtmlOrText.trim() : '';
    if (text) {
      body.textContent = text;
    } else {
      const em = document.createElement('p');
      em.className = 'risk-detail-premium__empty';
      em.textContent = emptyHint || 'Non renseigné — à compléter.';
      body.append(em);
    }
    sec.append(h, body);
    return sec;
  }

  shell.append(
    addSection('Informations', infoMain, 'Aucune description détaillée.'),
    addSection(
      'Causes',
      risk.causes != null ? String(risk.causes) : '',
      'Causes non structurées — compléter la fiche.'
    ),
    addSection(
      'Impacts',
      risk.impacts != null ? String(risk.impacts) : '',
      'Impacts non structurés — compléter la fiche.'
    )
  );

  const secActions = document.createElement('section');
  secActions.className = 'risk-detail-premium__section';
  const hAct = document.createElement('h4');
  hAct.className = 'risk-detail-premium__section-title';
  hAct.textContent = 'Actions liées';
  const bodyAct = document.createElement('div');
  bodyAct.className = 'risk-detail-premium__section-body';
  if (al && typeof al === 'object') {
    bodyAct.innerHTML = `<p class="risk-detail-premium__action-line"><strong>${dash(al.ref)}</strong> — ${dash(al.status)} · échéance ${dash(al.due)} · pilote ${dash(al.owner)}</p>`;
    const goDet = document.createElement('button');
    goDet.type = 'button';
    goDet.className = 'risk-detail-premium__nav-btn';
    goDet.textContent = 'Ouvrir le module Actions';
    goDet.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.hash = 'actions';
    });
    bodyAct.append(goDet);
  } else {
    const p = document.createElement('p');
    p.className = 'risk-detail-premium__empty';
    p.textContent = 'Aucune action liée au registre actions.';
    bodyAct.append(p);
  }
  if (mesures) {
    const pre = document.createElement('pre');
    pre.className = 'risk-detail-premium__mesures';
    pre.textContent = mesures;
    bodyAct.append(pre);
  }
  secActions.append(hAct, bodyAct);
  shell.append(secActions);

  const secInc = document.createElement('section');
  secInc.className = 'risk-detail-premium__section';
  const hInc = document.createElement('h4');
  hInc.className = 'risk-detail-premium__section-title';
  hInc.textContent = 'Incidents liés';
  const bodyInc = document.createElement('div');
  bodyInc.className = 'risk-detail-premium__section-body';
  if (linkedIncidents.length === 0) {
    const p = document.createElement('p');
    p.className = 'risk-detail-premium__empty';
    p.textContent =
      'Aucun incident lié : à la déclaration, utiliser « Associer à un risque du registre (optionnel) » dans le module Incidents.';
    bodyInc.append(p);
  } else {
    const ul = document.createElement('ul');
    ul.className = 'risk-detail-premium__inc-list';
    linkedIncidents.forEach((inc) => {
      const li = document.createElement('li');
      li.className = 'risk-detail-premium__inc-item';
      li.innerHTML = `<span class="risk-detail-premium__inc-ref">${dash(inc.ref)}</span> <span class="risk-detail-premium__inc-meta">${dash(inc.type)} · ${dash(inc.status)} · ${dash(inc.date)}</span>`;
      ul.append(li);
    });
    bodyInc.append(ul);
  }
  const incFoot = document.createElement('p');
  incFoot.className = 'risk-detail-premium__scope-note';
  incFoot.textContent = incidentsLinkNote;
  bodyInc.append(incFoot);
  secInc.append(hInc, bodyInc);
  shell.append(secInc);

  tdDetail.append(shell);
  trDetail.append(tdDetail);

  tr.addEventListener('click', () => {
    trDetail.hidden = !trDetail.hidden;
    tr.classList.toggle('risk-register-table-row--open', !trDetail.hidden);
  });

  trDetail.hidden = true;

  const frag = document.createDocumentFragment();
  frag.append(tr, trDetail);
  return frag;
}
