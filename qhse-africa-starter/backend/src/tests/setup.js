import { vi } from 'vitest';

vi.mock('../db.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    site: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    incident: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    risk: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    action: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    audit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    refreshToken: {
      deleteMany: vi.fn()
    }
  }
}));

process.env.JWT_SECRET = 'test-secret-key-32-chars-minimum!!';
process.env.JWT_EXPIRES = '1h';
process.env.NODE_ENV = 'test';
process.env.REQUIRE_AUTH = 'false';
