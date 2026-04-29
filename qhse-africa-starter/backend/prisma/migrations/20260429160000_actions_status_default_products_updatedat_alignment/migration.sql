-- Correctif drift Prisma sans reset (Railway compatible)

-- 1) Default actions.status : aligné sur schema.prisma (UTF-8) "À lancer"
ALTER TABLE "actions"
ALTER COLUMN "status"
SET DEFAULT 'À lancer';

-- 2) products.updatedAt (@updatedAt) : pas de DEFAULT côté DB
ALTER TABLE "products"
ALTER COLUMN "updatedAt"
DROP DEFAULT;

