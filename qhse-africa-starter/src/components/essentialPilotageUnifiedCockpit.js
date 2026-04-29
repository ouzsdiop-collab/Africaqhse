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
  // Évite les tirets longs visibles et le jargon (on fait simple ici).
  return s.replaceAll('—', '-').replaceAll('–', '-').slice(0, 220);
}

function ensureList(v) {
  return Array.isArray(v) ? v : [];
}

/**
 * Cockpit décisionnel Essentiel (desktop) : lecture simple, sans recalcul lourd.
 * Alimenté par buildAssistantSnapshot + résultats IA existants + endpoint habilitations léger.
 */
export function createEssentialPilotageUnifiedCockpit() {
  const root = document.createElement('section');
  root.className = 'dashboard-essential-pilotage';

  root.innerHTML = `
    <article class="content-card card-soft dashboard-essential-pilotage__card">
      <div class="content-card-head content-card-head--split">
        <div>
          <div class="section-kicker">Cockpit</div>
          <h3 class="content-card-title">Pilotage intelligent (Essentiel)</h3>
          <p class="content-card-lead">Priorités · score · alertes critiques · actions recommandées.</p>
        </div>
        <div class="dashboard-essential-pilotage__score" aria-label="Score QHSE">
          <div class="dashboard-essential-pilotage__score-val">—</div>
          <div class="dashboard-essential-pilotage__score-lbl">Score QHSE / 100</div>
        </div>
      </div>

      <div class="dashboard-essential-pilotage__grid">
        <div class="dashboard-essential-pilotage__block">
          <div class="dashboard-essential-pilotage__k">Priorités principales</div>
          <ol class="dashboard-essential-pilotage__priorities"></ol>
        </div>

        <div class="dashboard-essential-pilotage__block">
          <div class="dashboard-essential-pilotage__k">Résumé direction</div>
          <p class="dashboard-essential-pilotage__summary">Chargement…</p>
        </div>

        <div class="dashboard-essential-pilotage__block">
          <div class="dashboard-essential-pilotage__k">Alertes critiques</div>
          <ul class="dashboard-essential-pilotage__alerts"></ul>
        </div>

        <div class="dashboard-essential-pilotage__block">
          <div class="dashboard-essential-pilotage__k">Actions recommandées</div>
          <ul class="dashboard-essential-pilotage__actions"></ul>
        </div>
      </div>
    </article>
  `;

  const scoreVal = root.querySelector('.dashboard-essential-pilotage__score-val');
  const priorities = root.querySelector('.dashboard-essential-pilotage__priorities');
  const summary = root.querySelector('.dashboard-essential-pilotage__summary');
  const alerts = root.querySelector('.dashboard-essential-pilotage__alerts');
  const actions = root.querySelector('.dashboard-essential-pilotage__actions');

  /** @type {{ expiredHab: number; expiringHab: number; lastHabError: string|null }} */
  const state = { expiredHab: 0, expiringHab: 0, lastHabError: null };

  function setScore(val) {
    if (!scoreVal) return;
    const n = Number(val);
    scoreVal.textContent = Number.isFinite(n) ? String(Math.max(0, Math.min(100, Math.round(n)))) : '—';
  }

  /**
   * @param {any} snap
   */
  function updateFromSnapshot(snap) {
    if (!snap || typeof snap !== 'object') return;
    setScore(snap.enrichedScore);

    if (summary) {
      const txt = String(snap.synthesis || '').trim();
      summary.textContent = txt ? txt.replaceAll('—', '-').replaceAll('–', '-') : 'Non disponible.';
    }

    const recs = ensureList(snap.recommendations).slice(0, 3);
    if (priorities) {
      priorities.replaceChildren();
      if (!recs.length) {
        const li = document.createElement('li');
        li.className = 'dashboard-essential-pilotage__empty';
        li.textContent = 'Aucune priorité majeure détectée.';
        priorities.append(li);
      } else {
        recs.forEach((r) => {
          const sev = normalizeSeverity(r?.severity);
          const li = document.createElement('li');
          li.className = `dashboard-essential-pilotage__prio dashboard-essential-pilotage__prio--${sev.key}`;
          li.innerHTML = `
            <div class="dashboard-essential-pilotage__prio-top">
              <span class="badge ${sev.key === 'critical' ? 'red' : sev.key === 'high' ? 'amber' : 'blue'}">${escapeHtml(
                sev.label
              )}</span>
              <strong class="dashboard-essential-pilotage__prio-label">${escapeHtml(String(r?.label || r?.title || 'Priorité'))}</strong>
            </div>
            <div class="dashboard-essential-pilotage__prio-reason">${escapeHtml(pickReason(r?.reason || r?.detail))}</div>
          `;
          priorities.append(li);
        });
      }
    }

    // Actions recommandées: on affiche le "recommendedAction" des priorités (simple et actionnable).
    if (actions) {
      actions.replaceChildren();
      const acts = recs
        .map((r) => String(r?.recommendedAction || '').trim())
        .filter(Boolean)
        .slice(0, 3);
      if (!acts.length) {
        const li = document.createElement('li');
        li.className = 'dashboard-essential-pilotage__empty';
        li.textContent = 'Aucune action recommandée (pour cette vue).';
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
  }

  /**
   * @param {{ narrative?: string; actions?: any[]; dataQualityGlobal?: any }|null} ai
   */
  function updateFromAi(ai) {
    // Le résumé direction reste basé sur le snapshot (déterministe). Si IA présente, on enrichit sans remplacer.
    const narrative = ai && typeof ai.narrative === 'string' ? ai.narrative.trim() : '';
    if (summary && narrative) {
      // Ajoute une phrase IA courte, sans jargon, sans tirets longs.
      const clean = narrative.replaceAll('—', '-').replaceAll('–', '-').split('\n').join(' ').trim();
      const short = clean.length > 240 ? `${clean.slice(0, 237)}…` : clean;
      summary.textContent = `${summary.textContent} ${short}`.trim();
    }
  }

  /**
   * @param {{ stats?: any; ncs?: any[]; incidents?: any[] }} ctx
   */
  function updateAlerts(ctx) {
    if (!alerts) return;
    const stats = ctx?.stats || {};
    const ncs = ensureList(ctx?.ncs);
    const inc = ensureList(ctx?.incidents);

    const openNc = ncs.filter((r) => {
      const s = String(r?.status || '').toLowerCase();
      if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
      return true;
    }).length;

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

  return {
    root,
    updateFromSnapshot,
    updateFromAi,
    updateAlerts,
    refreshHabilitationsAlerts
  };
}

