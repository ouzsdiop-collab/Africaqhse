import { riskTierFromGp, riskLevelLabelFromTier } from '../utils/riskMatrixCore.js';
import { showToast } from './toast.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { pushCustomRiskTitle } from '../utils/riskIncidentLinks.js';
import { suggestRiskCausesImpacts } from '../utils/qhseAssistantFormSuggestions.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const CATEGORY_OPTIONS = ['Sécurité', 'Environnement', 'Qualité'];
const LEVEL_OPTIONS = [
  { value: 'élevée', label: 'Élevée' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'faible', label: 'Faible' }
];

const RISK_AI_DISCLAIMER =
  'Suggestions basées sur analyse automatique. À vérifier avant toute décision.';

/** @param {string} severity @param {string} probability */
function levelsToRegisterMeta(severity, probability) {
  const gMap = { élevée: 5, moyenne: 3, faible: 2 };
  const pMap = { élevée: 4, moyenne: 3, faible: 2 };
  const G = gMap[severity] ?? 3;
  const P = pMap[probability] ?? 3;
  const tier = riskTierFromGp(G, P);
  const status = riskLevelLabelFromTier(tier);
  const tone = tier >= 5 ? 'red' : tier >= 3 ? 'amber' : 'blue';
  return { meta: `G${G} × P${P}`, tone, status };
}

function defaultTitleFromDescription(text) {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return 'Nouveau risque';
  return t.length <= 72 ? t : `${t.slice(0, 69)}…`;
}

/**
 * Suggestion locale si l’API d’analyse est indisponible, toujours validée par l’utilisateur.
 * @param {string} description
 */
function suggestRiskFromDescriptionLocal(description) {
  const d = String(description).toLowerCase();
  let category = 'Sécurité';
  if (/hydrocarbure|pollution|eau|déchets|bassin|rétention|environnement/.test(d)) {
    category = 'Environnement';
  } else if (/qualité|non-conform|procédure|lot|conditionnement|contrôle/.test(d)) {
    category = 'Qualité';
  }
  return {
    category,
    severity: 'moyenne',
    probability: 'moyenne',
    suggestedActions: [
      'Consigner la mesure de maîtrise dans le registre après validation terrain.',
      'Vérifier la cohérence avec les exigences ISO 45001 / 14001 applicables au site.'
    ],
    causes: 'À préciser après observation (suggestion automatique, non contractuelle).',
    impacts: 'À évaluer selon le contexte opérationnel local (suggestion automatique).'
  };
}

function levelLabel(v) {
  const o = LEVEL_OPTIONS.find((x) => x.value === v);
  return o ? o.label : v;
}

/**
 * @param {object} opts
 * @param {(data: { title: string, detail: string, status: string, tone: string, meta: string }) => void} opts.onSaved : liste locale (pas d’API persistance)
 * @param {{ title?: string, description?: string, category?: string }} [opts.defaults]
 */
export function openRiskCreateDialog({ onSaved, defaults = {} } = {}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'risks-create-dialog';

  const inner = document.createElement('div');
  inner.className = 'risks-create-dialog__inner';

  inner.innerHTML = `
    <h2 class="risks-create-dialog__head">Nouvelle fiche risque</h2>
    <p class="risks-create-dialog__lead">
      Registre QHSE (ISO 45001 / ISO 14001) : décrivez le risque opérationnel. L’assistant propose des éléments à valider. Vous gardez le contrôle avant tout enregistrement.
    </p>
    <form class="risks-form-grid" id="risks-create-form">
      <label>Type *
        <select name="category" required>${CATEGORY_OPTIONS.map(
          (c) => `<option value="${c}">${c}</option>`
        ).join('')}</select>
      </label>
      <label>Libellé court
        <input type="text" name="title" autocomplete="off" maxlength="240" placeholder="Ex. Chute hauteur zone concassage" />
      </label>
      <label>Description du risque *
        <textarea name="description" required placeholder="Contexte, exposition, situation terrain…"></textarea>
      </label>
      <div class="risks-form-actions-row">
        <button type="button" class="btn btn-secondary" data-action="analyze">Suggestion automatique (causes / impacts / G·P)</button>
        <button type="button" class="btn btn-secondary" data-action="assistant-causes">Causes &amp; impacts (assistant local)</button>
      </div>
      <div class="risks-ai-panel" id="risks-ai-panel" hidden>
        <p class="risks-ai-panel__disclaimer" id="risks-ai-disclaimer"></p>
        <div class="risks-ai-panel__kv" id="risks-ai-kv"></div>
        <ul class="risks-ai-panel__list" id="risks-ai-actions"></ul>
        <div class="risks-ai-panel__actions">
          <button type="button" class="btn btn-primary" data-action="apply-suggestions">Copier dans le formulaire (validation requise)</button>
          <button type="button" class="btn btn-secondary" data-action="ignore-suggestions">Masquer</button>
        </div>
      </div>
      <label>Gravité estimée
        <select name="severity">${LEVEL_OPTIONS.map(
          (o) => `<option value="${o.value}">${o.label}</option>`
        ).join('')}</select>
      </label>
      <label>Probabilité estimée
        <select name="probability">${LEVEL_OPTIONS.map(
          (o) => `<option value="${o.value}">${o.label}</option>`
        ).join('')}</select>
      </label>
      <label>Actions recommandées (modifiable)
        <textarea name="actions" placeholder="Une mesure par ligne (vous pouvez compléter ou supprimer)."></textarea>
      </label>
      <label class="risks-form-confirm-row">
        <input type="checkbox" name="confirm_review" value="1" />
        <span>Je confirme avoir relu les champs et suggestions avant validation</span>
      </label>
      <div class="risks-form-actions-row" style="margin-top:18px">
        <button type="submit" class="btn btn-primary">Valider et ajouter au registre (local)</button>
        <button type="button" class="btn btn-secondary" data-action="close">Annuler</button>
      </div>
    </form>
  `;

  dialog.append(inner);
  document.body.append(dialog);

  const form = inner.querySelector('#risks-create-form');
  const d = defaults;
  if (d.title != null && String(d.title).trim()) {
    form.querySelector('[name="title"]').value = String(d.title).trim();
  }
  if (d.description != null && String(d.description).trim()) {
    form.querySelector('[name="description"]').value = String(d.description).trim();
  }
  if (d.category && CATEGORY_OPTIONS.includes(d.category)) {
    form.querySelector('[name="category"]').value = d.category;
  }
  const panel = inner.querySelector('#risks-ai-panel');
  const disclaimerEl = inner.querySelector('#risks-ai-disclaimer');
  const kvHost = inner.querySelector('#risks-ai-kv');
  const actionsList = inner.querySelector('#risks-ai-actions');

  /** @type {{ category: string, severity: string, probability: string, suggestedActions: string[], causes?: string, impacts?: string, provider?: string } | null} */
  let pendingSuggestion = null;

  function hidePanel() {
    panel.hidden = true;
    panel.classList.remove('risks-ai-panel--loading');
    pendingSuggestion = null;
    if (disclaimerEl) disclaimerEl.textContent = RISK_AI_DISCLAIMER;
    kvHost.replaceChildren();
    actionsList.replaceChildren();
  }

  function renderSuggestion(data) {
    pendingSuggestion = data;
    if (disclaimerEl) {
      const src =
        data.provider === 'openai'
          ? 'Suggestion produite par modèle distant (OpenAI). Validation humaine obligatoire avant enregistrement.'
          : RISK_AI_DISCLAIMER;
      disclaimerEl.textContent = src;
    }
    const sevOk = LEVEL_OPTIONS.some((o) => o.value === data.severity);
    const probOk = LEVEL_OPTIONS.some((o) => o.value === data.probability);
    const metaReg = levelsToRegisterMeta(
      sevOk ? data.severity : 'moyenne',
      probOk ? data.probability : 'moyenne'
    );
    const extraCauses =
      data.causes != null
        ? `<div><span>Causes (suggestion)</span><strong>${escapeHtml(String(data.causes))}</strong></div>`
        : '';
    const extraImpacts =
      data.impacts != null
        ? `<div><span>Impacts (suggestion)</span><strong>${escapeHtml(String(data.impacts))}</strong></div>`
        : '';
    kvHost.innerHTML = `
      <div><span>Type suggéré</span><strong>${escapeHtml(data.category)}</strong></div>
      <div><span>Gravité (suggestion)</span><strong>${escapeHtml(levelLabel(data.severity))}</strong></div>
      <div><span>Probabilité (suggestion)</span><strong>${escapeHtml(levelLabel(data.probability))}</strong></div>
      <div><span>Criticité indicielle</span><strong>${escapeHtml(metaReg.status)} · ${escapeHtml(metaReg.meta)}</strong></div>
      ${extraCauses}${extraImpacts}
    `;
    actionsList.replaceChildren();
    (data.suggestedActions || []).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      actionsList.append(li);
    });
    panel.hidden = false;
  }

  inner.querySelector('[data-action="assistant-causes"]')?.addEventListener('click', () => {
    const cat = form.category.value;
    const titleEl = form.querySelector('[name="title"]');
    const title = titleEl?.value?.trim() || 'Risque';
    const desc = form.description.value.trim();
    const { causes, impacts } = suggestRiskCausesImpacts(cat, title, desc);
    const block = `\n\nCauses (assistant local)\n${causes}\n\nImpacts (assistant local)\n${impacts}`;
    form.description.value = desc ? `${desc}${block}` : block.trim();
    showToast('Causes et impacts ajoutés dans la description. Relisez avant validation.', 'info');
  });

  inner.querySelector('[data-action="analyze"]').addEventListener('click', async () => {
    const desc = form.description.value.trim();
    if (!desc) {
      showToast('Saisissez une description pour lancer l’analyse.', 'info');
      form.description.focus();
      return;
    }
    panel.hidden = false;
    panel.classList.add('risks-ai-panel--loading');
    if (disclaimerEl) disclaimerEl.textContent = 'Analyse en cours…';
    kvHost.replaceChildren();
    actionsList.replaceChildren();
    try {
      const res = await qhseFetch('/api/risks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        panel.classList.remove('risks-ai-panel--loading');
        renderSuggestion(suggestRiskFromDescriptionLocal(desc));
        showToast('Suggestion locale. Serveur indisponible (à valider).', 'info');
        return;
      }
      if (
        !body.category ||
        !body.severity ||
        !body.probability ||
        !Array.isArray(body.suggestedActions)
      ) {
        panel.classList.remove('risks-ai-panel--loading');
        renderSuggestion(suggestRiskFromDescriptionLocal(desc));
        showToast('Réponse incomplète. Suggestion locale affichée.', 'info');
        return;
      }
      panel.classList.remove('risks-ai-panel--loading');
      renderSuggestion({
        category: body.category,
        severity: body.severity,
        probability: body.probability,
        suggestedActions: body.suggestedActions,
        causes: body.causes,
        impacts: body.impacts,
        provider: body.provider
      });
      if (body.provider === 'openai') {
        showToast('Analyse enrichie par le modèle distant. Relisez tous les champs.', 'info');
      }
    } catch (err) {
      console.error('[risks] POST /api/risks/analyze', err);
      panel.classList.remove('risks-ai-panel--loading');
      renderSuggestion(suggestRiskFromDescriptionLocal(desc));
      showToast('Mode hors ligne : suggestion locale (à valider).', 'info');
    }
  });

  inner.querySelector('[data-action="apply-suggestions"]').addEventListener('click', () => {
    if (!pendingSuggestion) {
      showToast('Lancez d’abord une analyse.', 'info');
      return;
    }
    const { category, severity, probability, suggestedActions } = pendingSuggestion;
    form.category.value = CATEGORY_OPTIONS.includes(category) ? category : 'Sécurité';
    form.severity.value = LEVEL_OPTIONS.some((o) => o.value === severity) ? severity : 'moyenne';
    form.probability.value = LEVEL_OPTIONS.some((o) => o.value === probability)
      ? probability
      : 'moyenne';
    form.actions.value = suggestedActions.join('\n');
    showToast('Suggestions copiées dans le formulaire. Contrôle humain obligatoire avant validation.', 'info');
  });

  inner.querySelector('[data-action="ignore-suggestions"]').addEventListener('click', () => {
    hidePanel();
  });

  inner.querySelector('[data-action="close"]').addEventListener('click', () => {
    dialog.close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.confirm_review.checked) {
      showToast('Cochez la confirmation de relecture pour enregistrer la fiche.', 'info');
      return;
    }
    const description = form.description.value.trim();
    if (!description) {
      showToast('La description est obligatoire.', 'info');
      return;
    }
    let title = form.title.value.trim();
    if (!title) title = defaultTitleFromDescription(description);

    const severity = form.severity.value;
    const probability = form.probability.value;
    const actionsText = form.actions.value.trim();
    const cat = form.category.value;
    let detail = description;
    if (cat) detail = `${description}\n\n(Type : ${cat})`;
    if (actionsText.length > 0) {
      detail = `${detail}\n\nMesures envisagées\n${actionsText}`;
    }

    const { meta, tone, status } = levelsToRegisterMeta(severity, probability);
    const rowData = {
      title,
      type: cat,
      detail,
      status,
      tone,
      meta,
      responsible: 'À désigner',
      actionLinked: null,
      pilotageState: 'actif',
      updatedAt: new Date().toISOString().slice(0, 10),
      trend: 'stable'
    };
    pushCustomRiskTitle(title);
    try {
      await Promise.resolve(onSaved?.(rowData));
      dialog.close();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Création du risque impossible.', 'error');
    }
  });

  dialog.addEventListener('close', () => {
    dialog.remove();
  });

  dialog.showModal();
}
