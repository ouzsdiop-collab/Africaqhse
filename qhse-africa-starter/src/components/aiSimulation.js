/**
 * Scénarios mock — sortie structurée pour affichage « rapport » et export texte.
 * Aucun appel réseau.
 */

function buildScenario(ref, title, sections) {
  return { ref, title, sections };
}

const SCENARIOS = {
  hydrocarbure: buildScenario('SIM-2026-ENV-01', 'Fuite mineure — bac de rétention', [
    {
      id: 'resume',
      title: 'Résumé incident',
      items: [
        'Détection : écart hydrocarbure localisé au pied du bac de rétention zone stockage.',
        'Confinement : barrage absorbant posé, aucune propagation hors aire technique.',
        'Impact : pas d’atteinte aux eaux superficielles (contrôle visuel mock).'
      ]
    },
    {
      id: 'gravite',
      title: 'Gravité / criticité',
      items: [
        'Niveau suggéré : modéré (environnement / conformité stockage).',
        'Pas de blessé — pas d’escalade SST immédiate au-delà du signalement HSE.'
      ]
    },
    {
      id: 'actions',
      title: 'Suggestions d’actions',
      items: [
        'Pompage / absorbants jusqu’à élimination des traces ; photo à joindre au dossier.',
        'Analyse cause racine sous 48 h (joints, surcharge, maintenance).',
        'Contrôle des équipements voisins et relevé cuves J-12 pour corrélation.'
      ]
    },
    {
      id: 'analyse',
      title: 'Analyse simple',
      items: [
        'Facteurs probables : vieillissement joint / opération de transfert non conforme.',
        'Facteurs organisationnels : à croiser avec planning maintenance et habilitations.'
      ]
    },
    {
      id: 'direction',
      title: 'Synthèse direction',
      items: [
        'Message court : incident environnemental maîtrisé sur site, suivi des causes et preuves de clôture attendu sous une semaine.'
      ]
    }
  ]),
  chute: buildScenario('SIM-2026-SST-02', 'Chute de hauteur — échafaudage', [
    {
      id: 'resume',
      title: 'Résumé incident',
      items: [
        'Chute d’environ 1,8 m depuis plan de travail échafaudage zone B.',
        'Blessé pris en charge ; EPI portés (harnais + longe — à vérifier au rapport officiel).',
        'Arrêt de travail côté activité mock : journée.'
      ]
    },
    {
      id: 'gravite',
      title: 'Gravité / criticité',
      items: [
        'Classification SST : à valider avec médecine du travail — gravité potentielle élevée si MTT.',
        'Signal fort pour le plan de prévention hauteur du site.'
      ]
    },
    {
      id: 'actions',
      title: 'Suggestions d’actions',
      items: [
        'Mise en sécurité immédiate : périmètre, accès échafaudage interdit jusqu’inspection.',
        'Inspection structure, ancrages, garde-corps niveau N+1 par personne habilitée.',
        'Briefing équipe hauteur + rappel procédure montage / démontage.'
      ]
    },
    {
      id: 'analyse',
      title: 'Analyse simple',
      items: [
        'Piste : déplacement charge ou défaut garde-corps — à confirmer par enquête terrain.',
        'Organisation : planning chargements / coactivité à examiner.'
      ]
    },
    {
      id: 'direction',
      title: 'Synthèse direction',
      items: [
        'Priorité sécurité : incident avec arrêt ; décision attendue sur renforcement contrôles hauteur et communication multi-sites.'
      ]
    }
  ]),
  nc_audit: buildScenario('SIM-2026-ISO-03', 'Non-conformité mineure — traçabilité déchets', [
    {
      id: 'resume',
      title: 'Résumé incident',
      items: [
        'Constat : registre déchets incomplet sur deux mouvements (preuve documentaire manquante).',
        'Contexte : audit interne / préparation certification ISO 14001 (mock).'
      ]
    },
    {
      id: 'gravite',
      title: 'Gravité / criticité',
      items: [
        'NC mineure documentaire — risque majeur environnemental non démontré sur la base des infos saisies.',
        'Exposition audit externe : modérée si non clôturée avant prochaine visite.'
      ]
    },
    {
      id: 'actions',
      title: 'Suggestions d’actions',
      items: [
        'Compléter le registre et joindre bons / pesées / BSD selon flux réel.',
        'Rappel procédure aux agents et point de contrôle J+7 sur échantillon de mouvements.',
        'Mettre à jour la matrice de preuves pour le dossier ISO.'
      ]
    },
    {
      id: 'analyse',
      title: 'Analyse simple',
      items: [
        'Cause probable : surcharge administrative ou oubli de saisie terrain.',
        'Système : renforcer double validation hiérarchique sur les sorties de site.'
      ]
    },
    {
      id: 'direction',
      title: 'Synthèse direction',
      items: [
        'Message : écart documentaire sous contrôle si plan de clôture < 15 j ; pas d’impact image si traité vite et tracé.'
      ]
    }
  ])
};

/**
 * @param {string} scenarioId
 * @returns {{ ref: string, title: string, sections: Array<{ id: string, title: string, items: string[] }> }}
 */
export function getAiSimulationResult(scenarioId) {
  return SCENARIOS[scenarioId] ? { ...SCENARIOS[scenarioId] } : { ...SCENARIOS.hydrocarbure };
}

/**
 * Texte brut pour presse-papiers / export.
 */
export function formatSimulationPlainText(result) {
  const lines = [];
  lines.push('QHSE Control — sortie assistant (mock)');
  lines.push(`Réf. ${result.ref} — ${result.title}`);
  lines.push('');
  result.sections.forEach((sec) => {
    lines.push(`— ${sec.title}`);
    sec.items.forEach((line) => {
      lines.push(`  • ${line}`);
    });
    lines.push('');
  });
  lines.push('(Données simulées — ne pas utiliser comme preuve réglementaire sans validation humaine.)');
  return lines.join('\n');
}
