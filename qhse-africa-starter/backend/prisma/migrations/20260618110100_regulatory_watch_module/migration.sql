-- Veille réglementaire : registre de textes légaux/normatifs suivis par tenant.
CREATE TABLE IF NOT EXISTS "regulatory_watch_entries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT,
    "officialUrl" TEXT,
    "sourceText" TEXT,
    "summary" TEXT,
    "keyObligationsJson" JSONB NOT NULL DEFAULT '[]',
    "effectiveDate" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_watch_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "regulatory_watch_entries_tenantId_country_idx" ON "regulatory_watch_entries"("tenantId", "country");
