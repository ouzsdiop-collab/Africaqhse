-- CreateTable
CREATE TABLE "conformity_statuses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "requirementId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "siteId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "conformity_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conformity_statuses_tenantId_requirementId_siteId_key" ON "conformity_statuses"("tenantId", "requirementId", "siteId");

-- CreateIndex
CREATE INDEX "conformity_statuses_tenantId_idx" ON "conformity_statuses"("tenantId");

-- CreateIndex
CREATE INDEX "conformity_statuses_requirementId_idx" ON "conformity_statuses"("requirementId");

-- CreateIndex
CREATE INDEX "conformity_statuses_siteId_idx" ON "conformity_statuses"("siteId");
