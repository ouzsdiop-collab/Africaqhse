import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    verifyDocumentAccessToken: vi.fn(),
    prismaUserFindUnique: vi.fn(),
    prismaControlledDocumentFindUnique: vi.fn(),
    readControlledFileBuffer: vi.fn(),
    writeAuditLog: vi.fn(async () => {})
  }
}));

vi.mock('../db.js', () => ({
  prisma: {
    user: {
      findUnique: (...args) => mocks.prismaUserFindUnique(...args)
    },
    controlledDocument: {
      findUnique: (...args) => mocks.prismaControlledDocumentFindUnique(...args)
    }
  }
}));

vi.mock('../services/documentToken.service.js', () => ({
  ANONYMOUS_DOCUMENT_ACCESS_USER_ID: '__qhse_anonymous_doc__',
  verifyDocumentAccessToken: (...args) => mocks.verifyDocumentAccessToken(...args),
  signDocumentAccessToken: vi.fn()
}));

vi.mock('../services/auditLog.service.js', () => ({
  auditUserIdFromRequest: vi.fn(() => null),
  writeAuditLog: (...args) => mocks.writeAuditLog(...args)
}));

vi.mock('../services/documentStorage.service.js', () => ({
  isS3StorageEnabled: vi.fn(() => false),
  getPresignedControlledDocumentDownloadUrl: vi.fn(async () => 'https://example.invalid/s3'),
  readControlledFileBuffer: (...args) => mocks.readControlledFileBuffer(...args),
  saveControlledFile: vi.fn(async () => ({ relativePath: 'p', sizeBytes: 1 })),
  deleteControlledFile: vi.fn(async () => {})
}));

vi.mock('../lib/securityConfig.js', () => ({
  isRequireAuthEnabled: vi.fn(() => true)
}));

describe('controlledDocuments stream token', () => {
  /** @type {import('express').Express} */
  let app;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const controller = await import('./controlledDocuments.controller.js');
    app = express();
    app.get('/api/controlled-documents/stream', controller.streamByToken);
    // Capture thrown errors (avoid default HTML 500).
    app.use((err, _req, res, _next) => {
      res.status(500).json({ error: String(err?.message || err || 'error') });
    });
  });

  it('token expiré/invalide → 401', async () => {
    mocks.verifyDocumentAccessToken.mockReturnValueOnce(null);
    const res = await request(app).get('/api/controlled-documents/stream?token=bad');
    expect(res.status).toBe(401);
    expect(res.body?.error).toMatch(/Jeton/i);
    expect(mocks.prismaControlledDocumentFindUnique).not.toHaveBeenCalled();
  });

  it('token tenant A sur doc tenant B → 401', async () => {
    mocks.verifyDocumentAccessToken.mockReturnValueOnce({
      documentId: 'docB',
      userId: 'user1',
      purpose: 'download',
      tenantId: 'tA'
    });
    mocks.prismaControlledDocumentFindUnique.mockResolvedValueOnce({
      id: 'docB',
      tenantId: 'tB',
      classification: 'normal',
      mimeType: 'application/pdf',
      name: 'Doc.pdf',
      path: 'p',
      siteId: null
    });
    mocks.prismaUserFindUnique.mockResolvedValueOnce({ id: 'user1', role: 'ADMIN' });

    const res = await request(app).get('/api/controlled-documents/stream?token=t');
    expect(res.status).toBe(401);
  });

  it('token userId invalide → 401', async () => {
    mocks.verifyDocumentAccessToken.mockReturnValueOnce({
      documentId: 'doc1',
      userId: 'missing-user',
      purpose: 'download',
      tenantId: 'tA'
    });
    mocks.prismaControlledDocumentFindUnique.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      classification: 'normal',
      mimeType: 'application/pdf',
      name: 'Doc.pdf',
      path: 'p',
      siteId: null
    });
    mocks.prismaUserFindUnique.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/controlled-documents/stream?token=t');
    expect(res.status).toBe(401);
    expect(res.body?.error).toMatch(/Utilisateur/i);
  });

  it('document confidentiel/critique + rôle non autorisé → 403', async () => {
    mocks.verifyDocumentAccessToken.mockReturnValueOnce({
      documentId: 'doc1',
      userId: 'user1',
      purpose: 'download',
      tenantId: 'tA'
    });
    mocks.prismaControlledDocumentFindUnique.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      classification: 'confidentiel',
      mimeType: 'application/pdf',
      name: 'Secret.pdf',
      path: 'p',
      siteId: null
    });
    mocks.prismaUserFindUnique.mockResolvedValueOnce({ id: 'user1', role: 'OPERATEUR' });
    mocks.readControlledFileBuffer.mockImplementation(() => {
      throw new Error('should_not_read_buffer');
    });

    const res = await request(app).get('/api/controlled-documents/stream?token=t');
    expect(res.status, JSON.stringify(res.body)).toBe(403);
    expect(mocks.readControlledFileBuffer).not.toHaveBeenCalled();
  });

  it('succès → renvoie le fichier sans fuite path', async () => {
    mocks.verifyDocumentAccessToken.mockReturnValueOnce({
      documentId: 'doc1',
      userId: 'user1',
      purpose: 'download',
      tenantId: 'tA'
    });
    mocks.prismaControlledDocumentFindUnique.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      classification: 'normal',
      mimeType: 'application/pdf',
      name: 'Doc.pdf',
      path: 'p',
      siteId: null
    });
    mocks.prismaUserFindUnique.mockResolvedValueOnce({ id: 'user1', role: 'ADMIN' });
    mocks.readControlledFileBuffer.mockResolvedValueOnce(Buffer.from('PDF'));

    const res = await request(app).get('/api/controlled-documents/stream?token=t');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.headers['content-disposition'] || '').toMatch(/attachment/i);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.toString('utf8')).toBe('PDF');
  });
});

