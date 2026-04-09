import { activityLogStore } from '../data/activityLog.js';
import { ensureActivityLogStyles } from '../components/activityLogStyles.js';
import {
  buildActivityLogSnapshot,
  computeActivityQuickCounts,
  buildActivityLogDigest,
  uniqueActivityUsers,
  filterActivityLogEntries,
  isActivityEntryCritical,
  pickCriticalSpotlightEntries,
  buildJournalAnalysisLines
} from '../components/activityLogHelpers.js';
import { createActivityLogSummary } from '../components/activityLogSummary.js';
import { createActivityLogRow } from '../components/activityLogRow.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { consumeJournalServerTabIntent } from '../utils/state.js';
import { createAuditLogsServerPanel } from './audit-logs.js';

const LS_SCHEDULE = 'qhse-activity-log-schedule';
const LS_SCOPE = 'qhse-activity-log-export-scope';
const LS_CRITICAL = 'qhse-activity-log-critical-only';

/**
 * Tableau du journal — réutilisable avec une liste filtrée / triée (futur).
 * @param {Array} entries liste déjà ordonnée (ex. antichronologique)
 */
export function createActivityLogTable(entries) {
  const table = document.createElement('div');
  table.className = 'activity-log-table';
  table.setAttribute('data-activity-log-table', '');

  const head = document.createElement('div');
  head.className = 'activity-log-head';
  head.innerHTML = `
    <span>Module</span>
    <span>Action</span>
    <span>Détail</span>
    <span>Utilisateur</span>
    <span>Date / heure</span>
  `;
  table.append(head);

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'activity-log-empty-msg';
    empty.setAttribute('role', 'status');
    empty.textContent = 'Aucune entrée ne correspond aux filtres.';
    table.append(empty);
    return table;
  }

  entries.forEach((entry) => {
    table.append(createActivityLogRow(entry));
  });

  return table;
}

function periodLabel(p) {
  if (p === '24h') return '24 h';
  if (p === '7j') return '7 jours';
  return 'tout l’historique affiché';
}

function downloadActivityCsv(entries) {
  const sep = ';';
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['Module', 'Action', 'Détail', 'Utilisateur', 'Horodatage'].map(esc).join(sep)
  ];
  entries.forEach((e) => {
    lines.push(
      [e.module, e.action, e.detail, e.user, e.timestamp].map(esc).join(sep)
    );
  });
  const blob = new Blob([`\ufeff${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;'
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `journal-qhse-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function openActivityLogPdf(entries) {
  const rows = entries
    .map(
      (e) =>
        `<tr><td>${escapeHtml(e.module)}</td><td>${escapeHtml(e.action)}</td><td>${escapeHtml(e.detail)}</td><td>${escapeHtml(e.user)}</td><td>${escapeHtml(e.timestamp)}</td></tr>`
    )
    .join('');
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Journal QHSE</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;padding:20px;font-size:11px;color:#111}
h1{font-size:16px;margin:0 0 12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f5;font-size:10px;text-transform:uppercase}
.foot{margin-top:16px;font-size:10px;color:#666}</style></head><body>
<h1>Journal des modifications — export</h1>
<table><thead><tr><th>Module</th><th>Action</th><th>Détail</th><th>Utilisateur</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
<p class="foot">Généré le ${escapeHtml(new Date().toLocaleString('fr-FR'))} — impression ou « Enregistrer au format PDF ».</p>
<script>addEventListener('load',function(){setTimeout(function(){print()},200)})<\/script>
</body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

/**
 * @param {{ initialTab?: 'session' | 'server' }} [opts]
 */
export function renderActivityLog(opts = {}) {
  ensureActivityLogStyles();

  const page = document.createElement('section');
  page.className = 'page-stack activity-log-page';
  if (localStorage.getItem(LS_CRITICAL) === '1') {
    page.classList.add('activity-log-page--audit-view');
  }

  const su = getSessionUser();
  const canServerTab = Boolean(su && canResource(su.role, 'audit_logs', 'read'));

  let openServer =
    opts.initialTab === 'server' || consumeJournalServerTabIntent();
  const rawHash = window.location.hash.replace(/^#/, '');
  if (rawHash === 'audit-logs') {
    openServer = true;
    try {
      const base = `${window.location.pathname}${window.location.search}`;
      history.replaceState(null, '', `${base}#activity-log`);
    } catch {
      /* ignore */
    }
  }
  if (openServer && !canServerTab) openServer = false;

  const tabsRow = document.createElement('div');
  tabsRow.className = 'activity-log-journal-tabs';
  tabsRow.setAttribute('role', 'tablist');
  tabsRow.setAttribute('aria-label', 'Source du journal');

  const btnSession = document.createElement('button');
  btnSession.type = 'button';
  btnSession.className = 'activity-log-journal-tab';
  btnSession.setAttribute('role', 'tab');
  btnSession.setAttribute('aria-selected', openServer ? 'false' : 'true');
  btnSession.setAttribute('id', 'activity-log-tab-session');
  btnSession.textContent = 'Session navigateur';

  const btnServer = document.createElement('button');
  btnServer.type = 'button';
  btnServer.className = 'activity-log-journal-tab';
  btnServer.setAttribute('role', 'tab');
  btnServer.setAttribute('aria-selected', openServer ? 'true' : 'false');
  btnServer.setAttribute('id', 'activity-log-tab-server');
  btnServer.textContent = 'Journal serveur (API)';
  btnServer.hidden = !canServerTab;

  tabsRow.append(btnSession, btnServer);

  const card = document.createElement('article');
  card.className = 'content-card card-soft';
  card.setAttribute('role', 'tabpanel');
  card.setAttribute('aria-labelledby', 'activity-log-tab-session');
  card.hidden = openServer;

  const certStrip = document.createElement('div');
  certStrip.className = 'activity-log-cert-strip';
  certStrip.setAttribute('role', 'region');
  certStrip.setAttribute('aria-label', 'Journal certifiable');
  certStrip.innerHTML = `
    <div class="activity-log-cert-badges">
      <span class="activity-log-cert-badge">Journal certifiable</span>
      <span class="activity-log-cert-badge activity-log-cert-badge--subtle">Traçabilité inviolable</span>
    </div>
    <p class="activity-log-cert-lead">Conforme audit ISO — historique non modifiable</p>
  `;

  const headBlock = document.createElement('div');
  headBlock.className = 'content-card-head';
  headBlock.innerHTML = `
    <div>
      <div class="section-kicker">Traçabilité</div>
      <h3>Journal des modifications</h3>
      <p class="content-card-lead">
        Piste d’activité de cette session (navigateur) : synthèse, filtres et exports. Les événements enregistrés côté API sont dans l’onglet « Journal serveur ».
      </p>
    </div>
  `;

  const state = {
    period: /** @type {'24h' | '7j' | 'all'} */ ('7j'),
    kind: /** @type {'all' | 'create' | 'modify' | 'close'} */ ('all'),
    user: '',
    criticalOnly: localStorage.getItem(LS_CRITICAL) === '1',
    schedule: localStorage.getItem(LS_SCHEDULE) || 'off',
    exportScope: localStorage.getItem(LS_SCOPE) || 'full'
  };

  const quickSection = document.createElement('div');
  quickSection.className = 'activity-log-quick';
  quickSection.innerHTML = `
    <div class="activity-log-quick-head">
      <span class="activity-log-quick-title">Résumé rapide</span>
      <div class="activity-log-period-toggle" role="group" aria-label="Période du résumé">
        <button type="button" class="activity-log-chip" data-period="24h">24 h</button>
        <button type="button" class="activity-log-chip activity-log-chip--on" data-period="7j">7 j</button>
        <button type="button" class="activity-log-chip" data-period="all">Tout</button>
      </div>
    </div>
    <div class="activity-log-quick-grid">
      <div class="activity-log-quick-card"><span class="activity-log-quick-k">Incidents créés</span><span class="activity-log-quick-v" data-quick="inc">0</span></div>
      <div class="activity-log-quick-card"><span class="activity-log-quick-k">Actions modifiées</span><span class="activity-log-quick-v" data-quick="act">0</span></div>
      <div class="activity-log-quick-card"><span class="activity-log-quick-k">Audits (lancés / prép.)</span><span class="activity-log-quick-v" data-quick="aud">0</span></div>
      <div class="activity-log-quick-card activity-log-quick-card--alert"><span class="activity-log-quick-k">Anomalies critiques</span><span class="activity-log-quick-v" data-quick="crit">0</span></div>
    </div>
  `;

  const digestEl = document.createElement('p');
  digestEl.className = 'activity-log-digest';

  const prefsEl = document.createElement('div');
  prefsEl.className = 'activity-log-prefs';
  prefsEl.innerHTML = `
    <div class="activity-log-prefs-block">
      <span class="activity-log-prefs-k">Envoi périodique (UI)</span>
      <select class="control-select activity-log-prefs-select" data-pref="schedule" aria-label="Fréquence d’envoi">
        <option value="off">Désactivé</option>
        <option value="weekly">Hebdomadaire</option>
        <option value="monthly">Mensuel</option>
      </select>
      <select class="control-select activity-log-prefs-select" data-pref="scope" aria-label="Contenu du futur envoi">
        <option value="anomalies">Anomalies seulement</option>
        <option value="actions">Actions</option>
        <option value="full">Complet</option>
      </select>
    </div>
    <label class="activity-log-prefs-check">
      <input type="checkbox" data-pref="critical" />
      <span>Alertes : événements critiques uniquement (réglage local)</span>
    </label>
    <p class="activity-log-prefs-hint">L’envoi automatique sera branché côté serveur — les choix sont mémorisés localement.</p>
  `;

  const filtersEl = document.createElement('div');
  filtersEl.className = 'activity-log-filters';
  filtersEl.innerHTML = `
    <span class="activity-log-filters-k">Filtres</span>
    <label class="activity-log-filter-field"><span>Type</span>
      <select class="control-select" data-filter="kind" aria-label="Filtrer par type d’événement">
        <option value="all">Tous</option>
        <option value="create">Création</option>
        <option value="modify">Modification</option>
        <option value="close">Clôture</option>
      </select>
    </label>
    <label class="activity-log-filter-field"><span>Utilisateur</span>
      <select class="control-select" data-filter="user" aria-label="Filtrer par utilisateur"><option value="">Tous</option></select>
    </label>
  `;

  const exportRow = document.createElement('div');
  exportRow.className = 'activity-log-export-row';
  const btnCsv = document.createElement('button');
  btnCsv.type = 'button';
  btnCsv.className = 'btn btn-secondary';
  btnCsv.textContent = 'Export Excel (CSV)';
  const btnPdf = document.createElement('button');
  btnPdf.type = 'button';
  btnPdf.className = 'btn btn-secondary';
  btnPdf.textContent = 'Export PDF';
  exportRow.append(btnCsv, btnPdf);

  const criticalSection = document.createElement('section');
  criticalSection.className = 'activity-log-critical';
  criticalSection.innerHTML = `
    <div class="activity-log-critical-head">
      <span class="activity-log-critical-title">Faits critiques</span>
      <span class="activity-log-critical-sub">Top événements sensibles (période active)</span>
    </div>
    <div class="activity-log-critical-mount"></div>
  `;

  const analysisSection = document.createElement('section');
  analysisSection.className = 'activity-log-analysis';
  analysisSection.innerHTML = `
    <div class="activity-log-analysis-head">
      <span class="activity-log-analysis-title">Lecture synthétique</span>
    </div>
    <ul class="activity-log-analysis-list"></ul>
  `;

  const summaryMount = document.createElement('div');
  summaryMount.className = 'activity-log-summary-mount';

  const toolbar = document.createElement('div');
  toolbar.className = 'activity-log-toolbar';
  toolbar.setAttribute('role', 'note');
  toolbar.classList.add('activity-log-toolbar--split');
  toolbar.innerHTML = `
    <div class="activity-log-toolbar-main">
      <span>Journal filtré</span>
      <span class="activity-log-toolbar-note">Tri antichronologique · ligne cliquable vers le module · export = vue courante</span>
    </div>
    <button type="button" class="btn btn-secondary activity-log-audit-view-btn" aria-pressed="false" title="Afficher uniquement les événements critiques">
      Vue audit
    </button>
  `;

  const tableMount = document.createElement('div');
  tableMount.className = 'activity-log-table-mount';

  const extensionSlot = document.createElement('div');
  extensionSlot.className = 'activity-log-extension-slot';
  extensionSlot.innerHTML = `
    <span class="activity-log-extension-label">Note ISO</span>
    <span class="activity-log-extension-text">Les horodatages textuels sont enrichis côté client à la prochaine évolution ; la structure module / action / détail / auteur reste stable pour audit.</span>
  `;

  card.append(
    certStrip,
    headBlock,
    criticalSection,
    quickSection,
    digestEl,
    analysisSection,
    prefsEl,
    filtersEl,
    exportRow,
    summaryMount,
    toolbar,
    tableMount,
    extensionSlot
  );

  const serverPanel = createAuditLogsServerPanel();
  serverPanel.setAttribute('role', 'tabpanel');
  serverPanel.setAttribute('aria-labelledby', 'activity-log-tab-server');
  serverPanel.hidden = !openServer;

  function setJournalTab(server) {
    const showServer = server && canServerTab;
    card.hidden = showServer;
    serverPanel.hidden = !showServer;
    btnSession.setAttribute('aria-selected', showServer ? 'false' : 'true');
    btnServer.setAttribute('aria-selected', showServer ? 'true' : 'false');
    btnSession.classList.toggle('activity-log-journal-tab--active', !showServer);
    btnServer.classList.toggle('activity-log-journal-tab--active', showServer);
  }

  btnSession.addEventListener('click', () => setJournalTab(false));
  btnServer.addEventListener('click', () => setJournalTab(true));

  setJournalTab(openServer);

  page.append(tabsRow, card, serverPanel);

  const userSel = filtersEl.querySelector('[data-filter="user"]');
  const kindSel = filtersEl.querySelector('[data-filter="kind"]');
  const scheduleSel = prefsEl.querySelector('[data-pref="schedule"]');
  const scopeSel = prefsEl.querySelector('[data-pref="scope"]');
  const critCb = prefsEl.querySelector('[data-pref="critical"]');

  uniqueActivityUsers(activityLogStore.all()).forEach((u) => {
    const o = document.createElement('option');
    o.value = u;
    o.textContent = u;
    userSel.append(o);
  });

  scheduleSel.value = state.schedule;
  scopeSel.value = state.exportScope;
  critCb.checked = state.criticalOnly;

  function syncPeriodChips() {
    quickSection.querySelectorAll('.activity-log-chip[data-period]').forEach((b) => {
      b.classList.toggle('activity-log-chip--on', b.getAttribute('data-period') === state.period);
    });
  }

  const criticalMountEl = criticalSection.querySelector('.activity-log-critical-mount');
  const analysisListEl = analysisSection.querySelector('.activity-log-analysis-list');
  const auditBtn = toolbar.querySelector('.activity-log-audit-view-btn');

  function syncAuditUi() {
    page.classList.toggle('activity-log-page--audit-view', state.criticalOnly);
    if (auditBtn) {
      auditBtn.textContent = state.criticalOnly ? 'Vue complète' : 'Vue audit';
      auditBtn.setAttribute('aria-pressed', state.criticalOnly ? 'true' : 'false');
    }
  }

  function refresh() {
    const all = activityLogStore.all();
    const filtered = filterActivityLogEntries(all, {
      period: state.period,
      kind: state.kind,
      user: state.user,
      criticalOnly: state.criticalOnly
    });
    const quick = computeActivityQuickCounts(all, state.period);
    quickSection.querySelector('[data-quick="inc"]').textContent = String(quick.incCreated);
    quickSection.querySelector('[data-quick="act"]').textContent = String(quick.actMod);
    quickSection.querySelector('[data-quick="aud"]').textContent = String(quick.audLaunched);
    quickSection.querySelector('[data-quick="crit"]').textContent = String(quick.crit);
    digestEl.textContent = buildActivityLogDigest(quick, periodLabel(state.period));

    const periodBase = filterActivityLogEntries(all, {
      period: state.period,
      kind: 'all',
      user: '',
      criticalOnly: false
    });
    const spotlight = pickCriticalSpotlightEntries(periodBase, 3);
    if (criticalMountEl) {
      criticalMountEl.className = 'activity-log-critical-mount';
      criticalMountEl.replaceChildren();
      if (!spotlight.length) {
        const empty = document.createElement('p');
        empty.className = 'activity-log-critical-empty';
        empty.setAttribute('role', 'status');
        empty.textContent = 'Aucun événement critique ne ressort sur la période sélectionnée.';
        criticalMountEl.append(empty);
      } else {
        spotlight.forEach((entry) => {
          criticalMountEl.append(createActivityLogRow(entry));
        });
      }
    }

    const periodForAnalysis = filterActivityLogEntries(all, {
      period: state.period,
      kind: state.kind,
      user: state.user,
      criticalOnly: false
    });
    if (analysisListEl) {
      analysisListEl.replaceChildren();
      const snap = buildActivityLogSnapshot(periodForAnalysis);
      buildJournalAnalysisLines(quick, snap, periodLabel(state.period)).forEach((line) => {
        const li = document.createElement('li');
        li.className = 'activity-log-analysis-item';
        li.textContent = line;
        analysisListEl.append(li);
      });
    }

    summaryMount.replaceChildren(createActivityLogSummary(buildActivityLogSnapshot(filtered)));
    tableMount.replaceChildren(createActivityLogTable(filtered));
    syncPeriodChips();
    syncAuditUi();
  }

  quickSection.querySelectorAll('.activity-log-chip[data-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.period = /** @type {'24h' | '7j' | 'all'} */ (btn.getAttribute('data-period'));
      refresh();
    });
  });

  kindSel.addEventListener('change', () => {
    state.kind = /** @type {'all' | 'create' | 'modify' | 'close'} */ (kindSel.value);
    refresh();
  });

  userSel.addEventListener('change', () => {
    state.user = userSel.value;
    refresh();
  });

  scheduleSel.addEventListener('change', () => {
    state.schedule = scheduleSel.value;
    localStorage.setItem(LS_SCHEDULE, state.schedule);
  });

  scopeSel.addEventListener('change', () => {
    state.exportScope = scopeSel.value;
    localStorage.setItem(LS_SCOPE, state.exportScope);
  });

  critCb.addEventListener('change', () => {
    state.criticalOnly = critCb.checked;
    localStorage.setItem(LS_CRITICAL, state.criticalOnly ? '1' : '0');
    refresh();
  });

  auditBtn?.addEventListener('click', () => {
    state.criticalOnly = !state.criticalOnly;
    critCb.checked = state.criticalOnly;
    localStorage.setItem(LS_CRITICAL, state.criticalOnly ? '1' : '0');
    refresh();
  });

  function rowsForExport(filtered) {
    if (state.exportScope === 'anomalies') {
      return filtered.filter((e) => isActivityEntryCritical(e));
    }
    if (state.exportScope === 'actions') {
      return filtered.filter((e) => e.module === 'actions');
    }
    return filtered;
  }

  btnCsv.addEventListener('click', () => {
    const all = activityLogStore.all();
    const filtered = filterActivityLogEntries(all, {
      period: state.period,
      kind: state.kind,
      user: state.user,
      criticalOnly: state.criticalOnly
    });
    downloadActivityCsv(rowsForExport(filtered));
  });

  btnPdf.addEventListener('click', () => {
    const all = activityLogStore.all();
    const filtered = filterActivityLogEntries(all, {
      period: state.period,
      kind: state.kind,
      user: state.user,
      criticalOnly: state.criticalOnly
    });
    openActivityLogPdf(rowsForExport(filtered));
  });

  refresh();
  return page;
}
