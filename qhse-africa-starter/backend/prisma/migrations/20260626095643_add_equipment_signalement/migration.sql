-- CreateTable
CREATE TABLE "equipment_signalements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "equipmentId" TEXT NOT NULL,
    "siteId" TEXT,
    "reportedByUserId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "description" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "qhseComment" TEXT,
    "validatedByUserId" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_signalements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_signalements_tenantId_idx" ON "equipment_signalements"("tenantId");

-- CreateIndex
CREATE INDEX "equipment_signalements_equipmentId_idx" ON "equipment_signalements"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_signalements_siteId_idx" ON "equipment_signalements"("siteId");

-- CreateIndex
CREATE INDEX "equipment_signalements_status_idx" ON "equipment_signalements"("status");

-- AddForeignKey
ALTER TABLE "equipment_signalements" ADD CONSTRAINT "equipment_signalements_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_signalements" ADD CONSTRAINT "equipment_signalements_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_signalements" ADD CONSTRAINT "equipment_signalements_validatedByUserId_fkey" FOREIGN KEY ("validatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
