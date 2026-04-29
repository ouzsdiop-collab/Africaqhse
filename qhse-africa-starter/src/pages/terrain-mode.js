import { qhseFetch } from '../utils/qhseFetch.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { queueTerrainIncident, getTerrainQueueState, syncAllTerrainQueues } from '../services/terrainOffline.service.js';
import { appState } from '../utils/state.js';
import { showToast } from '../components/toast.js';
import { isOnline } from '../utils/networkStatus.js';

/**
 * @param {HTMLElement} [container] : hôte optionnel (sinon un div est créé pour le shell).
 * @returns {Promise<HTMLElement>}
 */
export async function renderTerrainMode(container) {
  const root = container ?? document.createElement('div');
  root.className = 'page-stack page-stack--premium-saas terrain-mode-page';

  root.innerHTML = `
    <div class="offline-banner" id="terrain-offline-banner">
      Hors connexion : vos données seront synchronisées à la reconnexion.
    </div>

    <div style="max-width:520px;margin-inline:auto;width:100%;box-sizing:border-box">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <div>
          <h1 style="margin:0;font-size:20px;font-weight:900;letter-spacing:-.02em">Terrain</h1>
          <p id="terrain-active-site" style="margin:6px 0 0;font-size:12px;color:var(--text2,#94a3b8);line-height:1.35">
            Site : <strong>${escapeHtml(String(appState?.currentSite?.name || '—'))}</strong>
          </p>
        </div>
        <span class="sync-badge synced" id="terrain-sync-badge">En ligne</span>
      </div>

      <div class="grid-terrain-2" style="margin-bottom:14px">
        <button class="btn-terrain btn-terrain--danger" id="btn-incident-quick">➕ Incident</button>
        <button class="btn-terrain btn-terrain--primary" id="btn-proof-quick">📷 Preuve</button>
        <button class="btn-terrain btn-terrain--success" id="btn-action-validate-quick">✅ Action</button>
        <button class="btn-terrain btn-terrain--warning" id="btn-actions">Voir mes actions</button>
      </div>

      <div id="terrain-critical" style="margin:0 0 14px"></div>
      <div id="terrain-tasks" style="margin:0 0 14px"></div>
      <div id="terrain-form-zone"></div>
    </div>`;

  // Bandeaux online/offline
  function updateOfflineBanner() {
    const banner = document.getElementById('terrain-offline-banner');
    if (banner) banner.classList.toggle('visible', !navigator.onLine);
  }
  window.addEventListener('online', () => {
    updateOfflineBanner();
    void syncAllTerrainQueues()
      .then(() => {
        showToast('Synchronisation terminée.', 'success');
      })
      .catch(() => {})
      .finally(() => updateSyncBadge());
  });
  window.addEventListener('offline', updateOfflineBanner);
  updateOfflineBanner();

  async function updateSyncBadge() {
    const badge = document.getElementById('terrain-sync-badge');
    if (!badge) return;
    const state = await getTerrainQueueState();
    const pending = (state.pendingIncidents || 0) + (state.pendingRisks || 0);
    const online = isOnline();
    if (!online) {
      badge.textContent = pending > 0 ? `Offline · ${pending} en attente` : 'Offline';
      badge.classList.remove('synced');
      return;
    }
    if (pending > 0) {
      badge.textContent = `${pending} en attente`;
      badge.classList.remove('synced');
      return;
    }
    badge.textContent = 'En ligne';
    badge.classList.add('synced');
  }
  updateSyncBadge();

  function mountQuickIncidentWizard(opts = {}) {
    const zone = document.getElementById('terrain-form-zone');
    if (!zone) return;
    const defaultType = opts.defaultType || 'Sécurité';
    const title = opts.title || 'Déclarer un incident';
    const actionLabel = opts.actionLabel || 'Envoyer';
    const prefill = opts.prefill || '';
    const proofOnly = Boolean(opts.proofOnly);

    zone.innerHTML = `
      <div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:16px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">
          <div>
            <p class="terrain-section-title" style="margin:0">${escapeHtml(title)}</p>
            <p style="margin:6px 0 0;font-size:12px;color:var(--text2,#64748b);line-height:1.35">
              1) Photo (optionnel) · 2) Description · 3) Envoi
            </p>
          </div>
          <button type="button" class="text-button" id="btn-terrain-cancel" style="font-weight:800">Fermer</button>
        </div>

        <div style="display:grid;gap:12px">
          <div>
            <p class="terrain-section-title">Photo (optionnel)</p>
            <input type="file" accept="image/*" capture="environment" id="inc-photo" style="width:100%;color:var(--text-primary,#1e293b)">
          </div>

          <div>
            <p class="terrain-section-title">Description</p>
            <textarea class="field-terrain textarea-terrain" id="inc-description" placeholder="Décrivez en 1-2 phrases (quoi, où, risque immédiat)..." style="min-height:88px">${escapeHtml(
              String(prefill || '')
            )}</textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            ${
              proofOnly
                ? `<button class="btn-terrain btn-terrain--primary" id="btn-send-proof" style="min-height:52px;grid-column:1 / span 2">
                    Enregistrer preuve
                  </button>`
                : `<button class="btn-terrain btn-terrain--primary" id="btn-send-proof" style="min-height:52px">
                    Enregistrer preuve
                  </button>
                  <button class="btn-terrain btn-terrain--danger" id="btn-send-incident" style="min-height:52px">
                    ${escapeHtml(actionLabel)}
                  </button>`
            }
          </div>
        </div>
      </div>`;

    zone.querySelector('#btn-terrain-cancel')?.addEventListener('click', () => {
      zone.replaceChildren();
    });

    async function submit(kind) {
      const description = zone.querySelector('#inc-description')?.value || '';
      const trimmed = String(description || '').trim();
      if (!trimmed) {
        showToast('Ajoutez une description courte.', 'warning');
        return;
      }
      const draft = {
        type: kind === 'proof' ? 'Preuve terrain' : defaultType,
        severity: kind === 'proof' ? 'Faible' : 'Moyen',
        description: trimmed,
        site: appState?.currentSite?.name || 'Terrain'
      };
      await queueTerrainIncident(draft);
      zone.innerHTML =
        `<div style="background:#10b98122;border:1px solid #10b981;border-radius:10px;padding:14px;color:#10b981;font-weight:800;text-align:center">
          ${kind === 'proof' ? 'Preuve enregistrée' : 'Incident enregistré'} · ${isOnline() ? 'Synchronisation en cours' : 'Sauvegardé offline'}
        </div>`;
      showToast(isOnline() ? 'Envoyé (sync en cours).' : 'Sauvegardé offline.', 'success');
      updateSyncBadge();
      void refreshTerrainHome().catch(() => {});
    }

    zone.querySelector('#btn-send-incident')?.addEventListener('click', () => submit('incident'));
    zone.querySelector('#btn-send-proof')?.addEventListener('click', () => submit('proof'));
  }

  function mountActionsQuickList(kind = 'overdue') {
    const zone = document.getElementById('terrain-form-zone');
    if (!zone) return;
    void (async () => {
      zone.replaceChildren();
      const loadingWrap = document.createElement('div');
      loadingWrap.style.cssText = 'padding:14px;text-align:center;color:var(--text-muted,#64748b)';
      loadingWrap.textContent = 'Chargement...';
      zone.append(loadingWrap);
      try {
        const userId = appState?.currentUser?.id;
        const url = userId ? `/api/actions?assigneeId=${userId}&status=open` : '/api/actions?status=open';
        const res = await qhseFetch(url);
        const { data: actions } = await res.json();
        const list = Array.isArray(actions) ? actions : [];
        const now = new Date();
        const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const today0 = startOf(now).getTime();
        const isOverdue = (a) => a?.dueDate && startOf(new Date(a.dueDate)).getTime() < today0;
        const isToday = (a) => a?.dueDate && startOf(new Date(a.dueDate)).getTime() === today0;
        const filtered = kind === 'today' ? list.filter(isToday) : list.filter(isOverdue);

        zone.replaceChildren();
        const wrap = document.createElement('div');
        wrap.style.cssText = 'background:var(--surface-2,#f8fafc);border-radius:12px;padding:16px';
        wrap.innerHTML = `
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">
            <div>
              <p class="terrain-section-title" style="margin:0">${kind === 'today' ? 'Actions du jour' : 'Actions en retard'}</p>
              <p style="margin:6px 0 0;font-size:12px;color:var(--text2,#64748b)">${filtered.length} élément(s)</p>
            </div>
            <button type="button" class="text-button" data-close style="font-weight:800">Fermer</button>
          </div>
        `;
        wrap.querySelector('[data-close]')?.addEventListener('click', () => zone.replaceChildren());

        if (!filtered.length) {
          const empty = document.createElement('div');
          empty.style.cssText = 'padding:10px 0;text-align:center;color:#10b981;font-weight:700';
          empty.textContent = 'Rien à traiter.';
          wrap.append(empty);
          zone.append(wrap);
          return;
        }

        filtered.slice(0, 8).forEach((a) => {
          const row = document.createElement('div');
          row.style.cssText = 'padding:12px 0;border-top:1px solid var(--border-color,#e2e8f0)';
          const tEl = document.createElement('div');
          tEl.style.cssText = 'font-weight:800;font-size:14px;line-height:1.25';
          tEl.textContent = a.title || 'Action';
          const dueEl = document.createElement('div');
          dueEl.style.cssText = 'font-size:12px;color:var(--text-muted,#64748b);margin-top:6px';
          dueEl.textContent = `Échéance : ${a.dueDate ? new Date(a.dueDate).toLocaleDateString('fr-FR') : 'N/A'}`;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-terrain btn-terrain--success';
          btn.style.cssText = 'margin-top:10px;min-height:52px;font-size:14px';
          btn.textContent = 'Valider (fait)';
          const id = a.id != null ? String(a.id) : '';
          btn.addEventListener('click', async () => {
            if (!id) return;
            try {
              await qhseFetch(`/api/actions/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'done' })
              });
              row.style.opacity = '0.45';
              btn.textContent = 'Validée';
              btn.disabled = true;
              showToast('Action validée.', 'success');
              void refreshTerrainHome().catch(() => {});
            } catch {
              showToast("Impossible de valider l’action.", 'error');
            }
          });
          row.append(tEl, dueEl, btn);
          wrap.append(row);
        });
        zone.append(wrap);
      } catch {
        zone.replaceChildren();
        showToast('Impossible de charger les actions.', 'error');
      }
    })();
  }

  async function refreshTerrainHome() {
    const criticalHost = document.getElementById('terrain-critical');
    const tasksHost = document.getElementById('terrain-tasks');
    if (!criticalHost || !tasksHost) return;

    const q = await getTerrainQueueState().catch(() => ({ pendingIncidents: 0, pendingRisks: 0 }));
    const pending = (q.pendingIncidents || 0) + (q.pendingRisks || 0);

    /** @type {any[]} */
    let actions = [];
    try {
      const userId = appState?.currentUser?.id;
      const url = userId ? `/api/actions?assigneeId=${userId}&status=open` : '/api/actions?status=open';
      const res = await qhseFetch(url);
      const j = await res.json();
      actions = Array.isArray(j?.data) ? j.data : [];
    } catch {
      actions = [];
    }

    const now = new Date();
    const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today0 = startOf(now).getTime();
    const isOverdue = (a) => a?.dueDate && startOf(new Date(a.dueDate)).getTime() < today0;
    const isToday = (a) => a?.dueDate && startOf(new Date(a.dueDate)).getTime() === today0;
    const overdue = actions.filter(isOverdue);
    const today = actions.filter(isToday);

    const isCrit = !isOnline() || pending > 0 || overdue.length > 0;
    if (!isCrit) {
      criticalHost.replaceChildren();
    } else {
      const critLines = [];
      if (!isOnline()) critLines.push('Offline : les envois partiront à la reconnexion.');
      if (pending > 0) critLines.push(`${pending} élément(s) en attente de synchronisation.`);
      if (overdue.length > 0) critLines.push(`${overdue.length} action(s) en retard à traiter.`);
      criticalHost.innerHTML = `
        <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.35);border-radius:12px;padding:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <strong style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ef4444">Alertes critiques</strong>
            <span style="font-size:12px;font-weight:900;color:#ef4444">${!isOnline() ? 'OFFLINE' : pending > 0 ? 'SYNC' : 'RETARD'}</span>
          </div>
          <div style="margin-top:8px;display:grid;gap:6px">
            ${critLines
              .slice(0, 3)
              .map((t) => `<div style="font-size:13px;color:var(--text,#0f172a);font-weight:800;line-height:1.25">${escapeHtml(t)}</div>`)
              .join('')}
          </div>
        </div>
      `;
    }

    const topOverdue = overdue.slice(0, 3);
    const topToday = today.slice(0, 5);

    tasksHost.innerHTML = `
      <div style="background:color-mix(in srgb,var(--surface-2,#f8fafc) 92%,transparent);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:14px">
        <p class="terrain-section-title" style="margin:0 0 8px">Actions</p>
        ${
          topOverdue.length
            ? `<div style="display:grid;gap:8px;margin-bottom:12px">
                <p style="margin:0;color:var(--text2,#64748b);font-size:12px;font-weight:900">En retard</p>
                ${topOverdue
                  .map(
                    (a) => `<div style="background:rgba(0,0,0,.03);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:12px">
                      <div style="font-weight:900;font-size:14px;line-height:1.25">${escapeHtml(String(a.title || 'Action').slice(0, 90))}</div>
                      <div style="margin-top:6px;font-size:12px;color:var(--text2,#64748b)">Échéance : ${
                        a.dueDate ? escapeHtml(new Date(a.dueDate).toLocaleDateString('fr-FR')) : 'N/A'
                      }</div>
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
                        <button type="button" class="btn-terrain btn-terrain--primary" data-proof-action="${escapeHtml(String(a.id || ''))}" style="min-height:52px">📷 Preuve</button>
                        <button type="button" class="btn-terrain btn-terrain--success" data-done-action="${escapeHtml(String(a.id || ''))}" style="min-height:52px">✅ Valider</button>
                      </div>
                    </div>`
                  )
                  .join('')}
              </div>`
            : `<p style="margin:0 0 10px;color:var(--text2,#64748b);font-size:12px">Aucun retard détecté.</p>`
        }
        ${
          topToday.length
            ? `<div style="display:grid;gap:8px">
                <p style="margin:0;color:var(--text2,#64748b);font-size:12px;font-weight:900">Du jour (max 5)</p>
                ${topToday
                  .map(
                    (a) => `<div style="background:rgba(0,0,0,.02);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:12px">
                      <div style="font-weight:900;font-size:14px;line-height:1.25">${escapeHtml(String(a.title || 'Action').slice(0, 90))}</div>
                      <div style="margin-top:6px;font-size:12px;color:var(--text2,#64748b)">Aujourd’hui</div>
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
                        <button type="button" class="btn-terrain btn-terrain--primary" data-proof-action="${escapeHtml(String(a.id || ''))}" style="min-height:52px">📷 Preuve</button>
                        <button type="button" class="btn-terrain btn-terrain--success" data-done-action="${escapeHtml(String(a.id || ''))}" style="min-height:52px">✅ Valider</button>
                      </div>
                    </div>`
                  )
                  .join('')}
              </div>`
            : `<p style="margin:0;color:var(--text2,#64748b);font-size:12px">Aucune action du jour.</p>`
        }
      </div>
    `;

    tasksHost.querySelectorAll('[data-done-action]').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-done-action') || '';
        if (!id) return;
        try {
          await qhseFetch(`/api/actions/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' })
          });
          showToast('Action validée.', 'success');
          void refreshTerrainHome().catch(() => {});
        } catch {
          showToast("Impossible de valider l’action.", 'error');
        }
      });
    });
    tasksHost.querySelectorAll('[data-proof-action]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-proof-action') || '';
        mountQuickIncidentWizard({
          title: 'Preuve pour action',
          actionLabel: 'Enregistrer',
          defaultType: 'Preuve terrain',
          proofOnly: true,
          prefill: id ? `Action #${id} - Preuve : ` : 'Preuve : '
        });
      });
    });
  }

  // Quick actions (Accueil terrain)
  document.getElementById('btn-incident-quick')?.addEventListener('click', () => {
    mountQuickIncidentWizard({ title: 'Déclarer un incident', actionLabel: 'Envoyer incident', defaultType: 'Sécurité' });
  });
  document.getElementById('btn-proof-quick')?.addEventListener('click', () => {
    mountQuickIncidentWizard({ title: 'Ajouter une preuve (photo + note)', actionLabel: 'Enregistrer', defaultType: 'Preuve terrain' });
  });
  document.getElementById('btn-action-validate-quick')?.addEventListener('click', () => {
    mountActionsQuickList('overdue');
  });

  void refreshTerrainHome();

  // Le registre risques + checklists restent accessibles via les pages dédiées (navigation terrain),
  // mais l'accueil terrain est volontairement réduit à actions/incidents/preuves.

  // MES ACTIONS DU JOUR
  document.getElementById('btn-actions')?.addEventListener('click', async () => {
    const zone = document.getElementById('terrain-form-zone');
    if (!zone) return;
    zone.replaceChildren();
    const loadingWrap = document.createElement('div');
    loadingWrap.style.cssText =
      'padding:16px;text-align:center;color:var(--text-muted,#64748b)';
    loadingWrap.textContent = 'Chargement...';
    zone.append(loadingWrap);
    try {
      const userId = appState?.currentUser?.id;
      const url = userId ? `/api/actions?assigneeId=${userId}&status=open` : '/api/actions?status=open';
      const res = await qhseFetch(url);
      const { data: actions } = await res.json();
      zone.replaceChildren();
      if (!actions?.length) {
        const empty = document.createElement('div');
        empty.style.cssText =
          'padding:16px;text-align:center;color:#10b981;font-weight:600';
        empty.textContent = 'Aucune action en cours';
        zone.append(empty);
        return;
      }
      const wrap = document.createElement('div');
      wrap.style.cssText =
        'background:var(--surface-2,#f8fafc);border-radius:12px;padding:20px';
      const title = document.createElement('p');
      title.className = 'terrain-section-title';
      title.textContent = `Mes actions (${actions.length})`;
      wrap.append(title);
      for (const a of actions.slice(0, 10)) {
        const row = document.createElement('div');
        row.style.cssText =
          'padding:12px 0;border-bottom:1px solid var(--border-color,#e2e8f0)';
        const tEl = document.createElement('div');
        tEl.style.cssText = 'font-weight:600;font-size:14px';
        tEl.textContent = a.title || 'Non renseigné';
        const dueEl = document.createElement('div');
        dueEl.style.cssText =
          'font-size:12px;color:var(--text-muted,#64748b);margin-top:4px';
        dueEl.textContent = `Echeance : ${
          a.dueDate ? new Date(a.dueDate).toLocaleDateString('fr-FR') : 'N/A'
        }`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-terrain btn-terrain--success';
        btn.style.cssText = 'margin-top:8px;min-height:40px;font-size:13px';
        btn.textContent = 'Marquer fait';
        if (a.id != null) btn.dataset.actionId = String(a.id);
        btn.addEventListener('click', async () => {
          const id = btn.dataset.actionId;
          if (!id) return;
          await qhseFetch(`/api/actions/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' })
          }).catch(() => {});
          row.style.opacity = '0.4';
          btn.textContent = 'Fait !';
          btn.disabled = true;
          showToast('Action validée.', 'success');
          void refreshTerrainHome().catch(() => {});
        });
        row.append(tEl, dueEl, btn);
        wrap.append(row);
      }
      zone.append(wrap);
    } catch {
      zone.replaceChildren();
      const err = document.createElement('div');
      err.style.cssText = 'padding:16px;color:#ef4444';
      err.textContent = 'Erreur de chargement';
      zone.append(err);
    }
  });

  // Rafraîchit les badges (online/offline + en attente) sans charger de gros volumes.
  window.setInterval(() => {
    void updateSyncBadge();
  }, 8000);

  return root;
}
