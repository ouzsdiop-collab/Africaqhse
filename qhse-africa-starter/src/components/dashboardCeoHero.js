/**
 * Bloc principal « Direction / CEO » : score, statut global, message — visuellement dominant.
 */

import {
  ceoGlobalStatusLabel,
  computeQhseGlobalScore,
  qhseScorePresentation
} from '../utils/dashboardDecisionLayer.js';

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

function buildCeoScoreArc(score, tone) {
  const w = 200;
  const h = 112;
  const r = 78;
  const cx = w / 2;
  const cy = h - 12;
  const stroke =
    tone === 'ok'
      ? 'rgba(52,211,153,.95)'
      : tone === 'watch'
        ? 'rgba(251,191,36,.95)'
        : 'rgba(248,113,113,.95)';
  const track = 'rgba(148,163,184,.18)';
  const circumference = Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'dashboard-ceo-hero__svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-hidden', 'true');

  const arcBg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arcBg.setAttribute('d', `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`);
  arcBg.setAttribute('fill', 'none');
  arcBg.setAttribute('stroke', track);
  arcBg.setAttribute('stroke-width', '12');
  arcBg.setAttribute('stroke-linecap', 'round');

  const arcFg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arcFg.setAttribute('d', `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`);
  arcFg.setAttribute('fill', 'none');
  arcFg.setAttribute('stroke', stroke);
  arcFg.setAttribute('stroke-width', '12');
  arcFg.setAttribute('stroke-linecap', 'round');
  arcFg.setAttribute('stroke-dasharray', `${dash} ${circumference}`);

  svg.append(arcBg, arcFg);
  return svg;
}

/**
 * @param {string} siteName
 * @param {{ onExport?: () => void }} opts
 */
export function createDashboardCeoHero(siteName, opts = {}) {
  const onExport = typeof opts.onExport === 'function' ? opts.onExport : () => {};

  const root = document.createElement('article');
  root.className = 'dashboard-ceo-hero';
  root.setAttribute('aria-labelledby', 'dashboard-ceo-title');
  root.style.boxSizing = 'border-box';

  root.innerHTML = `
    <div class="dashboard-ceo-hero__topbar">
      <span class="dashboard-ceo-hero__site" data-ceo-site></span>
      <button type="button" class="btn btn-primary dashboard-ceo-hero__export dashboard-hero__cta--featured dashboard-export-btn">
        Exporter le reporting
      </button>
    </div>
    <div class="dashboard-ceo-hero__body">
      <div class="dashboard-ceo-hero__visual" data-ceo-visual>
        <span class="dashboard-ceo-hero__status" data-ceo-status-badge>—</span>
        <div class="dashboard-ceo-hero__ring-wrap" data-ceo-ring></div>
        <div class="dashboard-ceo-hero__scorenum" data-ceo-score>—</div>
        <p class="dashboard-ceo-hero__scorecaption" data-ceo-caption>Indice QHSE synthétique</p>
        <p class="dashboard-ceo-hero__scorehint" data-ceo-hint></p>
      </div>
      <div class="dashboard-ceo-hero__text">
        <p class="dashboard-ceo-hero__eyebrow"></p>
        <h1 id="dashboard-ceo-title" class="dashboard-ceo-hero__title">Cockpit QHSE</h1>
        <p class="dashboard-ceo-hero__brief" data-ceo-brief></p>
        <details class="dashboard-ceo-hero__legal-wrap">
          <summary class="dashboard-ceo-hero__legal-summary">À propos de l’indice</summary>
          <p class="dashboard-ceo-hero__legal" data-ceo-legal></p>
        </details>
      </div>
    </div>
  `;

  const siteEl = root.querySelector('[data-ceo-site]');
  const badgeEl = root.querySelector('[data-ceo-status-badge]');
  const ringHost = root.querySelector('[data-ceo-ring]');
  const scoreEl = root.querySelector('[data-ceo-score]');
  const captionEl = root.querySelector('[data-ceo-caption]');
  const hintEl = root.querySelector('[data-ceo-hint]');
  const briefEl = root.querySelector('[data-ceo-brief]');
  const visual = root.querySelector('[data-ceo-visual]');

  scoreEl.style.fontSize = 'clamp(64px, 7vw, 88px)';
  scoreEl.style.fontWeight = '900';
  scoreEl.style.letterSpacing = '-0.04em';
  scoreEl.style.lineHeight = '1';

  siteEl.textContent = `Périmètre · ${siteName || 'Tous sites'}`;

  root.querySelector('.dashboard-ceo-hero__export')?.addEventListener('click', () => onExport());

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
        : siteName || '';

    siteEl.textContent = `Périmètre · ${siteLabel || 'Tous sites'}`;

    const criticalCount = Array.isArray(stats.criticalIncidents)
      ? stats.criticalIncidents.length
      : 0;
    const overdueCount = Math.max(0, Number(stats.overdueActions) || 0);
    const parts = [];
    if (criticalCount > 0) parts.push(`${criticalCount} critique(s) ouverte(s)`);
    if (overdueCount > 0) parts.push(`${overdueCount} action(s) en retard`);
    if (ncOpenCount > 0) parts.push(`${ncOpenCount} NC ouverte(s)`);
    const summaryLine = parts.length ? parts.join(' · ') : 'Aucune alerte — situation maîtrisée';
    briefEl.textContent = summaryLine;

    const score = computeQhseGlobalScore({
      stats,
      ncOpenCount,
      avgAuditScore,
      hasAuditScores
    });
    const meta = qhseScorePresentation(score);
    const statusShort = ceoGlobalStatusLabel(meta.tone);

    scoreEl.textContent = String(score);
    captionEl.textContent = meta.label;
    hintEl.textContent = meta.hint;
    badgeEl.textContent = statusShort;
    badgeEl.className = `dashboard-ceo-hero__status dashboard-ceo-hero__status--${meta.tone}`;

    visual.classList.remove(
      'dashboard-ceo-hero__visual--ok',
      'dashboard-ceo-hero__visual--watch',
      'dashboard-ceo-hero__visual--risk'
    );
    visual.classList.add(`dashboard-ceo-hero__visual--${meta.tone}`);

    ringHost.replaceChildren();
    ringHost.append(buildCeoScoreArc(score, meta.tone));
  }

  return { root, update };
}
