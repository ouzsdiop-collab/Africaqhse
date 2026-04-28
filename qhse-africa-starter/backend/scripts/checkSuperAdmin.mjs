import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';

function requiredEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`[admin:check] Variable requise manquante: ${name}`);
  }
  return String(v).trim();
}

function asEmail(v) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

const PLATFORM_TENANT_SLUG = 'qhse-control-platform';
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

async function main() {
  const email = asEmail(requiredEnv('SUPER_ADMIN_EMAIL'));
  const password = process.env.SUPER_ADMIN_PASSWORD ? String(process.env.SUPER_ADMIN_PASSWORD) : '';

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, isActive: true, passwordHash: true }
  });

  if (!user) {
    console.log('[admin:check] user_exists: no');
    process.exit(2);
  }

  const hasHash = Boolean(user.passwordHash && String(user.passwordHash).trim());
  const roleOk = String(user.role ?? '').trim().toUpperCase() === SUPER_ADMIN_ROLE;
  const activeOk = user.isActive !== false;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: PLATFORM_TENANT_SLUG },
    select: { id: true, slug: true }
  });

  const membershipOk =
    tenant && (await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      select: { role: true }
    }));

  const memberRoleOk =
    membershipOk && String(membershipOk.role ?? '').trim().toUpperCase() === SUPER_ADMIN_ROLE;

  const passwordMatch =
    password && hasHash ? await bcrypt.compare(password, String(user.passwordHash)) : null;

  console.log('[admin:check] OK');
  console.log(`- email_norm: ${email}`);
  console.log(`- user_exists: yes`);
  console.log(`- role_is_super_admin: ${roleOk ? 'yes' : 'no'} (${String(user.role || '')})`);
  console.log(`- user_active: ${activeOk ? 'yes' : 'no'}`);
  console.log(`- passwordHash_present: ${hasHash ? 'yes' : 'no'}`);
  console.log(
    `- platform_tenant_exists: ${tenant ? 'yes' : 'no'} (${tenant ? tenant.slug : 'missing'})`
  );
  console.log(`- membership_present: ${membershipOk ? 'yes' : 'no'}`);
  console.log(`- membership_role_is_super_admin: ${memberRoleOk ? 'yes' : 'no'}`);
  console.log(
    `- password_matches_now: ${passwordMatch == null ? 'skipped (no SUPER_ADMIN_PASSWORD)' : passwordMatch ? 'yes' : 'no'}`
  );
}

main()
  .catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });

