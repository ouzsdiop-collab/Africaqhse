import { showToast } from '../components/toast.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import {
  loadSensitiveAccessConfig,
  loadSensitiveAccessPin,
  isSensitiveActionEnabled
} from '../data/sensitiveAccessConfig.js';
import { consumeDashboardIntent } from '../utils/dashboardNavigationIntent.js';
import { scheduleScrollIntoView } from '../utils/navScrollAnchor.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';
import { pageTopbarById } from '../data/navigation.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { ensureIsoPageStyles } from '../components/isoPageStyles.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { openComplianceAssistModal } from '../components/isoComplianceAssistPanel.js';
import { appState } from '../utils/state.js';
import { getSessionUser } from '../data/sessionUser.js';
import {
  activityLogStore,
  ENTITY_ISO_REQUIREMENT,
  AI_TRACE_TYPE,
  AI_TRACE_ACTOR_IA,
  buildAiSuggestionJournalEntry
} from '../data/activityLog.js';
import { buildIsoRequirementHistoryTimeline } from '../utils/isoRequirementHistory.js';
import {
  fetchControlledDocumentsFromApi,
  mergeControlledDocumentRows,
  computeDocumentRegistrySummary,
  refreshDocComplianceNotifications
} from '../services/documentRegistry.service.js';
import { buildIsoAuditReport } from '../services/isoAuditReport.service.js';
import { openIsoAuditReportModal } from '../components/isoAuditReportPanel.js';
import {
  getIsoTerrainSnapshot,
  invalidateIsoTerrainSnapshotCache,
  computeTerrainLinksForRequirement
} from '../services/isoTerrainLinks.service.js';
import {
  getRequirements,
  getNormById,
  setRequirementStatus,
  computeComplianceSummary,
  refreshConformityStatusCacheFromApi,
  DOCUMENT_ATTENTION,
  AUDITS_TO_SCHEDULE,
  CONFORMITY_NORMS,
  getImportedDocumentProofs,
  addImportedDocumentProof
} from '../data/conformityStore.js';
import {
  computeAuditReadiness,
  createAuditReadinessBanner,
  updateAuditReadinessBanner
} from '../components/isoAuditReadiness.js';
import { buildIsoCopilotSuggestions } from '../components/isoCopilotSuggestions.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
/* Préférences colonnes table exigences ISO : localStorage centralisé dans isoTablePreferences.js */
import { readIsoReqColumnMode, LS_ISO_REQ_TABLE_COLS } from '../utils/isoTablePreferences.js';
import { mountPageViewModeSwitch } from '../utils/pageViewMode.js';
import { ISO_REQ_STATUS_EN_FR, isoRequirementStatusNormKey } from '../utils/isoRequirementStatus.js';
import { computeIsoScore } from '../utils/isoScore.js';

function buildIsoNormScoresForPdf() {
  const reqs = getRequirements();
  const globalPct = computeComplianceSummary().pct;
  /** @type {Map<string, { pts: number; n: number }>} */
  const byNorm = new Map();
  for (const r of reqs) {
    const nid = r.normId || 'iso9001';
    if (!byNorm.has(nid)) byNorm.set(nid, { pts: 0, n: 0 });
    const b = byNorm.get(nid);
    b.n += 1;
    const k = isoRequirementStatusNormKey(r.status);
    if (k === 'conforme') b.pts += 100;
    else if (k === 'partiel') b.pts += 50;
  }
  return CONFORMITY_NORMS.map((norm) => {
    const b = byNorm.get(norm.id);
    const score = b && b.n > 0 ? Math.round(b.pts / b.n) : globalPct;
    return { norm: norm.code, score };
  });
}

function requirementLinesForIsoPdf() {
  const mapSt = (s) => {
    const k = isoRequirementStatusNormKey(s);
    return k === 'conforme' ? 'Conforme' : k === 'partiel' ? 'Partiel' : 'Non conforme';
  };
  return getRequirements().slice(0, 40).map((r) => ({
    clause: r.clause,
    title: r.title,
    status: mapSt(r.status)
  }));
}

/** Normes : cartes allégées (statut + une phrase). */
const NORMS_LITE = [
  {
    id: 'ISO 9001',
    status: 'Sous contrôle',
    badge: 'amber',
    line: 'Réserves mineures : plan qualité en cours.'
  },
  {
    id: 'ISO 14001',
    status: 'Conforme',
    badge: 'green',
    line: 'Dernier audit interne sans écart majeur.'
  },
  {
    id: 'ISO 45001',
    status: 'À surveiller',
    badge: 'amber',
    line: 'Point habilitations : clôture visée mi-avril.'
  }
];

const REVIEW_PREP = [
  { label: 'Incidents', value: '4', detail: '3 clos · 1 analyse en cours (terrain nord)' },
  { label: 'Audits', value: '2', detail: '1 interne planifié · 1 surveillance ISO' },
  { label: 'Actions', value: '12', detail: '7 en retard < 15 j · 5 dans les délais' },
  { label: 'Indicateurs', value: '8/10', detail: '2 indicateurs en attente de consolidation groupe' }
];

/**
 * @param {'conforme'|'partiel'|'non_conforme'} st
 */
function conformityBadgeClass(st) {
  if (st === 'conforme') return 'green';
  if (st === 'partiel') return 'amber';
  return 'red';
}

/**
 * @param {'conforme'|'partiel'|'non_conforme'} st
 */
function conformityLabel(st) {
  if (st === 'conforme') return 'Conforme';
  if (st === 'partiel') return 'Partiel';
  return 'Non conforme';
}

function isoRequirementBadgeClass(raw) {
  return conformityBadgeClass(isoRequirementStatusNormKey(raw));
}

function isoRequirementStatusDisplayLabel(raw) {
  const s = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/-/g, '_');
  if (ISO_REQ_STATUS_EN_FR[s]) return ISO_REQ_STATUS_EN_FR[s];
  return conformityLabel(isoRequirementStatusNormKey(raw));
}

function formatIsoDateShort(v) {
  if (!v) return 'Non disponible';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'Non disponible' : d.toLocaleDateString('fr-FR');
}

/**
 * @param {'valide'|'a_renouveler'|'expire'|'sans_echeance'|string} st
 */
function docComplianceBadgeClass(st) {
  if (st === 'valide') return 'green';
  if (st === 'a_renouveler') return 'amber';
  if (st === 'expire') return 'red';
  return 'blue';
}

/**
 * @param {(entry: { module: string; action: string; detail?: string; user?: string }) => void} [onAddLog]
 */
async function openDocUpdateAction(row, onAddLog) {
  const [{ openActionCreateDialog }, { fetchUsers }] = await Promise.all([
    import('../components/actionCreateDialog.js'),
    import('../services/users.service.js')
  ]);
  const users = await fetchUsers().catch(() => []);
  const isoReqRef =
    row.isoRequirementRef != null && String(row.isoRequirementRef).trim()
      ? String(row.isoRequirementRef).trim()
      : '';
  openActionCreateDialog({
    users,
    defaults: {
      title: `Mise à jour document : ${row.name}`,
      origin: 'other',
      actionType: 'corrective',
      priority: row.complianceStatus === 'expire' ? 'critique' : 'haute',
      description: `Renouveler ou réviser le document « ${row.name} » (statut : ${row.complianceLabel || row.complianceStatus}). Réf. document ${row.id}.${isoReqRef ? ` Exigence ISO : ${isoReqRef}.` : ''}`
    },
    builtInSuccessToast: false,
    onCreated: (payload) => {
      showToast('Action enregistrée.', 'success', {
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
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'iso',
          action: 'Action créée depuis document maîtrisé',
          detail: isoReqRef ? `${row.name} → ${isoReqRef}` : row.name,
          user: getSessionUser()?.name || 'Utilisateur',
          ...(isoReqRef
            ? {
                entityType: ENTITY_ISO_REQUIREMENT,
                requirementId: isoReqRef,
                isoHistoryKind: 'action_linked'
              }
            : {})
        });
      }
    }
  });
}

function activeSiteLabel() {
  const u = getSessionUser();
  const name = u?.defaultSite?.name || u?.siteName || appState?.currentSite;
  const s = name != null ? String(name).trim() : '';
  return s || 'Tous sites';
}

function normHeaderLabel() {
  // Écran ISO consolidé: on affiche les 3 normes, sans changer la navigation.
  return 'ISO 45001 / ISO 14001 / ISO 9001';
}

/**
 * Action directe depuis une exigence ISO (sans IA, sans backend spécifique).
 * @param {{ id: string; clause: string; title: string; summary?: string; normId: string; owner?: string; evidence?: string; status?: string }} req
 * @param {(entry: { module: string; action: string; detail?: string; user?: string }) => void} [onAddLog]
 */
async function openIsoRequirementActionCreate(req, onAddLog) {
  const [{ openActionCreateDialog }, { fetchUsers }] = await Promise.all([
    import('../components/actionCreateDialog.js'),
    import('../services/users.service.js')
  ]);
  const users = await fetchUsers().catch(() => []);
  const norm = getNormById(req.normId);
  const normCode = norm ? norm.code : req.normId;
  const stKey = isoRequirementStatusNormKey(req.status);
  openActionCreateDialog({
    users,
    defaults: {
      title: `ISO ${normCode} - ${req.clause} ${req.title}`,
      origin: 'other',
      actionType: 'corrective',
      priority: stKey === 'non_conforme' ? 'haute' : stKey === 'partiel' ? 'moyenne' : 'basse',
      description: [
        `Exigence: ${req.clause} - ${req.title} (${normCode}).`,
        req.summary ? `Résumé: ${req.summary}` : '',
        req.owner ? `Pilote: ${req.owner}.` : '',
        req.evidence ? `Preuves attendues (référentiel): ${req.evidence}.` : ''
      ]
        .filter(Boolean)
        .join(' ')
        .replaceAll('—', '-')
        .replaceAll('–', '-')
    },
    builtInSuccessToast: true,
    onCreated: () => {
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'iso',
          action: 'Action créée depuis exigence',
          detail: `${req.clause} - ${req.title}`,
          user: getSessionUser()?.name || 'Utilisateur'
        });
      }
    }
  });
}

/**
 * @param {(entry: { module: string; action: string; detail?: string; user?: string }) => void} [onAddLog]
 */
function relanceDocResponsable(row, onAddLog) {
  const who =
    row.responsible && String(row.responsible).trim() ? String(row.responsible).trim() : 'le responsable désigné';
  showToast(`Relance enregistrée pour ${who} : ${row.name}`, 'info');
  const entry = {
    module: 'iso',
    action: 'Relance responsable document',
    detail: `${row.name} → ${who}`,
    user: getSessionUser()?.name || 'Utilisateur'
  };
  activityLogStore.add(entry);
  if (typeof onAddLog === 'function') onAddLog(entry);
}

function createDocumentStateSummaryBlock() {
  const root = document.createElement('div');
  root.className = 'iso-doc-state-summary';
  root.setAttribute('aria-label', 'État documentaire');
  function update(summary) {
    const pct = summary.pctValide == null ? 'Non disponible' : `${summary.pctValide} %`;
    root.innerHTML = `
      <div class="iso-doc-state-summary__head">
        <span class="iso-doc-state-summary__title">État documentaire</span>
        <span class="iso-doc-state-summary__hint">Documents avec échéance</span>
      </div>
      <div class="iso-doc-state-summary__grid">
        <div class="iso-doc-state-summary__metric">
          <span class="iso-doc-state-summary__val iso-doc-state-summary__val--ok">${escapeHtml(pct)}</span>
          <span class="iso-doc-state-summary__lbl">Valides</span>
        </div>
        <div class="iso-doc-state-summary__metric">
          <span class="iso-doc-state-summary__val iso-doc-state-summary__val--warn">${String(summary.aRenouveler)}</span>
          <span class="iso-doc-state-summary__lbl">À renouveler</span>
        </div>
        <div class="iso-doc-state-summary__metric">
          <span class="iso-doc-state-summary__val iso-doc-state-summary__val--bad">${String(summary.expire)}</span>
          <span class="iso-doc-state-summary__lbl">Expirés</span>
        </div>
      </div>
    `;
  }
  update(computeDocumentRegistrySummary([]));
  return { root, update };
}

/** Ouvre le volet Documents (second niveau) avant scroll : liens depuis priorités / bannières. */
function ensureIsoDocsPanelOpen() {
  const wrap = document.querySelector('.iso-page .iso-l2-disclosure--docs');
  if (wrap instanceof HTMLDetailsElement) wrap.open = true;
}

function createIsoRegistryComplianceBanner() {
  const root = document.createElement('div');
  root.className = 'iso-registry-doc-impact';
  root.hidden = true;
  function update(summary) {
    if (!summary || summary.expire === 0) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    root.innerHTML = `
      <div class="iso-registry-doc-impact__inner">
        <span class="badge red">Impact conformité</span>
        <p class="iso-registry-doc-impact__text">
          <strong>${summary.expire} document(s) expiré(s)</strong> : risque pour les preuves audit. Consolidez la version courante dans la section Documents.
        </p>
        <button type="button" class="text-button iso-registry-doc-impact__link">Voir les documents</button>
      </div>
    `;
    root.querySelector('.iso-registry-doc-impact__link')?.addEventListener('click', () => {
      ensureIsoDocsPanelOpen();
      document.querySelector('.iso-page .iso-docs-hub-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  return { root, update };
}

/**
 * @param {{ getRows: () => object[]; onAddLog?: (e: object) => void }} opts
 */
function createControlledDocumentsTableSection(opts) {
  const { getRows, onAddLog } = opts;
  const wrap = document.createElement('div');
  wrap.className = 'iso-table-wrap';

  function render() {
    const rows = getRows();
    wrap.replaceChildren();
    if (!rows.length) {
      const es = createEmptyState(
        '\u{1F4CE}',
        'Aucun document dans le registre maîtrisé',
        'Les lignes synchronisées depuis l’API s’affichent ici. Vous pouvez aussi joindre des preuves depuis « Documents & preuves ».',
        'Voir documents & preuves',
        () => {
          ensureIsoDocsPanelOpen();
          document.querySelector('.iso-page .iso-docs-hub-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      );
      es.classList.add('empty-state--iso-doc-table');
      wrap.append(es);
      return;
    }
    const table = document.createElement('div');
    table.className = 'iso-table iso-doc-table';
    const head = document.createElement('div');
    head.className = 'iso-table-head';
    head.innerHTML = `
      <span>Document</span>
      <span>Type</span>
      <span>Création</span>
      <span>Màj</span>
      <span>Expiration</span>
      <span>Responsable</span>
      <span>Statut</span>
      <span>Actions</span>
    `;
    table.append(head);
    rows.forEach((row) => {
      const st = row.complianceStatus || 'sans_echeance';
      const line = document.createElement('div');
      line.className = 'iso-table-row';
      const name = document.createElement('span');
      name.className = 'iso-cell-strong';
      name.textContent = row.name;
      const type = document.createElement('span');
      type.className = 'iso-cell-muted';
      type.textContent = row.type || 'Non renseigné';
      const c0 = document.createElement('span');
      c0.className = 'iso-cell-muted';
      c0.textContent = formatIsoDateShort(row.createdAt);
      const c1 = document.createElement('span');
      c1.className = 'iso-cell-muted';
      c1.textContent = formatIsoDateShort(row.updatedAt);
      const c2 = document.createElement('span');
      c2.className = 'iso-cell-muted';
      c2.textContent = formatIsoDateShort(row.expiresAt);
      const resp = document.createElement('span');
      resp.className = 'iso-cell-muted';
      resp.textContent =
        row.responsible && String(row.responsible).trim() ? row.responsible : 'Non renseigné';
      const stCell = document.createElement('span');
      stCell.className = 'iso-doc-status-cell';
      const badge = document.createElement('span');
      badge.className = `badge ${docComplianceBadgeClass(st)} iso-doc-compliance-badge iso-doc-compliance--${st}`;
      badge.textContent = row.complianceLabel || 'Non disponible';
      stCell.append(badge);
      const actCell = document.createElement('span');
      actCell.className = 'iso-doc-actions-cell';
      const stack = document.createElement('div');
      stack.className = 'iso-doc-row-actions';
      const b1 = document.createElement('button');
      b1.type = 'button';
      b1.className = 'btn btn-secondary iso-doc-action-btn';
      b1.textContent = 'Créer action de mise à jour';
      b1.addEventListener('click', (e) => {
        e.stopPropagation();
        void openDocUpdateAction(row, onAddLog);
      });
      const b2 = document.createElement('button');
      b2.type = 'button';
      b2.className = 'btn btn-secondary iso-doc-action-btn';
      b2.textContent = 'Relancer responsable';
      b2.addEventListener('click', (e) => {
        e.stopPropagation();
        relanceDocResponsable(row, onAddLog);
      });
      stack.append(b1, b2);
      actCell.append(stack);
      line.append(name, type, c0, c1, c2, resp, stCell, actCell);
      table.append(line);
    });
    wrap.append(table);
  }

  render();
  return { root: wrap, refresh: render };
}

/**
 * Analyse locale heuristique (navigateur) : mots-clés + hachage stable sur le nom de fichier.
 * @param {string} fileName
 */
function simulateIsoImportAnalysis(fileName) {
  const name = String(fileName || 'document');
  const lower = name.toLowerCase();
  const reqs = getRequirements();
  if (!reqs.length) {
    return {
      docTypeLabel: 'Document',
      requirementId: '',
      keyPoints: ['Aucune exigence chargée.'],
      gaps: ['Chargez le registre ou réessayez.'],
      confidenceNote: 'Proposition locale. À valider par un responsable.'
    };
  }
  let best = reqs[0];
  let score = -1;
  const rules = [
    { re: /audit|contrôle|vérification/i, boost: (r) => (String(r.clause).includes('9') ? 4 : 2) },
    { re: /environnement|déchet|aspect|impact/i, boost: (r) => (r.normId === 'iso14001' ? 5 : 0) },
    { re: /sst|santé|sécurité|risque|habilitation|incident/i, boost: (r) => (r.normId === 'iso45001' ? 5 : 0) },
    { re: /qualité|nc|correct|process|indicateur/i, boost: (r) => (r.normId === 'iso9001' ? 4 : 1) },
    { re: /mesure|étalon|calibr|instrument/i, boost: (r) => (String(r.clause).includes('7.1.5') ? 6 : 0) },
    { re: /formation|compétence/i, boost: (r) => (String(r.clause).includes('7.2') ? 5 : 0) }
  ];
  reqs.forEach((r) => {
    let s = 0;
    const hay = `${r.title} ${r.summary} ${r.evidence} ${r.clause}`.toLowerCase();
    rules.forEach(({ re, boost }) => {
      if (re.test(lower) || re.test(name)) s += boost(r);
      if (re.test(hay)) s += 1;
    });
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    if ((h + r.clause.length) % 7 === 0) s += 1;
    if (s > score) {
      score = s;
      best = r;
    }
  });
  if (score <= 0) {
    const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % reqs.length;
    best = reqs[idx];
  }
  const norm = getNormById(best.normId);
  const types = ['Procédure opérationnelle', 'Registre / enregistrement', 'Plan de management', 'Instruction', 'Politique', 'Fiche de données'];
  const docTypeLabel = types[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % types.length];
  const keyPoints = [
    `Type probable : ${docTypeLabel}. À confirmer après lecture humaine.`,
    `Rattachement suggéré : ${best.clause} : ${best.title} (${norm ? norm.code : best.normId}).`,
    'Contrôler version, diffusion contrôlée et cohérence avec le SMS.'
  ];
  const gaps = [];
  if (!/sign|visa|approuv|valid/i.test(lower)) {
    gaps.push(
      'Aucune mention explicite de signature ou validation détectée sur le nom de fichier. Vérifiez le PDF.'
    );
  }
  if (/brouillon|draft|copie|old|ancien/i.test(lower)) {
    gaps.push('Intitulé pouvant indiquer un brouillon ou une version non maîtrisée.');
  }
  if (gaps.length === 0) {
    gaps.push('Vérifier la correspondance exacte avec la preuve attendue dans le référentiel.');
  }
  return {
    docTypeLabel,
    requirementId: best.id,
    keyPoints,
    gaps,
    confidenceNote:
      'Analyse locale (sans envoi serveur). Validez, corrigez le rattachement ou rejetez avant enregistrement.'
  };
}

/**
 * @param {object} params
 * @param {string} params.fileName
 * @param {ReturnType<typeof simulateIsoImportAnalysis>} analysis
 * @param {(payload: { requirementId: string; proofStatus: 'present'|'verify'|'missing'; validatedBy?: string }) => void} onValidate
 * @param {() => void} onReject
 */
function openIsoImportReviewOverlay({ fileName, analysis, onValidate, onReject }) {
  const existing = document.querySelector('.iso-import-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'iso-import-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'iso-import-dialog-title');

  const dialog = document.createElement('div');
  dialog.className = 'iso-import-dialog card-soft';

  const reqs = getRequirements();
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      close();
      onReject();
    }
  };
  document.addEventListener('keydown', onKey);

  dialog.innerHTML = `
    <div class="iso-import-dialog-head content-card-head">
      <div>
        <div class="section-kicker">Import documentaire</div>
        <h3 id="iso-import-dialog-title">Revue avant rattachement</h3>
        <p class="content-card-lead iso-import-file-label"></p>
      </div>
    </div>
    <div class="iso-import-body">
      <div class="iso-import-block">
        <div class="iso-import-block-title">Type de document (indicatif)</div>
        <p class="iso-import-type-value"></p>
      </div>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Exigence ISO cible</div>
        <label class="field"><span>Choisir l’exigence</span>
          <select class="control-select iso-import-req-select"></select>
        </label>
      </div>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Points clés</div>
        <ul class="iso-import-list iso-import-keypoints"></ul>
      </div>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Manques ou points d’attention</div>
        <ul class="iso-import-list iso-import-gaps"></ul>
      </div>
      <p class="iso-import-note"></p>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Validé par (optionnel)</div>
        <input type="text" class="control-input iso-import-validated-by" placeholder="Nom, fonction (terrain)" autocomplete="name" />
      </div>
      <div class="iso-import-block">
        <div class="iso-import-block-title">Statut preuve après validation</div>
        <div class="iso-import-proof-radios">
          <label class="iso-import-radio"><input type="radio" name="iso-import-proof" value="present" checked /> Présent</label>
          <label class="iso-import-radio"><input type="radio" name="iso-import-proof" value="verify" /> À vérifier</label>
          <label class="iso-import-radio"><input type="radio" name="iso-import-proof" value="missing" /> Manquant</label>
        </div>
      </div>
    </div>
    <div class="iso-import-actions">
      <button type="button" class="btn btn-primary iso-import-validate">Valider le rattachement</button>
      <button type="button" class="btn btn-secondary iso-import-reject">Rejeter</button>
    </div>
  `;

  const fileLabel = dialog.querySelector('.iso-import-file-label');
  if (fileLabel) fileLabel.textContent = `Fichier : ${fileName}`;

  const typeVal = dialog.querySelector('.iso-import-type-value');
  if (typeVal) typeVal.textContent = analysis.docTypeLabel;

  const sel = dialog.querySelector('.iso-import-req-select');
  if (sel) {
    reqs.forEach((r) => {
      const norm = getNormById(r.normId);
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.clause} : ${r.title} (${norm ? norm.code : r.normId})`;
      sel.append(opt);
    });
    sel.value = analysis.requirementId || reqs[0].id;
  }

  const kp = dialog.querySelector('.iso-import-keypoints');
  if (kp) {
    analysis.keyPoints.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      kp.append(li);
    });
  }
  const gp = dialog.querySelector('.iso-import-gaps');
  if (gp) {
    analysis.gaps.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      gp.append(li);
    });
  }
  const note = dialog.querySelector('.iso-import-note');
  if (note) {
    note.className = 'iso-import-note';
    note.textContent = analysis.confidenceNote || '';
  }

  dialog.querySelector('.iso-import-validate')?.addEventListener('click', () => {
    const requirementId = sel?.value || '';
    const proofEl = dialog.querySelector('input[name="iso-import-proof"]:checked');
    const proofStatus =
      proofEl?.value === 'missing' || proofEl?.value === 'verify' ? proofEl.value : 'present';
    const validatedBy = String(dialog.querySelector('.iso-import-validated-by')?.value || '').trim();
    if (!requirementId) {
      showToast('Choisissez une exigence.', 'warning');
      return;
    }
    close();
    onValidate({ requirementId, proofStatus, validatedBy });
  });

  dialog.querySelector('.iso-import-reject')?.addEventListener('click', () => {
    close();
    onReject();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
      onReject();
    }
  });

  overlay.append(dialog);
  document.body.append(overlay);
  sel?.focus();
}

function importedProofStatusLabel(st) {
  if (st === 'missing') return 'Manquant';
  if (st === 'verify') return 'À vérifier';
  return 'Présent';
}

function formatEvidenceWithImports(baseEvidence, requirementId) {
  const base = String(baseEvidence || 'Non disponible');
  const links = getImportedDocumentProofs().filter((p) => p.requirementId === requirementId);
  const ico =
    links.length === 0
      ? '❌ '
      : links.some((p) => p.proofStatus === 'present')
        ? '📎 '
        : '⚠ ';
  if (!links.length) return `${ico}${base}`;
  const extra = links.map((p) => {
    const v = p.validatedBy ? ` · validé ${p.validatedBy}` : '';
    return `· ${p.fileName} (${importedProofStatusLabel(p.proofStatus)})${v}`;
  });
  return `${ico}${base}\n${extra.join('\n')}`;
}

/**
 * @param {ReturnType<typeof computeIsoScore>} s
 */
function createGlobalSnapshot(s) {
  const wrap = document.createElement('div');
  wrap.className = `iso-global-snapshot iso-global-snapshot--${s.globalTone}`;
  wrap.innerHTML = `
    <div class="iso-global-snapshot-inner">
      <div class="iso-global-score" aria-label="Score ISO consolidé">
        <span class="iso-global-pct">${s.pct}</span>
        <span class="iso-global-pct-suffix">%</span>
        <div class="iso-global-score-caption">score ISO consolidé</div>
        <div class="iso-global-score-legacy" aria-label="Référence statuts seuls"></div>
      </div>
      <div class="iso-global-copy">
        <div class="iso-global-label">${escapeHtml(s.globalLabel)}</div>
        <p class="iso-global-message">${escapeHtml(s.message)}</p>
        <div class="iso-global-meta" aria-hidden="true"></div>
        <details class="iso-global-score-details">
          <summary class="iso-global-score-details-sum">Pourquoi ce score ?</summary>
          <ul class="iso-global-score-breakdown" aria-label="Détail du calcul"></ul>
        </details>
      </div>
    </div>
  `;
  const meta = wrap.querySelector('.iso-global-meta');
  if (meta) {
    meta.textContent = `${s.ok} conforme(s) · ${s.partial} partiel(le)(s) · ${s.nonOk} non conforme(s)`;
  }
  const leg = wrap.querySelector('.iso-global-score-legacy');
  if (leg) {
    leg.textContent = `Réf. statuts seuls : ${s.legacyPct} % · volet terrain ~${s.operationalPct} %`;
  }
  const ul = wrap.querySelector('.iso-global-score-breakdown');
  if (ul) {
    ul.replaceChildren();
    for (const b of s.breakdown) {
      const li = document.createElement('li');
      const pctLabel = b.pct != null ? `${b.pct} %` : '—';
      li.innerHTML = `<strong>${escapeHtml(b.label)}</strong> <span class="iso-global-score-br-pct">${escapeHtml(pctLabel)}</span><span class="iso-global-score-br-detail">${escapeHtml(b.detail)}</span>`;
      ul.append(li);
    }
  }
  return wrap;
}

/**
 * @param {HTMLElement} el
 * @param {ReturnType<typeof computeIsoScore>} s
 */
function updateGlobalSnapshot(el, s) {
  el.className = `iso-global-snapshot iso-global-snapshot--${s.globalTone}`;
  const pct = el.querySelector('.iso-global-pct');
  const label = el.querySelector('.iso-global-label');
  const message = el.querySelector('.iso-global-message');
  const meta = el.querySelector('.iso-global-meta');
  const leg = el.querySelector('.iso-global-score-legacy');
  if (pct) pct.textContent = String(s.pct);
  if (label) label.textContent = s.globalLabel;
  if (message) message.textContent = s.message;
  if (meta) meta.textContent = `${s.ok} conforme(s) · ${s.partial} partiel(le)(s) · ${s.nonOk} non conforme(s)`;
  if (leg) {
    leg.textContent = `Réf. statuts seuls : ${s.legacyPct} % · volet terrain ~${s.operationalPct} %`;
  }
  const ul = el.querySelector('.iso-global-score-breakdown');
  if (ul) {
    ul.replaceChildren();
    for (const b of s.breakdown) {
      const li = document.createElement('li');
      const pctLabel = b.pct != null ? `${b.pct} %` : '—';
      li.innerHTML = `<strong>${escapeHtml(b.label)}</strong> <span class="iso-global-score-br-pct">${escapeHtml(pctLabel)}</span><span class="iso-global-score-br-detail">${escapeHtml(b.detail)}</span>`;
      ul.append(li);
    }
  }
}

/**
 * @param {{
 *   id: string;
 *   status: string;
 *   badge: string;
 *   line: string;
 *   title?: string;
 *   statsTotal?: number;
 *   statsNonOk?: number;
 *   cockpitPct?: number;
 *   cockpitLevelLabel?: string;
 *   cockpitLevelClass?: string;
 *   docsMissingCount?: number;
 *   auditLine?: string;
 *   strictNcCount?: number;
 * }} norm
 */
function createNormCardLite(norm) {
  const card = document.createElement('article');
  card.className = 'iso-norm-card iso-norm-card--lite iso-norm-card--hero';
  const top = document.createElement('div');
  top.className = 'iso-norm-card-top';
  const id = document.createElement('span');
  id.className = 'iso-norm-id';
  id.textContent = norm.id;
  const badge = document.createElement('span');
  badge.className = `badge ${norm.badge}`;
  badge.textContent = norm.status;
  top.append(id, badge);
  card.append(top);
  if (norm.title) {
    const t = document.createElement('h4');
    t.className = 'iso-norm-title';
    t.textContent = norm.title;
    card.append(t);
  }
  const line = document.createElement('p');
  line.className = 'iso-norm-line';
  line.textContent = norm.line;
  card.append(line);
  if (norm.statsTotal != null && norm.cockpitPct == null) {
    const hint = document.createElement('p');
    hint.className = 'iso-norm-hint';
    const ok = norm.statsTotal - (norm.statsNonOk ?? 0);
    hint.textContent =
      norm.statsNonOk && norm.statsNonOk > 0
        ? `${norm.statsTotal} exigence(s) suivie(s) · ${norm.statsNonOk} en écart · ${ok} au vert`
        : `${norm.statsTotal} exigence(s) suivie(s) · aucun écart sur ce référentiel`;
    card.append(hint);
  }
  if (norm.cockpitPct != null) {
    const m = document.createElement('div');
    m.className = 'iso-norm-cockpit-metrics';
    const rowScore = document.createElement('div');
    rowScore.className = 'iso-norm-metric-row';
    const lblScore = document.createElement('span');
    lblScore.className = 'iso-norm-metric-label';
    lblScore.textContent = 'Score conformité';
    const valScore = document.createElement('span');
    valScore.className = 'iso-norm-metric-val';
    valScore.textContent = `${norm.cockpitPct} %`;
    rowScore.append(lblScore, valScore);
    const rowStat = document.createElement('div');
    rowStat.className = 'iso-norm-metric-row';
    const lblStat = document.createElement('span');
    lblStat.className = 'iso-norm-metric-label';
    lblStat.textContent = 'Pilotage';
    const pill = document.createElement('span');
    pill.className = `badge ${norm.cockpitLevelClass || 'amber'}`;
    pill.textContent = norm.cockpitLevelLabel || 'Non disponible';
    rowStat.append(lblStat, pill);
    const rowNc = document.createElement('div');
    rowNc.className = 'iso-norm-metric-row';
    const lblNc = document.createElement('span');
    lblNc.className = 'iso-norm-metric-label';
    lblNc.textContent = 'Exigences non conformes';
    const valNc = document.createElement('span');
    valNc.className = 'iso-norm-metric-val iso-norm-metric-val--muted';
    const ncShown =
      norm.strictNcCount != null ? norm.strictNcCount : norm.statsNonOk != null ? norm.statsNonOk : 0;
    valNc.textContent = String(ncShown);
    rowNc.append(lblNc, valNc);
    const rowDoc = document.createElement('div');
    rowDoc.className = 'iso-norm-metric-row';
    const lblDoc = document.createElement('span');
    lblDoc.className = 'iso-norm-metric-label';
    lblDoc.textContent = 'Documents manquants (indic.)';
    const valDoc = document.createElement('span');
    valDoc.className = 'iso-norm-metric-val iso-norm-metric-val--muted';
    valDoc.textContent = String(norm.docsMissingCount ?? 0);
    rowDoc.append(lblDoc, valDoc);
    const rowAud = document.createElement('div');
    rowAud.className = 'iso-norm-metric-row iso-norm-metric-row--audit';
    const lblAud = document.createElement('span');
    lblAud.className = 'iso-norm-metric-label';
    lblAud.textContent = 'Audits liés';
    const valAud = document.createElement('span');
    valAud.className = 'iso-norm-audit-line';
    valAud.textContent = norm.auditLine || 'Non disponible';
    rowAud.append(lblAud, valAud);
    m.append(rowScore, rowStat, rowNc, rowDoc, rowAud);
    card.append(m);
  }
  if (typeof norm?.onExportPremium === 'function') {
    const actions = document.createElement('div');
    actions.className = 'iso-norm-card-actions';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-secondary btn-sm';
    btn.textContent = 'Exporter PDF premium';
    btn.title = norm?.exportPremiumTitle || 'Rapport premium (backend) : pilotage + exigences + preuves';
    btn.addEventListener('click', () => void norm.onExportPremium());
    actions.append(btn);
    card.append(actions);
  }
  return card;
}

/**
 * @param {HTMLElement} host
 * @param {{ id: string; clause?: string; title?: string }} row
 */
function paintIsoRequirementHistory(host, row) {
  host.replaceChildren();
  const items = buildIsoRequirementHistoryTimeline(String(row.id), row);
  if (!items.length) {
    const p = document.createElement('p');
    p.className = 'iso-req-history-empty';
    p.textContent = 'Aucun événement enregistré pour cette exigence.';
    host.append(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'iso-req-history-list';
  for (const it of items.slice(0, 24)) {
    const li = document.createElement('li');
    li.className = 'iso-req-history-item';
    const kind = document.createElement('span');
    kind.className = 'iso-req-history-kind';
    kind.textContent = it.label;
    const meta = document.createElement('span');
    meta.className = 'iso-req-history-meta';
    meta.textContent = `${new Date(it.at).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })} — ${it.user}`;
    const det = document.createElement('span');
    det.className = 'iso-req-history-detail';
    det.textContent = it.detail;
    li.append(kind, meta, det);
    ul.append(li);
  }
  host.append(ul);
}

/**
 * @param {Record<string, unknown>} data — réponse brute POST /api/compliance/analyze-assist
 */
function fallbackIsoAnalysisPayload(data) {
  const st = /** @type {string} */ (data?.suggestedStatus || 'partiel');
  const pri = st === 'non_conforme' ? 'high' : st === 'partiel' ? 'medium' : 'low';
  return {
    type: 'iso_analysis',
    confidence: 0.42,
    content: {
      statusAnalysis: String(
        data?.explanation || 'Réponse sans champ isoAnalysis — serveur à mettre à jour ou mode dégradé.'
      ),
      missingEvidence: [],
      recommendedActions: Array.isArray(data?.recommendedActions) ? [...data.recommendedActions] : [],
      priority: pri,
      terrainLinks: {
        risks: [],
        incidents: [],
        summary: 'Liens risques/incidents non fournis dans cette réponse.'
      }
    }
  };
}

/**
 * Bloc « Analyse IA » par ligne (appel moteur interne + JSON structuré isoAnalysis).
 * @param {HTMLElement} exigenceHost
 * @param {Record<string, unknown>} row
 * @param {string} normCode
 * @param {{
 *   getDocumentRows?: () => object[];
 *   onAddLog?: (e: object) => void;
 *   afterComplianceApply?: () => void;
 * }} ctx
 */
function mountIsoRowAiAnalysis(exigenceHost, row, normCode, ctx) {
  const wrap = document.createElement('div');
  wrap.className = 'iso-req-ai';
  const head = document.createElement('div');
  head.className = 'iso-req-ai-head';
  const title = document.createElement('span');
  title.className = 'iso-req-ai-title';
  title.textContent = 'Analyse IA';
  const runBtn = document.createElement('button');
  runBtn.type = 'button';
  runBtn.className = 'btn btn-secondary btn-sm iso-req-ai-run';
  runBtn.textContent = 'Lancer l’analyse';
  head.append(title, runBtn);
  const panel = document.createElement('div');
  panel.className = 'iso-req-ai-panel';
  panel.hidden = true;
  panel.setAttribute('aria-live', 'polite');
  wrap.append(head, panel);
  exigenceHost.append(wrap);

  function priorityLabel(p) {
    if (p === 'high') return 'Priorité élevée';
    if (p === 'medium') return 'Priorité moyenne';
    return 'Priorité faible';
  }

  function paintAnalysis(panelEl, iso, rawApi) {
    panelEl.replaceChildren();
    const content = iso?.content || {};
    const conf =
      typeof iso?.confidence === 'number' && Number.isFinite(iso.confidence)
        ? Math.round(iso.confidence * 100)
        : null;
    const pri = /** @type {'high'|'medium'|'low'} */ (content.priority || 'low');

    const meta = document.createElement('div');
    meta.className = 'iso-req-ai-meta';
    const badge = document.createElement('span');
    badge.className = `iso-req-ai-prio iso-req-ai-prio--${pri}`;
    badge.textContent = priorityLabel(pri);
    meta.append(badge);
    if (conf != null) {
      const cspan = document.createElement('span');
      cspan.className = 'iso-req-ai-conf';
      cspan.textContent = `Confiance moteur ${conf} %`;
      meta.append(cspan);
    }
    panelEl.append(meta);

    if (content.statusAnalysis) {
      const p = document.createElement('p');
      p.className = 'iso-req-ai-status';
      p.textContent = String(content.statusAnalysis);
      panelEl.append(p);
    }

    const miss = Array.isArray(content.missingEvidence) ? content.missingEvidence : [];
    if (miss.length) {
      const h = document.createElement('p');
      h.className = 'iso-req-ai-subh';
      h.textContent = 'Preuves / écarts signalés';
      const ul = document.createElement('ul');
      ul.className = 'iso-req-ai-list';
      miss.forEach((t) => {
        const li = document.createElement('li');
        li.textContent = String(t);
        ul.append(li);
      });
      panelEl.append(h, ul);
    }

    const acts = Array.isArray(content.recommendedActions) ? content.recommendedActions : [];
    if (acts.length) {
      const h = document.createElement('p');
      h.className = 'iso-req-ai-subh';
      h.textContent = 'Actions recommandées';
      const ul = document.createElement('ul');
      ul.className = 'iso-req-ai-list';
      acts.forEach((t) => {
        const li = document.createElement('li');
        li.textContent = String(t);
        ul.append(li);
      });
      panelEl.append(h, ul);
    }

    const tl = content.terrainLinks && typeof content.terrainLinks === 'object' ? content.terrainLinks : {};
    const risks = Array.isArray(tl.risks) ? tl.risks : [];
    const incs = Array.isArray(tl.incidents) ? tl.incidents : [];
    if (tl.summary || risks.length || incs.length) {
      const h = document.createElement('p');
      h.className = 'iso-req-ai-subh';
      h.textContent = 'Risques & incidents (aperçu)';
      panelEl.append(h);
      if (tl.summary) {
        const sum = document.createElement('p');
        sum.className = 'iso-req-ai-terrain-sum';
        sum.textContent = String(tl.summary);
        panelEl.append(sum);
      }
      const rowLinks = document.createElement('div');
      rowLinks.className = 'iso-req-ai-terrain-actions';
      risks.slice(0, 3).forEach((r) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-secondary btn-sm';
        b.textContent = `Risque : ${r.title ? String(r.title).slice(0, 42) : r.ref || '…'}`;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          qhseNavigate('risks', {
            skipDefaults: true,
            scrollToId: 'risks-register-anchor',
            focusRiskTitle: r.title || String(row.clause),
            source: 'iso_row_ai'
          });
        });
        rowLinks.append(b);
      });
      incs.slice(0, 3).forEach((i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-secondary btn-sm';
        b.textContent = `Incident ${i.ref || ''}`.trim();
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          qhseNavigate('incidents', {
            skipDefaults: true,
            scrollToId: 'incidents-recent-list',
            ...(i.ref ? { focusIncidentRef: String(i.ref) } : { focusIncidentHintTitle: String(row.clause) }),
            source: 'iso_row_ai'
          });
        });
        rowLinks.append(b);
      });
      if (rowLinks.childElementCount) panelEl.append(rowLinks);
    }

    const foot = document.createElement('p');
    foot.className = 'iso-req-ai-foot';
    foot.textContent = String(
      rawApi?.disclaimer ||
        'Suggestion indicative : validation humaine obligatoire avant toute décision de conformité.'
    );
    panelEl.append(foot);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'iso-req-ai-apply-row';
    const suggested = rawApi?.suggestedStatus;
    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'btn btn-primary btn-sm iso-req-ai-apply';
    applyBtn.textContent = 'Appliquer';
    const canApply =
      suggested === 'conforme' || suggested === 'partiel' || suggested === 'non_conforme';
    const unchanged = suggested === row.status;
    applyBtn.disabled = !canApply || unchanged;
    applyBtn.title = unchanged
      ? 'Le statut suggéré est déjà celui du registre.'
      : `Enregistrer le statut suggéré : ${conformityLabel(isoRequirementStatusNormKey(/** @type {'conforme'|'partiel'|'non_conforme'} */ (suggested)))}`;

    applyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void (async () => {
        if (!canApply || suggested === row.status) return;
        const gateOk = await ensureSensitiveAccess('critical_validation', {
          contextLabel: 'application du statut suggéré par l’analyse ISO (ligne registre)'
        });
        if (!gateOk) {
          showToast('Application annulée.', 'info');
          return;
        }
        const saved = await setRequirementStatus(String(row.id), /** @type {'conforme'|'partiel'|'non_conforme'} */ (suggested));
        if (!saved) {
          showToast('Synchronisation impossible. Statut inchangé.', 'warning');
          return;
        }
        showToast(`Statut appliqué : ${conformityLabel(isoRequirementStatusNormKey(/** @type {'conforme'|'partiel'|'non_conforme'} */ (suggested)))}.`, 'success');
        if (typeof ctx.onAddLog === 'function') {
          ctx.onAddLog({
            module: 'iso',
            action: 'Statut exigence appliqué depuis analyse IA (ligne)',
            detail: `${row.id} → ${suggested}`,
            user: getSessionUser()?.name || 'Utilisateur',
            entityType: ENTITY_ISO_REQUIREMENT,
            requirementId: String(row.id),
            isoHistoryKind: 'status_changed'
          });
        }
        ctx.afterComplianceApply?.();
        applyBtn.disabled = true;
      })();
    });
    actionsRow.append(applyBtn);
    panelEl.append(actionsRow);
  }

  runBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    void (async () => {
      runBtn.disabled = true;
      panel.hidden = false;
      panel.textContent = 'Analyse en cours…';
      try {
        const docs = typeof ctx.getDocumentRows === 'function' ? ctx.getDocumentRows() : [];
        const res = await qhseFetch('/api/compliance/analyze-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requirement: {
              id: row.id,
              normId: row.normId,
              normCode,
              clause: row.clause,
              title: row.title,
              summary: row.summary,
              evidence: row.evidence,
              currentStatus: row.status
            },
            controlledDocuments: docs.map((d) => ({
              name: d.name,
              version: d.version || 'Non renseigné'
            })),
            siteId: appState.activeSiteId ?? null
          })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          panel.replaceChildren();
          const err = document.createElement('p');
          err.className = 'iso-req-ai-error';
          err.textContent = String(data?.error || `Erreur ${res.status}`);
          panel.append(err);
          return;
        }
        const iso = data?.isoAnalysis && data.isoAnalysis.type === 'iso_analysis' ? data.isoAnalysis : fallbackIsoAnalysisPayload(data);
        paintAnalysis(panel, iso, data);
      } catch {
        panel.replaceChildren();
        const err = document.createElement('p');
        err.className = 'iso-req-ai-error';
        err.textContent = 'Réseau indisponible.';
        panel.append(err);
      } finally {
        runBtn.disabled = false;
      }
    })();
  });
}

/**
 * @param {{
 *   onAnalyze: (row: Record<string, unknown> & { normCode: string }) => void;
 *   refreshTable: () => void;
 *   getDocumentRows?: () => object[];
 *   reloadTerrainLinks?: () => void;
 *   onAddLog?: (e: object) => void;
 *   afterComplianceApply?: () => void;
 * }} ctx
 * @param {{ root: HTMLElement; update: (s: ReturnType<typeof computeDocumentRegistrySummary>) => void }} registryDocImpact
 */
function createRequirementsTable(ctx, registryDocImpact) {
  const wrap = document.createElement('div');
  wrap.className = 'iso-table-wrap iso-table-wrap--req';

  /** @type {'all'|'gap'|'partial'|'nc'|'ok'} */
  let statusFilter = 'all';
  let isoReqColMode = readIsoReqColumnMode();

  const filterHost = document.createElement('div');
  filterHost.className = 'iso-req-filter-bar qhse-filter-strip';
  filterHost.setAttribute('role', 'group');
  filterHost.setAttribute('aria-label', 'Filtrer les exigences par statut');

  const filterPrimary = document.createElement('div');
  filterPrimary.className = 'qhse-filter-strip__primary';

  const mkFilterBtn = (key, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary iso-req-filter-btn';
    b.dataset.filter = key;
    b.textContent = label;
    b.addEventListener('click', () => {
      statusFilter = key;
      filterHost.querySelectorAll('.iso-req-filter-btn').forEach((el) => {
        el.classList.toggle('iso-req-filter-btn--active', el.dataset.filter === key);
      });
      renderRows();
    });
    return b;
  };
  const fAll = mkFilterBtn('all', 'Toutes');
  const fGap = mkFilterBtn('gap', 'Écarts');
  const fOk = mkFilterBtn('ok', 'Conformes');
  const fPartial = mkFilterBtn('partial', 'Partiels');
  const fNc = mkFilterBtn('nc', 'Non conformes');
  fAll.classList.add('iso-req-filter-btn--active');

  const filterAdv = document.createElement('details');
  filterAdv.className = 'qhse-filter-advanced';
  const filterAdvSum = document.createElement('summary');
  filterAdvSum.className = 'qhse-filter-advanced__summary';
  filterAdvSum.textContent = 'Filtres fins (partiel / NC seule)';
  const filterAdvBody = document.createElement('div');
  filterAdvBody.className = 'qhse-filter-advanced__body';
  filterAdvBody.append(fPartial, fNc);
  filterAdv.append(filterAdvSum, filterAdvBody);

  filterPrimary.append(fAll, fGap, fOk);
  filterHost.append(filterPrimary, filterAdv);

  const table = document.createElement('div');
  table.className =
    'iso-table iso-req-table qhse-data-table' +
    (isoReqColMode === 'full' ? ' qhse-data-table--full' : ' qhse-data-table--essential');

  const head = document.createElement('div');
  head.className = 'iso-table-head';
  [
    ['Exigence', false],
    ['Statut', false],
    ['Action', false],
    ['Resp.', true],
    ['Preuve', true]
  ].forEach(([text, adv]) => {
    const sp = document.createElement('span');
    sp.textContent = text;
    if (adv) sp.classList.add('qhse-col-adv');
    head.append(sp);
  });
  table.append(head);

  const isoToolbar = document.createElement('div');
  isoToolbar.className = 'iso-req-toolbar';
  const isoToolbarMeta = document.createElement('span');
  isoToolbarMeta.className = 'qhse-table-toolbar__meta';
  isoToolbarMeta.textContent =
    'Par défaut : exigence, statut, action. Sous chaque exigence : liens terrain, historique, bloc Analyse IA (JSON structuré côté API). Responsable et preuve dans « Colonnes complètes » ou au détail.';
  const isoColBtn = document.createElement('button');
  isoColBtn.type = 'button';
  isoColBtn.className = 'btn btn-secondary btn-sm';
  isoColBtn.setAttribute('aria-pressed', isoReqColMode === 'full' ? 'true' : 'false');
  isoColBtn.textContent = isoReqColMode === 'full' ? 'Vue compacte' : 'Colonnes complètes';
  isoColBtn.addEventListener('click', () => {
    isoReqColMode = isoReqColMode === 'full' ? 'essential' : 'full';
    try {
      localStorage.setItem(LS_ISO_REQ_TABLE_COLS, isoReqColMode);
    } catch {
      /* ignore */
    }
    isoColBtn.setAttribute('aria-pressed', isoReqColMode === 'full' ? 'true' : 'false');
    isoColBtn.textContent = isoReqColMode === 'full' ? 'Vue compacte' : 'Colonnes complètes';
    table.className =
      'iso-table iso-req-table qhse-data-table' +
      (isoReqColMode === 'full' ? ' qhse-data-table--full' : ' qhse-data-table--essential');
  });
  isoToolbar.append(isoToolbarMeta, isoColBtn);

  /** @type {Awaited<ReturnType<typeof getIsoTerrainSnapshot>> | null} */
  let terrainSnap = null;
  let terrainLoadGen = 0;

  function getDocRowsForTerrain() {
    return typeof ctx.getDocumentRows === 'function' ? ctx.getDocumentRows() : [];
  }

  function paintTerrainRow(line, row, snap) {
    const host = line.querySelector('[data-iso-terrain]');
    if (!host) return;
    host.replaceChildren();
    const hint = document.createElement('span');
    hint.className = 'iso-terrain-links-hint';
    hint.textContent = 'Terrain (indicatif) · liaison texte / réf. ISO';
    host.append(hint);

    const docs = getDocRowsForTerrain();
    const info = computeTerrainLinksForRequirement(row, snap, docs);
    const { navHints } = info;

    const mkBadge = (label, count, onNavigate, opts = {}) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className =
        'iso-terrain-badge' + (count > 0 && onNavigate ? '' : ' iso-terrain-badge--muted');
      b.textContent = `${label} ${count}`;
      if (count > 0 && onNavigate) {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          onNavigate();
        });
      } else {
        b.disabled = true;
      }
      if (opts.title) b.title = opts.title;
      return b;
    };

    const badges = document.createElement('div');
    badges.className = 'iso-terrain-badges';

    badges.append(
      mkBadge('Risques', info.riskCount, () =>
        qhseNavigate('risks', {
          skipDefaults: true,
          scrollToId: 'risks-register-anchor',
          focusRiskTitle: navHints.riskTitle || `${row.clause} ${row.title}`,
          source: 'iso_terrain_links'
        })
      ),
      mkBadge('Incidents', info.incidentCount, () =>
        qhseNavigate('incidents', {
          skipDefaults: true,
          scrollToId: 'incidents-recent-list',
          ...(navHints.incidentRef
            ? { focusIncidentRef: navHints.incidentRef }
            : { focusIncidentHintTitle: `${row.clause} ${row.title}` }),
          source: 'iso_terrain_links'
        })
      ),
      mkBadge('Actions ouv.', info.openActionCount, () =>
        qhseNavigate('actions', {
          skipDefaults: true,
          scrollToId: 'qhse-actions-col-overdue',
          ...(navHints.actionId
            ? { focusActionId: navHints.actionId }
            : { focusActionTitle: `${row.clause} ${row.title}` }),
          source: 'iso_terrain_links'
        })
      ),
      mkBadge('Audits', info.auditCount, () =>
        qhseNavigate('audits', {
          skipDefaults: true,
          scrollToId: 'audit-cockpit-tier-score',
          ...(navHints.auditRef ? { focusAuditRef: navHints.auditRef } : {}),
          source: 'iso_terrain_links'
        }),
        {
          title:
            info.recentAudits.length > 0
              ? info.recentAudits.map((a) => a.ref).join(', ')
              : 'Aucun audit lié par texte'
        }
      ),
      mkBadge(
        'Docs',
        info.documentCount,
        info.documentCount > 0
          ? () => {
              ensureIsoDocsPanelOpen();
              window.requestAnimationFrame(() => {
                document.getElementById('iso-docs-priority-anchor')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              });
            }
          : null
      )
    );

    host.append(badges);

    if (info.recentAudits.length > 0) {
      const audLine = document.createElement('div');
      audLine.className = 'iso-terrain-audit-mini';
      const refs = info.recentAudits
        .map((a) => a.ref)
        .filter(Boolean)
        .slice(0, 3)
        .join(' · ');
      audLine.textContent = `Audits récents : ${refs}`;
      host.append(audLine);
    }
  }

  function renderRows() {
    table.querySelectorAll('.iso-table-row').forEach((el) => el.remove());
    let rows = getRequirements();
    if (statusFilter === 'gap') rows = rows.filter((r) => isoRequirementStatusNormKey(r.status) !== 'conforme');
    else if (statusFilter === 'partial') rows = rows.filter((r) => isoRequirementStatusNormKey(r.status) === 'partiel');
    else if (statusFilter === 'nc') rows = rows.filter((r) => isoRequirementStatusNormKey(r.status) === 'non_conforme');
    else if (statusFilter === 'ok') rows = rows.filter((r) => isoRequirementStatusNormKey(r.status) === 'conforme');
    rows.forEach((row) => {
      const norm = getNormById(row.normId);
      const normCode = norm ? norm.code : row.normId;

      const line = document.createElement('div');
      line.className = 'iso-table-row iso-table-row--interactive';
      line.dataset.isoRequirementId = row.id;
      line.tabIndex = 0;
      line.setAttribute(
        'aria-label',
        `Ouvrir le détail : ${row.clause} ${row.title}`
      );
      const stClass = isoRequirementBadgeClass(row.status);
      const badgeLabel = isoRequirementStatusDisplayLabel(row.status);

      const exigence = document.createElement('span');
      exigence.className = 'iso-cell-strong';
      exigence.append(
        document.createTextNode(`${row.clause} : ${row.title}`),
        document.createElement('br')
      );
      const normSmall = document.createElement('span');
      normSmall.className = 'iso-cell-muted iso-cell-small';
      normSmall.textContent = normCode;
      const terrainHost = document.createElement('div');
      terrainHost.className = 'iso-terrain-links';
      terrainHost.setAttribute('data-iso-terrain', String(row.id));
      const historyDetails = document.createElement('details');
      historyDetails.className = 'iso-req-history';
      const historySum = document.createElement('summary');
      historySum.className = 'iso-req-history-summary';
      historySum.textContent = 'Historique';
      const historyBody = document.createElement('div');
      historyBody.className = 'iso-req-history-body';
      historyDetails.append(historySum, historyBody);
      exigence.append(normSmall, terrainHost, historyDetails);
      paintTerrainRow(line, row, terrainSnap);
      paintIsoRequirementHistory(historyBody, row);
      mountIsoRowAiAnalysis(exigence, row, normCode, ctx);

      const statCell = document.createElement('span');
      statCell.className = 'iso-req-status-cell';
      const badgeEl = document.createElement('span');
      badgeEl.className = `badge ${stClass} iso-req-status-badge`;
      badgeEl.textContent = badgeLabel;
      statCell.append(badgeEl);

      const assistCell = document.createElement('span');
      assistCell.className = 'iso-req-action-cell';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary iso-analyze-btn';
      btn.textContent = 'Traiter';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        ctx.onAnalyze({ ...row, normCode });
      });
      assistCell.append(btn);

      const openRow = () => ctx.onAnalyze({ ...row, normCode });
      line.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        if (e.target.closest('.iso-req-history')) return;
        if (e.target.closest('.iso-req-ai')) return;
        openRow();
      });
      line.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.iso-req-history')) return;
          if (e.target.closest('.iso-req-ai')) return;
          e.preventDefault();
          openRow();
        }
      });

      const owner = document.createElement('span');
      owner.className = 'iso-cell-muted qhse-col-adv';
      owner.textContent = row.owner;

      const proof = document.createElement('span');
      proof.className = 'iso-cell-muted iso-evidence-cell qhse-col-adv';
      proof.style.whiteSpace = 'pre-line';
      proof.textContent = formatEvidenceWithImports(row.evidence, row.id);

      line.append(exigence, statCell, assistCell, owner, proof);
      table.append(line);
    });
  }

  async function loadTerrainIfNeeded() {
    const g = ++terrainLoadGen;
    try {
      const snap = await getIsoTerrainSnapshot();
      if (g !== terrainLoadGen) return;
      terrainSnap = snap;
    } catch {
      if (g !== terrainLoadGen) return;
      terrainSnap = null;
    }
    renderRows();
  }

  renderRows();
  void loadTerrainIfNeeded();

  ctx.refreshTable = () => {
    renderRows();
  };

  ctx.reloadTerrainLinks = () => {
    invalidateIsoTerrainSnapshotCache();
    terrainSnap = null;
    renderRows();
    void loadTerrainIfNeeded();
  };
  wrap.append(registryDocImpact.root, filterHost, isoToolbar, table);
  return wrap;
}


/**
 * Liste documents critiques / manquants / obsolètes + zone repliable pour la liste complète.
 * @param {{ refreshPilotage?: () => void }} pilotageCtx
 * @param {(payload: { module: string; action: string; detail?: string; user?: string }) => void} [onAddLog]
 * @param {{ root: HTMLElement; refresh: () => void }} docTableSection
 */
function createDocumentsPrioritySection(pilotageCtx, onAddLog, docTableSection) {
  const root = document.createElement('div');
  root.id = 'iso-docs-priority-anchor';
  root.className = 'iso-docs-priority';

  const importBar = document.createElement('div');
  importBar.className = 'iso-doc-import-bar iso-doc-proof-dropzone';
  const importLead = document.createElement('p');
  importLead.className = 'iso-doc-import-lead';
  importLead.textContent =
    'Joindre une preuve : fichier lié à une exigence ISO (traitement dans le navigateur). Glisser-déposer ou parcourir.';
  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'btn btn-secondary iso-doc-import-btn';
  importBtn.textContent = 'Joindre une preuve';
  const preview = document.createElement('p');
  preview.className = 'iso-doc-import-preview';
  preview.setAttribute('aria-live', 'polite');
  preview.hidden = true;
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.className = 'iso-doc-import-file';
  fileInput.setAttribute('aria-label', 'Choisir un fichier à joindre comme preuve');
  fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.csv,application/pdf';
  fileInput.hidden = true;

  importBtn.addEventListener('click', () => fileInput.click());

  /** @type {string} */
  let preferredRequirementId = '';

  function runImportPipeline(file) {
    if (!file) return;
    preview.hidden = false;
    preview.textContent = `Fichier sélectionné : ${file.name}`;
    importBar.classList.add('iso-doc-proof-dropzone--active');
    importBtn.disabled = true;
    showToast('Traitement du document en cours (analyse locale)…', 'info');
    window.setTimeout(() => {
      importBtn.disabled = false;
    const analysis = simulateIsoImportAnalysis(file.name);
    if (preferredRequirementId) {
      analysis.requirementId = preferredRequirementId;
      preferredRequirementId = '';
    }
      openIsoImportReviewOverlay({
        fileName: file.name,
        analysis,
        onValidate: ({ requirementId, proofStatus, validatedBy }) => {
          void (async () => {
            if (
              !(await ensureSensitiveAccess('confidential_document', {
                contextLabel: 'validation de l’import et rattachement de preuve'
              }))
            ) {
              return;
            }
            addImportedDocumentProof({
              fileName: file.name,
              requirementId,
              proofStatus,
              docTypeLabel: analysis.docTypeLabel,
              keyPoints: analysis.keyPoints,
              gaps: analysis.gaps,
              validatedBy: validatedBy || ''
            });
            showToast('Document rattaché à l’exigence. Preuve enregistrée localement.', 'success');
            if (typeof onAddLog === 'function') {
              const actor = validatedBy || getSessionUser()?.name || 'Utilisateur';
              const validated = Boolean(String(validatedBy || '').trim());
              onAddLog({
                module: 'iso',
                action:
                  proofStatus === 'present' && validated
                    ? 'Preuve validée (import)'
                    : 'Preuve ajoutée (import)',
                detail: `${file.name} → ${requirementId} (${proofStatus})`,
                user: actor,
                entityType: ENTITY_ISO_REQUIREMENT,
                requirementId,
                isoHistoryKind:
                  proofStatus === 'present' && validated ? 'proof_validated' : 'proof_added'
              });
            }
            if (typeof pilotageCtx.refreshPilotage === 'function') pilotageCtx.refreshPilotage();
            importBar.classList.remove('iso-doc-proof-dropzone--active');
            preview.hidden = true;
          })();
        },
        onReject: () => {
          showToast('Import annulé.', 'info');
          importBar.classList.remove('iso-doc-proof-dropzone--active');
          preview.hidden = true;
        }
      });
    }, 620);
  }

  ['dragenter', 'dragover'].forEach((ev) => {
    importBar.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      importBar.classList.add('iso-doc-proof-dropzone--drag');
    });
  });
  ['dragleave', 'drop'].forEach((ev) => {
    importBar.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      importBar.classList.remove('iso-doc-proof-dropzone--drag');
    });
  });
  importBar.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) runImportPipeline(f);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    runImportPipeline(file);
  });

  importBar.append(importLead, importBtn, preview, fileInput);

  const listWrap = document.createElement('div');
  listWrap.className = 'iso-doc-attention-list';

  function renderAttention() {
    listWrap.replaceChildren();
    listWrap.className = 'iso-doc-attention-list iso-doc-attention-list--unified';
    const { critical, missing, obsolete } = DOCUMENT_ATTENTION;
    /** @type {{ badge: string; badgeClass: string; d: (typeof missing)[0] }[]} */
    const flat = [
      ...missing.map((d) => ({ badge: 'Manquant', badgeClass: 'red', d })),
      ...obsolete.map((d) => ({ badge: 'À vérifier', badgeClass: 'amber', d })),
      ...critical.map((d) => ({ badge: 'Critique', badgeClass: 'red', d }))
    ];
    if (!flat.length) {
      const p = document.createElement('p');
      p.className = 'iso-doc-attention-empty';
      p.textContent = 'Aucune pièce prioritaire signalée pour ce site.';
      listWrap.append(p);
      return;
    }
    flat.forEach(({ badge, badgeClass, d }) => {
      const row = document.createElement('div');
      row.className = 'iso-doc-attention-row iso-doc-attention-row--unified';
      const top = document.createElement('div');
      top.className = 'iso-doc-attention-row-top';
      const st = document.createElement('span');
      st.className = `badge ${badgeClass} iso-doc-attention-status-badge`;
      st.textContent = badge;
      const name = document.createElement('strong');
      name.textContent = d.name + (d.version ? ` · v${d.version}` : '');
      top.append(st, name);
      const note = document.createElement('p');
      note.className = 'iso-doc-attention-note';
      note.textContent = d.note;
      row.append(top, note);
      listWrap.append(row);
    });
  }

  renderAttention();

  const toggleFull = document.createElement('button');
  toggleFull.type = 'button';
  toggleFull.className = 'btn btn-secondary iso-toggle-full-docs';
  toggleFull.setAttribute('aria-expanded', 'false');
  toggleFull.textContent = 'Voir tous les documents maîtrisés';

  const fullWrap = document.createElement('div');
  fullWrap.className = 'iso-req-full-wrap';
  fullWrap.hidden = true;
  fullWrap.append(docTableSection.root);

  toggleFull.addEventListener('click', () => {
    const open = fullWrap.hidden;
    fullWrap.hidden = !open;
    toggleFull.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggleFull.textContent = open ? 'Masquer la liste complète' : 'Voir tous les documents maîtrisés';
  });

  root.append(importBar, listWrap, toggleFull, fullWrap);
  return {
    root,
    renderAttention,
    /**
     * Ouvre le flux "Joindre une preuve" en pré-sélectionnant une exigence.
     * @param {string} requirementId
     */
    openAttachProofForRequirement(requirementId) {
      preferredRequirementId = String(requirementId || '').trim();
      fileInput.click();
    }
  };
}

function createComplianceCycleStrip() {
  const wrap = document.createElement('div');
  wrap.className = 'iso-compliance-cycle';
  wrap.setAttribute('aria-label', 'Phases de contrôle et correction');
  const steps = ['Détection', 'Contrôle', 'Correction', 'Vérification', 'Clôture'];
  steps.forEach((label, i) => {
    const s = document.createElement('div');
    s.className = 'iso-compliance-cycle-step';
    const num = document.createElement('span');
    num.className = 'iso-cycle-num';
    num.textContent = String(i + 1);
    const lbl = document.createElement('span');
    lbl.className = 'iso-cycle-label';
    lbl.textContent = label;
    s.append(num, lbl);
    wrap.append(s);
  });
  const cap = document.createElement('p');
  cap.className = 'iso-compliance-cycle-cap';
  cap.textContent =
    'Exigences, documents et écarts suivent ce cycle. Décision et validation humaines à chaque étape.';
  wrap.append(cap);
  return wrap;
}

/**
 * @param {(row: Record<string, unknown> & { normCode: string }) => void} onAnalyze
 */
/** @param {(row: object) => void} onAnalyze @param {() => object} [getIsoScoreInput] */
function createPrioritiesCockpitBlock(onAnalyze, getIsoScoreInput) {
  const root = document.createElement('article');
  root.id = 'iso-cockpit-priorities-anchor';
  root.className = 'content-card card-soft iso-cockpit-priorities';
  root.setAttribute('aria-labelledby', 'iso-cockpit-prio-title');

  const head = document.createElement('div');
  head.className = 'content-card-head';
  head.innerHTML = `
    <div>
      <div class="section-kicker">Pilotage</div>
      <h3 id="iso-cockpit-prio-title">Priorités à traiter</h3>
      <p class="content-card-lead">Exigences en écart, pièces à consolider, audits à caler. Une action principale par sujet.</p>
    </div>
  `;

  const list = document.createElement('div');
  list.className = 'iso-cockpit-prio-list iso-cockpit-prio-list--unified';

  function appendPriorityRow(title, detail, ctaLabel, onCta) {
    const row = document.createElement('div');
    row.className = 'iso-priority-item';
    const main = document.createElement('div');
    main.className = 'iso-priority-item-main';
    const t = document.createElement('div');
    t.className = 'iso-priority-item-title';
    t.textContent = title;
    const d = document.createElement('p');
    d.className = 'iso-priority-item-detail';
    d.textContent = detail;
    main.append(t, d);
    const actions = document.createElement('div');
    actions.className = 'iso-priority-item-actions';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-primary iso-priority-cta';
    b.textContent = ctaLabel;
    b.addEventListener('click', onCta);
    actions.append(b);
    row.append(main, actions);
    list.append(row);
  }

  function refresh() {
    list.replaceChildren();
    const reqsNc = getRequirements().filter((r) => isoRequirementStatusNormKey(r.status) === 'non_conforme');
    const reqsOpen = getRequirements().filter((r) => isoRequirementStatusNormKey(r.status) !== 'conforme');
    const ar = computeAuditReadiness(
      typeof getIsoScoreInput === 'function' ? getIsoScoreInput() : {}
    );
    const firstNc = reqsNc[0];
    const hero = document.createElement('div');
    hero.className = 'iso-priority-hero';
    let hTitle = 'Priorité principale';
    let hDetail = 'Consolider exigences et preuves avant la prochaine visite audit.';
    /** @type {() => void} */
    let hOn = () => {
      ensureIsoDocsPanelOpen();
      document.querySelector('.iso-page .iso-docs-priority')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    };
    if (firstNc) {
      hTitle = 'Non-conformité majeure à traiter immédiatement';
      const norm = getNormById(firstNc.normId);
      hDetail = `${firstNc.clause} : ${firstNc.title} (${norm ? norm.code : firstNc.normId}).`;
      hOn = () => onAnalyze({ ...firstNc, normCode: norm ? norm.code : firstNc.normId });
    } else if (ar.missingDocsCount > 0) {
      hTitle = 'Documents manquants : risque pour l’audit';
      hDetail = `${ar.missingDocsCount} pièce(s) signalée(s). Joignez les preuves au registre.`;
    } else if (ar.readiness === 'fragile') {
      hDetail = ar.message;
    }
    hero.innerHTML = `
      <div class="iso-priority-hero-main">
        <span class="iso-priority-hero-k">À traiter en premier</span>
        <strong class="iso-priority-hero-title"></strong>
        <p class="iso-priority-hero-detail"></p>
      </div>
    `;
    const ht = hero.querySelector('.iso-priority-hero-title');
    const hd = hero.querySelector('.iso-priority-hero-detail');
    if (ht) ht.textContent = hTitle;
    if (hd) hd.textContent = hDetail;
    const hb = document.createElement('button');
    hb.type = 'button';
    hb.className = 'btn btn-primary iso-priority-hero-cta';
    hb.textContent = 'Traiter maintenant';
    hb.addEventListener('click', hOn);
    hero.querySelector('.iso-priority-hero-main')?.append(hb);
    list.append(hero);

    const { missing, obsolete, critical } = DOCUMENT_ATTENTION;
    const docLines = [];
    missing.forEach((d) => docLines.push({ tag: 'Manquant', name: d.name, note: d.note }));
    obsolete.forEach((d) =>
      docLines.push({
        tag: 'À vérifier',
        name: d.name + (d.version ? ` · v${d.version}` : ''),
        note: d.note
      })
    );
    critical.forEach((d) =>
      docLines.push({
        tag: 'Critique',
        name: d.name + (d.version ? ` · v${d.version}` : ''),
        note: d.note
      })
    );

    const firstOpen = reqsOpen[0];
    appendPriorityRow(
      'Exigences en écart',
      reqsOpen.length
        ? `${reqsOpen.length} exigence(s) partielle(s) ou non conforme(s) sur le registre.`
        : 'Aucune exigence en écart sur le périmètre suivi.',
      'Traiter',
      () => {
        if (firstOpen) {
          const norm = getNormById(firstOpen.normId);
          onAnalyze({ ...firstOpen, normCode: norm ? norm.code : firstOpen.normId });
        } else {
          showToast('Aucun écart à traiter sur le registre.', 'info');
        }
      }
    );

    const docDetail =
      docLines.length === 0
        ? 'Aucune pièce prioritaire signalée.'
        : `${docLines.length} pièce(s) : ${docLines[0].name} (${docLines[0].tag})${
            docLines.length > 1 ? ` · +${docLines.length - 1} autre(s)` : ''
          }`;
    appendPriorityRow('Documents & preuves', docDetail, 'Ouvrir documents', () => {
      ensureIsoDocsPanelOpen();
      document.querySelector('.iso-page .iso-docs-priority')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const audDetail = AUDITS_TO_SCHEDULE.length
      ? AUDITS_TO_SCHEDULE.map((a) => `· ${a.title} : ${a.horizon}`).join('\n')
      : 'Aucune échéance planifiée sur le périmètre affiché.';
    appendPriorityRow('Audits à planifier', audDetail, 'Voir Audits', () => {
      qhseNavigate('audits');
      showToast('Module Audits.', 'info');
    });

    const ncForList = reqsNc[0];
    const ncDetail = ncForList
      ? `${ncForList.clause} : ${ncForList.title} (non-conformité à traiter en priorité).`
      : 'Aucune non-conformité stricte ouverte sur le registre.';
    appendPriorityRow('Non-conformités majeures', ncDetail, 'Traiter', () => {
      if (ncForList) {
        const norm = getNormById(ncForList.normId);
        onAnalyze({ ...ncForList, normCode: norm ? norm.code : ncForList.normId });
      } else {
        showToast('Aucune NC majeure listée.', 'info');
      }
    });
  }

  refresh();
  root.append(head, list);
  return { root, refresh };
}

/**
 * @param {() => object[]} getDocRows
 */
function createDocProofStrip(getDocRows) {
  const wrap = document.createElement('div');
  wrap.className = 'iso-doc-proof-strip';
  wrap.setAttribute('aria-label', 'Statut des preuves documentaires');

  function renderStrip() {
    wrap.replaceChildren();
    const title = document.createElement('div');
    title.className = 'iso-doc-proof-strip-title';
    title.textContent = 'Documents maîtrisés (conformité / échéance)';
    wrap.append(title);
    const rows = typeof getDocRows === 'function' ? getDocRows() : [];
    const imports = getImportedDocumentProofs();

    if (!rows.length && !imports.length) {
      const es = createEmptyState(
        '\u{1F4CE}',
        'Aucun document ni preuve importée',
        'Synchronisez le registre ou joignez une preuve fichier rattachée à une exigence.',
        'Aller à la zone d’import',
        () => {
          document.querySelector('.iso-page .iso-docs-priority')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelector('.iso-page .iso-doc-import-btn')?.focus();
        }
      );
      es.classList.add('empty-state--iso-strip');
      wrap.append(es);
      return;
    }

    if (!rows.length) {
      const hint = document.createElement('p');
      hint.className = 'iso-doc-proof-strip-hint';
      hint.textContent =
        'Aucun document maîtrisé synchronisé sur ce périmètre. Les preuves importées sont listées ci-dessous.';
      wrap.append(hint);
    }
    rows.forEach((row) => {
      const st = row.complianceStatus || 'sans_echeance';
      const cls = docComplianceBadgeClass(st);
      const line = document.createElement('div');
      line.className = 'iso-doc-proof-row';
      const name = document.createElement('span');
      name.className = 'iso-doc-proof-name';
      name.textContent = row.name;
      const badge = document.createElement('span');
      badge.className = `badge ${cls} iso-doc-proof-badge iso-doc-compliance--${st}`;
      badge.textContent = row.complianceLabel || 'Non disponible';
      line.append(name, badge);
      wrap.append(line);
    });
    if (imports.length) {
      const sub = document.createElement('div');
      sub.className = 'iso-doc-proof-strip-title';
      sub.style.marginTop = '12px';
      sub.textContent = 'Preuves importées (validées)';
      wrap.append(sub);
      imports.forEach((imp) => {
        const req = getRequirements().find((r) => r.id === imp.requirementId);
        const norm = req ? getNormById(req.normId) : null;
        const reqBit = req ? `${req.clause} (${norm ? norm.code : ''})` : imp.requirementId;
        const line = document.createElement('div');
        line.className = 'iso-doc-proof-row';
        const name = document.createElement('span');
        name.className = 'iso-doc-proof-name';
        const valBy = imp.validatedBy ? ` · validé ${imp.validatedBy}` : '';
        name.textContent = `${imp.fileName} · ${imp.docTypeLabel} → ${reqBit}${valBy}`;
        const badge = document.createElement('span');
        const cls =
          imp.proofStatus === 'present' ? 'green' : imp.proofStatus === 'missing' ? 'red' : 'amber';
        badge.className = `badge ${cls} iso-doc-proof-badge`;
        badge.textContent = importedProofStatusLabel(imp.proofStatus);
        line.append(name, badge);
        wrap.append(line);
      });
    }
  }

  renderStrip();
  return { root: wrap, refresh: renderStrip };
}


function createReviewBlock() {
  const grid = document.createElement('div');
  grid.className = 'iso-review-grid iso-synthese-grid';
  REVIEW_PREP.forEach((item) => {
    const tile = document.createElement('div');
    tile.className = 'iso-review-tile iso-synthese-bloc';
    const lbl = document.createElement('span');
    lbl.textContent = item.label;
    const val = document.createElement('span');
    val.className = 'iso-review-value';
    val.textContent = item.value;
    const det = document.createElement('span');
    det.className = 'iso-review-detail';
    det.textContent = item.detail;
    tile.append(lbl, val, det);
    grid.append(tile);
  });
  return grid;
}

/**
 * Panneau second niveau (élément HTML details natif) : détail métier replié par défaut, zéro perte de fonction.
 * @param {string} titleText
 * @param {string} hintText
 * @param {Node | Node[]} content
 * @param {string} [extraClass]
 */
function wrapIsoL2Disclosure(titleText, hintText, content, extraClass = '') {
  const det = document.createElement('details');
  det.className = `iso-l2-disclosure ${extraClass}`.trim();
  const sum = document.createElement('summary');
  sum.className = 'iso-l2-disclosure__summary';
  const t = document.createElement('span');
  t.className = 'iso-l2-disclosure__title';
  t.textContent = titleText;
  const h = document.createElement('span');
  h.className = 'iso-l2-disclosure__hint';
  h.textContent = hintText;
  sum.append(t, h);
  const body = document.createElement('div');
  body.className = 'iso-l2-disclosure__body';
  const nodes = Array.isArray(content) ? content : [content];
  nodes.forEach((n) => {
    if (n) body.append(n);
  });
  det.append(sum, body);
  return det;
}

export function renderIso(onAddLog) {
  ensureIsoPageStyles();
  ensureQhsePilotageStyles();
  ensureDashboardStyles();

  const dashboardIntent = consumeDashboardIntent();

  const page = document.createElement('section');
  page.className =
    'page-stack page-stack--premium-saas iso-page iso-page--hub iso-page--cockpit iso-page--conformite-premium';

  const { bar: isoPageViewBar } = mountPageViewModeSwitch({
    pageId: 'iso',
    pageRoot: page,
    hintEssential:
      'Essentiel : préparation audit, synthèse, priorités et registre des exigences. Normes, assistant et graphiques masqués.',
    hintAdvanced:
      'Expert : cartographie normes, assistant conformité, graphique du registre et revue de direction.'
  });

  const isoMixChartHosts = { req: null };
  const isoNav = pageTopbarById.iso;

  const auditApiMeta = { auditsCount: 0, lastAuditDate: '' };

  const heroCard = document.createElement('article');
  heroCard.className = 'content-card card-soft iso-header-card iso-hub-intro iso-cockpit-hero';
  heroCard.innerHTML = `
    <div class="iso-cockpit-hero-top">
      <div class="iso-cockpit-hero-copy">
        <div class="section-kicker">${escapeHtml(isoNav?.kicker || 'Conformité')}</div>
        <h1>${escapeHtml(isoNav?.title || 'ISO & Conformité')}</h1>
        <p class="content-card-lead iso-cockpit-hero-lead">
          ${escapeHtml(
            isoNav?.subtitle ||
              'Pilotage du SMS QHSE, référentiels, exigences et preuves pour audits et revue de direction.'
          )}
        </p>
        <p class="iso-cockpit-hero-trust" role="note">
          Vue unique pour direction et auditeurs : indicateurs, preuves et écarts. Chaque décision reste validée par vos équipes (aucune écriture automatique).
        </p>
      </div>
      <div class="iso-cockpit-hero-actions">
        <button type="button" class="btn btn-secondary iso-hero-scroll-prio">Voir les priorités</button>
        <button type="button" class="btn btn-secondary iso-auditor-view-btn" title="Focus écarts, preuves et statuts">Vue auditeur</button>
        <button type="button" class="btn btn-secondary iso-export-conformity-pdf" title="Rapport PDF multi-pages (vue cockpit)">Exporter PDF conformité</button>
        <button type="button" class="btn btn-secondary iso-export-iso45001-premium-pdf" title="Rapport premium (backend) : ISO 45001 + pilotage">Exporter PDF premium ISO 45001</button>
        <button type="button" class="btn btn-secondary iso-generate-audit-report" title="Synthèse globale : conformités, écarts, preuves, actions, risques">Générer rapport audit</button>
        <button type="button" class="btn btn-primary btn--pilotage-cta iso-prep-audit">Préparer l’audit</button>
      </div>
    </div>
    <div class="iso-cockpit-hero-executive-band">
      <div class="iso-cockpit-hero-kpis iso-cockpit-hero-kpis--dual" aria-label="Synthèse express">
        <div class="iso-hero-kpi">
          <span class="iso-hero-kpi-value iso-hero-stat-pct">Non disponible</span>
          <span class="iso-hero-kpi-label">Score ISO consolidé</span>
        </div>
        <div class="iso-hero-kpi">
          <span class="iso-hero-kpi-value iso-hero-stat-gaps">Non disponible</span>
          <span class="iso-hero-kpi-label">Exigences en écart</span>
        </div>
      </div>
      <div class="iso-cockpit-hero-snapshot-host iso-cockpit-hero-snapshot-host--compact"></div>
    </div>
  `;

  heroCard.querySelector('.iso-export-conformity-pdf')?.addEventListener('click', async () => {
    try {
      const { buildIsoConformityPdfHtml, downloadAuditIsoPdfFromHtml } = await import(
        '../components/auditPremiumSaaS.pdf.js'
      );
      const pctEl = heroCard.querySelector('.iso-hero-stat-pct');
      const gapEl = heroCard.querySelector('.iso-hero-stat-gaps');
      const html = buildIsoConformityPdfHtml({
        globalScoreLabel: pctEl?.textContent?.trim() || 'Non disponible',
        gapsLabel: gapEl?.textContent?.trim() || 'Non disponible',
        normScores: buildIsoNormScoresForPdf(),
        requirementLines: requirementLinesForIsoPdf()
      });
      await downloadAuditIsoPdfFromHtml(html, 'rapport-conformite-iso');
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'iso',
          action: 'Export PDF conformité ISO',
          detail: 'Rapport multi-pages : cockpit',
          user: getSessionUser()?.name || 'Utilisateur'
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  heroCard.querySelector('.iso-export-iso45001-premium-pdf')?.addEventListener('click', async () => {
    try {
      const { downloadIsoPremiumPdf } = await import('../services/qhseReportsPdf.service.js');
      const user = getSessionUser();
      await downloadIsoPremiumPdf('iso-45001', {
        organizationName: user?.companyName || user?.tenantName || '',
        siteLabel: user?.defaultSite?.name || user?.siteName || ''
      });
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'iso',
          action: 'Export PDF premium ISO 45001',
          detail: 'Rapport cabinet : pilotage + exigences + preuves (backend)',
          user: user?.name || 'Utilisateur'
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  heroCard.querySelector('.iso-prep-audit').addEventListener('click', () => {
    showToast(
      'Préparation d’audit : checklist, équipe et pièces. Intégration workflow possible selon votre déploiement.',
      'info'
    );
    if (typeof onAddLog === 'function') {
      onAddLog({
        module: 'iso',
        action: 'Préparation audit lancée',
        detail: 'Depuis le cockpit ISO & Conformité',
        user: 'Responsable QHSE'
      });
    }
  });

  heroCard.querySelector('.iso-hero-scroll-prio').addEventListener('click', () => {
    document
      .querySelector('.iso-page .iso-cockpit-priorities')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  heroCard.querySelector('.iso-auditor-view-btn')?.addEventListener('click', () => {
    page.classList.toggle('iso-page--auditor-mode');
    const on = page.classList.contains('iso-page--auditor-mode');
    showToast(
      on ? 'Vue auditeur : focus sur écarts, preuves et statuts.' : 'Vue complète.',
      'info'
    );
  });

  const aiSpotlight = document.createElement('article');
  aiSpotlight.className = 'content-card card-soft iso-ai-spotlight';
  aiSpotlight.setAttribute('aria-label', 'Assistance conformité');
  aiSpotlight.innerHTML = `
    <div class="iso-ai-visual" aria-hidden="true"></div>
    <div class="iso-ai-badge">IA assistée</div>
    <h3>Assistant conformité</h3>
    <p class="iso-ai-trust">Suggestions contextuelles uniquement. Le registre et les statuts sont toujours validés par un humain.</p>
    <p class="iso-ai-lead">
      Accélérez les revues : analyse des écarts, preuves manquantes et pistes de plan d’action, puis traitement dans le registre.
    </p>
    <div class="iso-ai-suggestion-grid" role="group" aria-label="Assistant conformité : actions suggérées"></div>
  `;

  /** @type {{ rows: object[] }} */
  const isoMergedDocsRef = { rows: mergeControlledDocumentRows([]) };
  const getIsoDocRows = () => isoMergedDocsRef.rows;
  /** @type {{ actions: object[] | null; audits: object[] | null }} */
  const isoScoreDataRef = { actions: null, audits: null };

  heroCard.querySelector('.iso-generate-audit-report')?.addEventListener('click', async () => {
    showToast('Préparation du rapport audit…', 'info');
    let snap = null;
    try {
      snap = await getIsoTerrainSnapshot();
    } catch (e) {
      console.warn(e);
    }
    const report = buildIsoAuditReport({
      docRows: isoMergedDocsRef.rows,
      actions: snap?.actions ?? [],
      risks: snap?.risks ?? [],
      incidents: snap?.incidents ?? [],
      audits: snap?.audits ?? isoScoreDataRef.audits ?? []
    });
    openIsoAuditReportModal(report);
    if (typeof onAddLog === 'function') {
      onAddLog(
        buildAiSuggestionJournalEntry({
          aiTraceType: AI_TRACE_TYPE.AUDIT_REPORT_GENERATED,
          module: 'iso-ai',
          detail: `Synthèse cockpit (conformités, NC, preuves, actions, risques) · score ${report.score?.pct ?? '—'} %`,
          user: AI_TRACE_ACTOR_IA
        })
      );
    }
  });

  function getIsoScoreInput() {
    return {
      docRows: isoMergedDocsRef.rows,
      actions: isoScoreDataRef.actions,
      audits: isoScoreDataRef.audits
    };
  }

  const buildReadinessState = () => {
    const base = computeAuditReadiness(getIsoScoreInput());
    if (!auditApiMeta.auditsCount) return base;
    const suffix = auditApiMeta.lastAuditDate
      ? ` · ${auditApiMeta.auditsCount} audit(s) chargés (dernier: ${auditApiMeta.lastAuditDate}).`
      : ` · ${auditApiMeta.auditsCount} audit(s) chargés.`;
    return {
      ...base,
      message: `${base.message}${suffix}`
    };
  };

  const auditReadinessEl = createAuditReadinessBanner(buildReadinessState(), {
    onTreat: () => {
      document.querySelector('.iso-page .iso-cockpit-priorities')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      showToast('Traiter les priorités : écarts, preuves et audits.', 'info');
    }
  });

  const summary0 = computeIsoScore(getIsoScoreInput());
  const globalSnapshotEl = createGlobalSnapshot(summary0);
  const snapHost = heroCard.querySelector('.iso-cockpit-hero-snapshot-host');
  if (snapHost) snapHost.append(globalSnapshotEl);

  function updateHeroQuickStats() {
    const s = computeIsoScore(getIsoScoreInput());
    const gapsOpen = getRequirements().filter((r) => isoRequirementStatusNormKey(r.status) !== 'conforme').length;
    const pctEl = heroCard.querySelector('.iso-hero-stat-pct');
    const gapEl = heroCard.querySelector('.iso-hero-stat-gaps');
    if (pctEl) pctEl.textContent = `${s.pct} %`;
    if (gapEl) gapEl.textContent = String(gapsOpen);
  }
  updateHeroQuickStats();

  const registryDocImpact = createIsoRegistryComplianceBanner();
  const docStateSummary = createDocumentStateSummaryBlock();
  docStateSummary.update(computeDocumentRegistrySummary(isoMergedDocsRef.rows));
  registryDocImpact.update(computeDocumentRegistrySummary(isoMergedDocsRef.rows));

  const docTableSection = createControlledDocumentsTableSection({
    getRows: getIsoDocRows,
    onAddLog
  });

  /** @type {{ refreshTable: () => void; onAnalyze: (row: unknown) => void; getDocumentRows: () => object[]; reloadTerrainLinks?: () => void; onAddLog?: (e: object) => void; afterComplianceApply?: () => void }} */
  const tableCtx = {
    refreshTable: () => {},
    onAnalyze: () => {},
    getDocumentRows: getIsoDocRows,
    onAddLog,
    afterComplianceApply: () => {}
  };

  tableCtx.onAnalyze = (row) => {
    void (async () => {
      const requirement = {
        id: row.id,
        normId: row.normId,
        normCode: row.normCode,
        clause: row.clause,
        title: row.title,
        summary: row.summary,
        evidence: row.evidence,
        status: row.status
      };
      try {
        const assistRes = await qhseFetch('/api/compliance/analyze-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requirement: {
              id: row.id || row.clause,
              normId: row.normId,
              clause: row.clause,
              title: row.title,
              summary: row.summary,
              evidence: row.evidence,
              normCode: row.normCode,
              currentStatus: row.status
            },
            controlledDocuments: [],
            siteId: appState.activeSiteId ?? null
          })
        });
        if (assistRes.ok) {
          const assistData = await assistRes.json().catch(() => null);
          const assistText =
            String(
              assistData?.summary ||
                assistData?.analysis ||
                assistData?.suggestion ||
                assistData?.recommendation ||
                ''
            ).trim() || '';
          if (assistText) {
            requirement.summary = `${String(requirement.summary || '').trim()}\n\nAssistant API: ${assistText}`;
          }
        } else {
          showToast("Assistant conformité indisponible, ouverture en mode local.", 'warning');
        }
      } catch {
        showToast("Réseau indisponible, assistant conformité en mode local.", 'warning');
      }
      openComplianceAssistModal({
        requirement,
        controlledDocuments: isoMergedDocsRef.rows.map((r) => ({
          name: r.name,
          version: r.version || 'Non renseigné'
        })),
        siteId: appState.activeSiteId,
        onStatusCommitted: async (requirementId, status, meta) => {
          const gateOk = await ensureSensitiveAccess('critical_validation', {
            contextLabel: 'mise à jour du statut d’exigence (conformité)'
          });
          if (!gateOk) {
            const saCfg = loadSensitiveAccessConfig();
            if (
              saCfg.enabled &&
              isSensitiveActionEnabled('critical_validation', saCfg) &&
              loadSensitiveAccessPin()
            ) {
              showToast('Enregistrement annulé. Statut inchangé.', 'info');
            }
            return false;
          }
          const saved = await setRequirementStatus(requirementId, status);
          refreshPilotage();
          if (!saved) {
            showToast('Synchronisation impossible. Vérifiez votre connexion ou vos droits.', 'warning');
            return false;
          }
          if (typeof onAddLog === 'function') {
            onAddLog({
              module: 'iso',
              action: 'Statut exigence mis à jour (validation humaine)',
              detail: `${requirementId} → ${status} (${meta.source})`,
              user: getSessionUser()?.name || 'Utilisateur',
              entityType: ENTITY_ISO_REQUIREMENT,
              requirementId,
              isoHistoryKind: 'status_changed'
            });
          }
          return true;
        },
        onAiTrace: (payload) => {
          if (typeof onAddLog !== 'function') return;
          const user =
            payload.aiTraceType === AI_TRACE_TYPE.SUGGESTION_GENERATED
              ? AI_TRACE_ACTOR_IA
              : getSessionUser()?.name || 'Utilisateur';
          onAddLog(
            buildAiSuggestionJournalEntry({
              aiTraceType: payload.aiTraceType,
              module: 'iso-ai',
              requirementId: payload.requirementId,
              detail: payload.detail,
              user,
              suggestedStatus: payload.suggestedStatus,
              chosenStatus: payload.chosenStatus
            })
          );
        }
      });
    })();
  };

  function refreshCopilot() {
    const grid = aiSpotlight.querySelector('.iso-ai-suggestion-grid');
    if (!grid) return;
    grid.replaceChildren();
    buildIsoCopilotSuggestions({
      onScrollTo: (sel) => {
        if (sel && String(sel).includes('iso-docs')) ensureIsoDocsPanelOpen();
        document.querySelector(`.iso-page ${sel}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      },
      onOpenFirstNc: () => {
        const nc = getRequirements().find((r) => isoRequirementStatusNormKey(r.status) === 'non_conforme');
        if (nc) {
          const norm = getNormById(nc.normId);
          tableCtx.onAnalyze({ ...nc, normCode: norm ? norm.code : nc.normId });
        } else {
          showToast('Aucune non-conformité ouverte sur le registre.', 'info');
        }
      },
      onHash: (h) => {
        qhseNavigate(h);
      }
    }).forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary iso-ai-suggestion-btn';
      btn.textContent = item.label;
      btn.addEventListener('click', item.onClick);
      grid.append(btn);
    });
  }
  refreshCopilot();

  const pilotageCtx = { refreshPilotage: () => {} };
  const proofStripBundle = createDocProofStrip(getIsoDocRows);
  const docsSection = createDocumentsPrioritySection(pilotageCtx, onAddLog, docTableSection);

  function hasImportedProof(requirementId) {
    const rid = String(requirementId || '').trim();
    if (!rid) return false;
    const links = getImportedDocumentProofs().filter((p) => p.requirementId === rid);
    if (!links.length) return false;
    // "present" = preuve réellement disponible, "verify" = à vérifier mais au moins une pièce existe
    return links.some((p) => p.proofStatus === 'present' || p.proofStatus === 'verify');
  }

  function isHighPriorityRequirement(req) {
    // Pas de champ priority natif côté registre ISO → heuristique simple sur le texte existant.
    const hay = `${req?.title || ''} ${req?.summary || ''} ${req?.evidence || ''}`.toLowerCase();
    if (hay.includes('critique')) return true;
    if (hay.includes('majeur') || hay.includes('majeure')) return true;
    if (hay.includes('fatal') || hay.includes('mortel')) return true;
    return false;
  }

  /**
   * Vue centrale décision (lecture 5 secondes) : score + readiness + explication + exigences critiques (max 5).
   */
  function createIsoDecisionCenter() {
    const card = document.createElement('article');
    card.className = 'content-card card-soft iso-decision-center';
    card.setAttribute('aria-label', 'Vue centrale ISO - décision');
    card.innerHTML = `
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Décision</div>
          <h3>ISO en 5 secondes</h3>
          <p class="content-card-lead">Score, readiness et 5 exigences critiques à traiter maintenant.</p>
        </div>
      </div>
      <div class="iso-decision-grid">
        <section class="iso-decision-block">
          <div class="iso-decision-k">Score global</div>
          <div class="iso-decision-score" data-score>Non disponible</div>
          <div class="iso-decision-muted" data-readiness>Audit readiness: non disponible</div>
          <div class="iso-decision-muted" data-message></div>
          <details class="iso-decision-details">
            <summary>Explication du score</summary>
            <div class="iso-decision-explain" data-explain></div>
          </details>
        </section>
        <section class="iso-decision-block">
          <div class="iso-decision-k">Top exigences critiques</div>
          <div class="iso-decision-list" data-critical></div>
        </section>
      </div>
    `;

    const elScore = card.querySelector('[data-score]');
    const elReadiness = card.querySelector('[data-readiness]');
    const elMessage = card.querySelector('[data-message]');
    const elExplain = card.querySelector('[data-explain]');
    const elCritical = card.querySelector('[data-critical]');

    function refresh() {
      const s = computeIsoScore(getIsoScoreInput());
      const ar = computeAuditReadiness(getIsoScoreInput());

      if (elScore) {
        const pct = Number(s?.pct);
        elScore.textContent = Number.isFinite(pct) ? `${Math.round(pct)}/100` : 'Non disponible';
      }
      if (elReadiness) {
        const r = String(ar?.readiness || 'non_pret');
        elReadiness.textContent = `Audit readiness: ${r}`;
      }
      if (elMessage) {
        elMessage.textContent = String(ar?.message || '').replaceAll('—', '-').replaceAll('–', '-');
      }
      if (elExplain) {
        elExplain.replaceChildren();
        const bits = Array.isArray(s?.breakdown) ? s.breakdown : [];
        if (!bits.length) {
          const p = document.createElement('p');
          p.className = 'iso-decision-muted';
          p.textContent = 'Non disponible.';
          elExplain.append(p);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'iso-decision-ul';
          bits.forEach((b) => {
            const li = document.createElement('li');
            const pctLabel =
              typeof b?.pct === 'number' && Number.isFinite(b.pct) ? `${Math.round(b.pct)} %` : '';
            li.innerHTML = `<strong>${escapeHtml(String(b?.label || 'Indicateur'))}</strong> ${
              pctLabel ? `<span class="iso-decision-pill">${escapeHtml(pctLabel)}</span>` : ''
            } <span class="iso-decision-muted">${escapeHtml(String(b?.detail || '').replaceAll('—', '-').replaceAll('–', '-'))}</span>`;
            ul.append(li);
          });
          elExplain.append(ul);
        }
      }
      if (elCritical) {
        elCritical.replaceChildren();
        const crit = getRequirements()
          .filter((r) => r && typeof r === 'object')
          .map((r) => {
            const st = isoRequirementStatusNormKey(r.status);
            const noProof = !hasImportedProof(r.id);
            const high = isHighPriorityRequirement(r);
            const nc = st === 'non_conforme';
            return { r, nc, noProof, high };
          })
          .filter((x) => x.nc || x.noProof || x.high)
          .sort((a, b) => {
            // Ordre: NC d'abord, puis sans preuve, puis high priority, puis clause.
            const w = (x) => (x.nc ? 100 : 0) + (x.noProof ? 10 : 0) + (x.high ? 1 : 0);
            const dw = w(b) - w(a);
            if (dw !== 0) return dw;
            return String(a.r?.clause || '').localeCompare(String(b.r?.clause || ''), 'fr');
          })
          .slice(0, 5);

        if (!crit.length) {
          const p = document.createElement('p');
          p.className = 'iso-decision-muted';
          p.textContent = 'Aucune exigence critique détectée.';
          elCritical.append(p);
        } else {
          crit.forEach(({ r, nc, noProof, high }) => {
            const row = document.createElement('div');
            row.className = 'iso-decision-crit';
            const problemBits = [];
            if (nc) problemBits.push('non conforme');
            if (noProof) problemBits.push('sans preuve');
            if (high) problemBits.push('priorité high');
            const problem = problemBits.length ? problemBits.join(' · ') : 'à traiter';
            row.innerHTML = `
              <div class="iso-decision-crit-main">
                <strong>${escapeHtml(`${r.clause} - ${r.title}`)}</strong>
                <div class="iso-decision-muted">${escapeHtml(String(r.summary || '').replaceAll('—', '-').replaceAll('–', '-').slice(0, 180))}</div>
                <div class="iso-decision-muted">Problème: ${escapeHtml(problem)}</div>
              </div>
              <div class="iso-decision-crit-actions"></div>
            `;
            const actions = row.querySelector('.iso-decision-crit-actions');
            const b1 = document.createElement('button');
            b1.type = 'button';
            b1.className = 'btn btn-secondary';
            b1.textContent = 'Créer action';
            b1.addEventListener('click', () => void openIsoRequirementActionCreate(r, onAddLog));
            const b2 = document.createElement('button');
            b2.type = 'button';
            b2.className = 'btn btn-primary';
            b2.textContent = 'Ajouter preuve';
            b2.addEventListener('click', () => {
              ensureIsoDocsPanelOpen();
              document.getElementById('iso-docs-priority-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              docsSection.openAttachProofForRequirement(r.id);
            });
            actions?.append(b1, b2);
            elCritical.append(row);
          });
        }
      }
    }

    refresh();
    return { root: card, refresh };
  }

  const decisionCenter = createIsoDecisionCenter();

  function createIsoTopHeader() {
    const wrap = document.createElement('section');
    wrap.className = 'content-card card-soft iso-top-header';
    wrap.setAttribute('aria-label', 'En-tête ISO');
    wrap.innerHTML = `
      <div class="content-card-head" style="padding-bottom:10px">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <div class="section-kicker">ISO</div>
            <h3 style="margin:0">${escapeHtml(normHeaderLabel())}</h3>
            <p class="content-card-lead" style="margin-top:6px">
              <strong>Site :</strong> <span data-site></span>
            </p>
          </div>
          <div style="text-align:right;min-width:220px">
            <div style="font-weight:900;font-size:22px;letter-spacing:-.02em" data-score>—</div>
            <div style="font-size:11px;color:var(--text2,#94a3b8)">Score global</div>
            <div style="margin-top:8px;font-size:12px;color:var(--text2,#94a3b8)">
              Audit readiness: <strong data-readiness>—</strong>
            </div>
          </div>
        </div>
      </div>
      <div style="padding:0 18px 16px">
        <div style="font-size:12px;color:var(--text2,#94a3b8)" data-message></div>
        <ul style="margin:10px 0 0;padding-left:18px;display:grid;gap:6px;font-size:12px;color:var(--text2,#94a3b8)" data-blockers></ul>
      </div>
    `;

    const elSite = wrap.querySelector('[data-site]');
    const elScore = wrap.querySelector('[data-score]');
    const elReady = wrap.querySelector('[data-readiness]');
    const elMsg = wrap.querySelector('[data-message]');
    const elBlock = wrap.querySelector('[data-blockers]');

    function update(scoreState, readinessState) {
      if (elSite) elSite.textContent = activeSiteLabel();
      const pct = Number(scoreState?.pct);
      if (elScore) elScore.textContent = Number.isFinite(pct) ? `${Math.round(pct)}/100` : 'Non disponible';
      const r = String(readinessState?.readiness || 'non_pret');
      if (elReady) elReady.textContent = r;
      if (elMsg) {
        elMsg.textContent = String(readinessState?.message || '').replaceAll('—', '-').replaceAll('–', '-');
      }
      if (elBlock) {
        elBlock.replaceChildren();
        const nc = Math.max(0, Number(readinessState?.ncCount) || 0);
        const partial = Math.max(0, Number(readinessState?.partialCount) || 0);
        const miss = Math.max(0, Number(readinessState?.missingDocsCount) || 0);
        const blockers = [];
        if (nc > 0) blockers.push(`${nc} non-conformité(s) ouverte(s)`);
        if (partial > 0) blockers.push(`${partial} exigence(s) partielle(s)`);
        if (miss > 0) blockers.push(`${miss} document(s) manquant(s)`);
        if (!blockers.length) blockers.push('Aucun point bloquant majeur détecté sur cette vue.');
        blockers.slice(0, 5).forEach((t) => {
          const li = document.createElement('li');
          li.textContent = t;
          elBlock.append(li);
        });
      }
    }

    return { root: wrap, update };
  }

  const isoTopHeader = createIsoTopHeader();

  async function syncControlledDocumentsFromApi() {
    try {
      const api = await fetchControlledDocumentsFromApi();
      isoMergedDocsRef.rows = mergeControlledDocumentRows(api);
      const sum = computeDocumentRegistrySummary(isoMergedDocsRef.rows);
      docStateSummary.update(sum);
      registryDocImpact.update(sum);
      docTableSection.refresh();
      proofStripBundle.refresh();
      tableCtx.reloadTerrainLinks?.();
      void refreshDocComplianceNotifications();
    } catch {
      showToast('Documents API indisponibles, affichage local conservé.', 'warning');
    }
  }

  async function syncAuditsForReadinessFromApi() {
    try {
      const res = await qhseFetch(withSiteQuery('/api/audits?limit=50'));
      if (!res.ok) {
        showToast('Audits API indisponibles, score local conservé.', 'warning');
        return;
      }
      const payload = await res.json().catch(() => []);
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      auditApiMeta.auditsCount = rows.length;
      const latest = rows
        .map((r) => String(r?.updatedAt || r?.date || r?.createdAt || '').trim())
        .filter(Boolean)
        .sort()
        .pop();
      auditApiMeta.lastAuditDate = latest
        ? new Date(latest).toLocaleDateString('fr-FR')
        : '';
      updateAuditReadinessBanner(auditReadinessEl, buildReadinessState());
    } catch {
      showToast('Réseau audits indisponible, score local conservé.', 'warning');
    }
  }

  void syncControlledDocumentsFromApi();
  void syncAuditsForReadinessFromApi();

  const normsCard = document.createElement('article');
  normsCard.className = 'content-card card-soft iso-norms-hero-wrap iso-norms-central';
  const normsHead = document.createElement('div');
  normsHead.className = 'content-card-head';
  normsHead.innerHTML = `
    <div>
      <div class="section-kicker">Référentiels</div>
      <h3>9001 · 14001 · 45001 : lecture consolidée</h3>
      <p class="content-card-lead">
        Score, statut et écarts par norme, alignés sur le registre d’exigences du périmètre sélectionné.
      </p>
    </div>
  `;
  const normsCycle = createComplianceCycleStrip();
  const normsGrid = document.createElement('div');
  normsGrid.className = 'iso-norms-grid iso-norms-grid--lite';

  function normCompliancePct(reqs) {
    if (!reqs.length) return 100;
    let pts = 0;
    reqs.forEach((r) => {
      const k = isoRequirementStatusNormKey(r.status);
      if (k === 'conforme') pts += 100;
      else if (k === 'partiel') pts += 50;
    });
    return Math.round(pts / reqs.length);
  }

  function normPilotLabels(reqs) {
    const nc = reqs.filter((r) => isoRequirementStatusNormKey(r.status) === 'non_conforme').length;
    const gap = reqs.filter((r) => isoRequirementStatusNormKey(r.status) !== 'conforme').length;
    if (nc > 0) return { label: 'Critique', cls: 'red' };
    if (gap > 0) return { label: 'À risque', cls: 'amber' };
    return { label: 'Conforme', cls: 'green' };
  }

  function renderNormsGrid() {
    normsGrid.replaceChildren();
    const { missing, obsolete, critical } = DOCUMENT_ATTENTION;
    const docCounts = [missing.length, obsolete.length, critical.length];
    CONFORMITY_NORMS.forEach((sn, idx) => {
      const lite = NORMS_LITE.find((x) => x.id === sn.code);
      if (!lite) return;
      const reqs = getRequirements().filter((r) => r.normId === sn.id);
      const nonOkAll = reqs.filter((r) => isoRequirementStatusNormKey(r.status) !== 'conforme').length;
      const strictNc = reqs.filter((r) => isoRequirementStatusNormKey(r.status) === 'non_conforme').length;
      const pilot = normPilotLabels(reqs);
      const aud = AUDITS_TO_SCHEDULE[idx % Math.max(AUDITS_TO_SCHEDULE.length, 1)];
      const auditLine =
        AUDITS_TO_SCHEDULE.length > 0
          ? `${aud.title} · ${aud.horizon}`
          : 'Aucun audit lié sur cette vue';
      normsGrid.append(
        createNormCardLite({
          id: sn.code,
          title: sn.title,
          status: lite.status,
          badge: lite.badge,
          line: lite.line,
          statsTotal: reqs.length,
          statsNonOk: nonOkAll,
          strictNcCount: strictNc,
          cockpitPct: normCompliancePct(reqs),
          cockpitLevelLabel: pilot.label,
          cockpitLevelClass: pilot.cls,
          docsMissingCount: docCounts[idx % 3],
          auditLine,
          ...(sn.id === 'iso45001' || sn.id === 'iso14001' || sn.id === 'iso9001'
            ? {
                exportPremiumTitle: `Rapport premium (backend) : ${sn.title} + pilotage`,
                onExportPremium: async () => {
                  const { downloadIsoPremiumPdf } = await import('../services/qhseReportsPdf.service.js');
                  const u = getSessionUser();
                  const standard = sn.id === 'iso45001' ? 'iso-45001' : sn.id === 'iso14001' ? 'iso-14001' : 'iso-9001';
                  await downloadIsoPremiumPdf(standard, {
                    organizationName: u?.companyName || u?.tenantName || '',
                    siteLabel: u?.defaultSite?.name || u?.siteName || ''
                  });
                  if (typeof onAddLog === 'function') {
                    onAddLog({
                      module: 'iso',
                      action: 'Export PDF premium ISO',
                      detail: `Rapport premium ${sn.title}`,
                      user: u?.name || 'Utilisateur'
                    });
                  }
                }
              }
            : {})
        })
      );
    });
  }
  renderNormsGrid();
  normsCard.append(normsHead, normsCycle, normsGrid);

  const { root: prioritiesCockpit, refresh: refreshPrioritiesCockpit } = createPrioritiesCockpitBlock(
    (row) => tableCtx.onAnalyze(row),
    getIsoScoreInput
  );

  async function paintIsoMixCharts() {
    if (!isoMixChartHosts.req) return;
    const reqs = getRequirements();
    let conforme = 0;
    let partiel = 0;
    let nonConforme = 0;
    reqs.forEach((r) => {
      const k = isoRequirementStatusNormKey(r.status);
      if (k === 'conforme') conforme += 1;
      else if (k === 'partiel') partiel += 1;
      else nonConforme += 1;
    });
    const { createRequirementStatusMixChart } = await import('../components/dashboardCharts.js');
    isoMixChartHosts.req.replaceChildren(
      createRequirementStatusMixChart({ conforme, partiel, nonConforme })
    );
  }

  let isRefreshingPilotage = false;
  let refreshPilotageQueued = false;

  function refreshPilotage() {
    if (isRefreshingPilotage) {
      refreshPilotageQueued = true;
      return;
    }
    isRefreshingPilotage = true;
    try {
      const scoreNow = computeIsoScore(getIsoScoreInput());
      const readinessNow = computeAuditReadiness(getIsoScoreInput());
      isoTopHeader.update(scoreNow, readinessNow);
      updateGlobalSnapshot(globalSnapshotEl, scoreNow);
      updateHeroQuickStats();
      updateAuditReadinessBanner(auditReadinessEl, readinessNow);
      void getIsoTerrainSnapshot()
        .then((snap) => {
          isoScoreDataRef.actions = snap.actions;
          isoScoreDataRef.audits = snap.audits;
          const score2 = computeIsoScore(getIsoScoreInput());
          const readiness2 = computeAuditReadiness(getIsoScoreInput());
          isoTopHeader.update(score2, readiness2);
          updateGlobalSnapshot(globalSnapshotEl, score2);
          updateHeroQuickStats();
          updateAuditReadinessBanner(auditReadinessEl, readiness2);
        })
        .catch(() => {});
      renderNormsGrid();
      refreshPrioritiesCockpit();
      refreshCopilot();
      tableCtx.refreshTable();
      docsSection.renderAttention();
      decisionCenter.refresh();
      proofStripBundle.refresh();
      docStateSummary.update(computeDocumentRegistrySummary(isoMergedDocsRef.rows));
      registryDocImpact.update(computeDocumentRegistrySummary(isoMergedDocsRef.rows));
      docTableSection.refresh();
      void paintIsoMixCharts();
    } finally {
      isRefreshingPilotage = false;
      if (refreshPilotageQueued) {
        refreshPilotageQueued = false;
        setTimeout(refreshPilotage, 200);
      }
    }
  }

  pilotageCtx.refreshPilotage = refreshPilotage;
  tableCtx.afterComplianceApply = refreshPilotage;

  void refreshConformityStatusCacheFromApi().then(() => refreshPilotage());

  const reqCard = document.createElement('article');
  reqCard.className = 'content-card card-soft iso-req-hub-card';
  reqCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Exigences</div>
        <h3>Registre des exigences</h3>
        <p class="content-card-lead">
          Filtres par statut, colonne <strong>Traiter</strong> pour l’assistance conformité.
        </p>
      </div>
    </div>
  `;

  reqCard.append(createRequirementsTable(tableCtx, registryDocImpact));

  const docsCard = document.createElement('article');
  docsCard.className = 'content-card card-soft iso-docs-hub-card';
  docsCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Documentation</div>
        <h3>Documents &amp; preuves</h3>
        <p class="content-card-lead">Preuves indicatives, pièces à traiter puis liste maîtrisée (repliable).</p>
      </div>
    </div>
  `;
  docsCard.append(docStateSummary.root, proofStripBundle.root, docsSection.root);

  const reviewCard = document.createElement('article');
  reviewCard.className = 'content-card card-soft iso-review-hub-card';
  reviewCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Revue de direction</div>
        <h3>Synthèse rapide</h3>
        <p class="content-card-lead">Entrées pour le comité : synthèse des indicateurs affichés.</p>
      </div>
    </div>
  `;
  reviewCard.append(createReviewBlock());

  const layout = document.createElement('section');
  layout.className = 'two-column iso-register-docs-layout';
  const mainCol = document.createElement('div');
  mainCol.className = 'iso-section-stack iso-register-docs-col iso-register-docs-col--req';
  mainCol.append(reqCard);
  const asideCol = document.createElement('div');
  asideCol.className = 'iso-pilotage-aside iso-register-docs-col iso-register-docs-col--docs';
  /* Documentation détaillée = second niveau : registre d’exigences reste visible en colonne principale. */
  const docsDisclosure = wrapIsoL2Disclosure(
    'Documents, preuves & liste maîtrisée',
    'Synthèse conformité, preuves, priorités et tableau documents. Tout le flux métier est conservé.',
    docsCard,
    'iso-l2-disclosure--docs'
  );
  asideCol.append(docsDisclosure);
  layout.append(mainCol, asideCol);

  const normsHub = document.createElement('div');
  normsHub.className = 'iso-norms-hub';
  normsHub.append(normsCard);

  const focusZone = document.createElement('div');
  focusZone.className = 'iso-focus-zone';
  /* IA = aide à la revue, pas lecture immédiate : même composant, accès au clic. */
  const assistantDisclosure = wrapIsoL2Disclosure(
    'Assistant conformité',
    'Suggestions et raccourcis. Validation humaine inchangée.',
    aiSpotlight,
    'iso-l2-disclosure--assistant'
  );
  focusZone.append(normsHub, assistantDisclosure);

  const focusIntro = document.createElement('div');
  focusIntro.className = 'iso-zone-header iso-focus-zone-intro';
  focusIntro.innerHTML = `
    <p class="iso-zone-header__kicker">Cartographie</p>
    <h2 class="iso-zone-header__title">Normes &amp; assistance</h2>
    <p class="iso-zone-header__desc">Référentiels et lecture opérationnelle, avec l’assistant pour préparer vos revues. Le registre reste la source de vérité.</p>
  `;

  const focusWrap = document.createElement('div');
  focusWrap.className = 'iso-focus-wrap qhse-page-advanced-only';
  focusWrap.append(focusIntro, focusZone);

  const secondaryZone = document.createElement('div');
  secondaryZone.className = 'iso-secondary-zone';
  const reviewDisclosure = wrapIsoL2Disclosure(
    'Revue de direction : synthèse',
    'Indicateurs agrégés pour comité. Ouvrir pour le détail.',
    reviewCard,
    'iso-l2-disclosure--review'
  );
  secondaryZone.append(layout, reviewDisclosure);

  const secondaryWrap = document.createElement('div');
  secondaryWrap.className = 'iso-secondary-wrap';
  const zoneKicker = document.createElement('p');
  zoneKicker.className = 'iso-zone-kicker';
  zoneKicker.setAttribute('aria-hidden', 'true');
  zoneKicker.textContent = 'Registre, documentation & revue';
  secondaryWrap.append(zoneKicker, secondaryZone);

  const isoReqStatCard = document.createElement('article');
  isoReqStatCard.className = 'content-card card-soft iso-conformity-chart-card';
  isoReqStatCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Registre</div>
        <h3>Répartition des exigences</h3>
        <p class="content-card-lead">Vue graphique du registre (mêmes totaux que le tableau).</p>
      </div>
    </div>
  `;
  const isoReqChartBody = document.createElement('div');
  isoReqChartBody.className = 'dashboard-chart-card-inner';
  isoReqStatCard.append(isoReqChartBody);

  const isoMixRow = document.createElement('div');
  isoMixRow.className = 'two-column iso-conformity-charts-row iso-conformity-charts-row--single';
  isoMixRow.append(isoReqStatCard);

  isoMixChartHosts.req = isoReqChartBody;
  void paintIsoMixCharts();

  const priorityShell = document.createElement('div');
  priorityShell.className = 'iso-priority-shell';
  priorityShell.append(prioritiesCockpit);

  const insightsZone = document.createElement('div');
  insightsZone.className = 'iso-insights-zone';
  const insightsHead = document.createElement('div');
  insightsHead.className = 'iso-zone-header';
  insightsHead.innerHTML = `
    <p class="iso-zone-header__kicker">Indicateurs</p>
    <h2 class="iso-zone-header__title">Lecture du registre</h2>
    <p class="iso-zone-header__desc">Répartition des statuts d’exigences, cohérente avec le tableau et les filtres ci-dessous.</p>
  `;
  insightsZone.append(insightsHead, isoMixRow);
  /* Graphique redondant avec le tableau : disponible sans encombrer le premier écran. */
  const insightsDisclosure = wrapIsoL2Disclosure(
    'Graphique · répartition des exigences',
    'Même données que le registre. Ouvrir pour la vue visuelle.',
    insightsZone,
    'iso-l2-disclosure--insights'
  );
  insightsDisclosure.classList.add('qhse-page-advanced-only');

  page.append(
    isoPageViewBar,
    isoTopHeader.root,
    auditReadinessEl,
    heroCard,
    decisionCenter.root,
    priorityShell,
    focusWrap,
    insightsDisclosure,
    secondaryWrap
  );
  if (dashboardIntent?.scrollToId) {
    scheduleScrollIntoView(String(dashboardIntent.scrollToId));
  }
  return page;
}
