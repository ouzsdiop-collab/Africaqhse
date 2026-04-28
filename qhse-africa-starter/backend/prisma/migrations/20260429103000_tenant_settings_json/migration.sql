-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';
