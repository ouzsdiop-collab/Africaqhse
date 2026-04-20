import { describe, it, expect } from 'vitest';
import { loginBodySchema } from './authSchemas.js';

describe('loginBodySchema', () => {
  it('accepte un couple email / mot de passe valides', () => {
    const r = loginBodySchema.safeParse({
      email: '  user@qhse.local ',
      password: 'secret'
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.identifier).toBe('user@qhse.local');
      expect(r.data.email).toBe('user@qhse.local');
      expect(r.data.tenantSlug).toBeUndefined();
    }
  });

  it('rejette un e-mail invalide', () => {
    const r = loginBodySchema.safeParse({ email: 'bad', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('normalise tenantSlug vide en undefined', () => {
    const r = loginBodySchema.safeParse({
      email: 'a@b.co',
      password: 'x',
      tenantSlug: ''
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tenantSlug).toBeUndefined();
  });
});
