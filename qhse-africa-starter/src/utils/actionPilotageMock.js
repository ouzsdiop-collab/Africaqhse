/**
 * Données de pilotage QHSE (sessionStorage) — complètent l’API actions.
 */

const STORAGE_KEY = 'qhse-action-pilotage-overlay-v1';

/** @typedef {{ at: string, text: string, user?: string }} ActionComment */
/** @typedef {{ at: string, line: string }} ActionHistoryLine */

/**
 * @typedef {object} ActionPilotageOverlay
 * @property {'corrective'|'preventive'|'improvement'} [actionType]
 * @property {'risk'|'audit'|'incident'|'other'} [origin]
 * @property {'basse'|'normale'|'haute'|'critique'} [priority]
 * @property {'reduction_risque_critique'|'reduction_risque_eleve'|'amelioration'} [impact]
 * @property {number} [relanceCount]
 * @property {number} [progressPct]
 * @property {string} [linkedRisk]
 * @property {string} [linkedAudit]
 * @property {string} [linkedIncident]
 * @property {ActionComment[]} [comments]
 * @property {ActionHistoryLine[]} [history]
 */

function readAll() {
  try {
    const j = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    return j && typeof j === 'object' ? j : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * @param {string} actionId
 * @returns {ActionPilotageOverlay}
 */
export function getActionOverlay(actionId) {
  const id = String(actionId || '').trim();
  if (!id) return {};
  const map = readAll();
  const o = map[id];
  return o && typeof o === 'object' ? { ...o } : {};
}

/**
 * @param {string} actionId
 * @param {Partial<ActionPilotageOverlay>} partial
 */
export function mergeActionOverlay(actionId, partial) {
  const id = String(actionId || '').trim();
  if (!id) return;
  const map = readAll();
  const cur = map[id] && typeof map[id] === 'object' ? { ...map[id] } : {};
  Object.assign(cur, partial);
  map[id] = cur;
  writeAll(map);
}

/**
 * @param {string} actionId
 * @param {string} text
 * @param {string} [userName]
 */
export function addActionComment(actionId, text, userName = 'Utilisateur') {
  const t = String(text || '').trim();
  if (!t) return;
  const o = getActionOverlay(actionId);
  const comments = Array.isArray(o.comments) ? [...o.comments] : [];
  comments.push({
    at: new Date().toISOString(),
    text: t,
    user: userName
  });
  mergeActionOverlay(actionId, { comments });
  appendActionHistory(actionId, `Commentaire — ${t.slice(0, 120)}${t.length > 120 ? '…' : ''}`);
}

/**
 * @param {string} actionId
 * @param {string} line
 */
export function appendActionHistory(actionId, line) {
  const id = String(actionId || '').trim();
  const l = String(line || '').trim();
  if (!id || !l) return;
  const o = getActionOverlay(actionId);
  const history = Array.isArray(o.history) ? [...o.history] : [];
  history.push({ at: new Date().toISOString(), line: l });
  mergeActionOverlay(id, { history: history.slice(-80) });
}

/**
 * @param {object} row — ligne API
 * @param {string} actionId
 */
export function ensureDefaultOverlayFromRow(row, actionId) {
  const id = String(actionId || '').trim();
  if (!id) return;
  const cur = getActionOverlay(id);
  const patch = {};
  if (!cur.actionType) patch.actionType = 'corrective';
  if (!cur.origin) {
    if (row?.incident?.ref || row?.incidentId) patch.origin = 'incident';
    else patch.origin = 'other';
  }
  if (cur.progressPct == null) patch.progressPct = 0;
  if (!cur.priority) patch.priority = 'normale';
  if (!cur.impact) patch.impact = 'amelioration';
  if (cur.relanceCount == null) patch.relanceCount = 0;
  if (Object.keys(patch).length) mergeActionOverlay(id, patch);
}

/**
 * Déduit le type depuis le libellé / description (fiches historiques sans overlay explicite).
 * @param {string} [title]
 * @param {string} [detail]
 * @returns {'corrective'|'preventive'|'improvement'|null}
 */
export function inferActionTypeFromText(title, detail) {
  const t = `${String(title || '')} ${String(detail || '')}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (/\b(preventif|prevention|prévention|prévent)\b/.test(t)) return 'preventive';
  if (/\b(amelioration|amélioration)\b/.test(t)) return 'improvement';
  if (/\b(correctif|corrective)\b/.test(t)) return 'corrective';
  return null;
}

/**
 * Type d’action affiché : texte fort si détecté, sinon overlay (session), sinon corrective.
 * @param {object} row — ligne API
 * @param {string} [actionId]
 * @returns {'corrective'|'preventive'|'improvement'}
 */
export function getResolvedActionType(row, actionId) {
  const id = String(actionId || row?.id || '').trim();
  if (!row || !id) return 'corrective';
  ensureDefaultOverlayFromRow(row, id);
  const inferred = inferActionTypeFromText(row.title, row.detail);
  if (inferred) return inferred;
  const o = getActionOverlay(id);
  return o.actionType || 'corrective';
}

/** @param {string} t */
export function normalizeRiskTitleKey(t) {
  return String(t || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
