const STYLE_ID = 'qhse-audit-plus-styles';

const CSS = `
.audit-plus-page .audit-kpi-strip{margin-bottom:14px}
.audit-last-card .audit-last-lead{margin:0}
.audit-plan-card{margin-bottom:14px}
.audit-plan-table-wrap{overflow-x:auto;margin-top:10px;border-radius:12px;border:1px solid rgba(148,163,184,.1)}
.audit-plan-table{min-width:640px;display:grid;gap:0}
.audit-plan-head,.audit-plan-row{display:grid;grid-template-columns:minmax(100px,0.9fr) minmax(120px,1.1fr) minmax(100px,0.85fr) minmax(90px,0.75fr) minmax(100px,0.9fr);gap:8px;padding:10px 12px;align-items:center;font-size:12px}
.audit-plan-head{font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);background:rgba(0,0,0,.18);border-bottom:1px solid rgba(148,163,184,.12)}
.audit-plan-row{border-bottom:1px solid rgba(148,163,184,.08)}
.audit-plan-row:last-child{border-bottom:none}
.audit-plan-ref{font-weight:700;color:var(--text)}
.audit-plan-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;justify-content:flex-end}
.audit-last-progress{margin-top:14px}
.audit-last-progress-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:12px;color:var(--text2)}
.audit-progress-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.audit-progress-bar > span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(77,160,255,.9),rgba(52,211,153,.85))}
.audit-last-status-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.audit-last-status-row .badge{font-size:11px}
.audit-field-panel{margin-top:14px;padding:0;border-radius:14px;border:1px solid rgba(77,160,255,.22);background:rgba(77,160,255,.04);overflow:hidden}
.audit-field-panel[hidden]{display:none!important}
.audit-field-panel-head{padding:14px 16px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.12)}
.audit-field-panel-head h4{margin:0 0 4px;font-size:15px;font-weight:800}
.audit-field-panel-head p{margin:0;font-size:13px;color:var(--text2);line-height:1.45}
.audit-field-stack{padding:14px 16px;display:grid;gap:12px}
.audit-field-item{border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);padding:12px 14px}
.audit-field-item__title{margin:0 0 10px;font-size:14px;font-weight:700;line-height:1.35;color:var(--text)}
.audit-field-toggles{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.audit-field-toggles button{min-height:38px;padding:0 14px;border-radius:10px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15);color:var(--text);font-size:12px;font-weight:700;cursor:pointer}
.audit-field-toggles button.is-on.conforme{border-color:rgba(52,211,153,.45)!important;background:rgba(52,211,153,.12)!important;color:#86efac!important}
.audit-field-toggles button.is-on.nonconforme{border-color:rgba(239,91,107,.45)!important;background:rgba(239,91,107,.1)!important;color:#fecaca!important}
.audit-field-comment{width:100%;min-height:56px;padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.18);background:rgba(0,0,0,.2);color:var(--text);font-size:13px;resize:vertical;box-sizing:border-box}
.audit-nc-block{margin-top:14px;padding:14px 16px;border-top:1px solid rgba(148,163,184,.1);background:rgba(239,91,107,.05)}
.audit-nc-block h5{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fecaca}
.audit-nc-list{display:grid;gap:10px}
.audit-nc-card{border-radius:12px;border:1px solid rgba(239,91,107,.35);background:rgba(0,0,0,.2);padding:12px 14px;display:grid;gap:8px}
.audit-nc-card__ref{font-size:11px;font-weight:800;letter-spacing:.06em;color:#fca5a5}
.audit-nc-card__text{font-size:13px;line-height:1.45;color:var(--text2);margin:0}
.audit-nc-card__actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.audit-main-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:14px;align-items:center}
/* Cockpit audit premium */
.audit-cockpit-hero{
  border-radius:18px;border:1px solid rgba(125,211,252,.22);
  background:linear-gradient(165deg,rgba(56,189,248,.1),rgba(255,255,255,.03) 40%,rgba(8,12,20,.45) 100%);
  box-shadow:0 20px 50px rgba(0,0,0,.25),0 1px 0 rgba(255,255,255,.06) inset;
  margin-bottom:16px;padding:22px 24px 24px;
}
.audit-cockpit-hero .content-card-head{margin-bottom:0}
.audit-cockpit-hero__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;align-items:center}
.audit-cockpit-hero__stats{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px;
}
.audit-cockpit-hero__stats--five{
  grid-template-columns:repeat(5,minmax(0,1fr));
}
.audit-cockpit-hero__stats--four{
  grid-template-columns:repeat(4,minmax(0,1fr));
}
@media (max-width:1100px){.audit-cockpit-hero__stats--five{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:1000px){.audit-cockpit-hero__stats--four{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:900px){.audit-cockpit-hero__stats{grid-template-columns:repeat(2,1fr)}}
@media (max-width:900px){.audit-cockpit-hero__stats--five{grid-template-columns:repeat(2,1fr)}}
@media (max-width:480px){.audit-cockpit-hero__stats{grid-template-columns:1fr}}
@media (max-width:480px){.audit-cockpit-hero__stats--five{grid-template-columns:1fr}}
@media (max-width:480px){.audit-cockpit-hero__stats--four{grid-template-columns:1fr}}
.audit-cockpit-metrics--three{
  grid-template-columns:repeat(3,minmax(0,1fr));
}
@media (max-width:720px){
  .audit-cockpit-metrics--three{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:420px){
  .audit-cockpit-metrics--three{grid-template-columns:1fr}
}
.audit-cockpit-stat{
  padding:12px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.2);
}
.audit-cockpit-stat__val{display:block;font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1.1}
.audit-cockpit-stat__lbl{display:block;margin-top:4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.audit-cockpit-main{
  border-radius:18px;border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(0,0,0,.12));
  box-shadow:0 14px 40px rgba(0,0,0,.2);margin-bottom:16px;overflow:hidden;
}
.audit-cockpit-main .content-card-head{border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:14px;margin-bottom:0}
.audit-cockpit-main__grid{
  display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:20px;padding:18px 20px 20px;
  align-items:start;
}
@media (max-width:960px){.audit-cockpit-main__grid{grid-template-columns:1fr}}
.audit-cockpit-main__aside{display:grid;gap:14px;min-width:0}
.audit-cockpit-metrics{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;
}
.audit-cockpit-metric{
  padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.15);
}
.audit-cockpit-metric span:first-child{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.audit-cockpit-metric span:last-child{display:block;margin-top:4px;font-size:17px;font-weight:800;color:var(--text)}
.audit-cockpit-cycle{margin-top:4px}
.audit-cockpit-cycle__label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin:0 0 10px}
.audit-cockpit-cycle-progress{
  margin:10px 0 0;font-size:12px;line-height:1.5;color:var(--text2);max-width:56ch;
}
.audit-cockpit-cycle-progress strong{color:#bae6fd;font-weight:700}
.audit-cockpit-stepper{display:flex;flex-wrap:wrap;gap:8px}
.audit-cockpit-step{
  flex:1;min-width:72px;padding:10px 8px;border-radius:12px;text-align:center;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.12);font-size:10px;font-weight:700;
  color:var(--text3);line-height:1.25;
}
.audit-cockpit-step--active{
  border-color:rgba(56,189,248,.45);background:rgba(56,189,248,.12);color:#bae6fd;
  box-shadow:0 0 0 1px rgba(56,189,248,.15);
}
.audit-cockpit-step--done{border-color:rgba(52,211,153,.3);color:#86efac}
.audit-cockpit-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.audit-cockpit-pill{
  font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px;border-radius:999px;
  border:1px solid rgba(148,163,184,.15);color:var(--text2);
}
.audit-cockpit-pill--on{border-color:rgba(251,191,36,.45);color:#fde68a;background:rgba(251,191,36,.08)}
.audit-cockpit-pill--ok{border-color:rgba(52,211,153,.4);color:#86efac;background:rgba(52,211,153,.06)}
.audit-cockpit-pill--wait{border-color:rgba(148,163,184,.2);color:var(--text3)}
.audit-cockpit-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06)}
.audit-cockpit-ia{
  border-radius:16px;border:1px solid rgba(168,85,247,.28);
  background:linear-gradient(135deg,rgba(168,85,247,.1),rgba(56,189,248,.06),rgba(255,255,255,.02));
  margin-bottom:16px;padding:18px 20px 20px;
}
.audit-cockpit-ia__head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:12px}
.audit-cockpit-ia__badge{
  font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px;
  color:#e9d5ff;background:rgba(168,85,247,.22);border:1px solid rgba(196,181,253,.35);
}
.audit-cockpit-ia__title{margin:0;font-size:15px;font-weight:800;color:var(--text)}
.audit-cockpit-ia__lead{margin:0 0 8px;font-size:13px;line-height:1.5;color:var(--text2);max-width:62ch}
.audit-cockpit-ia__trust{
  margin:0 0 14px;padding:10px 12px;border-radius:12px;border:1px dashed rgba(196,181,253,.25);
  background:rgba(0,0,0,.12);font-size:12px;line-height:1.5;color:var(--text3);max-width:62ch;
}
.audit-cockpit-ia__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.audit-cockpit-ia__btn{
  text-align:left;padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.15);
  background:rgba(0,0,0,.18);color:var(--text2);font-size:12px;font-weight:600;line-height:1.4;cursor:pointer;
  transition:border-color .15s,background .15s;
}
.audit-cockpit-ia__btn:hover{border-color:rgba(168,85,247,.35);background:rgba(168,85,247,.08);color:var(--text)}
.audit-cockpit-prio{
  border-radius:16px;border:1px solid rgba(248,113,113,.22);background:rgba(248,113,113,.06);
  margin-bottom:16px;padding:18px 20px;
}
.audit-cockpit-prio h4{margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#fecaca}
.audit-cockpit-prio__lead{margin:0 0 14px;font-size:12.5px;line-height:1.5;color:var(--text2);max-width:58ch}
.audit-cockpit-prio ul{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.audit-cockpit-prio li{
  display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:flex-start;
  padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.15);border:1px solid rgba(148,163,184,.08);
  font-size:13px;color:var(--text2);
}
.audit-cockpit-prio li strong{color:var(--text);font-weight:700;flex-shrink:0;max-width:42%}
.audit-cockpit-prio__detail{min-width:0;flex:1;text-align:right;line-height:1.45}
@media (max-width:600px){
  .audit-cockpit-prio li{flex-direction:column;align-items:stretch}
  .audit-cockpit-prio li strong{max-width:100%}
  .audit-cockpit-prio__detail{text-align:left}
}
.audit-constat-human{margin-bottom:14px}
.audit-constat-human .audit-checklist-row{border-radius:12px}
.audit-human-strip{
  margin-top:8px;padding:10px 12px;border-radius:12px;border:1px dashed rgba(125,211,252,.22);
  background:rgba(0,0,0,.12);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;
}
.audit-human-status{font-size:11px;font-weight:700;color:var(--text2)}
.audit-human-status--pending{color:#fde68a}
.audit-human-status--validated{color:#86efac}
.audit-human-status--adjusted{color:#7dd3fc}
.audit-human-status--rejected{color:#fecaca}
.audit-human-actions{display:flex;flex-wrap:wrap;gap:8px}
.audit-human-actions .btn{min-height:36px!important;padding:6px 12px!important;font-size:12px!important}
.audit-cockpit-proofs{margin-bottom:16px}
.audit-proof-row{
  display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;
  padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.1);margin-top:8px;
}
.audit-proof-row span:first-child{font-size:13px;font-weight:600;color:var(--text)}
.audit-proof-badge{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:8px}
.audit-proof-badge--present{color:#86efac;border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.1)}
.audit-proof-badge--missing{color:#fecaca;border:1px solid rgba(248,113,113,.4);background:rgba(248,113,113,.1)}
.audit-proof-badge--verify{color:#fde68a;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.08)}
.audit-plan-card.audit-plan-card--cockpit .audit-plan-row{padding:12px 14px}
.audit-plan-card.audit-plan-card--cockpit .audit-plan-head{padding:12px 14px}
.audit-plus-page .qhse-kpi-strip.ds-kpi-grid{
  grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:14px;margin-bottom:18px;
}
.audit-cockpit-history{
  border-radius:16px;border:1px solid rgba(148,163,184,.12);
  background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.1));
}
.audit-cockpit-history__lead{margin:6px 0 0;font-size:12.5px;line-height:1.45;max-width:52ch}
.audit-cockpit-history__trend{
  margin:12px 0 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(56,189,248,.15);
  background:rgba(56,189,248,.06);font-size:12px;line-height:1.45;color:var(--text2);
}
.audit-cockpit-layout{gap:18px}
.audit-cockpit-footer-actions{
  margin-top:18px;padding:16px 18px;border-radius:16px;border:1px solid rgba(148,163,184,.1);
  background:rgba(0,0,0,.12);justify-content:flex-end!important;
}
.audit-cockpit-checklist .content-card-head{margin-bottom:4px}
@media (max-width:900px){
  .audit-plan-head{display:none}
  .audit-plan-row{grid-template-columns:1fr;gap:6px;padding:12px}
  .audit-plan-card.audit-plan-card--cockpit .audit-plan-row span[data-label]:before{
    content:attr(data-label);display:block;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;
  }
}
/* Notifications intelligentes cockpit */
.audit-cockpit-notifs{
  border-radius:16px;border:1px solid rgba(56,189,248,.2);
  background:linear-gradient(165deg,rgba(56,189,248,.07),rgba(255,255,255,.025) 38%,rgba(8,12,20,.4) 100%);
  box-shadow:0 10px 32px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.04) inset;
  margin-bottom:0;padding:16px 18px 18px;
}
.audit-cockpit-notifs .content-card-head{margin-bottom:0}
.audit-cockpit-notifs__head{align-items:flex-start!important;gap:14px}
.audit-cockpit-notifs__lead{margin:6px 0 0;max-width:52ch;line-height:1.45;font-size:12px;color:var(--text2)}
.audit-cockpit-notifs__badges{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end}
.audit-cockpit-notifs__count,.audit-cockpit-notifs__prio{font-size:10px!important;letter-spacing:.06em}
.audit-cockpit-notifs__list{
  margin-top:12px;display:grid;gap:8px;
}
.audit-cockpit-notifs__item{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:8px 12px;
  padding:10px 12px;border-radius:12px;
  border:1px solid rgba(148,163,184,.1);
  background:rgba(0,0,0,.12);
}
.audit-cockpit-notifs__item-main{flex:1;min-width:min(100%,220px)}
.audit-cockpit-notifs__item-title{font-size:12px;font-weight:800;color:var(--text);line-height:1.3}
.audit-cockpit-notifs__item-detail{margin:4px 0 0;font-size:11px;line-height:1.45;color:var(--text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.audit-cockpit-notifs__type{font-size:9px!important;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
.audit-cockpit-notifs__empty{margin:0;padding:14px;border-radius:12px;border:1px dashed rgba(148,163,184,.2);font-size:13px;color:var(--text2)}
.audit-cockpit-notifs__ia{
  margin-top:14px;padding:12px 14px;border-radius:14px;
  border:1px dashed rgba(168,85,247,.28);background:rgba(0,0,0,.12);
  display:flex;flex-wrap:wrap;align-items:flex-start;gap:10px 14px;
}
.audit-cockpit-notifs__ia-pill{
  font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:4px 10px;border-radius:999px;
  background:rgba(168,85,247,.2);border:1px solid rgba(192,132,252,.35);color:#e9d5ff;flex-shrink:0
}
.audit-cockpit-notifs__ia-text{
  margin:0;flex:1;min-width:min(100%,200px);font-size:12px;line-height:1.5;color:var(--text3)
}
.audit-cockpit-notifs__foot{
  margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);
  display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:space-between;
}
.audit-notify-participants-btn{min-height:44px}
.audit-notify-participants-btn:disabled{opacity:.55;cursor:not-allowed}
.audit-cockpit-notifs__role-hint{
  margin:0;flex:1;min-width:min(100%,240px);font-size:11px;line-height:1.45;color:var(--text3);max-width:52ch
}

/* Cockpit stratégique : 4 tiers, hero synthèse, graphiques ISO */
.audit-cockpit-tier{
  display:flex;flex-direction:column;gap:18px;
  margin-bottom:24px;
  scroll-margin-top:1.25rem;
}
.audit-cockpit-tier:last-of-type{margin-bottom:8px}
.audit-cockpit-tier .content-card{margin-bottom:0}
.audit-cockpit-tier .audit-plan-card{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-main{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-prio{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-notifs{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-proofs{margin-bottom:0}
.audit-cockpit-tier .audit-cockpit-ia{margin-bottom:0}
.audit-cockpit-tier .audit-kpi-strip{margin-bottom:0}
.audit-cockpit-tier .audit-main-actions{margin-top:0}
.audit-cockpit-tier .audit-iso-treatment-card,
.audit-cockpit-tier .audit-iso-trace-card{margin-bottom:0}

.audit-cockpit-hero{padding:24px 26px 26px;margin-bottom:0}
.audit-cockpit-hero__prime{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,1fr);
  gap:20px 28px;
  align-items:center;
  margin-top:18px;
  padding:20px 22px;border-radius:16px;
  border:1px solid rgba(125,211,252,.2);
  background:rgba(0,0,0,.14);
}
.audit-cockpit-hero__score-block{display:flex;flex-direction:column;gap:4px}
.audit-cockpit-hero__score-val{
  font-size:clamp(34px,5.5vw,46px);font-weight:800;letter-spacing:-.04em;color:var(--text);line-height:1;
}
.audit-cockpit-hero__score-lbl{
  font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.audit-cockpit-hero__status-block{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.audit-cockpit-hero__status-line{
  margin:0;font-size:13px;line-height:1.45;color:var(--text2);max-width:44ch;
}
.audit-cockpit-hero__exec-summary{
  font-size:14px;font-weight:600;color:var(--text2);
  display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:flex-end;
}
.audit-cockpit-hero__exec-sep{opacity:.4;font-weight:400}
.audit-cockpit-hero__tagline{font-size:13px!important;line-height:1.5!important}

.audit-cockpit-hero__nav{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;
  margin-top:16px;padding-top:14px;
  border-top:1px solid rgba(255,255,255,.07);
}
.audit-cockpit-hero__nav-btn{
  margin:0;padding:6px 12px;border-radius:999px;
  border:1px solid rgba(148,163,184,.2);
  background:rgba(0,0,0,.12);
  color:var(--text2);
  font-size:12px;font-weight:600;cursor:pointer;
  transition:border-color .15s,background .15s,color .15s;
}
.audit-cockpit-hero__nav-btn:hover{
  border-color:rgba(56,189,248,.4);
  background:rgba(56,189,248,.1);
  color:#bae6fd;
}

@media (max-width:900px){
  .audit-cockpit-hero__prime{
    grid-template-columns:1fr;text-align:center;
  }
  .audit-cockpit-hero__status-block{align-items:center}
  .audit-cockpit-hero__status-line{max-width:100%}
  .audit-cockpit-hero__exec-summary{justify-content:center}
}

.audit-plus-page .two-column.audit-cockpit-charts-row{
  display:grid;grid-template-columns:1fr;gap:24px;
}

.audit-cockpit-chart-card .content-card-head{margin-bottom:4px}
.audit-cockpit-strategic-chart-body{
  display:flex;flex-direction:column;gap:20px;
  padding:20px 22px 24px!important;
}
.audit-cockpit-embed-plan-mix .dashboard-chart-interpret{
  font-size:12px;line-height:1.45;margin-top:8px;opacity:.95;
}
.audit-cockpit-embed-plan-mix .dashboard-mix-legend{
  margin-top:10px;
}

.dashboard-audit-iso-bars{display:flex;flex-direction:column;gap:14px}
.dashboard-audit-iso-bars .dashboard-chart-interpret{margin-top:4px;margin-bottom:0}
.dashboard-audit-iso-bar-row{
  display:grid;
  grid-template-columns:96px 1fr 44px;
  gap:12px;
  align-items:center;
}
.dashboard-audit-iso-bar-label{font-size:12px;font-weight:700;color:var(--text)}
.dashboard-audit-iso-bar-track{
  height:11px;border-radius:999px;
  background:rgba(255,255,255,.07);
  overflow:hidden;border:1px solid rgba(148,163,184,.14);
}
.dashboard-audit-iso-bar-fill{
  display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,rgba(56,189,248,.9),rgba(45,212,191,.75));
  min-width:3px;
}
.dashboard-audit-iso-bars > .dashboard-audit-iso-bar-row:nth-child(2) .dashboard-audit-iso-bar-fill{
  background:linear-gradient(90deg,rgba(34,197,94,.85),rgba(52,211,153,.6));
}
.dashboard-audit-iso-bars > .dashboard-audit-iso-bar-row:nth-child(3) .dashboard-audit-iso-bar-fill{
  background:linear-gradient(90deg,rgba(251,191,36,.9),rgba(249,115,22,.65));
}
.dashboard-audit-iso-bar-value{
  font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text2);text-align:right;
}
@media (max-width:520px){
  .dashboard-audit-iso-bar-row{grid-template-columns:1fr;gap:6px}
  .dashboard-audit-iso-bar-value{text-align:left}
}

.audit-cockpit-delta-strip{
  padding:10px 14px;border-radius:12px;
  border:1px solid rgba(56,189,248,.22);
  background:rgba(56,189,248,.06);
  font-size:12px;line-height:1.45;color:var(--text2);
}
.audit-cockpit-delta-strip strong{color:#7dd3fc;font-weight:800}

.audit-cockpit-embed-plan-mix{
  padding-top:6px;border-top:1px solid rgba(255,255,255,.07);
}
.audit-cockpit-embed-plan-mix__title{
  margin:0 0 14px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);
}

.audit-cockpit-ia__insight{
  margin:0 0 12px;padding:12px 16px;border-radius:14px;
  border:1px solid rgba(196,181,253,.35);
  background:rgba(168,85,247,.1);
  font-size:13px;font-weight:600;line-height:1.45;color:#e9d5ff;
}
.audit-cockpit-ia__lead{margin-top:0}

.content-card-head--tight{margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(148,163,184,.08)}
.content-card-head--tight h3{margin:0 0 4px}
.content-card-head--tight .content-card-lead{font-size:12px;margin:0;max-width:52ch;line-height:1.45}

.audit-premium-header{
  padding:14px 16px 16px;margin-bottom:0;
  border-radius:16px;border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(135deg,rgba(56,189,248,.09),rgba(15,23,42,.4));
  box-shadow:0 12px 36px rgba(0,0,0,.22);
}
.audit-premium-header__row{
  display:grid;grid-template-columns:minmax(0,1.15fr) minmax(132px,0.5fr) minmax(0,1fr);
  gap:16px 22px;align-items:center;
}
@media (max-width:900px){
  .audit-premium-header__row{grid-template-columns:1fr}
  .audit-premium-header__score{max-width:280px;margin:0 auto}
  .audit-premium-header__side{align-items:stretch}
  .audit-premium-header__nav,.audit-premium-header__ctas{justify-content:center}
}
.audit-premium-header__title{margin:4px 0;font-size:clamp(17px,2.4vw,21px);font-weight:800;letter-spacing:-.02em;line-height:1.15}
.audit-premium-header__sub{margin:0 0 10px;font-size:12px;color:var(--text2);line-height:1.4}
.audit-premium-header__status{font-size:11px}
.audit-premium-header__score{
  text-align:center;padding:10px 14px;border-radius:12px;
  border:1px solid rgba(56,189,248,.32);background:rgba(0,0,0,.22);
}
.audit-premium-header__score-val{display:block;font-size:clamp(26px,4vw,36px);font-weight:900;letter-spacing:-.04em;line-height:1;color:#7dd3fc}
.audit-premium-header__score-lbl{display:block;margin-top:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)}
.audit-premium-header__side{display:flex;flex-direction:column;gap:12px;align-items:flex-end;min-width:0}
.audit-premium-header__nav{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.audit-premium-header__ctas{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.audit-premium-header__progress-wrap{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}
.audit-premium-header__progress-top{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px}
.audit-premium-header__progress-bar{height:5px}

.audit-strategic-kpis{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0 10px;
}
@media (max-width:960px){.audit-strategic-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:480px){.audit-strategic-kpis{grid-template-columns:1fr}}
.audit-strategic-kpi{
  padding:10px 12px;border-radius:11px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.12);display:flex;flex-direction:column;gap:3px;min-width:0;
}
.audit-strategic-kpi__lbl{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.audit-strategic-kpi__val{font-size:18px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1.1}
.audit-strategic-kpi__hint{font-size:11px;color:var(--text2);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.audit-premium-chart-wrap{width:100%;margin:0}
.audit-premium-chart-card .content-card-head--tight{margin-bottom:6px}
.audit-premium-chart-sub{margin:4px 0 0;font-size:11px;line-height:1.4;color:var(--text3);max-width:44ch}
.audit-premium-chart-body{padding-top:2px}
.audit-premium-chart-body .dashboard-chart-interpret{
  font-size:11px!important;line-height:1.4!important;margin-top:6px!important;margin-bottom:0!important;
}

.audit-premium-cockpit .content-card-head{border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:12px;margin-bottom:0}
.audit-premium-cockpit__body{padding:10px 0 4px;display:flex;flex-direction:column;gap:10px}
.audit-premium-cockpit__iso{font-size:11px!important;font-weight:700!important;line-height:1.35!important;color:var(--text2)!important;white-space:normal!important}

.audit-premium-checklist-stack{gap:8px!important}
.audit-checklist-compact-top--nc{border-left:3px solid rgba(239,91,107,.45)}
.audit-checklist-compact-point{flex:1;min-width:200px;font-size:12px;font-weight:600;color:var(--text);line-height:1.45}
.audit-checklist-compact-badge{flex-shrink:0}
.audit-checklist-treat{font-size:12px;font-weight:700;padding:4px 0;min-height:auto}
.audit-human-strip--collapsible{margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.08);border:1px solid rgba(148,163,184,.1)}
.audit-human-strip--collapsible .audit-human-actions{gap:6px;flex-wrap:wrap}
.audit-human-strip--collapsible .btn.btn-secondary{font-size:11px;padding:6px 10px;min-height:36px}

.audit-premium-nc__list{margin:10px 0 0;padding-left:1.15em;line-height:1.55;font-size:13px;color:var(--text2)}
.audit-premium-nc__foot{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}

.audit-premium-proofs-groups{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:4px;
}
@media (max-width:840px){.audit-premium-proofs-groups{grid-template-columns:1fr}}
.audit-premium-proofs-col{padding:9px 11px;border-radius:10px;border:1px solid rgba(148,163,184,.11);background:rgba(0,0,0,.1);min-width:0}
.audit-premium-proofs-col--missing{border-color:rgba(239,91,107,.28)}
.audit-premium-proofs-col__title{margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.audit-premium-proofs-col__list{margin:0;padding-left:1.1em;font-size:12px;line-height:1.5;color:var(--text2)}
.audit-premium-proofs-col__empty{list-style:none;margin-left:-1.1em;font-style:italic;color:var(--text3);font-size:12px}

.audit-premium-assistant{
  padding:12px 14px 14px;border-radius:14px;
  border:1px solid rgba(168,85,247,.22);background:rgba(88,28,135,.07);
}
.audit-premium-assistant__title{margin:2px 0 4px;font-size:16px;font-weight:800;letter-spacing:-.02em}
.audit-premium-assistant__lead{margin:0;font-size:12px;color:var(--text2);max-width:58ch;line-height:1.45}
.audit-premium-assistant__insight{
  margin:8px 0 0;padding:6px 10px;border-radius:8px;
  border:1px solid rgba(196,181,253,.25);background:rgba(168,85,247,.08);
  font-size:11px;line-height:1.4;color:#e9d5ff;max-width:62ch;
}
.audit-premium-assistant__insight--empty{display:none!important;margin:0!important;padding:0!important}
.audit-premium-assistant__primary{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.audit-premium-assistant__btn-main{min-height:38px;font-size:12px}
.audit-premium-assistant__more{margin-top:10px;font-size:12px;color:var(--text2)}
.audit-premium-assistant__more summary{cursor:pointer;font-weight:700;list-style-position:outside}
.audit-premium-assistant__grid{display:flex;flex-direction:column;gap:8px}

.audit-premium-footer-actions{margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.1)}

.audit-cockpit-tier--score.audit-premium-tier{display:flex;flex-direction:column;gap:14px}
.audit-premium-history .audit-cockpit-history__trend{
  margin-top:10px;padding:8px 10px;font-size:11px;line-height:1.4;
}

/* Bandeau pilotage ISO & conformité */
.audit-iso-pilot-wrap{display:flex;flex-direction:column;gap:0}
.audit-iso-pilot-bar{
  display:flex;flex-direction:column;gap:10px;
}
.audit-iso-pilot-bar__main{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1.35fr) minmax(120px,0.42fr);
  gap:12px 16px;
  align-items:start;
}
@media (max-width:960px){
  .audit-iso-pilot-bar__main{grid-template-columns:1fr;justify-items:stretch}
  .audit-iso-pilot-bar__main .audit-premium-header__score{max-width:100%}
}
.audit-iso-pilot-bar__title-block{min-width:0}
.audit-iso-pilot-bar__meta{
  margin:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(148px,1fr));
  gap:10px 14px;
  font-size:12px;
}
.audit-iso-pilot-bar__meta-item{
  padding:6px 8px;border-radius:9px;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);
}
.audit-iso-pilot-bar__meta-item dt{
  margin:0;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.audit-iso-pilot-bar__meta-item dd{margin:4px 0 0;font-weight:600;color:var(--text);line-height:1.35}
.audit-iso-pilot-bar__footer{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;
  padding-top:10px;border-top:1px solid rgba(255,255,255,.07);
}
.audit-iso-pilot-bar__footer .audit-premium-header__nav{margin-top:0;padding-top:0;border-top:none;flex:1;min-width:min(100%,220px)}
.audit-iso-pilot-bar__footer .audit-premium-header__ctas{justify-content:flex-end}

.audit-iso-conformity-row{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0 6px;
}
@media (max-width:900px){.audit-iso-conformity-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:440px){.audit-iso-conformity-row{grid-template-columns:1fr}}
.audit-iso-conformity-card{
  padding:9px 11px;border-radius:11px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.11);display:flex;flex-direction:column;gap:2px;min-width:0;
}
.audit-iso-conformity-card--ok{border-left:3px solid rgba(52,211,153,.45)}
.audit-iso-conformity-card--partial{border-left:3px solid rgba(251,191,36,.5)}
.audit-iso-conformity-card--nc{border-left:3px solid rgba(248,113,113,.5)}
.audit-iso-conformity-card--act{border-left:3px solid rgba(56,189,248,.5)}
.audit-iso-conformity-card__lbl{font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--text3)}
.audit-iso-conformity-card__val{font-size:19px;font-weight:800;letter-spacing:-.03em;line-height:1;color:var(--text)}
.audit-iso-conformity-card__hint{font-size:10px;color:var(--text3);line-height:1.35}

.audit-iso-export-bar{
  padding:10px 12px;border-radius:12px;border:1px solid rgba(125,211,252,.16);
  background:rgba(0,0,0,.08);margin:2px 0 0;
  display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px 14px;
}
.audit-iso-export-bar__head{flex:1;min-width:min(100%,200px);margin-bottom:0}
.audit-iso-export-bar__title{
  display:block;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);
}
.audit-iso-export-bar__sub{display:block;margin-top:2px;font-size:11px;line-height:1.4;color:var(--text3);max-width:48ch}
.audit-iso-export-bar__actions{display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0}

.audit-checklist-compact-top{
  display:grid;
  grid-template-columns:minmax(0,1.2fr) auto minmax(120px,0.95fr) auto;
  gap:8px 10px;align-items:center;
  padding:8px 12px;border-radius:11px;
  border:1px solid rgba(148,163,184,.11);background:rgba(0,0,0,.1);
}
@media (max-width:720px){
  /* Lignes explicites : sinon « preuve » en 1/-1 se superpose au badge / bouton Traiter et bloque les clics */
  .audit-checklist-compact-top{
    grid-template-columns:minmax(0,1fr) auto;
    grid-template-rows:auto auto auto;
    align-items:center;
  }
  .audit-checklist-compact-point{grid-column:1/-1;grid-row:1}
  .audit-checklist-compact-badge{grid-column:1;grid-row:2;justify-self:start}
  .audit-checklist-treat{grid-column:2;grid-row:2;justify-self:end;position:relative;z-index:1}
  .audit-checklist-compact-proof{grid-column:1/-1;grid-row:3}
}
.audit-checklist-compact-proof{
  font-size:11px;color:var(--text2);line-height:1.4;
  font-style:italic;min-width:0;
}
.audit-human-validation-legend{
  margin:0 0 6px;width:100%;font-size:10px;line-height:1.4;color:var(--text3);max-width:52ch;
}

.audit-iso-treatment-card__lead,.audit-iso-trace-card__lead,.audit-premium-checklist__legend,.audit-premium-proofs__iso-lead{
  margin:4px 0 0;font-size:11px;line-height:1.4;color:var(--text3);max-width:52ch;
}

.audit-iso-treatment-table{
  margin-top:4px;border-radius:12px;border:1px solid rgba(148,163,184,.1);overflow:hidden;
}
.audit-iso-treatment-head,.audit-iso-treatment-row{
  display:grid;
  grid-template-columns:minmax(90px,0.9fr) minmax(72px,0.65fr) minmax(120px,1fr) minmax(88px,0.75fr);
  gap:6px;padding:8px 10px;align-items:center;font-size:11px;
}
.audit-iso-treatment-head{
  font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:10px;color:var(--text3);
  background:rgba(0,0,0,.16);border-bottom:1px solid rgba(148,163,184,.1);
}
.audit-iso-treatment-row{
  border-bottom:1px solid rgba(148,163,184,.07);background:rgba(0,0,0,.06);
}
.audit-iso-treatment-row:last-child{border-bottom:none}
@media (max-width:640px){
  .audit-iso-treatment-head{display:none}
  .audit-iso-treatment-row{grid-template-columns:1fr;gap:4px}
  .audit-iso-treatment-row span[data-label]:before{
    content:attr(data-label) " · ";font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);
  }
}

.audit-iso-trace-list{
  margin:6px 0 0;padding:0;list-style:none;display:grid;gap:6px;
}
.audit-iso-trace-item{
  display:grid;
  grid-template-columns:minmax(100px,0.85fr) minmax(88px,0.75fr) minmax(0,1.2fr) minmax(0,1fr);
  gap:8px;padding:8px 10px;border-radius:10px;
  border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);font-size:11px;line-height:1.35;
}
@media (max-width:800px){
  .audit-iso-trace-item{grid-template-columns:1fr 1fr}
  .audit-iso-trace-item__action,.audit-iso-trace-item__comment{grid-column:1/-1}
}
.audit-iso-trace-item__who{font-weight:800;color:var(--text)}
.audit-iso-trace-item__when{font-size:11px;color:var(--text3);font-variant-numeric:tabular-nums}
.audit-iso-trace-item__action{color:var(--text2)}
.audit-iso-trace-item__comment{font-size:11px;color:var(--text3);font-style:italic}

.audit-doc-compliance-strip{
  margin:12px 0 0;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(148,163,184,.16);background:rgba(0,0,0,.14);
}
.audit-doc-compliance-strip__inner{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px}
.audit-doc-compliance-strip__kicker{
  font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);width:100%;
}
.audit-doc-compliance-strip__text{
  flex:1;min-width:200px;margin:0;font-size:13px;line-height:1.45;color:var(--text2);
}
.audit-doc-compliance-strip__btn{font-size:12px!important;padding:8px 14px!important;min-height:36px!important}
.audit-doc-compliance-strip--bad{color:#fecaca;font-weight:700}
.audit-doc-compliance-strip--warn{color:#fcd34d;font-weight:600}

/* Contraste lecture (thème sombre) : cockpit audit & pilotage ISO */
html[data-theme='dark'] .audit-cockpit-cycle-progress strong{
  color:#e0f2fe;
}
html[data-theme='dark'] .audit-cockpit-step--active{
  color:#e0f2fe;
  border-color:rgba(56,189,248,.55);
  background:rgba(56,189,248,.18);
}
html[data-theme='dark'] .audit-cockpit-step--done{
  color:#d1fae5;
  border-color:rgba(52,211,153,.48);
}
html[data-theme='dark'] .audit-cockpit-pill--on{
  color:#fef9c3;
  background:rgba(251,191,36,.14);
  border-color:rgba(251,191,36,.52);
}
html[data-theme='dark'] .audit-cockpit-pill--ok{
  color:#d1fae5;
  border-color:rgba(52,211,153,.48);
}
html[data-theme='dark'] .audit-cockpit-pill--wait{
  color:#cbd5e1;
}
html[data-theme='dark'] .audit-cockpit-ia__badge{
  color:#faf5ff;
  background:rgba(109,40,217,.32);
  border-color:rgba(196,181,253,.48);
}
html[data-theme='dark'] .audit-cockpit-ia__insight{
  color:#f5f3ff;
  background:rgba(88,28,135,.26);
  border-color:rgba(196,181,253,.42);
}
html[data-theme='dark'] .audit-cockpit-ia__trust{
  color:#e2e8f0;
  border-color:rgba(196,181,253,.32);
}
html[data-theme='dark'] .audit-cockpit-notifs__ia-pill{
  color:#faf5ff;
  background:rgba(109,40,217,.3);
  border-color:rgba(192,132,252,.45);
}
html[data-theme='dark'] .audit-cockpit-notifs__ia-text{
  color:#e2e8f0;
}
html[data-theme='dark'] .audit-premium-header__score-val{
  color:#e0f2fe;
}
html[data-theme='dark'] .audit-premium-header__nav-btn:hover{
  color:#e0f2fe;
}
html[data-theme='dark'] .audit-cockpit-delta-strip strong{
  color:#e0f2fe;
}
html[data-theme='dark'] .audit-doc-compliance-strip__text{
  color:#e2e8f0;
}
html[data-theme='dark'] .audit-doc-compliance-strip--bad{
  color:#fecdd3;
}
html[data-theme='dark'] .audit-doc-compliance-strip--warn{
  color:#fef08a;
}
html[data-theme='dark'] .audit-iso-export-bar__sub{
  color:#cbd5e1;
}
html[data-theme='dark'] .audit-iso-conformity-card__lbl{
  color:#cbd5e1;
}
html[data-theme='dark'] .audit-iso-conformity-card__hint{
  color:#94a3b8;
}
html[data-theme='dark'] .audit-premium-assistant__insight{
  color:#f5f3ff;
  background:rgba(88,28,135,.24);
  border-color:rgba(196,181,253,.4);
}
html[data-theme='dark'] .audit-human-status--pending{
  color:#fef08a;
}
html[data-theme='dark'] .audit-human-status--validated{
  color:#a7f3d0;
}
html[data-theme='dark'] .audit-human-status--adjusted{
  color:#bae6fd;
}
html[data-theme='dark'] .audit-human-status--rejected{
  color:#fecdd3;
}
html[data-theme='dark'] .audit-field-toggles button.is-on.conforme{
  color:#d1fae5!important;
}
html[data-theme='dark'] .audit-field-toggles button.is-on.nonconforme{
  color:#fecdd3!important;
}
html[data-theme='dark'] .audit-cockpit-prio h4{
  color:#fecdd3;
}
html[data-theme='dark'] .audit-nc-block h5{
  color:#fecdd3;
}
html[data-theme='dark'] .audit-nc-card__ref{
  color:#fecdd3;
}
html[data-theme='dark'] .audit-proof-badge--present{
  color:#d1fae5;
  border-color:rgba(52,211,153,.5);
  background:rgba(52,211,153,.14);
}
html[data-theme='dark'] .audit-proof-badge--missing{
  color:#fecdd3;
  border-color:rgba(248,113,113,.5);
  background:rgba(248,113,113,.12);
}
html[data-theme='dark'] .audit-proof-badge--verify{
  color:#fef08a;
  border-color:rgba(251,191,36,.52);
  background:rgba(251,191,36,.12);
}

/* Passe premium fine : lecture plus nette et cohérente */
.audit-plus-page .audit-premium-header{border-radius:18px}
.audit-plus-page .audit-cockpit-tier{gap:12px}
.audit-plus-page .audit-plan-head,.audit-plus-page .audit-plan-row{padding:11px 13px}
.audit-plus-page .audit-iso-treatment-head,.audit-plus-page .audit-iso-treatment-row{padding:9px 11px}
.audit-plus-page .audit-cockpit-notifs__item,
.audit-plus-page .audit-iso-trace-item{border-radius:12px}

/* ── Mode clair : synthèse opérationnelle, KPI, cycle contrôle (contraste lisible) ── */
html[data-theme='light'] .audit-plus-page .audit-cockpit-metric,
html[data-theme='light'] .audit-plus-page .audit-cockpit-stat,
html[data-theme='light'] .audit-plus-page .audit-strategic-kpi,
html[data-theme='light'] .audit-plus-page .audit-iso-conformity-card{
  background:#f9fafb!important;
  border-color:rgba(15,23,42,.1)!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-metric span:first-child,
html[data-theme='light'] .audit-plus-page .audit-cockpit-stat__lbl,
html[data-theme='light'] .audit-plus-page .audit-strategic-kpi__lbl,
html[data-theme='light'] .audit-plus-page .audit-iso-conformity-card__lbl,
html[data-theme='light'] .audit-plus-page .audit-cockpit-cycle__label{
  color:#6b7280!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-metric span:last-child,
html[data-theme='light'] .audit-plus-page .audit-cockpit-stat__val,
html[data-theme='light'] .audit-plus-page .audit-strategic-kpi__val,
html[data-theme='light'] .audit-plus-page .audit-iso-conformity-card__val{
  color:#111827!important;
}
html[data-theme='light'] .audit-plus-page .audit-iso-conformity-card__hint{
  color:#6b7280!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-step{
  background:#f3f4f6!important;
  border-color:rgba(15,23,42,.12)!important;
  color:#374151!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-step--active{
  background:#1d9e75!important;
  border-color:#15803d!important;
  color:#fff!important;
  box-shadow:none!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-step--done{
  background:#ecfdf5!important;
  border-color:rgba(21,128,61,.35)!important;
  color:#166534!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-cycle-progress{
  color:#374151!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-cycle-progress strong{
  color:#0f766e!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-hero__exec-sep{
  opacity:.88!important;
}
html[data-theme='light'] .audit-plus-page .audit-cockpit-hero__exec-summary{
  color:#374151!important;
}
`;

export function ensureAuditPlusStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
