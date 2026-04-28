import { qhseFetch } from '../utils/qhseFetch.js';
import { applyNativeDialogColorScheme } from '../utils/nativeDialogTheme.js';
import { appState } from '../utils/state.js';
import { showToast } from './toast.js';
import { mergeActionOverlay, appendActionHistory } from '../utils/actionPilotageMock.js';
import { applyAssistantActionFormSuggestion } from '../utils/qhseAssistantFormSuggestions.js';

/**
 * @typedef {{ action?: object | null; id?: string; ref?: string | null; title?: string }} ActionCreatedPayload
 */

/**
 * Construit le payload passé à `onCreated` à partir de la réponse API et du formulaire.
 * @param {unknown} created : corps JSON POST /api/actions
 * @param {{ title: string }} formFallback
 * @returns {ActionCreatedPayload}
 */
function buildActionCreatedPayload(created, formFallback) {
  const action =
    created != null && typeof created === 'object' ? /** @type {Record<string, unknown>} */ (created) : null;
  const rawId = action?.id ?? action?._id;
  const id = rawId != null && String(rawId).trim() ? String(rawId).trim() : '';
  const rawRef = action?.ref ?? action?.reference ?? action?.actionRef ?? action?.code;
  const ref =
    rawRef != null && String(rawRef).trim() ? String(rawRef).trim() : null;
  const rawTitle = action?.title ?? formFallback.title;
  const title = rawTitle != null ? String(rawTitle).trim() : '';
  return {
    action: action || undefined,
    id,
    ref,
    title
  };
}

/**
 * @param {object} opts
 * @param {(payload?: ActionCreatedPayload) => void} [opts.onCreated]
 * @param {boolean} [opts.builtInSuccessToast=true] : toast « Action créée » si succès (mettre false si le parent gère tout le feedback).
 * @param {Array<{ id: string, name: string, role: string }>} opts.users
 * @param {Partial<{ title: string, origin: string, actionType: string, priority: string, description: string, dueDate: string, assigneeId: string, linkedRisk: string, linkedRiskId: string, linkedAudit: string, linkedIncident: string, status: string }>} [opts.defaults]
 */
export function openActionCreateDialog(opts) {
  const { onCreated, users = [], defaults = {}, builtInSuccessToast = true } = opts;

  const dialog = document.createElement('dialog');
  dialog.className = 'action-create-dialog';
  dialog.setAttribute('aria-labelledby', 'action-create-dialog-title');

  const inner = document.createElement('div');
  inner.className = 'action-create-dialog__inner';

  inner.innerHTML = `
    <h2 class="action-create-dialog__title" id="action-create-dialog-title">Nouvelle action</h2>
    <p class="action-create-dialog__lead">L’origine est obligatoire. L’assistant peut préremplir la description et la priorité pour gagner du temps sur le terrain.</p>
    <form class="action-create-dialog__form" id="action-create-form">
      <label>Titre *
        <input type="text" name="title" required maxlength="240" placeholder="Ex. Réduction dérive température cuve 3" />
      </label>
      <label>Origine * (pilotage)
        <select name="origin" required>
          <option value="">Choisir</option>
          <option value="risk">Risque</option>
          <option value="audit">Audit</option>
          <option value="incident">Incident</option>
          <option value="other">Autre / terrain</option>
        </select>
      </label>
      <label>Type *
        <select name="actionType" required>
          <option value="corrective">Corrective</option>
          <option value="preventive">Préventive</option>
          <option value="improvement">Amélioration</option>
        </select>
      </label>
      <label>Priorité
        <select name="priority">
          <option value="basse">Basse</option>
          <option value="normale" selected>Normale</option>
          <option value="haute">Haute</option>
          <option value="critique">Critique</option>
        </select>
      </label>
      <label>Description *
        <textarea name="description" required rows="5" placeholder="Contexte, périmètre, critère de clôture…"></textarea>
      </label>
      <div class="action-create-dialog__ia-row">
        <button type="button" class="btn btn-secondary" data-action="suggest-ia">Assistant QHSE : description &amp; priorité</button>
      </div>
      <label>Échéance
        <input type="date" name="dueDate" />
      </label>
      <label>Responsable
        <select name="assigneeId">
          <option value="">À assigner</option>
        </select>
      </label>
      <label>Risque lié (référence)
        <input type="text" name="linkedRisk" placeholder="Ex. Renversement engin" maxlength="200" />
      </label>
      <label>Audit lié (référence)
        <input type="text" name="linkedAudit" placeholder="Ex. AUD-2026-04" maxlength="120" />
      </label>
      <label>Incident lié (référence)
        <input type="text" name="linkedIncident" placeholder="Ex. INC-204" maxlength="120" />
      </label>
      <label>Statut initial
        <select name="status">
          <option value="À lancer" selected>À lancer</option>
          <option value="En cours">En cours</option>
        </select>
      </label>
      <div class="action-create-dialog__actions">
        <button type="submit" class="btn btn-primary">Créer l’action</button>
        <button type="button" class="btn btn-secondary" data-action="cancel">Annuler</button>
      </div>
    </form>
  `;

  dialog.append(inner);
  document.body.append(dialog);

  const form = inner.querySelector('#action-create-form');
  const assigneeSel = form.querySelector('[name="assigneeId"]');
  users.forEach((u) => {
    const o = document.createElement('option');
    o.value = u.id;
    o.textContent = `${u.name} (${u.role})`;
    assigneeSel.append(o);
  });

  const d = defaults;
  if (d.title != null && String(d.title).trim()) form.title.value = String(d.title).trim();
  if (d.origin) form.origin.value = String(d.origin);
  if (d.actionType) form.actionType.value = String(d.actionType);
  if (d.priority) form.querySelector('[name="priority"]').value = String(d.priority);
  if (d.description != null && String(d.description).trim()) {
    form.description.value = String(d.description).trim();
  }
  if (d.dueDate) form.querySelector('[name="dueDate"]').value = String(d.dueDate);
  if (d.assigneeId != null) assigneeSel.value = String(d.assigneeId);
  if (d.linkedRisk != null) form.linkedRisk.value = String(d.linkedRisk);
  // linkedRiskId: utilisé pour créer un lien DB explicite (Action.riskId) quand disponible.
  const linkedRiskId =
    d.linkedRiskId != null && String(d.linkedRiskId).trim() ? String(d.linkedRiskId).trim() : '';
  if (d.linkedAudit != null) form.linkedAudit.value = String(d.linkedAudit);
  if (d.linkedIncident != null) form.linkedIncident.value = String(d.linkedIncident);
  if (d.status) form.querySelector('[name="status"]').value = String(d.status);

  inner.querySelector('[data-action="suggest-ia"]').addEventListener('click', () => {
    const r = applyAssistantActionFormSuggestion(form);
    if (!r.ok) {
      showToast(r.message || 'Complétez le formulaire pour l’assistant.', 'info');
      return;
    }
    showToast('Assistant QHSE : description et priorité proposées. Contrôle terrain obligatoire.', 'info');
  });

  inner.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    dialog.close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const origin = String(fd.get('origin') || '').trim();
    const actionType = String(fd.get('actionType') || '').trim();
    const priority = String(fd.get('priority') || 'normale').trim();
    const status = String(fd.get('status') || 'À lancer').trim();
    const dueRaw = fd.get('dueDate');
    const assigneeId = String(fd.get('assigneeId') || '').trim();
    const linkedRisk = String(fd.get('linkedRisk') || '').trim();
    const linkedAudit = String(fd.get('linkedAudit') || '').trim();
    const linkedIncident = String(fd.get('linkedIncident') || '').trim();

    if (!title || !description || !origin) {
      showToast('Titre, description et origine sont obligatoires.', 'info');
      return;
    }

    const assignee = users.find((u) => u.id === assigneeId);
    const owner = assignee ? assignee.name : 'À assigner';

    const body = {
      title,
      detail: description,
      status,
      owner
    };
    if (linkedRiskId) body.riskId = linkedRiskId;
    if (assigneeId) body.assigneeId = assigneeId;
    if (dueRaw) {
      const d = new Date(String(dueRaw));
      if (!Number.isNaN(d.getTime())) body.dueDate = d.toISOString();
    }
    if (appState.activeSiteId) body.siteId = appState.activeSiteId;

    try {
      const res = await qhseFetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        let msg = 'Erreur serveur';
        try {
          const errBody = await res.json();
          if (errBody.error) msg = errBody.error;
        } catch {
          /* ignore */
        }
        showToast(msg, 'error');
        return;
      }
      const created = await res.json();
      const payload = buildActionCreatedPayload(created, { title });
      const id = payload.id;
      if (id) {
        mergeActionOverlay(id, {
          actionType,
          origin,
          priority,
          progressPct: 0,
          linkedRisk: linkedRisk || undefined,
          linkedAudit: linkedAudit || undefined,
          linkedIncident: linkedIncident || undefined,
          comments: [],
          history: []
        });
        appendActionHistory(id, 'Action créée depuis le plan d’actions (pilotage).');
      }
      dialog.close();
      try {
        if (typeof onCreated === 'function') {
          onCreated(payload);
        }
      } catch (cbErr) {
        console.error('[actionCreateDialog] onCreated', cbErr);
      }
      if (builtInSuccessToast) {
        showToast('Action créée', 'success');
      }
    } catch (err) {
      console.error('[actions] create', err);
      showToast('Erreur serveur', 'error');
    }
  });

  dialog.addEventListener('close', () => dialog.remove());
  applyNativeDialogColorScheme(dialog);
  dialog.showModal();
  requestAnimationFrame(() => {
    const firstField = form?.querySelector?.('[name="title"]');
    if (firstField instanceof HTMLElement) firstField.focus();
    else inner.querySelector('button[type="submit"]')?.focus?.();
  });
}
