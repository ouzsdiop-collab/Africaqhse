import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

function livenessBody() {
  return {
    ok: true,
    service: 'qhse-africa-api',
    liveness: true,
    ts: new Date().toISOString()
  };
}

/** Vivacité — ne touche pas à la base (orchestrateurs / load balancers). */
router.get('/', (req, res) => {
  res.json(livenessBody());
});

router.get('/live', (req, res) => {
  res.json(livenessBody());
});

/**
 * Prêt à recevoir du trafic — vérifie la connexion SQL (timeout configurable).
 */
router.get('/ready', async (req, res) => {
  const timeoutMs = Math.min(
    20_000,
    Math.max(1_000, Number(process.env.HEALTH_DB_TIMEOUT_MS) || 10_000)
  );
  const probeDb = () =>
    Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('health_db_timeout')), timeoutMs);
      })
    ]);
  try {
    await probeDb();
    res.json({
      ok: true,
      ready: true,
      db: true,
      ts: new Date().toISOString()
    });
  } catch (firstError) {
    /**
     * Réessaie une seule fois après un reconnect explicite :
     * en pratique, cela absorbe les latences transitoires de réveil DB
     * observées sur certains environnements managés (ex: checks Railway).
     */
    try {
      await prisma.$connect();
      await probeDb();
      res.json({
        ok: true,
        ready: true,
        db: true,
        recovery: 'reconnected',
        ts: new Date().toISOString()
      });
      return;
    } catch {
      console.error('[health/ready] DB probe failed', firstError?.message);
    }
    res.status(503).json({
      ok: false,
      ready: false,
      db: false,
      ts: new Date().toISOString()
    });
  }
});

export default router;
