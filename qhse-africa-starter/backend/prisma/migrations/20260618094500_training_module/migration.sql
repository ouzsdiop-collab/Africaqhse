CREATE TABLE IF NOT EXISTS "training_courses" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT,
  "durationHours" DOUBLE PRECISION,
  "mandatory" BOOLEAN NOT NULL DEFAULT false,
  "recurrenceMonths" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "training_courses_tenantId_idx" ON "training_courses"("tenantId");

CREATE TABLE IF NOT EXISTS "training_sessions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "courseId" TEXT NOT NULL,
  "siteId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "trainer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "training_sessions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "training_sessions_tenantId_idx" ON "training_sessions"("tenantId");
CREATE INDEX IF NOT EXISTS "training_sessions_courseId_idx" ON "training_sessions"("courseId");
CREATE INDEX IF NOT EXISTS "training_sessions_siteId_idx" ON "training_sessions"("siteId");

CREATE TABLE IF NOT EXISTS "training_enrollments" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "attended" BOOLEAN NOT NULL DEFAULT false,
  "score" DOUBLE PRECISION,
  "certificateUrl" TEXT,
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_enrollments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "training_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "training_enrollments_sessionId_userId_key" ON "training_enrollments"("sessionId", "userId");
CREATE INDEX IF NOT EXISTS "training_enrollments_tenantId_idx" ON "training_enrollments"("tenantId");
CREATE INDEX IF NOT EXISTS "training_enrollments_userId_idx" ON "training_enrollments"("userId");
CREATE INDEX IF NOT EXISTS "training_enrollments_expiresAt_idx" ON "training_enrollments"("expiresAt");
