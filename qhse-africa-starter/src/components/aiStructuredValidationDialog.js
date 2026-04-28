import { escapeHtml } from '../utils/escapeHtml.js';
import { applyNativeDialogColorScheme } from '../utils/nativeDialogTheme.js';

const STYLE_ID = 'qhse-ai-structured-validation-dialog';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
.qhse-ai-val-dlg{border:none;border-radius:14px;max-width:min(720px,96vw);padding:0;background:var(--bg,#0f172a);color:var(--text);box-shadow:0 24px 64px rgba(0,0,0,.55)}
.qhse-ai-val-dlg::backdrop{background:rgba(0,0,0,.55)}
.qhse-ai-val-dlg__inner{padding:18px 20px 18px}
.qhse-ai-val-dlg__head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
.qhse-ai-val-dlg__title{margin:0;font-size:16px;font-weight:900}
.qhse-ai-val-dlg__meta{font-size:12px;color:var(--text3);margin:0 0 12px}
.qhse-ai-badge{display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-radius:999px;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.08);color:#e2e8f0;font-size:12px;font-weight:800}
.qhse-ai-badge__dot{width:7px;height:7px;border-radius:999px;background:#38bdf8;box-shadow:0 0 0 4px rgba(56,189,248,.12)}
.qhse-ai-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px}
.qhse-ai-chip{display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.22);background:rgba(148,163,184,.08);font-size:12px;font-weight:900}
.qhse-ai-chip--ok{border-color:rgba(16,185,129,.28);background:rgba(16,185,129,.10)}
.qhse-ai-chip--warn{border-color:rgba(245,158,11,.28);background:rgba(245,158,11,.10)}
.qhse-ai-chip--low{border-color:rgba(239,68,68,.26);background:rgba(239,68,68,.10)}
.qhse-ai-chip__dot{width:7px;height:7px;border-radius:999px;background:rgba(148,163,184,.9)}
.qhse-ai-chip--ok .qhse-ai-chip__dot{background:#10b981}
.qhse-ai-chip--warn .qhse-ai-chip__dot{background:#f59e0b}
.qhse-ai-chip--low .qhse-ai-chip__dot{background:#ef4444}
.qhse-ai-mini-loader{display:inline-flex;align-items:center;gap:8px}
.qhse-ai-spinner{width:14px;height:14px;border-radius:999px;border:2px solid rgba(148,163,184,.25);border-top-color:rgba(56,189,248,.95);animation:qhseAiSpin .9s linear infinite}
@keyframes qhseAiSpin{to{transform:rotate(360deg)}}
.qhse-ai-disclaimer{margin:8px 0 12px;font-size:12px;color:var(--text3);line-height:1.45}
.qhse-ai-val-grid{display:grid;grid-template-columns:1fr;gap:12px}
.qhse-ai-val-box{border:1px solid var(--color-border, rgba(148,163,184,.18));background:rgba(15,23,42,.35);border-radius:12px;padding:12px}
.qhse-ai-val-box__title{margin:0 0 8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);font-weight:900}
.qhse-ai-val-text{width:100%;min-height:88px;resize:vertical}
.qhse-ai-val-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;justify-content:flex-end}
.qhse-ai-val-actions .text-button{font-weight:800}
`;
  document.head.append(el);
}

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

function confidenceLabel(conf) {
  const c = Number(conf);
  if (!Number.isFinite(c)) return { label: 'Confiance moyenne', tone: 'warn' };
  if (c >= 0.8) return { label: 'Confiance élevée', tone: 'ok' };
  if (c >= 0.5) return { label: 'Confiance moyenne', tone: 'warn' };
  return { label: 'Confiance faible', tone: 'low' };
}

function providerModeLabel(providerMeta) {
  const mode = providerMeta && typeof providerMeta === 'object' ? String(providerMeta.mode || '') : '';
  if (mode === 'mock') return 'Mode fallback/mock';
  if (mode && mode !== 'openai') return `Mode fallback (${mode})`;
  return '';
}

/**
 * @param {{
 *  title: string,
 *  typeLabel?: string,
 *  ai: { providerMeta?: any, structured?: any, suggestionText?: string },
 *  primaryLabel?: string,
 *  secondaryLabel?: string,
 *  onApply: (payload: { summary: string, findings: string[], recommendedActionsText: string, confidence: number, type: string }) => Promise<void> | void,
 *  onValidate?: (payload: { summary: string, findings: string[], recommendedActionsText: string, confidence: number, type: string }) => Promise<void> | void
 * }} opts
 */
export function openAiStructuredValidationDialog(opts) {
  ensureStyles();
  const dlg = document.createElement('dialog');
  dlg.className = 'qhse-ai-val-dlg';

  const structured = opts?.ai?.structured && typeof opts.ai.structured === 'object' ? opts.ai.structured : {};
  const type = String(structured?.type || '').trim() || 'unknown';
  const confidence = Number(structured?.confidence);
  const conf = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5;
  const content = structured?.content && typeof structured.content === 'object' ? structured.content : {};
  const confUi = confidenceLabel(conf);
  const modeLine = providerModeLabel(opts?.ai?.providerMeta);

  const summary0 = String(content.summary || '').trim();
  const findings0 = safeArray(content.findings).map((x) => String(x || '').trim()).filter(Boolean);
  const rec0 = safeArray(content.recommendedActions).map((x) => String(x || '').trim()).filter(Boolean);
  const suggestionText = String(opts?.ai?.suggestionText || '').trim();

  const inner = document.createElement('div');
  inner.className = 'qhse-ai-val-dlg__inner';
  const primaryLabel = String(opts?.primaryLabel || 'Valider et créer').trim() || 'Valider et créer';
  const secondaryLabel = String(opts?.secondaryLabel || 'Ignorer').trim() || 'Ignorer';
  inner.innerHTML = `
    <div class="qhse-ai-val-dlg__head">
      <div>
        <div class="qhse-ai-badge" title="Suggestion IA à valider avant création">
          <span class="qhse-ai-badge__dot" aria-hidden="true"></span>
          Suggestion IA à valider
        </div>
        <h2 class="qhse-ai-val-dlg__title">${escapeHtml(String(opts?.title || 'Suggestion IA'))}</h2>
      </div>
      <button type="button" class="btn btn-secondary qhse-ai-val-close">Fermer</button>
    </div>
    <p class="qhse-ai-val-dlg__meta">
      Type: <strong>${escapeHtml(type)}</strong> · Confiance: <strong>${Math.round(conf * 100)}%</strong>
    </p>

    <div class="qhse-ai-chips">
      <span class="qhse-ai-chip qhse-ai-chip--ok" title="Analyse réussie">
        <span class="qhse-ai-chip__dot" aria-hidden="true"></span>
        Analyse réussie
      </span>
      <span class="qhse-ai-chip qhse-ai-chip--${confUi.tone}" title="Niveau de confiance">
        <span class="qhse-ai-chip__dot" aria-hidden="true"></span>
        ${escapeHtml(confUi.label)}
      </span>
      <span class="qhse-ai-chip qhse-ai-chip--warn" title="Validation requise">
        <span class="qhse-ai-chip__dot" aria-hidden="true"></span>
        Validation requise
      </span>
      ${modeLine ? `<span class="qhse-ai-chip" title="Mode IA">${escapeHtml(modeLine)}</span>` : ''}
    </div>

    <p class="qhse-ai-disclaimer">
      L’IA propose une aide à la décision. La validation finale reste humaine.
    </p>
    <p class="qhse-ai-disclaimer" style="margin-top:-6px">
      Les champs sont préremplis par l’IA. Vérifiez avant validation.
    </p>

    <div class="qhse-ai-val-grid">
      <div class="qhse-ai-val-box">
        <p class="qhse-ai-val-box__title">Résumé</p>
        <textarea class="control-input qhse-ai-val-summary qhse-ai-val-text" placeholder="Résumé exploitable..."></textarea>
      </div>
      <div class="qhse-ai-val-box">
        <p class="qhse-ai-val-box__title">Constats / points clés</p>
        <textarea class="control-input qhse-ai-val-findings qhse-ai-val-text" placeholder="1 ligne = 1 constat..."></textarea>
      </div>
      <div class="qhse-ai-val-box">
        <p class="qhse-ai-val-box__title">Actions recommandées (pré-remplissage)</p>
        <textarea class="control-input qhse-ai-val-actions-text qhse-ai-val-text" placeholder="1 ligne = 1 action..."></textarea>
      </div>
      ${
        suggestionText
          ? `<div class="qhse-ai-val-box">
              <p class="qhse-ai-val-box__title">Texte brut (référence)</p>
              <pre style="margin:0;white-space:pre-wrap;line-height:1.55;font-size:12px;color:var(--text2)">${escapeHtml(suggestionText.slice(0, 6000))}</pre>
            </div>`
          : ''
      }
    </div>

    <div class="qhse-ai-val-actions">
      <button type="button" class="text-button qhse-ai-val-ignore">${escapeHtml(secondaryLabel)}</button>
      <button type="button" class="btn btn-primary qhse-ai-val-validate">${escapeHtml(primaryLabel)}</button>
    </div>
  `;

  dlg.append(inner);
  document.body.append(dlg);
  applyNativeDialogColorScheme(dlg);

  const summaryEl = inner.querySelector('.qhse-ai-val-summary');
  const findingsEl = inner.querySelector('.qhse-ai-val-findings');
  const actionsEl = inner.querySelector('.qhse-ai-val-actions-text');

  summaryEl.value = summary0;
  findingsEl.value = findings0.join('\n');
  actionsEl.value = rec0.join('\n');

  function close() {
    dlg.close();
  }

  inner.querySelector('.qhse-ai-val-close').addEventListener('click', close);
  inner.querySelector('.qhse-ai-val-ignore').addEventListener('click', close);
  dlg.addEventListener('close', () => dlg.remove());

  inner.querySelector('.qhse-ai-val-validate').addEventListener('click', async () => {
    const summary = String(summaryEl.value || '').trim();
    const findings = String(findingsEl.value || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
    const recommendedActionsText = String(actionsEl.value || '').trim();
    const handler = typeof opts.onApply === 'function' ? opts.onApply : opts.onValidate;
    if (typeof handler === 'function') {
      await handler({ summary, findings, recommendedActionsText, confidence: conf, type });
    }
    close();
  });

  dlg.showModal();
}

