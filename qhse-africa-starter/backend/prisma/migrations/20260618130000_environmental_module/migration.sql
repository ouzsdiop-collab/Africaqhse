CREATE TABLE IF NOT EXISTS "environmental_records" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "siteId" TEXT,
  "type" TEXT NOT NULL,
  "category" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "periodDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "environmental_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "environmental_records_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "environmental_records_tenantId_idx" ON "environmental_records"("tenantId");
CREATE INDEX IF NOT EXISTS "environmental_records_siteId_idx" ON "environmental_records"("siteId");
CREATE INDEX IF NOT EXISTS "environmental_records_type_idx" ON "environmental_records"("type");
CREATE INDEX IF NOT EXISTS "environmental_records_periodDate_idx" ON "environmental_records"("periodDate");
