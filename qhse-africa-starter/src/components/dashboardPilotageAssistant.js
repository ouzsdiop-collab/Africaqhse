/**
 * Bloc « Assistant pilotage » : recommandations, synthèse, anomalies, score enrichi.
 */

import { ensureDashboardStyles } from './dashboardStyles.js';
import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * @param {object} opts
 * @param {(rec: object) => void} opts.onActivateRecommendation : navigation + optionnel ouverture dialogue action
 */
export function createDashboardPilotageAssistant(opts = {}) {
  const { onActivateRecommendation } = opts;
  ensureDashboardStyles();

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-pilotage-assistant';
  wrap.innerHTML = `
    <article class="content-card card-soft dashboard-pilotage-assistant__card">
      <div class="dashboard-pilotage-assistant__head">
        <div>
          <div class="section-kicker">Suggestions assistées</div>
          <h3 class="dashboard-pilotage-assistant__title">Assistant de pilotage QHSE</h3>
          <p class="dashboard-pilotage-assistant__lead">
            Recommandations limitées à 3 items, priorisation automatique et alertes de cohérence. Vous gardez la main sur chaque décision.
          </p>
        </div>
        <div class="dashboard-pilotage-assistant__score-block" aria-label="Score global assisté">
          <span class="dashboard-pilotage-assistant__score-val">Non disponible</span>
          <span class="dashboard-pilotage-assistant__score-lbl">Score assisté</span>
          <span class="dashboard-pilotage-assistant__score-sub">Risques · actions · documents · audits (vue affichée)</span>
        </div>
      </div>
      <div class="dashboard-pilotage-assistant__panels">
        <section class="dashboard-pilotage-assistant__panel dashboard-pilotage-assistant__synthesis" aria-label="Synthèse pilotage">
          <h4 class="dashboard-pilotage-assistant__h">Synthèse</h4>
          <p class="dashboard-pilotage-assistant__synthesis-text">Chargement…</p>
        </section>
        <section class="dashboard-pilotage-assistant__panel dashboard-pilotage-assistant__ia" aria-label="Lecture assistée du pilotage">
          <h4 class="dashboard-pilotage-assistant__h">Lecture assistée</h4>
          <p class="dashboard-pilotage-assistant__ia-loading" hidden>Synthèse en cours…</p>
          <p class="dashboard-pilotage-assistant__ia-text" hidden></p>
          <ul class="dashboard-pilotage-assistant__ia-actions" hidden></ul>
        </section>
        <section class="dashboard-pilotage-assistant__panel dashboard-pilotage-assistant__recs" aria-label="Recommandations">
          <h4 class="dashboard-pilotage-assistant__h">Recommandations (à valider)</h4>
          <ul class="dashboard-pilotage-assistant__rec-list"></ul>
        </section>
        <section class="dashboard-pilotage-assistant__panel dashboard-pilotage-assistant__anomalies" hidden aria-label="Anomalies">
          <h4 class="dashboard-pilotage-assistant__h">Détection d’anomalies</h4>
          <div class="dashboard-pilotage-assistant__anomaly-panel">
            <ul class="dashboard-pilotage-assistant__anomaly-list"></ul>
          </div>
        </section>
      </div>
    </article>
  `;

  const scoreVal = wrap.querySelector('.dashboard-pilotage-assistant__score-val');
  const synText = wrap.querySelector('.dashboard-pilotage-assistant__synthesis-text');
  const iaLoading = wrap.querySelector('.dashboard-pilotage-assistant__ia-loading');
  const iaText = wrap.querySelector('.dashboard-pilotage-assistant__ia-text');
  const iaActions = wrap.querySelector('.dashboard-pilotage-assistant__ia-actions');
  const recList = wrap.querySelector('.dashboard-pilotage-assistant__rec-list');
  const anomBlock = wrap.querySelector('.dashboard-pilotage-assistant__anomalies');
  const anomList = wrap.querySelector('.dashboard-pilotage-assistant__anomaly-list');

  /** @param {object} snap */
  function update(snap) {
    if (!snap) return;
    if (scoreVal) scoreVal.textContent = `${snap.enrichedScore} %`;
    if (synText) synText.textContent = snap.synthesis || 'Non disponible';

    if (recList) {
      recList.replaceChildren();
      const list = snap.recommendations || [];
      if (!list.length) {
        const li = document.createElement('li');
        li.className = 'dashboard-pilotage-assistant__rec-empty';
        li.textContent = 'Aucune recommandation prioritaire. Poursuivez le suivi habituel.';
        recList.append(li);
      } else {
        list.forEach((rec) => {
          const li = document.createElement('li');
          li.className = 'dashboard-pilotage-assistant__rec-item';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dashboard-pilotage-assistant__rec-btn';
          const pr = rec.priorityLabel || 'Normal';
          const prioClass = sanitizeRecPriorityKey(rec.priorityKey);
          btn.innerHTML = `
            <span class="dashboard-pilotage-assistant__rec-prio dashboard-pilotage-assistant__rec-prio--${prioClass}">${escapeHtml(pr)}</span>
            <span class="dashboard-pilotage-assistant__rec-title">${escapeHtml(rec.title)}</span>
            <span class="dashboard-pilotage-assistant__rec-detail">${escapeHtml(rec.detail)}</span>
            <span class="dashboard-pilotage-assistant__rec-cta">Agir →</span>
          `;
          btn.addEventListener('click', () => {
            if (typeof onActivateRecommendation === 'function') onActivateRecommendation(rec);
          });
          li.append(btn);
          recList.append(li);
        });
      }
    }

    const anoms = snap.anomalies || [];
    if (anomBlock && anomList) {
      if (!anoms.length) {
        anomBlock.hidden = true;
        anomList.replaceChildren();
      } else {
        anomBlock.hidden = false;
        anomList.replaceChildren();
        anoms.forEach((a) => {
          const li = document.createElement('li');
          li.className = `dashboard-pilotage-assistant__anomaly dashboard-pilotage-assistant__anomaly--${a.level === 'err' ? 'err' : 'warn'}`;
          li.textContent = a.message;
          anomList.append(li);
        });
      }
    }
  }

  /** @param {boolean} on */
  function setAiLoading(on) {
    if (iaLoading) iaLoading.hidden = !on;
  }

  /** @param {{ narrative?: string; actions?: object[] }|null} payload */
  function setAiResult(payload) {
    if (!iaText || !iaActions) return;
    const narrative = payload && typeof payload.narrative === 'string' ? payload.narrative.trim() : '';
    if (!narrative) {
      iaText.hidden = true;
      iaText.textContent = '';
      iaActions.hidden = true;
      iaActions.replaceChildren();
      return;
    }
    if (iaLoading) iaLoading.hidden = true;
    iaText.hidden = false;
    iaText.textContent = narrative;
    const acts = payload && Array.isArray(payload.actions) ? payload.actions : [];
    if (acts.length) {
      iaActions.hidden = false;
      iaActions.replaceChildren();
      acts.forEach((a) => {
        const li = document.createElement('li');
        li.className = 'dashboard-pilotage-assistant__ia-action';
        const strong = document.createElement('strong');
        strong.textContent = String(a?.title || '').slice(0, 240);
        const rest = String(a?.description || '').slice(0, 600);
        li.append(strong, document.createTextNode(rest ? `. ${rest}` : ''));
        iaActions.append(li);
      });
    } else {
      iaActions.hidden = true;
      iaActions.replaceChildren();
    }
  }

  return { root: wrap, update, setAiLoading, setAiResult };
}

/**
 * Classe CSS : uniquement lettres minuscules / chiffres / tirets (évite injection dans le nom de classe).
 * @param {unknown} key
 */
function sanitizeRecPriorityKey(key) {
  const s = String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '');
  return s || 'normal';
}
