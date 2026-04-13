const STYLE_ID = 'qhse-pilotage-module-styles';

const CSS = `
/* —— Page Risques : structure & blocs —— */
.risks-page{display:flex;flex-direction:column;gap:1.5rem}
.risks-page__kpi{
  padding:16px 18px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(165deg,rgba(255,255,255,.045) 0%,rgba(255,255,255,.02) 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
[data-theme='dark'] .risks-page__kpi{
  border-color:rgba(240,246,252,.1);
  background:linear-gradient(165deg,rgba(30,38,52,.65) 0%,rgba(18,24,32,.5) 100%);
}
.risks-page__insights{
  padding:18px 20px 20px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(165deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.015) 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
  min-width:0;
}
[data-theme='dark'] .risks-page__insights{
  border-color:rgba(240,246,252,.1);
  background:linear-gradient(165deg,rgba(28,36,48,.55) 0%,rgba(16,22,30,.45) 100%);
}
.risks-insights__head{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px 24px;
  margin-bottom:18px;
}
.risks-insights__intro{min-width:0;flex:1;max-width:52ch}
.risks-insights__title{margin:4px 0 6px;font-size:1.1rem;font-weight:800;letter-spacing:-.02em;line-height:1.25;color:var(--text)}
.risks-insights__lead{margin:0;font-size:12.5px;line-height:1.5;color:var(--text2)}
.risks-insights__kpi-inline{display:flex;flex-wrap:wrap;gap:10px}
.risks-insights__kpi-item{
  min-width:140px;
  padding:10px 14px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.12);
  display:flex;
  flex-direction:column;
  gap:2px;
}
.risks-insights__kpi-item--alert{border-color:rgba(239,91,107,.22);background:rgba(239,91,107,.06)}
.risks-insights__kpi-value{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1;color:var(--text)}
.risks-insights__kpi-item--alert .risks-insights__kpi-value{color:#fca5a5}
.risks-insights__kpi-label{font-size:11px;font-weight:800;color:var(--text)}
.risks-insights__kpi-hint{font-size:10px;color:var(--text3);line-height:1.3}
.risks-insights__bar-wrap{margin-bottom:16px}
.risks-insights__bar{
  display:flex;
  height:8px;
  border-radius:999px;
  overflow:hidden;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.06);
}
.risks-insights__bar-seg{min-width:0;transition:width .25s ease}
.risks-insights__bar-seg--crit{background:linear-gradient(90deg,rgba(239,91,107,.85),rgba(239,91,107,.55))}
.risks-insights__bar-seg--elev{background:linear-gradient(90deg,rgba(243,179,79,.9),rgba(243,179,79,.55))}
.risks-insights__bar-seg--mod{background:linear-gradient(90deg,rgba(34,196,131,.75),rgba(77,160,255,.45))}
.risks-insights__bar-seg--empty{background:rgba(255,255,255,.04)}
.risks-insights__bar-legend{
  display:flex;
  flex-wrap:wrap;
  gap:12px 18px;
  margin-top:10px;
  font-size:11px;
  color:var(--text2);
}
.risks-insights__bar-legend strong{font-weight:800;color:var(--text)}
.risks-insights__dot{
  display:inline-block;
  width:8px;height:8px;border-radius:99px;
  margin-right:6px;vertical-align:middle;
}
.risks-insights__dot--crit{background:rgba(239,91,107,.85)}
.risks-insights__dot--elev{background:rgba(243,179,79,.85)}
.risks-insights__dot--mod{background:rgba(34,196,131,.75)}
.risks-insights__tier-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:10px 14px;
  margin-bottom:16px;
  padding-bottom:16px;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.risks-insights__tier-label{
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--text3);
}
.risks-insights__tier-pills{display:flex;flex-wrap:wrap;gap:8px}
.risks-tier-pill{
  font-family:inherit;
  font-size:11px;
  font-weight:700;
  padding:7px 12px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.04);
  color:var(--text2);
  cursor:pointer;
  transition:background .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease;
}
.risks-tier-pill:hover{
  background:rgba(255,255,255,.09);
  border-color:rgba(255,255,255,.18);
  color:var(--text);
}
.risks-tier-pill--active{
  background:rgba(77,160,255,.12);
  border-color:rgba(77,160,255,.35);
  color:#bae6fd;
  box-shadow:0 0 0 1px rgba(77,160,255,.2);
}
.risks-insights__top-title{
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--text3);
  margin-bottom:10px;
}
.risks-insights__top-list{
  margin:0;
  padding:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.risks-insights__top-item,.risks-insights__top-empty{
  display:flex;
  align-items:flex-start;
  gap:12px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(0,0,0,.1);
}
.risks-insights__top-empty{font-size:12px;color:var(--text2);line-height:1.45}
.risks-insights__top-rank{
  flex-shrink:0;
  width:22px;height:22px;
  border-radius:8px;
  display:grid;
  place-items:center;
  font-size:11px;
  font-weight:800;
  background:rgba(255,255,255,.08);
  color:var(--text2);
}
.risks-insights__top-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.risks-insights__top-name{font-size:13px;font-weight:700;color:var(--text);line-height:1.35}
.risks-insights__top-sub{font-size:11px;color:var(--text3);line-height:1.35}
.risks-page__active-filters{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:10px 14px;
  margin-bottom:14px;
  padding:10px 14px;
  border-radius:12px;
  border:1px solid rgba(77,160,255,.22);
  background:rgba(77,160,255,.06);
}
.risks-page__active-filters-label{
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#5eead4;
}
.risks-page__active-filters-actions{display:flex;flex-wrap:wrap;gap:8px}
.risks-page__active-filters-btn{font-size:11px!important;font-weight:700!important;padding:6px 12px!important;min-height:34px!important}
.risks-page__active-filters-btn--ghost{border-style:dashed;opacity:.95}
.risks-page__matrix-section{margin:0;min-width:0}
.risks-matrix-details{
  border-radius:14px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.1);
  overflow:hidden;
  box-shadow:0 1px 0 rgba(255,255,255,.03) inset;
}
[data-theme='dark'] .risks-matrix-details{
  border-color:rgba(240,246,252,.1);
  background:linear-gradient(180deg,rgba(22,28,38,.5) 0%,rgba(14,18,24,.4) 100%);
}
.risks-matrix-details__summary{
  list-style:none;
  cursor:pointer;
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px 14px;
  padding:12px 16px;
  user-select:none;
  transition:background .15s ease;
}
.risks-matrix-details__summary::-webkit-details-marker{display:none}
.risks-matrix-details__summary::marker{content:''}
.risks-matrix-details__summary:hover{background:rgba(255,255,255,.04)}
.risks-matrix-details__summary-title{
  font-size:13px;
  font-weight:800;
  color:var(--text);
  letter-spacing:-.01em;
}
.risks-matrix-details__summary-meta{font-size:12px;font-weight:600;color:var(--text2)}
.risks-matrix-details__summary-warn{color:#fcd34d;font-weight:700}
.risks-matrix-details__summary-hint{
  margin-left:auto;
  font-size:11px;
  font-weight:600;
  color:var(--text3);
}
.risks-matrix-details__summary-pill{
  margin-left:auto;
  font-size:11px;
  font-weight:700;
  padding:4px 10px;
  border-radius:999px;
  background:rgba(77,160,255,.15);
  border:1px solid rgba(77,160,255,.3);
  color:#bae6fd;
}
@media (max-width:640px){
  .risks-matrix-details__summary-hint,.risks-matrix-details__summary-pill{margin-left:0}
}
.risks-matrix-details__summary::after{
  content:'';
  width:7px;height:7px;
  margin-left:4px;
  border-right:2px solid var(--text3);
  border-bottom:2px solid var(--text3);
  transform:rotate(45deg);
  transition:transform .2s ease;
  flex-shrink:0;
}
.risks-matrix-details[open] > .risks-matrix-details__summary::after{
  transform:rotate(-135deg);
  margin-top:4px;
}
.risks-matrix-details__body{
  padding:0 14px 16px;
  border-top:1px solid rgba(255,255,255,.06);
}
.risks-page__panel{
  display:flex;
  flex-direction:column;
  gap:0;
  min-width:0;
}
.risks-page__panel.content-card{padding-bottom:22px}
.risks-page__panel--register{min-height:0}
.risks-page__panel-head.content-card-head{margin-bottom:0;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.07)}
.risks-page__panel-head.content-card-head--split{align-items:flex-start;gap:14px 18px}
.risks-page__panel-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;align-items:center}
.risks-page__panel-intro{min-width:0;flex:1}
.risks-page__panel-intro h3{margin:4px 0 8px;font-size:1.25rem;font-weight:800;letter-spacing:-.02em;line-height:1.25}
.risks-page__panel-lead{margin:0;max-width:58ch;font-size:13px;line-height:1.55;color:var(--text2)}
.risks-page__list-region{
  flex:1;
  min-height:0;
  margin-top:18px;
  display:flex;
  flex-direction:column;
  min-width:0;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}
.risks-page__list-empty{
  padding:28px 20px;
  text-align:center;
  border-radius:14px;
  border:1px dashed rgba(255,255,255,.12);
  background:rgba(0,0,0,.12);
}
.risks-page__list-empty-title{margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text)}
.risks-page__list-empty-sub{margin:0;font-size:13px;line-height:1.5;color:var(--text2);max-width:42ch;margin-inline:auto}
.risks-page__matrix-shell{
  margin-top:6px;
  padding:0;
  min-width:0;
}
.risks-page__matrix-shell .risk-matrix-grid{max-width:100%;width:100%}
.qhse-kpi-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.qhse-kpi-strip .metric-card:not(.dashboard-kpi-card){padding:14px 16px}
.metric-card--kpi-click{
  cursor:pointer;text-align:left;font:inherit;width:100%;
  transition:border-color .15s ease,background .15s ease,outline .15s ease;
}
.metric-card--kpi-click:not(.dashboard-kpi-card){
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.12);
}
.metric-card--kpi-click:not(.dashboard-kpi-card):hover{border-color:rgba(45,212,191,.32);background:rgba(0,0,0,.2)}
.metric-card--kpi-click--on{outline:2px solid rgba(45,212,191,.45);outline-offset:2px}
.actions-page__kpi-host .qhse-kpi-strip.ds-kpi-grid{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}
.qhse-kpi-strip .metric-value{font-size:28px}
.content-card-head--split{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.content-card-lead{margin:0;font-size:13px;line-height:1.5;color:var(--text2)}
.content-card-lead--narrow{max-width:52ch}
.content-card-head--split .content-card-lead{max-width:56ch}
.content-card-head--split .content-card-lead--narrow{max-width:52ch}
.btn--pilotage-cta{white-space:nowrap;min-height:44px;font-weight:800}
.kanban-board--pilotage{
  margin-top:8px;
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:16px;
  align-items:start;
}
@media (max-width:1280px){
  .kanban-board--pilotage{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:700px){
  .kanban-board--pilotage{grid-template-columns:1fr}
}
.kanban-column--pilotage{
  background:rgba(255,255,255,.025);
  border-radius:14px;
  border:1px solid rgba(255,255,255,.08);
  padding:14px 12px 16px;
  min-height:140px;
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.kanban-column-head{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06)}
.kanban-column-title{margin:0 0 4px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text);font-weight:800}
.kanban-column-hint{margin:0;font-size:11px;color:var(--text3);line-height:1.4;max-width:36ch}
.kanban-column--todo{border-top:3px solid rgba(77,160,255,.55)}
.kanban-column--doing{border-top:3px solid rgba(243,179,79,.6)}
.kanban-column--overdue{border-top:3px solid var(--color-warning-border)}
.kanban-column--done{border-top:3px solid rgba(34,196,131,.55)}
.action-card{border-left:3px solid transparent;border-radius:12px}
.action-card--todo,.action-card--col-todo{border-left-color:rgba(77,160,255,.55)}
.action-card--doing,.action-card--col-doing{border-left-color:rgba(243,179,79,.55)}
.action-card--overdue,.action-card--col-overdue{border-left-color:var(--color-warning-border)}
.action-card--done,.action-card--col-done{border-left-color:rgba(34,196,131,.5)}
.action-card--v2{
  padding:12px 12px 10px;
  margin-bottom:10px;
  background:rgba(0,0,0,.18);
  border:1px solid rgba(255,255,255,.07);
  border-left-width:3px;
}
.action-card--v2:last-child{margin-bottom:0}
.action-card__top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
.action-card__title{
  margin:0;
  font-size:14px;
  font-weight:800;
  line-height:1.35;
  letter-spacing:-.01em;
  color:var(--text);
  flex:1;
  min-width:0;
}
.action-card__prio{
  flex-shrink:0;
  font-size:10px;
  font-weight:800;
  letter-spacing:.04em;
  text-transform:uppercase;
  padding:4px 8px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.06);
  color:var(--text2);
}
.action-card__prio--danger{border-color:rgba(239,91,107,.35);background:rgba(239,91,107,.12);color:#fecaca}
.action-card__prio--warn{border-color:rgba(243,179,79,.35);background:rgba(243,179,79,.12);color:#fde68a}
.action-card__prio--info{border-color:rgba(77,160,255,.35);background:rgba(77,160,255,.1);color:#bae6fd}
.action-card__prio--neutral{border-color:rgba(148,163,184,.2);background:rgba(255,255,255,.04);color:var(--text3)}
.action-card__prio--ok{border-color:rgba(34,196,131,.35);background:rgba(34,196,131,.12);color:#a7f3d0}
.action-card__status{
  display:inline-block;
  font-size:10px;
  font-weight:800;
  letter-spacing:.06em;
  text-transform:uppercase;
  padding:4px 10px;
  border-radius:999px;
  margin-bottom:10px;
  border:1px solid rgba(255,255,255,.1);
  color:var(--text2);
}
.action-card__status--todo{background:rgba(77,160,255,.1);color:#bae6fd}
.action-card__status--doing{background:rgba(243,179,79,.12);color:#fde68a}
.action-card__status--overdue{background:var(--color-warning-bg);color:var(--color-text-warning);border-color:var(--color-warning-border)}
.action-card__status--done{background:rgba(34,196,131,.12);color:#a7f3d0}
.action-card__meta{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.action-card__meta-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:12px;line-height:1.35}
.action-card__meta-k{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);flex-shrink:0}
.action-card__meta-v{color:var(--text2);text-align:right;min-width:0;word-break:break-word}
.action-card__meta-v--late{color:var(--color-text-warning);font-weight:800}
.action-card__quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.action-card__quick-btn{
  font-family:inherit;
  font-size:11px;
  font-weight:700;
  padding:6px 10px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.05);
  color:var(--text);
  cursor:pointer;
  transition:background .15s ease,border-color .15s ease;
}
.action-card__quick-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.18)}
.action-card__quick-btn:disabled{opacity:.45;cursor:not-allowed}
.action-card__quick-btn--primary{border-color:var(--color-primary-border);background:var(--color-primary-bg);color:var(--color-primary-text)}
.action-card__assign-wrap{margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,.08)}
.action-card__assign-label{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:4px}
.action-card__field{font-size:12px;color:var(--text2);margin-bottom:6px}
.action-card__label{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:2px}
.action-card__value{display:block;margin-top:2px}
.action-card__field--due .action-card__value{font-size:13px;font-weight:800;color:var(--text)}
.action-card__assign-select{width:100%;margin-top:0;padding:8px 10px;font-size:12px;font-weight:600;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:var(--text)}
.action-detail-dialog{
  border:none;
  border-radius:18px;
  padding:0;
  max-width:min(520px,94vw);
  background:var(--surface,#151821);
  color:var(--text);
  box-shadow:0 24px 80px rgba(0,0,0,.45);
}
.action-detail-dialog::backdrop{background:rgba(0,0,0,.55);backdrop-filter:blur(4px)}
.action-detail-dialog__inner{padding:22px 22px 18px;max-height:min(88vh,720px);overflow-y:auto}
.action-detail-dialog__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.action-detail-dialog__title{margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.02em;line-height:1.25;flex:1;min-width:0}
.action-detail-dialog__badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.action-detail-dialog__pill{
  font-size:10px;
  font-weight:800;
  letter-spacing:.05em;
  text-transform:uppercase;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
}
.action-detail-dialog__pill--danger{background:rgba(239,91,107,.15);color:#fecaca;border-color:rgba(239,91,107,.3)}
.action-detail-dialog__pill--warn{background:rgba(243,179,79,.15);color:#fde68a;border-color:rgba(243,179,79,.3)}
.action-detail-dialog__pill--info{background:rgba(77,160,255,.12);color:#bae6fd;border-color:rgba(77,160,255,.28)}
.action-detail-dialog__pill--ok{background:rgba(34,196,131,.12);color:#a7f3d0;border-color:rgba(34,196,131,.28)}
.action-detail-type-badge{
  display:inline-block;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;
  letter-spacing:.02em;
}
.action-detail-type-badge--corrective{
  border:1px solid rgba(248,113,113,.35);background:rgba(248,113,113,.12);color:#fecaca;
}
.action-detail-type-badge--preventive{
  border:1px solid rgba(45,212,191,.4);background:rgba(45,212,191,.12);color:#99f6e4;
}
.action-detail-type-badge--improvement{
  border:1px solid rgba(129,140,248,.4);background:rgba(129,140,248,.14);color:#c7d2fe;
}
.action-detail-dialog__grid{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:6px 14px;
  font-size:13px;
  margin:0 0 16px;
}
.action-detail-dialog__grid dt{margin:0;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.action-detail-dialog__grid dd{margin:0;color:var(--text2);word-break:break-word}
.action-detail-dialog__id{font-size:12px;font-weight:600;color:var(--text)}
.action-detail-dialog__api code{font-size:11px;word-break:break-all;color:var(--text3)}
.action-detail-dialog__block{margin-bottom:16px}
.action-detail-dialog__block-label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.action-detail-dialog__detail{margin:0;font-size:13px;line-height:1.5;color:var(--text2);white-space:pre-wrap}
.action-detail-dialog__foot{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;padding-top:4px;border-top:1px solid rgba(255,255,255,.06)}
.action-detail-dialog--pilotage .action-detail-dialog__grid--pilotage{grid-template-columns:140px 1fr}
.action-detail-dialog--pilotage .action-detail-dialog__grid--links{font-size:12px}
.action-detail-dialog__prio-badge-host{margin-bottom:10px}
.action-detail-prio-vis{
  display:inline-block;font-size:10px;font-weight:800;padding:4px 10px;border-radius:999px;
  border:1px solid rgba(148,163,184,.2);
}
.action-detail-prio-vis--basse{color:var(--text3);background:rgba(148,163,184,.1)}
.action-detail-prio-vis--normale{color:#bae6fd;background:rgba(77,160,255,.12);border-color:rgba(77,160,255,.25)}
.action-detail-prio-vis--haute{color:#fde68a;background:rgba(245,158,11,.14);border-color:rgba(245,158,11,.3)}
.action-detail-prio-vis--critique{color:#fecaca;background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.3)}
.action-detail-dialog__comments,.action-detail-dialog__history{
  margin:0 0 10px;padding-left:1.1em;font-size:12px;line-height:1.45;color:var(--text2);max-height:140px;overflow:auto;
}
.action-detail-dialog__comment-li,.action-detail-dialog__hist-li{margin-bottom:8px}
.action-detail-dialog__comment-meta{display:block;font-size:10px;color:var(--text3);margin-bottom:4px}
.action-detail-dialog__empty-li{list-style:none;margin-left:-1em;color:var(--text3);font-style:italic}
.action-detail-dialog__textarea{
  width:100%;margin-bottom:8px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);
  background:rgba(0,0,0,.25);color:var(--text);font:inherit;font-size:12px;resize:vertical;min-height:52px;
}
.action-detail-dialog__comment-form .btn--sm{padding:6px 12px;font-size:11px}
.action-detail-dialog__field-input{
  width:100%;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:var(--text);font-size:12px;
}
.action-detail-dialog__range{width:min(220px,100%);accent-color:#2dd4bf}
.action-detail-dialog__range-val{margin-left:8px;font-size:12px;font-weight:700;color:var(--text2)}
.action-detail-dialog--edit .action-detail-dialog__textarea{border-color:rgba(45,212,191,.35)}
.action-create-dialog{border:none;border-radius:16px;max-width:min(520px,94vw);padding:0;background:var(--bg,#0f172a);color:var(--text);box-shadow:0 24px 48px rgba(0,0,0,.5)}
.action-create-dialog::backdrop{background:rgba(0,0,0,.55);backdrop-filter:blur(3px)}
.action-create-dialog__inner{padding:20px 22px 22px;max-height:min(90vh,880px);overflow:auto}
.action-create-dialog__title{margin:0 0 8px;font-size:17px;font-weight:800}
.action-create-dialog__lead{margin:0 0 14px;font-size:12px;line-height:1.45;color:var(--text3)}
.action-create-dialog__form{display:grid;gap:12px}
.action-create-dialog__form label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;color:var(--text3)}
.action-create-dialog__form input,.action-create-dialog__form select,.action-create-dialog__form textarea{
  padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:var(--text);font:inherit;font-size:13px;
}
.action-create-dialog__ia-row{margin:4px 0}
.action-create-dialog__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
.actions-filter-toolbar{margin-top:12px;display:flex;flex-direction:column;gap:10px;align-items:stretch}
.actions-filter-toolbar__primary{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-end}
.actions-filter-toolbar .actions-filter-group{display:flex;flex-direction:column;gap:4px;min-width:min(200px,100%)}
.actions-filter-toolbar label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.actions-filter-toolbar select{padding:8px 10px;font-size:12px;font-weight:600;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:var(--text);min-width:180px;max-width:100%}
.actions-filter-toolbar .actions-filter-prevention-btn{font-size:12px;font-weight:700;padding:8px 14px;min-height:38px;align-self:flex-end}
.actions-filter-prevention-btn--on{
  border-color:rgba(45,212,191,.45)!important;
  background:rgba(45,212,191,.12)!important;
  color:#99f6e4!important;
  box-shadow:0 0 0 1px rgba(45,212,191,.2);
}

/* —— Plan d’actions premium : KPI, filtres compacts, Kanban aéré, cartes menu ⋯ —— */
.page-stack--actions-premium{gap:1.35rem}
.actions-page__main-card{padding:20px 22px 26px}
.actions-page__kpi-host{margin-top:12px}
.actions-page__summary{
  margin:12px 0 0;
  font-size:13px;
  line-height:1.45;
  color:var(--text2);
  max-width:62ch;
}
.actions-page__kpi-host .qhse-kpi-strip{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
@media (max-width:1100px){
  .actions-page__kpi-host .qhse-kpi-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:520px){
  .actions-page__kpi-host .qhse-kpi-strip{grid-template-columns:1fr}
}
.actions-page__kpi-host .metric-card{padding:12px 14px;border-radius:14px}
.actions-page__kpi-host .qhse-kpi-strip > .metric-card:first-child{
  box-shadow:0 0 0 1px rgba(248,113,113,.35),0 6px 20px rgba(220,38,38,.12);
}
.actions-page__kpi-host .metric-value{font-size:24px}
.actions-page__kpi-host .metric-note{font-size:10px;line-height:1.35;margin-top:4px}
.actions-filter-toolbar--premium{
  margin-top:16px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.14);
}
.actions-filter-toolbar--premium .actions-filter-toolbar__primary{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px 12px;
}
.actions-filter-toolbar--premium .actions-filter-group{
  flex:1 1 min(200px,100%);
  min-width:0;
  flex-direction:row;
  align-items:center;
  gap:8px;
  margin:0;
}
.actions-filter-toolbar--premium label{
  flex-shrink:0;
  margin:0;
  white-space:nowrap;
}
.actions-filter-toolbar--premium select{
  flex:1;
  min-width:0;
  max-width:none;
  padding:7px 10px;
  font-size:12px;
}
@media (max-width:900px){
  .actions-filter-toolbar--premium .actions-filter-group{flex:1 1 calc(50% - 8px)}
}
@media (max-width:520px){
  .actions-filter-toolbar--premium .actions-filter-group{flex:1 1 100%}
}
.actions-page__board-host{margin-top:18px}

.kanban-board--pilotage-premium{margin-top:8px;gap:16px}
.kanban-column--pilotage-premium{
  padding:12px 12px 14px;
  border-radius:12px;
  min-height:120px;
}
.kanban-column--pilotage-premium .kanban-column-head{
  margin-bottom:10px;
  padding-bottom:8px;
}
.kanban-column--pilotage-premium .kanban-column-title{font-size:10px}
.kanban-column--pilotage-premium .kanban-column-hint{
  font-size:11px;
  line-height:1.4;
  color:var(--text3);
  margin:6px 0 0;
  max-width:none;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.kanban-column-empty{
  margin:0;
  padding:10px 8px 4px;
  font-size:12px;
  line-height:1.45;
  color:var(--text3);
  font-style:italic;
}
.kanban-column--pilotage-premium.kanban-column--overdue{
  border-color:rgba(239,91,107,.28);
  box-shadow:inset 0 0 0 1px rgba(239,91,107,.1),0 4px 20px rgba(220,38,38,.08);
}
.kanban-column--pilotage-premium.kanban-column--drag-over{
  outline:2px dashed rgba(45,212,191,.5);
  background:rgba(45,212,191,.07);
}

.action-card--premium{
  padding:11px 11px 10px;
  margin-bottom:10px;
  cursor:pointer;
  transition:transform .18s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease;
}
.action-card--premium:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 28px rgba(0,0,0,.28);
  border-color:rgba(255,255,255,.12);
  background:rgba(255,255,255,.04);
}
.action-card--premium.action-card--critical-accent{
  border-color:rgba(251,113,133,.45)!important;
  box-shadow:0 0 0 1px rgba(251,113,133,.2),0 4px 22px rgba(220,38,38,.2);
}
.action-card--premium.action-card--critical-accent:hover{
  box-shadow:0 0 0 1px rgba(251,113,133,.35),0 12px 32px rgba(220,38,38,.25);
}
.action-card--premium.action-card--dnd-ready{cursor:pointer}
.action-card--premium.action-card--dnd-ready:active{cursor:pointer}

.action-card__premium-head{
  display:flex;align-items:flex-start;justify-content:flex-end;gap:8px;margin-bottom:6px;flex-wrap:wrap;
}
.action-card__premium-head .action-card__title{flex:1 1 120px;min-width:0}
.action-card--premium .action-card__title{font-size:13px;line-height:1.3;margin:0}
.action-card__prio-badge{
  font-size:8px;font-weight:800;padding:2px 7px;border-radius:6px;letter-spacing:.02em;white-space:nowrap;align-self:flex-start;
}
.action-card__prio-badge--low{border:1px solid rgba(148,163,184,.25);background:rgba(148,163,184,.1);color:var(--text3)}
.action-card__prio-badge--norm{border:1px solid rgba(77,160,255,.3);background:rgba(77,160,255,.12);color:#bae6fd}
.action-card__prio-badge--high{border:1px solid rgba(245,158,11,.35);background:rgba(245,158,11,.14);color:#fde68a}
.action-card__prio-badge--crit{border:1px solid rgba(239,68,68,.4);background:rgba(239,68,68,.15);color:#fecaca}
.action-card__type-badge{
  font-size:8px;font-weight:800;padding:2px 6px;border-radius:6px;letter-spacing:.04em;
  white-space:nowrap;flex-shrink:0;text-transform:uppercase;
}
.action-card__type-badge--corrective{
  border:1px solid rgba(248,113,113,.35);background:rgba(248,113,113,.12);color:#fecaca;
}
.action-card__type-badge--preventive{
  border:1px solid rgba(45,212,191,.4);background:rgba(45,212,191,.12);color:#99f6e4;
}
.action-card__type-badge--improvement{
  border:1px solid rgba(129,140,248,.4);background:rgba(129,140,248,.14);color:#c7d2fe;
}
.action-card__premium-meta-left{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
.action-card--due-soon{box-shadow:inset 0 0 0 1px rgba(245,158,11,.28)!important}
.action-card--no-assignee{box-shadow:inset 0 0 0 1px rgba(168,85,247,.3)!important}
@keyframes action-card-pulse-late{
  0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}
  50%{box-shadow:0 0 0 1px rgba(239,68,68,.4),0 4px 18px rgba(220,38,38,.18)}
}
.action-card--pulse-late{animation:action-card-pulse-late 1.85s ease-in-out infinite}

.action-card__menu{position:relative;flex-shrink:0}
.action-card__menu-trigger{
  display:grid;place-items:center;
  width:30px;height:30px;padding:0;margin:0;
  border-radius:9px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(0,0,0,.2);
  color:var(--text2);
  font-size:18px;line-height:1;
  font-weight:700;
  cursor:pointer;
  transition:background .15s ease,border-color .15s ease,color .15s ease;
}
.action-card__menu-trigger:hover{background:rgba(255,255,255,.08);color:var(--text);border-color:rgba(255,255,255,.16)}
.action-card__menu-panel{
  position:absolute;
  top:100%;right:0;margin-top:4px;
  min-width:188px;
  padding:6px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.12);
  background:linear-gradient(165deg,rgba(22,26,38,.98),rgba(15,18,28,.97));
  box-shadow:0 16px 40px rgba(0,0,0,.45);
  z-index:20;
}
.action-card__menu-item{
  display:block;width:100%;
  text-align:left;
  font-family:inherit;font-size:12px;font-weight:600;
  padding:8px 10px;margin:0;
  border:none;border-radius:8px;
  background:transparent;color:var(--text);
  cursor:pointer;
  transition:background .12s ease;
}
.action-card__menu-item:hover:not(:disabled){background:rgba(255,255,255,.08)}
.action-card__menu-item:disabled{opacity:.45;cursor:not-allowed}
.action-card__menu-assign{
  margin-top:6px;padding-top:8px;
  border-top:1px solid rgba(255,255,255,.08);
}
.action-card__menu-assign-label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:4px}
.action-card__menu-assign-select{
  width:100%;padding:7px 8px;font-size:11px;font-weight:600;
  border-radius:8px;border:1px solid rgba(255,255,255,.12);
  background:rgba(0,0,0,.3);color:var(--text);
}

.action-card__premium-meta{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  margin-bottom:5px;
  min-width:0;
  padding:5px 0 2px;
  border-top:1px solid rgba(255,255,255,.06);
}
.action-card__premium-meta .action-card__status{
  margin-bottom:0;
  flex:0 1 auto;
  min-width:0;
  max-width:56%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:9px;
  padding:3px 8px;
}
.action-card__due-compact{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:5px;
  flex-shrink:0;
  max-width:44%;
  font-size:11px;
  font-weight:700;
  color:var(--text2);
  font-variant-numeric:tabular-nums;
}
.action-card__due-compact-date{white-space:nowrap}
.action-card__due-compact--late .action-card__due-compact-date{
  color:var(--color-text-warning);
  font-weight:800;
}
.action-card__due-badge--mini{
  flex-shrink:0;
  font-size:8px;
  font-weight:800;
  letter-spacing:.04em;
  text-transform:uppercase;
  padding:2px 6px;
  border-radius:999px;
  background:rgba(239,91,107,.28);
  color:#fecaca;
  border:1px solid rgba(239,91,107,.45);
}

.action-card--late-strong .action-card__due-compact--late .action-card__due-compact-date{
  text-decoration:underline;
  text-underline-offset:2px;
}

.action-card__owner-lite{
  margin:0;
  font-size:11px;font-weight:600;color:var(--text3);
  line-height:1.35;
  padding-left:1px;
}
.action-card__owner-lite::before{
  content:'Resp. ';
  font-weight:700;
  color:var(--text3);
  opacity:.75;
}

@media (prefers-reduced-motion:reduce){
  .action-card--premium{transition:none}
  .action-card--premium:hover{transform:none}
}

.risk-register-row{
  border-radius:14px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.035);
  padding:16px 18px;
  border-left-width:4px;
  border-left-style:solid;
  transition:background .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.risk-register-row:hover{
  background:rgba(255,255,255,.055);
  border-color:rgba(255,255,255,.11);
  box-shadow:0 4px 20px rgba(0,0,0,.12);
}
.risk-register-row--red{border-left-color:rgba(239,91,107,.45)}
.risk-register-row--amber{border-left-color:rgba(243,179,79,.45)}
.risk-register-row--blue{border-left-color:rgba(77,160,255,.45)}
.risk-register-row__head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:10px}
.risk-register-row__title{font-size:15px;line-height:1.3}
.risk-register-row__badge{font-size:11px;font-weight:800}
.risk-register-row__crit{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}
.risk-register-row__gp{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:.02em;color:var(--text)}
.risk-register-row__score{font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.08);color:var(--text2)}
.risk-register-row__tier-chip{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12)}
.risk-register-row__tier-chip--t1,.risk-register-row__tier-chip--t2{background:rgba(34,196,131,.15);color:#b6f0d2}
.risk-register-row__tier-chip--t3{background:rgba(243,179,79,.22);color:#fde68a}
.risk-register-row__tier-chip--t4{background:rgba(255,144,70,.22);color:#fed7aa}
.risk-register-row__tier-chip--t5{background:rgba(239,91,107,.22);color:#fecaca}
.risk-register-row__crit-fallback{font-size:12px;font-weight:600;color:var(--text2)}
.risk-register-row__crit-hint{font-size:11px;color:var(--text3);line-height:1.4;flex:1 1 100%}
.risk-register-row__desc{margin:10px 0 0;font-size:13px;line-height:1.45;color:var(--text2)}
.risks-create-dialog{border:none;border-radius:18px;padding:0;max-width:min(560px,94vw);background:var(--surface,#151821);color:var(--text);box-shadow:0 24px 80px rgba(0,0,0,.45)}
.risks-create-dialog::backdrop{background:rgba(0,0,0,.55);backdrop-filter:blur(4px)}
.risks-create-dialog__inner{padding:22px 22px 18px;max-height:min(88vh,720px);overflow-y:auto;-webkit-overflow-scrolling:touch}
.risks-create-dialog__head{margin:0 0 6px;font-size:18px;font-weight:800;letter-spacing:-.02em}
.risks-create-dialog__lead{margin:0 0 16px;font-size:13px;line-height:1.45;color:var(--text2);max-width:52ch}
.risks-form-grid{display:grid;gap:12px}
.risks-form-grid label{display:flex;flex-direction:column;gap:5px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.risks-form-grid input,.risks-form-grid select,.risks-form-grid textarea{padding:10px 12px;font-size:13px;font-weight:600;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:var(--text);width:100%;box-sizing:border-box;font-family:inherit}
.risks-form-grid textarea{min-height:88px;resize:vertical;line-height:1.45}
.risks-form-actions-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}
.risks-form-actions-row .btn{min-height:42px}
.risks-ai-panel{margin-top:14px;padding:14px 14px 12px;border-radius:12px;border:1px dashed rgba(77,160,255,.35);background:rgba(77,160,255,.06)}
.risks-ai-panel[hidden]{display:none!important}
.risks-ai-panel__disclaimer{margin:0 0 10px;font-size:11px;line-height:1.4;color:var(--text2);font-weight:600}
.risks-ai-panel__list{margin:0;padding-left:18px;font-size:12px;line-height:1.45;color:var(--text2)}
.risks-ai-panel__list li{margin-bottom:4px}
.risks-ai-panel__kv{display:grid;gap:6px;margin-bottom:10px;font-size:12px}
.risks-ai-panel__kv span{color:var(--text3);font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.06em}
.risks-ai-panel__kv strong{color:var(--text);font-weight:700}
.risks-ai-panel__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.risks-ai-panel--loading{opacity:.72;pointer-events:none}
.risk-matrix-panel{display:flex;flex-direction:column;gap:1.35rem;width:100%}
.risk-matrix-panel--embedded{gap:.95rem}
.risk-matrix-panel--embedded .risk-matrix-tool{
  padding:12px 14px 12px;
  gap:.85rem;
  border-radius:12px;
}
.risk-matrix-panel--embedded .risk-matrix-priority-row{gap:8px}
.risk-matrix-panel--embedded .risk-matrix-priority-card{padding:10px 12px;gap:10px}
.risk-matrix-panel--embedded .risk-matrix-priority-card__value{font-size:18px}
.risk-matrix-panel--embedded .risk-matrix-hotspot-chip{padding:7px 11px;font-size:11px}
.risk-matrix-panel--embedded .risk-matrix-grid{
  gap:6px;
  grid-template-rows:auto repeat(5,minmax(40px,1fr));
}
.risk-matrix-panel--embedded .risk-matrix-cell{min-height:40px;padding:4px;border-radius:10px}
.risk-matrix-panel--embedded .risk-matrix-cell__count{font-size:15px}
.risk-matrix-panel--embedded .risk-matrix-grid__colhead{padding:6px 2px 8px;font-size:11px}
.risk-matrix-panel--embedded .risk-matrix-grid__rowhead{font-size:11px;padding-right:8px}
.risk-matrix-panel--embedded .risk-matrix-legend{padding-top:8px;margin-top:4px}
.risk-matrix-tool{
  display:flex;
  flex-direction:column;
  gap:1.1rem;
  padding:18px 18px 16px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(0,0,0,.14);
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.risk-matrix-tool__head{margin:0}
.risk-matrix-tool__title{display:block;font-size:13px;font-weight:800;letter-spacing:.02em;margin-bottom:8px;color:var(--text)}
.risk-matrix-tool__lede{margin:0;font-size:12px;line-height:1.55;color:var(--text2);max-width:56ch}
.risk-matrix-priority-row{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(132px,1fr));
  gap:10px;
}
.risk-matrix-priority-card{
  display:flex;
  align-items:flex-start;
  gap:12px;
  padding:12px 14px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.03);
}
.risk-matrix-priority-card__value{
  font-size:22px;
  font-weight:800;
  line-height:1;
  font-variant-numeric:tabular-nums;
  flex-shrink:0;
  min-width:1.5ch;
}
.risk-matrix-priority-card__text{display:flex;flex-direction:column;gap:3px;min-width:0}
.risk-matrix-priority-card__label{font-size:12px;font-weight:800;color:var(--text)}
.risk-matrix-priority-card__hint{font-size:10px;line-height:1.35;color:var(--text3)}
.risk-matrix-priority-card--crit .risk-matrix-priority-card__value{color:#fca5a5}
.risk-matrix-priority-card--crit{border-color:rgba(239,91,107,.25);background:rgba(239,91,107,.06)}
.risk-matrix-priority-card--warn .risk-matrix-priority-card__value{color:#fcd34d}
.risk-matrix-priority-card--warn{border-color:rgba(243,179,79,.22);background:rgba(243,179,79,.06)}
.risk-matrix-priority-card--ok .risk-matrix-priority-card__value{color:#86efac}
.risk-matrix-priority-card--ok{border-color:rgba(34,196,131,.2);background:rgba(34,196,131,.05)}
.risk-matrix-priority-card--muted .risk-matrix-priority-card__value{color:var(--text3)}
.risk-matrix-priority-card--muted{opacity:.92}
.risk-matrix-hotspots-section__label{
  font-size:10px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--text3);
  margin-bottom:10px;
}
.risk-matrix-hotspots{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}
.risk-matrix-hotspots-empty{margin:0;font-size:12px;line-height:1.5;color:var(--text2);max-width:48ch}
.risk-matrix-hotspot-chip{
  display:inline-flex;
  flex-wrap:wrap;
  align-items:baseline;
  gap:6px 10px;
  padding:10px 14px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.06);
  color:var(--text);
  font-family:inherit;
  font-size:12px;
  cursor:pointer;
  transition:background .15s ease,transform .12s ease,box-shadow .15s ease;
  text-align:left;
}
.risk-matrix-hotspot-chip:hover{background:rgba(255,255,255,.1);transform:translateY(-1px)}
.risk-matrix-hotspot-chip--active{
  box-shadow:0 0 0 2px rgba(88,166,255,.65);
  border-color:rgba(88,166,255,.4);
}
.risk-matrix-hotspot-chip__gp{font-weight:800;font-variant-numeric:tabular-nums}
.risk-matrix-hotspot-chip__mid strong{font-size:13px}
.risk-matrix-hotspot-chip__score{font-size:10px;font-weight:700;opacity:.75}
.risk-matrix-hotspot-chip--t1{background:rgba(34,196,131,.12)}
.risk-matrix-hotspot-chip--t2{background:rgba(110,205,100,.14)}
.risk-matrix-hotspot-chip--t3{background:rgba(243,179,79,.16)}
.risk-matrix-hotspot-chip--t4{background:rgba(255,144,70,.18)}
.risk-matrix-hotspot-chip--t5{background:rgba(239,91,107,.18)}
.risk-matrix-status-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:10px 14px;
  padding-top:4px;
}
.risk-matrix-panel__stats{margin:0;font-size:12px;font-weight:600;color:var(--text2);line-height:1.45;flex:1;min-width:12rem}
.risk-matrix-panel__reset{font-size:12px;font-weight:700;padding:8px 14px;min-height:40px;white-space:nowrap}
.risk-matrix-grid-wrap{margin-top:4px}
.risk-matrix-grid-wrap__label{
  font-size:11px;
  font-weight:800;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--text3);
  margin-bottom:12px;
}
.risk-matrix-grid-wrap__hint{
  font-weight:600;
  text-transform:none;
  letter-spacing:0;
  color:var(--text3);
  font-size:11px;
}
.risk-matrix-grid{
  display:grid;
  grid-template-columns:minmax(40px,auto) repeat(5,minmax(0,1fr));
  grid-template-rows:auto repeat(5,minmax(56px,1fr));
  gap:10px;
  align-items:stretch;
  width:100%;
  max-width:100%;
}
.risk-matrix-grid__corner{
  grid-column:1;
  grid-row:1;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  gap:6px;
  padding:6px 8px 12px 0;
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
  color:var(--text3);
  line-height:1.2;
}
.risk-matrix-grid__colhead{
  grid-row:1;
  font-size:12px;
  font-weight:800;
  text-align:center;
  color:var(--text2);
  padding:10px 4px 14px;
  display:flex;
  align-items:flex-end;
  justify-content:center;
}
.risk-matrix-grid__rowhead{
  grid-column:1;
  font-size:12px;
  font-weight:800;
  text-align:right;
  color:var(--text2);
  display:flex;
  align-items:center;
  justify-content:flex-end;
  padding-right:12px;
}
.risk-matrix-cell{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:4px;
  border:none;
  border-radius:12px;
  font-family:inherit;
  color:var(--text);
  cursor:pointer;
  transition:transform .12s ease,box-shadow .15s ease,opacity .15s ease;
  border:1px solid rgba(255,255,255,.08);
  min-height:56px;
  padding:8px;
}
.risk-matrix-cell__count{font-size:20px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}
.risk-matrix-cell:focus-visible{outline:2px solid rgba(77,160,255,.75);outline-offset:2px}
.risk-matrix-cell--empty{
  opacity:.28;
  cursor:default;
  border-style:dashed;
  border-color:rgba(255,255,255,.06);
}
.risk-matrix-cell--empty.risk-matrix-cell--active{opacity:.55;cursor:pointer}
.risk-matrix-cell--has-data{cursor:pointer;opacity:1}
.risk-matrix-cell--has-data:hover{
  transform:translateY(-1px);
  box-shadow:0 4px 16px rgba(0,0,0,.22);
  border-color:rgba(255,255,255,.16);
  filter:brightness(1.06);
}
.risk-matrix-panel--embedded .risk-matrix-cell--has-data:hover{transform:translateY(-1px) scale(1.02)}
.risk-matrix-cell--active{
  box-shadow:0 0 0 2px rgba(88,166,255,.75),0 6px 18px rgba(0,0,0,.2);
  z-index:1;
  opacity:1!important;
  border-color:rgba(88,166,255,.4);
}
.risk-matrix-cell--t1{background:rgba(34,196,131,.14)}
.risk-matrix-cell--t2{background:rgba(110,205,100,.16)}
.risk-matrix-cell--t3{background:rgba(243,179,79,.2)}
.risk-matrix-cell--t4{background:rgba(255,144,70,.22)}
.risk-matrix-cell--t5{background:rgba(239,91,107,.24)}
.risk-matrix-legend{margin-top:6px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
.risk-matrix-legend__compact{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-size:11px;
  color:var(--text3);
}
.risk-matrix-legend__compact-label{margin-right:4px;font-weight:700}
.risk-matrix-legend__sw{
  display:inline-grid;
  place-items:center;
  width:22px;
  height:22px;
  border-radius:6px;
  font-size:9px;
  font-weight:800;
  color:rgba(0,0,0,.75);
}
.risk-matrix-legend__sw--1{background:linear-gradient(148deg,rgba(52,211,153,.88),rgba(34,197,94,.5) 50%,rgba(0,0,0,.2))}
.risk-matrix-legend__sw--2{background:linear-gradient(148deg,rgba(251,191,36,.92),rgba(245,158,11,.52) 48%,rgba(0,0,0,.18))}
.risk-matrix-legend__sw--3{background:linear-gradient(148deg,rgba(129,140,248,.9),rgba(56,189,248,.42) 45%,rgba(30,27,75,.32))}
.risk-matrix-legend__sw--4{background:linear-gradient(148deg,rgba(167,139,250,.88),rgba(249,115,22,.48) 42%,rgba(40,20,30,.28))}
.risk-matrix-legend__sw--5{background:linear-gradient(148deg,rgba(252,165,165,.95),rgba(185,28,28,.72) 38%,rgba(40,10,12,.42));color:#fff;box-shadow:0 0 14px rgba(220,38,38,.4)}

/* —— Risques premium : bandeau, matrice visible, tableau, évolution, preuves, IA —— */
.risks-page--premium{gap:1.25rem}
.risks-pilot-banner-host{margin-bottom:0}
.risks-pilot-banner{
  border-radius:16px;border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(135deg,rgba(56,189,248,.08),rgba(15,23,42,.42));
  box-shadow:0 12px 36px rgba(0,0,0,.2);
}
.risks-pilot-banner__head{margin-bottom:12px}
.risks-pilot-banner__title{margin:4px 0;font-size:clamp(18px,2.2vw,22px);font-weight:800;letter-spacing:-.02em}
.risks-pilot-banner__lead{margin:0;max-width:58ch;font-size:12.5px;line-height:1.45;color:var(--text2)}
.risks-pilot-banner__kpis{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;
}
@media (max-width:900px){.risks-pilot-banner__kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:440px){.risks-pilot-banner__kpis{grid-template-columns:1fr}}
.risks-pilot-banner__kpi{
  padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.12);display:flex;flex-direction:column;gap:2px;min-width:0;
}
.risks-pilot-banner__kpi-val{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1;color:var(--text)}
.risks-pilot-banner__kpi-lbl{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.risks-pilot-banner__kpi-hint{font-size:10px;color:var(--text3);line-height:1.3}

.risks-matrix-card-prominent{
  border-radius:16px;border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(0,0,0,.1));
}
.risks-matrix-card-prominent__lead{max-width:56ch}
.risks-matrix-card-prominent__status{
  margin:0 0 12px;padding:8px 12px;border-radius:10px;border:1px solid rgba(56,189,248,.2);
  background:rgba(56,189,248,.06);font-size:12px;font-weight:600;color:var(--text2);line-height:1.45;
}
.risks-page__matrix-shell--prominent .risk-matrix-panel{width:100%}

.risk-matrix-cell__dots{
  display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-items:center;max-width:100%;
}
.risk-matrix-cell__dot{
  width:7px;height:7px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 1px rgba(0,0,0,.2);
}
.risk-matrix-cell__dot--t1{background:#4ade80}
.risk-matrix-cell__dot--t2{background:#86efac}
.risk-matrix-cell__dot--t3{background:#fbbf24}
.risk-matrix-cell__dot--t4{background:#fb923c}
.risk-matrix-cell__dot--t5{background:#f87171}
.risk-matrix-cell__dot-more{font-size:8px;font-weight:800;color:var(--text3);line-height:1}

.risks-priority-premium{margin:0}
.risks-priority-premium__card{padding-bottom:16px}
.risks-priority-premium__lead{max-width:58ch}
.risks-priority-premium__grid{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:4px;
}
@media (max-width:960px){.risks-priority-premium__grid{grid-template-columns:1fr}}
.risks-priority-premium__col{
  padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);min-width:0;
}
.risks-priority-premium__col-title{
  margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.risks-priority-premium__col-body{display:flex;flex-direction:column;gap:6px}
.risks-priority-premium__empty{margin:0;font-size:12px;color:var(--text3)}
.risks-priority-premium__line{
  display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;
  padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.1);
  color:var(--text);font:inherit;cursor:pointer;transition:border-color .15s,background .15s;
}
.risks-priority-premium__line:hover{border-color:rgba(56,189,248,.35);background:rgba(56,189,248,.06)}
.risks-priority-premium__line-title{font-size:13px;font-weight:700;line-height:1.3}
.risks-priority-premium__line-sub{font-size:11px;color:var(--text3);line-height:1.35}

.risks-insights__head--compact .risks-insights__title{font-size:1.05rem}

.risks-evolution-card__lead{max-width:56ch}
.risks-evolution-chart{
  display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px;padding:8px 4px 4px;
  min-height:140px;border-top:1px solid rgba(255,255,255,.06);margin-top:8px;
}
.risks-evolution-chart__row{
  display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;min-width:48px;max-width:72px;
}
.risks-evolution-chart__lbl{font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase}
.risks-evolution-chart__bars{
  display:flex;gap:4px;align-items:flex-end;height:100px;width:100%;justify-content:center;
}
.risks-evolution-chart__bar-wrap{
  display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;flex:1;max-width:22px;height:100%;
}
.risks-evolution-chart__bar{
  display:block;width:100%;min-height:4px;border-radius:4px 4px 2px 2px;align-self:flex-end;
}
.risks-evolution-chart__bar--crit{background:linear-gradient(180deg,rgba(239,91,107,.9),rgba(239,91,107,.45))}
.risks-evolution-chart__bar--avg{background:linear-gradient(180deg,rgba(56,189,248,.85),rgba(56,189,248,.4))}
.risks-evolution-chart__bar-val{font-size:9px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text2)}
.risks-evolution-chart__legend{
  width:100%;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:10px;
  font-size:11px;color:var(--text2);
}
.risks-evolution-chart__dot{
  display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;vertical-align:middle;
}
.risks-evolution-chart__dot--crit{background:rgba(239,91,107,.85)}
.risks-evolution-chart__dot--avg{background:rgba(56,189,248,.8)}

.risks-proofs-card__lead{max-width:52ch}
.risks-proofs-list{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.risks-proofs-item{
  display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px;padding:10px 12px;border-radius:11px;
  border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);font-size:13px;
}
.risks-proofs-item__kind{
  font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;
  border:1px solid rgba(52,211,153,.3);color:#86efac;background:rgba(52,211,153,.08);
}
.risks-proofs-item__label{color:var(--text2);line-height:1.4}

.risks-ia-premium{
  border-radius:14px;border:1px solid rgba(77,160,255,.22);
  background:linear-gradient(135deg,rgba(77,160,255,.07),rgba(168,85,247,.05));
}
.risks-ia-premium__lead{max-width:54ch}
.risks-ia-premium__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.risks-ia-premium__btn{min-height:40px}

.risks-register-premium-table{
  width:100%;max-width:100%;table-layout:fixed;
  border-collapse:separate;border-spacing:0;margin-top:10px;
  font-size:12px;border-radius:12px;overflow:hidden;border:1px solid rgba(148,163,184,.12);
}
.risks-register-premium-table thead th{
  text-align:left;padding:10px 10px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  color:var(--text3);background:rgba(0,0,0,.2);border-bottom:1px solid rgba(148,163,184,.1);
  vertical-align:bottom;
}
.risks-register-premium-table thead th:nth-child(3),
.risks-register-premium-table thead th:nth-child(4),
.risks-register-premium-table thead th:nth-child(6){text-align:center}
.risks-register-premium-table tbody td{
  padding:10px 10px;vertical-align:top;border-bottom:1px solid rgba(148,163,184,.06);
  word-break:break-word;overflow-wrap:anywhere;min-width:0;
}
.risks-register-premium-table tbody tr:last-child td{border-bottom:none}
.risk-register-table-row{cursor:pointer;transition:background .12s}
.risk-register-table-row:hover{background:rgba(255,255,255,.04)}
.risk-register-table-row--open{background:rgba(56,189,248,.06)}
.risk-register-table-row--red td{border-left:3px solid rgba(239,91,107,.4)}
.risk-register-table-row--amber td{border-left:3px solid rgba(243,179,79,.35)}
.risk-register-table-row--blue td{border-left:3px solid rgba(77,160,255,.35)}
.risk-register-table-row__name{min-width:0}
.risk-register-table-row__title{
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;
  overflow:hidden;font-size:13px;font-weight:700;line-height:1.35;
}
.risk-register-table-row__desc-clamp{
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-size:11px;color:var(--text3);line-height:1.35;
}
.risk-register-table-row__num{text-align:center;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text2)}
.risk-register-table-row__crit{text-align:left}
.risk-register-table-row__crit-label{display:block;font-weight:700;color:var(--text);font-size:12px;line-height:1.25}
.risk-register-table-row__crit-score{display:block;margin-top:3px;font-size:10px;font-weight:700;color:var(--text3)}
.risk-register-table-row__crit-na{font-size:11px;color:var(--text3);line-height:1.3}
.risk-register-table-row__owner{color:var(--text2);line-height:1.35;font-size:11.5px}
.risk-register-table-row__action{min-width:0}
.risk-register-table-row__act-ref{display:block;font-weight:800;font-size:11px;color:var(--text);line-height:1.3}
.risk-register-table-row__act-meta{display:block;font-size:10px;color:var(--text3);margin-top:3px;line-height:1.35}
.risk-register-table-row__status{text-align:center}
.risk-register-table-row__status .risk-register-table-row__badge,
.risk-register-table-row__status .badge{
  display:inline-block;max-width:100%;white-space:normal!important;text-align:center;
  line-height:1.25;padding:4px 8px;font-size:10px;
}
.risk-register-table-row--detail td{background:rgba(0,0,0,.12)}
.risk-register-table-row__detail-cell{padding:12px 14px!important}
.risk-register-table-row__suivi{font-size:12px;line-height:1.45;color:var(--text2)}
.risk-register-table-row__suivi-lbl{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-right:6px}
.risk-register-table-row__conformite-hint{margin:8px 0 0;font-size:11px;color:var(--text3);line-height:1.4;font-style:italic}
.risks-page__list-empty-td{padding:0!important;border:none!important}
.risks-page__list-empty-td .risks-page__list-empty{padding:24px 16px;text-align:center}

.risks-register-premium-table__body{display:table-row-group}
.risks-register-col--risk{width:26%}
.risks-register-col--crit{width:11%}
.risks-register-col--gp{width:6%}
.risks-register-col--status{width:13%}
.risks-register-col--owner{width:16%}
.risks-register-col--action{width:28%}
@media (max-width:1100px){
  .risks-register-premium-table{font-size:11px}
}

/* —— Matrice G×P premium : gradients, heatmap, tooltips, axes —— */
.risks-matrix-card-prominent .risk-matrix-grid-wrap{margin-top:4px;padding-bottom:6px}
.risk-matrix-grid--premium{
  grid-template-columns:minmax(56px,auto) repeat(5,minmax(0,1fr));
  grid-template-rows:auto repeat(5,minmax(76px,1fr));
  gap:12px;
  padding:10px 6px 14px;
}
@keyframes risk-matrix-cell-in{
  from{opacity:0;transform:scale(0.9) translateY(4px)}
  to{opacity:1;transform:scale(1) translateY(0)}
}
.risk-matrix-cell--premium{
  position:relative;
  overflow:hidden;
  min-height:76px!important;
  padding:10px 8px!important;
  border-radius:14px!important;
  animation:risk-matrix-cell-in .5s cubic-bezier(.22,1,.36,1) backwards;
  animation-delay:calc(var(--rm-stagger, 0) * 1s);
  transition:transform .22s ease,box-shadow .25s ease,filter .22s ease,border-color .22s ease;
}
.risk-matrix-cell--premium > *{position:relative;z-index:1}
.risk-matrix-cell--premium.risk-matrix-cell--has-data:hover{
  transform:translateY(-4px) scale(1.045);
  z-index:4;
  box-shadow:0 14px 36px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.14);
  filter:brightness(1.09)saturate(1.05);
}
.risk-matrix-panel--embedded .risk-matrix-cell--premium.risk-matrix-cell--has-data:hover{
  transform:translateY(-4px) scale(1.05);
}
.risk-matrix-cell--premium.risk-matrix-cell--empty:hover{
  transform:none;
  filter:none;
}
.risk-matrix-cell--premium::after{
  content:'';
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  z-index:0;
  opacity:calc(0.08 + 0.52 * var(--rm-heat, 0));
  background:radial-gradient(ellipse 80% 80% at 30% 20%,rgba(255,255,255,.45),transparent 55%);
  mix-blend-mode:overlay;
  transition:opacity .4s ease;
}
.risk-matrix-cell--premium.risk-matrix-cell--empty::after{opacity:0}

.risk-matrix-grid--premium .risk-matrix-cell--t1{
  background:linear-gradient(148deg,rgba(52,211,153,.42),rgba(34,197,94,.15) 50%,rgba(0,0,0,.12))!important;
  border-color:rgba(52,211,153,.38)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t2{
  background:linear-gradient(148deg,rgba(251,191,36,.44),rgba(245,158,11,.18) 48%,rgba(0,0,0,.12))!important;
  border-color:rgba(251,191,36,.42)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t3{
  background:linear-gradient(148deg,rgba(129,140,248,.48),rgba(56,189,248,.22) 45%,rgba(30,27,75,.18))!important;
  border-color:rgba(129,140,248,.48)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t4{
  background:linear-gradient(148deg,rgba(167,139,250,.46),rgba(249,115,22,.24) 42%,rgba(40,20,30,.16))!important;
  border-color:rgba(192,132,252,.42)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t5{
  background:linear-gradient(148deg,rgba(252,165,165,.5),rgba(185,28,28,.38) 38%,rgba(40,10,12,.28))!important;
  border-color:rgba(248,113,113,.55)!important;
  box-shadow:inset 0 0 28px rgba(248,113,113,.18),0 0 22px rgba(220,38,38,.28);
}
.risk-matrix-grid--premium .risk-matrix-cell--t5.risk-matrix-cell--has-data{
  box-shadow:inset 0 0 26px rgba(248,113,113,.22),0 0 32px rgba(220,38,38,.38),0 6px 20px rgba(0,0,0,.28);
}
.risk-matrix-grid--premium .risk-matrix-cell--active{
  box-shadow:0 0 0 2px rgba(96,165,250,.95),0 10px 32px rgba(56,189,248,.28)!important;
  z-index:5!important;
}

.risk-matrix-cell__score{
  font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  color:var(--text3);opacity:.88;line-height:1;margin-bottom:2px;
}
.risk-matrix-cell__mid{
  display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;
}
.risk-matrix-grid--premium .risk-matrix-cell__count{
  font-size:20px!important;
  text-shadow:0 2px 12px rgba(0,0,0,.35);
}
.risk-matrix-cell__trend{
  font-size:15px;font-weight:800;line-height:1;
  filter:drop-shadow(0 1px 4px rgba(0,0,0,.4));
}
.risk-matrix-cell__trend--muted{opacity:.3;font-size:13px;font-weight:600}

.risk-matrix-grid__colhead--premium,.risk-matrix-grid__rowhead--premium{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  padding:12px 8px!important;
  background:linear-gradient(180deg,rgba(0,0,0,.22),rgba(0,0,0,.12));
  border-radius:11px;
  border:1px solid rgba(148,163,184,.14);
}
.risk-matrix-grid__rowhead--premium{align-items:flex-end;padding-right:12px!important}
.risk-matrix-grid__axis-main{font-size:13px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.risk-matrix-grid__axis-sub{
  font-size:9px;font-weight:700;color:var(--text3);line-height:1.2;text-align:center;max-width:7.5rem;
}
.risk-matrix-grid__corner--premium{
  display:flex!important;flex-direction:column;justify-content:flex-end!important;gap:6px!important;
  padding:10px 10px 14px 0!important;
}
.risk-matrix-grid__corner--premium .risk-matrix-grid__corner-g,
.risk-matrix-grid__corner--premium .risk-matrix-grid__corner-p{
  display:flex;flex-direction:column;gap:2px;font-size:10px;font-weight:800;letter-spacing:.04em;color:var(--text2);
  text-transform:uppercase;
}
.risk-matrix-grid--premium .risk-matrix-grid__corner--premium small{
  font-weight:600;color:var(--text3);font-size:8px;text-transform:none;letter-spacing:0;
}

.risk-matrix-cell-tooltip{
  position:absolute;
  z-index:50;
  min-width:210px;
  max-width:280px;
  padding:12px 14px;
  border-radius:14px;
  border:1px solid rgba(125,211,252,.22);
  background:linear-gradient(165deg,rgba(15,23,42,.98),rgba(30,41,59,.96));
  box-shadow:0 24px 56px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.07);
  pointer-events:auto;
  animation:risk-matrix-tooltip-in .24s ease;
}
@keyframes risk-matrix-tooltip-in{
  from{opacity:0;transform:translateY(8px) scale(.98)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
.risk-matrix-cell-tooltip__title{display:block;font-size:14px;font-weight:800;margin-bottom:4px;color:var(--text)}
.risk-matrix-cell-tooltip__meta{display:block;font-size:11px;color:var(--text2);margin-bottom:8px;line-height:1.4}
.risk-matrix-cell-tooltip__preview-kicker{
  display:block;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--text3);margin:6px 0 4px;
}
.risk-matrix-cell-tooltip__count{
  display:block;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#93c5fd;margin-bottom:6px;
}
.risk-matrix-cell-tooltip__list{margin:0;padding-left:1.1em;font-size:11px;line-height:1.45;color:var(--text2);max-height:128px;overflow:auto}
.risk-matrix-cell-tooltip__hint{
  display:block;margin-top:10px;font-size:10px;line-height:1.4;color:var(--text3);
  border-top:1px solid rgba(255,255,255,.08);padding-top:8px;
}
.risk-matrix-cell-tooltip__empty{font-size:11px;color:var(--text3);line-height:1.45}

/* —— Risques : hub QHSE premium (KPI, matrice héro, analyse, détail fiche) —— */
.risks-pilot-banner--qhse-hub .risks-pilot-banner__head{margin-bottom:14px}
.risks-pilot-banner__kpis--four{
  grid-template-columns:repeat(4,minmax(0,1fr));
}
@media (max-width:960px){
  .risks-pilot-banner__kpis--four{grid-template-columns:repeat(2,minmax(0,1fr))}
}
.risks-pilot-banner__kpi--crit{
  border-color:rgba(239,91,107,.22)!important;
  background:linear-gradient(165deg,rgba(239,91,107,.08),rgba(0,0,0,.06))!important;
}
.risks-pilot-banner__kpi--crit .risks-pilot-banner__kpi-val{color:#fecaca}
.risks-pilot-banner__kpi--elev{
  border-color:rgba(243,179,79,.22)!important;
  background:linear-gradient(165deg,rgba(243,179,79,.07),rgba(0,0,0,.05))!important;
}
.risks-pilot-banner__kpi--elev .risks-pilot-banner__kpi-val{color:#fde68a}
.risks-pilot-banner__kpi--ok{
  border-color:rgba(34,197,94,.2)!important;
  background:linear-gradient(165deg,rgba(34,197,94,.07),rgba(0,0,0,.05))!important;
}
.risks-pilot-banner__kpi--ok .risks-pilot-banner__kpi-val{color:#bbf7d0}
.risks-pilot-banner__kpi--action{
  border-color:rgba(148,163,184,.25)!important;
  background:linear-gradient(165deg,rgba(148,163,184,.08),rgba(0,0,0,.05))!important;
}
.risks-page__matrix-section--hero .risks-matrix-card-prominent{
  padding-bottom:20px;
  border:1px solid rgba(255,255,255,.1);
  background:linear-gradient(175deg,rgba(255,255,255,.055) 0%,rgba(255,255,255,.02) 55%,rgba(0,0,0,.04) 100%);
  box-shadow:0 18px 48px rgba(0,0,0,.22),0 1px 0 rgba(255,255,255,.05) inset;
}
[data-theme='dark'] .risks-page__matrix-section--hero .risks-matrix-card-prominent{
  border-color:rgba(240,246,252,.12);
  background:linear-gradient(175deg,rgba(36,48,64,.75) 0%,rgba(20,26,36,.55) 100%);
}
.risk-matrix-grid--premium .risk-matrix-cell--t1{
  background:linear-gradient(150deg,rgba(16,185,129,.28),rgba(5,150,105,.16) 52%,rgba(2,6,23,.1))!important;
  border-color:rgba(16,185,129,.5)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t2{
  background:linear-gradient(150deg,rgba(14,165,233,.26),rgba(6,182,212,.15) 52%,rgba(2,6,23,.1))!important;
  border-color:rgba(14,165,233,.45)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t3{
  background:linear-gradient(150deg,rgba(245,158,11,.3),rgba(217,119,6,.18) 52%,rgba(2,6,23,.1))!important;
  border-color:rgba(245,158,11,.5)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t4{
  background:linear-gradient(150deg,rgba(249,115,22,.34),rgba(234,88,12,.2) 52%,rgba(2,6,23,.12))!important;
  border-color:rgba(249,115,22,.55)!important;
}
.risk-matrix-grid--premium .risk-matrix-cell--t5{
  background:linear-gradient(150deg,rgba(239,68,68,.4),rgba(190,24,93,.24) 52%,rgba(2,6,23,.14))!important;
  border-color:rgba(239,68,68,.65)!important;
  box-shadow:inset 0 0 26px rgba(239,68,68,.2),0 0 18px rgba(220,38,38,.22);
}
.risk-matrix-grid--premium .risk-matrix-cell--has-data{
  transition:transform .2s ease,box-shadow .2s ease,filter .2s ease,background .2s ease;
}
.risk-matrix-grid--premium .risk-matrix-cell--has-data:hover{
  transform:translateY(-2px) scale(1.03);
  box-shadow:0 10px 28px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.08);
  filter:brightness(1.06);
}
.risk-matrix-grid--premium .risk-matrix-cell--t1.risk-matrix-cell--has-data:hover{
  box-shadow:0 12px 28px rgba(6,95,70,.35),0 0 0 1px rgba(52,211,153,.35);
}
.risk-matrix-grid--premium .risk-matrix-cell--t2.risk-matrix-cell--has-data:hover{
  box-shadow:0 12px 28px rgba(12,74,110,.35),0 0 0 1px rgba(56,189,248,.35);
}
.risk-matrix-grid--premium .risk-matrix-cell--t3.risk-matrix-cell--has-data:hover{
  box-shadow:0 12px 28px rgba(120,53,15,.36),0 0 0 1px rgba(251,191,36,.4);
}
.risk-matrix-grid--premium .risk-matrix-cell--t4.risk-matrix-cell--has-data:hover{
  box-shadow:0 12px 28px rgba(124,45,18,.38),0 0 0 1px rgba(251,146,60,.42);
}
.risk-matrix-grid--premium .risk-matrix-cell--t5.risk-matrix-cell--has-data:hover{
  box-shadow:0 14px 30px rgba(127,29,29,.42),0 0 0 1px rgba(252,165,165,.45),0 0 24px rgba(220,38,38,.28);
}
.risks-analysis-premium{margin:0;min-width:0}
.risks-analysis-premium__card{min-width:0}
.risks-analysis-premium__lead{max-width:62ch}
.risks-analysis-premium__list{
  margin:0;padding:0 0 4px;list-style:none;
  display:flex;flex-direction:column;gap:10px;
}
.risks-analysis-premium__item{
  font-size:13px;line-height:1.45;color:var(--text2);
  padding:10px 14px;border-radius:12px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.08);
}
.risks-analysis-premium__item--info{border-left:3px solid rgba(56,189,248,.55)}
.risks-analysis-premium__item--warn{border-left:3px solid rgba(243,179,79,.65)}
.risks-analysis-premium__item--err{border-left:3px solid rgba(239,91,107,.65);background:rgba(239,91,107,.05)}
.risk-detail-premium{
  display:grid;gap:14px;
  grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
}
.risk-detail-premium__section{
  padding:12px 14px;border-radius:12px;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(0,0,0,.12);
  min-width:0;
}
.risk-detail-premium__section-title{
  margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.risk-detail-premium__section-body{font-size:12.5px;line-height:1.5;color:var(--text2)}
.risk-detail-premium__empty{margin:0;font-style:italic;color:var(--text3);font-size:12px}
.risk-detail-premium__action-line{margin:0 0 8px;color:var(--text2)}
.risk-detail-premium__mesures{
  margin:0;padding:10px 12px;border-radius:10px;
  font-family:inherit;font-size:11.5px;line-height:1.45;white-space:pre-wrap;
  background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.06);color:var(--text2);
}
.risk-detail-premium__inc-list{margin:0;padding-left:1.1em}
.risk-detail-premium__inc-item{margin-bottom:6px;color:var(--text2);font-size:12px}
.risk-detail-premium__inc-ref{font-weight:800;color:var(--text);margin-right:8px}
.risk-detail-premium__inc-meta{font-size:11px;color:var(--text3)}
.risk-detail-premium__conformite-hint{
  grid-column:1/-1;margin:4px 0 0;font-size:11px;color:var(--text3);line-height:1.4;font-style:italic;
}
.risks-ia-premium__result{
  margin-top:14px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(77,160,255,.22);
  background:rgba(77,160,255,.06);
}
.risks-ia-premium__result[hidden]{display:none!important}
.risks-ia-premium__result-title{display:block;font-size:13px;font-weight:800;margin-bottom:10px;color:var(--text)}
.risks-ia-premium__result-list{margin:0;padding-left:1.2em;font-size:12.5px;line-height:1.5;color:var(--text2)}
.risks-ia-premium__result-hint{margin:12px 0 0;font-size:11px;color:var(--text3);line-height:1.4}
.risk-register-table-row__gp{
  text-align:center;font-weight:800;font-variant-numeric:tabular-nums;font-size:12px;color:var(--text);
  white-space:nowrap;
}
.risk-register-table-row__act-owner{
  display:block;font-size:10px;color:var(--text3);margin-top:3px;
}
.risk-register-table-row__act-nav{
  display:block;margin-top:6px;width:100%;text-align:left;
  font-family:inherit;font-size:10px;font-weight:700;
  padding:4px 0;border:none;background:none;cursor:pointer;
  color:#7dd3fc;text-decoration:underline;text-underline-offset:3px;
}
.risk-register-table-row__act-nav:hover{color:#bae6fd}
.risk-register-table-row__act-hint{
  display:block;font-size:10px;color:var(--text3);margin-top:4px;font-style:italic;
}
.risks-register-premium-table__caption{
  caption-side:top;text-align:left;
  font-size:11px;font-weight:600;color:var(--text3);
  padding:0 0 10px;line-height:1.4;
}
.risks-page__secondary{
  border-radius:16px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.06);
  overflow:hidden;
}
.risks-page__secondary-summary{
  cursor:pointer;
  list-style:none;
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:14px 18px;
  font-size:13px;font-weight:700;color:var(--text2);
}
.risks-page__secondary-summary::-webkit-details-marker{display:none}
.risks-page__secondary-summary::marker{content:''}
.risks-page__secondary-summary:hover{background:rgba(255,255,255,.04)}
.risks-page__secondary-title{color:var(--text)}
.risks-page__secondary-badge{
  font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;
  border:1px solid rgba(255,255,255,.12);color:var(--text3);
}
.risks-page__secondary-body{
  padding:0 18px 16px;
  display:flex;flex-direction:column;gap:1rem;
  border-top:1px solid rgba(255,255,255,.06);
}
.risk-detail-premium__nav-btn{
  margin-top:10px;
  font-family:inherit;font-size:11px;font-weight:700;
  padding:8px 14px;border-radius:10px;cursor:pointer;
  border:1px solid rgba(77,160,255,.35);
  background:rgba(77,160,255,.1);color:#bae6fd;
}
.risk-detail-premium__nav-btn:hover{background:rgba(77,160,255,.16)}
.risk-detail-premium__scope-note{
  margin:10px 0 0;font-size:10px;line-height:1.4;color:var(--text3);font-style:italic;
}

.risks-pilot-banner__kpi--click{
  cursor:pointer;text-align:left;font-family:inherit;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.12);border-radius:12px;padding:10px 12px;transition:border-color .15s ease,background .15s ease;
}
.risks-pilot-banner__kpi--click:hover{border-color:rgba(45,212,191,.28);background:rgba(0,0,0,.2)}
.risks-pilot-banner__kpi--filter-on{
  outline:2px solid rgba(45,212,191,.45);outline-offset:2px;
}
.risk-register-table-row--pulse-crit{
  animation:risk-row-pulse-crit 1.8s ease-in-out infinite;
}
@keyframes risk-row-pulse-crit{
  0%,100%{box-shadow:inset 0 0 0 0 rgba(239,68,68,0)}
  50%{box-shadow:inset 5px 0 0 0 rgba(239,68,68,.5)}
}
.risk-register-table-row--warn-derive{background:rgba(245,158,11,.07)!important}
.risk-register-table-row--no-action{background:rgba(251,191,36,.05)!important}
.risk-register-table-row--pulse-soft{
  animation:risk-row-pulse-soft 2.4s ease-in-out infinite;
}
@keyframes risk-row-pulse-soft{
  0%,100%{box-shadow:inset 0 0 0 0 rgba(245,158,11,0)}
  50%{box-shadow:inset 4px 0 0 0 rgba(245,158,11,.32)}
}
.risk-register-table-row--stale-update{opacity:.93}
.risk-register-table-row__stale-badge{
  display:inline-block;margin-top:6px;margin-left:6px;font-size:9px;font-weight:800;padding:2px 6px;border-radius:6px;
  background:rgba(234,179,8,.22);color:#fde68a;
}
.risk-register-table-row__type-tag{
  display:block;margin-top:4px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);
}
.risk-register-table-row__derive-badge{
  display:inline-block;margin-top:6px;font-size:9px;font-weight:800;padding:2px 6px;border-radius:6px;
  background:rgba(245,158,11,.22);color:#fde68a;
}
.risk-register-table-row__gxp-abbr{cursor:help;text-decoration:dotted underline rgba(148,163,184,.45);text-underline-offset:2px}
.risks-form-confirm-row{display:flex;align-items:flex-start;gap:10px;font-size:12px;color:var(--text2);margin-top:10px;line-height:1.45}
.risks-form-confirm-row input{margin-top:3px;accent-color:#2dd4bf}
.risk-matrix-cell-tooltip__list li.risk-matrix-cell-tooltip__preview{font-weight:800;color:var(--text)}

@media (prefers-reduced-motion:reduce){
  .risk-matrix-cell--premium{animation:none}
  .risk-matrix-cell-tooltip{animation:none}
  .risk-matrix-cell--premium.risk-matrix-cell--has-data:hover{transform:none}
  .risk-matrix-grid--premium .risk-matrix-cell--has-data:hover{transform:none;filter:none;box-shadow:none}
  .risk-register-table-row--pulse-crit{animation:none;box-shadow:inset 4px 0 0 0 rgba(239,68,68,.45)}
  .risk-register-table-row--pulse-soft{animation:none;box-shadow:inset 3px 0 0 0 rgba(245,158,11,.28)}
  .action-card--pulse-late{animation:none}
}

/* Mode clair : bandeaux pilotage risques / cartes KPI sur fond papier */
html[data-theme='light'] .risks-pilot-banner__kpi{
  background:#f9fafb;
  border-color:rgba(15,23,42,.1);
}
html[data-theme='light'] .risks-pilot-banner__kpi-lbl,
html[data-theme='light'] .risks-pilot-banner__kpi-hint{
  color:#6b7280;
}
html[data-theme='light'] .risks-pilot-banner__kpi-val{
  color:#111827;
}
html[data-theme='light'] .metric-card--kpi-click:not(.dashboard-kpi-card){
  background:#f9fafb;
  border-color:rgba(15,23,42,.1);
}
html[data-theme='light'] .metric-card--kpi-click:not(.dashboard-kpi-card) .metric-label{
  color:#6b7280;
  opacity:1;
}
html[data-theme='light'] .metric-card--kpi-click:not(.dashboard-kpi-card) .metric-value{
  color:#111827;
}

/* —— Mode clair : surfaces, filets et pastilles (risques, actions, matrices, kanban) —— */
html[data-theme='light'] .risks-page__kpi,
html[data-theme='light'] .risks-page__insights{
  border-color:var(--color-border-tertiary);
  background:var(--surface-2);
  box-shadow:var(--shadow-sm);
}
html[data-theme='light'] .risks-insights__kpi-item{
  border-color:var(--color-border-tertiary);
  background:var(--surface-3);
}
html[data-theme='light'] .risks-insights__kpi-item--alert .risks-insights__kpi-value{
  color:var(--color-danger-text);
}
html[data-theme='light'] .risks-insights__bar{
  background:var(--surface-3);
  border-color:var(--color-border-tertiary);
}
html[data-theme='light'] .risks-insights__tier-row{
  border-bottom-color:var(--color-border-tertiary);
}
html[data-theme='light'] .risks-tier-pill{
  border-color:var(--color-border-tertiary);
  background:var(--surface-3);
  color:var(--text-secondary);
}
html[data-theme='light'] .risks-tier-pill:hover{
  background:var(--surface-4);
  border-color:var(--color-border-secondary,var(--color-border));
  color:var(--text-primary);
}
html[data-theme='light'] .risks-tier-pill--active{
  border-color:var(--color-info-border);
  background:var(--color-info-bg);
  color:var(--color-info-text);
  box-shadow:none;
}
html[data-theme='light'] .action-card__prio--danger,
html[data-theme='light'] .action-detail-dialog__pill--danger,
html[data-theme='light'] .action-detail-prio-vis--critique,
html[data-theme='light'] .action-card__prio-badge--crit{
  color:var(--color-danger-text);
  background:var(--color-danger-bg);
  border-color:var(--color-danger-border);
}
html[data-theme='light'] .action-card__prio--warn,
html[data-theme='light'] .action-detail-dialog__pill--warn,
html[data-theme='light'] .action-detail-prio-vis--haute,
html[data-theme='light'] .action-card__prio-badge--high{
  color:var(--color-warning-text);
  background:var(--color-warning-bg);
  border-color:var(--color-warning-border);
}
html[data-theme='light'] .action-card__prio--info,
html[data-theme='light'] .action-card__status--todo,
html[data-theme='light'] .action-detail-dialog__pill--info,
html[data-theme='light'] .action-detail-prio-vis--normale,
html[data-theme='light'] .action-card__prio-badge--norm{
  color:var(--color-info-text);
  background:var(--color-info-bg);
  border-color:var(--color-info-border);
}
html[data-theme='light'] .action-card__status--doing{
  color:var(--color-warning-text);
  background:var(--color-warning-bg);
  border-color:var(--color-warning-border);
}
html[data-theme='light'] .action-card__prio--neutral{
  border-color:var(--color-border-tertiary);
  background:var(--surface-3);
  color:var(--text-secondary);
}
html[data-theme='light'] .action-detail-dialog__foot,
html[data-theme='light'] .kanban-column-head,
html[data-theme='light'] .risk-matrix-legend,
html[data-theme='light'] .risks-page__secondary-summary{
  border-color:var(--color-border-tertiary);
}
html[data-theme='light'] .risk-register-row__tier-chip--t3,
html[data-theme='light'] .risk-register-table-row__stale-badge,
html[data-theme='light'] .risk-register-table-row__derive-badge{
  color:var(--color-warning-text);
  background:var(--color-warning-bg);
  border-color:var(--color-warning-border);
}
html[data-theme='light'] .risk-register-row__tier-chip--t5{
  color:var(--color-danger-text);
  background:var(--color-danger-bg);
  border-color:var(--color-danger-border);
}
html[data-theme='light'] .risk-matrix-priority-card--ok .risk-matrix-priority-card__value{
  color:var(--color-success-text);
}
html[data-theme='light'] .risk-matrix-cell__dot--t2{
  background:var(--color-success);
}
html[data-theme='light'] .risk-register-table-row__act-nav{
  color:var(--color-primary-text);
}
html[data-theme='light'] .risk-register-table-row__act-nav:hover{
  color:var(--palette-primary,var(--color-primary));
}
html[data-theme='light'] .risks-pilot-banner__kpi--crit .risks-pilot-banner__kpi-val{
  color:var(--color-danger-text);
}
html[data-theme='light'] .risks-pilot-banner__kpi--elev .risks-pilot-banner__kpi-val{
  color:var(--color-warning-text);
}
html[data-theme='light'] .risk-matrix-details__summary:hover,
html[data-theme='light'] .risk-register-table-row:hover,
html[data-theme='light'] .risks-page__secondary-summary:hover{
  background:var(--surface-3);
}
html[data-theme='light'] .kanban-column--pilotage{
  border-color:var(--color-border-tertiary);
  background:var(--surface-2);
  box-shadow:none;
}
`;

export function ensureQhsePilotageStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
