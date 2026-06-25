-- Veille réglementaire : statut d'impact métier par texte (applicable / non applicable / en analyse).
ALTER TABLE "regulatory_watch_entries" ADD COLUMN IF NOT EXISTS "impactStatus" TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS "regulatory_watch_entries_tenantId_impactStatus_idx" ON "regulatory_watch_entries"("tenantId", "impactStatus");
