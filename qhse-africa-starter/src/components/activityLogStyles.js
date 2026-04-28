const STYLE_ID = 'qhse-activity-log-styles';

const CSS = `
.activity-log-cert-strip{
  margin:0 0 16px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(45,212,191,.2);
  background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(15,23,42,.35));
}
.activity-log-cert-badges{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}
.activity-log-cert-badge{
  font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;
  padding:5px 10px;border-radius:999px;
  border:1px solid var(--color-primary-border);
  color:var(--color-primary-text);
  background:var(--color-primary-bg);
}
.activity-log-cert-badge--subtle{opacity:.85;border-color:rgba(148,163,184,.25);color:var(--text2);background:rgba(0,0,0,.12)}
.activity-log-cert-lead{margin:0;font-size:12px;font-weight:600;color:var(--text2);line-height:1.45;max-width:62ch}

.activity-log-critical-spotlight{
  margin-bottom:16px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(239,68,68,.15);
  background:rgba(239,68,68,.04);
}
.activity-log-critical-head{margin-bottom:10px}
.activity-log-critical-title{margin:0 0 4px;font-size:15px;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.activity-log-critical-sub{margin:0;font-size:12px;color:var(--text3);line-height:1.4}
.activity-log-critical-mount{display:flex;flex-direction:column;gap:0;border-radius:12px;overflow:hidden;border:1px solid rgba(148,163,184,.1)}
.activity-log-critical-mount .activity-log-row{padding:10px 14px;font-size:12px}
.activity-log-critical-mount .activity-log-row--clickable:hover{background:rgba(20,184,166,.12)!important}
.activity-log-critical-empty{margin:0;padding:16px;text-align:center;font-size:12px;font-weight:600;color:var(--text3);font-style:italic}

.activity-log-analysis{
  margin-bottom:14px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(255,255,255,.025);
}
.activity-log-analysis-head{margin-bottom:10px}
.activity-log-analysis-title{margin:0 0 4px;font-size:15px;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.activity-log-analysis-sub{margin:0;font-size:12px;color:var(--text3)}
.activity-log-analysis-list{margin:0;padding:0 0 0 18px;display:flex;flex-direction:column;gap:8px}
.activity-log-analysis-item{font-size:13px;font-weight:600;line-height:1.45;color:var(--text2)}

.activity-log-page--audit-view .content-card.card-soft{
  box-shadow:0 0 0 1px rgba(245,158,11,.2),0 12px 40px rgba(0,0,0,.25);
}
.activity-log-page--audit-view .activity-log-toolbar{
  border-color:rgba(245,158,11,.22);
  background:rgba(245,158,11,.06);
}

.activity-log-page .activity-log-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.1)}
.activity-log-toolbar--split{justify-content:space-between;align-items:flex-start}
.activity-log-toolbar-main{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.activity-log-page .activity-log-toolbar-main > span:first-child{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.activity-log-toolbar-note{font-size:13px;font-weight:600;color:var(--text2)}
.activity-log-audit-view-btn{flex-shrink:0;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
.activity-log-audit-view-btn:hover{transform:translateY(-1px)}
.activity-log-audit-view-btn[aria-pressed="true"]{
  border-color:rgba(245,158,11,.45);
  background:rgba(245,158,11,.12);
  color:var(--text);
}

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
.activity-log-summary-chip.mod-system{color:var(--text-secondary);border-color:var(--color-border-tertiary);background:var(--surface-3)}
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
.activity-log-row--clickable{cursor:pointer;transition:background .18s ease,transform .14s ease,box-shadow .18s ease,border-color .18s ease}
.activity-log-row--clickable:hover{background:rgba(20,184,166,.1)!important;box-shadow:inset 0 0 0 1px rgba(45,212,191,.2);transform:translateY(-1px)}
.activity-log-row--clickable:active{transform:translateY(0)}
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
.activity-log-importance{
  font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;
  background:var(--color-primary-bg);color:var(--color-primary-text);border:1px solid var(--color-primary-border);
}
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
@media (max-width:700px){
  .activity-log-toolbar--split{flex-direction:column;align-items:stretch}
  .activity-log-audit-view-btn{width:100%;justify-content:center}
}

.activity-log-journal-tabs{
  display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;
}
.activity-log-journal-tab{
  appearance:none;margin:0;padding:10px 16px;border-radius:999px;
  border:1px solid var(--color-border-tertiary, rgba(148,163,184,.22));
  background:var(--color-background-primary, #fff);
  color:var(--color-text-secondary, #334155);
  font:inherit;font-size:13px;font-weight:600;cursor:pointer;
  transition:background .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease;
}
.activity-log-journal-tab:hover{
  border-color:color-mix(in srgb, var(--palette-accent, #14b8a6) 35%, var(--color-border-secondary));
  color:var(--color-text-primary, #0f172a);
}
.activity-log-journal-tab--active{
  border-color:color-mix(in srgb, var(--palette-accent, #14b8a6) 45%, transparent);
  background:color-mix(in srgb, var(--palette-accent, #14b8a6) 10%, var(--color-background-primary));
  color:var(--color-primary-text, #0f766e);
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset;
}
.activity-log-journal-tab:focus-visible{
  outline:2px solid color-mix(in srgb, var(--palette-accent, #14b8a6) 50%, transparent);
  outline-offset:2px;
}

/* Mode clair : bandeau certifiabilité, contraste WCAG + séparation nette de la carte */
[data-theme='light'] .activity-log-cert-strip{
  margin:0 0 18px;
  padding:14px 16px;
  border-radius:14px;
  border:1px solid color-mix(in srgb, var(--palette-accent, #0d9488) 32%, var(--color-border-tertiary, #e2e8f0));
  background:linear-gradient(
    165deg,
    color-mix(in srgb, var(--palette-accent, #14b8a6) 9%, var(--surface-2, #f1f5f9)) 0%,
    var(--surface-1, #ffffff) 55%
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.95) inset,
    0 4px 16px rgba(15, 23, 42, 0.07);
}
[data-theme='light'] .activity-log-cert-badge{
  color:#0f766e;
  border-color:color-mix(in srgb, #0d9488 42%, var(--color-border-tertiary, #cbd5e1));
  background:color-mix(in srgb, #0d9488 16%, #ffffff);
}
[data-theme='light'] .activity-log-cert-badge--subtle{
  opacity:1;
  color:#334155;
  border-color:var(--color-border-tertiary, #cbd5e1);
  background:var(--surface-2, #f1f5f9);
}
[data-theme='light'] .activity-log-cert-lead{
  color:#475569;
  font-weight:600;
}
[data-theme='light'] .activity-log-journal-tab--active{
  color:#0f766e;
  border-color:color-mix(in srgb, var(--palette-accent, #0d9488) 38%, var(--color-border-tertiary));
  background:color-mix(in srgb, var(--palette-accent, #14b8a6) 14%, var(--surface-1, #ffffff));
}
[data-theme='light'] .activity-log-summary-card,
[data-theme='light'] .activity-log-quick-card,
[data-theme='light'] .activity-log-analysis{
  background:var(--surface-3);
  border-color:var(--color-border-tertiary);
}
[data-theme='light'] .activity-log-summary-chip.mod-context{
  color:var(--text-secondary);
  border-color:var(--color-border-tertiary);
  background:var(--surface-3);
}
[data-theme='light'] .activity-log-page .activity-log-toolbar,
[data-theme='light'] .activity-log-filters{
  background:var(--surface-3);
  border-color:var(--color-border-tertiary);
}
[data-theme='light'] .activity-log-table{
  border-color:var(--color-border-tertiary);
}
[data-theme='light'] .activity-log-head{
  background:var(--surface-4);
  border-bottom-color:var(--color-border-tertiary);
}
[data-theme='light'] .activity-log-row{
  border-bottom-color:var(--color-border-tertiary);
}
[data-theme='light'] .activity-log-row:nth-child(even){
  background:var(--surface-2);
}
`;

export function ensureActivityLogStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
