import fs from 'node:fs';

const srcPath = 'src/pages/incidents.js';
const outPath = 'src/components/incidentFormDialog.js';

const lines = fs.readFileSync(srcPath, 'utf8').split('\n');
const start = 1104;
const end = 2762;
const body = lines.slice(start, end).join('\n');

const header = `import { siteOptions } from '../data/navigation.js';
import { appState } from '../utils/state.js';
import { showToast } from './toast.js';
import { createSeveritySegment } from './severitySegment.js';
import { getApiBase } from '../config.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { readImportDraft, clearImportDraft } from '../utils/importDraft.js';
import { getRiskTitlesForSelect, formatRiskLinkTag } from '../utils/riskIncidentLinks.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { mapApiIncident, formatIsoDateToFr, normalizeSeverity } from '../utils/incidentsMappers.js';

const INCIDENT_TYPES = [
  'Quasi-accident',
  'Accident',
  'Environnement',
  'Sécurité',
  'Engin / circulation',
  'Autre'
];

const CAUSE_CATEGORY_CHIPS = [
  ['humain', 'Humain'],
  ['materiel', 'Matériel'],
  ['organisation', 'Organisation'],
  ['mixte', 'Mixte']
];

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('lecture fichier'));
    r.readAsDataURL(file);
  });
}

function computeNextRef(list) {
  const nums = list.map((r) => {
    const m = /^INC-(\\d+)$/i.exec(r.ref);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 200;
  return \`INC-\${max + 1}\`;
}

const INCIDENTS_SLIDEOVER_STYLE_ID = 'qhse-incidents-slideover';

function ensureIncidentsSlideOverStyles() {
  if (document.getElementById(INCIDENTS_SLIDEOVER_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = INCIDENTS_SLIDEOVER_STYLE_ID;
  el.textContent = \`
.inc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}
.inc-overlay--open {
  opacity: 1;
  pointer-events: all;
}
.inc-slideover {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(440px, 100vw);
  max-width: 100vw;
  background: var(--bg, #0f172a);
  border-left: 1px solid rgba(255,255,255,.09);
  z-index: 201;
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
@media (max-width: 520px) {
  .inc-slideover { width: 100vw; }
  .incidents-rapid-nav .btn { min-height: 48px; font-size: 15px; }
}
.inc-slideover--open {
  transform: translateX(0);
}
.inc-slideover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,.065);
  flex-shrink: 0;
}
.inc-slideover__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text, rgba(255,255,255,.9));
}
.inc-slideover__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 0.5px solid rgba(255,255,255,.1);
  background: transparent;
  color: var(--text2, rgba(255,255,255,.5));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.inc-slideover__close:hover {
  background: rgba(255,255,255,.07);
  color: var(--text, rgba(255,255,255,.88));
}
.inc-slideover__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 20px;
}
\`;
  document.head.append(el);
}

/**
 * @param {object} ctx
 * @returns {{ openDeclare: () => void, quick: HTMLElement, slideOver: { open: (el: HTMLElement) => void, close: () => void } }}
 */
export function setupIncidentDeclareFlow(ctx) {
  const {
    btnDeclare,
    btnTerrain,
    getIncidentRecords,
    onDeclared,
    refreshList,
    refreshIncidentJournal,
    onAddLog
  } = ctx;

`;

const footer = `
  return { openDeclare: () => slideOver.open(quick), quick, slideOver };
}
`;

let mid = body
  .replace(/const ref = computeNextRef\(incidentRecords\);/g, 'const ref = computeNextRef(getIncidentRecords());')
  .replace(
    /incidentRecords = \[entry, \.\.\.incidentRecords\.filter\(\(r\) => r\.ref !== entry\.ref\)\];\r?\n\s*apiLoadState = 'ok';\r?\n\s*refreshList\(\);/,
    'onDeclared(entry);'
  );

const out = `${header}\n${mid}\n${footer}`;
fs.writeFileSync(outPath, out, 'utf8');
console.log('wrote', outPath, out.split('\n').length);
