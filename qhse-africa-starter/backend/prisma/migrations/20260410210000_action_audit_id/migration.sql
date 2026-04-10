-- AlterTable
ALTER TABLE "actions" ADD COLUMN "auditId" TEXT;

-- CreateIndex
CREATE INDEX "actions_auditId_idx" ON "actions"("auditId");

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
