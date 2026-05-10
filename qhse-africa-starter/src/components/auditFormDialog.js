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
.qhse-audit-form-ai{margin-top:14px;padding-top:14px;border-top:1px solid var(--color-border, rgba(148,163,184,.18))}
.qhse-audit-form-ai__row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.qhse-audit-form-ai__hint{margin:0;font-size:12px;color:var(--text3);max-width:58ch}
html[data-theme='light'] .qhse-audit-form-dialog{
  border:1px solid rgba(15,23,42,.16);
  background:linear-gradient(180deg,var(--surface-1,#fff) 0%,var(--surface-2,#f8fafc) 100%);
  color:var(--color-text-primary,#0f172a);
  box-shadow:0 18px 44px -24px rgba(15,23,42,.34);
}
html[data-theme='light'] .qhse-audit-form-dialog::backdrop{background:rgba(15,23,42,.34)}
html[data-theme='light'] .qhse-audit-form-dialog__head{
  border-bottom:1px solid rgba(15,23,42,.12);
  padding-bottom:10px;
}
html[data-theme='light'] .qhse-audit-form-ai{
  border-top-color:rgba(15,23,42,.14);
}
html[data-theme='light'] .qhse-audit-form-ai__hint{color:var(--color-text-secondary,#334155)}
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
  const { onSave, canAuditWrite = true, su = null, defaults = null } = opts;
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
      <label class="field field-full"><span>Grille assistée (modifiable)</span><textarea class="control-input qhse-audit-f-ai-grid" rows="3" autocomplete="off" placeholder="Générée via le bouton d’assistance, puis relue et éditée avant enregistrement."></textarea></label>
      <label class="field"><span>Score (0–100)</span><input type="number" min="0" max="100" class="control-input qhse-audit-f-score" value="70" /></label>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">
      <button type="button" class="btn btn-primary qhse-audit-f-save">Enregistrer</button>
      <button type="button" class="btn btn-secondary qhse-audit-f-cancel">Annuler</button>
    </div>
    <div class="qhse-audit-form-ai">
      <div class="qhse-audit-form-ai__row">
        <div>
          <div style="display:inline-flex;align-items:center;gap:8px;padding:3px 10px;border-radius:999px;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.08);font-size:12px;font-weight:900">
            <span style="width:7px;height:7px;border-radius:999px;background:#38bdf8"></span>
            Suggestion assistée à valider
          </div>
          <p class="qhse-audit-form-ai__hint">Optionnel : générer des questions / points de contrôle selon le type d’audit. Rien n’est créé tant que vous n’enregistrez pas.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm qhse-audit-f-ai">Générer grille assistée</button>
      </div>
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
  const aiGridIn = inner.querySelector('.qhse-audit-f-ai-grid');
  const scoreIn = inner.querySelector('.qhse-audit-f-score');
  const saveBtn = inner.querySelector('.qhse-audit-f-save');
  const cancelBtn = inner.querySelector('.qhse-audit-f-cancel');
  const closeBtn = inner.querySelector('.qhse-audit-form-close');
  const aiBtn = inner.querySelector('.qhse-audit-f-ai');

  if (!canAuditWrite && su) {
    saveBtn.disabled = true;
    saveBtn.title = 'Création réservée';
  }

  // Préfill (ex: suggestion IA) — jamais d'enregistrement automatique.
  if (defaults && typeof defaults === 'object') {
    const d = /** @type {Record<string, unknown>} */ (defaults);
    if (d.ref != null && String(d.ref).trim()) refIn.value = String(d.ref).trim();
    if (d.type != null && String(d.type).trim()) typeIn.value = String(d.type).trim();
    if (d.site != null && String(d.site).trim()) siteIn.value = String(d.site).trim();
    if (d.plannedDate != null && String(d.plannedDate).trim()) dateIn.value = String(d.plannedDate).trim();
    if (d.status != null && String(d.status).trim()) statusIn.value = String(d.status).trim();
    if (d.notes != null && String(d.notes).trim()) notesIn.value = String(d.notes).trim();
    if (d.aiGrid != null && String(d.aiGrid).trim()) aiGridIn.value = String(d.aiGrid).trim();
    if (d.score != null && String(d.score).trim()) scoreIn.value = String(d.score).trim();
  }

  function shutdown() {
    dlg.close();
  }

  closeBtn.addEventListener('click', shutdown);
  cancelBtn.addEventListener('click', shutdown);
  dlg.addEventListener('close', () => dlg.remove());

  aiBtn?.addEventListener('click', async () => {
    const type = typeIn.value.trim() || 'interne';
    aiBtn.disabled = true;
    aiBtn.textContent = 'Assist…';
    try {
      const res = await qhseFetch('/api/ai/audit-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditType: type })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('Assistance indisponible pour ce type. Relancez ou renseignez manuellement.', 'warning');
        return;
      }
      const structured = body?.structured && typeof body.structured === 'object' ? body.structured : null;
      const suggestion = typeof body?.suggestion === 'string' ? body.suggestion : '';
      if (!structured && !suggestion) {
        showToast('Réponse vide. Relancez ou renseignez manuellement.', 'warning');
        return;
      }
      const { openAiStructuredValidationDialog } = await import('./aiStructuredValidationDialog.js');
      openAiStructuredValidationDialog({
        title: `Audit (${type}) : grille suggérée`,
        ai: { structured: structured || { type: 'audit_analysis', confidence: 0.5, content: {} }, suggestionText: suggestion },
        onValidate: async ({ summary, recommendedActionsText }) => {
          // Validation humaine: on injecte dans "Grille IA" (édition possible avant Enregistrer).
          const block = [
            '---',
            'Grille ou questions assistées (à valider) :',
            summary ? `Résumé: ${summary}` : '',
            recommendedActionsText ? `Points:\n${recommendedActionsText}` : '',
            '---'
          ]
            .filter(Boolean)
            .join('\n');
          const prev = String(aiGridIn.value || '').trim();
          aiGridIn.value = prev ? `${prev}\n\n${block}` : block;
          showToast('Grille assistée copiée. Relisez avant enregistrement.', 'info');
        }
      });
    } catch (e) {
      console.error(e);
      showToast('IA indisponible. Relancez ou saisissez manuellement.', 'error');
    } finally {
      aiBtn.disabled = false;
      aiBtn.textContent = 'Générer grille assistée';
    }
  });

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
    const aiGrid = aiGridIn.value.trim();
    const meta = {};
    if (type) meta.type = type;
    if (plannedDate) meta.plannedDate = plannedDate;
    if (notes) meta.notes = notes;
    if (aiGrid) meta.aiGrid = aiGrid;
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
