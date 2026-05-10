import { STATUS_LABELS_FR } from '../i18n/fr/statusLabels.js';
import { SEVERITY_LABELS_FR } from '../i18n/fr/severityLabels.js';
import { EXPORT_LABELS_FR } from '../i18n/fr/exportLabels.js';
import { UI_LABELS_FR } from '../i18n/fr/uiLabels.js';

export function labelFrom(map, value, fallback = 'Non renseigné') {
  if (value == null) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;
  const key = raw.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  return raw;
}

export function translateStatus(value) {
  return labelFrom(STATUS_LABELS_FR, value);
}

export function translateSeverity(value) {
  return labelFrom(SEVERITY_LABELS_FR, value);
}

export function translateExportLabel(value) {
  return labelFrom(EXPORT_LABELS_FR, value);
}

export function translateUiLabel(value) {
  return labelFrom(UI_LABELS_FR, value);
}
