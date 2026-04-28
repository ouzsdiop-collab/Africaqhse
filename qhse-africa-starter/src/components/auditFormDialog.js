import { showToast } from './toast.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { appState } from '../utils/state.js';
import { activityLogStore } from '../data/activityLog.js';
import { clearImportDraft } from '../utils/importDraft.js';

const DIALOG_STYLE_ID = 'qhse-audit-form-dialog-styles';

function ensureAuditFormDialogStyles() {
  if (document.getElementById(DIALOG_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = DIALOG_STYLE_ID;
  el.textContent = `
.qhse-audit-form-dialog{border:none;border-radius:14px;max-width:min(480px,96vw);padding:0;background:var(--bg,#0f172a);color:var(--text);box-shadow:0 24px 64px rgba(0,0,0,.55)}
.qhse-audit-form-dialog::backdrop{background:rgba(0,0,0,.55)}
.qhse-audit-form-dialog__inner{padding:18px 20px 20px}
.qhse-audit-form-dialog__head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
.qhse-audit-form-dialog__title{margin:0;font-size:17px;font-weight:800}
`;
  document.head.append(el);
}

/**
 * Brouillon issu de l’import (phase 3) : création API uniquement après validation utilisateur.
 * @param {Record<string, unknown>} prefill
 */
export function createAuditImportDraftSection(prefill, canAuditWrite, su) {
  const card = document.createElement('article');
  card.className = 'content-card card-soft';
  card.style.marginBottom = '14px';
  card.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Import documentaire</div>
        <h3>Brouillon audit : à valider</h3>
        <p class="content-card-lead" style="margin:0;max-width:56ch;font-size:13px">Données proposées depuis l’import ; rien n’est créé tant vous n’enregistrez pas.</p>
      </div>
    </div>
    <div class="form-grid" style="gap:12px">
      <label class="field"><span>Référence</span><input type="text" class="control-input audit-draft-ref" autocomplete="off" /></label>
      <label class="field"><span>Site</span><input type="text" class="control-input audit-draft-site" autocomplete="off" /></label>
      <label class="field"><span>Score (0–100)</span><input type="number" min="0" max="100" class="control-input audit-draft-score" /></label>
      <label class="field field-full"><span>Statut</span><input type="text" class="control-input audit-draft-status" placeholder="ex. terminé, en cours" autocomplete="off" /></label>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;align-items:center">
      <button type="button" class="btn btn-primary audit-draft-save">Créer l’audit</button>
      <button type="button" class="text-button audit-draft-dismiss" style="font-weight:700">Ignorer le brouillon</button>
    </div>
  `;
  const refIn = card.querySelector('.audit-draft-ref');
  const siteIn = card.querySelector('.audit-draft-site');
  const scoreIn = card.querySelector('.audit-draft-score');
  const statusIn = card.querySelector('.audit-draft-status');
  refIn.value = prefill.ref != null ? String(prefill.ref) : '';
  siteIn.value = prefill.site != null ? String(prefill.site) : '';
  scoreIn.value =
    prefill.score != null && prefill.score !== ''
      ? String(prefill.score)
      : '';
  statusIn.value = prefill.status != null ? String(prefill.status) : 'en cours';

  const saveBtn = card.querySelector('.audit-draft-save');
  const dismissBtn = card.querySelector('.audit-draft-dismiss');
  if (!canAuditWrite && su) {
    saveBtn.disabled = true;
    saveBtn.title = 'Création réservée';
  }
  saveBtn.addEventListener('click', async () => {
    const ref = refIn.value.trim();
    const site = siteIn.value.trim();
    const status = statusIn.value.trim() || 'en cours';
    const score = parseInt(scoreIn.value, 10);
    if (!ref || !site || Number.isNaN(score)) {
      showToast('Référence, site et score valides requis', 'error');
      return;
    }
    saveBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref,
          site,
          score,
          status,
          checklist: Array.isArray(prefill.checklist) ? prefill.checklist : undefined,
          ...(appState.activeSiteId ? { siteId: appState.activeSiteId } : {})
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          typeof body.error === 'string' ? body.error : 'Erreur création',
          'error'
        );
        return;
      }
      showToast(`Audit ${ref} enregistré.`, 'info');
      clearImportDraft();
      card.remove();
      activityLogStore.add({
        module: 'audits',
        action: 'Audit créé depuis import documentaire',
        detail: ref,
        user: 'Utilisateur'
      });
    } catch (e) {
      console.error(e);
      showToast('Erreur serveur', 'error');
    } finally {
      saveBtn.disabled = !canAuditWrite && !!su;
    }
  });
  dismissBtn.addEventListener('click', () => {
    clearImportDraft();
    card.remove();
  });
  return card;
}

/**
 * Formulaire création / édition audit dans un `<dialog>` natif.
 * Champs affichés : titre (réf.), type, site, date prévue, statut, notes, score. Envoi API : ref, site, score, status, checklist (méta optionnelle), siteId.
 *
 * @param {object|null} audit
 * @param {object} opts
 * @param {(created: object) => void} [opts.onSave]
 * @param {boolean} [opts.canAuditWrite]
 * @param {object | null} [opts.su]
 */
export function openAuditDialog(audit = null, opts = {}) {
  const { onSave, canAuditWrite = true, su = null } = opts;
  if (audit != null) {
    showToast('Modification d’audit : utilisez le pilotage ou une mise à jour API dédiée.', 'info');
    return;
  }
  ensureAuditFormDialogStyles();
  const dlg = document.createElement('dialog');
  dlg.className = 'qhse-audit-form-dialog';
  const inner = document.createElement('div');
  inner.className = 'qhse-audit-form-dialog__inner';
  inner.innerHTML = `
    <div class="qhse-audit-form-dialog__head">
      <h2 class="qhse-audit-form-dialog__title">Nouvel audit</h2>
      <button type="button" class="btn btn-secondary qhse-audit-form-close" aria-label="Fermer">Fermer</button>
    </div>
    <div class="form-grid" style="gap:12px">
      <label class="field"><span>Titre / référence</span><input type="text" class="control-input qhse-audit-f-ref" autocomplete="off" required /></label>
      <label class="field"><span>Type</span><input type="text" class="control-input qhse-audit-f-type" placeholder="ex. interne, fournisseur" autocomplete="off" /></label>
      <label class="field"><span>Site</span><input type="text" class="control-input qhse-audit-f-site" autocomplete="off" required /></label>
      <label class="field"><span>Date prévue</span><input type="text" class="control-input qhse-audit-f-date" placeholder="JJ/MM/AAAA" autocomplete="off" /></label>
      <label class="field"><span>Statut</span><input type="text" class="control-input qhse-audit-f-status" value="en cours" autocomplete="off" /></label>
      <label class="field field-full"><span>Notes</span><textarea class="control-input qhse-audit-f-notes" rows="2" autocomplete="off"></textarea></label>
      <label class="field"><span>Score (0–100)</span><input type="number" min="0" max="100" class="control-input qhse-audit-f-score" value="70" /></label>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">
      <button type="button" class="btn btn-primary qhse-audit-f-save">Enregistrer</button>
      <button type="button" class="btn btn-secondary qhse-audit-f-cancel">Annuler</button>
    </div>
  `;
  dlg.append(inner);
  document.body.append(dlg);

  const refIn = inner.querySelector('.qhse-audit-f-ref');
  const typeIn = inner.querySelector('.qhse-audit-f-type');
  const siteIn = inner.querySelector('.qhse-audit-f-site');
  const dateIn = inner.querySelector('.qhse-audit-f-date');
  const statusIn = inner.querySelector('.qhse-audit-f-status');
  const notesIn = inner.querySelector('.qhse-audit-f-notes');
  const scoreIn = inner.querySelector('.qhse-audit-f-score');
  const saveBtn = inner.querySelector('.qhse-audit-f-save');
  const cancelBtn = inner.querySelector('.qhse-audit-f-cancel');
  const closeBtn = inner.querySelector('.qhse-audit-form-close');

  if (!canAuditWrite && su) {
    saveBtn.disabled = true;
    saveBtn.title = 'Création réservée';
  }

  function shutdown() {
    dlg.close();
  }

  closeBtn.addEventListener('click', shutdown);
  cancelBtn.addEventListener('click', shutdown);
  dlg.addEventListener('close', () => dlg.remove());

  saveBtn.addEventListener('click', async () => {
    const ref = refIn.value.trim();
    const site = siteIn.value.trim();
    const status = statusIn.value.trim() || 'en cours';
    const score = parseInt(scoreIn.value, 10);
    if (!ref || !site || Number.isNaN(score)) {
      showToast('Référence, site et score valides requis', 'error');
      return;
    }
    const type = typeIn.value.trim();
    const plannedDate = dateIn.value.trim();
    const notes = notesIn.value.trim();
    const meta = {};
    if (type) meta.type = type;
    if (plannedDate) meta.plannedDate = plannedDate;
    if (notes) meta.notes = notes;
    const checklist = Object.keys(meta).length ? meta : undefined;

    saveBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref,
          site,
          score,
          status,
          checklist,
          ...(appState.activeSiteId ? { siteId: appState.activeSiteId } : {})
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          typeof body.error === 'string' ? body.error : 'Erreur création',
          'error'
        );
        return;
      }
      showToast(`Audit ${ref} enregistré.`, 'info');
      onSave?.(body);
      shutdown();
      activityLogStore.add({
        module: 'audits',
        action: 'Audit créé (formulaire)',
        detail: ref,
        user: su?.name || 'Utilisateur'
      });
    } catch (e) {
      console.error(e);
      showToast('Erreur serveur', 'error');
    } finally {
      saveBtn.disabled = !canAuditWrite && !!su;
    }
  });

  dlg.showModal();
}
