import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getTextMock } = vi.hoisted(() => ({
  getTextMock: vi.fn()
}));

vi.mock('pdf-parse', () => ({
  PDFParse: class {
    constructor(_opts) {
      this.getText = getTextMock;
      this.destroy = vi.fn().mockResolvedValue(undefined);
    }
  }
}));

import { parseFdsBuffer } from '../services/fdsParser.service.js';

describe('FDS Parser Service', () => {
  beforeEach(() => {
    getTextMock.mockReset();
  });

  it('detecte les dangers dans un texte FDS simule', async () => {
    const mockContent = `
      Fiche de Donnees de Securite
      Nom du produit : Acide Sulfurique concentre
      CAS : 7664-93-9
      Fournisseur : ChimAfrique SARL
      Ce produit est tres toxique et corrosif.
      Peut provoquer des brulures graves H314.
      Inflammable : point eclair 21°C H225.
      EPI requis : gants neoprene, lunettes etanches.
    `;
    getTextMock.mockResolvedValueOnce({
      text: mockContent,
      total: 3
    });

    const result = await parseFdsBuffer(Buffer.from('%PDF-1.4 fake'), 'acide-sulfurique.pdf');

    expect(result.productName).toContain('Acide Sulfurique');
    expect(result.casNumber).toBe('7664-93-9');
    expect(result.supplier).toContain('ChimAfrique');
    expect(result.detectedDangers).toContain('tres_toxique');
    expect(result.detectedDangers).toContain('corrosif');
    expect(result.episRequired.length).toBeGreaterThan(0);
    expect(result.severity).toBeGreaterThanOrEqual(4);
    expect(result.category).toBe('Risque chimique');
  });

  it('retourne des valeurs par defaut si FDS vide', async () => {
    getTextMock.mockResolvedValueOnce({
      text: 'Document vide',
      total: 1
    });

    const result = await parseFdsBuffer(Buffer.from('%PDF-1.4'), 'vide.pdf');
    expect(result.productName).toBeTruthy();
    expect(result.detectedDangers).toHaveLength(0);
    expect(result.severity).toBe(1);
  });
});
