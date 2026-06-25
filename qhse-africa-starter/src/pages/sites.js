import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { getApiBase } from '../config.js';
import { invalidateSitesCatalog } from '../services/sitesCatalog.service.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';

export function renderSites() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas sites-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'sites', 'read');
  const canWrite = canResource(su?.role, 'sites', 'write');

  page.innerHTML = `
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Organisation</div>
          <h3>Sites (référentiel)</h3>
          <p class="content-card-lead" style="margin:0;max-width:56ch;font-size:13px">
            Création et consultation des sites utilisés pour le filtrage des modules et les liaisons API
            (<code style="font-size:12px">${escapeHtml(getApiBase())}</code>).
          </p>
        </div>
      </div>
      <div class="sites-list-host stack" style="margin-top:12px"></div>
    </article>
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Nouveau</div>
          <h3>Ajouter un site</h3>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:8px">
        <label class="field field-full">
          <span>Nom <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input sites-in-name" maxlength="200" autocomplete="organization" />
        </label>
        <label class="field">
          <span>Code</span>
          <input type="text" class="control-input sites-in-code" maxlength="40" autocomplete="off" />
        </label>
        <label class="field field-full">
          <span>Adresse</span>
          <input type="text" class="control-input sites-in-address" maxlength="500" autocomplete="street-address" />
        </label>
        <button type="button" class="btn btn-primary sites-btn-create field-full" style="min-height:48px;font-weight:700">
          Enregistrer le site
        </button>
      </div>
    </article>
  `;

  const listHost = page.querySelector('.sites-list-host');
  const nameIn = page.querySelector('.sites-in-name');
  const codeIn = page.querySelector('.sites-in-code');
  const addrIn = page.querySelector('.sites-in-address');
  const createBtn = page.querySelector('.sites-btn-create');

  if (!canRead && su) {
    listHost.innerHTML =
      '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture des sites non autorisée pour ce rôle.</p>';
    page.querySelectorAll('.form-grid input').forEach((el) => {
      el.disabled = true;
    });
    createBtn.disabled = true;
    return page;
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/sites');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        listHost.replaceChildren();
        if (canWrite) {
          listHost.append(
            createEmptyState(
              '\u{1F3E2}',
              'Aucun site enregistré',
              'Le référentiel sert au filtrage des modules et aux API. Créez le premier site ci-dessous.',
              'Renseigner le nom',
              () => {
                nameIn?.focus();
                nameIn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            )
          );
        } else {
          listHost.append(
            createEmptyState(
              '\u{1F3E2}',
              'Aucun site enregistré',
              'Connectez-vous avec un rôle autorisé à la création pour ajouter des sites.'
            )
          );
        }
        return;
      }
      listHost.replaceChildren();
      rows.forEach((r) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '8px';

        const headRow = document.createElement('div');
        headRow.style.display = 'flex';
        headRow.style.justifyContent = 'space-between';
        headRow.style.alignItems = 'flex-start';
        headRow.style.gap = '12px';
        headRow.style.width = '100%';

        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = r.name || 'Non renseigné';
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [];
        if (r.code) parts.push(`Code : ${r.code}`);
        if (r.address) parts.push(r.address);
        parts.push(`id : ${r.id}`);
        sub.textContent = parts.join(' · ');
        left.append(title, sub);
        headRow.append(left);

        if (canWrite) {
          const actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = '8px';
          actions.style.flex = '0 0 auto';

          const editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'btn btn-secondary btn-sm';
          editBtn.textContent = 'Éditer';

          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost btn-sm';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm(`Supprimer le site « ${r.name || ''} » ? Les liaisons existantes (incidents, audits…) seront détachées.`)) return;
            try {
              const res = await qhseFetch(`/api/sites/${encodeURIComponent(r.id)}`, { method: 'DELETE' });
              if (!res.ok && res.status !== 204) throw new Error('delete failed');
              showToast('Site supprimé', 'info');
              invalidateSitesCatalog();
              await refreshList();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });

          editBtn.addEventListener('click', () => {
            const editing = row.querySelector('.sites-edit-form');
            if (editing) {
              editing.remove();
              return;
            }
            const form = document.createElement('div');
            form.className = 'sites-edit-form';
            form.style.display = 'flex';
            form.style.flexDirection = 'column';
            form.style.gap = '8px';
            form.style.marginTop = '8px';
            form.style.width = '100%';

            const nameEdit = document.createElement('input');
            nameEdit.className = 'control-input';
            nameEdit.value = r.name || '';
            nameEdit.placeholder = 'Nom';

            const codeEdit = document.createElement('input');
            codeEdit.className = 'control-input';
            codeEdit.value = r.code || '';
            codeEdit.placeholder = 'Code';

            const addrEdit = document.createElement('input');
            addrEdit.className = 'control-input';
            addrEdit.value = r.address || '';
            addrEdit.placeholder = 'Adresse';

            const saveRow = document.createElement('div');
            saveRow.style.display = 'flex';
            saveRow.style.gap = '8px';
            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'btn btn-primary btn-sm';
            saveBtn.textContent = 'Enregistrer';
            saveBtn.addEventListener('click', async () => {
              const name = nameEdit.value.trim();
              if (!name) {
                showToast('Le nom du site est requis', 'error');
                return;
              }
              try {
                const res = await qhseFetch(`/api/sites/${encodeURIComponent(r.id)}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name,
                    code: codeEdit.value.trim() || null,
                    address: addrEdit.value.trim() || null
                  })
                });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                  showToast(typeof body.error === 'string' ? body.error : 'Mise à jour impossible', 'error');
                  return;
                }
                showToast('Site mis à jour', 'info');
                invalidateSitesCatalog();
                await refreshList();
              } catch {
                showToast('Erreur serveur', 'error');
              }
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-ghost btn-sm';
            cancelBtn.textContent = 'Annuler';
            cancelBtn.addEventListener('click', () => form.remove());

            saveRow.append(saveBtn, cancelBtn);
            form.append(nameEdit, codeEdit, addrEdit, saveRow);
            row.append(form);
          });

          actions.append(editBtn, delBtn);
          headRow.append(actions);
        }

        row.append(headRow);
        listHost.append(row);
      });
    } catch {
      listHost.innerHTML =
        '<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible : vérifiez l’API.</p>';
    }
  }

  createBtn.addEventListener('click', async () => {
    if (!canWrite && su) {
      showToast('Création réservée', 'warning');
      return;
    }
    const name = (nameIn.value || '').trim();
    if (!name) {
      showToast('Le nom du site est requis', 'error');
      return;
    }
    const code = (codeIn.value || '').trim() || undefined;
    const address = (addrIn.value || '').trim() || undefined;
    createBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, address })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Site créé', 'info');
      nameIn.value = '';
      codeIn.value = '';
      addrIn.value = '';
      invalidateSitesCatalog();
      await refreshList();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  if (!canWrite && su) {
    createBtn.disabled = true;
    createBtn.title = 'Création réservée : rôle lecture';
    createBtn.style.opacity = '0.55';
  }

  refreshList();
  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'sites-page-anchor';
  return page;
}
