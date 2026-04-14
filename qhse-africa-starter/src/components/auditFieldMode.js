import { showToast } from './toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { ensureAuditPlusStyles } from './auditPlusStyles.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';

const DEFAULT_NC_DETAIL = 'Écart constaté sur le terrain — détail à compléter';

let ncSeq = 1;

function nextNcRef() {
  const n = String(ncSeq++).padStart(3, '0');
  return `NC-AUD-2026-${n}`;
}

/**
 * Mode chantier interactif (checklist audit) : statuts + commentaires + NC + actions.
 * @param {{ points: Array<{ id: string, point: string }>, auditRef?: string, siteId?: string }} options
 */
export function createAuditFieldMode({ points, auditRef = 'AUD-0000', siteId }) {
  ensureAuditPlusStyles();

  const state = {};
  points.forEach((p) => {
    state[p.id] = { status: null, comment: '' };
  });

  const wrap = document.createElement('div');
  wrap.className = 'audit-field-panel';
  wrap.hidden = true;

  const head = document.createElement('div');
  head.className = 'audit-field-panel-head';
  head.innerHTML = `
    <h4>Mode audit terrain</h4>
    <p>Marquez chaque point : <strong>Conforme</strong> ou <strong>Non conforme</strong>, ajoutez un commentaire si besoin. Les écarts enregistrent une NC et une action dans le plan d’actions.</p>
  `;

  const stack = document.createElement('div');
  stack.className = 'audit-field-stack';

  const ncBlock = document.createElement('div');
  ncBlock.className = 'audit-nc-block';
  const ncTitle = document.createElement('h5');
  ncTitle.textContent = 'Non-conformités détectées';
  const ncList = document.createElement('div');
  ncList.className = 'audit-nc-list';
  ncBlock.append(ncTitle, ncList);

  function renderNc() {
    ncList.innerHTML = '';
    const nonConformes = points.filter((p) => state[p.id].status === 'non_conforme');
    if (nonConformes.length === 0) {
      const empty = document.createElement('p');
      empty.style.margin = '0';
      empty.style.fontSize = '13px';
      empty.style.color = 'var(--text3)';
      empty.textContent = 'Aucun écart pour l’instant — marquez un point « Non conforme » pour voir une NC.';
      ncList.append(empty);
      return;
    }

    nonConformes.forEach((p) => {
      const ref = p.ncRef || (p.ncRef = nextNcRef());
      const card = document.createElement('article');
      card.className = 'audit-nc-card';
      card.style.borderLeft = '4px solid rgba(239, 91, 107, 0.75)';
      card.style.paddingLeft = '14px';
      const refEl = document.createElement('div');
      refEl.className = 'audit-nc-card__ref';
      const isServerRef = /^NC-\d+$/.test(String(ref));
      refEl.textContent = isServerRef
        ? `Réf. NC (serveur) : ${ref}`
        : `Réf. provisoire : ${ref}`;

      const txt = document.createElement('p');
      txt.className = 'audit-nc-card__text';
      const com = state[p.id].comment?.trim();
      const shownDetail = com || DEFAULT_NC_DETAIL;
      txt.textContent = `${p.point} — ${shownDetail}`;

      const actionNote = document.createElement('p');
      actionNote.style.margin = '10px 0 0';
      actionNote.style.fontSize = '12px';
      actionNote.style.lineHeight = '1.45';
      actionNote.style.color = 'var(--text2)';
      actionNote.textContent =
        'Une action corrective a été générée automatiquement — suivi dans le module Actions.';

      const actions = document.createElement('div');
      actions.className = 'audit-nc-card__actions';
      actions.style.marginTop = '12px';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary';
      btn.textContent = 'Créer action corrective';
      btn.addEventListener('click', () => {
        showToast(
          'L’action corrective est créée automatiquement avec la non-conformité (voir module Actions).',
          'info'
        );
        activityLogStore.add({
          module: 'audits',
          action: 'Rappel action liée NC',
          detail: 'Depuis non-conformité audit',
          user: 'Responsable QHSE'
        });
      });
      actions.append(btn);
      card.append(refEl, txt, actionNote, actions);
      ncList.append(card);
    });
  }

  function bindPoint(p) {
    const item = document.createElement('div');
    item.className = 'audit-field-item';

    const t = document.createElement('p');
    t.className = 'audit-field-item__title';
    t.textContent = p.point;

    const toggles = document.createElement('div');
    toggles.className = 'audit-field-toggles';
    const bConf = document.createElement('button');
    bConf.type = 'button';
    bConf.textContent = 'Conforme';
    const bNc = document.createElement('button');
    bNc.type = 'button';
    bNc.textContent = 'Non conforme';

    function syncButtons() {
      bConf.className = state[p.id].status === 'conforme' ? 'is-on conforme' : '';
      bNc.className = state[p.id].status === 'non_conforme' ? 'is-on nonconforme' : '';
    }

    bConf.addEventListener('click', () => {
      state[p.id].status = 'conforme';
      delete p.ncRef;
      syncButtons();
      renderNc();
    });
    bNc.addEventListener('click', async () => {
      if (!canResource(getSessionUser()?.role, 'nonconformities', 'write')) {
        showToast('Enregistrement NC non autorisé pour ce rôle.', 'warning');
        return;
      }
      const wasNc = state[p.id].status === 'non_conforme';
      state[p.id].status = 'non_conforme';
      syncButtons();
      renderNc();
      if (wasNc) return;

      const commentaire = (state[p.id].comment || '').trim();
      const detailForApi = commentaire || DEFAULT_NC_DETAIL;
      const payload = {
        title: p.point,
        detail: detailForApi,
        auditRef,
        ...(siteId ? { siteId } : {})
      };

      try {
        const res = await qhseFetch('/api/nonconformities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          try {
            const body = await res.json();
            console.error('[audits] POST /api/nonconformities', res.status, body);
          } catch {
            console.error('[audits] POST /api/nonconformities', res.status);
          }
          showToast('Erreur serveur', 'error');
          return;
        }
        const data = await res.json();
        const id = data?.nonConformity?.id;
        const ncRefStr = id != null ? `NC-${id}` : p.ncRef || '—';
        if (id != null) {
          p.ncRef = ncRefStr;
          renderNc();
        }
        showToast('Non-conformité enregistrée', 'info');
        activityLogStore.add({
          module: 'audits',
          action: 'Non-conformité enregistrée',
          detail: `Audit ${auditRef} · Point : ${p.point} · ${ncRefStr}`,
          user: 'Auditeur terrain'
        });
      } catch (err) {
        console.error('[audits] POST /api/nonconformities', err);
        showToast('Erreur serveur', 'error');
      }
    });

    const ta = document.createElement('textarea');
    ta.className = 'audit-field-comment';
    ta.rows = 2;
    ta.placeholder = 'Commentaire (observation, preuve, recommandation)';
    ta.value = state[p.id].comment;
    ta.addEventListener('input', () => {
      state[p.id].comment = ta.value;
      renderNc();
    });

    syncButtons();
    toggles.append(bConf, bNc);
    item.append(t, toggles, ta);
    return item;
  }

  points.forEach((p) => stack.append(bindPoint(p)));
  wrap.append(head, stack, ncBlock);
  renderNc();

  return {
    element: wrap,
    show() {
      wrap.hidden = false;
    },
    hide() {
      wrap.hidden = true;
    },
    reset() {
      points.forEach((p) => {
        state[p.id] = { status: null, comment: '' };
        delete p.ncRef;
      });
      ncSeq = 1;
      stack.innerHTML = '';
      points.forEach((p) => {
        stack.append(bindPoint(p));
      });
      renderNc();
    }
  };
}
