import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    controlledDocument: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn()
    },
    product: {
      findFirst: vi.fn()
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
    prismaMock.product.findFirst.mockResolvedValue(null);
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

  it('createControlledDocument: type "FDS" est stocké en "fds"', async () => {
    prismaMock.product.findFirst.mockResolvedValueOnce(null);
    prismaMock.controlledDocument.create.mockResolvedValueOnce({
      id: 'doc_fds',
      tenantId: 'tA',
      name: 'Doc',
      type: 'fds',
      path: 'p',
      classification: 'normal'
    });
    await svc.createControlledDocument(Buffer.from('x'), {
      tenantId: 'tA',
      name: 'Doc',
      type: 'FDS',
      mimeType: 'application/pdf'
    });
    expect(prismaMock.controlledDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'fds' })
      })
    );
  });

  it('createControlledDocument: "fiche de données de sécurité" est stocké en "fds"', async () => {
    prismaMock.product.findFirst.mockResolvedValueOnce(null);
    prismaMock.controlledDocument.create.mockResolvedValueOnce({
      id: 'doc_fds2',
      tenantId: 'tA',
      name: 'Doc',
      type: 'fds',
      path: 'p',
      classification: 'normal'
    });
    await svc.createControlledDocument(Buffer.from('x'), {
      tenantId: 'tA',
      name: 'Doc',
      type: 'fiche de données de sécurité',
      mimeType: 'application/pdf'
    });
    expect(prismaMock.controlledDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'fds' })
      })
    );
  });

  it('createControlledDocument accepte productId si produit existe dans le tenant', async () => {
    prismaMock.product = {
      findFirst: vi.fn(async () => ({ id: 'p1' }))
    };
    prismaMock.controlledDocument.create.mockResolvedValueOnce({
      id: 'doc_p1',
      tenantId: 'tA',
      name: 'Doc',
      type: 'fds',
      path: 'p',
      classification: 'normal',
      productId: 'p1'
    });
    await svc.createControlledDocument(Buffer.from('x'), {
      tenantId: 'tA',
      name: 'Doc',
      type: 'FDS',
      mimeType: 'application/pdf',
      productId: 'p1'
    });
    expect(prismaMock.controlledDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ productId: 'p1' })
      })
    );
  });

  it('createControlledDocument refuse productId introuvable (404)', async () => {
    prismaMock.product.findFirst.mockResolvedValueOnce(null);
    await expect(
      svc.createControlledDocument(Buffer.from('x'), {
        tenantId: 'tA',
        name: 'Doc',
        type: 'FDS',
        mimeType: 'application/pdf',
        productId: 'p_missing'
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.controlledDocument.create).not.toHaveBeenCalled();
  });

  it('updateControlledDocumentMeta: patch type FDS normalise en "fds"', async () => {
    prismaMock.controlledDocument.findFirst.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      name: 'x',
      classification: 'normal',
      path: 'p'
    });
    prismaMock.product.findFirst.mockResolvedValueOnce(null);
    prismaMock.controlledDocument.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.controlledDocument.findFirst.mockResolvedValueOnce({
      id: 'doc1',
      tenantId: 'tA',
      name: 'x',
      classification: 'normal',
      path: 'p',
      type: 'fds'
    });
    await svc.updateControlledDocumentMeta('tA', 'doc1', { type: 'FDS' });
    expect(prismaMock.controlledDocument.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'fds' })
      })
    );
  });

  it('type non FDS est conservé (trim)', async () => {
    expect(svc.normalizeControlledDocumentType('procédure')).toBe('procédure');
    expect(svc.normalizeControlledDocumentType('  plan  ')).toBe('plan');
  });
});

