CREATE TABLE "process_score_snapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "processId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_score_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "process_score_snapshots_tenantId_idx" ON "process_score_snapshots"("tenantId");

CREATE INDEX "process_score_snapshots_processId_idx" ON "process_score_snapshots"("processId");

ALTER TABLE "process_score_snapshots" ADD CONSTRAINT "process_score_snapshots_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
