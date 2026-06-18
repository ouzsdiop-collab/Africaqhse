import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

export function renderEquipment() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas equipment-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'equipment', 'read');
  const canWrite = canResource(su?.role, 'equipment', 'write');

  page.innerHTML = `
    <article class="content-card card-soft equipment-alerts-card">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Échéances</div>
          <h3>Alertes contrôles / péremption</h3>
        </div>
      </div>
      <div class="equipment-alerts-host stack" style="margin-top:12px"></div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Registre</div>
          <h3>Équipements & EPI</h3>
        </div>
      </div>
      <div class="equipment-list-host stack" style="margin-top:12px"></div>
      <div class="form-grid" style="gap:12px;margin-top:16px">
        <label class="field">
          <span>Nom <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input eq-name" maxlength="200" />
        </label>
        <label class="field">
          <span>Catégorie <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input eq-category" maxlength="100" placeholder="EPI, machine, outillage…" />
        </label>
        <label class="field">
          <span>N° de série</span>
          <input type="text" class="control-input eq-serial" maxlength="200" />
        </label>
        <label class="field">
          <span>Identifiant utilisateur affecté</span>
          <input type="text" class="control-input eq-assignee" maxlength="100" />
        </label>
        <label class="field">
          <span>Dernier contrôle</span>
          <input type="date" class="control-input eq-last-control" />
        </label>
        <label class="field">
          <span>Prochain contrôle</span>
          <input type="date" class="control-input eq-next-control" />
        </label>
        <button type="button" class="btn btn-primary eq-btn-create field-full" style="min-height:48px;font-weight:700">
          Ajouter l’équipement
        </button>
      </div>
    </article>
  `;

  const alertsHost = page.querySelector('.equipment-alerts-host');
  const listHost = page.querySelector('.equipment-list-host');

  const nameIn = page.querySelector('.eq-name');
  const categoryIn = page.querySelector('.eq-category');
  const serialIn = page.querySelector('.eq-serial');
  const assigneeIn = page.querySelector('.eq-assignee');
  const lastControlIn = page.querySelector('.eq-last-control');
  const nextControlIn = page.querySelector('.eq-next-control');
  const createBtn = page.querySelector('.eq-btn-create');

  if (!canRead && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
    alertsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture des équipements non autorisée pour ce rôle.</p>';
    listHost.innerHTML = '';
    return page;
  }

  if (!canWrite && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
  }

  async function refreshAlerts() {
    alertsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/equipment/alerts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const alerts = Array.isArray(body?.alerts) ? body.alerts : [];
      if (alerts.length === 0) {
        alertsHost.replaceChildren();
        alertsHost.append(createEmptyState('✅', 'Aucune alerte', 'Tous les équipements sont à jour ou aucune échéance n’est enregistrée.'));
        return;
      }
      alertsHost.replaceChildren();
      alerts.forEach((a) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = a.message || '';
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        sub.textContent = a.date ? `Échéance : ${fmtDate(a.date)}` : '';
        left.append(title, sub);
        const badge = document.createElement('span');
        badge.textContent = a.severity === 'high' ? 'Expiré' : 'À prévoir';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '700';
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '999px';
        badge.style.color = '#fff';
        badge.style.background = a.severity === 'high' ? '#dc2626' : '#d97706';
        row.append(left, badge);
        alertsHost.append(row);
      });
    } catch {
      alertsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Alertes indisponibles : vérifiez l’API.</p>';
    }
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/equipment');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) {
        listHost.replaceChildren();
        listHost.append(createEmptyState('\u{1F9BA}', 'Aucun équipement', 'Ajoutez le premier équipement ci-dessous.'));
        return;
      }
      listHost.replaceChildren();
      list.forEach((eq) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = eq.name;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [eq.category];
        if (eq.serialNumber) parts.push(`N° ${eq.serialNumber}`);
        if (eq.assignedUser?.name || eq.assignedUser?.email) {
          parts.push(`Affecté : ${eq.assignedUser.name || eq.assignedUser.email}`);
        }
        if (eq.siteRecord?.name) parts.push(eq.siteRecord.name);
        if (eq.nextControlDate) parts.push(`Prochain contrôle : ${fmtDate(eq.nextControlDate)}`);
        parts.push(eq.status);
        sub.textContent = parts.filter(Boolean).join(' · ');
        left.append(title, sub);
        row.append(left);
        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer cet équipement ?')) return;
            try {
              const r = await qhseFetch(`/api/equipment/${encodeURIComponent(eq.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Équipement supprimé', 'info');
              await refreshList();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });
          row.append(delBtn);
        }
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
    const name = (nameIn.value || '').trim();
    const category = (categoryIn.value || '').trim();
    if (!name || !category) {
      showToast('Nom et catégorie requis', 'error');
      return;
    }
    const serialNumber = (serialIn.value || '').trim() || undefined;
    const assignedUserId = (assigneeIn.value || '').trim() || undefined;
    const lastControlDate = lastControlIn.value ? new Date(lastControlIn.value).toISOString() : undefined;
    const nextControlDate = nextControlIn.value ? new Date(nextControlIn.value).toISOString() : undefined;
    createBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          serialNumber,
          assignedUserId,
          lastControlDate,
          nextControlDate
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Équipement créé', 'info');
      nameIn.value = '';
      categoryIn.value = '';
      serialIn.value = '';
      assigneeIn.value = '';
      lastControlIn.value = '';
      nextControlIn.value = '';
      await refreshList();
      await refreshAlerts();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  refreshAlerts();
  refreshList();

  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'equipment-page-anchor';
  return page;
}
