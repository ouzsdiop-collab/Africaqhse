import { PDFParse } from 'pdf-parse';

const DANGER_KEYWORDS = {
  tres_toxique: [
    'tres toxique',
    'LD50',
    'DL50',
    'toxique aigu',
    'categorie 1',
    'H300',
    'H310',
    'H330'
  ],
  toxique: ['toxique', 'nocif', 'H301', 'H311', 'H331', 'nuisible'],
  corrosif: ['corrosif', 'brulures', 'H314', 'H318', 'corrosion'],
  inflammable: ['inflammable', 'facilement inflammable', 'H224', 'H225', 'H226', 'point eclair'],
  comburant: ['comburant', 'oxydant', 'H270', 'H271', 'H272'],
  explosif: ['explosif', 'H200', 'H201', 'H202', 'H203', 'H204'],
  irritant: ['irritant', 'H315', 'H319', 'H335', 'irritation'],
  cancerogene: ['cancerogene', 'cancerigene', 'H350', 'H351', 'CMR', 'mutagene', 'reprotoxique'],
  dangereux_environnement: [
    "dangereux pour l'environnement",
    'H400',
    'H410',
    'H411',
    'aquatique'
  ],
  asphyxiant: ['asphyxiant', "manque d'oxygene", 'atmospheres confinees']
};

const EPI_MAP = {
  tres_toxique: [
    'Masque respiratoire ARI ou cartouche gaz',
    'Combinaison etanche',
    'Gants nitrile epaisseur > 0.4mm',
    'Lunettes etanches'
  ],
  toxique: [
    'Masque demi-face avec cartouche adaptee',
    'Gants nitrile',
    'Lunettes de securite',
    'Tablier chimique'
  ],
  corrosif: [
    'Gants neoprene epaisseur > 0.6mm',
    'Lunettes etanches',
    'Tablier PVC',
    'Chaussures de securite fermees'
  ],
  inflammable: [
    'Vetements antistatiques',
    'Chaussures antistatiques',
    'Pas de flamme nue',
    'Extincteur CO2 a proximite'
  ],
  comburant: [
    'Pas de materiau organique a proximite',
    'Gants ignifuges',
    'Masque FFP2 minimum'
  ],
  explosif: ['Zone interdite au public', 'Protection auricualire', 'EPI antichoc'],
  irritant: ['Gants latex ou nitrile', 'Lunettes de securite', 'Masque FFP1 si poussiere'],
  cancerogene: [
    'Masque FFP3 ou cartouche specifique',
    'Gants impermeables a usage unique',
    'Combinaison jetable'
  ],
  dangereux_environnement: ['Bac de retention obligatoire', 'Kit absorbant', "Pas de rejet a l'egout"],
  asphyxiant: ['Detecteur de gaz O2/CO2', 'Appareil respiratoire isolant', 'Travail en binome obligatoire']
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function extractProductName(text) {
  const patterns = [
    /nom\s+du\s+produit\s*[:\-]?\s*([^\n]{3,80})/i,
    /designation\s+du\s+produit\s*[:\-]?\s*([^\n]{3,80})/i,
    /nom\s+commercial\s*[:\-]?\s*([^\n]{3,80})/i,
    /product\s+name\s*[:\-]?\s*([^\n]{3,80})/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().substring(0, 100);
  }
  return 'Produit chimique';
}

function extractCasNumber(text) {
  const m = text.match(/\bCAS\s*[:\-]?\s*(\d{2,7}-\d{2}-\d)\b/i);
  return m ? m[1] : null;
}

function extractSupplier(text) {
  const patterns = [
    /fournisseur\s*[:\-]?\s*([^\n]{3,60})/i,
    /fabricant\s*[:\-]?\s*([^\n]{3,60})/i,
    /societe\s*[:\-]?\s*([^\n]{3,60})/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().substring(0, 100);
  }
  return null;
}

/**
 * @param {Buffer} pdfBuffer
 * @param {string} [filename]
 */
export async function parseFdsBuffer(pdfBuffer, filename) {
  const parser = new PDFParse({ data: pdfBuffer });
  let data;
  try {
    data = await parser.getText();
  } finally {
    await parser.destroy();
  }
  const raw = data.text || '';
  const normalized = normalizeText(raw);

  const productName = extractProductName(raw);
  const casNumber = extractCasNumber(raw);
  const supplier = extractSupplier(raw);

  const detectedDangers = [];
  const epis = new Set();
  let maxSeverity = 1;

  for (const [danger, keywords] of Object.entries(DANGER_KEYWORDS)) {
    const found = keywords.some((kw) => normalized.includes(normalizeText(kw)));
    if (found) {
      detectedDangers.push(danger);
      (EPI_MAP[danger] || []).forEach((e) => epis.add(e));
      if (['tres_toxique', 'cancerogene', 'explosif'].includes(danger))
        maxSeverity = Math.max(maxSeverity, 5);
      else if (['toxique', 'corrosif', 'comburant'].includes(danger))
        maxSeverity = Math.max(maxSeverity, 4);
      else if (['inflammable', 'asphyxiant'].includes(danger)) maxSeverity = Math.max(maxSeverity, 3);
      else maxSeverity = Math.max(maxSeverity, 2);
    }
  }

  const dangerLabels = {
    tres_toxique: 'Tres toxique',
    toxique: 'Toxique',
    corrosif: 'Corrosif',
    inflammable: 'Inflammable',
    comburant: 'Comburant',
    explosif: 'Explosif',
    irritant: 'Irritant',
    cancerogene: 'Cancerogene / CMR',
    dangereux_environnement: "Dangereux pour l'environnement",
    asphyxiant: 'Asphyxiant'
  };

  const dangerLabelsFound = detectedDangers.map((d) => dangerLabels[d] || d);
  const probability = 2;

  return {
    productName,
    casNumber,
    supplier,
    filename: filename || 'fds.pdf',
    detectedDangers,
    dangerLabelsFound,
    episRequired: Array.from(epis),
    severity: maxSeverity,
    probability,
    riskTitle: `Risque chimique — ${productName}`,
    riskDescription: `Produit : ${productName}${casNumber ? ` (CAS ${casNumber})` : ''}${supplier ? ` | Fournisseur : ${supplier}` : ''}.\nDangers identifies : ${dangerLabelsFound.join(', ') || 'Aucun danger specifique detecte'}.\nEPI requis : ${Array.from(epis).join(', ') || 'A determiner selon evaluation terrain'}.`,
    category: 'Risque chimique',
    pagesScanned: data.total ?? 0
  };
}
