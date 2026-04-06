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
`;

export function ensureNotificationsPanelStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
