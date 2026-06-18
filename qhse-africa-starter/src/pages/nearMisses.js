import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';
import { createLinkedActionFromNearMiss } from '../utils/nearMissesActions.js';

const STATUS_LABELS = {
  open: 'Ouvert',
  under_review: 'En analyse',
  closed: 'Clôturé'
};

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

export function renderNearMisses() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas near-misses-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'near-misses', 'read');
  const canWrite = canResource(su?.role, 'near-misses', 'write');
  const canWriteActions = canResource(su?.role, 'actions', 'write');

  page.innerHTML = `
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Retours d’expérience</div>
          <h3>Presque-accidents</h3>
        </div>
      </div>
      <div class="near-misses-list-host stack" style="margin-top:12px"></div>
      <div class="form-grid" style="gap:12px;margin-top:16px">
        <label class="field field-full">
          <span>Titre <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input nm-title" maxlength="300" placeholder="Chute de charge évitée, glissade…" />
        </label>
        <label class="field">
          <span>Catégorie</span>
          <input type="text" class="control-input nm-category" maxlength="200" placeholder="Manutention, circulation…" />
        </label>
        <label class="field">
          <span>Date de l’événement <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="date" class="control-input nm-occurred" />
        </label>
        <label class="field">
          <span>Lieu</span>
          <input type="text" class="control-input nm-location" maxlength="300" />
        </label>
        <label class="field">
          <span>Statut</span>
          <select class="control-input nm-status">
            <option value="open">Ouvert</option>
            <option value="under_review">En analyse</option>
            <option value="closed">Clôturé</option>
          </select>
        </label>
        <label class="field field-full">
          <span>Description</span>
          <input type="text" class="control-input nm-description" maxlength="2000" />
        </label>
        <label class="field field-full">
          <span>Actions immédiates</span>
          <input type="text" class="control-input nm-immediate" maxlength="2000" />
        </label>
        <label class="field field-full">
          <span>Enseignements / retour d’expérience</span>
          <input type="text" class="control-input nm-lessons" maxlength="2000" />
        </label>
        <button type="button" class="btn btn-primary nm-btn-create field-full" style="min-height:48px;font-weight:700">
          Déclarer le presque-accident
        </button>
      </div>
    </article>
  `;

  const listHost = page.querySelector('.near-misses-list-host');

  const titleIn = page.querySelector('.nm-title');
  const categoryIn = page.querySelector('.nm-category');
  const occurredIn = page.querySelector('.nm-occurred');
  const locationIn = page.querySelector('.nm-location');
  const statusSel = page.querySelector('.nm-status');
  const descriptionIn = page.querySelector('.nm-description');
  const immediateIn = page.querySelector('.nm-immediate');
  const lessonsIn = page.querySelector('.nm-lessons');
  const createBtn = page.querySelector('.nm-btn-create');

  if (!canRead && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture des presque-accidents non autorisée pour ce rôle.</p>';
    return page;
  }

  if (!canWrite && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/near-misses');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) {
        listHost.replaceChildren();
        listHost.append(createEmptyState('⚠', 'Aucun presque-accident', 'Déclarez le premier événement ci-dessous.'));
        return;
      }
      listHost.replaceChildren();
      list.forEach((rec) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = rec.title;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [fmtDate(rec.occurredAt), STATUS_LABELS[rec.status] || rec.status];
        if (rec.category) parts.push(rec.category);
        if (rec.location) parts.push(rec.location);
        if (rec.siteRecord?.name) parts.push(rec.siteRecord.name);
        sub.textContent = parts.filter(Boolean).join(' · ');
        left.append(title, sub);
        row.append(left);
        const rowActions = document.createElement('div');
        rowActions.style.display = 'flex';
        rowActions.style.gap = '8px';
        if (canWriteActions) {
          const linkBtn = document.createElement('button');
          linkBtn.type = 'button';
          linkBtn.className = 'btn btn-secondary';
          linkBtn.textContent = 'Créer une action liée';
          linkBtn.addEventListener('click', () => {
            void createLinkedActionFromNearMiss(rec);
          });
          rowActions.append(linkBtn);
        }
        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer ce presque-accident ?')) return;
            try {
              const r = await qhseFetch(`/api/near-misses/${encodeURIComponent(rec.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Presque-accident supprimé', 'info');
              await refreshList();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });
          rowActions.append(delBtn);
        }
        if (rowActions.childElementCount) row.append(rowActions);
        listHost.append(row);
      });
    } catch {
      listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible : vérifiez l’API.</p>';
    }
  }

  createBtn.addEventListener('click', async () => {
    if (!canWrite && su) {
      showToast('Création réservée', 'warning');
      return;
    }
    const title = (titleIn.value || '').trim();
    const occurredAt = occurredIn.value ? new Date(occurredIn.value).toISOString() : '';
    if (!title || !occurredAt) {
      showToast('Titre et date requis', 'error');
      return;
    }
    const category = (categoryIn.value || '').trim() || undefined;
    const location = (locationIn.value || '').trim() || undefined;
    const status = statusSel.value || undefined;
    const description = (descriptionIn.value || '').trim() || undefined;
    const immediateActions = (immediateIn.value || '').trim() || undefined;
    const lessonsLearned = (lessonsIn.value || '').trim() || undefined;
    createBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/near-misses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          occurredAt,
          category,
          location,
          status,
          description,
          immediateActions,
          lessonsLearned
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Presque-accident déclaré', 'info');
      titleIn.value = '';
      categoryIn.value = '';
      occurredIn.value = '';
      locationIn.value = '';
      statusSel.value = 'open';
      descriptionIn.value = '';
      immediateIn.value = '';
      lessonsIn.value = '';
      await refreshList();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  refreshList();

  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'near-misses-page-anchor';
  return page;
}
