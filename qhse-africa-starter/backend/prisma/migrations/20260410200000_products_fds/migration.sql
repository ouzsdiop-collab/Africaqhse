-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplier" TEXT,
    "casNumber" TEXT,
    "ceNumber" TEXT,
    "hStatements" JSONB NOT NULL DEFAULT '[]',
    "pStatements" JSONB NOT NULL DEFAULT '[]',
    "ghsPictograms" JSONB NOT NULL DEFAULT '[]',
    "vlep" TEXT,
    "storageClass" TEXT,
    "fdsFileUrl" TEXT,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_siteId_idx" ON "products"("siteId");

-- CreateIndex
CREATE INDEX "products_casNumber_idx" ON "products"("casNumber");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
