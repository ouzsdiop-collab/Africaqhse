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
 * @returns {Promise<{ provider: string, model: string | null, rawText: string | null, error?: string | null }>}
 */
export async function callAiProvider(systemPrompt, userMessage, maxTokens = 500) {
  const mode = resolveAiProvider();
  if (mode === 'mock') {
    return { provider: 'mock', model: null, rawText: null, error: null };
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
        return { provider, model, rawText: null, error: lastErr };
      }
      const data = await res.json();
      const rawText =
        data?.choices?.[0]?.message?.content != null
          ? String(data.choices[0].message.content)
          : null;
      return { provider, model, rawText, error: null };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  return {
    provider: isOpenAi ? 'openai' : 'mistral',
    model,
    rawText: null,
    error: lastErr
  };
}

/**
 * @param {{ system: string, user: string }} messages
 * @returns {Promise<{
 *   success: boolean,
 *   data: object | null,
 *   rawText: string | null,
 *   provider: string,
 *   model: string | null,
 *   error: string | null
 * }>}
 */
export async function requestJsonCompletion(messages) {
  const res = await callAiProvider(messages.system, messages.user, 1200);
  const provider = String(res?.provider || 'mock');
  const model = res?.model ?? null;
  const rawText = res?.rawText != null ? String(res.rawText) : null;
  const baseError = res?.error != null ? String(res.error) : null;

  /** @type {object | null} */
  let data = null;
  /** @type {string | null} */
  let error = baseError;

  /**
   * Normalise vers un contrat métier minimal:
   * { type: string, confidence: number, content: object }
   *
   * - si le JSON ne respecte pas -> encapsulation dans content
   * - si JSON.parse échoue mais rawText existe -> fallback "unknown" (success=true, confiance faible)
   */
  function normalizeStructuredPayload(parsedAny) {
    let type = 'generic';
    let confidence = 0.5;
    /** @type {Record<string, unknown>} */
    let content = {};

    if (parsedAny && typeof parsedAny === 'object' && !Array.isArray(parsedAny)) {
      const obj = /** @type {Record<string, unknown>} */ (parsedAny);

      // type (défaut si absent)
      const t = obj.type;
      if (typeof t === 'string' && t.trim()) type = t.trim().slice(0, 64);

      // confidence (défaut 0.5 si absent / invalide)
      const c = obj.confidence;
      if (typeof c === 'number' && Number.isFinite(c)) {
        confidence = Math.max(0, Math.min(1, c));
      }

      // content (si absent, on encapsule l'objet entier)
      const ct = obj.content;
      if (ct && typeof ct === 'object' && !Array.isArray(ct)) {
        content = /** @type {Record<string, unknown>} */ (ct);
      } else {
        content = obj;
      }
    } else {
      // JSON valide mais pas un objet (array/string/number) -> encapsule
      type = 'unknown';
      confidence = 0.4;
      content = { value: parsedAny };
    }

    return { type, confidence, content };
  }

  if (!error && rawText) {
    try {
      const parsedAny = JSON.parse(rawText);
      data = normalizeStructuredPayload(parsedAny);
      error = null;
    } catch (e) {
      // Fallback intelligent: on rend exploitable, mais faible confiance.
      const parsedFallback = {
        type: 'unknown',
        confidence: 0.3,
        content: { text: rawText }
      };
      data = parsedFallback;
      error = null;
    }
  }

  const success = Boolean(data);

  if (provider !== 'mock') {
    const t = data && typeof data === 'object' ? String(data.type || '') : '';
    const c = data && typeof data === 'object' ? Number(data.confidence) : NaN;
    if (!success || baseError) {
      const excerpt = rawText ? rawText.slice(0, 400) : '';
      console.error(
        `[ai] requestJsonCompletion provider=${provider} model=${model || 'n/a'} success=${String(success)} type=${t || 'n/a'} confidence=${Number.isFinite(c) ? c : 'n/a'} baseError=${baseError || 'null'} rawExcerpt=${JSON.stringify(excerpt)}`
      );
    }
  }

  return {
    success,
    data,
    rawText,
    provider,
    model,
    error
  };
}
