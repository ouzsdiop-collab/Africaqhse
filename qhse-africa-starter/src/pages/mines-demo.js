import {
  DEMO_SITE_LABEL,
  DEMO_MINE_ZONES,
  demoIncidentsBase,
  demoRisks,
  demoActionsBase,
  demoPtwBase,
  demoHabilitationsBase,
  demoAudits,
  demoNonConformities,
  demoUsers
} from '../data/demoModeFixtures.js';
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
.mines-demo-page .mines-demo-kpi{padding:12px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);cursor:pointer;text-align:left;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}
.mines-demo-page .mines-demo-kpi:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.08)}
.mines-demo-page .mines-demo-kpi:focus-visible{outline:2px solid var(--color-accent-primary);outline-offset:2px}
.mines-demo-page .mines-demo-kpi__k{display:block;font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em}
.mines-demo-page .mines-demo-kpi__v{display:block;font-size:24px;font-weight:800;line-height:1.1;margin:4px 0}
.mines-demo-page .mines-demo-kpi__d{display:block;font-size:12px;color:var(--text2)}
.mines-demo-page .mines-demo-kpi--danger{border-color:rgba(239,68,68,.4)}
.mines-demo-page .mines-demo-kpi--warn{border-color:rgba(251,146,60,.45)}
.mines-demo-page .mines-demo-kpi--ok{border-color:rgba(16,185,129,.45)}
.mines-demo-page .mines-demo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.mines-demo-page .mines-demo-list{display:grid;gap:8px}
.mines-demo-page .mines-demo-item{padding:10px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--color-background-primary);transition:border-color .12s ease,background .12s ease,transform .12s ease}
.mines-demo-page .mines-demo-item--click{cursor:pointer}
.mines-demo-page .mines-demo-item--click:hover{border-color:var(--color-accent-primary);background:var(--color-background-secondary);transform:translateY(-1px)}
.mines-demo-page .mines-demo-item--click:focus-visible{outline:2px solid var(--color-accent-primary);outline-offset:2px}
.mines-demo-page .mines-demo-item strong{display:block;font-size:13px}
.mines-demo-page .mines-demo-item span{display:block;font-size:12px;color:var(--text2)}
.mines-demo-page .mines-demo-tour{display:flex;flex-wrap:wrap;gap:8px}
.mines-demo-page .mines-demo-empty{font-size:12px;color:var(--text2)}
.mines-demo-page .mines-demo-value{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.mines-demo-page .mines-demo-value-card{padding:12px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary)}
.mines-demo-page .mines-demo-value-card strong{display:block;font-size:14px}
.mines-demo-page .mines-demo-value-card span{display:block;font-size:12px;color:var(--text2);margin-top:4px}
.mines-demo-page .mines-demo-pitch{display:grid;gap:8px}
.mines-demo-page .mines-demo-pitch p{margin:0;font-size:13px;color:var(--text2);line-height:1.45}
.mines-demo-page .mines-demo-cta{display:flex;flex-wrap:wrap;gap:8px}
.mines-demo-page .mines-demo-sales{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}
.mines-demo-page .mines-demo-sales-card{padding:12px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary)}
.mines-demo-page .mines-demo-sales-card h4{margin:0 0 8px;font-size:14px}
.mines-demo-page .mines-demo-sales-card p{margin:0;font-size:12px;color:var(--text2);line-height:1.45}
.mines-demo-page .mines-demo-sales-list{display:grid;gap:8px}
.mines-demo-page .mines-demo-sales-row{padding:8px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--color-background-primary)}
.mines-demo-page .mines-demo-sales-row strong{display:block;font-size:12px}
.mines-demo-page .mines-demo-sales-row span{display:block;font-size:12px;color:var(--text2);margin-top:3px}
.mines-demo-page .mines-demo-roi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}
.mines-demo-page .mines-demo-roi div{padding:8px;border-radius:10px;background:var(--color-background-primary);border:1px solid var(--color-border-tertiary)}
.mines-demo-page .mines-demo-roi strong{display:block;font-size:16px;line-height:1.1}
.mines-demo-page .mines-demo-roi span{display:block;font-size:11px;color:var(--text2);margin-top:2px}
.mines-demo-page .mines-demo-presenter{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;border:1px dashed var(--color-border-tertiary);background:var(--color-background-primary);font-size:12px;color:var(--text2);line-height:1.4}
.mines-demo-page .mines-demo-presenter strong{color:var(--text1);font-weight:700}
.mines-demo-page .mines-demo-tip{margin:0;font-size:12px;color:var(--text2);line-height:1.45;padding:8px 0 0;border-top:1px solid var(--color-border-tertiary)}
@media (max-width:1000px){.mines-demo-page .mines-demo-value{grid-template-columns:1fr}}
@media (max-width:1000px){.mines-demo-page .mines-demo-sales{grid-template-columns:1fr}.mines-demo-page .mines-demo-roi{grid-template-columns:1fr}}
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
    const pageId = mapped && typeof mapped.pageId === 'string' ? mapped.pageId : '';
    box.innerHTML = `<strong>${escapeHtml(mapped.title)}</strong><span>${escapeHtml(mapped.detail)}</span>`;
    if (pageId) {
      box.classList.add('mines-demo-item--click');
      box.tabIndex = 0;
      box.setAttribute('role', 'button');
      const nav = () => go(pageId);
      box.addEventListener('click', nav);
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          nav();
        }
      });
    }
    host.append(box);
  });
}

export function renderMinesDemo() {
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

  const qhseLead = demoUsers.find((u) => u.role === 'QHSE')?.name || 'Référent QHSE';
  const terrainLead = demoUsers.find((u) => u.role === 'TERRAIN')?.name || 'Référent terrain';
  const auditEnCours = demoAudits.find((a) => String(a?.status || '').toLowerCase().includes('cours')) || demoAudits[0];
  const presenter = document.createElement('div');
  presenter.className = 'mines-demo-presenter';
  presenter.innerHTML = `<span><strong>Contexte présentateur</strong> — Astreinte HSE&nbsp;: ${escapeHtml(qhseLead)} · Référent terrain&nbsp;: ${escapeHtml(terrainLead)} · Dernier audit affiché&nbsp;: ${escapeHtml(auditEnCours?.ref || '—')} (${escapeHtml(auditEnCours?.status || '—')})</span>`;

  const kpis = document.createElement('div');
  kpis.className = 'mines-demo-kpis';
  hero.append(zones, presenter, kpis);

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
    ['5. Risques terrain', 'risks'],
    ['6. Audits / inspections', 'audits'],
    ['7. Actions correctives', 'actions'],
    ['8. Synthèse direction', 'analytics'],
    ['9. Sous-traitants & FDS', 'products']
  ].forEach(([label, id]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary';
    b.textContent = label;
    b.addEventListener('click', () => go(id));
    tourRow.append(b);
  });
  const tourTip = document.createElement('p');
  tourTip.className = 'mines-demo-tip';
  tourTip.textContent =
    'Conseil : en 3 minutes, enchaînez PTW → habilitations → incidents, puis terminez par synthèse direction pour montrer la chaîne de valeur complète.';
  tour.append(tourRow, tourTip);

  const value = card(
    'Pourquoi cette démo est vendable',
    'Arguments orientés DG mine, HSE manager et exploitation terrain.'
  );
  const valueGrid = document.createElement('div');
  valueGrid.className = 'mines-demo-value';
  [
    ['Réduction du délai de réaction', 'Signalement terrain vers action corrective en quelques minutes.'],
    ['Maîtrise du risque opérationnel', 'Vision consolidée incidents, PTW, risques et habilitations.'],
    ['Traçabilité audit-ready', 'Audits, NC majeures et preuves disponibles pour les revues direction.']
  ].forEach(([title, detail]) => {
    const box = document.createElement('article');
    box.className = 'mines-demo-value-card';
    box.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
    valueGrid.append(box);
  });
  value.append(valueGrid);

  const pitch = card(
    'Pitch oral 90 secondes',
    'Support de présentation pour cadrer la proposition de valeur avant la navigation.'
  );
  const pitchBody = document.createElement('div');
  pitchBody.className = 'mines-demo-pitch';
  pitchBody.innerHTML = `
    <p>QHSE Control centralise la sécurité et la conformité d’un site minier sur un seul cockpit, sans écran vide et avec des indicateurs directement exploitables en comité de pilotage.</p>
    <p>La démonstration montre la chaîne complète : un événement terrain, son traitement en risque/PTW/habilitation, puis la consolidation en synthèse direction avec priorités claires.</p>
    <p>Le bénéfice business est concret : moins de retards d’actions, meilleure discipline opérationnelle, et décisions plus rapides entre direction, exploitation et HSE.</p>
  `;
  const pitchCta = document.createElement('div');
  pitchCta.className = 'mines-demo-cta';
  [
    ['Voir synthèse direction', 'analytics'],
    ['Ouvrir plan d’actions', 'actions'],
    ['Afficher audits terrain', 'audits']
  ].forEach(([label, pageId]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-primary';
    b.textContent = label;
    b.addEventListener('click', () => go(pageId));
    pitchCta.append(b);
  });
  pitch.append(pitchBody, pitchCta);

  const sales = card(
    'Scénario commercial prêt à pitcher',
    'Structure “avant/après”, réponses aux objections et ordre de grandeur ROI.'
  );
  const salesGrid = document.createElement('div');
  salesGrid.className = 'mines-demo-sales';
  const beforeAfter = document.createElement('article');
  beforeAfter.className = 'mines-demo-sales-card';
  beforeAfter.innerHTML = `
    <h4>Avant / Après QHSE Control</h4>
    <div class="mines-demo-sales-list">
      <div class="mines-demo-sales-row">
        <strong>Avant</strong>
        <span>Données éclatées (Excel, WhatsApp, mails), retards de remontée, faible traçabilité audits.</span>
      </div>
      <div class="mines-demo-sales-row">
        <strong>Après</strong>
        <span>Un cockpit unique: incidents, PTW, risques, habilitations et actions reliés à la synthèse direction.</span>
      </div>
      <div class="mines-demo-sales-row">
        <strong>Impact</strong>
        <span>Décisions plus rapides, meilleure discipline terrain et revues managériales factuelles.</span>
      </div>
    </div>
  `;
  const objections = document.createElement('article');
  objections.className = 'mines-demo-sales-card';
  objections.innerHTML = `
    <h4>Objections fréquentes & réponses</h4>
    <div class="mines-demo-sales-list">
      <div class="mines-demo-sales-row">
        <strong>“Le terrain n’adoptera pas.”</strong>
        <span>Parcours mobile court, mode démo orienté opérations, KPI simples et actions guidées.</span>
      </div>
      <div class="mines-demo-sales-row">
        <strong>“On a déjà des tableaux.”</strong>
        <span>Ici, les tableaux pilotent des flux vivants (incident → action → audit → synthèse).</span>
      </div>
      <div class="mines-demo-sales-row">
        <strong>“Quel ROI concret ?”</strong>
        <span>Réduction du délai de traitement incidents, baisse des retards actions, meilleure préparation audits.</span>
      </div>
    </div>
    <div class="mines-demo-roi">
      <div><strong>-30% à -45%</strong><span>Délai de traitement incident</span></div>
      <div><strong>-20% à -35%</strong><span>Actions en retard</span></div>
      <div><strong>+15 à +25 pts</strong><span>Conformité audits internes</span></div>
    </div>
  `;
  salesGrid.append(beforeAfter, objections);
  sales.append(salesGrid);

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

  page.append(hero, value, tour, pitch, sales, grid);

  const incidents = [...demoIncidentsBase];
  const risks = [...demoRisks];
  const actions = [...demoActionsBase];
  const ptw = [...demoPtwBase];
  const habs = [...demoHabilitationsBase];
  const audits = [...demoAudits];
  const ncs = [...demoNonConformities];

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
    ptw.length > 0
      ? Math.round((ptw.filter((p) => Array.isArray(p?.epi) && p.epi.length > 0).length / ptw.length) * 100)
      : 100;

  kpis.replaceChildren(
    kpiCard('Incidents critiques', critInc, 'Cliquez pour ouvrir les incidents', 'danger', () => go('incidents')),
    kpiCard('Quasi-accidents (30j)', quasi30, 'Retour d’expérience terrain', 'warn', () => go('incidents')),
    kpiCard('Actions en retard', overdue, 'Plan correctif à relancer', 'danger', () => go('actions')),
    kpiCard('PTW actifs', ptwActifs, 'Permis en attente/validés/en cours', 'ok', () => go('permits')),
    kpiCard('Habilitations < 30 j', hab30, 'Renouvellements à sécuriser', 'warn', () => go('habilitations')),
    kpiCard('Audits terrain', auditsTerrain, 'Inspections et audits récents', 'ok', () => go('audits')),
    kpiCard('NC majeures ouvertes', ncMaj, 'Priorité direction de site', 'danger', () => go('audits')),
    kpiCard(
      'Taux conformité EPI',
      `${epiRate}%`,
      'Pilotage sécurité opérationnelle',
      epiRate >= 85 ? 'ok' : 'warn',
      () => go('permits')
    )
  );

  renderItems(
    incidentsHost,
    incidents.slice(0, 5),
    (r) => ({
      title: `${r.ref || 'INC'} · ${r.type || 'Événement'} · ${r.severity || 'N/A'}`,
      detail: `${r.location || r.site || DEMO_SITE_LABEL} · ${r.status || 'Nouveau'}`,
      pageId: 'incidents'
    }),
    'Aucun incident à afficher.'
  );
  renderItems(
    risksHost,
    risks.slice(0, 5),
    (r) => ({
      title: `${r.ref || 'RSK'} · ${r.title || 'Risque'}`,
      detail: `${r.site || DEMO_SITE_LABEL} · GP ${r.gp || r.gravity || '?'} · ${r.owner || 'Owner à affecter'}`,
      pageId: 'risks'
    }),
    'Aucun risque prioritaire.'
  );
  renderItems(
    ptwHost,
    ptw.slice(0, 5),
    (r) => ({
      title: `${r.ref || r.id || 'PTW'} · ${r.type || 'Permis'} · ${r.status || 'pending'}`,
      detail: `${r.zone || 'Zone non définie'} · équipe ${r.team || 'N/A'}`,
      pageId: 'permits'
    }),
    'Aucun PTW actif.'
  );
  const auditMix = [
    ...audits.slice(0, 3).map((a) => ({
      title: `${a.ref || 'AUD'} · score ${a.score || 'N/A'}%`,
      detail: `${a.site || DEMO_SITE_LABEL} · ${a.status || 'En cours'}`,
      pageId: 'audits'
    })),
    ...actions
      .filter((a) => String(a?.status || '').toLowerCase().includes('retard'))
      .slice(0, 2)
      .map((a) => ({
        title: `Action retard · ${a.title || 'Action'}`,
        detail: `${a.owner || 'Responsable à affecter'} · échéance ${a.dueDate ? String(a.dueDate).slice(0, 10) : 'N/A'}`,
        pageId: 'actions'
      }))
  ];
  renderItems(auditHost, auditMix, (x) => x, 'Aucun élément audit/action.');

  return page;
}
