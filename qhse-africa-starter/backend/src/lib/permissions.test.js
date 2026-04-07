import { describe, it, expect } from 'vitest';
import { can } from './permissions.js';

describe('permissions can()', () => {
  it('ADMIN peut tout', () => {
    expect(can('ADMIN', 'anything', 'write')).toBe(true);
  });

  it('QHSE peut lire/ecrire incidents, risks, actions, audits', () => {
    expect(can('QHSE', 'incidents', 'read')).toBe(true);
    expect(can('QHSE', 'incidents', 'write')).toBe(true);
    expect(can('QHSE', 'risks', 'write')).toBe(true);
    expect(can('QHSE', 'actions', 'write')).toBe(true);
    expect(can('QHSE', 'audits', 'read')).toBe(true);
  });

  it('DIRECTION lecture seule incidents/audits', () => {
    expect(can('DIRECTION', 'incidents', 'read')).toBe(true);
    expect(can('DIRECTION', 'incidents', 'write')).toBe(false);
    expect(can('DIRECTION', 'audits', 'read')).toBe(true);
    expect(can('DIRECTION', 'audits', 'write')).toBe(false);
  });

  it('ASSISTANT peut ecrire incidents mais pas actions', () => {
    expect(can('ASSISTANT', 'incidents', 'write')).toBe(true);
    expect(can('ASSISTANT', 'actions', 'write')).toBe(false);
  });

  it('TERRAIN peut ecrire incidents/risks et lire actions', () => {
    expect(can('TERRAIN', 'incidents', 'write')).toBe(true);
    expect(can('TERRAIN', 'risks', 'write')).toBe(true);
    expect(can('TERRAIN', 'actions', 'read')).toBe(true);
  });

  it('role inconnu -> false', () => {
    expect(can('UNKNOWN', 'incidents', 'read')).toBe(false);
  });

  it('role null -> true (retrocompatibilite)', () => {
    expect(can(null, 'incidents', 'read')).toBe(true);
  });
});
