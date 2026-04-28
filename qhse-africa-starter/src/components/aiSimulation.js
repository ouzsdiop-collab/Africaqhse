/**
 * Scénarios d’illustration : sortie structurée pour affichage « rapport » et export texte.
 * Aucun appel réseau.
 */

function buildScenario(ref, title, sections) {
  return { ref, title, sections };
}

const SCENARIOS = {
  hydrocarbure: buildScenario('SIM-2026-ENV-01', 'Fuite mineure : bac de rétention', [
    {
      id: 'resume',
      title: 'Résumé incident',
      items: [
        'Détection : écart hydrocarbure localisé au pied du bac de rétention zone stockage.',
        'Confinement : barrage absorbant posé, aucune propagation hors aire technique.',
        'Impact : pas d’atteinte aux eaux superficielles (contrôle visuel terrain).'
      ]
    },
    {
      id: 'gravite',
      title: 'Gravité / criticité',
      items: [
        'Niveau suggéré : modéré (environnement / conformité stockage).',
        'Pas de blessé. Pas d’escalade SST immédiate au-delà du signalement HSE.'
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
  chute: buildScenario('SIM-2026-SST-02', 'Chute de hauteur : échafaudage', [
    {
      id: 'resume',
      title: 'Résumé incident',
      items: [
        'Chute d’environ 1,8 m depuis plan de travail échafaudage zone B.',
        'Blessé pris en charge ; EPI portés (harnais + longe, à vérifier au rapport officiel).',
        'Arrêt de travail côté activité concernée : journée.'
      ]
    },
    {
      id: 'gravite',
      title: 'Gravité / criticité',
      items: [
        'Classification SST : à valider avec médecine du travail. Gravité potentielle élevée si MTT.',
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
        'Piste : déplacement charge ou défaut garde-corps, à confirmer par enquête terrain.',
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
  espace_confiné: buildScenario('SIM-2026-SST-04', 'Intervention espace confiné : cuve maintenance', [
    {
      id: 'resume',
      title: 'Résumé incident',
      items: [
        'Opération d’inspection planifiée sur cuve intermédiaire : accès par trappe étanche.',
        'Mesure portable O₂ : lecture limite basse au fond de cuve ; équipe a interrompu et évacué sans blessé.',
        'Consignation partielle en place ; ventilation mécanique non branchée au moment du constat.'
      ]
    },
    {
      id: 'gravite',
      title: 'Gravité / criticité',
      items: [
        'Scénario à fort potentiel létal (asphyxie / atmosphère toxique) même si l’événement s’est arrêté à un quasi-accident.',
        'Exigence renforcée : permis espace confiné, analyse atmosphère continue, binôme et moyens de secours.'
      ]
    },
    {
      id: 'actions',
      title: 'Suggestions d’actions',
      items: [
        'Bloquer l’accès jusqu’à analyse de cause sur la procédure d’entrée et le contrôle ventilation.',
        'Refaire point de mesure avec appareils étalonnés ; journaliser les seuils et la durée d’exposition.',
        'Recyclage / sensibilisation équipes sur arrêt immédiat en cas de lecture douteuse.'
      ]
    },
    {
      id: 'analyse',
      title: 'Analyse simple',
      items: [
        'Facteurs techniques : absence de ventilation effective, possible siphonnage ou purge incomplète avant ouverture.',
        'Facteurs organisationnels : pression calendrier maintenance vs temps de préparation sécurisée.'
      ]
    },
    {
      id: 'direction',
      title: 'Synthèse direction',
      items: [
        'Message : quasi-accident SST majeur évité. Renforcement des contrôles avant toute reprise d’intervention en espace confiné ; revue des permis sur 30 j.'
      ]
    }
  ]),
  nc_audit: buildScenario('SIM-2026-ISO-03', 'Non-conformité mineure : traçabilité déchets', [
    {
      id: 'resume',
      title: 'Résumé incident',
      items: [
        'Constat : registre déchets incomplet sur deux mouvements (preuve documentaire manquante).',
        'Contexte : audit interne / préparation certification ISO 14001.'
      ]
    },
    {
      id: 'gravite',
      title: 'Gravité / criticité',
      items: [
        'NC mineure documentaire. Risque majeur environnemental non démontré sur la base des infos saisies.',
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
  lines.push('QHSE Control : sortie assistant (scénario illustratif)');
  lines.push(`Réf. ${result.ref} : ${result.title}`);
  lines.push('');
  result.sections.forEach((sec) => {
    lines.push(`• ${sec.title}`);
    sec.items.forEach((line) => {
      lines.push(`  • ${line}`);
    });
    lines.push('');
  });
  lines.push('(Scénario illustratif : ne pas utiliser comme preuve réglementaire sans validation humaine.)');
  return lines.join('\n');
}
