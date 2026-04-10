import fs from 'node:fs';

const p = 'src/pages/incidents.js';
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('  function renderDetailEmpty(message) {');
const end = s.indexOf('  function syncListSelectionVisual() {');
if (start < 0 || end < 0 || end <= start) throw new Error('markers');

const patchBlock = `  function renderDetailEmpty(message) {
    mountIncidentDetailEmpty(detailInner, message);
  }

  async function patchIncidentStatus(inc, newStatus, selectEl) {
    selectEl.disabled = true;
    try {
      const res = await qhseFetch(
        \`/api/incidents/\${encodeURIComponent(inc.ref)}\`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );
      if (!res.ok) {
        let msg = 'Mise à jour impossible';
        try {
          const b = await res.json();
          if (b.error) msg = b.error;
        } catch {
          /* ignore */
        }
        showToast(msg, 'error');
        selectEl.value = inc.status;
        return;
      }
      const updated = await res.json();
      const entry = mapApiIncident(updated);
      if (!entry) {
        showToast('Réponse serveur inattendue', 'error');
        selectEl.value = inc.status;
        return;
      }
      const idx = incidentRecords.findIndex((r) => r.ref === entry.ref);
      if (idx >= 0) incidentRecords[idx] = entry;
      else incidentRecords = [entry, ...incidentRecords];
      showToast(\`Statut : \${newStatus}\`, 'info');
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'incidents',
          action: 'Statut incident',
          detail: \`\${inc.ref} → \${newStatus}\`,
          user: getSessionUser()?.name || 'Responsable QHSE'
        });
      }
      refreshIncidentJournal();
      refreshList();
    } catch (err) {
      console.error('[incidents] PATCH', err);
      showToast('Erreur réseau', 'error');
      selectEl.value = inc.status;
    } finally {
      selectEl.disabled = !canWriteIncidents;
    }
  }

  const detailCtx = {
    get incidentRecords() {
      return incidentRecords;
    },
    patchIncidentStatus,
    onAddLog,
    refreshIncidentJournal,
    canWriteIncidents,
    canWriteActions
  };

`;

s = s.slice(0, start) + patchBlock + s.slice(end);

const dup = s.indexOf('  async function patchIncidentStatus(inc, newStatus, selectEl) {', start + patchBlock.length);
if (dup < 0) throw new Error('dup not found');
const dupEnd = s.indexOf('  function refreshList() {', dup);
if (dupEnd < 0) throw new Error('dupEnd');
s = s.slice(0, dup) + s.slice(dupEnd);

fs.writeFileSync(p, s);
console.log('lines', s.split('\n').length);
