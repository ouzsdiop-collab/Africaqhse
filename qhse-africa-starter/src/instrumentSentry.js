/**
 * Sentry — optionnel, chargé en lazy chunk uniquement si VITE_SENTRY_DSN est défini au build.
 * Sans DSN : aucun module @sentry/browser dans le bundle exécutable (branche éliminée au build).
 */
let sentryReady = false;
/** @type {typeof import('@sentry/browser') | null} */
let Sentry = null;

function hasSentryDsn() {
  const d = import.meta.env?.VITE_SENTRY_DSN;
  return d != null && String(d).trim() !== '';
}

export async function initQhseSentry() {
  if (!hasSentryDsn()) return;
  try {
    Sentry = await import('@sentry/browser');
    const dsn = String(import.meta.env.VITE_SENTRY_DSN).trim();
    Sentry.init({
      dsn,
      environment: import.meta.env?.MODE || 'production',
      release: import.meta.env?.VITE_SENTRY_RELEASE || undefined,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeSend(event) {
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        if (event.request?.headers && typeof event.request.headers === 'object') {
          const h = { ...event.request.headers };
          delete h.Authorization;
          delete h.authorization;
          delete h.Cookie;
          delete h.cookie;
          event.request.headers = h;
        }
        return event;
      }
    });
    sentryReady = true;
  } catch (e) {
    console.warn('[QHSE] Sentry init ignorée', e);
  }
}

/**
 * @param {unknown} err
 * @param {Record<string, unknown>} [extras]
 */
export function captureQhseException(err, extras) {
  if (!sentryReady || !Sentry) return;
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    Sentry.withScope((scope) => {
      if (extras && typeof extras === 'object') {
        Object.entries(extras).forEach(([k, v]) => {
          scope.setExtra(k, v);
        });
      }
      Sentry.captureException(error);
    });
  } catch {
    /* ignore */
  }
}
