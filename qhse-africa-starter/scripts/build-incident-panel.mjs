import fs from 'node:fs';
let body = fs.readFileSync('src/components/_incidentDetailBody.txt', 'utf8');
body = body.replace(/^  /gm, '');
body = body.replace(/\bdetailInner\b/g, 'container');
body = body.replace(/\bcanWriteIncidents\b/g, 'ctx.canWriteIncidents');
body = body.replace(/\bcanWriteActions\b/g, 'ctx.canWriteActions');
body = body.replace(/\bpatchIncidentStatus\(/g, 'ctx.patchIncidentStatus(');
body = body.replace(/\bincidentRecords\b/g, 'ctx.incidentRecords');
body = body.replace(/\btypeof onAddLog === 'function'/g, "typeof ctx.onAddLog === 'function'");
body = body.replace(/\bonAddLog\(/g, 'ctx.onAddLog(');
body = body.replace(/\brefreshIncidentJournal\(\)/g, 'ctx.refreshIncidentJournal()');
body = body.replace(/\bif \(fresh\) renderDetailForIncident\(fresh\)/g, 'if (fresh) await mountIncidentDetailPanel(container, fresh, ctx)');
body = body.replace(
  /^function renderDetailEmpty\(message\)/m,
  'export function mountIncidentDetailEmpty(container, message)'
);
body = body.replace(
  /^async function renderDetailForIncident\(inc\)/m,
  'export async function mountIncidentDetailPanel(container, inc, ctx)'
);
const header = `import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { showToast } from './toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { linkModules } from '../services/moduleLinks.service.js';
import { mergeActionOverlay, appendActionHistory } from '../utils/actionPilotageMock.js';
import { openActionCreateDialog } from './actionCreateDialog.js';
import { buildActionDefaultsFromIncident } from '../utils/qhseAssistantFormSuggestions.js';
import { appState } from '../utils/state.js';
import { openRiskCreateDialog } from './riskFormDialog.js';
import { fetchUsers } from '../services/users.service.js';
import { mapApiIncident, mapRowToDisplay } from '../utils/incidentsMappers.js';

const STATUS_PRESETS = ['Nouveau', 'En cours', 'Investigation', 'Clôturé'];

function sanitizeClassToken(value, fallback = 'neutral') {
  const token = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '');
  return token || fallback;
}

function normalizedUserRole(role) {
  return String(role ?? '').trim().toUpperCase();
}

/** @type {object[] | null} */
let cachedUsersForActions = null;

async function ensureUsersCached() {
  if (cachedUsersForActions) return cachedUsersForActions;
  try {
    cachedUsersForActions = await fetchUsers();
  } catch (e) {
    console.warn('[incidentDetailPanel] fetchUsers', e);
    cachedUsersForActions = [];
  }
  return cachedUsersForActions;
}

async function fetchActionsLinkedToIncident(ref) {
  const needle = String(ref || '').trim().toUpperCase();
  if (!needle) return [];
  try {
    const res = await qhseFetch(withSiteQuery('/api/actions?limit=400'));
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((a) => {
      const t = String(a.title || '').toUpperCase();
      const d = String(a.detail || '').toUpperCase();
      return t.includes(needle) || d.includes(needle);
    });
  } catch {
    return [];
  }
}

function incidentOperationalPhase(status) {
  const s = String(status || '').toLowerCase();
  if (/clos|ferm|termin|clôtur|clotur|résolu|resolu|done|complete|trait/.test(s)) {
    return 'traite';
  }
  if (/invest|analys/.test(s) || /\bcours\b/.test(s)) {
    return 'analyse';
  }
  return 'ouvert';
}

function incidentPhaseLabel(status) {
  const p = incidentOperationalPhase(status);
  if (p === 'traite') return 'Traité';
  if (p === 'analyse') return 'En analyse';
  return 'Ouvert';
}

function severityDsBadgeClass(sev) {
  if (sev === 'faible') return 'ds-badge--ok';
  if (sev === 'critique') return 'ds-badge--danger';
  return 'ds-badge--warn';
}

function statusOptionsForSelect(current) {
  const cur = String(current || '').trim();
  const set = new Set(STATUS_PRESETS);
  if (cur && !set.has(cur)) {
    return [cur, ...STATUS_PRESETS];
  }
  return [...STATUS_PRESETS];
}

function inferIncidentAiCauseProbable(inc) {
  const t = String(inc.type || '');
  if (/accident/i.test(t) && !/quasi/i.test(t)) {
    return 'Scénario accidentel : vérifier conditions de poste, EPI et consignes appliquées.';
  }
  if (/quasi/i.test(t)) {
    return 'Near-miss : dérive comportementale ou situation non maîtrisée — creuser avant reproduction.';
  }
  if (/environnement/i.test(t)) {
    return 'Facteur environnement / matière : contrôler stockage, déchets, rejets ou conditions météo.';
  }
  if (/engin|circulation/i.test(t)) {
    return 'Cohabitation engins / piétons ou circulation : signalisation, vitesse, zones de croisement.';
  }
  return 'Cause à affiner après retour terrain et recoupement des témoins.';
}

function inferIncidentAiActionRecommandee(inc) {
  if (inc.severity === 'critique') {
    return 'Sécuriser la zone, prévenir la hiérarchie, consigner les faits et lancer une action corrective immédiate.';
  }
  if (inc.severity === 'moyen') {
    return 'Analyse rapide en équipe, contrôle des barrières existantes et plan de suivi sous 48 h.';
  }
  return 'Point sécurité en début de poste et vérification des mesures préventives habituelles.';
}

async function createLinkedAction(inc) {
  await ensureUsersCached();
  const qhse = cachedUsersForActions?.find((u) => normalizedUserRole(u.role) === 'QHSE');
  const detailParts = [
    \`Incident \${inc.ref}\`,
    \`\${inc.type} · \${inc.site}\`,
    inc.severity ? \`Gravité : \${inc.severity}\` : '',
    inc.description ? inc.description.slice(0, 400) : ''
  ].filter(Boolean);
  const body = {
    title: \`Suite incident \${inc.ref}\`,
    detail: detailParts.join(' — '),
    status: 'À lancer',
    owner: 'Responsable QHSE'
  };
  if (qhse) {
    body.assigneeId = qhse.id;
    body.owner = qhse.name;
  }
  if (appState.activeSiteId) {
    body.siteId = appState.activeSiteId;
  }
  const res = await qhseFetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    try {
      const errBody = await res.json();
      console.error('[incidentDetailPanel] POST action liée', res.status, errBody);
    } catch {
      console.error('[incidentDetailPanel] POST action liée', res.status);
    }
    showToast('Impossible de créer l’action', 'error');
    return;
  }
  showToast(\`Action créée — liée à \${inc.ref}\`, 'info');
  linkModules({
    fromModule: 'incidents',
    fromId: inc.ref,
    toModule: 'actions',
    toId: \`action_for_\${inc.ref}\`,
    kind: 'incident_to_action'
  });
  activityLogStore.add({
    module: 'incidents',
    action: 'Création action liée',
    detail: \`Depuis incident \${inc.ref}\`,
    user: getSessionUser()?.name || 'Responsable QHSE'
  });
}

async function proposeCorrectiveActionViaAssistant(inc) {
  await ensureUsersCached();
  openActionCreateDialog({
    users: cachedUsersForActions || [],
    defaults: buildActionDefaultsFromIncident(inc),
    onCreated: () => {
      showToast('Action enregistrée — issue du formulaire assistant.', 'success');
      activityLogStore.add({
        module: 'incidents',
        action: 'Création action (assistant guidé)',
        detail: inc.ref,
        user: getSessionUser()?.name || 'Utilisateur'
      });
    }
  });
}

async function createCorrectiveAction(inc) {
  await ensureUsersCached();
  const qhse = cachedUsersForActions?.find((u) => normalizedUserRole(u.role) === 'QHSE');
  const detailParts = [
    \`Action corrective — incident \${inc.ref}\`,
    \`\${inc.type} · \${inc.site}\`,
    inc.severity ? \`Gravité : \${inc.severity}\` : '',
    inc.description ? inc.description.slice(0, 400) : ''
  ].filter(Boolean);
  const body = {
    title: \`Corrective — \${inc.ref}\`,
    detail: detailParts.join(' — '),
    status: 'À lancer',
    owner: 'Responsable QHSE'
  };
  if (qhse) {
    body.assigneeId = qhse.id;
    body.owner = qhse.name;
  }
  if (appState.activeSiteId) {
    body.siteId = appState.activeSiteId;
  }
  const res = await qhseFetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    showToast('Impossible de créer l’action corrective', 'error');
    return;
  }
  const created = await res.json();
  const id = created?.id;
  if (id) {
    mergeActionOverlay(String(id), {
      actionType: 'corrective',
      origin: 'incident',
      priority: inc.severity === 'critique' ? 'haute' : 'normale',
      progressPct: 0,
      linkedIncident: inc.ref
    });
    appendActionHistory(String(id), \`Créée depuis incident \${inc.ref} (corrective).\`);
  }
  showToast(\`Action corrective créée — \${inc.ref}\`, 'success');
  linkModules({
    fromModule: 'incidents',
    fromId: inc.ref,
    toModule: 'actions',
    toId: \`corrective_for_\${inc.ref}\`,
    kind: 'incident_to_action'
  });
  activityLogStore.add({
    module: 'incidents',
    action: 'Création action corrective',
    detail: inc.ref,
    user: getSessionUser()?.name || 'Responsable QHSE'
  });
}

const DIALOG_STYLE_ID = 'qhse-incident-detail-dialog-style';

function ensureIncidentDetailDialogStyles() {
  if (document.getElementById(DIALOG_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = DIALOG_STYLE_ID;
  el.textContent = \`.qhse-incident-detail-dialog{border:none;border-radius:14px;max-width:min(520px,96vw);max-height:min(92vh,900px);padding:0;background:var(--bg,#0f172a);color:var(--text);box-shadow:0 24px 64px rgba(0,0,0,.55)}
.qhse-incident-detail-dialog::backdrop{background:rgba(0,0,0,.55)}
.qhse-incident-detail-dialog__toolbar{display:flex;justify-content:flex-end;padding:10px 12px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.qhse-incident-detail-dialog__body{overflow:auto;max-height:min(86vh,860px);padding:12px 16px 18px}\`;
  document.head.append(el);
}

export function openIncidentDetail(inc, ctx) {
  ensureIncidentDetailDialogStyles();
  const dlg = document.createElement('dialog');
  dlg.className = 'qhse-incident-detail-dialog';
  const toolbar = document.createElement('div');
  toolbar.className = 'qhse-incident-detail-dialog__toolbar';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-secondary';
  closeBtn.textContent = 'Fermer';
  closeBtn.addEventListener('click', () => dlg.close());
  toolbar.append(closeBtn);
  const body = document.createElement('div');
  body.className = 'qhse-incident-detail-dialog__body';
  dlg.append(toolbar, body);
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  void mountIncidentDetailPanel(body, inc, ctx);
  dlg.showModal();
}

`;
const out = `${header}\n${body}\n`;
fs.writeFileSync('src/components/incidentDetailPanel.js', out, 'utf8');
console.log('wrote incidentDetailPanel.js', out.split('\n').length);
