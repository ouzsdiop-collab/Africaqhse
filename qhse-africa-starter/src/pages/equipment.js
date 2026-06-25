import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';
import { createLinkedActionFromEquipmentAlert } from '../utils/equipmentActions.js';

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
  const canWriteActions = canResource(su?.role, 'actions', 'write');

  page.innerHTML = `
    <article class="content-card card-soft equipment-kpi-card">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Synthèse</div>
          <h3>Équipements & EPI — vue d'ensemble</h3>
        </div>
      </div>
      <div class="eq-kpi-bar" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px"></div>
    </article>

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
        <label class="field">
          <span>Périodicité (mois)</span>
          <input type="number" min="1" max="120" class="control-input eq-frequency" placeholder="ex : 12" />
        </label>
        <button type="button" class="btn btn-primary eq-btn-create field-full" style="min-height:48px;font-weight:700">
          Ajouter l’équipement
        </button>
      </div>
    </article>
  `;

  const kpiBar = page.querySelector('.eq-kpi-bar');
  const alertsHost = page.querySelector('.equipment-alerts-host');
  const listHost = page.querySelector('.equipment-list-host');

  let lastList = [];
  let lastAlerts = [];

  function renderKpiBar() {
    if (!kpiBar) return;
    const total = lastList.length;
    const outOfService = lastList.filter((eq) => eq.status !== 'in_service').length;
    const expired = lastAlerts.filter((a) => a.severity === 'high').length;
    const expiring = lastAlerts.filter((a) => a.severity === 'medium').length;

    const items = [
      { label: 'Équipements suivis', value: total, tone: 'var(--text2)' },
      { label: 'Hors service', value: outOfService, tone: outOfService > 0 ? '#f59e0b' : 'var(--text2)' },
      { label: 'Contrôles expirés', value: expired, tone: expired > 0 ? '#dc2626' : 'var(--text2)' },
      { label: 'Contrôles à prévoir (30 j)', value: expiring, tone: expiring > 0 ? '#d97706' : 'var(--text2)' }
    ];

    kpiBar.replaceChildren();
    items.forEach((it) => {
      const card = document.createElement('div');
      card.style.border = '1px solid var(--border1, #334155)';
      card.style.borderRadius = '10px';
      card.style.padding = '10px 12px';
      const val = document.createElement('div');
      val.style.fontSize = '22px';
      val.style.fontWeight = '900';
      val.style.color = it.tone;
      val.textContent = String(it.value);
      const lbl = document.createElement('div');
      lbl.style.fontSize = '11px';
      lbl.style.color = 'var(--text2)';
      lbl.textContent = it.label;
      card.append(val, lbl);
      kpiBar.append(card);
    });
  }

  const nameIn = page.querySelector('.eq-name');
  const categoryIn = page.querySelector('.eq-category');
  const serialIn = page.querySelector('.eq-serial');
  const assigneeIn = page.querySelector('.eq-assignee');
  const lastControlIn = page.querySelector('.eq-last-control');
  const nextControlIn = page.querySelector('.eq-next-control');
  const frequencyIn = page.querySelector('.eq-frequency');
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
      lastAlerts = alerts;
      renderKpiBar();
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
        row.style.flexDirection = 'column';
        row.style.gap = '8px';

        const head = document.createElement('div');
        head.style.display = 'flex';
        head.style.justifyContent = 'space-between';
        head.style.alignItems = 'flex-start';
        head.style.gap = '12px';
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
        head.append(left, badge);
        row.append(head);

        if (canWriteActions) {
          const rowActions = document.createElement('div');
          rowActions.style.display = 'flex';
          rowActions.style.justifyContent = 'flex-end';
          const linkBtn = document.createElement('button');
          linkBtn.type = 'button';
          linkBtn.className = 'btn btn-secondary btn-sm';
          linkBtn.textContent = 'Créer une action liée';
          linkBtn.addEventListener('click', () => {
            void createLinkedActionFromEquipmentAlert(a);
          });
          rowActions.append(linkBtn);
          row.append(rowActions);
        }

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
      lastList = list;
      renderKpiBar();
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

        row.style.flexDirection = 'column';
        row.style.alignItems = 'stretch';
        const headRow = document.createElement('div');
        headRow.style.display = 'flex';
        headRow.style.justifyContent = 'space-between';
        headRow.style.alignItems = 'flex-start';
        headRow.style.gap = '12px';
        headRow.style.width = '100%';
        headRow.append(left);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.flex = '0 0 auto';

        const detailBtn = document.createElement('button');
        detailBtn.type = 'button';
        detailBtn.className = 'btn btn-secondary btn-sm';
        detailBtn.textContent = 'Voir le détail';
        detailBtn.addEventListener('click', () => {
          const existing = row.querySelector('.eq-detail-panel');
          if (existing) {
            existing.remove();
            return;
          }
          const panel = document.createElement('div');
          panel.className = 'eq-detail-panel';
          panel.style.marginTop = '8px';
          panel.style.width = '100%';
          panel.style.padding = '10px 12px';
          panel.style.border = '1px solid var(--border1, #334155)';
          panel.style.borderRadius = '10px';
          panel.style.display = 'flex';
          panel.style.flexDirection = 'column';
          panel.style.gap = '8px';
          panel.style.fontSize = '13px';

          const info = document.createElement('p');
          info.style.margin = '0';
          info.style.color = 'var(--text2)';
          const infoParts = [`Statut : ${eq.status}`];
          if (eq.lastControlDate) infoParts.push(`Dernier contrôle : ${fmtDate(eq.lastControlDate)}`);
          if (eq.nextControlDate) infoParts.push(`Prochain contrôle : ${fmtDate(eq.nextControlDate)}`);
          if (eq.maintenanceFrequencyMonths) infoParts.push(`Périodicité : ${eq.maintenanceFrequencyMonths} mois`);
          if (eq.siteRecord?.name) infoParts.push(`Site : ${eq.siteRecord.name}`);
          if (eq.assignedUser?.name || eq.assignedUser?.email) {
            infoParts.push(`Affecté : ${eq.assignedUser.name || eq.assignedUser.email}`);
          }
          info.textContent = infoParts.join(' · ');
          panel.append(info);

          if (canWrite) {
            const editForm = document.createElement('div');
            editForm.style.display = 'flex';
            editForm.style.flexWrap = 'wrap';
            editForm.style.gap = '8px';
            editForm.style.marginTop = '4px';

            const statusEdit = document.createElement('select');
            statusEdit.className = 'control-input';
            ['in_service', 'out_of_service', 'in_repair', 'retired'].forEach((s) => {
              const opt = document.createElement('option');
              opt.value = s;
              opt.textContent = s;
              if (s === eq.status) opt.selected = true;
              statusEdit.append(opt);
            });

            const lastEdit = document.createElement('input');
            lastEdit.type = 'date';
            lastEdit.className = 'control-input';
            lastEdit.value = eq.lastControlDate ? eq.lastControlDate.slice(0, 10) : '';

            const nextEdit = document.createElement('input');
            nextEdit.type = 'date';
            nextEdit.className = 'control-input';
            nextEdit.value = eq.nextControlDate ? eq.nextControlDate.slice(0, 10) : '';

            const frequencyEdit = document.createElement('input');
            frequencyEdit.type = 'number';
            frequencyEdit.min = '1';
            frequencyEdit.max = '120';
            frequencyEdit.placeholder = 'Périodicité (mois)';
            frequencyEdit.className = 'control-input';
            frequencyEdit.value = eq.maintenanceFrequencyMonths ? String(eq.maintenanceFrequencyMonths) : '';

            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'btn btn-primary btn-sm';
            saveBtn.textContent = 'Enregistrer';
            saveBtn.addEventListener('click', async () => {
              try {
                const res = await qhseFetch(`/api/equipment/${encodeURIComponent(eq.id)}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: statusEdit.value,
                    lastControlDate: lastEdit.value ? new Date(lastEdit.value).toISOString() : null,
                    nextControlDate: nextEdit.value ? new Date(nextEdit.value).toISOString() : null,
                    maintenanceFrequencyMonths: frequencyEdit.value ? Number(frequencyEdit.value) : null
                  })
                });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                  showToast(typeof body.error === 'string' ? body.error : 'Mise à jour impossible', 'error');
                  return;
                }
                showToast('Équipement mis à jour', 'info');
                await refreshList();
                await refreshAlerts();
              } catch {
                showToast('Erreur serveur', 'error');
              }
            });

            editForm.append(statusEdit, lastEdit, nextEdit, frequencyEdit, saveBtn);
            panel.append(editForm);
          }

          row.append(panel);
        });
        actions.append(detailBtn);

        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost btn-sm';
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
          actions.append(delBtn);
        }

        headRow.append(actions);
        row.append(headRow);
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
    const maintenanceFrequencyMonths = frequencyIn.value ? Number(frequencyIn.value) : undefined;
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
          nextControlDate,
          maintenanceFrequencyMonths
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
      frequencyIn.value = '';
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
