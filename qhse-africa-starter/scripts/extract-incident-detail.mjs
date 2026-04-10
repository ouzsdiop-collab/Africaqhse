import fs from 'node:fs';
const s = fs.readFileSync('src/pages/incidents.js', 'utf8');
const lines = s.split('\n');
const out = lines.slice(1812, 2273).join('\n');
fs.writeFileSync('src/components/_incidentDetailBody.txt', out, 'utf8');
console.log('wrote', out.split('\n').length, 'lines');
