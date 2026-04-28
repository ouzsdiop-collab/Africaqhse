-- Add optional link ControlledDocument -> Product (nullable)
ALTER TABLE "controlled_documents" ADD COLUMN IF NOT EXISTS "productId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'controlled_documents_productId_fkey'
  ) THEN
    ALTER TABLE "controlled_documents"
      ADD CONSTRAINT "controlled_documents_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "products"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "controlled_documents_productId_idx" ON "controlled_documents"("productId");
CREATE INDEX IF NOT EXISTS "controlled_documents_tenantId_productId_idx" ON "controlled_documents"("tenantId", "productId");

