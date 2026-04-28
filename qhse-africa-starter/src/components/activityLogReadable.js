/**
 * Libellés « lecture audit » à partir des champs journal existants (UI uniquement).
 */
import { moduleMeta, classifyEntryKindExtended, aiSuggestionJournalDisplay } from './activityLogHelpers.js';

/**
 * @param {string} s
 */
function capFirst(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * @param {string} blob
 * @returns {string | null}
 */
function extractIncidentRef(blob) {
  const b = String(blob || '');
  const m1 = b.match(/\bINC[-\s]?(\d+)\b/i);
  if (m1) return `INC-${m1[1]}`;
  const m2 = b.match(/incident\s*#?\s*(\d+)/i);
  if (m2) return `INC-${m2[1]}`;
  return null;
}

/**
 * @param {string} blob
 * @returns {string | null}
 */
function extractNcRef(blob) {
  const m = String(blob || '').match(/\b(NC[-\s]?\d+|non[-\s]?conformité\s*\d+)\b/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

/**
 * @param {object} entry
 * @param {'create'|'modify'|'close'|'other'} kind
 * @param {string} actionRaw
 */
function buildActionClear(entry, kind, actionRaw) {
  const aiDisp = aiSuggestionJournalDisplay(entry);
  if (aiDisp) {
    const t = String(entry.aiTraceType || '');
    if (t === 'suggestion_generated') return 'Suggestion automatique produite par l’assistant';
    if (t === 'user_validated') return 'Validation de la proposition de l’assistant';
    if (t === 'user_modified') return 'Ajustement du statut par rapport à la proposition';
    if (t === 'audit_report_generated') return 'Génération du rapport d’audit synthétique';
    return capFirst(entry.action || 'Activité liée à l’assistant');
  }

  const a = actionRaw.toLowerCase();
  const mod = entry.module;

  if (/export.*pdf|pdf.*export/i.test(actionRaw)) return 'Export d’un document PDF';
  if (/rapport.*audit|audit.*rapport/i.test(actionRaw) && /génér|gener/i.test(actionRaw))
    return 'Génération d’un rapport d’audit';

  if (mod === 'incidents') {
    if (kind === 'create' || /créé|création|enregistré|signalé/i.test(a))
      return 'Création ou enregistrement d’un incident';
    if (kind === 'modify' || /modifi|mis à jour/i.test(a)) return 'Modification d’un incident';
    if (kind === 'close' || /clôtur|fermé|résolu/i.test(a)) return 'Clôture ou résolution d’un incident';
    return capFirst(actionRaw || 'Activité sur les incidents');
  }

  if (mod === 'actions') {
    if (kind === 'create' || /créé|création|nouvelle action/i.test(a))
      return 'Création d’une action corrective ou de suivi';
    if (/relance|retard|échéance/i.test(a)) return 'Relance ou suivi d’une action (échéance)';
    if (kind === 'modify' || /modifi|affecté|réaffect/i.test(a)) return 'Modification d’une action';
    return capFirst(actionRaw || 'Activité sur le plan d’actions');
  }

  if (mod === 'audits') {
    if (kind === 'create' || /lancé|prépar|planif|programmé|démarré/i.test(a))
      return 'Lancement ou préparation d’un audit';
    if (/non[-\s]?conform|constat|nc\b/i.test(a)) return 'Enregistrement d’un constat ou d’une non-conformité';
    if (kind === 'modify' || /modifi/i.test(a)) return 'Modification d’un audit';
    if (kind === 'close' || /clôtur|termin|final|export/i.test(a)) return 'Finalisation ou clôture d’un audit';
    return capFirst(actionRaw || 'Activité sur les audits');
  }

  if (mod === 'iso' || mod === 'iso-ai') {
    if (/statut.*exigence|exigence.*statut|validation humaine/i.test(a))
      return 'Mise à jour du statut d’une exigence de conformité';
    if (/export|pdf|conformité/i.test(a)) return 'Export ou synthèse de conformité ISO';
    return capFirst(actionRaw || 'Activité sur la conformité ISO');
  }

  if (mod === 'risks') {
    if (kind === 'create' || /créé|création|identifié/i.test(a)) return 'Création ou identification d’un risque';
    if (kind === 'modify' || /modifi|évalu|mitigation/i.test(a)) return 'Modification ou évaluation d’un risque';
    return capFirst(actionRaw || 'Activité sur le registre des risques');
  }

  if (mod === 'products') {
    return capFirst(actionRaw || 'Activité produits / FDS');
  }

  if (mod === 'ai-center') {
    return capFirst(actionRaw || 'Activité dans le centre IA');
  }

  if (mod === 'system' || mod === 'context') {
    return capFirst(actionRaw || 'Paramètre ou contexte site');
  }

  return capFirst(actionRaw || 'Événement enregistré');
}

/**
 * @param {object} entry
 * @param {{ label: string }} meta
 * @param {string} detailRaw
 * @param {string} actionRaw
 */
function splitObjectResult(entry, meta, detailRaw, actionRaw) {
  const arrow = detailRaw.match(/^([\s\S]{1,480}?)\s*→\s*([\s\S]+)$/);
  if (arrow) {
    const left = arrow[1].trim();
    const right = arrow[2].trim();
    return {
      objectText: left || meta.label,
      resultText: right || '—'
    };
  }

  const inc = extractIncidentRef(`${detailRaw} ${actionRaw}`);
  const nc = extractNcRef(`${detailRaw} ${actionRaw}`);
  const reqId = String(entry.requirementId || '').trim();

  /** @type {string[]} */
  const objectBits = [];
  if (inc) objectBits.push(`Incident ${inc}`);
  if (nc) objectBits.push(`Non-conformité ${nc}`);
  if (reqId && entry.entityType === 'iso_requirement') objectBits.push(`Exigence ${reqId}`);
  if (reqId && entry.entityType === 'ai_suggestion' && entry.aiTraceType !== 'audit_report_generated') {
    objectBits.push(`Exigence ${reqId}`);
  }

  if (objectBits.length) {
    let res = detailRaw.trim();
    if (res && inc) {
      res = res
        .replace(new RegExp(`\\bINC[-\\s]?${inc.replace(/^INC-/i, '')}\\b`, 'gi'), '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (!res) res = '—';
    return { objectText: objectBits.join(' · '), resultText: res };
  }

  if (detailRaw.length > 0 && detailRaw.length <= 160) {
    return { objectText: detailRaw, resultText: '—' };
  }

  if (detailRaw.length > 160) {
    return {
      objectText: `Module « ${meta.label} »`,
      resultText: detailRaw.length > 220 ? `${detailRaw.slice(0, 217)}…` : detailRaw
    };
  }

  return { objectText: `Module « ${meta.label} »`, resultText: '—' };
}

/**
 * @param {object} entry
 * @returns {{
 *   dateDisplay: string;
 *   userDisplay: string;
 *   actionClear: string;
 *   objectText: string;
 *   resultText: string;
 *   narrative: string;
 *   moduleShort: string;
 *   moduleClass: string;
 * }}
 */
export function getAuditReadableJournalParts(entry) {
  const meta = moduleMeta(entry.module);
  const user = String(entry.user || '').trim() || 'Utilisateur';
  const dateDisplay = String(entry.timestamp || '—').trim() || '—';
  const kind = classifyEntryKindExtended(entry);
  const actionRaw = String(entry.action || '').trim();
  const detailRaw = String(entry.detail || '').trim();

  const actionClear = buildActionClear(entry, kind, actionRaw);
  const { objectText, resultText } = splitObjectResult(entry, meta, detailRaw, actionRaw);

  const narrative = `${user} : ${actionClear} — ${objectText}${
    resultText && resultText !== '—' ? `. ${resultText}` : ''
  }`;

  return {
    dateDisplay,
    userDisplay: user,
    actionClear,
    objectText,
    resultText,
    narrative,
    moduleShort: meta.short,
    moduleClass: meta.className
  };
}
