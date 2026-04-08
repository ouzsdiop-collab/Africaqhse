import * as Sentry from '@sentry/node';

/**
 * Initialise Sentry si `SENTRY_DSN` est défini. À appeler avant la création des routes Express.
 */
export function initSentryBackend() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || String(dsn).trim() === '') {
    return;
  }
  Sentry.init({
    dsn: String(dsn).trim(),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    integrations: [Sentry.expressIntegration()],
    tracesSampleRate: Math.min(
      1,
      Math.max(0, Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1)
    ),
    beforeSend(event) {
      if (event.request?.data && typeof event.request.data === 'string') {
        try {
          const o = JSON.parse(event.request.data);
          if (o && typeof o === 'object') {
            if ('password' in o) o.password = '[Filtered]';
            if ('token' in o) o.token = '[Filtered]';
            event.request.data = JSON.stringify(o);
          }
        } catch {
          event.request.data = '[Filtered]';
        }
      }
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    }
  });
}

/**
 * À brancher après toutes les routes, avant les middlewares d’erreur personnalisés.
 * @param {import('express').Express} app
 */
export function setupSentryExpressErrorHandler(app) {
  if (!process.env.SENTRY_DSN || String(process.env.SENTRY_DSN).trim() === '') {
    return;
  }
  Sentry.setupExpressErrorHandler(app);
}
