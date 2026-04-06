/**
 * Fournisseur IA externe — désactivé par défaut (aucune fuite vers le cloud).
 * Activer uniquement avec AI_ALLOW_EXTERNAL=true + OPENAI_API_KEY (+ modèle optionnel).
 * Les données ne sont jamais persistées côté provider par ce module.
 */

/**
 * @returns {boolean}
 */
export function isExternalAiEnabled() {
  return (
    process.env.AI_ALLOW_EXTERNAL === 'true' &&
    Boolean(process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim().length > 0)
  );
}

/**
 * Appel optionnel à un LLM pour obtenir du JSON texte — à valider côté app avant usage.
 * @param {{ system: string, user: string }} messages
 * @returns {Promise<{ provider: string, rawText: string | null, error?: string }>}
 */
export async function requestJsonCompletion(messages) {
  if (!isExternalAiEnabled()) {
    return { provider: 'none', rawText: null };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const key = String(process.env.OPENAI_API_KEY).trim();

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: messages.system },
          { role: 'user', content: messages.user }
        ]
      })
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return {
        provider: 'openai',
        rawText: null,
        error: `HTTP ${res.status} ${t.slice(0, 200)}`
      };
    }

    const data = await res.json();
    const rawText =
      data?.choices?.[0]?.message?.content != null
        ? String(data.choices[0].message.content)
        : null;
    return { provider: 'openai', rawText };
  } catch (e) {
    return {
      provider: 'openai',
      rawText: null,
      error: e instanceof Error ? e.message : String(e)
    };
  }
}
