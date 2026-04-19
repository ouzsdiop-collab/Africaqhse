const STYLE_ID = 'qhse-habilitations-styles';

const CSS = `
/* —— Page : hiérarchie type SaaS premium —— */
.habilitations-page{
  --hab-cockpit-rad:16px;
}

.hab-page-head{
  margin:0;
  padding:0 2px;
  max-width:min(72ch,100%);
}
.hab-page-head__top{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:10px 16px;
  margin-bottom:8px;
}
.hab-page-head__kicker{margin:0}
.hab-page-head__title{
  margin:0 0 8px;
  font-size:clamp(1.45rem,2.4vw,1.85rem);
  font-weight:800;
  letter-spacing:-.03em;
  line-height:1.15;
  color:var(--color-text-primary);
}
.hab-page-head__lead{
  margin:0;
  font-size:14px;
  line-height:1.55;
  color:var(--color-text-secondary);
  max-width:62ch;
}
.hab-empty-cell{
  padding:clamp(20px,3vw,32px) 16px;
  vertical-align:middle;
}
.hab-mobile-card--empty{
  padding:clamp(16px,2.5vw,24px) 14px;
}

.hab-page-head__badge{
  display:inline-flex;
  align-items:center;
  min-height:28px;
  padding:0 11px;
  border-radius:999px;
  font-size:11px;
  font-weight:700;
  letter-spacing:.02em;
  color:var(--color-text-secondary);
  background:color-mix(in srgb,var(--color-background-secondary) 88%,var(--palette-accent,#14b8a6) 12%);
  border:1px solid color-mix(in srgb,var(--palette-accent,#14b8a6) 22%,var(--color-border-tertiary));
  white-space:nowrap;
  max-width:min(420px,100%);
  overflow:hidden;
  text-overflow:ellipsis;
}

/* —— Cockpit : une carte, sections délimitées (plus « produit » que 3 cartons empilés) —— */
.hab-cockpit{
  position:relative;
  overflow:hidden;
  border-radius:var(--hab-cockpit-rad);
  padding:0;
  box-shadow:
    0 0 0 1px color-mix(in srgb,white 5%,transparent) inset,
    0 22px 48px -36px rgba(0,0,0,.55);
}
.hab-cockpit::before{
  content:'';
  position:absolute;left:0;right:0;top:0;height:2px;
  background:linear-gradient(90deg,
    color-mix(in srgb,var(--palette-accent,#14b8a6) 70%,transparent),
    color-mix(in srgb,#38bdf8 40%,transparent),
    transparent 72%);
  pointer-events:none;
}
.hab-cockpit__block{
  padding:clamp(16px,2vw,22px) clamp(16px,2.2vw,24px);
}
.hab-cockpit__block--risk{
  padding-bottom:clamp(14px,1.8vw,20px);
  border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 92%,transparent);
}
.hab-cockpit__block--kpi{
  padding-top:clamp(14px,1.8vw,20px);
  padding-bottom:clamp(14px,1.8vw,20px);
  border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 92%,transparent);
  background:color-mix(in srgb,var(--color-background-primary) 35%,transparent);
}
.hab-cockpit__block--expo{
  padding-top:clamp(14px,1.8vw,20px);
}

.hab-section-head{margin:0 0 14px;max-width:56ch}
.hab-section-head--risk .hab-section-head__title{color:color-mix(in srgb,var(--hab-expired-color,#991b1b) 55%,var(--color-text-primary))}
.hab-section-head__title{
  margin:0 0 4px;
  font-size:11px;
  font-weight:800;
  letter-spacing:.11em;
  text-transform:uppercase;
  color:var(--color-text-tertiary);
}
.hab-section-head__title--sm{font-size:12px;letter-spacing:.08em}
.hab-section-head__title--accent{
  color:color-mix(in srgb,var(--palette-accent,#14b8a6) 85%,var(--color-text-secondary));
}
.hab-section-head__desc{
  margin:0;
  font-size:13px;
  line-height:1.45;
  color:var(--color-text-secondary);
}

/* —— Risque : grille dense, cartes plus sobres —— */
.hab-risk-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(8px,1.2vw,12px);
}
.hab-risk-card{
  position:relative;
  padding:14px 14px 12px 15px;
  border-radius:12px;
  border:1px solid color-mix(in srgb,#ef4444 22%,var(--color-border-tertiary));
  background:color-mix(in srgb,var(--color-background-secondary) 96%,#450a0a 4%);
  display:grid;
  gap:4px;
  min-height:86px;
  transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease;
}
.hab-risk-card:hover{
  border-color:color-mix(in srgb,#f87171 38%,var(--color-border-tertiary));
  box-shadow:0 10px 28px -22px rgba(0,0,0,.5);
  transform:translateY(-1px);
}
.hab-risk-card--warn{
  border-color:color-mix(in srgb,#f97316 28%,var(--color-border-tertiary));
  background:color-mix(in srgb,var(--color-background-secondary) 96%,#431407 4%);
}
.hab-risk-card--warn:hover{border-color:color-mix(in srgb,#fb923c 42%,var(--color-border-tertiary))}
.hab-risk-card__dot{
  position:absolute;top:13px;right:14px;
  width:8px;height:8px;border-radius:99px;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--color-background-secondary) 70%,transparent);
}
.hab-risk-card__dot--crit{background:linear-gradient(180deg,#f87171,#dc2626)}
.hab-risk-card__dot--warn{background:linear-gradient(180deg,#fb923c,#ea580c)}
.hab-risk-card__k{
  font-size:10px;
  font-weight:700;
  color:var(--color-text-tertiary);
  text-transform:uppercase;
  letter-spacing:.06em;
  line-height:1.25;
  padding-right:18px;
}
.hab-risk-card__v{
  font-size:24px;
  font-weight:800;
  line-height:1;
  letter-spacing:-.02em;
  color:var(--hab-expired-color,#991b1b);
}
.hab-risk-card--warn .hab-risk-card__v{color:var(--hab-warning-color,#854d0e)}
.hab-risk-card__hint{
  font-size:11px;
  color:var(--color-text-tertiary);
  line-height:1.35;
  opacity:.92;
}

/* —— KPI secondaires —— */
.hab-kpis--secondary{
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
}
.hab-kpi--lite{
  padding:11px 12px;
  border-radius:12px;
  border:1px solid color-mix(in srgb,var(--color-border-tertiary) 95%,transparent);
  background:var(--color-background-secondary);
}
.hab-kpi--lite .hab-kpi__v{font-size:18px}

/* —— Exposition terrain —— */
.hab-expo-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
}
.hab-expo-card{
  padding:13px 15px;
  border-radius:12px;
  border:1px solid color-mix(in srgb,var(--palette-accent,#14b8a6) 18%,var(--color-border-tertiary));
  background:var(--color-background-secondary);
  display:grid;
  gap:7px;
  transition:border-color .15s ease,box-shadow .15s ease;
}
.hab-expo-card:hover{
  border-color:color-mix(in srgb,var(--palette-accent,#14b8a6) 35%,var(--color-border-tertiary));
  box-shadow:0 8px 24px -20px rgba(0,0,0,.4);
}
.hab-expo-card__k{
  font-size:10px;
  font-weight:700;
  color:var(--color-text-tertiary);
  text-transform:uppercase;
  letter-spacing:.06em;
}
.hab-expo-card__main{
  font-size:15px;
  font-weight:800;
  color:var(--color-text-primary);
  line-height:1.25;
}
.hab-expo-pill{
  display:inline-flex;
  align-items:center;
  padding:3px 9px;
  border-radius:999px;
  font-size:10px;
  font-weight:700;
  background:var(--hab-expired-bg,color-mix(in srgb,#ef4444 12%,transparent));
  color:var(--hab-expired-color,#991b1b);
  border:1px solid rgba(239,68,68,.28);
  line-height:1.35;
}
.hab-expo-pill--orange{
  background:var(--hab-warning-bg,color-mix(in srgb,#f97316 12%,transparent));
  color:var(--hab-warning-color,#854d0e);
  border-color:rgba(249,115,22,.35);
}

/* —— Barre de commande : sticky, navigation + exports —— */
.hab-command-bar{
  position:sticky;
  top:0;
  z-index:6;
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:12px 16px;
  padding:12px 4px 14px;
  margin:0 -2px;
  background:color-mix(in srgb,var(--color-background-primary) 86%,transparent);
  backdrop-filter:saturate(140%) blur(10px);
  -webkit-backdrop-filter:saturate(140%) blur(10px);
  border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 75%,transparent);
}

.hab-tabs{
  display:flex;
  flex-wrap:wrap;
  gap:4px;
  align-items:center;
}
.hab-tabs--segmented{
  padding:4px;
  border-radius:12px;
  background:color-mix(in srgb,var(--color-background-secondary) 100%,transparent);
  border:1px solid var(--color-border-tertiary);
}
.hab-tab-btn{
  min-height:34px;
  padding:0 14px;
  border-radius:9px;
  border:1px solid transparent;
  background:transparent;
  color:var(--color-text-secondary);
  font-weight:700;
  font-size:12px;
  letter-spacing:.01em;
  cursor:pointer;
  transition:color .15s ease,background .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.hab-tab-btn:hover{
  color:var(--color-text-primary);
  background:color-mix(in srgb,var(--palette-accent,#14b8a6) 6%,transparent);
}
.hab-tab-btn.is-active{
  color:var(--color-text-primary);
  background:var(--color-background-primary);
  border-color:color-mix(in srgb,var(--palette-accent,#14b8a6) 28%,var(--color-border-tertiary));
  box-shadow:0 1px 3px rgba(0,0,0,.12);
}

.hab-export-bar{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px 10px;
}
.hab-export-bar--inline{
  padding:0;
  border:none;
  background:transparent;
  justify-content:flex-end;
  flex:1;
  min-width:min(100%,220px);
}
.hab-export-bar__label{
  font-size:10px;
  font-weight:800;
  letter-spacing:.09em;
  text-transform:uppercase;
  color:var(--color-text-tertiary);
  margin-right:2px;
}
.hab-export-group{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.hab-export-bar .btn{min-height:32px;font-size:11px;font-weight:700;padding-left:12px;padding-right:12px}

.hab-main-host{margin-top:2px}
.hab-tab-panel{min-height:120px}

/* —— Table & registre (inchangé fonctionnellement) —— */
.hab-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.hab-kpi{padding:10px;border:1px solid var(--color-border-tertiary);border-radius:10px;background:var(--color-background-secondary);display:grid;gap:2px}
.hab-kpi__k{font-size:11px;color:var(--color-text-tertiary)}
.hab-kpi__v{font-size:20px;font-weight:800;line-height:1}
.hab-kpi__v--red{color:var(--hab-kpi-red,#991b1b)}
.hab-kpi__v--orange{color:var(--hab-kpi-orange,#854d0e)}
.hab-kpi__v--green{color:var(--hab-ok-color,#166534)}
.hab-date--expired{color:var(--hab-kpi-red,#991b1b);font-weight:500}
.hab-date--warning{color:var(--hab-kpi-orange,#854d0e);font-weight:500}
.hab-date--ok{color:var(--hab-kpi-green,#166534)}

.hab-filters{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:8px;
  margin-top:4px;
}
.hab-filters .control-input,
.hab-filters .control-select{
  border-radius:10px;
}
.hab-table-wrap{
  overflow:auto;
  border:1px solid var(--color-border-tertiary);
  border-radius:12px;
  margin-top:12px;
}
.hab-table{width:100%;border-collapse:collapse}
.hab-table th,.hab-table td{
  padding:10px 11px;
  border-bottom:1px solid var(--color-border-tertiary);
  font-size:12px;
  text-align:left;
  white-space:nowrap;
}
.hab-table tbody tr{transition:background .15s ease}
.hab-table tbody tr:hover{
  background:color-mix(in srgb,var(--palette-accent,#14b8a6) 7%,var(--color-background-primary));
}
.hab-table tbody tr.hab-tr--critical{background:var(--surface-tint-row-danger)}
.hab-table tbody tr.hab-tr--warn{background:var(--surface-tint-row-warning)}
.hab-table th{
  font-size:10px;
  font-weight:800;
  color:var(--color-text-tertiary);
  text-transform:uppercase;
  letter-spacing:.06em;
}
.hab-status-cell{display:inline-flex;align-items:center;gap:6px}
.hab-alert-ic{font-size:14px;line-height:1}
.hab-chip .hab-chip-ic{font-size:11px;margin-right:4px;opacity:1}
.hab-row-btn{
  border:none;background:none;
  color:var(--color-text-info);
  font-weight:700;cursor:pointer;
  text-align:left;padding:0;
  text-decoration:underline;text-underline-offset:3px;
  text-decoration-color:color-mix(in srgb,var(--color-text-info) 35%,transparent);
}
.hab-row-btn:hover{color:var(--color-text-primary)}
.hab-actions{display:flex;gap:6px;flex-wrap:wrap}
.hab-mobile-list{display:none;gap:10px;margin-top:12px}
.hab-mobile-card{
  padding:12px;
  border:1px solid var(--color-border-tertiary);
  border-radius:12px;
  background:var(--color-background-secondary);
  display:grid;gap:8px;
}
.hab-mobile-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.hab-mobile-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px}
.hab-pill{
  display:inline-flex;align-items:center;
  padding:2px 8px;border-radius:999px;
  border:1px solid var(--color-border-tertiary);font-size:10px;
}
.hab-chip{
  display:inline-flex;align-items:center;
  padding:4px 9px;border-radius:999px;
  border:1px solid var(--color-border-tertiary);
  font-size:10px;font-weight:700;text-transform:uppercase;
}
/* Pastilles statut : mêmes couleurs que le design system (tokens + design-tokens) */
.hab-chip--valide{
  color:var(--surface-success-ink);
  border-color:var(--surface-success-line);
  background:var(--surface-success);
}
.hab-chip--expire-bientot{
  color:var(--surface-warning-ink);
  border-color:var(--surface-warning-line);
  background:var(--surface-warning);
}
.hab-chip--expiree{
  color:var(--surface-danger-ink);
  border-color:var(--surface-danger-line);
  background:var(--surface-danger);
}
.hab-chip--en-attente{
  color:var(--surface-info-ink);
  border-color:var(--surface-info-line);
  background:var(--surface-info);
}
.hab-chip--suspendue,
.hab-chip--incomplete{
  color:var(--color-text-secondary);
  border-color:var(--color-border-secondary);
  background:var(--surface-neutral-muted);
}
.hab-profile{display:grid;gap:8px}
.hab-profile-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hab-profile-item{padding:8px;border:1px solid var(--color-border-tertiary);border-radius:10px;background:var(--color-background-secondary);font-size:12px}
.hab-profile-k{font-size:11px;color:var(--color-text-tertiary)}
.hab-list-title{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.hab-mini-table{width:100%;border-collapse:collapse}
.hab-mini-table th,.hab-mini-table td{padding:8px;border-bottom:1px solid var(--color-border-tertiary);font-size:12px;text-align:left}
.hab-alert-list{display:grid;gap:8px}
.hab-alert-section{margin-bottom:18px}
.hab-alert-section:last-child{margin-bottom:0}
.hab-alert-section__title{
  margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  display:flex;align-items:center;gap:8px;color:var(--color-text-primary);padding-bottom:8px;
  border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 85%,transparent);
}
.hab-alert-section__title--crit{color:var(--color-text-danger)}
.hab-alert-section__title--urg{color:var(--color-text-warning)}
.hab-alert-section__title--std{color:var(--color-primary-text)}
.hab-alert{
  padding:13px 14px;border-radius:12px;
  border:1px solid var(--color-border-tertiary);
  background:var(--color-background-secondary);
}
.hab-alert--high{border-color:rgba(239,68,68,.48);box-shadow:0 0 0 1px rgba(239,68,68,.1) inset}
.hab-alert--med{border-color:rgba(251,146,60,.45)}
.hab-alert--low{border-color:rgba(56,189,248,.35)}
.hab-bars{display:grid;gap:8px}
.hab-bar{display:grid;gap:4px}
.hab-bar-top{display:flex;justify-content:space-between;font-size:12px}
.hab-bar-track{height:8px;border-radius:999px;background:var(--color-background-primary);border:1px solid var(--color-border-tertiary);overflow:hidden}
.hab-bar-fill{height:100%;background:linear-gradient(90deg,#14b8a6,#0ea5e9)}
.hab-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hab-summary-card{
  padding:12px 14px;
  border:1px solid var(--color-border-tertiary);
  border-radius:12px;
  background:var(--color-background-secondary);
  font-size:12px;
  line-height:1.45;
}

@media (max-width:1200px){
  .hab-risk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:1024px){
  .hab-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hab-kpis--secondary{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hab-filters{grid-template-columns:1fr 1fr}
  .hab-expo-grid{grid-template-columns:1fr}
}
@media (max-width:640px){
  .hab-risk-grid{grid-template-columns:1fr}
  .hab-filters{grid-template-columns:1fr}
  .hab-profile-row{grid-template-columns:1fr}
  .hab-table-wrap{display:none}
  .hab-mobile-list{display:grid}
  .hab-summary-grid{grid-template-columns:1fr}
  .hab-mobile-meta{grid-template-columns:1fr}
  .hab-command-bar{align-items:stretch}
  .hab-export-bar--inline{justify-content:stretch;min-width:0}
  .hab-export-group{width:100%}
  .hab-export-group .btn{flex:1;justify-content:center}
}
.hab-mobile-card--critical{border-color:rgba(239,68,68,.45);background:color-mix(in srgb,#ef4444 6%,var(--color-background-secondary))}
.hab-mobile-card--warn{border-color:rgba(249,115,22,.42)}
.hab-mobile-card .hab-mobile-warn-ic{margin-right:6px}
`;

export function ensureHabilitationsStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
