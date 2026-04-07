/**
 * Politique CSP pour le front (build / `vite preview` / balise meta injectée).
 *
 * - `connect-src` : `'self'` (API derrière le même hôte / proxy) + hôtes d’ingestion Sentry.
 *   Sans Sentry, retirez les domaines `*.ingest.sentry.io` / `*.ingest.de.sentry.io`.
 *   API sur un autre domaine : ajoutez-le (ex. https://api.example.com).
 * - `style-src 'unsafe-inline'` : nécessaire pour les styles injectés par l’app et le placeholder boot.
 * - Pas d’`unsafe-eval` en prod (bundles Vite = modules).
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  /** Ingestion Sentry (DSN *.ingest.sentry.io) — retirer si vous n’utilisez pas Sentry */
  "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

/** Pour attribut HTML meta content */
export function cspForHtmlMetaAttribute(policy = CONTENT_SECURITY_POLICY) {
  return policy.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
