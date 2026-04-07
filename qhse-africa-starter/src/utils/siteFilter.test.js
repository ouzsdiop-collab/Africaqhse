import { describe, it, expect, beforeEach } from 'vitest';
import { withSiteQuery } from './siteFilter.js';
import { appState } from './state.js';

describe('withSiteQuery', () => {
  beforeEach(() => {
    appState.activeSiteId = null;
  });

  it('retourne le path inchangé sans siteId actif', () => {
    expect(withSiteQuery('/api/incidents')).toBe('/api/incidents');
  });

  it('ajoute ?siteId avec un path sans query', () => {
    appState.activeSiteId = 'site-123';
    expect(withSiteQuery('/api/incidents')).toBe('/api/incidents?siteId=site-123');
  });

  it('ajoute &siteId avec un path déjà query-string', () => {
    appState.activeSiteId = 'site-456';
    expect(withSiteQuery('/api/actions?limit=20')).toBe('/api/actions?limit=20&siteId=site-456');
  });
});
