/**
 * Suggestions déterministes (assistant local) pour formulaires — à valider par l’utilisateur.
 */

import { mockSuggestActionContent } from './mockActionSuggest.js';

/**
 * @param {{ ref?: string, type?: string, site?: string, severity?: string, description?: string }} inc
 */
export function buildActionDefaultsFromIncident(inc) {
  const ref = inc?.ref || 'INC';
  const sev = String(inc?.severity || '').toLowerCase();
  const crit = sev.includes('crit');
  return {
    title: `Corrective — ${ref}`,
    origin: 'incident',
    actionType: 'corrective',
    priority: crit ? 'critique' : 'haute',
    description: mockSuggestActionContent({
      title: `Incident ${ref}`,
      origin: 'incident',
      actionType: 'corrective'
    }).description,
    linkedIncident: ref,
    dueDate: ''
  };
}

/**
 * @param {{ title?: string, category?: string, meta?: string, status?: string }} risk
 */
export function buildActionDefaultsFromCriticalRisk(risk) {
  const title = risk?.title || 'Risque critique';
  return {
    title: `Préventive — ${title}`.slice(0, 240),
    origin: 'risk',
    actionType: 'preventive',
    priority: 'haute',
    description: mockSuggestActionContent({
      title,
      origin: 'risk',
      actionType: 'preventive'
    }).description,
    linkedRisk: title,
    dueDate: ''
  };
}

/**
 * @param {{ name?: string, id?: string, complianceLabel?: string }} doc
 */
/**
 * Relance sur action en retard (aperçu stats / liste plan).
 * @param {{ title?: string; detail?: string; dueDate?: string | null; owner?: string | null }} item
 */
export function buildActionDefaultsFromOverdueItem(item) {
  const title = item?.title || 'Action en retard';
  const due = item?.dueDate != null ? String(item.dueDate) : '';
  const own = item?.owner != null ? String(item.owner) : '';
  const det = item?.detail != null ? String(item.detail).trim().slice(0, 500) : '';
  const suggestedDue = (() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  })();
  return {
    title: `Relance — ${title}`.slice(0, 240),
    origin: 'other',
    actionType: 'corrective',
    priority: 'haute',
    description: [
      '[Module plan d’actions · Assistant dashboard]',
      '[Assistant] Action signalée en retard — arbitrer : mise à jour d’échéance, réaffectation ou clôture avec preuve.',
      due ? `Échéance enregistrée : ${due}.` : '',
      own ? `Responsable connu : ${own}.` : '',
      det ? `Détail : ${det}` : '',
      mockSuggestActionContent({
        title,
        origin: 'other',
        actionType: 'corrective'
      }).description
    ]
      .filter(Boolean)
      .join('\n'),
    dueDate: suggestedDue
  };
}

/**
 * Préparation audit à venir (calendrier ou données métier).
 * @param {{ title?: string; horizon?: string; owner?: string }} audit
 */
export function buildActionDefaultsFromAuditPrep(audit) {
  const title = audit?.title || 'Audit à préparer';
  return {
    title: `Préparation audit — ${title}`.slice(0, 240),
    origin: 'audit',
    actionType: 'corrective',
    priority: 'haute',
    description: [
      `[Assistant] Fenêtre / échéance : ${audit?.horizon || 'à préciser avec le calendrier audit'}.`,
      audit?.owner ? `Pilotage suggéré : ${audit.owner}.` : '',
      'Consolider preuves documentaires, plans d’actions ouverts et synthèse des écarts récents.',
      mockSuggestActionContent({
        title,
        origin: 'audit',
        actionType: 'corrective'
      }).description
    ]
      .filter(Boolean)
      .join('\n'),
    dueDate: ''
  };
}

/**
 * Document bientôt à renouveler (anticiper la revue).
 * @param {{ name?: string; complianceLabel?: string }} doc
 */
export function buildActionDefaultsFromRenewingDocument(doc) {
  const name = doc?.name || 'Document';
  return {
    title: `Revue anticipée — ${name}`.slice(0, 240),
    origin: 'other',
    actionType: 'corrective',
    priority: 'normale',
    description: [
      `[Assistant] Document à renouveler prochainement : « ${name} ».`,
      doc?.complianceLabel ? `Statut : ${doc.complianceLabel}.` : '',
      'Lancer la revue, validation et diffusion avant expiration pour éviter une rupture de conformité.',
      mockSuggestActionContent({
        title: name,
        origin: 'other',
        actionType: 'corrective'
      }).description
    ]
      .filter(Boolean)
      .join('\n'),
    dueDate: ''
  };
}

export function buildActionDefaultsFromExpiredDocument(doc) {
  const name = doc?.name || 'Document';
  return {
    title: `Mise à jour document — ${name}`.slice(0, 240),
    origin: 'other',
    actionType: 'corrective',
    priority: 'haute',
    description: [
      `Renouveler ou réviser le document maîtrisé « ${name} ».`,
      doc?.complianceLabel ? `Statut actuel : ${doc.complianceLabel}.` : '',
      'Valider la nouvelle version, diffusion et archivage conformes au SMS.',
      '',
      mockSuggestActionContent({
        title: name,
        origin: 'other',
        actionType: 'corrective'
      }).description
    ]
      .filter(Boolean)
      .join('\n'),
    dueDate: ''
  };
}

/**
 * @param {string} category
 * @param {string} title
 * @param {string} description
 */
/**
 * Remplit description + priorité à partir du contexte du formulaire (sans appel réseau).
 * @param {HTMLFormElement} form
 * @returns {{ ok: boolean; message?: string }}
 */
export function applyAssistantActionFormSuggestion(form) {
  const origin = form.origin?.value;
  if (!origin) {
    return { ok: false, message: 'Choisissez une origine pour activer l’assistant.' };
  }
  const title = form.title?.value?.trim() || 'Nouvelle action';
  const actionType = form.actionType?.value || 'corrective';
  const sug = mockSuggestActionContent({ title, origin, actionType });
  let desc = sug.description;
  if (origin === 'incident') {
    desc +=
      '\n\n[Assistant] Enchaînement type : sécurisation → analyse causes → actions correctives → preuves de clôture.';
  } else if (origin === 'risk') {
    desc +=
      '\n\n[Assistant] Prévention : barrières techniques / organisationnelles, formation, indicateurs de surveillance.';
  } else if (origin === 'audit') {
    desc +=
      '\n\n[Assistant] Réponse audit : traiter l’écart, conserver la trace et préparer la revue de suivi.';
  } else {
    desc += '\n\n[Assistant] Définir clairement le critère de clôture et le responsable terrain.';
  }
  const ta = form.querySelector('[name="description"]');
  if (ta) ta.value = desc;
  const pri = form.querySelector('[name="priority"]');
  if (pri && sug.priority) pri.value = sug.priority;
  return { ok: true };
}

/**
 * @param {string} category
 * @param {string} title
 * @param {string} description
 */
export function suggestRiskCausesImpacts(category, title, description) {
  const cat = String(category || 'Sécurité');
  const t = String(title || 'Risque').trim();
  const d = String(description || '').trim().slice(0, 200);
  const causes = [
    `Exposition opérationnelle liée à « ${t} » (${cat}) : défaillance possible de barrières, formation ou consignes.`,
    d ? `Contexte signalé : ${d}` : 'Contexte terrain à préciser après observation.',
    'Facteurs organisationnels : charge, sous-traitance, interfaces entre équipes.'
  ].join('\n');
  const impacts = [
    'SST : blessures, arrêts, atteinte à l’intégrité physique.',
    cat.includes('Environnement')
      ? 'Environnement : rejets, atteinte aux milieux, non-conformité réglementaire.'
      : 'Qualité / continuité : non-conformité produit ou service, perte client.',
    'Image et conformité : audits, certification, relations parties intéressées.'
  ].join('\n');
  return { causes, impacts };
}
