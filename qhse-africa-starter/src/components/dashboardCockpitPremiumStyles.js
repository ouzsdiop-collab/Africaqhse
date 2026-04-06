const STYLE_ID = 'qhse-dashboard-cockpit-premium-styles';

const CSS = `
/* Ancien cockpit direction masqué ; alertes + raccourcis restent visibles dans la bande */
.dashboard-band--cockpit .dashboard-cockpit {
  display: none !important;
}

.dcp-cockpit {
  background: var(--color-background-primary);
  border-radius: var(--ds-radius-lg, 20px);
  border: 1px solid var(--color-border-tertiary);
  padding: 22px 24px;
  margin: 0 0 8px;
  box-sizing: border-box;
  box-shadow: var(--shadow-card);
  color: var(--text);
}

.dcp-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 18px;
}

.dcp-header-main {
  min-width: 0;
}

.dcp-date {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
}

.dcp-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text);
}

.dcp-site {
  margin: 0;
  font-size: 12px;
  color: var(--text3);
}

.dcp-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-background-secondary);
  color: var(--text2);
}

.dcp-status-pill--success {
  border-color: var(--color-border-success);
  background: var(--color-success-bg);
  color: var(--color-text-success);
}

.dcp-status-pill--warning {
  border-color: var(--color-border-warning);
  background: var(--color-warning-bg);
  color: var(--color-text-warning);
}

.dcp-status-pill--danger {
  border-color: var(--color-border-danger);
  background: var(--color-danger-bg);
  color: var(--color-text-danger);
}

.dcp-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: dcp-pulse 1.6s ease-in-out infinite;
}

@keyframes dcp-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.92); }
}

.dcp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 960px) {
  .dcp-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .dcp-kpi-grid {
    grid-template-columns: 1fr;
  }
}

.dcp-kpi-card {
  position: relative;
  padding: 14px 12px 12px;
  border-radius: var(--ds-radius-md, 14px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-secondary);
  min-width: 0;
}

.dcp-kpi-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: rgba(20, 184, 166, 0.78);
}

.dcp-kpi-card--info::before {
  background: rgba(20, 184, 166, 0.78);
}

.dcp-kpi-card--warning::before {
  background: rgba(251, 191, 36, 0.85);
}

.dcp-kpi-card--danger::before {
  background: rgba(248, 113, 113, 0.9);
}

.dcp-kpi-card--success::before {
  background: rgba(52, 211, 153, 0.85);
}

.dcp-kpi-value {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.dcp-kpi-label {
  margin: 6px 0 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
}

.dcp-kpi-delta {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text3);
}

.dcp-mid-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 800px) {
  .dcp-mid-grid {
    grid-template-columns: 1fr;
  }
}

.dcp-card {
  padding: 14px 14px 12px;
  border-radius: var(--ds-radius-md, 14px);
  border: 1px solid var(--color-border-tertiary);
  background: var(--color-background-secondary);
  min-height: 140px;
}

.dcp-card-title {
  margin: 0 0 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}

.dcp-alert-item,
.dcp-action-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-tertiary);
}

.dcp-alert-item:last-child,
.dcp-action-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dcp-alert-item {
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
}

.dcp-alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--color-text-tertiary) 55%, transparent);
}

.dcp-alert-dot--critique {
  background: rgba(248, 113, 113, 0.9);
}

.dcp-alert-dot--moyen {
  background: rgba(251, 191, 36, 0.9);
}

.dcp-alert-body {
  min-width: 0;
  flex: 1;
}

.dcp-alert-title {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text);
  word-break: break-word;
}

.dcp-alert-meta {
  font-size: 11px;
  color: var(--text3);
}

.dcp-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-background-tertiary);
  color: var(--text2);
  align-self: flex-start;
}

.dcp-badge--critique {
  border-color: var(--color-border-danger);
  color: var(--color-text-danger);
  background: var(--ds-danger-muted);
}

.dcp-badge--moyen {
  border-color: var(--color-border-warning);
  color: var(--color-text-warning);
  background: var(--ds-warning-muted);
}

.dcp-action-item {
  border-left: 3px solid color-mix(in srgb, var(--color-text-danger) 55%, transparent);
  padding-left: 10px;
  border-bottom-color: var(--color-border-tertiary);
}

.dcp-action-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
}

.dcp-action-meta {
  font-size: 11px;
  color: var(--text3);
}

.dcp-overdue-badge {
  display: inline-block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--ds-danger-muted);
  color: var(--color-text-danger);
  border: 1px solid var(--color-border-danger);
}

.dcp-empty-ok {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-success);
  font-weight: 600;
}

.dcp-bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 800px) {
  .dcp-bottom-grid {
    grid-template-columns: 1fr;
  }
}

.dcp-trend-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  height: 52px;
  margin: 10px 0 8px;
  padding: 0 2px;
}

.dcp-trend-bar-wrap {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.dcp-trend-bar {
  width: 100%;
  max-width: 28px;
  border-radius: 4px 4px 2px 2px;
  min-height: 4px;
  background: rgba(20, 184, 166, 0.42);
  transition: height 0.2s ease;
}

.dcp-trend-bar--current {
  background: rgba(45, 212, 191, 0.88);
}

.dcp-trend-bar--spike {
  background: rgba(248, 113, 113, 0.85);
}

.dcp-trend-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
}

.dcp-trend-footer {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
  line-height: 1.4;
}

.dcp-conf-item {
  margin-bottom: 10px;
}

.dcp-conf-item:last-child {
  margin-bottom: 0;
}

.dcp-conf-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
}

.dcp-conf-pct {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.dcp-conf-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border-tertiary);
  box-sizing: border-box;
  overflow: hidden;
}

.dcp-conf-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 0;
  transition: width 0.25s ease;
}

.dcp-conf-fill--low {
  background: rgba(251, 146, 60, 0.85);
}

.dcp-conf-fill--mid {
  background: rgba(20, 184, 166, 0.85);
}

.dcp-conf-fill--high {
  background: rgba(52, 211, 153, 0.88);
}

.dcp-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-tertiary);
}

.dcp-footer-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dcp-btn {
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-background-primary);
  color: var(--text);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dcp-btn:hover {
  border-color: var(--color-border-primary);
  background: var(--color-background-tertiary);
}

.dcp-btn--primary {
  border-color: var(--color-border-info);
  background: var(--ds-primary-muted);
  color: var(--color-text-info);
}

.dcp-btn--primary:hover {
  background: color-mix(in srgb, var(--palette-accent) 22%, var(--color-background-primary));
  border-color: var(--color-border-info);
}

.dcp-sync {
  margin: 0;
  font-size: 11px;
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}
`;

export function ensureDashboardCockpitPremiumStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}
