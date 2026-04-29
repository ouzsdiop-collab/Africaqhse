-- AlterTable
ALTER TABLE "incidents"
ALTER COLUMN "photosJson"
TYPE JSONB
USING (
  CASE
    WHEN "photosJson" IS NULL OR "photosJson" = '' THEN NULL
    ELSE "photosJson"::jsonb
  END
);
