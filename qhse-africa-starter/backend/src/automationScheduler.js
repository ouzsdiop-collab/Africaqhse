import * as automationService from './services/automation.service.js';
import { recordSchedulerRun } from './controllers/automation.controller.js';

/**
 * Planification optionnelle : exécute les jobs à intervalle régulier (ex. hebdomadaire).
 * Variables : AUTOMATION_SCHEDULER=true, AUTOMATION_INTERVAL_MS (défaut 7 jours).
 */
export function startAutomationScheduler() {
  const on =
    process.env.AUTOMATION_SCHEDULER === 'true' ||
    process.env.AUTOMATION_SCHEDULER === '1';
  if (!on) {
    return;
  }

  const intervalMs = Number(process.env.AUTOMATION_INTERVAL_MS);
  const interval =
    Number.isFinite(intervalMs) && intervalMs >= 60_000
      ? intervalMs
      : 7 * 24 * 60 * 60 * 1000;

  const run = () => {
    automationService
      .runAutomationJobs({ weeklySummary: true, overdueReminders: true })
      .then((result) => {
        recordSchedulerRun(result);
        console.log('[automation] jobs OK', JSON.stringify(result).slice(0, 500));
      })
      .catch((err) => {
        console.error('[automation] jobs erreur', err);
      });
  };

  const initialDelay = Number(process.env.AUTOMATION_INITIAL_DELAY_MS);
  const delay =
    Number.isFinite(initialDelay) && initialDelay >= 0 ? initialDelay : 120_000;

  setTimeout(() => {
    run();
    setInterval(run, interval);
  }, delay);

  console.log(
    `[automation] Planificateur actif — 1er passage dans ${delay} ms, puis toutes les ${interval} ms`
  );
}
