import { ensurePtwStyles } from '../components/ptwStyles.js';
import { showToast } from '../components/toast.js';
import { getSessionUser } from '../data/sessionUser.js';
import {
  createPermit,
  flushSyncQueue,
  getSyncState,
  listPermits,
  patchPermit,
  refreshPermitsFromApi,
  signPermit,
  updatePermitStatus
} from '../services/ptw.service.js';
import { getLinksFor, linkModules } from '../services/moduleLinks.service.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

const PTW_TYPES = [
  'travail en hauteur',
  'espace confiné',
  'travaux à chaud',
  'électrique',
  'explosifs'
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'en attente' },
  { value: 'validated', label: 'validé' },
  { value: 'in_progress', label: 'en cours' },
  { value: 'closed', label: 'clôturé' }
];

const SIGN_ROLES = [
  { value: 'supervisor', label: 'Superviseur' },
  { value: 'qhse', label: 'QHSE' },
  { value: 'responsable', label: 'Responsable' }
];

const TYPE_CHECKLIST = {
  'travail en hauteur': [
    'Ancrage vérifié',
    'Ligne de vie installée',
    'Zone balisée au sol'
  ],
  'espace confiné': [
    'Mesure atmosphère OK',
    'Ventilation en place',
    'Surveillant extérieur présent'
  ],
  'travaux à chaud': ['Permis feu validé', 'Extincteur à proximité', 'Zone dégagée'],
  électrique: ['Consignation réalisée', 'Absence de tension vérifiée', 'EPI électrique porté'],
  explosifs: ['Zone sécurisée', 'Autorisation spéciale confirmée', 'Brief sécurité fait']
};

const TYPE_RISK_HINTS = {
  'travail en hauteur': 'Risque chute, rupture ancrage, chute objet.',
  'espace confiné': 'Risque asphyxie, gaz toxique, évacuation difficile.',
  'travaux à chaud': 'Risque incendie, projection, atmosphère inflammable.',
  électrique: 'Risque électrisation, arc électrique, consignation incomplète.',
  explosifs: 'Risque détonation, périmètre insuffisant, erreur de manipulation.'
};

function setupSignatureCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { clear: () => {}, dataUrl: () => '' };
  let drawing = false;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#14b8a6';

  const pos = (ev) => {
    const r = canvas.getBoundingClientRect();
    const p = ev.touches?.[0] || ev;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  const start = (ev) => {
    drawing = true;
    const p = pos(ev);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (ev) => {
    if (!drawing) return;
    const p = pos(ev);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const end = () => {
    drawing = false;
  };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: true });
  canvas.addEventListener('touchend', end);

  return {
    clear: () => ctx.clearRect(0, 0, canvas.width, canvas.height),
    dataUrl: () => canvas.toDataURL('image/png')
  };
}

function statusLabel(v) {
  if (v === 'open') return 'en attente';
  const hit = STATUS_OPTIONS.find((s) => s.value === v);
  return hit ? hit.label : v;
}

/** Libellé français pour rôle de signature (évite d’afficher la clé API en anglais). */
function signatureRoleLabel(role) {
  const hit = SIGN_ROLES.find((r) => r.value === role);
  return hit ? hit.label : String(role || '—');
}

const MODULE_LABEL_FR = {
  incidents: 'Incidents',
  risks: 'Risques',
  actions: 'Plan d’actions',
  permits: 'Permis de travail',
  audits: 'Audits',
  iso: 'ISO & conformité',
  products: 'Produits / FDS',
  habilitations: 'Habilitations',
  sites: 'Sites',
  imports: 'Imports'
};

function moduleLabelFr(id) {
  const k = String(id || '').trim();
  return MODULE_LABEL_FR[k] || k || '—';
}

function isExpiredPermit(permit) {
  if (!permit?.date) return false;
  if (permit.status === 'closed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const permitDate = new Date(String(permit.date));
  permitDate.setHours(0, 0, 0, 0);
  return permitDate < today;
}

function expiryLabel(permit) {
  if (!permit?.date) return 'Échéance non définie';
  if (permit.status === 'closed') return 'Clôturé';
  const now = new Date();
  const end = new Date(String(permit.date));
  end.setHours(23, 59, 59, 999);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs < 0) return 'Expiré';
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return "Expire aujourd'hui";
  if (days === 1) return 'Expire dans 1 jour';
  return `Expire dans ${days} jours`;
}

function statusVisualTone(permit) {
  if (isExpiredPermit(permit)) return 'ptw-status--expired';
  const status = permit?.status === 'open' ? 'pending' : permit?.status;
  if (status === 'pending') return 'ptw-status--pending';
  if (status === 'validated' || status === 'in_progress') return 'ptw-status--active';
  return 'ptw-status--closed';
}

function createStatusSelect(value, onChange) {
  const sel = document.createElement('select');
  sel.className = 'control-select';
  STATUS_OPTIONS.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.value;
    o.textContent = s.label;
    if ((value === 'open' ? 'pending' : value) === s.value) o.selected = true;
    sel.append(o);
  });
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

export function renderPermits() {
  ensurePtwStyles();
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas ptw-page';
  page.innerHTML = `
    <section class="page-intro module-page-hero">
      <div class="module-page-hero__inner">
        <p class="page-intro__kicker section-kicker">Opérations</p>
        <h1 class="page-intro__title">Permis de travail</h1>
        <p class="page-intro__desc">Création guidée en moins de 30 secondes, validations et suivi terrain.</p>
      </div>
    </section>
  `;

  const toolbar = document.createElement('div');
  toolbar.className = 'ptw-toolbar';
  toolbar.innerHTML = `
    <button type="button" class="btn btn-primary ptw-create-btn">Créer un permis terrain</button>
    <button type="button" class="btn btn-secondary ptw-create-quick-btn">Permis ultra-rapide (30 s)</button>
    <span class="ptw-net-badge ptw-net-badge--online" data-net-state>Mode en ligne</span>
    <span class="ptw-net-badge ptw-net-badge--sync" data-sync-state>Synchronisation: 0 en attente</span>
  `;
  page.append(toolbar);

  const kpiCard = document.createElement('article');
  kpiCard.className = 'content-card card-soft ptw-card';
  kpiCard.innerHTML = `
    <div class="ptw-kpis">
      <div class="ptw-kpi"><span class="ptw-kpi__label">Permis actifs</span><strong class="ptw-kpi__value" data-kpi-active>0</strong></div>
      <div class="ptw-kpi"><span class="ptw-kpi__label">Permis en attente</span><strong class="ptw-kpi__value" data-kpi-pending>0</strong></div>
      <div class="ptw-kpi"><span class="ptw-kpi__label">Permis expirés</span><strong class="ptw-kpi__value ptw-kpi__value--danger" data-kpi-expired>0</strong></div>
    </div>
  `;
  page.append(kpiCard);

  const aiCard = document.createElement('article');
  aiCard.className = 'content-card card-soft ptw-card';
  aiCard.innerHTML = `
    <div class="ptw-ai-strip">
      <strong>Suggestion IA sécurité</strong>
      <p class="ptw-mini">Vérifier EPI complet + autorisation signée avant démarrage. Priorité renforcée si échéance aujourd'hui.</p>
    </div>
  `;
  page.append(aiCard);

  const wizardCard = document.createElement('article');
  wizardCard.className = 'content-card card-soft ptw-card ptw-wizard';
  wizardCard.hidden = true;
  page.append(wizardCard);
  const quickCard = document.createElement('article');
  quickCard.className = 'content-card card-soft ptw-card ptw-wizard';
  quickCard.hidden = true;
  page.append(quickCard);

  const cols = document.createElement('div');
  cols.className = 'ptw-columns';
  cols.id = 'permits-lists-anchor';
  const inProgressCard = document.createElement('article');
  inProgressCard.className = 'content-card card-soft ptw-card';
  const closedCard = document.createElement('article');
  closedCard.className = 'content-card card-soft ptw-card';
  inProgressCard.innerHTML = `<div class="ptw-list-title"><h3>Permis en cours</h3><span class="ptw-mini" data-open-count>0</span></div><div class="ptw-items" data-open-items></div>`;
  closedCard.innerHTML = `<div class="ptw-list-title"><h3>Permis clôturés</h3><span class="ptw-mini" data-closed-count>0</span></div><div class="ptw-items" data-closed-items></div>`;
  cols.append(inProgressCard, closedCard);
  page.append(cols);

  const state = {
    step: 1,
    draft: {
      type: '',
      zone: '',
      description: '',
      team: '',
      date: new Date().toISOString().slice(0, 10),
      checklist: [],
      epi: [],
      safetyConditions: [],
      validationMode: 'double',
      riskAnalysis: '',
      mandatory: { epi: false, zoneSecure: false, authorization: false },
      signatures: {
        supervisor: { name: '', signatureDataUrl: '' },
        qhse: { name: '', signatureDataUrl: '' },
        responsable: { name: '', signatureDataUrl: '' }
      }
    }
  };
  let lastExpiredToast = -1;

  function stepTemplate() {
    const d = state.draft;
    if (state.step === 1) {
      return `
        <div class="ptw-wizard-step">
          <div class="ptw-step-head"><h3>Étape 1 · Type</h3><span class="ptw-step-badge">1/7</span></div>
          <div class="ptw-type-grid">${PTW_TYPES.map((t) => `<button type="button" class="ptw-type-btn ${d.type === t ? 'is-selected' : ''}" data-type="${t}">${t}</button>`).join('')}</div>
        </div>`;
    }
    if (state.step === 2) {
      return `
        <div class="ptw-wizard-step">
          <div class="ptw-step-head"><h3>Étape 2 · Infos rapides</h3><span class="ptw-step-badge">2/7</span></div>
          <div class="ptw-fields">
            <label class="field"><span>Zone</span><input class="control-input" data-f="zone" value="${d.zone || ''}" /></label>
            <label class="field"><span>Équipe</span><input class="control-input" data-f="team" value="${d.team || ''}" /></label>
            <label class="field"><span>Date</span><input class="control-input" type="date" data-f="date" value="${d.date || ''}" /></label>
            <label class="field"><span>Description</span><textarea class="control-input" rows="2" data-f="description">${d.description || ''}</textarea></label>
          </div>
        </div>`;
    }
    if (state.step === 3) {
      return `
        <div class="ptw-wizard-step">
          <div class="ptw-step-head"><h3>Étape 3 · Analyse auto des risques</h3><span class="ptw-step-badge">3/7</span></div>
          <div class="ptw-mini"><strong>Analyse:</strong> ${TYPE_RISK_HINTS[d.type] || 'Risque à préciser selon activité.'}</div>
          <label class="field"><span>Complément terrain</span><textarea class="control-input" rows="3" data-f="riskAnalysis">${d.riskAnalysis || ''}</textarea></label>
        </div>`;
    }
    if (state.step === 4) {
      const checks = d.checklist.length ? d.checklist : TYPE_CHECKLIST[d.type] || [];
      return `
        <div class="ptw-wizard-step">
          <div class="ptw-step-head"><h3>Étape 4 · Checklist sécurité (bloquante)</h3><span class="ptw-step-badge">4/7</span></div>
          <div class="ptw-checklist">
            ${checks.map((c, i) => `<label class="ptw-check"><input type="checkbox" data-chk="${i}" ${d.checklist[i]?.checked ? 'checked' : ''} /><span>${c}</span></label>`).join('')}
          </div>
          <div class="ptw-checklist">
            <label class="ptw-check"><input type="checkbox" data-mand="epi" ${d.mandatory.epi ? 'checked' : ''}/><span>EPI vérifié</span></label>
            <label class="ptw-check"><input type="checkbox" data-mand="zoneSecure" ${d.mandatory.zoneSecure ? 'checked' : ''}/><span>Zone sécurisée</span></label>
            <label class="ptw-check"><input type="checkbox" data-mand="authorization" ${d.mandatory.authorization ? 'checked' : ''}/><span>Autorisation validée</span></label>
          </div>
          <div class="ptw-fields">
            <label class="field"><span>EPI (séparés par virgule)</span><input class="control-input" data-f="epi" value="${(d.epi || []).join(', ')}" /></label>
            <label class="field"><span>Conditions sécurité (séparées par virgule)</span><input class="control-input" data-f="cond" value="${(d.safetyConditions || []).join(', ')}" /></label>
          </div>
        </div>`;
    }
    if (state.step === 5) {
      return `
        <div class="ptw-wizard-step">
          <div class="ptw-step-head"><h3>Étape 5 · Validation</h3><span class="ptw-step-badge">5/7</span></div>
          <label class="field"><span>Mode de validation</span>
            <select class="control-select" data-f="validationMode">
              <option value="simple" ${d.validationMode === 'simple' ? 'selected' : ''}>Simple (responsable)</option>
              <option value="double" ${d.validationMode !== 'simple' ? 'selected' : ''}>Double (superviseur + QHSE)</option>
            </select>
          </label>
        </div>`;
    }
    if (state.step === 6) {
      return `
        <div class="ptw-wizard-step">
          <div class="ptw-step-head"><h3>Étape 6 · Signature électronique</h3><span class="ptw-step-badge">6/7</span></div>
          <div class="ptw-mini"><strong>Mode:</strong> ${d.validationMode === 'simple' ? 'Simple' : 'Double'}</div>
          <div class="ptw-mini"><strong>Analyse risque:</strong> ${d.riskAnalysis || '—'}</div>
        </div>`;
    }
    return `
      <div class="ptw-wizard-step">
        <div class="ptw-step-head"><h3>Étape 7 · Résumé + validation</h3><span class="ptw-step-badge">7/7</span></div>
          <div class="ptw-mini"><strong>Type:</strong> ${d.type || '—'}</div>
          <div class="ptw-mini"><strong>Zone:</strong> ${d.zone || '—'} · <strong>Équipe:</strong> ${d.team || '—'} · <strong>Date:</strong> ${d.date || '—'}</div>
          <div class="ptw-mini"><strong>Description:</strong> ${d.description || '—'}</div>
          <div class="ptw-mini"><strong>Checklist:</strong> ${d.checklist.map((x) => x.label).join(', ') || '—'}</div>
          <div class="ptw-mini"><strong>Analyse risque:</strong> ${d.riskAnalysis || '—'}</div>
        </div>`;
  }
  function signatureStepTemplate() {
    const d = state.draft;
    return `
      <div class="ptw-wizard-step">
        <div class="ptw-step-head"><h3>Signature électronique</h3></div>
        <div class="ptw-columns">
          <div class="ptw-sign">
            <strong>Signer</strong>
            <label class="field"><span>Rôle</span><select class="control-select" data-sign-role>${SIGN_ROLES.map((r) => `<option value="${r.value}">${r.label}</option>`).join('')}</select></label>
            <input class="control-input" placeholder="Nom du signataire" data-sign-name />
            <canvas class="ptw-sign-canvas" width="500" height="120" data-sign-canvas></canvas>
            <div class="ptw-seg"><button class="btn btn-secondary" type="button" data-sign-clear>Effacer</button><button class="btn btn-primary" type="button" data-sign-save>Signer</button></div>
            <div class="ptw-mini" data-sign-log>Non signé</div>
          </div>
          <div class="ptw-sign">
            <strong>Signatures capturées</strong>
            <div class="ptw-list">${Object.entries(d.signatures).map(([role, s]) => `<div class="ptw-mini"><strong>${role}</strong>: ${s?.name || '—'}</div>`).join('')}</div>
          </div>
        </div>
      </div>`;
  }

  function readStepFields() {
    if (state.step === 2) {
      state.draft.zone = wizardCard.querySelector('[data-f="zone"]').value.trim();
      state.draft.team = wizardCard.querySelector('[data-f="team"]').value.trim();
      state.draft.date = wizardCard.querySelector('[data-f="date"]').value;
      state.draft.description = wizardCard.querySelector('[data-f="description"]').value.trim();
    }
    if (state.step === 3) {
      state.draft.riskAnalysis = wizardCard.querySelector('[data-f="riskAnalysis"]').value.trim();
    }
    if (state.step === 4) {
      const labels = TYPE_CHECKLIST[state.draft.type] || [];
      state.draft.checklist = labels.map((label, i) => ({
        label,
        checked: Boolean(wizardCard.querySelector(`[data-chk="${i}"]`)?.checked)
      }));
      state.draft.epi = wizardCard
        .querySelector('[data-f="epi"]')
        .value.split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      state.draft.safetyConditions = wizardCard
        .querySelector('[data-f="cond"]')
        .value.split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      state.draft.mandatory = {
        epi: Boolean(wizardCard.querySelector('[data-mand="epi"]')?.checked),
        zoneSecure: Boolean(wizardCard.querySelector('[data-mand="zoneSecure"]')?.checked),
        authorization: Boolean(wizardCard.querySelector('[data-mand="authorization"]')?.checked)
      };
    }
    if (state.step === 5) {
      state.draft.validationMode = wizardCard.querySelector('[data-f="validationMode"]').value;
    }
  }

  function renderWizard() {
    const body = state.step === 6 ? signatureStepTemplate() : stepTemplate();
    wizardCard.innerHTML = `${body}<div class="ptw-wizard-foot"><button type="button" class="btn btn-secondary" data-prev ${state.step === 1 ? 'disabled' : ''}>Précédent</button><button type="button" class="btn btn-primary" data-next>${state.step === 7 ? 'Créer le permis' : 'Suivant'}</button><button type="button" class="btn btn-secondary" data-cancel>Annuler</button></div>`;
    wizardCard.querySelectorAll('[data-type]').forEach((b) =>
      b.addEventListener('click', () => {
        state.draft.type = b.getAttribute('data-type') || '';
        renderWizard();
      })
    );
    wizardCard.querySelector('[data-cancel]').addEventListener('click', () => {
      wizardCard.hidden = true;
    });
    wizardCard.querySelector('[data-prev]').addEventListener('click', () => {
      readStepFields();
      state.step = Math.max(1, state.step - 1);
      renderWizard();
    });
    wizardCard.querySelector('[data-next]').addEventListener('click', () => {
      void (async () => {
        readStepFields();
        if (state.step === 1 && !state.draft.type) return showToast('Choisir un type.', 'error');
        if (
          state.step === 2 &&
          (!state.draft.zone || !state.draft.description || !state.draft.team || !state.draft.date)
        ) {
          return showToast('Compléter les infos rapides.', 'error');
        }
        if (state.step === 4) {
          const m = state.draft.mandatory;
          if (!m.epi || !m.zoneSecure || !m.authorization) {
            return showToast('Checklist sécurité obligatoire à compléter.', 'error');
          }
        }
        if (state.step < 7) {
          state.step += 1;
          renderWizard();
          return;
        }
        const permit = await createPermit({
          type: state.draft.type,
          description: state.draft.description,
          zone: state.draft.zone,
          date: state.draft.date,
          team: state.draft.team,
          checklist: state.draft.checklist.map((x) => (x.checked ? `${x.label} (OK)` : `${x.label} (NOK)`)),
          epi: state.draft.epi,
          safetyConditions: state.draft.safetyConditions,
          riskAnalysis: state.draft.riskAnalysis,
          validationMode: state.draft.validationMode,
          status: 'pending'
        });
        for (const [role, sig] of Object.entries(state.draft.signatures)) {
          if (!sig?.name) continue;
          await signPermit(permit.id, role, {
            name: sig.name,
            signatureDataUrl: sig.signatureDataUrl,
            userId: getSessionUser()?.id || '',
            userLabel: getSessionUser()?.name || ''
          });
        }
        showToast('Permis créé.', 'success');
        wizardCard.hidden = true;
        await renderLists();
      })();
    });

    if (state.step === 6) {
      const canvas = wizardCard.querySelector('[data-sign-canvas]');
      const tools = setupSignatureCanvas(canvas);
      wizardCard.querySelector('[data-sign-clear]').addEventListener('click', () => tools.clear());
      wizardCard.querySelector('[data-sign-save]').addEventListener('click', () => {
        const role = wizardCard.querySelector('[data-sign-role]').value;
        const name = wizardCard.querySelector('[data-sign-name]').value.trim();
        if (!name) return showToast('Nom requis pour signer.', 'error');
        state.draft.signatures[role] = { name, signatureDataUrl: tools.dataUrl() };
        wizardCard.querySelector('[data-sign-log]').textContent =
          `Signé: ${name} (${role}) · ${new Date().toLocaleString('fr-FR')}`;
        showToast('Signature enregistrée.', 'success');
        renderWizard();
      });
    }
  }

  function renderQuickCreate() {
    quickCard.replaceChildren();
    const step = document.createElement('div');
    step.className = 'ptw-wizard-step';
    const head = document.createElement('div');
    head.className = 'ptw-step-head';
    const h3 = document.createElement('h3');
    h3.textContent = 'Permis ultra-rapide (30 s)';
    const badge = document.createElement('span');
    badge.className = 'ptw-step-badge';
    badge.textContent = 'saisie rapide';
    head.append(h3, badge);
    const fields = document.createElement('div');
    fields.className = 'ptw-fields';
    const labType = document.createElement('label');
    labType.className = 'field';
    const spType = document.createElement('span');
    spType.textContent = 'Type';
    const selType = document.createElement('select');
    selType.className = 'control-select';
    selType.dataset.q = 'type';
    for (const t of PTW_TYPES) {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t;
      selType.append(o);
    }
    labType.append(spType, selType);
    const labZone = document.createElement('label');
    labZone.className = 'field';
    const spZone = document.createElement('span');
    spZone.textContent = 'Zone';
    const inZone = document.createElement('input');
    inZone.className = 'control-input';
    inZone.dataset.q = 'zone';
    inZone.placeholder = 'Zone chantier';
    labZone.append(spZone, inZone);
    const labTeam = document.createElement('label');
    labTeam.className = 'field';
    const spTeam = document.createElement('span');
    spTeam.textContent = 'Responsable';
    const inTeam = document.createElement('input');
    inTeam.className = 'control-input';
    inTeam.dataset.q = 'team';
    inTeam.placeholder = 'Nom responsable';
    labTeam.append(spTeam, inTeam);
    fields.append(labType, labZone, labTeam);
    step.append(head, fields);
    const foot = document.createElement('div');
    foot.className = 'ptw-wizard-foot';
    const bCreate = document.createElement('button');
    bCreate.type = 'button';
    bCreate.className = 'btn btn-primary';
    bCreate.dataset.qCreate = '';
    bCreate.textContent = 'Créer immédiatement';
    const bCancel = document.createElement('button');
    bCancel.type = 'button';
    bCancel.className = 'btn btn-secondary';
    bCancel.dataset.qCancel = '';
    bCancel.textContent = 'Annuler';
    foot.append(bCreate, bCancel);
    quickCard.append(step, foot);
    quickCard.querySelector('[data-q-cancel]').addEventListener('click', () => {
      quickCard.hidden = true;
    });
    quickCard.querySelector('[data-q-create]').addEventListener('click', () => {
      void (async () => {
        const type = quickCard.querySelector('[data-q="type"]').value;
        const zone = quickCard.querySelector('[data-q="zone"]').value.trim();
        const team = quickCard.querySelector('[data-q="team"]').value.trim();
        if (!zone || !team) return showToast('Zone et responsable requis.', 'error');
        const baseChecks = TYPE_CHECKLIST[type] || [];
        await createPermit({
          type,
          zone,
          team,
          description: `Permis terrain rapide (${type})`,
          date: new Date().toISOString().slice(0, 10),
          checklist: baseChecks.map((x) => `${x} (OK)`),
          epi: ['Casque', 'Gants'],
          safetyConditions: ['Zone sécurisée'],
          riskAnalysis: TYPE_RISK_HINTS[type] || 'Risque standard terrain.',
          validationMode: 'simple',
          status: 'pending'
        });
        showToast('Permis créé en mode ultra-rapide.', 'success');
        quickCard.hidden = true;
        await renderLists();
      })();
    });
  }

  function permitCard(it) {
    const row = document.createElement('article');
    row.className = 'ptw-item';
    const sup = it.validations?.supervisor;
    const expired = isExpiredPermit(it);
    const responsible = sup?.signed ? sup.name : it.team || 'Non défini';
    const signatures = Array.isArray(it.signatures) ? it.signatures : [];
    const relations = getLinksFor('permits', it.id);

    const top = document.createElement('div');
    top.className = 'ptw-item-top';
    const topLeft = document.createElement('div');
    const typeStrong = document.createElement('strong');
    typeStrong.textContent = it.type ?? '—';
    const miniZR = document.createElement('div');
    miniZR.className = 'ptw-mini';
    const zLab = document.createElement('strong');
    zLab.textContent = 'Zone:';
    miniZR.append(zLab, document.createTextNode(` ${it.zone || '—'} · `));
    const rLab = document.createElement('strong');
    rLab.textContent = 'Responsable:';
    miniZR.append(rLab, document.createTextNode(` ${responsible}`));
    const miniDate = document.createElement('div');
    miniDate.className = 'ptw-mini';
    const dLab = document.createElement('strong');
    dLab.textContent = 'Date:';
    miniDate.append(dLab, document.createTextNode(` ${it.date || '—'}`));
    topLeft.append(typeStrong, miniZR, miniDate);
    const statusChip = document.createElement('span');
    statusChip.className = `ptw-chip ${statusVisualTone(it)}`;
    statusChip.textContent = expired ? 'expiré' : statusLabel(it.status);
    top.append(topLeft, statusChip);

    const apiLine = document.createElement('div');
    apiLine.className = 'ptw-mini ptw-api-sync-line';
    const apiLab = document.createElement('strong');
    apiLab.textContent = 'API:';
    const syncPill = document.createElement('span');
    syncPill.className = it.synced
      ? 'ptw-sync-pill ptw-sync-pill--synced'
      : 'ptw-sync-pill ptw-sync-pill--local';
    syncPill.textContent = it.synced ? 'Synchronisé' : 'Local';
    apiLine.append(apiLab, document.createTextNode(' '), syncPill);
    row.append(top, apiLine);
    if (expired) {
      const crit = document.createElement('div');
      crit.className = 'ptw-chip ptw-chip--critical';
      crit.textContent = 'Permis non clôturé';
      row.append(crit);
    }
    const descP = document.createElement('p');
    descP.className = 'ptw-mini';
    descP.textContent = it.description || '';
    const expLine = document.createElement('div');
    expLine.className = 'ptw-mini';
    const expLab = document.createElement('strong');
    expLab.textContent = 'Expiration:';
    expLine.append(expLab, document.createTextNode(` ${expiryLabel(it)}`));
    const checks = document.createElement('div');
    checks.className = 'ptw-inline-checks';
    function addInlineCheck(label, on) {
      const lab = document.createElement('label');
      lab.className = 'ptw-inline-check';
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.disabled = true;
      if (on) inp.checked = true;
      lab.append(inp, document.createTextNode(label));
      checks.append(lab);
    }
    addInlineCheck('EPI', Boolean(it.epi?.length));
    addInlineCheck('Zone sécurisée', Boolean(it.safetyConditions?.length));
    addInlineCheck('Autorisation', Boolean(it.signatures?.length));

    const details = document.createElement('details');
    const sum = document.createElement('summary');
    sum.className = 'ptw-mini';
    sum.textContent = 'Fiche permis';
    function detailLine(text) {
      const d = document.createElement('div');
      d.className = 'ptw-mini';
      d.textContent = text;
      return d;
    }
    details.append(
      sum,
      detailLine(`Checklist: ${(it.checklist || []).join(', ') || '—'}`),
      detailLine(`EPI: ${(it.epi || []).join(', ') || '—'}`),
      detailLine(`Conditions: ${(it.safetyConditions || []).join(', ') || '—'}`),
      detailLine(`Analyse risque: ${it.riskAnalysis || '—'}`),
      detailLine(`Validation: ${it.validationMode === 'simple' ? 'Simple' : 'Double'}`)
    );
    const sigText =
      signatures.length > 0
        ? signatures
            .map(
              (s) =>
                `${s.name || '—'} (${signatureRoleLabel(s.role)}) · ${new Date(s.signedAt).toLocaleString('fr-FR')} · ${
                  s.syncStatus === 'pending_sync' ? 'en attente de synchronisation' : 'synchronisé'
                }`
            )
            .join(' | ')
        : 'Aucune signature';
    details.append(detailLine(`Signé par: ${sigText}`));
    details.append(
      detailLine(
        `Statut sync: ${it.syncState === 'pending_sync' ? 'en attente de synchronisation' : 'synchronisé'}`
      )
    );
    const relText =
      relations.length > 0
        ? relations
            .map((r) => {
              const other = r.fromModule === 'permits' ? r.toModule : r.fromModule;
              return `${moduleLabelFr(other)} (${r.kind || 'lien'})`;
            })
            .join(', ')
        : 'aucune relation';
    details.append(detailLine(`Vue 360°: ${relText}`));
    row.append(descP, expLine, checks, details);
    const actions = document.createElement('div');
    actions.className = 'ptw-item-actions';
    const status = createStatusSelect(it.status, (v) => {
      void (async () => {
        await updatePermitStatus(it.id, v);
        await renderLists();
      })();
    });
    actions.append(status);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Clôturer';
    closeBtn.addEventListener('click', () => {
      void (async () => {
        const closer = window.prompt('Validation clôture terrain (nom) ?', '');
        if (!closer) return;
        await patchPermit(it.id, { closedBy: closer, closedAt: new Date().toISOString() });
        await updatePermitStatus(it.id, 'closed');
        await renderLists();
      })();
    });
    actions.append(closeBtn);
    const toAction = document.createElement('button');
    toAction.type = 'button';
    toAction.className = 'btn btn-secondary';
    toAction.textContent = 'Créer action';
    toAction.addEventListener('click', () => {
      linkModules({
        fromModule: 'permits',
        fromId: it.id,
        toModule: 'actions',
        toId: `action_from_${it.id}`,
        kind: 'ptw_to_action'
      });
      qhseNavigate('actions');
    });
    const toIncident = document.createElement('button');
    toIncident.type = 'button';
    toIncident.className = 'btn btn-secondary';
    toIncident.textContent = 'Créer incident';
    toIncident.addEventListener('click', () => {
      linkModules({
        fromModule: 'permits',
        fromId: it.id,
        toModule: 'incidents',
        toId: `incident_from_${it.id}`,
        kind: 'ptw_to_incident'
      });
      qhseNavigate('incidents');
    });
    const toRisk = document.createElement('button');
    toRisk.type = 'button';
    toRisk.className = 'btn btn-secondary';
    toRisk.textContent = 'Créer risque';
    toRisk.addEventListener('click', () => {
      linkModules({
        fromModule: 'permits',
        fromId: it.id,
        toModule: 'risks',
        toId: `risk_from_${it.id}`,
        kind: 'ptw_to_risk'
      });
      qhseNavigate('risks');
    });
    const signAny = document.createElement('button');
    signAny.type = 'button';
    signAny.className = 'btn btn-secondary';
    signAny.textContent = 'Signer le permis';
    const activateBtn = document.createElement('button');
    activateBtn.type = 'button';
    activateBtn.className = 'btn btn-secondary';
    activateBtn.textContent = 'Activer le permis';
    activateBtn.addEventListener('click', () => {
      void (async () => {
        await patchPermit(it.id, { activatedAt: new Date().toISOString() });
        await updatePermitStatus(it.id, 'in_progress');
        showToast('Permis activé.', 'success');
        await renderLists();
      })();
    });
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.className = 'btn btn-secondary';
    pdfBtn.textContent = 'Export PDF';
    pdfBtn.addEventListener('click', async () => {
      try {
        const { assembleQhsePdfDocument, downloadQhseChromePdf } = await import('../utils/qhsePdfChrome.js');
        const sigText = signatures.length
          ? signatures.map((s) => `${s.name} (${signatureRoleLabel(s.role)})`).join(', ')
          : 'Aucune';
        const body = `
          <h1 class="qhse-chrome-h1">PERMIS DE TRAVAIL</h1>
          <p class="qhse-chrome-muted"><strong>Réf.</strong> ${escapeHtml(String(it.id))}</p>
          <table class="qhse-chrome-table" style="margin-top:12px">
            <tbody>
              <tr><td style="font-weight:700;width:32%">Type</td><td>${escapeHtml(String(it.type || '—'))}</td></tr>
              <tr><td style="font-weight:700">Zone</td><td>${escapeHtml(String(it.zone || '—'))}</td></tr>
              <tr><td style="font-weight:700">Responsable</td><td>${escapeHtml(String(responsible || '—'))}</td></tr>
              <tr><td style="font-weight:700">Statut</td><td>${escapeHtml(statusLabel(it.status))}</td></tr>
              <tr><td style="font-weight:700">Expiration</td><td>${escapeHtml(expiryLabel(it))}</td></tr>
              <tr><td style="font-weight:700">Analyse risque</td><td>${escapeHtml(String(it.riskAnalysis || '—'))}</td></tr>
              <tr><td style="font-weight:700">Checklist</td><td>${escapeHtml((it.checklist || []).join(', ') || '—')}</td></tr>
              <tr><td style="font-weight:700">Signatures</td><td>${escapeHtml(sigText)}</td></tr>
            </tbody>
          </table>
        `;
        const html = assembleQhsePdfDocument('Permis de travail', [body]);
        await downloadQhseChromePdf(html, `permis-${it.id}.pdf`, {
          margin: [12, 10, 16, 10],
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        });
      } catch (e) {
        console.error(e);
      }
    });
    actions.append(activateBtn, signAny, pdfBtn, toAction, toIncident, toRisk);
    const signPanel = document.createElement('div');
    signPanel.className = 'ptw-sign-inline';
    signPanel.hidden = true;
    signPanel.replaceChildren();
    const labRole = document.createElement('label');
    labRole.className = 'field';
    const spRole = document.createElement('span');
    spRole.textContent = 'Rôle';
    const selRole = document.createElement('select');
    selRole.className = 'control-select';
    selRole.dataset.inlineRole = '';
    for (const r of SIGN_ROLES) {
      const o = document.createElement('option');
      o.value = r.value;
      o.textContent = r.label;
      selRole.append(o);
    }
    labRole.append(spRole, selRole);
    const inName = document.createElement('input');
    inName.className = 'control-input';
    inName.dataset.inlineName = '';
    inName.placeholder = 'Nom du signataire';
    const cv = document.createElement('canvas');
    cv.className = 'ptw-sign-canvas';
    cv.width = 500;
    cv.height = 120;
    cv.dataset.inlineCanvas = '';
    const seg = document.createElement('div');
    seg.className = 'ptw-seg';
    const bClear = document.createElement('button');
    bClear.type = 'button';
    bClear.className = 'btn btn-secondary';
    bClear.dataset.inlineClear = '';
    bClear.textContent = 'Effacer';
    const bSave = document.createElement('button');
    bSave.type = 'button';
    bSave.className = 'btn btn-primary';
    bSave.dataset.inlineSave = '';
    bSave.textContent = 'Signer le permis';
    seg.append(bClear, bSave);
    signPanel.append(labRole, inName, cv, seg);
    row.append(actions, signPanel);
    const signTools = setupSignatureCanvas(signPanel.querySelector('[data-inline-canvas]'));
    signAny.addEventListener('click', () => {
      signPanel.hidden = !signPanel.hidden;
    });
    signPanel.querySelector('[data-inline-clear]').addEventListener('click', () => signTools.clear());
    signPanel.querySelector('[data-inline-save]').addEventListener('click', () => {
      void (async () => {
        const role = signPanel.querySelector('[data-inline-role]').value;
        const n = signPanel.querySelector('[data-inline-name]').value.trim();
        if (!n) return showToast('Nom du signataire requis.', 'error');
        await signPermit(it.id, role, {
          name: n,
          signatureDataUrl: signTools.dataUrl(),
          userId: getSessionUser()?.id || '',
          userLabel: getSessionUser()?.name || ''
        });
        showToast('Permis signé.', 'success');
        await renderLists();
      })();
    });
    return row;
  }

  async function renderLists() {
    const syncResult = await flushSyncQueue();
    if (syncResult.flushed > 0) {
      showToast(`${syncResult.flushed} opération(s) synchronisée(s).`, 'success');
    }
    const openHost = inProgressCard.querySelector('[data-open-items]');
    const closedHost = closedCard.querySelector('[data-closed-items]');
    const all = listPermits();
    const opened = all.filter((x) => x.status !== 'closed');
    const closed = all.filter((x) => x.status === 'closed');
    const pending = all.filter((x) => (x.status === 'open' ? 'pending' : x.status) === 'pending');
    const expired = all.filter((x) => isExpiredPermit(x));
    if (expired.length > 0 && expired.length !== lastExpiredToast) {
      showToast(`${expired.length} permis expiré(s) à traiter.`, 'warning');
    }
    lastExpiredToast = expired.length;
    kpiCard.querySelector('[data-kpi-active]').textContent = String(opened.length);
    kpiCard.querySelector('[data-kpi-pending]').textContent = String(pending.length);
    kpiCard.querySelector('[data-kpi-expired]').textContent = String(expired.length);
    inProgressCard.querySelector('[data-open-count]').textContent = String(opened.length);
    closedCard.querySelector('[data-closed-count]').textContent = String(closed.length);
    openHost.replaceChildren();
    closedHost.replaceChildren();
    if (!opened.length) {
      const es = createEmptyState(
        '\u2692',
        'Aucun permis en cours',
        'Créez un permis terrain guidé ou passez par la création ultra-rapide depuis la barre d’outils.',
        'Créer un permis terrain',
        () => toolbar.querySelector('.ptw-create-btn')?.click()
      );
      es.classList.add('empty-state--ptw-column');
      openHost.append(es);
    } else opened.forEach((it) => openHost.append(permitCard(it)));
    if (!closed.length) {
      const es = createEmptyState(
        '\u2714',
        'Aucun permis clôturé',
        'Les dossiers terminés et validés apparaissent ici une fois le statut « clôturé » enregistré.'
      );
      es.classList.add('empty-state--ptw-column');
      closedHost.append(es);
    } else closed.forEach((it) => closedHost.append(permitCard(it)));

    const meta = getSyncState();
    const netEl = toolbar.querySelector('[data-net-state]');
    const syncEl = toolbar.querySelector('[data-sync-state]');
    netEl.textContent = meta.online ? 'Mode en ligne' : 'Mode hors ligne';
    netEl.className = `ptw-net-badge ${meta.online ? 'ptw-net-badge--online' : 'ptw-net-badge--offline'}`;
    syncEl.textContent = `Synchronisation: ${meta.pendingCount} en attente`;
    syncEl.className = `ptw-net-badge ${meta.pendingCount > 0 ? 'ptw-net-badge--sync-pending' : 'ptw-net-badge--sync'}`;
  }

  toolbar.querySelector('.ptw-create-btn').addEventListener('click', () => {
    state.step = 1;
    state.draft = {
      type: '',
      zone: '',
      description: '',
      team: '',
      date: new Date().toISOString().slice(0, 10),
      checklist: [],
      epi: [],
      safetyConditions: [],
      validationMode: 'double',
      riskAnalysis: '',
      mandatory: { epi: false, zoneSecure: false, authorization: false },
      signatures: {
        supervisor: { name: '', signatureDataUrl: '' },
        qhse: { name: '', signatureDataUrl: '' },
        responsable: { name: '', signatureDataUrl: '' }
      }
    };
    wizardCard.hidden = false;
    quickCard.hidden = true;
    renderWizard();
  });
  toolbar.querySelector('.ptw-create-quick-btn').addEventListener('click', () => {
    wizardCard.hidden = true;
    quickCard.hidden = false;
    renderQuickCreate();
  });

  window.addEventListener('online', () => {
    void flushSyncQueue().then(() => renderLists());
  });
  window.addEventListener('offline', () => {
    void renderLists();
  });
  void refreshPermitsFromApi()
    .then(() => flushSyncQueue())
    .then((r) => {
      if (r?.flushed > 0) showToast(`${r.flushed} opération(s) synchronisée(s).`, 'success');
      return renderLists();
    })
    .catch(() => {
      void renderLists();
    });
  void renderLists();
  return page;
}
