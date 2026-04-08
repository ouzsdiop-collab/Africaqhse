import { escapeHtml } from '../utils/escapeHtml.js';

/** Jauge score audit — pourcentage via variable CSS --gauge-pct. */
export function createAuditScoreGauge(score, { label = 'Score global' } = {}) {
  const raw = Number(score);
  const pct = Number.isFinite(raw)
    ? Math.max(0, Math.min(100, raw))
    : 0;
  const hue = pct >= 75 ? 145 : pct >= 55 ? 45 : 0;
  const color = `hsl(${hue} 75% 48%)`;

  const wrap = document.createElement('div');
  wrap.className = 'audit-score-panel';

  const cap = document.createElement('p');
  cap.style.margin = '0 0 4px';
  cap.style.fontSize = '11px';
  cap.style.fontWeight = '800';
  cap.style.letterSpacing = '0.1em';
  cap.style.textTransform = 'uppercase';
  cap.style.color = 'var(--text3)';
  cap.textContent = label;

  const gWrap = document.createElement('div');
  gWrap.className = 'audit-score-gauge-wrap';

  const ring = document.createElement('div');
  ring.className = 'audit-score-gauge';
  ring.style.background = `radial-gradient(circle at center, rgba(8,16,28,.98) 52%, transparent 53%), conic-gradient(from -90deg, ${color} 0 ${pct}%, rgba(255,255,255,.12) 0)`;

  const inner = document.createElement('div');
  inner.className = 'audit-score-gauge-inner';
  inner.innerHTML = `<div><strong>${escapeHtml(String(pct))}</strong><small>/ 100</small></div>`;

  gWrap.append(ring, inner);

  const note = document.createElement('p');
  note.style.margin = '0';
  note.style.fontSize = '13px';
  note.style.color = 'var(--text2)';
  note.style.lineHeight = '1.45';
  note.textContent =
    pct >= 80
      ? 'Seuil direction : objectif de maintien.'
      : 'Sous le seuil cible — plan d’actions à suivre.';

  wrap.append(cap, gWrap, note);
  return wrap;
}
