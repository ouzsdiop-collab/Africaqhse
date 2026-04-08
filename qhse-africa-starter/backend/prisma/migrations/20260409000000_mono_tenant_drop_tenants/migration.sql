-- V1 mono-tenant : suppression des tables tenants / user_tenants et des FK associées.
-- La colonne sites.tenantId reste (nullable) sans FK pour compatibilité des données existantes.

ALTER TABLE "user_tenants" DROP CONSTRAINT IF EXISTS "user_tenants_defaultSiteId_fkey";
ALTER TABLE "user_tenants" DROP CONSTRAINT IF EXISTS "user_tenants_tenantId_fkey";
ALTER TABLE "user_tenants" DROP CONSTRAINT IF EXISTS "user_tenants_userId_fkey";
DROP TABLE IF EXISTS "user_tenants";

ALTER TABLE "sites" DROP CONSTRAINT IF EXISTS "sites_tenantId_fkey";
DROP TABLE IF EXISTS "tenants";
