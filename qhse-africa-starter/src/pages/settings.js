import { showToast } from '../components/toast.js';
import { ensureSettingsPageStyles } from '../components/settingsPageStyles.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canAccessNavPage } from '../utils/permissionsUi.js';
import {
  SENSITIVE_ACCESS_ACTION_META,
  loadSensitiveAccessConfig,
  saveSensitiveAccessConfig,
  loadSensitiveAccessPin,
  saveSensitiveAccessPin,
  clearSensitiveAccessSessionCache
} from '../data/sensitiveAccessConfig.js';

const LS_ALERTS = 'qhse_cfg_alerts_v1';
const LS_NOTIF = 'qhse_cfg_notif_v1';
const LS_EXPORT = 'qhse_cfg_export_pdf_v1';
const LS_IA = 'qhse_cfg_ia_modules_v1';
const LS_CYCLE = 'qhse_cfg_control_cycle_v1';
const LS_CYCLE_USAGE = 'qhse_cfg_cycle_usage_v1';

/** @returns {Record<string, unknown>} */
function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function saveJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    showToast('Enregistrement local impossible (navigateur).', 'warning');
  }
}

const DEFAULT_ALERTS = [
  {
    id: 'al-1',
    name: 'Actions en retard',
    condition: 'Échéance dépassée > 7 j (paramétrage serveur à brancher)',
    level: 'warning',
    channel: 'app',
    on: true
  },
  {
    id: 'al-2',
    name: 'Incident critique ouvert',
    condition: 'Gravité critique et statut non clos',
    level: 'critique',
    channel: 'email',
    on: true
  },
  {
    id: 'al-3',
    name: 'Nouvelle non-conformité majeure',
    condition: 'NC créée depuis audit — classement majeur',
    level: 'critique',
    channel: 'app',
    on: false
  },
  {
    id: 'al-4',
    name: 'Rapport périodique PDF',
    condition: 'Synthèse hebdomadaire (planification serveur)',
    level: 'info',
    channel: 'pdf',
    on: false
  }
];

const STATUS_OPTIONS = [
  ['a_controler', 'À contrôler'],
  ['a_corriger', 'À corriger'],
  ['corrige', 'Corrigé'],
  ['a_verifier', 'À vérifier'],
  ['valide', 'Validé'],
  ['rejete', 'Rejeté']
];

/** @type {{ key: string; title: string; hint: string }[]} */
const USAGE_FLOW_ROWS = [
  {
    key: 'aiExtract',
    title: 'Extraction IA (document)',
    hint: 'Exemple : sortie structurée à valider avant publication au référentiel.'
  },
  {
    key: 'iaSuggest',
    title: 'Suggestion IA',
    hint: 'Exemple : proposition à corriger ou reformuler avant application.'
  },
  {
    key: 'importDoc',
    title: 'Import documentaire',
    hint: 'Exemple : fiche importée — contrôle puis validation après correction si besoin.'
  },
  {
    key: 'autoExtract',
    title: 'Extraction automatique',
    hint: 'Exemple : champs pré-remplis — passage souvent en « à vérifier ».'
  },
  {
    key: 'ecartNc',
    title: 'Écart / non-conformité',
    hint: 'Exemple : constat — typiquement « à corriger » avec preuves attendues.'
  },
  {
    key: 'audit',
    title: 'Audits & constats',
    hint: 'Exemple : preuves et réponses — contrôle humain avant clôture.'
  },
  {
    key: 'preuve',
    title: 'Preuve / document à vérifier',
    hint: 'Exemple : pièce jointe — état « à vérifier » jusqu’à visa.'
  }
];

const DEFAULT_CYCLE_USAGE = {
  aiExtract: { defaultStatus: 'a_controler', humanRequired: true },
  iaSuggest: { defaultStatus: 'a_corriger', humanRequired: true },
  importDoc: { defaultStatus: 'a_controler', humanRequired: true },
  autoExtract: { defaultStatus: 'a_verifier', humanRequired: true },
  ecartNc: { defaultStatus: 'a_corriger', humanRequired: true },
  audit: { defaultStatus: 'a_controler', humanRequired: true },
  preuve: { defaultStatus: 'a_verifier', humanRequired: true }
};

function normalizeCycleUsage(raw) {
  const out = { ...DEFAULT_CYCLE_USAGE };
  USAGE_FLOW_ROWS.forEach(({ key }) => {
    const cur = raw && typeof raw[key] === 'object' ? raw[key] : {};
    out[key] = {
      defaultStatus:
        typeof cur.defaultStatus === 'string' ? cur.defaultStatus : DEFAULT_CYCLE_USAGE[key].defaultStatus,
      humanRequired:
        typeof cur.humanRequired === 'boolean' ? cur.humanRequired : DEFAULT_CYCLE_USAGE[key].humanRequired
    };
  });
  return out;
}

function levelClass(level) {
  if (level === 'critique') return 'settings-tag--critique';
  if (level === 'warning') return 'settings-tag--warning';
  return 'settings-tag--info';
}

function channelLabel(c) {
  if (c === 'email') return 'E-mail';
  if (c === 'pdf') return 'PDF';
  return 'Application';
}

/**
 * @param {{ id: string; name: string; condition: string; level: string; channel: string; on: boolean }[]} alerts
 * @param {(next: typeof alerts) => void} onChange
 */
function renderAlertList(host, alerts, onChange) {
  host.replaceChildren();
  alerts.forEach((a) => {
    const row = document.createElement('div');
    row.className = 'settings-alert-row';
    const main = document.createElement('div');
    main.className = 'settings-alert-main';
    const name = document.createElement('p');
    name.className = 'settings-alert-name';
    name.textContent = a.name;
    const meta = document.createElement('p');
    meta.className = 'settings-alert-meta';
    meta.textContent = a.condition;
    const tags = document.createElement('div');
    tags.className = 'settings-alert-tags';
    const t1 = document.createElement('span');
    t1.className = `settings-tag ${levelClass(a.level)}`;
    t1.textContent = a.level;
    const t2 = document.createElement('span');
    t2.className = 'settings-tag';
    t2.textContent = channelLabel(a.channel);
    tags.append(t1, t2);
    main.append(name, meta, tags);

    const swWrap = document.createElement('div');
    swWrap.className = 'settings-switch-wrap';
    const swLabel = document.createElement('span');
    swLabel.className = 'settings-switch-label';
    swLabel.textContent = a.on ? 'Actif' : 'Inactif';
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'settings-switch';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-checked', a.on ? 'true' : 'false');
    sw.setAttribute('aria-label', `Alerte ${a.name}`);
    sw.addEventListener('click', () => {
      const next = alerts.map((x) =>
        x.id === a.id ? { ...x, on: !x.on } : x
      );
      onChange(next);
    });
    swWrap.append(swLabel, sw);
    row.append(main, swWrap);
    host.append(row);
  });
}

function goHash(pageId) {
  window.location.hash = pageId;
}

const SS_IMPORT_INTENT = 'qhse_import_intent_v1';

function goImportWithIntent(intent) {
  try {
    sessionStorage.setItem(SS_IMPORT_INTENT, intent);
  } catch {
    /* ignore */
  }
  goHash('imports');
}

/** Import générique : nettoie l’intention contextuelle pour éviter une bannière obsolète. */
function goHashImportsWithoutIntent() {
  try {
    sessionStorage.removeItem(SS_IMPORT_INTENT);
  } catch {
    /* ignore */
  }
  goHash('imports');
}

function scrollToSettingsSection(id) {
  const el = document.getElementById(id);
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function renderSettings() {
  ensureSettingsPageStyles();
  ensureQhsePilotageStyles();

  const page = document.createElement('section');
  page.className = 'page-stack settings-page settings-page--hq';

  const hero = document.createElement('article');
  hero.className = 'content-card card-soft settings-hero';
  hero.innerHTML = `
    <div class="settings-hero-premium">
      <div class="settings-hero-premium__top">
        <p class="settings-hero-premium__eyebrow">Espace configuration</p>
        <h1 class="settings-hero-premium__title">Paramètres &amp; pilotage QHSE</h1>
        <p class="settings-hero-premium__lead">
          Cadre central pour l’organisation, la veille, les notifications, les exports, les référentiels,
          la gouvernance IA et le cycle de maîtrise (détection → clôture). Les réglages ci-dessous sont
          enregistrés localement dans le navigateur (démo) — prêts à être reliés à une API paramètres.
        </p>
        <div class="settings-hero-premium__meta" aria-hidden="true">
          <span class="settings-hero-chip">Piloter · Agir · Contrôler</span>
          <span class="settings-hero-chip">Corriger · Prouver · Décider</span>
          <span class="settings-hero-chip">IA sous validation humaine</span>
        </div>
        <div class="settings-hero-premium__meta settings-hero-premium__meta--note" aria-hidden="true">
          <span class="settings-hero-chip settings-hero-chip--note">Persistance locale (navigateur)</span>
          <span class="settings-hero-chip settings-hero-chip--note">Modules &amp; routes existants préservés</span>
        </div>
      </div>
      <nav class="settings-toc" aria-label="Accès aux sections"></nav>
    </div>
  `;
  const tocNav = hero.querySelector('.settings-toc');
  const tocSpec = [
    { id: 'settings-anchor-org', label: 'Organisation' },
    { id: 'settings-anchor-alerts', label: 'Alertes' },
    { id: 'settings-anchor-notif', label: 'Notifications' },
    { id: 'settings-anchor-exports', label: 'Exports' },
    { id: 'settings-anchor-security-access', label: 'Sécurité & accès' },
    { id: 'settings-anchor-ref', label: 'Référentiels' },
    { id: 'settings-anchor-ia', label: 'IA' },
    { id: 'settings-anchor-cycle', label: 'Maîtrise' }
  ];
  tocSpec.forEach(({ id, label }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'settings-toc__btn';
    b.textContent = label;
    b.addEventListener('click', () => scrollToSettingsSection(id));
    tocNav?.append(b);
  });

  /* —— Organisation —— */
  const secA = document.createElement('section');
  secA.className = 'settings-section';
  secA.id = 'settings-anchor-org';
  secA.setAttribute('aria-labelledby', 'settings-org-title');
  secA.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">A · Organisation &amp; sites</p>
      <h4 class="settings-section__title" id="settings-org-title">Organisation &amp; sites</h4>
      <p class="settings-section__lead">
        Référentiel des sites et import documentaire : mêmes écrans, mêmes routes (#sites, #imports) et mêmes droits.
        Le périmètre actif reste piloté depuis le pied de menu latéral.
      </p>
    </header>
    <div class="settings-grid-2" data-settings-org-grid></div>
    <div class="settings-org-context-bar" data-settings-org-context></div>
  `;
  const orgGrid = secA.querySelector('[data-settings-org-grid]');
  const cardSites = document.createElement('div');
  cardSites.className = 'settings-link-card';
  cardSites.innerHTML = `
    <span class="settings-link-card__label">Référentiel</span>
    <h5 class="settings-link-card__title">Sites &amp; périmètres</h5>
    <p class="settings-link-card__desc">Sites, codes et rattachement des modules opérationnels.</p>
  `;
  const btnSites = document.createElement('button');
  btnSites.type = 'button';
  btnSites.className = 'btn btn-primary';
  btnSites.textContent = 'Ouvrir Sites';
  btnSites.addEventListener('click', () => goHash('sites'));
  cardSites.append(btnSites);
  const suNav = getSessionUser();
  if (suNav && !canAccessNavPage(suNav.role, 'sites')) {
    btnSites.disabled = true;
    btnSites.title = 'Accès réservé pour votre profil';
    btnSites.style.opacity = '0.55';
  }

  const cardImports = document.createElement('div');
  cardImports.className = 'settings-link-card';
  cardImports.innerHTML = `
    <span class="settings-link-card__label">Documents</span>
    <h5 class="settings-link-card__title">Import de documents</h5>
    <p class="settings-link-card__desc">Chargement, pré-analyse et brouillon — validation sur le module cible.</p>
  `;
  const btnImports = document.createElement('button');
  btnImports.type = 'button';
  btnImports.className = 'btn btn-secondary';
  btnImports.textContent = 'Ouvrir Import';
  btnImports.addEventListener('click', () => goHashImportsWithoutIntent());
  cardImports.append(btnImports);
  if (suNav && !canAccessNavPage(suNav.role, 'imports')) {
    btnImports.disabled = true;
    btnImports.title = 'Accès réservé pour votre profil';
    btnImports.style.opacity = '0.55';
  }
  if (orgGrid) orgGrid.append(cardSites, cardImports);

  const orgCtx = secA.querySelector('[data-settings-org-context]');
  if (orgCtx) {
    const cap = document.createElement('p');
    cap.className = 'settings-org-context-bar__cap';
    cap.textContent = 'Imports contextuels (préparation)';
    const actions = document.createElement('div');
    actions.className = 'settings-org-context-bar__actions';
    function mkIntentBtn(label, intent) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary';
      b.textContent = label;
      b.addEventListener('click', () => goImportWithIntent(intent));
      if (suNav && !canAccessNavPage(suNav.role, 'imports')) {
        b.disabled = true;
        b.title = 'Accès réservé pour votre profil';
        b.style.opacity = '0.55';
      }
      return b;
    }
    actions.append(
      mkIntentBtn('Import orienté risques', 'risks'),
      mkIntentBtn('Import FDS / produits', 'fds'),
      mkIntentBtn('Import ISO / exigences', 'iso')
    );
    orgCtx.append(cap, actions);
  }

  /* —— Alertes —— */
  const savedAlerts = loadJson(LS_ALERTS, {});
  let alertsState = Array.isArray(savedAlerts.list) && savedAlerts.list.length ? savedAlerts.list : [...DEFAULT_ALERTS];

  const secB = document.createElement('section');
  secB.className = 'settings-section';
  secB.id = 'settings-anchor-alerts';
  secB.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">B · Alertes intelligentes</p>
      <h4 class="settings-section__title">Alertes intelligentes</h4>
      <p class="settings-section__lead">
        Règles et niveaux de criticité (maquette). L’évaluation réelle des conditions restera côté serveur.
      </p>
    </header>
    <div class="settings-alert-list" data-settings-alerts></div>
    <div class="settings-actions-bar">
      <button type="button" class="btn btn-secondary" data-settings-add-alert>Créer une alerte</button>
    </div>
  `;
  const alertsHost = secB.querySelector('[data-settings-alerts]');
  function persistAlerts() {
    saveJson(LS_ALERTS, { list: alertsState });
  }
  function redrawAlerts() {
    if (!alertsHost) return;
    renderAlertList(alertsHost, alertsState, (next) => {
      alertsState = next;
      persistAlerts();
      redrawAlerts();
    });
  }
  redrawAlerts();
  secB.querySelector('[data-settings-add-alert]')?.addEventListener('click', () => {
    const id = `al-${Date.now()}`;
    alertsState = [
      ...alertsState,
      {
        id,
        name: 'Nouvelle alerte',
        condition: 'Condition à définir (placeholder)',
        level: 'info',
        channel: 'app',
        on: true
      }
    ];
    persistAlerts();
    redrawAlerts();
    showToast('Alerte ajoutée (locale). Branchez la création sur l’API.', 'info');
  });

  /* —— Notifications —— */
  let notif = {
    minLevel: 'warning',
    digest: true,
    push: false,
    ...loadJson(LS_NOTIF, {})
  };
  const secC = document.createElement('section');
  secC.className = 'settings-section';
  secC.id = 'settings-anchor-notif';
  secC.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">C · Notifications</p>
      <h4 class="settings-section__title">Notifications</h4>
      <p class="settings-section__lead">
        Filtres d’affichage dans l’application (mock). Le centre de notifications existant n’est pas modifié.
      </p>
    </header>
    <div class="settings-prefs-grid" data-settings-notif></div>
  `;
  const notifHost = secC.querySelector('[data-settings-notif]');
  function buildNotifRow(label, key, type, options) {
    const row = document.createElement('div');
    row.className = 'settings-pref-row';
    const span = document.createElement('span');
    span.textContent = label;
    row.append(span);
    if (type === 'select') {
      const sel = document.createElement('select');
      sel.className = 'control-input';
      options.forEach(([v, t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = t;
        sel.append(o);
      });
      sel.value = notif[key] || options[0][0];
      sel.addEventListener('change', () => {
        notif = { ...notif, [key]: sel.value };
        saveJson(LS_NOTIF, notif);
        showToast('Préférence enregistrée (navigateur).', 'info');
      });
      row.append(sel);
    } else {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'settings-switch';
      sw.setAttribute('role', 'switch');
      sw.setAttribute(
        'aria-label',
        `${label} — ${notif[key] ? 'activé' : 'désactivé'}`
      );
      sw.setAttribute('aria-checked', !!notif[key] ? 'true' : 'false');
      sw.addEventListener('click', () => {
        const next = !notif[key];
        notif = { ...notif, [key]: next };
        sw.setAttribute('aria-checked', next ? 'true' : 'false');
        sw.setAttribute(
          'aria-label',
          `${label} — ${next ? 'activé' : 'désactivé'}`
        );
        saveJson(LS_NOTIF, notif);
        showToast('Préférence enregistrée (navigateur).', 'info');
      });
      row.append(sw);
    }
    return row;
  }
  notifHost.append(
    buildNotifRow('Niveau minimum affiché', 'minLevel', 'select', [
      ['info', 'Info et plus'],
      ['warning', 'Avertissement et plus'],
      ['critique', 'Critique uniquement']
    ]),
    buildNotifRow('Digest quotidien (e-mail)', 'digest', 'toggle'),
    buildNotifRow('Notifications push navigateur', 'push', 'toggle')
  );

  /* —— Exports PDF —— */
  let exportPdf = loadJson(LS_EXPORT, {
    audits: true,
    nc: true,
    actions: true,
    incidents: true,
    iso: false
  });
  const secD = document.createElement('section');
  secD.className = 'settings-section';
  secD.id = 'settings-anchor-exports';
  secD.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">D · Exports &amp; rapports</p>
      <h4 class="settings-section__title">Exports &amp; rapports PDF</h4>
      <p class="settings-section__lead">
        Chapitres inclus dans les futurs modèles de synthèse (UI seule ; génération réelle côté serveur).
      </p>
    </header>
    <div class="settings-check-grid" data-settings-export></div>
  `;
  const exportHost = secD.querySelector('[data-settings-export]');
  const exportDefs = [
    ['audits', 'Audits & constats'],
    ['nc', 'Non-conformités'],
    ['actions', 'Plan d’actions'],
    ['incidents', 'Incidents'],
    ['iso', 'Synthèse ISO / exigences']
  ];
  exportDefs.forEach(([key, lab]) => {
    const labEl = document.createElement('label');
    labEl.className = 'settings-check';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!exportPdf[key];
    cb.addEventListener('change', () => {
      exportPdf = { ...exportPdf, [key]: cb.checked };
      saveJson(LS_EXPORT, exportPdf);
    });
    const txt = document.createElement('span');
    txt.textContent = lab;
    labEl.append(cb, txt);
    exportHost.append(labEl);
  });

  /* —— Sécurité & accès renforcé (code 6 chiffres, démo locale) —— */
  let sensitiveCfg = loadSensitiveAccessConfig();
  const secH = document.createElement('section');
  secH.className = 'settings-section settings-section--sensitive-access';
  secH.id = 'settings-anchor-security-access';
  secH.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">H · Sécurité &amp; accès</p>
      <h4 class="settings-section__title">Code de vérification (accès renforcé)</h4>
      <p class="settings-section__lead">
        Optionnel : code à 6 chiffres sur les actions que vous cochez. Par défaut : une demande par session navigateur (recommandé pour limiter les interruptions).
        Le Centre IA peut être exclu (décoché par défaut). Stockage local — à remplacer par une politique serveur / SSO en production.
      </p>
    </header>
    <div class="settings-sensitive-access-toolbar">
      <div class="settings-pref-row settings-sensitive-access-master">
        <span>Activer le code renforcé</span>
        <button type="button" class="settings-switch" role="switch" data-sa-master aria-label="Activer accès renforcé"></button>
      </div>
      <p class="settings-sensitive-access-hint" data-sa-status></p>
    </div>
    <div class="settings-subsection" data-sa-actions-wrap>
      <h5 class="settings-subsection__title">Types d’actions concernés</h5>
      <p class="settings-subsection__lead">Décochez pour laisser une catégorie sans demande de code (tant que le renfort est actif).</p>
      <div class="settings-sensitive-actions-grid" data-sa-actions></div>
    </div>
    <div class="settings-subsection" data-sa-freq-wrap>
      <h5 class="settings-subsection__title">Fréquence de la demande</h5>
      <p class="settings-subsection__lead settings-subsection__lead--tight">
        Une fois le code accepté, les actions protégées peuvent être débloquées pour toute la session (ou 15 min), selon votre choix.
      </p>
      <div class="settings-pref-row">
        <label class="settings-sensitive-select-label" for="settings-sa-frequency">Politique après saisie correcte</label>
        <select id="settings-sa-frequency" class="control-input" data-sa-frequency>
          <option value="per_session">Une fois par session (recommandé)</option>
          <option value="interval_15m">Au plus une fois toutes les 15 minutes</option>
          <option value="always">À chaque action protégée</option>
        </select>
      </div>
    </div>
    <div class="settings-subsection" data-sa-level-wrap>
      <h5 class="settings-subsection__title">Niveau de protection</h5>
      <div class="settings-pref-row">
        <label class="settings-sensitive-select-label" for="settings-sa-level">Affichage modal</label>
        <select id="settings-sa-level" class="control-input" data-sa-level>
          <option value="standard">Standard (sobre)</option>
          <option value="strict">Strict (rappel visuel renforcé)</option>
        </select>
      </div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Code à 6 chiffres</h5>
      <p class="settings-subsection__lead">Même code pour toutes les actions cochées. Ne pas réutiliser un code bancaire.</p>
      <div class="settings-sensitive-pin-grid">
        <label class="field">
          <span>Nouveau code</span>
          <input type="password" class="control-input" data-sa-pin-a maxlength="6" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" placeholder="••••••" />
        </label>
        <label class="field">
          <span>Confirmer</span>
          <input type="password" class="control-input" data-sa-pin-b maxlength="6" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" placeholder="••••••" />
        </label>
      </div>
      <div class="settings-actions-bar" style="margin-top:12px">
        <button type="button" class="btn btn-primary" data-sa-pin-save>Enregistrer le code</button>
        <button type="button" class="btn btn-secondary" data-sa-pin-clear>Retirer le code</button>
      </div>
    </div>
  `;

  const saMaster = secH.querySelector('[data-sa-master]');
  const saStatus = secH.querySelector('[data-sa-status]');
  const saActionsHost = secH.querySelector('[data-sa-actions]');
  const saFreq = secH.querySelector('[data-sa-frequency]');
  const saLevel = secH.querySelector('[data-sa-level]');
  const saPinA = secH.querySelector('[data-sa-pin-a]');
  const saPinB = secH.querySelector('[data-sa-pin-b]');
  const saActionsWrap = secH.querySelector('[data-sa-actions-wrap]');
  const saFreqWrap = secH.querySelector('[data-sa-freq-wrap]');
  const saLevelWrap = secH.querySelector('[data-sa-level-wrap]');

  function persistSensitiveCfg() {
    saveSensitiveAccessConfig(sensitiveCfg);
  }

  function syncSensitiveAccessUi() {
    sensitiveCfg = loadSensitiveAccessConfig();
    if (saMaster) {
      saMaster.setAttribute('aria-checked', sensitiveCfg.enabled ? 'true' : 'false');
    }
    if (saStatus) {
      const pinOk = loadSensitiveAccessPin();
      saStatus.textContent = sensitiveCfg.enabled
        ? pinOk
          ? 'Code enregistré — les actions cochées demanderont le code selon la fréquence choisie.'
          : 'Renfort activé mais aucun code : les actions protégées seront bloquées jusqu’à enregistrement d’un code.'
        : 'Accès renforcé désactivé — aucune demande de code.';
    }
    const subOn = sensitiveCfg.enabled;
    [saActionsWrap, saFreqWrap, saLevelWrap].forEach((el) => {
      if (el) el.style.opacity = subOn ? '1' : '0.5';
    });
    if (saFreq) saFreq.disabled = !subOn;
    if (saLevel) saLevel.disabled = !subOn;
    if (saActionsHost) {
      saActionsHost.querySelectorAll('.settings-switch').forEach((sw) => {
        sw.toggleAttribute('disabled', !subOn);
      });
    }
    if (saFreq) saFreq.value = sensitiveCfg.frequency;
    if (saLevel) saLevel.value = sensitiveCfg.protectionLevel;
  }

  SENSITIVE_ACCESS_ACTION_META.forEach(({ key, label, hint }) => {
    const row = document.createElement('div');
    row.className = 'settings-sensitive-action-row';
    const text = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = label;
    const p = document.createElement('p');
    p.className = 'settings-sensitive-action-hint';
    p.textContent = hint;
    text.append(strong, p);
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'settings-switch';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('data-sa-act', key);
    sw.setAttribute('aria-label', label);
    sw.addEventListener('click', () => {
      if (!sensitiveCfg.enabled) return;
      const cur = Boolean(sensitiveCfg.actions[key]);
      sensitiveCfg = {
        ...sensitiveCfg,
        actions: { ...sensitiveCfg.actions, [key]: !cur }
      };
      sw.setAttribute('aria-checked', !cur ? 'true' : 'false');
      persistSensitiveCfg();
      clearSensitiveAccessSessionCache();
      syncSensitiveAccessUi();
      showToast('Paramètre enregistré (navigateur).', 'info');
    });
    row.append(text, sw);
    saActionsHost?.append(row);
  });

  saMaster?.addEventListener('click', () => {
    const next = !sensitiveCfg.enabled;
    sensitiveCfg = { ...sensitiveCfg, enabled: next };
    persistSensitiveCfg();
    if (!next) clearSensitiveAccessSessionCache();
    syncSensitiveAccessUi();
    showToast(next ? 'Accès renforcé activé.' : 'Accès renforcé désactivé.', 'info');
  });

  saFreq?.addEventListener('change', () => {
    const v = saFreq.value;
    if (v === 'always' || v === 'per_session' || v === 'interval_15m') {
      sensitiveCfg = { ...sensitiveCfg, frequency: v };
      persistSensitiveCfg();
      clearSensitiveAccessSessionCache();
      showToast('Fréquence enregistrée — prochaine action demandera le code si nécessaire.', 'info');
    }
  });

  saLevel?.addEventListener('change', () => {
    const v = saLevel.value === 'strict' ? 'strict' : 'standard';
    sensitiveCfg = { ...sensitiveCfg, protectionLevel: v };
    persistSensitiveCfg();
    showToast('Niveau enregistré.', 'info');
  });

  secH.querySelector('[data-sa-pin-save]')?.addEventListener('click', () => {
    const a = String(saPinA?.value || '').replace(/\D/g, '');
    const b = String(saPinB?.value || '').replace(/\D/g, '');
    if (a.length !== 6 || b.length !== 6) {
      showToast('Saisissez deux fois un code à exactement 6 chiffres.', 'warning');
      return;
    }
    if (a !== b) {
      showToast('Les deux saisies ne correspondent pas.', 'warning');
      return;
    }
    saveSensitiveAccessPin(a);
    clearSensitiveAccessSessionCache();
    if (saPinA) saPinA.value = '';
    if (saPinB) saPinB.value = '';
    syncSensitiveAccessUi();
    showToast('Code enregistré localement.', 'info');
  });

  secH.querySelector('[data-sa-pin-clear]')?.addEventListener('click', () => {
    saveSensitiveAccessPin('');
    clearSensitiveAccessSessionCache();
    if (saPinA) saPinA.value = '';
    if (saPinB) saPinB.value = '';
    syncSensitiveAccessUi();
    showToast('Code retiré.', 'info');
  });

  syncSensitiveAccessUi();
  SENSITIVE_ACCESS_ACTION_META.forEach(({ key }) => {
    const sw = secH.querySelector(`[data-sa-act="${key}"]`);
    if (sw) sw.setAttribute('aria-checked', sensitiveCfg.actions[key] ? 'true' : 'false');
  });

  /* —— Référentiels —— */
  const secE = document.createElement('section');
  secE.className = 'settings-section';
  secE.id = 'settings-anchor-ref';
  secE.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">E · Référentiels</p>
      <h4 class="settings-section__title">Référentiels</h4>
      <p class="settings-section__lead">
        Accès aux modules conformité et produits déjà en place (exigences, FDS, preuves).
      </p>
    </header>
    <div class="settings-actions-bar">
      <button type="button" class="btn btn-primary" data-settings-goto-iso>Ouvrir ISO &amp; Conformité</button>
      <button type="button" class="btn btn-secondary" data-settings-goto-products>Ouvrir Produits / FDS</button>
    </div>
  `;
  secE.querySelector('[data-settings-goto-iso]')?.addEventListener('click', () => goHash('iso'));
  secE.querySelector('[data-settings-goto-products]')?.addEventListener('click', () => goHash('products'));

  /* —— IA & validation —— */
  const IA_DEFAULTS = {
    iso: { enabled: true, mode: 'human' },
    imports: { enabled: true, mode: 'human' },
    audits: { enabled: true, mode: 'suggest' },
    risks: { enabled: false, mode: 'suggest' },
    aiCenter: { enabled: true, mode: 'suggest' }
  };
  let iaCfg = { ...IA_DEFAULTS, ...loadJson(LS_IA, {}) };
  const secF = document.createElement('section');
  secF.className = 'settings-section';
  secF.id = 'settings-anchor-ia';
  secF.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">F · IA &amp; validation humaine</p>
      <h4 class="settings-section__title">IA &amp; validation humaine</h4>
      <p class="settings-section__lead">
        L’IA propose ; l’humain valide, ajuste ou rejette. Les flux métiers (imports, NC, audits) restent sur leurs écrans —
        ce bloc fixe la politique affichée côté configuration.
      </p>
    </header>
    <div class="settings-ia-human-pattern">
      <span class="settings-badge-ia">Suggestion IA</span>
      <span class="settings-ia-human-pattern__cta">Valider · Modifier · Rejeter</span>
      <div class="settings-ia-state-strip">
        <span class="settings-ia-state-chip">En attente</span>
        <span class="settings-ia-state-chip">Validé</span>
        <span class="settings-ia-state-chip">Modifié</span>
        <span class="settings-ia-state-chip">Rejeté</span>
      </div>
    </div>
    <div class="settings-human-row" role="note">
      <span>Flux cible</span>
      <span style="color:var(--text3);font-weight:600">→</span>
      <span>Détection · contrôle humain · correction · vérification · clôture</span>
    </div>
    <div class="settings-ia-grid" data-settings-ia></div>
    <p class="settings-ia-states">
      <strong>Statuts de pilotage (maquette locale) :</strong>
      en attente · validé · modifié · rejeté — à synchroniser avec les workflows NC, imports et audits côté API.
    </p>
  `;
  const iaHost = secF.querySelector('[data-settings-ia]');
  const iaModules = [
    { key: 'iso', label: 'ISO & Conformité (assistance exigence)' },
    { key: 'imports', label: 'Import documents (extraction)' },
    { key: 'audits', label: 'Audits & constats' },
    { key: 'risks', label: 'Risques' },
    { key: 'aiCenter', label: 'Centre IA (simulations)' }
  ];
  function renderIaModules() {
    if (!iaHost) return;
    iaHost.replaceChildren();
    iaModules.forEach(({ key, label }) => {
      const base = IA_DEFAULTS[key] || { enabled: true, mode: 'human' };
      const cfg = {
        ...base,
        ...(typeof iaCfg[key] === 'object' && iaCfg[key] ? iaCfg[key] : {})
      };
      const box = document.createElement('div');
      box.className = 'settings-ia-module';
      const top = document.createElement('div');
      top.className = 'settings-ia-module__top';
      const h = document.createElement('p');
      h.className = 'settings-ia-module__name';
      h.textContent = label;
      const badge = document.createElement('span');
      badge.className = 'settings-badge-ia';
      badge.textContent = 'Suggestion IA';
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'settings-switch';
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', cfg.enabled ? 'true' : 'false');
      sw.setAttribute('aria-label', `Activer IA ${label}`);
      sw.addEventListener('click', () => {
        iaCfg = {
          ...iaCfg,
          [key]: { ...cfg, enabled: !cfg.enabled }
        };
        saveJson(LS_IA, iaCfg);
        renderIaModules();
      });
      top.append(h, badge, sw);
      const modes = document.createElement('div');
      modes.className = 'settings-mode-row';
      const modesDef = [
        ['suggest', 'Suggestion seule'],
        ['human', 'Validation humaine obligatoire']
      ];
      modesDef.forEach(([m, lab]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `settings-mode-btn${cfg.mode === m ? ' settings-mode-btn--on' : ''}`;
        b.textContent = lab;
        b.addEventListener('click', () => {
          iaCfg = { ...iaCfg, [key]: { ...cfg, mode: m } };
          saveJson(LS_IA, iaCfg);
          renderIaModules();
        });
        modes.append(b);
      });
      box.append(top, modes);
      iaHost.append(box);
    });
  }
  renderIaModules();

  /* —— Cycle contrôle & correction —— */
  let cycle = {
    controlRequired: true,
    correctionRequired: true,
    revalidateAfterFix: true,
    revalidateScope: 'full',
    showRejectedInViews: true,
    controllerRole: 'Responsable qualité',
    correctorRole: 'Opérationnel terrain',
    validatorRole: 'Direction / QHSE',
    ...loadJson(LS_CYCLE, {})
  };
  if (!cycle.revalidateScope || typeof cycle.revalidateScope !== 'string') {
    cycle = { ...cycle, revalidateScope: 'full' };
  }

  let cycleUsage = normalizeCycleUsage(loadJson(LS_CYCLE_USAGE, {}));

  const secG = document.createElement('section');
  secG.className = 'settings-section settings-section--cycle-premium';
  secG.id = 'settings-anchor-cycle';
  secG.innerHTML = `
    <header class="settings-section__head">
      <p class="settings-section__kicker">G · Phases de contrôle et correction</p>
      <h4 class="settings-section__title">Phases de contrôle et de correction</h4>
      <p class="settings-section__lead">
        Pilotage crédible : détection, <strong>contrôle humain</strong>, correction, vérification, clôture — pour
        <strong>prouver</strong> et <strong>décider</strong> sans sacrifier la traçabilité. Paramètres d’intention (local) prêts pour l’API.
      </p>
    </header>
    <div class="settings-cycle-parcours">
      <p class="settings-cycle-parcours__title">Parcours de maîtrise</p>
      <div class="settings-cycle-rail" role="img" aria-label="Cinq phases : détection, contrôle humain, correction, vérification, clôture">
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Détection</span>
          <span class="settings-cycle-rail__hint">Signaux, imports, IA</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Contrôle humain</span>
          <span class="settings-cycle-rail__hint">Revue &amp; arbitrage</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Correction</span>
          <span class="settings-cycle-rail__hint">Actions &amp; plans</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Vérification</span>
          <span class="settings-cycle-rail__hint">Preuves &amp; relecture</span>
        </div>
        <div class="settings-cycle-rail__step">
          <span class="settings-cycle-rail__dot" aria-hidden="true"></span>
          <span class="settings-cycle-rail__name">Clôture</span>
          <span class="settings-cycle-rail__hint">Validation finale</span>
        </div>
      </div>
    </div>
    <div class="settings-cycle-bridge">
      <p class="settings-cycle-bridge__title">Lecture transverse</p>
      <p class="settings-cycle-bridge__text">
        Les statuts <strong>à contrôler</strong>, <strong>à corriger</strong>, <strong>corrigé</strong>,
        <strong>à vérifier</strong>, <strong>validé</strong> et <strong>rejeté</strong> matérialisent l’avancement
        sur les flux IA, imports, extractions, écarts, audits et preuves — avec contrôle humain aux passages critiques.
      </p>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Applications par type d’usage</h5>
      <p class="settings-subsection__lead">
        Statut initial proposé à la création et obligation de passage humain (maquette locale — pas d’appel API).
      </p>
      <div class="settings-usage-matrix" data-settings-usage-matrix></div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Chaîne opératoire</h5>
      <p class="settings-subsection__lead">Repère visuel aligné sur les étapes du cycle de maîtrise.</p>
      <div class="settings-cycle-map" aria-hidden="true">
        <span class="settings-cycle-map__step">1 · Détection</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">2 · Contrôle humain</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">3 · Correction</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">4 · Vérification</span>
        <span class="settings-cycle-map__arrow">→</span>
        <span class="settings-cycle-map__step">5 · Clôture</span>
      </div>
      <div class="settings-cycle-stepper" role="list">
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Détection</p>
          <p class="settings-cycle-step__hint">Signaux, imports, IA, audits</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Contrôle humain</p>
          <p class="settings-cycle-step__hint">Revue &amp; arbitrage</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Correction</p>
          <p class="settings-cycle-step__hint">Plans d’actions</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Vérification</p>
          <p class="settings-cycle-step__hint">Preuves &amp; relecture</p>
        </div>
        <div class="settings-cycle-step" role="listitem">
          <p class="settings-cycle-step__label">Clôture</p>
          <p class="settings-cycle-step__hint">Validation finale</p>
        </div>
      </div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Règles globales du cycle</h5>
      <p class="settings-subsection__lead">Interrupteurs d’intention — exécution métier inchangée sur les pages existantes.</p>
      <div class="settings-prefs-grid" data-settings-cycle-toggles></div>
      <div class="settings-pref-row" data-settings-revalidate-scope-wrap style="margin-top:10px"></div>
      <div class="settings-show-reject-row">
        <span>Afficher le statut <strong>Rejeté</strong> dans les vues de suivi (listes, badges, exports futurs).</span>
        <button type="button" class="settings-switch" role="switch" data-settings-cycle-reject-switch aria-label="Afficher rejeté"></button>
      </div>
    </div>
    <div class="settings-subsection">
      <h5 class="settings-subsection__title">Rôles responsables (libellés indicatifs)</h5>
      <p class="settings-subsection__lead">Contrôle, correction et validation finale — à mapper sur vos rôles SI.</p>
      <div class="settings-prefs-grid" data-settings-cycle-roles></div>
    </div>
    <div class="settings-subsection">
      <p class="settings-status-pills__cap">Statuts de suivi</p>
      <div class="settings-status-legend settings-status-pills" data-settings-status-pills>
        <span class="settings-pill settings-pill--watch">À contrôler</span>
        <span class="settings-pill settings-pill--fix">À corriger</span>
        <span class="settings-pill settings-pill--done">Corrigé</span>
        <span class="settings-pill settings-pill--verify">À vérifier</span>
        <span class="settings-pill settings-pill--ok">Validé</span>
        <span class="settings-pill settings-pill--reject settings-pill--muted">Rejeté</span>
      </div>
    </div>
  `;

  const usageHost = secG.querySelector('[data-settings-usage-matrix]');
  function persistCycleUsage() {
    saveJson(LS_CYCLE_USAGE, cycleUsage);
  }
  function redrawUsageMatrix() {
    if (!usageHost) return;
    usageHost.replaceChildren();
    USAGE_FLOW_ROWS.forEach(({ key, title, hint }) => {
      const u = cycleUsage[key];
      const card = document.createElement('div');
      card.className = 'settings-usage-card';
      const h5 = document.createElement('p');
      h5.className = 'settings-usage-card__title';
      h5.textContent = title;
      const hp = document.createElement('p');
      hp.className = 'settings-usage-card__hint';
      hp.textContent = hint;

      const row1 = document.createElement('div');
      row1.className = 'settings-usage-card__row';
      const l1 = document.createElement('label');
      l1.htmlFor = `settings-usage-st-${key}`;
      l1.textContent = 'Statut initial cible';
      const sel = document.createElement('select');
      sel.id = `settings-usage-st-${key}`;
      sel.className = 'control-input';
      STATUS_OPTIONS.forEach(([v, t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = t;
        sel.append(o);
      });
      sel.value = u.defaultStatus;
      sel.addEventListener('change', () => {
        cycleUsage = {
          ...cycleUsage,
          [key]: { ...u, defaultStatus: sel.value }
        };
        persistCycleUsage();
        showToast('Paramètre enregistré (navigateur).', 'info');
      });
      row1.append(l1, sel);

      const row2 = document.createElement('div');
      row2.className = 'settings-usage-card__row';
      const l2 = document.createElement('span');
      l2.textContent = 'Contrôle humain requis avant diffusion';
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'settings-switch';
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', u.humanRequired ? 'true' : 'false');
      sw.setAttribute('aria-label', `Contrôle humain pour ${title}`);
      sw.addEventListener('click', () => {
        const next = !cycleUsage[key].humanRequired;
        cycleUsage = {
          ...cycleUsage,
          [key]: { ...cycleUsage[key], humanRequired: next }
        };
        sw.setAttribute('aria-checked', next ? 'true' : 'false');
        persistCycleUsage();
        showToast('Paramètre enregistré (navigateur).', 'info');
      });
      row2.append(l2, sw);

      card.append(h5, hp, row1, row2);
      usageHost.append(card);
    });
  }
  redrawUsageMatrix();

  const cToggles = secG.querySelector('[data-settings-cycle-toggles]');
  if (cToggles) {
    [['controlRequired', 'Contrôle humain obligatoire'], ['correctionRequired', 'Correction obligatoire'], ['revalidateAfterFix', 'Revalidation après correction']].forEach(
      ([k, lab]) => {
        const row = document.createElement('div');
        row.className = 'settings-pref-row';
        const span = document.createElement('span');
        span.textContent = lab;
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'settings-switch';
        sw.setAttribute('role', 'switch');
        sw.setAttribute(
          'aria-label',
          `${lab} — ${cycle[k] ? 'activé' : 'désactivé'}`
        );
        sw.setAttribute('aria-checked', !!cycle[k] ? 'true' : 'false');
        sw.addEventListener('click', () => {
          const next = !cycle[k];
          cycle = { ...cycle, [k]: next };
          sw.setAttribute('aria-checked', next ? 'true' : 'false');
          sw.setAttribute(
            'aria-label',
            `${lab} — ${next ? 'activé' : 'désactivé'}`
          );
          saveJson(LS_CYCLE, cycle);
          showToast('Paramètre cycle enregistré (navigateur).', 'info');
        });
        row.append(span, sw);
        cToggles.append(row);
      }
    );
  }

  const revScopeWrap = secG.querySelector('[data-settings-revalidate-scope-wrap]');
  if (revScopeWrap) {
    const lab = document.createElement('span');
    lab.style.maxWidth = '48ch';
    lab.style.lineHeight = '1.45';
    lab.innerHTML =
      '<strong style="color:var(--text)">Portée de la revalidation</strong> après correction <span style="opacity:.8;font-weight:500">(maquette locale)</span>';
    const sel = document.createElement('select');
    sel.className = 'control-input';
    sel.setAttribute('aria-label', 'Portée de la revalidation après correction');
    [
      ['full', 'Relecture complète des preuves'],
      ['targeted', 'Points sensibles uniquement'],
      ['procedural', 'Contrôle documentaire (sans terrain)']
    ].forEach(([v, t]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = t;
      sel.append(o);
    });
    sel.value =
      ['full', 'targeted', 'procedural'].includes(String(cycle.revalidateScope))
        ? String(cycle.revalidateScope)
        : 'full';
    sel.addEventListener('change', () => {
      cycle = { ...cycle, revalidateScope: sel.value };
      saveJson(LS_CYCLE, cycle);
      showToast('Portée de revalidation enregistrée (navigateur).', 'info');
    });
    revScopeWrap.append(lab, sel);
  }

  const rejectSw = secG.querySelector('[data-settings-cycle-reject-switch]');
  if (rejectSw) {
    rejectSw.setAttribute('aria-checked', cycle.showRejectedInViews !== false ? 'true' : 'false');
    rejectSw.addEventListener('click', () => {
      const next = !(cycle.showRejectedInViews !== false);
      cycle = { ...cycle, showRejectedInViews: next };
      rejectSw.setAttribute('aria-checked', next ? 'true' : 'false');
      saveJson(LS_CYCLE, cycle);
      showToast('Préférence enregistrée (navigateur).', 'info');
    });
  }

  const cRoles = secG.querySelector('[data-settings-cycle-roles]');
  if (cRoles) {
    [
      ['controllerRole', 'Rôle responsable du contrôle'],
      ['correctorRole', 'Rôle responsable de la correction'],
      ['validatorRole', 'Rôle validation / clôture']
    ].forEach(([k, lab]) => {
      const row = document.createElement('div');
      row.className = 'settings-pref-row';
      row.style.flexDirection = 'column';
      row.style.alignItems = 'stretch';
      const l = document.createElement('span');
      l.textContent = lab;
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'control-input';
      inp.value = String(cycle[k] || '');
      inp.addEventListener('change', () => {
        cycle = { ...cycle, [k]: inp.value };
        saveJson(LS_CYCLE, cycle);
      });
      row.append(l, inp);
      cRoles.append(row);
    });
  }

  page.append(hero, secA, secB, secC, secD, secH, secE, secF, secG);
  return page;
}
