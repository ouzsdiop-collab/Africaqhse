const STYLE_ID = 'qhse-ai-center-styles';

const CSS = `
.ai-center-page .ai-hero{margin-bottom:4px}
.ai-use-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:12px}
@media (max-width:900px){.ai-use-grid{grid-template-columns:1fr}}
.ai-use-card{
  border-radius:14px;
  border:1px solid rgba(148,163,184,.14);
  background:rgba(255,255,255,.03);
  padding:16px 18px;
  display:grid;
  gap:10px;
  min-height:0;
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.ai-use-card__label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.ai-use-card__title{margin:0;font-size:15px;font-weight:700;line-height:1.3;color:var(--text)}
.ai-use-card__body{margin:0;font-size:13px;line-height:1.55;color:var(--text2)}
.ai-use-card__foot{font-size:12px;font-weight:500;line-height:1.45;color:var(--text3);font-style:italic}
.ai-center-human-trust{
  margin-top:12px!important;
  padding:14px 16px!important;
  border-radius:14px!important;
  font-size:13px!important;
  line-height:1.55!important;
  border:1px solid rgba(52,211,153,.32)!important;
  background:rgba(34,197,94,.14)!important;
  color:#bbf7d0!important;
}
.ai-center-human-trust__strong{color:#ecfdf5!important;font-weight:800}
[data-theme='light'] .ai-center-page .ai-use-card{
  background:var(--color-background-primary,#ffffff);
  border:1px solid var(--color-border-secondary,rgba(15,23,42,.14));
  box-shadow:
    0 1px 0 rgba(255,255,255,.95) inset,
    0 4px 18px rgba(15,23,42,.08),
    0 0 0 1px rgba(15,23,42,.03);
}
[data-theme='light'] .ai-center-page .ai-use-card__label{
  color:var(--color-text-secondary,#475569);
  letter-spacing:.09em;
}
[data-theme='light'] .ai-center-page .ai-use-card__title{color:var(--color-text-primary,#0f172a)}
[data-theme='light'] .ai-center-page .ai-use-card__body{color:var(--color-text-secondary,#334155)}
[data-theme='light'] .ai-center-page .ai-use-card__foot{
  color:var(--color-text-secondary,#64748b);
  font-style:normal;
  font-weight:600;
}
[data-theme='light'] .ai-center-human-trust{
  border:1px solid color-mix(in srgb,#16a34a 38%,var(--color-border-tertiary,#cbd5e1))!important;
  background:color-mix(in srgb,#16a34a 14%,var(--surface-2,#ecfdf5))!important;
  color:#14532d!important;
}
[data-theme='light'] .ai-center-human-trust__strong{color:#166534!important}
[data-theme='light'] .ai-center-page .ai-sim-output{
  border-color:var(--color-border-secondary,rgba(15,23,42,.12));
  background:var(--color-background-secondary,#f8fafc);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
}
[data-theme='light'] .ai-center-page .ai-sim-output--empty{
  background:var(--surface-2,#f1f5f9);
}
[data-theme='light'] .ai-center-page .ai-sim-history{
  border-color:var(--color-border-secondary,rgba(15,23,42,.12));
  background:var(--surface-2,#f8fafc);
  box-shadow:0 1px 2px rgba(15,23,42,.04);
}
[data-theme='light'] .ai-center-page .ai-sim-history__item{
  background:var(--color-background-primary,#fff);
  border:1px solid var(--color-border-tertiary,#e2e8f0);
}
[data-theme='light'] .ai-center-page .ai-sim-history__title{color:var(--color-text-secondary,#475569)}
[data-theme='light'] .ai-center-page .ai-sim-history__time{color:var(--color-text-secondary,#64748b)}
.ai-sim-card{margin-top:14px}
.ai-sim-layout{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:16px;align-items:start;margin-top:10px}
@media (max-width:800px){.ai-sim-layout{grid-template-columns:1fr}}
.ai-sim-controls{display:flex;flex-direction:column;gap:10px}
.ai-sim-controls label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.ai-sim-controls select,.ai-sim-controls .control-input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.2);color:var(--text);font-size:13px}
.ai-sim-main{display:flex;flex-direction:column;gap:12px;min-width:0}
.ai-sim-output{border-radius:14px;border:1px solid rgba(148,163,184,.14);background:rgba(0,0,0,.14);padding:0;min-height:200px;overflow:hidden}
.ai-sim-output--empty{padding:18px 20px;background:rgba(0,0,0,.12)}
.ai-sim-output--empty .ai-sim-placeholder{margin:0;font-size:13px;line-height:1.55;color:var(--text3);font-style:italic}
.ai-sim-result-head{padding:16px 18px 12px;border-bottom:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.12)}
.ai-sim-result-ref{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5eead4;margin-bottom:6px}
.ai-sim-result-title{margin:0;font-size:16px;font-weight:800;letter-spacing:-.02em;line-height:1.35;color:var(--text)}
.ai-sim-result-body{padding:12px 18px 8px;display:grid;gap:14px}
.ai-sim-section{margin:0}
.ai-sim-section__title{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.ai-sim-section__list{margin:0;padding:0 0 0 18px;font-size:13px;line-height:1.55;color:var(--text2)}
.ai-sim-section__list li{margin-bottom:6px}
.ai-sim-section__list li:last-child{margin-bottom:0}
.ai-sim-result-foot{margin:0;padding:12px 18px 16px;font-size:11px;line-height:1.45;color:var(--text3);border-top:1px solid rgba(148,163,184,.08);background:rgba(0,0,0,.08)}
.ai-sim-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ai-sim-toolbar .btn,.ai-sim-toolbar .text-button{min-height:40px}
.ai-sim-hint{font-size:12px;color:var(--text3);margin:0;flex:1;min-width:200px}
.ai-sim-history{border-radius:14px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.08);padding:12px 14px}
.ai-sim-history__title{margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.ai-sim-history__list{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.ai-sim-history__item{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;font-size:12px;color:var(--text2);padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.06)}
.ai-sim-history__time{font-variant-numeric:tabular-nums;font-weight:600;color:var(--text3);font-size:11px}
.ai-sim-history__ref{font-weight:800;color:#5eead4;font-size:11px}
.ai-sim-history__label{flex:1;min-width:120px;color:var(--text)}
`;

export function ensureAiCenterStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
