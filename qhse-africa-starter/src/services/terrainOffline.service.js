import { qhseFetch } from '../utils/qhseFetch.js';

const INCIDENT_QUEUE_KEY = 'qhse.terrain.incident.queue.v1';

function readQueue() {
  try {
    const raw = localStorage.getItem(INCIDENT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  localStorage.setItem(INCIDENT_QUEUE_KEY, JSON.stringify(items));
}

function canUseNetwork() {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

function toIncidentPayload(draft) {
  const sev = draft.severity === 'critical' ? 'CRITICAL' : 'HIGH';
  return {
    title: draft.title || 'Incident terrain',
    description: draft.description || '',
    severity: sev,
    siteName: draft.zone || '',
    source: 'FIELD'
  };
}

export async function queueTerrainIncident(draft) {
  const queued = {
    id: `terr_inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...draft
  };
  const q = readQueue();
  q.push(queued);
  writeQueue(q);
  if (canUseNetwork()) {
    await syncTerrainIncidentQueue();
  }
  return queued;
}

export function getTerrainQueueState() {
  return { pendingIncidents: readQueue().length, online: canUseNetwork() };
}

export async function syncTerrainIncidentQueue() {
  if (!canUseNetwork()) return { synced: 0, pending: readQueue().length };
  const q = readQueue();
  if (!q.length) return { synced: 0, pending: 0 };
  const remains = [];
  let synced = 0;
  for (const item of q) {
    try {
      const res = await qhseFetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toIncidentPayload(item))
      });
      if (res.ok) synced += 1;
      else remains.push(item);
    } catch {
      remains.push(item);
    }
  }
  writeQueue(remains);
  return { synced, pending: remains.length };
}
