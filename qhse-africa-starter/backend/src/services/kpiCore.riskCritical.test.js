import { describe, it, expect } from 'vitest';
import {
  isCriticalRisk,
  isRiskCriticalForKpi,
  RISK_CRITICAL_GP_MIN
} from './kpiCore.service.js';

describe('kpiCore — isCriticalRisk (dashboard + getRiskStats)', () => {
  it('alias isRiskCriticalForKpi === isCriticalRisk', () => {
    const row = { severity: 2, gp: 15, probability: 3, gravity: 3 };
    expect(isRiskCriticalForKpi(row)).toBe(isCriticalRisk(row));
  });

  it(`gp persisté >= ${RISK_CRITICAL_GP_MIN}`, () => {
    expect(isCriticalRisk({ severity: 2, gp: 15, probability: 2, gravity: 2 })).toBe(true);
  });

  it(`gp = ${RISK_CRITICAL_GP_MIN - 1} sans libellé critique → non critique`, () => {
    expect(isCriticalRisk({ severity: 3, gp: 14, probability: 2, gravity: 2 })).toBe(false);
  });

  it('probability × gravité >= 15 si gp absent', () => {
    expect(isCriticalRisk({ severity: 2, probability: 3, gravity: 5 })).toBe(true);
  });

  it('severity texte « Critique » même si gp absent ou faible', () => {
    expect(
      isCriticalRisk({
        severity: 'Critique',
        gp: null,
        probability: 1,
        gravity: 1
      })
    ).toBe(true);
  });

  it('palier severity numérique 5 (Prisma Int) même si GP sous le seuil 15', () => {
    expect(
      isCriticalRisk({
        severity: 5,
        gp: 4,
        probability: 1,
        gravity: 1
      })
    ).toBe(true);
  });

  it('palier severity numérique 4 → non critique seul (GP faible)', () => {
    expect(
      isCriticalRisk({
        severity: 4,
        gp: 6,
        probability: 2,
        gravity: 2
      })
    ).toBe(false);
  });

  it('severity texte « critical » (anglais)', () => {
    expect(isCriticalRisk({ severity: 'HIGH critical', gp: 2 })).toBe(true);
  });
});
