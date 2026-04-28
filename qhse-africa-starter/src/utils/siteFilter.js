import { appState } from './state.js';

/**
 * Ajoute ?siteId=… aux appels API liste / stats lorsqu’un site est sélectionné.
 * @param {string} path : ex. `/api/incidents` ou `/api/actions?unassigned=1`
 */
export function withSiteQuery(path) {
  const id = appState.activeSiteId;
  if (!id) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}siteId=${encodeURIComponent(id)}`;
}
