-- Add optional link Action -> Risk (nullable)
ALTER TABLE "actions" ADD COLUMN IF NOT EXISTS "riskId" TEXT;

-- Foreign key (tenant scoping is enforced at API level)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'actions_riskId_fkey'
  ) THEN
    ALTER TABLE "actions"
      ADD CONSTRAINT "actions_riskId_fkey"
      FOREIGN KEY ("riskId") REFERENCES "risks"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS "actions_riskId_idx" ON "actions"("riskId");
CREATE INDEX IF NOT EXISTS "actions_tenantId_riskId_idx" ON "actions"("tenantId", "riskId");

