const STYLE_ID = 'qhse-iso-compliance-assist-styles';

const CSS = `
.iso-ca-overlay{
  position:fixed;inset:0;z-index:200;
  background:rgba(0,0,0,.55);
  display:flex;align-items:center;justify-content:center;
  padding:20px;box-sizing:border-box;
  backdrop-filter:blur(6px);
}
.iso-ca-panel{
  width:100%;max-width:560px;max-height:min(90vh,720px);
  overflow:auto;display:flex;flex-direction:column;gap:0;
  padding:0!important;
  border:1px solid rgba(148,163,184,.18);
  box-shadow:0 24px 64px rgba(0,0,0,.4);
}
.iso-ca-head{
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  padding:18px 20px 12px;
  border-bottom:1px solid rgba(148,163,184,.1);
}
.iso-ca-kicker{margin-bottom:4px}
.iso-ca-title{margin:0 0 6px;font-size:18px;font-weight:800;letter-spacing:-.02em}
.iso-ca-sub{margin:0;font-size:13px;line-height:1.45;color:var(--text2);max-width:48ch}
.iso-ca-close{flex-shrink:0;min-width:40px;padding:8px 12px!important}
.iso-ca-body{padding:16px 20px 20px}
.iso-ca-loading-text{margin:0 0 8px;font-size:15px;font-weight:700;color:var(--text)}
.iso-ca-loading-hint{margin:0;font-size:12px;line-height:1.5;color:var(--text3);max-width:52ch}
.iso-ca-proposed{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:14px}
.iso-ca-ia-badge{
  font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px;
  color:var(--color-primary-text);background:var(--color-primary-bg);border:1px solid var(--color-primary-border);
}
.iso-ca-proposed-label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.iso-ca-status-pill{
  display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;
  font-size:14px;font-weight:800;letter-spacing:.02em;
}
.iso-ca-status-pill--conforme{background:var(--color-success-bg);color:var(--color-text-success);border:1px solid var(--color-border-success)}
.iso-ca-status-pill--partiel{background:var(--color-warning-bg);color:var(--color-text-warning);border:1px solid var(--color-border-warning)}
.iso-ca-status-pill--non_conforme{background:var(--color-danger-bg);color:var(--color-text-danger);border:1px solid var(--color-border-danger)}
.iso-ca-explain{margin:0 0 16px;font-size:14px;line-height:1.55;color:var(--text2)}
.iso-ca-block{margin-bottom:14px}
.iso-ca-h4{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3)}
.iso-ca-list{margin:0;padding-left:1.2rem;font-size:13px;line-height:1.55;color:var(--text2)}
.iso-ca-list li{margin-bottom:6px}
.iso-ca-docs{margin:0;padding-left:0;list-style:none;font-size:13px;line-height:1.45;color:var(--text2)}
.iso-ca-docs li{margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed rgba(148,163,184,.12)}
.iso-ca-docs li:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.iso-ca-doc-meta{display:block;margin-top:4px;font-size:11px;color:var(--text3);font-weight:600}
.iso-ca-disclaimer{margin:14px 0 0;padding:12px 14px;border-radius:12px;border:1px solid var(--color-border-info);
  background:var(--color-info-bg);font-size:11px;line-height:1.5;color:var(--text2)}
.iso-ca-human{margin-top:18px;padding-top:16px;border-top:1px solid rgba(148,163,184,.12)}
.iso-ca-human-title{margin:0 0 6px;font-size:13px;font-weight:800;color:var(--text)}
.iso-ca-human-text{margin:0 0 14px;font-size:12px;line-height:1.5;color:var(--text2)}
.iso-ca-actions-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.iso-ca-override-label{margin:0 0 8px;font-size:11px;font-weight:700;color:var(--text3)}
.iso-ca-override-row{display:flex;flex-wrap:wrap;gap:8px}
.iso-ca-error-msg{margin:0 0 12px;font-size:13px;color:var(--color-text-danger);line-height:1.45}
.iso-ca-history-block{margin-top:16px;padding-top:14px;border-top:1px solid rgba(148,163,184,.12)}
.iso-ca-history-hint{margin:0 0 10px;font-size:11px;line-height:1.45;color:var(--text3)}
.iso-req-history-body .iso-req-history-list{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.iso-req-history-body .iso-req-history-item{
  display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px 12px;border-radius:10px;
  border:1px solid rgba(148,163,184,.12);background:rgba(0,0,0,.08);font-size:12px;line-height:1.4;
}
.iso-req-history-kind{font-weight:800;color:var(--accent,#2dd4bf);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.iso-req-history-meta{font-size:11px;font-weight:600;color:var(--text3)}
.iso-req-history-detail{font-size:12px;color:var(--text2);word-break:break-word}
.iso-req-history-empty{margin:0;font-size:12px;color:var(--text3);line-height:1.45}
html[data-theme='light'] .iso-ca-panel{
  border-color:rgba(15,23,42,.16);
  background:linear-gradient(180deg,var(--surface-1,#fff) 0%,var(--surface-2,#f8fafc) 100%);
  box-shadow:0 18px 42px -26px rgba(15,23,42,.35);
}
html[data-theme='light'] .iso-ca-head{border-bottom-color:rgba(15,23,42,.14)}
html[data-theme='light'] .iso-ca-sub,
html[data-theme='light'] .iso-ca-loading-hint,
html[data-theme='light'] .iso-ca-explain,
html[data-theme='light'] .iso-ca-list,
html[data-theme='light'] .iso-ca-docs,
html[data-theme='light'] .iso-ca-human-text,
html[data-theme='light'] .iso-ca-history-hint,
html[data-theme='light'] .iso-req-history-detail{color:var(--color-text-secondary,#334155)}
html[data-theme='light'] .iso-ca-proposed,
html[data-theme='light'] .iso-ca-block,
html[data-theme='light'] .iso-ca-human,
html[data-theme='light'] .iso-ca-history-block{
  border-color:rgba(15,23,42,.14);
}
html[data-theme='light'] .iso-ca-docs li{border-bottom-color:rgba(15,23,42,.14)}
html[data-theme='light'] .iso-req-history-body .iso-req-history-item{
  border-color:rgba(15,23,42,.15);
  background:color-mix(in srgb,var(--surface-2,#f8fafc) 84%,white 16%);
  box-shadow:0 1px 0 rgba(255,255,255,.62) inset;
}
`;

export function ensureIsoComplianceAssistStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
