import {
  moduleMeta,
  classifyActionImportance,
  classifyEntryKind,
  activityModuleHash
} from './activityLogHelpers.js';

/**
 * Une ligne du journal — DOM uniquement, prête pour surcouche filtre / tri (entrée déjà filtrée en amont).
 */
export function createActivityLogRow(entry) {
  const meta = moduleMeta(entry.module);
  const importance = classifyActionImportance(entry.action);
  const kind = classifyEntryKind(entry.action);

  const row = document.createElement('article');
  row.className = 'activity-log-row activity-log-row--clickable';
  row.tabIndex = 0;
  row.setAttribute('role', 'link');
  row.setAttribute(
    'aria-label',
    `Ouvrir le module ${meta.label} — ${entry.action || 'entrée'}`
  );
  if (importance === 'high') {
    row.classList.add('activity-log-row--emphasis');
  }

  const go = () => {
    window.location.hash = activityModuleHash(entry.module);
  };
  row.addEventListener('click', go);
  row.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      go();
    }
  });

  const cMod = document.createElement('div');
  cMod.className = 'activity-log-cell activity-log-cell--module';
  const badge = document.createElement('span');
  badge.className = `activity-log-module-badge ${meta.className}`;
  badge.title = meta.label;
  const short = document.createElement('span');
  short.className = 'activity-log-module-short';
  short.textContent = meta.short;
  const full = document.createElement('span');
  full.className = 'activity-log-module-full';
  full.textContent = meta.label;
  badge.append(short, full);
  cMod.append(badge);

  const cAct = document.createElement('div');
  cAct.className = 'activity-log-cell activity-log-cell--action';
  const actWrap = document.createElement('div');
  actWrap.className = 'activity-log-action-wrap';
  const kindBadge = document.createElement('span');
  kindBadge.className = `activity-log-kind-badge activity-log-kind-badge--${kind}`;
  kindBadge.textContent =
    kind === 'create' ? 'Créé' : kind === 'modify' ? 'Modifié' : kind === 'close' ? 'Clôturé' : 'Autre';
  kindBadge.title = 'Type d’événement (classification locale pour lecture ISO)';
  const strong = document.createElement('span');
  strong.className = 'activity-log-strong';
  strong.textContent = entry.action || '—';
  actWrap.append(kindBadge, strong);
  if (importance === 'high') {
    const mark = document.createElement('span');
    mark.className = 'activity-log-importance';
    mark.textContent = 'À suivre';
    mark.title = 'Action ou événement sensible pour la traçabilité (règle mock)';
    actWrap.append(mark);
  }
  cAct.append(actWrap);

  const cDet = document.createElement('div');
  cDet.className = 'activity-log-cell activity-log-cell--detail';
  const det = document.createElement('span');
  det.className = 'activity-log-detail-text';
  det.textContent = entry.detail || '';
  cDet.append(det);

  const cUser = document.createElement('div');
  cUser.className = 'activity-log-cell activity-log-cell--user';
  const user = document.createElement('span');
  user.className = 'activity-log-meta';
  user.textContent = entry.user || '—';
  cUser.append(user);

  const cTime = document.createElement('div');
  cTime.className = 'activity-log-cell activity-log-cell--time';
  const time = document.createElement('span');
  time.className = 'activity-log-time';
  time.textContent = entry.timestamp || '—';
  cTime.append(time);

  row.append(cMod, cAct, cDet, cUser, cTime);
  return row;
}
