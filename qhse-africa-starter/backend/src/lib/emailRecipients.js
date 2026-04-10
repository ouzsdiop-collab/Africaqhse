import { prisma } from '../db.js';

const PILOTAGE_ROLES = ['ADMIN', 'QHSE', 'DIRECTION'];

/**
 * Destinataires pilotage (e-mail renseigné) — alertes incidents, synthèses.
 * @returns {{ email: string, name?: string | null, role?: string }[]}
 */
export async function fetchPilotageRecipientEmails() {
  const users = await prisma.user.findMany({
    where: { role: { in: PILOTAGE_ROLES } },
    select: { email: true, name: true, role: true }
  });
  const seen = new Set();
  const out = [];
  for (const u of users) {
    const e = String(u?.email ?? '').trim().toLowerCase();
    if (!e || seen.has(e)) continue;
    seen.add(e);
    out.push({ email: e, name: u?.name, role: u.role });
  }
  return out;
}
