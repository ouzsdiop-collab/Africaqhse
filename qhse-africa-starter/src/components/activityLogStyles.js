const STYLE_ID = 'qhse-activity-log-styles';

const CSS = `
.activity-log-page .activity-log-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.1)}
.activity-log-page .activity-log-toolbar > span:first-child{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.activity-log-toolbar-note{font-size:13px;font-weight:600;color:var(--text2)}

.activity-log-summary{display:grid;grid-template-columns:minmax(140px,0.9fr) minmax(200px,1.4fr) minmax(140px,1fr);gap:12px;margin-bottom:14px}
@media (max-width:900px){.activity-log-summary{grid-template-columns:1fr}}
.activity-log-summary-card{border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);padding:12px 14px;display:grid;gap:6px;min-width:0}
.activity-log-summary-card--stretch{min-height:100%}
.activity-log-summary-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.activity-log-summary-v{font-size:28px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1.1}
.activity-log-summary-v--sm{font-size:15px;font-weight:700;letter-spacing:-.01em}
.activity-log-summary-h{font-size:11px;color:var(--text3);line-height:1.35}
.activity-log-summary-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:32px}
.activity-log-summary-chip{font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15)}
.activity-log-summary-empty{font-size:12px;color:var(--text3);font-style:italic}
.activity-log-summary-chip.mod-incidents{color:var(--color-text-warning);border-color:var(--color-warning-border);background:var(--color-warning-bg)}
.activity-log-summary-chip.mod-actions{color:var(--color-text-warning);border-color:var(--color-warning-border);background:var(--color-warning-bg)}
.activity-log-summary-chip.mod-audits{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-iso{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-products{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-context{color:#cbd5e1;border-color:rgba(148,163,184,.3)}
.activity-log-summary-chip.mod-ai-center{color:var(--color-primary-text);border-color:var(--color-primary-border);background:var(--color-primary-bg)}
.activity-log-summary-chip.mod-system{color:#e2e8f0;border-color:rgba(203,213,225,.25)}
.activity-log-summary-chip.mod-default{color:var(--text2)}

.activity-log-quick{margin-bottom:16px;padding:14px 16px;border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.06)}
.activity-log-quick-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:12px}
.activity-log-quick-title{font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:var(--text3)}
.activity-log-period-toggle{display:flex;flex-wrap:wrap;gap:6px}
.activity-log-chip{font-size:11px;font-weight:700;padding:6px 12px;border-radius:999px;border:1px solid rgba(148,163,184,.25);background:transparent;color:var(--text2);cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.activity-log-chip:hover{border-color:rgba(45,212,191,.4)}
.activity-log-chip--on{background:rgba(45,212,191,.15);border-color:rgba(45,212,191,.4);color:var(--text)}
.activity-log-quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.activity-log-quick-card{border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);padding:10px 12px;display:flex;flex-direction:column;gap:4px;min-width:0}
.activity-log-quick-card--alert{border-color:rgba(239,68,68,.22);background:rgba(239,68,68,.06)}
.activity-log-quick-k{font-size:10px;font-weight:700;color:var(--text3);line-height:1.3}
.activity-log-quick-v{font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1}
.activity-log-digest{margin:0 0 14px;padding:12px 14px;border-radius:12px;border-left:3px solid rgba(45,212,191,.45);background:rgba(45,212,191,.06);font-size:13px;font-weight:600;line-height:1.5;color:var(--text2)}
.activity-log-prefs{display:flex;flex-wrap:wrap;align-items:flex-start;gap:14px 20px;margin-bottom:14px;padding:12px 14px;border-radius:12px;border:1px dashed rgba(148,163,184,.22);background:rgba(0,0,0,.04)}
.activity-log-prefs-block{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;flex:1;min-width:200px}
.activity-log-prefs-k{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);width:100%}
.activity-log-prefs-select{min-width:140px}
.activity-log-prefs-check{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--text2);cursor:pointer;flex:1;min-width:200px}
.activity-log-prefs-hint{margin:0;width:100%;font-size:11px;color:var(--text3);line-height:1.4}
.activity-log-filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.1);border:1px solid rgba(148,163,184,.1)}
.activity-log-filters-k{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);align-self:center;margin-right:4px}
.activity-log-filter-field{display:flex;flex-direction:column;gap:4px;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}
.activity-log-filter-field .control-select{min-width:160px}
.activity-log-export-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.activity-log-summary-mount{margin-bottom:4px}

.activity-log-table{margin-top:4px;border-radius:14px;border:1px solid rgba(148,163,184,.12);overflow:hidden;display:flex;flex-direction:column}
.activity-log-head,.activity-log-row{display:grid;grid-template-columns:minmax(112px,1fr) minmax(130px,1.15fr) minmax(160px,1.5fr) minmax(108px,1fr) minmax(104px,.95fr);gap:12px;padding:12px 16px;align-items:start;font-size:12px}
.activity-log-empty-msg{width:100%;box-sizing:border-box;padding:28px 16px;text-align:center;font-size:13px;font-weight:600;color:var(--text3);background:rgba(0,0,0,.04);border-bottom:1px solid rgba(148,163,184,.08)}
.activity-log-head{font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);background:rgba(0,0,0,.22);border-bottom:1px solid rgba(148,163,184,.18)}
.activity-log-row{border-bottom:1px solid rgba(148,163,184,.08);position:relative}
.activity-log-row:last-child{border-bottom:none}
.activity-log-row:nth-child(even){background:rgba(255,255,255,.025)}
.activity-log-row--clickable{cursor:pointer;transition:background .15s ease,transform .12s ease,box-shadow .15s ease}
.activity-log-row--clickable:hover{background:rgba(20,184,166,.09)!important;box-shadow:inset 0 0 0 1px rgba(45,212,191,.15)}
.activity-log-row--clickable:focus-visible{outline:2px solid rgba(45,212,191,.5);outline-offset:2px}
.activity-log-kind-badge{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:999px;border:1px solid rgba(148,163,184,.2);flex-shrink:0;line-height:1.2}
.activity-log-kind-badge--create{color:#0f766e;border-color:rgba(45,212,191,.35);background:rgba(45,212,191,.12)}
.activity-log-kind-badge--modify{color:#1d4ed8;border-color:rgba(59,130,246,.35);background:rgba(59,130,246,.1)}
.activity-log-kind-badge--close{color:#b45309;border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.1)}
.activity-log-kind-badge--other{color:var(--text3);opacity:.88}
.activity-log-row--emphasis{background:rgba(20,184,166,.06)!important;border-left:3px solid rgba(20,184,166,.42);padding-left:13px;margin-left:0}
.activity-log-cell{display:flex;flex-direction:column;gap:6px;min-width:0}
.activity-log-module-badge{display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;border-radius:12px;border:1px solid rgba(148,163,184,.15);background:rgba(0,0,0,.12);max-width:100%}
.activity-log-module-short{font-size:13px;font-weight:800;letter-spacing:.06em}
.activity-log-module-full{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);line-height:1.2}
.mod-incidents .activity-log-module-short{color:var(--color-text-warning)}
.mod-actions .activity-log-module-short{color:var(--color-text-warning)}
.mod-audits .activity-log-module-short{color:var(--color-primary-text)}
.mod-iso .activity-log-module-short{color:var(--color-primary-text)}
.mod-products .activity-log-module-short{color:var(--color-primary-text)}
.mod-context .activity-log-module-short{color:#94a3b8}
.mod-ai-center .activity-log-module-short{color:var(--color-primary-text)}
.mod-system .activity-log-module-short{color:#cbd5e1}
.mod-default .activity-log-module-short{color:var(--text2)}
.activity-log-action-wrap{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.activity-log-cell--action .activity-log-strong{font-weight:700;font-size:13px;color:var(--text);line-height:1.4}
.activity-log-importance{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:rgba(20,184,166,.12);color:#5eead4;border:1px solid rgba(20,184,166,.25)}
.activity-log-cell--detail .activity-log-detail-text{font-size:12px;line-height:1.5;color:var(--text2)}
.activity-log-meta{font-size:12px;font-weight:600;color:var(--text)}
.activity-log-time{font-size:12px;color:var(--text2);font-variant-numeric:tabular-nums;font-weight:600}

.activity-log-extension-slot{margin-top:14px;padding:10px 12px;border-radius:12px;border:1px dashed rgba(148,163,184,.2);background:rgba(0,0,0,.08);display:flex;flex-wrap:wrap;gap:8px 14px;align-items:baseline}
.activity-log-extension-label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.activity-log-extension-text{font-size:12px;color:var(--text3);line-height:1.45;max-width:62ch}

@media (max-width:900px){
  .activity-log-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .activity-log-head{display:none}
  .activity-log-row{grid-template-columns:1fr;gap:10px;padding:16px;border-bottom:1px solid rgba(148,163,184,.1)}
  .activity-log-cell--module::before{content:'Module';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--action::before{content:'Action';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--detail::before{content:'Détail';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--user::before{content:'Utilisateur';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
  .activity-log-cell--time::before{content:'Date / heure';font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
}
@media (max-width:480px){
  .activity-log-quick-grid{grid-template-columns:1fr}
}
`;

export function ensureActivityLogStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
