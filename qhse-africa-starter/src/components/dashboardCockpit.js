/**
 * Bloc central « Cockpit direction QHSE » — données issues du chargement dashboard existant (pas d’API dédiée).
 */

function includesCritique(severity) {
  return String(severity || '')
    .toLowerCase()
    .includes('critique');
}

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

function navigate(hash) {
  const id = String(hash || '').replace(/^#/, '');
  if (id) window.location.hash = id;
}

function computeDynamicIntro(ctx) {
  const { riskVal, openNc, actN, audN, od, actCount } = ctx;
  if (od >= 3 || (od > 0 && od >= openNc + riskVal && od >= 2)) {
    return 'Exécution tendue : des actions sont en retard — à débloquer en priorité.';
  }
  if (openNc > 2) {
    return 'Conformité : beaucoup de NC ouvertes — à traiter ou calendrier avant la revue.';
  }
  if (riskVal > 0) {
    return 'Sécurité / gravité : incident(s) critique(s) — suivi terrain attendu.';
  }
  if (openNc > 0 && od > 0) {
    return 'Double sujet : NC et retards — arbitrer et piloter les deux files.';
  }
  if (openNc > 0) {
    return 'Conformité : NC ouvertes — traiter ou planifier la suite.';
  }
  if (actCount <= 2 && actN + audN < 6) {
    return 'Peu de mouvement récent sur ce tableau de bord.';
  }
  if (openNc === 0 && od === 0 && riskVal === 0) {
    return 'Aucune alerte critique sur les indicateurs suivis ici.';
  }
  return 'Vue d’ensemble à compléter dans les sections ci-dessous.';
}

function computeChartInterpretation(values, maxV) {
  const r = values.risks;
  const nc = values.nc;
  const a = values.actions;
  const aud = values.audits;
  const sum = r + nc + a + aud;
  if (maxV <= 1 && sum <= 3) {
    return 'Les quatre indicateurs sont peu élevés sur cette vue.';
  }
  if (a === maxV && a > Math.max(nc, r) + 1) {
    return 'Le volume d’actions domine : vérifier la charge côté plan.';
  }
  if (nc === maxV && nc > 0) {
    return 'Les NC ressortent le plus : priorité conformité.';
  }
  if (r === maxV && r > 0) {
    return 'Les incidents critiques ressortent le plus : priorité terrain.';
  }
  const minV = Math.min(r, nc, a, aud);
  if (maxV > 0 && (maxV - minV) / maxV < 0.2) {
    return 'Les quatre indicateurs sont proches : situation équilibrée sur cette vue.';
  }
  return 'Écarts visibles entre les axes : identifier le plus sollicité.';
}

function formatMiniPhrases(ctx) {
  const { alertesSum, od, actCount, avgScore, hasScores } = ctx;
  let tensions;
  if (alertesSum === 0) {
    tensions = 'Rien à signaler.';
  } else if (alertesSum === 1) {
    tensions = '1 point d’attention.';
  } else {
    tensions = 'Plusieurs points à suivre.';
  }

  let score;
  if (!hasScores) {
    score = 'Note d’audit non disponible ici.';
  } else if (avgScore >= 80) {
    score = `Moyenne audits : ${avgScore} % — bon niveau.`;
  } else if (avgScore >= 65) {
    score = `Moyenne audits : ${avgScore} % — correct.`;
  } else {
    score = `Moyenne audits : ${avgScore} % — sous objectif.`;
  }

  let echeances;
  if (od === 0) {
    echeances = 'Aucun retard sur les actions.';
  } else if (od === 1) {
    echeances = '1 action en retard.';
  } else {
    echeances = `${od} actions en retard.`;
  }

  let activite;
  if (actCount === 0) {
    activite = 'Peu de nouveautés dans le flux.';
  } else if (actCount <= 4) {
    activite = 'Activité récente modérée.';
  } else if (actCount >= 12) {
    activite = 'Activité récente soutenue.';
  } else {
    activite = 'Activité récente dans la norme.';
  }

  return { tensions, score, echeances, activite };
}

function computeMicroAction(ctx) {
  const { riskVal, openNc, od, alertesSum } = ctx;
  if (od >= 2 || riskVal > 0) {
    return '→ Agir en priorité sur les sujets mis en avant.';
  }
  if (openNc > 0) {
    return '→ Surveiller la conformité et les plans associés.';
  }
  if (alertesSum === 0) {
    return '→ Maintenir le suivi et les revues habituelles.';
  }
  return '→ Conserver une veille sur les indicateurs.';
}

function buildWatchItems(ctx) {
  const { riskVal, openNc, od, avgScore, hasScores, audN } = ctx;
  /** @type {{ text: string; hash: string }[]} */
  const items = [];
  if (riskVal > 0) {
    items.push({
      text: `${riskVal} incident(s) critique(s)`,
      hash: 'incidents'
    });
  }
  if (openNc > 0) {
    items.push({
      text: `${openNc} NC ouverte(s) sans clôture`,
      hash: 'audits'
    });
  }
  if (od > 0) {
    items.push({
      text: `${od} action(s) en retard`,
      hash: 'actions'
    });
  }
  if (hasScores && audN > 0 && avgScore < 65) {
    items.push({
      text: `Résultats audits à renforcer (${avgScore} %)`,
      hash: 'analytics'
    });
  }
  return items.slice(0, 4);
}

/** Actions courtes intégrées au bloc situation (même logique que l’ancienne colonne latérale). */
function getSituationActionSpecs(ctx) {
  const { riskVal, openNc, od } = ctx;
  const primary = {
    label: riskVal > 0 ? 'Voir les incidents' : 'Ouvrir le registre risques',
    hash: riskVal > 0 ? 'incidents' : 'risks',
    emph: false
  };
  const secondary = {
    label:
      od > 0 ? 'Traiter les retards' : openNc > 0 ? 'Voir les NC' : 'Ouvrir le plan d’actions',
    hash: od > 0 ? 'actions' : openNc > 0 ? 'audits' : 'actions',
    emph: false
  };
  if (od > 0) secondary.emph = true;
  else if (openNc > 0) secondary.emph = true;
  else if (riskVal > 0) primary.emph = true;
  return [primary, secondary];
}

/** Un lien contextuel sous le graphique selon l’axe dominant. */
function getChartActionSpec(values, maxV) {
  const r = values.risks;
  const nc = values.nc;
  const a = values.actions;
  if (a === maxV && a > Math.max(nc, r)) {
    return { label: 'Aller au plan d’actions', hash: 'actions' };
  }
  if (nc === maxV && nc > 0) {
    return { label: 'Aller aux audits', hash: 'audits' };
  }
  if (r === maxV && r > 0) {
    return { label: 'Aller aux incidents', hash: 'incidents' };
  }
  return { label: 'Voir les analyses', hash: 'analytics' };
}

function computePrimaryAlert(openNc, riskIndicator, overdue) {
  /** @type {{ variant: string; kicker: string; message: string; cta: string; hash: string; secondary?: { label: string; hash: string } }} */
  if (overdue > 0 && overdue >= Math.max(openNc, riskIndicator)) {
    return {
      variant: 'warn',
      kicker: 'Priorité',
      message: `${overdue} action(s) en retard — prioriser l’exécution.`,
      cta: 'Voir le plan d’actions →',
      hash: 'actions',
      secondary:
        openNc > 0
          ? { label: 'Voir aussi les NC', hash: 'audits' }
          : undefined
    };
  }
  if (openNc > 2) {
    return {
      variant: 'nc',
      kicker: 'Priorité',
      message: `${openNc} NC ouvertes — traiter ou calendrier avant la revue.`,
      cta: 'Voir les audits →',
      hash: 'audits',
      secondary:
        overdue > 0
          ? { label: 'Voir les retards', hash: 'actions' }
          : undefined
    };
  }
  if (openNc > 0 && overdue > 0) {
    return {
      variant: 'warn',
      kicker: 'Priorité',
      message: `${openNc} NC et ${overdue} retard(s) — arbitrer les deux sujets.`,
      cta: 'Voir les actions →',
      hash: 'actions',
      secondary: { label: 'Voir les NC', hash: 'audits' }
    };
  }
  if (riskIndicator > 0) {
    return {
      variant: 'risk',
      kicker: 'Priorité',
      message: `${riskIndicator} incident(s) critique(s) — sécuriser le terrain.`,
      cta: 'Voir les incidents →',
      hash: 'incidents',
      secondary:
        overdue > 0
          ? { label: 'Voir les retards', hash: 'actions' }
          : openNc > 0
            ? { label: 'Voir les NC', hash: 'audits' }
            : undefined
    };
  }
  if (openNc > 0) {
    return {
      variant: 'nc',
      kicker: 'Conformité',
      message: `${openNc} NC ouverte(s) — suivre les plans d’action.`,
      cta: 'Voir les audits →',
      hash: 'audits',
      secondary:
        overdue > 0
          ? { label: 'Voir les retards', hash: 'actions' }
          : undefined
    };
  }
  return {
    variant: 'ok',
    kicker: 'Synthèse',
    message: 'Aucun retard, NC ouverte ni incident critique sur cette vue.',
    cta: 'Approfondir les analyses →',
    hash: 'analytics'
  };
}

export function createDashboardCockpit() {
  const root = document.createElement('section');
  root.className = 'dashboard-cockpit';
  root.setAttribute('aria-labelledby', 'dashboard-cockpit-title');

  root.innerHTML = `
    <div class="dashboard-cockpit__inner">
      <header class="dashboard-cockpit__head">
        <span class="dashboard-cockpit__kicker">Pilotage</span>
        <h2 id="dashboard-cockpit-title" class="dashboard-cockpit__title">Cockpit direction QHSE</h2>
      </header>

      <article class="dashboard-cockpit__card dashboard-cockpit__card--focus" aria-label="Situation">
        <div class="dashboard-cockpit__situation">
          <p class="dashboard-cockpit__intro" data-cockpit-intro></p>
          <p class="dashboard-cockpit__micro" data-cockpit-micro></p>
        </div>
        <div class="dashboard-cockpit__situation-actions" data-cockpit-situation-acts></div>
      </article>

      <div class="dashboard-cockpit__alert" data-cockpit-alert tabindex="0" role="button"></div>

      <article class="dashboard-cockpit__card dashboard-cockpit__card--analytics" aria-label="Comparatif">
        <div class="dashboard-cockpit__card-head">
          <span class="dashboard-cockpit__card-kicker">Analyse</span>
          <h3 class="dashboard-cockpit__card-title">Comparatif en un coup d’œil</h3>
        </div>
        <div class="dashboard-cockpit__chart" data-cockpit-chart role="img" aria-label="Comparatif des quatre indicateurs du cockpit">
          <div class="dashboard-cockpit__bars" data-cockpit-bars></div>
          <p class="dashboard-cockpit__chart-read" data-cockpit-chart-read></p>
          <p class="dashboard-cockpit__chart-note" data-cockpit-chart-note></p>
        </div>
        <div class="dashboard-cockpit__chart-actions" data-cockpit-chart-acts></div>
      </article>

      <div class="dashboard-cockpit__minis dashboard-cockpit__minis--support" data-cockpit-minis></div>

      <article class="dashboard-cockpit__card dashboard-cockpit__card--complement" aria-label="À surveiller">
        <div class="dashboard-cockpit__card-head dashboard-cockpit__card-head--compact">
          <h3 class="dashboard-cockpit__card-title">À surveiller</h3>
        </div>
        <div class="dashboard-cockpit__watch" data-cockpit-watch></div>
      </article>
    </div>
  `;

  const introEl = root.querySelector('[data-cockpit-intro]');
  const microEl = root.querySelector('[data-cockpit-micro]');
  const situationActsHost = root.querySelector('[data-cockpit-situation-acts]');
  const barsHost = root.querySelector('[data-cockpit-bars]');
  const chartReadEl = root.querySelector('[data-cockpit-chart-read]');
  const chartNote = root.querySelector('[data-cockpit-chart-note]');
  const chartActsHost = root.querySelector('[data-cockpit-chart-acts]');
  const alertEl = root.querySelector('[data-cockpit-alert]');
  const watchHost = root.querySelector('[data-cockpit-watch]');
  const minisHost = root.querySelector('[data-cockpit-minis]');

  const BAR_DEFS = [
    {
      key: 'risks',
      label: 'Incidents critiques',
      hint: 'Gravité « critique » (vue incidents et synthèse chargée ici)'
    },
    { key: 'nc', label: 'NC ouvertes', hint: 'Non-conformités non closées (vue chargée)' },
    { key: 'actions', label: 'Actions totales', hint: 'Nombre total d’actions suivi sur le périmètre' },
    { key: 'audits', label: 'Audits listés', hint: 'Audits affichés dans cette vue' }
  ];

  const barRows = {};
  BAR_DEFS.forEach((def) => {
    const row = document.createElement('div');
    row.className = 'dashboard-cockpit__bar-row';
    row.innerHTML = `
      <span class="dashboard-cockpit__bar-label" title="${def.hint}">${def.label}</span>
      <div class="dashboard-cockpit__bar-track">
        <div class="dashboard-cockpit__bar-fill" data-fill></div>
      </div>
      <span class="dashboard-cockpit__bar-val" data-val>—</span>
    `;
    barsHost.append(row);
    barRows[def.key] = {
      fill: row.querySelector('[data-fill]'),
      val: row.querySelector('[data-val]')
    };
  });

  const miniDefs = [
    { key: 'alertes', label: 'Tensions' },
    { key: 'score', label: 'Audits' },
    { key: 'echeances', label: 'Échéances' },
    { key: 'activite', label: 'Flux' }
  ];
  const miniEls = {};
  miniDefs.forEach((d) => {
    const el = document.createElement('div');
    el.className = 'dashboard-cockpit__mini';
    el.innerHTML = `<span class="dashboard-cockpit__mini-label">${d.label}</span><span class="dashboard-cockpit__mini-val" data-mv>—</span>`;
    minisHost.append(el);
    miniEls[d.key] = {
      wrap: el,
      val: el.querySelector('[data-mv]')
    };
  });

  function renderSituationActions(ctx) {
    situationActsHost.replaceChildren();
    const specs = getSituationActionSpecs(ctx);
    specs.forEach((spec) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dashboard-cockpit__pill';
      if (spec.emph) btn.classList.add('dashboard-cockpit__pill--emph');
      btn.textContent = spec.label;
      btn.addEventListener('click', () => navigate(spec.hash));
      situationActsHost.append(btn);
    });
  }

  function renderChartAction(values, maxV) {
    chartActsHost.replaceChildren();
    const spec = getChartActionSpec(values, maxV);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dashboard-cockpit__textlink';
    btn.textContent = `${spec.label} →`;
    btn.addEventListener('click', () => navigate(spec.hash));
    chartActsHost.append(btn);
  }

  let alertNavigate = '';

  function setAlert(payload) {
    alertNavigate = payload.hash || '';
    alertEl.className = `dashboard-cockpit__alert dashboard-cockpit__alert--${payload.variant}`;
    alertEl.replaceChildren();
    const body = document.createElement('div');
    body.className = 'dashboard-cockpit__alert-body';
    const k = document.createElement('span');
    k.className = 'dashboard-cockpit__alert-k';
    k.textContent = payload.kicker;
    const m = document.createElement('span');
    m.className = 'dashboard-cockpit__alert-msg';
    m.textContent = payload.message;
    const c = document.createElement('span');
    c.className = 'dashboard-cockpit__alert-cta';
    c.textContent = payload.cta;
    body.append(k, m, c);
    alertEl.append(body);

    if (payload.secondary) {
      const sec = document.createElement('div');
      sec.className = 'dashboard-cockpit__alert-secondary';
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'dashboard-cockpit__alert-link';
      link.textContent = payload.secondary.label;
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(payload.secondary.hash);
      });
      sec.append(link);
      alertEl.append(sec);
    }

    alertEl.setAttribute('aria-label', `${payload.message} ${payload.cta}`);
  }

  alertEl.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.closest('.dashboard-cockpit__alert-link')) return;
    if (alertNavigate) navigate(alertNavigate);
  });
  alertEl.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && alertNavigate) {
      e.preventDefault();
      navigate(alertNavigate);
    }
  });

  function renderWatchList(items) {
    watchHost.replaceChildren();
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'dashboard-cockpit__watch-empty';
      p.textContent = 'Rien d’urgent ici. Maintenir le suivi habituel.';
      watchHost.append(p);
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'dashboard-cockpit__watch-list';
    items.forEach((it) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dashboard-cockpit__watch-item';
      btn.textContent = it.text;
      btn.title = `Aller à ${it.hash}`;
      btn.addEventListener('click', () => navigate(it.hash));
      li.append(btn);
      ul.append(li);
    });
    watchHost.append(ul);
  }

  function update({
    stats,
    incidents: incidentsIn,
    actions: actionsIn,
    audits: auditsIn,
    ncs: ncsIn
  }) {
    const incidents = Array.isArray(incidentsIn) ? incidentsIn : [];
    const actions = Array.isArray(actionsIn) ? actionsIn : [];
    const audits = Array.isArray(auditsIn) ? auditsIn : [];
    const ncs = Array.isArray(ncsIn) ? ncsIn : [];

    const critSample = incidents.filter((i) => includesCritique(i.severity)).length;
    const critApi = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
    const riskVal = Math.max(critSample, critApi);

    const openNc = ncs.filter(isNcOpen).length;
    const actTotal = Number(stats?.actions);
    const actN = Number.isFinite(actTotal) ? actTotal : 0;
    const audN = audits.length;

    const values = { risks: riskVal, nc: openNc, actions: actN, audits: audN };
    const maxV = Math.max(riskVal, openNc, actN, audN, 1);

    BAR_DEFS.forEach((def) => {
      const v = values[def.key];
      const pct = Math.round((v / maxV) * 100);
      const row = barRows[def.key];
      if (row) {
        row.fill.style.width = `${pct}%`;
        row.val.textContent = String(v);
      }
    });

    const overdue = Number(stats?.overdueActions);
    const od = Number.isFinite(overdue) ? overdue : 0;
    const actCount =
      Math.min(5, incidents.length) + Math.min(5, actions.length) + Math.min(5, audits.length);
    const alertesSum = riskVal + od + openNc;

    const scores = (audits || [])
      .map((a) => Number(a.score))
      .filter((n) => Number.isFinite(n));
    const hasScores = scores.length > 0;
    const avgScore = hasScores
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    introEl.textContent = computeDynamicIntro({
      riskVal,
      openNc,
      actN,
      audN,
      od,
      actCount
    });
    microEl.textContent = computeMicroAction({
      riskVal,
      openNc,
      od,
      alertesSum
    });

    renderSituationActions({ riskVal, openNc, od });

    setAlert(computePrimaryAlert(openNc, riskVal, od));

    chartReadEl.textContent = computeChartInterpretation(values, maxV);
    chartNote.textContent =
      'Les barres s’alignent sur l’indicateur le plus élevé pour faciliter la lecture.';
    renderChartAction(values, maxV);

    const mini = formatMiniPhrases({
      alertesSum,
      od,
      actCount,
      avgScore,
      hasScores
    });
    miniEls.alertes.val.textContent = mini.tensions;
    miniEls.alertes.wrap.title = `Indicateur composite (${alertesSum}) : incidents critiques + retards + NC ouvertes.`;
    miniEls.score.val.textContent = mini.score;
    miniEls.score.wrap.title = 'Moyenne des scores sur les audits de cette vue.';
    miniEls.echeances.val.textContent = mini.echeances;
    miniEls.echeances.wrap.title = 'Nombre d’actions en retard (synthèse).';
    miniEls.activite.val.textContent = mini.activite;
    miniEls.activite.wrap.title = 'Niveau d’activité récente dans le flux du tableau de bord.';

    const watchCtx = { riskVal, openNc, od, avgScore, hasScores, audN };
    renderWatchList(buildWatchItems(watchCtx));

    const chartBox = root.querySelector('[data-cockpit-chart]');
    if (chartBox) {
      chartBox.setAttribute(
        'aria-label',
        `Comparatif : ${riskVal} incidents critiques, ${openNc} NC ouvertes, ${actN} actions, ${audN} audits.`
      );
    }
  }

  return { root, update };
}
