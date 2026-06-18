/**
 * Carte « Pilotage terrain » : synthèse des 3 modules opérationnels récents
 * (Équipements/EPI, Environnement, Presque-accidents) sur le tableau de bord.
 * Fetch autonome, pas de dépendance aux stats du dashboard principal.
 */
import { qhseFetch } from '../utils/qhseFetch.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

function tile(label, value, tone, onClick) {
  const art = document.createElement('article');
  art.className = `dashboard-ops-card dashboard-ops-card--${tone}`;
  art.setAttribute('role', 'button');
  art.setAttribute('tabindex', '0');
  art.setAttribute('aria-label', `Ouvrir ${label}`);
  const k = document.createElement('div');
  k.className = 'dashboard-ops-card__k';
  k.textContent = label;
  const v = document.createElement('div');
  v.className = 'dashboard-ops-card__v';
  v.textContent = String(value);
  art.append(k, v);
  art.addEventListener('click', onClick);
  art.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });
  return art;
}

export function createDashboardTerrainOpsSummary() {
  const root = document.createElement('article');
  root.className = 'content-card card-soft dashboard-terrain-ops-summary';
  root.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Pilotage terrain</div>
        <h3>Équipements, environnement, presque-accidents</h3>
      </div>
    </div>
    <div class="dashboard-ops-grid dashboard-terrain-ops-grid" style="margin-top:12px"></div>
  `;
  const grid = root.querySelector('.dashboard-terrain-ops-grid');

  async function refresh() {
    grid.replaceChildren();
    const [equipmentRes, nearMissRes, environmentalRes] = await Promise.allSettled([
      qhseFetch('/api/equipment/alerts'),
      qhseFetch('/api/near-misses'),
      qhseFetch('/api/environmental/summary')
    ]);

    let equipmentAlertsCount = null;
    if (equipmentRes.status === 'fulfilled' && equipmentRes.value.ok) {
      const body = await equipmentRes.value.json().catch(() => ({}));
      equipmentAlertsCount = Array.isArray(body?.alerts) ? body.alerts.length : null;
    }

    let nearMissOpenCount = null;
    if (nearMissRes.status === 'fulfilled' && nearMissRes.value.ok) {
      const rows = await nearMissRes.value.json().catch(() => []);
      nearMissOpenCount = Array.isArray(rows)
        ? rows.filter((r) => r.status !== 'closed').length
        : null;
    }

    let environmentalCategories = null;
    if (environmentalRes.status === 'fulfilled' && environmentalRes.value.ok) {
      const body = await environmentalRes.value.json().catch(() => ({}));
      const byType = body?.summary?.byType;
      environmentalCategories = Array.isArray(byType) ? byType.length : null;
    }

    grid.append(
      tile(
        'Alertes équipements/EPI',
        equipmentAlertsCount ?? '—',
        equipmentAlertsCount ? 'orange' : 'green',
        () => qhseNavigate('equipment', { source: 'dashboard_terrain_ops' })
      ),
      tile(
        'Presque-accidents ouverts',
        nearMissOpenCount ?? '—',
        nearMissOpenCount ? 'orange' : 'green',
        () => qhseNavigate('near-misses', { source: 'dashboard_terrain_ops' })
      ),
      tile(
        'Catégories environnement suivies',
        environmentalCategories ?? '—',
        'green',
        () => qhseNavigate('environmental', { source: 'dashboard_terrain_ops' })
      )
    );
  }

  refresh().catch(() => {
    grid.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Synthèse terrain indisponible : vérifiez l’API.</p>';
  });

  return { root, refresh };
}
