-- CreateTable
CREATE TABLE "iso_evidences" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "requirementId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT NOT NULL,
    "validatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),

    CONSTRAINT "iso_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "iso_evidences_tenantId_idx" ON "iso_evidences"("tenantId");

-- CreateIndex
CREATE INDEX "iso_evidences_tenantId_requirementId_idx" ON "iso_evidences"("tenantId", "requirementId");

-- AddForeignKey
ALTER TABLE "iso_evidences" ADD CONSTRAINT "iso_evidences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_evidences" ADD CONSTRAINT "iso_evidences_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_evidences" ADD CONSTRAINT "iso_evidences_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
