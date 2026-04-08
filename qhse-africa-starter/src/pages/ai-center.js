import { showToast } from '../components/toast.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { ensureAiCenterStyles } from '../components/aiCenterStyles.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { getAiSimulationResult } from '../components/aiSimulation.js';
import { renderSimulationResult, getPlainTextForCopy } from '../components/aiSimulationView.js';
import { pushSimulationHistory, getSimulationHistory } from '../components/aiSimulationHistory.js';

const USE_CASES = [
  {
    id: 'summary',
    label: 'Résumé incident',
    title: 'Synthèse terrain exploitable immédiatement',
    body: 'Structuration automatique : faits, lieu, personnes exposées, mesures immédiates et périmètre — prête pour compte rendu HSE et déclarations internes.',
    foot: 'Livrable type : paragraphe unique + puces pour les suites.'
  },
  {
    id: 'actions',
    label: 'Suggestions d’actions',
    title: 'Plan d’actions aligné criticité & ISO',
    body: 'Propositions de mesures correctives / préventives, séquencement logique, rattachement aux plans d’actions et aux échéances déjà suivies sur le site.',
    foot: 'Priorisation type : santé-sécurité → environnement → conformité documentaire.'
  },
  {
    id: 'analysis',
    label: 'Analyse simple',
    title: 'Facteurs et causes contributives',
    body: 'Lecture structurée (technique + organisation) pour nourrir l’enquête sans la remplacer — points de vigilance pour auditeur ou comité.',
    foot: 'Sortie : sections prêtes à copier dans le rapport d’investigation.'
  },
  {
    id: 'exec',
    label: 'Synthèse direction',
    title: 'Brief décisionnel QHSE',
    body: 'Vue condensée : état du risque, tendance, décision attendue et message clé pour la revue de direction ou le comité trimestriel.',
    foot: 'Ton adapté à une lecture exécutive (2–3 minutes).'
  }
];

function createUseCaseCard(item) {
  const card = document.createElement('article');
  card.className = 'ai-use-card';
  const lab = document.createElement('span');
  lab.className = 'ai-use-card__label';
  lab.textContent = item.label;
  const title = document.createElement('h4');
  title.className = 'ai-use-card__title';
  title.textContent = item.title;
  const body = document.createElement('p');
  body.className = 'ai-use-card__body';
  body.textContent = item.body;
  const foot = document.createElement('p');
  foot.className = 'ai-use-card__foot';
  foot.textContent = item.foot;
  card.append(lab, title, body, foot);
  return card;
}

function formatHistoryTime(ts) {
  try {
    return new Date(ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

function refreshHistoryList(listEl) {
  listEl.innerHTML = '';
  const hist = getSimulationHistory();
  if (hist.length === 0) {
    const li = document.createElement('li');
    li.className = 'ai-sim-history__item';
    li.style.fontStyle = 'italic';
    li.style.color = 'var(--text3)';
    li.textContent = 'Aucun scénario exécuté dans cette session — lancez une analyse pour alimenter l’historique.';
    listEl.append(li);
    return;
  }
  hist.forEach((h) => {
    const li = document.createElement('li');
    li.className = 'ai-sim-history__item';
    const time = document.createElement('span');
    time.className = 'ai-sim-history__time';
    time.textContent = formatHistoryTime(h.at);
    const ref = document.createElement('span');
    ref.className = 'ai-sim-history__ref';
    ref.textContent = h.ref;
    const label = document.createElement('span');
    label.className = 'ai-sim-history__label';
    label.textContent = h.title;
    li.append(time, ref, label);
    listEl.append(li);
  });
}

function createSimulationZone(onAddLog) {
  let lastResult = null;

  const wrap = document.createElement('div');
  wrap.className = 'ai-sim-layout';

  const controls = document.createElement('div');
  controls.className = 'ai-sim-controls';
  const lab = document.createElement('label');
  lab.setAttribute('for', 'ai-scenario');
  lab.textContent = 'Scénario terrain';
  const select = document.createElement('select');
  select.id = 'ai-scenario';
  select.className = 'control-input';
  [
    ['hydrocarbure', 'Fuite hydrocarbure — bac de rétention'],
    ['chute', 'Chute de hauteur — échafaudage'],
    ['nc_audit', 'Non-conformité audit — traçabilité déchets']
  ].forEach(([value, text]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    select.append(opt);
  });

  const main = document.createElement('div');
  main.className = 'ai-sim-main';

  const outWrap = document.createElement('div');
  outWrap.className = 'ai-sim-output ai-sim-output--empty';
  const placeholder = document.createElement('p');
  placeholder.className = 'ai-sim-placeholder';
  placeholder.textContent =
    'Choisissez un scénario puis lancez l’analyse. La sortie est structurée en sections (résumé, gravité, actions, analyse, synthèse direction) — aucun envoi réseau.';
  outWrap.append(placeholder);

  const toolbar = document.createElement('div');
  toolbar.className = 'ai-sim-toolbar';
  const runBtn = document.createElement('button');
  runBtn.type = 'button';
  runBtn.className = 'btn btn-primary';
  runBtn.textContent = 'Lancer l’analyse';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'text-button';
  copyBtn.textContent = 'Copier le texte';
  copyBtn.disabled = true;
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'text-button';
  saveBtn.textContent = 'Enregistrer le brouillon';
  saveBtn.disabled = true;
  const hint = document.createElement('p');
  hint.className = 'ai-sim-hint';
  hint.textContent =
    'Copie : export brut pour rapport ou e-mail. Enregistrer brouillon : trace dans le journal d’activité de la session.';

  function runSimulation() {
    lastResult = getAiSimulationResult(select.value);
    outWrap.className = 'ai-sim-output ai-sim-output--filled';
    renderSimulationResult(outWrap, lastResult);
    copyBtn.disabled = false;
    saveBtn.disabled = false;

    const scenarioLabel = select.options[select.selectedIndex].text;
    pushSimulationHistory({
      scenarioLabel,
      title: lastResult.title,
      ref: lastResult.ref
    });
    refreshHistoryList(historyListEl);

    showToast('Analyse générée (scénario illustratif) — prête à être copiée ou enregistrée.', 'info');
    if (typeof onAddLog === 'function') {
      onAddLog({
        module: 'ai-center',
        action: 'Analyse scénario IA (terrain)',
        detail: `${lastResult.ref} — ${scenarioLabel}`,
        user: 'Copilote IA'
      });
    }
  }

  runBtn.addEventListener('click', () => {
    void (async () => {
      if (
        !(await ensureSensitiveAccess('security_zone', {
          contextLabel: 'lancement d’une analyse IA sur scénario (sortie locale)'
        }))
      ) {
        return;
      }
      runSimulation();
    })();
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastResult) return;
    const text = getPlainTextForCopy(lastResult);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Texte copié dans le presse-papiers.', 'info');
    } catch {
      showToast('Copie impossible — sélectionnez le texte manuellement.', 'info');
    }
  });

  saveBtn.addEventListener('click', () => {
    if (!lastResult) return;
    showToast('Brouillon enregistré dans le journal — export vers votre GED peut être activé sur demande.', 'info');
    if (typeof onAddLog === 'function') {
      onAddLog({
        module: 'ai-center',
        action: 'Enregistrement analyse IA',
        detail: `${lastResult.ref} — ${lastResult.title}`,
        user: 'Responsable QHSE'
      });
    }
  });

  toolbar.append(runBtn, copyBtn, saveBtn, hint);

  const history = document.createElement('div');
  history.className = 'ai-sim-history';
  const hTitle = document.createElement('p');
  hTitle.className = 'ai-sim-history__title';
  hTitle.textContent = 'Historique de session';
  const historyListEl = document.createElement('ul');
  historyListEl.className = 'ai-sim-history__list';
  history.append(hTitle, historyListEl);
  refreshHistoryList(historyListEl);

  controls.append(lab, select);
  main.append(outWrap, toolbar, history);
  wrap.append(controls, main);
  return wrap;
}

export function renderAiCenter(onAddLog) {
  ensureAiCenterStyles();
  ensureQhsePilotageStyles();

  const page = document.createElement('section');
  page.className = 'page-stack ai-center-page';

  const intro = document.createElement('article');
  intro.className = 'content-card card-soft ai-hero';
  intro.innerHTML = `
    <div class="content-card-head content-card-head--split">
      <div>
        <div class="section-kicker">Assistants</div>
        <h3>Centre IA — aide à la décision QHSE</h3>
        <p class="content-card-lead content-card-lead--narrow" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:8px;border:1px solid var(--color-primary-border);color:var(--color-primary-text);background:var(--color-primary-bg)">Suggestion IA</span>
          <span style="font-size:13px;font-weight:700;color:var(--text2)">Toujours : humain = validation · jamais d’auto-décision</span>
        </p>
        <p class="content-card-lead content-card-lead--narrow">
          Assistants orientés terrain et audit : résumés d’incidents, plans d’actions, analyses structurées et briefs direction.
          Les sorties ci-dessous sont produites en local pour structurer vos comptes rendus — sans envoi de données vers un modèle externe dans cette version.
        </p>
        <p class="content-card-lead content-card-lead--narrow ai-center-human-trust" style="margin-top:10px;padding:12px 14px;border-radius:12px;border:1px solid rgba(52,211,153,.25);background:rgba(34,197,94,.08);font-size:13px;line-height:1.5;color:var(--text2)">
          <strong style="color:#86efac">Validation humaine</strong> — chaque proposition reste une suggestion : copiez, adaptez ou ignorez avant toute décision ou enregistrement officiel.
        </p>
      </div>
      <button type="button" class="btn btn-primary btn--pilotage-cta ai-quick-run">Enregistrer un brouillon d’analyse</button>
    </div>
  `;

  intro.querySelector('.ai-quick-run').addEventListener('click', () => {
    showToast('Brouillon pris en compte — intégration SI / workflow HSE selon votre déploiement.', 'info');
    if (typeof onAddLog === 'function') {
      onAddLog({
        module: 'ai-center',
        action: 'Brouillon analyse IA',
        detail: 'Action utilisateur — brouillon enregistré depuis le Centre IA',
        user: 'Responsable QHSE'
      });
    }
  });

  const useGrid = document.createElement('div');
  useGrid.className = 'ai-use-grid';
  USE_CASES.forEach((uc) => useGrid.append(createUseCaseCard(uc)));

  const simCard = document.createElement('article');
  simCard.className = 'content-card card-soft ai-sim-card';
  simCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Scénarios types</div>
        <h3>Zone interactive — sortie structurée</h3>
        <p class="content-card-lead">
          Scénarios types prédéfinis : l’analyse produit une fiche en sections (résumé, gravité, actions, analyse, synthèse direction) avec référence documentaire formatée.
        </p>
      </div>
    </div>
  `;
  simCard.append(createSimulationZone(onAddLog));

  page.append(intro, useGrid, simCard);
  return page;
}
