CREATE TABLE "process_reviews" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "processId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByUserId" TEXT,
    "conclusion" TEXT NOT NULL,
    "status" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "process_reviews_tenantId_idx" ON "process_reviews"("tenantId");

CREATE INDEX "process_reviews_processId_idx" ON "process_reviews"("processId");

ALTER TABLE "process_reviews" ADD CONSTRAINT "process_reviews_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "process_reviews" ADD CONSTRAINT "process_reviews_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
