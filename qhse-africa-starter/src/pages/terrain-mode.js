import { notificationsStore } from '../data/notifications.js';
import { showToast } from '../components/toast.js';
import {
  getTerrainQueueState,
  queueTerrainIncident,
  syncTerrainIncidentQueue
} from '../services/terrainOffline.service.js';
import { qhseFetch } from '../utils/qhseFetch.js';

const STYLE_ID = 'qhse-terrain-mode-styles';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
.terrain-mode-page{gap:12px}
.terrain-mode-actions{display:grid;grid-template-columns:1fr;gap:10px}
.terrain-mode-action{min-height:72px;display:flex;align-items:center;gap:12px;justify-content:flex-start;padding:14px;border-radius:14px;border:1px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--text);font-weight:800;font-size:15px}
.terrain-mode-action__icon{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;background:color-mix(in srgb, var(--app-accent,#14b8a6) 20%, transparent)}
.terrain-mode-quick{display:grid;gap:8px}
.terrain-mode-quick .control-input,.terrain-mode-quick .control-select{min-height:44px}
.terrain-mode-status{font-size:12px;color:var(--text2)}
.terrain-mode-critical{padding:12px;border:1px solid color-mix(in srgb,#ef4444 40%, var(--color-border-secondary));border-radius:12px;background:color-mix(in srgb,#ef4444 8%, transparent)}
.terrain-mode-critical h3{margin:0 0 8px;font-size:14px}
.terrain-mode-critical ul{margin:0;padding-left:18px;display:grid;gap:6px}
.terrain-mode-critical li{font-size:13px}
@media (min-width:720px){.terrain-mode-actions{grid-template-columns:1fr 1fr}}
`;
  document.head.append(el);
}

function criticalAlerts() {
  const seen = new Set();
  return notificationsStore
    .all()
    .filter((n) => n?.level === 'critical' || n?.priority === 'critical' || n?.priority === 'high')
    .filter((n) => {
      const key = `${n?.kind || ''}:${n?.title || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function normalizeCriticalAlerts(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .filter((n) => n?.level === 'critical' || n?.priority === 'critical' || n?.priority === 'high')
    .filter((n) => {
      const key = `${n?.kind || ''}:${n?.title || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export function renderTerrainMode() {
  ensureStyles();
  const page = document.createElement('section');
  page.className = 'page-stack terrain-mode-page';
  const critical = criticalAlerts();
  page.innerHTML = `
    <section class="page-intro module-page-hero">
      <div class="module-page-hero__inner">
        <p class="page-intro__kicker section-kicker">Mode terrain</p>
        <h1 class="page-intro__title">Accès rapide chantier</h1>
        <p class="page-intro__desc">Uniquement l’essentiel: déclarer, agir, contrôler les alertes critiques.</p>
      </div>
    </section>
    <article class="content-card card-soft">
      <div class="terrain-mode-quick">
        <label class="field"><span>Incident rapide</span><input class="control-input" data-f="title" placeholder="Titre incident" /></label>
        <label class="field"><span>Zone</span><input class="control-input" data-f="zone" placeholder="Zone chantier" /></label>
        <label class="field"><span>Niveau</span><select class="control-select" data-f="severity"><option value="high">Élevé</option><option value="critical">Critique</option></select></label>
        <label class="field"><span>Description</span><textarea class="control-input" data-f="description" rows="2" placeholder="Description courte"></textarea></label>
        <button type="button" class="btn btn-primary" data-submit-incident>Enregistrer incident (offline possible)</button>
        <div class="terrain-mode-status" data-queue-status></div>
      </div>
    </article>
    <article class="content-card card-soft">
      <div class="terrain-mode-actions">
        <button type="button" class="terrain-mode-action" data-go="incidents"><span class="terrain-mode-action__icon">!</span><span>Déclarer incident</span><span class="badge amber" data-incident-pending-badge>0</span></button>
        <button type="button" class="terrain-mode-action" data-go="permits"><span class="terrain-mode-action__icon">⌁</span><span>Créer un permis (PTW)</span></button>
        <button type="button" class="terrain-mode-action" data-go="actions"><span class="terrain-mode-action__icon">✓</span><span>Voir mes actions</span></button>
        <button type="button" class="terrain-mode-action" data-go="dashboard"><span class="terrain-mode-action__icon">⚠</span><span>Voir alertes</span></button>
      </div>
    </article>
    <article class="content-card card-soft terrain-mode-critical">
      <h3>Alertes critiques</h3>
      <div data-critical-alerts-host>
        ${
          critical.length
            ? `<ul>${critical.map((a) => `<li><strong>${a.title || 'Alerte'}</strong>${a.detail ? ` — ${a.detail}` : ''}</li>`).join('')}</ul>`
            : '<p class="ptw-mini">Aucune alerte critique active.</p>'
        }
      </div>
    </article>
  `;

  const queueStatusEl = page.querySelector('[data-queue-status]');
  const pendingBadgeEl = page.querySelector('[data-incident-pending-badge]');
  const criticalHost = page.querySelector('[data-critical-alerts-host]');
  function renderCriticalAlerts(list) {
    const alerts = normalizeCriticalAlerts(list);
    if (!criticalHost) return;
    criticalHost.innerHTML = alerts.length
      ? `<ul>${alerts.map((a) => `<li><strong>${a.title || 'Alerte'}</strong>${a.detail ? ` — ${a.detail}` : ''}</li>`).join('')}</ul>`
      : '<p class="ptw-mini">Aucune alerte critique active.</p>';
  }
  function updateQueueStatus() {
    const st = getTerrainQueueState();
    queueStatusEl.textContent = `${st.online ? 'En ligne' : 'Hors ligne'} · ${st.pendingIncidents} incident(s) en attente de synchronisation`;
    if (pendingBadgeEl) {
      pendingBadgeEl.textContent = String(st.pendingIncidents);
      pendingBadgeEl.hidden = st.pendingIncidents <= 0;
    }
  }

  const submitBtn = page.querySelector('[data-submit-incident]');
  submitBtn.addEventListener('click', async () => {
    const title = page.querySelector('[data-f="title"]').value.trim();
    const zone = page.querySelector('[data-f="zone"]').value.trim();
    const description = page.querySelector('[data-f="description"]').value.trim();
    const severity = page.querySelector('[data-f="severity"]').value;
    if (!title || !zone) {
      showToast('Titre et zone requis.', 'error');
      return;
    }
    await queueTerrainIncident({ title, zone, description, severity });
    page.querySelector('[data-f="title"]').value = '';
    page.querySelector('[data-f="zone"]').value = '';
    page.querySelector('[data-f="description"]').value = '';
    showToast('Incident enregistré (sync auto si réseau).', 'success');
    updateQueueStatus();
  });

  window.addEventListener('online', async () => {
    const r = await syncTerrainIncidentQueue();
    if (r.synced) showToast(`${r.synced} incident(s) synchronisé(s).`, 'success');
    updateQueueStatus();
  });
  window.addEventListener('offline', updateQueueStatus);
  void (async () => {
    if (navigator.onLine) {
      await syncTerrainIncidentQueue().catch(() => {});
    }
    try {
      const res = await qhseFetch('/api/notifications');
      if (!res.ok) throw new Error('notifications_not_ok');
      const data = await res.json().catch(() => []);
      renderCriticalAlerts(data);
    } catch {
      renderCriticalAlerts(notificationsStore.all());
    } finally {
      updateQueueStatus();
    }
  })();
  updateQueueStatus();

  page.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-go') || 'dashboard';
      window.location.hash = target;
    });
  });
  return page;
}
