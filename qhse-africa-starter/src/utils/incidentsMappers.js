/** Mapping API / affichage incidents — partagé page + composants (évite imports circulaires). */

export function parsePhotosFromApiRow(row) {
  const raw = row?.photosJson;
  if (!raw || typeof raw !== 'string') return [];
  try {
    const j = JSON.parse(raw);
    if (!Array.isArray(j)) return [];
    return j.filter((x) => typeof x === 'string' && x.startsWith('data:image'));
  } catch {
    return [];
  }
}

export function normalizeSeverity(label) {
  const t = String(label).toLowerCase();
  if (t.includes('critique')) return 'critique';
  if (t.includes('faible')) return 'faible';
  return 'moyen';
}

export function formatDateFromIso(iso) {
  if (!iso) return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

export function formatIsoDateToFr(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export function incidentTitleFromRow(row) {
  const raw = (row.description || '').trim();
  if (raw) {
    const line = raw.split(/\r?\n/)[0].trim();
    return line.length > 76 ? `${line.slice(0, 73)}…` : line;
  }
  return `${row.type} · ${row.site}`;
}

/**
 * @param {Record<string, unknown>} row
 */
export function mapApiIncident(row) {
  if (!row || typeof row !== 'object' || !row.ref) return null;
  const createdAtMs = row.createdAt ? new Date(row.createdAt).getTime() : Date.now();
  const sev = normalizeSeverity(row.severity);
  const rawId = row.id ?? row._id;
  return {
    ...(rawId != null && String(rawId).trim()
      ? { id: String(rawId).trim() }
      : {}),
    ref: row.ref,
    type: row.type,
    site: row.site,
    severity: sev,
    status: row.status ?? 'Nouveau',
    date: formatDateFromIso(row.createdAt),
    createdAt: row.createdAt ?? null,
    createdAtMs,
    description: typeof row.description === 'string' ? row.description : '',
    location: typeof row.location === 'string' ? row.location : '',
    causes: typeof row.causes === 'string' ? row.causes : '',
    causeCategory: typeof row.causeCategory === 'string' ? row.causeCategory : '',
    photos: parsePhotosFromApiRow(row),
    responsible: typeof row.responsible === 'string' ? row.responsible : ''
  };
}

export function mapRowToDisplay(inc) {
  return {
    ...inc,
    title: incidentTitleFromRow(inc)
  };
}
