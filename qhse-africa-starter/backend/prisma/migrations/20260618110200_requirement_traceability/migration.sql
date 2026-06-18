-- Traçabilité gap ISO -> action / non-conformité : ajout d'un identifiant libre d'exigence.
ALTER TABLE "actions" ADD COLUMN IF NOT EXISTS "requirementId" TEXT;
ALTER TABLE "non_conformities" ADD COLUMN IF NOT EXISTS "requirementId" TEXT;

CREATE INDEX IF NOT EXISTS "actions_tenantId_requirementId_idx" ON "actions"("tenantId", "requirementId");
CREATE INDEX IF NOT EXISTS "non_conformities_tenantId_requirementId_idx" ON "non_conformities"("tenantId", "requirementId");
