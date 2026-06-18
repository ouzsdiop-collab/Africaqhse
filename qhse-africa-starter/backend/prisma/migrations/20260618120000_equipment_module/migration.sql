CREATE TABLE IF NOT EXISTS "equipment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "siteId" TEXT,
  "assignedUserId" TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "serialNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'in_service',
  "lastControlDate" TIMESTAMP(3),
  "nextControlDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "equipment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "equipment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "equipment_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "equipment_tenantId_idx" ON "equipment"("tenantId");
CREATE INDEX IF NOT EXISTS "equipment_siteId_idx" ON "equipment"("siteId");
CREATE INDEX IF NOT EXISTS "equipment_assignedUserId_idx" ON "equipment"("assignedUserId");
CREATE INDEX IF NOT EXISTS "equipment_status_idx" ON "equipment"("status");
