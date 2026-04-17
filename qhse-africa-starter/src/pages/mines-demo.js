import { isDemoMode, setDemoMode } from '../services/demoMode.service.js';
import { DEMO_SITE_ID, DEMO_SITE_LABEL, DEMO_MINE_ZONES } from '../data/demoModeFixtures.js';
import { appState, setActiveSiteContext } from '../utils/state.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const MINES_DEMO_STYLE_ID = 'qhse-mines-demo-styles';

function ensureMinesDemoStyles() {
  if (document.getElementById(MINES_DEMO_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = MINES_DEMO_STYLE_ID;
  el.textContent = `
.mines-demo-page .mines-demo-hero{display:grid;gap:14px}
.mines-demo-page .mines-demo-zones{display:flex;flex-wrap:wrap;gap:8px}
.mines-demo-page .mines-demo-zones .hab-pill{font-weight:700}
.mines-demo-page .mines-demo-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.mines-demo-page .mines-demo-kpi{padding:12px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);cursor:pointer}
.mines-demo-page .mines-demo-kpi__k{display:block;font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em}
.mines-demo-page .mines-demo-kpi__v{display:block;font-size:24px;font-weight:800;line-height:1.1;margin:4px 0}
.mines-demo-page .mines-demo-kpi__d{display:block;font-size:12px;color:var(--text2)}
.mines-demo-page .mines-demo-kpi--danger{border-color:rgba(239,68,68,.4)}
.mines-demo-page .mines-demo-kpi--warn{border-color:rgba(251,146,60,.45)}
.mines-demo-page .mines-demo-kpi--ok{border-color:rgba(16,185,129,.45)}
.mines-demo-page .mines-demo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.mines-demo-page .mines-demo-list{display:grid;gap:8px}
.mines-demo-page .mines-demo-item{padding:10px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--color-background-primary)}
.mines-demo-page .mines-demo-item strong{display:block;font-size:13px}
.mines-demo-page .mines-demo-item span{display:block;font-size:12px;color:var(--text2)}
.mines-demo-page .mines-demo-tour{display:flex;flex-wrap:wrap;gap:8px}
.mines-demo-page .mines-demo-empty{font-size:12px;color:var(--text2)}
@media (max-width:1000px){.mines-demo-page .mines-demo-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.mines-demo-page .mines-demo-grid{grid-template-columns:1fr}}
`;
  document.head.append(el);
}

function go(pageId) {
  window.location.hash = pageId;
}

function card(title, subtitle) {
  const art = document.createElement('article');
  art.className = 'content-card card-soft';
  art.innerHTML = `<div class="content-card-head"><div><div class="section-kicker">Démo mines</div><h3>${escapeHtml(title)}</h3><p class="ptw-mini">${escapeHtml(subtitle)}</p></div></div>`;
  return art;
}

function apiList(path) {
  return qhseFetch(path)
    .then((r) => (r.ok ? r.json() : []))
    .then((x) => (Array.isArray(x) ? x : []))
    .catch(() => []);
}

function kpiCard(label, value, detail, tone, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `mines-demo-kpi mines-demo-kpi--${tone}`;
  b.innerHTML = `<span class="mines-demo-kpi__k">${escapeHtml(label)}</span><span class="mines-demo-kpi__v">${escapeHtml(String(value))}</span><span class="mines-demo-kpi__d">${escapeHtml(detail)}</span>`;
  b.addEventListener('click', onClick);
  return b;
}

function renderItems(host, rows, mapFn, emptyLabel) {
  host.replaceChildren();
  if (!rows.length) {
    const p = document.createElement('p');
    p.className = 'mines-demo-empty';
    p.textContent = emptyLabel;
    host.append(p);
    return;
  }
  rows.forEach((r) => {
    const box = document.createElement('div');
    box.className = 'mines-demo-item';
    const mapped = mapFn(r);
    box.innerHTML = `<strong>${escapeHtml(mapped.title)}</strong><span>${escapeHtml(mapped.detail)}</span>`;
    host.append(box);
  });
}

export function renderMinesDemo() {
  if (!isDemoMode()) setDemoMode(true);
  if (appState.activeSiteId !== DEMO_SITE_ID || appState.currentSite !== DEMO_SITE_LABEL) {
    setActiveSiteContext(DEMO_SITE_ID, DEMO_SITE_LABEL);
  }
  ensureMinesDemoStyles();

  const page = document.createElement('section');
  page.className = 'page-stack mines-demo-page';

  const hero = card(
    `Parcours minier 3 à 5 minutes — ${DEMO_SITE_LABEL}`,
    'Narrative de vente: incidents, quasi-accidents, risques, PTW, habilitations, audits, actions et synthèse direction.'
  );
  hero.classList.add('mines-demo-hero');

  const zones = document.createElement('div');
  zones.className = 'mines-demo-zones';
  DEMO_MINE_ZONES.forEach((z) => {
    const chip = document.createElement('span');
    chip.className = 'hab-pill';
    chip.textContent = z;
    zones.append(chip);
  });

  const kpis = document.createElement('div');
  kpis.className = 'mines-demo-kpis';
  hero.append(zones, kpis);

  const tour = card(
    'Storyboard commercial',
    'Cliquez pour dérouler la démo sans friction pendant la soutenance client.'
  );
  const tourRow = document.createElement('div');
  tourRow.className = 'mines-demo-tour';
  [
    ['1. Dashboard mines', 'dashboard'],
    ['2. PTW', 'permits'],
    ['3. Habilitations', 'habilitations'],
    ['4. Incidents', 'incidents'],
    ['4. Risques terrain', 'risks'],
    ['5. Audits/inspections', 'audits'],
    ['6. Actions correctives', 'actions'],
    ['7. Synthèse direction', 'analytics'],
    ['Sous-traitants & FDS', 'products']
  ].forEach(([label, id]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary';
    b.textContent = label;
    b.addEventListener('click', () => go(id));
    tourRow.append(b);
  });
  tour.append(tourRow);

  const grid = document.createElement('div');
  grid.className = 'mines-demo-grid';

  const incidentsCard = card('Incidents & quasi-accidents', 'Signalements récents et criticité terrain.');
  const incidentsHost = document.createElement('div');
  incidentsHost.className = 'mines-demo-list';
  incidentsCard.append(incidentsHost);

  const risksCard = card('Risques terrain prioritaires', 'Registre zones critiques et propriétaires de risque.');
  const risksHost = document.createElement('div');
  risksHost.className = 'mines-demo-list';
  risksCard.append(risksHost);

  const ptwCard = card('PTW actifs', 'Permis opérationnels et contrôles de sécurité.');
  const ptwHost = document.createElement('div');
  ptwHost.className = 'mines-demo-list';
  ptwCard.append(ptwHost);

  const auditCard = card('Audits / actions / NC majeures', 'Exécution du plan d’amélioration continue.');
  const auditHost = document.createElement('div');
  auditHost.className = 'mines-demo-list';
  auditCard.append(auditHost);

  grid.append(incidentsCard, risksCard, ptwCard, auditCard);

  page.append(hero, tour, grid);

  void Promise.all([
    apiList('/api/incidents?limit=300'),
    apiList('/api/risks?limit=300'),
    apiList('/api/actions?limit=300'),
    apiList('/api/ptw'),
    apiList('/api/habilitations'),
    apiList('/api/audits?limit=120'),
    apiList('/api/nonconformities?limit=200')
  ]).then(([incidents, risks, actions, ptw, habs, audits, ncs]) => {
    const now = Date.now();
    const d30 = now - 30 * 24 * 3600 * 1000;
    const critInc = incidents.filter((i) => String(i?.severity || '').toLowerCase().includes('critique')).length;
    const quasi30 = incidents.filter(
      (i) =>
        String(i?.type || '').toLowerCase().includes('quasi') &&
        new Date(String(i?.createdAt || 0)).getTime() >= d30
    ).length;
    const overdue = actions.filter((a) => String(a?.status || '').toLowerCase().includes('retard')).length;
    const ptwActifs = ptw.filter((p) => !String(p?.status || '').toLowerCase().includes('closed')).length;
    const hab30 = habs.filter((h) => {
      const d = new Date(String(h?.validUntil || 0)).getTime() - now;
      const dd = Math.ceil(d / (24 * 3600 * 1000));
      return dd >= 0 && dd <= 30;
    }).length;
    const auditsTerrain = audits.length;
    const ncMaj = ncs.filter(
      (n) =>
        !String(n?.status || '').toLowerCase().includes('closed') &&
        String(n?.detail || '').toLowerCase().includes('majeure')
    ).length;
    const epiRate =
      ptw.length > 0 ? Math.round((ptw.filter((p) => Array.isArray(p?.epi) && p.epi.length > 0).length / ptw.length) * 100) : 100;

    kpis.replaceChildren(
      kpiCard('Incidents critiques', critInc, 'Cliquez pour ouvrir les incidents', 'danger', () => go('incidents')),
      kpiCard('Quasi-accidents (30j)', quasi30, 'Retour d’expérience terrain', 'warn', () => go('incidents')),
      kpiCard('Actions en retard', overdue, 'Plan correctif à relancer', 'danger', () => go('actions')),
      kpiCard('PTW actifs', ptwActifs, 'Permis en attente/validés/en cours', 'ok', () => go('permits')),
      kpiCard('Habilitations < 30 j', hab30, 'Renouvellements à sécuriser', 'warn', () => go('habilitations')),
      kpiCard('Audits terrain', auditsTerrain, 'Inspections et audits récents', 'ok', () => go('audits')),
      kpiCard('NC majeures ouvertes', ncMaj, 'Priorité direction de site', 'danger', () => go('audits')),
      kpiCard('Taux conformité EPI', `${epiRate}%`, 'Pilotage sécurité opérationnelle', epiRate >= 85 ? 'ok' : 'warn', () => go('permits'))
    );

    renderItems(
      incidentsHost,
      incidents.slice(0, 5),
      (r) => ({
        title: `${r.ref || 'INC'} · ${r.type || 'Événement'} · ${r.severity || 'N/A'}`,
        detail: `${r.location || r.site || DEMO_SITE_LABEL} · ${r.status || 'Nouveau'}`
      }),
      'Aucun incident à afficher.'
    );
    renderItems(
      risksHost,
      risks.slice(0, 5),
      (r) => ({
        title: `${r.ref || 'RSK'} · ${r.title || 'Risque'}`,
        detail: `${r.site || DEMO_SITE_LABEL} · GP ${r.gp || r.gravity || '?'} · ${r.owner || 'Owner à affecter'}`
      }),
      'Aucun risque prioritaire.'
    );
    renderItems(
      ptwHost,
      ptw.slice(0, 5),
      (r) => ({
        title: `${r.ref || r.id || 'PTW'} · ${r.type || 'Permis'} · ${r.status || 'pending'}`,
        detail: `${r.zone || 'Zone non définie'} · équipe ${r.team || 'N/A'}`
      }),
      'Aucun PTW actif.'
    );
    const auditMix = [
      ...audits.slice(0, 3).map((a) => ({
        title: `${a.ref || 'AUD'} · score ${a.score || 'N/A'}%`,
        detail: `${a.site || DEMO_SITE_LABEL} · ${a.status || 'En cours'}`
      })),
      ...actions
        .filter((a) => String(a?.status || '').toLowerCase().includes('retard'))
        .slice(0, 2)
        .map((a) => ({
          title: `Action retard · ${a.title || 'Action'}`,
          detail: `${a.owner || 'Responsable à affecter'} · échéance ${a.dueDate ? String(a.dueDate).slice(0, 10) : 'N/A'}`
        }))
    ];
    renderItems(auditHost, auditMix, (x) => x, 'Aucun élément audit/action.');
  });

  return page;
}
