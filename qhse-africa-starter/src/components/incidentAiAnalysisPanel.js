import { qhseFetch } from '../utils/qhseFetch.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { showToast } from './toast.js';
import { getSessionUser } from '../data/sessionUser.js';
import { openActionCreateDialog } from './actionCreateDialog.js';
import { ensureIncidentsSlideOverStyles } from './incidentFormDialog.js';

const AI_SUGGEST_BASE = '/api/ai-suggestions/suggest';

function dueDateIsoFromDelayDays(delayDays) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, Math.floor(Number(delayDays) || 0)));
  return d.toISOString().slice(0, 10);
}

function priorityFromConfidence(c) {
  const x = Number(c);
  if (!Number.isFinite(x)) return 'normale';
  if (x >= 0.82) return 'critique';
  if (x >= 0.65) return 'haute';
  return 'normale';
}

/**
 * @param {object} inc
 * @param {object} ctx
 * @param {boolean} ctx.canWriteActions
 * @param {(e: object) => void} [ctx.onAddLog]
 * @param {() => Promise<void>} ctx.ensureUsersCached
 * @param {() => unknown[]} ctx.getActionUsers
 */
export function openIncidentAiAnalysis(inc, ctx) {
  const { canWriteActions, onAddLog, ensureUsersCached, getActionUsers } = ctx;

  ensureIncidentsSlideOverStyles();
  document.getElementById('qhse-ia-overlay')?.remove();
  document.getElementById('qhse-ia-panel')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'inc-overlay';
  overlay.id = 'qhse-ia-overlay';
  const panel = document.createElement('aside');
  panel.className = 'inc-slideover';
  panel.id = 'qhse-ia-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Analyse IA — incident');

  const header = document.createElement('div');
  header.className = 'inc-slideover__head';
  header.innerHTML = `
    <span class="inc-slideover__title">IA · ${escapeHtml(inc.ref)}</span>
    <button type="button" class="inc-slideover__close" aria-label="Fermer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>`;

  const body = document.createElement('div');
  body.className = 'inc-slideover__body';
  const loadP = document.createElement('p');
  loadP.className = 'incidents-detail-muted';
  loadP.textContent = 'Analyse en cours…';
  body.append(loadP);

  function closeIa() {
    overlay.classList.remove('inc-overlay--open');
    panel.classList.remove('inc-slideover--open');
    document.body.style.overflow = '';
    overlay.remove();
    panel.remove();
    document.removeEventListener('keydown', onEscIa);
  }
  function onEscIa(e) {
    if (e.key === 'Escape') closeIa();
  }

  overlay.addEventListener('click', closeIa);
  header.querySelector('.inc-slideover__close')?.addEventListener('click', closeIa);
  document.addEventListener('keydown', onEscIa);

  panel.append(header, body);
  document.body.append(overlay, panel);
  requestAnimationFrame(() => {
    overlay.classList.add('inc-overlay--open');
    panel.classList.add('inc-slideover--open');
    document.body.style.overflow = 'hidden';
  });

  void (async () => {
    const incidentId = inc.id;
    if (!incidentId) {
      body.replaceChildren();
      const err = document.createElement('p');
      err.className = 'incidents-detail-muted';
      err.textContent =
        'Identifiant incident indisponible — rechargez le registre pour activer l’analyse IA.';
      body.append(err);
      return;
    }
    try {
      const [rcRes, actRes] = await Promise.all([
        qhseFetch(`${AI_SUGGEST_BASE}/root-causes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId })
        }),
        qhseFetch(`${AI_SUGGEST_BASE}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId })
        })
      ]);
      body.replaceChildren();
      if (!rcRes.ok) {
        let msg = `Erreur causes (${rcRes.status})`;
        try {
          const j = await rcRes.json();
          if (j.error) msg = j.error;
        } catch {
          /* ignore */
        }
        const p = document.createElement('p');
        p.className = 'incidents-detail-muted';
        p.textContent = msg;
        body.append(p);
        return;
      }
      if (!actRes.ok) {
        let msg = `Erreur actions (${actRes.status})`;
        try {
          const j = await actRes.json();
          if (j.error) msg = j.error;
        } catch {
          /* ignore */
        }
        const p = document.createElement('p');
        p.className = 'incidents-detail-muted';
        p.textContent = msg;
        body.append(p);
        return;
      }
      const rc = await rcRes.json();
      const act = await actRes.json();

      const prov = document.createElement('p');
      prov.className = 'inc-ia-provider';
      prov.textContent = `Fournisseur : ${rc.provider || '—'}${rc.error ? ` · ${rc.error}` : ''}`;

      const secCauses = document.createElement('section');
      secCauses.className = 'inc-ia-section';
      const hC = document.createElement('h4');
      hC.className = 'inc-ia-section__title';
      hC.textContent = 'Causes racines suggérées';
      secCauses.append(hC);
      (Array.isArray(rc.rootCauses) ? rc.rootCauses : []).forEach((item) => {
        const row = document.createElement('div');
        row.className = 'inc-ia-row';
        const head = document.createElement('div');
        head.className = 'inc-ia-row__head';
        const pct = document.createElement('span');
        pct.className = 'inc-ia-confidence';
        pct.textContent = `${Math.round((Number(item.confidence) || 0) * 100)} % confiance`;
        const cause = document.createElement('div');
        cause.style.fontWeight = '600';
        cause.style.fontSize = '14px';
        cause.textContent = String(item.cause || '—');
        head.append(cause, pct);
        const cat = document.createElement('div');
        cat.className = 'inc-ia-cat';
        cat.textContent = `Catégorie : ${String(item.category || '—')}`;
        row.append(head, cat);
        secCauses.append(row);
      });

      const secAct = document.createElement('section');
      secAct.className = 'inc-ia-section';
      const hA = document.createElement('h4');
      hA.className = 'inc-ia-section__title';
      hA.textContent = 'Actions correctives suggérées';
      secAct.append(hA);
      (Array.isArray(act.actions) ? act.actions : []).forEach((a) => {
        const row = document.createElement('div');
        row.className = 'inc-ia-row';
        const head = document.createElement('div');
        head.className = 'inc-ia-row__head';
        const ttl = document.createElement('div');
        ttl.style.fontWeight = '700';
        ttl.style.fontSize = '14px';
        ttl.textContent = String(a.title || '—');
        const pct = document.createElement('span');
        pct.className = 'inc-ia-confidence';
        pct.textContent = `${Math.round((Number(a.confidence) || 0) * 100)} %`;
        head.append(ttl, pct);
        const desc = document.createElement('p');
        desc.style.margin = '6px 0 0';
        desc.style.fontSize = '13px';
        desc.style.lineHeight = '1.45';
        desc.style.color = 'var(--text2, rgba(255,255,255,.65))';
        desc.textContent = String(a.description || '');
        const meta = document.createElement('div');
        meta.className = 'inc-ia-cat';
        meta.textContent = `Délai indicatif : ${Number(a.delayDays) || 0} j · rôle type : ${String(a.ownerRole || '—')}`;
        const actionsRow = document.createElement('div');
        actionsRow.className = 'inc-ia-actions';
        const btnCreate = document.createElement('button');
        btnCreate.type = 'button';
        btnCreate.className = 'btn btn-primary';
        btnCreate.textContent = 'Créer action depuis suggestion';
        btnCreate.hidden = !canWriteActions;
        btnCreate.addEventListener('click', async () => {
          await ensureUsersCached();
          const users = getActionUsers() || [];
          openActionCreateDialog({
            users,
            defaults: {
              title: String(a.title || `Action — ${inc.ref}`).slice(0, 240),
              origin: 'incident',
              actionType: 'corrective',
              priority: priorityFromConfidence(a.confidence),
              description: [
                String(a.description || '').trim(),
                '',
                `[Suggestion IA — confiance ~${Math.round((Number(a.confidence) || 0) * 100)} %]`,
                `Délai indicatif : ${Number(a.delayDays) || 0} j · responsable type : ${String(a.ownerRole || '—')}`
              ].join('\n'),
              linkedIncident: inc.ref,
              dueDate: dueDateIsoFromDelayDays(a.delayDays)
            },
            onCreated: () => {
              showToast('Action créée depuis la suggestion IA.', 'success');
              if (typeof onAddLog === 'function') {
                onAddLog({
                  module: 'incidents',
                  action: 'Action depuis IA',
                  detail: inc.ref,
                  user: getSessionUser()?.name || 'Utilisateur'
                });
              }
            }
          });
        });
        actionsRow.append(btnCreate);
        row.append(head, desc, meta, actionsRow);
        secAct.append(row);
      });

      body.append(prov, secCauses, secAct);
    } catch (e) {
      console.error('[incidents] IA analyse', e);
      body.replaceChildren();
      const p = document.createElement('p');
      p.className = 'incidents-detail-muted';
      p.textContent = 'Erreur réseau ou serveur.';
      body.append(p);
    }
  })();
}
