import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { showToast } from './toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { openRiskCreateDialog } from './riskFormDialog.js';
import { mapApiIncident, mapRowToDisplay } from '../utils/incidentsMappers.js';
import {
  createCorrectiveAction,
  createLinkedAction,
  proposeCorrectiveActionViaAssistant
} from '../utils/incidentsActions.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

const STATUS_PRESETS = ['Nouveau', 'En cours', 'Investigation', 'Clôturé'];

function incidentListFromCtx(ctx) {
  if (typeof ctx.getIncidentRecords === 'function') return ctx.getIncidentRecords();
  return ctx.incidentRecords;
}

function sanitizeClassToken(value, fallback = 'neutral') {
  const token = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '');
  return token || fallback;
}

async function fetchActionsLinkedToIncident(ref) {
  const needle = String(ref || '').trim().toUpperCase();
  if (!needle) return [];
  try {
    const res = await qhseFetch(withSiteQuery('/api/actions?limit=400'));
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((a) => {
      const t = String(a.title || '').toUpperCase();
      const d = String(a.detail || '').toUpperCase();
      return t.includes(needle) || d.includes(needle);
    });
  } catch {
    return [];
  }
}

function incidentOperationalPhase(status) {
  const s = String(status || '').toLowerCase();
  if (/clos|ferm|termin|clôtur|clotur|résolu|resolu|done|complete|trait/.test(s)) {
    return 'traite';
  }
  if (/invest|analys/.test(s) || /\bcours\b/.test(s)) {
    return 'analyse';
  }
  return 'ouvert';
}

function incidentPhaseLabel(status) {
  const p = incidentOperationalPhase(status);
  if (p === 'traite') return 'Traité';
  if (p === 'analyse') return 'En analyse';
  return 'Ouvert';
}

function severityDsBadgeClass(sev) {
  if (sev === 'faible') return 'ds-badge--ok';
  if (sev === 'critique') return 'ds-badge--danger';
  return 'ds-badge--warn';
}

function statusOptionsForSelect(current) {
  const cur = String(current || '').trim();
  const set = new Set(STATUS_PRESETS);
  if (cur && !set.has(cur)) {
    return [cur, ...STATUS_PRESETS];
  }
  return [...STATUS_PRESETS];
}

function inferIncidentAiCauseProbable(inc) {
  const t = String(inc.type || '');
  if (/accident/i.test(t) && !/quasi/i.test(t)) {
    return 'Scénario accidentel : vérifier conditions de poste, EPI et consignes appliquées.';
  }
  if (/quasi/i.test(t)) {
    return 'Near-miss : dérive comportementale ou situation non maîtrisée. Creuser avant reproduction.';
  }
  if (/environnement/i.test(t)) {
    return 'Facteur environnement / matière : contrôler stockage, déchets, rejets ou conditions météo.';
  }
  if (/engin|circulation/i.test(t)) {
    return 'Cohabitation engins / piétons ou circulation : signalisation, vitesse, zones de croisement.';
  }
  return 'Cause à affiner après retour terrain et recoupement des témoins.';
}

function inferIncidentAiActionRecommandee(inc) {
  if (inc.severity === 'critique') {
    return 'Sécuriser la zone, prévenir la hiérarchie, consigner les faits et lancer une action corrective immédiate.';
  }
  if (inc.severity === 'moyen') {
    return 'Analyse rapide en équipe, contrôle des barrières existantes et plan de suivi sous 48 h.';
  }
  return 'Point sécurité en début de poste et vérification des mesures préventives habituelles.';
}

const DIALOG_STYLE_ID = 'qhse-incident-detail-dialog-style';

function ensureIncidentDetailDialogStyles() {
  if (document.getElementById(DIALOG_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = DIALOG_STYLE_ID;
  el.textContent = `.qhse-incident-detail-dialog{border:none;border-radius:14px;max-width:min(520px,96vw);max-height:min(92vh,900px);padding:0;background:var(--bg,#0f172a);color:var(--text);box-shadow:0 24px 64px rgba(0,0,0,.55)}
.qhse-incident-detail-dialog::backdrop{background:rgba(0,0,0,.55)}
.qhse-incident-detail-dialog__toolbar{display:flex;justify-content:flex-end;padding:10px 12px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.qhse-incident-detail-dialog__body{overflow:auto;max-height:min(86vh,860px);padding:12px 16px 18px}
html[data-theme='light'] .qhse-incident-detail-dialog{
  border:1px solid rgba(15,23,42,.16);
  background:linear-gradient(180deg,var(--surface-1,#fff) 0%,var(--surface-2,#f8fafc) 100%);
  color:var(--color-text-primary,#0f172a);
  box-shadow:0 18px 44px -24px rgba(15,23,42,.34);
}
html[data-theme='light'] .qhse-incident-detail-dialog::backdrop{background:rgba(15,23,42,.34)}
html[data-theme='light'] .qhse-incident-detail-dialog__toolbar{
  border-bottom-color:rgba(15,23,42,.13);
  background:color-mix(in srgb,var(--surface-2,#f8fafc) 84%,white 16%);
}
html[data-theme='light'] .qhse-incident-detail-dialog__body{
  background:var(--surface-1,#fff);
}`;
  document.head.append(el);
}

/**
 * @param {object} inc
 * @param {object} opts
 * @param {() => void} [opts.onClose]
 * @param {(i: object) => void} [opts.onEdit]
 * @param {object} [opts] : reste : contexte passé à {@link mountIncidentDetailPanel}
 */
export function openIncidentDetail(inc, opts = {}) {
  const { onClose, onEdit, ...detailCtx } = opts;
  ensureIncidentDetailDialogStyles();
  const dlg = document.createElement('dialog');
  dlg.className = 'qhse-incident-detail-dialog';
  const toolbar = document.createElement('div');
  toolbar.className = 'qhse-incident-detail-dialog__toolbar';
  if (typeof onEdit === 'function') {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-primary';
    editBtn.textContent = 'Modifier';
    editBtn.addEventListener('click', () => {
      onEdit(inc);
    });
    toolbar.append(editBtn);
  }
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-secondary';
  closeBtn.textContent = 'Fermer';
  closeBtn.addEventListener('click', () => dlg.close());
  toolbar.append(closeBtn);
  const body = document.createElement('div');
  body.className = 'qhse-incident-detail-dialog__body';
  dlg.append(toolbar, body);
  document.body.append(dlg);
  dlg.addEventListener('close', () => {
    onClose?.();
    dlg.remove();
  });
  void mountIncidentDetailPanel(body, inc, detailCtx);
  dlg.showModal();
}


export function mountIncidentDetailEmpty(container, message) {
  container.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'incidents-detail-empty';
  const p = document.createElement('p');
  p.className = 'incidents-detail-empty__title';
  p.textContent = message || 'Sélectionnez un incident';
  const sub = document.createElement('p');
  sub.className = 'incidents-detail-empty__sub';
  sub.textContent =
    message === 'Sélectionnez un incident'
      ? 'Cliquez une ligne dans la liste ou « Voir » pour afficher la fiche, le statut et les actions liées.'
      : '';
  wrap.append(p, sub);
  container.append(wrap);
}

export async function mountIncidentDetailPanel(container, inc, ctx) {
  container.replaceChildren();
  const row = mapRowToDisplay(inc);
  const wrap = document.createElement('div');
  wrap.className = 'incidents-detail-filled incidents-detail-filled--premium';

  const mainSec = document.createElement('section');
  mainSec.className = 'incidents-detail-section incidents-detail-section--main';
  const mainH = document.createElement('h3');
  mainH.className = 'incidents-detail-section__title';
  mainH.textContent = 'Informations principales';
  const head = document.createElement('div');
  head.className = 'incidents-detail-head';
  const h2 = document.createElement('h2');
  h2.className = 'incidents-detail-ref';
  h2.textContent = row.ref;
  const titleEl = document.createElement('p');
  titleEl.className = 'incidents-detail-title-line';
  titleEl.textContent = row.title;
  const typeLine = document.createElement('p');
  typeLine.className = 'incidents-detail-type';
  typeLine.textContent = `${row.type} · ${row.site} · ${row.date}`;
  head.append(h2, titleEl, typeLine);

  const badges = document.createElement('div');
  badges.className = 'incidents-detail-badges';
  const badgeSev = document.createElement('span');
  badgeSev.className = `ds-badge ${severityDsBadgeClass(row.severity)}`;
  badgeSev.textContent =
    row.severity.charAt(0).toUpperCase() + row.severity.slice(1);
  badges.append(badgeSev);

  const statusBlock = document.createElement('div');
  statusBlock.className = 'incidents-detail-status';
  const lab = document.createElement('label');
  const labSpan = document.createElement('span');
  labSpan.textContent = 'Statut';
  const sel = document.createElement('select');
  sel.className = 'control-select';
  sel.disabled = !ctx.canWriteIncidents;
  if (!ctx.canWriteIncidents) {
    sel.title = 'Modification du statut réservée (écriture incidents)';
  }
  statusOptionsForSelect(row.status).forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    sel.append(o);
  });
  if ([...sel.options].some((o) => o.value === row.status)) {
    sel.value = row.status;
  }
  sel.addEventListener('change', () => {
    if (sel.value !== row.status) {
      ctx.patchIncidentStatus(inc, sel.value, sel);
    }
  });
  lab.append(labSpan, sel);
  statusBlock.append(lab);

  if (typeof ctx.openIncidentAiAnalysis === 'function') {
    const iaRow = document.createElement('div');
    iaRow.style.marginTop = '14px';
    const btnIaAnalyze = document.createElement('button');
    btnIaAnalyze.type = 'button';
    btnIaAnalyze.className = 'btn btn-secondary';
    btnIaAnalyze.textContent = '✦ Analyser avec IA';
    btnIaAnalyze.hidden = !ctx.canUseAiSuggest;
    btnIaAnalyze.title = ctx.canUseAiSuggest
      ? 'Causes racines et actions correctives (API, validation humaine)'
      : 'Permission suggestions IA requise';
    btnIaAnalyze.addEventListener('click', () => {
      ctx.openIncidentAiAnalysis(inc);
    });
    iaRow.append(btnIaAnalyze);
    mainSec.append(mainH, head, badges, statusBlock, iaRow);
  } else {
    mainSec.append(mainH, head, badges, statusBlock);
  }

  const metaSec = document.createElement('section');
  metaSec.className = 'incidents-detail-section';
  const metaH = document.createElement('h3');
  metaH.className = 'incidents-detail-section__title';
  metaH.textContent = 'Fiche terrain';
  const phase = incidentPhaseLabel(row.status);
  const phasePill = document.createElement('span');
  const phaseToken = sanitizeClassToken(incidentOperationalPhase(row.status), 'open');
  phasePill.className = `incidents-phase-pill incidents-phase-pill--${phaseToken}`;
  phasePill.textContent = phase;
  phasePill.title = 'Lecture opérationnelle : ouvert / en analyse / traité';
  const metaDl = document.createElement('dl');
  metaDl.className = 'incidents-detail-dl';
  [
    ['Date', row.date || 'Non disponible'],
    ['Site', row.site || 'Non renseigné'],
    ['Lieu précis', (row.location || '').trim() || 'Non renseigné'],
    ['Gravité', row.severity || 'Non renseigné']
  ].forEach(([dt, dd]) => {
    const dtt = document.createElement('dt');
    dtt.textContent = dt;
    const ddd = document.createElement('dd');
    ddd.textContent = dd;
    metaDl.append(dtt, ddd);
  });
  const dttPh = document.createElement('dt');
  dttPh.textContent = 'Phase';
  const dddPh = document.createElement('dd');
  dddPh.append(phasePill);
  metaDl.append(dttPh, dddPh);
  const respLine = document.createElement('p');
  respLine.className = 'incidents-detail-resp';
  respLine.textContent = row.responsible?.trim()
    ? `Responsable suivi : ${row.responsible.trim()}`
    : 'Responsable suivi : non renseigné';
  metaSec.append(metaH, metaDl, respLine);

  const serverAnalysisSec = document.createElement('section');
  serverAnalysisSec.className = 'incidents-detail-section incidents-detail-section--analysis';
  const srvH = document.createElement('h3');
  srvH.className = 'incidents-detail-section__title';
  srvH.textContent = 'Analyse causes (serveur)';
  const srvLead = document.createElement('p');
  srvLead.className = 'incidents-detail-muted';
  srvLead.textContent =
    'Classifiez la cause dominante pour le pilotage (humain / matériel / organisation).';
  const anaCatLab = document.createElement('label');
  anaCatLab.className = 'incidents-detail-analysis-field';
  const anaCatSpan = document.createElement('span');
  anaCatSpan.textContent = 'Cause dominante';
  const anaCatSel = document.createElement('select');
  anaCatSel.className = 'control-select';
  anaCatSel.disabled = !ctx.canWriteIncidents;
  [
    ['', 'Non renseigné'],
    ['humain', 'Humain'],
    ['materiel', 'Matériel'],
    ['organisation', 'Organisation'],
    ['mixte', 'Mixte']
  ].forEach(([v, lab]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = lab;
    anaCatSel.append(o);
  });
  anaCatSel.value = row.causeCategory || '';
  anaCatLab.append(anaCatSpan, anaCatSel);

  const anaCausesLab = document.createElement('label');
  anaCausesLab.className = 'incidents-detail-analysis-field';
  const anaCausesSpan = document.createElement('span');
  anaCausesSpan.textContent = 'Causes (texte)';
  const anaCausesTa = document.createElement('textarea');
  anaCausesTa.className = 'control-input incidents-detail-analysis-ta';
  anaCausesTa.rows = 4;
  anaCausesTa.disabled = !ctx.canWriteIncidents;
  anaCausesTa.value = (row.causes || '').trim();
  anaCausesTa.placeholder = 'Faits, conditions, facteurs contributifs…';
  anaCausesLab.append(anaCausesSpan, anaCausesTa);

  const anaRespLab = document.createElement('label');
  anaRespLab.className = 'incidents-detail-analysis-field';
  const anaRespSpan = document.createElement('span');
  anaRespSpan.textContent = 'Responsable suivi';
  const anaRespInp = document.createElement('input');
  anaRespInp.type = 'text';
  anaRespInp.className = 'control-input';
  anaRespInp.disabled = !ctx.canWriteIncidents;
  anaRespInp.value = (row.responsible || '').trim();
  anaRespInp.maxLength = 200;
  anaRespLab.append(anaRespSpan, anaRespInp);

  const btnSaveAnalysis = document.createElement('button');
  btnSaveAnalysis.type = 'button';
  btnSaveAnalysis.className = 'btn btn-primary incidents-detail-save-analysis';
  btnSaveAnalysis.textContent = 'Enregistrer l’analyse';
  btnSaveAnalysis.hidden = !ctx.canWriteIncidents;
  btnSaveAnalysis.addEventListener('click', async () => {
    btnSaveAnalysis.disabled = true;
    try {
      const res = await qhseFetch(`/api/incidents/${encodeURIComponent(inc.ref)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          causes: anaCausesTa.value.trim() || null,
          causeCategory: anaCatSel.value || null,
          responsible: anaRespInp.value.trim() || null
        })
      });
      if (!res.ok) {
        let msg = 'Enregistrement impossible';
        try {
          const b = await res.json();
          if (b.error) msg = b.error;
        } catch {
          /* ignore */
        }
        showToast(msg, 'error');
        return;
      }
      const updated = await res.json();
      const entry = mapApiIncident(updated);
      if (entry) {
        const list = incidentListFromCtx(ctx);
        const idx = list.findIndex((r) => r.ref === entry.ref);
        if (idx >= 0) list[idx] = entry;
      }
      showToast('Analyse enregistrée', 'success');
      if (typeof ctx.onAddLog === 'function') {
        ctx.onAddLog({
          module: 'incidents',
          action: 'Analyse incident',
          detail: `${inc.ref} : causes / catégorie`,
          user: getSessionUser()?.name || 'Terrain'
        });
      }
      ctx.refreshIncidentJournal();
      const fresh = incidentListFromCtx(ctx).find((r) => r.ref === inc.ref);
      if (fresh) await mountIncidentDetailPanel(container, fresh, ctx);
    } catch (e) {
      console.error('[incidents] PATCH analyse', e);
      showToast('Erreur réseau', 'error');
    } finally {
      btnSaveAnalysis.disabled = false;
    }
  });

  serverAnalysisSec.append(
    srvH,
    srvLead,
    anaCatLab,
    anaCausesLab,
    anaRespLab,
    btnSaveAnalysis
  );

  const descSec = document.createElement('section');
  descSec.className = 'incidents-detail-section';
  const descH = document.createElement('h3');
  descH.className = 'incidents-detail-section__title';
  descH.textContent = 'Description';
  const descP = document.createElement('p');
  descP.className = 'incidents-detail-desc';
  descP.textContent = (row.description || '').trim() || 'Aucune description.';
  descSec.append(descH, descP);

  const photoSec = document.createElement('section');
  photoSec.className = 'incidents-detail-section';
  const photoH = document.createElement('h3');
  photoH.className = 'incidents-detail-section__title';
  photoH.textContent = 'Photos';
  const shots = Array.isArray(row.photos) ? row.photos : [];
  if (shots.length) {
    const grid = document.createElement('div');
    grid.className = 'incidents-detail-photo-grid';
    shots.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Photo ${i + 1} : ${row.ref}`;
      img.className = 'incidents-detail-photo-thumb';
      img.loading = 'lazy';
      grid.append(img);
    });
    photoSec.append(photoH, grid);
  } else {
    const photoP = document.createElement('p');
    photoP.className = 'incidents-detail-muted';
    photoP.textContent = 'Aucune photo sur cette fiche.';
    photoSec.append(photoH, photoP);
  }

  const aiCause = inferIncidentAiCauseProbable(row);
  const aiAction = inferIncidentAiActionRecommandee(row);
  const aiSec = document.createElement('section');
  aiSec.className = 'incidents-detail-section incidents-detail-section--ai';
  const aiH = document.createElement('h3');
  aiH.className = 'incidents-detail-section__title';
  aiH.textContent = 'Suggestions assistées (lecture indicative)';
  const aiDisclaimer = document.createElement('p');
  aiDisclaimer.className = 'incidents-detail-muted';
  aiDisclaimer.textContent =
    'Propositions générées localement (type + gravité). Elles ne sont jamais enregistrées sans action de votre part. L’API PATCH incident ne prend pas encore la description.';
  const aiGrid = document.createElement('div');
  aiGrid.className = 'incidents-ai-grid';
  const boxC = document.createElement('div');
  boxC.className = 'incidents-ai-box';
  const lc = document.createElement('span');
  lc.className = 'incidents-ai-box__label';
  lc.textContent = 'Cause probable';
  const tc = document.createElement('p');
  tc.className = 'incidents-ai-box__text';
  tc.textContent = aiCause;
  boxC.append(lc, tc);
  const boxA = document.createElement('div');
  boxA.className = 'incidents-ai-box';
  const la = document.createElement('span');
  la.className = 'incidents-ai-box__label';
  la.textContent = 'Action recommandée';
  const ta = document.createElement('p');
  ta.className = 'incidents-ai-box__text';
  ta.textContent = aiAction;
  boxA.append(la, ta);
  aiGrid.append(boxC, boxA);
  const aiFoot = document.createElement('div');
  aiFoot.className = 'incidents-ai-foot';
  const copyAiBtn = document.createElement('button');
  copyAiBtn.type = 'button';
  copyAiBtn.className = 'btn btn-secondary';
  copyAiBtn.textContent = 'Copier analyse (IA)';
  const aiDraft = `Cause probable (IA) : ${aiCause}\nAction recommandée (IA) : ${aiAction}`;
  copyAiBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(aiDraft);
      showToast('Texte copié. À coller dans votre rapport ou SI.', 'info');
    } catch {
      showToast('Copie impossible sur ce navigateur', 'error');
    }
  });
  const chkLab = document.createElement('label');
  chkLab.className = 'incidents-ai-validate';
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.id = `inc-ai-validate-${row.ref.replace(/[^a-z0-9-]/gi, '')}`;
  const chkSpan = document.createElement('span');
  chkSpan.textContent = 'J’ai relu ces suggestions (validation humaine obligatoire avant toute décision).';
  chkLab.append(chk, chkSpan);
  aiFoot.append(copyAiBtn, chkLab);
  aiSec.append(aiH, aiDisclaimer, aiGrid, aiFoot);

  const analysisSec = document.createElement('section');
  analysisSec.className = 'incidents-detail-section';
  const anH = document.createElement('h3');
  anH.className = 'incidents-detail-section__title';
  anH.textContent = 'Analyse (brouillon local)';
  const anTa = document.createElement('textarea');
  anTa.className = 'incidents-detail-analysis-draft';
  anTa.readOnly = true;
  anTa.rows = 5;
  anTa.value = aiDraft;
  const anNote = document.createElement('p');
  anNote.className = 'incidents-detail-muted';
  anNote.textContent =
    'Non synchronisé avec le serveur. Utilisez « Copier » pour votre GED / rapport. Aucune écriture automatique.';
  analysisSec.append(anH, anTa, anNote);

  const actSec = document.createElement('section');
  actSec.className = 'incidents-detail-section';
  const actH = document.createElement('h3');
  actH.className = 'incidents-detail-section__title';
  actH.textContent = 'Actions liées';
  const actHost = document.createElement('div');
  actHost.className = 'incidents-detail-actions-host';
  const actLoad = document.createElement('p');
  actLoad.className = 'incidents-detail-muted';
  actLoad.textContent = 'Chargement…';
  actHost.append(actLoad);
  actSec.append(actH, actHost);

  const foot = document.createElement('div');
  foot.className = 'incidents-detail-foot incidents-detail-foot--links';
  const btnCorrAssist = document.createElement('button');
  btnCorrAssist.type = 'button';
  btnCorrAssist.className = 'btn btn-secondary';
  btnCorrAssist.textContent = 'Assistant : action corrective';
  btnCorrAssist.title = 'Ouvre le formulaire prérempli par l’assistant. Vous validez avant envoi.';
  btnCorrAssist.hidden = !ctx.canWriteActions;
  btnCorrAssist.addEventListener('click', () => {
    void proposeCorrectiveActionViaAssistant(inc);
  });
  const btnCorr = document.createElement('button');
  btnCorr.type = 'button';
  btnCorr.className = 'btn btn-primary';
  btnCorr.textContent = 'Créer action corrective';
  btnCorr.hidden = !ctx.canWriteActions;
  btnCorr.addEventListener('click', () => {
    void createCorrectiveAction(inc);
  });
  const btnAct = document.createElement('button');
  btnAct.type = 'button';
  btnAct.className = 'btn btn-secondary';
  btnAct.textContent = 'Créer action liée';
  btnAct.hidden = !ctx.canWriteActions;
  btnAct.title = 'Action de suivi générique (même assistant qu’avant)';
  btnAct.addEventListener('click', () => {
    void createLinkedAction(inc);
  });
  const btnRisk = document.createElement('button');
  btnRisk.type = 'button';
  btnRisk.className = 'btn btn-secondary';
  btnRisk.textContent = 'Créer risque associé';
  btnRisk.addEventListener('click', () => {
    openRiskCreateDialog({
      defaults: {
        category: 'Sécurité',
        title: `Risque lié ${inc.ref}`,
        description: `Contexte incident ${inc.ref} : ${inc.type} (${inc.site}).\n\n${(inc.description || '').slice(0, 1400)}`
      },
      onSaved: () => {
        showToast(
          'Fiche ajoutée au registre Risques (local). Ouvrez le module Risques pour la suite.',
          'success'
        );
        activityLogStore.add({
          module: 'incidents',
          action: 'Création risque lié',
          detail: inc.ref,
          user: getSessionUser()?.name || 'Terrain'
        });
        ctx.refreshIncidentJournal();
      }
    });
  });
  const btnActionsPage = document.createElement('button');
  btnActionsPage.type = 'button';
  btnActionsPage.className = 'btn incidents-detail-foot__secondary';
  btnActionsPage.textContent = 'Ouvrir pilotage actions';
  btnActionsPage.addEventListener('click', () => {
    qhseNavigate('actions');
  });
  foot.append(btnCorrAssist, btnCorr, btnAct, btnRisk, btnActionsPage);

  wrap.append(
    mainSec,
    metaSec,
    serverAnalysisSec,
    descSec,
    photoSec,
    aiSec,
    analysisSec,
    actSec,
    foot
  );
  container.append(wrap);

  const linked = await fetchActionsLinkedToIncident(inc.ref);
  actHost.replaceChildren();
  if (!linked.length) {
    const empty = document.createElement('p');
    empty.className = 'incidents-detail-muted';
    empty.textContent = 'Aucune action trouvée dont le libellé ou le détail mentionne cette référence.';
    actHost.append(empty);
  } else {
    const ul = document.createElement('ul');
    ul.className = 'incidents-detail-action-list';
    linked.slice(0, 12).forEach((a) => {
      const li = document.createElement('li');
      li.className = 'incidents-detail-action-item';
      const t = document.createElement('strong');
      t.textContent = String(a.title || 'Non renseigné');
      const st = document.createElement('span');
      st.className = 'incidents-detail-action-status';
      st.textContent = String(a.status || '');
      li.append(t, document.createTextNode(' · '), st);
      ul.append(li);
    });
    actHost.append(ul);
    if (linked.length > 12) {
      const more = document.createElement('p');
      more.className = 'incidents-detail-muted';
      more.textContent = `… et ${linked.length - 12} autre(s). Voir pilotage actions.`;
      actHost.append(more);
    }
  }
}
