import { escapeHtml } from '../utils/escapeHtml.js';
import { qhseFetch } from '../utils/qhseFetch.js';

function normalizeSeverity(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (s === 'critical') return { key: 'critical', label: 'Critique' };
  if (s === 'high') return { key: 'high', label: 'Élevée' };
  if (s === 'medium') return { key: 'medium', label: 'Moyenne' };
  return { key: 'low', label: 'Faible' };
}

function pickReason(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'À traiter en priorité.';
  return s.replaceAll('—', '-').replaceAll('–', '-').slice(0, 220);
}

function ensureList(v) {
  return Array.isArray(v) ? v : [];
}

export function createEssentialPilotageUnifiedCockpit() {
  const root = document.createElement('section');
  root.className = 'dashboard-essential-pilotage';

  root.innerHTML = `
    <article class="content-card card-soft dashboard-essential-pilotage__card">
      <div class="dashboard-essential-pilotage__header">
        <div class="dashboard-essential-pilotage__head-main">
          <div class="dashboard-essential-pilotage__badge">COCKPIT</div>
          <h3 class="content-card-title">Pilotage Essentiel</h3>
          <p class="content-card-lead">Vue direction synthétique pour prioriser rapidement les décisions QHSE.</p>
          <p class="dashboard-essential-pilotage__dq"></p>
        </div>
        <div class="dashboard-essential-pilotage__status dashboard-essential-pilotage__status--empty">
          <span class="dashboard-essential-pilotage__status-dot" aria-hidden="true"></span>
          <span class="dashboard-essential-pilotage__status-label">Données à compléter</span>
        </div>
      </div>

      <div class="dashboard-essential-pilotage__score-wrap" aria-label="Score QHSE">
        <div class="dashboard-essential-pilotage__score-ring">
          <div class="dashboard-essential-pilotage__score-val">—</div>
          <div class="dashboard-essential-pilotage__score-unit">/100</div>
        </div>
        <div class="dashboard-essential-pilotage__score-lbl">Score QHSE</div>
      </div>

      <div class="dashboard-essential-pilotage__grid">
        <article class="dashboard-essential-pilotage__mini-card">
          <div class="dashboard-essential-pilotage__mini-head"><span>🎯</span>Priorités</div>
          <div class="dashboard-essential-pilotage__mini-count dashboard-essential-pilotage__mini-count--priorities">—</div>
          <ol class="dashboard-essential-pilotage__priorities"></ol>
        </article>

        <article class="dashboard-essential-pilotage__mini-card">
          <div class="dashboard-essential-pilotage__mini-head"><span>🚨</span>Alertes critiques</div>
          <div class="dashboard-essential-pilotage__mini-count dashboard-essential-pilotage__mini-count--alerts">—</div>
          <ul class="dashboard-essential-pilotage__alerts"></ul>
        </article>

        <article class="dashboard-essential-pilotage__mini-card">
          <div class="dashboard-essential-pilotage__mini-head"><span>✅</span>Actions recommandées</div>
          <div class="dashboard-essential-pilotage__mini-count dashboard-essential-pilotage__mini-count--actions">—</div>
          <ul class="dashboard-essential-pilotage__actions"></ul>
        </article>
      </div>

      <div class="dashboard-essential-pilotage__summary-box">
        <div class="dashboard-essential-pilotage__k">Executive summary</div>
        <p class="dashboard-essential-pilotage__summary">Chargement…</p>
      </div>
    </article>
  `;

  const scoreVal = root.querySelector('.dashboard-essential-pilotage__score-val');
  const priorities = root.querySelector('.dashboard-essential-pilotage__priorities');
  const summary = root.querySelector('.dashboard-essential-pilotage__summary');
  const alerts = root.querySelector('.dashboard-essential-pilotage__alerts');
  const actions = root.querySelector('.dashboard-essential-pilotage__actions');
  const dq = root.querySelector('.dashboard-essential-pilotage__dq');
  const status = root.querySelector('.dashboard-essential-pilotage__status');
  const statusLabel = root.querySelector('.dashboard-essential-pilotage__status-label');
  const miniPriorities = root.querySelector('.dashboard-essential-pilotage__mini-count--priorities');
  const miniAlerts = root.querySelector('.dashboard-essential-pilotage__mini-count--alerts');
  const miniActions = root.querySelector('.dashboard-essential-pilotage__mini-count--actions');

  const state = { expiredHab: 0, expiringHab: 0, lastHabError: null };

  function deriveAvailabilityState() {
    const hasScore = scoreVal && scoreVal.textContent && scoreVal.textContent.trim() !== '—';
    const hasPriorities = priorities && priorities.querySelector('.dashboard-essential-pilotage__prio');
    const hasAlerts = alerts && alerts.querySelector('.dashboard-essential-pilotage__alert');
    const hasActions = actions && actions.querySelector('.dashboard-essential-pilotage__action');
    const hasSummary = summary && summary.textContent && !/chargement|non disponible/i.test(summary.textContent);
    const hasAny = Boolean(hasScore || hasPriorities || hasAlerts || hasActions || hasSummary);
    const isComplete = Boolean(hasScore && hasPriorities && hasSummary);
    return isComplete ? 'ready' : hasAny ? 'partial' : 'empty';
  }

  function refreshUiMeta() {
    const prioCount = priorities ? priorities.querySelectorAll('.dashboard-essential-pilotage__prio').length : 0;
    const alertCount = alerts ? alerts.querySelectorAll('.dashboard-essential-pilotage__alert').length : 0;
    const actionCount = actions ? actions.querySelectorAll('.dashboard-essential-pilotage__action').length : 0;
    if (miniPriorities) miniPriorities.textContent = String(prioCount);
    if (miniAlerts) miniAlerts.textContent = String(alertCount);
    if (miniActions) miniActions.textContent = String(actionCount);

    const availability = deriveAvailabilityState();
    if (status && statusLabel) {
      status.className = `dashboard-essential-pilotage__status dashboard-essential-pilotage__status--${availability}`;
      statusLabel.textContent = availability === 'ready' ? 'Données disponibles' : 'Données à compléter';
    }
  }

  function dataQualityLabelFr(v) {
    const s = String(v || '').toLowerCase();
    if (s === 'complete') return 'fiable';
    if (s === 'partial') return 'partiel';
    return 'incomplet';
  }

  function updateFromBackendPilotage(p) {
    if (!p || typeof p !== 'object') {
      setScore(null);
      if (priorities) {
        priorities.replaceChildren();
        const li = document.createElement('li');
        li.className = 'dashboard-essential-pilotage__empty';
        li.textContent = 'Données de pilotage à compléter';
        priorities.append(li);
      }
      if (summary) {
        summary.innerHTML = `<strong>Données de pilotage à compléter</strong><br>Ajoutez vos premiers risques, incidents, actions ou audits pour générer une synthèse fiable.`;
      }
      if (dq) dq.textContent = 'Fiabilité: non disponible.';
      if (actions) {
        actions.replaceChildren();
        const li = document.createElement('li');
        li.className = 'dashboard-essential-pilotage__empty';
        li.textContent = 'Ajoutez vos premiers risques, incidents, actions ou audits pour générer une synthèse fiable.';
        actions.append(li);
      }
      refreshUiMeta();
      return;
    }

    setScore(p.score);
    if (summary) {
      const txt = String(p.executiveSummary || '').trim();
      summary.textContent = txt ? txt.replaceAll('—', '-').replaceAll('–', '-') : 'Données de pilotage à compléter. Ajoutez vos premiers risques, incidents, actions ou audits pour générer une synthèse fiable.';
    }
    const dqg = p?.dataQuality && typeof p.dataQuality === 'object' ? p.dataQuality : null;
    if (dq) {
      dq.textContent = !dqg
        ? 'Fiabilité: incomplet.'
        : `Fiabilité: incidents ${dataQualityLabelFr(dqg.incidents)}, actions ${dataQualityLabelFr(dqg.actions)}, audits ${dataQualityLabelFr(dqg.audits)}, risques ${dataQualityLabelFr(dqg.risks)}.`;
    }

    const recs = ensureList(p.topPriorities).slice(0, 3);
    if (priorities) {
      priorities.replaceChildren();
      if (!recs.length) {
        const li = document.createElement('li');
        li.className = 'dashboard-essential-pilotage__empty';
        li.textContent = 'Données de pilotage à compléter';
        priorities.append(li);
      } else {
        recs.forEach((r) => {
          const sev = normalizeSeverity(r?.severity);
          const li = document.createElement('li');
          li.className = `dashboard-essential-pilotage__prio dashboard-essential-pilotage__prio--${sev.key}`;
          li.innerHTML = `<div class="dashboard-essential-pilotage__prio-top"><span class="badge ${sev.key === 'critical' ? 'red' : sev.key === 'high' ? 'amber' : 'blue'}">${escapeHtml(sev.label)}</span><strong class="dashboard-essential-pilotage__prio-label">${escapeHtml(String(r?.label || 'Priorité'))}</strong></div><div class="dashboard-essential-pilotage__prio-reason">${escapeHtml(pickReason(r?.reason))}</div>`;
          priorities.append(li);
        });
      }
    }

    if (actions) {
      actions.replaceChildren();
      const acts = ensureList(p.recommendedActions).map((t) => String(t || '').trim()).filter(Boolean).slice(0, 3);
      if (!acts.length) {
        const li = document.createElement('li');
        li.className = 'dashboard-essential-pilotage__empty';
        li.textContent = 'Données de pilotage à compléter';
        actions.append(li);
      } else {
        acts.forEach((t) => {
          const li = document.createElement('li');
          li.className = 'dashboard-essential-pilotage__action';
          li.textContent = t.replaceAll('—', '-').replaceAll('–', '-').slice(0, 240);
          actions.append(li);
        });
      }
    }
    refreshUiMeta();
  }

  function setScore(val) {
    if (!scoreVal) return;
    const n = Number(val);
    const safe = Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
    scoreVal.textContent = safe === null ? '—' : String(safe);
    root.style.setProperty('--cockpit-score-progress', `${safe === null ? 0 : safe}%`);
  }

  function updateFromSnapshot(snap) {
    if (!snap || typeof snap !== 'object') return;
    setScore(snap.enrichedScore);
    if (summary) {
      const txt = String(snap.synthesis || '').trim();
      summary.textContent = txt ? txt.replaceAll('—', '-').replaceAll('–', '-') : 'Données de pilotage à compléter. Ajoutez vos premiers risques, incidents, actions ou audits pour générer une synthèse fiable.';
    }
    refreshUiMeta();
  }

  function updateFromAi(ai) {
    const narrative = ai && typeof ai.narrative === 'string' ? ai.narrative.trim() : '';
    if (summary && narrative) {
      const clean = narrative.replaceAll('—', '-').replaceAll('–', '-').split('\n').join(' ').trim();
      const short = clean.length > 240 ? `${clean.slice(0, 237)}…` : clean;
      summary.textContent = `${summary.textContent} ${short}`.trim();
    }
    refreshUiMeta();
  }

  function updateAlerts(ctx) {
    if (!alerts) return;
    const stats = ctx?.stats || {};
    const ncs = ensureList(ctx?.ncs);
    const inc = ensureList(ctx?.incidents);

    const openNc = ncs.filter((r) => !/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(String(r?.status || '').toLowerCase())).length;
    const recentCritical = Array.isArray(stats?.criticalIncidents)
      ? stats.criticalIncidents.length
      : inc.filter((i) => String(i?.severity || '').toLowerCase().includes('crit')).length;

    const out = [];
    if (state.expiredHab > 0) out.push(`Habilitations expirées : ${state.expiredHab}`);
    if (state.expiringHab > 0) out.push(`Habilitations bientôt expirées : ${state.expiringHab}`);
    if (recentCritical > 0) out.push(`Incidents critiques récents : ${recentCritical}`);
    if (openNc > 0) out.push(`Non-conformités ouvertes : ${openNc}`);

    alerts.replaceChildren();
    if (!out.length) {
      const li = document.createElement('li');
      li.className = 'dashboard-essential-pilotage__empty';
      li.textContent = 'Aucune alerte critique détectée.';
      alerts.append(li);
    } else {
      out.slice(0, 5).forEach((t) => {
        const li = document.createElement('li');
        li.className = 'dashboard-essential-pilotage__alert';
        li.textContent = t;
        alerts.append(li);
      });
    }
    refreshUiMeta();
  }

  async function refreshHabilitationsAlerts() {
    try {
      const res = await qhseFetch('/api/habilitations/alerts?daysAhead=30&limit=6');
      if (!res.ok) {
        state.lastHabError = 'api';
        state.expiredHab = 0;
        state.expiringHab = 0;
        return;
      }
      const j = await res.json().catch(() => ({}));
      const rows = ensureList(j?.alerts);
      state.expiredHab = rows.filter((a) => String(a?.type || '').includes('expired')).length;
      state.expiringHab = rows.filter((a) => String(a?.type || '').includes('expiring')).length;
      state.lastHabError = null;
    } catch {
      state.lastHabError = 'network';
      state.expiredHab = 0;
      state.expiringHab = 0;
    }
  }

  return { root, updateFromBackendPilotage, updateFromSnapshot, updateFromAi, updateAlerts, refreshHabilitationsAlerts };
}
