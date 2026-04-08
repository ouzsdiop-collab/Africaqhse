import { moduleMeta } from './activityLogHelpers.js';
import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * Bandeau de synthèse du journal — prêt pour enrichissement futur (filtres / recherche).
 * @param {{ total: number, lastActivity: string, recentModuleKeys: string[] }} snapshot
 */
export function createActivityLogSummary(snapshot) {
  const wrap = document.createElement('div');
  wrap.className = 'activity-log-summary';

  const totalCard = document.createElement('div');
  totalCard.className = 'activity-log-summary-card';
  totalCard.innerHTML = `
    <span class="activity-log-summary-k">Entrées enregistrées</span>
    <span class="activity-log-summary-v">${snapshot.total}</span>
    <span class="activity-log-summary-h">Périmètre du journal (session)</span>
  `;

  const modCard = document.createElement('div');
  modCard.className = 'activity-log-summary-card activity-log-summary-card--stretch';
  const kMod = document.createElement('span');
  kMod.className = 'activity-log-summary-k';
  kMod.textContent = 'Modules récents';
  const chips = document.createElement('div');
  chips.className = 'activity-log-summary-chips';
  if (snapshot.recentModuleKeys.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'activity-log-summary-empty';
    empty.textContent = 'Aucune entrée';
    chips.append(empty);
  } else {
    snapshot.recentModuleKeys.forEach((key) => {
      const m = moduleMeta(key);
      const chip = document.createElement('span');
      chip.className = `activity-log-summary-chip ${m.className}`;
      chip.title = m.label;
      chip.textContent = m.short;
      chips.append(chip);
    });
  }
  const hMod = document.createElement('span');
  hMod.className = 'activity-log-summary-h';
  hMod.textContent = 'D’après les dernières lignes (ordre temps décroissant)';
  modCard.append(kMod, chips, hMod);

  const timeCard = document.createElement('div');
  timeCard.className = 'activity-log-summary-card';
  timeCard.innerHTML = `
    <span class="activity-log-summary-k">Dernière activité</span>
    <span class="activity-log-summary-v activity-log-summary-v--sm">${escapeHtml(String(snapshot.lastActivity ?? ''))}</span>
    <span class="activity-log-summary-h">Horodatage tel qu’affiché dans le journal</span>
  `;

  wrap.append(totalCard, modCard, timeCard);
  return wrap;
}
