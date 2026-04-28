# DUERP Lead Magnet → App QHSE Premium (préparation intégration)

## Objectif
Le générateur DUERP (app séparée “lead magnet”) produit aujourd’hui un **PDF** pour le prospect.  
L’objectif produit futur est d’ajouter un **JSON DUERP structuré** (source de vérité) exploitable par l’app QHSE principale, pour préremplir l’onboarding et créer un effet “wow” (risques, unités, alertes, KPI, actions recommandées prêtes à valider), **sans parsing fragile du PDF**.

**Contraintes (ce document)**:
- Documentation uniquement (pas de code, pas de modification Prisma).
- Ne pas confondre les 2 apps: lead magnet ≠ app premium.
- Import dans l’app premium: toujours **validation humaine**, jamais d’écriture automatique non confirmée.

## Principes produit
- **PDF**: rendu lisible pour le prospect (livrable “gratuit”).
- **JSON**: donnée structurée (livrable “tech” + onboarding premium).
- **JSON = source de vérité**, le PDF est une vue.
- **humanValidationRequired = true** partout: l’outil assiste, l’humain décide.

## Schéma JSON attendu (contrat DUERP)
### Champs racines obligatoires
- `source`: string, **doit valoir** `"duerp-lead-magnet"`
- `humanValidationRequired`: boolean, **doit être** `true`
- `metadata`: objet (versioning, ids, horodatage, etc.)
- `leadInfo`: objet (identité lead, consentements, canaux)
- `company`: objet (entité juridique / raison sociale)
- `site`: objet (site principal concerné)
- `country`: string (pays)
- `jurisdiction`: string (cadre juridique/réglementaire, ex. `"OHADA"`, `"Code du travail Sénégal"`)
- `workUnits`: array (unités de travail)
- `risks`: array (registre risques DUERP)
- `preventionMeasures`: array (mesures existantes)
- `recommendedActions`: array (actions proposées à valider)
- `legalReferences`: array (références juridiques/ISO, prudentes)

### Exemple (JSON, version 1)
```json
{
  "source": "duerp-lead-magnet",
  "humanValidationRequired": true,
  "metadata": {
    "schemaVersion": "1.0",
    "generatedAt": "2026-04-28T10:00:00.000Z",
    "leadId": "lead_12345",
    "duerpId": "duerp_98765",
    "generatorVersion": "duerp-generator@1.12.0",
    "language": "fr",
    "hash": "optional_integrity_hash"
  },
  "leadInfo": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+221700000000",
    "companyName": "ACME Mining",
    "role": "Responsable QHSE",
    "consents": {
      "contactOptIn": true,
      "dataProcessing": true
    },
    "acquisition": {
      "channel": "landing_page",
      "campaign": "duerp-free",
      "utm": {
        "source": "google",
        "medium": "cpc",
        "campaign": "duerp"
      }
    }
  },
  "company": {
    "legalName": "ACME Mining SARL",
    "industry": "mines",
    "employeeCountRange": "51-200",
    "country": "SN",
    "registration": {
      "idType": "RCCM",
      "idValue": "SN-DKR-2026-B-0000"
    }
  },
  "site": {
    "name": "Site principal",
    "code": "SITE-001",
    "address": "Adresse (optionnel)",
    "city": "Dakar",
    "gps": { "lat": 14.7, "lng": -17.4 }
  },
  "country": "SN",
  "jurisdiction": "Code du travail Sénégal + OHADA",
  "workUnits": [
    {
      "id": "wu_1",
      "name": "Atelier maintenance",
      "headcountApprox": 18,
      "activities": ["maintenance mécanique", "soudure"],
      "shifts": ["jour", "nuit"],
      "equipment": ["pont roulant", "poste à souder"],
      "subcontractorsPresent": true
    }
  ],
  "risks": [
    {
      "id": "r_1",
      "workUnitId": "wu_1",
      "title": "Travail en hauteur",
      "category": "sécurité",
      "hazard": "chute",
      "scenario": "intervention sur passerelle sans protection",
      "severity": 4,
      "probability": 3,
      "riskLevel": { "method": "gravity_x_probability", "gp": 12 },
      "existingMeasuresIds": ["pm_1"],
      "critical": true,
      "evidence": {
        "source": "questionnaire",
        "notes": "garde-corps partiel"
      }
    }
  ],
  "preventionMeasures": [
    {
      "id": "pm_1",
      "type": "collective",
      "title": "Garde-corps",
      "description": "Protection partielle sur passerelle",
      "status": "partial",
      "workUnitIds": ["wu_1"]
    }
  ],
  "recommendedActions": [
    {
      "id": "ra_1",
      "scope": "work_unit",
      "workUnitId": "wu_1",
      "relatedRiskIds": ["r_1"],
      "priority": "critical",
      "title": "Compléter la protection antichute sur passerelle",
      "description": "Installer garde-corps conforme + point d’ancrage, et interdire l’accès zone non conforme jusqu’à mise en sécurité.",
      "responsibleRole": "Maintenance",
      "dueInDays": 14,
      "evidenceExpected": ["PV réception travaux", "photos avant/après", "mise à jour plan de prévention"],
      "closureCriteria": "Protection en place + 0 écart sur 2 contrôles terrain.",
      "isoReference": null,
      "confidence": 0.62,
      "humanValidationRequired": true
    }
  ],
  "legalReferences": [
    {
      "type": "law",
      "label": "Code du travail (pays)",
      "reference": "à préciser",
      "confidence": 0.4
    },
    {
      "type": "standard",
      "label": "ISO 45001",
      "reference": null,
      "confidence": 0.4,
      "note": "Ne renseigner une clause que si certaine; sinon null."
    }
  ]
}
```

## Mapping vers l’app QHSE principale (préparation)
### Entités / données
- **leadInfo → CRM / prospect**
  - Créer/mettre à jour un lead côté CRM (hors scope app QHSE).
  - Conserver `leadId` / `duerpId` pour rattacher le prospect à l’import futur.

- **company → tenant potentiel**
  - Préparer une “fiche organisation” (pré-onboarding).
  - **Règle**: ne jamais créer automatiquement un tenant. La création doit être validée explicitement (admin / onboarding).

- **site + workUnits → sites / unités**
  - `site` → futur `Site` principal (ou préremplissage du formulaire de création).
  - `workUnits` → concept “unités de travail” (peut rester un mapping applicatif/UX si modèle pas présent; ne pas forcer en DB tant que le module n’existe pas).

- **risks → registre des risques**
  - Chaque entrée `risks[]` → `Risk` (titre, description/scenario, category, severity/probability, gp si cohérent).
  - `critical=true` → signal fort pour dashboards/alertes (sans inventer de KPI).

- **preventionMeasures → mesures existantes**
  - Peut être importée en “notes/mesures” associées au risque / unité, selon les modules disponibles.
  - Sinon: affichage preview (validation) + rattachement manuel.

- **recommendedActions → actions à valider**
  - Import en “brouillons” / “à valider” (pas de création automatique d’Action métier sans confirmation).
  - Servira à préremplir les formulaires d’actions correctives dans l’app premium.

- **legalReferences → documentation**
  - Garder une liste prudente, avec `confidence` et éventuellement `reference=null` si incertain.

## Workflow futur (lead magnet → premium)
1. Le prospect génère un **DUERP gratuit** sur le lead magnet.
2. Le lead magnet produit:
   - PDF DUERP (téléchargement / e-mail)
   - JSON DUERP (stockage/transmission)
3. Création/MAJ du **lead CRM** avec `leadId`/`duerpId`.
4. Le prospect devient client (conversion) → création tenant premium via onboarding.
5. Dans l’app premium: écran **Import DUERP (JSON)**:
   - Upload/connexion (selon stratégie) du JSON
   - Preview: company/site/unités/risques/actions/alertes
   - Détection “critical risks” → mise en avant
6. Validation humaine:
   - Confirmer création du site
   - Confirmer import risques (sélection, édition)
   - Confirmer import actions recommandées (sélection, échéances, responsables)
7. Écriture en base (batch import):
   - Création/MAJ sites/risques/actions selon modules
   - Journalisation import (importBatchId) + source lead
8. Dashboard prérempli:
   - alertes “risques critiques” + backlog actions à valider
9. IA premium:
   - propose des compléments (toujours “humanValidationRequired=true”), en se basant sur les risques/import réels.

## Règles de sécurité (non négociables)
- **Jamais** de création automatique de tenant.
- **Jamais** de création automatique de risques/actions sans confirmation utilisateur explicite.
- Import premium: **tenantId obligatoire** (contexte organisation).
- Toujours conserver (futur): `importBatchId`, `sourceLeadId` (`leadId`), `duerpId`, `source="duerp-lead-magnet"`.
- Éviter le parsing PDF: autorisé seulement en **fallback manuel** (support) avec avertissement clair.
- Minimiser données sensibles:
  - Pas de données personnelles superflues dans `recommendedActions` / `risks`.
  - Consentements stockés côté CRM/lead magnet (séparé), pas forcément dans l’app premium.

## Améliorations nécessaires du générateur DUERP (lead magnet)
- Exporter **PDF + JSON** à chaque génération.
- Le **JSON est la source de vérité**; le PDF est une vue.
- Inclure des identifiants uniques:
  - `leadId` (prospect)
  - `duerpId` (document)
  - optionnel: `integrityHash` (anti altération)
- Versionner le schéma (`metadata.schemaVersion`) et le générateur (`metadata.generatorVersion`).
- Garantir `humanValidationRequired=true` et `source="duerp-lead-magnet"`.

## Prochaines étapes (quand on passera au dev)
- Ajouter un endpoint premium “preview import DUERP JSON” (read-only) avec validation de schéma + warnings.
- Ajouter un endpoint “commit import” (écriture) derrière confirmation, avec importBatchId.
- Ajouter une UI d’import (preview + mapping + choix) et journaliser l’opération (audit log).
- Ajouter des tests anti cross-tenant et anti création implicite.

