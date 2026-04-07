import { ensurePtwStyles } from '../components/ptwStyles.js';
import { showToast } from '../components/toast.js';
import { getSessionUser } from '../data/sessionUser.js';
import {
  createPermit,
  getSyncState,
  listPermits,
  patchPermit,
  signPermit,
  syncPendingSignatures,
  updatePermitStatus
} from '../services/ptw.service.js';
import { getLinksFor, linkModules } from '../services/moduleLinks.service.js';

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

function statusTone(v) {
  const status = v === 'open' ? 'pending' : v;
  return `ptw-status--${status}`;
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
  page.className = 'page-stack ptw-page';
  page.innerHTML = `
    <section class="page-intro module-page-hero">
      <div class="module-page-hero__inner">
        <p class="page-intro__kicker section-kicker">Opérations</p>
        <h1 class="page-intro__title">Permis de travail (PTW)</h1>
        <p class="page-intro__desc">Création guidée en moins de 30 secondes, validations et suivi terrain.</p>
      </div>
    </section>
  `;

  const toolbar = document.createElement('div');
  toolbar.className = 'ptw-toolbar';
  toolbar.innerHTML = `
    <button type="button" class="btn btn-primary ptw-create-btn">Créer un PTW terrain</button>
    <button type="button" class="btn btn-secondary ptw-create-quick-btn">PTW ultra-rapide (30s)</button>
    <span class="ptw-net-badge" data-net-state>Mode en ligne</span>
    <span class="ptw-net-badge" data-sync-state>Synchronisation: 0 en attente</span>
  `;
  page.append(toolbar);

  const kpiCard = document.createElement('article');
  kpiCard.className = 'content-card card-soft ptw-card';
  kpiCard.innerHTML = `
    <div class="ptw-kpis">
      <div class="ptw-kpi"><span class="ptw-kpi__label">PTW actifs</span><strong class="ptw-kpi__value" data-kpi-active>0</strong></div>
      <div class="ptw-kpi"><span class="ptw-kpi__label">PTW en attente</span><strong class="ptw-kpi__value" data-kpi-pending>0</strong></div>
      <div class="ptw-kpi"><span class="ptw-kpi__label">PTW expirés</span><strong class="ptw-kpi__value ptw-kpi__value--danger" data-kpi-expired>0</strong></div>
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
      const permit = createPermit({
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
      Object.entries(state.draft.signatures).forEach(([role, sig]) => {
        if (!sig?.name) return;
        signPermit(permit.id, role, {
          name: sig.name,
          signatureDataUrl: sig.signatureDataUrl,
          userId: getSessionUser()?.id || '',
          userLabel: getSessionUser()?.name || ''
        });
      });
      showToast('Permis créé.', 'success');
      wizardCard.hidden = true;
      renderLists();
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
    quickCard.innerHTML = `
      <div class="ptw-wizard-step">
        <div class="ptw-step-head"><h3>PTW ultra-rapide (30s)</h3><span class="ptw-step-badge">mode terrain</span></div>
        <div class="ptw-fields">
          <label class="field"><span>Type</span>
            <select class="control-select" data-q="type">${PTW_TYPES.map((t) => `<option value="${t}">${t}</option>`).join('')}</select>
          </label>
          <label class="field"><span>Zone</span><input class="control-input" data-q="zone" placeholder="Zone chantier" /></label>
          <label class="field"><span>Responsable</span><input class="control-input" data-q="team" placeholder="Nom responsable" /></label>
        </div>
      </div>
      <div class="ptw-wizard-foot">
        <button type="button" class="btn btn-primary" data-q-create>Créer immédiatement</button>
        <button type="button" class="btn btn-secondary" data-q-cancel>Annuler</button>
      </div>
    `;
    quickCard.querySelector('[data-q-cancel]').addEventListener('click', () => {
      quickCard.hidden = true;
    });
    quickCard.querySelector('[data-q-create]').addEventListener('click', () => {
      const type = quickCard.querySelector('[data-q="type"]').value;
      const zone = quickCard.querySelector('[data-q="zone"]').value.trim();
      const team = quickCard.querySelector('[data-q="team"]').value.trim();
      if (!zone || !team) return showToast('Zone et responsable requis.', 'error');
      const baseChecks = TYPE_CHECKLIST[type] || [];
      createPermit({
        type,
        zone,
        team,
        description: `PTW terrain rapide (${type})`,
        date: new Date().toISOString().slice(0, 10),
        checklist: baseChecks.map((x) => `${x} (OK)`),
        epi: ['Casque', 'Gants'],
        safetyConditions: ['Zone sécurisée'],
        riskAnalysis: TYPE_RISK_HINTS[type] || 'Risque standard terrain.',
        validationMode: 'simple',
        status: 'pending'
      });
      showToast('PTW créé en mode ultra-rapide.', 'success');
      quickCard.hidden = true;
      renderLists();
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
    row.innerHTML = `
      <div class="ptw-item-top">
        <div>
          <strong>${it.type}</strong>
          <div class="ptw-mini"><strong>Zone:</strong> ${it.zone || '—'} · <strong>Responsable:</strong> ${responsible}</div>
          <div class="ptw-mini"><strong>Date:</strong> ${it.date || '—'}</div>
        </div>
        <span class="ptw-chip ${statusVisualTone(it)}">${isExpiredPermit(it) ? 'expiré' : statusLabel(it.status)}</span>
      </div>
      ${expired ? '<div class="ptw-chip ptw-chip--critical">Permis non clôturé</div>' : ''}
      <p class="ptw-mini">${it.description || ''}</p>
      <div class="ptw-mini"><strong>Expiration:</strong> ${expiryLabel(it)}</div>
      <div class="ptw-inline-checks">
        <label class="ptw-inline-check"><input type="checkbox" disabled ${it.epi?.length ? 'checked' : ''} />EPI</label>
        <label class="ptw-inline-check"><input type="checkbox" disabled ${it.safetyConditions?.length ? 'checked' : ''} />Zone sécurisée</label>
        <label class="ptw-inline-check"><input type="checkbox" disabled ${it.signatures?.length ? 'checked' : ''} />Autorisation</label>
      </div>
      <details>
        <summary class="ptw-mini">Fiche permis</summary>
        <div class="ptw-mini">Checklist: ${(it.checklist || []).join(', ') || '—'}</div>
        <div class="ptw-mini">EPI: ${(it.epi || []).join(', ') || '—'}</div>
        <div class="ptw-mini">Conditions: ${(it.safetyConditions || []).join(', ') || '—'}</div>
        <div class="ptw-mini">Analyse risque: ${it.riskAnalysis || '—'}</div>
        <div class="ptw-mini">Validation: ${it.validationMode === 'simple' ? 'Simple' : 'Double'}</div>
        <div class="ptw-mini"><strong>Signé par:</strong> ${
          signatures.length
            ? signatures
                .map(
                  (s) =>
                    `${s.name || '—'} (${s.role}) · ${new Date(s.signedAt).toLocaleString('fr-FR')} · ${
                      s.syncStatus === 'pending_sync' ? 'en attente de synchronisation' : 'synchronisé'
                    }`
                )
                .join(' | ')
            : 'Aucune signature'
        }</div>
        <div class="ptw-mini"><strong>Statut sync:</strong> ${it.syncState === 'pending_sync' ? 'en attente de synchronisation' : 'synchronisé'}</div>
        <div class="ptw-mini"><strong>Vue 360°:</strong> ${
          relations.length
            ? relations
                .map((r) => {
                  const other = r.fromModule === 'permits' ? r.toModule : r.fromModule;
                  return `${other} (${r.kind || 'lien'})`;
                })
                .join(', ')
            : 'aucune relation'
        }</div>
      </details>
    `;
    const actions = document.createElement('div');
    actions.className = 'ptw-item-actions';
    const status = createStatusSelect(it.status, (v) => {
      updatePermitStatus(it.id, v);
      renderLists();
    });
    actions.append(status);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Clôturer';
    closeBtn.addEventListener('click', () => {
      const closer = window.prompt('Validation clôture terrain (nom) ?', '');
      if (!closer) return;
      patchPermit(it.id, { closedBy: closer, closedAt: new Date().toISOString() });
      updatePermitStatus(it.id, 'closed');
      renderLists();
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
      window.location.hash = 'actions';
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
      window.location.hash = 'incidents';
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
      window.location.hash = 'risks';
    });
    const signAny = document.createElement('button');
    signAny.type = 'button';
    signAny.className = 'btn btn-secondary';
    signAny.textContent = 'Signer PTW';
    const activateBtn = document.createElement('button');
    activateBtn.type = 'button';
    activateBtn.className = 'btn btn-secondary';
    activateBtn.textContent = 'Activer PTW';
    activateBtn.addEventListener('click', () => {
      patchPermit(it.id, { activatedAt: new Date().toISOString() });
      updatePermitStatus(it.id, 'in_progress');
      showToast('PTW activé.', 'success');
      renderLists();
    });
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.className = 'btn btn-secondary';
    pdfBtn.textContent = 'Export PDF';
    pdfBtn.addEventListener('click', async () => {
      try {
        const mod = await import('html2pdf.js');
        const html2pdf = mod.default || mod;
        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <h2>PTW ${it.id}</h2>
          <p><strong>Type:</strong> ${it.type}</p>
          <p><strong>Zone:</strong> ${it.zone || '—'}</p>
          <p><strong>Responsable:</strong> ${responsible}</p>
          <p><strong>Statut:</strong> ${statusLabel(it.status)}</p>
          <p><strong>Expiration:</strong> ${expiryLabel(it)}</p>
          <p><strong>Analyse risque:</strong> ${it.riskAnalysis || '—'}</p>
          <p><strong>Checklist:</strong> ${(it.checklist || []).join(', ') || '—'}</p>
          <p><strong>Signatures:</strong> ${
            signatures.length ? signatures.map((s) => `${s.name} (${s.role})`).join(', ') : 'Aucune'
          }</p>
        `;
        await html2pdf().from(wrap).set({ margin: 10, filename: `PTW-${it.id}.pdf` }).save();
        showToast('PDF PTW généré.', 'success');
      } catch {
        showToast('Export PDF indisponible.', 'error');
      }
    });
    actions.append(activateBtn, signAny, pdfBtn, toAction, toIncident, toRisk);
    const signPanel = document.createElement('div');
    signPanel.className = 'ptw-sign-inline';
    signPanel.hidden = true;
    signPanel.innerHTML = `
      <label class="field"><span>Rôle</span><select class="control-select" data-inline-role>${SIGN_ROLES.map((r) => `<option value="${r.value}">${r.label}</option>`).join('')}</select></label>
      <input class="control-input" data-inline-name placeholder="Nom du signataire" />
      <canvas class="ptw-sign-canvas" width="500" height="120" data-inline-canvas></canvas>
      <div class="ptw-seg">
        <button type="button" class="btn btn-secondary" data-inline-clear>Effacer</button>
        <button type="button" class="btn btn-primary" data-inline-save>Signer PTW</button>
      </div>
    `;
    row.append(actions, signPanel);
    const signTools = setupSignatureCanvas(signPanel.querySelector('[data-inline-canvas]'));
    signAny.addEventListener('click', () => {
      signPanel.hidden = !signPanel.hidden;
    });
    signPanel.querySelector('[data-inline-clear]').addEventListener('click', () => signTools.clear());
    signPanel.querySelector('[data-inline-save]').addEventListener('click', () => {
      const role = signPanel.querySelector('[data-inline-role]').value;
      const n = signPanel.querySelector('[data-inline-name]').value.trim();
      if (!n) return showToast('Nom du signataire requis.', 'error');
      signPermit(it.id, role, {
        name: n,
        signatureDataUrl: signTools.dataUrl(),
        userId: getSessionUser()?.id || '',
        userLabel: getSessionUser()?.name || ''
      });
      showToast('PTW signé.', 'success');
      renderLists();
    });
    return row;
  }

  function renderLists() {
    const syncResult = syncPendingSignatures();
    if (syncResult.synced > 0) {
      showToast(`${syncResult.synced} signature(s) synchronisée(s).`, 'success');
    }
    const openHost = inProgressCard.querySelector('[data-open-items]');
    const closedHost = closedCard.querySelector('[data-closed-items]');
    const all = listPermits();
    const opened = all.filter((x) => x.status !== 'closed');
    const closed = all.filter((x) => x.status === 'closed');
    const pending = all.filter((x) => (x.status === 'open' ? 'pending' : x.status) === 'pending');
    const expired = all.filter((x) => isExpiredPermit(x));
    if (expired.length > 0 && expired.length !== lastExpiredToast) {
      showToast(`${expired.length} PTW expiré(s) à traiter.`, 'warning');
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
      const p = document.createElement('p');
      p.className = 'ptw-mini';
      p.textContent = 'Aucun permis en cours.';
      openHost.append(p);
    } else opened.forEach((it) => openHost.append(permitCard(it)));
    if (!closed.length) {
      const p = document.createElement('p');
      p.className = 'ptw-mini';
      p.textContent = 'Aucun permis clôturé.';
      closedHost.append(p);
    } else closed.forEach((it) => closedHost.append(permitCard(it)));

    const meta = getSyncState();
    const netEl = toolbar.querySelector('[data-net-state]');
    const syncEl = toolbar.querySelector('[data-sync-state]');
    netEl.textContent = meta.online ? 'Mode en ligne' : 'Mode hors ligne';
    netEl.className = `ptw-net-badge ${meta.online ? 'ptw-net-badge--online' : 'ptw-net-badge--offline'}`;
    syncEl.textContent = `Synchronisation: ${meta.pendingCount} en attente`;
    syncEl.className = `ptw-net-badge ${meta.pendingCount > 0 ? 'ptw-net-badge--pending' : 'ptw-net-badge--online'}`;
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

  window.addEventListener('online', () => renderLists());
  window.addEventListener('offline', () => renderLists());
  renderLists();
  return page;
}
