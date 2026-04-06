import * as automationService from '../services/automation.service.js';
import { isSmtpConfigured } from '../services/email.service.js';

let lastRunAt = null;
let lastRunResult = null;

function setLastRun(result) {
  lastRunAt = new Date().toISOString();
  lastRunResult = result;
}

/** Appelé par le planificateur serveur pour refléter le dernier passage dans GET /status. */
export function recordSchedulerRun(result) {
  setLastRun(result);
}

export function getStatus(req, res) {
  const scheduler =
    process.env.AUTOMATION_SCHEDULER === 'true' || process.env.AUTOMATION_SCHEDULER === '1';
  const intervalMs = Number(process.env.AUTOMATION_INTERVAL_MS) || 7 * 24 * 60 * 60 * 1000;

  res.json({
    smtpConfigured: isSmtpConfigured(),
    schedulerEnabled: scheduler,
    intervalMs,
    automationSecretConfigured: Boolean(process.env.AUTOMATION_SECRET?.trim()),
    lastRunAt,
    lastRunResult
  });
}

export async function postRun(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const weeklySummary = body.weeklySummary !== false;
    const overdueReminders = body.overdueReminders !== false;

    const result = await automationService.runAutomationJobs({
      weeklySummary,
      overdueReminders
    });

    setLastRun(result);

    res.json({ ok: true, ranAt: lastRunAt, result });
  } catch (err) {
    next(err);
  }
}
