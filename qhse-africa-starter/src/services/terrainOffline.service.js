import { qhseFetch } from '../utils/qhseFetch.js';

const DB_NAME = 'qhse-terrain-db';
const DB_VERSION = 1;
const STORE_INCIDENTS = 'incident-queue';
const STORE_RISKS = 'risk-queue';
const MAX_RETRY = 5;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 10000, 30000];

// ── IndexedDB helpers ──────────────────────────────────────

function openTerrainDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_INCIDENTS)) {
        db.createObjectStore(STORE_INCIDENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RISKS)) {
        db.createObjectStore(STORE_RISKS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(storeName) {
  return openTerrainDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}

function dbPut(storeName, item) {
  return openTerrainDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function dbDelete(storeName, id) {
  return openTerrainDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function requestBackgroundSync(tag) {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.sync) await reg.sync.register(tag);
  } catch {
    // Browser ne supporte pas Background Sync
  }
}

// ── API publique ───────────────────────────────────────────

export async function queueTerrainIncident(draft) {
  const item = { id: genId('inc'), createdAt: new Date().toISOString(), retryCount: 0, failed: false, ...draft };
  await dbPut(STORE_INCIDENTS, item);
  await requestBackgroundSync('terrain-incident-sync');
  if (navigator.onLine) syncTerrainIncidentQueue().catch(() => {});
  return item;
}

export async function queueTerrainRisk(draft) {
  const item = { id: genId('risk'), createdAt: new Date().toISOString(), retryCount: 0, failed: false, ...draft };
  await dbPut(STORE_RISKS, item);
  await requestBackgroundSync('terrain-risk-sync');
  if (navigator.onLine) syncTerrainRiskQueue().catch(() => {});
  return item;
}

export async function getTerrainQueueState() {
  const [incidents, risks] = await Promise.all([
    dbGetAll(STORE_INCIDENTS),
    dbGetAll(STORE_RISKS)
  ]);
  return {
    pendingIncidents: incidents.filter(i => !i.failed).length,
    pendingRisks: risks.filter(r => !r.failed).length,
    failedIncidents: incidents.filter(i => i.failed).length,
    failedRisks: risks.filter(r => r.failed).length,
    online: navigator.onLine
  };
}

export async function syncTerrainIncidentQueue() {
  const items = await dbGetAll(STORE_INCIDENTS);
  const pending = items.filter(i => !i.failed);
  let synced = 0, failed = 0;

  for (const item of pending) {
    try {
      const res = await qhseFetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        await dbDelete(STORE_INCIDENTS, item.id);
        synced++;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      const retryCount = (item.retryCount || 0) + 1;
      if (retryCount >= MAX_RETRY) {
        await dbPut(STORE_INCIDENTS, { ...item, retryCount, failed: true });
        failed++;
      } else {
        await dbPut(STORE_INCIDENTS, { ...item, retryCount });
        const delay = RETRY_DELAYS_MS[retryCount - 1] || 30000;
        setTimeout(() => syncTerrainIncidentQueue(), delay);
      }
    }
  }
  return { synced, pending: pending.length - synced, failed };
}

export async function syncTerrainRiskQueue() {
  const items = await dbGetAll(STORE_RISKS);
  const pending = items.filter(r => !r.failed);
  let synced = 0, failed = 0;

  for (const item of pending) {
    try {
      const res = await qhseFetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        await dbDelete(STORE_RISKS, item.id);
        synced++;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      const retryCount = (item.retryCount || 0) + 1;
      if (retryCount >= MAX_RETRY) {
        await dbPut(STORE_RISKS, { ...item, retryCount, failed: true });
        failed++;
      } else {
        await dbPut(STORE_RISKS, { ...item, retryCount });
        const delay = RETRY_DELAYS_MS[retryCount - 1] || 30000;
        setTimeout(() => syncTerrainRiskQueue(), delay);
      }
    }
  }
  return { synced, pending: pending.length - synced, failed };
}

export async function syncAllTerrainQueues() {
  const [incidents, risks] = await Promise.all([
    syncTerrainIncidentQueue(),
    syncTerrainRiskQueue()
  ]);
  window.dispatchEvent(new CustomEvent('qhse-terrain-sync-done', { detail: { incidents, risks } }));
  return { incidents, risks };
}

export async function getFailedQueueItems() {
  const [incidents, risks] = await Promise.all([
    dbGetAll(STORE_INCIDENTS),
    dbGetAll(STORE_RISKS)
  ]);
  return {
    incidents: incidents.filter(i => i.failed),
    risks: risks.filter(r => r.failed)
  };
}

export async function retryFailedItems() {
  const [incidents, risks] = await Promise.all([
    dbGetAll(STORE_INCIDENTS),
    dbGetAll(STORE_RISKS)
  ]);
  await Promise.all([
    ...incidents.filter(i => i.failed).map(i => dbPut(STORE_INCIDENTS, { ...i, retryCount: 0, failed: false })),
    ...risks.filter(r => r.failed).map(r => dbPut(STORE_RISKS, { ...r, retryCount: 0, failed: false }))
  ]);
  return syncAllTerrainQueues();
}
