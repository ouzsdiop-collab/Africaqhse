import { createDashboardKpiCard } from './dashboardKpiCard.js';
import { createSkeletonCard } from '../utils/designSystem.js';

export const DASHBOARD_KPI_SPECS = [
  { key: 'incidents', label: 'Incidents', note: 'Total déclarés (périmètre)', tone: 'amber' },
  { key: 'ncOpen', label: 'NC ouvertes', note: 'Non clos — détail après chargement', tone: 'amber' },
  {
    key: 'actionsLate',
    label: 'Actions en retard',
    note: 'Échéance dépassée ou statut « retard » (hors clôturées)',
    tone: 'red'
  },
  { key: 'actions', label: 'Actions (total)', note: 'En base sur le périmètre', tone: 'blue' },
  { key: 'auditScore', label: 'Score moyen audits', note: 'Moyenne sur audits récents', tone: 'green' },
  { key: 'auditsN', label: 'Audits (liste)', note: 'Nombre sur cette vue', tone: 'blue' }
];

/**
 * Grille KPI dashboard + références pour mise à jour des valeurs.
 *
 * @param {{ onOpenDetail: (key: string) => void }} opts
 * @returns {{ kpiGrid: HTMLElement; kpiStickyWrap: HTMLElement; kpiValues: Record<string, HTMLElement>; kpiNotes: Record<string, HTMLElement>; dismissKpiSkeleton: () => void }}
 */
export function renderKpiCards(opts) {
  const { onOpenDetail } = opts;
  /** @type {Record<string, HTMLDivElement>} */
  const kpiValues = {};
  /** @type {Record<string, HTMLDivElement>} */
  const kpiNotes = {};

  const kpiGrid = document.createElement('section');
  kpiGrid.className = 'kpi-grid dashboard-kpi-grid';
  DASHBOARD_KPI_SPECS.forEach((spec) => {
    const card = createDashboardKpiCard({
      label: spec.label,
      value: '—',
      note: spec.note,
      tone: spec.tone,
      deltaLabel: 'Variation: —',
      impactLabel: 'Site impacté: —',
      kpiKey: spec.key,
      onOpen: (key) => onOpenDetail(key)
    });
    const value = card.querySelector('.metric-value');
    const note = card.querySelector('.metric-note');
    if (value) kpiValues[spec.key] = value;
    if (note && spec.key === 'ncOpen') kpiNotes.ncOpen = note;
    kpiGrid.append(card);
  });

  const kpiStickyWrap = document.createElement('div');
  kpiStickyWrap.className = 'dashboard-kpi-sticky';
  const kpiStickyInner = document.createElement('div');
  kpiStickyInner.className = 'dashboard-kpi-sticky-inner';
  const kpiSkeletonLayer = document.createElement('div');
  kpiSkeletonLayer.className = 'kpi-grid dashboard-kpi-grid dashboard-kpi-skeleton-layer';
  for (let i = 0; i < 4; i++) kpiSkeletonLayer.append(createSkeletonCard(4));
  kpiStickyInner.append(kpiGrid, kpiSkeletonLayer);
  kpiStickyWrap.append(kpiStickyInner);

  function dismissKpiSkeleton() {
    if (kpiSkeletonLayer.isConnected) kpiSkeletonLayer.remove();
  }

  return { kpiGrid, kpiStickyWrap, kpiValues, kpiNotes, dismissKpiSkeleton };
}
