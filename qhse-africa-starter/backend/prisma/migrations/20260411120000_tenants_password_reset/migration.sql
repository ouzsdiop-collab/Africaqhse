-- Multi-organisations + jetons de réinitialisation mot de passe.
-- Identifiant stable du tenant par défaut (seed + runtime) : qhse_default_tenant

CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

CREATE TABLE "tenant_members" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_members_tenantId_userId_key" ON "tenant_members"("tenantId", "userId");
CREATE INDEX "tenant_members_userId_idx" ON "tenant_members"("userId");

ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "tenants" ("id", "slug", "name", "createdAt")
VALUES ('qhse_default_tenant', 'default', 'Organisation', CURRENT_TIMESTAMP);

INSERT INTO "tenant_members" ("id", "tenantId", "userId", "role", "createdAt")
SELECT
  'tm_' || u."id",
  'qhse_default_tenant',
  u."id",
  COALESCE(NULLIF(trim(upper(u."role")), ''), 'MEMBER'),
  CURRENT_TIMESTAMP
FROM "users" u;

ALTER TABLE "sites" ADD CONSTRAINT "sites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "sites" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "risks" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "incidents" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "habilitations" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "actions" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "audits" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "non_conformities" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "import_history" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "audit_logs" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "ai_suggestions" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "controlled_documents" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "conformity_statuses" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
UPDATE "permits_to_work" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;

ALTER TABLE "products" ADD COLUMN "tenantId" TEXT;
UPDATE "products" p SET "tenantId" = s."tenantId" FROM "sites" s WHERE p."siteId" IS NOT NULL AND s."id" = p."siteId";
UPDATE "products" SET "tenantId" = 'qhse_default_tenant' WHERE "tenantId" IS NULL;
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");
