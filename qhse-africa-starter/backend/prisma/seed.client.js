import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function isProdEnv() {
  return process.env.NODE_ENV === 'production';
}

function requiredEnv(name) {
  const v = String(process.env[name] || '').trim();
  if (!v) throw new Error(`[seed:client] Variable requise manquante: ${name}`);
  return v;
}

function optionalEnv(name, fallback) {
  const v = String(process.env[name] || '').trim();
  return v || fallback;
}

function validatePasswordOrThrow(pw) {
  const s = String(pw || '');
  if (!s) throw new Error('[seed:client] Mot de passe admin manquant.');
  if (isProdEnv()) {
    if (s.length < 12) {
      throw new Error('[seed:client] Mot de passe admin trop court en production (min 12 caractères).');
    }
    if (/demo|changez-moi|changeme|password|admin/i.test(s)) {
      throw new Error('[seed:client] Mot de passe admin semble faible / par défaut — remplacez-le.');
    }
  }
}

async function main() {
  // Base client vierge: uniquement tenant + admin + membership.
  // Aucun incident/risque/audit/action/site créé ici.
  const tenantSlug = optionalEnv('CLIENT_TENANT_SLUG', 'client');
  const tenantName = optionalEnv('CLIENT_TENANT_NAME', 'Client');
  const adminEmail = requiredEnv('CLIENT_ADMIN_EMAIL').toLowerCase();
  const adminName = optionalEnv('CLIENT_ADMIN_NAME', 'Administrateur');
  const adminRole = optionalEnv('CLIENT_ADMIN_ROLE', 'ADMIN');
  const rawPassword = requiredEnv('CLIENT_ADMIN_PASSWORD');
  validatePasswordOrThrow(rawPassword);

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    create: { slug: tenantSlug, name: tenantName, status: 'active' },
    update: { name: tenantName, status: 'active' }
  });

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: adminName,
      email: adminEmail,
      role: adminRole,
      passwordHash,
      isActive: true,
      mustChangePassword: true
    },
    update: {
      name: adminName,
      role: adminRole,
      passwordHash,
      isActive: true,
      mustChangePassword: true
    }
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    create: { tenantId: tenant.id, userId: user.id, role: adminRole },
    update: { role: adminRole }
  });

  console.log('[seed:client] OK');
  console.log(`- tenant: ${tenant.name} (slug=${tenant.slug}, id=${tenant.id})`);
  console.log(`- admin: ${user.email} (role=${user.role})`);
  console.log('- note: mustChangePassword=true (première connexion sécurisée)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

