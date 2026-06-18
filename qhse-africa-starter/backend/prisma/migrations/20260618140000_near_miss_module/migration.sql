CREATE TABLE IF NOT EXISTS "near_misses" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "siteId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "immediateActions" TEXT,
  "lessonsLearned" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "near_misses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "near_misses_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "near_misses_tenantId_idx" ON "near_misses"("tenantId");
CREATE INDEX IF NOT EXISTS "near_misses_siteId_idx" ON "near_misses"("siteId");
CREATE INDEX IF NOT EXISTS "near_misses_status_idx" ON "near_misses"("status");
CREATE INDEX IF NOT EXISTS "near_misses_occurredAt_idx" ON "near_misses"("occurredAt");
