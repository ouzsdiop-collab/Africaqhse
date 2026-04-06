import { qhseFetch } from '../utils/qhseFetch.js';

let cache = null;
let cacheTs = 0;
const TTL_MS = 45_000;

/**
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<Array<{ id: string, name: string, code?: string|null, address?: string|null }>>}
 */
export async function fetchSitesCatalog(opts = {}) {
  if (!opts.force && cache && Date.now() - cacheTs < TTL_MS) {
    return cache;
  }
  const res = await qhseFetch('/api/sites');
  if (!res.ok) {
    return Array.isArray(cache) ? cache : [];
  }
  const data = await res.json().catch(() => []);
  cache = Array.isArray(data) ? data : [];
  cacheTs = Date.now();
  return cache;
}

export function invalidateSitesCatalog() {
  cache = null;
  cacheTs = 0;
}
