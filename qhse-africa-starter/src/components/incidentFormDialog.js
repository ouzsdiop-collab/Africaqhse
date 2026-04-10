import { siteOptions } from '../data/navigation.js';
import { appState } from '../utils/state.js';
import { showToast } from './toast.js';
import { createSeveritySegment } from './severitySegment.js';
import { getApiBase } from '../config.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { readImportDraft, clearImportDraft } from '../utils/importDraft.js';
import { getRiskTitlesForSelect, formatRiskLinkTag } from '../utils/riskIncidentLinks.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { mapApiIncident, formatIsoDateToFr, normalizeSeverity } from '../utils/incidentsMappers.js';

const INCIDENT_TYPES = [
  'Quasi-accident',
  'Accident',
  'Environnement',
  'Sécurité',
  'Engin / circulation',
  'Autre'
];

const CAUSE_CATEGORY_CHIPS = [
  ['humain', 'Humain'],
  ['materiel', 'Matériel'],
  ['organisation', 'Organisation'],
  ['mixte', 'Mixte']
];

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('lecture fichier'));
    r.readAsDataURL(file);
  });
}

function computeNextRef(list) {
  const nums = list.map((r) => {
    const m = /^INC-(\d+)$/i.exec(r.ref);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 200;
  return `INC-${max + 1}`;
}

const INCIDENTS_SLIDEOVER_STYLE_ID = 'qhse-incidents-slideover';

export function ensureIncidentsSlideOverStyles() {
  if (document.getElementById(INCIDENTS_SLIDEOVER_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = INCIDENTS_SLIDEOVER_STYLE_ID;
  el.textContent = `
.inc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}
.inc-overlay--open {
  opacity: 1;
  pointer-events: all;
}
.inc-slideover {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(440px, 100vw);
  max-width: 100vw;
  background: var(--bg, #0f172a);
  border-left: 1px solid rgba(255,255,255,.09);
  z-index: 201;
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
@media (max-width: 520px) {
  .inc-slideover { width: 100vw; }
  .incidents-rapid-nav .btn { min-height: 48px; font-size: 15px; }
}
.inc-slideover--open {
  transform: translateX(0);
}
.inc-slideover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,.065);
  flex-shrink: 0;
}
.inc-slideover__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text, rgba(255,255,255,.9));
}
.inc-slideover__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 0.5px solid rgba(255,255,255,.1);
  background: transparent;
  color: var(--text2, rgba(255,255,255,.5));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.inc-slideover__close:hover {
  background: rgba(255,255,255,.07);
  color: var(--text, rgba(255,255,255,.88));
}
.inc-slideover__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 20px;
}
.inc-ia-section { margin-bottom: 20px; }
.inc-ia-section__title { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--text2, rgba(255,255,255,.55)); margin: 0 0 10px; }
.inc-ia-row { padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.1); margin-bottom: 10px; background: rgba(255,255,255,.04); }
.inc-ia-row__head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 6px; }
.inc-ia-confidence { font-size: 12px; font-weight: 800; white-space: nowrap; color: var(--color-primary-text, #99f6e4); }
.inc-ia-cat { font-size: 11px; color: var(--text2, rgba(255,255,255,.5)); margin-top: 4px; }
.inc-ia-actions { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
.inc-ia-provider { font-size: 11px; color: var(--text2, rgba(255,255,255,.45)); margin-bottom: 12px; }
dialog.qhse-inc-declare-dialog {
  position: fixed;
  inset: 0 0 0 auto;
  margin: 0;
  max-height: 100vh;
  height: 100%;
  width: min(440px, 100vw);
  max-width: 100vw;
  padding: 0;
  border: none;
  border-left: 1px solid rgba(255,255,255,.09);
  background: var(--bg, #0f172a);
  color: var(--text, rgba(255,255,255,.9));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 201;
}
dialog.qhse-inc-declare-dialog::backdrop {
  background: rgba(0,0,0,.6);
}
@media (max-width: 520px) {
  dialog.qhse-inc-declare-dialog { width: 100vw; }
}
`;
  document.head.append(el);
}

/**
 * @param {object} ctx
 * @returns {{ openDeclare: () => void, quick: HTMLElement, slideOver: { open: (el: HTMLElement) => void, close: () => void } }}
 */
export function setupIncidentDeclareFlow(ctx) {
  const {
    btnDeclare,
    btnTerrain,
    getIncidentRecords,
    onDeclared,
    onSave,
    refreshList,
    refreshIncidentJournal,
    onAddLog
  } = ctx;
  const declareCb = onDeclared ?? onSave;


  const quick = document.createElement('article');
  quick.id = 'incidents-declare';
  quick.className =
    'content-card card-soft incidents-form-card incidents-premium-card incidents-declare-card';

  const head = document.createElement('div');
  head.className = 'content-card-head';
  head.innerHTML = `
      <div>
        <div class="section-kicker">Terrain</div>
        <h3>Déclaration express</h3>
        <p class="incidents-form-lead">
          5 étapes courtes — une seule question visible à la fois. Validation finale requise avant envoi API.
        </p>
        <p class="incidents-form-api-hint" title="URL technique pour support / intégration">
          API : <code>${escapeHtml(getApiBase())}</code>
        </p>
      </div>`;

  const wizRoot = document.createElement('div');
  wizRoot.className = 'incidents-rapid-wizard';

  const stepLabel = document.createElement('div');
  stepLabel.className = 'incidents-rapid-wizard__step-label';
  const dots = document.createElement('div');
  dots.className = 'incidents-rapid-dots';
  for (let i = 0; i < 5; i += 1) {
    const d = document.createElement('span');
    d.className = 'incidents-rapid-dot';
    d.dataset.idx = String(i);
    dots.append(d);
  }
  wizRoot.append(stepLabel, dots);

  const paneTitles = [
    'Type d’incident',
    'Gravité perçue',
    'Description courte',
    'Photo (optionnel)',
    'Site & localisation'
  ];

  const pane0 = document.createElement('div');
  pane0.className = 'incidents-rapid-pane';
  pane0.dataset.pane = '0';
  const q0 = document.createElement('p');
  q0.className = 'incidents-rapid-q';
  q0.textContent = 'Quel type d’événement ?';
  const typeChips = document.createElement('div');
  typeChips.className = 'incidents-rapid-type-chips';
  const typeSelect = document.createElement('select');
  typeSelect.className = 'control-select incident-field-type incidents-sr-only';
  typeSelect.setAttribute('aria-hidden', 'true');
  typeSelect.tabIndex = -1;
  const optTypePlaceholder = document.createElement('option');
  optTypePlaceholder.value = '';
  optTypePlaceholder.textContent = '—';
  typeSelect.append(optTypePlaceholder);
  INCIDENT_TYPES.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    typeSelect.append(opt);
  });
  const chipByType = new Map();
  INCIDENT_TYPES.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'incidents-rapid-chip';
    b.textContent = t;
    b.addEventListener('click', () => {
      typeSelect.value = t;
      chipByType.forEach((btn, key) => {
        btn.classList.toggle('incidents-rapid-chip--on', key === t);
      });
      syncNav();
    });
    chipByType.set(t, b);
    typeChips.append(b);
  });
  pane0.append(q0, typeChips, typeSelect);

  const pane1 = document.createElement('div');
  pane1.className = 'incidents-rapid-pane';
  pane1.dataset.pane = '1';
  pane1.hidden = true;
  const q1 = document.createElement('p');
  q1.className = 'incidents-rapid-q';
  q1.textContent = 'Quelle gravité ?';
  const severityMount = document.createElement('div');
  severityMount.className = 'incident-severity-mount';
  pane1.append(q1, severityMount);

  const pane2 = document.createElement('div');
  pane2.className = 'incidents-rapid-pane';
  pane2.dataset.pane = '2';
  pane2.hidden = true;
  const q2 = document.createElement('p');
  q2.className = 'incidents-rapid-q';
  q2.textContent = 'Que s’est-il passé ? (2–3 phrases max)';
  const descInput = document.createElement('textarea');
  descInput.className = 'control-input incidents-field-desc incident-field-desc';
  descInput.maxLength = 2000;
  descInput.rows = 3;
  descInput.placeholder = 'Faits, lieu immédiat, conséquences visibles…';
  descInput.autocomplete = 'off';
  pane2.append(q2, descInput);

  const pane3 = document.createElement('div');
  pane3.className = 'incidents-rapid-pane';
  pane3.dataset.pane = '3';
  pane3.hidden = true;
  const q3 = document.createElement('p');
  q3.className = 'incidents-rapid-q';
  q3.textContent = 'Ajouter une photo ?';
  const photoInput = document.createElement('input');
  photoInput.type = 'file';
  photoInput.accept = 'image/*';
  photoInput.className = 'incidents-rapid-photo-input';
  const photoNote = document.createElement('p');
  photoNote.className = 'incidents-form-lead incidents-rapid-photo-note';
  photoNote.textContent =
    '1 photo, max. ~420 Ko — stockée avec la fiche (aperçu dans le détail). Réduisez la résolution si besoin.';
  const photoPreview = document.createElement('div');
  photoPreview.className = 'incidents-rapid-photo-preview';
  photoInput.addEventListener('change', () => {
    photoPreview.replaceChildren();
    const f = photoInput.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f);
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Aperçu';
    img.className = 'incidents-rapid-photo-preview__img';
    photoPreview.append(img);
  });
  pane3.append(q3, photoInput, photoNote, photoPreview);

  const pane4 = document.createElement('div');
  pane4.className = 'incidents-rapid-pane';
  pane4.dataset.pane = '4';
  pane4.hidden = true;
  const q4 = document.createElement('p');
  q4.className = 'incidents-rapid-q';
  q4.textContent = 'Où cela s’est-il produit ?';

  const qCause = document.createElement('p');
  qCause.className = 'incidents-rapid-q incidents-rapid-q--compact';
  qCause.textContent = 'Cause dominante (optionnel)';
  const causeChipWrap = document.createElement('div');
  causeChipWrap.className = 'incidents-rapid-type-chips incidents-rapid-type-chips--compact';
  const causeCatSelect = document.createElement('select');
  causeCatSelect.className = 'control-select incidents-sr-only';
  causeCatSelect.setAttribute('aria-hidden', 'true');
  causeCatSelect.tabIndex = -1;
  const causeOptNone = document.createElement('option');
  causeOptNone.value = '';
  causeOptNone.textContent = '—';
  causeCatSelect.append(causeOptNone);
  const causeChipByVal = new Map();
  CAUSE_CATEGORY_CHIPS.forEach(([val, label]) => {
    const o = document.createElement('option');
    o.value = val;
    o.textContent = label;
    causeCatSelect.append(o);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'incidents-rapid-chip incidents-rapid-chip--compact';
    b.textContent = label;
    b.addEventListener('click', () => {
      causeCatSelect.value = val;
      causeChipByVal.forEach((btn, k) => {
        btn.classList.toggle('incidents-rapid-chip--on', k === val);
      });
    });
    causeChipByVal.set(val, b);
    causeChipWrap.append(b);
  });

  const respDecl = document.createElement('label');
  respDecl.className = 'incidents-rapid-resp-field';
  const respDeclSpan = document.createElement('span');
  respDeclSpan.textContent = 'Responsable suivi (optionnel)';
  const respDeclInput = document.createElement('input');
  respDeclInput.type = 'text';
  respDeclInput.className = 'control-input';
  respDeclInput.placeholder = 'Nom, matricule…';
  respDeclInput.maxLength = 200;
  respDecl.append(respDeclSpan, respDeclInput);

  const siteSelect = document.createElement('select');
  siteSelect.className = 'control-select incident-field-site';
  const locInput = document.createElement('input');
  locInput.type = 'text';
  locInput.className = 'control-input incidents-rapid-loc';
  locInput.placeholder = 'Zone, atelier, ligne, poste…';
  const dateFactsInput = document.createElement('input');
  dateFactsInput.type = 'date';
  dateFactsInput.className = 'control-input incidents-field-date incident-field-date';
  try {
    dateFactsInput.valueAsDate = new Date();
  } catch {
    /* ignore */
  }
  const geoRow = document.createElement('div');
  geoRow.className = 'incidents-rapid-geo-row';
  const geoBtn = document.createElement('button');
  geoBtn.type = 'button';
  geoBtn.className = 'btn btn-secondary';
  geoBtn.textContent = 'Remplir par GPS';
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Géolocalisation non disponible', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        locInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        showToast('Coordonnées insérées', 'info');
      },
      () => showToast('Position refusée ou indisponible', 'warning'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
  geoRow.append(geoBtn);
  const dateFactsWrap = document.createElement('label');
  dateFactsWrap.className = 'incidents-rapid-date-field';
  const dateSpan = document.createElement('span');
  dateSpan.textContent = 'Date des faits';
  dateFactsWrap.append(dateSpan, dateFactsInput);

  const riskLinkField = document.createElement('label');
  riskLinkField.className = 'incidents-rapid-risk-field';
  const riskLinkFieldLabel = document.createElement('span');
  riskLinkFieldLabel.className = 'incidents-rapid-risk-field__label';
  riskLinkFieldLabel.textContent = 'Associer à un risque du registre (optionnel)';
  const riskSelect = document.createElement('select');
  riskSelect.className = 'control-select incidents-risk-link-select';
  riskSelect.setAttribute('aria-label', 'Risque QHSE lié');
  const riskOptNone = document.createElement('option');
  riskOptNone.value = '';
  riskOptNone.textContent = '— Aucun —';
  riskSelect.append(riskOptNone);

  function fillIncidentRiskSelect() {
    riskSelect.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
    getRiskTitlesForSelect().forEach((title) => {
      const o = document.createElement('option');
      o.value = title;
      o.textContent = title.length > 64 ? `${title.slice(0, 61)}…` : title;
      riskSelect.append(o);
    });
  }
  fillIncidentRiskSelect();

  const riskLinkHint = document.createElement('p');
  riskLinkHint.className = 'incidents-rapid-risk-field__hint';
  riskLinkHint.textContent =
    'Enregistré dans la description sous forme de repère texte — même logique que le module Risques pour retrouver les incidents liés.';
  riskLinkField.append(riskLinkFieldLabel, riskSelect, riskLinkHint);
  pane4.append(
    q4,
    qCause,
    causeChipWrap,
    causeCatSelect,
    respDecl,
    siteSelect,
    locInput,
    dateFactsWrap,
    riskLinkField,
    geoRow
  );

  const nav = document.createElement('div');
  nav.className = 'incidents-rapid-nav';
  const btnPrev = document.createElement('button');
  btnPrev.type = 'button';
  btnPrev.className = 'btn btn-secondary';
  btnPrev.textContent = 'Retour';
  const btnNext = document.createElement('button');
  btnNext.type = 'button';
  btnNext.className = 'btn btn-primary';
  btnNext.textContent = 'Continuer';
  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'btn btn-primary incidents-submit incident-submit';
  submitBtn.textContent = 'Enregistrer l’incident';
  nav.append(btnPrev, btnNext, submitBtn);

  wizRoot.append(pane0, pane1, pane2, pane3, pane4, nav);
  quick.append(head, wizRoot);

  const panes = [pane0, pane1, pane2, pane3, pane4];
  let wizardStep = 0;

  function setWizardStep(idx) {
    wizardStep = Math.max(0, Math.min(4, idx));
    panes.forEach((p, i) => {
      p.hidden = i !== wizardStep;
    });
    dots.querySelectorAll('.incidents-rapid-dot').forEach((d, i) => {
      d.classList.toggle('incidents-rapid-dot--on', i === wizardStep);
      d.classList.toggle('incidents-rapid-dot--done', i < wizardStep);
    });
    stepLabel.textContent = `Étape ${wizardStep + 1} / 5 — ${paneTitles[wizardStep]}`;
    btnPrev.hidden = wizardStep === 0;
    btnNext.hidden = wizardStep === 4;
    submitBtn.hidden = wizardStep !== 4;
    syncNav();
  }

  function syncNav() {
    if (wizardStep === 0) {
      btnNext.disabled = !typeSelect.value.trim();
    } else if (wizardStep === 4) {
      btnNext.disabled = false;
      submitBtn.disabled = !siteSelect.value.trim();
    } else {
      btnNext.disabled = false;
    }
  }

  typeSelect.addEventListener('change', syncNav);
  siteSelect.addEventListener('change', syncNav);

  btnPrev.addEventListener('click', () => setWizardStep(wizardStep - 1));
  btnNext.addEventListener('click', () => setWizardStep(wizardStep + 1));

  const severity = createSeveritySegment('moyen');
  severityMount.append(severity.element);

  setWizardStep(0);

  async function fillIncidentSiteSelect() {
    siteSelect.innerHTML = '';
    const namesSeen = new Set();
    try {
      const catalog = await fetchSitesCatalog();
      catalog.forEach((s) => {
        if (!s?.name) return;
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.code ? `${s.name} (${s.code})` : s.name;
        opt.dataset.siteId = s.id;
        siteSelect.append(opt);
        namesSeen.add(s.name);
      });
    } catch {
      /* fallback */
    }
    siteOptions.forEach((s) => {
      if (namesSeen.has(s)) return;
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      siteSelect.append(opt);
    });

    if (appState.activeSiteId) {
      const hit = [...siteSelect.options].find(
        (o) => o.dataset.siteId === appState.activeSiteId
      );
      if (hit) {
        siteSelect.value = hit.value;
        return;
      }
    }
    const activeSite = appState.currentSite;
    if (activeSite && siteOptions.includes(activeSite)) {
      siteSelect.value = activeSite;
    } else if ([...siteSelect.options].some((o) => o.value === activeSite)) {
      siteSelect.value = activeSite;
    } else if (siteSelect.options.length) {
      siteSelect.selectedIndex = 0;
    }
  }

  function applyIncidentImportDraftIfAny() {
    const draft = readImportDraft();
    if (!draft || draft.targetPageId !== 'incidents' || !draft.prefillData) {
      return;
    }
    const p = draft.prefillData;
    if (p.type && INCIDENT_TYPES.includes(p.type)) {
      typeSelect.value = p.type;
      chipByType.forEach((btn, key) => {
        btn.classList.toggle('incidents-rapid-chip--on', key === p.type);
      });
    }
    if (p.site && typeof p.site === 'string') {
      const siteStr = p.site.trim();
      const matchValue = [...siteSelect.options].some((o) => o.value === siteStr);
      if (matchValue) {
        siteSelect.value = siteStr;
      } else if (siteOptions.includes(p.site)) {
        siteSelect.value = p.site;
      }
    }
    const sevRaw = p.severity || p.gravite;
    if (sevRaw) {
      severity.setValue(normalizeSeverity(String(sevRaw)));
    }
    let desc = p.description ? String(p.description) : '';
    if (
      p.site &&
      typeof p.site === 'string' &&
      !siteOptions.includes(p.site) &&
      ![...siteSelect.options].some((o) => o.value === p.site.trim()) &&
      desc.length < 1900
    ) {
      const hint = `[Site détecté (non listé) : ${p.site.slice(0, 48)}] `;
      desc = hint + desc;
    }
    if (desc) {
      descInput.value = desc.slice(0, 2000);
    }
    clearImportDraft();
    showToast('Brouillon import appliqué — vérifiez puis enregistrez.', 'info');
  }

  (async function initIncidentSiteAndDraft() {
    await fillIncidentSiteSelect();
    fillIncidentRiskSelect();
    applyIncidentImportDraftIfAny();
  })();

  const canDeclare = canResource(getSessionUser()?.role, 'incidents', 'write');
  if (!canDeclare && getSessionUser()) {
    wizRoot.style.opacity = '0.58';
    submitBtn.disabled = true;
    btnNext.disabled = true;
    btnPrev.disabled = true;
    submitBtn.title = 'Déclaration réservée — votre rôle est en lecture sur les incidents';
  }

  ensureIncidentsSlideOverStyles();
  document.getElementById('qhse-inc-declare-dialog')?.remove();

  function createDeclareDialog() {
    const dlg = document.createElement('dialog');
    dlg.id = 'qhse-inc-declare-dialog';
    dlg.className = 'inc-slideover qhse-inc-declare-dialog';
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-label', 'Déclarer un incident');

    const header = document.createElement('div');
    header.className = 'inc-slideover__head';
    header.innerHTML = `
    <span class="inc-slideover__title">
      Déclarer un incident
    </span>
    <button type="button"
      class="inc-slideover__close"
      aria-label="Fermer">
      <svg width="18" height="18"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;

    const body = document.createElement('div');
    body.className = 'inc-slideover__body';

    dlg.append(header, body);

    function open(formElement) {
      body.replaceChildren(formElement);
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
      dlg.querySelector('input, select, textarea')?.focus();
    }

    function close() {
      body.replaceChildren();
      if (typeof dlg.close === 'function') {
        dlg.close();
      } else {
        dlg.removeAttribute('open');
      }
    }

    header.querySelector('.inc-slideover__close').addEventListener('click', close);

    document.body.append(dlg);
    return { open, close, dialog: dlg };
  }

  const slideOver = createDeclareDialog();

  btnDeclare.addEventListener('click', () => slideOver.open(quick));
  btnTerrain.addEventListener('click', () => slideOver.open(quick));

  submitBtn.addEventListener('click', async () => {
    const type = typeSelect.value.trim();
    const site = siteSelect.value.trim();

    if (!type || !site) {
      showToast('Type et site obligatoires', 'error');
      return;
    }

    const descRaw = (descInput.value || '').trim();
    if (!descRaw) {
      showToast('La description est obligatoire (terrain).', 'error');
      return;
    }

    let photosJsonPayload = null;
    if (photoInput.files?.[0]) {
      const f = photoInput.files[0];
      if (f.size > 450 * 1024) {
        showToast('Photo trop lourde — max. ~420–450 Ko.', 'error');
        return;
      }
      try {
        const url = await fileToDataUrl(f);
        photosJsonPayload = JSON.stringify([url]);
      } catch {
        showToast('Lecture photo impossible', 'error');
        return;
      }
    }

    const sev = severity.getValue();
    const dateNote =
      dateFactsInput.value && typeof dateFactsInput.value === 'string'
        ? `Faits le ${formatIsoDateToFr(dateFactsInput.value)}. `
        : '';
    const locPart = locInput.value.trim()
      ? `[Lieu précis] ${locInput.value.trim()}\n`
      : '';
    const riskTitlePick = riskSelect.value.trim();
    const riskPart = riskTitlePick ? `\n\n${formatRiskLinkTag(riskTitlePick)}` : '';
    const detailText = (dateNote + locPart + descRaw + riskPart).trim();
    const detailForLog = detailText || 'Sans description';

    const ref = computeNextRef(getIncidentRecords());

    submitBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref,
          type,
          site,
          severity: sev,
          description: detailText || undefined,
          status: 'Nouveau',
          location: locInput.value.trim() || null,
          causeCategory: causeCatSelect.value.trim() || null,
          responsible: respDeclInput.value.trim() || getSessionUser()?.name || null,
          photosJson: photosJsonPayload,
          ...(siteSelect.selectedOptions[0]?.dataset.siteId
            ? { siteId: siteSelect.selectedOptions[0].dataset.siteId }
            : {})
        })
      });

      if (!res.ok) {
        try {
          const body = await res.json();
          console.error('[incidents] POST /api/incidents', res.status, body);
        } catch {
          console.error('[incidents] POST /api/incidents', res.status);
        }
        showToast('Erreur serveur', 'error');
        return;
      }

      const created = await res.json();
      const entry = mapApiIncident(created);
      if (!entry) {
        console.error('[incidents] réponse POST invalide', created);
        showToast('Erreur serveur', 'error');
        return;
      }
      declareCb(entry);
      slideOver.close();

      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'incidents',
          action: 'Incident déclaré',
          detail: `${ref} · ${type} · ${site} · ${sev} — ${detailForLog.slice(0, 80)}${detailForLog.length > 80 ? '…' : ''}`,
          user: 'Agent terrain'
        });
      }
      refreshIncidentJournal();

      showToast(`Incident enregistré : ${ref}`, 'info');
      descInput.value = '';
      locInput.value = '';
      photoInput.value = '';
      photoPreview.replaceChildren();
      severity.setValue('moyen');
      typeSelect.value = '';
      chipByType.forEach((btn) => btn.classList.remove('incidents-rapid-chip--on'));
      try {
        dateFactsInput.valueAsDate = new Date();
      } catch {
        dateFactsInput.value = '';
      }
      await fillIncidentSiteSelect();
      fillIncidentRiskSelect();
      riskSelect.value = '';
      causeCatSelect.value = '';
      causeChipByVal.forEach((btn) => btn.classList.remove('incidents-rapid-chip--on'));
      respDeclInput.value = '';
      setWizardStep(0);

      setTimeout(() => {
        document.getElementById('incidents-recent-list')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 0);
    } catch (err) {
      console.error('[incidents] POST /api/incidents', err);
      showToast('Erreur serveur', 'error');
    } finally {
      submitBtn.disabled = !canDeclare;
      if (canDeclare) syncNav();
    }
  });


  return { openDeclare: () => slideOver.open(quick), quick, slideOver };
}

/**
 * Formulaire de création d’incident (assistant 5 étapes) dans un `<dialog>` natif.
 * `onSave` / `onDeclared` est appelé après POST réussi avec l’entrée mappée API (même logique qu’avant).
 *
 * @param {object|null} incident - Si non null : message d’info (édition via le panneau détail).
 * @param {object} [ctx] - Même contexte que {@link setupIncidentDeclareFlow} ; `onSave` est un alias de `onDeclared`.
 * @returns {ReturnType<setupIncidentDeclareFlow>|null}
 */
export function openIncidentDialog(incident = null, ctx = {}) {
  if (incident != null) {
    showToast('Modification d’incident : utilisez la fiche détail du registre.', 'info');
    return null;
  }
  return setupIncidentDeclareFlow(ctx);
}
