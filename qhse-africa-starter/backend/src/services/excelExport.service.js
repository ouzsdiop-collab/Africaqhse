import * as XLSX from 'xlsx';
import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';

const HEADER_STYLE = { font: { bold: true }, fill: { fgColor: { rgb: '3b82f6' } } };
void HEADER_STYLE;

/**
 * @param {import('xlsx').WorkBook} wb
 */
async function toBuffer(wb) {
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
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
export async function exportIncidentsExcel(tenantId, siteId) {
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
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [10, 15, 15, 12, 12, 30, 20, 12].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, 'Incidents');
  return toBuffer(wb);
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
export async function exportRisksExcel(tenantId, siteId) {
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
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [10, 25, 15, 12, 10, 8, 12, 20, 15].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, 'Risques');
  return toBuffer(wb);
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
export async function exportActionsExcel(tenantId, siteId) {
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
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [30, 20, 12, 12, 12].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, 'Actions');
  return toBuffer(wb);
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 */
export async function exportAuditsExcel(tenantId, siteId) {
  const where = buildWhere(tenantId, siteId);
  const rows = await prisma.audit.findMany({ where, orderBy: { createdAt: 'desc' } });
  const data = [
    ['Ref', 'Titre', 'Site', 'Date', 'Score', 'Type', 'Statut'],
    ...rows.map((r) => [
      r.ref,
      r.ref,
      r.site || '',
      r.createdAt?.toLocaleDateString('fr-FR') || '',
      r.score ?? '',
      '',
      r.status
    ])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [10, 25, 15, 12, 8, 15, 12].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, 'Audits');
  return toBuffer(wb);
}
