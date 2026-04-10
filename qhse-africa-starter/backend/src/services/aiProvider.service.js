/**
 * Fournisseur IA multi-mode : OpenAI, Mistral ou mock (aucun appel réseau).
 * Contrôlé par AI_PROVIDER=openai|mistral|mock (défaut : mock si absent ou clés manquantes).
 */

/**
 * @returns {'openai' | 'mistral' | 'mock'}
 */
export function resolveAiProvider() {
  const p = String(process.env.AI_PROVIDER || 'mock')
    .toLowerCase()
    .trim();
  if (p === 'openai' && String(process.env.OPENAI_API_KEY || '').trim()) {
    return 'openai';
  }
  if (p === 'mistral' && String(process.env.MISTRAL_API_KEY || '').trim()) {
    return 'mistral';
  }
  return 'mock';
}

/**
 * @returns {boolean}
 */
export function isExternalAiEnabled() {
  return resolveAiProvider() !== 'mock';
}

/**
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} [maxTokens=500]
 * @returns {Promise<{ provider: string, rawText: string | null, error?: string | null }>}
 */
export async function callAiProvider(systemPrompt, userMessage, maxTokens = 500) {
  const mode = resolveAiProvider();
  if (mode === 'mock') {
    return { provider: 'mock', rawText: null, error: null };
  }
  if (mode === 'openai') {
    return chatOpenAiCompatible(
      'https://api.openai.com/v1/chat/completions',
      String(process.env.OPENAI_API_KEY || '').trim(),
      'gpt-4o-mini',
      systemPrompt,
      userMessage,
      maxTokens,
      true
    );
  }
  return chatOpenAiCompatible(
    'https://api.mistral.ai/v1/chat/completions',
    String(process.env.MISTRAL_API_KEY || '').trim(),
    'mistral-small-latest',
    systemPrompt,
    userMessage,
    maxTokens,
    false
  );
}

/**
 * Client HTTP type OpenAI Chat Completions (fetch natif).
 * @param {boolean} isOpenAi — si true, tente `response_format: json_object` puis repli sans.
 */
async function chatOpenAiCompatible(url, apiKey, model, systemPrompt, userMessage, maxTokens, isOpenAi) {
  const baseBody = {
    model,
    temperature: 0.2,
    max_tokens: Math.min(Math.max(64, maxTokens), 4096),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  };

  const attempts = [];
  if (isOpenAi) {
    attempts.push({ ...baseBody, response_format: { type: 'json_object' } });
  }
  attempts.push(baseBody);

  let lastErr = null;
  for (const body of attempts) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const provider = url.includes('mistral') ? 'mistral' : 'openai';
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        lastErr = `HTTP ${res.status} ${t.slice(0, 240)}`;
        if (res.status === 400 && body.response_format) {
          continue;
        }
        return { provider, rawText: null, error: lastErr };
      }
      const data = await res.json();
      const rawText =
        data?.choices?.[0]?.message?.content != null
          ? String(data.choices[0].message.content)
          : null;
      return { provider, rawText, error: null };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return {
    provider: isOpenAi ? 'openai' : 'mistral',
    rawText: null,
    error: lastErr
  };
}

/**
 * @param {{ system: string, user: string }} messages
 * @returns {Promise<{ provider: string, rawText: string | null, error?: string }>}
 */
export async function requestJsonCompletion(messages) {
  return callAiProvider(messages.system, messages.user, 1200);
}
