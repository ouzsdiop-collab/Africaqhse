import { prisma } from '../db.js';

/**
 * Fermeture du serveur HTTP puis déconnexion Prisma (SIGTERM / SIGINT).
 */
export function setupGracefulShutdown(server) {
  if (process.env.VITEST === 'true') return;

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[qhse-africa-api] Signal ${signal} — arrêt gracieux…`);
    server.close(() => {
      prisma
        .$disconnect()
        .catch(() => {})
        .finally(() => {
          process.exit(0);
        });
    });
    setTimeout(() => {
      console.error('[qhse-africa-api] Timeout arrêt — forçage exit(1).');
      process.exit(1);
    }, 15_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
