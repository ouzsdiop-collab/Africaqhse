import { prisma } from '../db.js';
import { normalizeTenantId } from './tenantScope.js';

const PILOTAGE_ROLES = ['ADMIN', 'QHSE', 'DIRECTION'];

function dedupePilotageRows(rows) {
  const seen = new Set();
  const out = [];
  for (const u of rows) {
    const e = String(u?.email ?? '').trim().toLowerCase();
    if (!e || seen.has(e)) continue;
    seen.add(e);
    out.push({ email: e, name: u.name, role: u.role });
  }
  return out;
}

/**
 * Destinataires pilotage (e-mail renseigné) pour une organisation — alertes, synthèses.
 * @returns {{ email: string, name?: string | null, role?: string }[]}
 */
export async function fetchPilotageRecipientEmailsForTenant(tenantId) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) return [];

  const members = await prisma.tenantMember.findMany({
    where: { tenantId: tid },
    include: {
      user: { select: { email: true, name: true, role: true } }
    }
  });

  const rows = [];
  for (const m of members) {
    const u = m.user;
    if (!u) continue;
    const role = String(u.role ?? '').trim().toUpperCase();
    if (!PILOTAGE_ROLES.includes(role)) continue;
    rows.push(u);
  }
  return dedupePilotageRows(rows);
}
