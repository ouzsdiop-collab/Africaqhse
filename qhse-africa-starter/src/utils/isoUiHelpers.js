/**
 * Libellés / badges ISO et preuves importées : extrait de pages/iso.js.
 */

import { getImportedDocumentProofs } from '../data/conformityStore.js';

export function conformityBadgeClass(st) {
  if (st === 'conforme') return 'badge badge--ok';
  if (st === 'non_conforme') return 'badge badge--err';
  if (st === 'partiel') return 'badge badge--warn';
  return 'badge';
}

export function conformityLabel(st) {
  if (st === 'conforme') return 'Conforme';
  if (st === 'non_conforme') return 'Non conforme';
  if (st === 'partiel') return 'Partiel';
  return 'Non disponible';
}

export function formatIsoDateShort(v) {
  if (!v) return 'Non disponible';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Non disponible';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function docComplianceBadgeClass(st) {
  if (st === 'conforme') return 'badge badge--ok';
  if (st === 'non_conforme') return 'badge badge--err';
  if (st === 'partiel') return 'badge badge--warn';
  return 'badge';
}

export function importedProofStatusLabel(st) {
  if (st === 'conforme') return 'Conforme';
  if (st === 'non_conforme') return 'Non conforme';
  if (st === 'partiel') return 'Partiel';
  return 'Non disponible';
}

export function formatEvidenceWithImports(baseEvidence, requirementId) {
  const base = String(baseEvidence || '').trim();
  const imported = getImportedDocumentProofs(requirementId);
  if (!imported.length) return base || 'Non disponible';
  const lines = imported.map((p) => {
    const label = p.label || p.fileName || 'Document importé';
    const status = importedProofStatusLabel(p.status);
    const date = formatIsoDateShort(p.uploadedAt);
    return `${label} : ${status} · ${date}`;
  });
  const merged = [base, ...lines].filter(Boolean).join('\n');
  return merged || 'Non disponible';
}
