/**
 * Liens indicatifs ISO ↔ terrain : agrège listes API existantes (risques, incidents, actions, audits)
 * et applique une correspondance heuristique (id exigence, clause, texte) — sans nouveau backend.
 */
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';

/** @typedef {{ risks: object[]; incidents: object[]; actions: object[]; audits: object[] }} IsoTerrainSnapshot */

let cachedSnapshot = /** @type {IsoTerrainSnapshot | null} */ (null);
let cacheInflight = /** @type {Promise<IsoTerrainSnapshot> | null} */ (null);

export function invalidateIsoTerrainSnapshotCache() {
  cachedSnapshot = null;
  cacheInflight = null;
}

async function readJsonList(res) {
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export async function getIsoTerrainSnapshot() {
  if (cachedSnapshot) return cachedSnapshot;
  if (!cacheInflight) {
    cacheInflight = (async () => {
      const [rR, rI, rA, rU] = await Promise.all([
        qhseFetch(withSiteQuery('/api/risks?limit=400')),
        qhseFetch(withSiteQuery('/api/incidents?limit=400')),
        qhseFetch(withSiteQuery('/api/actions?limit=400')),
        qhseFetch(withSiteQuery('/api/audits?limit=150'))
      ]);
      return {
        risks: await readJsonList(rR),
        incidents: await readJsonList(rI),
        actions: await readJsonList(rA),
        audits: await readJsonList(rU)
      };
    })()
      .then((snap) => {
        cachedSnapshot = snap;
        return snap;
      })
      .finally(() => {
        cacheInflight = null;
      });
  }
  return cacheInflight;
}

function entityHaystack(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const bits = [];
  for (const k of [
    'title',
    'description',
    'detail',
    'ref',
    'type',
    'category',
    'site',
    'status',
    'causes',
    'location',
    'name'
  ]) {
    const v = obj[k];
    if (v != null && typeof v !== 'object') bits.push(String(v));
  }
  if (obj.checklist != null) {
    try {
      bits.push(JSON.stringify(obj.checklist));
    } catch {
      /* ignore */
    }
  }
  return bits.join('\n').toLowerCase();
}

function directRequirementId(entity, reqId) {
  if (!reqId) return false;
  const id = String(reqId).trim();
  const keys = ['requirementId', 'isoRequirementId', 'isoRequirementRef', 'conformityRequirementId'];
  for (const k of keys) {
    const v = entity?.[k];
    if (v != null && String(v).trim() === id) return true;
  }
  return false;
}

/**
 * @param {string} clause
 * @returns {RegExp | null}
 */
function clauseBoundaryRegex(clause) {
  const c = String(clause || '').trim();
  if (!c) return null;
  const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const dotted = `\\b${escaped.replace(/\./g, '\\.')}\\b`;
  const flex = `\\b${escaped.replace(/\./g, '[._-]')}\\b`;
  try {
    return new RegExp(`${dotted}|${flex}`, 'i');
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>} row — exigence registre (id, clause, title…)
 * @param {Record<string, unknown>} entity — ligne API
 * @param {string} haystack — texte entité déjà en minuscules
 */
export function entityMatchesIsoRequirement(row, entity, haystack) {
  const reqId = String(row.id || '').trim();
  if (directRequirementId(entity, reqId)) return true;
  if (reqId && haystack.includes(reqId.toLowerCase())) return true;
  const re = clauseBoundaryRegex(row.clause);
  if (re && re.test(haystack)) return true;
  return false;
}

function actionIsOpen(status) {
  const s = String(status || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (
    /\b(termine|clos|clotur|ferme|complete|realise|valide|fait|acheve|done|closed)\b/.test(s)
  ) {
    return false;
  }
  if (s.includes('termine') || s.includes('clotur') || s.includes('ferme')) return false;
  return true;
}

function documentMatchesRow(row, doc) {
  const rid = String(row.id || '').trim();
  const ref = doc?.isoRequirementRef != null ? String(doc.isoRequirementRef).trim() : '';
  if (rid && ref && ref === rid) return true;
  const hay = [doc?.name, doc?.type, doc?.version, doc?.classification]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return entityMatchesIsoRequirement(row, doc, hay);
}

/**
 * @param {Record<string, unknown>} row
 * @param {IsoTerrainSnapshot | null | undefined} snap
 * @param {object[] | null | undefined} docRows
 */
export function computeTerrainLinksForRequirement(row, snap, docRows) {
  const base = {
    riskCount: 0,
    incidentCount: 0,
    openActionCount: 0,
    auditCount: 0,
    recentAudits: /** @type {{ ref: string; id?: string; at?: string | null }}[] */ ([]),
    documentCount: 0,
    /** @type {{ riskTitle?: string; incidentRef?: string; actionId?: string; auditRef?: string }} */
    navHints: {}
  };
  if (!snap) return base;

  const risks = snap.risks.filter((e) => entityMatchesIsoRequirement(row, e, entityHaystack(e)));
  const incidents = snap.incidents.filter((e) =>
    entityMatchesIsoRequirement(row, e, entityHaystack(e))
  );
  const actionsMatched = snap.actions.filter((e) =>
    entityMatchesIsoRequirement(row, e, entityHaystack(e))
  );
  const actionsOpen = actionsMatched.filter((a) => actionIsOpen(a.status));
  const audits = snap.audits.filter((e) => entityMatchesIsoRequirement(row, e, entityHaystack(e)));

  const recentAudits = audits
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    })
    .slice(0, 4)
    .map((a) => ({
      ref: String(a.ref || '').trim() || '—',
      id: a.id,
      at: (a.updatedAt || a.createdAt || null)?.toString?.() ?? null
    }));

  const docs = (Array.isArray(docRows) ? docRows : []).filter((d) => documentMatchesRow(row, d));

  const riskTitle =
    risks[0] && risks[0].title
      ? String(risks[0].title)
      : `${String(row.clause || '').trim()} ${String(row.title || '').trim()}`.trim();
  const incidentRef = incidents[0]?.ref != null ? String(incidents[0].ref).trim() : '';
  const actionId = actionsOpen[0]?.id != null ? String(actionsOpen[0].id) : '';
  const auditRef =
    recentAudits[0]?.ref && recentAudits[0].ref !== '—'
      ? recentAudits[0].ref
      : audits[0]?.ref != null
        ? String(audits[0].ref).trim()
        : '';

  return {
    riskCount: risks.length,
    incidentCount: incidents.length,
    openActionCount: actionsOpen.length,
    auditCount: audits.length,
    recentAudits,
    documentCount: docs.length,
    navHints: {
      ...(riskTitle ? { riskTitle } : {}),
      ...(incidentRef ? { incidentRef } : {}),
      ...(actionId ? { actionId } : {}),
      ...(auditRef ? { auditRef } : {})
    }
  };
}
