/**
 * Politique CSP pour le front (build / `vite preview` / balise meta injectée).
 *
 * Build : `vite.config.js` appelle `buildContentSecurityPolicy()` avec l’origine de
 * `VITE_API_BASE` pour que `connect-src` corresponde exactement à l’URL d’API du bundle.
 *
 * Si une **en-tête HTTP** `Content-Security-Policy` est aussi envoyée par l’hébergeur
 * (Railway, CDN…), les deux politiques s’appliquent **en même temps** : chaque requête
 * doit respecter **les deux**. Il faut alors aligner ou retirer la CSP côté hébergeur.
 *
 * - `style-src 'unsafe-inline'` : styles injectés + placeholder boot.
 * - Pas d’`unsafe-eval` en prod (bundles Vite = modules).
 */

/** API prod connue ; complétée au build par l’origine de VITE_API_BASE (dédoublonnée). */
const DEFAULT_PROD_API_ORIGINS = ['https://africaqhse-production.up.railway.app'];

/**
 * @param {string[]} [extraConnectOrigins] — origines complètes (https://host), ex. depuis VITE_API_BASE
 */
export function buildContentSecurityPolicy(extraConnectOrigins = []) {
  const seen = new Set();
  const parts = ["'self'"];
  const add = (o) => {
    const s = String(o).trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    parts.push(s);
  };
  for (const o of DEFAULT_PROD_API_ORIGINS) add(o);
  for (const o of extraConnectOrigins) {
    if (o) add(o);
  }
  add('https://*.ingest.sentry.io');
  add('https://*.ingest.de.sentry.io');

  const connectSrc = `connect-src ${parts.join(' ')}`;

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    connectSrc,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; ');
}

/** Politique par défaut (sans VITE_API_BASE) — tests / import ponctuel. */
export const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();

/** Pour attribut HTML meta content */
export function cspForHtmlMetaAttribute(policy = CONTENT_SECURITY_POLICY) {
  return policy.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
