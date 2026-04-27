import { describe, it, expect } from 'vitest';
import { createAuditSchema, patchAuditSchema } from './auditSchemas.js';
import { createIncidentSchema, patchIncidentSchema } from './incidentSchemas.js';
import { patchActionSchema } from './actionSchemas.js';
import { patchRiskSchema } from './riskSchemas.js';

describe('auditSchemas — alignement contrôleur', () => {
  const frontCreate = {
    ref: 'AUD-2401',
    site: 'Site Nord',
    siteId: 'site_1',
    score: 82.6,
    status: 'Terminé',
    checklist: { items: [{ ok: true, label: 'Sécurité' }] },
    participantEmails: ['a@example.com']
  };

  it('create : corps type front → success, score entier arrondi', () => {
    const r = createAuditSchema.safeParse(frontCreate);
    expect(r.success).toBe(true);
    expect(r.data.score).toBe(83);
    expect(r.data.ref).toBe('AUD-2401');
    expect(r.data.checklist).toEqual(frontCreate.checklist);
  });

  it('create : score décimal string → arrondi', () => {
    const r = createAuditSchema.safeParse({
      ...frontCreate,
      score: '71.2',
      participantEmails: undefined
    });
    expect(r.success).toBe(true);
    expect(r.data.score).toBe(71);
  });

  it('create : score hors plage → échec', () => {
    const r = createAuditSchema.safeParse({ ...frontCreate, score: 100.1 });
    expect(r.success).toBe(false);
  });

  it('patch : champs site / checklist / siteId conservés', () => {
    const r = patchAuditSchema.safeParse({
      status: 'Clôturé',
      score: 90.4,
      site: 'Site Sud',
      siteId: null,
      checklist: { a: 1 }
    });
    expect(r.success).toBe(true);
    expect(r.data.score).toBe(90);
    expect(r.data.site).toBe('Site Sud');
    expect(r.data.siteId).toBeNull();
    expect(r.data.checklist).toEqual({ a: 1 });
  });

  it('patch : omit score → success', () => {
    const r = patchAuditSchema.safeParse({ status: 'En cours' });
    expect(r.success).toBe(true);
    expect(r.data.score).toBeUndefined();
  });

  it('create strict : clé inconnue → échec', () => {
    const r = createAuditSchema.safeParse({ ...frontCreate, title: 'x' });
    expect(r.success).toBe(false);
  });
});

describe('incidentSchemas — photosJson / location', () => {
  it('create : photosJson chaîne conservée', () => {
    const r = createIncidentSchema.safeParse({
      type: 'blessure',
      site: 'Mine A',
      severity: 'élevée',
      photosJson: '[]'
    });
    expect(r.success).toBe(true);
    expect(r.data.photosJson).toBe('[]');
  });

  it('create : photosJson tableau → stringify pour le contrôleur', () => {
    const r = createIncidentSchema.safeParse({
      type: 'x',
      site: 'y',
      severity: 'z',
      photosJson: []
    });
    expect(r.success).toBe(true);
    expect(r.data.photosJson).toBe('[]');
  });

  it('patch strict : location + photosJson', () => {
    const r = patchIncidentSchema.safeParse({
      location: 'Hangar 3',
      photosJson: '[]'
    });
    expect(r.success).toBe(true);
    expect(r.data.location).toBe('Hangar 3');
    expect(r.data.photosJson).toBe('[]');
  });

  it('patch strict : champ inconnu → échec', () => {
    const r = patchIncidentSchema.safeParse({ status: 'Nouveau', extra: 1 });
    expect(r.success).toBe(false);
  });
});

describe('patchActionSchema — statuts FR', () => {
  it.each(['À lancer', 'En cours', 'Terminée', 'Annulée'])(
    'accepte status métier %s',
    (status) => {
      const r = patchActionSchema.safeParse({ status });
      expect(r.success).toBe(true);
      expect(r.data.status).toBe(status);
    }
  );
});

describe('patchRiskSchema — siteId seul', () => {
  it('accepte uniquement siteId', () => {
    const r = patchRiskSchema.safeParse({ siteId: 'site-uuid-1' });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ siteId: 'site-uuid-1' });
  });

  it('title max 240', () => {
    const r = patchRiskSchema.safeParse({ title: 'a'.repeat(241) });
    expect(r.success).toBe(false);
  });
});
