import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';

const MAX_TOTAL = 40;
const MAX_SOURCE_ACTIONS = 120;
const MAX_SOURCE_INCIDENTS = 80;
const MAX_SOURCE_NC = 25;
const MAX_SOURCE_AUDITS = 20;

const ASSIGNED_ACTION_MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;
const AUDIT_RECENT_MS = 14 * 24 * 60 * 60 * 1000;

/** @typedef {{ id: string, role: string } | null} QhseUserCtx */

const ROLES = {
  ADMIN: 'ADMIN',
  QHSE: 'QHSE',
  DIRECTION: 'DIRECTION',
  ASSISTANT: 'ASSISTANT'
};

function includesInsensitive(haystack, needle) {
  return String(haystack ?? '').toLowerCase().includes(String(needle).toLowerCase());
}

function formatTimestamp(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizeRole(role) {
  return String(role ?? '').trim().toUpperCase();
}

/**
 * @param {{ type: 'all' } | { type: 'roles', roles: string[] } | { type: 'user', userId: string } | { type: 'userOrRoles', userId: string, roles: string[] }} audience
 * @param {NonNullable<QhseUserCtx>} qhseUser
 */
function matchesAudience(audience, qhseUser) {
  const r = normalizeRole(qhseUser.role);
  const uid = qhseUser.id;
  switch (audience.type) {
    case 'all':
      return true;
    case 'roles':
      return audience.roles.includes(r);
    case 'user':
      return audience.userId === uid;
    case 'userOrRoles':
      return audience.userId === uid || audience.roles.includes(r);
    default:
      return false;
  }
}

function isActionOverdueStatus(status) {
  return includesInsensitive(status, 'retard');
}

function isActionStillOpenish(status) {
  const s = String(status ?? '').toLowerCase();
  if (s.includes('termin')) return false;
  if (s.includes('clos')) return false;
  if (s.includes('fermé')) return false;
  return true;
}

function withinMs(date, ms) {
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
  return Number.isFinite(t) && Date.now() - t <= ms;
}

/**
 * @param {QhseUserCtx} qhseUser — null = flux global historique (aucun ciblage)
 * @param {string | null | undefined} tenantId
 */
export async function getNotificationsFeed(qhseUser, tenantId) {
  const tf = prismaTenantFilter(tenantId);
  const [incidentRows, actionRows, openNcs, auditRows] = await Promise.all([
    prisma.incident.findMany({
      where: { ...tf },
      orderBy: { createdAt: 'desc' },
      take: MAX_SOURCE_INCIDENTS
    }),
    prisma.action.findMany({
      where: { ...tf },
      orderBy: { createdAt: 'desc' },
      take: MAX_SOURCE_ACTIONS,
      include: {
        assignee: { select: { id: true, name: true } }
      }
    }),
    prisma.nonConformity.findMany({
      where: { ...tf, status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: MAX_SOURCE_NC
    }),
    prisma.audit.findMany({
      where: { ...tf },
      orderBy: { createdAt: 'desc' },
      take: MAX_SOURCE_AUDITS
    })
  ]);

  /** @type {Array<{ at: Date, item: object, audience: object }>} */
  const combined = [];

  const incidentAudience = {
    type: 'roles',
    roles: [ROLES.ADMIN, ROLES.QHSE, ROLES.DIRECTION, ROLES.ASSISTANT]
  };

  for (const inc of incidentRows) {
    if (!includesInsensitive(inc.severity, 'critique')) continue;
    combined.push({
      at: inc.createdAt,
      audience: incidentAudience,
      item: {
        id: `incident-${inc.id}`,
        kind: 'incident',
        title: `Incident critique — ${inc.ref}`,
        detail: `${inc.type} · ${inc.site} · ${inc.status}`,
        level: 'critical',
        read: false,
        timestamp: formatTimestamp(inc.createdAt)
      }
    });
  }

  const oversightRoles = [ROLES.ADMIN, ROLES.QHSE];
  const unassignedOverdueRoles = [ROLES.ADMIN, ROLES.QHSE, ROLES.DIRECTION];

  const overdueIds = new Set();

  for (const a of actionRows) {
    if (!isActionOverdueStatus(a.status)) continue;
    overdueIds.add(a.id);
    const parts = [a.detail || 'Sans détail'];
    if (a.assignee?.name) parts.push(`Resp. ${a.assignee.name}`);
    else if (a.owner) parts.push(`Resp. ${a.owner}`);

    /** @type {{ type: string, roles?: string[], userId?: string }} */
    let audience;
    if (a.assigneeId) {
      audience = { type: 'userOrRoles', userId: a.assigneeId, roles: oversightRoles };
    } else {
      audience = { type: 'roles', roles: unassignedOverdueRoles };
    }

    combined.push({
      at: a.createdAt,
      audience,
      item: {
        id: `action-${a.id}`,
        kind: 'action',
        title: `Action en retard — ${a.title}`,
        detail: parts.join(' · '),
        level: 'warning',
        read: false,
        timestamp: formatTimestamp(a.createdAt)
      }
    });
  }

  /**
   * Actions assignées au profil courant uniquement (pas dans le flux global sans X-User-Id).
   */
  if (qhseUser) {
    for (const a of actionRows) {
      if (!a.assigneeId || a.assigneeId !== qhseUser.id) continue;
      if (overdueIds.has(a.id)) continue;
      if (!isActionStillOpenish(a.status)) continue;
      if (!withinMs(a.createdAt, ASSIGNED_ACTION_MAX_AGE_MS)) continue;

      const parts = [a.detail || 'Sous votre responsabilité'];
      if (a.assignee?.name) parts.push(`Assignée à ${a.assignee.name}`);

      combined.push({
        at: a.createdAt,
        audience: { type: 'user', userId: a.assigneeId },
        item: {
          id: `action-assigned-${a.id}`,
          kind: 'action_assigned',
          title: `Action assignée — ${a.title}`,
          detail: parts.join(' · '),
          level: 'info',
          read: false,
          timestamp: formatTimestamp(a.createdAt)
        }
      });
    }
  }

  const ncAudience = { type: 'roles', roles: [ROLES.ADMIN, ROLES.QHSE] };

  for (const nc of openNcs) {
    combined.push({
      at: nc.createdAt,
      audience: ncAudience,
      item: {
        id: `nc-${nc.id}`,
        kind: 'nonconformity',
        title: `Non-conformité ouverte — ${nc.auditRef}`,
        detail: nc.detail?.trim() || nc.title,
        level: 'warning',
        read: false,
        timestamp: formatTimestamp(nc.createdAt)
      }
    });
  }

  const auditAudience = {
    type: 'roles',
    roles: [ROLES.ADMIN, ROLES.QHSE, ROLES.DIRECTION]
  };

  for (const au of auditRows) {
    if (qhseUser) {
      const t = new Date(au.createdAt).getTime();
      if (!Number.isFinite(t) || Date.now() - t > AUDIT_RECENT_MS) continue;
    }

    combined.push({
      at: au.createdAt,
      audience: auditAudience,
      item: {
        id: `audit-${au.id}`,
        kind: 'audit',
        title: `Audit récent — ${au.ref}`,
        detail: `${au.site} · Score ${au.score}% · ${au.status}`,
        level: 'info',
        read: false,
        timestamp: formatTimestamp(au.createdAt)
      }
    });
  }

  combined.sort((a, b) => new Date(b.at) - new Date(a.at));

  const filtered = !qhseUser
    ? combined
    : combined.filter((entry) => matchesAudience(entry.audience, qhseUser));

  return filtered.slice(0, MAX_TOTAL).map((x) => x.item);
}
