-- CreateTable
CREATE TABLE "permits_to_work" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "ref" TEXT NOT NULL,
    "siteId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedTo" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "signaturesJson" JSONB NOT NULL DEFAULT '[]',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permits_to_work_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permits_to_work_tenantId_ref_key" ON "permits_to_work"("tenantId", "ref");
CREATE INDEX "permits_to_work_siteId_idx" ON "permits_to_work"("siteId");
CREATE INDEX "permits_to_work_status_idx" ON "permits_to_work"("status");
