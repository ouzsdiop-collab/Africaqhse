const STYLE_ID = 'qhse-settings-page-styles';

const CSS = `
.settings-page{gap:1.5rem;display:flex;flex-direction:column;min-width:0}
.settings-page .settings-hero.content-card{
  border-radius:18px;border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(165deg,rgba(255,255,255,.05) 0%,rgba(8,12,20,.4) 100%);
  box-shadow:0 18px 48px rgba(0,0,0,.22);
}
.settings-page .settings-hero .content-card-lead{max-width:62ch;line-height:1.55}
.settings-section{
  border-radius:16px;border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.08);padding:20px 22px 22px;
  box-shadow:0 1px 0 rgba(255,255,255,.04) inset;
}
.settings-section__head{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06)}
.settings-section__kicker{
  font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--text3);margin:0 0 6px;
}
.settings-section__title{margin:0;font-size:1.05rem;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.settings-section__lead{margin:8px 0 0;font-size:13px;line-height:1.5;color:var(--text2);max-width:60ch}
.settings-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:800px){.settings-grid-2{grid-template-columns:1fr}}
.settings-link-card{
  display:flex;flex-direction:column;gap:10px;padding:16px 18px;border-radius:14px;
  border:1px solid rgba(148,163,184,.14);background:rgba(255,255,255,.03);text-align:left;min-height:0;
}
.settings-link-card__label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.settings-link-card__title{margin:0;font-size:15px;font-weight:700;color:var(--text)}
.settings-link-card__desc{margin:0;font-size:13px;line-height:1.45;color:var(--text2);flex:1}
.settings-link-card .btn{align-self:flex-start;margin-top:4px}
.settings-alert-list{display:grid;gap:12px;margin-top:4px}
.settings-alert-row{
  display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;
  padding:14px 16px;border-radius:14px;border:1px solid rgba(148,163,184,.1);
  background:rgba(255,255,255,.02);
}
@media (max-width:640px){.settings-alert-row{grid-template-columns:1fr}}
.settings-alert-main{min-width:0}
.settings-alert-name{margin:0 0 4px;font-size:14px;font-weight:700;color:var(--text)}
.settings-alert-meta{margin:0;font-size:12px;line-height:1.45;color:var(--text3)}
.settings-alert-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.settings-tag{
  font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 8px;border-radius:8px;
  border:1px solid rgba(148,163,184,.2);color:var(--text2);
}
.settings-tag--info{border-color:rgba(56,189,248,.35);color:#7dd3fc;background:rgba(56,189,248,.08)}
.settings-tag--warning{border-color:rgba(251,191,36,.4);color:#fde68a;background:rgba(251,191,36,.08)}
.settings-tag--critique{border-color:rgba(248,113,113,.45);color:#fecaca;background:rgba(248,113,113,.1)}
.settings-switch-wrap{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.settings-switch{
  position:relative;width:44px;height:24px;border-radius:999px;border:1px solid rgba(148,163,184,.25);
  background:rgba(0,0,0,.25);cursor:pointer;padding:0;flex-shrink:0;
  transition:background .2s,border-color .2s;
}
.settings-switch[aria-checked="true"]{
  background:rgba(34,197,94,.25);border-color:rgba(34,197,94,.45);
}
.settings-switch::after{
  content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;
  background:var(--text);opacity:.9;transition:transform .2s;
}
.settings-switch[aria-checked="true"]::after{transform:translateX(20px);background:#86efac}
.settings-switch-label{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}
.settings-prefs-grid{display:grid;gap:12px;margin-top:8px}
.settings-pref-row{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.08);
}
.settings-pref-row span{font-size:13px;color:var(--text2)}
.settings-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
@media (max-width:700px){.settings-check-grid{grid-template-columns:1fr}}
.settings-check{
  display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.02);cursor:pointer;font-size:13px;color:var(--text2);
  line-height:1.4;
}
.settings-check input{accent-color:#38bdf8;margin-top:2px;flex-shrink:0}
.settings-ia-grid{display:grid;gap:12px;margin-top:10px}
.settings-ia-module{
  padding:14px 16px;border-radius:14px;border:1px solid rgba(168,85,247,.2);
  background:linear-gradient(135deg,rgba(168,85,247,.06),rgba(255,255,255,.02));
}
.settings-ia-module__top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.settings-ia-module__name{margin:0;font-size:14px;font-weight:700;color:var(--text);min-width:0;flex:1}
.settings-badge-ia{
  font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:4px 8px;border-radius:6px;
  color:#e9d5ff;background:rgba(168,85,247,.2);border:1px solid rgba(196,181,253,.35);
}
.settings-mode-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.settings-mode-btn{
  padding:8px 12px;border-radius:10px;border:1px solid rgba(148,163,184,.2);background:rgba(0,0,0,.15);
  color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;
}
.settings-mode-btn--on{border-color:rgba(56,189,248,.45);color:#bae6fd;background:rgba(56,189,248,.12)}
.settings-ia-states{margin:12px 0 0;padding:10px 12px;border-radius:10px;border:1px dashed rgba(148,163,184,.15);font-size:12px;color:var(--text3);line-height:1.5}
.settings-cycle-stepper{
  display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 18px;counter-reset:step;
}
.settings-cycle-step{
  flex:1;min-width:120px;padding:14px 14px 12px;border-radius:14px;
  border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.025);position:relative;
}
.settings-cycle-step::before{
  counter-increment:step;content:counter(step);
  display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:10px;
  font-size:12px;font-weight:800;background:rgba(56,189,248,.15);color:#7dd3fc;margin-bottom:8px;
}
.settings-cycle-step__label{margin:0;font-size:12px;font-weight:700;color:var(--text);line-height:1.35}
.settings-cycle-step__hint{margin:6px 0 0;font-size:11px;line-height:1.4;color:var(--text3)}
.settings-status-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.settings-pill{
  font-size:11px;font-weight:600;padding:6px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.15);color:var(--text2);
}
.settings-pill--muted{opacity:.85}
.settings-human-row{
  display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding:12px 14px;border-radius:12px;
  background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);
}
.settings-human-row span{font-size:12px;font-weight:700;color:#86efac;letter-spacing:.02em}
.settings-actions-bar{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
/* —— HQ / premium layer (additive — classes existantes inchangées) —— */
.settings-page--hq{gap:1.75rem}
.settings-page--hq .settings-section{
  padding:22px 24px 24px;border-radius:18px;
  border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(165deg,rgba(255,255,255,.035) 0%,rgba(0,0,0,.1) 100%);
  box-shadow:0 14px 40px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.05) inset;
}
.settings-page--hq .settings-section__head{
  margin-bottom:16px;padding-bottom:14px;
  border-bottom:1px solid rgba(148,163,184,.1);
}
.settings-hero-premium{padding:2px 2px 4px}
.settings-hero-premium__top{max-width:68ch}
.settings-hero-premium__eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#94a3b8;margin:0 0 10px;
}
.settings-hero-premium__eyebrow::before{
  content:'';width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#a78bfa);
  box-shadow:0 0 12px rgba(56,189,248,.5);
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
  border:1px solid rgba(148,163,184,.18);color:var(--text2);
  background:rgba(0,0,0,.12);
}
.settings-hero-premium__meta--note{margin-top:10px;opacity:.92}
.settings-hero-chip--note{
  font-size:10px;font-weight:600;opacity:.88;
  border-color:rgba(148,163,184,.12);background:rgba(0,0,0,.08);color:var(--text3);
}
.settings-cycle-bridge + .settings-subsection{
  margin-top:12px;padding-top:0;border-top:none;
}
.settings-toc{
  display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:18px;
  border-top:1px solid rgba(148,163,184,.12);
}
.settings-toc__btn{
  border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.03);
  color:var(--text2);font-size:12px;font-weight:600;padding:8px 12px;border-radius:10px;cursor:pointer;
  transition:border-color .15s,background .15s,color .15s;
}
.settings-toc__btn:hover{
  border-color:rgba(56,189,248,.35);color:#e2e8f0;background:rgba(56,189,248,.08);
}
.settings-subsection{margin-top:20px;padding-top:18px;border-top:1px solid rgba(148,163,184,.08)}
.settings-subsection:first-of-type{margin-top:0;padding-top:0;border-top:none}
.settings-subsection__title{
  margin:0 0 6px;font-size:13px;font-weight:800;letter-spacing:-.01em;color:var(--text);
}
.settings-subsection__lead{margin:0 0 14px;font-size:12.5px;line-height:1.5;color:var(--text3);max-width:62ch}
.settings-cycle-bridge{
  display:grid;gap:12px;margin:14px 0 18px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(56,189,248,.2);background:rgba(56,189,248,.06);
}
.settings-cycle-bridge__title{margin:0;font-size:12px;font-weight:800;color:#bae6fd;letter-spacing:.04em;text-transform:uppercase}
.settings-cycle-bridge__text{margin:0;font-size:12.5px;line-height:1.55;color:var(--text2)}
.settings-usage-matrix{display:grid;gap:12px;margin-top:4px}
@media (min-width:900px){.settings-usage-matrix{grid-template-columns:repeat(2,minmax(0,1fr))}}
.settings-usage-card{
  display:flex;flex-direction:column;gap:12px;padding:14px 16px;border-radius:14px;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);
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
  padding:8px 11px;border-radius:10px;border:1px solid rgba(148,163,184,.14);
  background:rgba(255,255,255,.03);color:var(--text2);
}
.settings-cycle-map__arrow{color:var(--text3);font-weight:800;opacity:.7}
.settings-status-pills{margin-top:14px}
.settings-status-pills__cap{margin:0 0 8px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em}
.settings-pill--watch{border-color:rgba(56,189,248,.35);color:#bae6fd;background:rgba(56,189,248,.1)}
.settings-pill--fix{border-color:rgba(251,191,36,.4);color:#fde68a;background:rgba(251,191,36,.1)}
.settings-pill--done{border-color:rgba(52,211,153,.4);color:#a7f3d0;background:rgba(52,211,153,.08)}
.settings-pill--verify{border-color:rgba(167,139,250,.4);color:#ddd6fe;background:rgba(167,139,250,.1)}
.settings-pill--ok{border-color:rgba(34,197,94,.4);color:#bbf7d0;background:rgba(34,197,94,.1)}
.settings-pill--reject{border-color:rgba(248,113,113,.4);color:#fecaca;background:rgba(248,113,113,.12)}
.settings-show-reject-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
  margin-top:12px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.1);border:1px solid rgba(148,163,184,.08);
}
.settings-show-reject-row span{font-size:12px;color:var(--text2);max-width:42ch;line-height:1.45}
.settings-org-context-bar{margin-top:16px;padding-top:18px;border-top:1px solid rgba(148,163,184,.1)}
.settings-org-context-bar__cap{margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.settings-org-context-bar__actions{display:flex;flex-wrap:wrap;gap:10px}
.settings-ia-human-pattern{
  display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin:14px 0 16px;
  padding:14px 16px;border-radius:14px;border:1px solid rgba(168,85,247,.22);
  background:rgba(168,85,247,.07);
}
.settings-ia-human-pattern__cta{
  font-size:12px;font-weight:800;color:#e9d5ff;letter-spacing:.03em;
}
.settings-ia-state-strip{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.settings-ia-state-chip{
  font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 9px;border-radius:8px;
  border:1px solid rgba(148,163,184,.18);color:var(--text3);background:rgba(0,0,0,.12);
}
.settings-section--cycle-premium{
  border-color:rgba(56,189,248,.16);
  background:linear-gradient(165deg,rgba(56,189,248,.06) 0%,rgba(0,0,0,.1) 55%,rgba(167,139,250,.04) 100%);
  box-shadow:0 16px 44px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.06) inset;
}
.settings-cycle-parcours{
  margin:4px 0 20px;padding:20px 18px 18px;border-radius:16px;
  border:1px solid rgba(56,189,248,.22);
  background:linear-gradient(180deg,rgba(56,189,248,.1),rgba(8,12,18,.35));
}
.settings-cycle-parcours__title{
  margin:0 0 16px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7dd3fc;
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
  background:linear-gradient(135deg,#38bdf8,#4ade80);
  box-shadow:0 0 0 4px rgba(8,12,20,.88),0 0 16px rgba(56,189,248,.35);
  flex-shrink:0;
}
.settings-cycle-rail__name{font-size:11px;font-weight:800;color:var(--text);line-height:1.2;letter-spacing:-.01em}
.settings-cycle-rail__hint{font-size:10px;font-weight:500;color:var(--text3);line-height:1.35;max-width:13ch}
@media (max-width:700px){
  .settings-cycle-rail::before{display:none}
  .settings-cycle-rail{flex-direction:column;align-items:stretch;padding-left:12px;border-left:2px solid rgba(56,189,248,.25)}
  .settings-cycle-rail__step{flex-direction:row;max-width:none;align-items:center;text-align:left;gap:12px}
  .settings-cycle-rail__hint{max-width:none;flex:1}
}
.settings-section--sensitive-access .settings-sensitive-access-toolbar{margin-bottom:8px}
.settings-sensitive-access-master{align-items:center}
.settings-sensitive-access-hint{margin:8px 0 0;font-size:12.5px;line-height:1.5;color:var(--text2);max-width:72ch}
.settings-sensitive-actions-grid{display:grid;gap:12px;margin-top:8px}
.settings-sensitive-action-row{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px 16px;
  padding:12px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.06);
}
.settings-sensitive-action-row strong{display:block;font-size:13px;font-weight:700;color:var(--text)}
.settings-sensitive-action-hint{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--text3);max-width:52ch}
.settings-sensitive-pin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;max-width:420px}
@media (max-width:520px){.settings-sensitive-pin-grid{grid-template-columns:1fr}}
.settings-sensitive-select-label{flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--text2)}
.settings-subsection__lead--tight{margin-top:6px;font-size:12.5px;line-height:1.5;color:var(--text3)}
`;

export function ensureSettingsPageStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
