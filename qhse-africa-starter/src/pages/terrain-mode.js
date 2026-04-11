import { qhseFetch } from '../utils/qhseFetch.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { queueTerrainIncident, queueTerrainRisk, getTerrainQueueState, syncAllTerrainQueues } from '../services/terrainOffline.service.js';
import { appState } from '../utils/state.js';

export async function renderTerrainMode(container) {
  container.innerHTML = `
    <div class="offline-banner" id="terrain-offline-banner">
      Hors connexion — vos donnees seront synchronisees a la reconnexion
      </div>
    <div style="padding:16px;max-width:480px;margin:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h1 style="margin:0;font-size:20px;font-weight:700">Mode terrain</h1>
        <span class="sync-badge synced" id="terrain-sync-badge">Synchronise</span>
      </div>

      <div class="grid-terrain-2" style="margin-bottom:24px">
        <button class="btn-terrain btn-terrain--danger" id="btn-incident">
          Incident
        </button>
        <button class="btn-terrain btn-terrain--warning" id="btn-risque">
          Risque
        </button>
        <button class="btn-terrain btn-terrain--success" id="btn-checklist">
          Checklist
        </button>
        <button class="btn-terrain btn-terrain--primary" id="btn-actions">
          Mes actions
        </button>
      </div>

      <div id="terrain-form-zone"></div>
      <div id="terrain-recents" style="margin-top:24px"></div>
    </div>`;

  // Bandeaux online/offline
  function updateOfflineBanner() {
    const banner = document.getElementById('terrain-offline-banner');
    if (banner) banner.classList.toggle('visible', !navigator.onLine);
  }
  window.addEventListener('online', () => { updateOfflineBanner(); syncAllTerrainQueues().then(updateSyncBadge); });
  window.addEventListener('offline', updateOfflineBanner);
  updateOfflineBanner();

  async function updateSyncBadge() {
    const badge = document.getElementById('terrain-sync-badge');
    if (!badge) return;
    const state = await getTerrainQueueState();
    const pending = (state.pendingIncidents || 0) + (state.pendingRisks || 0);
    if (pending > 0) {
      badge.textContent = `${pending} en attente`;
      badge.classList.remove('synced');
    } else {
      badge.textContent = 'Synchronise';
      badge.classList.add('synced');
    }
  }
  updateSyncBadge();

  // FORMULAIRE INCIDENT
  document.getElementById('btn-incident')?.addEventListener('click', () => {
    document.getElementById('terrain-form-zone').innerHTML = `
      <div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:20px">
        <p class="terrain-section-title">Type d'incident</p>
        <div class="terrain-chip-group" id="chips-type">
          ${['Quasi-accident','Accident','Securite','Environnement','Autre'].map(t =>
            `<button class="terrain-chip" data-val="${t}">${t}</button>`).join('')}
        </div>
        <p class="terrain-section-title" style="margin-top:16px">Gravite</p>
        <div class="terrain-chip-group" id="chips-severity">
          ${['Faible','Moyen','Grave','Critique'].map(s =>
            `<button class="terrain-chip" data-val="${s}">${s}</button>`).join('')}
        </div>
        <p class="terrain-section-title" style="margin-top:16px">Description</p>
        <textarea class="field-terrain textarea-terrain" id="inc-description" placeholder="Decrivez l'incident..."></textarea>
        <p class="terrain-section-title" style="margin-top:16px">Photo</p>
        <input type="file" accept="image/*" capture="environment" id="inc-photo" style="color:var(--text-primary,#1e293b);margin-bottom:16px">
        <button class="btn-terrain btn-terrain--danger" id="btn-send-incident" style="margin-top:8px">
          Envoyer l'incident
        </button>
      </div>`;

    // Gestion chips
    ['chips-type','chips-severity'].forEach(groupId => {
      document.getElementById(groupId)?.querySelectorAll('.terrain-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.getElementById(groupId).querySelectorAll('.terrain-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        });
      });
    });

    document.getElementById('btn-send-incident')?.addEventListener('click', async () => {
      const type = document.querySelector('#chips-type .active')?.dataset.val || 'Autre';
      const severity = document.querySelector('#chips-severity .active')?.dataset.val || 'Faible';
      const description = document.getElementById('inc-description')?.value || '';
      const draft = { type, severity, description, site: appState?.currentSite?.name || 'Terrain' };
      await queueTerrainIncident(draft);
      document.getElementById('terrain-form-zone').innerHTML =
        `<div style="background:#10b98122;border:1px solid #10b981;border-radius:10px;padding:16px;color:#10b981;font-weight:600;text-align:center">
          Incident enregistre et en cours de synchronisation
        </div>`;
      updateSyncBadge();
    });
  });

  // FORMULAIRE RISQUE
  document.getElementById('btn-risque')?.addEventListener('click', () => {
    document.getElementById('terrain-form-zone').innerHTML = `
      <div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:20px">
        <p class="terrain-section-title">Titre du risque</p>
        <input class="field-terrain" id="risk-title" placeholder="Ex: Produit chimique non etiquete">
        <p class="terrain-section-title" style="margin-top:16px">Probabilite (1 a 5)</p>
        <div class="terrain-chip-group" id="chips-proba">
          ${[1,2,3,4,5].map(n => `<button class="terrain-chip" data-val="${n}">${n}</button>`).join('')}
        </div>
        <p class="terrain-section-title" style="margin-top:16px">Description</p>
        <textarea class="field-terrain textarea-terrain" id="risk-description" placeholder="Contexte, localisation..."></textarea>
        <button class="btn-terrain btn-terrain--warning" id="btn-send-risk" style="margin-top:16px">
          Enregistrer le risque
        </button>
      </div>`;

    document.getElementById('chips-proba')?.querySelectorAll('.terrain-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('chips-proba').querySelectorAll('.terrain-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    document.getElementById('btn-send-risk')?.addEventListener('click', async () => {
      const title = document.getElementById('risk-title')?.value || 'Risque terrain';
      const probability = Number(document.querySelector('#chips-proba .active')?.dataset.val || 1);
      const description = document.getElementById('risk-description')?.value || '';
      await queueTerrainRisk({ title, probability, description });
      document.getElementById('terrain-form-zone').innerHTML =
        `<div style="background:#10b98122;border:1px solid #10b981;border-radius:10px;padding:16px;color:#10b981;font-weight:600;text-align:center">
          Risque enregistre et en cours de synchronisation
        </div>`;
      updateSyncBadge();
    });
  });

  // CHECKLIST RAPIDE
  document.getElementById('btn-checklist')?.addEventListener('click', () => {
    const items = [
      'EPI portes par tous les operateurs',
      'Zone de travail balisee',
      'Permis de travail signe',
      'Equipements verifies avant utilisation',
      'Acces secours degage'
    ];
    document.getElementById('terrain-form-zone').innerHTML = `
      <div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:20px">
        <p class="terrain-section-title">Checklist securite terrain</p>
        ${items.map((item, i) => `
          <label style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-color,#e2e8f0);cursor:pointer">
            <input type="checkbox" id="chk-${i}" style="width:20px;height:20px;accent-color:#10b981">
            <span style="font-size:15px">${escapeHtml(item)}</span>
          </label>`).join('')}
        <button class="btn-terrain btn-terrain--success" id="btn-send-checklist" style="margin-top:16px">
          Valider la checklist
        </button>
      </div>`;

    document.getElementById('btn-send-checklist')?.addEventListener('click', async () => {
      const checked = items.filter((_, i) => document.getElementById(`chk-${i}`)?.checked);
      const score = Math.round((checked.length / items.length) * 100);
      await qhseFetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Checklist terrain — ${new Date().toLocaleDateString('fr-FR')}`,
          type: 'checklist_terrain',
          status: 'completed',
          score,
          notes: `Points valides : ${checked.join(', ')}`
        })
      }).catch(() => {});
      document.getElementById('terrain-form-zone').innerHTML =
        `<div style="background:#10b98122;border:1px solid #10b981;border-radius:10px;padding:16px;color:#10b981;font-weight:600;text-align:center">
          Checklist validee — Score : ${score}/100
        </div>`;
    });
  });

  // MES ACTIONS DU JOUR
  document.getElementById('btn-actions')?.addEventListener('click', async () => {
    const zone = document.getElementById('terrain-form-zone');
    zone.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted,#64748b)">Chargement...</div>`;
    try {
      const userId = appState?.currentUser?.id;
      const url = userId ? `/api/actions?assigneeId=${userId}&status=open` : '/api/actions?status=open';
      const res = await qhseFetch(url);
      const { data: actions } = await res.json();
      if (!actions?.length) {
        zone.innerHTML = `<div style="padding:16px;text-align:center;color:#10b981;font-weight:600">Aucune action en cours</div>`;
        return;
      }
      zone.innerHTML = `
        <div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:20px">
          <p class="terrain-section-title">Mes actions (${actions.length})</p>
          ${actions.slice(0,10).map(a => `
            <div style="padding:12px 0;border-bottom:1px solid var(--border-color,#e2e8f0)">
              <div style="font-weight:600;font-size:14px">${escapeHtml(a.title)}</div>
              <div style="font-size:12px;color:var(--text-muted,#64748b);margin-top:4px">
                Echeance : ${a.dueDate ? new Date(a.dueDate).toLocaleDateString('fr-FR') : 'N/A'}
              </div>
              <button class="btn-terrain btn-terrain--success" data-action-id="${a.id}"
                style="margin-top:8px;min-height:40px;font-size:13px">
                Marquer fait
              </button>
            </div>`).join('')}
        </div>`;

      zone.querySelectorAll('[data-action-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.actionId;
          await qhseFetch(`/api/actions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' })
          }).catch(() => {});
          btn.closest('div[style]').style.opacity = '0.4';
          btn.textContent = 'Fait !';
          btn.disabled = true;
        });
      });
    } catch {
      zone.innerHTML = `<div style="padding:16px;color:#ef4444">Erreur de chargement</div>`;
    }
  });
}
