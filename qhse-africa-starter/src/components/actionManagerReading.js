/**
 * Bloc « Vue manager » : synthèse pilotage actions (haut de page).
 */

import { getActionPriorityFilterKey } from './actionKanbanCard.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const STYLE_ID = 'qhse-action-manager-reading-styles';

const CSS = `
.action-manager-reading{
  margin-bottom:1rem;padding:14px 16px;border-radius:16px;
  border:1px solid color-mix(in srgb, var(--color-primary, #3b82f6) 24%, var(--border-color, #e2e8f0));
  background:linear-gradient(
    155deg,
    color-mix(in srgb, var(--color-primary) 8%, var(--surface-1, #ffffff)) 0%,
    var(--surface-2, #f8fafc) 100%
  );
  color:var(--text-primary, var(--text));
}
html[data-theme='dark'] .action-manager-reading{
  border:1px solid rgba(59,130,246,.22);
  background:linear-gradient(155deg,rgba(37,99,235,.12),rgba(15,23,42,.55));
  color:var(--text, #f8fafc);
}
.action-manager-reading__kicker{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted, var(--text3))}
.action-manager-reading__title{margin:4px 0 0;font-size:15px;font-weight:800;color:var(--text-primary, var(--text))}
.action-manager-reading__reco{margin:8px 0 0;font-size:12px;line-height:1.45;color:var(--text-secondary, var(--text2));max-width:72ch}
.action-manager-reading__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px}
.action-manager-reading__tile{
  padding:10px 12px;border-radius:12px;border:1px solid var(--border-color, #e2e8f0);
  background:var(--surface-1, #ffffff);text-align:left;cursor:pointer;font:inherit;
  color:var(--text-primary, var(--text));
  transition:border-color .15s ease,background .15s ease;
}
.action-manager-reading__tile:hover:not(:disabled){
  border-color:color-mix(in srgb, var(--color-primary) 38%, var(--border-color, #e2e8f0));
  background:var(--surface-3, #f1f5f9);
}
html[data-theme='dark'] .action-manager-reading__tile{
  border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.18);
  color:var(--text, #f8fafc);
}
html[data-theme='dark'] .action-manager-reading__tile:hover:not(:disabled){
  border-color:rgba(59,130,246,.4);
  background:rgba(0,0,0,.25);
}
.action-manager-reading__tile:disabled{opacity:.55;cursor:default}
.action-manager-reading__tile-lbl{display:block;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted, var(--text3));margin-bottom:6px}
.action-manager-reading__tile-val{font-size:13px;font-weight:700;color:var(--text-primary, var(--text));line-height:1.3}
.action-manager-reading__tile-sub{display:block;margin-top:4px;font-size:10px;color:var(--text-secondary, var(--text2));line-height:1.35}
html[data-theme='dark'] .action-manager-reading__tile-lbl{color:var(--text3)}
html[data-theme='dark'] .action-manager-reading__tile-val{color:var(--text)}
html[data-theme='dark'] .action-manager-reading__tile-sub{color:var(--text3)}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}

function statusToColumnKey(status) {
  const s = String(status || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (/\bnon[\s-]*termine\b/.test(s)) return 'todo';
  if (
    /\b(termine|clos|clotur|ferme|complete|realise|valide|fait|acheve|done|closed)\b/.test(s) ||
    s.includes('termine')
  ) {
    return 'done';
  }
  if (s.includes('retard')) return 'overdue';
  if (s.includes('cours')) return 'doing';
  return 'todo';
}

function isCritiqueRow(r) {
  const col = statusToColumnKey(r.status);
  if (col === 'done') return false;
  const pk = getActionPriorityFilterKey(col, r.dueDate);
  return pk === 'retard' || pk === 'urgent';
}

function isRetardRow(r) {
  const col = statusToColumnKey(r.status);
  if (col === 'done') return false;
  return col === 'overdue' || getActionPriorityFilterKey(col, r.dueDate) === 'retard';
}

function isSansResp(r) {
  return !r.assigneeId && (!r.owner || String(r.owner).trim() === '' || String(r.owner).trim() === 'À assigner');
}

/**
 * @param {object[]} rows : actions API
 * @param {{
 *   onSelectFilter: (key: 'critiques'|'retard'|'sans_resp'|'preventive_gap'|null) => void
 *   risksWithoutPreventiveCount?: number
 * }} opts
 */
export function createActionManagerReadingCard(rows, opts) {
  ensureStyles();
  const list = Array.isArray(rows) ? rows : [];

  const art = document.createElement('article');
  art.className = 'action-manager-reading';
  art.setAttribute('aria-label', 'Vue manager : actions');

  const head = document.createElement('div');
  head.innerHTML = `<div class="action-manager-reading__kicker">Pilotage</div><h2 class="action-manager-reading__title">Vue manager</h2>`;

  const crit = list.filter(isCritiqueRow);
  const ret = list.filter(isRetardRow);
  const sans = list.filter(isSansResp);
  const gapN = Math.max(0, Number(opts.risksWithoutPreventiveCount) || 0);

  let reco =
    'Prioriser les retards et les actions critiques ; renforcer la prévention là où les risques restent exposés.';
  if (sans.length) {
    reco = `Désigner un responsable pour ${sans.length} action(s). Réduire le flou de pilotage.`;
  } else if (ret.length) {
    reco = `Traiter en priorité les ${ret.length} action(s) en retard ou à risque de retard.`;
  } else if (gapN > 0) {
    reco = `${gapN} risque(s) du registre sans action préventive ouverte. Planifier barrières ou contrôles (ISO 45001 / 14001).`;
  } else if (crit.length) {
    reco = `Surveiller les ${crit.length} action(s) critiques (urgence ou retard).`;
  }

  const recoP = document.createElement('p');
  recoP.className = 'action-manager-reading__reco';
  recoP.innerHTML = `<strong>Recommandation :</strong> ${escapeHtml(reco)}`;

  const grid = document.createElement('div');
  grid.className = 'action-manager-reading__grid';

  function tile(lbl, count, sub, key) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'action-manager-reading__tile';
    b.innerHTML = `<span class="action-manager-reading__tile-lbl">${escapeHtml(lbl)}</span><span class="action-manager-reading__tile-val">${escapeHtml(String(count))}</span><span class="action-manager-reading__tile-sub">${escapeHtml(sub)}</span>`;
    b.addEventListener('click', () => opts.onSelectFilter?.(key));
    return b;
  }

  grid.append(
    tile('Actions critiques', String(crit.length), 'Urgent ou retard (hors terminé).', 'critiques'),
    tile('En retard', String(ret.length), 'Colonne retard ou échéance dépassée.', 'retard'),
    tile('Sans responsable', String(sans.length), 'Pas d’assignation claire.', 'sans_resp'),
    tile(
      'Risques sans prévention',
      String(gapN),
      'Registre : pas d’action préventive ouverte liée au titre.',
      'preventive_gap'
    )
  );

  art.append(head, recoP, grid);
  return art;
}
