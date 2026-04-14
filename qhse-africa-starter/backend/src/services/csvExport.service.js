import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';

const CSV_SEP = ';';

/**
 * @param {unknown} v
 */
function csvCell(v) {
  const s = v == null || v === undefined ? '' : String(v);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {string[][]} rows
 * @returns {Buffer}
 */
function rowsToCsvBuffer(rows) {
  const body = rows.map((cols) => cols.map(csvCell).join(CSV_SEP)).join('\n');
  return Buffer.from(`\uFEFF${body}`, 'utf8');
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
function buildWhere(tenantId, siteId) {
  return {
    ...prismaTenantFilter(tenantId),
    ...(siteId ? { siteId } : {})
  };
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
export async function exportIncidentsCsv(tenantId, siteId) {
  const where = buildWhere(tenantId, siteId);
  const rows = await prisma.incident.findMany({ where, orderBy: { createdAt: 'desc' } });
  const data = [
    ['Ref', 'Type', 'Site', 'Gravite', 'Statut', 'Description', 'Responsable', 'Date'],
    ...rows.map((r) => [
      r.ref,
      r.type,
      r.site,
      r.severity,
      r.status,
      r.description || '',
      r.responsible || '',
      r.createdAt?.toLocaleDateString('fr-FR') || ''
    ])
  ];
  return rowsToCsvBuffer(data);
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
export async function exportRisksCsv(tenantId, siteId) {
  const where = buildWhere(tenantId, siteId);
  const rows = await prisma.risk.findMany({ where, orderBy: { createdAt: 'desc' } });
  const data = [
    ['Ref', 'Titre', 'Categorie', 'Probabilite', 'Gravite', 'GP', 'Statut', 'Proprietaire', 'Site'],
    ...rows.map((r) => [
      r.ref ?? '',
      r.title,
      r.category || '',
      r.probability,
      r.severity,
      r.gp ?? r.gravity ?? '',
      r.status,
      r.owner || '',
      r.siteId || ''
    ])
  ];
  return rowsToCsvBuffer(data);
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
export async function exportActionsCsv(tenantId, siteId) {
  const where = buildWhere(tenantId, siteId);
  const rows = await prisma.action.findMany({ where, orderBy: { createdAt: 'desc' } });
  const data = [
    ['Titre', 'Responsable', 'Echeance', 'Priorite', 'Statut'],
    ...rows.map((r) => [
      r.title,
      r.owner || '',
      r.dueDate?.toLocaleDateString('fr-FR') || '',
      '',
      r.status
    ])
  ];
  return rowsToCsvBuffer(data);
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
export async function exportAuditsCsv(tenantId, siteId) {
  const where = buildWhere(tenantId, siteId);
  const rows = await prisma.audit.findMany({ where, orderBy: { createdAt: 'desc' } });
  const data = [
    ['Ref', 'Site', 'Date', 'Score', 'Statut'],
    ...rows.map((r) => [
      r.ref,
      r.site || '',
      r.createdAt?.toLocaleDateString('fr-FR') || '',
      r.score ?? '',
      r.status
    ])
  ];
  return rowsToCsvBuffer(data);
}
