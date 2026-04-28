import { showToast } from '../components/toast.js';
import { ensureAuditProductsStyles } from '../components/auditProductsStyles.js';
import { activityLogStore } from '../data/activityLog.js';
import { getSessionUser } from '../data/sessionUser.js';
import { readImportDraft, clearImportDraft } from '../utils/importDraft.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { appState } from '../utils/state.js';
import { createEmptyState } from '../utils/designSystem.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';
import { consumeDashboardIntent } from '../utils/dashboardNavigationIntent.js';

/** Registre produits / FDS — jeu d’exemple (peut être complété par import). */
const PRODUCT_REGISTRY = [
  {
    id: 'seed-0',
    name: 'Acide sulfurique',
    cas: '7664-93-9',
    site: 'Site principal',
    danger: 'élevé',
    revision: '02/2026',
    signalWord: 'Danger',
    hazards: 'H314 Peau corrosion / yeux. H290 Peut être corrosif pour les métaux.',
    fdsFileName: '',
    fdsValidUntil: '2024-06-01',
    fdsPictograms: ['GHS05 Corrosif', 'GHS07 Exclamation'],
    fdsEpi: ['Gants chimiques', 'Lunettes étanches', 'Tablier'],
    fdsStorage: 'Récipient fermé, zone ventilée, séparé des bases et métaux réactifs.',
    fdsRescue: 'Retirer les victimes à l’air frais. Rincer abondamment à l’eau (15 min). Consulter un médecin.',
    fdsMeasures: 'Poste de rinçage oculaire à proximité. Pas d’évacuation à l’égout.',
    risksLinked: ['Corrosion', 'Projection', 'Réaction avec eau'],
    incidentsHint: 'Aucun incident lié sur la période affichée — consulter le module Incidents.',
    fdsHumanValidated: true,
    iaSuggestedActions: [],
    iaInconsistencies: []
  },
  {
    id: 'seed-1',
    name: 'Gasoil industriel',
    cas: '68334-30-5',
    site: 'Zone carburants',
    danger: 'élevé',
    revision: '01/2026',
    signalWord: 'Danger',
    hazards: 'H226 Liquide et vapeurs inflammables. H304 Peut être mortel en cas de pénétration.',
    fdsFileName: 'gasoil-fds-demo.pdf',
    fdsValidUntil: '2027-03-15',
    fdsPictograms: ['GHS02 Flamme', 'GHS08 Santé'],
    fdsEpi: ['Gants', 'Vêtements antistatiques'],
    fdsStorage: 'Cuves conformes ATEX, mise à la terre, écart sources d’ignition.',
    fdsRescue: 'Ne pas faire vomir en cas d’ingestion. Appeler les secours.',
    fdsMeasures: 'Détecteurs gaz, permis feu, ventilation.',
    risksLinked: ['Inflammabilité', 'Atmosphères explosives'],
    incidentsHint: 'Aucun incident lié sur ce périmètre.',
    fdsHumanValidated: true,
    iaSuggestedActions: [],
    iaInconsistencies: []
  },
  {
    id: 'seed-2',
    name: 'Soude caustique',
    cas: '1310-73-2',
    site: 'Atelier chimie',
    danger: 'moyen',
    revision: '11/2025',
    signalWord: 'Danger',
    hazards: 'H314 Corrosif pour la peau et les yeux.',
    fdsFileName: '',
    fdsPictograms: ['GHS05'],
    fdsEpi: ['Gants', 'Lunettes'],
    fdsStorage: 'À l’abri de l’humidité.',
    fdsRescue: 'Rinçage eau prolongé, appel centre antipoison.',
    fdsMeasures: '',
    risksLinked: ['Corrosion cutanée'],
    incidentsHint: 'Aucun incident lié sur ce périmètre.',
    fdsHumanValidated: false,
    iaSuggestedActions: ['Compléter la FDS signée', 'Former les nouveaux opérateurs'],
    iaInconsistencies: ['Fichier FDS non joint au registre']
  },
  {
    id: 'seed-3',
    name: 'Antigel technique',
    cas: '107-21-1',
    site: 'Magasin général',
    danger: 'faible',
    revision: '09/2025',
    signalWord: 'Attention',
    hazards: 'H302 Nocif en cas d’ingestion.',
    fdsFileName: '',
    fdsPictograms: ['GHS07'],
    fdsEpi: ['Gants si contact prolongé'],
    fdsStorage: 'Température ambiante.',
    fdsRescue: 'Appeler un médecin en cas d’ingestion.',
    fdsMeasures: 'Lavage des mains après usage.',
    risksLinked: ['Toxicité aiguë faible'],
    incidentsHint: 'Aucun incident lié sur ce périmètre.',
    fdsHumanValidated: true,
    iaSuggestedActions: [],
    iaInconsistencies: []
  }
];

const PRODUCTS_LS_KEY = 'qhseProductsPersistedV1';

/** @type {Map<string, string>} */
const fdsBlobUrlByProductId = new Map();

/** @type {string[]} */
let pendingIaSuggestedActions = [];
/** @type {string[]} */
let pendingIaInconsistencies = [];

function dangerTone(d) {
  const t = String(d).toLowerCase();
  if (t.includes('élev') || t.includes('elev')) return { cls: 'red', label: 'Élevé' };
  if (t.includes('moyen')) return { cls: 'amber', label: 'Moyen' };
  return { cls: 'green', label: 'Faible' };
}

function matchesFilter(p, q) {
  if (!q) return true;
  const s = `${p.name} ${p.cas} ${p.site} ${p.supplier || ''}`.toLowerCase();
  return s.includes(q);
}

function linesToArray(s) {
  return String(s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Assure des champs optionnels exploitables sans casser les fiches historiques (localStorage).
 * @param {object} p
 */
function normalizeProductRow(p) {
  if (!p || typeof p !== 'object') return p;
  const o = { ...p };
  if (!Array.isArray(o.fdsPictograms)) {
    o.fdsPictograms = typeof o.fdsPictograms === 'string' ? linesToArray(o.fdsPictograms) : [];
  }
  if (!Array.isArray(o.fdsEpi)) {
    o.fdsEpi = typeof o.fdsEpi === 'string' ? linesToArray(o.fdsEpi) : [];
  }
  if (typeof o.fdsStorage !== 'string') o.fdsStorage = '';
  if (typeof o.fdsRescue !== 'string') o.fdsRescue = '';
  if (typeof o.fdsMeasures !== 'string') o.fdsMeasures = '';
  if (typeof o.fdsValidUntil !== 'string') o.fdsValidUntil = '';
  if (typeof o.fdsHumanValidated !== 'boolean') o.fdsHumanValidated = false;
  if (!Array.isArray(o.iaSuggestedActions)) o.iaSuggestedActions = [];
  if (!Array.isArray(o.iaInconsistencies)) o.iaInconsistencies = [];
  if (!Array.isArray(o.ghsCodes)) o.ghsCodes = [];
  if (typeof o.supplier !== 'string') o.supplier = '';
  if (typeof o.ceNumber !== 'string') o.ceNumber = '';
  if (typeof o.vlep !== 'string') o.vlep = '';
  if (typeof o.storageClass !== 'string') o.storageClass = '';
  if (!Array.isArray(o.hStatementsList)) o.hStatementsList = [];
  if (!Array.isArray(o.pStatementsList)) o.pStatementsList = [];
  return o;
}

function loadPersistedProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_LS_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw);
    if (!Array.isArray(a)) return [];
    return a.map((x) => normalizeProductRow(x));
  } catch {
    return [];
  }
}

function savePersistedProducts(rows) {
  try {
    localStorage.setItem(PRODUCTS_LS_KEY, JSON.stringify(rows));
  } catch (e) {
    console.warn('[products] persist', e);
    showToast('Stockage local plein ou indisponible', 'error');
  }
}

function getAllProducts() {
  if (!apiProductsLoaded && !chemicalProductsLoaded) {
    return [...PRODUCT_REGISTRY.map((x) => normalizeProductRow(x)), ...loadPersistedProducts()];
  }
  const merged = [];
  const seen = new Set();
  if (chemicalProductsLoaded) {
    for (const raw of chemicalProductsRows) {
      const row = normalizeProductRow(mapDbProductToRow(raw));
      merged.push(row);
      seen.add(row.id);
    }
  }
  if (apiProductsLoaded) {
    for (const p of apiProducts) {
      const n = normalizeProductRow(p);
      if (seen.has(n.id)) continue;
      merged.push(n);
      seen.add(n.id);
    }
  }
  if (merged.length === 0) {
    return [...PRODUCT_REGISTRY.map((x) => normalizeProductRow(x)), ...loadPersistedProducts()];
  }
  return merged;
}

/** @type {object[]} */
let apiProducts = [];
let apiProductsLoaded = false;

/** Produits issus de la table `Product` (parse FDS serveur). */
let chemicalProductsRows = [];
let chemicalProductsLoaded = false;

const FDS_PRODUCTS_LIST_URL = '/api/controlled-documents/products/fds';
const FDS_PARSE_URL = '/api/controlled-documents/products/fds/parse';

/**
 * @param {string[]} h
 */
function inferDangerFromHStatements(h) {
  const s = (Array.isArray(h) ? h.join(' ') : '').toUpperCase();
  if (/\bH(300|301|302|304|310|311|314|317|318|330|331|340|341|350|351|360|361|362)\b/.test(s)) {
    return 'élevé';
  }
  if (/\bH(3\d\d|4\d\d)\b/.test(s)) return 'moyen';
  return 'faible';
}

/**
 * @param {string} code
 */
function extractGhsCodesFromPictograms(p) {
  if (!Array.isArray(p)) return [];
  const out = [];
  for (const x of p) {
    const m = String(x).match(/\bGHS\s*0?([1-9])\b/i);
    if (m) out.push(`GHS0${m[1]}`);
  }
  return uniqStrings(out);
}

function uniqStrings(arr) {
  const seen = new Set();
  const o = [];
  for (const x of arr || []) {
    const k = String(x).trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    o.push(k);
  }
  return o;
}

function ghsBadgeInlineStyle(code) {
  const raw = String(code || '').toUpperCase().replace(/^GHS0?/, '');
  const n = raw.replace(/\D/g, '').replace(/^0+/, '') || '0';
  const palette = {
    1: '#e11d48',
    2: '#ea580c',
    3: '#ca8a04',
    4: '#475569',
    5: '#9333ea',
    6: '#6d28d9',
    7: '#f97316',
    8: '#db2777',
    9: '#059669'
  };
  const bg = palette[Number(n)] || '#64748b';
  return `background:${bg};color:#fff;border:none;font-weight:800;font-size:11px;padding:3px 8px;border-radius:999px;display:inline-flex;align-items:center`;
}

/** Découpe un bloc dangers (H/P mélangés) en segments [HP]nnn… */
function splitHpFromBlob(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  return t.split(/\s+(?=[HP]\d)/i).map((x) => x.trim()).filter(Boolean);
}

/**
 * @param {object} product
 * @returns {{ hLines: string[], pLines: string[] }}
 */
function deriveHPLines(product) {
  const hStmt = Array.isArray(product.hStatementsList)
    ? product.hStatementsList.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const pStmt = Array.isArray(product.pStatementsList)
    ? product.pStatementsList.map((x) => String(x).trim()).filter(Boolean)
    : [];
  if (hStmt.length || pStmt.length) {
    return { hLines: hStmt, pLines: pStmt };
  }
  const chunks = splitHpFromBlob(product.hazards || '');
  if (!chunks.length) {
    const haz = String(product.hazards || '').trim();
    return haz ? { hLines: [haz], pLines: [] } : { hLines: [], pLines: [] };
  }
  const hLines = [];
  const pLines = [];
  for (const c of chunks) {
    if (/^P\d/i.test(c)) pLines.push(c);
    else hLines.push(c);
  }
  return { hLines, pLines };
}

/**
 * @param {object} p
 */
function mapDbProductToRow(p) {
  const ghsRaw = Array.isArray(p.ghsPictograms)
    ? p.ghsPictograms.map((x) => String(x).toUpperCase())
    : [];
  const ghsCodes = ghsRaw.map((c) => (c.startsWith('GHS') ? c : `GHS${c.replace(/^0+/, '')}`));
  const hSt = Array.isArray(p.hStatements) ? p.hStatements.map((x) => String(x)) : [];
  const pSt = Array.isArray(p.pStatements) ? p.pStatements.map((x) => String(x)) : [];
  const pictoLabels = ghsCodes.map((c) => {
    const n = c.replace(/^GHS0?/i, '');
    const labels = {
      1: 'Explosif',
      2: 'Inflammable',
      3: 'Comburant',
      4: 'Gaz sous pression',
      5: 'Corrosif',
      6: 'Toxique',
      7: 'Irritant',
      8: 'Santé',
      9: 'Environnement'
    };
    return `GHS0${n} ${labels[Number(n)] || ''}`.trim();
  });
  const siteName = p.siteRecord?.name || appState.currentSite || '—';
  const updated = p.updatedAt ? new Date(p.updatedAt) : null;
  return normalizeProductRow({
    id: String(p.id),
    name: String(p.name || 'Produit'),
    cas: p.casNumber ? String(p.casNumber) : '—',
    supplier: p.supplier ? String(p.supplier) : '',
    ceNumber: p.ceNumber ? String(p.ceNumber) : '',
    site: siteName,
    danger: inferDangerFromHStatements(hSt),
    revision: updated
      ? updated.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—',
    signalWord: '—',
    hazards: hSt.length ? hSt.join(' · ') : '—',
    fdsFileName: p.fdsFileUrl ? String(p.fdsFileUrl).replace(/^fds:/, '') : '',
    fdsValidUntil: '',
    fdsPictograms: pictoLabels.length ? pictoLabels : ghsCodes,
    ghsCodes,
    fdsEpi: [],
    fdsStorage: p.storageClass ? String(p.storageClass) : '',
    fdsRescue: '',
    fdsMeasures: p.vlep ? `VLEP / exposition : ${p.vlep}` : '',
    risksLinked: pSt.length ? [`Conseils P : ${pSt.slice(0, 4).join(', ')}`] : [],
    incidentsHint: 'Voir module Incidents pour le terrain.',
    fdsHumanValidated: true,
    iaSuggestedActions: [],
    iaInconsistencies: [],
    fromChemicalDb: true,
    vlep: p.vlep ? String(p.vlep) : '',
    storageClass: p.storageClass ? String(p.storageClass) : '',
    hStatementsList: hSt,
    pStatementsList: pSt
  });
}

async function parseFdsPdfOnServer(file) {
  const fd = new FormData();
  fd.append('file', file);
  if (appState.activeSiteId) fd.append('siteId', String(appState.activeSiteId));
  const res = await qhseFetch(FDS_PARSE_URL, { method: 'POST', body: fd });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Analyse FDS impossible (${res.status})`);
  }
  return body;
}

async function confirmFdsProductOnServer(productId, fields) {
  const fd = new FormData();
  fd.append('confirm', '1');
  fd.append('productId', String(productId));
  fd.append('name', fields.name);
  fd.append('supplier', fields.supplier || '');
  fd.append('casNumber', fields.casNumber || '');
  fd.append('ceNumber', fields.ceNumber || '');
  fd.append('hStatementsJson', JSON.stringify(fields.hStatements || []));
  fd.append('pStatementsJson', JSON.stringify(fields.pStatements || []));
  fd.append('ghsPictogramsJson', JSON.stringify(fields.ghsPictograms || []));
  fd.append('vlep', fields.vlep || '');
  fd.append('storageClass', fields.storageClass || '');
  if (appState.activeSiteId) fd.append('siteId', String(appState.activeSiteId));
  const res = await qhseFetch(FDS_PARSE_URL, { method: 'POST', body: fd });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Enregistrement impossible (${res.status})`);
  }
  return body;
}

function mapControlledDocumentToProduct(doc) {
  return normalizeProductRow({
    id: String(doc?.id || makeProductId()),
    name: String(doc?.name || 'Document FDS'),
    cas: '—',
    site: String(doc?.site?.name || appState.currentSite || 'Site principal'),
    danger: 'moyen',
    revision: doc?.updatedAt
      ? new Date(doc.updatedAt).toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' })
      : '—',
    signalWord: 'Attention',
    hazards: 'FDS importée via API.',
    fdsFileName: String(doc?.name || ''),
    fdsValidUntil: doc?.expiresAt ? String(doc.expiresAt).slice(0, 10) : '',
    fdsPictograms: [],
    fdsEpi: [],
    fdsStorage: '',
    fdsRescue: '',
    fdsMeasures: '',
    risksLinked: [],
    incidentsHint: 'Voir modules risques/incidents pour liaison.',
    fdsHumanValidated: true,
    iaSuggestedActions: [],
    iaInconsistencies: []
  });
}

async function loadProductsFromApi() {
  const [docRes, chemRes] = await Promise.all([
    qhseFetch(withSiteQuery('/api/controlled-documents?type=fds')),
    qhseFetch(withSiteQuery(FDS_PRODUCTS_LIST_URL))
  ]);
  if (docRes.ok) {
    const rows = await docRes.json().catch(() => []);
    apiProducts = (Array.isArray(rows) ? rows : []).map(mapControlledDocumentToProduct);
    apiProductsLoaded = true;
  } else {
    apiProductsLoaded = false;
    apiProducts = [];
  }
  if (chemRes.ok) {
    const rows = await chemRes.json().catch(() => []);
    chemicalProductsRows = Array.isArray(rows) ? rows : [];
    chemicalProductsLoaded = true;
  } else {
    chemicalProductsLoaded = false;
    chemicalProductsRows = [];
  }
  if (!docRes.ok && !chemRes.ok) {
    throw new Error(`HTTP ${docRes.status || chemRes.status}`);
  }
}

async function uploadFdsDocument(payload) {
  const fd = new FormData();
  fd.append('file', payload.file);
  fd.append('name', payload.name);
  fd.append('type', 'fds');
  if (payload.siteId) fd.append('siteId', payload.siteId);
  const res = await qhseFetch('/api/controlled-documents', { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Upload impossible (${res.status})`);
  }
  return res.json();
}

async function downloadFdsById(id) {
  const res = await qhseFetch(`/api/controlled-documents/${encodeURIComponent(String(id))}/download`);
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function isTerrainSessionRole() {
  return String(getSessionUser()?.role ?? '')
    .trim()
    .toUpperCase() === 'TERRAIN';
}

function parseValidUntilMs(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function isFdsExpired(p) {
  const t = parseValidUntilMs(p.fdsValidUntil);
  if (t == null) return false;
  const end = new Date(t);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < Date.now();
}

function isFdsMissing(p) {
  return !p.fdsFileName || String(p.fdsFileName).trim() === '';
}

function isDangerElev(p) {
  return dangerTone(p.danger).cls === 'red';
}

function isUncontrolledDangerous(p) {
  return isDangerElev(p) && (isFdsMissing(p) || !p.fdsHumanValidated);
}

function countDangerousProducts(products) {
  return products.filter((p) => isDangerElev(p)).length;
}

function dangerDistribution(products) {
  let el = 0;
  let mo = 0;
  let fa = 0;
  products.forEach((p) => {
    const c = dangerTone(p.danger).cls;
    if (c === 'red') el += 1;
    else if (c === 'amber') mo += 1;
    else fa += 1;
  });
  return { el, mo, fa, total: products.length };
}

function computeAlerts(products) {
  const out = [];
  products.forEach((p) => {
    if (isFdsMissing(p)) {
      out.push({ type: 'missing', product: p, text: `FDS manquante — ${p.name}` });
    }
    if (isFdsExpired(p)) {
      out.push({ type: 'expired', product: p, text: `FDS expirée — ${p.name}` });
    }
    if (isUncontrolledDangerous(p)) {
      out.push({ type: 'uncontrolled', product: p, text: `Produit dangereux non maîtrisé — ${p.name}` });
    }
  });
  return out;
}

/**
 * Préremplissage assisté côté navigateur — pas de lecture réelle du PDF/image ; validation humaine obligatoire.
 * @param {File} file
 */
function simulateFdsIaExtraction(file) {
  return new Promise((resolve) => {
    const fn = String(file?.name || 'document.pdf');
    const lower = fn.toLowerCase();
    const isImg = /\.(png|jpe?g|webp|gif)$/i.test(lower) || /^image\//.test(String(file?.type || ''));
    const name = fn.replace(/\.(pdf|png|jpe?g|webp|gif)$/i, '');
    const friendly = name.replace(/[_-]+/g, ' ').trim() || 'Produit (FDS importée)';
    const h = [...fn].reduce((a, c) => a + c.charCodeAt(0), 0);
    setTimeout(() => {
      const pictograms =
        h % 3 === 0
          ? ['GHS05 Corrosif', 'GHS07 Exclamation']
          : h % 3 === 1
            ? ['GHS02 Flamme', 'GHS08 Santé']
            : ['GHS09 Environnement', 'GHS07 Exclamation'];
      const epi =
        h % 2 === 0
          ? ['Gants de protection chimique', 'Lunettes étanches', 'Combinaison si projection']
          : ['Gants nitrile', 'Lunettes', 'Masque FFP2 si poussières'];
      const storage =
        'Conserver dans un récipient fermé, zone ventilée, à l’écart des sources d’ignition et des incompatibles (à reprendre depuis la FDS).';
      const rescue =
        'En cas de contact : rincer abondamment à l’eau 15 min. En cas d’ingestion : ne pas faire vomir, appeler les secours (à reprendre depuis la FDS).';
      const measures =
        'Ventilation locale, postes de rinçage, formation manipulation, interdiction repas sur poste (à reprendre depuis la FDS).';
      const suggested = [
        'Vérifier la cohérence N° CAS avec la FDS officielle fournisseur.',
        'Mettre à jour le registre des risques si nouvelle substance.',
        'Prévoir une fiche de poste EPI pour les opérateurs.'
      ];
      const inconsistencies = [];
      if (isImg) {
        inconsistencies.push(
          'Import image : l’extraction automatique est moins fiable — contrôle humain renforcé requis.'
        );
      }
      if (/brouillon|draft|copie/i.test(fn)) {
        inconsistencies.push('Le nom de fichier suggère un brouillon — confirmer la version maîtrisée.');
      }
      if (h % 5 === 0) {
        inconsistencies.push('Écart possible entre mot-signal détecté et pictogrammes — recouper section 2 CLP.');
      }
      const rev = new Date();
      rev.setMonth(rev.getMonth() + 18);
      const fdsValidUntil = rev.toISOString().slice(0, 10);
      resolve({
        name: friendly.slice(0, 120),
        cas: '— à vérifier sur la FDS',
        site: 'Site principal',
        danger: 'moyen',
        revision: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        signalWord: 'Attention',
        hazards:
          'Extraction d’exemple (fichier non lu) : reprendre intégralement les phrases H et P depuis le document officiel signé.',
        fdsValidUntil,
        pictograms,
        epi,
        storage,
        rescue,
        measures,
        iaSuggestedActions: suggested,
        iaInconsistencies: inconsistencies
      });
    }, 950);
  });
}

function makeProductId() {
  return `prd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {object} product
 * @param {{ onDetail?: (p: object) => void; onFds?: (p: object) => void }} [handlers]
 */
function createProductRow(product, handlers = {}) {
  const { onDetail, onFds } = handlers;
  const row = document.createElement('article');
  row.className = 'list-row products-row products-row-card';
  const d = dangerTone(product.danger);

  const alerts = [];
  if (isFdsMissing(product)) alerts.push({ cls: 'products-alert-pill--miss', t: 'FDS manquante' });
  if (isFdsExpired(product)) alerts.push({ cls: 'products-alert-pill--exp', t: 'FDS expirée' });
  if (isUncontrolledDangerous(product)) alerts.push({ cls: 'products-alert-pill--nc', t: 'Non maîtrisé' });

  const main = document.createElement('div');
  main.className = 'products-row-main';
  const titleEl = document.createElement('strong');
  titleEl.className = 'products-row-title';
  titleEl.textContent = product.name;
  main.append(titleEl);
  const subEl = document.createElement('p');
  subEl.className = 'products-row-sub';
  subEl.textContent = `CAS ${product.cas} · ${product.site}`;
  main.append(subEl);
  const revEl = document.createElement('p');
  revEl.className = 'products-row-rev';
  revEl.textContent = `FDS révisée ${product.revision}`;
  main.append(revEl);
  if (product.fdsValidUntil && String(product.fdsValidUntil).trim()) {
    const vp = document.createElement('p');
    vp.className = `products-row-validity${isFdsExpired(product) ? ' products-row-validity--late' : ''}`;
    vp.textContent = `Validité FDS : ${product.fdsValidUntil}`;
    main.append(vp);
  }
  const docP = document.createElement('p');
  if (product.fdsFileName && String(product.fdsFileName).trim()) {
    docP.className = 'products-row-doc';
    docP.textContent = `Pièce jointe : ${product.fdsFileName}`;
  } else {
    docP.className = 'products-row-doc products-row-doc--warn';
    docP.textContent = 'Pas de fichier — fiche = données saisies';
  }
  main.append(docP);
  if (alerts.length > 0) {
    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'products-row-pills';
    for (const a of alerts) {
      const sp = document.createElement('span');
      sp.className = `products-alert-pill ${a.cls}`;
      sp.textContent = a.t;
      pillsWrap.append(sp);
    }
    main.append(pillsWrap);
  }

  const ghsCodes =
    Array.isArray(product.ghsCodes) && product.ghsCodes.length
      ? product.ghsCodes
      : extractGhsCodesFromPictograms(product.fdsPictograms);
  if (ghsCodes.length) {
    const ghsWrap = document.createElement('div');
    ghsWrap.className = 'products-row-ghs-wrap';
    ghsWrap.setAttribute('aria-label', 'Pictogrammes SGH');
    ghsCodes.forEach((code) => {
      const sp = document.createElement('span');
      sp.className = 'products-ghs-badge';
      sp.style.cssText = ghsBadgeInlineStyle(code);
      const c = String(code).toUpperCase();
      sp.textContent = c.startsWith('GHS') ? c : `GHS${c}`;
      ghsWrap.append(sp);
    });
    main.append(ghsWrap);
  }

  const actions = document.createElement('div');
  actions.className = 'products-row-actions';

  const badge = document.createElement('span');
  badge.className = `badge ${d.cls} products-danger-badge`;
  badge.textContent = `Danger ${d.label}`;

  const hasAttachment = !!(product.fdsFileName && String(product.fdsFileName).trim());
  const btnFds = document.createElement('button');
  btnFds.type = 'button';
  btnFds.className = 'btn';
  btnFds.textContent = hasAttachment ? 'Ouvrir fichier' : 'Sans fichier';
  btnFds.disabled = !hasAttachment;
  btnFds.title = hasAttachment
    ? 'PDF ou image d’origine — la fiche exploitable pour le terrain est constituée des champs structurés (détail).'
    : 'Aucune pièce jointe : la substance reste gérée via les champs de la fiche.';
  btnFds.addEventListener('click', () => {
    if (typeof onFds === 'function') onFds(product);
    else showToast(`Fichier source — ${product.name}.`, 'info');
  });

  const btnDet = document.createElement('button');
  btnDet.type = 'button';
  btnDet.className = 'btn btn-primary';
  btnDet.textContent = 'Détails';
  btnDet.addEventListener('click', () => {
    if (typeof onDetail === 'function') onDetail(product);
    else showToast(`Fiche produit ${product.name}.`, 'info');
  });

  actions.append(badge, btnFds, btnDet);
  row.append(main, actions);
  return row;
}

function fillDetailListUl(ul, items) {
  ul.replaceChildren();
  if (!items || !items.length) {
    const li = document.createElement('li');
    li.textContent = '—';
    ul.append(li);
    return;
  }
  for (const t of items) {
    const li = document.createElement('li');
    li.textContent = String(t);
    ul.append(li);
  }
}

function renderProductDetail(product, host) {
  host.replaceChildren();
  host.hidden = false;
  const art = document.createElement('article');
  art.className = 'content-card card-soft products-detail-card';
  const fdsName = product.fdsFileName
    ? String(product.fdsFileName)
    : 'Aucun fichier lié — ajoutez la FDS signée.';
  const valid = product.fdsValidUntil ? String(product.fdsValidUntil) : '—';
  const validExpired = isFdsExpired(product);
  const dSum = dangerTone(product.danger);
  const hasAtt = !!(product.fdsFileName && String(product.fdsFileName).trim());

  const head = document.createElement('div');
  head.className = 'content-card-head content-card-head--split';
  const headLeft = document.createElement('div');
  const kicker = document.createElement('div');
  kicker.className = 'section-kicker';
  kicker.textContent = 'Fiche produit / substance';
  const h3 = document.createElement('h3');
  h3.className = 'products-detail-title';
  h3.textContent = product.name;
  const meta = document.createElement('p');
  meta.className = 'products-detail-meta';
  meta.textContent = `CAS ${product.cas} · ${product.site} · Révision ${product.revision}`;
  const validP = document.createElement('p');
  validP.className = `products-detail-valid${validExpired ? ' products-detail-valid--expired' : ''}`;
  validP.textContent = `Validité FDS (indicative) : ${valid}`;
  headLeft.append(kicker, h3, meta, validP);

  const headActions = document.createElement('div');
  headActions.className = 'products-detail-head-actions';
  const btnCopy = document.createElement('button');
  btnCopy.type = 'button';
  btnCopy.className = 'btn btn-secondary products-detail-copy';
  btnCopy.textContent = 'Copier synthèse';
  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  btnClose.className = 'text-button products-detail-close';
  btnClose.style.fontWeight = '700';
  btnClose.textContent = 'Fermer';
  headActions.append(btnCopy, btnClose);
  head.append(headLeft, headActions);

  const summary = document.createElement('div');
  summary.className = 'products-detail-summary';
  summary.setAttribute('role', 'region');
  summary.setAttribute('aria-label', 'Synthèse');

  const critItem = document.createElement('div');
  critItem.className = 'products-detail-summary-item';
  const critLbl = document.createElement('span');
  critLbl.className = 'products-detail-summary-lbl';
  critLbl.textContent = 'Criticité';
  const critVal = document.createElement('span');
  critVal.className = `products-detail-summary-val products-detail-summary-val--${dSum.cls}`;
  critVal.textContent = dSum.label;
  critItem.append(critLbl, critVal);

  const valItem = document.createElement('div');
  valItem.className = 'products-detail-summary-item';
  const valLbl = document.createElement('span');
  valLbl.className = 'products-detail-summary-lbl';
  valLbl.textContent = 'Validité';
  const valSpan = document.createElement('span');
  valSpan.className = `products-detail-summary-val${validExpired ? ' products-detail-valid--expired' : ''}`;
  valSpan.textContent = valid;
  valItem.append(valLbl, valSpan);

  const attItem = document.createElement('div');
  attItem.className = 'products-detail-summary-item';
  const attLbl = document.createElement('span');
  attLbl.className = 'products-detail-summary-lbl';
  attLbl.textContent = 'Pièce jointe';
  const attVal = document.createElement('span');
  attVal.className = 'products-detail-summary-val';
  attVal.textContent = hasAtt ? 'Oui' : 'Non';
  attItem.append(attLbl, attVal);
  summary.append(critItem, valItem, attItem);

  const exploitNote = document.createElement('p');
  exploitNote.className = 'products-detail-exploit-note';
  exploitNote.setAttribute('role', 'note');
  const sn = document.createElement('strong');
  sn.textContent = 'Fiche exploitable :';
  exploitNote.append(sn, document.createTextNode(' dangers, EPI, stockage et secours ci-dessous servent au terrain et au pilotage. Le fichier PDF/image n’est qu’une référence (hébergement selon votre déploiement).'));

  const body = document.createElement('div');
  body.className = 'products-detail-body';

  const secGen = document.createElement('section');
  secGen.className = 'products-detail-block products-detail-block--general';
  const h4g = document.createElement('h4');
  h4g.textContent = 'Infos générales';
  const pRef = document.createElement('p');
  pRef.className = 'products-detail-text';
  const sr = document.createElement('strong');
  sr.textContent = 'Référence document :';
  pRef.append(sr, document.createTextNode(` ${fdsName}`));
  const pHum = document.createElement('p');
  pHum.className = 'products-detail-text';
  const sh = document.createElement('strong');
  sh.textContent = 'Validation humaine (registre) :';
  pHum.append(sh, document.createTextNode(` ${product.fdsHumanValidated ? 'Oui' : 'Non — à compléter'}`));
  secGen.append(h4g, pRef, pHum);

  const secDang = document.createElement('section');
  secDang.className = 'products-detail-block';
  const h4d = document.createElement('h4');
  h4d.textContent = 'Dangers & CLP';
  const pSig = document.createElement('p');
  pSig.className = 'products-detail-text';
  const ss = document.createElement('strong');
  ss.textContent = 'Mot-signal :';
  pSig.append(ss, document.createTextNode(` ${product.signalWord || '—'}`));
  const { hLines, pLines } = deriveHPLines(product);
  const hpHost = document.createElement('div');
  hpHost.className = 'products-detail-hp-wrap';
  if (hLines.length) {
    const hLbl = document.createElement('p');
    hLbl.className = 'products-detail-subh products-detail-subh--hp';
    hLbl.textContent = 'Phrases H';
    const hCont = document.createElement('div');
    hCont.className = 'products-detail-hp-lines';
    for (const line of hLines) {
      const div = document.createElement('div');
      div.className = 'products-detail-hp-line';
      div.textContent = line;
      hCont.append(div);
    }
    hpHost.append(hLbl, hCont);
  }
  if (pLines.length) {
    const pLbl = document.createElement('p');
    pLbl.className = 'products-detail-subh products-detail-subh--hp';
    pLbl.textContent = 'Conseils P';
    const pCont = document.createElement('div');
    pCont.className = 'products-detail-hp-lines';
    for (const line of pLines) {
      const div = document.createElement('div');
      div.className = 'products-detail-hp-line';
      div.textContent = line;
      pCont.append(div);
    }
    hpHost.append(pLbl, pCont);
  }
  if (!hLines.length && !pLines.length) {
    const pHaz = document.createElement('p');
    pHaz.className = 'products-detail-text';
    pHaz.textContent = '—';
    hpHost.append(pHaz);
  }
  const pictoWrap = document.createElement('div');
  pictoWrap.className = 'products-picto-chips';
  const pictos = product.fdsPictograms || [];
  if (pictos.length) {
    for (const x of pictos) {
      const chip = document.createElement('span');
      chip.className = 'products-picto-chip';
      chip.textContent = String(x);
      pictoWrap.append(chip);
    }
  } else {
    const muted = document.createElement('span');
    muted.className = 'products-detail-muted';
    muted.textContent = '—';
    pictoWrap.append(muted);
  }
  secDang.append(h4d, pSig, hpHost, pictoWrap);

  const secEpi = document.createElement('section');
  secEpi.className = 'products-detail-block';
  const h4e = document.createElement('h4');
  h4e.textContent = 'EPI recommandés';
  const ulEpi = document.createElement('ul');
  ulEpi.className = 'products-detail-list';
  fillDetailListUl(ulEpi, product.fdsEpi);
  secEpi.append(h4e, ulEpi);

  const secSto = document.createElement('section');
  secSto.className = 'products-detail-block';
  const h4s = document.createElement('h4');
  h4s.textContent = 'Mesures & stockage';
  const pSt = document.createElement('p');
  pSt.className = 'products-detail-text';
  const sst = document.createElement('strong');
  sst.textContent = 'Stockage :';
  pSt.append(sst, document.createTextNode(` ${product.fdsStorage || '—'}`));
  const pPrev = document.createElement('p');
  pPrev.className = 'products-detail-text';
  const spv = document.createElement('strong');
  spv.textContent = 'Prévention :';
  pPrev.append(spv, document.createTextNode(` ${product.fdsMeasures || '—'}`));
  secSto.append(h4s, pSt, pPrev);

  const secUrg = document.createElement('section');
  secUrg.className = 'products-detail-block products-detail-block--urgent';
  const h4u = document.createElement('h4');
  h4u.textContent = 'Urgence & secours';
  const pUrg = document.createElement('p');
  pUrg.className = 'products-detail-text products-detail-urgency';
  pUrg.textContent = product.fdsRescue || '—';
  secUrg.append(h4u, pUrg);

  const secIa = document.createElement('section');
  secIa.className = 'products-detail-block products-detail-block--ia';
  const h4ia = document.createElement('h4');
  h4ia.textContent = 'Analyse IA (indicative)';
  const pNote = document.createElement('p');
  pNote.className = 'products-detail-note';
  pNote.textContent = 'Pistes générées par l’assistant — à recouper avec la FDS ; aucune décision automatique.';
  const subInc = document.createElement('p');
  subInc.className = 'products-detail-subh';
  subInc.textContent = 'Incohérences signalées';
  const ulInc = document.createElement('ul');
  ulInc.className = 'products-detail-list';
  fillDetailListUl(ulInc, product.iaInconsistencies);
  const subAct = document.createElement('p');
  subAct.className = 'products-detail-subh';
  subAct.textContent = 'Actions suggérées';
  const ulAct = document.createElement('ul');
  ulAct.className = 'products-detail-list';
  fillDetailListUl(ulAct, product.iaSuggestedActions);
  secIa.append(h4ia, pNote, subInc, ulInc, subAct, ulAct);

  const secMod = document.createElement('section');
  secMod.className = 'products-detail-block products-detail-block--modules';
  const h4m = document.createElement('h4');
  h4m.textContent = 'Risques, incidents & actions';
  const pHint = document.createElement('p');
  pHint.className = 'products-detail-text products-detail-module-hint';
  const strongCas = document.createElement('strong');
  strongCas.textContent = `CAS ${product.cas}`;
  const strongNom = document.createElement('strong');
  strongNom.textContent = 'nom produit';
  pHint.append(
    document.createTextNode('Même sans lien automatique, utilisez le '),
    strongCas,
    document.createTextNode(' ou le '),
    strongNom,
    document.createTextNode(' dans la recherche de chaque module.')
  );
  const pRisksLbl = document.createElement('p');
  pRisksLbl.className = 'products-detail-text';
  const srl = document.createElement('strong');
  srl.textContent = 'Risques (registre local) :';
  pRisksLbl.append(srl);
  const ulRisks = document.createElement('ul');
  ulRisks.className = 'products-detail-list';
  fillDetailListUl(ulRisks, product.risksLinked);
  const pInc = document.createElement('p');
  pInc.className = 'products-detail-text';
  const sin = document.createElement('strong');
  sin.textContent = 'Incidents :';
  pInc.append(sin, document.createTextNode(` ${product.incidentsHint || 'Voir le registre incidents.'}`));
  const modBtns = document.createElement('div');
  modBtns.className = 'products-detail-module-btns';
  const bR = document.createElement('button');
  bR.type = 'button';
  bR.className = 'btn btn-secondary products-goto-risks';
  bR.textContent = 'Risques';
  const bI = document.createElement('button');
  bI.type = 'button';
  bI.className = 'btn btn-secondary products-goto-incidents';
  bI.textContent = 'Incidents';
  const bA = document.createElement('button');
  bA.type = 'button';
  bA.className = 'btn btn-secondary products-goto-actions';
  bA.textContent = 'Actions';
  modBtns.append(bR, bI, bA);
  secMod.append(h4m, pHint, pRisksLbl, ulRisks, pInc, modBtns);

  body.append(secGen, secDang, secEpi, secSto, secUrg, secIa, secMod);
  art.append(head, summary, exploitNote, body);
  art.querySelector('.products-detail-close')?.addEventListener('click', () => {
    host.replaceChildren();
    host.hidden = true;
  });
  art.querySelector('.products-detail-copy')?.addEventListener('click', () => {
    const d = dangerTone(product.danger).label;
    const epi0 = (product.fdsEpi && product.fdsEpi[0]) || '—';
    const urg = (product.fdsRescue || '').slice(0, 400);
    const text = [
      `Produit : ${product.name}`,
      `CAS : ${product.cas}`,
      `Site : ${product.site}`,
      `Danger : ${d}`,
      `Mot-signal : ${product.signalWord || '—'}`,
      `EPI (extrait) : ${epi0}`,
      `Urgence / secours : ${urg || '—'}`
    ].join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast('Synthèse copiée dans le presse-papiers.', 'info'),
        () => showToast('Copie impossible — sélectionnez le texte manuellement.', 'warning')
      );
    } else {
      showToast('Copie non disponible dans ce navigateur.', 'warning');
    }
  });
  const iaBlock = art.querySelector('.products-detail-block--ia');
  const persistId = String(product.id || '');
  if (iaBlock && persistId.startsWith('prd-')) {
    const rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'btn btn-secondary products-detail-ia-refresh';
    rb.textContent = 'Régénérer l’analyse (locale)';
    rb.title = 'Simule une nouvelle passe IA locale — met à jour les listes sur la fiche enregistrée.';
    iaBlock.append(rb);
    rb.addEventListener('click', async () => {
      rb.disabled = true;
      rb.textContent = 'Analyse…';
      try {
        const stub = new File([''], String(product.fdsFileName || 'fds.pdf'), {
          type: 'application/pdf'
        });
        const data = await simulateFdsIaExtraction(stub);
        const inc = Array.isArray(data.iaInconsistencies) ? data.iaInconsistencies : [];
        const act = Array.isArray(data.iaSuggestedActions) ? data.iaSuggestedActions : [];
        const rows = loadPersistedProducts();
        const ix = rows.findIndex((r) => r.id === product.id);
        if (ix === -1) {
          showToast('Fiche introuvable en stockage local.', 'error');
          return;
        }
        rows[ix].iaInconsistencies = [...inc];
        rows[ix].iaSuggestedActions = [...act];
        savePersistedProducts(rows);
        const merged = { ...rows[ix] };
        renderProductDetail(merged, host);
        showToast('Analyse IA régénérée — validation humaine toujours requise pour toute décision.', 'info');
      } finally {
        rb.disabled = false;
        rb.textContent = 'Régénérer l’analyse (locale)';
      }
    });
  }
  art.querySelector('.products-goto-incidents')?.addEventListener('click', () => {
    qhseNavigate('incidents');
  });
  art.querySelector('.products-goto-risks')?.addEventListener('click', () => {
    qhseNavigate('risks');
  });
  art.querySelector('.products-goto-actions')?.addEventListener('click', () => {
    qhseNavigate('actions');
  });
  host.append(art);
}

function buildKpiAndVizCard(products) {
  const card = document.createElement('article');
  card.className = 'content-card card-soft products-kpi-card';
  const n = products.length;
  const nd = countDangerousProducts(products);
  const dist = dangerDistribution(products);
  const alerts = computeAlerts(products);
  const maxBar = Math.max(dist.el, dist.mo, dist.fa, 1);

  const kpiHead = document.createElement('div');
  kpiHead.className = 'content-card-head';
  const kpiHeadInner = document.createElement('div');
  const kpiKicker = document.createElement('div');
  kpiKicker.className = 'section-kicker';
  kpiKicker.textContent = 'Pilotage substances';
  const kpiH3 = document.createElement('h3');
  kpiH3.textContent = 'Vue d’ensemble';
  const kpiLead = document.createElement('p');
  kpiLead.className = 'content-card-lead';
  kpiLead.textContent =
    'Indicateurs calculés sur le registre affiché (navigateur ou API selon configuration).';
  kpiHeadInner.append(kpiKicker, kpiH3, kpiLead);
  kpiHead.append(kpiHeadInner);

  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'products-kpi-grid';
  function mkKpiTile(label, val, extraCls = '') {
    const tile = document.createElement('div');
    tile.className = `products-kpi-tile${extraCls ? ` ${extraCls}` : ''}`;
    const lbl = document.createElement('span');
    lbl.className = 'products-kpi-label';
    lbl.textContent = label;
    const v = document.createElement('span');
    v.className = 'products-kpi-val';
    v.textContent = String(val);
    tile.append(lbl, v);
    return tile;
  }
  kpiGrid.append(
    mkKpiTile('Produits', n),
    mkKpiTile('Dangereux (élevé)', nd, 'products-kpi-tile--alert'),
    mkKpiTile('Alertes actives', alerts.length)
  );

  const distBlock = document.createElement('div');
  distBlock.className = 'products-dist-block';
  const distTitle = document.createElement('h4');
  distTitle.className = 'products-dist-title';
  distTitle.textContent = 'Répartition des dangers';
  const distBars = document.createElement('div');
  distBars.className = 'products-dist-bars';
  distBars.setAttribute('role', 'img');
  distBars.setAttribute('aria-label', 'Répartition danger élevé, moyen, faible');
  function mkDistRow(label, count, fillCls) {
    const row = document.createElement('div');
    row.className = 'products-dist-row';
    const lab = document.createElement('span');
    lab.textContent = label;
    const track = document.createElement('div');
    track.className = 'products-dist-track';
    const fill = document.createElement('i');
    fill.className = `products-dist-fill ${fillCls}`;
    fill.style.width = `${Math.round((count / maxBar) * 100)}%`;
    track.append(fill);
    const num = document.createElement('span');
    num.textContent = String(count);
    row.append(lab, track, num);
    return row;
  }
  distBars.append(
    mkDistRow('Élevé', dist.el, 'products-dist-fill--el'),
    mkDistRow('Moyen', dist.mo, 'products-dist-fill--mo'),
    mkDistRow('Faible', dist.fa, 'products-dist-fill--fa')
  );
  distBlock.append(distTitle, distBars);

  const alertsBlock = document.createElement('div');
  alertsBlock.className = 'products-alerts-block';
  const alertsTitle = document.createElement('h4');
  alertsTitle.className = 'products-alerts-title';
  alertsTitle.textContent = 'Alertes';
  alertsBlock.append(alertsTitle);
  if (alerts.length === 0) {
    const es = createEmptyState(
      '\u26A0',
      'Aucune alerte',
      'RAS sur le périmètre et la période affichés pour ce bandeau.'
    );
    es.classList.add('empty-state--products-kpi');
    alertsBlock.append(es);
  } else {
    const ul = document.createElement('ul');
    ul.className = 'products-alerts-list';
    for (const a of alerts.slice(0, 8)) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'products-alert-link';
      btn.dataset.pid = String(a.product.id);
      btn.textContent = a.text;
      li.append(btn);
      ul.append(li);
    }
    alertsBlock.append(ul);
  }

  card.append(kpiHead, kpiGrid, distBlock, alertsBlock);
  return card;
}

function bindAlertLinks(card, onPickProduct) {
  card.querySelectorAll('.products-alert-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-pid');
      const p = getAllProducts().find((x) => x.id === id);
      if (p && typeof onPickProduct === 'function') onPickProduct(p);
    });
  });
}

function buildTerrainStrip(products, onOpenDetail, onGoImport) {
  const wrap = document.createElement('div');
  wrap.className = 'content-card card-soft products-terrain-card';
  const dangerous = products.filter((p) => isDangerElev(p));
  const list = dangerous.length ? dangerous : products;
  let pick = list[0];
  if (!pick) {
    const es =
      typeof onGoImport === 'function'
        ? createEmptyState(
            '\u2697',
            'Aucun produit pour la vue terrain',
            'Ajoutez une fiche ou importez une FDS pour afficher les raccourcis sécurité.',
            'Importer une FDS',
            onGoImport
          )
        : createEmptyState('\u2697', 'Aucun produit enregistré', '');
    es.classList.add('empty-state--products-terrain');
    wrap.append(es);
    return wrap;
  }

  const head = document.createElement('div');
  head.className = 'products-terrain-head';
  const kicker = document.createElement('span');
  kicker.className = 'products-terrain-kicker';
  kicker.textContent = 'Vue Essentiel';
  const title = document.createElement('h3');
  title.className = 'products-terrain-title';
  title.textContent = `Accès rapide — ${pick.name}`;

  const grid = document.createElement('div');
  grid.className = 'products-terrain-grid';

  function fillTerrainCells(host, p) {
    host.replaceChildren();
    const epi = (p.fdsEpi && p.fdsEpi[0]) || '—';
    const rescue = p.fdsRescue || '';
    const rescueShort = rescue.length > 160 ? `${rescue.slice(0, 160)}…` : rescue;

    const c1 = document.createElement('div');
    c1.className = 'products-terrain-cell products-terrain-cell--danger';
    const l1 = document.createElement('span');
    l1.className = 'products-terrain-lbl';
    l1.textContent = 'Danger';
    const v1 = document.createElement('p');
    v1.className = 'products-terrain-val';
    v1.textContent = dangerTone(p.danger).label;
    const m1 = document.createElement('p');
    m1.className = 'products-terrain-mini';
    m1.textContent = p.signalWord || '';
    c1.append(l1, v1, m1);

    const c2 = document.createElement('div');
    c2.className = 'products-terrain-cell';
    const l2 = document.createElement('span');
    l2.className = 'products-terrain-lbl';
    l2.textContent = 'EPI (prioritaire)';
    const v2 = document.createElement('p');
    v2.className = 'products-terrain-val';
    v2.textContent = epi;
    c2.append(l2, v2);

    const c3 = document.createElement('div');
    c3.className = 'products-terrain-cell products-terrain-cell--urgent';
    const l3 = document.createElement('span');
    l3.className = 'products-terrain-lbl';
    l3.textContent = 'Urgence';
    const v3 = document.createElement('p');
    v3.className = 'products-terrain-val';
    v3.textContent = rescueShort;
    c3.append(l3, v3);

    host.append(c1, c2, c3);
  }

  head.append(kicker);
  if (list.length > 1) {
    const row = document.createElement('div');
    row.className = 'products-terrain-picker';
    const lab = document.createElement('label');
    lab.className = 'products-terrain-picker-label';
    lab.htmlFor = 'products-terrain-product-select';
    lab.textContent = 'Produit critique';
    const sel = document.createElement('select');
    sel.id = 'products-terrain-product-select';
    sel.className = 'control-select products-terrain-select';
    sel.setAttribute('aria-label', 'Choisir un produit (bandeau Essentiel)');
    list.forEach((p, idx) => {
      const o = document.createElement('option');
      o.value = String(idx);
      o.textContent = `${p.name} (CAS ${p.cas})`;
      if (p.id === pick.id) o.selected = true;
      sel.append(o);
    });
    row.append(lab, sel);
    head.append(title, row);
    sel.addEventListener('change', () => {
      const i = Number(sel.value);
      pick = list[Number.isFinite(i) ? i : 0] || pick;
      title.textContent = `Accès rapide — ${pick.name}`;
      fillTerrainCells(grid, pick);
    });
  } else {
    head.append(title);
  }

  fillTerrainCells(grid, pick);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary products-terrain-open-detail';
  btn.textContent = 'Fiche complète';
  btn.addEventListener('click', () => {
    if (typeof onOpenDetail === 'function') onOpenDetail(pick);
  });

  wrap.append(head, grid, btn);
  return wrap;
}

export function renderProducts() {
  ensureAuditProductsStyles();

  const productNavIntent = consumeDashboardIntent();
  const linkedRiskTitleHint =
    productNavIntent?.linkedRiskTitle != null && String(productNavIntent.linkedRiskTitle).trim()
      ? String(productNavIntent.linkedRiskTitle).trim().slice(0, 200)
      : '';
  const linkedRiskIdHint =
    productNavIntent?.linkedRiskId != null && String(productNavIntent.linkedRiskId).trim()
      ? String(productNavIntent.linkedRiskId).trim()
      : '';
  let fdsValidityNav = '';
  {
    const v = productNavIntent?.productsFdsValidity;
    if (v != null) {
      const k = String(v).trim().toLowerCase();
      if (k === 'expired' || k === 'missing' || k === 'review') fdsValidityNav = k;
    }
  }
  let fdsValidityNavToastDone = false;

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas audit-products-page products-page--premium';

  const header = document.createElement('header');
  header.className = 'products-page-header content-card card-soft';
  header.innerHTML = `
    <div class="products-page-header__inner">
      <div class="section-kicker">Substances dangereuses</div>
      <h1 class="products-page-title">Produits &amp; FDS</h1>
      <p class="products-page-lead">
        La <strong>fiche structurée</strong> (dangers, EPI, secours…) est l’outil terrain ; le PDF n’est qu’une pièce jointe. Import → contrôle humain → registre local.
      </p>
      <p class="products-flow-inline" aria-label="Étapes">Import · Assistant IA · Validation humaine · Registre</p>
    </div>
  `;

  const kpiHost = document.createElement('div');
  kpiHost.className = 'products-kpi-host';

  const terrainHost = document.createElement('div');
  terrainHost.className = 'products-terrain-host';

  const importCard = document.createElement('article');
  importCard.className = 'content-card card-soft products-import-card';
  importCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Étape 1 — Import</div>
        <h3>Importer une FDS (PDF ou image)</h3>
        <p class="content-card-lead products-import-lead">
          <strong>PDF</strong> : extraction automatique côté serveur (sections 1, 3, 8 — H/P, GHS, VLEP, stockage).
          <strong>Image</strong> : préremplissage assisté local (sans OCR réel) — contrôle humain obligatoire.
        </p>
      </div>
    </div>
    <div class="products-fds-dropzone" tabindex="0" role="region" aria-label="Glisser-déposer une FDS PDF">
      <p class="products-fds-dropzone__title">Déposer une FDS PDF ici</p>
      <p class="products-fds-dropzone__hint">Relâchez le fichier ou choisissez-le ci-dessous — pictogrammes SGH détectés par analyse du texte.</p>
    </div>
    <div class="products-import-row">
      <label class="products-file-label">
        <span class="products-file-label__text">Fichier</span>
        <input type="file" class="products-fds-input" accept=".pdf,application/pdf,.png,.jpg,.jpeg,.webp,.gif,image/*" />
      </label>
      <button type="button" class="btn btn-primary products-extract-btn" disabled>Analyser la FDS</button>
    </div>
    <p class="products-ia-disclaimer" role="note">PDF : premier enregistrement dès l’analyse (brouillon en base) — corrigez puis confirmez. Images : IA indicative locale uniquement.</p>
  `;

  const validationCard = document.createElement('article');
  validationCard.className = 'content-card card-soft products-validation-card';
  validationCard.hidden = true;
  validationCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Étape 2 — Contrôle humain</div>
        <h3>Contrôle avant enregistrement</h3>
        <p class="content-card-lead">Alignez chaque champ sur la FDS officielle ; l’IA propose des pistes, pas des décisions.</p>
      </div>
    </div>
    <input type="hidden" class="products-fds-product-id" value="" />
    <p class="products-human-gate" role="status">
      <strong>Validation requise :</strong> contrôlez chaque champ contre la FDS officielle avant confirmation.
    </p>
    <div class="products-ia-preview" aria-live="polite">
      <h4 class="products-ia-preview-title">Analyse IA — à vérifier</h4>
      <div class="products-ia-preview-cols">
        <div>
          <p class="products-ia-preview-sub">Incohérences détectées</p>
          <ul class="products-ia-preview-list products-ia-inc-list"></ul>
        </div>
        <div>
          <p class="products-ia-preview-sub">Actions suggérées</p>
          <ul class="products-ia-preview-list products-ia-act-list"></ul>
        </div>
      </div>
    </div>
    <div class="products-validation-grid form-grid">
      <label class="field"><span>Nom produit</span><input type="text" class="control-input products-field-name" autocomplete="off" /></label>
      <label class="field"><span>Fournisseur / fabricant</span><input type="text" class="control-input products-field-supplier" autocomplete="off" /></label>
      <label class="field"><span>N° CAS</span><input type="text" class="control-input products-field-cas" autocomplete="off" /></label>
      <label class="field"><span>N° CE</span><input type="text" class="control-input products-field-ce" autocomplete="off" /></label>
      <label class="field"><span>Site / zone</span><input type="text" class="control-input products-field-site" autocomplete="off" /></label>
      <label class="field"><span>Criticité</span>
        <select class="control-select products-field-danger">
          <option value="faible">Faible</option>
          <option value="moyen">Moyen</option>
          <option value="élevé">Élevé</option>
        </select>
      </label>
      <label class="field"><span>Révision FDS (libellé)</span><input type="text" class="control-input products-field-revision" autocomplete="off" placeholder="MM/AAAA" /></label>
      <label class="field"><span>Validité FDS jusqu’au</span><input type="date" class="control-input products-field-valid-until" autocomplete="off" /></label>
      <label class="field"><span>Mot-signal</span><input type="text" class="control-input products-field-signal" autocomplete="off" /></label>
      <label class="field field-full"><span>Pictogrammes / mentions (une ligne chacune)</span>
        <textarea class="control-input products-field-pictograms" rows="2" autocomplete="off" placeholder="GHS05 Corrosif"></textarea>
      </label>
      <label class="field field-full"><span>EPI (une ligne par équipement)</span>
        <textarea class="control-input products-field-epi" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Stockage</span>
        <textarea class="control-input products-field-storage" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Secours / premiers secours</span>
        <textarea class="control-input products-field-rescue" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Mesures de prévention</span>
        <textarea class="control-input products-field-measures" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Phrases H (une par ligne)</span>
        <textarea class="control-input products-field-h-lines" rows="3" autocomplete="off" placeholder="H302&#10;H314"></textarea>
      </label>
      <label class="field field-full"><span>Conseils P (une par ligne)</span>
        <textarea class="control-input products-field-p-lines" rows="3" autocomplete="off" placeholder="P280&#10;P301+P310"></textarea>
      </label>
      <label class="field field-full"><span>VLEP / exposition (section 8)</span>
        <textarea class="control-input products-field-vlep" rows="2" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Classe de stockage</span>
        <input type="text" class="control-input products-field-storage-class" autocomplete="off" />
      </label>
      <label class="field field-full"><span>Mentions dangers / synthèse (texte libre)</span>
        <textarea class="control-input products-field-hazards" rows="3" autocomplete="off"></textarea>
      </label>
      <label class="field field-full"><span>Nom du document source</span>
        <input type="text" class="control-input products-field-filename" readonly />
      </label>
      <label class="field field-full products-human-confirm-wrap">
        <span class="products-human-confirm-label">
          <input type="checkbox" class="products-human-confirm-check" />
          Je confirme avoir vérifié chaque champ contre la <strong>FDS officielle</strong> fournisseur avant enregistrement.
        </span>
      </label>
    </div>
    <div class="products-validation-actions">
      <button type="button" class="btn btn-primary products-validate-btn">Confirmer et enregistrer</button>
      <button type="button" class="text-button products-cancel-draft-btn" style="font-weight:700">Annuler</button>
    </div>
  `;

  const listCard = document.createElement('article');
  listCard.className = 'content-card card-soft products-list-card';
  listCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Registre</div>
        <h3>Liste des produits</h3>
        <p class="content-card-lead">Cartes criticité, validité FDS et alertes — recherche locale.</p>
      </div>
    </div>
    <div class="products-toolbar">
      <input type="search" class="control-input products-search" placeholder="Rechercher un produit, un CAS, un site…" autocomplete="off" />
    </div>
  `;

  const listHost = document.createElement('div');
  listHost.className = 'products-list';
  listCard.append(listHost);

  const detailHost = document.createElement('div');
  detailHost.className = 'products-detail-host';
  detailHost.hidden = true;

  const fileInput = importCard.querySelector('.products-fds-input');
  const extractBtn = importCard.querySelector('.products-extract-btn');
  const dropzone = importCard.querySelector('.products-fds-dropzone');
  /** @type {File | null} */
  let pendingFile = null;
  let fdsServerFlow = false;

  const fieldName = validationCard.querySelector('.products-field-name');
  const fieldSupplier = validationCard.querySelector('.products-field-supplier');
  const fieldCas = validationCard.querySelector('.products-field-cas');
  const fieldCe = validationCard.querySelector('.products-field-ce');
  const fieldSite = validationCard.querySelector('.products-field-site');
  const fieldDanger = validationCard.querySelector('.products-field-danger');
  const fieldRevision = validationCard.querySelector('.products-field-revision');
  const fieldValidUntil = validationCard.querySelector('.products-field-valid-until');
  const fieldSignal = validationCard.querySelector('.products-field-signal');
  const fieldHazards = validationCard.querySelector('.products-field-hazards');
  const fieldFilename = validationCard.querySelector('.products-field-filename');
  const fieldPictograms = validationCard.querySelector('.products-field-pictograms');
  const fieldEpi = validationCard.querySelector('.products-field-epi');
  const fieldStorage = validationCard.querySelector('.products-field-storage');
  const fieldRescue = validationCard.querySelector('.products-field-rescue');
  const fieldMeasures = validationCard.querySelector('.products-field-measures');
  const fieldHLines = validationCard.querySelector('.products-field-h-lines');
  const fieldPLines = validationCard.querySelector('.products-field-p-lines');
  const fieldVlep = validationCard.querySelector('.products-field-vlep');
  const fieldStorageClass = validationCard.querySelector('.products-field-storage-class');
  const hiddenFdsProductId = validationCard.querySelector('.products-fds-product-id');
  const iaIncList = validationCard.querySelector('.products-ia-inc-list');
  const iaActList = validationCard.querySelector('.products-ia-act-list');

  function updateExtractButtonLabel() {
    if (!extractBtn || !pendingFile) return;
    const isPdf =
      (pendingFile.type && pendingFile.type.includes('pdf')) || /\.pdf$/i.test(pendingFile.name || '');
    extractBtn.textContent = isPdf ? 'Extraire le PDF (serveur)' : 'Lancer l’analyse IA';
  }

  function pictogramLinesToGhsCodes(text) {
    return uniqStrings(
      linesToArray(text).flatMap((line) => {
        const m = line.match(/\bGHS\s*0?([1-9])\b/gi);
        if (!m) return [];
        return m.map((x) => {
          const d = x.match(/0?([1-9])/i);
          return d ? `GHS0${d[1]}` : '';
        });
      })
    );
  }

  function fillIaPreview(inc, act) {
    if (iaIncList) {
      iaIncList.replaceChildren();
      (inc || []).forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        iaIncList.append(li);
      });
      if (!inc || !inc.length) {
        const li = document.createElement('li');
        li.className = 'products-ia-preview-empty';
        li.textContent = '—';
        iaIncList.append(li);
      }
    }
    if (iaActList) {
      iaActList.replaceChildren();
      (act || []).forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        iaActList.append(li);
      });
      if (!act || !act.length) {
        const li = document.createElement('li');
        li.className = 'products-ia-preview-empty';
        li.textContent = '—';
        iaActList.append(li);
      }
    }
  }

  function resetDraft() {
    pendingFile = null;
    fdsServerFlow = false;
    pendingIaSuggestedActions = [];
    pendingIaInconsistencies = [];
    if (fileInput) fileInput.value = '';
    if (extractBtn) {
      extractBtn.disabled = true;
      extractBtn.textContent = 'Analyser la FDS';
    }
    if (hiddenFdsProductId) hiddenFdsProductId.value = '';
    if (dropzone) dropzone.classList.remove('products-fds-dropzone--over');
    validationCard.hidden = true;
    fillIaPreview([], []);
    const hc = validationCard.querySelector('.products-human-confirm-check');
    if (hc) hc.checked = false;
  }

  function refreshKpi() {
    const products = getAllProducts();
    kpiHost.replaceChildren();
    const kpiCard = buildKpiAndVizCard(products);
    kpiHost.append(kpiCard);
    bindAlertLinks(kpiCard, (p) => {
      renderProductDetail(p, detailHost);
      detailHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    terrainHost.replaceChildren();
    if (isTerrainSessionRole()) {
      const strip = buildTerrainStrip(
        products,
        (p) => {
          renderProductDetail(p, detailHost);
          detailHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        },
        () => {
          importCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          fileInput?.focus();
        }
      );
      terrainHost.append(strip);
    }
  }

  fileInput?.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    pendingFile = f || null;
    if (extractBtn) extractBtn.disabled = !pendingFile;
    updateExtractButtonLabel();
  });

  if (dropzone && fileInput) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((ev) => {
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    dropzone.addEventListener('dragover', () => {
      dropzone.classList.add('products-fds-dropzone--over');
      dropzone.style.borderColor = 'var(--app-accent,#14b8a6)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('products-fds-dropzone--over');
      dropzone.style.borderColor = '';
    });
    dropzone.addEventListener('drop', (e) => {
      dropzone.classList.remove('products-fds-dropzone--over');
      dropzone.style.borderColor = '';
      const f = e.dataTransfer?.files?.[0];
      if (!f) return;
      const dt = new DataTransfer();
      dt.items.add(f);
      fileInput.files = dt.files;
      pendingFile = f;
      if (extractBtn) extractBtn.disabled = false;
      updateExtractButtonLabel();
      showToast(`Fichier « ${f.name} » prêt — lancez l’analyse.`, 'info');
    });
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
    dropzone.addEventListener('click', () => fileInput.click());
  }

  extractBtn?.addEventListener('click', async () => {
    if (!pendingFile) return;
    extractBtn.disabled = true;
    extractBtn.textContent = 'Analyse en cours…';
    try {
      const isPdf =
        (pendingFile.type && pendingFile.type.includes('pdf')) || /\.pdf$/i.test(pendingFile.name || '');
      if (isPdf) {
        fdsServerFlow = true;
        const { parsed, product } = await parseFdsPdfOnServer(pendingFile);
        if (hiddenFdsProductId && product?.id) hiddenFdsProductId.value = String(product.id);
        pendingIaSuggestedActions = [
          'Vérifier les phrases H/P et pictogrammes contre la FDS signée fournisseur.',
          'Compléter EPI, secours et mesures depuis les sections 6–8 si absentes du PDF.'
        ];
        pendingIaInconsistencies = [
          'Extraction automatique : les mises en page PDF varient — recouper chaque champ.'
        ];
        fillIaPreview(pendingIaInconsistencies, pendingIaSuggestedActions);

        const p = parsed || {};
        fieldName.value = p.productName || '';
        if (fieldSupplier) fieldSupplier.value = p.supplier || '';
        fieldCas.value = p.casNumber || '';
        if (fieldCe) fieldCe.value = p.ceNumber || '';
        fieldSite.value = appState.currentSite || '';
        fieldDanger.value = inferDangerFromHStatements(p.hStatements || []);
        fieldRevision.value = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        fieldSignal.value = '';
        if (fieldHLines) fieldHLines.value = (p.hStatements || []).join('\n');
        if (fieldPLines) fieldPLines.value = (p.pStatements || []).join('\n');
        fieldHazards.value = (p.hStatements || []).length
          ? `${(p.hStatements || []).join(' · ')}`
          : '';
        if (fieldVlep) fieldVlep.value = p.vlep || '';
        if (fieldStorageClass) fieldStorageClass.value = p.storageClass || '';
        if (fieldStorage) fieldStorage.value = p.storageClass || '';
        fieldFilename.value = pendingFile.name || '';
        if (fieldPictograms && Array.isArray(p.ghs)) {
          fieldPictograms.value = p.ghs.join('\n');
        }

        validationCard.hidden = false;
        validationCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showToast('PDF analysé — fiche créée ou mise à jour côté serveur. Corrigez puis confirmez.', 'info');
        try {
          await loadProductsFromApi();
          refreshList();
          refreshKpi();
        } catch {
          /* liste locale */
        }
      } else {
        fdsServerFlow = false;
        if (hiddenFdsProductId) hiddenFdsProductId.value = '';
        const data = await simulateFdsIaExtraction(pendingFile);
        pendingIaSuggestedActions = Array.isArray(data.iaSuggestedActions) ? [...data.iaSuggestedActions] : [];
        pendingIaInconsistencies = Array.isArray(data.iaInconsistencies) ? [...data.iaInconsistencies] : [];
        fillIaPreview(pendingIaInconsistencies, pendingIaSuggestedActions);

        fieldName.value = data.name || '';
        if (fieldSupplier) fieldSupplier.value = '';
        fieldCas.value = data.cas || '';
        if (fieldCe) fieldCe.value = '';
        fieldSite.value = data.site || '';
        fieldDanger.value = data.danger || 'moyen';
        fieldRevision.value = data.revision || '';
        fieldSignal.value = data.signalWord || '';
        fieldHazards.value = data.hazards || '';
        if (fieldHLines) fieldHLines.value = '';
        if (fieldPLines) fieldPLines.value = '';
        if (fieldVlep) fieldVlep.value = '';
        if (fieldStorageClass) fieldStorageClass.value = '';
        fieldFilename.value = pendingFile.name || '';
        if (fieldValidUntil && data.fdsValidUntil) fieldValidUntil.value = data.fdsValidUntil;
        if (fieldPictograms && Array.isArray(data.pictograms)) fieldPictograms.value = data.pictograms.join('\n');
        if (fieldEpi && Array.isArray(data.epi)) fieldEpi.value = data.epi.join('\n');
        if (fieldStorage) fieldStorage.value = data.storage || '';
        if (fieldRescue) fieldRescue.value = data.rescue || '';
        if (fieldMeasures) fieldMeasures.value = data.measures || '';

        validationCard.hidden = false;
        validationCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showToast('Analyse terminée — contrôlez chaque champ avant validation.', 'info');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Analyse impossible', 'error');
    } finally {
      extractBtn.disabled = !pendingFile;
      updateExtractButtonLabel();
    }
  });

  validationCard.querySelector('.products-cancel-draft-btn')?.addEventListener('click', () => {
    resetDraft();
    showToast('Brouillon annulé.', 'info');
  });

  validationCard.querySelector('.products-validate-btn')?.addEventListener('click', async () => {
    const humanConfirmed = validationCard.querySelector('.products-human-confirm-check')?.checked;
    if (!humanConfirmed) {
      showToast('Cochez la confirmation de contrôle humain contre la FDS officielle.', 'error');
      return;
    }
    const name = (fieldName.value || '').trim();
    const site = (fieldSite.value || '').trim();
    if (!name || !site) {
      showToast('Nom et site sont obligatoires.', 'error');
      return;
    }
    const cas = (fieldCas.value || '').trim();
    const hFromLines = linesToArray(fieldHLines?.value || '');
    const pFromLines = linesToArray(fieldPLines?.value || '');
    const ghsMerged = uniqStrings([
      ...pictogramLinesToGhsCodes(fieldPictograms?.value || ''),
      ...hFromLines
        .map((x) => {
          const m = x.match(/\bGHS\s*0?([1-9])\b/i);
          return m ? `GHS0${m[1]}` : '';
        })
        .filter(Boolean)
    ]);

    const serverProductId = (hiddenFdsProductId?.value || '').trim();
    if (fdsServerFlow && serverProductId) {
      try {
        await confirmFdsProductOnServer(serverProductId, {
          name,
          supplier: (fieldSupplier?.value || '').trim(),
          casNumber: cas,
          ceNumber: (fieldCe?.value || '').trim(),
          hStatements: hFromLines.length ? hFromLines : linesToArray(fieldHazards?.value || ''),
          pStatements: pFromLines,
          ghsPictograms: ghsMerged.length ? ghsMerged : pictogramLinesToGhsCodes(fieldPictograms?.value || ''),
          vlep: (fieldVlep?.value || '').trim(),
          storageClass: (fieldStorageClass?.value || '').trim()
        });
        await loadProductsFromApi();
        activityLogStore.add({
          module: 'products',
          action: 'FDS confirmée (serveur)',
          detail: `${name} — Product ${serverProductId}`,
          user: getSessionUser()?.name || 'Utilisateur'
        });
        showToast(`Produit « ${name} » enregistré (base chimique).`, 'success');
        resetDraft();
        refreshList();
        refreshKpi();
        const row = getAllProducts().find((x) => x.id === serverProductId);
        if (row) {
          renderProductDetail(row, detailHost);
          detailHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Enregistrement impossible', 'error');
      }
      return;
    }

    const id = makeProductId();
    const row = {
      id,
      name,
      cas: cas || '—',
      site,
      danger: fieldDanger.value || 'moyen',
      revision: (fieldRevision.value || '').trim() || '—',
      signalWord: (fieldSignal.value || '').trim() || '—',
      hazards: (fieldHazards.value || '').trim() || '—',
      fdsFileName: (fieldFilename.value || '').trim() || (pendingFile?.name ?? ''),
      fdsValidUntil: (fieldValidUntil && fieldValidUntil.value) || '',
      fdsPictograms: linesToArray(fieldPictograms?.value || ''),
      fdsEpi: linesToArray(fieldEpi?.value || ''),
      fdsStorage: (fieldStorage?.value || '').trim(),
      fdsRescue: (fieldRescue?.value || '').trim(),
      fdsMeasures: (fieldMeasures?.value || '').trim(),
      risksLinked: ['À qualifier selon FDS validée'],
      incidentsHint: 'Consulter le module Incidents pour les liens terrain.',
      fdsHumanValidated: true,
      iaSuggestedActions: [...pendingIaSuggestedActions],
      iaInconsistencies: [...pendingIaInconsistencies]
    };
    if (!pendingFile) {
      showToast('Ajoutez un fichier FDS avant validation.', 'error');
      return;
    }
    try {
      const created = await uploadFdsDocument({
        file: pendingFile,
        name,
        siteId: appState.activeSiteId || null
      });
      apiProductsLoaded = true;
      apiProducts = [mapControlledDocumentToProduct(created), ...apiProducts];
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Envoi FDS impossible', 'error');
      return;
    }
    activityLogStore.add({
      module: 'products',
      action: 'Produit enregistré (FDS)',
      detail: `${name} — validation humaine`,
      user: getSessionUser()?.name || 'Utilisateur'
    });
    showToast(`Produit « ${name} » enregistré via API.`, 'success');
    resetDraft();
    refreshList();
    refreshKpi();
    renderProductDetail(row, detailHost);
    detailHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  const input = listCard.querySelector('.products-search');

  function openProductFds(product) {
    if (apiProductsLoaded && product?.id && !String(product.id).startsWith('prd-')) {
      void downloadFdsById(product.id).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Téléchargement impossible', 'error');
      });
      return;
    }
    const url = fdsBlobUrlByProductId.get(product.id);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    showToast(
      `Aucune pièce jointe en session pour « ${product.name} » — la fiche repose sur les champs saisis.`,
      'info'
    );
  }

  function refreshList() {
    const q = (input.value || '').trim().toLowerCase();
    listHost.replaceChildren();
    const all = getAllProducts();
    let filtered = all.filter((p) => matchesFilter(p, q));
    if (fdsValidityNav) {
      filtered = filtered.filter((p) => {
        if (fdsValidityNav === 'expired') return isFdsExpired(p);
        if (fdsValidityNav === 'missing') return !String(p.fdsValidUntil || '').trim();
        if (fdsValidityNav === 'review') {
          const ms = parseValidUntilMs(p.fdsValidUntil);
          return (
            !String(p.fdsValidUntil || '').trim() ||
            ms == null ||
            ms < Date.now() + 30 * 86400000
          );
        }
        return true;
      });
    }
    filtered.forEach((p) =>
      listHost.append(
        createProductRow(p, {
          onDetail: (pr) => {
            renderProductDetail(pr, detailHost);
            detailHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          },
          onFds: openProductFds
        })
      )
    );
    if (!listHost.children.length) {
      const hasQuery = q.length > 0;
      const es = hasQuery
        ? createEmptyState(
            '\u25CE',
            'Aucun résultat',
            'Aucun produit ne correspond à votre recherche.',
            'Réinitialiser la recherche',
            () => {
              input.value = '';
              refreshList();
            }
          )
        : createEmptyState(
            '\u2697',
            'Registre vide',
            'Importez une FDS ou complétez une fiche produit.',
            'Importer une FDS',
            () => {
              importCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
              fileInput?.focus();
            }
          );
      es.classList.add('empty-state--products-list');
      listHost.append(es);
    }
  }

  input.addEventListener('input', refreshList);

  const bar = document.createElement('div');
  bar.className = 'products-actions-bar';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-primary';
  addBtn.textContent = 'Importer une FDS';
  addBtn.addEventListener('click', () => {
    importCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    fileInput?.focus();
  });
  bar.append(addBtn);

  page.append(header, kpiHost, terrainHost, importCard, validationCard, listCard, detailHost, bar);

  const draft = readImportDraft();
  if (draft?.targetPageId === 'products' && draft.prefillData && typeof draft.prefillData === 'object') {
    const pd = draft.prefillData;
    validationCard.hidden = false;
    if (pd.name != null) fieldName.value = String(pd.name);
    if (pd.cas != null) fieldCas.value = String(pd.cas);
    if (pd.site != null) fieldSite.value = String(pd.site);
    if (pd.danger != null) fieldDanger.value = String(pd.danger);
    if (pd.revision != null) fieldRevision.value = String(pd.revision);
    if (pd.signalWord != null) fieldSignal.value = String(pd.signalWord);
    if (pd.hazards != null) fieldHazards.value = String(pd.hazards);
    if (pd.fdsFileName != null) fieldFilename.value = String(pd.fdsFileName);
    showToast('Brouillon import appliqué — contrôlez puis validez.', 'info');
    clearImportDraft();
  }

  (async () => {
    try {
      await loadProductsFromApi();
    } catch (err) {
      console.error('[products] GET /api/controlled-documents', err);
      showToast('Chargement FDS API impossible — mode local.', 'warning');
    } finally {
      refreshKpi();
      if (linkedRiskTitleHint && input) {
        input.value = linkedRiskTitleHint;
      }
      refreshList();
      if (fdsValidityNav && !fdsValidityNavToastDone) {
        fdsValidityNavToastDone = true;
        const map = {
          expired: 'FDS expirées (date de validité passée).',
          missing: 'FDS sans date de validité enregistrée.',
          review: 'FDS à réviser (échéance dans 30 j. ou date manquante).'
        };
        showToast(`Vue Produits filtrée depuis le tableau de bord : ${map[fdsValidityNav] || 'Filtre FDS.'}`, 'info');
      }
      if (linkedRiskTitleHint || linkedRiskIdHint) {
        showToast(
          linkedRiskTitleHint
            ? `Contexte risque — recherche préremplie (« ${
                linkedRiskTitleHint.length > 72
                  ? `${linkedRiskTitleHint.slice(0, 72)}…`
                  : linkedRiskTitleHint
              } »).`
            : 'Registre produits — contexte risque transmis ; recherche à affiner si besoin.',
          'info'
        );
      }
    }
  })();
  return page;
}
