import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

function serialize(row) {
  if (!row) return row;
  return {
    ...row,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    inspectionDate: row.inspectionDate ? row.inspectionDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function parseOptDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function nextRef(tenantId) {
  const year = new Date().getUTCFullYear();
  const prefix = `PP-${year}-`;
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.preventionPlan.findMany({
    where: { ...tf, ref: { startsWith: prefix } },
    select: { ref: true }
  });
  let max = 0;
  for (const r of rows) {
    const m = /^PP-(\d+)-(\d+)$/i.exec(r.ref);
    if (m && Number(m[1]) === year) {
      max = Math.max(max, parseInt(m[2], 10));
    }
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export async function findAllPreventionPlans(tenantId, opts = {}) {
  const tf = prismaTenantFilter(tenantId);
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (opts.siteId != null && String(opts.siteId).trim()) {
    where.siteId = String(opts.siteId).trim();
  }
  if (opts.status != null && String(opts.status).trim()) {
    where.status = String(opts.status).trim();
  }
  const rows = await prisma.preventionPlan.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }]
  });
  return rows.map(serialize);
}

export async function createPreventionPlan(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const externalCompanyName = typeof data.externalCompanyName === 'string' ? data.externalCompanyName.trim() : '';
  if (!externalCompanyName) {
    const err = new Error('externalCompanyName requis');
    err.statusCode = 400;
    throw err;
  }
  const siteId = data.siteId != null && data.siteId !== '' ? await assertSiteExistsOrNull(tenantId, data.siteId) : null;
  if (data.permitId != null && String(data.permitId).trim()) {
    const tf = prismaTenantFilter(tenantId);
    const permitOk = await prisma.permitToWork.findFirst({ where: { id: String(data.permitId).trim(), ...tf } });
    if (!permitOk) {
      const err = new Error('Permis introuvable');
      err.statusCode = 400;
      throw err;
    }
  }
  const ref = await nextRef(tenantId);
  const created = await prisma.preventionPlan.create({
    data: {
      tenantId: tid,
      ref,
      siteId,
      externalCompanyName,
      externalContact: data.externalContact != null && data.externalContact !== '' ? String(data.externalContact).trim() : null,
      workDescription: data.workDescription != null && data.workDescription !== '' ? String(data.workDescription).trim() : null,
      startDate: parseOptDate(data.startDate),
      endDate: parseOptDate(data.endDate),
      inspectionDate: parseOptDate(data.inspectionDate),
      risksJson: Array.isArray(data.risks) ? data.risks : [],
      permitId: data.permitId != null && String(data.permitId).trim() ? String(data.permitId).trim() : null
    }
  });
  return serialize(created);
}

export async function updatePreventionPlan(tenantId, id, patch) {
  const pid = String(id ?? '').trim();
  if (!pid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.preventionPlan.findFirst({ where: { id: pid, ...tf } });
  if (!existing) {
    const err = new Error('Plan de prévention introuvable');
    err.statusCode = 404;
    throw err;
  }
  /** @type {Record<string, unknown>} */
  const data = {};
  if ('externalCompanyName' in patch) {
    const v = typeof patch.externalCompanyName === 'string' ? patch.externalCompanyName.trim() : '';
    if (!v) {
      const err = new Error('externalCompanyName ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.externalCompanyName = v;
  }
  if ('externalContact' in patch) {
    data.externalContact = patch.externalContact == null || patch.externalContact === '' ? null : String(patch.externalContact).trim();
  }
  if ('workDescription' in patch) {
    data.workDescription = patch.workDescription == null || patch.workDescription === '' ? null : String(patch.workDescription).trim();
  }
  if ('siteId' in patch) {
    data.siteId = patch.siteId == null || patch.siteId === '' ? null : await assertSiteExistsOrNull(tenantId, patch.siteId);
  }
  if ('startDate' in patch) data.startDate = parseOptDate(patch.startDate);
  if ('endDate' in patch) data.endDate = parseOptDate(patch.endDate);
  if ('inspectionDate' in patch) data.inspectionDate = parseOptDate(patch.inspectionDate);
  if ('risks' in patch) data.risksJson = Array.isArray(patch.risks) ? patch.risks : [];
  if ('status' in patch) {
    const v = String(patch.status ?? '').trim();
    if (!v) {
      const err = new Error('status ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.status = v;
  }
  if ('permitId' in patch) {
    if (patch.permitId == null || String(patch.permitId).trim() === '') {
      data.permitId = null;
    } else {
      const permitOk = await prisma.permitToWork.findFirst({ where: { id: String(patch.permitId).trim(), ...tf } });
      if (!permitOk) {
        const err = new Error('Permis introuvable');
        err.statusCode = 400;
        throw err;
      }
      data.permitId = String(patch.permitId).trim();
    }
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  const upd = await prisma.preventionPlan.updateMany({ where: { id: pid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Plan de prévention introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.preventionPlan.findFirst({ where: { id: pid, ...tf } });
  return serialize(updated);
}

/** Enregistre la signature client ou entreprise extérieure ; passe le statut à "validated" quand les deux sont signées. */
export async function signPreventionPlan(tenantId, id, party, input) {
  const pid = String(id ?? '').trim();
  const p = String(party ?? '').trim();
  if (!pid || (p !== 'client' && p !== 'contractor')) {
    const err = new Error('Identifiant et partie (client|contractor) requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.preventionPlan.findFirst({ where: { id: pid, ...tf } });
  if (!existing) {
    const err = new Error('Plan de prévention introuvable');
    err.statusCode = 404;
    throw err;
  }
  const signature = {
    name: String(input?.name ?? '').trim(),
    signedAt: new Date().toISOString(),
    signatureDataUrl: String(input?.signatureDataUrl ?? '')
  };
  if (!signature.name) {
    const err = new Error('name requis pour signer');
    err.statusCode = 400;
    throw err;
  }
  /** @type {Record<string, unknown>} */
  const data = p === 'client' ? { clientSignature: signature } : { contractorSignature: signature };
  const otherSigned = p === 'client' ? existing.contractorSignature : existing.clientSignature;
  if (otherSigned && existing.status === 'draft') {
    data.status = 'validated';
  }
  const updated = await prisma.preventionPlan.update({ where: { id: existing.id }, data });
  return serialize(updated);
}

export async function deletePreventionPlan(tenantId, id) {
  const pid = String(id ?? '').trim();
  if (!pid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const del = await prisma.preventionPlan.deleteMany({ where: { id: pid, ...tf } });
  if (!del?.count) {
    const err = new Error('Plan de prévention introuvable');
    err.statusCode = 404;
    throw err;
  }
}
