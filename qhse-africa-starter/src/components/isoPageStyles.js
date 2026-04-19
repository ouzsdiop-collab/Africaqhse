const STYLE_ID = 'qhse-iso-page-styles';

const CSS = `
.iso-page .iso-header-card .content-card-head{align-items:flex-start}
.iso-global-snapshot{border-radius:16px;padding:20px 22px;margin-top:4px;border:1px solid rgba(148,163,184,.16);background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(255,255,255,.02))}
.iso-global-snapshot--ok{border-color:rgba(34,197,94,.25);background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(255,255,255,.02))}
.iso-global-snapshot--watch{border-color:rgba(245,158,11,.28);background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(255,255,255,.02))}
.iso-global-snapshot--risk{border-color:rgba(239,68,68,.3);background:linear-gradient(135deg,rgba(239,68,68,.1),rgba(255,255,255,.02))}
.iso-global-snapshot-inner{display:flex;flex-wrap:wrap;gap:20px;align-items:center}
.iso-global-score{min-width:120px;text-align:center}
.iso-global-pct{font-size:clamp(2.5rem,6vw,3.25rem);font-weight:800;letter-spacing:-.04em;line-height:1;color:var(--text)}
.iso-global-pct-suffix{font-size:1.25rem;font-weight:700;color:var(--text2);vertical-align:super;margin-left:2px}
.iso-global-score-caption{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-top:4px}
.iso-global-copy{flex:1;min-width:200px}
.iso-global-label{font-size:18px;font-weight:800;color:var(--text);margin-bottom:6px}
.iso-global-message{margin:0;font-size:14px;line-height:1.5;color:var(--text2)}
.iso-global-meta{margin-top:10px;font-size:12px;font-weight:600;color:var(--text3)}
.iso-points-panel{border-radius:16px;padding:18px 20px;border:1px solid rgba(148,163,184,.18);background:rgba(0,0,0,.12);margin-top:12px}
.iso-points-panel-title{margin:0 0 6px;font-size:17px;font-weight:800;color:var(--text)}
.iso-points-panel-lead{margin:0 0 16px;font-size:13px;line-height:1.45;color:var(--text2)}
.iso-points-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media (max-width:900px){.iso-points-grid{grid-template-columns:1fr}}
.iso-points-col{border-radius:12px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.1);min-width:0}
.iso-points-col-head{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.iso-points-icon{width:8px;height:8px;border-radius:999px;flex-shrink:0}
.iso-points-icon--req{background:linear-gradient(135deg,#f59e0b,#ef4444)}
.iso-points-icon--doc{background:linear-gradient(135deg,#14b8a6,#0f766e)}
.iso-points-icon--aud{background:linear-gradient(135deg,#22c55e,#14b8a6)}
.iso-points-metric{font-size:14px;font-weight:700;color:var(--text);margin-bottom:10px}
.iso-points-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.iso-points-list li{min-width:0}
.iso-points-list-empty,.iso-points-list-more{font-size:12px;color:var(--text2);line-height:1.4}
.iso-points-list-more{color:var(--text3)}
.iso-points-action-link{display:block;width:100%;text-align:left;background:none;border:none;padding:0;font:inherit;font-weight:700;color:var(--accent,#2dd4bf);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.iso-points-action-link:hover{filter:brightness(1.1)}
.iso-points-mini-badge{font-size:10px!important;padding:2px 6px!important;vertical-align:middle}
.iso-points-list-sub{display:block;font-size:11px;color:var(--text3);margin-top:4px}
.iso-points-doc-tag{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;border-radius:6px;margin-right:8px;background:var(--color-danger-bg);color:var(--color-danger-text);border:1px solid var(--color-danger-border)}
.iso-points-list-note{margin:4px 0 0;font-size:12px;color:var(--text2);line-height:1.4}
.iso-norms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:4px}
@media (max-width:1000px){.iso-norms-grid{grid-template-columns:1fr}}
.iso-norms-grid--lite{margin-top:8px}
.iso-norm-card{border:1px solid rgba(148,163,184,.14);border-radius:14px;padding:14px 16px;background:rgba(255,255,255,.02);display:grid;gap:8px;min-width:0}
.iso-norm-card--lite{padding:12px 14px;gap:10px}
.iso-norm-card-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
.iso-norm-line{margin:0;font-size:13px;line-height:1.45;color:var(--text2)}
.iso-norm-id{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)}
.iso-norm-title{margin:0;font-size:15px;font-weight:700;line-height:1.3;color:var(--text)}
.iso-norm-hint{margin:0;font-size:12px;line-height:1.45;color:var(--text2)}
.iso-req-hot-wrap{display:grid;gap:10px;margin-top:8px}
.iso-req-hot-empty{margin:0;padding:14px;border-radius:12px;border:1px dashed rgba(148,163,184,.2);font-size:13px;color:var(--text2);line-height:1.45}
.iso-req-hot-item{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.02)}
.iso-req-hot-main{flex:1;min-width:180px}
.iso-req-hot-title{font-weight:700;font-size:14px;color:var(--text);line-height:1.3}
.iso-req-hot-sub{font-size:12px;color:var(--text3);margin-top:4px}
.iso-req-hot-btn{font-size:12px!important;padding:8px 14px!important;min-height:36px!important}
.iso-toggle-full-req,.iso-toggle-full-docs{margin-top:0;width:100%;max-width:320px;align-self:flex-start;flex-shrink:0;position:relative;z-index:1}
.iso-req-full-wrap{margin-top:8px}
.iso-doc-attention-list{display:grid;gap:14px;margin-top:8px}
.iso-doc-attention-list--unified{gap:10px}
.iso-doc-attention-row--unified{padding:12px 14px}
.iso-doc-attention-row-top{display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px 10px;min-width:0}
.iso-doc-attention-status-badge{font-size:10px!important;padding:2px 8px!important;flex-shrink:0}
.iso-doc-attention-block-title{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.iso-doc-attention-row{
  padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.12);border:1px solid rgba(148,163,184,.1);
  display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0;
}
.iso-doc-attention-row strong{display:block;font-size:13px;color:var(--text);min-width:0;word-break:break-word;line-height:1.35}
.iso-doc-attention-note{margin:6px 0 0;font-size:12px;color:var(--text2);line-height:1.4}
.iso-doc-attention-empty{margin:0;font-size:13px;color:var(--text2);line-height:1.45}
.iso-docs-priority{display:flex;flex-direction:column;align-items:stretch;gap:14px;min-width:0}
.iso-section-stack{display:grid;gap:14px;min-width:0}
.iso-table-wrap{overflow-x:auto;margin-top:8px;border-radius:12px;border:1px solid rgba(148,163,184,.1);max-width:100%}
.iso-doc-proof-strip{display:flex;flex-direction:column;align-items:stretch;gap:0;min-width:0;width:100%;box-sizing:border-box}
.iso-doc-proof-strip-hint{margin:8px 0 4px;font-size:12px;line-height:1.45;color:var(--text2)}
.empty-state.empty-state--iso-strip{padding:14px 12px;margin:8px 0 0;max-width:none;text-align:left}
.empty-state.empty-state--iso-strip .empty-state__title{font-size:13px}
.empty-state.empty-state--iso-strip .empty-state__subtitle{font-size:11px;line-height:1.4}
.empty-state.empty-state--iso-doc-table{padding:clamp(18px,2.5vw,28px) 16px;margin:0;max-width:62ch;text-align:left}
.iso-table{display:grid;grid-auto-rows:auto;gap:0;min-width:720px;width:100%;box-sizing:border-box}
.iso-table-head,.iso-table-row{display:grid;grid-template-columns:minmax(180px,2.2fr) minmax(100px,1fr) minmax(110px,1fr) minmax(100px,1fr) minmax(110px,1fr);gap:10px;padding:10px 14px;align-items:center;font-size:12px}
.iso-req-table .iso-table-head,.iso-req-table .iso-table-row{
  grid-template-columns:minmax(200px,2.4fr) minmax(92px,0.9fr) minmax(130px,1.1fr) minmax(110px,1fr) minmax(140px,1.3fr);
  min-width:860px;
}
.iso-cell-small{font-size:11px;font-weight:600;margin-top:4px;display:inline-block}
.iso-req-action-cell{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:10px;
  flex-wrap:wrap;
  position:relative;
  z-index:2;
  min-width:0;
}
.iso-analyze-btn{
  font-size:12px!important;
  padding:8px 14px!important;
  min-height:38px!important;
  white-space:nowrap;
  position:relative;
  z-index:1;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:0!important;
  flex-shrink:0;
}
.iso-analyze-btn::before,
.iso-analyze-btn::after{
  content:none!important;
  display:none!important;
}
.iso-table-head{font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);background:rgba(0,0,0,.15);border-bottom:1px solid rgba(148,163,184,.12)}
.iso-table-row{border-bottom:1px solid rgba(148,163,184,.08);padding:12px 14px}
.iso-table-row:last-child{border-bottom:none}
.iso-table-row .iso-cell-strong{font-weight:700;color:var(--text);line-height:1.35}
.iso-table-row .iso-cell-muted{color:var(--text2);line-height:1.35}
.iso-doc-table .iso-table-head,.iso-doc-table .iso-table-row{
  grid-template-columns:minmax(140px,1.6fr) minmax(72px,0.75fr) minmax(88px,0.85fr) minmax(88px,0.85fr) minmax(88px,0.85fr) minmax(100px,0.95fr) minmax(92px,0.75fr) minmax(140px,1.2fr);
  min-width:920px;
}
.iso-doc-row-actions{display:flex;flex-direction:column;gap:6px;align-items:stretch;max-width:200px}
.iso-doc-action-btn{font-size:10px!important;padding:6px 8px!important;min-height:auto!important;line-height:1.25;white-space:normal;text-align:center}
.iso-doc-status-cell .iso-doc-compliance-badge{font-size:10px!important;padding:2px 8px!important}
.iso-doc-state-summary{
  margin-bottom:12px;padding:14px 16px;border-radius:14px;border:1px solid rgba(148,163,184,.14);
  background:linear-gradient(135deg,rgba(15,23,42,.5),rgba(0,0,0,.12));
}
.iso-doc-state-summary__head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:10px}
.iso-doc-state-summary__title{font-size:15px;font-weight:800;color:var(--text)}
.iso-doc-state-summary__hint{font-size:11px;color:var(--text3)}
.iso-doc-state-summary__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media (max-width:700px){.iso-doc-state-summary__grid{grid-template-columns:1fr}}
.iso-doc-state-summary__metric{
  padding:10px 12px;border-radius:10px;border:1px solid rgba(148,163,184,.16);background:rgba(255,255,255,.08);
  display:flex;flex-direction:column;gap:4px;min-width:0;
}
.iso-doc-state-summary__val{font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text);text-shadow:0 1px 0 rgba(0,0,0,.25)}
.iso-doc-state-summary__val--ok{color:#4ade80}
.iso-doc-state-summary__val--warn{color:#fbbf24}
.iso-doc-state-summary__val--bad{color:#f87171}
.iso-doc-state-summary__lbl{font-size:11px;font-weight:700;color:rgba(226,232,240,.82);text-transform:uppercase;letter-spacing:.06em}
.iso-registry-doc-impact{
  margin-bottom:10px;padding:12px 14px;border-radius:12px;border:1px solid rgba(239,68,68,.22);
  background:rgba(239,68,68,.07);
}
.iso-registry-doc-impact__inner{display:flex;flex-wrap:wrap;align-items:flex-start;gap:10px}
.iso-registry-doc-impact__text{margin:0;flex:1;min-width:200px;font-size:13px;line-height:1.45;color:var(--text2)}
.iso-registry-doc-impact__link{font-size:12px;font-weight:700}
.iso-doc-compliance--valide{box-shadow:0 0 0 1px rgba(34,197,94,.18) inset}
.iso-doc-compliance--a_renouveler{box-shadow:0 0 0 1px rgba(245,158,11,.22) inset}
.iso-doc-compliance--expire{box-shadow:0 0 0 1px rgba(239,68,68,.28) inset}
.iso-doc-compliance--sans_echeance{opacity:.9}
.iso-review-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:8px}
@media (max-width:640px){.iso-review-grid{grid-template-columns:1fr}}
.iso-review-tile{border-radius:12px;border:1px solid rgba(148,163,184,.12);padding:12px 14px;background:rgba(255,255,255,.02)}
.iso-review-tile span:first-child{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.iso-review-tile .iso-review-value{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.iso-review-tile .iso-review-detail{display:block;margin-top:4px;font-size:12px;color:var(--text2);line-height:1.4}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.iso-page .iso-synthese-grid.iso-review-grid{
  gap:0;
  margin-top:8px;
  border:1px solid rgba(148,163,184,.12);
  border-radius:12px;
  overflow:hidden;
}
.iso-page .iso-review-tile.iso-synthese-bloc{
  padding:16px;
  margin:0;
  border:none;
  border-bottom:1px solid rgba(148,163,184,.2);
  border-right:1px solid rgba(148,163,184,.14);
  border-radius:0;
  background:rgba(255,255,255,.02);
  animation:fadeSlideIn .3s ease forwards;
  opacity:0;
}
.iso-page .iso-review-tile.iso-synthese-bloc:nth-child(2n){border-right:none}
.iso-page .iso-review-tile.iso-synthese-bloc:nth-last-child(-n+2){border-bottom:none}
@media (max-width:640px){
  .iso-page .iso-review-tile.iso-synthese-bloc{border-right:none}
  .iso-page .iso-review-tile.iso-synthese-bloc:nth-last-child(-n+2){border-bottom:1px solid rgba(148,163,184,.2)}
  .iso-page .iso-review-tile.iso-synthese-bloc:last-child{border-bottom:none}
}
.iso-page .iso-review-tile.iso-synthese-bloc:nth-child(1){animation-delay:0ms}
.iso-page .iso-review-tile.iso-synthese-bloc:nth-child(2){animation-delay:80ms}
.iso-page .iso-review-tile.iso-synthese-bloc:nth-child(3){animation-delay:160ms}
.iso-page .iso-review-tile.iso-synthese-bloc:nth-child(4){animation-delay:240ms}
.iso-page .iso-review-tile.iso-synthese-bloc>span:first-child{
  font-size:14px;
  font-weight:600;
  letter-spacing:normal;
  text-transform:none;
  color:var(--color-text-primary,var(--text));
  margin-bottom:8px;
}
.iso-pilotage-aside{display:grid;gap:14px;align-content:start;min-width:0}

/* —— Hiérarchie visuelle (page ISO hub, dark premium) —— tout préfixé .iso-page pour limiter la portée —— */
.iso-page.iso-page--hub{
  gap:1.75rem;
}
.iso-page.iso-page--hub .iso-hub-intro.content-card{
  background:rgba(0,0,0,.06);
  border:1px solid rgba(148,163,184,.11);
  box-shadow:0 1px 0 rgba(255,255,255,.035) inset;
  border-radius:16px;
}
.iso-page.iso-page--hub .iso-hub-intro .content-card-head{margin-bottom:0}
/* Bandeau synthèse : lecture globale avant le hub normes */
.iso-page.iso-page--hub .iso-summary-band{
  width:100%;
  min-width:0;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-snapshot{
  margin-top:0;
  width:100%;
  box-sizing:border-box;
  border-radius:18px;
  padding:20px 24px;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-snapshot-inner{
  gap:22px;
  align-items:center;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-pct{
  font-size:clamp(2.35rem,5.5vw,3.1rem);
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-label{
  font-size:17px;
}
.iso-page.iso-page--hub .iso-summary-band .iso-global-message{
  font-size:14px;
  line-height:1.52;
}
/* Cœur module : normes pleine largeur puis IA — hub normes visuellement dominant */
.iso-page.iso-page--hub .iso-focus-zone{
  display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(280px,380px);
  gap:1.65rem;
  align-items:stretch;
  width:100%;
  max-width:min(1180px,100%);
  margin-inline:auto;
  min-width:0;
}
.iso-page.iso-page--hub .iso-focus-zone--stack{
  display:flex;
  flex-direction:column;
  gap:1.75rem;
  align-items:stretch;
}
@media (max-width:960px){
  .iso-page.iso-page--hub .iso-focus-zone:not(.iso-focus-zone--stack){
    grid-template-columns:1fr;
  }
}
.iso-page.iso-page--hub .iso-focus-zone .iso-norms-hub{
  width:100%;
  max-width:none;
  margin-inline:0;
  min-width:0;
}
.iso-page.iso-page--hub .iso-focus-zone .iso-norms-central.content-card{
  width:100%;
}
.iso-page.iso-page--hub .iso-focus-zone .iso-norms-grid{
  gap:18px;
}
@media (min-width:900px){
  .iso-page.iso-page--hub .iso-focus-zone .iso-norms-hub .iso-norms-grid{
    grid-template-columns:repeat(3,minmax(0,1fr));
  }
}
.iso-page.iso-page--hub .iso-focus-zone .iso-ai-spotlight{
  display:flex;
  flex-direction:column;
  min-height:100%;
}
.iso-page.iso-page--hub .iso-focus-zone .iso-ai-spotlight .iso-ai-steps{
  margin-top:auto;
  padding-top:4px;
}
/* Repère visuel actions prioritaires */
.iso-page.iso-page--hub .iso-priority-shell{
  position:relative;
  max-width:min(1180px,100%);
  margin-inline:auto;
  padding-left:14px;
  width:100%;
  box-sizing:border-box;
}
.iso-page.iso-page--hub .iso-priority-shell::before{
  content:'';
  position:absolute;
  left:0;
  top:10px;
  bottom:10px;
  width:4px;
  border-radius:999px;
  background:linear-gradient(180deg,#fbbf24,#f97316,#ef4444);
  opacity:.85;
}
/* Second niveau : libellé de zone puis exigences / docs / revue */
.iso-page.iso-page--hub .iso-secondary-wrap{
  max-width:min(1180px,100%);
  margin-inline:auto;
  width:100%;
  min-width:0;
}
.iso-page.iso-page--hub .iso-zone-kicker{
  margin:0 0 12px;
  padding:0 2px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--text3);
}
/* Zone secondaire : exigences, documents, revue */
.iso-page.iso-page--hub .iso-secondary-zone{
  display:flex;
  flex-direction:column;
  gap:1.5rem;
  margin-top:.35rem;
  padding-top:1.65rem;
  border-top:1px solid rgba(148,163,184,.12);
}
/* Bloc central normes : palier visuel maximal */
.iso-page.iso-page--hub .iso-norms-central.content-card{
  position:relative;
  z-index:1;
  border-radius:20px;
  border:1px solid rgba(125,211,252,.24);
  background:linear-gradient(165deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.022) 45%,rgba(8,12,20,.35) 100%);
  box-shadow:
    0 0 0 1px rgba(125,211,252,.1),
    0 22px 56px rgba(0,0,0,.3),
    0 1px 0 rgba(255,255,255,.07) inset;
}
.iso-page.iso-page--hub .iso-norms-hero-wrap .content-card-head{padding-bottom:6px;border-bottom:1px solid rgba(125,211,252,.1);margin-bottom:4px}
.iso-page.iso-page--hub .iso-norms-hero-wrap .content-card-head h3{
  font-size:1.32rem;
  letter-spacing:-.025em;
}
.iso-page.iso-page--hub .iso-norms-hero-wrap .content-card-lead{
  max-width:62ch;
  line-height:1.55;
  color:var(--text2);
}
.iso-page.iso-page--hub .iso-norms-hero-wrap .iso-norms-grid{
  margin-top:14px;
  gap:14px;
}
.iso-page.iso-page--hub .iso-norm-card--hero{
  padding:16px 18px;
  border-radius:16px;
  border-color:rgba(148,163,184,.2);
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.012));
}
.iso-page.iso-page--hub .iso-norm-card--hero .iso-norm-title{
  margin:6px 0 6px;
  font-size:14px;
  font-weight:700;
  line-height:1.3;
}
.iso-page.iso-page--hub .iso-norm-card--hero .iso-norm-hint{
  margin:10px 0 0;
  font-size:12px;
  line-height:1.45;
}
/* Assistant conformité : second palier, halo distinct des cartes neutres */
.iso-page.iso-page--hub .iso-ai-spotlight{
  position:relative;
  overflow:hidden;
  border-radius:18px;
  padding:22px 26px 24px;
  border:1px solid rgba(125,211,252,.32);
  background:linear-gradient(135deg,rgba(56,189,248,.16),rgba(168,85,247,.1),rgba(255,255,255,.028));
  box-shadow:
    0 1px 0 rgba(255,255,255,.07) inset,
    0 0 0 1px rgba(56,189,248,.08),
    0 16px 48px rgba(0,0,0,.22);
}
.iso-page.iso-page--hub .iso-ai-spotlight::before{
  content:'';
  position:absolute;
  inset:0;
  background:radial-gradient(ellipse 70% 55% at 15% -10%,rgba(56,189,248,.2),transparent 52%);
  pointer-events:none;
}
.iso-page.iso-page--hub .iso-ai-visual{
  position:absolute;
  top:-28%;
  right:-12%;
  width:min(220px,55vw);
  height:min(220px,55vw);
  border-radius:50%;
  background:radial-gradient(circle at 32% 28%,rgba(192,132,252,.42),rgba(56,189,248,.22) 42%,transparent 68%);
  filter:blur(0.5px);
  opacity:.95;
  pointer-events:none;
  z-index:0;
}
.iso-page.iso-page--hub .iso-ai-spotlight>*{
  position:relative;
  z-index:1;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-visual{
  z-index:0;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-badge{
  display:inline-flex;
  align-items:center;
  gap:8px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#a5f3fc;
  margin-bottom:10px;
  padding:6px 12px;
  border-radius:999px;
  background:rgba(0,0,0,.28);
  border:1px solid rgba(125,211,252,.35);
  box-shadow:0 0 20px rgba(56,189,248,.15);
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-badge::before{
  content:'';
  width:7px;
  height:7px;
  border-radius:50%;
  background:linear-gradient(135deg,#38bdf8,#c084fc);
  box-shadow:0 0 10px rgba(56,189,248,.7);
  flex-shrink:0;
}
.iso-page.iso-page--hub .iso-ai-spotlight h3{
  margin:0 0 10px;
  font-size:1.3rem;
  font-weight:800;
  letter-spacing:-.02em;
  color:var(--text);
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-lead{
  margin:0;
  font-size:13.5px;
  line-height:1.62;
  color:var(--text2);
  max-width:72ch;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-trust{
  margin:0 0 14px;
  padding:10px 12px;
  border-radius:12px;
  border:1px dashed rgba(196,181,253,.28);
  background:rgba(0,0,0,.14);
  font-size:12px;
  line-height:1.55;
  color:var(--text3);
  max-width:72ch;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-steps{
  margin:18px 0 0;
  padding:0;
  list-style:none;
  display:flex;
  flex-wrap:wrap;
  gap:12px;
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-steps li{
  font-size:12px;
  font-weight:600;
  color:var(--text2);
  padding:10px 14px;
  border-radius:12px;
  background:rgba(0,0,0,.26);
  border:1px solid rgba(125,211,252,.2);
  line-height:1.4;
}
/* Actions prioritaires : palier intermédiaire (ni héros ni liste plate) */
.iso-page.iso-page--hub .iso-points-panel{
  margin-top:0;
  padding:22px 24px 24px;
  border-radius:18px;
  border:1px solid rgba(148,163,184,.17);
  background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.11));
  box-shadow:0 10px 32px rgba(0,0,0,.2);
}
.iso-page.iso-page--hub .iso-actions-priority-section .iso-points-panel-title{
  font-size:1.07rem;
  letter-spacing:-.018em;
}
.iso-page.iso-page--hub .iso-points-panel-title{margin-bottom:8px}
.iso-page.iso-page--hub .iso-points-panel-lead{margin-bottom:20px;line-height:1.55}
.iso-page.iso-page--hub .iso-points-grid{gap:16px}
.iso-page.iso-page--hub .iso-points-col{
  padding:16px 18px;
  border-radius:14px;
  background:rgba(255,255,255,.025);
  border-color:rgba(148,163,184,.11);
}
.iso-page.iso-page--hub .iso-points-list{gap:12px}
/* Cartes détail (exigences, docs, revue) : palier bas — moins d’élévation */
.iso-page.iso-page--hub .two-column .content-card.card-soft,
.iso-page.iso-page--hub .iso-secondary-zone>article.content-card.card-soft{
  background:rgba(0,0,0,.065);
  border:1px solid rgba(148,163,184,.09);
  box-shadow:none;
  border-radius:15px;
}
.iso-page.iso-page--hub .two-column .content-card .content-card-head{
  border-bottom:1px solid rgba(255,255,255,.05);
  padding-bottom:12px;
  margin-bottom:4px;
}
.iso-page.iso-page--hub .iso-section-stack{gap:18px}
.iso-page.iso-page--hub .iso-pilotage-aside{gap:18px}
.iso-page.iso-page--hub .iso-req-hot-wrap{gap:12px;margin-top:10px}
.iso-page.iso-page--hub .iso-req-hot-item{
  padding:14px 16px;
  border-radius:14px;
  background:rgba(255,255,255,.02);
  border-color:rgba(148,163,184,.1);
}
.iso-page.iso-page--hub .two-column{gap:20px}
/* Registre + documents : évite le débordement de grille (min-content table) et les chevauchements */
.iso-page.iso-page--hub .iso-register-docs-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}
@media (max-width:1024px){
  .iso-page.iso-page--hub .iso-register-docs-layout{grid-template-columns:1fr}
}
.iso-page.iso-page--hub .iso-register-docs-layout > .iso-register-docs-col{min-width:0}
.iso-page.iso-page--hub .iso-req-hub-card,
.iso-page.iso-page--hub .iso-docs-hub-card{
  min-width:0;
  display:flex;
  flex-direction:column;
  align-items:stretch;
  gap:14px;
}
.iso-page.iso-page--hub .iso-req-hub-card > .content-card-head,
.iso-page.iso-page--hub .iso-docs-hub-card > .content-card-head{
  flex-shrink:0;
  margin-bottom:0;
}
.iso-page.iso-page--hub .iso-req-hub-card > .iso-table-wrap,
.iso-page.iso-page--hub .iso-docs-hub-card > .iso-doc-proof-strip,
.iso-page.iso-page--hub .iso-docs-hub-card > .iso-docs-priority{
  flex-shrink:0;
  min-width:0;
}
.iso-page.iso-page--hub .iso-req-hub-card > .iso-table-wrap{margin-top:0}
.iso-page.iso-page--hub .iso-docs-hub-card > .iso-doc-proof-strip{margin-top:0;margin-bottom:0}
.iso-page.iso-page--hub .iso-review-hub-card{
  display:flex;
  flex-direction:column;
  align-items:stretch;
  gap:14px;
  min-width:0;
}
.iso-page.iso-page--hub .iso-review-hub-card > .content-card-head{
  flex-shrink:0;
  margin-bottom:0;
}
.iso-page.iso-page--hub .iso-review-hub-card > .iso-review-grid{
  flex:1 1 auto;
  min-width:0;
}
.iso-page.iso-page--hub .iso-doc-import-bar{flex-shrink:0;min-width:0}
.iso-page.iso-page--hub .iso-doc-attention-list{min-width:0}
.iso-page.iso-page--hub .iso-docs-priority .iso-doc-import-bar{margin-bottom:0}
.iso-page.iso-page--hub .iso-req-full-wrap{min-width:0}
.iso-page.iso-page--hub .iso-review-hub-card .iso-review-grid{margin-top:0}
.iso-req-table .iso-table-row{align-items:start}
.iso-req-table .iso-table-row > *{min-width:0}

/* —— Cockpit premium : hero, cycle, hub normes enrichi, priorités, preuves, audits —— */
.iso-page.iso-page--cockpit.iso-page--hub{gap:1.85rem}
.iso-page.iso-page--cockpit .iso-cockpit-hero.content-card{
  border-radius:20px;
  border:1px solid rgba(125,211,252,.2);
  background:linear-gradient(165deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,.02) 42%,rgba(8,12,22,.45) 100%);
  box-shadow:0 20px 50px rgba(0,0,0,.28),0 1px 0 rgba(255,255,255,.06) inset;
}
.iso-cockpit-hero-top{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  justify-content:space-between;
  gap:18px 24px;
  margin-bottom:18px;
}
.iso-cockpit-hero-copy{flex:1;min-width:min(100%,280px);max-width:720px}
.iso-cockpit-hero-copy h1{
  margin:0;
  font-size:var(--type-page-title-size,clamp(1.5rem,3vw,2rem));
  font-weight:800;
  letter-spacing:-.03em;
  line-height:1.18;
  color:var(--text);
}
.iso-cockpit-hero-lead{max-width:62ch;line-height:1.55;margin-top:8px}
.iso-cockpit-hero-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.iso-cockpit-hero-kpis{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px 16px;
  margin-bottom:6px;
}
.iso-cockpit-hero-kpis--dual{
  grid-template-columns:repeat(2,minmax(0,1fr));
  max-width:520px;
}
.iso-cockpit-hero-snapshot-host--compact .iso-global-snapshot{
  margin-top:10px;
  padding:16px 18px;
}
/* Évite le double affichage du % : déjà dans les KPI du hero */
.iso-cockpit-hero-snapshot-host--compact .iso-global-score{
  display:none;
}
.iso-page.iso-page--cockpit .iso-conformity-charts-row--single{
  grid-template-columns:1fr;
  width:100%;
  max-width:100%;
  margin-inline:0;
}
.iso-page.iso-page--cockpit .iso-conformity-charts-row--single .iso-conformity-chart-card{
  margin-inline:0;
  width:100%;
  max-width:100%;
  box-sizing:border-box;
}
.iso-conformity-chart-card .dashboard-chart-card-inner,
.iso-conformity-chart-card .dashboard-mix-chart-wrap,
.iso-conformity-chart-card .dashboard-mix-bar{
  width:100%;
  max-width:100%;
  box-sizing:border-box;
}
.iso-page.iso-page--hub .iso-cockpit-priorities .content-card-head h3{
  font-size:1.22rem;
  letter-spacing:-.02em;
}
.iso-page.iso-page--hub .iso-section-stack .content-card-head h3,
.iso-page.iso-page--hub .iso-pilotage-aside .content-card-head h3{
  font-size:1.12rem;
  letter-spacing:-.015em;
}
@media (max-width:720px){
  .iso-cockpit-hero-kpis{grid-template-columns:1fr}
}
.iso-hero-kpi{
  border-radius:14px;
  padding:14px 16px;
  background:rgba(0,0,0,.22);
  border:1px solid rgba(148,163,184,.14);
  text-align:center;
}
.iso-hero-kpi-value{
  display:block;
  font-size:clamp(1.65rem,4vw,2rem);
  font-weight:800;
  letter-spacing:-.03em;
  color:var(--text);
  line-height:1.1;
}
.iso-hero-kpi-label{
  display:block;
  margin-top:8px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:var(--text3);
  line-height:1.35;
}
.iso-cockpit-hero-snapshot-host .iso-global-snapshot{
  margin-top:12px;
  width:100%;
  box-sizing:border-box;
  border-radius:16px;
}
.iso-compliance-cycle{
  display:flex;
  flex-wrap:wrap;
  align-items:stretch;
  gap:8px 10px;
  margin:14px 0 18px;
  padding:14px 16px;
  border-radius:14px;
  background:rgba(0,0,0,.18);
  border:1px solid rgba(148,163,184,.12);
}
.iso-norms-central .iso-compliance-cycle{
  margin-top:18px;
  margin-bottom:0;
  opacity:.95;
}
.iso-compliance-cycle-step{
  flex:1;
  min-width:72px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  padding:8px 6px;
  text-align:center;
}
.iso-cycle-num{
  width:28px;height:28px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:800;
  background:linear-gradient(135deg,rgba(56,189,248,.35),rgba(168,85,247,.22));
  border:1px solid rgba(125,211,252,.35);
  color:var(--text);
}
.iso-cycle-label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);line-height:1.25}
.iso-compliance-cycle-cap{
  width:100%;
  margin:10px 0 0;
  font-size:11px;
  line-height:1.45;
  color:var(--text3);
  text-align:center;
}
.iso-norm-cockpit-metrics{
  margin-top:10px;
  padding-top:12px;
  border-top:1px solid rgba(148,163,184,.14);
  display:grid;
  gap:8px;
}
.iso-norm-metric-row{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  font-size:12px;
}
.iso-norm-metric-label{color:var(--text3);font-weight:600}
.iso-norm-metric-val{font-weight:800;color:var(--text)}
.iso-norm-metric-val--muted{font-weight:700;color:var(--text2)}
.iso-norm-audit-line{font-size:11px;font-weight:600;color:var(--text2);text-align:right;max-width:58%}
.iso-norm-metric-row--audit{align-items:flex-start}
.iso-req-filter-bar{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-bottom:12px;
  padding:4px 2px 0;
  min-width:0;
}
.iso-req-filter-bar .qhse-filter-strip__primary{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}
.iso-req-filter-btn{font-size:12px!important;padding:8px 14px!important;min-height:36px!important}
.iso-req-filter-btn--active{
  border-color:rgba(56,189,248,.45)!important;
  background:rgba(56,189,248,.12)!important;
  color:var(--text)!important;
}
.iso-req-table .iso-table-row{
  transition:background .12s ease;
}
.iso-req-table .iso-table-row:hover{
  background:rgba(255,255,255,.035);
}
.iso-req-status-cell{
  display:flex;
  align-items:center;
  min-width:0;
}
.iso-req-status-badge{
  display:inline-block;
  min-width:min(7.25rem,100%);
  max-width:100%;
  text-align:center;
  box-sizing:border-box;
}
.iso-audits-linked-item-top{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  justify-content:space-between;
  gap:8px 12px;
}
.iso-audits-linked-status{
  flex-shrink:0;
  font-size:9px!important;
  letter-spacing:.06em;
}
.iso-cockpit-priorities .content-card-head{border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:12px;margin-bottom:14px}
.iso-cockpit-prio-list{display:grid;gap:12px}
.iso-cockpit-human-row{
  display:grid;
  grid-template-columns:1fr auto;
  gap:12px 16px;
  padding:14px 16px;
  border-radius:14px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(255,255,255,.025);
  align-items:start;
}
@media (max-width:800px){
  .iso-cockpit-human-row{grid-template-columns:1fr}
}
.iso-cockpit-human-title{font-weight:800;font-size:14px;color:var(--text);line-height:1.3}
.iso-cockpit-human-detail{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--text2)}
.iso-cockpit-human-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-end}
.iso-cockpit-human-row .iso-human-actions{
  grid-column:1/-1;
  display:flex;flex-wrap:wrap;gap:8px;
}
.iso-human-btn{font-size:11px!important;padding:6px 12px!important;min-height:32px!important}
.iso-ia-suggestion-pill{
  display:inline-flex;
  align-items:center;
  font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:4px 8px;border-radius:999px;
  background:rgba(168,85,247,.18);
  border:1px solid rgba(192,132,252,.35);
  color:#e9d5ff;
}
.iso-cockpit-prio-action{margin-top:4px;padding-top:4px}
.iso-doc-proof-strip{
  margin-top:4px;
  margin-bottom:14px;
  padding:12px 14px;
  border-radius:12px;
  background:rgba(0,0,0,.14);
  border:1px solid rgba(148,163,184,.1);
}
.iso-doc-proof-strip-title{
  font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:10px
}
.iso-doc-proof-row{
  display:flex;align-items:flex-start;justify-content:space-between;gap:10px;
  padding:8px 0;border-bottom:1px solid rgba(148,163,184,.08);
  font-size:13px;min-width:0;
}
.iso-doc-proof-row:last-child{border-bottom:none}
.iso-doc-proof-name{font-weight:600;color:var(--text);min-width:0;word-break:break-word;line-height:1.35}
.iso-doc-proof-badge{font-size:10px!important;padding:2px 8px!important}
.iso-doc-import-bar{
  margin-bottom:12px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(82,148,247,.22);
  background:linear-gradient(165deg,rgba(82,148,247,.07),rgba(0,0,0,.1));
}
.iso-doc-import-lead{margin:0 0 10px;font-size:12px;line-height:1.45;color:var(--text2);max-width:62ch}
.iso-doc-import-btn{max-width:280px}
.iso-import-overlay{
  position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;
  padding:max(16px,env(safe-area-inset-bottom,16px));
  background:rgba(8,12,20,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
}
.iso-import-dialog{
  width:min(520px,100%);max-height:min(88vh,720px);overflow:auto;margin:0;
  padding:18px 20px 20px;border-radius:16px;
  border:1px solid rgba(148,163,184,.18);
  background:linear-gradient(180deg,rgba(26,34,50,.98),rgba(16,22,32,.96));
  box-shadow:0 24px 64px rgba(0,0,0,.45);
}
.iso-import-dialog .content-card-head{margin-bottom:12px}
.iso-import-body{display:grid;gap:14px}
.iso-import-block{padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.1);background:rgba(0,0,0,.12)}
.iso-import-block-title{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.iso-import-type-value{margin:0;font-size:14px;font-weight:700;color:var(--text);line-height:1.35}
.iso-import-list{margin:0;padding:0 0 0 18px;font-size:12px;line-height:1.45;color:var(--text2)}
.iso-import-list li{margin-bottom:6px}
.iso-import-list li:last-child{margin-bottom:0}
.iso-import-note{margin:0;font-size:11px;line-height:1.4;color:var(--text3);font-style:italic}
.iso-import-proof-radios{display:flex;flex-wrap:wrap;gap:14px 18px}
.iso-import-radio{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer}
.iso-import-radio input{accent-color:var(--app-accent,#14b8a6)}
.iso-import-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(148,163,184,.1)}
.iso-evidence-cell{font-size:12px}
.iso-audits-linked{
  padding:16px 18px;
  border-radius:16px;
  border:1px solid rgba(148,163,184,.12);
  background:rgba(0,0,0,.12);
}
.iso-audits-linked-head{
  font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);margin-bottom:10px
}
.iso-audits-linked-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.iso-audits-linked-item{
  padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.08);
  display:flex;flex-direction:column;gap:4px;
}
.iso-audits-linked-item strong{font-size:13px;color:var(--text)}
.iso-audits-linked-sub{font-size:11px;color:var(--text3)}
.iso-audits-linked-empty{margin:0 0 12px;font-size:12px;color:var(--text2);line-height:1.45}
.iso-audits-linked-cta{width:100%;margin-top:10px}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
  margin:14px 0 12px;
}
@media (max-width:520px){
  .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-grid{grid-template-columns:1fr}
}
.iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-btn{
  font-size:12px!important;line-height:1.3;text-align:left;justify-content:flex-start;
}
.iso-ai-suggestion-note{
  margin:0 0 14px;
  font-size:12px;
  line-height:1.5;
  color:var(--text2);
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px;
}

/* —— ISO conformité premium : cadre page, bandeau exécutif, zones lisibles —— */
.iso-page.iso-page--hub.iso-page--conformite-premium{
  width:100%;
  max-width:min(1220px,100%);
  margin-inline:auto;
  gap:2rem;
  padding-bottom:max(2rem,env(safe-area-inset-bottom,0px));
  box-sizing:border-box;
}
.iso-page.iso-page--conformite-premium.iso-page--cockpit{
  gap:2rem;
}
.iso-cockpit-hero-executive-band{
  display:grid;
  grid-template-columns:minmax(0,300px) minmax(0,1fr);
  gap:20px 26px;
  align-items:stretch;
  padding-top:22px;
  margin-top:4px;
  border-top:1px solid rgba(148,163,184,.14);
}
@media (max-width:900px){
  .iso-cockpit-hero-executive-band{
    grid-template-columns:1fr;
  }
}
.iso-cockpit-hero-executive-band .iso-cockpit-hero-kpis--dual{
  max-width:none;
  margin:0;
  align-content:start;
}
.iso-cockpit-hero-executive-band .iso-cockpit-hero-snapshot-host--compact{
  display:flex;
  min-width:0;
}
.iso-cockpit-hero-executive-band .iso-cockpit-hero-snapshot-host--compact .iso-global-snapshot{
  margin-top:0;
  flex:1;
  display:flex;
  flex-direction:column;
  min-height:100%;
  box-sizing:border-box;
}
.iso-cockpit-hero-executive-band .iso-global-snapshot-inner{
  flex:1;
  align-items:stretch;
}
.iso-cockpit-hero-trust{
  margin:14px 0 0;
  font-size:13px;
  line-height:1.58;
  color:var(--text2);
  max-width:min(68ch,100%);
  padding:12px 16px;
  border-radius:14px;
  border:1px dashed rgba(148,163,184,.22);
  background:rgba(0,0,0,.1);
}
[data-theme='light'] .iso-cockpit-hero-trust{
  background:rgba(15,23,42,.04);
  border-color:rgba(15,23,42,.12);
  color:var(--color-text-secondary);
}
.iso-page.iso-page--conformite-premium .iso-cockpit-hero.content-card{
  padding:26px 28px 28px;
  border-radius:22px;
}
.iso-focus-wrap{
  display:flex;
  flex-direction:column;
  gap:1rem;
  width:100%;
  max-width:min(1180px,100%);
  margin-inline:auto;
  min-width:0;
}
.iso-focus-zone-intro{
  padding:0 2px;
}
.iso-zone-header{
  padding:0 2px 2px;
}
.iso-zone-header__kicker{
  margin:0 0 8px;
  font-size:10px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--text3);
}
.iso-zone-header__title{
  margin:0;
  font-size:clamp(1.12rem,1.9vw,1.4rem);
  font-weight:800;
  letter-spacing:-.025em;
  color:var(--text);
  line-height:1.22;
}
.iso-zone-header__desc{
  margin:10px 0 0;
  font-size:13.5px;
  line-height:1.58;
  color:var(--text2);
  max-width:min(72ch,100%);
}
.iso-insights-zone{
  width:100%;
  max-width:min(1180px,100%);
  margin-inline:auto;
  display:flex;
  flex-direction:column;
  gap:1rem;
  min-width:0;
}
.iso-page.iso-page--hub .iso-priority-shell{
  max-width:min(1180px,100%);
  margin-inline:auto;
  width:100%;
}
.iso-page.iso-page--hub .iso-priority-shell .iso-cockpit-priorities{
  border-radius:20px;
  border:1px solid rgba(251,191,36,.28);
  background:linear-gradient(165deg,rgba(251,191,36,.09),rgba(15,23,42,.35) 55%,rgba(8,12,20,.5) 100%);
  box-shadow:0 20px 52px rgba(0,0,0,.28),0 1px 0 rgba(255,255,255,.06) inset;
  padding:4px 4px 6px;
}
[data-theme='light'] .iso-page.iso-page--hub .iso-priority-shell .iso-cockpit-priorities{
  background:linear-gradient(165deg,rgba(251,191,36,.12),#fff 45%,#f8fafc 100%);
  border-color:rgba(245,158,11,.35);
  box-shadow:0 12px 40px rgba(15,23,42,.08);
}
.iso-priority-item{
  display:grid;
  grid-template-columns:1fr auto;
  gap:14px 20px;
  padding:16px 18px;
  border-radius:15px;
  border:1px solid rgba(148,163,184,.14);
  background:rgba(0,0,0,.14);
  align-items:center;
}
@media (max-width:640px){
  .iso-priority-item{grid-template-columns:1fr}
  .iso-priority-item-actions{justify-content:flex-start}
}
.iso-priority-item-title{font-size:14px;font-weight:800;color:var(--text);line-height:1.3}
.iso-priority-item-detail{margin:6px 0 0;font-size:12.5px;line-height:1.52;color:var(--text2)}
.iso-page.iso-page--hub .iso-secondary-zone{
  padding-top:1.85rem;
  margin-top:.35rem;
  gap:1.85rem;
  border-top:1px solid rgba(148,163,184,.1);
}
.iso-page.iso-page--hub .iso-zone-kicker{
  margin:0 0 14px;
  padding:0 2px;
  font-size:11px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:var(--text2);
}
.iso-page.iso-page--hub .iso-secondary-zone .content-card.card-soft{
  border-radius:17px;
  border:1px solid rgba(148,163,184,.11);
  background:rgba(0,0,0,.07);
  box-shadow:0 10px 36px rgba(0,0,0,.14);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-secondary-zone .content-card.card-soft{
  background:var(--color-background-primary);
  box-shadow:var(--shadow-card);
}
.iso-page.iso-page--hub .iso-conformity-charts-row--single .iso-conformity-chart-card{
  border-radius:18px;
  border:1px solid rgba(125,211,252,.18);
  background:linear-gradient(165deg,rgba(255,255,255,.05),rgba(0,0,0,.12));
  box-shadow:0 14px 40px rgba(0,0,0,.18);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-conformity-charts-row--single .iso-conformity-chart-card{
  background:var(--color-background-primary);
}
/* —— ISO premium phases : audit readiness, preuves, auditeur —— */
.iso-audit-readiness{
  border-radius:18px;
  padding:18px 20px;
  margin-bottom:4px;
  border:1px solid rgba(148,163,184,.2);
  background:linear-gradient(145deg,rgba(30,41,59,.55),rgba(15,23,42,.85));
  box-shadow:0 12px 40px rgba(0,0,0,.2);
  transition:box-shadow .22s ease,border-color .22s ease,transform .18s ease;
}
.iso-audit-readiness:hover{box-shadow:0 16px 48px rgba(0,0,0,.24)}
.iso-audit-readiness--pret{border-color:rgba(52,211,153,.35)}
.iso-audit-readiness--fragile{border-color:rgba(245,158,11,.38)}
.iso-audit-readiness--non_pret{border-color:rgba(239,68,68,.4)}
.iso-audit-readiness-inner{display:flex;flex-direction:column;gap:12px}
.iso-audit-readiness-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
.iso-audit-readiness-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)}
.iso-audit-readiness-pill{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;border:1px solid rgba(148,163,184,.25)}
.iso-audit-readiness-pill--pret{color:#bbf7d0;border-color:rgba(52,211,153,.45);background:rgba(52,211,153,.12)}
.iso-audit-readiness-pill--fragile{color:#fef3c7;border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.1)}
.iso-audit-readiness-pill--non_pret{color:#fecaca;border-color:rgba(239,68,68,.45);background:rgba(239,68,68,.12)}
.iso-audit-readiness-mid{display:flex;flex-wrap:wrap;align-items:center;gap:18px 28px}
.iso-audit-readiness-score{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px}
.iso-audit-readiness-pct{font-size:clamp(2rem,5vw,2.75rem);font-weight:900;letter-spacing:-.04em;line-height:1;color:var(--text)}
.iso-audit-readiness-pct-suffix{font-size:1.1rem;font-weight:700;color:var(--text3)}
.iso-audit-readiness-score-cap{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);width:100%}
.iso-audit-readiness-stats{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px 18px;font-size:13px;font-weight:600;color:var(--text2)}
.iso-audit-readiness-stats strong{color:var(--text);font-variant-numeric:tabular-nums}
.iso-audit-readiness-msg{margin:0;font-size:15px;font-weight:700;line-height:1.45;color:var(--text);max-width:62ch}
.iso-audit-readiness-hint{margin:0;font-size:12px;color:var(--text3);line-height:1.45}
.iso-audit-readiness-actions{display:flex;flex-wrap:wrap;gap:10px}
.iso-priority-hero{
  grid-column:1/-1;
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:14px 18px;
  padding:18px 20px;border-radius:16px;margin-bottom:12px;
  border:1px solid rgba(251,191,36,.35);
  background:linear-gradient(125deg,rgba(120,53,15,.22),rgba(15,23,42,.75));
  box-shadow:0 8px 32px rgba(0,0,0,.18);
}
.iso-priority-hero-k{display:block;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.iso-priority-hero-title{display:block;font-size:clamp(16px,1.8vw,19px);font-weight:800;color:var(--text);line-height:1.35;margin:0 0 8px}
.iso-priority-hero-detail{margin:0;font-size:13px;line-height:1.5;color:var(--text2);max-width:56ch}
.iso-priority-hero-main{flex:1;min-width:200px}
.iso-priority-hero-cta{flex-shrink:0}
.iso-doc-proof-dropzone{position:relative;transition:border-color .2s ease,background .2s ease}
.iso-doc-proof-dropzone--drag{border-color:rgba(45,212,191,.45)!important;background:rgba(45,212,191,.06)}
.iso-doc-proof-dropzone--active{border-color:rgba(99,102,241,.35)}
.iso-doc-import-preview{margin:8px 0 0;font-size:12px;font-weight:600;color:var(--text2)}
.iso-req-table .iso-table-row--interactive{
  cursor:pointer;
  transition:background .18s ease,transform .15s ease,box-shadow .18s ease;
}
.iso-req-table .iso-table-row--interactive:hover{
  background:rgba(45,212,191,.06);
  box-shadow:inset 3px 0 0 rgba(45,212,191,.45);
}
.iso-req-table .iso-table-row--interactive:active{transform:scale(.995)}
.iso-req-table .iso-table-row--interactive:focus-visible{outline:2px solid rgba(45,212,191,.5);outline-offset:-2px}
.iso-page--auditor-mode .iso-cockpit-hero-trust{display:none!important}
.iso-page--auditor-mode .iso-review-hub-card{display:none!important}
.iso-page--auditor-mode .iso-focus-zone-intro .iso-zone-header__desc{display:none!important}
.iso-page--auditor-mode .iso-secondary-wrap .iso-zone-kicker{opacity:.55}
.iso-page--auditor-mode .iso-norms-hero-wrap .content-card-lead{display:none!important}
.iso-ai-suggestion-btn{transition:transform .15s ease,border-color .15s ease}
.iso-ai-suggestion-btn:hover{transform:translateY(-1px)}

/* ── ISO : contraste renforcé (thème sombre) — blocs audit & conformité ── */
html[data-theme='dark'] .iso-audit-readiness{
  background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(15,23,42,.99));
  border-color:rgba(148,163,184,.32);
}
html[data-theme='dark'] .iso-audit-readiness-kicker{
  color:#cbd5e1;
}
html[data-theme='dark'] .iso-audit-readiness-pill--pret{
  color:#ecfdf5;
  background:rgba(52,211,153,.2);
  border-color:rgba(52,211,153,.55);
}
html[data-theme='dark'] .iso-audit-readiness-pill--fragile{
  color:#fffbeb;
  background:rgba(245,158,11,.2);
  border-color:rgba(251,191,36,.55);
}
html[data-theme='dark'] .iso-audit-readiness-pill--non_pret{
  color:#fff1f2;
  background:rgba(248,113,113,.2);
  border-color:rgba(248,113,113,.55);
}
html[data-theme='dark'] .iso-audit-readiness-hint{
  color:#cbd5e1;
}
html[data-theme='dark'] .iso-priority-hero{
  background:linear-gradient(125deg,rgba(55,32,8,.72),rgba(15,23,42,.96));
  border-color:rgba(251,191,36,.48);
}
html[data-theme='dark'] .iso-priority-hero-k{
  color:#e2e8f0;
}
html[data-theme='dark'] .iso-priority-hero-detail{
  color:#cbd5e1;
}
html[data-theme='dark'] .iso-doc-state-summary{
  border-color:rgba(148,163,184,.22);
  background:linear-gradient(135deg,rgba(15,23,42,.88),rgba(15,23,42,.94));
}
html[data-theme='dark'] .iso-doc-state-summary__hint{
  color:#cbd5e1;
}
html[data-theme='dark'] .iso-doc-state-summary__metric{
  background:rgba(255,255,255,.1);
  border-color:rgba(148,163,184,.22);
}
html[data-theme='dark'] .iso-doc-state-summary__lbl{
  color:#e2e8f0;
}
html[data-theme='dark'] .iso-doc-state-summary__val{
  text-shadow:0 1px 2px rgba(0,0,0,.35);
}
html[data-theme='dark'] .iso-doc-state-summary__val--ok{
  color:#4ade80;
}
html[data-theme='dark'] .iso-doc-state-summary__val--warn{
  color:#fbbf24;
}
html[data-theme='dark'] .iso-doc-state-summary__val--bad{
  color:#f87171;
}
html[data-theme='dark'] .iso-points-doc-tag{
  color:#fecdd3;
  background:rgba(239,68,68,.28);
  border:1px solid rgba(248,113,113,.35);
}
html[data-theme='dark'] .iso-ia-suggestion-pill{
  color:#ede9fe;
  background:rgba(124,58,237,.22);
  border-color:rgba(196,181,253,.45);
}

/* ── ISO (hub) : mode clair — surfaces et textes lisibles (évite texte foncé sur fond foncé) ── */
[data-theme='light'] .iso-priority-hero{
  border:1px solid color-mix(in srgb, #f59e0b 32%, var(--border-color, #e2e8f0));
  background:linear-gradient(
    125deg,
    color-mix(in srgb, #f59e0b 10%, var(--surface-1, #ffffff)) 0%,
    var(--surface-2, #f8fafc) 100%
  );
  box-shadow:0 8px 28px rgba(15,23,42,.06);
}
[data-theme='light'] .iso-priority-hero-k{color:var(--text-secondary, #475569)}
[data-theme='light'] .iso-priority-hero-title{color:var(--text-primary, #0f172a)}
[data-theme='light'] .iso-priority-hero-detail{color:var(--text-secondary, #334155)}
[data-theme='light'] .iso-priority-item{
  border:1px solid var(--border-color, #e2e8f0);
  background:var(--surface-1, #ffffff);
  box-shadow:0 1px 2px rgba(15,23,42,.04);
}
[data-theme='light'] .iso-priority-item-title{color:var(--text-primary, #0f172a)}
[data-theme='light'] .iso-priority-item-detail{color:var(--text-secondary, #475569)}
[data-theme='light'] .iso-cockpit-priorities .content-card-head{
  border-bottom:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-cockpit-priorities .content-card-lead{
  color:var(--text-secondary, #475569);
}
[data-theme='light'] .iso-audit-readiness{
  border:1px solid var(--border-color, #e2e8f0);
  background:linear-gradient(145deg, var(--surface-1, #ffffff), var(--surface-2, #f8fafc));
  box-shadow:0 10px 32px rgba(15,23,42,.07);
}
[data-theme='light'] .iso-audit-readiness-kicker{color:var(--text-secondary, #475569)}
[data-theme='light'] .iso-audit-readiness-pct,
[data-theme='light'] .iso-audit-readiness-msg,
[data-theme='light'] .iso-audit-readiness-stats strong{color:var(--text-primary, #0f172a)}
[data-theme='light'] .iso-audit-readiness-stats,
[data-theme='light'] .iso-audit-readiness-hint{color:var(--text-secondary, #475569)}
[data-theme='light'] .iso-audit-readiness-pct-suffix,
[data-theme='light'] .iso-audit-readiness-score-cap{color:var(--text-muted, #64748b)}
[data-theme='light'] .iso-audit-readiness-pill--pret{
  color:#166534;
  border-color:rgba(34,197,94,.45);
  background:rgba(34,197,94,.12);
}
[data-theme='light'] .iso-audit-readiness-pill--fragile{
  color:#92400e;
  border-color:rgba(245,158,11,.45);
  background:rgba(245,158,11,.12);
}
[data-theme='light'] .iso-audit-readiness-pill--non_pret{
  color:#991b1b;
  border-color:rgba(239,68,68,.45);
  background:rgba(239,68,68,.1);
}
[data-theme='light'] .iso-doc-state-summary{
  border:1px solid var(--border-color, #e2e8f0);
  background:linear-gradient(145deg, var(--surface-2, #f1f5f9), var(--surface-1, #ffffff));
  box-shadow:0 6px 22px rgba(15,23,42,.07);
}
[data-theme='light'] .iso-doc-state-summary__title{
  color:var(--text-primary, #0f172a);
}
[data-theme='light'] .iso-doc-state-summary__hint{
  color:var(--text-secondary, #64748b);
}
[data-theme='light'] .iso-doc-state-summary__metric{
  border:1px solid var(--border-color, #e2e8f0);
  background:var(--surface-1, #ffffff);
  box-shadow:0 1px 3px rgba(15,23,42,.06);
}
[data-theme='light'] .iso-doc-state-summary__lbl{
  color:#475569;
  font-weight:700;
}
[data-theme='light'] .iso-doc-state-summary__val{
  text-shadow:none;
}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight{
  border:1px solid color-mix(in srgb, var(--color-primary) 22%, var(--border-color, #e2e8f0));
  background:linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 7%, var(--surface-1, #ffffff)),
    var(--surface-2, #f8fafc)
  );
  box-shadow:0 12px 40px rgba(15,23,42,.07);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-badge{
  color:var(--color-primary-text, #0f766e);
  background:color-mix(in srgb, var(--color-primary) 12%, var(--surface-1, #ffffff));
  border:1px solid color-mix(in srgb, var(--color-primary) 28%, var(--border-color, #e2e8f0));
  box-shadow:none;
}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight h3{color:var(--text-primary, #0f172a)}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-trust{
  border:1px dashed var(--border-color, #cbd5e1);
  background:var(--surface-1, #ffffff);
  color:var(--text-secondary, #475569);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-lead{
  color:var(--text-secondary, #334155);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-steps li{
  background:var(--surface-1, #ffffff);
  border:1px solid var(--border-color, #e2e8f0);
  color:var(--text-primary, #0f172a);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-btn.btn{
  background:var(--surface-1, #ffffff);
  color:var(--text-primary, #0f172a);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-page.iso-page--hub .iso-ai-spotlight .iso-ai-suggestion-btn.btn:hover{
  background:var(--surface-3, #f1f5f9);
  border-color:color-mix(in srgb, var(--color-primary) 35%, var(--border-color, #e2e8f0));
}
[data-theme='light'] .iso-ai-suggestion-note{color:var(--text-secondary, #475569)}
[data-theme='light'] .iso-page.iso-page--cockpit .iso-cockpit-hero.content-card{
  border:1px solid var(--border-color, #e2e8f0);
  background:linear-gradient(
    165deg,
    var(--surface-1, #ffffff) 0%,
    var(--surface-2, #f8fafc) 100%
  );
  box-shadow:
    0 14px 44px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.92) inset;
}
[data-theme='light'] .iso-cockpit-hero-executive-band{
  margin-top:10px;
  padding:16px 18px;
  border-top:none;
  border-radius:14px;
  border:1px solid var(--border-color, #e2e8f0);
  background:var(--surface-2, #f1f5f9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 1px 2px rgba(15, 23, 42, 0.04);
}
[data-theme='light'] .iso-hero-kpi{
  background:var(--surface-1, #ffffff);
  border:1px solid var(--border-color-strong, #cbd5e1);
  box-shadow:0 1px 2px rgba(15, 23, 42, 0.05);
}
[data-theme='light'] .iso-compliance-cycle{
  background:var(--surface-2, #f8fafc);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-global-snapshot{
  background:linear-gradient(135deg, color-mix(in srgb, #3b82f6 6%, var(--surface-1, #fff)), var(--surface-1, #ffffff));
  border:1px solid var(--border-color-strong, #cbd5e1);
  box-shadow:0 1px 3px rgba(15, 23, 42, 0.06);
}
[data-theme='light'] .iso-global-snapshot--ok{
  background:linear-gradient(135deg, color-mix(in srgb, #22c55e 8%, var(--surface-1, #fff)), var(--surface-2, #f8fafc));
  border:1px solid rgba(34,197,94,.28);
}
[data-theme='light'] .iso-global-snapshot--watch{
  background:linear-gradient(135deg, color-mix(in srgb, #f59e0b 8%, var(--surface-1, #fff)), var(--surface-2, #f8fafc));
  border:1px solid rgba(245,158,11,.32);
}
[data-theme='light'] .iso-global-snapshot--risk{
  background:linear-gradient(135deg, color-mix(in srgb, #ef4444 7%, var(--surface-1, #fff)), var(--surface-2, #f8fafc));
  border:1px solid rgba(239,68,68,.28);
}
[data-theme='light'] .iso-points-panel{
  background:var(--surface-2, #f8fafc);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-points-col{
  background:var(--surface-1, #ffffff);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-doc-proof-strip{
  background:var(--surface-2, #f8fafc);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-doc-import-bar{
  background:linear-gradient(165deg, color-mix(in srgb, #3b82f6 6%, var(--surface-1, #fff)), var(--surface-2, #f8fafc));
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-audits-linked{
  background:var(--surface-2, #f8fafc);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-audits-linked-item{
  background:var(--surface-1, #ffffff);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-cockpit-human-row{
  background:var(--surface-1, #ffffff);
  border:1px solid var(--border-color, #e2e8f0);
}
[data-theme='light'] .iso-ia-suggestion-pill{
  color:#5b21b6;
  background:rgba(168,85,247,.12);
  border-color:rgba(168,85,247,.35);
}

/* —— Second niveau : replis natifs (lecture rapide au premier niveau) —— */
.iso-l2-disclosure{
  border:1px solid color-mix(in srgb, var(--color-border-secondary, rgba(148,163,184,.2)) 85%, transparent);
  border-radius:16px;
  background:color-mix(in srgb, var(--color-background-secondary, rgba(0,0,0,.12)) 92%, transparent);
  margin-top:12px;
  overflow:hidden;
}
.iso-l2-disclosure:first-child{margin-top:0}
.iso-l2-disclosure__summary{
  list-style:none;
  cursor:pointer;
  display:flex;
  flex-wrap:wrap;
  align-items:baseline;
  justify-content:space-between;
  gap:8px 14px;
  padding:14px 18px;
  font:inherit;
  color:var(--text, inherit);
  transition:background .15s ease;
}
.iso-l2-disclosure__summary::-webkit-details-marker{display:none}
.iso-l2-disclosure__summary::after{
  content:'▾';
  font-size:10px;
  opacity:.55;
  margin-left:auto;
  transition:transform .2s ease;
}
.iso-l2-disclosure[open] > .iso-l2-disclosure__summary::after{transform:rotate(-180deg)}
.iso-l2-disclosure__summary:hover{background:color-mix(in srgb, var(--color-subtle, rgba(255,255,255,.04)) 80%, transparent)}
.iso-l2-disclosure__summary:focus-visible{
  outline:none;
  box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--palette-accent, #14b8a6) 35%, transparent);
}
.iso-l2-disclosure__title{
  font-size:14px;
  font-weight:700;
  letter-spacing:-.02em;
  color:var(--text, inherit);
}
.iso-l2-disclosure__hint{
  font-size:11px;
  color:var(--text2, rgba(255,255,255,.55));
  max-width:52ch;
  line-height:1.35;
}
.iso-l2-disclosure__body{
  padding:0 16px 16px;
  border-top:1px solid color-mix(in srgb, var(--color-border-secondary, rgba(148,163,184,.14)) 70%, transparent);
}
.iso-l2-disclosure__body > .content-card:first-child{margin-top:12px}
.iso-l2-disclosure--insights .iso-l2-disclosure__body{padding-top:8px}
.iso-l2-disclosure--insights .iso-zone-header{margin-bottom:8px}
@media (max-width:640px){
  .iso-l2-disclosure__summary{padding:12px 14px}
  .iso-l2-disclosure__hint{max-width:none}
}

/* Mode clair : labels / valeurs sur cartes claires */
html[data-theme='light'] .iso-page .iso-global-score-caption,
html[data-theme='light'] .iso-page .iso-global-meta,
html[data-theme='light'] .iso-page .iso-points-col-head,
html[data-theme='light'] .iso-page .iso-norm-id,
html[data-theme='light'] .iso-page .iso-doc-attention-block-title,
html[data-theme='light'] .iso-page .iso-table-head{
  color:#6b7280;
}
html[data-theme='light'] .iso-page .iso-global-pct,
html[data-theme='light'] .iso-page .iso-points-metric,
html[data-theme='light'] .iso-page .iso-norm-title{
  color:#111827;
}
html[data-theme='light'] .iso-page .iso-points-panel,
html[data-theme='light'] .iso-page .iso-doc-attention-row,
html[data-theme='light'] .iso-page .iso-norm-card{
  background:#f9fafb;
  border-color:rgba(15,23,42,.1);
}
html[data-theme='light'] .iso-page .iso-l2-disclosure__summary::after{
  opacity:.85;
}
`;

export function ensureIsoPageStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
