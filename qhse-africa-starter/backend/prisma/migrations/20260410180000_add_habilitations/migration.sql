-- CreateTable
CREATE TABLE "habilitations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "siteId" TEXT,
    "type" TEXT NOT NULL,
    "level" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habilitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habilitations_tenantId_idx" ON "habilitations"("tenantId");

-- CreateIndex
CREATE INDEX "habilitations_userId_idx" ON "habilitations"("userId");

-- CreateIndex
CREATE INDEX "habilitations_siteId_idx" ON "habilitations"("siteId");

-- CreateIndex
CREATE INDEX "habilitations_status_idx" ON "habilitations"("status");

-- AddForeignKey
ALTER TABLE "habilitations" ADD CONSTRAINT "habilitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitations" ADD CONSTRAINT "habilitations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
