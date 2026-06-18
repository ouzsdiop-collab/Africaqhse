CREATE TABLE IF NOT EXISTS "prevention_plans" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "ref" TEXT NOT NULL,
  "siteId" TEXT,
  "externalCompanyName" TEXT NOT NULL,
  "externalContact" TEXT,
  "workDescription" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'draft',
  "inspectionDate" TIMESTAMP(3),
  "risksJson" JSONB NOT NULL DEFAULT '[]',
  "clientSignature" JSONB,
  "contractorSignature" JSONB,
  "permitId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prevention_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prevention_plans_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "prevention_plans_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "permits_to_work"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "prevention_plans_tenantId_ref_key" ON "prevention_plans"("tenantId", "ref");
CREATE INDEX IF NOT EXISTS "prevention_plans_siteId_idx" ON "prevention_plans"("siteId");
CREATE INDEX IF NOT EXISTS "prevention_plans_status_idx" ON "prevention_plans"("status");
