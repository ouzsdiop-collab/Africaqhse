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
          <p class="dashboard-pilotage-assistant__subhead">Vue consolidée des signaux prioritaires.</p>
          <div class="dashboard-pilotage-assistant__syn-score">
            <div>
              <p class="dashboard-pilotage-assistant__micro-label">Score pilotage assisté</p>
              <p class="dashboard-pilotage-assistant__syn-score-value">—</p>
            </div>
            <div class="dashboard-pilotage-assistant__syn-progress" role="presentation">
              <span class="dashboard-pilotage-assistant__syn-progress-fill"></span>
            </div>
          </div>
          <div class="dashboard-pilotage-assistant__syn-tensions" aria-label="Points sous tension"></div>
          <div class="dashboard-pilotage-assistant__syn-note">
            <p class="dashboard-pilotage-assistant__micro-label">À retenir</p>
            <p class="dashboard-pilotage-assistant__synthesis-text">Chargement…</p>
          </div>
        </section>
        <section class="dashboard-pilotage-assistant__panel dashboard-pilotage-assistant__ia" aria-label="Lecture assistée du pilotage">
          <h4 class="dashboard-pilotage-assistant__h">Lecture assistée</h4>
          <p class="dashboard-pilotage-assistant__subhead">Synthèse automatique des signaux QHSE.</p>
          <div class="dashboard-pilotage-assistant__ia-badge" hidden></div>
          <p class="dashboard-pilotage-assistant__ia-loading" hidden>Synthèse en cours…</p>
          <div class="dashboard-pilotage-assistant__ia-rows" hidden></div>
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
  const synScore = wrap.querySelector('.dashboard-pilotage-assistant__syn-score-value');
  const synProgressFill = wrap.querySelector('.dashboard-pilotage-assistant__syn-progress-fill');
  const synTensions = wrap.querySelector('.dashboard-pilotage-assistant__syn-tensions');
  const iaLoading = wrap.querySelector('.dashboard-pilotage-assistant__ia-loading');
  const iaBadge = wrap.querySelector('.dashboard-pilotage-assistant__ia-badge');
  const iaRows = wrap.querySelector('.dashboard-pilotage-assistant__ia-rows');
  const iaText = wrap.querySelector('.dashboard-pilotage-assistant__ia-text');
  const iaActions = wrap.querySelector('.dashboard-pilotage-assistant__ia-actions');
  const recList = wrap.querySelector('.dashboard-pilotage-assistant__rec-list');
  const anomBlock = wrap.querySelector('.dashboard-pilotage-assistant__anomalies');
  const anomList = wrap.querySelector('.dashboard-pilotage-assistant__anomaly-list');

  /** @param {object} snap */
  function update(snap) {
    if (!snap) return;
    if (scoreVal) scoreVal.textContent = `${snap.enrichedScore} %`;
    if (synScore) synScore.textContent = `${snap.enrichedScore} %`;
    if (synProgressFill) synProgressFill.style.width = `${Math.max(0, Math.min(100, Number(snap.enrichedScore) || 0))}%`;
    if (synText) synText.textContent = extractSynthesisTakeaway(snap.synthesis) || 'Non renseigné';
    if (synTensions) renderSynthesisTensions(synTensions, snap);

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
    if (!iaText || !iaActions || !iaRows) return;
    const narrative = payload && typeof payload.narrative === 'string' ? payload.narrative.trim() : '';
    if (!narrative) {
      if (iaBadge) iaBadge.hidden = true;
      iaRows.hidden = true;
      iaRows.replaceChildren();
      iaText.hidden = true;
      iaText.textContent = '';
      iaActions.hidden = true;
      iaActions.replaceChildren();
      return;
    }
    if (iaLoading) iaLoading.hidden = true;
    if (iaBadge) {
      const unavailable = /indisponible|fallback|locale?/i.test(narrative);
      iaBadge.hidden = !unavailable;
      iaBadge.textContent = unavailable ? 'IA locale / fournisseur indisponible' : '';
    }
    renderIaNarrativeRows(iaRows, narrative);
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

function renderSynthesisTensions(host, snap) {
  host.replaceChildren();
  const meta = snap && typeof snap.meta === 'object' ? snap.meta : {};
  const items = [
    { label: 'Retards', value: meta?.overdue },
    { label: 'Documents expirés', value: meta?.expiredDocs },
    { label: 'Incidents critiques', value: meta?.criticalIncidents },
    { label: 'Risques critiques', value: meta?.criticalRisksCount },
    { label: 'Fiches risque sans action liée', value: extractCountFromText(snap?.synthesis, /(\d+)\s+fiche\(s\)\s+risque\s+sans\s+action/i) },
    { label: 'Échéances audit', value: meta?.auditsSoon }
  ];
  items.forEach((item) => {
    const chip = document.createElement('div');
    chip.className = 'dashboard-pilotage-assistant__tension-chip';
    const value = Number.isFinite(Number(item.value)) ? Number(item.value) : null;
    chip.innerHTML = `<span>${escapeHtml(item.label)}</span><strong>${value === null ? 'À compléter' : String(value)}</strong>`;
    host.append(chip);
  });
}

function extractSynthesisTakeaway(text) {
  const normalized = String(text || '').trim();
  if (!normalized) return '';
  const sentence = normalized
    .split('.')
    .map((p) => p.trim())
    .find((p) => /renforcer|ma[îi]tris|surveiller|[ée]ch[ée]ance/i.test(p));
  return sentence || normalized;
}

function renderIaNarrativeRows(host, narrative) {
  host.hidden = false;
  host.replaceChildren();
  const rows = [
    { label: 'Pilotage', detail: 'Maintenir le suivi sur les indicateurs transmis.' },
    { label: 'Actions', detail: `${extractCountFromText(narrative, /(\d+)\s+action\(s\)\s+en\s+retard/i, 'Non renseigné')} en retard, prioriser arbitrage / réaffectation / jalons.` },
    { label: 'Incidents', detail: `${extractCountFromText(narrative, /(\d+)\s+incident\(s\)\s+critique/i, 'Non renseigné')} critiques, sécuriser réponse terrain et traçabilité.` },
    { label: 'Risques', detail: `${extractCountFromText(narrative, /(\d+)\s+risque\(s\)\s+critique/i, 'Non renseigné')} critiques, consolider registre et mesures.` },
    { label: 'Non-conformités', detail: `${extractCountFromText(narrative, /(\d+)\s+non-conformit[ée]\(s\)\s+ouverte/i, 'Non renseigné')} ouvertes, prioriser le plan d’actions associé.` },
    { label: 'Tendance', detail: 'Séries temporelles agrégées, intégrer la tendance incidents / audits / NC.' }
  ];
  rows.forEach((row) => {
    const el = document.createElement('div');
    el.className = 'dashboard-pilotage-assistant__ia-row';
    el.innerHTML = `<span class="dashboard-pilotage-assistant__ia-row-label">${escapeHtml(row.label)}</span><p>${escapeHtml(row.detail)}</p>`;
    host.append(el);
  });
}

function extractCountFromText(text, re, fallback = 'À compléter') {
  const m = String(text || '').match(re);
  return m && m[1] ? m[1] : fallback;
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
