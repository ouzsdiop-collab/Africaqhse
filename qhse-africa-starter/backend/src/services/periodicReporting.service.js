import cron from 'node-cron';
import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { getEmailNotificationPrefs } from '../lib/emailNotificationPrefs.js';
import {
  isSmtpConfigured,
  sendWeeklyQhseSummary,
  fetchPilotageRecipientEmails
} from './email.service.js';

const LIST_SAMPLE = 8;

/** @param {string | null | undefined} s */
function isNcClosedLike(s) {
  const x = String(s ?? '').toLowerCase();
  if (!x) return false;
  if (x.includes('non traité') || x.includes('non traite')) return false;
  if (x.includes('non clos') || x.includes('non clôtur')) return false;
  if (x.includes('clôtur') || (x.includes('clos') && !x.includes('non clos'))) return true;
  if (
    x.includes('terminé') ||
    x.includes('terminee') ||
    x.includes('terminée') ||
    x.includes('terminees')
  ) {
    return true;
  }
  if (x.includes('traité') || x.includes('traitee')) return true;
  if (x.includes('résolu') || x.includes('resolu')) return true;
  return false;
}

/** @param {string | null | undefined} s */
function isNcOpenLike(s) {
  return !isNcClosedLike(s);
}

/** @param {string | null | undefined} s */
function isIncidentOpenLike(s) {
  const x = String(s ?? '').toLowerCase();
  if (!x) return true;
  if (x.includes('non clos') || x.includes('non clôtur')) return true;
  if (x.includes('clos')) return false;
  if (x.includes('clôt')) return false;
  if (x.includes('archive')) return false;
  return true;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Fenêtre par défaut si pas de start/end explicites.
 * @param {'weekly' | 'monthly'} period
 */
export function defaultRangeForPeriod(period) {
  const end = endOfDay(new Date());
  const start = new Date(end);
  if (period === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

/**
 * @param {string} raw
 * @param {'start'|'end'} kind
 */
function parseBoundaryInput(raw, kind) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(`${t}T${kind === 'end' ? '23:59:59.999' : '00:00:00.000'}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : kind === 'end' ? endOfDay(d) : startOfDay(d);
}

/**
 * @param {{
 *   period: 'weekly' | 'monthly' | 'custom',
 *   start: Date,
 *   end: Date,
 *   siteId: string | null,
 *   assigneeId: string | null,
 *   tenantId: string | null | undefined
 * }} p
 */
export async function getPeriodicReport(p) {
  const { start, end, siteId, assigneeId, tenantId } = p;
  const tidStr = normalizeTenantId(tenantId);
  const tf = prismaTenantFilter(tenantId);
  const period = p.period;

  const limitations = [
    'Les actions et les non-conformités n’ont pas de date de clôture historisée : les indicateurs « statut clôturé » portent sur les enregistrements créés dans la fenêtre avec un statut déjà terminé au moment de la requête.',
    'Le filtre assigneeId s’applique uniquement aux actions (stock en retard et actions créées sur la période).'
  ];

  const incidentWhere = {
    ...tf,
    createdAt: { gte: start, lte: end },
    ...(siteId ? { siteId } : {})
  };

  const auditWhere = {
    ...tf,
    createdAt: { gte: start, lte: end },
    ...(siteId ? { siteId } : {})
  };

  const ncWhereCreated = {
    ...tf,
    createdAt: { gte: start, lte: end },
    ...(siteId ? { siteId } : {})
  };

  const actionBase = {
    ...tf,
    ...(siteId ? { siteId } : {}),
    ...(assigneeId ? { assigneeId } : {})
  };

  const actionCreatedWhere = {
    ...actionBase,
    createdAt: { gte: start, lte: end }
  };

  const [
    incidentsCount,
    incidentsSample,
    auditsCount,
    auditsAgg,
    auditsSample,
    ncStatusRows,
    ncSampleRows,
    actionsCreatedCount,
    actionsCreatedClosedLike,
    criticalIncidentsInPeriod
  ] = await Promise.all([
    prisma.incident.count({ where: incidentWhere }),
    prisma.incident.findMany({
      where: incidentWhere,
      orderBy: { createdAt: 'desc' },
      take: LIST_SAMPLE,
      select: {
        ref: true,
        type: true,
        site: true,
        severity: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.audit.count({ where: auditWhere }),
    prisma.audit.aggregate({
      where: auditWhere,
      _avg: { score: true },
      _min: { score: true },
      _max: { score: true }
    }),
    prisma.audit.findMany({
      where: auditWhere,
      orderBy: { createdAt: 'desc' },
      take: LIST_SAMPLE,
      select: {
        ref: true,
        site: true,
        score: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.nonConformity.findMany({
      where: ncWhereCreated,
      select: { status: true }
    }),
    prisma.nonConformity.findMany({
      where: ncWhereCreated,
      orderBy: { createdAt: 'desc' },
      take: LIST_SAMPLE,
      select: { id: true, title: true, status: true, auditRef: true, createdAt: true }
    }),
    prisma.action.count({ where: actionCreatedWhere }),
    (async () => {
      const parts = [];
      const params = [];
      if (tidStr) {
        parts.push('tenantId = ?');
        params.push(tidStr);
      }
      parts.push(
        'datetime(createdAt) >= datetime(?)',
        'datetime(createdAt) <= datetime(?)',
        `(
          LOWER(status) LIKE '%clôtur%'
          OR (LOWER(status) LIKE '%clos%' AND LOWER(status) NOT LIKE '%non clos%')
          OR LOWER(status) LIKE '%terminé%'
          OR LOWER(status) LIKE '%terminee%'
          OR LOWER(status) LIKE '%terminée%'
          OR (LOWER(status) LIKE '%termine%' AND LOWER(status) NOT LIKE '%traitement%')
          OR LOWER(status) LIKE '%traité%'
          OR LOWER(status) LIKE '%traitee%'
          OR LOWER(status) LIKE '%fait%'
        )`
      );
      params.push(start.toISOString(), end.toISOString());
      if (siteId) {
        parts.push('siteId = ?');
        params.push(siteId);
      }
      if (assigneeId) {
        parts.push('assigneeId = ?');
        params.push(assigneeId);
      }
      const row = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS c FROM actions WHERE ${parts.join(' AND ')}`,
        ...params
      );
      return Number(row[0]?.c ?? 0);
    })(),
    (async () => {
      const parts = [];
      const params = [];
      if (tidStr) {
        parts.push('tenantId = ?');
        params.push(tidStr);
      }
      parts.push(
        'datetime(createdAt) >= datetime(?)',
        'datetime(createdAt) <= datetime(?)',
        `LOWER(severity) LIKE '%critique%'`
      );
      params.push(start.toISOString(), end.toISOString());
      if (siteId) {
        parts.push('siteId = ?');
        params.push(siteId);
      }
      const rows = await prisma.$queryRawUnsafe(
        `SELECT ref, type, site, status, createdAt FROM incidents WHERE ${parts.join(' AND ')}`,
        ...params
      );
      return (Array.isArray(rows) ? rows : []).map((r) => ({
        ref: r.ref,
        type: r.type,
        site: r.site,
        status: r.status,
        createdAt: new Date(r.createdAt)
      }));
    })()
  ]);

  const ncCreated = ncStatusRows.length;
  const ncOpenAmongCreated = ncStatusRows.filter((r) => isNcOpenLike(r.status)).length;
  const ncClosedAmongCreated = ncStatusRows.filter((r) => isNcClosedLike(r.status)).length;

  const overdueSqlParts = [];
  const overdueParams = [];
  if (tidStr) {
    overdueSqlParts.push('tenantId = ?');
    overdueParams.push(tidStr);
  }
  overdueSqlParts.push(`LOWER(status) LIKE '%retard%'`);
  if (siteId) {
    overdueSqlParts.push('siteId = ?');
    overdueParams.push(siteId);
  }
  if (assigneeId) {
    overdueSqlParts.push('assigneeId = ?');
    overdueParams.push(assigneeId);
  }
  overdueSqlParts.push(`datetime(createdAt) <= datetime(?)`);
  overdueParams.push(end.toISOString());

  const overdueRow = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS c FROM actions WHERE ${overdueSqlParts.join(' AND ')}`,
    ...overdueParams
  );
  const actionsOverdue = Number(overdueRow[0]?.c ?? 0);

  const overdueSample = await prisma.$queryRawUnsafe(
    `SELECT title, detail, status, owner, dueDate, createdAt FROM actions WHERE ${overdueSqlParts.join(
      ' AND '
    )} ORDER BY COALESCE(dueDate, createdAt) ASC LIMIT ?`,
    ...overdueParams,
    LIST_SAMPLE
  );

  const overdueSampleOut = (Array.isArray(overdueSample) ? overdueSample : []).map((row) => ({
    title: row.title,
    owner: row.owner,
    status: row.status,
    dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString()
  }));

  const critInPeriodOpen = criticalIncidentsInPeriod.filter((r) => isIncidentOpenLike(r.status));

  const avg = auditsAgg._avg.score;
  const auditScoreAvg =
    avg != null && !Number.isNaN(avg) ? Math.round(Number(avg) * 10) / 10 : null;

  /** @type {{ level: string, code: string, message: string }[]} */
  const alerts = [];

  if (critInPeriodOpen.length > 0) {
    alerts.push({
      level: 'critical',
      code: 'INCIDENTS_CRITIQUES_PERIODE',
      message: `${critInPeriodOpen.length} incident(s) critique(s) dans la fenêtre (encore ouverts ou non clôturés).`
    });
  }
  if (actionsOverdue > 0) {
    alerts.push({
      level: 'high',
      code: 'ACTIONS_RETARD',
      message: `${actionsOverdue} action(s) en retard (stock au ${end.toISOString().slice(0, 10)}, filtres appliqués).`
    });
  }
  if (ncOpenAmongCreated > 0) {
    alerts.push({
      level: ncOpenAmongCreated >= 3 ? 'high' : 'info',
      code: 'NC_NOUVELLES_OUVERTES',
      message: `${ncOpenAmongCreated} non-conformité(s) créée(s) sur la période encore au statut ouvert.`
    });
  }
  if (auditsCount > 0 && auditScoreAvg != null && auditScoreAvg < 70) {
    alerts.push({
      level: 'high',
      code: 'SCORE_AUDIT_PERIODE',
      message: `Score moyen des audits sur la période : ${auditScoreAvg} %.`
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      level: 'info',
      code: 'PERIODE_STABLE',
      message: 'Aucune alerte prioritaire automatique sur cette fenêtre (vérifier les extraits de détail).'
    });
  }

  const generatedAt = new Date().toISOString();

  return {
    meta: {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      siteId,
      assigneeId,
      generatedAt,
      schemaVersion: 1,
      limitations
    },
    summary: {
      incidentsCreated: incidentsCount,
      auditsRecorded: auditsCount,
      auditScoreAvg,
      auditScoreMin: auditsAgg._min.score,
      auditScoreMax: auditsAgg._max.score,
      nonConformitiesCreated: ncCreated,
      nonConformitiesOpenAmongCreated: ncOpenAmongCreated,
      nonConformitiesClosedAmongCreated: ncClosedAmongCreated,
      actionsCreated: actionsCreatedCount,
      actionsCreatedWithClosedLikeStatus: actionsCreatedClosedLike,
      actionsOverdueStock: actionsOverdue,
      criticalIncidentsInPeriod: criticalIncidentsInPeriod.length,
      criticalIncidentsOpenInPeriod: critInPeriodOpen.length
    },
    incidents: {
      sample: incidentsSample.map((r) => ({
        ref: r.ref,
        type: r.type,
        site: r.site,
        severity: r.severity,
        status: r.status,
        createdAt: r.createdAt.toISOString()
      }))
    },
    audits: {
      sample: auditsSample.map((a) => ({
        ref: a.ref,
        site: a.site,
        score: a.score,
        status: a.status,
        createdAt: a.createdAt.toISOString()
      }))
    },
    nonConformities: {
      sample: ncSampleRows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        auditRef: r.auditRef,
        createdAt: r.createdAt.toISOString()
      }))
    },
    actions: {
      overdueSample: overdueSampleOut
    },
    alerts,
    export: {
      documentTitle: `Synthèse périodique QHSE (${period})`,
      schemaVersion: 1,
      sectionsOrder: [
        'meta',
        'summary',
        'alerts',
        'incidents',
        'audits',
        'nonConformities',
        'actions'
      ]
    }
  };
}

/**
 * @param {{
 *   tenantId?: string | null,
 *   period: 'weekly' | 'monthly' | 'custom',
 *   startDateInput?: string | null,
 *   endDateInput?: string | null,
 *   siteId?: string | null,
 *   assigneeId?: string | null
 * }} opts
 */
export async function buildPeriodicReport(opts) {
  const tenantId = normalizeTenantId(opts.tenantId);
  let { period } = opts;
  const startIn = opts.startDateInput ? parseBoundaryInput(opts.startDateInput, 'start') : null;
  const endIn = opts.endDateInput ? parseBoundaryInput(opts.endDateInput, 'end') : null;

  let start;
  let end;
  if (startIn && endIn) {
    if (startIn.getTime() > endIn.getTime()) {
      const err = new Error('startDate doit précéder ou égaler endDate');
      err.statusCode = 400;
      throw err;
    }
    start = startIn;
    end = endIn;
    period = 'custom';
  } else if (startIn || endIn) {
    const err = new Error('Fournir startDate et endDate ensemble, ou uniquement period=weekly|monthly');
    err.statusCode = 400;
    throw err;
  } else {
    if (period !== 'weekly' && period !== 'monthly') {
      const err = new Error('period doit être weekly ou monthly si les dates ne sont pas fournies');
      err.statusCode = 400;
      throw err;
    }
    const r = defaultRangeForPeriod(period);
    start = r.start;
    end = r.end;
  }

  let siteId =
    opts.siteId != null && String(opts.siteId).trim() !== ''
      ? String(opts.siteId).trim()
      : null;
  if (siteId) {
    const s = await prisma.site.findFirst({
      where: { id: siteId, ...prismaTenantFilter(opts.tenantId) },
      select: { id: true }
    });
    if (!s) {
      const err = new Error('Site inconnu ou hors de votre organisation');
      err.statusCode = 400;
      throw err;
    }
  }

  let assigneeId =
    opts.assigneeId != null && String(opts.assigneeId).trim() !== ''
      ? String(opts.assigneeId).trim()
      : null;
  if (assigneeId) {
    const u = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true }
    });
    if (!u) {
      const err = new Error('Responsable (assignee) inconnu');
      err.statusCode = 400;
      throw err;
    }
  }

  return getPeriodicReport({ period, start, end, siteId, assigneeId, tenantId });
}

/**
 * Semaine civile précédente (lundi 00:00 → dimanche 23:59:59, fuseau local serveur).
 * @param {Date} [now]
 */
export function getPreviousWeekLocalBounds(now = new Date()) {
  const ref = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const day = ref.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(ref);
  thisMonday.setDate(ref.getDate() - daysSinceMonday);
  thisMonday.setHours(0, 0, 0, 0);
  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  prevSunday.setHours(23, 59, 59, 999);
  return { start: prevMonday, end: prevSunday };
}

/**
 * Synthèse HTML semaine précédente (appelée par le cron lundi 8h).
 * @returns {Promise<{ sent: number, skipped?: boolean, detail: string[] }>}
 */
export async function runScheduledWeeklyQhseEmail() {
  const detail = [];
  if (!getEmailNotificationPrefs().weeklySummary) {
    detail.push('Résumé hebdomadaire désactivé (préférences).');
    return { sent: 0, skipped: true, detail };
  }
  if (!isSmtpConfigured()) {
    detail.push('SMTP non configuré.');
    return { sent: 0, skipped: true, detail };
  }
  const { start, end } = getPreviousWeekLocalBounds();
  const report = await getPeriodicReport({
    period: 'custom',
    start,
    end,
    siteId: null,
    assigneeId: null,
    tenantId: null
  });
  const recipients = await fetchPilotageRecipientEmails();
  const emails = recipients.map((r) => r.email);
  if (!emails.length) {
    detail.push('Aucun destinataire (rôles pilotage avec e-mail).');
    return { sent: 0, skipped: true, detail };
  }
  await sendWeeklyQhseSummary(
    { meta: report.meta, summary: report.summary },
    emails
  );
  detail.push(`${emails.length} e-mail(s) de synthèse envoyé(s).`);
  return { sent: emails.length, detail };
}

/**
 * Cron : chaque lundi 8h (fuseau CRON_TZ, TZ ou Africa/Abidjan par défaut).
 */
export function scheduleWeeklyEmailReport() {
  if (process.env.VITEST === 'true') return;
  const tz = process.env.CRON_TZ || process.env.TZ || 'Africa/Abidjan';
  cron.schedule(
    '0 8 * * 1',
    () => {
      void runScheduledWeeklyQhseEmail().then(
        (r) => console.log('[weekly-email]', JSON.stringify(r)),
        (e) => console.error('[weekly-email]', e)
      );
    },
    { timezone: tz }
  );
  console.log(`[weekly-email] planifié — lundis 8h (${tz})`);
}
