import { showToast } from '../components/toast.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { pageTopbarById } from '../data/navigation.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { ensureIsoPageStyles } from '../components/isoPageStyles.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { openComplianceAssistModal } from '../components/isoComplianceAssistPanel.js';
import { appState } from '../utils/state.js';
import { getSessionUser } from '../data/sessionUser.js';
import { activityLogStore } from '../data/activityLog.js';
import {
  fetchControlledDocumentsFromApi,
  mergeControlledDocumentRows,
  computeDocumentRegistrySummary,
  refreshDocComplianceNotifications
} from '../services/documentRegistry.service.js';
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
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
/* Préférences colonnes table exigences ISO — localStorage centralisé dans isoTablePreferences.js */
import { readIsoReqColumnMode, LS_ISO_REQ_TABLE_COLS } from '../utils/isoTablePreferences.js';
import { mountPageViewModeSwitch } from '../utils/pageViewMode.js';
import { ISO_REQ_STATUS_EN_FR, isoRequirementStatusNormKey } from '../utils/isoRequirementStatus.js';

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

/** Normes — cartes allégées (statut + une phrase). */
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
    line: 'Point habilitations — clôture visée mi-avril.'
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
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
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
  openActionCreateDialog({
    users,
    defaults: {
      title: `Mise à jour document : ${row.name}`,
      origin: 'other',
      actionType: 'corrective',
      priority: row.complianceStatus === 'expire' ? 'critique' : 'haute',
      description: `Renouveler ou réviser le document « ${row.name} » (statut : ${row.complianceLabel || row.complianceStatus}). Réf. ${row.id}.`
    },
    onCreated: () => {
      showToast('Action enregistrée.', 'success');
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'iso',
          action: 'Action créée depuis document maîtrisé',
          detail: row.name,
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
  showToast(`Relance enregistrée pour ${who} — ${row.name}`, 'info');
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
    const pct = summary.pctValide == null ? '—' : `${summary.pctValide} %`;
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

/** Ouvre le volet Documents (second niveau) avant scroll — liens depuis priorités / bannières. */
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
          <strong>${summary.expire} document(s) expiré(s)</strong> — risque pour les preuves audit. Consolidez la version courante dans la section Documents.
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
      type.textContent = row.type || '—';
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
      resp.textContent = row.responsible && String(row.responsible).trim() ? row.responsible : '—';
      const stCell = document.createElement('span');
      stCell.className = 'iso-doc-status-cell';
      const badge = document.createElement('span');
      badge.className = `badge ${docComplianceBadgeClass(st)} iso-doc-compliance-badge iso-doc-compliance--${st}`;
      badge.textContent = row.complianceLabel || '—';
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
 * Analyse locale heuristique (navigateur) — mots-clés + hachage stable sur le nom de fichier.
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
      confidenceNote: 'Proposition locale — à valider par un responsable.'
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
    `Type probable : ${docTypeLabel} — à confirmer après lecture humaine.`,
    `Rattachement suggéré : ${best.clause} — ${best.title} (${norm ? norm.code : best.normId}).`,
    'Contrôler version, diffusion contrôlée et cohérence avec le SMS.'
  ];
  const gaps = [];
  if (!/sign|visa|approuv|valid/i.test(lower)) {
    gaps.push('Aucune mention explicite de signature ou validation détectée sur le nom de fichier — vérifier le PDF.');
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
        <input type="text" class="control-input iso-import-validated-by" placeholder="Nom, fonction — terrain" autocomplete="name" />
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
      opt.textContent = `${r.clause} — ${r.title} (${norm ? norm.code : r.normId})`;
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
  const base = String(baseEvidence || '—');
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
 * @param {ReturnType<typeof computeComplianceSummary>} s
 */
function createGlobalSnapshot(s) {
  const wrap = document.createElement('div');
  wrap.className = `iso-global-snapshot iso-global-snapshot--${s.globalTone}`;
  wrap.innerHTML = `
    <div class="iso-global-snapshot-inner">
      <div class="iso-global-score" aria-label="Score de conformité">
        <span class="iso-global-pct">${s.pct}</span>
        <span class="iso-global-pct-suffix">%</span>
        <div class="iso-global-score-caption">conformité (exigences)</div>
      </div>
      <div class="iso-global-copy">
        <div class="iso-global-label">${escapeHtml(s.globalLabel)}</div>
        <p class="iso-global-message">${escapeHtml(s.message)}</p>
        <div class="iso-global-meta" aria-hidden="true"></div>
      </div>
    </div>
  `;
  const meta = wrap.querySelector('.iso-global-meta');
  if (meta) {
    meta.textContent = `${s.ok} conforme(s) · ${s.partial} partiel(le)(s) · ${s.nonOk} non conforme(s)`;
  }
  return wrap;
}

/**
 * @param {HTMLElement} el
 * @param {ReturnType<typeof computeComplianceSummary>} s
 */
function updateGlobalSnapshot(el, s) {
  el.className = `iso-global-snapshot iso-global-snapshot--${s.globalTone}`;
  const pct = el.querySelector('.iso-global-pct');
  const label = el.querySelector('.iso-global-label');
  const message = el.querySelector('.iso-global-message');
  const meta = el.querySelector('.iso-global-meta');
  if (pct) pct.textContent = String(s.pct);
  if (label) label.textContent = s.globalLabel;
  if (message) message.textContent = s.message;
  if (meta) meta.textContent = `${s.ok} conforme(s) · ${s.partial} partiel(le)(s) · ${s.nonOk} non conforme(s)`;
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
    pill.textContent = norm.cockpitLevelLabel || '—';
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
    valAud.textContent = norm.auditLine || '—';
    rowAud.append(lblAud, valAud);
    m.append(rowScore, rowStat, rowNc, rowDoc, rowAud);
    card.append(m);
  }
  return card;
}

/**
 * @param {{
 *   onAnalyze: (row: Record<string, unknown> & { normCode: string }) => void;
 *   refreshTable: () => void;
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
    'Par défaut : exigence, statut, action — responsable et preuve dans « Colonnes complètes » ou au détail.';
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
        `Ouvrir le détail — ${row.clause} ${row.title}`
      );
      const stClass = isoRequirementBadgeClass(row.status);
      const badgeLabel = isoRequirementStatusDisplayLabel(row.status);

      const exigence = document.createElement('span');
      exigence.className = 'iso-cell-strong';
      exigence.append(
        document.createTextNode(`${row.clause} — ${row.title}`),
        document.createElement('br')
      );
      const normSmall = document.createElement('span');
      normSmall.className = 'iso-cell-muted iso-cell-small';
      normSmall.textContent = normCode;
      exigence.append(normSmall);

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
        openRow();
      });
      line.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
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

  renderRows();
  ctx.refreshTable = renderRows;
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
            showToast('Document rattaché à l’exigence — preuve enregistrée localement.', 'success');
            if (typeof onAddLog === 'function') {
              onAddLog({
                module: 'iso',
                action: 'Import document validé (preuve)',
                detail: `${file.name} → ${requirementId} (${proofStatus})`,
                user: 'Utilisateur'
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
  return { root, renderAttention };
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
    'Exigences, documents et écarts suivent ce cycle — décision et validation humaines à chaque étape.';
  wrap.append(cap);
  return wrap;
}

/**
 * @param {(row: Record<string, unknown> & { normCode: string }) => void} onAnalyze
 */
function createPrioritiesCockpitBlock(onAnalyze) {
  const root = document.createElement('article');
  root.className = 'content-card card-soft iso-cockpit-priorities';
  root.setAttribute('aria-labelledby', 'iso-cockpit-prio-title');

  const head = document.createElement('div');
  head.className = 'content-card-head';
  head.innerHTML = `
    <div>
      <div class="section-kicker">Pilotage</div>
      <h3 id="iso-cockpit-prio-title">Priorités à traiter</h3>
      <p class="content-card-lead">Exigences en écart, pièces à consolider, audits à caler — une action principale par sujet.</p>
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
    const ar = computeAuditReadiness();
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
      hDetail = `${firstNc.clause} — ${firstNc.title} (${norm ? norm.code : firstNc.normId}).`;
      hOn = () => onAnalyze({ ...firstNc, normCode: norm ? norm.code : firstNc.normId });
    } else if (ar.missingDocsCount > 0) {
      hTitle = 'Documents manquants — risque pour l’audit';
      hDetail = `${ar.missingDocsCount} pièce(s) signalée(s) — joindre les preuves au registre.`;
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
        : `${docLines.length} pièce(s) — ${docLines[0].name} (${docLines[0].tag})${
            docLines.length > 1 ? ` · +${docLines.length - 1} autre(s)` : ''
          }`;
    appendPriorityRow('Documents & preuves', docDetail, 'Ouvrir documents', () => {
      ensureIsoDocsPanelOpen();
      document.querySelector('.iso-page .iso-docs-priority')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const audDetail = AUDITS_TO_SCHEDULE.length
      ? AUDITS_TO_SCHEDULE.map((a) => `· ${a.title} — ${a.horizon}`).join('\n')
      : 'Aucune échéance planifiée sur le périmètre affiché.';
    appendPriorityRow('Audits à planifier', audDetail, 'Voir Audits', () => {
      window.location.hash = 'audits';
      showToast('Module Audits.', 'info');
    });

    const ncForList = reqsNc[0];
    const ncDetail = ncForList
      ? `${ncForList.clause} — ${ncForList.title} (non-conformité à traiter en priorité).`
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
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'iso-doc-proof-strip-title';
      empty.style.opacity = '0.85';
      empty.textContent = 'Aucun document listé.';
      wrap.append(empty);
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
      badge.textContent = row.complianceLabel || '—';
      line.append(name, badge);
      wrap.append(line);
    });
    const imports = getImportedDocumentProofs();
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
 * Panneau second niveau (élément HTML details natif) — détail métier replié par défaut, zéro perte de fonction.
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

  const page = document.createElement('section');
  page.className = 'page-stack iso-page iso-page--hub iso-page--cockpit iso-page--conformite-premium';

  const { bar: isoPageViewBar } = mountPageViewModeSwitch({
    pageId: 'iso',
    pageRoot: page,
    hintEssential:
      'Essentiel : préparation audit, synthèse, priorités et registre des exigences — normes, assistant et graphiques masqués.',
    hintAdvanced:
      'Expert : cartographie normes, assistant conformité, graphique du registre et revue de direction.'
  });

  const isoMixChartHosts = { req: null };
  const isoNav = pageTopbarById.iso;

  const auditApiMeta = { auditsCount: 0, lastAuditDate: '' };
  const buildReadinessState = () => {
    const base = computeAuditReadiness();
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
      showToast('Traiter les priorités — écarts, preuves et audits.', 'info');
    }
  });

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
          Vue unique pour direction et auditeurs : indicateurs, preuves et écarts — chaque décision reste validée par vos équipes (aucune écriture automatique).
        </p>
      </div>
      <div class="iso-cockpit-hero-actions">
        <button type="button" class="btn btn-secondary iso-hero-scroll-prio">Voir les priorités</button>
        <button type="button" class="btn btn-secondary iso-auditor-view-btn" title="Focus écarts, preuves et statuts">Vue auditeur</button>
        <button type="button" class="btn btn-secondary iso-export-conformity-pdf" title="Rapport PDF multi-pages (vue cockpit)">Exporter PDF conformité</button>
        <button type="button" class="btn btn-primary btn--pilotage-cta iso-prep-audit">Préparer l’audit</button>
      </div>
    </div>
    <div class="iso-cockpit-hero-executive-band">
      <div class="iso-cockpit-hero-kpis iso-cockpit-hero-kpis--dual" aria-label="Synthèse express">
        <div class="iso-hero-kpi">
          <span class="iso-hero-kpi-value iso-hero-stat-pct">—</span>
          <span class="iso-hero-kpi-label">Score global</span>
        </div>
        <div class="iso-hero-kpi">
          <span class="iso-hero-kpi-value iso-hero-stat-gaps">—</span>
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
        globalScoreLabel: pctEl?.textContent?.trim() || '—',
        gapsLabel: gapEl?.textContent?.trim() || '—',
        normScores: buildIsoNormScoresForPdf(),
        requirementLines: requirementLinesForIsoPdf()
      });
      await downloadAuditIsoPdfFromHtml(html, 'rapport-conformite-iso');
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'iso',
          action: 'Export PDF conformité ISO',
          detail: 'Rapport multi-pages — cockpit',
          user: getSessionUser()?.name || 'Utilisateur'
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  heroCard.querySelector('.iso-prep-audit').addEventListener('click', () => {
    showToast(
      'Préparation d’audit : checklist, équipe et pièces — intégration workflow possible selon votre déploiement.',
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
    <p class="iso-ai-trust">Suggestions contextuelles uniquement — le registre et les statuts sont toujours validés par un humain.</p>
    <p class="iso-ai-lead">
      Accélérez les revues : analyse des écarts, preuves manquantes et pistes de plan d’action, puis traitement dans le registre.
    </p>
    <div class="iso-ai-suggestion-grid" role="group" aria-label="Assistant conformité — actions suggérées"></div>
  `;

  const summary0 = computeComplianceSummary();
  const globalSnapshotEl = createGlobalSnapshot(summary0);
  const snapHost = heroCard.querySelector('.iso-cockpit-hero-snapshot-host');
  if (snapHost) snapHost.append(globalSnapshotEl);

  function updateHeroQuickStats() {
    const s = computeComplianceSummary();
    const gapsOpen = getRequirements().filter((r) => isoRequirementStatusNormKey(r.status) !== 'conforme').length;
    const pctEl = heroCard.querySelector('.iso-hero-stat-pct');
    const gapEl = heroCard.querySelector('.iso-hero-stat-gaps');
    if (pctEl) pctEl.textContent = `${s.pct} %`;
    if (gapEl) gapEl.textContent = String(gapsOpen);
  }
  updateHeroQuickStats();

  /** @type {{ rows: object[] }} */
  const isoMergedDocsRef = { rows: mergeControlledDocumentRows([]) };
  const getIsoDocRows = () => isoMergedDocsRef.rows;

  const registryDocImpact = createIsoRegistryComplianceBanner();
  const docStateSummary = createDocumentStateSummaryBlock();
  docStateSummary.update(computeDocumentRegistrySummary(isoMergedDocsRef.rows));
  registryDocImpact.update(computeDocumentRegistrySummary(isoMergedDocsRef.rows));

  const docTableSection = createControlledDocumentsTableSection({
    getRows: getIsoDocRows,
    onAddLog
  });

  /** @type {{ refreshTable: () => void; onAnalyze: (row: unknown) => void }} */
  const tableCtx = {
    refreshTable: () => {},
    onAnalyze: () => {}
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
              clause: row.clause,
              title: row.title,
              summary: row.summary,
              evidence: row.evidence,
              normCode: row.normCode
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
          version: r.version || '—'
        })),
        siteId: appState.activeSiteId,
        onStatusCommitted: (requirementId, status, meta) => {
          void (async () => {
            if (
              !(await ensureSensitiveAccess('critical_validation', {
                contextLabel: 'mise à jour du statut d’exigence (conformité)'
              }))
            ) {
              return;
            }
            setRequirementStatus(requirementId, status);
            refreshPilotage();
            if (typeof onAddLog === 'function') {
              onAddLog({
                module: 'iso',
                action: 'Statut exigence mis à jour (validation humaine)',
                detail: `${requirementId} → ${status} (${meta.source})`,
                user: 'Utilisateur'
              });
            }
          })();
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
        window.location.hash = h;
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

  async function syncControlledDocumentsFromApi() {
    try {
      const api = await fetchControlledDocumentsFromApi();
      isoMergedDocsRef.rows = mergeControlledDocumentRows(api);
      const sum = computeDocumentRegistrySummary(isoMergedDocsRef.rows);
      docStateSummary.update(sum);
      registryDocImpact.update(sum);
      docTableSection.refresh();
      proofStripBundle.refresh();
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
      <h3>9001 · 14001 · 45001 — lecture consolidée</h3>
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
          auditLine
        })
      );
    });
  }
  renderNormsGrid();
  normsCard.append(normsHead, normsCycle, normsGrid);

  const { root: prioritiesCockpit, refresh: refreshPrioritiesCockpit } = createPrioritiesCockpitBlock((row) =>
    tableCtx.onAnalyze(row)
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
      updateGlobalSnapshot(globalSnapshotEl, computeComplianceSummary());
      updateHeroQuickStats();
      updateAuditReadinessBanner(auditReadinessEl, buildReadinessState());
      renderNormsGrid();
      refreshPrioritiesCockpit();
      refreshCopilot();
      tableCtx.refreshTable();
      docsSection.renderAttention();
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
        <p class="content-card-lead">Entrées pour le comité — synthèse des indicateurs affichés.</p>
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
    'Synthèse conformité, preuves, priorités et tableau documents — tout le flux métier conservé.',
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
    'Suggestions et raccourcis — validation humaine inchangée.',
    aiSpotlight,
    'iso-l2-disclosure--assistant'
  );
  focusZone.append(normsHub, assistantDisclosure);

  const focusIntro = document.createElement('div');
  focusIntro.className = 'iso-zone-header iso-focus-zone-intro';
  focusIntro.innerHTML = `
    <p class="iso-zone-header__kicker">Cartographie</p>
    <h2 class="iso-zone-header__title">Normes &amp; assistance</h2>
    <p class="iso-zone-header__desc">Référentiels et lecture opérationnelle, avec l’assistant pour préparer vos revues — le registre reste la source de vérité.</p>
  `;

  const focusWrap = document.createElement('div');
  focusWrap.className = 'iso-focus-wrap qhse-page-advanced-only';
  focusWrap.append(focusIntro, focusZone);

  const secondaryZone = document.createElement('div');
  secondaryZone.className = 'iso-secondary-zone';
  const reviewDisclosure = wrapIsoL2Disclosure(
    'Revue de direction — synthèse',
    'Indicateurs agrégés pour comité — ouvrir pour le détail.',
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
    <p class="iso-zone-header__desc">Répartition des statuts d’exigences — cohérente avec le tableau et les filtres ci-dessous.</p>
  `;
  insightsZone.append(insightsHead, isoMixRow);
  /* Graphique redondant avec le tableau : disponible sans encombrer le premier écran. */
  const insightsDisclosure = wrapIsoL2Disclosure(
    'Graphique · répartition des exigences',
    'Même données que le registre — ouvrir pour la vue visuelle.',
    insightsZone,
    'iso-l2-disclosure--insights'
  );
  insightsDisclosure.classList.add('qhse-page-advanced-only');

  page.append(
    isoPageViewBar,
    auditReadinessEl,
    heroCard,
    priorityShell,
    focusWrap,
    insightsDisclosure,
    secondaryWrap
  );
  return page;
}
