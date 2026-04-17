const STYLE_ID = 'qhse-ptw-styles';

const CSS = `
.ptw-toolbar{display:flex;gap:10px;flex-wrap:wrap}
.ptw-create-btn{min-height:46px;padding:0 18px}
.ptw-net-badge{
  display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border-radius:999px;
  font-size:12px;font-weight:700;line-height:1.25;
  box-sizing:border-box;
  background-color:var(--badge-neutral-bg,#f1f5f9);color:var(--badge-neutral-color,#334155);border:1px solid var(--badge-neutral-border,#cbd5e1);
}
/* Mode en ligne (connecté) — jetons --btn-online-* sous html[data-theme=light] */
.ptw-net-badge--online{
  background-color:var(--btn-online-bg,#dcfce7);color:var(--btn-online-color,#166534);border:1px solid var(--btn-online-border,#86efac);
}
/* Mode hors ligne */
.ptw-net-badge--offline{
  background-color:var(--btn-offline-bg,#fef9c3);color:var(--btn-offline-color,#854d0e);border:1px solid var(--btn-offline-border,#fde047);
}
/* Synchronisation OK */
.ptw-net-badge--sync{
  background-color:var(--btn-sync-bg,#dbeafe);color:var(--btn-sync-color,#1e40af);border:1px solid var(--btn-sync-border,#93c5fd);
}
/* File d’attente sync — clair (ambre lisible) */
.ptw-net-badge--sync-pending{
  background-color:#ffedd5;color:#9a3412;border:1px solid #fdba74;
}
/* Rétrocompat si une ancienne classe reste */
.ptw-net-badge--pending{
  background-color:#ffedd5;color:#9a3412;border:1px solid #fdba74;
}

/* Pastilles API sur chaque fiche permis */
.ptw-sync-pill{
  display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;
  font-size:11px;font-weight:800;letter-spacing:.02em;vertical-align:middle;
}
.ptw-sync-pill--synced{
  background-color:var(--btn-sync-bg,#dbeafe);color:var(--btn-sync-color,#1e40af);border:1px solid var(--btn-sync-border,#93c5fd);
}
.ptw-sync-pill--local{
  background-color:var(--btn-offline-bg,#fef9c3);color:var(--btn-offline-color,#854d0e);border:1px solid var(--btn-offline-border,#fde047);
}

html[data-theme='dark'] .ptw-net-badge{
  background-color:#1e293b;color:#f1f5f9;border-color:#334155;
}
html[data-theme='dark'] .ptw-net-badge--online{
  background-color:#14532d;color:#bbf7d0;border-color:#15803d;
}
html[data-theme='dark'] .ptw-net-badge--offline{
  background-color:#713f12;color:#fef08a;border-color:#ca8a04;
}
html[data-theme='dark'] .ptw-net-badge--sync{
  background-color:#1e3a8a;color:#bfdbfe;border-color:#3b82f6;
}
html[data-theme='dark'] .ptw-net-badge--sync-pending,
html[data-theme='dark'] .ptw-net-badge--pending{
  background-color:#7c2d12;color:#fed7aa;border-color:#ea580c;
}
html[data-theme='dark'] .ptw-sync-pill--synced{
  background-color:#1e3a8a;color:#bfdbfe;border-color:#3b82f6;
}
html[data-theme='dark'] .ptw-sync-pill--local{
  background-color:#713f12;color:#fef08a;border-color:#ca8a04;
}

@media (prefers-color-scheme:dark){
  html:not([data-theme='light']) .ptw-net-badge{
    background-color:#1e293b;color:#f1f5f9;border-color:#334155;
  }
  html:not([data-theme='light']) .ptw-net-badge--online{
    background-color:#14532d;color:#bbf7d0;border-color:#15803d;
  }
  html:not([data-theme='light']) .ptw-net-badge--offline{
    background-color:#713f12;color:#fef08a;border-color:#ca8a04;
  }
  html:not([data-theme='light']) .ptw-net-badge--sync{
    background-color:#1e3a8a;color:#bfdbfe;border-color:#3b82f6;
  }
  html:not([data-theme='light']) .ptw-net-badge--sync-pending,
  html:not([data-theme='light']) .ptw-net-badge--pending{
    background-color:#7c2d12;color:#fed7aa;border-color:#ea580c;
  }
  html:not([data-theme='light']) .ptw-sync-pill--synced{
    background-color:#1e3a8a;color:#bfdbfe;border-color:#3b82f6;
  }
  html:not([data-theme='light']) .ptw-sync-pill--local{
    background-color:#713f12;color:#fef08a;border-color:#ca8a04;
  }
}
.ptw-columns{display:grid;grid-template-columns:1fr;gap:12px}
.ptw-card{padding:12px}
.ptw-list-title{display:flex;justify-content:space-between;align-items:center;gap:8px}
.ptw-items{display:grid;gap:10px}
.ptw-item{padding:12px;border:1px solid var(--color-border-tertiary);border-radius:12px;background:var(--color-background-primary)}
.ptw-item-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}
.ptw-item-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.ptw-item-actions .btn{min-height:34px;padding:6px 10px;font-size:12px}
.ptw-mini{font-size:12px;color:var(--text2)}
.ptw-chip{padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;box-sizing:border-box}
.ptw-status--pending{border:1px solid var(--badge-warning-border,#fdba74);color:var(--badge-warning-color,#854d0e);background:var(--badge-warning-bg,#fef9c3)}
.ptw-status--active{border:1px solid var(--badge-success-border,#86efac);color:var(--badge-success-color,#166534);background:var(--badge-success-bg,#dcfce7)}
.ptw-status--validated{border:1px solid var(--badge-success-border,#86efac);color:var(--badge-success-color,#166534);background:var(--badge-success-bg,#dcfce7)}
.ptw-status--in_progress{border:1px solid var(--badge-info-border,#93c5fd);color:var(--badge-info-color,#1e40af);background:var(--badge-info-bg,#dbeafe)}
.ptw-status--expired{border:1px solid var(--badge-danger-border,#fca5a5);color:var(--badge-danger-color,#991b1b);background:var(--badge-danger-bg,#fee2e2)}
.ptw-status--closed{border:1px solid var(--badge-neutral-border,#cbd5e1);color:var(--badge-neutral-color,#334155);background:var(--badge-neutral-bg,#f1f5f9)}
.ptw-chip--critical{border:1px solid var(--badge-danger-border,#fca5a5);color:var(--badge-danger-color,#991b1b);background:var(--badge-danger-bg,#fee2e2);display:inline-flex;margin-top:8px}

html[data-theme='dark'] .ptw-status--pending{border-color:#ea580c;color:#fed7aa;background:#7c2d12}
html[data-theme='dark'] .ptw-status--active,
html[data-theme='dark'] .ptw-status--validated{border-color:#15803d;color:#bbf7d0;background:#14532d}
html[data-theme='dark'] .ptw-status--in_progress{border-color:#3b82f6;color:#bfdbfe;background:#1e3a8a}
html[data-theme='dark'] .ptw-status--expired{border-color:#ef4444;color:#fecaca;background:#7f1d1d}
html[data-theme='dark'] .ptw-status--closed{border-color:#475569;color:#cbd5e1;background:#1e293b}
html[data-theme='dark'] .ptw-chip--critical{border-color:#ef4444;color:#fecaca;background:#7f1d1d}

@media (prefers-color-scheme:dark){
  html:not([data-theme='light']) .ptw-status--pending{border-color:#ea580c;color:#fed7aa;background:#7c2d12}
  html:not([data-theme='light']) .ptw-status--active,
  html:not([data-theme='light']) .ptw-status--validated{border-color:#15803d;color:#bbf7d0;background:#14532d}
  html:not([data-theme='light']) .ptw-status--in_progress{border-color:#3b82f6;color:#bfdbfe;background:#1e3a8a}
  html:not([data-theme='light']) .ptw-status--expired{border-color:#ef4444;color:#fecaca;background:#7f1d1d}
  html:not([data-theme='light']) .ptw-status--closed{border-color:#475569;color:#cbd5e1;background:#1e293b}
  html:not([data-theme='light']) .ptw-chip--critical{border-color:#ef4444;color:#fecaca;background:#7f1d1d}
}
.ptw-inline-checks{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.ptw-inline-check{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);padding:4px 8px;border-radius:999px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary)}
.ptw-sign-inline{display:grid;gap:8px;margin-top:10px;padding:10px;border:1px solid var(--color-border-tertiary);border-radius:10px;background:var(--color-background-secondary)}
.ptw-ai-strip{display:grid;gap:4px}

.ptw-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ptw-kpi{padding:8px 10px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);display:grid;gap:2px}
.ptw-kpi__label{font-size:11px;color:var(--text3)}
.ptw-kpi__value{font-size:20px;line-height:1;font-weight:800;color:var(--text)}
.ptw-kpi__value--danger{color:var(--badge-danger-color,#fca5a5)}

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
