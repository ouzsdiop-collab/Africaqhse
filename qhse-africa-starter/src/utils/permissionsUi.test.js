import { describe, it, expect } from 'vitest';
import { canAccessNavPage, canResource } from './permissionsUi.js';

describe('canAccessNavPage', () => {
  it('autorise toutes les pages si pas de rôle', () => {
    expect(canAccessNavPage(null, 'analytics')).toBe(true);
    expect(canAccessNavPage('', 'iso')).toBe(true);
  });

  it('restreint TERRAIN aux pages définies', () => {
    expect(canAccessNavPage('TERRAIN', 'dashboard')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'incidents')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'actions')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'settings')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'analytics')).toBe(false);
    expect(canAccessNavPage('TERRAIN', 'audits')).toBe(false);
  });

  it('n’applique pas la restriction TERRAIN aux autres rôles', () => {
    expect(canAccessNavPage('QHSE', 'analytics')).toBe(true);
    expect(canAccessNavPage('ADMIN', 'sites')).toBe(true);
  });
});

describe('canResource', () => {
  it('ADMIN a tout', () => {
    expect(canResource('ADMIN', 'anything', 'write')).toBe(true);
  });

  it('QHSE peut écrire sur incidents', () => {
    expect(canResource('QHSE', 'incidents', 'write')).toBe(true);
    expect(canResource('QHSE', 'incidents', 'read')).toBe(true);
  });

  it('DIRECTION est en lecture sur incidents', () => {
    expect(canResource('DIRECTION', 'incidents', 'read')).toBe(true);
    expect(canResource('DIRECTION', 'incidents', 'write')).toBe(false);
  });
});
