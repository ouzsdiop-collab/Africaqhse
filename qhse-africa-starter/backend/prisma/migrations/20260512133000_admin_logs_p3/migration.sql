CREATE TABLE IF NOT EXISTS "admin_logs" (
  "id" TEXT PRIMARY KEY,
  "actorUserId" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "tenantId" TEXT,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admin_logs_actorUserId_createdAt_idx" ON "admin_logs"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_logs_tenantId_createdAt_idx" ON "admin_logs"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_logs_action_createdAt_idx" ON "admin_logs"("action", "createdAt");
