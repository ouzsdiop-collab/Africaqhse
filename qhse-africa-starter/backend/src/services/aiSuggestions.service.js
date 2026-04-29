import { prisma } from '../db.js';
import { normalizeTenantId } from '../lib/tenantScope.js';
import { requestJsonCompletion } from './aiProvider.service.js';

/**
 * Persistance minimale d’une suggestion (pour garder le workflow pending_review),
 * sans dépendre de `aiSuggestion.service.js` (évite les imports circulaires).
 */
async function persistSuggestionDraftLocal(opts) {
  const tenantRow = normalizeTenantId(opts.tenantId);
  if (!tenantRow) return null;
  const typeKey = String(opts.type || 'generic').slice(0, 64);
  const content = {
    schemaVersion: 1,
    summary: String(opts.summary || 'Suggestion IA - revue obligatoire.').slice(0, 2000),
    confidence: 0.55,
    humanValidationRequired: true,
    disclaimer: 'Suggestion IA à valider par un responsable habilité.',
    response: opts.response && typeof opts.response === 'object' ? opts.response : {},
    context: opts.context && typeof opts.context === 'object' ? opts.context : {},
    warnings: Array.isArray(opts.warnings) ? opts.warnings : []
  };
  try {
    return await prisma.aiSuggestion.create({
      data: {
        tenantId: tenantRow,
        type: typeKey,
        content,
        status: 'pending_review',
        createdBySource: opts.userId ? 'user' : 'system',
        createdByUserId: opts.userId,
        targetIncidentId: opts.targetIncidentId ?? null,
        targetAuditId: opts.targetAuditId ?? null,
        riskRef: opts.riskRef ? String(opts.riskRef).slice(0, 200) : null,
        providerMeta: opts.providerMeta && typeof opts.providerMeta === 'object' ? opts.providerMeta : null
      }
    });
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `Tu es un expert QHSE spécialisé (ISO 45001, ISO 9001, ISO 14001) orienté industrie/mines/énergie en Afrique.
Tu réponds en français, de façon concise, opérationnelle, vérifiable.

CONTRAINTE DE SORTIE (OBLIGATOIRE):
- Tu réponds UNIQUEMENT en JSON valide (pas de markdown, pas de texte autour).
- Le JSON doit toujours suivre le wrapper:
  { "type": "...", "confidence": 0.0, "content": { ... } }
- "confidence" doit être un nombre entre 0 et 1.
- "humanValidationRequired" doit toujours être true.
- Inclure toujours: "disclaimer": "Suggestion IA à valider par un responsable habilité."

RÈGLES QHSE:
- Pas d’affirmations factuelles non justifiées par l’entrée.
- Pas de noms propres inventés (sites, sociétés, personnes).
- Les actions doivent être SMART: qui/quoi/quand + preuve attendue + critère de clôture.`;

function nowIso() {
  return new Date().toISOString();
}

function makeProviderMeta(aiRes, fallbackUsed) {
  return {
    provider: aiRes?.provider || 'mock',
    model: aiRes?.model ?? null,
    generatedAt: nowIso(),
    fallbackUsed: Boolean(fallbackUsed)
  };
}

function isNonEmptyString(x) {
  return typeof x === 'string' && x.trim().length > 0;
}

function clampInt(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  const i = Math.round(x);
  return Math.min(max, Math.max(min, i));
}

function normalizeCost(x) {
  const s = String(x || '')
    .toLowerCase()
    .trim();
  if (s.includes('faible')) return 'faible';
  if (s.includes('moy')) return 'moyen';
  if (s.includes('ele') || s.includes('haut')) return 'eleve';
  return '';
}

function normalizePriority(x) {
  const s = String(x || '')
    .toUpperCase()
    .trim();
  // Normalisation vers low|medium|high|critical (contrat métier/API)
  if (s === 'CRITICAL') return 'critical';
  if (s === 'HIGH') return 'high';
  if (s === 'MEDIUM') return 'medium';
  if (s === 'LOW') return 'low';
  if (s === 'P1') return 'critical';
  if (s === 'P2') return 'high';
  if (s === 'P3') return 'medium';
  if (s.includes('URG') || s.includes('CRIT')) return 'critical';
  if (s.includes('HIGH') || s.includes('HAUT')) return 'high';
  if (s.includes('MED') || s.includes('MOY')) return 'medium';
  if (s.includes('LOW') || s.includes('BAS') || s.includes('FAI')) return 'low';
  return 'medium';
}

function normalizeIsoRef(x) {
  const s = String(x || '').trim();
  if (!s) return null;
  // Ne pas "inventer" : si l’IA n’est pas sûre, elle doit renvoyer null. Ici on accepte seulement un format "ISO 45001 ..."
  if (!/^ISO\s*45001\b/i.test(s)) return null;
  return s.slice(0, 120);
}

function isVagueTrainingOnly(text) {
  const t = String(text || '')
    .toLowerCase()
    .trim();
  if (!t) return true;
  const trainingOnly =
    (t.includes('former') || t.includes('formation') || t.includes('sensibil')) &&
    !t.includes('qui') &&
    !t.includes('quoi') &&
    !t.includes('quand') &&
    !t.includes('preuve') &&
    !t.includes('audit') &&
    t.length < 80;
  return Boolean(trainingOnly);
}

function validateSmartRecommendationPayload(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const summary = String(v.summary || '').trim();
  const priority = normalizePriority(v.priority);
  const confidence = Number(v.confidence);
  const humanValidationRequired = v.humanValidationRequired === true;
  const arr = v.recommendedActions;
  if (!summary || !Array.isArray(arr) || arr.length < 1 || !humanValidationRequired) return null;
  const recommendedActions = arr
    .slice(0, 8)
    .map((a) => {
      if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
      const action = String(a.action ?? a.recommendedAction ?? a.title ?? '').trim();
      const responsibleRole = String(a.responsibleRole ?? a.ownerRole ?? '').trim();
      const dueInDays = clampInt(a.dueInDays ?? a.delayDays, 0, 365, null);
      const evidenceExpectedRaw = a.evidenceExpected;
      const evidenceExpected =
        Array.isArray(evidenceExpectedRaw)
          ? evidenceExpectedRaw.map((x) => String(x).trim()).filter(Boolean).slice(0, 10)
          : String(evidenceExpectedRaw ?? '').trim()
              ? [String(evidenceExpectedRaw).trim()]
              : [];
      const closureCriteria = String(a.closureCriteria ?? '').trim();
      const isoReference = normalizeIsoRef(a.isoReference);
      const c = Number(a.confidence);
      const actionConfidence = Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : null;
      if (!action || !responsibleRole || dueInDays == null) return null;
      if (!evidenceExpected.length || !closureCriteria) return null;
      if (isVagueTrainingOnly(action)) return null;
      return {
        action: action.slice(0, 500),
        responsibleRole: responsibleRole.slice(0, 120),
        dueInDays,
        evidenceExpected: evidenceExpected.map((x) => x.slice(0, 300)),
        closureCriteria: closureCriteria.slice(0, 800),
        isoReference,
        confidence: actionConfidence
      };
    })
    .filter(Boolean);
  if (!recommendedActions.length) return null;
  return {
    summary: summary.slice(0, 2000),
    priority,
    recommendedActions,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    humanValidationRequired: true
  };
}

function formatSmartRecommendationText(payload) {
  const head = `${payload.summary}\n\nPriorité: ${payload.priority} — Validation humaine: OUI`;
  const list = payload.recommendedActions
    .slice(0, 8)
    .map((a, i) => {
      const iso = a.isoReference ? `\n   Réf ISO: ${a.isoReference}` : '';
      const conf = a.confidence != null ? `\n   Confiance: ${Math.round(a.confidence * 100)}%` : '';
      return [
        `${i + 1}) Action: ${a.action}`,
        `   Responsable: ${a.responsibleRole} — Échéance: ${a.dueInDays} jour(s)`,
        `   Preuve attendue: ${a.evidenceExpected.join(' | ')}`,
        `   Critères de clôture: ${a.closureCriteria}${iso}${conf}`
      ].join('\n');
    })
    .join('\n\n');
  return `${head}\n\n${list}`.trim();
}

function toStructuredApiResponse(payload) {
  // Contrat structuré demandé (en plus du texte pour compat front)
  return {
    summary: payload.summary,
    priority: payload.priority,
    recommendedActions: payload.recommendedActions.map((a) => ({
      title: String(a.action).slice(0, 120),
      description: a.action,
      responsibleRole: a.responsibleRole,
      dueInDays: a.dueInDays,
      evidenceExpected: a.evidenceExpected,
      closureCriteria: a.closureCriteria,
      isoReference: a.isoReference ?? undefined,
      confidence: a.confidence ?? 0.5
    })),
    confidence: payload.confidence ?? 0.5,
    humanValidationRequired: true
  };
}

function buildIncidentCausesFallback(incident) {
  const ref = String(incident?.ref || incident?.id || 'INC').trim() || 'INC';
  const type = String(incident?.type || '').trim();
  const severity = String(incident?.severity || '').trim();
  const desc = String(incident?.description || '').trim();
  const context = [type, severity, desc].filter(Boolean).join(' — ');
  const header = context ? `Analyse (heuristique) — ${context}` : 'Analyse (heuristique) — incident déclaré';
  return [
    header,
    '',
    '1) Milieu : état des zones de circulation, signalisation, éclairage, météo / poussières.',
    "   Action (≤30j) : sécuriser zones à risque, baliser, vérifier éclairage / nettoyage, brief 10 min quotidien.",
    '',
    "2) Méthode / Management : procédures (PTW/LOTO), supervision, consignes, coordination entreprises.",
    "   Action (≤30j) : revue procédure + rappel consignes, check-list terrain, audits flash hebdo.",
    '',
    "3) Matériel / Humain : intégrité équipements, maintenance, EPI, formation / fatigue.",
    '   Action (≤30j) : contrôle maintenance prioritaire + vérification EPI + refresh formation ciblée.',
    '',
    `Réf. dossier : ${ref} — valider sur le terrain avant décision.`
  ].join('\n');
}

function buildRiskMitigationFallback(risk) {
  const title = String(risk?.title || 'Risque').trim() || 'Risque';
  const cat = String(risk?.category || '').trim();
  const head = cat ? `${title} — ${cat}` : title;
  return [
    `Mesures de maîtrise (heuristique) — ${head}`,
    '',
    '1) Mesure collective (prioritaire) : supprimer / isoler le danger à la source (capotage, garde-corps, ventilation).',
    '   Coût : moyen — Délai : 14 jours',
    '',
    '2) Mesure organisationnelle : procédure + permis de travail + supervision, limitation d’accès, briefing poste.',
    '   Coût : faible — Délai : 7 jours',
    '',
    '3) Mesure individuelle (EPI) : EPI adaptés + contrôle du port + stock/tailles.',
    '   Coût : faible — Délai : 3 jours'
  ].join('\n');
}

function buildAuditQuestionsFallback(auditType) {
  const t = String(auditType || 'audit général').trim() || 'audit général';
  return [
    `Grille d'audit (heuristique) — ${t}`,
    '1) Les zones de circulation sont-elles balisées et dégagées ? (OUI/NON/NA)',
    '2) Les EPI obligatoires sont-ils disponibles et portés correctement ? (OUI/NON/NA)',
    '3) Les équipements critiques ont-ils une maintenance à jour ? (OUI/NON/NA)',
    '4) Les procédures clés sont-elles connues et appliquées (PTW/LOTO) ? (OUI/NON/NA)',
    '5) Les formations obligatoires sont-elles à jour (SST, incendie, conduite) ? (OUI/NON/NA)',
    '6) Les risques majeurs du poste sont-ils affichés et compris ? (OUI/NON/NA)',
    '7) Les enregistrements (check-lists, fiches) sont-ils disponibles et cohérents ? (OUI/NON/NA)',
    '8) Les non-conformités sont-elles traitées avec des actions et des délais ? (OUI/NON/NA)'
  ].join('\n');
}

function buildDashboardInsightFallback(stats) {
  const incidents = clampInt(stats?.incidents ?? 0, 0, 1_000_000, 0);
  const criticalIncidents = clampInt(stats?.criticalIncidents ?? 0, 0, 1_000_000, 0);
  const actionsOverdue = clampInt(stats?.actionsOverdue ?? 0, 0, 1_000_000, 0);
  const risksOpen = clampInt(stats?.risksOpen ?? 0, 0, 1_000_000, 0);
  const score = Number(stats?.avgAuditScore);
  const scorePart = Number.isFinite(score) ? `Score audits moyen ~${Math.round(score)}/100.` : 'Score audits: données insuffisantes.';
  const alert =
    actionsOverdue > 0 || criticalIncidents > 0
      ? 'Point d’alerte: prioriser incidents critiques et retards d’actions.'
      : 'Point d’alerte: surveiller la dérive et maintenir la discipline terrain.';
  const reco =
    actionsOverdue > 0
      ? 'Recommandation: faire une revue des actions en retard et réaffecter les responsables sous 7 jours.'
      : 'Recommandation: planifier 1 audit flash ciblé (zones à risque) et formaliser 3 mesures de prévention.';
  return [
    `Constat: ${incidents} incident(s) déclarés, ${risksOpen} risque(s) ouvert(s), ${actionsOverdue} action(s) en retard.`,
    scorePart,
    alert,
    reco
  ].join('\n\n');
}

function validateAuditQuestionsPayload(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const questions = v.questions;
  if (!Array.isArray(questions) || questions.length < 1) return null;
  const norm = questions
    .slice(0, 12)
    .map((q) => {
      if (!q || typeof q !== 'object' || Array.isArray(q)) return null;
      const question = String(q.question || '').trim();
      if (!question) return null;
      return { question };
    })
    .filter(Boolean);
  return norm.length ? { questions: norm.slice(0, 8) } : null;
}

function formatAuditQuestionsText(payload) {
  return payload.questions
    .slice(0, 8)
    .map((q, i) => `${i + 1}) ${q.question} (OUI/NON/NA)`)
    .join('\n');
}

function validateDashboardInsightPayload(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const constat = String(v.constat || '').trim();
  const alerte = String(v.alerte || '').trim();
  const recommandation = String(v.recommandation || '').trim();
  if (!constat || !recommandation) return null;
  return { constat, alerte: alerte || null, recommandation };
}

function formatDashboardInsightText(payload) {
  const parts = [`Constat: ${payload.constat}`];
  if (payload.alerte) parts.push(`Point d’alerte: ${payload.alerte}`);
  parts.push(`Recommandation: ${payload.recommandation}`);
  return parts.join('\n\n');
}

async function requestStructuredJson({ schemaHint, userPrompt }) {
  const system = SYSTEM_PROMPT;
  const user = `${userPrompt}\n\nSCHEMA JSON ATTENDU:\n${schemaHint}\n\nRAPPEL: reponds UNIQUEMENT en JSON valide.`;
  return requestJsonCompletion({ system, user });
}

function isProbablyRawTextLeak(rawText) {
  const t = String(rawText || '').trim();
  if (!t) return false;
  if (t.startsWith('{') || t.startsWith('[')) return false;
  return true;
}

export async function suggestIncidentCauses(incident) {
  const persistSuggestion = incident?.persistSuggestion === true;
  const tenantId = incident?.tenantId ?? null;
  const userId = incident?.userId ?? null;
  const cleanIncident =
    incident && typeof incident === 'object' && incident !== null
      ? Object.fromEntries(Object.entries(incident).filter(([k]) => !['persistSuggestion', 'tenantId', 'userId'].includes(k)))
      : {};

  const prompt = `Incident QHSE déclaré (contexte):
- Type : ${String(cleanIncident?.type || 'Non precise')}
- Gravite : ${String(cleanIncident?.severity || 'Non precise')}
- Site : ${String(cleanIncident?.site || 'Non precise')}
- Description : ${String(cleanIncident?.description || 'Non precise')}

Objectif:
- produire une synthèse opérationnelle et 3 actions SMART (spécifiques, mesurables, preuve attendue, critères de clôture).
- "Former le personnel" seul est interdit: préciser qui/quoi/quand/comment + preuve + critère de clôture.
- Ajouter une référence ISO 45001 uniquement si certain; sinon isoReference=null.
- humanValidationRequired doit être true.`;

  const schemaHint = JSON.stringify(
    {
      type: 'incident_analysis',
      confidence: 0.0,
      content: {
        summary: 'string',
        findings: ['string'],
        recommendedActions: [
          {
            action: 'string',
            responsibleRole: 'string',
            dueInDays: 7,
            evidenceExpected: ['string'],
            closureCriteria: 'string',
            isoReference: 'ISO 45001 ... | null',
            confidence: 0.0
          }
        ],
        priority: 'low|medium|high|critical',
        humanValidationRequired: true,
        disclaimer: 'Suggestion IA à valider par un responsable habilité.'
      }
    },
    null,
    2
  );

  const aiRes = await requestStructuredJson({ schemaHint, userPrompt: prompt });
  const valid =
    aiRes.success && aiRes.data?.content ? validateSmartRecommendationPayload(aiRes.data.content) : null;
  const fallbackUsed = !valid || isProbablyRawTextLeak(aiRes.rawText) || Boolean(aiRes.error);
  const providerMeta = makeProviderMeta(aiRes, fallbackUsed);

  const responseStructured =
    valid ??
    {
      summary: 'Analyse (heuristique) — causes probables et plan d’actions à valider sur site.',
      priority: 'high',
      recommendedActions: [
        {
          action:
            "Balisage immédiat + séparation engins/piétons sur la zone décrite, avec briefing 10 min en prise de poste.",
          responsibleRole: 'Encadrement',
          dueInDays: 3,
          evidenceExpected: ['Photos zone balisée', 'Feuille de briefing signée', 'Plan de circulation affiché'],
          closureCriteria:
            'Zone conforme au plan de circulation, aucun écart observé lors de 2 visites terrain consécutives.',
          isoReference: null,
          confidence: 0.62
        },
        {
          action:
            'Revue PTW/LOTO (si applicable) + contrôle flash sur 10 interventions similaires avec check-list.',
          responsibleRole: 'Responsable QHSE',
          dueInDays: 7,
          evidenceExpected: [
            'Check-lists signées',
            'Liste interventions contrôlées',
            'Registre écarts enregistrés/traités'
          ],
          closureCriteria: '≥90% conformité sur les contrôles et écarts résiduels planifiés/assignés.',
          isoReference: null,
          confidence: 0.56
        },
        {
          action:
            'Contrôle équipement/EPI ciblé sur le poste concerné (état, disponibilité, port) + correction des manquants.',
          responsibleRole: 'Maintenance',
          dueInDays: 10,
          evidenceExpected: [
            'Fiche contrôle EPI/équipement',
            'Bon de commande / sortie magasin (si besoin)'
          ],
          closureCriteria: '100% EPI requis disponible et porté sur 2 contrôles terrain aléatoires.',
          isoReference: null,
          confidence: 0.5
        }
      ],
      confidence: 0.55,
      humanValidationRequired: true
    };

  let suggestionId = null;
  if (persistSuggestion) {
    try {
      const created = await persistSuggestionDraftLocal({
        tenantId,
        type: 'incident_root_cause',
        context: { incident: cleanIncident },
        response: responseStructured,
        summary: 'Causes racines probables (5M) — revue obligatoire.',
        warnings: ['Brouillon IA — validation humaine obligatoire avant action.'],
        providerMeta,
        userId,
        targetIncidentId: cleanIncident?.id ?? null
      });
      suggestionId = created?.id || null;
    } catch {
      suggestionId = null;
    }
  }

  if (!valid) {
    return {
      suggestion: `${buildIncidentCausesFallback(cleanIncident)}\n\n---\n\n${formatSmartRecommendationText(
        responseStructured
      )}`,
      structured: toStructuredApiResponse(responseStructured),
      providerMeta,
      ...(suggestionId ? { suggestionId } : {})
    };
  }
  return {
    suggestion: formatSmartRecommendationText(valid),
    structured: toStructuredApiResponse(valid),
    providerMeta,
    ...(suggestionId ? { suggestionId } : {})
  };
}

export async function suggestRiskMitigation(risk) {
  const persistSuggestion = risk?.persistSuggestion === true;
  const tenantId = risk?.tenantId ?? null;
  const userId = risk?.userId ?? null;
  const cleanRisk =
    risk && typeof risk === 'object' && risk !== null
      ? Object.fromEntries(Object.entries(risk).filter(([k]) => !['persistSuggestion', 'tenantId', 'userId'].includes(k)))
      : {};

  const prompt = `Risque professionnel identifié (contexte):
- Titre : ${String(cleanRisk?.title || 'Non precise')}
- Categorie : ${String(cleanRisk?.category || 'Non precise')}
- Probabilite : ${String(cleanRisk?.probability ?? 'N/A')}/5
- Gravite : ${String(cleanRisk?.severity ?? 'N/A')}/5
- Description : ${String(cleanRisk?.description || 'Non precise')}

Objectif:
- produire une synthèse et 3 actions SMART (collective, organisationnelle, EPI) avec preuve + critère de clôture.
- chaque action doit être vérifiable; pas de généralités.
- isoReference: ISO 45001 uniquement si certain; sinon null.
- humanValidationRequired doit être true.`;

  const schemaHint = JSON.stringify(
    {
      type: 'risk_analysis',
      confidence: 0.0,
      content: {
        summary: 'string',
        findings: ['string'],
        recommendedActions: [
          {
            action: 'string',
            responsibleRole: 'string',
            dueInDays: 7,
            evidenceExpected: ['string'],
            closureCriteria: 'string',
            isoReference: 'ISO 45001 ... | null',
            confidence: 0.0
          }
        ],
        priority: 'low|medium|high|critical',
        // champs risques (complément)
        danger: 'string',
        hazardousSituation: 'string',
        consequences: ['string'],
        gravity: '1-5 ou texte',
        frequency: 'faible|moyenne|élevée',
        controls: ['string'],
        humanValidationRequired: true,
        disclaimer: 'Suggestion IA à valider par un responsable habilité.'
      }
    },
    null,
    2
  );

  const aiRes = await requestStructuredJson({ schemaHint, userPrompt: prompt });
  const valid =
    aiRes.success && aiRes.data?.content ? validateSmartRecommendationPayload(aiRes.data.content) : null;
  const fallbackUsed = !valid || isProbablyRawTextLeak(aiRes.rawText) || Boolean(aiRes.error);
  const providerMeta = makeProviderMeta(aiRes, fallbackUsed);

  const responseStructured =
    valid ??
    {
      summary: 'Plan de maîtrise (heuristique) — à valider avec le registre risques.',
      priority: 'high',
      recommendedActions: [
        {
          action:
            'Mesure collective: isoler le danger (protection physique/technique) sur le poste ciblé; définir un périmètre sécurisé.',
          responsibleRole: 'Maintenance',
          dueInDays: 14,
          evidenceExpected: ['PV installation/protection', 'Photos avant/après', 'Plan de zone mis à jour'],
          closureCriteria: 'Protection en place, testée, et 0 écart sur 2 contrôles terrain.',
          isoReference: null,
          confidence: 0.58
        },
        {
          action:
            'Mesure organisationnelle: procédure + briefing poste + contrôle hebdo (check-list) avec suivi des écarts.',
          responsibleRole: 'Responsable QHSE',
          dueInDays: 7,
          evidenceExpected: [
            'Procédure/consigne diffusée',
            'Feuilles briefing',
            'Check-lists',
            'Registre écarts'
          ],
          closureCriteria: '≥90% conformité sur 2 semaines et écarts restants assignés avec échéances.',
          isoReference: null,
          confidence: 0.55
        },
        {
          action:
            'Mesure EPI: définir EPI requis, vérifier stock/tailles, contrôler le port sur 10 observations aléatoires.',
          responsibleRole: 'Encadrement',
          dueInDays: 3,
          evidenceExpected: [
            'Liste EPI requis',
            'Inventaire stock',
            'Fiche 10 observations',
            'Actions correctives (si besoin)'
          ],
          closureCriteria: '100% EPI requis disponible et porté sur 10 observations.',
          isoReference: null,
          confidence: 0.52
        }
      ],
      confidence: 0.55,
      humanValidationRequired: true
    };

  let suggestionId = null;
  if (persistSuggestion) {
    try {
      const created = await persistSuggestionDraftLocal({
        tenantId,
        type: 'risk_mitigation',
        context: { risk: cleanRisk },
        response: responseStructured,
        summary: `Mesures de maîtrise proposées — ${String(cleanRisk?.title || 'risque').slice(0, 200)}.`,
        warnings: ['Brouillon IA — validation humaine obligatoire avant action.'],
        providerMeta,
        userId,
        riskRef: cleanRisk?.ref ?? null
      });
      suggestionId = created?.id || null;
    } catch {
      suggestionId = null;
    }
  }

  if (!valid) {
    return {
      suggestion: `${buildRiskMitigationFallback(cleanRisk)}\n\n---\n\n${formatSmartRecommendationText(
        responseStructured
      )}`,
      structured: toStructuredApiResponse(responseStructured),
      providerMeta,
      ...(suggestionId ? { suggestionId } : {})
    };
  }
  return {
    suggestion: formatSmartRecommendationText(valid),
    structured: toStructuredApiResponse(valid),
    providerMeta,
    ...(suggestionId ? { suggestionId } : {})
  };
}

export async function suggestAuditQuestions(auditType) {
  const prompt = `Prépare une grille d'audit QHSE pour le type : "${String(auditType || 'audit general')}".
Objectif:
- produire une synthèse et exactement 8 points d'audit SMART sous forme d'actions/questions fermées (OUI/NON/NA).
- chaque point doit préciser la preuve attendue et un critère de clôture.
- humanValidationRequired doit être true.`;

  const schemaHint = JSON.stringify(
    {
      type: 'audit_analysis',
      confidence: 0.0,
      content: {
        summary: 'string',
        findings: ['string'],
        recommendedActions: [
          {
            action: 'Question/constat SMART (OUI/NON/NA) ...',
            responsibleRole: 'string',
            dueInDays: 0,
            evidenceExpected: ['string'],
            closureCriteria: 'string',
            isoReference: 'ISO 45001 ... | null',
            confidence: 0.0
          }
        ],
        priority: 'low|medium|high|critical',
        // champs audits (complément)
        observations: ['string'],
        nonConformities: [
          {
            gap: 'string',
            criticality: 'low|medium|high|critical',
            expectedEvidence: ['string']
          }
        ],
        humanValidationRequired: true,
        disclaimer: 'Suggestion IA à valider par un responsable habilité.'
      }
    },
    null,
    2
  );

  const aiRes = await requestStructuredJson({ schemaHint, userPrompt: prompt });
  const valid =
    aiRes.success && aiRes.data?.content ? validateSmartRecommendationPayload(aiRes.data.content) : null;
  const fallbackUsed = !valid || isProbablyRawTextLeak(aiRes.rawText) || Boolean(aiRes.error);
  const providerMeta = makeProviderMeta(aiRes, fallbackUsed);
  if (!valid) {
    // Pour compat UX: on garde la grille simple + une version "SMART" derrière séparateur.
    const smartFallback = {
      summary: `Grille d'audit (heuristique) — ${String(auditType || 'audit général')}`,
      priority: 'medium',
      recommendedActions: [
        {
          action: "Les zones de circulation sont-elles balisées et dégagées ? (OUI/NON/NA)",
          responsibleRole: 'Responsable QHSE',
          dueInDays: 0,
          evidenceExpected: ['Photos/plan de circulation', 'Rondes signées', 'Signalisation en place'],
          closureCriteria: 'Signalisation conforme et aucun obstacle critique constaté sur la visite.',
          isoReference: null,
          confidence: 0.6
        }
      ],
      confidence: 0.55,
      humanValidationRequired: true
    };
    return {
      suggestion: `${buildAuditQuestionsFallback(auditType)}\n\n---\n\n${formatSmartRecommendationText(
        smartFallback
      )}`,
      structured: toStructuredApiResponse(smartFallback),
      providerMeta
    };
  }
  // On rend en texte sous forme "liste" (action = question)
  const text = valid.recommendedActions
    .slice(0, 8)
    .map((a, i) => `${i + 1}) ${a.action}\n   Preuve: ${a.evidenceExpected}\n   Clôture: ${a.closureCriteria}`)
    .join('\n\n');
  return {
    suggestion: `${valid.summary}\n\n${text}`,
    structured: toStructuredApiResponse(valid),
    providerMeta
  };
}

export async function generateDashboardInsight(stats) {
  const persistSuggestion = stats?.persistSuggestion === true;
  const tenantId = stats?.tenantId ?? null;
  const userId = stats?.userId ?? null;
  const cleanStats =
    stats && typeof stats === 'object' && stats !== null
      ? Object.fromEntries(Object.entries(stats).filter(([k]) => !['persistSuggestion', 'tenantId', 'userId'].includes(k)))
      : {};

  const prompt = `Analyse ces indicateurs QHSE (hebdo) :
- Incidents déclarés : ${String(cleanStats?.incidents ?? 0)} (dont ${String(cleanStats?.criticalIncidents ?? 0)} critiques)
- Risques ouverts : ${String(cleanStats?.risksOpen ?? 0)}
- Actions en retard : ${String(cleanStats?.actionsOverdue ?? 0)}
- Score moyen audits : ${String(cleanStats?.avgAuditScore ?? 'N/A')}/100

Objectif:
- produire une synthèse (summary), une priorité (P1/P2/P3) et 3 actions SMART (preuves + clôture).
- ne pas inventer de faits, rester strictement aligné aux KPI fournis.
- isoReference: ISO 45001 uniquement si certain; sinon null.
- humanValidationRequired doit être true.`;

  const schemaHint = JSON.stringify(
    {
      type: 'audit_analysis',
      confidence: 0.0,
      content: {
        summary: 'string',
        findings: ['string'],
        recommendedActions: [
          {
            action: 'string',
            responsibleRole: 'string',
            dueInDays: 7,
            evidenceExpected: ['string'],
            closureCriteria: 'string',
            isoReference: 'ISO 45001 ... | null',
            confidence: 0.0
          }
        ],
        priority: 'low|medium|high|critical',
        humanValidationRequired: true,
        disclaimer: 'Suggestion IA à valider par un responsable habilité.'
      }
    },
    null,
    2
  );

  const aiRes = await requestStructuredJson({ schemaHint, userPrompt: prompt });
  const valid =
    aiRes.success && aiRes.data?.content ? validateSmartRecommendationPayload(aiRes.data.content) : null;
  const fallbackUsed = !valid || isProbablyRawTextLeak(aiRes.rawText) || Boolean(aiRes.error);
  const providerMeta = makeProviderMeta(aiRes, fallbackUsed);

  const responseStructured =
    valid ??
    {
      summary: 'Synthèse (heuristique) — à valider par la Direction/QHSE.',
      priority: 'high',
      recommendedActions: [
        {
          action:
            "Tenir un point de pilotage hebdo (15 min) sur retards d’actions et incidents critiques; décider 3 arbitrages immédiats.",
          responsibleRole: 'Direction site',
          dueInDays: 3,
          evidenceExpected: [
            'Compte-rendu 1 page',
            'Liste décisions (responsable/échéance)',
            'Diffusion aux porteurs'
          ],
          closureCriteria: 'Décisions actées et 100% des actions critiques assignées avec échéance.',
          isoReference: null,
          confidence: 0.58
        }
      ],
      confidence: 0.55,
      humanValidationRequired: true
    };

  let suggestionId = null;
  if (persistSuggestion) {
    try {
      const created = await persistSuggestionDraftLocal({
        tenantId,
        type: 'dashboard_insight',
        context: { stats: cleanStats },
        response: responseStructured,
        summary: 'Insight hebdomadaire — revue obligatoire.',
        warnings: ['Brouillon IA — validation humaine obligatoire avant action.'],
        providerMeta,
        userId
      });
      suggestionId = created?.id || null;
    } catch {
      suggestionId = null;
    }
  }

  if (!valid) {
    return {
      insight: `${buildDashboardInsightFallback(cleanStats)}\n\n---\n\n${formatSmartRecommendationText(
        responseStructured
      )}`,
      structured: toStructuredApiResponse(responseStructured),
      providerMeta,
      ...(suggestionId ? { suggestionId } : {})
    };
  }
  return {
    insight: formatSmartRecommendationText(valid),
    structured: toStructuredApiResponse(valid),
    providerMeta,
    ...(suggestionId ? { suggestionId } : {})
  };
}
