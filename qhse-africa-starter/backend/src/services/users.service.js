import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { validatePasswordPolicy } from '../lib/validation.js';
import { prismaTenantFilter, normalizeTenantId } from '../lib/tenantScope.js';

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  onboardingCompleted: true,
  onboardingStep: true
};

/** Utilisateurs ayant une adhésion active sur le tenant courant. */
export async function findAllUsers(tenantId) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) return [];
  const members = await prisma.tenantMember.findMany({
    where: { tenantId: tid },
    select: { userId: true },
    take: 500
  });
  const ids = members.map((m) => m.userId).filter(Boolean);
  if (!ids.length) return [];
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: userPublicSelect,
    orderBy: { name: 'asc' },
    take: 500
  });
}

export async function findUserById(tenantId, id) {
  const uid = typeof id === 'string' ? id.trim() : '';
  if (!uid) return null;
  const tid = normalizeTenantId(tenantId);
  if (!tid) return null;
  const m = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: tid, userId: uid } },
    select: { userId: true }
  });
  if (!m) return null;
  return prisma.user.findUnique({
    where: { id: uid },
    select: userPublicSelect
  });
}

/**
 * Crée un utilisateur et l’attache à l’organisation courante (`tenant_members`).
 */
export async function createUser(tenantId, { name, email, role, password }) {
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
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Tenant requis');
    err.statusCode = 400;
    throw err;
  }
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: r,
      passwordHash
    },
    select: { id: true }
  });
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tid, userId: user.id } },
    create: { tenantId: tid, userId: user.id, role: r },
    update: { role: r }
  });
  return prisma.user.findUnique({
    where: { id: user.id },
    select: userPublicSelect
  });
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} userId
 * @param {{
 *   name?: string,
 *   role?: string,
 *   password?: string,
 *   onboardingCompleted?: boolean,
 *   onboardingStep?: number
 * }} patch
 */
export async function updateUserInTenant(tenantId, userId, patch) {
  const uid = String(userId ?? '').trim();
  if (!uid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Tenant requis');
    err.statusCode = 400;
    throw err;
  }
  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: tid, userId: uid } }
  });
  if (!membership) {
    const err = new Error('Utilisateur introuvable');
    err.code = 'P2025';
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

  const hasOnboardingCompleted = typeof patch.onboardingCompleted === 'boolean';
  let onboardingStepUpdate = null;
  if (patch.onboardingStep !== undefined && patch.onboardingStep !== null) {
    const s = Math.floor(Number(patch.onboardingStep));
    if (Number.isFinite(s)) {
      onboardingStepUpdate = Math.max(0, Math.min(5, s));
    }
  }

  if (
    !name &&
    !role &&
    !password &&
    !hasOnboardingCompleted &&
    onboardingStepUpdate === null
  ) {
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
  if (hasOnboardingCompleted) userData.onboardingCompleted = patch.onboardingCompleted;
  if (onboardingStepUpdate !== null) userData.onboardingStep = onboardingStepUpdate;

  await prisma.user.update({ where: { id: uid }, data: userData });
  if (role) {
    await prisma.tenantMember.update({
      where: { tenantId_userId: { tenantId: tid, userId: uid } },
      data: { role }
    });
  }
  return findUserById(tid, uid);
}

/**
 * Met à jour uniquement l’étape d’onboarding (0–5).
 * @param {string | null | undefined} tenantId
 * @param {string} userId
 * @param {number} step
 */
export async function updateOnboardingStep(tenantId, userId, step) {
  const uid = String(userId ?? '').trim();
  if (!uid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Tenant requis');
    err.statusCode = 400;
    throw err;
  }
  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: tid, userId: uid } }
  });
  if (!membership) {
    const err = new Error('Utilisateur introuvable');
    err.code = 'P2025';
    throw err;
  }
  const existing = await prisma.user.findUnique({ where: { id: uid } });
  if (!existing) {
    const err = new Error('Utilisateur introuvable');
    err.code = 'P2025';
    throw err;
  }
  const s = Math.max(0, Math.min(5, Math.floor(Number(step) || 0)));
  await prisma.user.update({
    where: { id: uid },
    data: { onboardingStep: s }
  });
  return findUserById(tid, uid);
}

/**
 * Retire l’utilisateur du tenant (supprime l’adhésion). Le compte global peut rester s’il appartient à d’autres organisations.
 * @param {{ unassignActions?: boolean }} [options]
 */
export async function removeUserFromTenant(tenantId, userId, options = {}) {
  const unassignActions = Boolean(options.unassignActions);
  const uid = String(userId ?? '').trim();
  if (!uid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Tenant requis');
    err.statusCode = 400;
    throw err;
  }
  const member = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: tid, userId: uid } }
  });
  if (!member) {
    const err = new Error('Utilisateur introuvable');
    err.code = 'P2025';
    throw err;
  }
  const tf = prismaTenantFilter(tid);
  const assignedHere = await prisma.action.count({
    where: { assigneeId: uid, ...tf }
  });
  if (assignedHere > 0 && !unassignActions) {
    const err = new Error(
      'Impossible de retirer ce membre : des actions de cette organisation lui sont encore assignées.'
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
    await tx.tenantMember.delete({
      where: { tenantId_userId: { tenantId: tid, userId: uid } }
    });
  });
}
