import {
  classifyActionImportance,
  classifyEntryKindExtended,
  activityModuleHash,
  aiSuggestionJournalDisplay
} from './activityLogHelpers.js';
import { getAuditReadableJournalParts } from './activityLogReadable.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

/**
 * Ligne du journal : présentation « lecture audit » (date, qui, action, objet, résultat).
 */
export function createActivityLogRow(entry) {
  const parts = getAuditReadableJournalParts(entry);
  const importance = classifyActionImportance(entry.action);
  const aiDisp = aiSuggestionJournalDisplay(entry);
  const kind = classifyEntryKindExtended(entry);

  const row = document.createElement('article');
  row.className = 'activity-log-row activity-log-row--clickable activity-log-row--audit-read';
  row.tabIndex = 0;
  row.setAttribute('role', 'link');
  row.setAttribute('aria-label', parts.narrative);

  if (importance === 'high') {
    row.classList.add('activity-log-row--emphasis');
  }

  const go = () => {
    qhseNavigate(activityModuleHash(entry.module));
  };
  row.addEventListener('click', go);
  row.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      go();
    }
  });

  const cDate = document.createElement('div');
  cDate.className = 'activity-log-cell activity-log-cell--audit-date';
  const time = document.createElement('span');
  time.className = 'activity-log-audit-date-main';
  time.textContent = parts.dateDisplay;
  const modChip = document.createElement('span');
  modChip.className = `activity-log-audit-mod-pill ${parts.moduleClass}`;
  modChip.textContent = parts.moduleShort;
  modChip.title = 'Périmètre fonctionnel (raccourci)';
  cDate.append(time, modChip);

  const cUser = document.createElement('div');
  cUser.className = 'activity-log-cell activity-log-cell--audit-user';
  const user = document.createElement('span');
  user.className = 'activity-log-audit-user-name';
  user.textContent = parts.userDisplay;
  cUser.append(user);

  const cAction = document.createElement('div');
  cAction.className = 'activity-log-cell activity-log-cell--audit-action';
  const actWrap = document.createElement('div');
  actWrap.className = 'activity-log-action-wrap';
  const kindBadge = document.createElement('span');
  kindBadge.className = aiDisp
    ? `activity-log-kind-badge activity-log-kind-badge--ai activity-log-kind-badge--ai-${String(entry.aiTraceType || 'other').replace(/[^a-z0-9_-]/gi, '')}`
    : `activity-log-kind-badge activity-log-kind-badge--${kind}`;
  kindBadge.textContent = aiDisp
    ? aiDisp.userAction
    : kind === 'create'
      ? 'Création'
      : kind === 'modify'
        ? 'Modification'
        : kind === 'close'
          ? 'Clôture'
          : 'Autre';
  kindBadge.title = 'Nature de l’événement';
  const actionText = document.createElement('p');
  actionText.className = 'activity-log-audit-action-text';
  actionText.textContent = parts.actionClear;
  actWrap.append(kindBadge, actionText);
  if (aiDisp) {
    const iaHint = document.createElement('span');
    iaHint.className = 'activity-log-ia-inline-hint';
    iaHint.textContent = aiDisp.typeIa;
    actWrap.append(iaHint);
  }
  if (importance === 'high') {
    const mark = document.createElement('span');
    mark.className = 'activity-log-importance';
    mark.textContent = 'À suivre';
    mark.title = 'Événement sensible pour la traçabilité';
    actWrap.append(mark);
  }
  cAction.append(actWrap);

  const cObj = document.createElement('div');
  cObj.className = 'activity-log-cell activity-log-cell--audit-object';
  const objK = document.createElement('span');
  objK.className = 'activity-log-audit-field-k';
  objK.textContent = 'Objet';
  const objV = document.createElement('span');
  objV.className = 'activity-log-audit-field-v';
  objV.textContent = parts.objectText;
  cObj.append(objK, objV);

  const cRes = document.createElement('div');
  cRes.className = 'activity-log-cell activity-log-cell--audit-result';
  const resK = document.createElement('span');
  resK.className = 'activity-log-audit-field-k';
  resK.textContent = 'Résultat';
  const resV = document.createElement('span');
  resV.className = 'activity-log-audit-field-v';
  resV.textContent = parts.resultText;
  cRes.append(resK, resV);

  row.append(cDate, cUser, cAction, cObj, cRes);
  return row;
}
