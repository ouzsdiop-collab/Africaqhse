const STYLE_ID = 'qhse-dashboard-module-styles';

const CSS = `
/* Hiérarchie décision : alertes critique → score CEO → cockpit premium → à traiter → jour → raccourcis → analyses repliables → KPI/graphiques → cockpit lecture → activité (pied) */
.dashboard-page.page-stack{gap:22px}
.dashboard-band{display:flex;flex-direction:column;gap:20px;min-width:0}
.dashboard-band--ceo{
  margin:0 0 2px;
  padding:0;
  border-radius:var(--ds-radius-lg,22px);
  overflow:hidden;
}
.dashboard-band--priority{
  padding:16px 16px 20px;
  margin:2px 0 4px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(61,184,154,.16);
  background:linear-gradient(165deg,rgba(61,184,154,.07) 0%,rgba(18,24,32,.42) 48%,rgba(12,16,22,.28) 100%);
  box-shadow:0 6px 32px rgba(0,0,0,.14);
}
.dashboard-band--cockpit{
  padding:20px 18px 24px;
  margin:4px 0 6px;
  border-radius:var(--ds-radius-lg,20px);
  background:linear-gradient(165deg,rgba(20,184,166,.08) 0%,rgba(18,24,36,.52) 40%,rgba(12,16,24,.32) 100%);
  border:1px solid rgba(20,184,166,.14);
  box-shadow:0 8px 44px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.035) inset;
}
.dashboard-band--alerts{
  padding:18px 16px 22px;
  margin:4px 0 8px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(239,91,107,.14);
  background:linear-gradient(165deg,rgba(239,91,107,.05) 0%,rgba(18,22,30,.5) 55%,rgba(12,16,22,.35) 100%);
  box-shadow:0 6px 40px rgba(0,0,0,.18);
}
.dashboard-band--cockpit .dashboard-alerts-prio-card{
  border-color:rgba(232,93,108,.2);
  box-shadow:0 12px 44px rgba(0,0,0,.22),0 0 0 1px rgba(239,91,107,.08);
}
.dashboard-band--analysis{
  padding:8px 2px 12px;
  gap:20px;
  opacity:.985;
}
.dashboard-band--analysis .dashboard-section-title{
  font-size:clamp(16px,1.5vw,19px);
}
.dashboard-band--actions{
  padding:18px 16px 22px;
  margin:6px 0 4px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(61,184,154,.14);
  background:linear-gradient(165deg,rgba(61,184,154,.06) 0%,rgba(18,24,32,.45) 50%,transparent 100%);
  box-shadow:0 6px 36px rgba(0,0,0,.16);
}
.dashboard-band--situation{
  padding:22px 18px 26px;
  margin:2px 0 6px;
  border-radius:var(--ds-radius-lg,20px);
  background:linear-gradient(165deg,rgba(20,184,166,.09) 0%,rgba(18,24,36,.55) 42%,rgba(12,16,24,.35) 100%);
  border:1px solid rgba(20,184,166,.16);
  box-shadow:0 8px 48px rgba(0,0,0,.22),0 0 0 1px rgba(255,255,255,.04) inset,0 1px 0 rgba(255,255,255,.06) inset;
}
.dashboard-band--secondary{
  padding:4px 2px 8px;
  gap:22px;
}
.dashboard-band--tertiary{
  padding:20px 14px 10px;
  margin-top:6px;
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(148,163,184,.1);
  background:linear-gradient(180deg,rgba(255,255,255,.02) 0%,rgba(0,0,0,.06) 100%);
  box-shadow:0 -1px 0 rgba(255,255,255,.03) inset;
}
.dashboard-band--tertiary .dashboard-section-head{margin-bottom:12px}
.dashboard-band--tertiary .dashboard-section-kicker{opacity:.88}
.dashboard-band--tertiary .dashboard-section-title{font-size:clamp(17px,1.65vw,21px);letter-spacing:-.02em}
.dashboard-band--tertiary .dashboard-section-sub{font-size:12px;max-width:60ch}
/* Alertes en tête de lecture (urgence) */
.dashboard-band--alerts-first{
  margin-top:0;
  margin-bottom:10px;
}
/* Snapshot « Aujourd'hui » : pont léger après décisions */
.dashboard-band--today-snapshot{
  padding:0 2px 4px;
  margin:2px 0 6px;
  gap:12px;
}
/* Activité récente : pied de page, importance réduite */
.dashboard-band--activity-foot{
  padding:16px 12px 12px;
  margin-top:16px;
  border-radius:var(--ds-radius-lg,18px);
  border:1px solid rgba(148,163,184,.08);
  background:linear-gradient(180deg,rgba(15,23,42,.35) 0%,rgba(15,23,42,.2) 100%);
  box-shadow:0 -1px 0 rgba(255,255,255,.03) inset;
  opacity:.94;
}
.dashboard-band--activity-foot .dashboard-section-head{margin-bottom:8px}
.dashboard-band--activity-foot .dashboard-section-title{
  font-size:clamp(15px,1.45vw,18px);
  font-weight:700;
  letter-spacing:-.02em;
  opacity:.88;
}
.dashboard-band--activity-foot .dashboard-section-kicker{opacity:.42}
.dashboard-band--activity-foot .dashboard-section-sub{font-size:11px;opacity:.55;max-width:56ch}
.dashboard-band--activity-foot .dashboard-activity-wrap{opacity:.96}
/* Bloc principal direction / CEO */
.dashboard-ceo-hero{
  position:relative;
  overflow:hidden;
  margin:0;
  width:100%;
  box-sizing:border-box;
  padding:22px 22px 26px;
  border-radius:var(--ds-radius-lg,22px);
  border:1px solid rgba(20,184,166,.28);
  background:linear-gradient(128deg,rgba(16,22,32,.98) 0%,rgba(12,18,28,.97) 38%,rgba(18,32,36,.92) 100%);
  box-shadow:0 16px 64px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.06) inset,0 1px 0 rgba(255,255,255,.09) inset;
}
.dashboard-ceo-hero::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:radial-gradient(ellipse 85% 65% at 88% -15%,rgba(20,184,166,.28),transparent 52%),
    radial-gradient(ellipse 55% 45% at 4% 102%,rgba(61,184,154,.12),transparent 48%);
}
.dashboard-ceo-hero__topbar{
  position:relative;
  z-index:1;
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:12px 16px;
  margin-bottom:18px;
}
.dashboard-ceo-hero__site{
  font-size:11px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:rgba(186,210,255,.88);
}
.dashboard-ceo-hero__body{
  position:relative;
  z-index:1;
  display:grid;
  grid-template-columns:minmax(220px,min(30vw,292px)) minmax(0,1fr);
  gap:22px clamp(20px,3vw,40px);
  align-items:stretch;
  width:100%;
}
.dashboard-ceo-hero__center{
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:20px;
  align-self:stretch;
}
.dashboard-ceo-hero__intro{
  display:flex;
  flex-direction:column;
  gap:16px;
  padding-bottom:4px;
  border-bottom:1px solid rgba(148,163,184,.12);
}
.dashboard-ceo-hero__actions{
  display:flex;
  flex-direction:column;
  gap:10px;
}
.dashboard-ceo-hero__actions-kicker{
  margin:0;
  font-size:10px;
  font-weight:800;
  letter-spacing:.11em;
  text-transform:uppercase;
  color:rgba(148,163,184,.8);
}
@media (max-width:900px){
  .dashboard-ceo-hero__body{grid-template-columns:1fr;gap:18px;align-items:start}
  .dashboard-ceo-hero__text{text-align:left}
  .dashboard-ceo-hero__visual{
    margin:0 auto;
    max-width:320px;
    width:100%;
    height:auto;
    min-height:unset;
    align-self:center;
  }
  .dashboard-ceo-hero__intro{border-bottom:none;padding-bottom:0}
}
.dashboard-ceo-hero__visual{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
  min-height:100%;
  height:100%;
  padding:20px 16px 20px;
  border-radius:20px;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(0,0,0,.22) 0%,rgba(255,255,255,.04) 100%);
  box-shadow:0 8px 40px rgba(0,0,0,.2) inset,0 4px 24px rgba(0,0,0,.12);
  max-width:min(300px,100%);
  width:100%;
  margin:0;
  align-self:stretch;
  justify-self:stretch;
}
.dashboard-ceo-hero__visual--ok{border-color:rgba(52,211,153,.22);box-shadow:0 0 0 1px rgba(52,211,153,.08),0 8px 40px rgba(0,0,0,.18) inset}
.dashboard-ceo-hero__visual--watch{border-color:rgba(251,191,36,.24)}
.dashboard-ceo-hero__visual--risk{border-color:rgba(248,113,113,.28)}
.dashboard-ceo-hero__status{
  position:absolute;
  top:14px;
  right:14px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(148,163,184,.2);
  background:rgba(0,0,0,.25);
  color:var(--text2);
}
.dashboard-ceo-hero__status--ok{border-color:rgba(52,211,153,.45);color:#6ee7b7;background:rgba(52,211,153,.1)}
.dashboard-ceo-hero__status--watch{border-color:rgba(251,191,36,.5);color:#fde68a;background:rgba(245,158,11,.12)}
.dashboard-ceo-hero__status--risk{border-color:rgba(248,113,113,.55);color:#fecaca;background:rgba(239,91,107,.12)}
.dashboard-ceo-hero__ring-wrap{display:flex;justify-content:center;margin:4px 0 0;min-height:112px}
.dashboard-ceo-hero__svg{display:block;width:100%;max-width:200px;height:auto}
.dashboard-ceo-hero__scorenum{
  margin:6px 0 0;
  font-size:clamp(44px,6vw,56px);
  font-weight:800;
  letter-spacing:-.05em;
  line-height:1;
  font-variant-numeric:tabular-nums;
  color:var(--text);
  text-shadow:0 2px 28px rgba(0,0,0,.35);
}
.dashboard-ceo-hero__scorecaption{margin:10px 0 4px;font-size:13px;font-weight:700;line-height:1.35;color:var(--text);text-align:center;max-width:22ch}
.dashboard-ceo-hero__scorehint{margin:0;font-size:11px;line-height:1.4;color:var(--text3);text-align:center;max-width:26ch}
.dashboard-ceo-hero__text{
  min-width:0;
  display:flex;
  flex-direction:column;
  justify-content:flex-start;
  width:100%;
  max-width:none;
}
.dashboard-ceo-hero__eyebrow{margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(45,212,191,.9)}
.dashboard-ceo-hero__title{margin:0 0 12px;font-size:clamp(24px,2.6vw,34px);font-weight:800;letter-spacing:-.04em;line-height:1.12;color:var(--text);max-width:100%}
.dashboard-ceo-hero__brief{margin:0;font-size:15px;line-height:1.58;font-weight:500;color:var(--text2);max-width:min(72ch,100%)}
.dashboard-ceo-hero__legal-wrap{margin:12px 0 0;max-width:100%;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.12);padding:8px 12px 10px}
.dashboard-ceo-hero__legal-summary{
  cursor:pointer;
  font-size:11px;
  font-weight:700;
  color:var(--text3);
  list-style:none;
  user-select:none;
  line-height:1.4;
}
.dashboard-ceo-hero__legal-summary::-webkit-details-marker{display:none}
.dashboard-ceo-hero__legal-wrap[open] .dashboard-ceo-hero__legal-summary{color:var(--text2)}
.dashboard-ceo-hero__legal{margin:10px 0 0;font-size:11px;line-height:1.45;color:var(--text3);max-width:58ch;opacity:.95}
.dashboard-ceo-hero__quick{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
}
@media (max-width:720px){
  .dashboard-ceo-hero__quick{grid-template-columns:repeat(2,minmax(0,1fr))}
}
.dashboard-ceo-hero__quick-btn{
  appearance:none;
  margin:0;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:12px 10px;
  border-radius:14px;
  border:1px solid rgba(148,163,184,.18);
  background:rgba(0,0,0,.22);
  color:var(--text);
  font-size:12px;
  font-weight:700;
  letter-spacing:.02em;
  cursor:pointer;
  text-align:center;
  transition:border-color .15s,background .15s,box-shadow .15s,transform .1s;
}
.dashboard-ceo-hero__quick-ico{
  font-size:13px;
  font-weight:800;
  opacity:.85;
  color:rgba(45,212,191,.95);
}
.dashboard-ceo-hero__quick-btn:hover{
  border-color:rgba(20,184,166,.42);
  background:rgba(20,184,166,.09);
  box-shadow:0 4px 20px rgba(20,184,166,.08);
  color:var(--text);
}
.dashboard-ceo-hero__quick-btn:focus-visible{
  outline:2px solid rgba(45,212,191,.55);
  outline-offset:2px;
}
.dashboard-ceo-hero__quick-btn:active{transform:translateY(1px)}
.dashboard-ceo-hero__prime-card{
  margin:0;
  padding:16px 18px 14px;
  width:100%;
  box-sizing:border-box;
  border-radius:20px;
  border:1px solid rgba(139,92,246,.24);
  background:linear-gradient(148deg,rgba(15,23,42,.96) 0%,rgba(49,46,129,.14) 38%,rgba(20,184,166,.07) 100%);
  box-shadow:0 10px 44px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.05) inset;
  cursor:pointer;
  text-align:left;
  transition:border-color .2s,box-shadow .2s,transform .12s;
}
.dashboard-ceo-hero__prime-card:hover{
  border-color:rgba(167,139,250,.48);
  box-shadow:0 14px 56px rgba(76,29,149,.18),0 0 0 1px rgba(192,132,252,.14) inset;
}
.dashboard-ceo-hero__prime-card:focus-visible{
  outline:2px solid rgba(167,139,250,.55);
  outline-offset:3px;
}
.dashboard-ceo-hero__prime-card:active{transform:scale(.997)}
.dashboard-ceo-hero__prime-head{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px 16px;
  margin-bottom:12px;
}
.dashboard-ceo-hero__prime-titles{display:flex;flex-direction:column;gap:6px;min-width:0}
.dashboard-ceo-hero__prime-eyebrow{
  font-size:10px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:rgba(167,139,250,.88);
}
.dashboard-ceo-hero__prime-title{font-size:15px;font-weight:800;letter-spacing:-.02em;color:var(--text);line-height:1.25}
.dashboard-ceo-hero__prime-hint{font-size:12px;font-weight:500;color:var(--text3);opacity:.95;line-height:1.45;max-width:62ch}
.dashboard-ceo-hero__prime-badge{
  flex-shrink:0;
  font-size:11px;
  font-weight:800;
  letter-spacing:.04em;
  padding:7px 14px;
  border-radius:999px;
  border:1px solid rgba(167,139,250,.38);
  background:rgba(76,29,149,.25);
  color:rgba(221,214,254,.98);
}
.dashboard-ceo-hero__prime-canvas{
  position:relative;
  width:100%;
  min-height:136px;
  border-radius:14px;
  background:rgba(0,0,0,.18);
  border:1px solid rgba(148,163,184,.08);
  overflow:hidden;
}
.dashboard-ceo-hero__prime-empty{
  position:absolute;
  inset:0;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:16px 20px;
  text-align:center;
  pointer-events:none;
}
.dashboard-ceo-hero__prime-empty[hidden]{display:none}
.dashboard-ceo-hero__prime-empty-title{
  margin:0;
  font-size:13px;
  font-weight:700;
  color:var(--text2);
}
.dashboard-ceo-hero__prime-empty-sub{
  margin:0;
  font-size:12px;
  line-height:1.45;
  color:var(--text3);
  max-width:40ch;
}
.dashboard-ceo-hero__prime-surface{
  width:100%;
  min-height:136px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:8px 10px 4px;
  box-sizing:border-box;
}
.dashboard-ceo-hero__prime-svg{width:100%;max-width:100%;height:auto;display:block}
.dashboard-ceo-hero__prime-card--filled .dashboard-ceo-hero__prime-canvas{
  overflow:visible;
  background:
    radial-gradient(110% 140% at 0% 0%, rgba(99,102,241,.12), rgba(2,6,23,0) 48%),
    radial-gradient(130% 160% at 100% 100%, rgba(20,184,166,.1), rgba(2,6,23,0) 52%),
    rgba(2,6,23,.26);
  border-color: rgba(129,140,248,.22);
}
.dashboard-ceo-hero__prime-card--filled .dashboard-ceo-hero__prime-svg{
  filter: drop-shadow(0 8px 26px rgba(99,102,241,.32)) drop-shadow(0 2px 12px rgba(20,184,166,.12));
  overflow:visible;
}
@keyframes dashboard-ceo-prime-target-flow{
  to{stroke-dashoffset:-56}
}
.dashboard-ceo-hero__prime-card--filled .dashboard-ceo-hero__prime-target-line{
  animation:dashboard-ceo-prime-target-flow 16s linear infinite;
}
@media (prefers-reduced-motion:reduce){
  .dashboard-ceo-hero__prime-card--filled .dashboard-ceo-hero__prime-target-line{
    animation:none;
  }
}
.dashboard-ceo-hero__prime-dot{
  transition: transform .22s cubic-bezier(0.22,1,0.36,1), filter .22s ease, stroke .18s ease;
  transform-origin:center;
  transform-box:fill-box;
}
.dashboard-ceo-hero__prime-dot:hover{
  transform: scale(1.18);
  filter: drop-shadow(0 0 10px rgba(167,139,250,.55));
}
.dashboard-ceo-hero__prime-dot:focus-visible{
  outline: none;
  stroke: rgba(94,234,212,.95);
  filter: drop-shadow(0 0 7px rgba(20,184,166,.42));
}
.dashboard-ceo-hero__prime-labels{
  display:flex;
  justify-content:space-between;
  gap:6px;
  margin-top:10px;
  padding:0 6px;
}
.dashboard-ceo-hero__prime-label{
  font-size:9px;
  font-weight:700;
  color:var(--text3);
  opacity:.82;
  flex:1;
  text-align:center;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.dashboard-ceo-hero__prime-foot{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-top:12px;
  padding-top:12px;
  border-top:1px solid rgba(148,163,184,.1);
  font-size:12px;
  font-weight:700;
  color:rgba(94,234,212,.88);
}
.dashboard-ceo-hero__prime-foot-arrow{
  font-size:16px;
  opacity:.9;
  transition:transform .2s;
}
.dashboard-ceo-hero__prime-card:hover .dashboard-ceo-hero__prime-foot-arrow{transform:translateX(4px)}
.dashboard-chart-interpret{
  margin:6px 0 0;
  padding:7px 10px;
  border-radius:var(--ds-radius-sm,10px);
  border-left:2px solid rgba(20,184,166,.45);
  background:rgba(20,184,166,.06);
  font-size:11px;
  line-height:1.45;
  font-weight:600;
  color:var(--text2);
}
.dashboard-priority-now__footer{
  margin-top:16px;
  padding-top:14px;
  border-top:1px dashed rgba(148,163,184,.2);
  display:flex;
  justify-content:flex-start;
}
.dashboard-priority-now__cta{
  min-height:44px!important;
  padding:0 22px!important;
  font-weight:800!important;
  letter-spacing:.02em!important;
}
/* Hero classique (autres pages) : relief + lecture */
.hero.dashboard-hero{
  position:relative;
  overflow:hidden;
  border:1px solid rgba(20,184,166,.2);
  background:linear-gradient(125deg,rgba(20,26,34,.98) 0%,rgba(14,20,28,.95) 45%,rgba(18,30,34,.92) 100%);
  box-shadow:0 12px 48px rgba(0,0,0,.24),0 0 0 1px rgba(255,255,255,.05) inset;
}
.hero.dashboard-hero::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:radial-gradient(ellipse 90% 70% at 92% -10%,rgba(20,184,166,.2),transparent 50%),
    radial-gradient(ellipse 60% 50% at 0% 100%,rgba(61,184,154,.08),transparent 45%);
}
.dashboard-hero__shell{position:relative;z-index:1}
.dashboard-hero__title{text-shadow:0 1px 24px rgba(0,0,0,.25)}
.dashboard-hero__lead--primary{font-size:clamp(14px,1.35vw,16px);font-weight:600;color:var(--text);max-width:62ch}
.dashboard-hero__lead--secondary{opacity:.92}
.dashboard-hero__cta--featured{
  min-height:46px!important;
  padding:0 24px!important;
  font-size:14px!important;
  font-weight:800!important;
  letter-spacing:.02em;
  border-color:rgba(120,180,255,.45)!important;
  box-shadow:0 6px 28px rgba(20,184,166,.38),0 1px 0 rgba(255,255,255,.12) inset!important;
  transition:transform .18s ease,box-shadow .18s ease!important;
}
@media (prefers-reduced-motion:no-preference){
  .dashboard-hero__cta--featured:hover{
    transform:translateY(-2px);
    box-shadow:0 10px 36px rgba(20,184,166,.48),0 1px 0 rgba(255,255,255,.14) inset!important;
  }
}
.dashboard-hero .dashboard-block-link{
  min-height:38px;
  padding:8px 14px;
  font-weight:700;
  border-radius:10px;
}
/* Raccourcis : tuile principale */
.dashboard-shortcuts__tile--featured{
  border-color:rgba(239,91,107,.35)!important;
  background:linear-gradient(145deg,rgba(239,91,107,.12),rgba(255,255,255,.04))!important;
  box-shadow:0 4px 24px rgba(239,91,107,.15),0 1px 0 rgba(255,255,255,.05) inset;
}
.dashboard-shortcuts__tile--featured .dashboard-shortcuts__tile-label{font-size:14px;font-weight:800}
@media (prefers-reduced-motion:no-preference){
  .dashboard-shortcuts__tile--featured:hover{
    border-color:rgba(239,91,107,.5)!important;
    box-shadow:0 8px 32px rgba(239,91,107,.22);
  }
}
/* KPI : complété par dashboard-visual.css (accent gauche), ici focus clavier seulement */
.dashboard-kpi-card--interactive{
  cursor:pointer;
  position:relative;
}
.dashboard-kpi-card--interactive:focus{
  outline:none;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--palette-accent,#14b8a6) 38%,transparent);
}
.dashboard-kpi-card--interactive:focus:not(:focus-visible){
  box-shadow:none;
}
/* Dialog détail KPI : dark theme, scroll interne */
.kpi-detail-dialog{
  padding:0;
  border:none;
  max-width:min(1080px,calc(100vw - 24px));
  width:100%;
  background:transparent;
  color:var(--text);
}
.kpi-detail-dialog::backdrop{
  background:rgba(2,6,12,.72);
  backdrop-filter:blur(4px);
}
.kpi-detail-dialog__panel{
  display:flex;
  flex-direction:column;
  max-height:min(88vh,900px);
  border-radius:var(--ds-radius-lg,18px);
  border:1px solid rgba(148,163,184,.2);
  background:linear-gradient(165deg,rgba(22,28,38,.98) 0%,rgba(12,16,24,.99) 100%);
  box-shadow:0 24px 64px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.05) inset;
  overflow:hidden;
  animation:kpiPerfPanelIn 0.22s cubic-bezier(0.2,0.9,0.2,1) both;
}
@keyframes kpiPerfPanelIn{
  from{opacity:0;transform:translateY(10px) scale(0.99);}
  to{opacity:1;transform:translateY(0) scale(1);}
}
.kpi-detail-dialog__head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  padding:16px 18px 12px;
  border-bottom:1px solid rgba(148,163,184,.12);
}
.kpi-detail-dialog__title{
  margin:0;
  font-size:clamp(17px,1.6vw,20px);
  font-weight:800;
  letter-spacing:-.02em;
  line-height:1.25;
  color:var(--text);
}
.kpi-detail-dialog__close{
  flex-shrink:0;
  display:grid;
  place-items:center;
  width:40px;
  height:40px;
  padding:0;
  border-radius:12px;
  border:1px solid rgba(148,163,184,.2);
  background:rgba(0,0,0,.2);
  color:var(--text2);
  cursor:pointer;
  transition:background .15s ease,border-color .15s ease,color .15s ease;
}
.kpi-detail-dialog__close:hover{
  border-color:rgba(20,184,166,.35);
  color:var(--text);
  background:rgba(20,184,166,.08);
}
.kpi-detail-toolbar{
  display:grid;
  grid-template-columns:minmax(140px,1.4fr) repeat(5,minmax(0,1fr));
  gap:10px;
  padding:12px 18px;
  border-bottom:1px solid rgba(148,163,184,.1);
  background:rgba(0,0,0,.12);
}
@media (max-width:900px){
  .kpi-detail-toolbar{
    grid-template-columns:1fr 1fr;
  }
  .kpi-detail-search{
    grid-column:1/-1;
  }
}
.kpi-detail-search{
  min-height:40px;
  font-size:13px;
}
.kpi-detail-select{
  min-height:40px;
  font-size:12px;
  width:100%;
}
.kpi-detail-count{
  margin:0;
  padding:8px 18px 0;
  font-size:12px;
  font-weight:600;
  color:var(--text2);
}
.kpi-detail-scroll{
  flex:1;
  min-height:0;
  overflow:auto;
  padding:0 12px 12px 18px;
}
.kpi-detail-table{
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  font-size:13px;
}
.kpi-detail-table thead th{
  position:sticky;
  top:0;
  z-index:1;
  text-align:left;
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:var(--text3);
  padding:10px 12px;
  background:rgba(15,23,42,.95);
  border-bottom:1px solid rgba(148,163,184,.15);
}
.kpi-detail-table tbody td{
  padding:10px 12px;
  border-bottom:1px solid rgba(148,163,184,.08);
  vertical-align:top;
  color:var(--text);
}
.kpi-detail-table tbody tr:hover td{
  background:rgba(20,184,166,.05);
}
.kpi-detail-empty{
  padding:28px 20px;
  text-align:center;
  border-radius:14px;
  border:1px dashed rgba(148,163,184,.2);
  margin:8px 18px 12px;
  background:rgba(0,0,0,.15);
}
.kpi-detail-empty__title{
  margin:0 0 8px;
  font-size:15px;
  font-weight:700;
  color:var(--text);
}
.kpi-detail-empty__sub{
  margin:0;
  font-size:13px;
  line-height:1.5;
  color:var(--text2);
  max-width:48ch;
  margin-left:auto;
  margin-right:auto;
}
.kpi-detail-foot{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  justify-content:flex-end;
  padding:12px 18px 16px;
  border-top:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.18);
}
.kpi-detail-table .badge{
  font-size:10px;
  font-weight:800;
  padding:4px 9px;
  max-width:100%;
}
.kpi-detail-cell--main{
  font-weight:600;
  color:var(--text);
  max-width:min(360px,36vw);
}
.dashboard-section--kpi-pilotage{
  padding:4px 2px 8px;
  border-radius:var(--ds-radius-lg,18px);
  border:1px solid rgba(20,184,166,.12);
  background:linear-gradient(180deg,rgba(20,184,166,.04) 0%,transparent 48%);
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.dashboard-section--kpi-pilotage .dashboard-section-head{
  padding:4px 6px 2px;
}
.dashboard-section--kpi-pilotage .dashboard-section-title{
  font-size:clamp(17px,1.55vw,20px);
  letter-spacing:-.03em;
}
.dashboard-section--kpi-pilotage .dashboard-section-kicker{
  opacity:.95;
}
.dashboard-connectivity-slot{display:flex;justify-content:center;padding:8px 16px 4px;width:100%;box-sizing:border-box}
.dashboard-connectivity-card{max-width:560px;width:100%;margin:0 auto;padding:18px 20px;border:1px solid rgba(243,179,79,.5);background:linear-gradient(165deg,rgba(243,179,79,.08),rgba(20,28,40,.5));box-shadow:0 8px 32px rgba(0,0,0,.2)}
.dashboard-connectivity-title{margin:0 0 10px;font-size:17px;font-weight:800;letter-spacing:-.02em;line-height:1.2;color:var(--text);text-align:center}
.dashboard-connectivity-lead{margin:0 0 14px;font-size:13px;line-height:1.5;color:var(--text2);text-align:center;max-width:48ch;margin-left:auto;margin-right:auto}
.dashboard-connectivity-api-label{margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);text-align:center}
.dashboard-connectivity-code{display:block;margin:0 auto 12px;padding:10px 12px;border-radius:var(--ds-radius-sm,10px);border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.2);font-size:12px;font-weight:600;color:var(--accent-blue,#5eead4);text-align:center;word-break:break-all;max-width:100%;box-sizing:border-box}
.dashboard-connectivity-urlhint{margin:0 auto 12px;font-size:12px;line-height:1.45;color:var(--text2);text-align:center;max-width:48ch}
.dashboard-connectivity-filewarn{margin:0 auto 12px;padding:10px 12px;border-radius:var(--ds-radius-sm,10px);border:1px solid rgba(248,113,113,.4);background:rgba(248,113,113,.08);font-size:12px;font-weight:600;line-height:1.4;color:#fecaca;text-align:center;max-width:46ch}
.dashboard-connectivity-actions{display:flex;justify-content:center;margin:0 0 16px}
.dashboard-connectivity-retry{font-size:13px!important;padding:10px 18px!important}
.dashboard-connectivity-steps{margin:0;padding:0 0 0 22px;font-size:12px;line-height:1.55;color:var(--text2);max-width:52ch;margin-left:auto;margin-right:auto}
.dashboard-connectivity-steps li{margin-bottom:8px}
.dashboard-connectivity-steps li:last-child{margin-bottom:0}
.dashboard-section{display:flex;flex-direction:column;gap:12px;margin:0;padding:0 0 6px}
.dashboard-section--charts{gap:8px}
.dashboard-hero__actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:0;align-items:center}
.dashboard-hero__actions .dashboard-block-actions--hero{margin-left:auto}
@media (max-width:520px){.dashboard-hero__actions .dashboard-block-actions--hero{margin-left:0}}
.dashboard-left-stack{display:grid;gap:16px;min-width:0}
.dashboard-muted-lead{margin:6px 0 0;font-size:13px;line-height:1.45;color:var(--text2);max-width:52ch}
.dashboard-kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.dashboard-charts-disclaimer{margin:0;padding:10px 14px;border-radius:var(--ds-radius-sm,12px);border:1px solid rgba(20,184,166,.22);background:linear-gradient(90deg,rgba(20,184,166,.1),rgba(20,184,166,.04));font-size:12px;line-height:1.5;color:var(--text2);max-width:100%;box-shadow:0 2px 12px rgba(20,184,166,.08)}
.dashboard-charts-global-actions{margin:4px 0 0;padding:0 2px 2px}
.dashboard-charts-global-actions .dashboard-block-actions{margin-top:8px;padding-top:10px;border-top:1px dashed rgba(148,163,184,.16)}
.dashboard-charts-disclaimer strong{color:var(--text);font-weight:700}
.dashboard-charts-disclaimer code{font-size:11px;font-weight:600;color:var(--accent-blue, #5eead4);word-break:break-all}
.dashboard-charts-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;align-items:stretch}
.dashboard-chart-card--dash-trend{grid-column:span 5}
.dashboard-chart-card--dash-types{grid-column:span 4}
.dashboard-chart-card--dash-mix{grid-column:span 3}
.dashboard-chart-card--dash-audit{grid-column:span 6}
.dashboard-chart-card--dash-load{grid-column:span 6}
@media (max-width:1180px){
.dashboard-chart-card--dash-trend{grid-column:span 6}
.dashboard-chart-card--dash-types{grid-column:span 6}
.dashboard-chart-card--dash-mix{grid-column:span 6}
.dashboard-chart-card--dash-audit{grid-column:span 6}
.dashboard-chart-card--dash-load{grid-column:span 6}
}
.dashboard-chart-card-head.content-card-head{margin-bottom:10px}
.content-card .dashboard-chart-h{margin:0 0 2px;font-size:16px;font-weight:800;letter-spacing:-.02em;line-height:1.25}
.dashboard-chart-lead{margin-top:4px;font-size:12px;line-height:1.35;max-width:none}
.dashboard-chart-card-inner{
  min-height:0;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(255,255,255,.045) 0%,rgba(255,255,255,.015) 55%,rgba(0,0,0,.04) 100%);
  box-shadow:0 6px 32px rgba(0,0,0,.14),0 1px 0 rgba(255,255,255,.04) inset;
}
.dashboard-band--analysis .dashboard-chart-card-inner:hover{
  border-color:rgba(20,184,166,.2);
  box-shadow:0 10px 40px rgba(0,0,0,.16);
}
.dashboard-line-chart-wrap{display:flex;flex-direction:column;gap:8px;width:100%}
.dashboard-line-chart-svg{width:100%;height:auto;max-height:220px;display:block;filter:drop-shadow(0 1px 8px rgba(20,184,166,.08))}
.dashboard-line-chart-wrap--theme-incidents .dashboard-line-chart-svg{filter:drop-shadow(0 2px 14px rgba(249,115,22,.12))}
.dashboard-line-chart-wrap--theme-audits .dashboard-line-chart-svg{filter:drop-shadow(0 2px 16px rgba(99,102,241,.14))}
.dashboard-line-chart-grid{stroke:var(--ds-chart-grid, rgba(148,163,184,.18));stroke-width:1}
.dashboard-line-chart-grid--base{stroke:var(--ds-chart-grid, rgba(148,163,184,.22));stroke-width:1.25}
.dashboard-line-chart-grid--mid{stroke:rgba(148,163,184,.1);stroke-width:1;stroke-dasharray:4 4}
.dashboard-line-chart-area{pointer-events:none}
.dashboard-line-chart-line{stroke:var(--ds-chart-line-primary, #2dd4bf);stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 2px rgba(20,184,166,.22))}
.dashboard-line-chart-dot{fill:var(--ds-surface-1, #141c28);stroke:var(--ds-chart-line-primary, #2dd4bf);stroke-width:2;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}
.dashboard-line-chart-wrap--theme-incidents .dashboard-line-chart-line{stroke:#ea580c;stroke-width:2.6;filter:drop-shadow(0 2px 8px rgba(234,88,12,.28))}
.dashboard-line-chart-wrap--theme-incidents .dashboard-line-chart-dot{stroke:#ea580c;fill:var(--color-background-primary, var(--ds-surface-1));stroke-width:2.25}
.dashboard-line-chart-wrap--theme-audits .dashboard-line-chart-line{stroke:#6366f1;stroke-width:2.75;filter:drop-shadow(0 2px 10px rgba(99,102,241,.33))}
.dashboard-line-chart-wrap--theme-audits .dashboard-line-chart-dot{stroke:#6366f1;fill:var(--color-background-primary, var(--ds-surface-1));stroke-width:2.25}
.dashboard-line-chart-target-80{
  stroke:rgba(52,211,153,.42);
  stroke-width:1.35;
  stroke-dasharray:6 5;
}
.dashboard-line-chart-target-80-label{
  fill:rgba(148,163,184,.75);
  font-size:9px;
  font-weight:700;
  letter-spacing:.02em;
}
.dashboard-audit-chart-empty{
  border-radius:14px;
  border:1px dashed rgba(99,102,241,.28);
  background:linear-gradient(165deg,rgba(15,23,42,.5) 0%,rgba(49,46,129,.08) 100%);
  min-height:168px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:16px 14px;
}
.dashboard-audit-chart-empty__inner{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  max-width:38ch;
}
.dashboard-audit-chart-empty__glyph{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:44px;
  height:44px;
  margin:0 0 10px;
  border-radius:14px;
  font-size:20px;
  line-height:1;
  color:rgba(165,180,252,.95);
  background:rgba(99,102,241,.12);
  border:1px solid rgba(99,102,241,.22);
}
.dashboard-audit-chart-empty__title{
  margin:0 0 8px;
  font-size:14px;
  font-weight:800;
  letter-spacing:-.02em;
  color:var(--text);
  line-height:1.3;
}
.dashboard-audit-chart-empty__sub{
  margin:0;
  font-size:12px;
  line-height:1.5;
  font-weight:500;
  color:var(--text2);
}
/* Dashboard : bloc audits Chart.js (score + NC) */
.dashboard-audit-charts-block{display:flex;flex-direction:column;gap:10px;width:100%;min-width:0}
.dashboard-audit-charts-block__charts{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px 16px;
  align-items:stretch;
  min-height:0;
}
@media (max-width:720px){
  .dashboard-audit-charts-block__charts{grid-template-columns:1fr}
}
.dashboard-audit-chart-panel{
  display:flex;
  flex-direction:column;
  gap:8px;
  min-width:0;
  padding:10px 10px 8px;
  border-radius:var(--ds-radius-md,12px);
  border:1px solid rgba(99,102,241,.14);
  background:rgba(15,23,42,.28);
}
.dashboard-audit-chart-panel__title{
  margin:0;
  font-size:11px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:var(--text3);
}
.dashboard-audit-chart-panel__canvas{
  position:relative;
  width:100%;
  height:min(220px,42vw);
  min-height:168px;
  max-height:240px;
}
.dashboard-audit-chart-panel__canvas canvas{
  display:block;
  width:100%!important;
  height:100%!important;
}
.dashboard-audit-charts-skeleton{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
  min-height:200px;
}
@media (max-width:720px){
  .dashboard-audit-charts-skeleton{grid-template-columns:1fr}
}
.dashboard-audit-charts-skeleton__panel{
  border-radius:12px;
  border:1px dashed rgba(99,102,241,.22);
  background:rgba(15,23,42,.35);
  padding:16px;
  min-height:168px;
}
.dashboard-audit-charts-skeleton__bar{
  height:12px;
  border-radius:8px;
  background:linear-gradient(90deg,rgba(99,102,241,.15),rgba(99,102,241,.35),rgba(99,102,241,.15));
  background-size:200% 100%;
  animation:dashboard-audit-skel-shimmer 1.35s ease-in-out infinite;
  margin-bottom:12px;
  max-width:55%;
}
.dashboard-audit-charts-skeleton__bar--2{max-width:38%;animation-delay:.2s}
.dashboard-audit-charts-skeleton__bars{
  height:120px;
  border-radius:10px;
  background:linear-gradient(90deg,rgba(148,163,184,.08),rgba(148,163,184,.18),rgba(148,163,184,.08));
  background-size:200% 100%;
  animation:dashboard-audit-skel-shimmer 1.35s ease-in-out infinite;
  animation-delay:.12s;
}
@keyframes dashboard-audit-skel-shimmer{
  0%{background-position:100% 0}
  100%{background-position:-100% 0}
}
.dashboard-audit-charts-block__empty{
  text-align:center;
  padding:28px 16px;
  border-radius:14px;
  border:1px dashed rgba(148,163,184,.28);
  background:rgba(0,0,0,.12);
}
.dashboard-audit-charts-block__empty-title{
  margin:0 0 8px;
  font-size:15px;
  font-weight:800;
  color:var(--text);
}
.dashboard-audit-charts-block__empty-sub{
  margin:0;
  font-size:12px;
  color:var(--text2);
  line-height:1.45;
}
.dashboard-audit-charts-block__interpret{margin-top:2px}
.dashboard-audit-charts-block__foot{margin-top:4px!important}
.dashboard-line-chart-values{display:flex;justify-content:space-between;gap:4px;font-size:12px;font-weight:800;color:var(--text);font-variant-numeric:tabular-nums;padding:2px 2px 0}
.dashboard-line-chart-labels{display:flex;justify-content:space-between;gap:4px;font-size:10px;font-weight:700;color:var(--text2);text-transform:capitalize;padding:0 2px 2px;min-width:0}
.dashboard-line-chart-labels span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;flex:1}
.dashboard-mix-foot{margin-top:4px}
.dashboard-chart-foot--tight{margin-top:8px}
.dashboard-mix-chart-wrap{display:flex;flex-direction:column;gap:10px}
.dashboard-mix-bar{display:flex;height:18px;border-radius:999px;overflow:hidden;background:var(--color-background-tertiary, rgba(255,255,255,.05));border:1px solid var(--ds-border-subtle, rgba(148,163,184,.14));box-shadow:0 2px 12px rgba(0,0,0,.12) inset}
.dashboard-mix-bar--pilot{height:26px;border-radius:12px;box-shadow:0 2px 14px rgba(0,0,0,.14) inset}
.dashboard-mix-seg{min-width:4px;transition:flex .2s ease}
.dashboard-mix-seg--overdue{background:linear-gradient(90deg, rgba(217,119,6,.95), rgba(245,158,11,.82))}
.dashboard-mix-seg--done{background:linear-gradient(90deg, rgba(22,163,74,.92), rgba(52,211,153,.78))}
.dashboard-mix-seg--other{background:linear-gradient(90deg, rgba(71,85,105,.65), rgba(100,116,139,.48))}
.dashboard-mix-legend{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:12px;color:var(--text2)}
.dashboard-mix-legend-item{display:flex;align-items:center;gap:8px}
.dashboard-mix-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dashboard-mix-dot--overdue{background:rgba(245,158,11,.9)}
.dashboard-mix-dot--done{background:rgba(66,199,140,.88)}
.dashboard-mix-dot--other{background:rgba(100,116,139,.82)}
.dashboard-mix-seg--pilot-crit{background:linear-gradient(90deg,rgba(220,38,38,.95),rgba(127,29,29,.82))}
.dashboard-mix-seg--pilot-watch{background:linear-gradient(90deg,rgba(251,146,60,.94),rgba(234,88,12,.78))}
.dashboard-mix-seg--pilot-nc{background:linear-gradient(90deg,rgba(124,58,237,.92),rgba(99,102,241,.78))}
.dashboard-mix-dot--pilot-crit{background:rgba(220,38,38,.92)}
.dashboard-mix-dot--pilot-watch{background:rgba(243,179,79,.92)}
.dashboard-mix-dot--pilot-nc{background:linear-gradient(135deg,rgba(124,58,237,.95),rgba(99,102,241,.88))}
.dashboard-mix-seg--req-ok{background:linear-gradient(90deg,rgba(66,199,140,.88),rgba(61,184,154,.72))}
.dashboard-mix-seg--req-part{background:linear-gradient(90deg,rgba(229,184,77,.88),rgba(243,179,79,.68))}
.dashboard-mix-seg--req-nc{background:linear-gradient(90deg,rgba(232,93,108,.9),rgba(248,113,113,.72))}
.dashboard-mix-dot--req-ok{background:rgba(66,199,140,.88)}
.dashboard-mix-dot--req-part{background:rgba(229,184,77,.92)}
.dashboard-mix-dot--req-nc{background:rgba(232,93,108,.88)}
.dashboard-mix-seg--doc-miss{background:linear-gradient(90deg,rgba(248,113,113,.82),rgba(232,93,108,.68))}
.dashboard-mix-seg--doc-obs{background:linear-gradient(90deg,rgba(245,158,11,.85),rgba(229,184,77,.65))}
.dashboard-mix-seg--doc-crit{background:linear-gradient(90deg,rgba(239,91,107,.88),rgba(232,93,108,.72))}
.dashboard-mix-dot--doc-miss{background:rgba(248,113,113,.85)}
.dashboard-mix-dot--doc-obs{background:rgba(245,158,11,.88)}
.dashboard-mix-dot--doc-crit{background:rgba(239,91,107,.85)}
.dashboard-mix-seg--plan-pending{background:linear-gradient(90deg,rgba(20,184,166,.55),rgba(20,184,166,.38))}
.dashboard-mix-seg--plan-run{background:linear-gradient(90deg,rgba(243,179,79,.88),rgba(245,158,11,.72))}
.dashboard-mix-seg--plan-done{background:linear-gradient(90deg,rgba(66,199,140,.85),rgba(52,211,153,.68))}
.dashboard-mix-dot--plan-pending{background:rgba(20,184,166,.78)}
.dashboard-mix-dot--plan-run{background:rgba(243,179,79,.9)}
.dashboard-mix-dot--plan-done{background:rgba(66,199,140,.88)}
.dashboard-breakdown-wrap{display:flex;flex-direction:column;gap:10px}
.dashboard-breakdown-row{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,2fr) auto;gap:10px 12px;align-items:center;font-size:12px}
.dashboard-breakdown-label{color:var(--text2);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.dashboard-breakdown-track{height:11px;border-radius:999px;background:var(--color-background-tertiary, rgba(255,255,255,.07));overflow:hidden;border:1px solid var(--color-border-tertiary, rgba(148,163,184,.08))}
.dashboard-breakdown-fill{height:100%;border-radius:999px;min-width:4px;transition:width .35s cubic-bezier(.25,.8,.25,1)}
.dashboard-breakdown-fill--tone-0{background:linear-gradient(90deg, rgba(234,88,12,.9), rgba(251,113,133,.55));box-shadow:0 0 12px rgba(234,88,12,.2)}
.dashboard-breakdown-fill--tone-1{background:linear-gradient(90deg, rgba(124,58,237,.88), rgba(99,102,241,.52));box-shadow:0 0 12px rgba(99,102,241,.22)}
.dashboard-breakdown-fill--tone-2{background:linear-gradient(90deg, rgba(13,148,136,.9), rgba(45,212,191,.55));box-shadow:0 0 12px rgba(20,184,166,.2)}
.dashboard-breakdown-fill--tone-3{background:linear-gradient(90deg, rgba(37,99,235,.88), rgba(59,130,246,.55));box-shadow:0 0 12px rgba(37,99,235,.18)}
.dashboard-breakdown-fill--tone-4{background:linear-gradient(90deg, rgba(217,119,6,.9), rgba(251,191,36,.55));box-shadow:0 0 12px rgba(245,158,11,.18)}
.dashboard-breakdown-count{font-weight:700;color:var(--text);font-variant-numeric:tabular-nums;min-width:1.5em;text-align:right}
.dashboard-pilot-load{display:flex;flex-direction:column;gap:12px;width:100%;min-width:0}
.dashboard-pilot-load-inner{display:flex;flex-wrap:wrap;align-items:stretch;gap:16px 18px}
.dashboard-pilot-load-main{flex:1.35 1 280px;min-width:0;display:flex;flex-direction:column;gap:10px}
.dashboard-pilot-load-side{flex:1 1 260px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;min-width:0}
@media (max-width:640px){.dashboard-pilot-load-side{grid-template-columns:1fr}}
.dashboard-mix-legend--pilot{margin-top:2px}
.dashboard-pilot-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;padding:12px 10px;border-radius:var(--ds-radius-md,12px);border:1px solid var(--color-border-tertiary);background:var(--color-background-primary);min-height:92px;box-shadow:0 1px 0 rgba(255,255,255,.04) inset}
.dashboard-pilot-stat-val{font-size:clamp(26px,4vw,34px);font-weight:900;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;color:var(--text)}
.dashboard-pilot-stat-kicker{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.dashboard-pilot-stat-sub{font-size:10px;font-weight:600;color:var(--text2);line-height:1.25;opacity:.92}
.dashboard-pilot-stat--crit{border-color:rgba(220,38,38,.35);background:linear-gradient(165deg,rgba(254,226,226,.35),var(--color-background-secondary))}
.dashboard-pilot-stat--crit .dashboard-pilot-stat-val{color:var(--color-text-danger)}
.dashboard-pilot-stat--watch{border-color:rgba(234,88,12,.32);background:linear-gradient(165deg,rgba(255,237,213,.4),var(--color-background-secondary))}
.dashboard-pilot-stat--watch .dashboard-pilot-stat-val{color:var(--color-text-warning)}
.dashboard-pilot-stat--nc{border-color:rgba(124,58,237,.32);background:linear-gradient(165deg,rgba(237,233,254,.45),var(--color-background-secondary))}
.dashboard-pilot-stat--nc .dashboard-pilot-stat-val{color:#6d28d9}
[data-theme='dark'] .dashboard-pilot-stat--nc .dashboard-pilot-stat-val{color:#c4b5fd}
.dashboard-priority-heading--nc .dashboard-priority-dot{background:rgba(229,184,77,.95);box-shadow:0 0 0 2px rgba(229,184,77,.22)}
.dashboard-priority-row--nc{border-left-color:rgba(229,184,77,.55);background:rgba(229,184,77,.06)}
.dashboard-alerts-panel{margin-top:0}
.dashboard-alerts-card{padding:16px 18px}
.dashboard-alerts-host{min-height:0}
.dashboard-activity-wrap{margin:0}
.dashboard-activity-section.content-card{margin-top:0;border-radius:var(--ds-radius-md,14px);box-shadow:0 4px 28px rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.12)}
.dashboard-activity-section--body{box-shadow:0 4px 28px rgba(0,0,0,.12)}
.dashboard-activity-head.content-card-head{margin-bottom:14px;padding-bottom:4px}
.dashboard-activity-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px 28px;align-items:start}
.dashboard-activity-col{display:flex;flex-direction:column;gap:12px;min-width:0;border-left:1px solid var(--ds-border-subtle, rgba(148,163,184,.14));padding-left:20px}
.dashboard-activity-col:first-child{border-left:none;padding-left:0}
.dashboard-activity-col-title{margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(20,184,166,.88)}
.dashboard-activity-stack{display:flex;flex-direction:column;gap:8px;min-height:0}
.dashboard-activity-col-footer{margin-top:2px;padding-top:4px;border-top:1px dashed rgba(148,163,184,.12)}
.dashboard-activity-col-more{display:inline-flex;align-items:center;gap:6px;margin:0;padding:8px 0;border:none;background:transparent;font:inherit;font-size:11px;font-weight:700;letter-spacing:.04em;color:rgba(20,184,166,.92);cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(20,184,166,.32);transition:color .15s ease,text-decoration-color .15s ease}
.dashboard-activity-col-more:hover{color:#5eead4;text-decoration-color:rgba(94,234,212,.55)}
.dashboard-activity-col-more:focus-visible{outline:2px solid rgba(20,184,166,.45);outline-offset:2px;border-radius:4px}
.dashboard-activity-col-empty{margin:0;padding:10px 0;font-size:12px;line-height:1.45;color:var(--text3);font-style:italic}
@media (max-width:900px){
.dashboard-activity-grid{grid-template-columns:1fr;gap:20px}
.dashboard-activity-col{border-left:none;padding-left:0;padding-top:16px;border-top:1px solid var(--ds-border-subtle, rgba(148,163,184,.14))}
.dashboard-activity-col:first-child{border-top:none;padding-top:0}
}
.dashboard-activity-global-empty{padding:22px 18px;text-align:center;border-radius:var(--ds-radius-md, 14px);border:1px dashed rgba(148,163,184,.2);background:rgba(255,255,255,.03)}
.dashboard-activity-global-empty-msg{margin:0 0 8px;font-size:15px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-activity-global-empty-sub{margin:0 auto 16px;max-width:48ch;font-size:12px;line-height:1.5;color:var(--text2);font-weight:500}
.dashboard-activity-item{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:var(--ds-radius-sm, 12px);background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.11);min-width:0;text-align:left}
.dashboard-activity-item--link{cursor:pointer;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease,transform .12s ease}
.dashboard-activity-item--link:hover,.dashboard-activity-item--link:focus{background:rgba(20,184,166,.09);border-color:rgba(20,184,166,.26);outline:none;transform:translateY(-1px)}
.dashboard-activity-item--link:focus-visible{box-shadow:var(--ds-shadow-focus, 0 0 0 3px rgba(20,184,166,.22))}
.dashboard-activity-item__head{margin:0 0 2px}
.dashboard-activity-item__kind{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-blue)}
.dashboard-activity-item__top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0}
.dashboard-activity-item__title{font-size:13px;font-weight:800;letter-spacing:-.02em;line-height:1.3;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.dashboard-activity-item__badge{flex-shrink:0;font-size:9px!important;padding:3px 8px!important;line-height:1.2;max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dashboard-activity-item__ctx{margin:0;font-size:12px;line-height:1.45;color:var(--text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dashboard-activity-item__status-row{display:flex;align-items:baseline;gap:10px;padding:8px 0;margin:2px 0 0;border-top:1px solid rgba(148,163,184,.1);border-bottom:1px solid rgba(148,163,184,.06)}
.dashboard-activity-item__status-k{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);flex-shrink:0}
.dashboard-activity-item__status-v{font-size:12px;font-weight:600;color:var(--text);line-height:1.3;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dashboard-activity-item__foot{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 10px;margin-top:4px;padding-top:8px}
.dashboard-activity-item__date{font-size:11px;font-weight:800;color:var(--text3);font-variant-numeric:tabular-nums}
.dashboard-activity-item__hint{font-size:11px;font-weight:700;color:var(--accent-blue);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dashboard-chart-card .bar-chart{margin-top:4px}
.dashboard-bar-chart-wrap{display:flex;flex-direction:column;gap:0}
.dashboard-bar-chart--dashboard{display:grid;grid-template-columns:repeat(6,1fr);align-items:end;gap:10px;height:176px;padding-top:8px}
.dashboard-bar{position:relative;border-radius:14px 14px 10px 10px;background:linear-gradient(180deg,rgba(20,184,166,.88),rgba(13,148,136,.72));height:var(--bar-h,45%);min-height:12px;box-shadow:0 6px 18px rgba(20,184,166,.12)}
.dashboard-bar span{position:absolute;left:50%;transform:translateX(-50%);bottom:-24px;font-size:11px;font-weight:600;color:var(--text3);white-space:nowrap}
.dashboard-chart-axis{margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)}
.dashboard-chart-foot{margin-top:26px;font-size:12px;color:var(--text3);line-height:1.45;max-width:62ch}
.dashboard-situation-wrap{display:flex;flex-direction:column;gap:12px}
.dashboard-situation-list{list-style:none;margin:0;padding:0;display:grid;gap:0}
.dashboard-situation-item{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px;line-height:1.4}
.dashboard-situation-item:last-child{border-bottom:none;padding-bottom:0}
.dashboard-situation-k{color:var(--text3);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
.dashboard-situation-v{font-weight:700;color:var(--text);text-align:right}
.dashboard-situation-note{margin:0;font-size:12px;line-height:1.45;color:var(--text3)}
.dashboard-priority-stack{display:grid;gap:14px}
.dashboard-priority-block{padding:0}
.dashboard-priority-heading{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text)}
.dashboard-priority-heading--incidents,.dashboard-priority-heading--actions{color:var(--text)}
.dashboard-priority-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dashboard-priority-heading--incidents .dashboard-priority-dot{background:rgba(239,91,107,.85);box-shadow:0 0 0 2px rgba(239,91,107,.2)}
.dashboard-priority-heading--actions .dashboard-priority-dot{background:rgba(243,179,79,.9);box-shadow:0 0 0 2px rgba(243,179,79,.2)}
.dashboard-priority-list.stack{gap:8px}
.dashboard-priority-row.list-row{border-left-width:3px;border-left-style:solid}
.dashboard-priority-row--incident{border-left-color:rgba(239,91,107,.5);background:rgba(239,91,107,.04)}
.dashboard-priority-row--action{border-left-color:rgba(243,179,79,.5);background:rgba(243,179,79,.05)}
@media (max-width:1200px){.dashboard-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:900px){
.dashboard-charts-grid{grid-template-columns:1fr}
.dashboard-chart-card--dash-trend,
.dashboard-chart-card--dash-types,
.dashboard-chart-card--dash-mix,
.dashboard-chart-card--dash-audit,
.dashboard-chart-card--dash-load{grid-column:span 1}
}
@media (max-width:1100px){.dashboard-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:760px){.dashboard-kpi-grid{grid-template-columns:1fr}}
@media (max-width:900px){.dashboard-activity-grid{grid-template-columns:1fr}.dashboard-activity-col{border-left:none;padding-left:0;border-top:1px solid var(--ds-border-subtle, rgba(148,163,184,.1));padding-top:14px}.dashboard-activity-col:first-child{border-top:none;padding-top:0}}
.dashboard-cockpit{
  border-radius:var(--ds-radius-lg,20px);
  border:1px solid rgba(148,163,184,.18);
  background:linear-gradient(165deg, rgba(26,34,50,.98) 0%, rgba(16,22,32,.92) 48%, rgba(20,184,166,.07) 100%);
  box-shadow:0 10px 44px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.04) inset;
  padding:22px 24px 20px;
}
.dashboard-cockpit__inner{display:flex;flex-direction:column;gap:18px;min-width:0}
.dashboard-cockpit__head{margin:0;padding:0 0 2px}
.dashboard-cockpit__kicker{display:block;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-blue);margin:0 0 6px}
.dashboard-cockpit__title{margin:0;font-size:clamp(20px,2.2vw,26px);font-weight:800;letter-spacing:-.03em;line-height:1.15;color:var(--text)}
.dashboard-cockpit__card{border-radius:var(--ds-radius-md,14px);border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.025);padding:16px 18px;transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;box-shadow:0 1px 0 rgba(255,255,255,.04) inset}
.dashboard-cockpit__card:hover{border-color:rgba(148,163,184,.22);box-shadow:none}
.dashboard-cockpit__card--focus{border-color:rgba(20,184,166,.22);background:linear-gradient(135deg, rgba(20,184,166,.09) 0%, rgba(255,255,255,.02) 100%);box-shadow:0 0 0 1px rgba(20,184,166,.08), 0 8px 32px rgba(0,0,0,.1)}
.dashboard-cockpit__card--focus:hover{border-color:rgba(20,184,166,.3)}
.dashboard-cockpit__card--analytics{background:rgba(0,0,0,.12);border-color:rgba(148,163,184,.08)}
.dashboard-cockpit__card--complement{padding:14px 16px;background:rgba(255,255,255,.02);border-color:rgba(148,163,184,.08)}
.dashboard-cockpit__card-head{margin:0 0 14px}
.dashboard-cockpit__card-head--compact{margin:0 0 10px}
.dashboard-cockpit__card-kicker{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin:0 0 4px}
.dashboard-cockpit__card-title{margin:0;font-size:13px;font-weight:700;letter-spacing:-.02em;color:var(--text)}
.dashboard-cockpit__card--complement .dashboard-cockpit__card-title{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text2)}
.dashboard-cockpit__situation{margin:0}
.dashboard-cockpit__intro{margin:0;font-size:14px;line-height:1.45;font-weight:600;color:var(--text);max-width:58ch}
.dashboard-cockpit__micro{margin:10px 0 0;font-size:12px;line-height:1.4;font-weight:600;color:var(--accent-blue)}
.dashboard-cockpit__situation-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(148,163,184,.1)}
.dashboard-cockpit__pill{padding:8px 14px;border-radius:999px;border:1px solid rgba(148,163,184,.2);background:rgba(255,255,255,.04);color:var(--text);font-size:12px;font-weight:600;cursor:pointer;transition:background .18s ease, border-color .18s ease, transform .15s ease, color .15s ease}
.dashboard-cockpit__pill:hover{background:rgba(20,184,166,.12);border-color:rgba(20,184,166,.35);transform:translateY(-1px)}
.dashboard-cockpit__pill--emph{background:rgba(20,184,166,.16);border-color:rgba(20,184,166,.4);color:var(--text)}
.dashboard-cockpit__pill--emph:hover{background:rgba(20,184,166,.24);border-color:rgba(20,184,166,.5)}
.dashboard-cockpit__pill:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-cockpit__chart{padding:0;margin:0;border:none;background:transparent;box-shadow:none}
.dashboard-cockpit__bars{display:flex;flex-direction:column;gap:12px}
.dashboard-cockpit__bar-row{display:grid;grid-template-columns:minmax(112px,1.1fr) minmax(0,2fr) 44px;gap:14px;align-items:center;font-size:13px}
.dashboard-cockpit__bar-label{color:var(--text);font-weight:600;line-height:1.25}
.dashboard-cockpit__bar-track{height:12px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid rgba(255,255,255,.06)}
.dashboard-cockpit__bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg, rgba(20,184,166,.85), rgba(61,184,154,.75));width:0%;min-width:0;transition:width .4s cubic-bezier(.25,.8,.25,1)}
.dashboard-cockpit__bar-row:nth-child(2) .dashboard-cockpit__bar-fill{background:linear-gradient(90deg, rgba(229,184,77,.88), rgba(232,93,108,.55))}
.dashboard-cockpit__bar-row:nth-child(3) .dashboard-cockpit__bar-fill{background:linear-gradient(90deg, rgba(245,158,11,.75), rgba(243,179,79,.5))}
.dashboard-cockpit__bar-row:nth-child(4) .dashboard-cockpit__bar-fill{background:linear-gradient(90deg, rgba(66,199,140,.75), rgba(20,184,166,.5))}
.dashboard-cockpit__bar-val{font-weight:800;font-size:14px;font-variant-numeric:tabular-nums;color:var(--text);text-align:right}
.dashboard-cockpit__chart-read{margin:14px 0 0;font-size:12px;font-weight:600;line-height:1.45;color:var(--text2);max-width:68ch}
.dashboard-cockpit__chart-note{margin:6px 0 0;font-size:10px;line-height:1.35;color:var(--text3);max-width:62ch;opacity:.88}
.dashboard-cockpit__chart-actions{margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-cockpit__textlink{padding:0;border:none;background:none;color:var(--accent-blue);font-size:12px;font-weight:700;cursor:pointer;text-align:left;transition:opacity .15s ease, color .15s ease}
.dashboard-cockpit__textlink:hover{opacity:.88;color:#5eead4}
.dashboard-cockpit__textlink:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus);border-radius:4px}
.dashboard-cockpit__watch{min-height:0}
.dashboard-cockpit__watch-empty{margin:0;font-size:12px;line-height:1.45;color:var(--text2);font-weight:500;max-width:56ch}
.dashboard-cockpit__watch-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.dashboard-cockpit__watch-item{width:100%;text-align:left;padding:8px 10px;margin:0;border-radius:var(--ds-radius-sm,10px);border:1px solid rgba(148,163,184,.08);background:rgba(255,255,255,.03);color:var(--text);font-size:12px;font-weight:600;line-height:1.3;cursor:pointer;transition:background .18s ease, border-color .18s ease, transform .12s ease}
.dashboard-cockpit__watch-item:hover{background:rgba(20,184,166,.1);border-color:rgba(20,184,166,.22);transform:translateX(2px)}
.dashboard-cockpit__watch-item:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-cockpit__mini-val{font-size:11px;font-weight:700;line-height:1.25;color:var(--text);max-height:2.75em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-align:center;hyphens:auto}
.dashboard-cockpit__alert{display:flex;flex-direction:column;gap:0;padding:0;border-radius:var(--ds-radius-md,14px);border:1px solid transparent;cursor:pointer;transition:background .2s ease, border-color .2s ease, transform .18s ease, box-shadow .2s ease;box-shadow:0 4px 20px rgba(0,0,0,.1);overflow:hidden}
.dashboard-cockpit__alert:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,.14)}
.dashboard-cockpit__alert:focus{outline:none}
.dashboard-cockpit__alert:focus-visible{box-shadow:var(--ds-shadow-focus, 0 0 0 3px rgba(20,184,166,.22)), 0 4px 20px rgba(0,0,0,.1)}
.dashboard-cockpit__alert-body{display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px 16px;padding:15px 18px;text-align:left}
.dashboard-cockpit__alert-secondary{padding:0 18px 12px 18px;border-top:1px solid rgba(255,255,255,.06)}
.dashboard-cockpit__alert-link{padding:4px 0;border:none;background:none;color:var(--accent-blue);font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.dashboard-cockpit__alert-link:hover{opacity:.9}
.dashboard-cockpit__alert--ok{background:rgba(66,199,140,.11);border-color:rgba(66,199,140,.25)}
.dashboard-cockpit__alert--ok:hover{background:rgba(66,199,140,.15)}
.dashboard-cockpit__alert--warn{background:rgba(243,179,79,.12);border-color:rgba(243,179,79,.3)}
.dashboard-cockpit__alert--warn:hover{background:rgba(243,179,79,.17)}
.dashboard-cockpit__alert--nc{background:rgba(229,184,77,.12);border-color:rgba(229,184,77,.32)}
.dashboard-cockpit__alert--nc:hover{background:rgba(229,184,77,.17)}
.dashboard-cockpit__alert--risk{background:rgba(232,93,108,.12);border-color:rgba(232,93,108,.3)}
.dashboard-cockpit__alert--risk:hover{background:rgba(232,93,108,.17)}
.dashboard-cockpit__alert-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);width:100%;flex-basis:100%}
.dashboard-cockpit__alert-msg{flex:1;min-width:min(100%,200px);font-size:15px;font-weight:600;color:var(--text);line-height:1.35}
.dashboard-cockpit__alert-cta{font-size:12px;font-weight:700;color:var(--accent-blue);white-space:nowrap;align-self:center}
.dashboard-cockpit__minis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.dashboard-cockpit__minis--support{opacity:.94}
.dashboard-cockpit__mini{padding:12px 10px;border-radius:var(--ds-radius-sm,12px);background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.09);text-align:center;transition:background .18s ease, border-color .18s ease, transform .15s ease}
.dashboard-cockpit__mini:hover{background:rgba(255,255,255,.05);border-color:rgba(148,163,184,.14);transform:translateY(-1px)}
.dashboard-cockpit__mini-label{display:block;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.dashboard-shortcuts .dashboard-section-sub{max-width:52ch}
.dashboard-shortcuts__grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.dashboard-shortcuts__tile{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:4px;padding:12px 14px;border-radius:var(--ds-radius-md,14px);border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);color:var(--text);cursor:pointer;transition:background .2s ease, border-color .2s ease, transform .15s ease, box-shadow .2s ease;min-height:64px;box-shadow:0 1px 0 rgba(255,255,255,.03) inset}
.dashboard-shortcuts__tile:hover{background:rgba(255,255,255,.06);border-color:rgba(20,184,166,.28);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.12)}
.dashboard-shortcuts__tile:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-shortcuts__tile-label{font-size:13px;font-weight:700;line-height:1.25;letter-spacing:-.01em}
.dashboard-shortcuts__tile-hint{font-size:10px;font-weight:600;color:var(--text3);line-height:1.3}
.dashboard-shortcuts__tile--incident:hover{border-color:rgba(239,91,107,.35)}
.dashboard-shortcuts__tile--action:hover{border-color:rgba(243,179,79,.35)}
.dashboard-shortcuts__tile--audit:hover{border-color:rgba(20,184,166,.38)}
.dashboard-shortcuts__tile--nc:hover{border-color:rgba(245,158,11,.38)}
.dashboard-shortcuts__tile--import:hover{border-color:rgba(20,184,166,.35)}
.dashboard-shortcuts__tile--export:hover{border-color:rgba(66,199,140,.35)}
@media (max-width:1100px){.dashboard-shortcuts__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.dashboard-alerts-prio-card{
  padding:18px 20px 16px;
  border-radius:var(--ds-radius-md,16px);
  box-shadow:0 10px 40px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.04) inset;
  border:1px solid rgba(148,163,184,.18);
  background:linear-gradient(165deg,rgba(28,36,52,.95) 0%,rgba(18,24,36,.9) 100%);
}
.dashboard-band--alerts .dashboard-alerts-prio-card{
  border-color:rgba(232,93,108,.2);
  box-shadow:0 12px 44px rgba(0,0,0,.22),0 0 0 1px rgba(239,91,107,.08);
}
.dashboard-executive-panel{
  margin-bottom:4px;
  border:1px solid rgba(20,184,166,.18);
  background:linear-gradient(145deg,rgba(255,255,255,.04) 0%,rgba(20,184,166,.05) 40%,rgba(0,0,0,.06) 100%);
  box-shadow:0 6px 32px rgba(0,0,0,.14),0 1px 0 rgba(255,255,255,.04) inset;
}
.dashboard-executive-panel__grid{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(200px,248px);
  gap:26px 28px;
  align-items:start;
}
@media (max-width:960px){
  .dashboard-executive-panel__grid{grid-template-columns:1fr}
}
.dashboard-executive-panel__kicker{color:rgba(45,212,191,.9)}
.dashboard-executive-panel__title{
  margin:6px 0 14px;
  font-size:clamp(19px,1.9vw,23px);
  font-weight:800;
  letter-spacing:-.03em;
  line-height:1.2;
  color:var(--text);
}
.dashboard-executive-panel__brief{
  margin:0;
  font-size:14px;
  line-height:1.65;
  color:var(--text2);
  font-weight:500;
  max-width:64ch;
}
.dashboard-exec-score{
  text-align:center;
  padding:16px 14px 14px;
  border-radius:16px;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(0,0,0,.12) 0%,rgba(255,255,255,.03) 100%);
  position:relative;
}
.dashboard-exec-score__ring{
  display:flex;
  justify-content:center;
  margin:0 auto 4px;
  height:84px;
}
.dashboard-exec-score__svg{display:block;width:140px;height:84px}
.dashboard-exec-score__value{
  font-size:38px;
  font-weight:800;
  letter-spacing:-.04em;
  line-height:1;
  font-variant-numeric:tabular-nums;
  color:var(--text);
  margin-top:-6px;
}
.dashboard-exec-score__label{
  display:block;
  margin:8px 0 4px;
  font-size:12px;
  font-weight:700;
  line-height:1.35;
  color:var(--text);
  padding:0 6px;
}
.dashboard-exec-score__hint{
  margin:0 0 10px;
  font-size:11px;
  line-height:1.4;
  color:var(--text3);
  padding:0 8px;
}
.dashboard-exec-score__micro{
  margin:0;
  font-size:10px;
  line-height:1.35;
  color:var(--text3);
  opacity:.85;
  padding:10px 8px 0;
  border-top:1px solid rgba(148,163,184,.1);
}
.dashboard-exec-score--ok{border-color:rgba(52,211,153,.22)}
.dashboard-exec-score--watch{border-color:rgba(251,191,36,.22)}
.dashboard-exec-score--risk{border-color:rgba(248,113,113,.22)}
.dashboard-priority-now{
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(255,255,255,.035) 0%,rgba(0,0,0,.05) 100%);
  box-shadow:0 4px 24px rgba(0,0,0,.1);
}
.dashboard-priority-now__head{margin-bottom:12px}
.dashboard-priority-now__summary{
  display:flex;
  flex-wrap:wrap;
  gap:10px 12px;
  align-items:stretch;
  margin:0 0 14px;
  padding:12px 14px;
  border-radius:14px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.06);
}
.dashboard-priority-now__summary-more{
  flex:1 0 100%;
  margin:2px 0 0;
  font-size:11px;
  font-weight:600;
  line-height:1.4;
  color:var(--text3);
  max-width:56ch;
}
.dashboard-priority-now__pill{
  display:flex;
  flex-direction:column;
  gap:4px;
  min-width:0;
  flex:1 1 104px;
  max-width:200px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(148,163,184,.1);
  background:rgba(255,255,255,.035);
}
.dashboard-priority-now__pill-value{
  font-size:clamp(18px,2.2vw,22px);
  font-weight:800;
  font-variant-numeric:tabular-nums;
  line-height:1;
  color:var(--text);
  letter-spacing:-.02em;
}
.dashboard-priority-now__pill-label{
  font-size:9px;
  font-weight:800;
  letter-spacing:.07em;
  text-transform:uppercase;
  color:var(--text3);
  line-height:1.25;
}
.dashboard-priority-now__pill--urgent{border-color:rgba(248,113,113,.3);background:rgba(239,91,107,.09)}
.dashboard-priority-now__pill--delay{border-color:rgba(251,191,36,.32);background:rgba(245,158,11,.08)}
.dashboard-priority-now__pill--nc{border-color:rgba(251,191,36,.35);background:rgba(245,158,11,.1)}
.dashboard-priority-now__pill--calm{border-color:rgba(148,163,184,.1)}
.dashboard-priority-now__kicker{color:rgba(52,211,153,.9)}
.dashboard-priority-now__title{margin:6px 0 6px;font-size:clamp(17px,1.6vw,20px);font-weight:800;letter-spacing:-.02em}
.dashboard-priority-now__sub{margin:0;font-size:12px;line-height:1.45;color:var(--text3);max-width:52ch}
.dashboard-priority-now__list{display:flex;flex-direction:column;gap:8px}
.dashboard-priority-now__empty{margin:0;padding:16px 12px;text-align:center;font-size:13px;line-height:1.5;color:var(--text2);border-radius:12px;border:1px dashed rgba(148,163,184,.18);background:rgba(255,255,255,.02)}
.dashboard-priority-now__row{
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  gap:12px 14px;
  align-items:center;
  width:100%;
  text-align:left;
  padding:12px 14px;
  border-radius:12px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(255,255,255,.04);
  color:var(--text);
  font-family:inherit;
  cursor:pointer;
  transition:background .18s ease,border-color .18s ease,transform .12s ease,box-shadow .18s ease;
}
@media (prefers-reduced-motion:no-preference){
  .dashboard-priority-now__row:hover{
    background:rgba(20,184,166,.08);
    border-color:rgba(20,184,166,.28);
    transform:translateY(-1px);
    box-shadow:0 6px 20px rgba(0,0,0,.1);
  }
}
.dashboard-priority-now__row--urgent{border-left:4px solid rgba(248,113,113,.75)}
.dashboard-priority-now__row--delay{border-left:4px solid rgba(251,191,36,.8)}
.dashboard-priority-now__row--nc{border-left:4px solid rgba(251,191,36,.82)}
.dashboard-priority-now__chip{
  font-size:9px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
  padding:5px 8px;
  border-radius:8px;
  border:1px solid rgba(148,163,184,.15);
  color:var(--text3);
  white-space:nowrap;
}
.dashboard-priority-now__main{display:flex;flex-direction:column;gap:3px;min-width:0}
.dashboard-priority-now__row-title{font-size:13px;font-weight:800;line-height:1.3;letter-spacing:-.02em}
.dashboard-priority-now__row-meta{font-size:11px;color:var(--text3);line-height:1.35}
.dashboard-priority-now__go{font-size:12px;font-weight:700;color:var(--accent-blue);white-space:nowrap}
.dashboard-alerts-prio-host{display:flex;flex-direction:column;gap:6px;min-height:0}
.dashboard-alerts-prio-tier-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 14px}
.dashboard-alerts-prio-tier-pill{padding:10px 8px;border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.035);text-align:center;display:flex;flex-direction:column;gap:4px;min-width:0}
.dashboard-alerts-prio-tier-pill-label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.dashboard-alerts-prio-tier-pill-sub{font-size:11px;font-weight:600;color:var(--text2);line-height:1.25}
.dashboard-alerts-prio-tier-pill--urgent-idle{opacity:.72}
.dashboard-alerts-prio-tier-pill--watch-idle{opacity:.72}
.dashboard-alerts-prio-tier-pill--normal-active{
  border-color:rgba(52,211,153,.45);
  background:linear-gradient(145deg,rgba(52,211,153,.16),rgba(52,211,153,.06));
  box-shadow:0 2px 14px rgba(52,211,153,.12);
}
.dashboard-alerts-prio-tier-pill--normal-active .dashboard-alerts-prio-tier-pill-sub{color:var(--text)}
.dashboard-alerts-prio-tier-pill--urgent-idle{border-color:rgba(239,91,107,.12)}
.dashboard-alerts-prio-tier-pill--watch-idle{border-color:rgba(245,158,11,.12)}
.dashboard-alerts-prio-normal--stable{padding:2px 0 0;text-align:left;max-width:100%}
.dashboard-alerts-prio-normal-msg{margin:0 0 6px;font-size:14px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-alerts-prio-normal-watch{margin:0 0 8px;font-size:12px;line-height:1.45;color:var(--text2);font-weight:500;max-width:56ch}
.dashboard-alerts-prio-normal-watch-k{font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:9px;color:var(--text3);margin-right:4px}
.dashboard-alerts-prio-micro{margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.dashboard-alerts-prio-lane-head{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;margin-top:12px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;gap:10px}
.dashboard-alerts-prio-lane-head:first-of-type{margin-top:4px}
.dashboard-alerts-prio-lane-head--urgent{
  background:linear-gradient(90deg,rgba(239,91,107,.22),rgba(239,91,107,.08));
  border:1px solid rgba(248,113,113,.4);
  color:#fecaca;
  box-shadow:0 2px 12px rgba(239,91,107,.12);
}
.dashboard-alerts-prio-lane-head--watch{
  background:linear-gradient(90deg,rgba(245,158,11,.2),rgba(245,158,11,.07));
  border:1px solid rgba(251,191,36,.38);
  color:#fde68a;
  box-shadow:0 2px 12px rgba(245,158,11,.1);
}
.dashboard-alerts-prio-lane-title{flex:1;min-width:0}
.dashboard-alerts-prio-lane-count{font-variant-numeric:tabular-nums;opacity:.9;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,.2);font-size:11px;font-weight:800}
.dashboard-alerts-prio-icon{font-size:15px;line-height:1;text-align:center;opacity:.92;user-select:none}
.dashboard-alerts-prio-row{display:grid;grid-template-columns:26px 72px minmax(0,1fr) auto;gap:8px 10px;align-items:center;width:100%;padding:11px 12px;border-radius:var(--ds-radius-sm,12px);border:1px solid rgba(148,163,184,.11);background:rgba(255,255,255,.035);color:var(--text);cursor:pointer;text-align:left;transition:background .18s ease, border-color .18s ease, transform .12s ease, box-shadow .18s ease}
.dashboard-alerts-prio-row:hover{background:rgba(255,255,255,.07);border-color:rgba(20,184,166,.28);transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.dashboard-alerts-prio-row:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-alerts-prio-row--urgent{
  border-left:4px solid rgba(248,113,113,.85);
  background:linear-gradient(90deg,rgba(239,91,107,.08),rgba(255,255,255,.03));
}
.dashboard-alerts-prio-row--watch{
  border-left:4px solid rgba(251,191,36,.75);
  background:linear-gradient(90deg,rgba(245,158,11,.07),rgba(255,255,255,.025));
}
.dashboard-alerts-prio-tier{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);line-height:1.2}
.dashboard-alerts-prio-row--urgent .dashboard-alerts-prio-tier{color:rgba(248,113,113,.95)}
.dashboard-alerts-prio-row--watch .dashboard-alerts-prio-tier{color:rgba(251,191,36,.92)}
.dashboard-alerts-prio-main{display:flex;flex-direction:column;gap:3px;min-width:0}
.dashboard-alerts-prio-title{font-size:13px;font-weight:800;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
.dashboard-alerts-prio-meta{font-size:11px;color:var(--text2);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dashboard-alerts-prio-badge{flex-shrink:0;font-size:10px!important;padding:4px 9px!important;font-weight:700!important}
.dashboard-alerts-prio-more{margin:8px 0 0;font-size:11px;color:var(--text3);font-weight:600;text-align:center;padding:6px}
.dashboard-vigilance-card{padding:16px 18px;border-radius:var(--ds-radius-md,14px);border:1px solid rgba(243,179,79,.18);background:linear-gradient(145deg,rgba(243,179,79,.07),rgba(255,255,255,.025));box-shadow:0 4px 28px rgba(0,0,0,.12)}
.dashboard-vigilance-host{min-height:0}
.dashboard-vigilance-empty-block{padding:4px 0 2px}
.dashboard-vigilance-empty-lead{margin:0 0 8px;font-size:14px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-vigilance-empty-detail{margin:0;font-size:12px;line-height:1.5;color:var(--text2);max-width:58ch}
.dashboard-vigilance-rich-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.dashboard-vigilance-rich-item{margin:0;padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.04)}
.dashboard-vigilance-rich-item--trend{border-left:3px solid rgba(20,184,166,.65)}
.dashboard-vigilance-rich-item--anomaly{border-left:3px solid rgba(243,179,79,.75)}
.dashboard-vigilance-rich-item--drift{border-left:3px solid rgba(232,93,108,.55)}
.dashboard-vigilance-rich-top{display:flex;align-items:center;gap:8px;margin:0 0 8px}
.dashboard-vigilance-rich-icon{font-size:16px;line-height:1;opacity:.95}
.dashboard-vigilance-rich-variant{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.dashboard-vigilance-rich-headline{margin:0 0 6px;font-size:13px;font-weight:800;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-vigilance-rich-detail{margin:0 0 10px;font-size:12px;line-height:1.45;color:var(--text2)}
.dashboard-vigilance-rich-cta{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
.dashboard-vigilance-investigate{padding:6px 14px;border-radius:999px;border:1px solid rgba(20,184,166,.4);background:rgba(20,184,166,.12);color:var(--accent-blue);font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;transition:background .15s ease,border-color .15s ease}
.dashboard-vigilance-investigate:hover{background:rgba(20,184,166,.2);border-color:rgba(20,184,166,.55)}
.dashboard-vigilance-investigate:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-vigilance-rich-hint{font-size:11px;font-weight:600;color:var(--text3)}
.dashboard-auto-analysis-card{padding:0;border-radius:var(--ds-radius-lg,16px);border:0.5px solid rgba(20,184,166,.22);background:linear-gradient(165deg,rgba(20,184,166,.07),rgba(255,255,255,.02));box-shadow:none;overflow:hidden}
.dashboard-auto-analysis-strip{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 16px 11px;border-bottom:0.5px solid rgba(148,163,184,.12);background:rgba(20,184,166,.05)}
.dashboard-auto-analysis-strip-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-blue);background:rgba(20,184,166,.12);border:0.5px solid rgba(20,184,166,.28)}
.dashboard-auto-analysis-strip-badge--idle{color:var(--text3);background:rgba(148,163,184,.1);border-color:rgba(148,163,184,.22)}
.dashboard-auto-analysis-strip-text{margin:0;flex:1;min-width:min(100%,160px);font-size:11px;line-height:1.35;font-weight:700;color:var(--text2)}
.dashboard-auto-analysis-host{min-height:0;padding:12px 16px 14px}
.dashboard-auto-analysis-empty-block{display:flex;gap:12px;align-items:center;padding:4px 0 2px}
.dashboard-auto-analysis-empty-icon{flex-shrink:0;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(63,185,80,.12);border:0.5px solid rgba(63,185,80,.32)}
.dashboard-auto-analysis-empty-check{font-size:18px;line-height:1;color:rgba(63,185,80,.95);font-weight:700}
.dashboard-auto-analysis-empty-copy{flex:1;min-width:0}
.dashboard-auto-analysis-empty-lead{margin:0;font-size:13px;font-weight:700;line-height:1.35;color:var(--text);letter-spacing:-.02em}
.dashboard-auto-analysis-empty-detail{margin:0;font-size:12px;line-height:1.45;color:var(--text2);max-width:48ch}
.dashboard-auto-analysis-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.dashboard-auto-analysis-item{margin:0;padding:0;border-radius:14px;border:0.5px solid rgba(148,163,184,.14);overflow:hidden;display:block;box-shadow:0 1px 0 rgba(255,255,255,.04) inset}
.dashboard-auto-analysis-item--accent-actions{border-left:4px solid var(--color-warning-border, rgba(245,158,11,.95));background:linear-gradient(105deg,color-mix(in srgb,var(--color-warning-bg) 95%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item--accent-incidents{border-left:4px solid var(--color-danger-border, rgba(239,68,68,.95));background:linear-gradient(105deg,color-mix(in srgb,var(--color-danger-bg) 95%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item--accent-compliance{border-left:4px solid var(--color-primary-border, rgba(20,184,166,.9));background:linear-gradient(105deg,color-mix(in srgb,var(--color-primary-bg) 88%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item--accent-calm{border-left:4px solid var(--color-success-border, rgba(34,197,94,.9));background:linear-gradient(105deg,color-mix(in srgb,var(--color-success-bg) 90%,transparent),rgba(255,255,255,.02) 42%)}
.dashboard-auto-analysis-item-body{min-width:0;padding:12px 14px 13px;display:flex;flex-direction:column;gap:0}
.dashboard-auto-analysis-field{margin:0 0 12px}
.dashboard-auto-analysis-field:last-of-type{margin-bottom:10px}
.dashboard-auto-analysis-field-lbl{display:block;margin:0 0 5px;font-size:9px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--text3)}
.dashboard-auto-analysis-msg{margin:0;font-size:14px;font-weight:600;line-height:1.45;color:var(--text);letter-spacing:-.015em}
.dashboard-auto-analysis-msg--title{font-size:14px;font-weight:800;letter-spacing:-.025em;line-height:1.22;margin:0 0 4px}
.dashboard-auto-analysis-rec{margin:0;font-size:13px;line-height:1.55;color:var(--text2);font-weight:400}
.dashboard-auto-analysis-rec--key{font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text);line-height:1.35;margin:0 0 2px;max-width:100%}
.dashboard-auto-analysis-item-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;padding-top:10px;border-top:0.5px solid rgba(148,163,184,.1);align-items:center}
.dashboard-auto-analysis-act{padding:7px 14px;border-radius:999px;border:0.5px solid rgba(148,163,184,.2);background:rgba(255,255,255,.05);color:var(--text);font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s ease,border-color .15s ease,transform .12s ease}
@media (prefers-reduced-motion:no-preference){.dashboard-auto-analysis-act:hover{transform:translateY(-1px)}}
.dashboard-auto-analysis-act:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus)}
.dashboard-auto-analysis-act--see{border-color:rgba(20,184,166,.42);color:var(--accent-blue);background:rgba(20,184,166,.1)}
.dashboard-auto-analysis-act--see:hover{background:rgba(20,184,166,.16);border-color:rgba(20,184,166,.5)}
.dashboard-auto-analysis-act--apply{border-color:rgba(66,199,140,.38);color:#4ade80;background:rgba(66,199,140,.1)}
.dashboard-auto-analysis-act--apply:hover{background:rgba(66,199,140,.16);border-color:rgba(66,199,140,.48)}
.dashboard-block-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(148,163,184,.1)}
.dashboard-block-actions--hero{margin-top:0;padding-top:0;border-top:none;align-items:center}
.dashboard-block-actions--tight{margin-top:8px;padding-top:8px}
.dashboard-block-actions-sep{color:var(--text3);font-size:12px;font-weight:600;user-select:none}
.dashboard-block-link{
  padding:7px 14px;
  border-radius:10px;
  border:1px solid var(--color-border-tertiary, rgba(148,163,184,.18));
  background:var(--color-background-secondary, rgba(255,255,255,.06));
  color:var(--accent-blue);
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  text-decoration:none;
  font-family:inherit;
  transition:background .18s ease,border-color .18s ease,box-shadow .18s ease;
  box-shadow:0 2px 8px rgba(0,0,0,.08);
}
.dashboard-block-link:hover{
  opacity:1;
  background:var(--color-background-info, rgba(20,184,166,.12));
  border-color:var(--color-border-info, rgba(20,184,166,.38));
  box-shadow:0 4px 16px rgba(20,184,166,.15);
}
.dashboard-block-link:focus-visible{outline:none;box-shadow:var(--ds-shadow-focus);border-radius:8px}
.dashboard-alerts-prio-footer{margin-top:6px;padding-top:8px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-alerts-prio-footer .dashboard-block-actions{margin-top:0;padding-top:0;border-top:none}
.dashboard-vigilance-actions,.dashboard-auto-analysis-actions{margin-top:10px;padding-top:10px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-vigilance-actions .dashboard-block-actions,.dashboard-auto-analysis-actions .dashboard-block-actions{margin-top:0;padding-top:0;border-top:none}
.dashboard-kpi-foot{margin-top:2px;padding:0 2px 4px}
.dashboard-kpi-foot .dashboard-block-actions{margin-top:8px;padding-top:10px;border-top:1px dashed rgba(148,163,184,.14)}
.dashboard-chart-card-footacts{padding:0 18px 14px;margin-top:-2px}
.dashboard-chart-card-footacts .dashboard-block-actions{margin-top:0;padding-top:8px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-sys-status__actions{margin-top:4px;padding-top:8px;border-top:1px solid rgba(148,163,184,.08)}
.dashboard-sys-status__actions .dashboard-block-actions{margin-top:0;padding-top:0;border-top:none}
.dashboard-activity-col-ctas{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.dashboard-activity-global-ctas{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:center;align-items:center}
.dashboard-sys-status{display:grid;grid-template-columns:4px minmax(0,1fr);gap:0;padding:0;overflow:hidden;border-radius:var(--ds-radius-md,14px);min-height:0}
.dashboard-sys-status__strip{border-radius:3px 0 0 3px;min-height:88px;align-self:stretch}
.dashboard-sys-status__strip--stable{background:linear-gradient(180deg,rgba(66,199,140,.85),rgba(52,163,110,.45))}
.dashboard-sys-status__strip--watch{background:linear-gradient(180deg,rgba(243,179,79,.9),rgba(217,119,6,.5))}
.dashboard-sys-status__strip--fix{background:linear-gradient(180deg,rgba(239,91,107,.9),rgba(220,38,38,.55))}
.dashboard-sys-status__body{padding:12px 16px 14px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}
.dashboard-sys-status__headline{margin:0;font-size:15px;font-weight:800;letter-spacing:-.02em;line-height:1.25;color:var(--text)}
.dashboard-sys-status__hint{margin:0;font-size:12px;line-height:1.35;color:var(--text2);font-weight:500;max-width:52ch}
.dashboard-sys-status__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 14px;margin-top:4px}
.dashboard-sys-status__cell{display:flex;flex-direction:column;gap:3px;padding:8px 10px;border-radius:var(--ds-radius-sm,10px);background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.08);min-width:0}
.dashboard-sys-status__label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);line-height:1.2}
.dashboard-sys-status__value{font-size:14px;font-weight:800;color:var(--text);line-height:1.25;font-variant-numeric:tabular-nums}
.dashboard-sys-status--stable .dashboard-sys-status__body{background:linear-gradient(135deg,rgba(66,199,140,.06),transparent)}
.dashboard-sys-status--watch .dashboard-sys-status__body{background:linear-gradient(135deg,rgba(243,179,79,.07),transparent)}
.dashboard-sys-status--fix .dashboard-sys-status__body{background:linear-gradient(135deg,rgba(239,91,107,.07),transparent)}
@media (max-width:900px){.dashboard-sys-status__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:600px){.dashboard-cockpit{padding:18px 16px}.dashboard-cockpit__minis{grid-template-columns:repeat(2,1fr)}.dashboard-cockpit__bar-row{grid-template-columns:minmax(96px,1fr) minmax(0,1.6fr) 40px;gap:10px}.dashboard-shortcuts__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-alerts-prio-tier-strip{grid-template-columns:1fr}.dashboard-alerts-prio-row{grid-template-columns:24px 1fr auto;grid-template-areas:"icon tier badge" "icon main main"}.dashboard-alerts-prio-icon{grid-area:icon;align-self:start;padding-top:2px}.dashboard-alerts-prio-tier{grid-area:tier}.dashboard-alerts-prio-main{grid-area:main}.dashboard-alerts-prio-badge{grid-area:badge;justify-self:end}}
.dashboard-kpi-sticky {
  position: sticky;
  top: 0;
  z-index: 89;
  background: var(--bg, #0f172a);
  padding: 8px 0 12px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  margin-bottom: 20px;
}
.dashboard-extended[data-expanded="false"]{display:none}
.dashboard-extended[data-expanded="true"]{display:block}
.dashboard-toggle-row{
  display:flex;justify-content:center;
  padding:6px 0 2px;
}
.dashboard-toggle-btn{
  display:flex;align-items:center;gap:10px;
  max-width:min(100%,520px);
  background:none;
  border:1px solid rgba(255,255,255,.1);
  border-radius:14px;padding:10px 16px;
  color:var(--text2,rgba(255,255,255,.5));
  font-size:12px;cursor:pointer;
  transition:border-color 150ms,color 150ms;
  text-align:left;
}
.dashboard-toggle-inner{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;flex:1}
.dashboard-toggle-label{font-weight:600;color:var(--text,rgba(255,255,255,.88));font-size:13px}
.dashboard-toggle-hint{font-size:10px;line-height:1.35;opacity:.72;color:var(--text2,rgba(255,255,255,.55))}
.dashboard-toggle-btn:hover{
  border-color:rgba(255,255,255,.2);
  color:var(--text,rgba(255,255,255,.85));
}
.dashboard-toggle-btn:hover .dashboard-toggle-hint{opacity:.85}
[data-display-mode="simple"] .dashboard-toggle-row{
  display:none;
}
/* Espacement entre bandes : respiration premium */
.dashboard-band { margin-bottom: 8px; }
.dashboard-band + .dashboard-band { margin-top: 4px; }
.dashboard-band--ceo { margin-bottom: 0; }
.dashboard-band--priority { margin-top: 0; }

/* Réduction opacité des éléments secondaires */
.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  opacity: .55;
}
.dashboard-section-sub {
  font-size: 13px;
  opacity: .6;
  max-width: 52ch;
}

/* Titres de section plus tranchés */
.dashboard-section-title {
  font-size: clamp(18px, 1.8vw, 24px);
  font-weight: 800;
  letter-spacing: -.025em;
  line-height: 1.15;
}

/* CEO Hero : le rendre dominant */
.dashboard-ceo-hero__scorenum {
  font-size: clamp(56px, 6vw, 80px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.04em;
}

/* Convention couleur sémantique stricte */
.dashboard-band--priority .dashboard-section-kicker,
.section-kicker--alert { color: rgba(239,91,107,.9); }

.dashboard-band--cockpit .dashboard-section-kicker,
.section-kicker--info { color: rgba(20,184,166,.9); }

.dashboard-band--analysis .dashboard-section-kicker,
.section-kicker--analysis { color: rgba(148,103,254,.9); }

/* Suppression des bordures parasites sur les cartes secondaires */
.dashboard-band--tertiary .content-card {
  border-color: rgba(255,255,255,.05);
}

/* Démo : CEO hero dominant (fin de feuille, surcharge) */
.dashboard-ceo-hero__scorenum,
.dashboard-ceo-hero__score-num,
.dashboard-score-value {
  font-size: clamp(64px, 7vw, 88px) !important;
  font-weight: 900 !important;
  letter-spacing: -.04em !important;
  line-height: 1 !important;
}
.dashboard-ceo-hero {
  min-height: 220px;
}
.dashboard-section-title {
  font-size: clamp(19px, 1.9vw, 26px);
  font-weight: 800;
  letter-spacing: -.025em;
  line-height: 1.15;
}
.section-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  opacity: 0.82;
}
.dashboard-section-sub,
.dashboard-muted-lead,
.content-card-lead {
  font-size: 13px;
  line-height: 1.55;
  opacity: .65;
  max-width: 58ch;
}
.dashboard-band + .dashboard-band {
  margin-top: 6px;
}
.dashboard-band--ceo {
  margin-bottom: 2px;
}

/* ── Convention sémantique stricte ──────────────── */
/* Rouge = action requise / urgent                   */
.dashboard-band--priority .section-kicker,
.dashboard-band--alerts .section-kicker,
.dashboard-section-kicker--alert {
  color: rgba(239, 91, 107, .85);
  opacity: 1;
}

/* Teal = information / pilotage                     */
.dashboard-band--cockpit .section-kicker,
.dashboard-band--ceo .section-kicker,
.dashboard-section-kicker--info {
  color: rgba(20, 184, 166, .85);
  opacity: 1;
}

/* Teal clair = analyse / IA (aligné marque)         */
.dashboard-band--analysis .section-kicker,
.dashboard-band--secondary .section-kicker,
.dashboard-section-kicker--analysis {
  color: rgba(94, 234, 212, .88);
  opacity: 1;
}

/* Vert = situation normale / activité               */
.dashboard-band--situation .section-kicker,
.dashboard-band--tertiary .section-kicker,
.dashboard-section-kicker--ok {
  color: rgba(52, 211, 153, .85);
  opacity: 1;
}

/* ── Cartes secondaires plus légères ────────────── */
.dashboard-band--tertiary .content-card {
  border-color: rgba(255, 255, 255, .04);
  background: rgba(255, 255, 255, .015);
}

/* ── Metric cards : valeurs plus lisibles ───────── */
.metric-value {
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 800;
  letter-spacing: -.03em;
  line-height: 1.1;
}
.metric-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  opacity: 0.88;
}
.metric-note {
  font-size: 12px;
  opacity: 0.82;
  line-height: 1.4;
}

/* Bandes dashboard : visibles (éviter display:none, masquait KPI, synthèse, alertes). */

.dashboard-ceo-hero__legal-wrap {
  display: none !important;
}

.shortcut-live-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 20px;
  background: rgba(239, 91, 107, 0.15);
  color: rgba(239, 91, 107, 0.9);
  margin-left: 6px;
  flex-shrink: 0;
}

.activity-row {
  display: block;
  padding: 0;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(148, 163, 184, 0.11);
  box-sizing: border-box;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.activity-row--sev-crit {
  border-left: 3px solid rgba(220, 38, 38, 0.7);
}
.activity-row--sev-warn {
  border-left: 3px solid rgba(245, 158, 11, 0.55);
}
.activity-row--action-late {
  border-left: 3px solid rgba(245, 158, 11, 0.5);
}
.activity-row:hover {
  background: rgba(20, 184, 166, 0.07);
  border-color: rgba(20, 184, 166, 0.22);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
}
.activity-row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.38);
}
.activity-row__inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px 12px;
  align-items: start;
  padding: 12px 14px;
}
.activity-row__type {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(20, 184, 166, 0.14);
  color: rgba(167, 243, 208, 0.95);
  flex-shrink: 0;
  min-width: 4.25rem;
  text-align: center;
  line-height: 1.2;
}
.activity-row__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.activity-row__title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.35;
  color: rgba(241, 245, 249, 0.94);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.activity-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  font-size: 11px;
  line-height: 1.35;
}
.activity-row__status {
  color: rgba(148, 163, 184, 0.78);
  flex: 1 1 12rem;
  min-width: 0;
  font-weight: 500;
}
.activity-row--sev-crit .activity-row__status {
  color: rgba(252, 165, 165, 0.95);
  font-weight: 600;
}
.activity-row--sev-warn .activity-row__status {
  color: rgba(253, 224, 71, 0.88);
  font-weight: 600;
}
.activity-row--action-late .activity-row__status {
  color: rgba(251, 191, 36, 0.9);
  font-weight: 600;
}
.activity-row__date {
  color: rgba(148, 163, 184, 0.52);
  flex-shrink: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.activity-row__date::before {
  content: '·';
  margin-right: 6px;
  color: rgba(148, 163, 184, 0.28);
  font-weight: 700;
}
.activity-row__link {
  font-size: 14px;
  line-height: 1;
  color: rgba(45, 212, 191, 0.55);
  padding-top: 3px;
  transition: color 0.15s ease;
}
.activity-row:hover .activity-row__link {
  color: rgba(45, 212, 191, 0.95);
}

/* Analytics / Synthèse cockpit */
.page-stack.analytics-cockpit-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  --page-stack-pad-bottom: 1.5rem;
}
.analytics-page-hero__top {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px 24px;
  align-items: start;
}
.analytics-page-hero__copy {
  min-width: 0;
}
.analytics-page-kicker {
  margin: 0 0 6px;
}
.analytics-page-title {
  margin: 0;
  font-size: var(--type-page-title-size, clamp(1.6rem, 3vw, 2.05rem));
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.18;
  color: var(--text);
}
.analytics-page-lead {
  margin: 10px 0 0;
  max-width: min(68ch, 100%);
  font-size: 14px;
  line-height: 1.6;
  font-weight: 500;
  color: var(--text2);
}
.analytics-page-meta {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text3);
  text-align: right;
  max-width: 28ch;
  line-height: 1.35;
  padding-top: 2px;
}
@media (max-width: 720px) {
  .analytics-page-hero__top {
    grid-template-columns: 1fr;
  }
  .analytics-page-meta {
    text-align: left;
    max-width: none;
    padding-top: 0;
  }
}
.analytics-content-host {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.analytics-cockpit-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.analytics-cockpit-stack > * {
  min-width: 0;
}
.analytics-main-split {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.95fr);
  gap: 12px;
  align-items: start;
  min-width: 0;
}
.analytics-main-trend-col {
  min-width: 0;
}
.analytics-aside-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.analytics-chart-card--aside .content-card-head {
  padding-bottom: 6px;
}
.analytics-chart-card--aside .content-card-head h3 {
  font-size: clamp(14px, 1.25vw, 16px);
}
.analytics-decision-panel--stacked {
  padding: 12px 14px;
}
.analytics-key-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.analytics-key-bars-row {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 2.2fr) auto;
  gap: 10px 12px;
  align-items: center;
  font-size: 12px;
}
.analytics-key-bars-label {
  color: var(--text2);
  font-weight: 600;
  line-height: 1.3;
}
.analytics-key-bars-track {
  height: 10px;
  border-radius: 999px;
  background: var(--color-background-tertiary, rgba(148, 163, 184, 0.12));
  border: 1px solid var(--color-border-tertiary, rgba(148, 163, 184, 0.1));
  overflow: hidden;
  min-width: 0;
}
.analytics-key-bars-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 3px;
  transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.analytics-key-bars-row--inc .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(234, 88, 12, 0.88), rgba(251, 113, 133, 0.55));
}
.analytics-key-bars-row--nc .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.88), rgba(99, 102, 241, 0.52));
}
.analytics-key-bars-row--late .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(217, 119, 6, 0.9), rgba(245, 158, 11, 0.62));
}
.analytics-key-bars-row--aud .analytics-key-bars-fill {
  background: linear-gradient(90deg, rgba(13, 148, 136, 0.85), rgba(45, 212, 191, 0.5));
}
.analytics-key-bars-val {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  font-size: 13px;
  min-width: 2ch;
  text-align: right;
}
.dashboard-pilot-load--compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dashboard-pilot-load--compact .dashboard-mix-bar--pilot-compact {
  height: 20px;
  border-radius: 10px;
}
.dashboard-mix-legend--pilot-compact {
  margin-top: 0;
  gap: 4px 10px;
  font-size: 10px;
}
.kpi-multi-line-target {
  stroke: rgba(245, 158, 11, 0.42);
  stroke-width: 1;
  fill: none;
}
.kpi-multi-line-vgrid {
  stroke: rgba(148, 163, 184, 0.1);
  stroke-width: 1;
}
.kpi-multi-line-crosshair {
  stroke-linecap: round;
}
.analytics-chart-interact-hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--text3);
  opacity: 0.88;
}
.analytics-decision-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.analytics-alert-chip--neutral {
  border-left-color: rgba(100, 116, 139, 0.55);
  background: rgba(148, 163, 184, 0.06);
  color: var(--text2);
  font-weight: 600;
}
.analytics-loading-line {
  margin: 0;
  font-size: 14px;
  color: var(--text2);
}
.analytics-periodic-card {
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}
.analytics-periodic-lead {
  margin-top: 6px !important;
  font-size: 12px !important;
  line-height: 1.45 !important;
}
.analytics-periodic-form {
  gap: 10px !important;
  align-items: flex-end !important;
}
.analytics-cockpit-header {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.analytics-cockpit-stat-hint {
  margin-top: 6px;
  font-size: 10px;
  line-height: 1.3;
  font-weight: 600;
  color: var(--text3);
}
.analytics-chart-card--main {
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.07);
}
.analytics-secondary-band {
  margin: 0;
}
.analytics-quad-ai {
  margin-top: 14px;
  padding: 14px 16px 16px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(45, 212, 191, 0.28);
  /* Fond toujours sombre : ne pas réutiliser --text* du thème clair (illisible). */
  --aq-ai-title: #f8fafc;
  --aq-ai-body: #e2e8f0;
  --aq-ai-meta: #cbd5e1;
  background: linear-gradient(
    145deg,
    rgb(30, 41, 59) 0%,
    rgb(15, 23, 42) 48%,
    rgb(23, 33, 48) 100%
  );
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.analytics-quad-ai__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  margin-bottom: 10px;
}
.analytics-quad-ai__kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(94, 234, 212);
  text-shadow: 0 0 20px rgba(45, 212, 191, 0.25);
}
.analytics-quad-ai__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--aq-ai-title);
  letter-spacing: -0.02em;
}
.analytics-quad-ai__badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.28);
  color: #ede9fe;
  border: 1px solid rgba(167, 139, 250, 0.45);
}
.analytics-quad-ai__body {
  min-width: 0;
}
.analytics-quad-ai__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 500;
  color: var(--aq-ai-body);
  letter-spacing: 0.01em;
}
.analytics-quad-ai__meta {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--aq-ai-meta);
  opacity: 1;
  border-top: 1px solid rgba(148, 163, 184, 0.22);
  padding-top: 10px;
}
.analytics-secondary-grid {
  gap: 10px;
}
.analytics-charts-grid.analytics-secondary-grid--quad {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.analytics-chart-card--cell {
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.analytics-chart-card--cell .content-card-head {
  flex-shrink: 0;
}
.analytics-chart-card--cell > *:last-child {
  flex: 1;
  min-height: 0;
}
.analytics-chart-card--main .kpi-multi-line-wrap {
  margin-top: 2px;
}
.kpi-multi-line-wrap--analytics .dashboard-line-chart-grid--base {
  stroke: rgba(148, 163, 184, 0.08);
  stroke-width: 1;
}
.kpi-multi-line-svg--analytics {
  filter: none;
  max-height: 228px;
  cursor: crosshair;
}
.analytics-chart-card--main .kpi-multi-line-labels {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.92;
}
.analytics-chart-card--main .kpi-multi-line-legend {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 600;
  gap: 8px 14px;
}
.analytics-chart-card--main .dashboard-chart-interpret {
  margin-top: 12px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--text2);
  border-radius: 10px;
  border: 1px solid rgba(20, 184, 166, 0.2);
  background: rgba(20, 184, 166, 0.06);
  border-left: 3px solid rgba(20, 184, 166, 0.45);
}
.analytics-decision-panel {
  display: block;
  padding: 12px 14px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(255, 255, 255, 0.02);
  box-shadow: 0 2px 18px rgba(0, 0, 0, 0.06);
}
.analytics-synthesis p {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--text);
}
.analytics-synthesis p:last-child {
  margin-bottom: 0;
}
.analytics-alerts-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.analytics-alert-chip {
  padding: 8px 11px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--text2);
  background: rgba(255, 255, 255, 0.04);
  border-left: 3px solid rgba(148, 163, 184, 0.4);
}
.analytics-alert-chip--critical {
  border-left-color: rgba(220, 38, 38, 0.85);
  background: rgba(239, 68, 68, 0.07);
  color: var(--text);
}
.analytics-alert-chip--high {
  border-left-color: rgba(245, 158, 11, 0.88);
  background: rgba(245, 158, 11, 0.08);
}
.analytics-alert-chip--info {
  border-left-color: rgba(20, 184, 166, 0.55);
  background: rgba(20, 184, 166, 0.06);
}
.analytics-cockpit-stat {
  padding: 12px 14px;
  border-radius: var(--ds-radius-lg, 14px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: linear-gradient(
    165deg,
    rgba(20, 184, 166, 0.05) 0%,
    rgba(18, 24, 30, 0.38) 55%,
    rgba(12, 16, 22, 0.22) 100%
  );
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.08);
}
.analytics-cockpit-stat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 4px;
}
.analytics-cockpit-stat-value {
  font-size: clamp(20px, 2.8vw, 26px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.analytics-meta-line {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 0.02em;
}
.analytics-insights {
  margin: 0;
  padding: 16px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(255, 255, 255, 0.025);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}
.analytics-insights-empty {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text2);
  font-weight: 500;
}
.analytics-insights-kicker {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text3);
  margin-bottom: 12px;
}
.analytics-insight-line {
  margin: 0 0 8px;
  padding: 10px 12px 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  border-left: 2px solid rgba(148, 163, 184, 0.35);
}
.analytics-insight-line--critical {
  border-left-color: rgba(220, 38, 38, 0.85);
  background: rgba(239, 68, 68, 0.06);
}
.analytics-insight-line--high {
  border-left-color: rgba(245, 158, 11, 0.88);
  background: rgba(245, 158, 11, 0.06);
}
.analytics-insight-line--info {
  border-left-color: rgba(20, 184, 166, 0.65);
  background: rgba(20, 184, 166, 0.06);
}
.analytics-insights-more {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text3);
}
.analytics-insights-more summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text2);
}
.analytics-charts-band {
  margin: 0;
  min-width: 0;
}
.analytics-charts-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.analytics-chart-card .content-card-head {
  padding-bottom: 6px;
}
.analytics-chart-card .content-card-head h3 {
  font-size: clamp(15px, 1.4vw, 17px);
}
.analytics-chart-card .dashboard-line-chart-wrap,
.analytics-chart-card .dashboard-mix-chart-wrap {
  margin-top: 4px;
}
.dashboard-line-chart-wrap--analytics .dashboard-line-chart-svg {
  filter: drop-shadow(0 1px 5px rgba(20, 184, 166, 0.06));
}
.dashboard-line-chart-wrap--analytics .dashboard-line-chart-grid--base {
  stroke: rgba(148, 163, 184, 0.07);
  stroke-width: 1;
}
.analytics-chart-card .dashboard-line-chart-values {
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
  padding-top: 2px;
}
.analytics-chart-card .dashboard-line-chart-labels {
  font-size: 9px;
  font-weight: 600;
  color: var(--text3);
  opacity: 0.9;
}
.analytics-chart-card .dashboard-line-chart-labels span {
  max-width: 3.5rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.analytics-chart-card .dashboard-mix-bar {
  height: 14px;
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(148, 163, 184, 0.09);
}
.analytics-chart-card .dashboard-mix-legend {
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
}
.analytics-chart-card .dashboard-chart-interpret {
  display: block;
  margin-top: 10px;
  margin-bottom: 0;
  padding: 8px 11px 8px 12px;
  font-size: 11px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--text2);
  border-left: 2px solid rgba(20, 184, 166, 0.4);
  background: rgba(20, 184, 166, 0.06);
  border-radius: 0 8px 8px 0;
  border-top: none;
  border-right: none;
  border-bottom: none;
}
.analytics-chart-card .dashboard-chart-interpret:empty {
  display: none;
}
.analytics-chart-card .dashboard-chart-foot:empty,
.analytics-chart-card .dashboard-mix-foot:empty {
  display: none;
  margin: 0;
  min-height: 0;
}
.analytics-list-overflow {
  margin: 8px 0 0;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(148, 163, 184, 0.14);
}
.analytics-critical-col-scroll {
  max-height: min(52vh, 320px);
  overflow-y: auto;
  padding-right: 4px;
  min-height: 0;
}
.analytics-critical-col-scroll .stack {
  gap: 8px;
}
.analytics-critical-cockpit .analytics-critical-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}
.analytics-critical-col-title {
  margin: 0 0 10px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(20, 184, 166, 0.82);
}
.analytics-critical-cockpit .stack {
  gap: 6px;
}
.analytics-critical-cockpit {
  margin-top: 0;
}
.analytics-extended-details {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--ds-radius-lg, 14px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.02);
}
.analytics-extended-details summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: var(--text2);
  letter-spacing: -0.01em;
}
.analytics-extended-details summary:hover {
  color: var(--text);
}
.analytics-extended-details-inner {
  margin-top: 10px;
  gap: 10px !important;
}
.analytics-extended-details-inner .dashboard-kpi-grid {
  gap: 10px !important;
}

/* Analyses & synthèse : blocs et sous-lignes lisibles (surtout mode clair) */
.analytics-stack-section.content-card.card-soft {
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
}
html[data-theme='light'] .analytics-stack-section.content-card.card-soft {
  border: 1px solid rgba(100, 116, 139, 0.22);
  background: var(--surface-elevated, #ffffff);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 4px 14px rgba(15, 23, 42, 0.06);
}
html[data-theme='light'] .analytics-extended-details {
  border-color: rgba(100, 116, 139, 0.2);
  background: rgba(248, 250, 252, 0.65);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
html[data-theme='light'] .analytics-critical-cockpit.content-card.card-soft {
  border: 1px solid rgba(100, 116, 139, 0.22);
  background: var(--surface-elevated, #ffffff);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.05),
    0 6px 20px rgba(15, 23, 42, 0.07);
}
html[data-theme='light'] .analytics-critical-grid {
  gap: 14px;
  padding-top: 4px;
}
html[data-theme='light'] .analytics-critical-col {
  padding: 12px 12px 14px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.92) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
html[data-theme='light'] .analytics-critical-cockpit .stack .list-row,
.analytics-critical-cockpit .stack .list-row {
  border-color: rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
}
html[data-theme='light'] .analytics-critical-cockpit .stack .list-row--interactive:hover {
  border-color: rgba(20, 184, 166, 0.38);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}
html[data-theme='light'] .analytics-extended-details-inner .list-row {
  border-color: rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.85);
}
html[data-theme='light'] .analytics-extended-details-inner .list-row--interactive:hover {
  border-color: rgba(20, 184, 166, 0.4);
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.07);
}
.analytics-stack-section .stack .list-row--interactive:hover,
.analytics-critical-cockpit .list-row--interactive:hover {
  border-color: rgba(20, 184, 166, 0.35);
  background: rgba(255, 255, 255, 0.06);
}
.analytics-stack-section .list-row--interactive:hover .list-row__chevron,
.analytics-critical-cockpit .list-row--interactive:hover .list-row__chevron {
  color: rgb(13, 148, 136);
  opacity: 1;
}
.analytics-periodic-wrap {
  margin-top: 0;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}
.analytics-automation-card {
  margin-top: 8px;
}
@media (max-width: 1100px) {
  .analytics-cockpit-header {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analytics-decision-panel {
    grid-template-columns: 1fr;
  }
  .analytics-secondary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 960px) {
  .analytics-cockpit-header {
    grid-template-columns: 1fr;
  }
  .analytics-main-split {
    grid-template-columns: 1fr;
  }
  .analytics-charts-grid {
    grid-template-columns: 1fr;
  }
  .analytics-critical-cockpit .analytics-critical-grid {
    grid-template-columns: 1fr;
  }
}

/* Performance QHSE (KPI) */
.kpi-performance-page {
  gap: 28px;
}
.kpi-perf-cockpit-premium {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kpi-perf-primary-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: stretch;
}
.kpi-perf-primary-cta-btn {
  flex: 1 1 160px;
  min-height: 46px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.65);
  color: var(--text2);
  transition:
    transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1),
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}
.kpi-perf-primary-cta-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.35);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.14);
}
.kpi-perf-primary-cta-btn:active {
  transform: translateY(0);
  transition-duration: 0.08s;
}
.kpi-perf-primary-cta-btn:focus-visible {
  outline: 2px solid rgba(45, 212, 191, 0.45);
  outline-offset: 2px;
}
.kpi-perf-primary-cta-btn--incident {
  border-color: rgba(251, 146, 60, 0.35);
  background: linear-gradient(165deg, rgba(251, 146, 60, 0.1), rgba(15, 23, 42, 0.5));
}
.kpi-perf-primary-cta-btn--urgent {
  border-color: rgba(239, 91, 107, 0.38);
  background: linear-gradient(165deg, rgba(239, 91, 107, 0.1), rgba(15, 23, 42, 0.55));
}
.kpi-perf-primary-cta-btn--plan {
  border-color: rgba(99, 102, 241, 0.32);
  background: linear-gradient(165deg, rgba(99, 102, 241, 0.08), rgba(15, 23, 42, 0.55));
}
.kpi-perf-freshness {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 4px 2px 0;
  font-size: 10px;
  font-weight: 600;
  color: var(--text3);
  opacity: 0.88;
}
.kpi-perf-freshness-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(52, 211, 153);
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.18);
  animation: kpiPerfFreshPulse 2.4s ease-in-out infinite;
}
@keyframes kpiPerfFreshPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(0.92);
  }
}
@media (prefers-reduced-motion: reduce) {
  .kpi-perf-freshness-dot {
    animation: none;
  }
}
.kpi-perf-freshness-time {
  font-variant-numeric: tabular-nums;
  color: var(--text2);
  font-weight: 600;
}
.kpi-perf-priority-absolute {
  padding: 16px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(
    125deg,
    rgba(30, 41, 59, 0.55) 0%,
    rgba(15, 23, 42, 0.75) 100%
  );
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.14);
  transition: box-shadow 0.22s ease, border-color 0.22s ease;
}
.kpi-perf-priority-absolute:hover {
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.16);
}
.kpi-perf-priority-absolute-k {
  display: block;
  margin-bottom: 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-priority-absolute-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 18px;
}
.kpi-perf-priority-absolute-msg {
  margin: 0;
  flex: 1 1 220px;
  font-size: clamp(16px, 1.9vw, 18px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.4;
  color: var(--text1);
  max-width: 56ch;
}
.kpi-perf-priority-absolute-cta {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.03em;
  cursor: pointer;
  border: 1px solid rgba(45, 212, 191, 0.35);
  background: rgba(45, 212, 191, 0.12);
  color: rgb(204, 251, 241);
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease;
}
.kpi-perf-priority-absolute-cta:hover {
  transform: translateY(-1px);
  background: rgba(45, 212, 191, 0.18);
  border-color: rgba(45, 212, 191, 0.5);
}
.kpi-perf-priority-absolute-cta:active {
  transform: translateY(0);
}
.kpi-perf-priority-absolute-cta:focus-visible {
  outline: 2px solid rgba(45, 212, 191, 0.5);
  outline-offset: 2px;
}
.kpi-perf-priority-absolute--red {
  border-color: rgba(239, 91, 107, 0.28);
  background: linear-gradient(
    125deg,
    rgba(127, 29, 29, 0.2) 0%,
    rgba(15, 23, 42, 0.8) 55%
  );
}
.kpi-perf-priority-absolute--amber {
  border-color: rgba(245, 158, 11, 0.28);
  background: linear-gradient(
    125deg,
    rgba(120, 53, 15, 0.18) 0%,
    rgba(15, 23, 42, 0.78) 55%
  );
}
.kpi-perf-priority-absolute--green {
  border-color: rgba(52, 211, 153, 0.22);
  background: linear-gradient(
    125deg,
    rgba(6, 78, 59, 0.2) 0%,
    rgba(15, 23, 42, 0.75) 55%
  );
}
.kpi-perf-analyses-stack {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-top: 8px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  margin-top: 4px;
}
.kpi-perf-reco-band {
  padding: 14px 16px 16px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: linear-gradient(
    160deg,
    rgba(30, 41, 59, 0.5) 0%,
    rgba(15, 23, 42, 0.65) 100%
  );
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}
.kpi-perf-reco-band--assistant {
  border-color: rgba(99, 102, 241, 0.18);
  background: linear-gradient(
    160deg,
    rgba(49, 46, 129, 0.22) 0%,
    rgba(15, 23, 42, 0.68) 100%
  );
}
.kpi-perf-reco-band--assistant .kpi-perf-reco-band-k {
  color: rgb(165, 180, 252);
}
.kpi-perf-reco-band-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 14px;
  margin-bottom: 12px;
}
.kpi-perf-reco-band-k {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(45, 212, 191);
}
.kpi-perf-reco-band-sub {
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  opacity: 0.9;
}
.kpi-perf-reco-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.kpi-perf-reco-grid--assistant {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.kpi-perf-reco-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.45);
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}
.kpi-perf-reco-card:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.22);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
.kpi-perf-reco-card--action {
  width: 100%;
  margin: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.kpi-perf-reco-card--action:active {
  transform: translateY(0);
  transition-duration: 0.08s;
}
.kpi-perf-reco-card--action:focus-visible {
  outline: 2px solid rgba(45, 212, 191, 0.45);
  outline-offset: 2px;
}
.kpi-perf-reco-card--red {
  border-color: rgba(239, 91, 107, 0.22);
  background: rgba(239, 91, 107, 0.06);
}
.kpi-perf-reco-card--amber {
  border-color: rgba(245, 158, 11, 0.22);
  background: rgba(245, 158, 11, 0.06);
}
.kpi-perf-reco-card--green {
  border-color: rgba(52, 211, 153, 0.2);
  background: rgba(52, 211, 153, 0.05);
}
.kpi-perf-reco-ico {
  flex-shrink: 0;
  font-size: 15px;
  line-height: 1.2;
  opacity: 0.88;
}
.kpi-perf-reco-txt {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--text2);
}
.kpi-perf-global-score {
  padding: 16px 18px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(
    135deg,
    rgba(17, 24, 39, 0.92) 0%,
    rgba(30, 27, 75, 0.25) 100%
  );
  transition:
    box-shadow 0.22s cubic-bezier(0.2, 0.9, 0.2, 1),
    border-color 0.22s ease,
    transform 0.22s ease;
}
.kpi-perf-global-score--hero {
  padding: 20px 20px 22px;
}
.kpi-perf-global-hero-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 14px 20px;
  margin-top: 4px;
}
.kpi-perf-global-score-figure {
  display: inline-flex;
  align-items: flex-end;
  gap: 4px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.kpi-perf-global-score:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
.kpi-perf-global-score--critique {
  border-color: rgba(239, 91, 107, 0.35);
  box-shadow: 0 0 0 1px rgba(239, 91, 107, 0.12), 0 8px 28px rgba(239, 91, 107, 0.1);
}
.kpi-perf-global-score--fragile {
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.1), 0 6px 22px rgba(245, 158, 11, 0.08);
}
.kpi-perf-global-score--stable {
  border-color: rgba(59, 130, 246, 0.2);
}
.kpi-perf-global-score--performant {
  border-color: rgba(52, 211, 153, 0.35);
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.12), 0 6px 24px rgba(52, 211, 153, 0.1);
}
.kpi-perf-global-k {
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 8px;
}
.kpi-perf-global-val-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.kpi-perf-global-num {
  font-size: clamp(44px, 7vw, 72px);
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 1;
  color: var(--text1);
  font-variant-numeric: tabular-nums;
}
.kpi-perf-global-slash {
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 700;
  color: var(--text3);
  opacity: 0.72;
  align-self: flex-end;
  padding-bottom: 0.2em;
  letter-spacing: -0.01em;
}
.kpi-perf-global-pill {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
}
.kpi-perf-global-pill--critique {
  color: rgb(254, 202, 202);
  border-color: rgba(239, 91, 107, 0.45);
  background: rgba(239, 91, 107, 0.15);
}
.kpi-perf-global-pill--fragile {
  color: rgb(254, 243, 199);
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.12);
}
.kpi-perf-global-pill--stable {
  color: rgb(191, 219, 254);
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.1);
}
.kpi-perf-global-pill--performant {
  color: rgb(167, 243, 208);
  border-color: rgba(52, 211, 153, 0.45);
  background: rgba(52, 211, 153, 0.12);
}
.kpi-perf-global-risk {
  margin: 10px 0 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-global-risk--critique {
  color: rgb(254, 202, 202);
}
.kpi-perf-global-risk--fragile {
  color: rgb(254, 243, 199);
}
.kpi-perf-global-risk--stable {
  color: rgb(191, 219, 254);
}
.kpi-perf-global-risk--performant {
  color: rgb(167, 243, 208);
}
.kpi-perf-global-interpret {
  margin: 14px 0 0;
  font-size: clamp(14px, 1.5vw, 16px);
  line-height: 1.5;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--text2);
  max-width: 44ch;
}
.kpi-perf-global-hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 500;
  color: var(--text2);
  max-width: 52ch;
  opacity: 0.95;
}
.kpi-perf-global-cta-hint {
  margin: 10px 0 0;
  font-size: 11px;
  font-weight: 600;
  color: rgb(45, 212, 191);
  opacity: 0.85;
}
.kpi-perf-global-score--interactive {
  cursor: pointer;
  outline: none;
}
.kpi-perf-global-score--interactive:hover {
  border-color: rgba(45, 212, 191, 0.28);
  transform: translateY(-1px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}
.kpi-perf-global-score--interactive:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}
.kpi-perf-global-score--interactive:focus-visible {
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.35);
}
.qhse-chart-tooltip__delta {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text2);
}
.kpi-perf-quick-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.kpi-perf-quick-btn {
  flex: 1 1 160px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.55);
  color: var(--text2);
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease,
    box-shadow 0.15s ease;
}
.kpi-perf-quick-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.35);
  background: rgba(45, 212, 191, 0.08);
}
.kpi-perf-quick-btn:active {
  transform: translateY(0);
}
.kpi-perf-quick-btn--risk {
  border-color: rgba(239, 91, 107, 0.35);
  background: rgba(239, 91, 107, 0.08);
}
.kpi-perf-quick-btn--warn {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.07);
}
.kpi-perf-quick-btn--neutral {
  border-color: rgba(148, 163, 184, 0.18);
}
.kpi-perf-urgency {
  padding: 14px 16px 16px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(45, 212, 191, 0.18);
  background: rgba(15, 23, 42, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.kpi-perf-urgency-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(45, 212, 191);
}
.kpi-perf-urgency-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kpi-perf-urgency-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 12px 14px;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 12px 14px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text2);
  transition:
    transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1),
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}
.kpi-perf-urgency-row:hover {
  transform: translateX(2px);
  border-color: rgba(45, 212, 191, 0.32);
  background: rgba(45, 212, 191, 0.07);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}
.kpi-perf-urgency-row:active {
  transform: translateX(0);
  transition-duration: 0.08s;
}
.kpi-perf-urgency-row--crit {
  border-left: 3px solid rgba(239, 91, 107, 0.75);
}
.kpi-perf-urgency-row--late {
  border-left: 3px solid rgba(245, 158, 11, 0.75);
}
.kpi-perf-urgency-row--nc {
  border-left: 3px solid rgba(167, 139, 250, 0.75);
}
.kpi-perf-urgency-prio {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: var(--text3);
  white-space: nowrap;
}
.kpi-perf-urgency-prio--crit {
  color: rgb(254, 202, 202);
  border-color: rgba(239, 91, 107, 0.35);
  background: rgba(239, 91, 107, 0.12);
}
.kpi-perf-urgency-prio--late {
  color: rgb(254, 243, 199);
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.1);
}
.kpi-perf-urgency-prio--nc {
  color: rgb(233, 213, 255);
  border-color: rgba(167, 139, 250, 0.35);
  background: rgba(124, 58, 237, 0.12);
}
.kpi-perf-urgency-mid {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.kpi-perf-urgency-lab {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text1);
  text-transform: none;
}
.kpi-perf-urgency-sub {
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
}
.kpi-perf-urgency-val {
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--text1);
  font-variant-numeric: tabular-nums;
}
.kpi-perf-urgency-chev {
  font-size: 18px;
  font-weight: 300;
  color: var(--text3);
  opacity: 0.65;
}
@media (max-width: 560px) {
  .kpi-perf-urgency-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }
  .kpi-perf-urgency-prio {
    grid-column: 1;
  }
  .kpi-perf-urgency-mid {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .kpi-perf-urgency-val {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }
  .kpi-perf-urgency-chev {
    display: none;
  }
}
.kpi-perf-timeline {
  padding: 16px 18px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(165deg, rgba(15, 23, 42, 0.42) 0%, rgba(15, 23, 42, 0.28) 100%);
  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  opacity: 1;
}
.kpi-perf-timeline-h {
  margin: 0 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.88);
}
.kpi-perf-timeline-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kpi-perf-timeline-li {
  margin: 0;
  padding: 0;
  list-style: none;
}
.kpi-perf-timeline-item {
  display: grid;
  grid-template-columns: 12px 1fr auto auto;
  gap: 10px 10px;
  align-items: flex-start;
  width: 100%;
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.035);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.14s ease;
}
.kpi-perf-timeline-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(45, 212, 191, 0.28);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.kpi-perf-timeline-item:active {
  transform: scale(0.995);
}
.kpi-perf-timeline-item:focus-visible {
  outline: 2px solid rgba(45, 212, 191, 0.45);
  outline-offset: 2px;
}
.kpi-perf-timeline-chev {
  font-size: 1.15rem;
  font-weight: 300;
  line-height: 1;
  color: rgba(148, 163, 184, 0.55);
  align-self: center;
  margin-top: 2px;
  transition: color 0.15s ease, transform 0.15s ease;
}
.kpi-perf-timeline-item:hover .kpi-perf-timeline-chev {
  color: rgb(45, 212, 191);
  transform: translateX(2px);
}
.kpi-perf-timeline-dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.45);
}
.kpi-perf-timeline-item--incident .kpi-perf-timeline-dot {
  background: rgb(251, 146, 60);
}
.kpi-perf-timeline-item--action .kpi-perf-timeline-dot {
  background: rgb(96, 165, 250);
}
.kpi-perf-timeline-item--audit .kpi-perf-timeline-dot {
  background: rgb(45, 212, 191);
}
.kpi-perf-timeline-item--nc .kpi-perf-timeline-dot {
  background: rgb(192, 132, 252);
}
.kpi-perf-timeline-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.kpi-perf-timeline-kind {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-timeline-line1 {
  font-size: 13px;
  font-weight: 700;
  color: var(--text1);
  display: block;
}
.kpi-perf-timeline-sub {
  font-size: 12px;
  color: var(--text3);
}
.kpi-perf-timeline-time {
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  white-space: nowrap;
}
.kpi-perf-timeline-empty {
  padding: 12px 0;
  font-size: 13px;
  color: var(--text3);
}
html[data-theme='light'] .kpi-perf-timeline {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  border: 1px solid rgba(100, 116, 139, 0.22);
  box-shadow:
    0 2px 10px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
html[data-theme='light'] .kpi-perf-timeline-h {
  color: rgb(71, 85, 105);
  border-bottom-color: rgba(100, 116, 139, 0.2);
}
html[data-theme='light'] .kpi-perf-timeline-item {
  background: #ffffff;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}
html[data-theme='light'] .kpi-perf-timeline-item:hover {
  background: #ffffff;
  border-color: rgba(13, 148, 136, 0.38);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.09);
}
html[data-theme='light'] .kpi-perf-timeline-chev {
  color: rgb(148, 163, 184);
}
html[data-theme='light'] .kpi-perf-timeline-item:hover .kpi-perf-timeline-chev {
  color: rgb(15, 118, 110);
}
html[data-theme='light'] .kpi-perf-timeline-kind {
  color: rgb(100, 116, 139);
}
html[data-theme='light'] .kpi-perf-timeline-sub {
  color: rgb(100, 116, 139);
}
html[data-theme='light'] .kpi-perf-timeline-time {
  color: rgb(71, 85, 105);
}
html[data-theme='light'] .kpi-perf-timeline-empty {
  color: rgb(100, 116, 139);
}
@media (max-width: 480px) {
  .kpi-perf-timeline-item {
    grid-template-columns: 10px minmax(0, 1fr) auto auto;
    padding: 10px 12px;
    gap: 8px 6px;
  }
  .kpi-perf-timeline-time {
    font-size: 10px;
  }
}
.kpi-perf-content.stack {
  gap: 28px !important;
}
.kpi-perf-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px 24px;
}
.kpi-perf-header--toolbar-only {
  align-items: center;
  justify-content: flex-end;
}
.kpi-perf-title-block {
  flex: 1 1 220px;
  min-width: 0;
}
.kpi-perf-title {
  margin: 0;
  font-size: clamp(22px, 2.4vw, 28px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text1, var(--color-text));
}
.kpi-perf-lead {
  margin: 8px 0 0;
  max-width: 52ch;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text3, var(--color-text-muted));
}
.kpi-perf-lead strong {
  color: var(--text2, var(--color-text));
  font-weight: 600;
}
.kpi-perf-kpi-legend {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
}
.kpi-perf-foot {
  margin: 0;
  padding-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text3);
  max-width: 72ch;
}
.kpi-perf-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: flex-end;
}
.kpi-perf-field span {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3, var(--color-text-muted));
}
.kpi-perf-loading {
  margin: 0;
  font-size: 14px;
  color: var(--text2);
}
.kpi-perf-kpi-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kpi-perf-hero-surface {
  padding: 1px 0 2px;
  opacity: 0.98;
}
.kpi-perf-kpi-block--muted .kpi-perf-section-k {
  opacity: 0.82;
}
.kpi-perf-pilotage-row--muted {
  opacity: 0.94;
}
.kpi-perf-section-k {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid.kpi-perf-main-grid--tier-strat,
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid.kpi-perf-main-grid--tier-ops {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid.kpi-perf-main-grid--tier-ops {
  margin-top: 0;
}
.kpi-perf-pilotage-row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}
.kpi-perf-band--charts {
  padding: 16px 18px 18px;
  border-radius: var(--ds-radius-lg, 18px);
  border: 1px solid var(--color-border-tertiary, rgba(148, 163, 184, 0.14));
  background: var(
    --kpi-perf-band-bg,
    linear-gradient(
      180deg,
      rgba(248, 250, 252, 0.65) 0%,
      var(--color-background-primary, #fff) 100%
    )
  );
  box-shadow: 0 2px 20px rgba(15, 23, 42, 0.04);
}
.kpi-perf-dx-kicker {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text3);
  opacity: 0.88;
  margin-bottom: 4px;
}
.kpi-perf-main-gap {
  margin-top: 12px;
  padding: 9px 11px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text2);
  letter-spacing: 0.02em;
  line-height: 1.45;
  background: rgba(148, 163, 184, 0.08);
}
.kpi-perf-main-gap--red {
  color: rgba(185, 28, 28, 0.95);
  background: rgba(239, 68, 68, 0.09);
  font-weight: 800;
}
.kpi-perf-main-gap--amber {
  color: rgba(146, 64, 14, 0.98);
  background: rgba(245, 158, 11, 0.1);
  font-weight: 800;
}
.kpi-perf-main-gap--green {
  color: rgba(21, 128, 61, 0.95);
  background: rgba(34, 197, 94, 0.08);
  font-weight: 800;
}
.kpi-perf-main-gap--blue {
  font-weight: 700;
  background: rgba(45, 212, 191, 0.07);
}
.kpi-perf-cockpit-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 20px 28px;
  padding: 22px 24px;
  border-radius: var(--ds-radius-lg, 18px);
  border: 1px solid var(--color-border-tertiary, rgba(148, 163, 184, 0.14));
  background: linear-gradient(
    145deg,
    var(--color-background-secondary, rgba(248, 250, 252, 0.9)) 0%,
    var(--color-background-primary, #fff) 48%,
    rgba(99, 102, 241, 0.06) 100%
  );
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
  align-items: stretch;
}
.kpi-perf-hero-score {
  min-width: 0;
}
.kpi-perf-hero-k {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 10px;
}
.kpi-perf-hero-val-row {
  display: flex;
  align-items: baseline;
  gap: 6px 10px;
  flex-wrap: wrap;
}
.kpi-perf-hero-val {
  font-size: clamp(36px, 5vw, 48px) !important;
  font-weight: 900 !important;
  letter-spacing: -0.04em;
  line-height: 1;
}
.kpi-perf-hero-pct {
  font-size: 22px;
  font-weight: 800;
  color: var(--text3);
}
.kpi-perf-hero-trend {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-info, #0f766e);
  margin-left: 4px;
}
.kpi-perf-hero-sub {
  margin: 14px 0 0;
  font-size: 14px;
  color: var(--text2);
  line-height: 1.65;
}
.kpi-perf-hero-sub strong {
  color: var(--text);
}
.kpi-perf-hero-vigil {
  padding: 18px 20px;
  border-radius: var(--ds-radius-md, 14px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-primary);
  min-width: 0;
}
.kpi-perf-hero-vigil--green {
  border-color: rgba(34, 197, 94, 0.28);
  background: rgba(34, 197, 94, 0.06);
}
.kpi-perf-hero-vigil--amber {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.07);
}
.kpi-perf-hero-vigil--red {
  border-color: rgba(239, 68, 68, 0.38);
  background: rgba(239, 68, 68, 0.08);
}
.kpi-perf-hero-vigil-k {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 8px;
}
.kpi-perf-hero-vigil-l {
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--text);
}
.kpi-perf-hero-vigil-h {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text2);
}
.kpi-perf-charts-bank {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.92fr) minmax(0, 0.92fr);
  gap: 18px;
  align-items: stretch;
  min-width: 0;
}
.kpi-perf-charts-bank .content-card {
  padding: 18px 20px 20px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: linear-gradient(
    165deg,
    rgba(30, 41, 59, 0.35) 0%,
    rgba(15, 23, 42, 0.55) 100%
  );
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.kpi-perf-charts-bank .content-card:hover {
  border-color: rgba(45, 212, 191, 0.18);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
}
.kpi-perf-charts-bank .content-card-head {
  margin-bottom: 12px;
}
.kpi-perf-chart-card--progress .dashboard-line-chart-labels span {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.92;
}
.kpi-perf-chart-card--progress .dashboard-line-chart-values {
  font-size: 13px;
  padding-top: 4px;
}
.kpi-perf-chart-card--goalvs .kpi-perf-goalvs-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 6px;
}
.kpi-perf-goalvs-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
  grid-template-rows: auto auto;
  gap: 8px 14px;
  align-items: center;
}
.kpi-perf-goalvs-label {
  grid-row: 1 / span 2;
  font-size: 12px;
  font-weight: 700;
  color: var(--text2);
  line-height: 1.45;
}
.kpi-perf-goalvs-track {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: var(--color-background-tertiary, rgba(148, 163, 184, 0.12));
  border: 1px solid var(--color-border-tertiary);
  overflow: visible;
}
.kpi-perf-goalvs-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.85), rgba(45, 212, 191, 0.65));
  min-width: 0;
  transition: width 0.35s ease;
}
.kpi-perf-goalvs-marker {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 16px;
  margin-left: -1px;
  border-radius: 1px;
  background: rgba(245, 158, 11, 0.95);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
  pointer-events: none;
}
.kpi-perf-goalvs-vals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  line-height: 1.45;
}
.kpi-perf-goalvs-real {
  color: var(--text);
}
.kpi-perf-goalvs-foot {
  margin: 16px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text3);
}
.kpi-perf-charge-body .dashboard-pilot-load--compact {
  margin-top: 2px;
}
.kpi-perf-charge-audits {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text3);
  font-weight: 600;
}
.kpi-perf-chart-card--progress .dashboard-line-chart-wrap .dashboard-line-chart-svg {
  max-height: 200px;
}
.kpi-perf-gaps {
  padding: 20px 22px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-primary);
  box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05);
}
.kpi-perf-gaps-title {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-gaps-sub {
  margin: 0 0 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.01em;
  line-height: 1.55;
}
.kpi-perf-gaps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 18px;
}
.kpi-perf-gaps-col {
  padding: 16px 16px 14px 18px;
  border-radius: 12px;
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-secondary, rgba(248, 250, 252, 0.6));
  min-width: 0;
}
.kpi-perf-gaps-col--below {
  border-left: 3px solid rgba(239, 68, 68, 0.42);
}
.kpi-perf-gaps-col--watch {
  border-left: 3px solid rgba(245, 158, 11, 0.48);
}
.kpi-perf-gaps-col--ok {
  border-left: 3px solid rgba(34, 197, 94, 0.38);
}
.kpi-perf-gaps-col-k {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
  color: var(--text3);
}
.kpi-perf-gaps-col--below .kpi-perf-gaps-col-k {
  color: rgba(185, 28, 28, 0.9);
}
.kpi-perf-gaps-col--watch .kpi-perf-gaps-col-k {
  color: rgba(180, 83, 9, 0.95);
}
.kpi-perf-gaps-col--ok .kpi-perf-gaps-col-k {
  color: rgba(21, 128, 61, 0.9);
}
.kpi-perf-gaps-list {
  margin: 0;
  padding-left: 1.15em;
  font-size: 13px;
  font-weight: 500;
  color: var(--text2);
  line-height: 1.65;
}
.kpi-perf-gaps-list li {
  margin-bottom: 8px;
}
.kpi-perf-gaps-list li:last-child {
  margin-bottom: 0;
}
.kpi-perf-gaps-empty {
  list-style: none;
  margin-left: -1.1em;
  color: var(--text3);
  font-weight: 600;
}
.kpi-perf-priorities {
  padding: 20px 22px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(
    165deg,
    rgba(99, 102, 241, 0.07) 0%,
    var(--color-background-primary) 55%
  );
}
.kpi-perf-priorities-title {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}
.kpi-perf-priorities-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.kpi-perf-priorities-list li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.55;
  color: var(--text);
}
.kpi-perf-priorities-idx {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  color: var(--color-text-info, #0f766e);
  background: rgba(20, 184, 166, 0.14);
  border: 1px solid rgba(20, 184, 166, 0.28);
  margin-top: 2px;
}
.kpi-perf-priorities-txt {
  flex: 1;
  min-width: 0;
}
.kpi-perf-priorities-li {
  align-items: stretch;
}
.kpi-perf-priorities-btn {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 10px 12px;
  text-align: left;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--text2);
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.kpi-perf-priorities-btn:hover {
  border-color: rgba(45, 212, 191, 0.35);
  background: rgba(45, 212, 191, 0.08);
}
.kpi-perf-priorities-btn:focus-visible {
  outline: 2px solid rgba(45, 212, 191, 0.55);
  outline-offset: 2px;
}
.kpi-perf-hero-score--interactive {
  cursor: pointer;
  border-radius: 14px;
  padding: 4px 8px 8px;
  margin: -4px -8px -8px;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.kpi-perf-hero-score--interactive:hover {
  background: rgba(45, 212, 191, 0.06);
  box-shadow: 0 0 0 1px rgba(45, 212, 191, 0.15);
}
.kpi-perf-hero-hint {
  font-size: 11px;
  font-weight: 600;
  color: rgba(45, 212, 191, 0.75);
}
.kpi-perf-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  text-align: left;
  font: inherit;
  cursor: pointer;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid transparent;
  background: rgba(15, 23, 42, 0.5);
  color: var(--text2);
  transition: border-color 0.15s ease, background 0.15s ease;
}
.kpi-perf-alert__ico {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1.2;
  opacity: 0.9;
}
.kpi-perf-alert__msg {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}
.kpi-perf-alert--critical {
  border-color: rgba(239, 91, 107, 0.35);
  background: rgba(239, 91, 107, 0.1);
}
.kpi-perf-alert--high {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.08);
}
.kpi-perf-alert--info {
  border-color: rgba(59, 130, 246, 0.25);
  background: rgba(59, 130, 246, 0.06);
}
.kpi-perf-alert:hover {
  filter: brightness(1.04);
}
[data-theme='dark'] .kpi-perf-cockpit-hero {
  background: linear-gradient(
    145deg,
    rgba(17, 24, 39, 0.98) 0%,
    rgba(15, 23, 42, 0.95) 50%,
    rgba(99, 102, 241, 0.1) 100%
  );
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}
[data-theme='dark'] .kpi-perf-band--charts {
  background: linear-gradient(
    180deg,
    rgba(17, 24, 39, 0.55) 0%,
    rgba(15, 23, 42, 0.35) 100%
  );
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}
.kpi-perf-main-card.metric-card {
  gap: 10px;
  padding: 18px 18px 20px;
  min-height: 0;
}
.kpi-perf-main-card .metric-label {
  line-height: 1.35;
  margin-bottom: 2px;
}
.kpi-perf-main-card {
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.18s ease,
    border-color 0.18s ease;
  border: 1px solid rgba(148, 163, 184, 0.12);
  outline: none;
}
.kpi-perf-main-card:hover {
  transform: none;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--palette-accent, #14b8a6) 10%, transparent);
}
.kpi-perf-main-card:active {
  transform: translateY(0);
  transition-duration: 0.08s;
}
.kpi-perf-main-card:focus-visible {
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.55);
}
.kpi-perf-main-card--red {
  border-color: rgba(239, 91, 107, 0.22);
}
.kpi-perf-main-card--amber {
  border-color: rgba(245, 158, 11, 0.25);
}
.kpi-perf-main-card--green {
  border-color: rgba(52, 211, 153, 0.22);
}
.kpi-perf-main-card--blue {
  border-color: rgba(45, 212, 191, 0.18);
}
.kpi-perf-main-card--tone-red {
  box-shadow: none;
}
.kpi-perf-main-card--tone-amber {
  box-shadow: none;
}
.kpi-perf-main-card--tone-green {
  box-shadow: none;
}
.kpi-perf-main-insight {
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 600;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.35);
  color: var(--text2);
}
.kpi-perf-main-insight--red {
  border-color: rgba(239, 91, 107, 0.28);
  background: rgba(239, 91, 107, 0.07);
}
.kpi-perf-main-insight--amber {
  border-color: rgba(245, 158, 11, 0.28);
  background: rgba(245, 158, 11, 0.07);
}
.kpi-perf-main-insight--green {
  border-color: rgba(52, 211, 153, 0.22);
  background: rgba(52, 211, 153, 0.06);
}
.kpi-perf-main-insight--blue {
  border-color: rgba(45, 212, 191, 0.2);
  background: rgba(45, 212, 191, 0.06);
}
.kpi-perf-main-value {
  font-size: clamp(20px, 2.2vw, 26px) !important;
}
.kpi-perf-main-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text3);
}
.kpi-perf-delta {
  font-weight: 600;
  color: var(--text2);
}
.kpi-perf-goal {
  opacity: 0.9;
}
.kpi-perf-main-hint {
  margin-top: 10px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(45, 212, 191, 0.85);
  letter-spacing: 0.02em;
}
.kpi-perf-h2 {
  margin: 0;
  font-size: clamp(17px, 1.6vw, 20px);
  font-weight: 700;
}
.kpi-perf-h2--small {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text3);
}
.kpi-perf-chart-card .kpi-multi-line-wrap {
  padding: 4px 0 2px;
}
.kpi-multi-line-wrap {
  width: 100%;
  min-width: 0;
}
.kpi-multi-line-svg {
  width: 100%;
  height: auto;
  display: block;
  max-height: 200px;
}
.kpi-multi-line-labels {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-top: 6px;
  font-size: 10px;
  color: var(--text3);
}
.kpi-multi-line-labels span {
  flex: 1;
  text-align: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-multi-line-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--text2);
}
.kpi-multi-line-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi-multi-line-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kpi-perf-secondary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.kpi-perf-secondary--dual .kpi-perf-dual-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}
.kpi-perf-dual-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.kpi-perf-dual-k {
  font-size: 12px;
  color: var(--text3);
  font-weight: 600;
}
.kpi-perf-dual-v {
  font-size: 18px !important;
}
.kpi-perf-secondary {
  padding: 14px 16px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(0, 0, 0, 0.06);
}
.kpi-perf-secondary-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text3);
  margin-bottom: 6px;
}
.kpi-perf-secondary-value {
  font-size: 20px !important;
}
.kpi-perf-secondary-sub {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text3);
  line-height: 1.35;
}
.kpi-perf-alerts-wrap {
  margin: 0;
}
.kpi-perf-alerts-details {
  padding: 16px 18px;
  border-radius: var(--ds-radius-lg, 14px);
  border: 1px dashed rgba(148, 163, 184, 0.28);
  background: rgba(0, 0, 0, 0.06);
}
.kpi-perf-alerts-summary {
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--text2);
}
.kpi-perf-alerts-stack {
  margin-top: 14px;
  gap: 12px !important;
}
.kpi-perf-link-analytics {
  align-self: flex-start;
  margin-top: 8px;
}
.kpi-perf-alert {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text2);
  background: rgba(0, 0, 0, 0.1);
  border-left: 3px solid rgba(148, 163, 184, 0.5);
}
.kpi-perf-alert--critical {
  border-left-color: rgba(239, 91, 107, 0.95);
  background: rgba(239, 91, 107, 0.07);
}
.kpi-perf-alert--high {
  border-left-color: rgba(245, 158, 11, 0.9);
  background: rgba(245, 158, 11, 0.06);
}
.kpi-perf-alert--info {
  border-left-color: rgba(45, 212, 191, 0.75);
  background: rgba(45, 212, 191, 0.05);
}
.kpi-perf-insight {
  padding: 14px 18px;
  border-radius: var(--ds-radius-lg, 16px);
  border: 1px solid rgba(61, 184, 154, 0.2);
  background: linear-gradient(
    165deg,
    rgba(61, 184, 154, 0.08) 0%,
    rgba(18, 24, 32, 0.4) 100%
  );
}
.kpi-perf-insight-k {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 8px;
}
.kpi-perf-insight-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text2);
  font-weight: 500;
}
.kpi-perf-meta {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
}
.kpi-perf-muted {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text3);
}
@media (max-width: 1320px) {
  .kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpi-perf-charts-bank {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 900px) {
  .kpi-perf-cockpit-hero {
    grid-template-columns: 1fr;
  }
  .kpi-perf-gaps-grid {
    grid-template-columns: 1fr;
  }
  .kpi-perf-pilotage-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .kpi-perf-main-grid.kpi-grid.dashboard-kpi-grid {
    grid-template-columns: 1fr;
  }
  .kpi-perf-secondary-grid {
    grid-template-columns: 1fr;
  }
}

/* Assistant pilotage QHSE (suggestions assistées) */
.dashboard-band--assistant{
  margin:6px 0 8px;
}
.dashboard-pilotage-assistant__card{
  border:1px solid rgba(99,102,241,.2);
  background:linear-gradient(165deg,rgba(99,102,241,.07) 0%,rgba(15,23,42,.55) 45%,rgba(12,16,24,.4) 100%);
  box-shadow:0 8px 40px rgba(0,0,0,.18);
}
.dashboard-pilotage-assistant__head{
  display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:18px 28px;
  margin:0 0 22px;padding-bottom:22px;
  border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 55%,transparent);
}
.dashboard-pilotage-assistant__title{margin:4px 0 8px;font-size:clamp(17px,1.6vw,20px)}
.dashboard-pilotage-assistant__lead{margin:0;max-width:58ch;font-size:13px;line-height:1.58;color:var(--text2)}
.dashboard-pilotage-assistant__score-block{
  min-width:148px;padding:14px 18px;border-radius:var(--dash-radius-lg,14px);
  border:1px solid rgba(148,163,184,.18);background:rgba(0,0,0,.22);
  text-align:center;
  box-shadow:0 1px 0 color-mix(in srgb,#fff 6%,transparent) inset,0 10px 28px -16px rgba(0,0,0,.35);
}
.dashboard-pilotage-assistant__score-val{
  display:block;font-size:clamp(28px,4vw,36px);font-weight:800;letter-spacing:-.03em;color:#a5b4fc;line-height:1;
}
.dashboard-pilotage-assistant__score-lbl{display:block;margin-top:8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.dashboard-pilotage-assistant__score-sub{display:block;margin-top:6px;font-size:10px;color:var(--text3);line-height:1.42;max-width:22ch;margin-inline:auto}
.dashboard-pilotage-assistant__panels{
  display:flex;flex-direction:column;gap:clamp(16px,2vw,22px);
  min-width:0;
}
.dashboard-pilotage-assistant__panel{
  margin:0;
  padding:20px 22px 22px;
  border-radius:var(--dash-radius-lg,14px);
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 72%,rgba(99,102,241,.12));
  background:color-mix(in srgb,var(--color-background-primary) 42%,rgba(0,0,0,.28));
  box-shadow:
    0 1px 0 color-mix(in srgb,#fff 5%,transparent) inset,
    0 14px 36px -28px rgba(0,0,0,.55);
}
.dashboard-pilotage-assistant__h{
  display:flex;align-items:center;gap:10px;
  margin:0 0 14px;padding:0 0 12px;
  border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 50%,transparent);
  font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:color-mix(in srgb,var(--palette-accent,#14b8a6) 55%,var(--text3));
}
.dashboard-pilotage-assistant__h::before{
  content:'';
  width:3px;height:1.05em;border-radius:2px;flex-shrink:0;
  background:linear-gradient(180deg,var(--palette-accent,#14b8a6),color-mix(in srgb,var(--color-primary,#6366f1) 80%,transparent));
  box-shadow:0 0 12px -2px color-mix(in srgb,var(--palette-accent,#14b8a6) 45%,transparent);
}
.dashboard-pilotage-assistant__subhead{
  margin:-2px 0 14px;
  font-size:12px;
  color:var(--text3);
}
.dashboard-pilotage-assistant__micro-label{
  margin:0;
  font-size:10px;
  letter-spacing:.08em;
  text-transform:uppercase;
  font-weight:700;
  color:var(--text3);
}
.dashboard-pilotage-assistant__syn-score{
  display:grid;
  gap:10px;
  padding:12px 14px;
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 78%,transparent);
  border-radius:12px;
  background:color-mix(in srgb,var(--color-background-secondary) 65%,transparent);
}
.dashboard-pilotage-assistant__syn-score-value{margin:4px 0 0;font-size:24px;font-weight:800;color:var(--text)}
.dashboard-pilotage-assistant__syn-progress{height:8px;border-radius:999px;background:color-mix(in srgb,var(--color-background-primary) 82%,transparent);overflow:hidden}
.dashboard-pilotage-assistant__syn-progress-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--palette-accent,#14b8a6),var(--color-primary,#6366f1))}
.dashboard-pilotage-assistant__syn-tensions{
  margin-top:12px;
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
}
.dashboard-pilotage-assistant__tension-chip{
  display:flex;justify-content:space-between;gap:8px;align-items:center;
  padding:8px 10px;border-radius:10px;
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 75%,transparent);
  background:color-mix(in srgb,var(--color-background-primary) 78%,transparent);
  font-size:12px;color:var(--text2);
}
.dashboard-pilotage-assistant__tension-chip strong{font-size:13px;color:var(--text)}
.dashboard-pilotage-assistant__syn-note{
  margin-top:12px;padding:10px 12px;border-radius:12px;
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 78%,transparent);
  background:color-mix(in srgb,var(--color-background-secondary) 48%,transparent);
}
.dashboard-pilotage-assistant__synthesis-text{
  margin:6px 0 0;max-width:68ch;
  font-size:13px;line-height:1.6;letter-spacing:-.005em;
  color:var(--text2);
  text-wrap:pretty;
}
.dashboard-pilotage-assistant__ia-loading{margin:0;font-size:14px;line-height:1.62;color:var(--text3);font-style:italic}
.dashboard-pilotage-assistant__ia-badge{
  display:inline-flex;align-items:center;
  margin:2px 0 10px;padding:5px 9px;border-radius:999px;
  font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  border:1px solid color-mix(in srgb,var(--palette-warning,#f59e0b) 40%,var(--color-border-tertiary));
  background:color-mix(in srgb,var(--palette-warning,#f59e0b) 10%,var(--color-background-primary));
  color:var(--text2);
}
.dashboard-pilotage-assistant__ia-rows{display:grid;gap:6px;margin:0 0 12px}
.dashboard-pilotage-assistant__ia-row{
  display:grid;grid-template-columns:minmax(90px,120px) 1fr;gap:10px;
  padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 55%,transparent);
}
.dashboard-pilotage-assistant__ia-row:last-child{border-bottom:none}
.dashboard-pilotage-assistant__ia-row-label{
  font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text3)
}
.dashboard-pilotage-assistant__ia-row p{margin:0;font-size:13px;line-height:1.5;color:var(--text2)}
.dashboard-pilotage-assistant__ia-text{
  margin:0;max-width:68ch;
  font-size:12px;line-height:1.55;letter-spacing:-.005em;
  color:var(--text2);
  text-wrap:pretty;
}
.dashboard-pilotage-assistant__ia-actions{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:12px}
.dashboard-pilotage-assistant__ia-action{
  margin:0;padding:14px 16px 14px 18px;border-radius:12px;
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 75%,transparent);
  border-left:3px solid color-mix(in srgb,var(--palette-accent,#14b8a6) 75%,transparent);
  background:color-mix(in srgb,var(--color-background-secondary) 55%,rgba(0,0,0,.12));
  font-size:14px;line-height:1.58;color:var(--text2);
  box-shadow:0 1px 0 color-mix(in srgb,#fff 4%,transparent) inset;
}
.dashboard-pilotage-assistant__ia-action strong{font-weight:700;color:var(--text)}
.dashboard-pilotage-assistant__rec-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.dashboard-pilotage-assistant__rec-empty{margin:0;padding:12px 14px;border-radius:12px;border:1px dashed rgba(148,163,184,.2);font-size:13px;color:var(--text3)}
.dashboard-pilotage-assistant__rec-btn{
  width:100%;text-align:left;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto auto;gap:6px 14px;
  padding:14px 16px;border-radius:14px;border:1px solid rgba(148,163,184,.14);
  background:rgba(0,0,0,.12);color:var(--text);cursor:pointer;transition:border-color .15s,background .15s;
}
.dashboard-pilotage-assistant__rec-btn:hover{
  border-color:rgba(129,140,248,.35);background:rgba(99,102,241,.08);
}
.dashboard-pilotage-assistant__rec-prio{
  grid-row:1/4;align-self:center;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  padding:6px 8px;border-radius:8px;min-width:72px;text-align:center;
}
.dashboard-pilotage-assistant__rec-prio--urgent{background:rgba(239,68,68,.2);color:#fecaca}
.dashboard-pilotage-assistant__rec-prio--prioritaire{background:rgba(245,158,11,.18);color:#fde68a}
.dashboard-pilotage-assistant__rec-prio--normal{background:rgba(148,163,184,.15);color:#e2e8f0}
.dashboard-pilotage-assistant__rec-title{grid-column:2;font-weight:700;font-size:14px;line-height:1.3}
.dashboard-pilotage-assistant__rec-detail{grid-column:2;font-size:13px;color:var(--text2);line-height:1.52}
.dashboard-pilotage-assistant__rec-cta{grid-column:2;font-size:11px;font-weight:700;color:#a5b4fc}
.dashboard-pilotage-assistant__anomaly-panel{
  margin-top:2px;
  padding:14px 16px 12px;border-radius:12px;
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 70%,transparent);
  background:color-mix(in srgb,var(--color-background-secondary) 65%,rgba(0,0,0,.08));
  box-shadow:0 1px 0 color-mix(in srgb,white 5%,transparent) inset;
}
.dashboard-pilotage-assistant__anomaly-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.dashboard-pilotage-assistant__anomaly{
  margin:0;padding:11px 12px 11px 14px;border-radius:12px;
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 75%,transparent);
  border-left:3px solid transparent;
  background:color-mix(in srgb,var(--color-background-primary) 70%,transparent);
  font-size:13px;line-height:1.55;color:var(--text2);
}
.dashboard-pilotage-assistant__anomaly--err{
  border-left-color:color-mix(in srgb,var(--palette-danger,#ef4444) 85%,transparent);
  background:color-mix(in srgb,rgba(239,68,68,.14) 35%,var(--color-background-primary));
  color:#fecaca;
}
.dashboard-pilotage-assistant__anomaly--warn{
  border-left-color:color-mix(in srgb,var(--palette-warning,#f59e0b) 80%,transparent);
  background:color-mix(in srgb,rgba(245,158,11,.12) 30%,var(--color-background-primary));
  color:#fde68a;
}
@media (max-width: 780px){
  .dashboard-pilotage-assistant__syn-tensions{grid-template-columns:1fr}
  .dashboard-pilotage-assistant__ia-row{grid-template-columns:1fr}
}
/* Synthèse hebdo : carte direction claire, claire/sombre */
.dashboard-ai-insight{
  margin-top:0;
  width:100%;
  max-width:100%;
  min-width:0;
  align-self:stretch;
}
.dashboard-ai-insight__card{
  margin:0;
  width:100%;
  border-radius:var(--dash-radius-xl,18px);
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 88%,transparent);
  background:color-mix(in srgb,var(--color-background-secondary) 86%,var(--color-background-primary));
  box-shadow:0 18px 34px -30px rgba(0,0,0,.45);
}
.dashboard-ai-insight__content{padding:20px;display:grid;gap:16px}
.dashboard-ai-insight__head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.dashboard-ai-insight__head-text{min-width:0;flex:1}
.dashboard-ai-insight__kicker{margin:0 0 6px;letter-spacing:.09em;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--color-text-secondary)}
.dashboard-ai-insight__lede{margin:0;font-size:13px;line-height:1.45;color:var(--color-text-tertiary,var(--color-text-secondary));max-width:56ch}
.dashboard-ai-insight__chip{padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-text-secondary);border:1px solid color-mix(in srgb,var(--color-border-secondary) 82%,transparent);background:color-mix(in srgb,var(--color-background-primary) 84%,var(--color-subtle,transparent))}
.dashboard-ai-insight__kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dashboard-ai-insight__kpi-tile{border:1px solid color-mix(in srgb,var(--color-border-tertiary) 86%,transparent);border-radius:12px;padding:12px;background:color-mix(in srgb,var(--color-background-primary) 86%,var(--color-background-secondary));display:grid;gap:3px}
.dashboard-ai-insight__kpi-tile--alert{border-color:color-mix(in srgb,var(--palette-danger,#ef4444) 42%,var(--color-border-tertiary));background:color-mix(in srgb,var(--color-danger-bg,rgba(239,68,68,.12)) 32%,var(--color-background-primary))}
.dashboard-ai-insight__kpi-value{margin:0;font-size:23px;font-weight:800;line-height:1.1;color:var(--color-text-primary,var(--text))}
.dashboard-ai-insight__kpi-label{margin:0;font-size:12px;font-weight:650;color:var(--color-text-secondary,var(--text2))}
.dashboard-ai-insight__kpi-sub{margin:0;font-size:11px;color:var(--color-text-tertiary,var(--text3))}
.dashboard-ai-insight__direction{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.dashboard-ai-insight__panel{border:1px solid color-mix(in srgb,var(--color-border-tertiary) 85%,transparent);border-radius:12px;padding:12px;background:color-mix(in srgb,var(--color-background-primary) 84%,var(--color-background-secondary));display:grid;gap:6px}
.dashboard-ai-insight__panel--alert{border-color:color-mix(in srgb,var(--palette-warning,#f59e0b) 36%,var(--color-border-tertiary))}
.dashboard-ai-insight__panel-title{margin:0;font-size:13px;font-weight:700;color:var(--color-text-primary,var(--text))}
.dashboard-ai-insight__panel-text{margin:0;font-size:12.5px;line-height:1.5;color:var(--color-text-secondary,var(--text2))}
.dashboard-ai-insight__footer{padding-top:12px;border-top:1px solid color-mix(in srgb,var(--color-border-tertiary) 82%,transparent);font-size:11px;color:var(--color-text-tertiary,var(--text3))}
@media (max-width:1024px){
  .dashboard-ai-insight__kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
  .dashboard-ai-insight__content{padding:16px}
  .dashboard-ai-insight__kpis,.dashboard-ai-insight__direction{grid-template-columns:1fr}
}

`;

export function ensureDashboardStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
