// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import { canAccessNavPage, canResource, MATRIX as FRONT_MATRIX } from './permissionsUi.js';
import { MATRIX as BACKEND_MATRIX } from '../../backend/src/lib/permissions.js';

/**
 * Ressources gérées uniquement côté UI (pas de contrôle backend dédié) :
 * exclues de la comparaison de parité ci-dessous.
 */
const FRONT_ONLY_RESOURCES = new Set(['settings']);

describe('parité matrice UI / backend', () => {
  it('chaque rôle backend existe côté UI avec les mêmes permissions par ressource', () => {
    const diffs = [];
    for (const role of Object.keys(BACKEND_MATRIX)) {
      const frontRow = FRONT_MATRIX[role];
      if (!frontRow) {
        diffs.push(`rôle "${role}" absent de la matrice UI`);
        continue;
      }
      const backendRow = BACKEND_MATRIX[role];
      const resources = new Set([...Object.keys(frontRow), ...Object.keys(backendRow)]);
      for (const resource of resources) {
        if (FRONT_ONLY_RESOURCES.has(resource)) continue;
        const frontPerms = JSON.stringify(frontRow[resource] ?? null);
        const backendPerms = JSON.stringify(backendRow[resource] ?? null);
        if (frontPerms !== backendPerms) {
          diffs.push(`${role} / ${resource} : UI=${frontPerms} backend=${backendPerms}`);
        }
      }
    }
    expect(diffs).toEqual([]);
  });
});

describe('canAccessNavPage', () => {
  afterEach(() => {
    document.documentElement.setAttribute('data-display-mode', 'expert');
  });

  it('autorise toutes les pages si pas de rôle', () => {
    expect(canAccessNavPage(null, 'analytics')).toBe(true);
    expect(canAccessNavPage('', 'iso')).toBe(true);
  });

  it('en mode Expert, TERRAIN voit tout le menu métier', () => {
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

  it('en mode Essentiel (terrain), TERRAIN reste sur le périmètre opérations / raccourcis', () => {
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
