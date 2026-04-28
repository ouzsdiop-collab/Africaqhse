import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { sendJsonError } from '../lib/apiErrors.js';
import * as authService from '../services/auth.service.js';
import {
  adminCreateClientBodySchema,
  adminCreateTenantUserBodySchema,
  adminPatchTenantBodySchema,
  adminPatchTenantUserBodySchema,
  adminTenantScopedBodySchema
} from '../validation/adminSchemas.js';

const PLATFORM_TENANT_SLUG = 'qhse-control-platform';

function normalizeSettings(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
}

function slugifyName(s) {
  const base = String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'client';
}

async function ensureUniqueTenantSlug(fromName) {
  let base = slugifyName(fromName);
  let slug = base;
  let n = 0;
  for (;;) {
    const clash = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!clash) return slug;
    n += 1;
    slug = `${base}-${n}`.slice(0, 60);
  }
}

async function ensureUniqueClientCode() {
  for (let i = 0; i < 40; i += 1) {
    const code = `cli-${randomBytes(4).toString('hex')}`;
    const exists = await prisma.user.findUnique({ where: { clientCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error('Impossible de générer un code client unique');
}

export async function listClients(req, res, next) {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { slug: { not: PLATFORM_TENANT_SLUG } },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        members: {
          orderBy: { createdAt: 'asc' },
          take: 500,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                clientCode: true,
                isActive: true,
                mustChangePassword: true,
                lastLoginAt: true,
                createdAt: true
              }
            }
          }
        }
      }
    });
    const clients = tenants.map((t) => {
      const users = t.members
        .filter((m) => m.user)
        .map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.user.role,
          memberRole: m.role,
          clientCode: m.user.clientCode,
          isActive: m.user.isActive,
          mustChangePassword: m.user.mustChangePassword,
          lastLoginAt: m.user.lastLoginAt,
          createdAt: m.user.createdAt
        }));
      const clientAdmin =
        users.find((u) => String(u.role || '').toUpperCase() === 'CLIENT_ADMIN') ?? users[0] ?? null;
      return {
        tenant: {
          id: t.id,
          name: t.name,
          slug: t.slug,
          status: t.status,
          settings: normalizeSettings(t.settings),
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        },
        users,
        clientAdmin
      };
    });
    res.json({ clients });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const parsed = adminCreateClientBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }
    const { companyName, contactName, email, clientCode: wantedCode } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return sendJsonError(res, 409, 'Un compte existe déjà pour cet e-mail.', req, {
        code: 'EMAIL_IN_USE'
      });
    }

    const slug = await ensureUniqueTenantSlug(companyName);
    const provisional = authService.generateProvisioningPassword();
    const passwordHash = await bcrypt.hash(provisional, 12);

    let clientCode = wantedCode || (await ensureUniqueClientCode());
    if (wantedCode) {
      const clash = await prisma.user.findUnique({
        where: { clientCode: wantedCode },
        select: { id: true }
      });
      if (clash) {
        return sendJsonError(res, 409, 'Identifiant client déjà utilisé.', req, {
          code: 'CLIENT_CODE_IN_USE'
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName.trim(),
          slug,
          status: 'active'
        }
      });
      const user = await tx.user.create({
        data: {
          name: contactName.trim(),
          email,
          role: 'CLIENT_ADMIN',
          passwordHash,
          clientCode,
          isActive: true,
          mustChangePassword: true,
          temporaryPasswordCreatedAt: new Date()
        }
      });
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'CLIENT_ADMIN'
        }
      });
      return { tenant, user };
    });

    res.status(201).json({
      ok: true,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        clientCode
      },
      provisionalPassword: provisional
    });
  } catch (err) {
    next(err);
  }
}

export async function resetClientPassword(req, res, next) {
  try {
    const tenantId = String(req.params.id ?? '').trim();
    if (!tenantId) {
      return res.status(400).json({ error: 'Identifiant entreprise requis.' });
    }

    const member = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        user: { role: 'CLIENT_ADMIN' }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            clientCode: true
          }
        }
      }
    });

    if (!member?.user) {
      return sendJsonError(res, 404, 'Administrateur client introuvable pour cette entreprise.', req, {
        code: 'NO_CLIENT_ADMIN'
      });
    }

    const provisional = authService.generateProvisioningPassword();
    const passwordHash = await bcrypt.hash(provisional, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: member.user.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          temporaryPasswordCreatedAt: new Date()
        }
      }),
      prisma.refreshToken.deleteMany({ where: { userId: member.user.id } })
    ]);

    res.json({
      ok: true,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        clientCode: member.user.clientCode
      },
      provisionalPassword: provisional
    });
  } catch (err) {
    next(err);
  }
}

export async function patchTenant(req, res, next) {
  try {
    const tenantId = String(req.params.id ?? '').trim();
    if (!tenantId) {
      return res.status(400).json({ error: 'Identifiant entreprise requis.' });
    }

    const parsed = adminPatchTenantBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }

    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, settings: true }
    });
    if (!existing || existing.slug === PLATFORM_TENANT_SLUG) {
      return sendJsonError(res, 404, 'Entreprise introuvable.', req, { code: 'NOT_FOUND' });
    }

    const { name, status, modules } = parsed.data;
    const data = {};
    if (name != null) data.name = name;
    if (status != null) data.status = status;
    if (modules != null && typeof modules === 'object') {
      const cur = normalizeSettings(existing.settings);
      const curModules =
        cur.modules && typeof cur.modules === 'object' && !Array.isArray(cur.modules)
          ? cur.modules
          : {};
      data.settings = { ...cur, modules: { ...curModules, ...modules } };
    }

    if (Object.keys(data).length === 0) {
      return sendJsonError(res, 400, 'Aucun champ à mettre à jour.', req, { code: 'EMPTY_PATCH' });
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: { id: true, name: true, slug: true, status: true, settings: true, updatedAt: true }
    });
    res.json({
      ok: true,
      tenant: { ...tenant, settings: normalizeSettings(tenant.settings) }
    });
  } catch (err) {
    next(err);
  }
}

export async function createTenantUser(req, res, next) {
  try {
    const tenantId = String(req.params.id ?? '').trim();
    if (!tenantId) {
      return res.status(400).json({ error: 'Identifiant entreprise requis.' });
    }

    const parsed = adminCreateTenantUserBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true }
    });
    if (!tenant || tenant.slug === PLATFORM_TENANT_SLUG) {
      return sendJsonError(res, 404, 'Entreprise introuvable.', req, { code: 'NOT_FOUND' });
    }

    const { name, email, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return sendJsonError(res, 409, 'Un compte existe déjà pour cet e-mail.', req, {
        code: 'EMAIL_IN_USE'
      });
    }

    const provisional = authService.generateProvisioningPassword();
    const passwordHash = await bcrypt.hash(provisional, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: name.trim(),
          email,
          role,
          passwordHash,
          isActive: true,
          mustChangePassword: true,
          temporaryPasswordCreatedAt: new Date()
        },
        select: { id: true, name: true, email: true, role: true }
      });
      await tx.tenantMember.create({
        data: { tenantId, userId: u.id, role }
      });
      return u;
    });

    res.status(201).json({
      ok: true,
      user,
      provisionalPassword: provisional
    });
  } catch (err) {
    next(err);
  }
}

export async function patchTenantUser(req, res, next) {
  try {
    const userId = String(req.params.userId ?? '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'Identifiant utilisateur requis.' });
    }

    const parsed = adminPatchTenantUserBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }

    const { tenantId, role, isActive } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true }
    });
    if (!tenant || tenant.slug === PLATFORM_TENANT_SLUG) {
      return sendJsonError(res, 404, 'Entreprise introuvable.', req, { code: 'NOT_FOUND' });
    }

    const member = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: { user: { select: { id: true, role: true } } }
    });
    if (!member?.user) {
      return sendJsonError(res, 404, 'Utilisateur introuvable dans cette entreprise.', req, {
        code: 'NOT_FOUND'
      });
    }

    if (String(member.user.role || '').toUpperCase() === 'SUPER_ADMIN') {
      return sendJsonError(res, 400, 'Action non autorisée sur ce compte.', req, {
        code: 'FORBIDDEN_ROLE'
      });
    }

    const userData = {};
    if (role != null) userData.role = role;
    if (isActive != null) userData.isActive = isActive;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: userData });
      if (role != null) {
        await tx.tenantMember.update({
          where: { tenantId_userId: { tenantId, userId } },
          data: { role }
        });
      }
      if (isActive === false) {
        await tx.refreshToken.deleteMany({ where: { userId } });
      }
    });

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true }
    });
    res.json({ ok: true, user: updated });
  } catch (err) {
    next(err);
  }
}

export async function resetUserPassword(req, res, next) {
  try {
    const userId = String(req.params.userId ?? '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'Identifiant utilisateur requis.' });
    }

    const parsed = adminTenantScopedBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }
    const { tenantId } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true }
    });
    if (!tenant || tenant.slug === PLATFORM_TENANT_SLUG) {
      return sendJsonError(res, 404, 'Entreprise introuvable.', req, { code: 'NOT_FOUND' });
    }

    const member = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: {
        user: {
          select: { id: true, email: true, name: true, clientCode: true, role: true }
        }
      }
    });
    if (!member?.user) {
      return sendJsonError(res, 404, 'Utilisateur introuvable.', req, { code: 'NOT_FOUND' });
    }

    if (String(member.user.role || '').toUpperCase() === 'SUPER_ADMIN') {
      return sendJsonError(res, 400, 'Action non autorisée.', req, { code: 'FORBIDDEN' });
    }

    const provisional = authService.generateProvisioningPassword();
    const passwordHash = await bcrypt.hash(provisional, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: true,
          temporaryPasswordCreatedAt: new Date()
        }
      }),
      prisma.refreshToken.deleteMany({ where: { userId } })
    ]);

    res.json({
      ok: true,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        clientCode: member.user.clientCode
      },
      provisionalPassword: provisional
    });
  } catch (err) {
    next(err);
  }
}
