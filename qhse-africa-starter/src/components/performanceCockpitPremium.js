/**
 * Blocs « cockpit décisionnel » page Performance QHSE — données injectées, pas d’API ici.
 */

import { escapeHtml } from '../utils/escapeHtml.js';

function sanitizeClassToken(value, fallback = 'neutral') {
  const token = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '');
  return token || fallback;
}

/**
 * @param {number} conformity 0–100
 * @param {object} counts
 * @param {object} kpis
 * @param {{ conformity: number }} [goals]
 */
export function computeGlobalQhseCockpitLevel(conformity, counts, kpis, goals) {
  const g = goals || { conformity: 85 };
  const crit = Number(counts?.incidentsCriticalOpen) || 0;
  const od = Number(counts?.actionsOverdue) || 0;
  const nc = Number(counts?.nonConformitiesOpen) || 0;
  const avg = kpis?.auditScoreAvg;

  /** @type {'critique'|'fragile'|'stable'|'performant'} */
  let level = 'stable';
  if (conformity < 52 || crit > 2 || od > 14) {
    level = 'critique';
  } else if (conformity < g.conformity || crit > 0 || od > 4 || nc > 7) {
    level = 'fragile';
  } else if (
    conformity >= g.conformity &&
    crit === 0 &&
    od === 0 &&
    (avg == null || Number(avg) >= 78)
  ) {
    level = 'performant';
  } else {
    level = 'stable';
  }

  const labels = {
    critique: 'Critique',
    fragile: 'Fragile',
    stable: 'Stable',
    performant: 'Performant'
  };

  const hints = {
    critique:
      'Les signaux sécurité / exécution nécessitent des arbitrages rapides et une mobilisation ciblée.',
    fragile:
      'Des écarts persistent sur la conformité ou le terrain — prioriser les files critiques et retards.',
    stable:
      'Situation tenable : consolider les plans d’actions et surveiller les indicateurs sensibles.',
    performant:
      'Bon alignement sur les repères — capitaliser sur les pratiques et documenter les preuves.'
  };

  /** Phrase unique lisible sous le score (décision rapide). */
  const interpretation = {
    critique: 'Urgence : arbitrer sécurité et retards sans délai',
    fragile: 'Prioriser incidents critiques, retards et NC ouvertes',
    stable: 'Situation maîtrisée — maintenir la veille',
    performant: 'Objectifs tenus — consolider les pratiques'
  };

  const riskLabel = {
    critique: 'Risque élevé',
    fragile: 'Risque modéré',
    stable: 'Risque maîtrisé',
    performant: 'Risque faible'
  };

  return {
    score: Math.round(Math.max(0, Math.min(100, conformity))),
    level,
    levelLabel: labels[level],
    hint: hints[level],
    interpretation: interpretation[level],
    riskLabel: riskLabel[level]
  };
}

/**
 * @param {object} counts
 * @param {object} kpis
 * @param {number} conformity
 * @param {number} goalConf
 * @param {number} [goalAudit=80]
 */
export function buildCockpitRecommendations(counts, kpis, conformity, goalConf, goalAudit = 80) {
  /** @type {{ text: string; tone: 'red'|'amber'|'green'; icon: string; kpiKey?: string; preset?: Record<string, string> | null }[]} */
  const out = [];
  const od = Number(counts?.actionsOverdue) || 0;
  const crit = Number(counts?.incidentsCriticalOpen) || 0;
  const nc = Number(counts?.nonConformitiesOpen) || 0;
  const avg = kpis?.auditScoreAvg;

  if (crit > 0) {
    out.push({
      text: 'Clôturer les incidents critiques',
      tone: 'red',
      icon: '⚠',
      kpiKey: 'incidentsCritical',
      preset: { severity: 'critique' }
    });
  }
  if (od > 0) {
    out.push({
      text: 'Relancer les actions en retard',
      tone: od > 5 ? 'red' : 'amber',
      icon: '⏱',
      kpiKey: 'actionsLate',
      preset: null
    });
  }
  if (nc >= 3) {
    out.push({
      text: 'Traiter les non-conformités ouvertes',
      tone: 'amber',
      icon: '◇',
      kpiKey: 'ncOpen',
      preset: null
    });
  }
  if (conformity < goalConf && out.length < 3) {
    out.push({
      text: `Renforcer la conformité (cible ${goalConf} %)`,
      tone: conformity < goalConf - 12 ? 'red' : 'amber',
      icon: '◎',
      kpiKey: 'conformity',
      preset: null
    });
  }
  if (avg != null && !Number.isNaN(avg) && avg < goalAudit && out.length < 3) {
    out.push({
      text: `Vérifier les audits (${Math.round(avg)} % vs ${goalAudit} %)`,
      tone: 'amber',
      icon: '☑',
      kpiKey: 'auditScore',
      preset: null
    });
  }

  if (out.length === 0) {
    out.push({
      text: 'Poursuivre les revues et le suivi des indicateurs',
      tone: 'green',
      icon: '✓',
      kpiKey: 'conformity',
      preset: null
    });
  }

  return out.slice(0, 3);
}

/**
 * Priorité unique affichée en tête de cockpit (copilot).
 * @param {object} counts
 * @param {object} kpis
 * @param {number} conformity
 * @param {number} goalConf
 * @param {number} [goalAudit=80]
 */
export function computeAbsolutePriority(counts, kpis, conformity, goalConf, goalAudit = 80) {
  const crit = Number(counts?.incidentsCriticalOpen) || 0;
  const od = Number(counts?.actionsOverdue) || 0;
  const nc = Number(counts?.nonConformitiesOpen) || 0;
  const avg = kpis?.auditScoreAvg;

  if (crit > 0) {
    return {
      tone: /** @type {'red'|'amber'|'green'} */ ('red'),
      message:
        crit === 1
          ? 'Un incident critique ouvert exige une décision immédiate'
          : `${crit} incidents critiques bloquent la performance`,
      ctaLabel: 'Voir les incidents',
      kpiKey: 'incidentsCritical',
      preset: { severity: 'critique' }
    };
  }
  if (od > 0) {
    return {
      tone: od > 8 ? 'red' : 'amber',
      message:
        od === 1
          ? 'Une action en retard bloque la performance'
          : `${od} actions en retard bloquent la performance`,
      ctaLabel: 'Voir les actions',
      kpiKey: 'actionsLate',
      preset: null
    };
  }
  if (nc >= 4) {
    return {
      tone: 'amber',
      message: `${nc} non-conformités ouvertes augmentent l’exposition au risque`,
      ctaLabel: 'Voir les NC',
      kpiKey: 'ncOpen',
      preset: null
    };
  }
  if (conformity < goalConf) {
    return {
      tone: conformity < goalConf - 10 ? 'amber' : 'amber',
      message: `La conformité est sous l’objectif (${goalConf} %) — pilotage à renforcer`,
      ctaLabel: 'Voir le détail',
      kpiKey: 'conformity',
      preset: null
    };
  }
  if (avg != null && !Number.isNaN(avg) && avg < goalAudit) {
    return {
      tone: 'amber',
      message: `Le score audit (${Math.round(avg)} %) est sous la cible (${goalAudit} %)`,
      ctaLabel: 'Voir les audits',
      kpiKey: 'auditScore',
      preset: null
    };
  }
  return {
    tone: 'green',
    message: 'Aucune urgence majeure — poursuivre la veille et les revues',
    ctaLabel: 'Voir la synthèse',
    kpiKey: 'conformity',
    preset: null
  };
}

/**
 * @param {unknown[]} incidents
 * @param {unknown[]} actions
 * @param {unknown[]} audits
 * @param {unknown[]} ncs
 * @param {number} [limit=10]
 */
export function buildActivityTimelineEntries(incidents, actions, audits, ncs, limit = 10) {
  /** @type {{ t: number; kind: string; title: string; sub: string; tone: string; kpiKey: string; preset: Record<string, string> | null }[]} */
  const rows = [];

  /**
   * @param {number} t
   * @param {string} kind
   * @param {string} title
   * @param {string} sub
   * @param {string} tone
   * @param {string} kpiKey
   * @param {Record<string, string> | null} [preset]
   */
  function pushRow(t, kind, title, sub, tone, kpiKey, preset = null) {
    const tit = String(title || '').trim();
    if (!tit) return;
    rows.push({
      t: t || 0,
      kind,
      title: tit,
      sub: String(sub || '').trim(),
      tone,
      kpiKey,
      preset
    });
  }

  (incidents || []).forEach((r) => {
    const ref = String(r?.ref || '').trim();
    const typ = String(r?.type || 'Incident').trim();
    const ms = parseRowMs(r);
    const sev = String(r?.severity || '').toLowerCase();
    const isCrit = sev.includes('critique');
    pushRow(
      ms,
      'incident',
      ref || typ,
      typ,
      'amber',
      isCrit ? 'incidentsCritical' : 'incidents',
      isCrit ? { severity: 'critique' } : null
    );
  });

  (actions || []).forEach((r) => {
    const title = String(r?.title || 'Action').trim();
    const owner = String(r?.owner || '').trim();
    pushRow(parseRowMs(r), 'action', title, owner || 'Action', 'blue', 'actions', null);
  });

  (audits || []).forEach((r) => {
    const ref = String(r?.ref || 'Audit').trim();
    const st = String(r?.status || '').trim();
    pushRow(parseRowMs(r), 'audit', ref, st || 'Audit', 'teal', 'auditScore', null);
  });

  (ncs || []).forEach((r) => {
    const title = String(r?.title || 'NC').trim();
    const st = String(r?.status || '').trim();
    pushRow(parseRowMs(r), 'nc', title, st || 'Non-conformité', 'purple', 'ncOpen', null);
  });

  rows.sort((a, b) => b.t - a.t);
  return rows.slice(0, limit);
}

function parseRowMs(row) {
  const raw = row?.createdAt || row?.updatedAt || row?.dueDate;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * @param {{
 *   openKpi: (k: string, p?: Record<string, string> | null) => void;
 *   navigateHash: (id: string) => void;
 * }} hooks
 */
/**
 * CTA principaux — déclarer, traiter urgences, voir actions.
 * @param {{
 *   navigateHash: (id: string) => void;
 *   openKpi: (k: string, p?: Record<string, string> | null) => void;
 *   critOpen: number;
 *   actOd: number;
 *   ncOpen: number;
 * }} hooks
 */
export function createPrimaryCtaBar(hooks) {
  const wrap = document.createElement('div');
  wrap.className = 'kpi-perf-primary-cta';
  wrap.setAttribute('aria-label', 'Actions principales cockpit');

  const bInc = document.createElement('button');
  bInc.type = 'button';
  bInc.className = 'kpi-perf-primary-cta-btn kpi-perf-primary-cta-btn--incident';
  bInc.textContent = 'Déclarer un incident';
  bInc.addEventListener('click', () => hooks.navigateHash('incidents'));

  const bUrg = document.createElement('button');
  bUrg.type = 'button';
  bUrg.className = 'kpi-perf-primary-cta-btn kpi-perf-primary-cta-btn--urgent';
  bUrg.textContent = 'Traiter les urgences';
  bUrg.addEventListener('click', () => {
    if (hooks.critOpen > 0) {
      hooks.openKpi('incidentsCritical', { severity: 'critique' });
    } else if (hooks.actOd > 0) {
      hooks.openKpi('actionsLate');
    } else if (hooks.ncOpen > 0) {
      hooks.openKpi('ncOpen');
    } else {
      hooks.openKpi('conformity');
    }
  });

  const bAct = document.createElement('button');
  bAct.type = 'button';
  bAct.className = 'kpi-perf-primary-cta-btn kpi-perf-primary-cta-btn--plan';
  bAct.textContent = 'Voir les actions';
  bAct.addEventListener('click', () => hooks.navigateHash('actions'));

  wrap.append(bInc, bUrg, bAct);
  return wrap;
}

/**
 * @param {ReturnType<typeof computeAbsolutePriority>} priority
 * @param {(k: string, p?: Record<string, string> | null) => void} openKpi
 */
export function createAbsolutePrioritySection(priority, openKpi) {
  const sec = document.createElement('section');
  const priorityTone = sanitizeClassToken(priority.tone, 'blue');
  sec.className = `kpi-perf-priority-absolute kpi-perf-priority-absolute--${priorityTone}`;
  sec.setAttribute('aria-label', 'Priorité absolue');
  const kicker = document.createElement('span');
  kicker.className = 'kpi-perf-priority-absolute-k';
  kicker.textContent = 'Priorité du moment';
  const row = document.createElement('div');
  row.className = 'kpi-perf-priority-absolute-row';
  const msg = document.createElement('p');
  msg.className = 'kpi-perf-priority-absolute-msg';
  msg.textContent = priority.message;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'kpi-perf-priority-absolute-cta';
  btn.textContent = priority.ctaLabel;
  btn.addEventListener('click', () => openKpi(priority.kpiKey, priority.preset ?? null));
  row.append(msg, btn);
  sec.append(kicker, row);
  return sec;
}

/**
 * @param {Date} [at]
 */
export function createCockpitFreshnessIndicator(at) {
  const t =
    at instanceof Date && !Number.isNaN(at.getTime()) ? at : new Date();
  const el = document.createElement('div');
  el.className = 'kpi-perf-freshness';
  const timeStr = t.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
  const safeTime = escapeHtml(String(timeStr));
  const iso = escapeHtml(t.toISOString());
  el.innerHTML = `<span class="kpi-perf-freshness-dot" aria-hidden="true"></span><span class="kpi-perf-freshness-txt">Indicateurs synchronisés</span><time class="kpi-perf-freshness-time" datetime="${iso}">${safeTime}</time>`;
  return el;
}

export function createQuickActionsBar(hooks) {
  const wrap = document.createElement('div');
  wrap.className = 'kpi-perf-quick-bar';
  wrap.setAttribute('aria-label', 'Actions rapides');

  const specs = [
    {
      label: 'Voir incidents critiques',
      className: 'kpi-perf-quick-btn kpi-perf-quick-btn--risk',
      onClick: () => hooks.openKpi('incidentsCritical', { severity: 'critique' })
    },
    {
      label: 'Voir actions en retard',
      className: 'kpi-perf-quick-btn kpi-perf-quick-btn--warn',
      onClick: () => hooks.openKpi('actionsLate')
    },
    {
      label: 'Créer une action',
      className: 'kpi-perf-quick-btn kpi-perf-quick-btn--neutral',
      onClick: () => hooks.navigateHash('actions')
    },
    {
      label: 'Lancer un audit',
      className: 'kpi-perf-quick-btn kpi-perf-quick-btn--neutral',
      onClick: () => hooks.navigateHash('audits')
    }
  ];

  specs.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = s.className;
    b.textContent = s.label;
    b.addEventListener('click', s.onClick);
    wrap.append(b);
  });

  return wrap;
}

/**
 * @param {{ text: string; tone: 'red'|'amber'|'green'; icon: string; kpiKey?: string; preset?: Record<string, string> | null }[]} recos
 * @param {(k: string, p?: Record<string, string> | null) => void} [openKpi]
 * @param {{ title?: string; subtitle?: string; assistant?: boolean }} [opts]
 */
export function createRecommendationsSection(recos, openKpi, opts) {
  const sec = document.createElement('section');
  sec.className = 'kpi-perf-reco-band' + (opts?.assistant ? ' kpi-perf-reco-band--assistant' : '');
  sec.setAttribute('aria-label', opts?.title || 'Assistant QHSE');
  const head = document.createElement('div');
  head.className = 'kpi-perf-reco-band-head';
  const k = document.createElement('span');
  k.className = 'kpi-perf-reco-band-k';
  k.textContent = opts?.title || 'Assistant QHSE';
  const sub = document.createElement('span');
  sub.className = 'kpi-perf-reco-band-sub';
  sub.textContent =
    opts?.subtitle ||
    'Recommandations prioritaires — cliquer pour agir dans le module associé';
  head.append(k, sub);

  const grid = document.createElement('div');
  grid.className =
    'kpi-perf-reco-grid' + (opts?.assistant ? ' kpi-perf-reco-grid--assistant' : '');
  recos.forEach((r) => {
    const toneToken = sanitizeClassToken(r.tone, 'blue');
    const actionable = Boolean(r.kpiKey && openKpi);
    const card = actionable ? document.createElement('button') : document.createElement('article');
    if (actionable && card instanceof HTMLButtonElement) {
      card.type = 'button';
      card.className = `kpi-perf-reco-card kpi-perf-reco-card--${toneToken} kpi-perf-reco-card--action`;
      card.setAttribute('aria-label', `${r.text} — ouvrir le détail`);
      card.addEventListener('click', () => openKpi?.(r.kpiKey, r.preset ?? null));
    } else {
      card.className = `kpi-perf-reco-card kpi-perf-reco-card--${toneToken}`;
    }
    const ico = document.createElement('span');
    ico.className = 'kpi-perf-reco-ico';
    ico.setAttribute('aria-hidden', 'true');
    ico.textContent = r.icon;
    const p = document.createElement('p');
    p.className = 'kpi-perf-reco-txt';
    p.textContent = r.text;
    card.append(ico, p);
    grid.append(card);
  });
  sec.append(head, grid);
  return sec;
}

/**
 * @param {ReturnType<typeof computeGlobalQhseCockpitLevel>} levelInfo
 * @param {() => void} [onOpenDetail] ouvre le détail conformité / leviers
 */
export function createGlobalScoreSection(levelInfo, onOpenDetail) {
  const sec = document.createElement('section');
  const levelToken = sanitizeClassToken(levelInfo.level, 'stable');
  sec.className = `kpi-perf-global-score kpi-perf-global-score--${levelToken} kpi-perf-global-score--hero`;
  const interp = levelInfo.interpretation || '';
  const hintFull = levelInfo.hint || '';
  sec.setAttribute(
    'aria-label',
    `Score QHSE ${levelInfo.score} sur 100, niveau ${levelInfo.levelLabel}. ${hintFull}`
  );
  sec.title = hintFull;
  sec.innerHTML = `
    <div class="kpi-perf-global-score-inner">
      <span class="kpi-perf-global-k">Score QHSE</span>
      <div class="kpi-perf-global-hero-row">
        <div class="kpi-perf-global-score-figure" aria-hidden="true">
          <span class="kpi-perf-global-num">${levelInfo.score}</span><span class="kpi-perf-global-slash">/100</span>
        </div>
        <span class="kpi-perf-global-pill kpi-perf-global-pill--${levelToken} kpi-perf-global-pill--lg">${escapeHtml(levelInfo.levelLabel)}</span>
      </div>
      <p class="kpi-perf-global-interpret">${escapeHtml(interp)}</p>
      <p class="kpi-perf-global-risk kpi-perf-global-risk--${levelToken}">Niveau de vigilance : ${escapeHtml(levelInfo.levelLabel)}</p>
      ${onOpenDetail ? '<p class="kpi-perf-global-cta-hint">Ouvrir le détail des leviers</p>' : ''}
    </div>`;
  if (typeof onOpenDetail === 'function') {
    sec.classList.add('kpi-perf-global-score--interactive');
    sec.tabIndex = 0;
    sec.setAttribute('role', 'button');
    sec.addEventListener('click', () => onOpenDetail());
    sec.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenDetail();
      }
    });
  }
  return sec;
}

/**
 * @param {(k: string, p?: Record<string, string> | null) => void} openKpi
 */
export function createUrgencySection(critOpen, actOd, ncOpen, openKpi) {
  const sec = document.createElement('section');
  sec.className = 'kpi-perf-urgency';
  const h = document.createElement('h3');
  h.className = 'kpi-perf-urgency-title';
  h.textContent = 'À traiter immédiatement';
  const list = document.createElement('div');
  list.className = 'kpi-perf-urgency-list';
  list.setAttribute('role', 'list');
  const cells = [
    {
      label: 'Incidents critiques',
      sub: 'Sécurité / escalade',
      value: critOpen,
      prio: 'Critique',
      rowTone: 'crit',
      k: 'incidentsCritical',
      p: { severity: 'critique' }
    },
    {
      label: 'Actions en retard',
      sub: 'Plan d’actions',
      value: actOd,
      prio: 'Retard',
      rowTone: 'late',
      k: 'actionsLate',
      p: null
    },
    {
      label: 'NC ouvertes',
      sub: 'Non-conformités',
      value: ncOpen,
      prio: 'Ouvert',
      rowTone: 'nc',
      k: 'ncOpen',
      p: null
    }
  ];
  cells.forEach((c) => {
    const rowToneToken = sanitizeClassToken(c.rowTone, 'neutral');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `kpi-perf-urgency-row kpi-perf-urgency-row--${rowToneToken}`;
    btn.setAttribute('aria-label', `${c.label} : ${c.value} — ouvrir le détail`);
    const prio = document.createElement('span');
    prio.className = `kpi-perf-urgency-prio kpi-perf-urgency-prio--${rowToneToken}`;
    prio.textContent = c.prio;
    const mid = document.createElement('div');
    mid.className = 'kpi-perf-urgency-mid';
    const lab = document.createElement('span');
    lab.className = 'kpi-perf-urgency-lab';
    lab.textContent = c.label;
    const sub = document.createElement('span');
    sub.className = 'kpi-perf-urgency-sub';
    sub.textContent = c.sub;
    mid.append(lab, sub);
    const v = document.createElement('span');
    v.className = 'kpi-perf-urgency-val';
    v.textContent = String(c.value);
    const chev = document.createElement('span');
    chev.className = 'kpi-perf-urgency-chev';
    chev.setAttribute('aria-hidden', 'true');
    chev.textContent = '›';
    btn.append(prio, mid, v, chev);
    btn.addEventListener('click', () => openKpi(c.k, c.p));
    list.append(btn);
  });
  sec.append(h, list);
  return sec;
}

function kindLabel(kind) {
  const m = { incident: 'Incident', action: 'Action', audit: 'Audit', nc: 'NC' };
  return m[kind] || kind;
}

/**
 * @param {ReturnType<typeof buildActivityTimelineEntries>} entries
 * @param {(k: string, p?: Record<string, string> | null) => void} [openKpi]
 */
export function createTimelineSection(entries, openKpi) {
  const sec = document.createElement('section');
  sec.className = 'kpi-perf-timeline';
  const h = document.createElement('h3');
  h.className = 'kpi-perf-timeline-h';
  h.textContent = 'Activité récente';
  const ul = document.createElement('ul');
  ul.className = 'kpi-perf-timeline-list';
  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'kpi-perf-timeline-empty';
    li.textContent = 'Pas assez d’événements datés sur le périmètre chargé.';
    ul.append(li);
  } else {
    entries.forEach((e) => {
      const kindToken = sanitizeClassToken(e.kind, 'neutral');
      const row = document.createElement('li');
      row.className = 'kpi-perf-timeline-li';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `kpi-perf-timeline-item kpi-perf-timeline-item--${kindToken}`;
      btn.setAttribute(
        'aria-label',
        `${kindLabel(e.kind)} — ${e.title} — ouvrir le module associé`
      );
      const dot = document.createElement('span');
      dot.className = 'kpi-perf-timeline-dot';
      dot.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div');
      body.className = 'kpi-perf-timeline-body';
      const kindEl = document.createElement('span');
      kindEl.className = 'kpi-perf-timeline-kind';
      kindEl.textContent = kindLabel(e.kind);
      const strong = document.createElement('strong');
      strong.className = 'kpi-perf-timeline-line1';
      strong.textContent = e.title;
      const sub = document.createElement('span');
      sub.className = 'kpi-perf-timeline-sub';
      sub.textContent = e.sub;
      body.append(kindEl, strong, sub);
      const time = document.createElement('time');
      time.className = 'kpi-perf-timeline-time';
      time.textContent = e.t
        ? new Date(e.t).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '—';
      btn.append(dot, body, time);
      btn.addEventListener('click', () => {
        if (e.kpiKey && openKpi) openKpi(e.kpiKey, e.preset ?? null);
      });
      row.append(btn);
      ul.append(row);
    });
  }
  sec.append(h, ul);
  return sec;
}
