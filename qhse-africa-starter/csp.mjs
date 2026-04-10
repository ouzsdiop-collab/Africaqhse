/**
 * Référence CSP (alignement possible avec Helmet côté API).
 *
 * Vite n’injecte plus de meta CSP ni d’en-tête sur `vite preview` : la politique effective
 * est celle renvoyée par le backend (Helmet) pour les réponses HTML/API servies par Express.
 *
 * Si une **en-tête HTTP** `Content-Security-Policy` est aussi envoyée par l’hébergeur
 * (Railway, CDN…), les deux politiques s’appliquent **en même temps** : chaque requête
 * doit respecter **les deux**. Il faut alors aligner ou retirer la CSP côté hébergeur.
 *
 * - `style-src 'unsafe-inline'` : styles injectés + placeholder boot.
 * - Pas d’`unsafe-eval` en prod (bundles Vite = modules).
 */

/** API prod par défaut (CSP + repli si `VITE_API_BASE` absent au build). Exportée pour Vite. */
export const DEFAULT_PROD_API_ORIGINS = ['https://africaqhse-production.up.railway.app'];

/**
 * @param {string[]} [apiConnectOrigins] — origines https complètes (API + éventuellement Sentry ailleurs)
 */
export function buildContentSecurityPolicy(apiConnectOrigins = []) {
  const seen = new Set();
  const parts = ["'self'"];
  const add = (o) => {
    const s = String(o).trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    parts.push(s);
  };
  for (const o of apiConnectOrigins) {
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

/** Politique par défaut — inclut l’API prod déclarée ci-dessus. */
export const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy(DEFAULT_PROD_API_ORIGINS);

/** Pour attribut HTML meta content */
export function cspForHtmlMetaAttribute(policy = CONTENT_SECURITY_POLICY) {
  return policy.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
