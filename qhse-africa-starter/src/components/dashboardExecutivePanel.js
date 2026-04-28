/**
 * Vue direction : message naturel + score QHSE global (lecture uniquement).
 */

import {
  buildExecutiveBriefNarrative,
  computeQhseGlobalScore,
  qhseScorePresentation
} from '../utils/dashboardDecisionLayer.js';

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

/**
 * @param {number} score 0–100
 * @param {'ok'|'watch'|'risk'} tone
 */
function buildScoreSvg(score, tone) {
  const w = 140;
  const h = 88;
  const r = 52;
  const cx = w / 2;
  const cy = h - 8;
  const stroke =
    tone === 'ok'
      ? 'rgba(52,211,153,.95)'
      : tone === 'watch'
        ? 'rgba(251,191,36,.95)'
        : 'rgba(248,113,113,.95)';
  const track = 'rgba(148,163,184,.2)';
  const circumference = Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'dashboard-exec-score__svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-hidden', 'true');

  const arcBg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arcBg.setAttribute(
    'd',
    `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  );
  arcBg.setAttribute('fill', 'none');
  arcBg.setAttribute('stroke', track);
  arcBg.setAttribute('stroke-width', '10');
  arcBg.setAttribute('stroke-linecap', 'round');

  const arcFg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arcFg.setAttribute(
    'd',
    `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  );
  arcFg.setAttribute('fill', 'none');
  arcFg.setAttribute('stroke', stroke);
  arcFg.setAttribute('stroke-width', '10');
  arcFg.setAttribute('stroke-linecap', 'round');
  arcFg.setAttribute('stroke-dasharray', `${dash} ${circumference}`);
  arcFg.setAttribute('class', 'dashboard-exec-score__arc');

  svg.append(arcBg, arcFg);
  return svg;
}

export function createDashboardExecutivePanel(defaultSiteLabel = '') {
  const root = document.createElement('article');
  root.className = 'content-card card-soft dashboard-executive-panel';
  root.setAttribute('aria-labelledby', 'dashboard-exec-title');

  root.innerHTML = `
    <div class="dashboard-executive-panel__grid">
      <div class="dashboard-executive-panel__copy">
        <span class="section-kicker dashboard-executive-panel__kicker">Vue direction</span>
        <h2 id="dashboard-exec-title" class="dashboard-executive-panel__title">Synthèse pour décider</h2>
        <p class="dashboard-executive-panel__brief" data-exec-brief></p>
      </div>
      <div class="dashboard-exec-score" data-exec-score-wrap>
        <div class="dashboard-exec-score__ring" data-exec-ring></div>
        <div class="dashboard-exec-score__value" data-exec-val>Non disponible</div>
        <div class="dashboard-exec-score__label" data-exec-lbl>Indice QHSE</div>
        <p class="dashboard-exec-score__hint" data-exec-hint></p>
        <p class="dashboard-exec-score__micro" data-exec-micro>Basé sur incidents critiques, retards d’actions, NC ouvertes et notes d’audit visibles.</p>
      </div>
    </div>
  `;

  const briefEl = root.querySelector('[data-exec-brief]');
  const ringHost = root.querySelector('[data-exec-ring]');
  const valEl = root.querySelector('[data-exec-val]');
  const lblEl = root.querySelector('[data-exec-lbl]');
  const hintEl = root.querySelector('[data-exec-hint]');
  const wrap = root.querySelector('[data-exec-score-wrap]');

  /**
   * @param {{
   *   stats?: object;
   *   ncs?: unknown[];
   *   audits?: unknown[];
   *   siteLabel?: string;
   * }} payload
   */
  function update(payload) {
    const stats = payload?.stats || {};
    const ncs = Array.isArray(payload?.ncs) ? payload.ncs : [];
    const audits = Array.isArray(payload?.audits) ? payload.audits : [];
    const ncOpenCount = ncs.filter(isNcOpen).length;
    const scores = audits.map((a) => Number(a.score)).filter((n) => Number.isFinite(n));
    const hasAuditScores = scores.length > 0;
    const avgAuditScore = hasAuditScores
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    const siteLabel =
      payload?.siteLabel != null && String(payload.siteLabel).trim()
        ? String(payload.siteLabel).trim()
        : defaultSiteLabel;

    const narrative = buildExecutiveBriefNarrative({
      stats,
      ncOpenCount,
      avgAuditScore,
      hasAuditScores,
      siteLabel
    });
    briefEl.textContent = narrative;

    const score = computeQhseGlobalScore({
      stats,
      ncOpenCount,
      avgAuditScore,
      hasAuditScores
    });
    const meta = qhseScorePresentation(score);

    valEl.textContent = String(score);
    lblEl.textContent = meta.label;
    hintEl.textContent = meta.hint;

    wrap.classList.remove(
      'dashboard-exec-score--ok',
      'dashboard-exec-score--watch',
      'dashboard-exec-score--risk'
    );
    wrap.classList.add(`dashboard-exec-score--${meta.tone}`);

    ringHost.replaceChildren();
    ringHost.append(buildScoreSvg(score, meta.tone));
  }

  return { root, update };
}
