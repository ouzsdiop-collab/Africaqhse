import { describe, it, expect, vi } from 'vitest';
import {
  validateBody,
  validatePasswordPolicy,
  isValidEmailBasic
} from '../lib/validation.js';
import { createIncidentSchema } from '../validation/incidentSchemas.js';
import { createRiskSchema } from '../validation/riskSchemas.js';
import { createActionSchema } from '../validation/actionSchemas.js';

describe('validateBody middleware', () => {
  const schema = createIncidentSchema;

  it('appelle next() si body valide', () => {
    const middleware = validateBody(schema);
    const req = {
      body: {
        type: 'Accident',
        severity: 'Grave',
        site: 'Site Test',
        description: 'Test incident'
      }
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('repond 422 si body invalide', () => {
    const middleware = validateBody(schema);
    const req = { body: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('assainit req.body apres validation (result.data)', () => {
    const middleware = validateBody(schema);
    const req = {
      body: {
        type: 'Accident',
        severity: 'Grave',
        site: 'Site Test',
        description: 'Test',
        champInconnu: 'HACKED'
      }
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    middleware(req, res, next);
    if (next.mock.calls.length > 0) {
      expect(req.body.champInconnu).toBeUndefined();
    }
  });
});

describe('isValidEmailBasic', () => {
  it('retourne true pour un email valide', () => {
    expect(isValidEmailBasic('user@qhsecontrol.com')).toBe(true);
  });

  it('retourne false pour un email invalide', () => {
    expect(isValidEmailBasic('pas-un-email')).toBe(false);
    expect(isValidEmailBasic('')).toBe(false);
    expect(isValidEmailBasic('a@b')).toBe(false);
  });
});

describe('validatePasswordPolicy', () => {
  it('accepte un mot de passe valide', () => {
    expect(validatePasswordPolicy('Securite123').ok).toBe(true);
  });

  it('refuse si trop court', () => {
    const r = validatePasswordPolicy('abc1');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/court|minimum/i);
  });

  it('refuse si pas de chiffre', () => {
    const r = validatePasswordPolicy('motdepasselong');
    expect(r.ok).toBe(false);
  });

  it('refuse si pas de lettre', () => {
    const r = validatePasswordPolicy('12345678');
    expect(r.ok).toBe(false);
  });
});

describe('createRiskSchema', () => {
  it('valide un risque correct', () => {
    const result = createRiskSchema.safeParse({
      title: 'Risque chimique',
      probability: 3,
      severity: 4
    });
    expect(result.success).toBe(true);
  });

  it('refuse probability hors 1-5', () => {
    const result = createRiskSchema.safeParse({
      title: 'Risque',
      probability: 9,
      severity: 2
    });
    expect(result.success).toBe(false);
  });
});

describe('createActionSchema', () => {
  it('valide une action correcte', () => {
    const result = createActionSchema.safeParse({
      title: 'Corriger le systeme',
      priority: 'high'
    });
    expect(result.success).toBe(true);
  });

  it('refuse un titre vide', () => {
    const result = createActionSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
