import { createDashboardKpiCard } from './dashboardKpiCard.js';
import { createSkeletonCard } from '../utils/designSystem.js';

/** 5 KPI « above the fold » : notes courtes ; détail = drawer au clic. */
export const DASHBOARD_KPI_SPECS = [
  { key: 'incidents', label: 'Incidents', note: 'Périmètre courant', tone: 'amber' },
  { key: 'ncOpen', label: 'NC ouvertes', note: 'Non clos', tone: 'amber' },
  {
    key: 'actionsLate',
    label: 'Actions en retard',
    note: 'Hors clôturées',
    tone: 'red',
    zeroSuccessMessage: 'Aucune action en retard'
  },
  { key: 'auditScore', label: 'Score audits', note: 'Moyenne', tone: 'green' },
  { key: 'auditsN', label: 'Audits', note: 'Cette vue', tone: 'blue' }
];

/**
 * Grille KPI dashboard + références pour mise à jour des valeurs.
 *
 * @param {{ onOpenDetail: (key: string) => void }} opts
 * @returns {{ kpiGrid: HTMLElement; kpiStickyWrap: HTMLElement; kpiValues: Record<string, HTMLElement>; kpiNotes: Record<string, HTMLElement>; kpiEmptyHints: Record<string, HTMLElement> }}
 */
export function renderKpiCards(opts) {
  const { onOpenDetail } = opts;
  /** @type {Record<string, HTMLDivElement>} */
  const kpiValues = {};
  /** @type {Record<string, HTMLDivElement>} */
  const kpiNotes = {};
  /** @type {Record<string, HTMLElement>} */
  const kpiEmptyHints = {};

  const kpiGrid = document.createElement('section');
  kpiGrid.className = 'kpi-grid dashboard-kpi-grid';
  DASHBOARD_KPI_SPECS.forEach((spec) => {
    const card = createDashboardKpiCard({
      label: spec.label,
      value: 'Non disponible',
      note: spec.note,
      tone: spec.tone,
      kpiKey: spec.key,
      onOpen: (key) => onOpenDetail(key)
    });
    const value = card.querySelector('.metric-value');
    const note = card.querySelector('.metric-note');
    const emptyHint = card.querySelector('.dashboard-kpi-empty-hint');
    if (value) kpiValues[spec.key] = value;
    if (emptyHint) kpiEmptyHints[spec.key] = emptyHint;
    if (note && spec.key === 'ncOpen') kpiNotes.ncOpen = note;
    kpiGrid.append(card);
  });

  const kpiStickyWrap = document.createElement('div');
  kpiStickyWrap.className = 'dashboard-kpi-sticky';
  const kpiStickyInner = document.createElement('div');
  kpiStickyInner.className = 'dashboard-kpi-sticky-inner';
  const kpiSkeletonLayer = document.createElement('div');
  kpiSkeletonLayer.className = 'kpi-grid dashboard-kpi-grid dashboard-kpi-skeleton-layer';
  for (let i = 0; i < 5; i++) kpiSkeletonLayer.append(createSkeletonCard(4));
  kpiStickyInner.append(kpiGrid, kpiSkeletonLayer);
  kpiStickyWrap.append(kpiStickyInner);

  return { kpiGrid, kpiStickyWrap, kpiValues, kpiNotes, kpiEmptyHints };
}
