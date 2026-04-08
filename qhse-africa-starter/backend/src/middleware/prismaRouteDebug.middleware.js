/**
 * Logs requête → réponse pour diagnostiquer 502 / erreurs Prisma (Railway).
 * Ne modifie pas la logique métier.
 *
 * @param {string} tag — ex. 'actions', 'incidents', 'audits'
 */
export function prismaRouteDebug(tag) {
  return (req, res, next) => {
    const label = `${req.method} ${req.originalUrl}`;
    const t0 = Date.now();
    console.log(`[prisma-debug:${tag}] BEFORE prisma/handler — ${label}`);
    res.on('finish', () => {
      console.log(
        `[prisma-debug:${tag}] AFTER — ${label} status=${res.statusCode} ${Date.now() - t0}ms`
      );
    });
    next();
  };
}
