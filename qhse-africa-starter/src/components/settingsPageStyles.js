const STYLE_ID = 'qhse-settings-page-styles';

const CSS = `
.settings-page{min-width:0}
.settings-page .settings-hero.content-card{
  border-radius:18px;border:1px solid var(--color-border-tertiary);
  background:var(--surface-2);box-shadow:var(--shadow-md);
}
[data-theme='dark'] .settings-page .settings-hero.content-card{
  border:1px solid rgba(125,211,252,.22);
  background:linear-gradient(165deg,rgba(255,255,255,.05) 0%,rgba(8,12,20,.4) 100%);
  box-shadow:0 18px 48px rgba(0,0,0,.22);
}
.settings-page .settings-hero .content-card-lead{max-width:62ch;line-height:1.55}
.settings-section{
  border-radius:16px;border:1px solid var(--color-border-tertiary);
  background:var(--surface-2);padding:20px 22px 22px;
  box-shadow:var(--shadow-sm);
}
.settings-section__head{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--color-border-tertiary)}
.settings-section__kicker{
  font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--text3);margin:0 0 6px;
}
.settings-section__title{margin:0;font-size:1.05rem;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.settings-section__lead{margin:8px 0 0;font-size:13px;line-height:1.5;color:var(--text2);max-width:60ch}
.settings-demo-card{
  padding:16px 18px 18px;
  border:1px solid color-mix(in srgb,var(--color-violet-border) 35%,var(--color-border-tertiary));
  background:color-mix(in srgb,var(--color-violet) 10%,var(--surface-2));
}
.settings-demo-row{margin-bottom:10px}
.settings-demo-switch-label{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:var(--text);cursor:pointer}
.settings-demo-toggle{width:18px;height:18px;accent-color:var(--color-violet);flex-shrink:0;cursor:pointer}
.settings-demo-hint{margin:0 0 12px;font-size:12px;line-height:1.45;color:var(--text3);max-width:58ch}
.settings-demo-actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px}
.settings-demo-foot{margin:0;font-size:11px;line-height:1.45;color:var(--text3);max-width:62ch;opacity:.95}
.settings-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:800px){.settings-grid-2{grid-template-columns:1fr}}
.settings-link-card{
  display:flex;flex-direction:column;gap:10px;padding:16px 18px;border-radius:14px;
  border:1px solid var(--color-border-tertiary);background:var(--surface-3);text-align:left;min-height:0;
}
.settings-link-card__label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.settings-link-card__title{margin:0;font-size:15px;font-weight:700;color:var(--text)}
.settings-link-card__desc{margin:0;font-size:13px;line-height:1.45;color:var(--text2);flex:1}
.settings-link-card .btn{align-self:flex-start;margin-top:4px}
.settings-alert-list{display:grid;gap:12px;margin-top:4px}
.settings-alert-row{
  display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;
  padding:14px 16px;border-radius:14px;border:1px solid var(--color-border-tertiary);
  background:var(--surface-3);
}
@media (max-width:640px){.settings-alert-row{grid-template-columns:1fr}}
.settings-alert-main{min-width:0}
.settings-alert-name{margin:0 0 4px;font-size:14px;font-weight:700;color:var(--text)}
.settings-alert-meta{margin:0;font-size:12px;line-height:1.45;color:var(--text3)}
.settings-alert-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.settings-tag{
  font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 8px;border-radius:8px;
  border:1px solid var(--color-border-tertiary);color:var(--text2);
}
.settings-tag--info{border-color:var(--color-info-border);color:var(--color-info-text);background:var(--color-info-bg)}
.settings-tag--warning{border-color:var(--color-warning-border);color:var(--color-warning-text);background:var(--color-warning-bg)}
.settings-tag--critique{border-color:var(--color-danger-border);color:var(--color-danger-text);background:var(--color-danger-bg)}
.settings-switch-wrap{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.settings-switch{
  position:relative;width:44px;height:24px;border-radius:999px;border:1px solid var(--color-border-tertiary);
  background:var(--surface-4);cursor:pointer;padding:0;flex-shrink:0;
  transition:background .2s,border-color .2s;
}
.settings-switch[aria-checked="true"]{
  background:var(--color-success-bg);border-color:var(--color-success-border);
}
.settings-switch::after{
  content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;
  background:var(--surface-1);box-shadow:0 1px 3px rgba(15,23,42,.2);transition:transform .2s;
}
.settings-switch[aria-checked="true"]::after{transform:translateX(20px);background:var(--text-on-primary)}
.settings-switch-label{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}
.settings-prefs-grid{display:grid;gap:12px;margin-top:8px}
.settings-pref-row{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  padding:12px 14px;border-radius:12px;background:var(--surface-3);border:1px solid var(--color-border-tertiary);
}
.settings-pref-row span{font-size:13px;color:var(--text2)}
.settings-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
@media (max-width:700px){.settings-check-grid{grid-template-columns:1fr}}
.settings-check{
  display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:12px;
  border:1px solid var(--color-border-tertiary);background:var(--surface-3);cursor:pointer;font-size:13px;color:var(--text2);
  line-height:1.4;
}
.settings-check input{accent-color:var(--color-primary);margin-top:2px;flex-shrink:0}
.settings-ia-grid{display:grid;gap:16px;margin-top:14px}
.settings-ia-module{
  padding:14px 16px;border-radius:14px;
  border:1px solid color-mix(in srgb,var(--color-violet-border) 32%,var(--color-border-tertiary,var(--color-border)));
  background:color-mix(in srgb,var(--color-violet) 8%,var(--surface-1,var(--color-background-primary)));
}
.settings-ia-module__top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.settings-ia-module__name{margin:0;font-size:14px;font-weight:700;color:var(--text);min-width:0;flex:1}
.settings-badge-ia{
  font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:4px 8px;border-radius:6px;
  color:var(--color-violet-ink);
  background:color-mix(in srgb,var(--color-violet) 16%,var(--surface-2,var(--color-subtle)));
  border:1px solid color-mix(in srgb,var(--color-violet-border) 40%,var(--color-border));
}
.settings-mode-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.settings-mode-btn{
  padding:8px 12px;border-radius:10px;
  border:1px solid var(--color-border-tertiary,var(--color-border));
  background:var(--surface-3,var(--color-subtle));
  color:var(--text-secondary,var(--color-text-secondary));font-size:12px;font-weight:600;cursor:pointer;
}
.settings-mode-btn--on{
  border-color:var(--color-info-border);
  color:var(--color-info-text);
  background:var(--color-info-bg);
}
.settings-ia-states{margin:12px 0 0;padding:10px 12px;border-radius:10px;border:1px dashed var(--color-border-tertiary);font-size:12px;color:var(--text3);line-height:1.5;background:var(--surface-3)}
.settings-cycle-stepper{
  display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 18px;counter-reset:step;
}
.settings-cycle-step{
  flex:1;min-width:120px;padding:14px 14px 12px;border-radius:14px;
  border:1px solid var(--color-border-tertiary);background:var(--surface-3);position:relative;
}
.settings-cycle-step::before{
  counter-increment:step;content:counter(step);
  display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:10px;
  font-size:12px;font-weight:800;background:var(--color-info-bg);color:var(--color-info-text);margin-bottom:8px;
}
.settings-cycle-step__label{margin:0;font-size:12px;font-weight:700;color:var(--text);line-height:1.35}
.settings-cycle-step__hint{margin:6px 0 0;font-size:11px;line-height:1.4;color:var(--text3)}
.settings-status-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.settings-pill{
  font-size:11px;font-weight:600;padding:6px 10px;border-radius:999px;border:1px solid var(--color-border-tertiary);color:var(--text2);
}
.settings-pill--muted{opacity:.85}
.settings-human-row{
  display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding:12px 14px;border-radius:12px;
  background:var(--color-success-bg);
  border:1px solid var(--color-success-border);
}
.settings-human-row span{font-size:12px;font-weight:700;color:var(--color-success-text);letter-spacing:.02em}
.settings-actions-bar{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
/* —— HQ / premium layer (additive — classes existantes inchangées) —— */
.settings-page--hq > .settings-hero.content-card{
  margin-bottom:0;padding-bottom:20px;border-bottom:1px solid var(--color-border-tertiary);
}
.settings-page--hq > .settings-section:not(:last-child){
  margin-bottom:0;
}
.settings-page--hq .settings-section{
  padding:22px 24px 24px;border-radius:18px;
  border:1px solid var(--color-border-tertiary);
  background:var(--surface-2);
  box-shadow:var(--shadow-sm);
}
[data-theme='dark'] .settings-page--hq .settings-section{
  background:linear-gradient(165deg,rgba(255,255,255,.035) 0%,rgba(0,0,0,.1) 100%);
  box-shadow:0 14px 40px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.05) inset;
  border-color:rgba(148,163,184,.14);
}
.settings-page--hq .settings-section__head{
  margin-bottom:16px;padding-bottom:14px;
  border-bottom:1px solid var(--color-border-tertiary);
}
.settings-hero-premium{padding:2px 2px 4px}
.settings-hero-premium__top{max-width:68ch}
.settings-hero-premium__eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--text-muted);margin:0 0 10px;
}
.settings-hero-premium__eyebrow::before{
  content:'';width:6px;height:6px;border-radius:50%;
  background:linear-gradient(135deg,var(--color-primary),var(--color-violet-label));
  box-shadow:0 0 10px color-mix(in srgb,var(--color-primary) 40%,transparent);
}
.settings-hero-premium__title{
  margin:0 0 14px;font-size:var(--type-page-title-size,clamp(1.55rem,2.8vw,2rem));font-weight:800;letter-spacing:-.03em;line-height:1.18;color:var(--text);
}
.settings-hero-premium__lead{
  margin:0;font-size:14px;line-height:1.6;color:var(--text2);max-width:62ch;
}
.settings-hero-premium__meta{
  display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;
}
.settings-hero-chip{
  font-size:11px;font-weight:600;padding:6px 11px;border-radius:999px;
  border:1px solid var(--color-border-tertiary);color:var(--text2);
  background:var(--surface-3);
}
.settings-hero-premium__meta--note{margin-top:10px;opacity:.92}
.settings-hero-chip--note{
  font-size:10px;font-weight:600;opacity:.88;
  border-color:var(--color-border-tertiary);background:var(--surface-3);color:var(--text3);
}
.settings-cycle-bridge + .settings-subsection{
  margin-top:12px;padding-top:0;border-top:none;
}
.settings-toc{
  display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:18px;
  border-top:1px solid var(--color-border-tertiary);
}
.settings-toc__btn{
  border:1px solid var(--color-border-tertiary);background:var(--surface-3);
  color:var(--text2);font-size:12px;font-weight:600;padding:8px 12px;border-radius:10px;cursor:pointer;
  transition:border-color .15s,background .15s,color .15s;
}
.settings-toc__btn:hover{
  border-color:var(--color-info-border);
  color:var(--color-info-text);
  background:var(--color-info-bg);
}
.settings-subsection{margin-top:20px;padding-top:18px;border-top:1px solid var(--color-border-tertiary)}
.settings-subsection:first-of-type{margin-top:0;padding-top:0;border-top:none}
.settings-subsection__title{
  margin:0 0 6px;font-size:13px;font-weight:800;letter-spacing:-.01em;color:var(--text);
}
.settings-subsection__lead{margin:0 0 14px;font-size:12.5px;line-height:1.5;color:var(--text3);max-width:62ch}
.settings-cycle-bridge{
  display:grid;gap:12px;margin:14px 0 18px;padding:14px 16px;border-radius:14px;
  border:1px solid var(--color-info-border);background:var(--color-info-bg);
}
.settings-cycle-bridge__title{margin:0;font-size:12px;font-weight:800;color:var(--color-info-text);letter-spacing:.04em;text-transform:uppercase}
.settings-cycle-bridge__text{margin:0;font-size:12.5px;line-height:1.55;color:var(--text2)}
.settings-usage-matrix{display:grid;gap:12px;margin-top:4px}
@media (min-width:900px){.settings-usage-matrix{grid-template-columns:repeat(2,minmax(0,1fr))}}
.settings-usage-card{
  display:flex;flex-direction:column;gap:12px;padding:14px 16px;border-radius:14px;
  border:1px solid var(--color-border-tertiary);background:var(--surface-3);
}
.settings-usage-card__title{margin:0;font-size:13px;font-weight:700;color:var(--text)}
.settings-usage-card__hint{margin:0;font-size:11.5px;line-height:1.45;color:var(--text3)}
.settings-usage-card__row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between}
.settings-usage-card__row label{font-size:12px;color:var(--text2);font-weight:600}
.settings-usage-card__row select.control-input{min-width:160px;max-width:100%;font-size:12px;padding:8px 10px}
.settings-cycle-map{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 6px;margin:18px 0 8px;font-size:11px;font-weight:700;color:var(--text3);
}
.settings-cycle-map__step{
  padding:8px 11px;border-radius:10px;border:1px solid var(--color-border-tertiary);
  background:var(--surface-3);color:var(--text2);
}
.settings-cycle-map__arrow{color:var(--text3);font-weight:800;opacity:.7}
.settings-status-pills{margin-top:14px}
.settings-status-pills__cap{margin:0 0 8px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em}
.settings-pill--watch{border-color:var(--color-info-border);color:var(--color-info-text);background:var(--color-info-bg)}
.settings-pill--fix{border-color:var(--color-warning-border);color:var(--color-warning-text);background:var(--color-warning-bg)}
.settings-pill--done{border-color:var(--color-success-border);color:var(--color-success-text);background:var(--color-success-bg)}
.settings-pill--verify{
  border-color:color-mix(in srgb,var(--color-violet-border) 45%,var(--color-border));
  color:var(--color-violet-ink);
  background:color-mix(in srgb,var(--color-violet) 12%,var(--surface-2));
}
.settings-pill--ok{border-color:var(--color-success-border);color:var(--color-success-text);background:var(--color-success-bg)}
.settings-pill--reject{border-color:var(--color-danger-border);color:var(--color-danger-text);background:var(--color-danger-bg)}
.settings-show-reject-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  margin-top:12px;padding:12px 14px;border-radius:12px;background:var(--surface-3);border:1px solid var(--color-border-tertiary);
}
.settings-show-reject-row span{font-size:12px;color:var(--text2);max-width:42ch;line-height:1.45}
.settings-org-context-bar{margin-top:16px;padding-top:18px;border-top:1px solid var(--color-border-tertiary)}
.settings-org-context-bar__cap{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.settings-org-context-bar__actions{display:flex;flex-wrap:wrap;gap:10px}
.settings-ia-human-pattern{
  display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin:14px 0 16px;
  padding:14px 16px;border-radius:14px;
  border:1px solid color-mix(in srgb,var(--color-violet-border) 38%,var(--color-border-tertiary,var(--color-border)));
  background:color-mix(in srgb,var(--color-violet) 12%,var(--surface-2,var(--color-subtle)));
}
.settings-ia-human-pattern__cta{
  font-size:12px;font-weight:800;color:var(--color-violet-label);letter-spacing:.03em;
}
.settings-ia-state-strip{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.settings-ia-state-chip{
  font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 9px;border-radius:8px;
  border:1px solid var(--color-border-tertiary,var(--color-border));
  color:var(--text3,var(--color-text-muted));
  background:var(--surface-3,var(--color-subtle));
}
.settings-section--cycle-premium{
  border-color:var(--color-info-border);
  background:color-mix(in srgb,var(--color-info) 8%,var(--surface-2));
  box-shadow:var(--shadow-sm);
}
[data-theme='dark'] .settings-section--cycle-premium{
  border-color:rgba(56,189,248,.16);
  background:linear-gradient(165deg,rgba(56,189,248,.06) 0%,rgba(0,0,0,.1) 55%,rgba(167,139,250,.04) 100%);
  box-shadow:0 16px 44px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.06) inset;
}
.settings-cycle-parcours{
  margin:4px 0 20px;padding:20px 18px 18px;border-radius:16px;
  border:1px solid var(--color-info-border);
  background:var(--color-info-bg);
}
[data-theme='dark'] .settings-cycle-parcours{
  border:1px solid rgba(56,189,248,.22);
  background:linear-gradient(180deg,rgba(56,189,248,.1),rgba(8,12,18,.35));
}
.settings-cycle-parcours__title{
  margin:0 0 16px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--color-info-text);
}
.settings-cycle-rail{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px 8px;
  position:relative;padding:10px 4px 6px;
}
.settings-cycle-rail::before{
  content:'';position:absolute;left:6%;right:6%;top:20px;height:2px;z-index:0;
  background:linear-gradient(90deg,rgba(56,189,248,.2),rgba(167,139,250,.35),rgba(34,197,94,.25));
  border-radius:2px;
}
.settings-cycle-rail__step{
  flex:1;min-width:72px;max-width:140px;position:relative;z-index:1;
  display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;
}
.settings-cycle-rail__dot{
  width:13px;height:13px;border-radius:50%;
  background:linear-gradient(135deg,var(--color-primary),var(--color-success));
  box-shadow:0 0 0 3px var(--surface-2),0 0 12px color-mix(in srgb,var(--color-primary) 35%,transparent);
  flex-shrink:0;
}
.settings-cycle-rail__name{font-size:11px;font-weight:800;color:var(--text);line-height:1.2;letter-spacing:-.01em}
.settings-cycle-rail__hint{font-size:10px;font-weight:500;color:var(--text3);line-height:1.35;max-width:13ch}
@media (max-width:700px){
  .settings-cycle-rail::before{display:none}
  .settings-cycle-rail{flex-direction:column;align-items:stretch;padding-left:12px;border-left:2px solid var(--color-info-border)}
  .settings-cycle-rail__step{flex-direction:row;max-width:none;align-items:center;text-align:left;gap:12px}
  .settings-cycle-rail__hint{max-width:none;flex:1}
}
.settings-section--sensitive-access .settings-sensitive-access-toolbar{margin-bottom:8px}
.settings-sensitive-access-master{align-items:center}
.settings-sensitive-access-hint{margin:8px 0 0;font-size:12.5px;line-height:1.5;color:var(--text2);max-width:72ch}
.settings-sensitive-actions-grid{display:grid;gap:12px;margin-top:8px}
.settings-sensitive-action-row{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px 16px;
  padding:12px 14px;border-radius:14px;border:1px solid var(--color-border-tertiary);background:var(--surface-3);
}
.settings-sensitive-action-row strong{display:block;font-size:13px;font-weight:700;color:var(--text)}
.settings-sensitive-action-hint{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--text3);max-width:52ch}
.settings-sensitive-pin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;max-width:420px}
@media (max-width:520px){.settings-sensitive-pin-grid{grid-template-columns:1fr}}
.settings-sensitive-select-label{flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--text2)}
.settings-subsection__lead--tight{margin-top:6px;font-size:12.5px;line-height:1.5;color:var(--text3)}

html[data-theme='light'] .settings-cycle-map__step{
  background:#f3f4f6;
  border-color:rgba(15,23,42,.12);
  color:#374151;
}
html[data-theme='light'] .settings-cycle-map__arrow{
  color:#6b7280;
  opacity:1;
}
html[data-theme='light'] .settings-hero-premium__eyebrow{
  color:#6b7280;
}

/* Mode clair : bandeau IA — pastilles et CTA lisibles si variables héritées diffèrent */
html[data-theme='light'] .settings-ia-human-pattern__cta{
  color:var(--color-violet-ink);
}
html[data-theme='light'] .settings-ia-state-chip{
  background:var(--surface-2);
  color:var(--text-secondary);
  border-color:color-mix(in srgb,var(--text-primary) 14%,var(--surface-1));
}
`;

export function ensureSettingsPageStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
