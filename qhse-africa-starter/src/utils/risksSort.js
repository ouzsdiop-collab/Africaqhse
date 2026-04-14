import { riskCriticalityFromMeta } from './riskMatrixCore.js';

/** @param {Array<{ meta?: string }>} list */
export function sortRisksByPriority(list) {
  return [...list].sort((a, b) => {
    const ca = riskCriticalityFromMeta(a.meta);
    const cb = riskCriticalityFromMeta(b.meta);
    const ta = ca?.tier ?? 0;
    const tb = cb?.tier ?? 0;
    if (tb !== ta) return tb - ta;
    const pa = ca?.product ?? 0;
    const pb = cb?.product ?? 0;
    return pb - pa;
  });
}
