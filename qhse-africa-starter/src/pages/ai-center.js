import { showToast } from '../components/toast.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { ensureAiCenterStyles } from '../components/aiCenterStyles.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { getAiSimulationResult } from '../components/aiSimulation.js';
import { renderSimulationResult, getPlainTextForCopy } from '../components/aiSimulationView.js';
import { pushSimulationHistory, getSimulationHistory } from '../components/aiSimulationHistory.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { openActionCreateDialog } from '../components/actionCreateDialog.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';
import { fetchUsers } from '../services/users.service.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';

const AI_SUGGEST_BASE = '/api/ai-suggestions/suggest';
const AI_CENTER_IA_SHELL_ID = 'qhse-ai-center-api-slideover-css';

function ensureAiCenterApiSlideoverCss() {
  if (document.getElementById(AI_CENTER_IA_SHELL_ID)) return;
  const el = document.createElement('style');
  el.id = AI_CENTER_IA_SHELL_ID;
  el.textContent = `
.qhse-ai-center-overlay{position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:450;opacity:0;pointer-events:none;transition:opacity .2s}
.qhse-ai-center-overlay--open{opacity:1;pointer-events:all}
.qhse-ai-center-slide{position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);max-width:100vw;background:var(--color-surface,#0f172a);border-left:1px solid var(--color-border);z-index:451;transform:translateX(100%);transition:transform .22s ease;display:flex;flex-direction:column}
.qhse-ai-center-slide--open{transform:translateX(0)}
.qhse-ai-center-slide__head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--color-border);flex-shrink:0}
.qhse-ai-center-slide__title{font-size:14px;font-weight:700}
.qhse-ai-center-slide__close{width:36px;height:36px;border-radius:10px;border:1px solid var(--color-border);background:transparent;cursor:pointer;color:inherit}
.qhse-ai-center-slide__body{flex:1;overflow:auto;padding:16px}
.qhse-ac-ia-section{margin-bottom:18px}
.qhse-ac-ia-section__title{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-muted);margin:0 0 8px}
.qhse-ac-ia-row{padding:12px;border-radius:12px;border:1px solid var(--color-border);margin-bottom:10px;background:color-mix(in srgb,var(--color-subtle) 40%,transparent)}
.qhse-ac-ia-row__head{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.qhse-ac-ia-confidence{font-size:12px;font-weight:800;color:var(--color-primary-text)}
.qhse-ac-ia-cat{font-size:11px;color:var(--color-text-muted);margin-top:4px}
.qhse-ac-ia-actions{margin-top:8px;display:flex;flex-wrap:wrap;gap:8px}
.qhse-ac-ia-provider{font-size:11px;color:var(--color-text-muted);margin-bottom:10px}
`;
  document.head.append(el);
}

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

function refreshHistoryList(listEl, runAnalysisBtn) {
  listEl.replaceChildren();
  const hist = getSimulationHistory();
  if (hist.length === 0) {
    const es = createEmptyState(
      '\u2606',
      'Historique de session vide',
      'Lancez une analyse locale pour voir les entrées s’accumuler dans ce fil.',
      'Lancer une analyse',
      () => runAnalysisBtn?.click()
    );
    es.classList.add('empty-state--ai-history');
    listEl.append(es);
    return;
  }
  hist.forEach((h) => {
    const li = document.createElement('div');
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
    ['espace_confiné', 'Espace confiné — atmosphère / ventilation'],
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
    refreshHistoryList(historyListEl, runBtn);

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
  const historyListEl = document.createElement('div');
  historyListEl.className = 'ai-sim-history__list';
  history.append(hTitle, historyListEl);
  refreshHistoryList(historyListEl, runBtn);

  controls.append(lab, select);
  main.append(outWrap, toolbar, history);
  wrap.append(controls, main);
  return wrap;
}

export function renderAiCenter(onAddLog) {
  ensureAiCenterStyles();
  ensureQhsePilotageStyles();

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas ai-center-page';

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
          Les scénarios ci-dessous restent locaux ; l’API suggestions (causes / actions / criticité risque) s’active côté serveur selon <code style="font-size:12px">AI_PROVIDER</code> — toujours avec validation humaine.
        </p>
        <p class="content-card-lead content-card-lead--narrow ai-center-human-trust">
          <strong class="ai-center-human-trust__strong">Validation humaine</strong> — chaque proposition reste une suggestion : copiez, adaptez ou ignorez avant toute décision ou enregistrement officiel.
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

  const canUseAiSuggest = canResource(getSessionUser()?.role, 'ai_suggestions', 'write');
  const canWriteActions = canResource(getSessionUser()?.role, 'actions', 'write');

  let cachedUsersAi = null;
  async function ensureUsersAi() {
    if (cachedUsersAi) return;
    try {
      cachedUsersAi = await fetchUsers();
    } catch {
      cachedUsersAi = [];
    }
  }

  function dueDateIsoFromDelayDays(delayDays) {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(0, Math.floor(Number(delayDays) || 0)));
    return d.toISOString().slice(0, 10);
  }

  function priorityFromConfidence(c) {
    const x = Number(c);
    if (!Number.isFinite(x)) return 'normale';
    if (x >= 0.82) return 'critique';
    if (x >= 0.65) return 'haute';
    return 'normale';
  }

  function mountAiApiSlideover(titleText, bodyFactory) {
    ensureAiCenterApiSlideoverCss();
    document.getElementById('qhse-ac-api-overlay')?.remove();
    document.getElementById('qhse-ac-api-slide')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'qhse-ai-center-overlay';
    overlay.id = 'qhse-ac-api-overlay';
    const slide = document.createElement('aside');
    slide.className = 'qhse-ai-center-slide';
    slide.id = 'qhse-ac-api-slide';
    slide.setAttribute('role', 'dialog');
    slide.setAttribute('aria-modal', 'true');

    const head = document.createElement('div');
    head.className = 'qhse-ai-center-slide__head';
    head.innerHTML = `
      <span class="qhse-ai-center-slide__title">${escapeHtml(titleText)}</span>
      <button type="button" class="qhse-ai-center-slide__close" aria-label="Fermer">×</button>`;
    const body = document.createElement('div');
    body.className = 'qhse-ai-center-slide__body';

    function closeAc() {
      overlay.classList.remove('qhse-ai-center-overlay--open');
      slide.classList.remove('qhse-ai-center-slide--open');
      document.body.style.overflow = '';
      overlay.remove();
      slide.remove();
      document.removeEventListener('keydown', onEscAc);
    }
    function onEscAc(e) {
      if (e.key === 'Escape') closeAc();
    }

    overlay.addEventListener('click', closeAc);
    head.querySelector('.qhse-ai-center-slide__close')?.addEventListener('click', closeAc);
    document.addEventListener('keydown', onEscAc);

    slide.append(head, body);
    document.body.append(overlay, slide);
    requestAnimationFrame(() => {
      overlay.classList.add('qhse-ai-center-overlay--open');
      slide.classList.add('qhse-ai-center-slide--open');
      document.body.style.overflow = 'hidden';
    });
    bodyFactory(body, closeAc);
  }

  let cachedIncidentsForAi = [];
  let cachedRisksForAi = [];

  const apiIaCard = document.createElement('article');
  apiIaCard.className = 'content-card card-soft';
  apiIaCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">API</div>
        <h3>Suggestions IA branchées serveur</h3>
        <p class="content-card-lead">
          Analyse d’incident (causes racines + actions correctives) et évaluation de criticité d’un risque (GP indicatif).
          Nécessite la permission <strong>suggestions IA · écriture</strong>.
        </p>
      </div>
    </div>
    <div class="ai-center-api-tools" style="display:grid;gap:16px;padding:4px 0 8px">
      <div>
        <label style="display:block;font-weight:600;margin-bottom:6px;font-size:13px">Incident</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <select class="control-select" id="ai-center-incident-pick" style="min-width:220px;flex:1"></select>
          <button type="button" class="btn btn-primary" id="ai-center-incident-run" ${canUseAiSuggest ? '' : 'disabled'}>✦ Analyser avec IA</button>
        </div>
      </div>
      <div>
        <label style="display:block;font-weight:600;margin-bottom:6px;font-size:13px">Risque (évaluation GP)</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <select class="control-select" id="ai-center-risk-pick" style="min-width:220px;flex:1"></select>
          <button type="button" class="btn btn-secondary" id="ai-center-risk-run" ${canUseAiSuggest ? '' : 'disabled'}>Évaluer criticité IA</button>
        </div>
      </div>
    </div>
  `;

  const incPick = apiIaCard.querySelector('#ai-center-incident-pick');
  const incRun = apiIaCard.querySelector('#ai-center-incident-run');
  const riskPick = apiIaCard.querySelector('#ai-center-risk-pick');
  const riskRun = apiIaCard.querySelector('#ai-center-risk-run');

  if (!canUseAiSuggest) {
    const hint = document.createElement('p');
    hint.className = 'content-card-lead';
    hint.style.marginTop = '8px';
    hint.textContent =
      'Votre rôle n’inclut pas l’écriture sur les suggestions IA — connectez-vous avec un profil autorisé ou demandez l’accès.';
    apiIaCard.append(hint);
  }

  void (async () => {
    try {
      const [ir, rr] = await Promise.all([
        qhseFetch(withSiteQuery('/api/incidents?limit=120')),
        qhseFetch(withSiteQuery('/api/risks?limit=120'))
      ]);
      if (ir.ok) {
        const list = await ir.json();
        cachedIncidentsForAi = Array.isArray(list) ? list : [];
        incPick.innerHTML = '<option value="">— Choisir un incident —</option>';
        cachedIncidentsForAi.forEach((row) => {
          if (!row?.id) return;
          const opt = document.createElement('option');
          opt.value = row.id;
          const ref = row.ref || row.id;
          const t = (row.description || '').trim().split(/\r?\n/)[0]?.slice(0, 48) || row.type || '';
          opt.textContent = `${ref} — ${t}`;
          incPick.append(opt);
        });
      }
      if (rr.ok) {
        const list = await rr.json();
        cachedRisksForAi = Array.isArray(list) ? list : [];
        riskPick.innerHTML = '<option value="">— Choisir un risque —</option>';
        cachedRisksForAi.forEach((row) => {
          if (!row?.id) return;
          const opt = document.createElement('option');
          opt.value = row.id;
          opt.textContent = `${row.ref || row.id} — ${(row.title || '').slice(0, 56)}`;
          riskPick.append(opt);
        });
      }
    } catch {
      /* ignore */
    }
  })();

  incRun?.addEventListener('click', () => {
    const id = incPick?.value;
    if (!id) {
      showToast('Choisissez un incident.', 'info');
      return;
    }
    const row = cachedIncidentsForAi.find((x) => x.id === id);
    const ref = row?.ref || id;
    mountAiApiSlideover(`IA · ${ref}`, (body, closeAc) => {
      const loadP = document.createElement('p');
      loadP.style.opacity = '0.75';
      loadP.textContent = 'Chargement…';
      body.append(loadP);
      void (async () => {
        try {
          const [rcRes, actRes] = await Promise.all([
            qhseFetch(`${AI_SUGGEST_BASE}/root-causes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ incidentId: id })
            }),
            qhseFetch(`${AI_SUGGEST_BASE}/actions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ incidentId: id })
            })
          ]);
          body.replaceChildren();
          if (!rcRes.ok || !actRes.ok) {
            const p = document.createElement('p');
            p.textContent = 'Erreur API — vérifiez la session et les permissions.';
            body.append(p);
            return;
          }
          const rc = await rcRes.json();
          const act = await actRes.json();

          const prov = document.createElement('p');
          prov.className = 'qhse-ac-ia-provider';
          prov.textContent = `Fournisseur : ${rc.provider || '—'}`;

          const secC = document.createElement('section');
          secC.className = 'qhse-ac-ia-section';
          const hC = document.createElement('h4');
          hC.className = 'qhse-ac-ia-section__title';
          hC.textContent = 'Causes racines';
          secC.append(hC);
          (rc.rootCauses || []).forEach((item) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'qhse-ac-ia-row';
            const head = document.createElement('div');
            head.className = 'qhse-ac-ia-row__head';
            const c = document.createElement('div');
            c.style.fontWeight = '600';
            c.textContent = String(item.cause || '—');
            const pct = document.createElement('span');
            pct.className = 'qhse-ac-ia-confidence';
            pct.textContent = `${Math.round((Number(item.confidence) || 0) * 100)} %`;
            head.append(c, pct);
            const cat = document.createElement('div');
            cat.className = 'qhse-ac-ia-cat';
            cat.textContent = String(item.category || '');
            rowEl.append(head, cat);
            secC.append(rowEl);
          });

          const secA = document.createElement('section');
          secA.className = 'qhse-ac-ia-section';
          const hA = document.createElement('h4');
          hA.className = 'qhse-ac-ia-section__title';
          hA.textContent = 'Actions correctives';
          secA.append(hA);
          for (const a of act.actions || []) {
            const rowEl = document.createElement('div');
            rowEl.className = 'qhse-ac-ia-row';
            const head = document.createElement('div');
            head.className = 'qhse-ac-ia-row__head';
            const ttl = document.createElement('div');
            ttl.style.fontWeight = '700';
            ttl.textContent = String(a.title || '—');
            const pct = document.createElement('span');
            pct.className = 'qhse-ac-ia-confidence';
            pct.textContent = `${Math.round((Number(a.confidence) || 0) * 100)} %`;
            head.append(ttl, pct);
            const desc = document.createElement('p');
            desc.style.margin = '6px 0 0';
            desc.style.fontSize = '13px';
            desc.textContent = String(a.description || '');
            const meta = document.createElement('div');
            meta.className = 'qhse-ac-ia-cat';
            meta.textContent = `${Number(a.delayDays) || 0} j · ${String(a.ownerRole || '')}`;
            const ar = document.createElement('div');
            ar.className = 'qhse-ac-ia-actions';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-primary';
            btn.textContent = 'Créer action depuis suggestion';
            btn.hidden = !canWriteActions;
            btn.addEventListener('click', async () => {
              await ensureUsersAi();
              openActionCreateDialog({
                users: cachedUsersAi || [],
                defaults: {
                  title: String(a.title || `Action — ${ref}`).slice(0, 240),
                  origin: 'incident',
                  actionType: 'corrective',
                  priority: priorityFromConfidence(a.confidence),
                  description: [
                    String(a.description || ''),
                    '',
                    `[IA Centre · confiance ~${Math.round((Number(a.confidence) || 0) * 100)} %]`
                  ].join('\n'),
                  linkedIncident: ref,
                  dueDate: dueDateIsoFromDelayDays(a.delayDays)
                },
                builtInSuccessToast: false,
                onCreated: (payload) => {
                  showToast('Action créée.', 'success', {
                    label: 'Ouvrir',
                    action: () => {
                      if (payload?.id) {
                        qhseNavigate('actions', {
                          focusActionId: payload.id,
                          focusActionTitle: payload.title || ''
                        });
                      } else {
                        qhseNavigate('actions', { skipDefaults: true });
                      }
                    }
                  });
                  closeAc();
                  if (typeof onAddLog === 'function') {
                    onAddLog({
                      module: 'ai-center',
                      action: 'Action depuis suggestion IA',
                      detail: ref,
                      user: getSessionUser()?.name || 'Utilisateur'
                    });
                  }
                }
              });
            });
            ar.append(btn);
            rowEl.append(head, desc, meta, ar);
            secA.append(rowEl);
          }
          body.append(prov, secC, secA);
        } catch (e) {
          console.error(e);
          body.replaceChildren();
          body.append(document.createTextNode('Erreur réseau.'));
        }
      })();
    });
  });

  riskRun?.addEventListener('click', () => {
    const id = riskPick?.value;
    if (!id) {
      showToast('Choisissez un risque.', 'info');
      return;
    }
    const row = cachedRisksForAi.find((x) => x.id === id);
    const label = row?.title || row?.ref || id;
    mountAiApiSlideover(`IA · risque`, (body) => {
      body.textContent = 'Évaluation…';
      void (async () => {
        try {
          const res = await qhseFetch(`${AI_SUGGEST_BASE}/risk-level`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ riskId: id })
          });
          body.replaceChildren();
          if (!res.ok) {
            body.textContent = 'Erreur API.';
            return;
          }
          const data = await res.json();
          const as = data.assessment || {};
          const prov = document.createElement('p');
          prov.className = 'qhse-ac-ia-provider';
          prov.textContent = `Fournisseur : ${data.provider || '—'} · ${escapeHtml(label)}`;
          const box = document.createElement('div');
          box.className = 'qhse-ac-ia-row';
          box.innerHTML = `
            <div class="qhse-ac-ia-row__head">
              <span style="font-weight:800">GP suggéré : ${escapeHtml(String(as.suggestedGp ?? '—'))}</span>
              <span class="qhse-ac-ia-confidence">${Math.round((Number(as.confidence) || 0) * 100)} % confiance</span>
            </div>
            <p class="qhse-ac-ia-cat" style="margin-top:8px">Gravité ${escapeHtml(String(as.suggestedSeverity ?? '—'))} · Probabilité ${escapeHtml(String(as.suggestedProbability ?? '—'))}</p>
            <p style="margin-top:10px;font-size:13px;line-height:1.5">${escapeHtml(String(as.justification || '—'))}</p>`;
          body.append(prov, box);
        } catch (e) {
          console.error(e);
          body.textContent = 'Erreur réseau.';
        }
      })();
    });
  });

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

  page.append(intro, useGrid, apiIaCard, simCard);
  return page;
}
