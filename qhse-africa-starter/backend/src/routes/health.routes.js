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
    15_000,
    Math.max(300, Number(process.env.HEALTH_DB_TIMEOUT_MS) || 2500)
  );
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('health_db_timeout')), timeoutMs);
      })
    ]);
    res.json({
      ok: true,
      ready: true,
      db: true,
      ts: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      ok: false,
      ready: false,
      db: false,
      ts: new Date().toISOString()
    });
  }
});

export default router;
