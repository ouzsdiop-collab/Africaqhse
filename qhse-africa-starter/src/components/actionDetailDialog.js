import { getApiBase } from '../config.js';
import { applyNativeDialogColorScheme } from '../utils/nativeDialogTheme.js';
import {
  addActionComment,
  appendActionHistory,
  ensureDefaultOverlayFromRow,
  getActionOverlay,
  getResolvedActionType,
  mergeActionOverlay
} from '../utils/actionPilotageMock.js';
import { showToast } from './toast.js';

function formatDue(iso) {
  if (!iso) return 'Non disponible';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Non disponible';
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Non disponible';
  }
}

function formatIsoShort(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '';
  }
}

const TYPE_LABELS = {
  corrective: 'Corrective',
  preventive: 'Préventive',
  improvement: 'Amélioration'
};

const ORIGIN_LABELS = {
  risk: 'Risque',
  audit: 'Audit',
  incident: 'Incident',
  other: 'Autre'
};

const PRIO_LABELS = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  critique: 'Critique'
};

/**
 * Fiche action (modal pilotage QHSE) : champs API + compléments session locale.
 * @param {{ onRefresh?: () => void, getUserName?: () => string }} [opts]
 */
export function createActionDetailDialog(opts = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = 'action-detail-dialog action-detail-dialog--pilotage';
  dlg.setAttribute('aria-labelledby', 'action-detail-dialog-title');

  const inner = document.createElement('div');
  inner.className = 'action-detail-dialog__inner';

  inner.innerHTML = `
    <div class="action-detail-dialog__head">
      <h2 class="action-detail-dialog__title" id="action-detail-dialog-title" data-ad-title></h2>
      <button type="button" class="btn btn-secondary action-detail-dialog__close" aria-label="Fermer">Fermer</button>
    </div>
    <div class="action-detail-dialog__badges" data-ad-badges></div>
    <div class="action-detail-dialog__prio-badge-host" data-ad-prio-vis></div>
    <dl class="action-detail-dialog__grid action-detail-dialog__grid--pilotage">
      <dt>Type</dt><dd data-ad-type-wrap></dd>
      <dt>Origine</dt><dd data-ad-origin></dd>
      <dt>Statut</dt><dd data-ad-status></dd>
      <dt>Priorité</dt><dd data-ad-priority></dd>
      <dt>Responsable</dt><dd data-ad-owner></dd>
      <dt>Échéance</dt><dd data-ad-due></dd>
      <dt>Avancement</dt><dd data-ad-progress-wrap></dd>
      <dt>Identifiant</dt><dd><code class="action-detail-dialog__id" data-ad-id></code></dd>
      <dt>API</dt><dd class="action-detail-dialog__api"><code data-ad-api></code></dd>
    </dl>
    <div class="action-detail-dialog__block" data-ad-links-block>
      <div class="action-detail-dialog__block-label">Liaisons et rattachements</div>
      <dl class="action-detail-dialog__grid action-detail-dialog__grid--links">
        <dt>Risque lié</dt><dd data-ad-risk></dd>
        <dt>Audit lié</dt><dd data-ad-audit></dd>
        <dt>Incident lié</dt><dd data-ad-incident></dd>
      </dl>
    </div>
    <div class="action-detail-dialog__block">
      <div class="action-detail-dialog__block-label">Description</div>
      <p class="action-detail-dialog__detail" data-ad-detail></p>
    </div>
    <div class="action-detail-dialog__block">
      <div class="action-detail-dialog__block-label">Commentaires</div>
      <ul class="action-detail-dialog__comments" data-ad-comments></ul>
      <div class="action-detail-dialog__comment-form" data-ad-comment-form>
        <label class="visually-hidden" for="action-ad-comment-input">Nouveau commentaire</label>
        <textarea id="action-ad-comment-input" class="action-detail-dialog__textarea" rows="2" placeholder="Ajouter une note de suivi…"></textarea>
        <button type="button" class="btn btn-primary btn--sm" data-ad-add-comment>Ajouter commentaire</button>
      </div>
    </div>
    <div class="action-detail-dialog__block">
      <div class="action-detail-dialog__block-label">Historique</div>
      <ul class="action-detail-dialog__history" data-ad-history></ul>
    </div>
    <div class="action-detail-dialog__foot">
      <button type="button" class="btn btn-secondary" data-ad-edit>Modifier</button>
      <button type="button" class="btn btn-secondary" data-ad-copy>Copier l’identifiant</button>
    </div>
  `;

  dlg.append(inner);
  document.body.append(dlg);

  let currentRow = null;
  let currentColumnKey = '';
  let currentActionId = '';
  let editMode = false;

  const progressWrap = inner.querySelector('[data-ad-progress-wrap]');
  const commentInput = inner.querySelector('#action-ad-comment-input');

  function close() {
    dlg.close();
  }

  inner.querySelector('.action-detail-dialog__close').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  inner.querySelector('[data-ad-copy]').addEventListener('click', async () => {
    const id = inner.querySelector('[data-ad-id]')?.textContent?.trim() || '';
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      showToast('Identifiant copié', 'info');
    } catch {
      /* ignore */
    }
  });

  inner.querySelector('[data-ad-edit]').addEventListener('click', () => {
    editMode = !editMode;
    inner.classList.toggle('action-detail-dialog--edit', editMode);
    showToast(
      editMode
        ? 'Mode édition : liaisons et avancement enregistrés localement (session).'
        : 'Lecture seule.',
      'info'
    );
    if (currentRow && currentActionId) renderProgressControl(currentRow, currentActionId);
    renderLinkEditors(currentActionId);
  });

  inner.querySelector('[data-ad-add-comment]').addEventListener('click', () => {
    const t = commentInput?.value?.trim();
    if (!t || !currentActionId) {
      showToast('Saisissez un commentaire.', 'info');
      return;
    }
    const user = opts.getUserName?.() || 'Utilisateur';
    addActionComment(currentActionId, t, user);
    appendActionHistory(currentActionId, `Commentaire ajouté par ${user}`);
    commentInput.value = '';
    fillCommentsHistory(currentActionId);
    showToast('Commentaire enregistré (stockage local).', 'success');
    opts.onRefresh?.();
  });

  function renderLinkEditors(actionId) {
    const o = getActionOverlay(actionId);
    const riskEl = inner.querySelector('[data-ad-risk]');
    const auditEl = inner.querySelector('[data-ad-audit]');
    const incEl = inner.querySelector('[data-ad-incident]');
    if (!riskEl || !auditEl || !incEl) return;
    if (!editMode) {
      riskEl.textContent = o.linkedRisk?.trim() || 'Non renseigné';
      auditEl.textContent = o.linkedAudit?.trim() || 'Non renseigné';
      const incApi = currentRow?.incident?.ref || currentRow?.incidentId || '';
      incEl.textContent =
        o.linkedIncident?.trim() || (incApi ? String(incApi) : 'Non renseigné');
      return;
    }
    riskEl.replaceChildren();
    auditEl.replaceChildren();
    incEl.replaceChildren();
    const mk = (val, key) => {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'action-detail-dialog__field-input';
      inp.value = val;
      inp.placeholder = 'Non renseigné';
      inp.addEventListener('change', () => {
        mergeActionOverlay(actionId, { [key]: inp.value.trim() });
        appendActionHistory(actionId, `Mise à jour liaison ${key}`);
        opts.onRefresh?.();
      });
      return inp;
    };
    riskEl.append(mk(o.linkedRisk || '', 'linkedRisk'));
    auditEl.append(mk(o.linkedAudit || '', 'linkedAudit'));
    incEl.append(mk(o.linkedIncident || '', 'linkedIncident'));
  }

  function renderProgressControl(row, actionId) {
    progressWrap.replaceChildren();
    const o = getActionOverlay(actionId);
    const pct = Math.min(100, Math.max(0, Number(o.progressPct) || 0));
    if (!editMode) {
      const span = document.createElement('span');
      span.textContent = `${pct} %`;
      span.title = 'Avancement indicatif (pilotage local)';
      progressWrap.append(span);
      return;
    }
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = String(pct);
    range.className = 'action-detail-dialog__range';
    const out = document.createElement('span');
    out.className = 'action-detail-dialog__range-val';
    out.textContent = `${pct} %`;
    range.addEventListener('input', () => {
      out.textContent = `${range.value} %`;
    });
    range.addEventListener('change', () => {
      mergeActionOverlay(actionId, { progressPct: Number(range.value) || 0 });
      appendActionHistory(actionId, `Avancement ${range.value} %`);
      opts.onRefresh?.();
    });
    progressWrap.append(range, out);
  }

  function fillCommentsHistory(actionId) {
    const o = getActionOverlay(actionId);
    const ulC = inner.querySelector('[data-ad-comments]');
    const ulH = inner.querySelector('[data-ad-history]');
    ulC.replaceChildren();
    ulH.replaceChildren();
    (o.comments || []).forEach((c) => {
      const li = document.createElement('li');
      li.className = 'action-detail-dialog__comment-li';
      const meta = document.createElement('span');
      meta.className = 'action-detail-dialog__comment-meta';
      meta.textContent = `${formatIsoShort(c.at)} · ${c.user || 'Non renseigné'}`;
      const tx = document.createElement('span');
      tx.className = 'action-detail-dialog__comment-text';
      tx.textContent = c.text;
      li.append(meta, tx);
      ulC.append(li);
    });
    if (!o.comments?.length) {
      const li = document.createElement('li');
      li.className = 'action-detail-dialog__empty-li';
      li.textContent = 'Aucun commentaire. Utilisez le champ ci-dessous.';
      ulC.append(li);
    }
    (o.history || []).slice().reverse().forEach((h) => {
      const li = document.createElement('li');
      li.className = 'action-detail-dialog__hist-li';
      li.textContent = `${formatIsoShort(h.at)} : ${h.line}`;
      ulH.append(li);
    });
    if (!o.history?.length) {
      const li = document.createElement('li');
      li.className = 'action-detail-dialog__empty-li';
      li.textContent = 'Aucun événement. Les changements locaux apparaîtront ici.';
      ulH.append(li);
    }
  }

  return {
    element: dlg,
    /**
     * @param {object} row : ligne API action
     * @param {string} [columnKey] : todo | doing | overdue | done
     */
    show(row, columnKey) {
      if (!row) return;
      currentRow = row;
      currentColumnKey = columnKey || '';
      currentActionId = String(row.id || '');
      editMode = false;
      inner.classList.remove('action-detail-dialog--edit');

      ensureDefaultOverlayFromRow(row, currentActionId);
      const o = getActionOverlay(currentActionId);

      const title = String(row.title || 'Action').trim() || 'Action';
      const status = String(row.status || 'Non disponible').trim();
      const resp =
        row.assignee?.name != null && String(row.assignee.name).trim()
          ? String(row.assignee.name).trim()
          : String(row.owner || 'Non renseigné').trim();
      const due = formatDue(row.dueDate);
      const id = currentActionId;
      const detail =
        row.detail != null && String(row.detail).trim()
          ? String(row.detail).trim()
          : 'Non disponible';

      inner.querySelector('[data-ad-title]').textContent = title;
      inner.querySelector('[data-ad-status]').textContent = status;
      inner.querySelector('[data-ad-owner]').textContent = resp;
      inner.querySelector('[data-ad-due]').textContent = due;
      inner.querySelector('[data-ad-id]').textContent = id;
      inner.querySelector('[data-ad-detail]').textContent = detail;
      inner.querySelector('[data-ad-api]').textContent = `${getApiBase()}/api/actions`;

      const typeWrap = inner.querySelector('[data-ad-type-wrap]');
      typeWrap.replaceChildren();
      const resolvedType = getResolvedActionType(row, currentActionId);
      const typeBadge = document.createElement('span');
      typeBadge.className = `action-detail-type-badge action-detail-type-badge--${resolvedType}`;
      typeBadge.textContent = TYPE_LABELS[resolvedType] || TYPE_LABELS.corrective;
      typeBadge.title =
        'Type d’action (corrective / préventive / amélioration) : pilotage ISO 45001 / 14001.';
      typeWrap.append(typeBadge);
      inner.querySelector('[data-ad-origin]').textContent =
        ORIGIN_LABELS[o.origin] || ORIGIN_LABELS.other;
      inner.querySelector('[data-ad-priority]').textContent =
        PRIO_LABELS[o.priority] || PRIO_LABELS.normale;

      const badges = inner.querySelector('[data-ad-badges]');
      badges.replaceChildren();
      const col = currentColumnKey || '';
      const addBadge = (text, mod) => {
        const s = document.createElement('span');
        s.className = `action-detail-dialog__pill ${mod || ''}`.trim();
        s.textContent = text;
        badges.append(s);
      };
      if (col === 'overdue') addBadge('Priorité : retard', 'action-detail-dialog__pill--danger');
      else if (col === 'doing') addBadge('En cours', 'action-detail-dialog__pill--warn');
      else if (col === 'todo') addBadge('À lancer', 'action-detail-dialog__pill--info');
      else if (col === 'done') addBadge('Terminé', 'action-detail-dialog__pill--ok');

      const prioVis = inner.querySelector('[data-ad-prio-vis]');
      prioVis.replaceChildren();
      const pv = document.createElement('span');
      pv.className = `action-detail-prio-vis action-detail-prio-vis--${o.priority || 'normale'}`;
      pv.textContent = `Priorité : ${PRIO_LABELS[o.priority] || 'Normale'}`;
      pv.title =
        'Priorité de pilotage : peut être ajustée selon votre référentiel interne.';
      prioVis.append(pv);

      renderProgressControl(row, currentActionId);
      renderLinkEditors(currentActionId);
      fillCommentsHistory(currentActionId);

      applyNativeDialogColorScheme(dlg);
      dlg.showModal();
      requestAnimationFrame(() => {
        inner.querySelector('.action-detail-dialog__close')?.focus?.();
      });
    }
  };
}
