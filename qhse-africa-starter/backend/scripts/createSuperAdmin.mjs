import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';
import { validatePasswordPolicy } from '../src/lib/validation.js';

function requiredEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`[admin:create] Variable requise manquante: ${name}`);
  }
  return String(v).trim();
}

function asEmail(v) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

const PLATFORM_TENANT_SLUG = 'qhse-control-platform';
const PLATFORM_TENANT_NAME = 'QHSE Control Platform';
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

async function ensurePlatformTenant() {
  const existing = await prisma.tenant.findUnique({
    where: { slug: PLATFORM_TENANT_SLUG },
    select: { id: true, slug: true, name: true }
  });
  if (existing) return existing;
  return await prisma.tenant.create({
    data: { slug: PLATFORM_TENANT_SLUG, name: PLATFORM_TENANT_NAME, status: 'active' },
    select: { id: true, slug: true, name: true }
  });
}

async function upsertSuperAdmin({ email, password }) {
  const passwordCheck = validatePasswordPolicy(password);
  if (!passwordCheck.ok) {
    throw new Error(`[admin:create] Mot de passe invalide: ${passwordCheck.error}`);
  }

  const tenant = await ensurePlatformTenant();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: 'Super Administrateur',
      email,
      role: SUPER_ADMIN_ROLE,
      passwordHash,
      isActive: true,
      mustChangePassword: false
    },
    update: {
      role: SUPER_ADMIN_ROLE,
      passwordHash,
      isActive: true,
      mustChangePassword: false
    },
    select: { id: true, email: true, role: true, isActive: true }
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    create: { tenantId: tenant.id, userId: user.id, role: SUPER_ADMIN_ROLE },
    update: { role: SUPER_ADMIN_ROLE }
  });

  return { tenant, user };
}

async function main() {
  const email = asEmail(requiredEnv('SUPER_ADMIN_EMAIL'));
  const password = requiredEnv('SUPER_ADMIN_PASSWORD');

  if (!email.includes('@')) {
    throw new Error('[admin:create] SUPER_ADMIN_EMAIL doit être un e-mail valide.');
  }

  const { tenant, user } = await upsertSuperAdmin({ email, password });
  console.log('[admin:create] OK');
  console.log(`- tenant: ${tenant.slug} (${tenant.name})`);
  console.log(`- user: ${user.email} (role=${user.role}, active=${user.isActive ? 'true' : 'false'})`);
}

main()
  .catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });

