/**
 * Bloc « Aujourd'hui » — visible en mode simplifié via displayModes.css (.dashboard-today-block).
 */

import { escapeHtml } from '../utils/escapeHtml.js';

export function createDashboardTodayBlock({
  sessionUser = null,
  incidents = 0,
  overdueActionItems = [],
  criticalIncidents = []
} = {}) {
  const root = document.createElement('div');
  root.className = 'dashboard-today-block';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', "Aujourd'hui");

  let state = { sessionUser, incidents, overdueActionItems, criticalIncidents };

  function render() {
    const u = state.sessionUser;
    const greet = u?.name || u?.email || 'Utilisateur';
    const nLate = Array.isArray(state.overdueActionItems) ? state.overdueActionItems.length : 0;
    const nCrit = Array.isArray(state.criticalIncidents) ? state.criticalIncidents.length : 0;
    const inc =
      typeof state.incidents === 'number' && !Number.isNaN(state.incidents) ? state.incidents : 0;

    root.innerHTML = `
      <div class="dashboard-today-block__inner">
        <div class="dashboard-today-block__title">Aujourd'hui</div>
        <div class="dashboard-today-block__greet">${escapeHtml(greet)}</div>
        <div class="dashboard-today-block__stats">
          <span class="dashboard-today-block__stat"><strong>${escapeHtml(String(inc))}</strong> incidents (total)</span>
          <span class="dashboard-today-block__stat"><strong>${escapeHtml(String(nCrit))}</strong> incidents critiques</span>
          <span class="dashboard-today-block__stat"><strong>${escapeHtml(String(nLate))}</strong> actions en retard</span>
        </div>
      </div>
    `;
  }

  root.update = (patch) => {
    state = { ...state, ...patch };
    render();
  };

  render();
  return root;
}
