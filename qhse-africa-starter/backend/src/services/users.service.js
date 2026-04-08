import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { validatePasswordPolicy } from '../lib/validation.js';

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true
};

function tid(tenantId) {
  return tenantId == null || tenantId === '' ? '' : String(tenantId).trim();
}

function mapMembershipToPublic(m) {
  if (!m?.user) return null;
  const u = m.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: String(m.role ?? '').trim().toUpperCase(),
    createdAt: u.createdAt
  };
}

/** Utilisateurs ayant une adhésion sur ce tenant — le champ `role` est celui de l’adhésion. */
export async function findAllUsers(tenantId) {
  const t = tid(tenantId);
  if (!t) return [];
  const rows = await prisma.userTenant.findMany({
    where: { tenantId: t },
    include: { user: { select: userPublicSelect } },
    orderBy: { user: { name: 'asc' } },
    take: 500
  });
  return rows.map((m) => mapMembershipToPublic(m)).filter(Boolean);
}

export async function findUserById(tenantId, id) {
  const t = tid(tenantId);
  const uid = typeof id === 'string' ? id.trim() : '';
  if (!t || !uid) return null;
  const m = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId: uid, tenantId: t } },
    include: { user: { select: userPublicSelect } }
  });
  return mapMembershipToPublic(m);
}

/**
 * Crée l’utilisateur global + adhésion au tenant courant.
 * Si `password` est fourni, enregistre un hash bcrypt (connexion e-mail / mot de passe).
 */
export async function createUser(tenantId, { name, email, role, password }) {
  const t = tid(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation manquant');
    err.statusCode = 400;
    throw err;
  }
  const r = String(role ?? '').trim().toUpperCase();
  return prisma.$transaction(async (tx) => {
    let passwordHash = null;
    if (password != null && String(password).length > 0) {
      const pwd = String(password);
      const pv = validatePasswordPolicy(pwd);
      if (!pv.ok) {
        const err = new Error(pv.error);
        err.statusCode = 400;
        throw err;
      }
      passwordHash = await bcrypt.hash(pwd, 10);
    }
    const user = await tx.user.create({
      data: {
        name,
        email,
        role: r,
        passwordHash
      },
      select: userPublicSelect
    });
    await tx.userTenant.create({
      data: {
        userId: user.id,
        tenantId: t,
        role: r,
        defaultSiteId: null
      }
    });
    return { ...user, role: r };
  });
}

/**
 * Met à jour nom (global), rôle d’adhésion et/ou mot de passe (hash bcrypt sur `User`).
 * @param {string | null | undefined} tenantId
 * @param {string} userId
 * @param {{ name?: string, role?: string, password?: string }} patch
 */
export async function updateUserInTenant(tenantId, userId, patch) {
  const t = tid(tenantId);
  const uid = String(userId ?? '').trim();
  if (!t || !uid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }
  const existing = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId: uid, tenantId: t } }
  });
  if (!existing) {
    const err = new Error('Utilisateur introuvable dans cette organisation');
    err.code = 'P2025';
    throw err;
  }
  const name =
    patch.name != null && String(patch.name).trim() !== '' ? String(patch.name).trim() : null;
  const role =
    patch.role != null && String(patch.role).trim() !== ''
      ? String(patch.role).trim().toUpperCase()
      : null;
  const password =
    patch.password != null && String(patch.password).length > 0 ? String(patch.password) : null;

  if (!name && !role && !password) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    if (role) {
      await tx.userTenant.update({
        where: { userId_tenantId: { userId: uid, tenantId: t } },
        data: { role }
      });
    }
    const userData = {};
    if (name) userData.name = name;
    if (role) userData.role = role;
    if (password) {
      const pv = validatePasswordPolicy(password);
      if (!pv.ok) {
        const err = new Error(pv.error);
        err.statusCode = 400;
        throw err;
      }
      userData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (Object.keys(userData).length) {
      await tx.user.update({ where: { id: uid }, data: userData });
    }
  });

  return findUserById(t, uid);
}

/**
 * Retire l’adhésion au tenant. Si plus aucune adhésion, supprime l’utilisateur global.
 * @param {{ unassignActions?: boolean }} [options] — si `unassignActions`, désassigne d’abord les actions du tenant pour cet utilisateur.
 */
export async function removeUserFromTenant(tenantId, userId, options = {}) {
  const unassignActions = Boolean(options.unassignActions);
  const t = tid(tenantId);
  const uid = String(userId ?? '').trim();
  if (!t || !uid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }
  const m = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId: uid, tenantId: t } }
  });
  if (!m) {
    const err = new Error('Utilisateur introuvable dans cette organisation');
    err.code = 'P2025';
    throw err;
  }
  const assignedHere = await prisma.action.count({
    where: { assigneeId: uid, tenantId: t }
  });
  if (assignedHere > 0 && !unassignActions) {
    const err = new Error(
      'Impossible de retirer cet utilisateur : des actions de cette organisation lui sont encore assignées.'
    );
    err.statusCode = 409;
    err.code = 'USER_HAS_ACTIONS';
    err.assignedActionCount = assignedHere;
    throw err;
  }
  await prisma.$transaction(async (tx) => {
    if (unassignActions && assignedHere > 0) {
      await tx.action.updateMany({
        where: { assigneeId: uid, tenantId: t },
        data: { assigneeId: null }
      });
    }
    await tx.userTenant.delete({
      where: { userId_tenantId: { userId: uid, tenantId: t } }
    });
    const remaining = await tx.userTenant.count({ where: { userId: uid } });
    if (remaining === 0) {
      await tx.user.delete({ where: { id: uid } });
    }
  });
}
