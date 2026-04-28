import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    controlledDocument: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

vi.mock('./documentStorage.service.js', () => ({
  deleteControlledFile: vi.fn(async () => {}),
  readControlledFileBuffer: vi.fn(async () => Buffer.from('x')),
  saveControlledFile: vi.fn(async () => ({ relativePath: 'p', sizeBytes: 1 })),
  watermarkedFileName: vi.fn((n) => n),
  addWatermarkToPdf: vi.fn(async (b) => b)
}));

import * as svc from './controlledDocument.service.js';

describe('controlledDocument.service tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deleteControlledDocumentRecord utilise deleteMany avec filtre tenantId', async () => {
    prismaMock.controlledDocument.findFirst.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      path: 'p',
      classification: 'public'
    });
    prismaMock.controlledDocument.deleteMany.mockResolvedValueOnce({ count: 1 });

    const out = await svc.deleteControlledDocumentRecord('tA', 'doc1');
    expect(out).toBe(true);
    expect(prismaMock.controlledDocument.deleteMany).toHaveBeenCalledWith({
      where: { id: 'doc1', tenantId: 'tA' }
    });
  });

  it('tenant A ne peut pas supprimer un document tenant B (pas de deleteMany)', async () => {
    prismaMock.controlledDocument.findFirst.mockResolvedValueOnce(null);
    const out = await svc.deleteControlledDocumentRecord('tA', 'docB');
    expect(out).toBe(false);
    expect(prismaMock.controlledDocument.deleteMany).not.toHaveBeenCalled();
  });

  it('updateControlledDocumentMeta utilise updateMany avec filtre tenantId', async () => {
    prismaMock.controlledDocument.findFirst.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      name: 'x',
      classification: 'public',
      path: 'p'
    });
    prismaMock.controlledDocument.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.controlledDocument.findFirst.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      name: 'new',
      classification: 'public',
      path: 'p'
    });

    const out = await svc.updateControlledDocumentMeta('tA', 'doc1', { name: 'new' });
    expect(out?.name).toBe('new');
    expect(prismaMock.controlledDocument.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc1', tenantId: 'tA' }
      })
    );
  });

  it('updateControlledDocumentMeta renvoie 404 si updateMany count=0', async () => {
    prismaMock.controlledDocument.findFirst.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      name: 'x',
      classification: 'public',
      path: 'p'
    });
    prismaMock.controlledDocument.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      svc.updateControlledDocumentMeta('tA', 'doc1', { name: 'new' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('createControlledDocument refuse tenantId manquant (403)', async () => {
    await expect(
      svc.createControlledDocument(Buffer.from('x'), {
        tenantId: null,
        name: 'Doc',
        type: 'pdf',
        mimeType: 'application/pdf'
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('normalizeControlledDocumentType normalise les variantes FDS', async () => {
    expect(svc.normalizeControlledDocumentType('FDS')).toBe('fds');
    expect(svc.normalizeControlledDocumentType('Fiche de données de sécurité')).toBe('fds');
    expect(svc.normalizeControlledDocumentType('fiche de donnees de securite')).toBe('fds');
  });
});

