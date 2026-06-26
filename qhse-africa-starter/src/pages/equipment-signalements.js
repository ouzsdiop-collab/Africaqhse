import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const CATEGORY_LABELS = {
  oil_level: '🛢️ Niveau huile',
  anomaly_noise: '🔊 Bruit anormal',
  leak_heat: '🔥 Fuite / chaleur',
  broken_part: '🔧 Pièce cassée',
  other: '❓ Autre'
};

const SEVERITY_LABELS = {
  low: '🟢 Faible',
  medium: '🟠 Moyen',
  high: '🔴 Urgent'
};

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('fr-FR');
  } catch {
    return '';
  }
}

export function renderEquipmentSignalements() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas equipment-signalements-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'equipment_signalements', 'read');
  const canWrite = canResource(su?.role, 'equipment_signalements', 'write');

  page.innerHTML = `
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Terrain</div>
          <h3>Signalements équipement à valider</h3>
        </div>
      </div>
      <div class="eqsig-list-host stack" style="margin-top:12px"></div>
    </article>
  `;

  const listHost = page.querySelector('.eqsig-list-host');

  if (!canRead) {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture des signalements non autorisée pour ce rôle.</p>';
    return page;
  }

  async function review(id, status) {
    try {
      const res = await qhseFetch(`/api/equipment-signalements/${encodeURIComponent(id)}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Signalement mis à jour.', 'success');
      await refreshList();
    } catch {
      showToast('Échec de la mise à jour.', 'error');
    }
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/equipment-signalements?status=pending');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) {
        listHost.replaceChildren();
        listHost.append(createEmptyState('✅', 'Aucun signalement en attente', 'Tous les signalements terrain ont été traités.'));
        return;
      }
      listHost.replaceChildren();
      list.forEach((sig) => {
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
        title.textContent = sig.equipment?.name || 'Équipement';
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        sub.textContent = `${CATEGORY_LABELS[sig.category] || sig.category} · ${fmtDate(sig.createdAt)}${
          sig.reportedBy?.name ? ` · ${sig.reportedBy.name}` : ''
        }`;
        left.append(title, sub);

        const badge = document.createElement('span');
        badge.textContent = SEVERITY_LABELS[sig.severity] || sig.severity || '';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '700';
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '999px';
        badge.style.background = 'var(--surface-2,#f1f5f9)';
        head.append(left, badge);
        row.append(head);

        if (sig.description) {
          const desc = document.createElement('p');
          desc.style.margin = '0';
          desc.style.fontSize = '13px';
          desc.textContent = sig.description;
          row.append(desc);
        }

        const photos = Array.isArray(sig.attachments) ? sig.attachments.filter((a) => a?.kind === 'photo') : [];
        if (photos.length) {
          const photoWrap = document.createElement('div');
          photoWrap.style.display = 'flex';
          photoWrap.style.gap = '8px';
          photoWrap.style.flexWrap = 'wrap';
          photos.slice(0, 4).forEach((p) => {
            const img = document.createElement('img');
            img.src = p.dataUrl;
            img.alt = 'Photo signalement';
            img.style.width = '72px';
            img.style.height = '72px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            img.style.border = '1px solid var(--border1,#334155)';
            photoWrap.append(img);
          });
          row.append(photoWrap);
        }

        if (canWrite) {
          const rowActions = document.createElement('div');
          rowActions.style.display = 'flex';
          rowActions.style.gap = '8px';
          rowActions.style.justifyContent = 'flex-end';

          const validateBtn = document.createElement('button');
          validateBtn.type = 'button';
          validateBtn.className = 'btn btn-primary btn-sm';
          validateBtn.textContent = 'Valider';
          validateBtn.addEventListener('click', () => review(sig.id, 'validated'));

          const infoBtn = document.createElement('button');
          infoBtn.type = 'button';
          infoBtn.className = 'btn btn-secondary btn-sm';
          infoBtn.textContent = 'Infos manquantes';
          infoBtn.addEventListener('click', () => review(sig.id, 'needs_info'));

          const rejectBtn = document.createElement('button');
          rejectBtn.type = 'button';
          rejectBtn.className = 'btn btn-secondary btn-sm';
          rejectBtn.textContent = 'Rejeter';
          rejectBtn.addEventListener('click', () => review(sig.id, 'rejected'));

          rowActions.append(validateBtn, infoBtn, rejectBtn);
          row.append(rowActions);
        }

        listHost.append(row);
      });
    } catch {
      listHost.innerHTML = `<p style="margin:0;font-size:13px;color:var(--text2)">${escapeHtml(
        'Signalements indisponibles : vérifiez l’API.'
      )}</p>`;
    }
  }

  void refreshList();

  return page;
}
