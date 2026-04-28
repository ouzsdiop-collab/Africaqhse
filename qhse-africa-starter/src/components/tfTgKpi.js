/**
 * KPI Taux de Fréquence (TF) et Taux de Gravité (TG) : mining / pétrole.
 * Données : GET /api/incidents/kpi/tf-tg
 */

import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';

const STYLE_ID = 'qhse-tf-tg-kpi-styles';

const CSS = `
.qhse-tf-tg{font-size:14px}
.qhse-tf-tg--performance{margin-bottom:1rem;padding:18px 20px}
.qhse-tf-tg__head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:10px 16px;margin-bottom:14px}
.qhse-tf-tg__title{margin:0;font-size:1.05rem;font-weight:800;letter-spacing:-.02em;color:var(--color-text-primary,var(--text))}
.qhse-tf-tg__sub{margin:0;font-size:12px;color:var(--color-text-secondary,var(--text2));max-width:62ch;line-height:1.45}
.qhse-tf-tg__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:720px){.qhse-tf-tg__grid{grid-template-columns:1fr}}
.qhse-tf-tg-card{
  position:relative;
  padding:16px 16px 14px;
  border-radius:14px;
  border:1px solid var(--color-border-tertiary,rgba(148,163,184,.2));
  background:var(--color-background-secondary,var(--surface-2,#f8fafc));
  min-width:0;
}
.qhse-tf-tg-card__top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
.qhse-tf-tg-card__label{margin:0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-secondary,#475569)}
.qhse-tf-tg-card__help{
  width:22px;height:22px;padding:0;border:none;border-radius:999px;
  background:color-mix(in srgb,var(--color-text-tertiary) 12%,transparent);
  color:var(--color-text-secondary);
  font-size:12px;font-weight:800;cursor:help;line-height:1;
  flex-shrink:0;
}
.qhse-tf-tg-card__value-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.qhse-tf-tg-card__value{font-size:clamp(26px,4vw,34px);font-weight:800;letter-spacing:-.03em;line-height:1;color:var(--color-text-primary)}
.qhse-tf-tg-card__unit{font-size:13px;font-weight:600;color:var(--color-text-secondary)}
.qhse-tf-tg-card__trend{font-size:13px;font-weight:800;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:999px}
.qhse-tf-tg-card__trend--good,
.qhse-tf-tg-card__trend--better{background:rgba(34,197,94,.15);color:#15803d}
.qhse-tf-tg-card__trend--bad,
.qhse-tf-tg-card__trend--worse{background:rgba(239,68,68,.14);color:#b91c1c}
.qhse-tf-tg-card__trend--flat{background:rgba(148,163,184,.12);color:#475569}
.qhse-tf-tg-card__meta{margin:0;font-size:11px;line-height:1.4;color:var(--color-text-tertiary,#64748b)}
.qhse-tf-tg-gauge{height:8px;border-radius:999px;background:rgba(148,163,184,.2);overflow:hidden;margin-top:10px}
.qhse-tf-tg-gauge__fill{height:100%;border-radius:999px;transition:width .35s ease,background .2s ease}
.qhse-tf-tg-gauge__fill--green{background:linear-gradient(90deg,#22c55e,#16a34a)}
.qhse-tf-tg-gauge__fill--amber{background:linear-gradient(90deg,#fbbf24,#d97706)}
.qhse-tf-tg-gauge__fill--red{background:linear-gradient(90deg,#f87171,#dc2626)}
.qhse-tf-tg--mini .qhse-tf-tg__grid{gap:10px}
.qhse-tf-tg--mini .qhse-tf-tg-card{padding:12px 12px 10px}
.qhse-tf-tg--mini .qhse-tf-tg-card__value{font-size:22px}
.qhse-tf-tg--mini .qhse-tf-tg-card__label{font-size:10px}
.qhse-tf-tg--mini .qhse-tf-tg-gauge{margin-top:8px;height:6px}
.qhse-tf-tg--mini .qhse-tf-tg__head{margin-bottom:8px}
.qhse-tf-tg--mini .qhse-tf-tg__title{font-size:.95rem}
.qhse-tf-tg__err{margin:0;font-size:13px;color:var(--color-danger-text,#b91c1c)}
`;

function ensureTfTgKpiStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.append(el);
}

/** Plus bas = mieux (TF, TG). */
function toneForRate(value, target) {
  const v = Number(value);
  const t = Number(target);
  if (!Number.isFinite(v) || !Number.isFinite(t) || t <= 0) return 'green';
  if (v <= t) return 'green';
  if (v <= t * 1.15) return 'amber';
  return 'red';
}

/** Remplissage jauge : min(value/target, 1.5) pour visibilité */
function gaugeFillRatio(value, target) {
  const v = Number(value);
  const t = Number(target);
  if (!Number.isFinite(v) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.min(1.5, v / t);
}

function trendForLowerIsBetter(cur, prev) {
  if (prev == null || !Number.isFinite(Number(prev)) || !Number.isFinite(Number(cur))) {
    return { cls: 'qhse-tf-tg-card__trend--flat', sym: '→', label: 'N/A', good: null };
  }
  const d = Number(cur) - Number(prev);
  if (Math.abs(d) < 0.005) {
    return { cls: 'qhse-tf-tg-card__trend--flat', sym: '→', label: 'Stable', good: null };
  }
  const up = d > 0;
  return {
    cls: up ? 'qhse-tf-tg-card__trend--worse' : 'qhse-tf-tg-card__trend--better',
    sym: up ? '↑' : '↓',
    label: `${up ? '+' : ''}${d.toFixed(2)} vs période préc.`,
    good: !up
  };
}

function fixTrendClass(t) {
  if (t.good === true) return { ...t, cls: 'qhse-tf-tg-card__trend--better' };
  if (t.good === false) return { ...t, cls: 'qhse-tf-tg-card__trend--worse' };
  return t;
}

/**
 * @param {Record<string, unknown>} raw
 */
function normalizePayload(raw) {
  return {
    tf: Number(raw?.tf) || 0,
    tg: Number(raw?.tg) || 0,
    accidentsAvecArret: Number(raw?.accidentsAvecArret) || 0,
    joursPerdus: Number(raw?.joursPerdus) || 0,
    heuresTravaillees: Number(raw?.heuresTravaillees) || 0,
    periode: String(raw?.periode ?? 'Non disponible'),
    objectifTF: Number(raw?.objectifTF) || 2,
    objectifTG: Number(raw?.objectifTG) || 0.5,
    tfPrev: raw?.tfPrev != null ? Number(raw.tfPrev) : null,
    tgPrev: raw?.tgPrev != null ? Number(raw.tgPrev) : null,
    prevPeriode: String(raw?.prevPeriode ?? '')
  };
}

function buildTfTgUrl(year) {
  const p = new URLSearchParams();
  if (year != null && year !== '' && Number.isFinite(Number(year))) {
    p.set('year', String(Math.floor(Number(year))));
  }
  const qs = p.toString();
  const path = qs ? `/api/incidents/kpi/tf-tg?${qs}` : '/api/incidents/kpi/tf-tg';
  return withSiteQuery(path);
}

/**
 * Bloc performance (2 cartes + en-tête).
 * @param {{ getYear: () => string | number }} opts
 */
export function createPerformanceTfTgBlock(opts) {
  ensureTfTgKpiStyles();
  const { getYear } = opts;

  const root = document.createElement('section');
  root.className = 'qhse-tf-tg qhse-tf-tg--performance content-card card-soft';
  root.setAttribute('aria-label', 'Indicateurs TF et TG');

  root.innerHTML = `
    <div class="qhse-tf-tg__head">
      <div>
        <h2 class="qhse-tf-tg__title">Indicateurs TF / TG</h2>
        <p class="qhse-tf-tg__sub">Taux de Fréquence et de Gravité (accidents avec arrêt, heures travaillées). Référence minière &amp; pétrole / gaz.</p>
      </div>
    </div>
    <p class="qhse-tf-tg__err" hidden></p>
    <div class="qhse-tf-tg__grid">
      <article class="qhse-tf-tg-card" data-tf-card>
        <div class="qhse-tf-tg-card__top">
          <p class="qhse-tf-tg-card__label">Taux de fréquence (TF)</p>
          <button type="button" class="qhse-tf-tg-card__help" data-tip-tf aria-label="Aide TF">?</button>
        </div>
        <div class="qhse-tf-tg-card__value-row">
          <span class="qhse-tf-tg-card__value" data-val>Non disponible</span>
          <span class="qhse-tf-tg-card__unit">/ million h</span>
          <span class="qhse-tf-tg-card__trend" data-trend></span>
        </div>
        <p class="qhse-tf-tg-card__meta" data-meta></p>
        <div class="qhse-tf-tg-gauge" aria-hidden="true"><div class="qhse-tf-tg-gauge__fill" data-fill style="width:0%"></div></div>
      </article>
      <article class="qhse-tf-tg-card" data-tg-card>
        <div class="qhse-tf-tg-card__top">
          <p class="qhse-tf-tg-card__label">Taux de gravité (TG)</p>
          <button type="button" class="qhse-tf-tg-card__help" data-tip-tg aria-label="Aide TG">?</button>
        </div>
        <div class="qhse-tf-tg-card__value-row">
          <span class="qhse-tf-tg-card__value" data-val>Non disponible</span>
          <span class="qhse-tf-tg-card__unit">/ millier h</span>
          <span class="qhse-tf-tg-card__trend" data-trend></span>
        </div>
        <p class="qhse-tf-tg-card__meta" data-meta></p>
        <div class="qhse-tf-tg-gauge" aria-hidden="true"><div class="qhse-tf-tg-gauge__fill" data-fill style="width:0%"></div></div>
      </article>
    </div>
  `;

  const errEl = root.querySelector('.qhse-tf-tg__err');
  const tfCard = root.querySelector('[data-tf-card]');
  const tgCard = root.querySelector('[data-tg-card]');

  const TF_TIP =
    'TF = (nombre d’accidents avec arrêt × 1 000 000) ÷ heures travaillées sur la période. Plus bas = mieux.';
  const TG_TIP =
    'TG = (nombre de jours perdus × 1 000) ÷ heures travaillées. Les jours perdus sont dérivés du texte de description ou d’une valeur par défaut par accident.';

  root.querySelector('[data-tip-tf]')?.setAttribute('title', TF_TIP);
  root.querySelector('[data-tip-tg]')?.setAttribute('title', TG_TIP);

  function paintCard(card, payload, key, targetKey, prevKey) {
    if (!card) return;
    const val = payload[key];
    const target = payload[targetKey];
    const prev = payload[prevKey];
    const valEl = card.querySelector('[data-val]');
    const trendEl = card.querySelector('[data-trend]');
    const metaEl = card.querySelector('[data-meta]');
    const fill = card.querySelector('[data-fill]');
    if (valEl) valEl.textContent = Number.isFinite(val) ? val.toFixed(2) : 'Non disponible';

    const tone = toneForRate(val, target);
    const ratio = gaugeFillRatio(val, target);
    const pct = Math.min(100, (ratio / 1.5) * 100);
    if (fill) {
      fill.style.width = `${pct}%`;
      fill.className =
        'qhse-tf-tg-gauge__fill qhse-tf-tg-gauge__fill--' +
        (tone === 'green' ? 'green' : tone === 'amber' ? 'amber' : 'red');
    }

    const tr = fixTrendClass(trendForLowerIsBetter(val, prev));
    if (trendEl) {
      trendEl.className = 'qhse-tf-tg-card__trend ' + tr.cls;
      trendEl.textContent = `${tr.sym} ${tr.label}`;
    }
    if (metaEl) {
      metaEl.textContent = `Objectif < ${target} · ${payload.periode} · ${payload.heuresTravaillees.toLocaleString('fr-FR')} h`;
    }
  }

  async function refresh() {
    errEl.hidden = true;
    const year = getYear();
    try {
      const res = await qhseFetch(buildTfTgUrl(year));
      if (res.status === 403) {
        errEl.textContent = 'Permission « incidents » requise pour afficher TF/TG.';
        errEl.hidden = false;
        return;
      }
      if (!res.ok) {
        errEl.textContent = `Indicateurs TF/TG indisponibles (${res.status}).`;
        errEl.hidden = false;
        return;
      }
      const raw = await res.json();
      const p = normalizePayload(raw);
      paintCard(tfCard, p, 'tf', 'objectifTF', 'tfPrev');
      paintCard(tgCard, p, 'tg', 'objectifTG', 'tgPrev');
      const sub = root.querySelector('.qhse-tf-tg__sub');
      if (sub) {
        sub.textContent = `${p.periode} · ${p.accidentsAvecArret} accident(s) avec arrêt · ${p.joursPerdus} j. perdus (déclaratif) · ${p.heuresTravaillees.toLocaleString('fr-FR')} h travaillées (réf.). Comparaison : ${p.prevPeriode}.`;
      }
    } catch {
      errEl.textContent = 'Réseau ou serveur injoignable pour TF/TG.';
      errEl.hidden = false;
    }
  }

  return { root, refresh };
}

/**
 * Deux mini-cartes pour le dashboard.
 */
export function createDashboardTfTgMiniRow() {
  ensureTfTgKpiStyles();
  const wrap = document.createElement('div');
  wrap.className = 'qhse-tf-tg qhse-tf-tg--mini';
  wrap.setAttribute('aria-label', 'TF et TG');
  wrap.innerHTML = `
    <div class="qhse-tf-tg__head" style="margin-bottom:8px">
      <h3 class="qhse-tf-tg__title" style="font-size:.9rem">TF / TG (année en cours)</h3>
    </div>
    <div class="qhse-tf-tg__grid">
      <article class="qhse-tf-tg-card" data-mini-tf>
        <p class="qhse-tf-tg-card__label">TF</p>
        <div class="qhse-tf-tg-card__value-row" style="margin-bottom:4px">
          <span class="qhse-tf-tg-card__value" data-val>Non disponible</span>
          <span class="qhse-tf-tg-card__trend" data-trend style="font-size:11px;padding:2px 6px"></span>
        </div>
        <div class="qhse-tf-tg-gauge"><div class="qhse-tf-tg-gauge__fill" data-fill style="width:0%"></div></div>
      </article>
      <article class="qhse-tf-tg-card" data-mini-tg>
        <p class="qhse-tf-tg-card__label">TG</p>
        <div class="qhse-tf-tg-card__value-row" style="margin-bottom:4px">
          <span class="qhse-tf-tg-card__value" data-val>Non disponible</span>
          <span class="qhse-tf-tg-card__trend" data-trend style="font-size:11px;padding:2px 6px"></span>
        </div>
        <div class="qhse-tf-tg-gauge"><div class="qhse-tf-tg-gauge__fill" data-fill style="width:0%"></div></div>
      </article>
    </div>
  `;

  function updateFromPayload(raw) {
    const p = normalizePayload(raw);
    const tf = wrap.querySelector('[data-mini-tf]');
    const tg = wrap.querySelector('[data-mini-tg]');
    [tf, tg].forEach((card, i) => {
      if (!card) return;
      const key = i === 0 ? 'tf' : 'tg';
      const tKey = i === 0 ? 'objectifTF' : 'objectifTG';
      const pKey = i === 0 ? 'tfPrev' : 'tgPrev';
      const val = p[key];
      const target = p[tKey];
      const prev = p[pKey];
      const valEl = card.querySelector('[data-val]');
      const trendEl = card.querySelector('[data-trend]');
      const fill = card.querySelector('[data-fill]');
      if (valEl) valEl.textContent = Number.isFinite(val) ? val.toFixed(2) : 'Non disponible';
      const tone = toneForRate(val, target);
      const ratio = gaugeFillRatio(val, target);
      const pct = Math.min(100, (ratio / 1.5) * 100);
      if (fill) {
        fill.style.width = `${pct}%`;
        fill.className =
          'qhse-tf-tg-gauge__fill qhse-tf-tg-gauge__fill--' +
          (tone === 'green' ? 'green' : tone === 'amber' ? 'amber' : 'red');
      }
      const tr = fixTrendClass(trendForLowerIsBetter(val, prev));
      if (trendEl) {
        trendEl.className = 'qhse-tf-tg-card__trend ' + tr.cls;
        trendEl.textContent = tr.sym;
        trendEl.title = tr.label;
      }
    });
  }

  async function refresh() {
    try {
      const res = await qhseFetch(buildTfTgUrl(new Date().getFullYear()));
      if (!res.ok) return;
      const raw = await res.json();
      updateFromPayload(raw);
    } catch {
      /* silencieux sur dashboard */
    }
  }

  return { root: wrap, refresh, updateFromPayload };
}
