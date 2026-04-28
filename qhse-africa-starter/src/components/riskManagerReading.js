/**
 * Bloc « Lecture manager » : synthèse premium en tête de page Risques.
 */

import { riskCriticalityFromMeta } from '../utils/riskMatrixCore.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const STYLE_ID = 'qhse-risk-manager-reading-styles';

const CSS = `
.risk-manager-reading{
  margin-bottom:1rem;padding:14px 16px;border-radius:16px;
  border:1px solid color-mix(in srgb, var(--color-primary, #14b8a6) 26%, var(--border-color, #e2e8f0));
  background:linear-gradient(
    160deg,
    color-mix(in srgb, var(--color-primary) 8%, var(--surface-1, #ffffff)) 0%,
    var(--surface-2, #f8fafc) 100%
  );
  color:var(--text-primary, var(--text));
}
html[data-theme='dark'] .risk-manager-reading{
  border:1px solid rgba(45,212,191,.22);
  background:linear-gradient(160deg,rgba(13,148,136,.1),rgba(15,23,42,.55));
  color:var(--text, #f8fafc);
}
.risk-manager-reading__head{margin-bottom:12px}
.risk-manager-reading__kicker{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted, var(--text3))}
.risk-manager-reading__title{margin:4px 0 0;font-size:15px;font-weight:800;color:var(--text-primary, var(--text))}
.risk-manager-reading__reco{margin:8px 0 0;font-size:12px;line-height:1.45;color:var(--text-secondary, var(--text2));max-width:72ch}
.risk-manager-reading__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.risk-manager-reading__tile{
  padding:10px 12px;border-radius:12px;border:1px solid var(--border-color, #e2e8f0);
  background:var(--surface-1, #ffffff);text-align:left;cursor:pointer;font:inherit;
  color:var(--text-primary, var(--text));
  transition:border-color .15s ease,background .15s ease;
}
.risk-manager-reading__tile:hover:not(:disabled){
  border-color:color-mix(in srgb, var(--color-primary) 35%, var(--border-color, #e2e8f0));
  background:var(--surface-3, #f1f5f9);
}
html[data-theme='dark'] .risk-manager-reading__tile{
  border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.18);
  color:var(--text, #f8fafc);
}
html[data-theme='dark'] .risk-manager-reading__tile:hover:not(:disabled){
  border-color:rgba(45,212,191,.35);
  background:rgba(0,0,0,.25);
}
.risk-manager-reading__tile-lbl{display:block;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted, var(--text3));margin-bottom:6px}
.risk-manager-reading__tile-val{font-size:13px;font-weight:700;color:var(--text-primary, var(--text));line-height:1.3}
.risk-manager-reading__tile-sub{display:block;margin-top:4px;font-size:10px;color:var(--text-secondary, var(--text2));line-height:1.35}
html[data-theme='dark'] .risk-manager-reading__tile-lbl{color:var(--text3)}
html[data-theme='dark'] .risk-manager-reading__tile-val{color:var(--text)}
html[data-theme='dark'] .risk-manager-reading__tile-sub{color:var(--text3)}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}

function hasAction(r) {
  return r?.actionLinked != null && typeof r.actionLinked === 'object';
}

/**
 * @param {object[]} risks
 * @param {{ onScrollToTitle: (title: string) => void }} opts
 */
export function createRiskManagerReadingCard(risks, opts) {
  ensureStyles();
  const list = Array.isArray(risks) ? risks : [];

  const art = document.createElement('article');
  art.className = 'risk-manager-reading risk-manager-reading--premium';
  art.setAttribute('aria-label', 'Lecture manager : synthèse');

  const head = document.createElement('div');
  head.className = 'risk-manager-reading__head';
  const intro = document.createElement('div');
  intro.innerHTML = `<div class="risk-manager-reading__kicker">Pilotage</div><h2 class="risk-manager-reading__title">Lecture manager</h2>`;
  head.append(intro);

  const sorted = [...list].sort((a, b) => {
    const ca = riskCriticalityFromMeta(a.meta);
    const cb = riskCriticalityFromMeta(b.meta);
    return (cb?.tier ?? 0) - (ca?.tier ?? 0) || (cb?.product ?? 0) - (ca?.product ?? 0);
  });

  const mostCrit = sorted[0] || null;
  const derive =
    list.find((r) => r.pilotageState === 'derive') ||
    list.find((r) => r.trend === 'up') ||
    null;
  const sansAction = list.find((r) => !hasAction(r)) || null;

  let reco =
    'Maintenir les revues sur les paliers élevés et vérifier les mesures de maîtrise au terrain.';
  if (sansAction) {
    reco = `Prioriser une action pour « ${sansAction.title || 'risque sans lien'} ». Réduire l’exposition opérationnelle.`;
  } else if (derive) {
    reco = `Surveiller « ${derive.title || 'risque en dérive'} » : confirmer les barrières et le responsable terrain.`;
  }

  const recoP = document.createElement('p');
  recoP.className = 'risk-manager-reading__reco';
  recoP.innerHTML = `<strong>Recommandation :</strong> ${escapeHtml(reco)}`;
  head.append(recoP);
  art.append(head);

  const grid = document.createElement('div');
  grid.className = 'risk-manager-reading__grid';

  function tile(lbl, risk, hint) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'risk-manager-reading__tile';
    b.innerHTML = `<span class="risk-manager-reading__tile-lbl">${escapeHtml(lbl)}</span><span class="risk-manager-reading__tile-val">${risk ? escapeHtml(String(risk.title || 'Non renseigné')) : 'Non disponible'}</span><span class="risk-manager-reading__tile-sub">${escapeHtml(hint)}</span>`;
    if (risk?.title) {
      b.addEventListener('click', () => opts.onScrollToTitle?.(String(risk.title)));
    } else {
      b.disabled = true;
      b.style.opacity = '0.65';
      b.style.cursor = 'default';
    }
    return b;
  }

  grid.append(
    tile('Risque le plus critique', mostCrit, 'Palier G×P le plus élevé (aperçu).'),
    tile('Risque en dérive', derive, 'État dérive ou tendance à la hausse.'),
    tile('Risque sans action', sansAction, 'Aucune action liée au registre.')
  );
  art.append(grid);

  return art;
}
