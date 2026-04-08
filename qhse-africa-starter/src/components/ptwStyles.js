const STYLE_ID = 'qhse-ptw-styles';

const CSS = `
.ptw-page{gap:12px}
.ptw-toolbar{display:flex;gap:10px;flex-wrap:wrap}
.ptw-create-btn{min-height:46px;padding:0 18px}
.ptw-net-badge{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--color-border-secondary);font-size:12px;font-weight:700}
.ptw-net-badge--online{color:#67e8f9;background:rgba(34,211,238,.12);border-color:rgba(34,211,238,.35)}
.ptw-net-badge--offline{color:#fdba74;background:rgba(251,146,60,.12);border-color:rgba(251,146,60,.35)}
.ptw-net-badge--pending{color:#fca5a5;background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35)}
.ptw-columns{display:grid;grid-template-columns:1fr;gap:12px}
.ptw-card{padding:12px}
.ptw-list-title{display:flex;justify-content:space-between;align-items:center;gap:8px}
.ptw-items{display:grid;gap:10px}
.ptw-item{padding:12px;border:1px solid var(--color-border-tertiary);border-radius:12px;background:var(--color-background-primary)}
.ptw-item-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}
.ptw-item-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.ptw-item-actions .btn{min-height:34px;padding:6px 10px;font-size:12px}
.ptw-mini{font-size:12px;color:var(--text2)}
.ptw-chip{padding:5px 10px;border-radius:999px;border:1px solid var(--color-border-secondary);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.ptw-status--pending{border-color:rgba(251,146,60,.45);color:#fdba74;background:rgba(251,146,60,.14)}
.ptw-status--active{border-color:rgba(34,197,94,.45);color:#86efac;background:rgba(34,197,94,.12)}
.ptw-status--validated{border-color:rgba(34,197,94,.45);color:#86efac;background:rgba(34,197,94,.12)}
.ptw-status--in_progress{border-color:rgba(56,189,248,.45);color:#7dd3fc;background:rgba(56,189,248,.12)}
.ptw-status--expired{border-color:rgba(239,68,68,.55);color:#fecaca;background:rgba(239,68,68,.14)}
.ptw-status--closed{border-color:rgba(148,163,184,.38);color:var(--text3);background:rgba(148,163,184,.12)}
.ptw-chip--critical{border-color:rgba(239,68,68,.55);color:#fecaca;background:rgba(239,68,68,.14);display:inline-flex;margin-top:8px}
.ptw-inline-checks{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.ptw-inline-check{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);padding:4px 8px;border-radius:999px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary)}
.ptw-sign-inline{display:grid;gap:8px;margin-top:10px;padding:10px;border:1px solid var(--color-border-tertiary);border-radius:10px;background:var(--color-background-secondary)}
.ptw-ai-strip{display:grid;gap:4px}

.ptw-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ptw-kpi{padding:8px 10px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);display:grid;gap:2px}
.ptw-kpi__label{font-size:11px;color:var(--text3)}
.ptw-kpi__value{font-size:20px;line-height:1;font-weight:800;color:var(--text)}
.ptw-kpi__value--danger{color:#fca5a5}

.ptw-wizard{position:fixed;inset:0;z-index:1400;max-width:min(960px,94vw);max-height:88vh;overflow:auto;margin:auto;box-shadow:0 18px 60px rgba(0,0,0,.45)}
.ptw-wizard::before{content:'';position:fixed;inset:0;background:rgba(2,6,23,.56);z-index:-1}
.ptw-wizard[hidden]{display:none!important}
.ptw-wizard-step{display:grid;gap:10px}
.ptw-step-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.ptw-step-badge{font-size:11px;color:var(--text3)}
.ptw-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ptw-type-btn{min-height:50px;border-radius:12px;border:1px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--text);font-weight:700;text-align:left;padding:10px 12px;cursor:pointer}
.ptw-type-btn.is-selected{border-color:var(--color-border-info);background:var(--color-background-info);color:var(--color-text-info)}
.ptw-fields{display:grid;grid-template-columns:1fr;gap:10px}
.ptw-checklist{display:grid;gap:8px}
.ptw-check{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:10px;background:var(--color-background-secondary)}
.ptw-sign{display:grid;gap:8px;padding:10px;border:1px solid var(--color-border-tertiary);border-radius:10px}
.ptw-sign-canvas{width:100%;height:132px;border:1px dashed var(--color-border-secondary);border-radius:8px;background:#fff;touch-action:none}
.ptw-list{display:grid;gap:6px}
[data-theme='dark'] .ptw-sign-canvas{background:#0b1220}
.ptw-wizard-foot{display:flex;gap:8px;flex-wrap:wrap}

@media (min-width: 900px){
  .ptw-columns{grid-template-columns:1fr 1fr}
  .ptw-type-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width: 640px){
  .ptw-kpis{grid-template-columns:1fr}
  .ptw-item-actions{display:grid;grid-template-columns:1fr 1fr}
  .ptw-item-actions .btn{width:100%}
}
`;

export function ensurePtwStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
