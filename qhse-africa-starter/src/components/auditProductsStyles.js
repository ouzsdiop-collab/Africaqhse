const STYLE_ID = 'qhse-audit-products-styles';

const CSS = `
.audit-products-page .audit-last-card{border:1px solid rgba(148,163,184,.12)}
.audit-last-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-top:12px}
.audit-last-item{display:grid;gap:4px}
.audit-last-item span:first-child{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.audit-last-item span:last-child{font-size:14px;font-weight:700;color:var(--text)}
.audit-last-score{font-size:28px;font-weight:800;letter-spacing:-.03em}
.audit-checklist-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.audit-checklist-row{align-items:center}
.audit-score-panel{text-align:center}
.audit-score-gauge-wrap{display:grid;place-items:center;margin:8px 0 12px}
.audit-score-gauge{width:160px;height:160px;border-radius:50%;box-shadow:0 12px 32px rgba(0,0,0,.2)}
.audit-score-gauge-inner{display:grid;place-items:center;width:160px;height:160px;margin-top:-160px;position:relative;pointer-events:none}
.audit-score-gauge-inner strong{font-size:36px;font-weight:800;letter-spacing:-.04em}
.audit-score-gauge-inner small{display:block;font-size:12px;color:var(--text3);margin-top:2px}
.audit-history-stack{display:grid;gap:8px}
.audit-history-row{padding:12px 14px}
.audit-actions-bar{margin-top:16px;display:flex;justify-content:flex-end}
.audit-right-stack{display:grid;gap:14px;min-width:0}
.products-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
.products-toolbar .control-input{max-width:320px;flex:1;min-width:200px}
.products-list{display:grid;gap:0}
.products-row{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
.products-row-main{display:flex;flex-direction:column;gap:12px;min-width:0;flex:1}
.products-row-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.products-actions-bar{margin-top:16px;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}
.products-page-header{margin-bottom:4px;padding:20px 22px 22px;border-radius:16px}
.products-page-header__inner{max-width:62rem}
.products-page-title{margin:6px 0 0;font-size:clamp(22px,2.4vw,28px);font-weight:800;letter-spacing:-.03em;color:var(--text)}
.products-page-lead{margin:10px 0 0;font-size:14px;line-height:1.55;color:var(--text2);max-width:56ch}
.products-flow-inline{margin:10px 0 0;font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--text3);max-width:48ch}
.products-import-card,.products-validation-card,.products-list-card{margin-bottom:0}
.products-import-lead{max-width:56ch}
.products-import-row{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end;margin-top:8px}
.products-file-label{display:flex;flex-direction:column;gap:6px;min-width:min(100%,220px);flex:1}
.products-file-label__text{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.products-fds-input{min-height:44px;font-size:13px}
.products-ia-disclaimer{margin:12px 0 0;font-size:11px;line-height:1.45;color:var(--text3);max-width:62ch;opacity:.92}
.products-human-gate{
  margin:0 0 14px;padding:10px 14px;border-radius:12px;
  border:1px solid rgba(52,211,153,.28);background:rgba(52,211,153,.06);
  font-size:13px;line-height:1.45;color:var(--text2);
}
.products-human-gate strong{color:var(--text);font-weight:700}
.products-validation-grid{margin-top:4px}
.products-validation-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid rgba(148,163,184,.12)}
.products-list-empty{margin:0;font-size:13px;color:var(--text3)}
.products-row-doc{margin:0;font-size:11px;color:var(--text3)}
.products-row-ghs-wrap{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.products-detail-host{margin-top:18px}
.products-detail-card{padding:20px 22px 22px}
.products-detail-title{margin:4px 0 0;font-size:18px;font-weight:800}
.products-detail-meta{margin:8px 0 0;font-size:13px;color:var(--text2)}
.products-detail-body{display:grid;gap:0;margin-top:16px}
.products-detail-body > .products-detail-block:not(:first-child){
  border-top:1px solid var(--color-border-tertiary,rgba(148,163,184,.22));
  padding-top:16px;
  margin-top:16px;
}
.products-detail-block h4{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-detail-text{margin:0;font-size:13px;line-height:1.5;color:var(--text2)}
.products-detail-note{margin:8px 0 0;font-size:12px;color:var(--text3);line-height:1.45}
.products-detail-list{margin:0;padding-left:1.2rem;font-size:13px;line-height:1.5;color:var(--text2)}
.products-detail-muted{font-size:13px;color:var(--text3)}
.products-detail-valid{margin:6px 0 0;font-size:12px;font-weight:600;color:var(--text2)}
.products-detail-valid--expired{color:var(--color-text-warning,#f59e0b)}
.products-detail-subh{margin:10px 0 4px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-detail-block--general{border-left:3px solid rgba(56,189,248,.45);padding-left:14px}
.products-detail-block--urgent{border-left:3px solid rgba(248,113,113,.5);padding-left:14px;background:rgba(248,113,113,.06);border-radius:12px;padding:14px 14px 14px 18px}
.products-detail-urgency{font-weight:600;color:var(--text)}
.products-detail-block--ia{border-left:3px solid rgba(168,85,247,.4);padding-left:14px;background:rgba(168,85,247,.05);border-radius:12px;padding:14px 14px 14px 18px}
.products-picto-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.products-detail-hp-wrap{margin-top:2px}
.products-detail-hp-lines{display:flex;flex-direction:column;gap:0}
.products-detail-hp-line{
  padding:6px 0;
  font-size:13px;
  line-height:1.6;
  color:var(--text2);
}
.products-detail-hp-line:not(:last-child){
  border-bottom:0.5px solid var(--color-border-tertiary,rgba(148,163,184,.22));
}
.products-detail-subh--hp{margin-top:10px}
.products-detail-subh--hp:first-child{margin-top:0}
.products-fds-dropzone{
  padding:20px;
  border:2px dashed var(--color-border-secondary,#475569);
  border-radius:var(--border-radius-lg,14px);
  text-align:center;
  margin:16px 0;
  background:color-mix(in srgb,var(--color-background-secondary,#0f172a) 88%,transparent);
}
.products-fds-dropzone__title{margin:0 0 8px;font-weight:700;font-size:14px;color:var(--text)}
.products-fds-dropzone__hint{margin:0;font-size:13px;line-height:1.5;opacity:.88;color:var(--text2)}
.products-picto-chip{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:5px 10px;border-radius:8px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15);color:var(--text2)}
.products-kpi-host{min-width:0}
.products-kpi-card{
  padding:20px 22px 22px;border-radius:16px;
  border:1px solid var(--color-info-border);
  background:color-mix(in srgb,var(--color-info) 6%,var(--surface-2));
  box-shadow:var(--shadow-md);
}
[data-theme='dark'] .products-kpi-card{
  border:1px solid rgba(125,211,252,.18);
  background:linear-gradient(165deg,rgba(255,255,255,.04),rgba(0,0,0,.08));
  box-shadow:0 8px 32px rgba(0,0,0,.14);
}
.products-kpi-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}
@media (max-width:640px){.products-kpi-grid{grid-template-columns:1fr}}
.products-kpi-tile{padding:14px 16px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--surface-3);text-align:center}
.products-kpi-tile--alert{border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.08)}
.products-kpi-label{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.products-kpi-val{font-size:26px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1}
.products-dist-block{margin-top:18px;padding-top:16px;border-top:1px solid rgba(148,163,184,.1)}
.products-dist-title{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-dist-bars{display:grid;gap:8px;max-width:420px}
.products-dist-row{display:grid;grid-template-columns:52px 1fr 28px;align-items:center;gap:10px;font-size:12px;color:var(--text2)}
.products-dist-track{height:10px;border-radius:999px;background:rgba(0,0,0,.2);overflow:hidden;border:1px solid rgba(148,163,184,.1)}
.products-dist-fill{display:block;height:100%;border-radius:999px;min-width:4px}
.products-dist-fill--el{background:linear-gradient(90deg,rgba(248,113,113,.9),rgba(220,38,38,.75))}
.products-dist-fill--mo{background:linear-gradient(90deg,rgba(251,191,36,.9),rgba(217,119,6,.75))}
.products-dist-fill--fa{background:linear-gradient(90deg,rgba(52,211,153,.85),rgba(16,185,129,.7))}
.products-alerts-block{margin-top:16px;padding-top:14px;border-top:1px solid rgba(148,163,184,.1)}
.products-alerts-title{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-alerts-empty{margin:0;font-size:13px;color:var(--text3)}
.products-alerts-list{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.products-alert-link{display:block;width:100%;text-align:left;font:inherit;font-size:13px;font-weight:600;color:var(--text);padding:8px 10px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--surface-3);cursor:pointer;transition:background .15s ease,border-color .15s ease}
.products-alert-link:hover{background:var(--surface-4);border-color:var(--color-danger-border)}
.products-row-card{
  padding:16px 20px;border-radius:14px;border:1px solid var(--color-border-tertiary);
  background:var(--surface-2);
  box-shadow:var(--shadow-sm);
  margin-bottom:12px;
}
[data-theme='dark'] .products-row-card{
  background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.06));
  box-shadow:0 4px 20px rgba(0,0,0,.12);
  border-color:rgba(148,163,184,.12);
}
.products-list .products-row-card:last-child{margin-bottom:0}
.products-row-title{display:block;font-size:15px;font-weight:800;color:var(--text);line-height:1.3}
.products-row-sub{margin:0;font-size:13px;color:var(--text2)}
.products-row-rev{margin:0;font-size:12px;color:var(--text3)}
.products-row-validity{margin:0;font-size:11px;font-weight:600;color:var(--text2)}
.products-row-validity--late{color:var(--color-text-warning,#fbbf24)}
.products-row-doc--warn{color:var(--color-text-warning,#fbbf24)}
.products-row-pills{display:flex;flex-wrap:wrap;gap:6px;margin:0}
.products-alert-pill{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:6px;border:1px solid rgba(148,163,184,.15)}
.products-alert-pill--miss{border-color:var(--color-danger-border);background:var(--color-danger-bg);color:var(--color-danger-text)}
.products-alert-pill--exp{border-color:var(--color-warning-border);background:var(--color-warning-bg);color:var(--color-warning-text)}
.products-alert-pill--nc{border-color:var(--color-danger-border);background:var(--color-danger-bg);color:var(--color-danger-text)}
.products-danger-badge{flex-shrink:0}
.products-terrain-host{min-width:0}
.products-terrain-card{padding:18px 20px;border-radius:16px;border:1px solid rgba(20,184,166,.28);background:linear-gradient(135deg,rgba(20,184,166,.1),rgba(0,0,0,.1))}
.products-terrain-head{margin-bottom:12px}
.products-terrain-kicker{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--color-primary-text)}
.products-terrain-title{margin:6px 0 0;font-size:16px;font-weight:800;color:var(--text)}
.products-terrain-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}
@media (max-width:720px){.products-terrain-grid{grid-template-columns:1fr}}
.products-terrain-cell{padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.14);min-width:0}
.products-terrain-cell--danger{border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.08)}
.products-terrain-cell--urgent{border-color:rgba(56,189,248,.3);background:rgba(56,189,248,.08)}
.products-terrain-lbl{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.products-terrain-val{margin:0;font-size:13px;font-weight:600;line-height:1.45;color:var(--text)}
.products-terrain-mini{margin:4px 0 0;font-size:11px;color:var(--text3)}
.products-terrain-empty{margin:0;font-size:13px;color:var(--text2)}
.products-ia-preview{
  margin:0 0 16px;padding:14px 16px;border-radius:12px;
  border:1px dashed rgba(168,85,247,.35);background:rgba(168,85,247,.06);
}
.products-ia-preview-title{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.products-ia-preview-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:640px){.products-ia-preview-cols{grid-template-columns:1fr}}
.products-ia-preview-sub{margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3)}
.products-ia-preview-list{margin:0;padding-left:1.1rem;font-size:12px;line-height:1.45;color:var(--text2)}
.products-ia-preview-empty{list-style:none;margin-left:-1.1rem;color:var(--text3)}
.audit-products-page{display:flex;flex-direction:column;gap:20px;padding-bottom:1.5rem}
.products-page--premium{width:100%;max-width:min(1120px,100%);margin-inline:auto;box-sizing:border-box}
.products-detail-head-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-end}
.products-detail-summary{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px;padding:12px 14px;border-radius:12px;
  border:1px solid var(--color-border-tertiary);background:var(--surface-3);
}
@media (max-width:560px){.products-detail-summary{grid-template-columns:1fr}}
.products-detail-summary-item{min-width:0;text-align:center}
.products-detail-summary-lbl{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:4px}
.products-detail-summary-val{display:block;font-size:14px;font-weight:800;color:var(--text);line-height:1.25}
.products-detail-summary-val--red{color:var(--color-danger-text)}
.products-detail-summary-val--amber{color:var(--color-warning-text)}
.products-detail-summary-val--green{color:var(--color-success-text)}
.products-detail-exploit-note{margin:12px 0 0;font-size:12px;line-height:1.5;color:var(--text3);max-width:62ch;padding:10px 12px;border-radius:10px;border:1px dashed rgba(125,211,252,.25);background:rgba(56,189,248,.06)}
.products-detail-block--modules .products-detail-module-hint{margin-bottom:10px}
.products-detail-module-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.products-human-confirm-wrap{margin-top:4px}
.products-human-confirm-wrap .products-human-confirm-label{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--text2)}
.products-human-confirm-check{margin-top:3px;flex-shrink:0;accent-color:var(--app-accent,#14b8a6)}
.products-terrain-picker{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:10px}
.products-terrain-picker-label{font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--text3)}
.products-terrain-select{min-width:min(100%,320px);max-width:100%}
.products-detail-ia-refresh{margin-top:14px}
`;

export function ensureAuditProductsStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
