/**
 * Chargements liste / stats dashboard — retries réseau et API lente (démarrage dev).
 */

import { qhseFetch } from './qhseFetch.js';
import { withSiteQuery } from './siteFilter.js';

export async function fetchJsonList(path) {
  try {
    const res = await qhseFetch(withSiteQuery(path));
    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    return Array.isArray(j) ? j : null;
  } catch (err) {
    console.warn('[dashboard] fetchJsonList', path, err);
    return null;
  }
}

/**
 * @param {string} path
 * @param {{ attempts?: number; delayMs?: number }} [opts]
 */
export async function fetchJsonListWithRetry(path, { attempts = 4, delayMs = 300 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const data = await fetchJsonList(path);
    if (data != null) return data;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

/**
 * @param {string} path
 * @param {{ attempts?: number; delayMs?: number }} [opts]
 */
export async function qhseFetchWithNetworkRetry(path, { attempts = 8, delayMs = 350 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await qhseFetch(path);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}
