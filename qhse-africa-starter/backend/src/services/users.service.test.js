import { describe, it, expect, beforeEach, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    action: {
      count: vi.fn(),
      updateMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock('../db.js', () => ({
  prisma: prismaMock
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('__pwd_hash__')
  }
}));

import bcrypt from 'bcryptjs';
import * as usersService from './users.service.js';

const TENANT = 't_org_1';

describe('users.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
  });

  it('findAllUsers liste tous les utilisateurs', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 'u1',
        name: 'A',
        email: 'a@x.test',
        role: 'ADMIN',
        createdAt: new Date('2020-01-01')
      }
    ]);
    const out = await usersService.findAllUsers(TENANT);
    expect(out).toEqual([
      {
        id: 'u1',
        name: 'A',
        email: 'a@x.test',
        role: 'ADMIN',
        createdAt: new Date('2020-01-01')
      }
    ]);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 500
      })
    );
  });

  it('findUserById retourne null sans id', async () => {
    expect(await usersService.findUserById(TENANT, '')).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('removeUserFromTenant rejette si des actions sont assignées', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' });
    prismaMock.action.count.mockResolvedValueOnce(2);
    await expect(usersService.removeUserFromTenant(TENANT, 'u1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'USER_HAS_ACTIONS',
      assignedActionCount: 2
    });
    expect(prismaMock.action.count).toHaveBeenCalledWith({
      where: { assigneeId: 'u1', tenantId: TENANT }
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('removeUserFromTenant supprime l’utilisateur', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' });
    prismaMock.action.count.mockResolvedValueOnce(0);
    prismaMock.user.delete.mockResolvedValueOnce({});
    await usersService.removeUserFromTenant(TENANT, 'u1');
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('removeUserFromTenant avec unassignActions désassigne puis supprime', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' });
    prismaMock.action.count.mockResolvedValueOnce(3);
    prismaMock.action.updateMany.mockResolvedValueOnce({ count: 3 });
    prismaMock.user.delete.mockResolvedValueOnce({});
    await usersService.removeUserFromTenant(TENANT, 'u1', { unassignActions: true });
    expect(prismaMock.action.updateMany).toHaveBeenCalledWith({
      where: { assigneeId: 'u1', tenantId: TENANT },
      data: { assigneeId: null }
    });
    expect(prismaMock.user.delete).toHaveBeenCalled();
  });

  it('createUser hash le mot de passe et le persiste', async () => {
    prismaMock.user.create.mockResolvedValueOnce({
      id: 'u-new',
      name: 'N',
      email: 'n@test',
      role: 'QHSE',
      createdAt: new Date()
    });
    const out = await usersService.createUser(TENANT, {
      name: 'N',
      email: 'n@test',
      role: 'QHSE',
      password: 'secret123'
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'n@test',
          passwordHash: '__pwd_hash__'
        })
      })
    );
    expect(out.id).toBe('u-new');
  });

  it('createUser rejette un mot de passe trop court', async () => {
    await expect(
      usersService.createUser(TENANT, {
        name: 'N',
        email: 'n@test',
        role: 'QHSE',
        password: 'abc123'
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('updateUserInTenant enregistre un mot de passe sans toucher au rôle', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'u1' })
      .mockResolvedValueOnce({
        id: 'u1',
        name: 'N',
        email: 'n@test',
        role: 'QHSE',
        createdAt: new Date()
      });
    prismaMock.user.update.mockResolvedValueOnce({});
    const out = await usersService.updateUserInTenant(TENANT, 'u1', {
      password: 'new-secret1'
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('new-secret1', 10);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { passwordHash: '__pwd_hash__' }
    });
    expect(out.role).toBe('QHSE');
  });

  it('updateUserInTenant rejette un mot de passe trop court', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' });
    await expect(
      usersService.updateUserInTenant(TENANT, 'u1', { password: 'short' })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('updateUserInTenant rejette un mot de passe sans chiffre', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' });
    await expect(
      usersService.updateUserInTenant(TENANT, 'u1', { password: 'abcdefgh' })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('updateUserInTenant met à jour nom et rôle sur User', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'u1' })
      .mockResolvedValueOnce({
        id: 'u1',
        name: 'N',
        email: 'n@test',
        role: 'DIRECTION',
        createdAt: new Date()
      });
    prismaMock.user.update.mockResolvedValueOnce({});

    const out = await usersService.updateUserInTenant(TENANT, 'u1', {
      name: 'N',
      role: 'DIRECTION'
    });
    expect(out.role).toBe('DIRECTION');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: 'N', role: 'DIRECTION' }
    });
  });
});
