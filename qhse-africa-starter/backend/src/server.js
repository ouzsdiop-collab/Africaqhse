import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { getCorsMiddlewareOptions } from './lib/securityConfig.js';
import { getJsonBodyLimit } from './lib/jsonBodyLimit.js';
import { initSentryBackend, setupSentryExpressErrorHandler } from './sentryInit.js';
import { httpRequestLog } from './middleware/httpRequestLog.middleware.js';
import { setupGracefulShutdown } from './lib/gracefulShutdown.js';
import { sendJsonError } from './lib/apiErrors.js';
import healthRouter from './routes/health.routes.js';

import incidentsRouter from './routes/incidents.routes.js';
import risksRouter from './routes/risks.routes.js';
import actionsRouter from './routes/actions.routes.js';
import auditsRouter from './routes/audits.routes.js';
import nonconformitiesRouter from './routes/nonconformities.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import notificationsRouter from './routes/notifications.routes.js';
import usersRouter from './routes/users.routes.js';
import importsRouter from './routes/imports.routes.js';
import reportingRouter from './routes/reporting.routes.js';
import sitesRouter from './routes/sites.routes.js';
import authRouter from './routes/auth.routes.js';
import automationRouter from './routes/automation.routes.js';
import complianceAssistRouter from './routes/complianceAssist.routes.js';
import aiSuggestionRouter from './routes/aiSuggestion.routes.js';
import controlledDocumentsRouter from './routes/controlledDocuments.routes.js';
import auditLogsRouter from './routes/auditLogs.routes.js';
import { attachRequestUser } from './middleware/requestUser.middleware.js';
import { attachRequestId } from './middleware/requestId.middleware.js';
import {
  authLoginLimiter,
  globalApiLimiter
} from './middleware/apiRateLimit.middleware.js';
import { registerBusinessEventListeners } from './bootstrap/registerBusinessEventListeners.js';
import { startAutomationScheduler } from './automationScheduler.js';
import {
  isRequireAuthEnabled,
  isXUserIdAllowed
} from './lib/securityConfig.js';

/** Logs de démarrage sur stderr : souvent non bufferisés, visibles tout de suite sur Railway. */
function bootErrLine(msg) {
  console.error(`[boot] ${msg}`);
}

/* En ESM, ce code s’exécute après tous les imports ci-dessus (ordre de chargement du module). */
bootErrLine(
  `modules importés pid=${process.pid} NODE_ENV=${process.env.NODE_ENV ?? '(absent)'} VITEST=${process.env.VITEST ?? 'absent'}`
);

try {
  bootErrLine('registerBusinessEventListeners()…');
  registerBusinessEventListeners();
  bootErrLine('initSentryBackend()…');
  initSentryBackend();
} catch (err) {
  console.error('[boot] erreur fatale avant Express', err);
  process.exit(1);
}

export const app = express();
const PORT = Number(process.env.PORT) || 3001;
const BIND_HOST = process.env.BIND_HOST || '0.0.0.0';

bootErrLine(
  `Express app créée — PORT=${PORT} (env brut PORT=${process.env.PORT === undefined ? 'undefined' : JSON.stringify(process.env.PORT)}) BIND_HOST=${BIND_HOST}`
);

app.disable('x-powered-by');

if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(attachRequestId);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors(getCorsMiddlewareOptions()));
app.use(compression());
app.use(express.json({ limit: getJsonBodyLimit() }));
app.use(attachRequestUser);
app.use(httpRequestLog);

app.use('/api/health', healthRouter);

app.use('/api/auth/login', authLoginLimiter);
app.use('/api', globalApiLimiter);

app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/risks', risksRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/audits', auditsRouter);
app.use('/api/nonconformities', nonconformitiesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/imports', importsRouter);
app.use('/api/reports', reportingRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/automation', automationRouter);
app.use('/api/compliance', complianceAssistRouter);
app.use('/api/ai-suggestions', aiSuggestionRouter);
app.use('/api/controlled-documents', controlledDocumentsRouter);
app.use('/api/audit-logs', auditLogsRouter);

setupSentryExpressErrorHandler(app);

app.use((err, req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendJsonError(res, 400, 'Corps JSON invalide.', req, { code: 'INVALID_JSON' });
  }
  if (err.status === 413 || err.type === 'entity.too.large') {
    return sendJsonError(
      res,
      413,
      `Corps de requête trop volumineux (limite ${String(getJsonBodyLimit())}).`,
      req,
      { code: 'PAYLOAD_TOO_LARGE' }
    );
  }
  const msg = String(err && err.message ? err.message : '');
  if (/CORS|Origine non autorisée|not allowed by CORS/i.test(msg)) {
    return sendJsonError(res, 403, 'Origine non autorisée (CORS).', req, {
      code: 'CORS_FORBIDDEN'
    });
  }
  const code = err && err.code;
  if (code === 'P2002') {
    return sendJsonError(
      res,
      409,
      'Conflit : une valeur unique existe déjà pour cet enregistrement.',
      req,
      { code: 'PRISMA_UNIQUE' }
    );
  }
  if (code === 'P2025') {
    return sendJsonError(res, 404, 'Enregistrement introuvable.', req, { code: 'NOT_FOUND' });
  }
  console.error(err);
  /** @type {Record<string, string>} */
  const expose =
    process.env.NODE_ENV !== 'production' && msg
      ? {
          error: 'Erreur serveur',
          code: 'INTERNAL',
          detail: msg.slice(0, 500)
        }
      : { error: 'Erreur serveur', code: 'INTERNAL' };
  if (req.requestId) {
    expose.requestId = req.requestId;
  }
  const rawStatus = err && (err.status ?? err.statusCode);
  const sc = Number(rawStatus);
  const httpStatus =
    Number.isFinite(sc) && sc >= 400 && sc < 600 ? sc : 500;
  res.status(httpStatus).json(expose);
});

export function startServer() {
  bootErrLine(`startServer() — app.listen(${JSON.stringify(BIND_HOST)}, ${PORT})…`);

  const server = app.listen(PORT, BIND_HOST, () => {
    bootErrLine('callback listen — socket TCP ouvert, prêt à accepter les connexions');
    console.log(`API QHSE Africa — écoute sur ${BIND_HOST}:${PORT}`);
    console.log(
      `Santé: GET /api/health · readiness DB: GET /api/health/ready`
    );
    console.log(
      `[security] requireAuth=${isRequireAuthEnabled()} xUserId=${isXUserIdAllowed()} NODE_ENV=${process.env.NODE_ENV || 'undefined'}`
    );
    if (!process.env.DATABASE_URL) {
      console.warn('[qhse-africa-api] DATABASE_URL manquant — voir .env / .env.example');
    }
    try {
      startAutomationScheduler();
    } catch (err) {
      console.error('[boot] startAutomationScheduler erreur (non fatale)', err);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[qhse-africa-api] Le port ${PORT} est déjà utilisé (autre terminal / ancien « npm run dev »).` +
          `\n  Windows : netstat -ano | findstr ":${PORT} " puis taskkill /PID <pid> /F` +
          `\n  Ou depuis la racine du projet : npm run dev:reset`
      );
      process.exit(1);
    }
    throw err;
  });
  setupGracefulShutdown(server);
  return server;
}

if (process.env.VITEST !== 'true') {
  bootErrLine('hors tests — invocation startServer()');
  try {
    startServer();
  } catch (err) {
    console.error('[boot] échec fatale startServer()', err);
    process.exit(1);
  }
} else {
  bootErrLine('VITEST=true — startServer() non appelé (tests)');
}
