import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { normalizeSiteId } from './kpiCore.service.js';
import { periodRanges, normalizeDirectionPeriod } from './direction.service.js';

const HISTORY_LIMIT = 20;

/**
 * Enregistre un instantané figé de la synthèse direction actuellement affichée,
 * avec qui l'a validée et quand. Crée toujours un nouvel enregistrement (pas de
 * mise à jour) : chaque validation est une trace d'audit indépendante.
 *
 * @param {{
 *  tenantId: string;
 *  siteId: string | null;
 *  period: 'month' | 'quarter';
 *  validatedById: string;
 *  direction: Awaited<ReturnType<typeof import('./direction.service.js').getDirectionSummary>>;
 *  aiSummary: { summary: string; confidence: number };
 *  aiSummarySource: 'ai' | 'fallback';
 * }} params
 */
export async function recordDirectionSummaryValidation(params) {
  const tid = normalizeTenantId(params.tenantId);
  const sid = normalizeSiteId(params.siteId);
  const period = normalizeDirectionPeriod(params.period);
  const { current } = periodRanges(period);

  return prisma.directionSummaryValidation.create({
    data: {
      tenantId: tid,
      siteId: sid,
      period,
      periodStart: current.start,
      periodEnd: current.end,
      metricsSnapshot: params.direction,
      aiSummaryText: params.aiSummary?.summary || '',
      aiSummarySource: params.aiSummarySource === 'ai' ? 'ai' : 'fallback',
      validatedById: params.validatedById
    }
  });
}

/**
 * Dernières validations pour un tenant/site/période donnés, les plus récentes d'abord.
 * @param {string} tenantId
 * @param {string | null} siteId
 * @param {'month' | 'quarter'} period
 */
export async function listDirectionSummaryValidations(tenantId, siteId = null, period = 'month') {
  const tf = prismaTenantFilter(normalizeTenantId(tenantId));
  const sid = normalizeSiteId(siteId);
  const normalizedPeriod = normalizeDirectionPeriod(period);

  const rows = await prisma.directionSummaryValidation.findMany({
    where: { ...tf, siteId: sid, period: normalizedPeriod },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      aiSummaryText: true,
      aiSummarySource: true,
      validatedAt: true,
      validatedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { validatedAt: 'desc' },
    take: HISTORY_LIMIT
  });

  return rows.map((r) => ({
    id: r.id,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    summary: r.aiSummaryText,
    source: r.aiSummarySource,
    validatedAt: r.validatedAt.toISOString(),
    validatedBy: r.validatedBy?.name || r.validatedBy?.email || 'Non disponible'
  }));
}
