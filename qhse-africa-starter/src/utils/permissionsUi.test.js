// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import { canAccessNavPage, canResource } from './permissionsUi.js';

describe('canAccessNavPage', () => {
  afterEach(() => {
    document.documentElement.setAttribute('data-display-mode', 'expert');
  });

  it('autorise toutes les pages si pas de rôle', () => {
    expect(canAccessNavPage(null, 'analytics')).toBe(true);
    expect(canAccessNavPage('', 'iso')).toBe(true);
  });

  it('en mode Complet, TERRAIN voit tout le menu métier', () => {
    document.documentElement.setAttribute('data-display-mode', 'expert');
    expect(canAccessNavPage('TERRAIN', 'dashboard')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'incidents')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'actions')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'settings')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'analytics')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'audits')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'risks')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'ai-center')).toBe(true);
  });

  it('en mode Terrain, TERRAIN reste sur le périmètre opérations / raccourcis', () => {
    document.documentElement.setAttribute('data-display-mode', 'terrain');
    expect(canAccessNavPage('TERRAIN', 'incidents')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'audits')).toBe(true);
    expect(canAccessNavPage('TERRAIN', 'analytics')).toBe(false);
    expect(canAccessNavPage('TERRAIN', 'iso')).toBe(false);
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

  it('QHSE peut lire audit_logs', () => {
    expect(canResource('QHSE', 'audit_logs', 'read')).toBe(true);
    expect(canResource('QHSE', 'audit_logs', 'write')).toBe(false);
  });

  it('QHSE peut lire et écrire les risques', () => {
    expect(canResource('QHSE', 'risks', 'read')).toBe(true);
    expect(canResource('QHSE', 'risks', 'write')).toBe(true);
  });

  it('DIRECTION ne lit pas audit_logs', () => {
    expect(canResource('DIRECTION', 'audit_logs', 'read')).toBe(false);
  });
});
