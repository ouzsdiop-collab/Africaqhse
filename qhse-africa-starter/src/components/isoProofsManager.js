/**
 * Gestion des preuves ISO — module isolé (store + UI modal + colonne registre).
 * Ne modifie pas les autres modules ; persistance dédiée localStorage.
 */
import './isoProofsModule.css';
import {
  getRequirements,
  setRequirementStatus,
  AUDITS_TO_SCHEDULE
} from '../data/conformityStore.js';
import { showToast } from './toast.js';
import { ensureSensitiveAccess } from './sensitiveAccessGate.js';

const STORAGE_KEY = 'qhse-iso-proof-docs-module-v1';
const TOUCHED_KEY = 'qhse-iso-proof-touched-reqs-v1';

/** @typedef {'preuve' | 'procedure' | 'audit_doc'} IsoProofDocCategory */
/** @typedef {'exigence' | 'nc' | 'audit'} IsoProofLinkKind */
/** @typedef {'verify' | 'validated'} IsoProofStatus */

/**
 * @typedef {object} IsoProofDocument
 * @property {string} id
 * @property {string} displayName
 * @property {IsoProofDocCategory} docCategory
 * @property {IsoProofLinkKind} linkKind
 * @property {string} linkId
 * @property {string | null} registryRequirementId — ligne registre (null si liaison audit seule)
 * @property {IsoProofStatus} status
 * @property {string} fileName
 * @property {number} fileSize
 * @property {string} mimeType
 * @property {string} createdAt
 */

/** @type {IsoProofDocument[]} */
export const documentsStore = [];

/** @type {Set<string>} */
let touchedReqs = new Set();

function loadTouched() {
  try {
    const raw = localStorage.getItem(TOUCHED_KEY);
    if (!raw) return new Set();
    const p = JSON.parse(raw);
    return Array.isArray(p) ? new Set(p.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function saveTouched() {
  try {
    localStorage.setItem(TOUCHED_KEY, JSON.stringify([...touchedReqs]));
  } catch {
    /* ignore */
  }
}

function loadDocuments() {
  documentsStore.length = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return;
    p.forEach((row) => {
      if (row && typeof row === 'object' && row.id) documentsStore.push(/** @type {IsoProofDocument} */ (row));
    });
  } catch {
    /* ignore */
  }
  touchedReqs = loadTouched();
}

function persistDocuments() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documentsStore));
  } catch {
    /* quota */
  }
  saveTouched();
}

loadDocuments();

/**
 * @param {Omit<IsoProofDocument, 'id' | 'createdAt'> & { id?: string; createdAt?: string }} entry
 * @returns {string}
 */
export function addDocument(entry) {
  const id =
    entry.id && String(entry.id).trim()
      ? String(entry.id).trim()
      : `proof-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  /** @type {IsoProofDocument} */
  const row = {
    id,
    displayName: String(entry.displayName || entry.fileName || 'Document').slice(0, 200),
    docCategory: entry.docCategory === 'procedure' || entry.docCategory === 'audit_doc' ? entry.docCategory : 'preuve',
    linkKind: entry.linkKind === 'nc' || entry.linkKind === 'audit' ? entry.linkKind : 'exigence',
    linkId: String(entry.linkId || '').trim(),
    registryRequirementId: entry.registryRequirementId != null ? String(entry.registryRequirementId).trim() : null,
    status: entry.status === 'validated' ? 'validated' : 'verify',
    fileName: String(entry.fileName || '').slice(0, 240),
    fileSize: Number(entry.fileSize) || 0,
    mimeType: String(entry.mimeType || 'application/octet-stream').slice(0, 120),
    createdAt: entry.createdAt || new Date().toISOString()
  };
  if (!row.registryRequirementId) {
    if (row.linkKind === 'audit') {
      documentsStore.push(row);
      persistDocuments();
      return id;
    }
    return '';
  }
  documentsStore.push(row);
  touchedReqs.add(row.registryRequirementId);
  syncRequirementStatusFromProofs(row.registryRequirementId);
  persistDocuments();
  return id;
}

/**
 * @param {string} requirementId
 * @returns {IsoProofDocument[]}
 */
export function getDocumentsByExigence(requirementId) {
  const id = String(requirementId || '').trim();
  return documentsStore.filter((d) => d.registryRequirementId === id);
}

/**
 * @param {string | null | undefined} registryRequirementId
 */
function syncRequirementStatusFromProofs(registryRequirementId) {
  const rid = registryRequirementId ? String(registryRequirementId).trim() : '';
  if (!rid || !touchedReqs.has(rid)) return;
  const docs = getDocumentsByExigence(rid);
  if (docs.length === 0) {
    setRequirementStatus(rid, 'non_conforme');
    return;
  }
  const hasVal = docs.some((d) => d.status === 'validated');
  const hasVer = docs.some((d) => d.status === 'verify');
  if (hasVal) setRequirementStatus(rid, 'conforme');
  else if (hasVer) setRequirementStatus(rid, 'partiel');
  else setRequirementStatus(rid, 'non_conforme');
}

/**
 * Synthèse affichage pour une ligne registre.
 * @param {string} requirementId
 */
function getProofVisual(requirementId) {
  const docs = getDocumentsByExigence(requirementId);
  if (docs.length === 0) {
    return { icon: '❌', label: 'Aucune preuve', tone: 'missing' };
  }
  const hasVal = docs.some((d) => d.status === 'validated');
  const hasVer = docs.some((d) => d.status === 'verify');
  if (hasVal) return { icon: '📎', label: 'Preuve validée', tone: 'ok' };
  if (hasVer) return { icon: '🟡', label: 'À vérifier', tone: 'verify' };
  return { icon: '❌', label: 'Aucune preuve', tone: 'missing' };
}

function triggerPageRefresh() {
  try {
    window.dispatchEvent(new Event('hashchange'));
  } catch {
    /* ignore */
  }
}

/**
 * Met à jour colonne Preuve, badges et boutons (idempotent).
 * @param {ParentNode} [root]
 */
export function updateUI(root = document) {
  const iso = root.querySelector?.('.iso-page') || root.closest?.('.iso-page');
  const scope = iso || root;
  const table = scope.querySelector('.iso-req-table');
  if (!table) return;

  const head = table.querySelector('.iso-table-head');
  if (head) {
    const spans = head.querySelectorAll('span');
    if (spans.length >= 5) spans[4].textContent = 'Preuve';
  }

  table.querySelectorAll('.iso-table-row[data-iso-requirement-id]').forEach((line) => {
    const reqId = line.getAttribute('data-iso-requirement-id') || '';
    const vis = getProofVisual(reqId);

    const statCell = line.querySelector('.iso-req-status-cell');
    if (statCell) {
      let ib = statCell.querySelector('.iso-proof-inline-badge');
      if (!ib) {
        ib = document.createElement('span');
        ib.className = 'iso-proof-inline-badge';
        ib.setAttribute('aria-hidden', 'true');
        statCell.append(ib);
      }
      ib.textContent = vis.icon;
      ib.title = `Preuve : ${vis.label}`;
    }

    let proofHost = line.querySelector('.iso-proof-registry-host');
    if (!proofHost) {
      const ev = line.querySelector('.iso-evidence-cell');
      if (!ev) return;
      proofHost = document.createElement('div');
      proofHost.className = 'iso-proof-registry-host';
      ev.replaceChildren(proofHost);
    }

    proofHost.className = 'iso-proof-registry-host iso-proof-registry-cell';
    proofHost.innerHTML = '';

    const row1 = document.createElement('div');
    row1.className = 'iso-proof-registry-icons';
    const ic = document.createElement('span');
    ic.className = 'iso-proof-col-icon';
    ic.textContent = vis.icon;
    ic.title = vis.label;
    const lb = document.createElement('span');
    lb.className = 'iso-proof-col-label';
    lb.textContent = vis.label;
    row1.append(ic, lb);

    const names = getDocumentsByExigence(reqId)
      .slice(0, 2)
      .map((d) => d.displayName)
      .join(' · ');
    if (names) {
      const nm = document.createElement('span');
      nm.className = 'iso-cell-muted iso-cell-small';
      nm.style.marginTop = '2px';
      nm.textContent = names + (getDocumentsByExigence(reqId).length > 2 ? '…' : '');
      proofHost.append(row1, nm);
    } else {
      proofHost.append(row1);
    }

    let btn = proofHost.querySelector('.iso-proof-join-row');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary iso-proof-join-row';
      btn.textContent = 'Joindre une preuve';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProofModal({ defaultRegistryRequirementId: reqId });
      });
      proofHost.append(btn);
    }

    const reqMeta = getRequirements().find((r) => r.id === reqId);
    if (reqMeta?.evidence) {
      let seed = proofHost.querySelector('.iso-proof-seed-evidence');
      if (!seed) {
        seed = document.createElement('span');
        seed.className = 'iso-cell-muted iso-cell-small iso-proof-seed-evidence';
        seed.style.display = 'block';
        seed.style.marginTop = '4px';
        proofHost.append(seed);
      }
      seed.textContent = reqMeta.evidence;
    }
  });
}

/**
 * @param {{ defaultRegistryRequirementId?: string | null }} [opts]
 */
function openProofModal(opts = {}) {
  const existing = document.querySelector('.iso-proof-modal-overlay');
  if (existing) existing.remove();

  /** @type {File | null} */
  let picked = null;
  /** @type {IsoProofLinkKind} */
  let linkKind = 'exigence';

  const overlay = document.createElement('div');
  overlay.className = 'iso-proof-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'iso-proof-modal-title');

  const panel = document.createElement('div');
  panel.className = 'iso-proof-modal card-soft';

  const reqs = getRequirements();
  const ncReqs = reqs.filter((r) => r.status === 'non_conforme');

  panel.innerHTML = `
    <div class="iso-proof-modal__head">
      <h3 id="iso-proof-modal-title">Joindre une preuve ISO</h3>
      <p>Preuve traitée dans le navigateur — rattachement obligatoire pour le registre maîtrisé.</p>
    </div>
    <div class="iso-proof-modal__body">
      <div class="iso-proof-drop" tabindex="0">
        <p class="iso-proof-drop__label">Glissez un fichier ici ou choisissez un fichier</p>
        <div class="iso-proof-drop__actions">
          <button type="button" class="btn btn-secondary iso-proof-pick-file">Parcourir</button>
        </div>
        <input type="file" class="iso-proof-file-input" hidden />
      </div>
      <p class="iso-proof-preview iso-proof-file-preview" hidden></p>
      <div class="iso-proof-field">
        <span>Nom du document</span>
        <input type="text" class="iso-proof-input-name" placeholder="Ex. Registre calibrage Q1" />
      </div>
      <div class="iso-proof-field">
        <span>Type</span>
        <select class="iso-proof-select-type">
          <option value="preuve">Preuve</option>
          <option value="procedure">Procédure</option>
          <option value="audit_doc">Audit</option>
        </select>
      </div>
      <div class="iso-proof-field">
        <span>Liaison</span>
        <select class="iso-proof-select-link">
          <option value="exigence">Exigence ISO</option>
          <option value="nc">Non-conformité</option>
          <option value="audit">Audit</option>
        </select>
      </div>
      <div class="iso-proof-field iso-proof-field-target iso-proof-target-exigence">
        <span>Exigence</span>
        <select class="iso-proof-select-req"></select>
      </div>
      <div class="iso-proof-field iso-proof-field-target iso-proof-target-nc" hidden>
        <span>Non-conformité (exigence)</span>
        <select class="iso-proof-select-nc"></select>
      </div>
      <div class="iso-proof-field iso-proof-field-target iso-proof-target-audit" hidden>
        <span>Audit</span>
        <select class="iso-proof-select-audit"></select>
      </div>
      <div class="iso-proof-field iso-proof-field-target iso-proof-target-audit-reg" hidden>
        <span>Afficher aussi sur l’exigence (registre)</span>
        <select class="iso-proof-audit-registry-req">
          <option value="">— Preuve audit seule (hors tableau) —</option>
        </select>
      </div>
      <div class="iso-proof-field">
        <span>Statut document</span>
        <select class="iso-proof-select-status">
          <option value="verify" selected>À vérifier</option>
          <option value="validated">Validé</option>
        </select>
      </div>
    </div>
    <div class="iso-proof-modal__foot">
      <button type="button" class="btn btn-secondary iso-proof-cancel">Annuler</button>
      <button type="button" class="btn btn-primary iso-proof-save">Enregistrer</button>
    </div>
  `;

  const selReq = panel.querySelector('.iso-proof-select-req');
  const selNc = panel.querySelector('.iso-proof-select-nc');
  const selAudit = panel.querySelector('.iso-proof-select-audit');
  const wrapEx = panel.querySelector('.iso-proof-target-exigence');
  const wrapNc = panel.querySelector('.iso-proof-target-nc');
  const wrapAu = panel.querySelector('.iso-proof-target-audit');
  const wrapAuReg = panel.querySelector('.iso-proof-target-audit-reg');
  const selAuditReg = panel.querySelector('.iso-proof-audit-registry-req');
  const selLink = panel.querySelector('.iso-proof-select-link');
  const drop = panel.querySelector('.iso-proof-drop');
  const fileIn = panel.querySelector('.iso-proof-file-input');
  const pickBtn = panel.querySelector('.iso-proof-pick-file');
  const preview = panel.querySelector('.iso-proof-file-preview');
  const nameIn = panel.querySelector('.iso-proof-input-name');

  reqs.forEach((r) => {
    const o = document.createElement('option');
    o.value = r.id;
    o.textContent = `${r.clause} — ${r.title}`;
    selReq?.appendChild(o);
    const o2 = o.cloneNode(true);
    selAuditReg?.appendChild(o2);
  });

  ncReqs.forEach((r) => {
    const o = document.createElement('option');
    o.value = r.id;
    o.textContent = `${r.clause} — ${r.title}`;
    selNc?.appendChild(o);
  });

  if (selNc && !selNc.options.length && ncReqs.length === 0) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = '— Aucune NC listée —';
    selNc.appendChild(o);
  }

  AUDITS_TO_SCHEDULE.forEach((a, i) => {
    const o = document.createElement('option');
    o.value = `audit-${i}`;
    o.textContent = `${a.title} (${a.horizon})`;
    selAudit?.appendChild(o);
  });

  const defReq = opts.defaultRegistryRequirementId || '';
  if (defReq && selReq) selReq.value = defReq;
  if (defReq && selNc) selNc.value = defReq;
  if (defReq && selAuditReg) selAuditReg.value = defReq;

  function toggleLinkUi() {
    linkKind = /** @type {IsoProofLinkKind} */ (selLink?.value || 'exigence');
    const ex = linkKind === 'exigence';
    const nc = linkKind === 'nc';
    const au = linkKind === 'audit';
    if (wrapEx) wrapEx.hidden = !ex;
    if (wrapNc) wrapNc.hidden = !nc;
    if (wrapAu) wrapAu.hidden = !au;
    if (wrapAuReg) wrapAuReg.hidden = !au;
  }
  selLink?.addEventListener('change', toggleLinkUi);
  toggleLinkUi();

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  panel.querySelector('.iso-proof-cancel')?.addEventListener('click', close);

  pickBtn?.addEventListener('click', () => fileIn?.click());
  fileIn?.addEventListener('change', () => {
    const f = fileIn.files && fileIn.files[0];
    if (f) setFile(f);
  });

  function setFile(f) {
    picked = f;
    if (nameIn && !nameIn.value.trim()) nameIn.value = f.name.replace(/\.[^.]+$/, '');
    if (preview) {
      preview.hidden = false;
      preview.textContent = `${f.name} · ${(f.size / 1024).toFixed(1)} Ko`;
    }
    drop?.classList.remove('iso-proof-drop--busy');
  }

  ['dragenter', 'dragover'].forEach((ev) => {
    drop?.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      drop.classList.add('iso-proof-drop--drag');
    });
  });
  ['dragleave', 'drop'].forEach((ev) => {
    drop?.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      drop?.classList.remove('iso-proof-drop--drag');
    });
  });
  drop?.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      drop?.classList.add('iso-proof-drop--busy');
      window.setTimeout(() => setFile(f), 280);
    }
  });

  panel.querySelector('.iso-proof-save')?.addEventListener('click', async () => {
    if (
      !(await ensureSensitiveAccess('confidential_document', {
        contextLabel: 'ajout de preuve ISO (module isolé)'
      }))
    ) {
      return;
    }
    if (!picked) {
      showToast('Choisissez un fichier.', 'warning');
      return;
    }
    const displayName = (nameIn?.value || picked.name).trim() || picked.name;
    const docCategory = /** @type {IsoProofDocCategory} */ (
      panel.querySelector('.iso-proof-select-type')?.value === 'procedure'
        ? 'procedure'
        : panel.querySelector('.iso-proof-select-type')?.value === 'audit_doc'
          ? 'audit_doc'
          : 'preuve'
    );
    const status =
      panel.querySelector('.iso-proof-select-status')?.value === 'validated' ? 'validated' : 'verify';

    /** @type {string | null} */
    let registryRequirementId = null;
    /** @type {string} */
    let linkId = '';

    if (linkKind === 'exigence') {
      linkId = selReq?.value || '';
      registryRequirementId = linkId;
    } else if (linkKind === 'nc') {
      linkId = selNc?.value || '';
      registryRequirementId = linkId || null;
    } else {
      linkId = selAudit?.value || '';
      const regPick = selAuditReg?.value?.trim() || '';
      registryRequirementId = regPick || null;
    }

    if ((linkKind === 'exigence' || linkKind === 'nc') && !linkId) {
      showToast('Choisissez une cible de liaison.', 'warning');
      return;
    }
    if (linkKind === 'audit' && !linkId) {
      showToast('Choisissez un audit.', 'warning');
      return;
    }

    const id = addDocument({
      displayName,
      docCategory,
      linkKind,
      linkId,
      registryRequirementId,
      status,
      fileName: picked.name,
      fileSize: picked.size,
      mimeType: picked.type || 'application/octet-stream'
    });
    if (!id) {
      showToast('Enregistrement impossible : vérifiez la liaison.', 'warning');
      return;
    }
    showToast('Preuve ajoutée', 'success');
    close();
    updateUI(document);
    triggerPageRefresh();
  });

  overlay.append(panel);
  document.body.append(overlay);
  drop?.classList.add('iso-proof-drop--busy');
  window.setTimeout(() => drop?.classList.remove('iso-proof-drop--busy'), 500);
}

function enhanceDocsSection(isoRoot) {
  const bar = isoRoot.querySelector('.iso-docs-priority .iso-doc-import-bar');
  if (!bar || bar.querySelector('.iso-proof-doc-bar-extra')) return;
  const extra = document.createElement('div');
  extra.className = 'iso-proof-doc-bar-extra';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-secondary';
  btn.textContent = 'Joindre une preuve';
  btn.addEventListener('click', () => openProofModal({}));
  extra.append(btn);
  bar.append(extra);
}

/**
 * @param {HTMLElement} isoRoot
 */
function mountIsoProofsModule(isoRoot) {
  enhanceDocsSection(isoRoot);
  updateUI(isoRoot);

  const table = isoRoot.querySelector('.iso-req-table');
  if (table && !table.dataset.isoProofObs) {
    table.dataset.isoProofObs = '1';
    const obs = new MutationObserver(() => {
      window.requestAnimationFrame(() => updateUI(isoRoot));
    });
    obs.observe(table, { childList: true, subtree: true });
  }
}

function tryBoot() {
  const iso = document.querySelector('.iso-page');
  if (!iso || iso.dataset.isoProofsModuleMounted) return;
  iso.dataset.isoProofsModuleMounted = '1';
  mountIsoProofsModule(iso);
}

const mo = new MutationObserver(() => tryBoot());
mo.observe(document.documentElement, { childList: true, subtree: true });
tryBoot();
