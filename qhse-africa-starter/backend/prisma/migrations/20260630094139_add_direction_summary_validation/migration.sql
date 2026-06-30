-- CreateTable
CREATE TABLE "direction_summary_validations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metricsSnapshot" JSONB NOT NULL,
    "aiSummaryText" TEXT NOT NULL,
    "aiSummarySource" TEXT NOT NULL,
    "validatedById" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direction_summary_validations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direction_summary_validations_tenantId_siteId_period_period_idx" ON "direction_summary_validations"("tenantId", "siteId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "direction_summary_validations_validatedById_idx" ON "direction_summary_validations"("validatedById");

-- AddForeignKey
ALTER TABLE "direction_summary_validations" ADD CONSTRAINT "direction_summary_validations_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
