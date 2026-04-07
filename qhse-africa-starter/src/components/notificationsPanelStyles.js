const STYLE_ID = 'qhse-notifications-panel-styles';

const CSS = `
.notif-panel .notifications-list{gap:10px}
.notif-panel-head-lead{margin:6px 0 0;font-size:13px;color:var(--text2);max-width:46ch;line-height:1.45}
.notif-item{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;padding:12px 14px;border-radius:14px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.03);position:relative;overflow:hidden}
.notif-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:14px 0 0 14px}
.notif-item--incident::before{background:linear-gradient(180deg,var(--palette-warning,#f59e0b),color-mix(in srgb,var(--palette-warning) 65%,#000))}
.notif-item--action::before{background:linear-gradient(180deg,var(--palette-accent,#14b8a6),color-mix(in srgb,var(--palette-accent) 55%,#000))}
.notif-item--audit::before{background:linear-gradient(180deg,var(--palette-accent,#14b8a6),color-mix(in srgb,var(--palette-accent) 50%,#0f766e))}
.notif-item--info::before{background:linear-gradient(180deg,#94a3b8,#64748b)}
.notif-item.unread{background:rgba(77,160,255,.06);border-color:rgba(77,160,255,.2)}
.notif-item__icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-size:16px;font-weight:800;flex-shrink:0}
.notif-item--incident .notif-item__icon{background:var(--color-warning-bg);color:var(--color-text-warning)}
.notif-item--action .notif-item__icon{background:var(--color-primary-bg);color:var(--color-primary-text)}
.notif-item--audit .notif-item__icon{background:var(--color-primary-bg);color:var(--color-primary-text)}
.notif-item--info .notif-item__icon{background:rgba(148,163,184,.15);color:#cbd5e1}
.notif-item__body{min-width:0}
.notif-item__type-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px}
.notif-item__chip{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.notif-prio-tag{font-size:10px;font-weight:800;padding:3px 8px;border-radius:999px;letter-spacing:.03em}
.notif-prio-tag--critical{background:var(--color-danger-bg);color:var(--color-text-danger)}
.notif-prio-tag--high{background:var(--color-warning-bg);color:var(--color-text-warning)}
.notif-prio-tag--normal{background:var(--color-primary-bg);color:var(--color-primary-text)}
.notif-prio-tag--low{background:rgba(148,163,184,.15);color:#e2e8f0}
.notif-item__title{margin:0 0 4px;font-size:14px;font-weight:700;line-height:1.35;color:var(--text)}
.notif-item__detail{margin:0 0 8px;font-size:13px;line-height:1.45;color:var(--text2)}
.notif-item__meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;color:var(--text3);margin-bottom:8px}
.notif-item__time{font-variant-numeric:tabular-nums;font-weight:600;color:var(--text2)}
.notif-item__meta-sep{opacity:.5}
.notif-item__ref{font-weight:700;color:var(--text)}
.notif-item__actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.notif-item__link-btn{font-weight:700;padding:6px 0}
.notif-item__status{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
.notif-item__dot{width:8px;height:8px;border-radius:50%;background:rgba(77,160,255,.9);box-shadow:0 0 0 3px rgba(77,160,255,.2)}
.notif-item:not(.unread) .notif-item__dot{display:none}

.notif-panel--premium .notif-panel__head{margin-bottom:4px}
.notif-panel__filters{
  display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 14px;padding:2px 0;
  border-bottom:1px solid rgba(148,163,184,.1);
}
.notif-panel__filter-btn{
  padding:6px 12px;border-radius:999px;border:1px solid rgba(148,163,184,.18);
  background:rgba(0,0,0,.12);color:var(--text2);font-size:11px;font-weight:700;
  cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease;
}
.notif-panel__filter-btn:hover{color:var(--text);border-color:rgba(148,163,184,.28)}
.notif-panel__filter-btn--active{
  background:rgba(77,160,255,.12);border-color:rgba(77,160,255,.35);color:var(--text);
}
.notif-panel__empty{margin:16px 0;font-size:13px;color:var(--text3);text-align:center}

.notif-tier-tag{
  font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  padding:2px 7px;border-radius:6px;
}
.notif-tier-tag--critique{background:rgba(239,68,68,.18);color:#fecaca}
.notif-tier-tag--attention{background:rgba(245,158,11,.16);color:#fde68a}
.notif-tier-tag--info{background:rgba(148,163,184,.14);color:#e2e8f0}
.notif-tier-tag--digest{background:rgba(99,102,241,.15);color:#c7d2fe}

.notif-group-badge{
  font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;
  background:rgba(255,255,255,.06);color:var(--text3);border:1px solid rgba(148,163,184,.12);
}

.notif-item--synthetic{border-color:rgba(77,160,255,.14)}
.notif-item--tier-critique::before{background:linear-gradient(180deg,#ef4444,#b91c1c)!important}
.notif-item--tier-attention::before{background:linear-gradient(180deg,#f59e0b,#b45309)!important}
.notif-item--tier-info::before{background:linear-gradient(180deg,#64748b,#475569)!important}
.notif-item--tier-digest::before{background:linear-gradient(180deg,#6366f1,#4338ca)!important}

.notif-panel__digest{
  margin-top:14px;padding:12px 14px;border-radius:14px;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.1);
}
.notif-panel__digest-summary{
  cursor:pointer;list-style:none;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px;
  font-weight:700;color:var(--text);
}
.notif-panel__digest-summary::-webkit-details-marker{display:none}
.notif-panel__digest-kicker{
  font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:2px 8px;border-radius:6px;background:rgba(99,102,241,.15);color:#c7d2fe;
}
.notif-panel__digest-title{font-size:14px}
.notif-panel__digest-hint{font-size:11px;font-weight:600;color:var(--text3)}
.notif-panel__digest-body{margin-top:10px;padding-top:10px;border-top:1px solid rgba(148,163,184,.08)}
.notif-digest-lead{margin:0 0 8px;font-size:12px;color:var(--text2);line-height:1.45}
.notif-digest-list{margin:0;padding-left:18px;font-size:12px;line-height:1.55;color:var(--text2)}
.notif-digest-list li{margin-bottom:6px}
`;

export function ensureNotificationsPanelStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
