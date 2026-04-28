/**
 * Panneau d’assistance conformité : analyse locale (API interne) + validation humaine obligatoire.
 */

import { qhseFetch } from '../utils/qhseFetch.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { showToast } from './toast.js';
import { ensureIsoComplianceAssistStyles } from './isoComplianceAssistStyles.js';
import { buildIsoRequirementHistoryTimeline } from '../utils/isoRequirementHistory.js';

function sanitizeClassToken(value, fallback = 'neutral') {
  const token = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '');
  return token || fallback;
}

/**
 * @param {{
 *   requirement: {
 *     id: string;
 *     normId: string;
 *     normCode: string;
 *     clause: string;
 *     title: string;
 *     summary: string;
 *     evidence: string;
 *     status: 'conforme'|'partiel'|'non_conforme';
 *   };
 *   controlledDocuments: { name: string; version?: string }[];
 *   siteId: string | null;
 *   onStatusCommitted: (requirementId: string, status: 'conforme'|'partiel'|'non_conforme', meta: { source: string }) => boolean | Promise<boolean>;
 *   onAiTrace?: (payload: {
 *     aiTraceType: string;
 *     requirementId: string;
 *     suggestedStatus?: string;
 *     chosenStatus?: string;
 *     detail?: string;
 *   }) => void;
 * }} opts
 */
export function openComplianceAssistModal(opts) {
  ensureIsoComplianceAssistStyles();

  const overlay = document.createElement('div');
  overlay.className = 'iso-ca-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'iso-ca-title');

  const panel = document.createElement('div');
  panel.className = 'iso-ca-panel content-card card-soft';

  const head = document.createElement('div');
  head.className = 'iso-ca-head';
  head.innerHTML = `
    <div>
      <p class="section-kicker iso-ca-kicker">Assistance conformité</p>
      <h3 id="iso-ca-title" class="iso-ca-title">Analyse de l’exigence</h3>
      <p class="iso-ca-sub" data-iso-ca-req-label></p>
    </div>
    <button type="button" class="iso-ca-close btn btn-secondary" aria-label="Fermer">✕</button>
  `;

  const body = document.createElement('div');
  body.className = 'iso-ca-body';
  body.innerHTML = `
    <div class="iso-ca-loading" data-iso-ca-loading>
      <p class="iso-ca-loading-text">Analyse en cours…</p>
      <p class="iso-ca-loading-hint">Recoupement avec vos documents maîtrisés, les imports récents et les signaux du tableau de bord (sans service d’IA externe).</p>
    </div>
    <div class="iso-ca-result" data-iso-ca-result hidden>
      <div class="iso-ca-proposed">
        <span class="iso-ca-ia-badge" aria-hidden="true">Suggestion IA</span>
        <span class="iso-ca-proposed-label">Proposition automatique</span>
        <span class="iso-ca-status-pill" data-iso-ca-pill></span>
      </div>
      <p class="iso-ca-explain" data-iso-ca-explain></p>
      <div class="iso-ca-block">
        <h4 class="iso-ca-h4">Actions recommandées</h4>
        <ul class="iso-ca-list" data-iso-ca-actions></ul>
      </div>
      <div class="iso-ca-block" data-iso-ca-docs-wrap>
        <h4 class="iso-ca-h4">Documents rapprochés</h4>
        <ul class="iso-ca-docs" data-iso-ca-docs></ul>
      </div>
      <p class="iso-ca-disclaimer" data-iso-ca-disclaimer></p>
      <div class="iso-ca-human">
        <p class="iso-ca-human-title">Validation humaine obligatoire</p>
        <p class="iso-ca-human-text">Choisissez une action : accepter la proposition, enregistrer un autre statut, ou fermer sans modifier.</p>
        <div class="iso-ca-actions-row">
          <button type="button" class="btn btn-primary" data-iso-ca-accept>Valider la proposition</button>
          <button type="button" class="btn btn-secondary" data-iso-ca-reject>Fermer sans changer</button>
        </div>
        <p class="iso-ca-override-label">Ou choisir explicitement un statut :</p>
        <div class="iso-ca-override-row">
          <button type="button" class="btn btn-secondary iso-ca-ov" data-iso-ca-set="conforme">Conforme</button>
          <button type="button" class="btn btn-secondary iso-ca-ov" data-iso-ca-set="partiel">Partiel</button>
          <button type="button" class="btn btn-secondary iso-ca-ov" data-iso-ca-set="non_conforme">Non conforme</button>
        </div>
      </div>
      <div class="iso-ca-block iso-ca-history-block">
        <h4 class="iso-ca-h4">Historique</h4>
        <p class="iso-ca-history-hint">Journal d’activité et preuves locales rattachées à cette exigence (ordre antichronologique).</p>
        <div class="iso-req-history-body" data-iso-ca-history></div>
      </div>
    </div>
    <div class="iso-ca-error" data-iso-ca-error hidden>
      <p class="iso-ca-error-msg" data-iso-ca-error-msg></p>
      <button type="button" class="btn btn-primary" data-iso-ca-retry>Réessayer</button>
    </div>
  `;

  panel.append(head, body);
  overlay.append(panel);
  document.body.append(overlay);

  const req = opts.requirement;
  const labelEl = head.querySelector('[data-iso-ca-req-label]');
  labelEl.textContent = `${req.normCode} · ${req.clause} : ${req.title}`;

  function fillComplianceAssistHistory() {
    const wrap = body.querySelector('[data-iso-ca-history]');
    if (!wrap) return;
    wrap.replaceChildren();
    const items = buildIsoRequirementHistoryTimeline(String(req.id), req);
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'iso-req-history-empty';
      p.textContent = 'Aucun événement enregistré pour cette exigence.';
      wrap.append(p);
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'iso-req-history-list';
    for (const it of items.slice(0, 40)) {
      const li = document.createElement('li');
      li.className = 'iso-req-history-item';
      const kind = document.createElement('span');
      kind.className = 'iso-req-history-kind';
      kind.textContent = it.label;
      const meta = document.createElement('span');
      meta.className = 'iso-req-history-meta';
      meta.textContent = `${new Date(it.at).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
      })} — ${it.user}`;
      const det = document.createElement('span');
      det.className = 'iso-req-history-detail';
      det.textContent = it.detail;
      li.append(kind, meta, det);
      ul.append(li);
    }
    wrap.append(ul);
  }

  fillComplianceAssistHistory();

  function close() {
    overlay.remove();
  }

  head.querySelector('.iso-ca-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  /** @type {null | { suggestedStatus: ConformityStatus }} */
  let lastPayload = null;

  async function runAnalyze() {
    body.querySelector('[data-iso-ca-loading]').hidden = false;
    body.querySelector('[data-iso-ca-result]').hidden = true;
    body.querySelector('[data-iso-ca-error]').hidden = true;

    try {
      const res = await qhseFetch('/api/compliance/analyze-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement: {
            id: req.id,
            normId: req.normId,
            normCode: req.normCode,
            clause: req.clause,
            title: req.title,
            summary: req.summary,
            evidence: req.evidence,
            currentStatus: req.status
          },
          controlledDocuments: opts.controlledDocuments,
          siteId: opts.siteId
        })
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof j.error === 'string' ? j.error : `Erreur ${res.status}`;
        throw new Error(msg);
      }

      lastPayload = { suggestedStatus: j.suggestedStatus };

      body.querySelector('[data-iso-ca-loading]').hidden = true;
      body.querySelector('[data-iso-ca-result]').hidden = false;

      const pill = body.querySelector('[data-iso-ca-pill]');
      pill.textContent = j.statusLabel || j.suggestedStatus;
      const statusToken = sanitizeClassToken(j.suggestedStatus, 'partiel');
      pill.className = `iso-ca-status-pill iso-ca-status-pill--${statusToken}`;

      body.querySelector('[data-iso-ca-explain]').textContent = j.explanation || 'Non disponible';

      const ul = body.querySelector('[data-iso-ca-actions]');
      ul.replaceChildren();
      (j.recommendedActions || []).forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        ul.append(li);
      });

      const docsUl = body.querySelector('[data-iso-ca-docs]');
      const docsWrap = body.querySelector('[data-iso-ca-docs-wrap]');
      const docs = j.matchedDocuments || [];
      docsUl.replaceChildren();
      if (!docs.length) {
        docsWrap.hidden = true;
      } else {
        docsWrap.hidden = false;
        docs.forEach((d) => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${escapeHtml(d.name)}</strong> <span class="iso-ca-doc-meta">${escapeHtml(d.source)} · pertinence ${escapeHtml(d.relevance)}</span>`;
          docsUl.append(li);
        });
      }

      body.querySelector('[data-iso-ca-disclaimer]').textContent =
        j.disclaimer ||
        'Cette proposition est indicative ; seul un humain peut valider la conformité réelle.';

      opts.onAiTrace?.({
        aiTraceType: 'suggestion_generated',
        requirementId: String(req.id),
        suggestedStatus: j.suggestedStatus,
        detail: `${req.normCode} ${req.clause} — ${req.title}`.trim()
      });
    } catch (err) {
      console.warn('[iso compliance assist]', err);
      body.querySelector('[data-iso-ca-loading]').hidden = true;
      body.querySelector('[data-iso-ca-error]').hidden = false;
      body.querySelector('[data-iso-ca-error-msg]').textContent =
        err instanceof Error ? err.message : String(err);
    }
  }

  body.querySelector('[data-iso-ca-retry]').addEventListener('click', () => runAnalyze());

  async function commitStatus(status, source) {
    const committed = await opts.onStatusCommitted(req.id, status, { source });
    if (committed !== true) return;

    if (typeof opts.onAiTrace === 'function') {
      if (source === 'accepted_suggestion') {
        opts.onAiTrace({
          aiTraceType: 'user_validated',
          requirementId: String(req.id),
          suggestedStatus: lastPayload?.suggestedStatus,
          chosenStatus: status
        });
      } else if (source === 'human_override') {
        const suggested = lastPayload?.suggestedStatus;
        const modified = Boolean(suggested && suggested !== status);
        opts.onAiTrace({
          aiTraceType: modified ? 'user_modified' : 'user_validated',
          requirementId: String(req.id),
          suggestedStatus: suggested,
          chosenStatus: status
        });
      }
    }

    showToast(
      source === 'accepted_suggestion'
        ? 'Statut enregistré conformément à la proposition (validation humaine).'
        : 'Statut enregistré suite à votre choix explicite.',
      'info'
    );
    close();
  }

  body.querySelector('[data-iso-ca-accept]').addEventListener('click', () => {
    void (async () => {
      if (!lastPayload?.suggestedStatus) {
        showToast('Aucune proposition à valider.', 'warning');
        return;
      }
      await commitStatus(lastPayload.suggestedStatus, 'accepted_suggestion');
    })();
  });

  body.querySelector('[data-iso-ca-reject]').addEventListener('click', () => {
    showToast('Fermeture sans modification du statut.', 'info');
    close();
  });

  body.querySelectorAll('[data-iso-ca-set]').forEach((btn) => {
    btn.addEventListener('click', () => {
      void (async () => {
        const st = /** @type {'conforme'|'partiel'|'non_conforme'} */ (btn.getAttribute('data-iso-ca-set'));
        await commitStatus(st, 'human_override');
      })();
    });
  });

  runAnalyze();
}

