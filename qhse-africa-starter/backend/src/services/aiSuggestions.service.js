import { Mistral } from '@mistralai/mistralai';

function getMistralClient() {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY manquante dans les variables d'environnement.");
  return new Mistral({ apiKey: key });
}

/** @param {{ content?: string | unknown[] } | undefined} msg */
function assistantMessageText(msg) {
  const c = msg?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c
      .map((chunk) => {
        if (chunk && typeof chunk === 'object' && 'text' in chunk && typeof chunk.text === 'string') {
          return chunk.text;
        }
        return '';
      })
      .join('');
  }
  return '';
}

const SYSTEM_PROMPT = `Tu es un expert QHSE specialise dans la prevention des risques professionnels en Afrique subsaharienne.
Tu reponds toujours en francais, de facon concise et operationnelle.
Tu bases tes reponses sur les normes ISO 45001, ISO 9001 et les reglementations du travail africaines (OHADA, Code du travail).
Tes suggestions sont directement applicables sur le terrain.`;

export async function suggestIncidentCauses(incident) {
  const client = getMistralClient();
  const prompt = `Incident QHSE declare :
- Type : ${incident.type || 'Non precise'}
- Gravite : ${incident.severity || 'Non precise'}
- Site : ${incident.site || 'Non precise'}
- Description : ${incident.description || 'Non precise'}

Identifie les 3 causes racines les plus probables (methode 5M : Milieu, Materiel, Methode, Main-d'oeuvre, Management).
Pour chaque cause, propose une action corrective concrete et realisable dans les 30 jours.
Format : liste numerotee, 2-3 phrases max par cause.`;

  const res = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    maxTokens: 600,
    temperature: 0.3
  });
  return assistantMessageText(res.choices[0]?.message);
}

export async function suggestRiskMitigation(risk) {
  const client = getMistralClient();
  const prompt = `Risque professionnel identifie :
- Titre : ${risk.title || 'Non precise'}
- Categorie : ${risk.category || 'Non precise'}
- Probabilite : ${risk.probability || 'N/A'}/5
- Gravite : ${risk.severity || 'N/A'}/5
- Description : ${risk.description || 'Non precise'}

Propose 3 mesures de prevention et de maitrise du risque :
1 mesure collective (prioritaire), 1 mesure organisationnelle, 1 mesure individuelle (EPI).
Pour chaque mesure, indique le cout approximatif (faible / moyen / eleve) et le delai de mise en oeuvre.
Format : liste numerotee, 2-3 phrases max par mesure.`;

  const res = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    maxTokens: 600,
    temperature: 0.3
  });
  return assistantMessageText(res.choices[0]?.message);
}

export async function suggestAuditQuestions(auditType) {
  const client = getMistralClient();
  const prompt = `Prepare une grille d'audit QHSE pour le type : "${auditType || 'audit general'}".
Genere 8 questions d'audit pertinentes, fermees (OUI/NON/NA), couvrant :
securite physique, equipements, procedures, formation du personnel, documentation, conformite reglementaire.
Format : liste numerotee, 1 ligne par question, sans explications supplementaires.`;

  const res = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    maxTokens: 400,
    temperature: 0.4
  });
  return assistantMessageText(res.choices[0]?.message);
}

export async function generateDashboardInsight(stats) {
  const client = getMistralClient();
  const prompt = `Analyse ces indicateurs QHSE de la semaine :
- Incidents declares : ${stats.incidents ?? 0} (dont ${stats.criticalIncidents ?? 0} critiques)
- Risques ouverts : ${stats.risksOpen ?? 0}
- Actions en retard : ${stats.actionsOverdue ?? 0}
- Score moyen audits : ${stats.avgAuditScore ?? 'N/A'}/100

Redige un insight de 3 phrases maximum :
1 constat principal, 1 point d'alerte si necessaire, 1 recommandation prioritaire.
Ton professionnel et direct.`;

  const res = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    maxTokens: 200,
    temperature: 0.2
  });
  return assistantMessageText(res.choices[0]?.message);
}
