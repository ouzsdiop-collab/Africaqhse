ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Migration progressive depuis l'état legacy.
UPDATE "users"
SET "status" = CASE
  WHEN COALESCE("isActive", true) = false THEN 'SUSPENDED'
  WHEN COALESCE("mustChangePassword", false) = true THEN 'INVITED'
  ELSE 'ACTIVE'
END
WHERE "status" IS NULL OR "status" = '' OR "status" = 'ACTIVE';
