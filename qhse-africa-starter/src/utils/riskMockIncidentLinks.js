/**
 * Liaisons incident → risque (mock front, sessionStorage).
 */

import { incidentsLinkedToRiskFromApiRows } from './riskIncidentLinks.js';

const STORAGE_KEY = 'qhse-risk-mock-incident-refs';

/** @returns {Record<string, string[]>} */
function readStore() {
  try {
    const j = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    return j && typeof j === 'object' ? j : {};
  } catch {
    return {};
  }
}

function writeStore(map) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * @param {string} riskTitle
 * @returns {string[]}
 */
export function getMockIncidentRefsForRisk(riskTitle) {
  const t = String(riskTitle || '').trim();
  if (!t) return [];
  const map = readStore();
  const arr = map[t];
  return Array.isArray(arr) ? arr.filter(Boolean) : [];
}

/**
 * @param {string} riskTitle
 * @param {string} incidentRef
 */
export function addMockIncidentRefToRisk(riskTitle, incidentRef) {
  const t = String(riskTitle || '').trim();
  const ref = String(incidentRef || '').trim();
  if (!t || !ref) return;
  const map = readStore();
  const cur = Array.isArray(map[t]) ? [...map[t]] : [];
  if (!cur.includes(ref)) cur.push(ref);
  map[t] = cur;
  writeStore(map);
}

/**
 * Fusion API (description) + refs mock.
 * @param {string} riskTitle
 * @param {Array<object>} apiRows
 */
export function getMergedIncidentsForRisk(riskTitle, apiRows) {
  const fromApi = incidentsLinkedToRiskFromApiRows(apiRows, riskTitle);
  const seen = new Set(fromApi.map((x) => String(x.ref)));
  getMockIncidentRefsForRisk(riskTitle).forEach((ref) => {
    if (seen.has(ref)) return;
    const row = (Array.isArray(apiRows) ? apiRows : []).find(
      (r) => String(r?.ref) === ref
    );
    if (row) {
      fromApi.push({
        ref: row.ref || ref,
        type: row.type || '—',
        status: row.status || '—',
        date: row.createdAt
          ? new Date(row.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          : '—'
      });
    } else {
      fromApi.push({
        ref,
        type: '—',
        status: 'Lien manuel (mock)',
        date: '—'
      });
    }
    seen.add(ref);
  });
  return fromApi;
}
