CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "siteId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'realisation',
    "purpose" TEXT,
    "ownerUserId" TEXT,
    "deputyUserId" TEXT,
    "inputs" JSONB NOT NULL DEFAULT '[]',
    "outputs" JSONB NOT NULL DEFAULT '[]',
    "interestedParties" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'a_surveiller',
    "reviewFrequency" TEXT,
    "lastReviewAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "process_links" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "processId" TEXT NOT NULL,
    "linkedType" TEXT NOT NULL,
    "linkedId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "processes_tenantId_idx" ON "processes"("tenantId");
CREATE INDEX "processes_siteId_idx" ON "processes"("siteId");

CREATE UNIQUE INDEX "process_links_processId_linkedType_linkedId_key" ON "process_links"("processId", "linkedType", "linkedId");
CREATE INDEX "process_links_tenantId_idx" ON "process_links"("tenantId");
CREATE INDEX "process_links_processId_idx" ON "process_links"("processId");
CREATE INDEX "process_links_linkedType_idx" ON "process_links"("linkedType");

ALTER TABLE "processes" ADD CONSTRAINT "processes_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "processes" ADD CONSTRAINT "processes_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "processes" ADD CONSTRAINT "processes_deputyUserId_fkey" FOREIGN KEY ("deputyUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "process_links" ADD CONSTRAINT "process_links_processId_fkey" FOREIGN KEY ("processId") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
