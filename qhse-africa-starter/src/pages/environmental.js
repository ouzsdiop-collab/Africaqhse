import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';

const TYPE_LABELS = {
  waste: 'Déchets',
  water: 'Eau',
  energy: 'Énergie'
};

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

export function renderEnvironmental() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas environmental-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'environmental', 'read');
  const canWrite = canResource(su?.role, 'environmental', 'write');

  page.innerHTML = `
    <article class="content-card card-soft environmental-summary-card">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Synthèse</div>
          <h3>Totaux par type</h3>
        </div>
      </div>
      <div class="environmental-summary-host stack" style="margin-top:12px"></div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Relevés</div>
          <h3>Déchets / Eau / Énergie</h3>
        </div>
      </div>
      <div class="environmental-list-host stack" style="margin-top:12px"></div>
      <div class="form-grid" style="gap:12px;margin-top:16px">
        <label class="field">
          <span>Type <span style="color:var(--text3)">(obligatoire)</span></span>
          <select class="control-input env-type">
            <option value="waste">Déchets</option>
            <option value="water">Eau</option>
            <option value="energy">Énergie</option>
          </select>
        </label>
        <label class="field">
          <span>Catégorie</span>
          <input type="text" class="control-input env-category" maxlength="200" placeholder="Déchets dangereux, électricité…" />
        </label>
        <label class="field">
          <span>Quantité <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="number" step="any" class="control-input env-quantity" />
        </label>
        <label class="field">
          <span>Unité <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input env-unit" maxlength="50" placeholder="kg, m3, kWh…" />
        </label>
        <label class="field">
          <span>Date de relevé <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="date" class="control-input env-period" />
        </label>
        <label class="field field-full">
          <span>Notes</span>
          <input type="text" class="control-input env-notes" maxlength="500" />
        </label>
        <button type="button" class="btn btn-primary env-btn-create field-full" style="min-height:48px;font-weight:700">
          Ajouter le relevé
        </button>
      </div>
    </article>
  `;

  const summaryHost = page.querySelector('.environmental-summary-host');
  const listHost = page.querySelector('.environmental-list-host');

  const typeSel = page.querySelector('.env-type');
  const categoryIn = page.querySelector('.env-category');
  const quantityIn = page.querySelector('.env-quantity');
  const unitIn = page.querySelector('.env-unit');
  const periodIn = page.querySelector('.env-period');
  const notesIn = page.querySelector('.env-notes');
  const createBtn = page.querySelector('.env-btn-create');

  if (!canRead && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
    summaryHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture du suivi environnemental non autorisée pour ce rôle.</p>';
    listHost.innerHTML = '';
    return page;
  }

  if (!canWrite && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
  }

  async function refreshSummary() {
    summaryHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/environmental/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const summary = Array.isArray(body?.summary) ? body.summary : [];
      if (summary.length === 0) {
        summaryHost.replaceChildren();
        summaryHost.append(createEmptyState('🌍', 'Aucun relevé', 'Ajoutez un relevé pour voir apparaître la synthèse.'));
        return;
      }
      summaryHost.replaceChildren();
      summary.forEach((s) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = TYPE_LABELS[s.type] || s.type;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        sub.textContent = `${s.totalQuantity} ${s.unit} · ${s.recordCount} relevé(s)`;
        left.append(title, sub);
        row.append(left);
        summaryHost.append(row);
      });
    } catch {
      summaryHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Synthèse indisponible : vérifiez l’API.</p>';
    }
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/environmental');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) {
        listHost.replaceChildren();
        listHost.append(createEmptyState('🌍', 'Aucun relevé', 'Ajoutez le premier relevé ci-dessous.'));
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
        title.textContent = `${TYPE_LABELS[rec.type] || rec.type} — ${rec.quantity} ${rec.unit}`;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [fmtDate(rec.periodDate)];
        if (rec.category) parts.push(rec.category);
        if (rec.siteRecord?.name) parts.push(rec.siteRecord.name);
        sub.textContent = parts.filter(Boolean).join(' · ');
        left.append(title, sub);
        row.append(left);
        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer ce relevé ?')) return;
            try {
              const r = await qhseFetch(`/api/environmental/${encodeURIComponent(rec.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Relevé supprimé', 'info');
              await refreshList();
              await refreshSummary();
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
    const type = typeSel.value;
    const quantity = quantityIn.value !== '' ? Number(quantityIn.value) : NaN;
    const unit = (unitIn.value || '').trim();
    const periodDate = periodIn.value ? new Date(periodIn.value).toISOString() : '';
    if (!type || !Number.isFinite(quantity) || !unit || !periodDate) {
      showToast('Type, quantité, unité et date requis', 'error');
      return;
    }
    const category = (categoryIn.value || '').trim() || undefined;
    const notes = (notesIn.value || '').trim() || undefined;
    createBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/environmental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, category, quantity, unit, periodDate, notes })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Relevé créé', 'info');
      categoryIn.value = '';
      quantityIn.value = '';
      unitIn.value = '';
      periodIn.value = '';
      notesIn.value = '';
      await refreshList();
      await refreshSummary();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  refreshSummary();
  refreshList();

  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'environmental-page-anchor';
  return page;
}
