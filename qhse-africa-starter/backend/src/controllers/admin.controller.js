import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { sendJsonError } from '../lib/apiErrors.js';
import * as authService from '../services/auth.service.js';
import { adminCreateClientBodySchema } from '../validation/adminSchemas.js';

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
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        members: {
          where: {
            user: { role: 'CLIENT_ADMIN' }
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                clientCode: true,
                isActive: true,
                mustChangePassword: true
              }
            }
          }
        }
      }
    });
    const clients = tenants.map((t) => {
      const m = t.members[0];
      return {
        tenant: {
          id: t.id,
          name: t.name,
          slug: t.slug,
          status: t.status,
          createdAt: t.createdAt
        },
        clientAdmin: m?.user
          ? {
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              clientCode: m.user.clientCode,
              isActive: m.user.isActive,
              mustChangePassword: m.user.mustChangePassword
            }
          : null
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
