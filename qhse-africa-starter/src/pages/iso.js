import { showToast } from '../components/toast.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { pageTopbarById } from '../data/navigation.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { createRequirementStatusMixChart } from '../components/dashboardCharts.js';
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
  DOCUMENT_ATTENTION,
  AUDITS_TO_SCHEDULE,
  CONFORMITY_NORMS,
  getImportedDocumentProofs,
  addImportedDocumentProof
} from '../data/conformityStore.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import {
  computeAuditReadiness,
  createAuditReadinessBanner,
  updateAuditReadinessBanner
} from '../components/isoAuditReadiness.js';
import { buildIsoCopilotSuggestions } from '../components/isoCopilotSuggestions.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';

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
 * @param {(row: Record<string, unknown> & { normCode: string }) => void} onAnalyze
 */
function buildPointsPanel(onAnalyze) {
  const panel = document.createElement('section');
  panel.className = 'iso-points-panel iso-actions-priority-section';
  panel.setAttribute('aria-labelledby', 'iso-points-title');

  const title = document.createElement('h3');
  title.id = 'iso-points-title';
  title.className = 'iso-points-panel-title';
  title.textContent = 'Actions prioritaires';

  const lead = document.createElement('p');
  lead.className = 'iso-points-panel-lead';
  lead.textContent = 'Ce qui demande une action maintenant — exigences, documents et audits.';

  const grid = document.createElement('div');
  grid.className = 'iso-points-grid';

  const colReq = document.createElement('div');
  colReq.className = 'iso-points-col';
  const colDoc = document.createElement('div');
  colDoc.className = 'iso-points-col';
  const colAud = document.createElement('div');
  colAud.className = 'iso-points-col';

  grid.append(colReq, colDoc, colAud);
  panel.append(title, lead, grid);

  function renderColContent() {
    const reqs = getRequirements().filter((r) => r.status !== 'conforme');
    const { missing, obsolete, critical } = DOCUMENT_ATTENTION;

    colReq.innerHTML = '';
    const hReq = document.createElement('div');
    hReq.className = 'iso-points-col-head';
    hReq.innerHTML = `<span class="iso-points-icon iso-points-icon--req" aria-hidden="true"></span><span>Exigences</span>`;
    const metricReq = document.createElement('div');
    metricReq.className = 'iso-points-metric';
    metricReq.textContent = reqs.length ? `${reqs.length} à consolider ou corriger` : 'Aucune exigence en écart';
    const listReq = document.createElement('ul');
    listReq.className = 'iso-points-list';
    if (reqs.length === 0) {
      const li = document.createElement('li');
      li.className = 'iso-points-list-empty';
      li.textContent = 'Toutes les exigences suivies sont au vert.';
      listReq.append(li);
    } else {
      reqs.slice(0, 4).forEach((row) => {
        const norm = getNormById(row.normId);
        const normCode = norm ? norm.code : row.normId;
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'iso-points-action-link';
        btn.textContent = `${row.clause} — ${row.title}`;
        btn.addEventListener('click', () => onAnalyze({ ...row, normCode }));
        const badge = document.createElement('span');
        badge.className = `badge ${conformityBadgeClass(row.status)} iso-points-mini-badge`;
        badge.textContent = conformityLabel(row.status);
        li.append(btn, document.createTextNode(' '), badge, document.createElement('br'));
        const sub = document.createElement('span');
        sub.className = 'iso-points-list-sub';
        sub.textContent = normCode;
        li.append(sub);
        listReq.append(li);
      });
      if (reqs.length > 4) {
        const li = document.createElement('li');
        li.className = 'iso-points-list-more';
        li.textContent = `+ ${reqs.length - 4} autre(s) — voir « toutes les exigences » ci-dessous.`;
        listReq.append(li);
      }
    }
    colReq.append(hReq, metricReq, listReq);

    colDoc.innerHTML = '';
    const hDoc = document.createElement('div');
    hDoc.className = 'iso-points-col-head';
    hDoc.innerHTML = `<span class="iso-points-icon iso-points-icon--doc" aria-hidden="true"></span><span>Documents</span>`;
    const nMiss = missing.length;
    const nObs = obsolete.length;
    const nCrit = critical.length;
    const metricDoc = document.createElement('div');
    metricDoc.className = 'iso-points-metric';
    if (nMiss + nObs + nCrit === 0) {
      metricDoc.textContent = 'Aucun document critique signalé';
    } else {
      const parts = [];
      if (nMiss) parts.push(`${nMiss} manquant(s)`);
      if (nObs) parts.push(`${nObs} obsolète(s)`);
      if (nCrit) parts.push(`${nCrit} critique(s)`);
      metricDoc.textContent = parts.join(' · ');
    }
    const listDoc = document.createElement('ul');
    listDoc.className = 'iso-points-list';
    const pushDocItem = (label, name, note) => {
      const li = document.createElement('li');
      const tag = document.createElement('span');
      tag.className = 'iso-points-doc-tag';
      tag.textContent = label;
      const strong = document.createElement('strong');
      strong.textContent = name;
      const p = document.createElement('p');
      p.className = 'iso-points-list-note';
      p.textContent = note;
      li.append(tag, strong, p);
      listDoc.append(li);
    };
    missing.forEach((d) => pushDocItem('Manquant', d.name, d.note));
    obsolete.forEach((d) => pushDocItem('Obsolète', d.name + (d.version ? ` v${d.version}` : ''), d.note));
    critical.forEach((d) => pushDocItem('Critique', d.name + (d.version ? ` v${d.version}` : ''), d.note));
    if (listDoc.children.length === 0) {
      const li = document.createElement('li');
      li.className = 'iso-points-list-empty';
      li.textContent = 'Rien à signaler sur les documents prioritaires.';
      listDoc.append(li);
    }
    colDoc.append(hDoc, metricDoc, listDoc);

    colAud.innerHTML = '';
    const hAud = document.createElement('div');
    hAud.className = 'iso-points-col-head';
    hAud.innerHTML = `<span class="iso-points-icon iso-points-icon--aud" aria-hidden="true"></span><span>Audits à faire</span>`;
    const metricAud = document.createElement('div');
    metricAud.className = 'iso-points-metric';
    metricAud.textContent = AUDITS_TO_SCHEDULE.length
      ? `${AUDITS_TO_SCHEDULE.length} échéance(s) à piloter`                
      : 'Aucun audit planifié pour l’instant';
    const listAud = document.createElement('ul');
    listAud.className = 'iso-points-list';
    AUDITS_TO_SCHEDULE.forEach((a) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHtml(a.title)}</strong><p class="iso-points-list-note">${escapeHtml(
        a.horizon
      )}<span class="iso-points-list-sub"> · ${escapeHtml(a.owner)}</span></p>`;
      listAud.append(li);
    });
    if (AUDITS_TO_SCHEDULE.length === 0) {
      const li = document.createElement('li');
      li.className = 'iso-points-list-empty';
      li.textContent = 'Ajoutez ou planifiez vos audits depuis le module Audits.';
      listAud.append(li);
    }
    colAud.append(hAud, metricAud, listAud);
  }

  renderColContent();
  return { panel, renderColContent };
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

  const filterBar = document.createElement('div');
  filterBar.className = 'iso-req-filter-bar';
  filterBar.setAttribute('role', 'group');
  filterBar.setAttribute('aria-label', 'Filtrer les exigences par statut');
  const mkFilterBtn = (key, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary iso-req-filter-btn';
    b.dataset.filter = key;
    b.textContent = label;
    b.addEventListener('click', () => {
      statusFilter = key;
      filterBar.querySelectorAll('.iso-req-filter-btn').forEach((el) => {
        el.classList.toggle('iso-req-filter-btn--active', el.dataset.filter === key);
      });
      renderRows();
    });
    return b;
  };
  const fAll = mkFilterBtn('all', 'Toutes');
  const fGap = mkFilterBtn('gap', 'Écarts');
  const fPartial = mkFilterBtn('partial', 'Partiels');
  const fNc = mkFilterBtn('nc', 'Non conformes');
  const fOk = mkFilterBtn('ok', 'Conformes');
  fAll.classList.add('iso-req-filter-btn--active');
  filterBar.append(fAll, fGap, fPartial, fNc, fOk);

  const table = document.createElement('div');
  table.className = 'iso-table iso-req-table';

  const head = document.createElement('div');
  head.className = 'iso-table-head';
  head.innerHTML = `
    <span>Exigence</span>
    <span>Statut</span>
    <span>Action</span>
    <span>Responsable</span>
    <span>Preuve documentaire</span>
  `;
  table.append(head);

  function renderRows() {
    table.querySelectorAll('.iso-table-row').forEach((el) => el.remove());
    let rows = getRequirements();
    if (statusFilter === 'gap') rows = rows.filter((r) => r.status !== 'conforme');
    else if (statusFilter === 'partial') rows = rows.filter((r) => r.status === 'partiel');
    else if (statusFilter === 'nc') rows = rows.filter((r) => r.status === 'non_conforme');
    else if (statusFilter === 'ok') rows = rows.filter((r) => r.status === 'conforme');
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
      const stClass = conformityBadgeClass(row.status);
      const badgeLabel = conformityLabel(row.status);

      const exigence = document.createElement('span');
      exigence.className = 'iso-cell-strong';
      exigence.innerHTML = `${escapeHtml(row.clause)} — ${escapeHtml(row.title)}<br/><span class="iso-cell-muted iso-cell-small">${escapeHtml(
        normCode
      )}</span>`;

      const statCell = document.createElement('span');
      statCell.className = 'iso-req-status-cell';
      statCell.innerHTML = `<span class="badge ${stClass} iso-req-status-badge">${escapeHtml(
        badgeLabel
      )}</span>`;

      const assistCell = document.createElement('span');
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
      owner.className = 'iso-cell-muted';
      owner.textContent = row.owner;

      const proof = document.createElement('span');
      proof.className = 'iso-cell-muted iso-evidence-cell';
      proof.style.whiteSpace = 'pre-line';
      proof.textContent = formatEvidenceWithImports(row.evidence, row.id);

      line.append(exigence, statCell, assistCell, owner, proof);
      table.append(line);
    });
  }

  renderRows();
  ctx.refreshTable = renderRows;
  wrap.append(registryDocImpact.root, filterBar, table);
  return wrap;
}

/**
 * @param {{ onAnalyze: (row: Record<string, unknown> & { normCode: string }) => void }} ctx
 * @param {{ refreshHotList?: () => void }} [ref]
 */
function createRequirementsHotList(ctx, ref) {
  const wrap = document.createElement('div');
  wrap.className = 'iso-req-hot-wrap';

  function render() {
    wrap.innerHTML = '';
    const problematic = getRequirements().filter((r) => r.status !== 'conforme');
    if (problematic.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'iso-req-hot-empty';
      empty.textContent =
        'Aucune exigence problématique : les écarts partiels et non conformes apparaîtront ici pour action rapide.';
      wrap.append(empty);
      return;
    }
    problematic.forEach((row) => {
      const norm = getNormById(row.normId);
      const normCode = norm ? norm.code : row.normId;
      const item = document.createElement('div');
      item.className = 'iso-req-hot-item';
      const left = document.createElement('div');
      left.className = 'iso-req-hot-main';
      const title = document.createElement('div');
      title.className = 'iso-req-hot-title';
      title.textContent = `${row.clause} — ${row.title}`;
      const sub = document.createElement('div');
      sub.className = 'iso-req-hot-sub';
      sub.textContent = `${normCode} · ${row.owner}`;
      left.append(title, sub);
      const badge = document.createElement('span');
      badge.className = `badge ${conformityBadgeClass(row.status)}`;
      badge.textContent = conformityLabel(row.status);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary iso-req-hot-btn';
      btn.textContent = 'Traiter';
      btn.addEventListener('click', () => ctx.onAnalyze({ ...row, normCode }));
      item.append(left, badge, btn);
      wrap.append(item);
    });
  }

  if (ref) ref.refreshHotList = render;
  render();
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
    const reqsNc = getRequirements().filter((r) => r.status === 'non_conforme');
    const reqsOpen = getRequirements().filter((r) => r.status !== 'conforme');
    const ar = computeAuditReadiness();
    const firstNc = reqsNc[0];
    const hero = document.createElement('div');
    hero.className = 'iso-priority-hero';
    let hTitle = 'Priorité principale';
    let hDetail = 'Consolider exigences et preuves avant la prochaine visite audit.';
    /** @type {() => void} */
    let hOn = () => {
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

function createAuditsLinkedStrip() {
  const wrap = document.createElement('div');
  wrap.className = 'iso-audits-linked';
  const h = document.createElement('div');
  h.className = 'iso-audits-linked-head';
  h.textContent = 'Audits liés aux normes';
  wrap.append(h);
  if (!AUDITS_TO_SCHEDULE.length) {
    const p = document.createElement('p');
    p.className = 'iso-audits-linked-empty';
    p.textContent = 'Aucun audit lié pour le moment — consultez le module Audits pour le planning complet.';
    wrap.append(p);
  } else {
    const ul = document.createElement('ul');
    ul.className = 'iso-audits-linked-list';
    AUDITS_TO_SCHEDULE.forEach((a, i) => {
      const li = document.createElement('li');
      li.className = 'iso-audits-linked-item';
      const rowTop = document.createElement('div');
      rowTop.className = 'iso-audits-linked-item-top';
      const strong = document.createElement('strong');
      strong.textContent = a.title;
      const stBadge = document.createElement('span');
      stBadge.className = `badge ${i % 2 === 0 ? 'amber' : 'blue'} iso-audits-linked-status`;
      stBadge.textContent = 'À planifier';
      rowTop.append(strong, stBadge);
      const sub = document.createElement('span');
      sub.className = 'iso-audits-linked-sub';
      sub.textContent = `${a.horizon} · ${a.owner}`;
      li.append(rowTop, sub);
      ul.append(li);
    });
    wrap.append(ul);
  }
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-secondary iso-audits-linked-cta';
  b.textContent = 'Accès rapide module Audits';
  b.addEventListener('click', () => {
    window.location.hash = 'audits';
    showToast('Navigation vers le module Audits.', 'info');
  });
  wrap.append(b);
  return wrap;
}

function createReviewBlock() {
  const grid = document.createElement('div');
  grid.className = 'iso-review-grid';
  REVIEW_PREP.forEach((item) => {
    const tile = document.createElement('div');
    tile.className = 'iso-review-tile';
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

export function renderIso(onAddLog) {
  ensureIsoPageStyles();
  ensureQhsePilotageStyles();
  ensureDashboardStyles();

  const page = document.createElement('section');
  page.className = 'page-stack iso-page iso-page--hub iso-page--cockpit iso-page--conformite-premium';
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
    const gapsOpen = getRequirements().filter((r) => r.status !== 'conforme').length;
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
            clause: `${row.clause} — ${row.title}`,
            context: [row.summary, row.evidence, row.normCode].filter(Boolean).join(' | ')
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
        document.querySelector(`.iso-page ${sel}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      },
      onOpenFirstNc: () => {
        const nc = getRequirements().find((r) => r.status === 'non_conforme');
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
      if (r.status === 'conforme') pts += 100;
      else if (r.status === 'partiel') pts += 50;
    });
    return Math.round(pts / reqs.length);
  }

  function normPilotLabels(reqs) {
    const nc = reqs.filter((r) => r.status === 'non_conforme').length;
    const gap = reqs.filter((r) => r.status !== 'conforme').length;
    if (nc > 0) return { label: 'Critique', cls: 'red' };
    if (gap > 0) return { label: 'À risque', cls: 'amber' };
    return { label: 'OK', cls: 'green' };
  }

  function renderNormsGrid() {
    normsGrid.replaceChildren();
    const { missing, obsolete, critical } = DOCUMENT_ATTENTION;
    const docCounts = [missing.length, obsolete.length, critical.length];
    CONFORMITY_NORMS.forEach((sn, idx) => {
      const lite = NORMS_LITE.find((x) => x.id === sn.code);
      if (!lite) return;
      const reqs = getRequirements().filter((r) => r.normId === sn.id);
      const nonOkAll = reqs.filter((r) => r.status !== 'conforme').length;
      const strictNc = reqs.filter((r) => r.status === 'non_conforme').length;
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

  function paintIsoMixCharts() {
    if (isoMixChartHosts.req) {
      const reqs = getRequirements();
      let conforme = 0;
      let partiel = 0;
      let nonConforme = 0;
      reqs.forEach((r) => {
        if (r.status === 'conforme') conforme += 1;
        else if (r.status === 'partiel') partiel += 1;
        else nonConforme += 1;
      });
      isoMixChartHosts.req.replaceChildren(
        createRequirementStatusMixChart({ conforme, partiel, nonConforme })
      );
    }
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
      paintIsoMixCharts();
    } finally {
      isRefreshingPilotage = false;
      if (refreshPilotageQueued) {
        refreshPilotageQueued = false;
        queueMicrotask(refreshPilotage);
      }
    }
  }

  pilotageCtx.refreshPilotage = refreshPilotage;

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
  asideCol.append(docsCard);
  layout.append(mainCol, asideCol);

  const normsHub = document.createElement('div');
  normsHub.className = 'iso-norms-hub';
  normsHub.append(normsCard);

  const focusZone = document.createElement('div');
  focusZone.className = 'iso-focus-zone';
  focusZone.append(normsHub, aiSpotlight);

  const focusIntro = document.createElement('div');
  focusIntro.className = 'iso-zone-header iso-focus-zone-intro';
  focusIntro.innerHTML = `
    <p class="iso-zone-header__kicker">Cartographie</p>
    <h2 class="iso-zone-header__title">Normes &amp; assistance</h2>
    <p class="iso-zone-header__desc">Référentiels et lecture opérationnelle, avec l’assistant pour préparer vos revues — le registre reste la source de vérité.</p>
  `;

  const focusWrap = document.createElement('div');
  focusWrap.className = 'iso-focus-wrap';
  focusWrap.append(focusIntro, focusZone);

  const secondaryZone = document.createElement('div');
  secondaryZone.className = 'iso-secondary-zone';
  secondaryZone.append(layout, reviewCard);

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
  paintIsoMixCharts();

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

  page.append(
    createSimpleModeGuide({
      title: 'Conformité — par où commencer',
      hint: 'Le score et les écarts en tête donnent la santé globale ; les priorités listent ce qui mérite une action maintenant.',
      nextStep: 'Étape suivante : traiter les priorités, puis les normes ci-dessous — le registre détaillé reste accessible en défilant ou en mode Expert.'
    }),
    auditReadinessEl,
    heroCard,
    priorityShell,
    focusWrap,
    insightsZone,
    secondaryWrap
  );
  return page;
}
