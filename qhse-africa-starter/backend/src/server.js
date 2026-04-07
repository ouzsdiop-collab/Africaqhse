import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getCorsMiddlewareOptions } from './lib/securityConfig.js';

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

registerBusinessEventListeners();

export const app = express();
const PORT = Number(process.env.PORT) || 3001;

if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(attachRequestId);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors(getCorsMiddlewareOptions()));
app.use(express.json({ limit: '512kb' }));
app.use(attachRequestUser);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'qhse-africa-api', ts: new Date().toISOString() });
});

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

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Corps JSON invalide.' });
  }
  if (err.status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Corps de requête trop volumineux (limite 512 ko).'
    });
  }
  const msg = String(err && err.message ? err.message : '');
  if (/CORS|Origine non autorisée|not allowed by CORS/i.test(msg)) {
    return res.status(403).json({ error: 'Origine non autorisée (CORS).' });
  }
  const code = err && err.code;
  if (code === 'P2002') {
    return res
      .status(409)
      .json({ error: 'Conflit : une valeur unique existe déjà pour cet enregistrement.' });
  }
  if (code === 'P2025') {
    return res.status(404).json({ error: 'Enregistrement introuvable.' });
  }
  console.error(err);
  /** @type {Record<string, string>} */
  const expose =
    process.env.NODE_ENV !== 'production' && msg
      ? { error: 'Erreur serveur', detail: msg.slice(0, 500) }
      : { error: 'Erreur serveur' };
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
  const server = app.listen(PORT, () => {
    console.log(`API QHSE Africa — http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(
      `[security] requireAuth=${isRequireAuthEnabled()} xUserId=${isXUserIdAllowed()} NODE_ENV=${process.env.NODE_ENV || 'undefined'}`
    );
    if (!process.env.DATABASE_URL) {
      console.warn('[qhse-africa-api] DATABASE_URL manquant — voir .env / .env.example');
    }
    startAutomationScheduler();
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
  return server;
}

if (process.env.VITEST !== 'true') {
  startServer();
}
