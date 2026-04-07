import { activityLogStore } from '../data/activityLog.js';

const STORAGE_KEY = 'qhse.module.links.v1';

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function keyOf(link) {
  return `${link.fromModule}:${link.fromId}->${link.toModule}:${link.toId}:${link.kind || ''}`;
}

export function linkModules(link) {
  const item = {
    id: `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    kind: link.kind || 'related',
    fromModule: link.fromModule,
    fromId: String(link.fromId || ''),
    toModule: link.toModule,
    toId: String(link.toId || ''),
    label: link.label || ''
  };
  if (!item.fromId || !item.toId) return null;
  const items = readRaw();
  const k = keyOf(item);
  if (!items.some((x) => keyOf(x) === k)) {
    items.push(item);
    writeRaw(items);
    activityLogStore.add({
      module: 'journal',
      action: 'Lien inter-modules créé',
      detail: `${item.fromModule}:${item.fromId} → ${item.toModule}:${item.toId}`,
      user: 'Système'
    });
  }
  return item;
}

export function getLinksFor(moduleName, id) {
  const ref = String(id || '');
  if (!ref) return [];
  return readRaw().filter(
    (x) =>
      (x.fromModule === moduleName && x.fromId === ref) ||
      (x.toModule === moduleName && x.toId === ref)
  );
}
