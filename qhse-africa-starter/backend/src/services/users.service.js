import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { validatePasswordPolicy } from '../lib/validation.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true
};

/** `_tenantId` est ignoré (V1 mono-tenant). */
export async function findAllUsers(_tenantId) {
  return prisma.user.findMany({
    select: userPublicSelect,
    orderBy: { name: 'asc' },
    take: 500
  });
}

export async function findUserById(_tenantId, id) {
  const uid = typeof id === 'string' ? id.trim() : '';
  if (!uid) return null;
  return prisma.user.findUnique({
    where: { id: uid },
    select: userPublicSelect
  });
}

/**
 * Crée un utilisateur global (rôle sur `User`).
 */
export async function createUser(_tenantId, { name, email, role, password }) {
  const r = String(role ?? '').trim().toUpperCase();
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
  return prisma.user.create({
    data: {
      name,
      email,
      role: r,
      passwordHash
    },
    select: userPublicSelect
  });
}

/**
 * @param {string | null | undefined} _tenantId
 * @param {string} userId
 * @param {{ name?: string, role?: string, password?: string }} patch
 */
export async function updateUserInTenant(_tenantId, userId, patch) {
  const uid = String(userId ?? '').trim();
  if (!uid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }
  const existing = await prisma.user.findUnique({ where: { id: uid } });
  if (!existing) {
    const err = new Error('Utilisateur introuvable');
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

  await prisma.user.update({ where: { id: uid }, data: userData });
  return findUserById(null, uid);
}

/**
 * Supprime l’utilisateur. Option : désassigner ses actions d’abord.
 * @param {{ unassignActions?: boolean }} [options]
 */
export async function removeUserFromTenant(_tenantId, userId, options = {}) {
  const unassignActions = Boolean(options.unassignActions);
  const uid = String(userId ?? '').trim();
  if (!uid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }
  const m = await prisma.user.findUnique({ where: { id: uid } });
  if (!m) {
    const err = new Error('Utilisateur introuvable');
    err.code = 'P2025';
    throw err;
  }
  const tf = prismaTenantFilter(_tenantId);
  const assignedHere = await prisma.action.count({
    where: { assigneeId: uid, ...tf }
  });
  if (assignedHere > 0 && !unassignActions) {
    const err = new Error(
      'Impossible de retirer cet utilisateur : des actions lui sont encore assignées.'
    );
    err.statusCode = 409;
    err.code = 'USER_HAS_ACTIONS';
    err.assignedActionCount = assignedHere;
    throw err;
  }
  await prisma.$transaction(async (tx) => {
    if (unassignActions && assignedHere > 0) {
      await tx.action.updateMany({
        where: { assigneeId: uid, ...tf },
        data: { assigneeId: null }
      });
    }
    await tx.user.delete({ where: { id: uid } });
  });
}
