import fs from 'node:fs';

const p = 'src/pages/incidents.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');
const start = 783;
const end = 1993;
const insert = [
  '  const declareFlow = setupIncidentDeclareFlow({',
  '    btnDeclare,',
  '    btnTerrain,',
  '    getIncidentRecords: () => incidentRecords,',
  '    onDeclared(entry) {',
  '      incidentRecords = [entry, ...incidentRecords.filter((r) => r.ref !== entry.ref)];',
  "      apiLoadState = 'ok';",
  '      refreshList();',
  '    },',
  '    refreshList,',
  '    refreshIncidentJournal,',
  '    onAddLog',
  '  });',
  '  const openDeclarePanel = () => declareFlow.openDeclare();',
  ''
].join('\n');

const out = [...lines.slice(0, start), insert, ...lines.slice(end)].join('\n');
fs.writeFileSync(p, out, 'utf8');
console.log('lines', out.split('\n').length);
