import { qhseNavigate } from '../utils/qhseNavigate.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const ROLE_OPTIONS = [
  { value: 'QHSE', label: 'QHSE' },
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'DIRECTION', label: 'Direction' },
  { value: 'ASSISTANT', label: 'Assistant' },
  { value: 'TERRAIN', label: 'Terrain' }
];

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function basicEmailOk(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim().toLowerCase());
}

function parseEmailList(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .filter((x, i, a) => a.indexOf(x) === i);
}

function nameFromEmail(email) {
  const local = String(email).split('@')[0] || 'Utilisateur';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Wizard d’onboarding plein écran.
 * @param {{
 *   userId: string,
 *   initialOnboardingStep: number,
 *   onCacheUpdate: (data: { onboardingCompleted: boolean, onboardingStep: number }) => void,
 *   onClose: () => void,
 *   onFinished: () => void
 * }} opts
 */
export function createOnboardingWizard(opts) {
  const { userId, initialOnboardingStep, onCacheUpdate, onClose, onFinished } = opts;

  let screen = Math.min(Math.max(0, Math.floor(Number(initialOnboardingStep) || 0)), 4);
  let siteCreated = false;
  let invitesAttempted = false;
  let ctaChosen = false;
  let siteName = '';
  let siteAddress = '';
  let inviteEmails = '';
  let inviteRole = 'QHSE';

  const overlay = el('div', 'qhse-onboarding-wizard');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'qhse-ob-title');

  const style = document.createElement('style');
  style.textContent = `
.qhse-onboarding-wizard{position:fixed;inset:0;z-index:12000;display:flex;align-items:stretch;justify-content:center;
  background:color-mix(in srgb,var(--color-background,#ffffff) 92%,black);padding:clamp(12px,3vw,28px);box-sizing:border-box;
  font-family:inherit;color:var(--text-primary,#1e293b);overflow:auto}
.qhse-onboarding-wizard__panel{max-width:560px;width:100%;margin:auto;background:var(--surface-1,#ffffff);
  border:1px solid var(--border-color,#e2e8f0);border-radius:16px;padding:clamp(20px,4vw,32px);
  color:var(--text-primary,#1e293b);box-shadow:0 20px 60px rgba(0,0,0,0.15)}
.qhse-onboarding-wizard__head{margin-bottom:20px}
.qhse-onboarding-wizard__title{font-size:1.35rem;font-weight:800;margin:0 0 8px;line-height:1.25}
.qhse-onboarding-wizard__sub{margin:0;font-size:14px;opacity:.88;line-height:1.45}
.qhse-onboarding-wizard__steps{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap}
.qhse-onboarding-wizard__dot{width:9px;height:9px;border-radius:50%;background:var(--surface-3,#e2e8f0)}
.qhse-onboarding-wizard__dot.is-on{background:var(--app-accent,#14b8a6)}
.qhse-onboarding-wizard__values{display:grid;gap:12px;margin:18px 0}
.qhse-onboarding-wizard__value{padding:14px 16px;border-radius:12px;border:1px solid var(--border-color,#e2e8f0);
  background:var(--surface-2,#f1f5f9);font-size:14px;line-height:1.45}
.qhse-onboarding-wizard__value strong{display:block;margin-bottom:4px;color:var(--app-accent,#14b8a6)}
.qhse-onboarding-wizard__field{margin-bottom:14px}
.qhse-onboarding-wizard__field label{display:block;font-size:12px;font-weight:700;margin-bottom:6px;opacity:.9}
.qhse-onboarding-wizard__field input,.qhse-onboarding-wizard__field select,.qhse-onboarding-wizard__field textarea{
  width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid var(--surface-input-border,#cbd5e1);
  background:var(--surface-input,#ffffff);color:var(--text-primary,#1e293b);font-size:14px}
.qhse-onboarding-wizard__field textarea{min-height:88px;resize:vertical}
.qhse-onboarding-wizard__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;align-items:center}
.qhse-onboarding-wizard__error{color:#f87171;font-size:13px;margin-top:10px}
.qhse-onboarding-wizard__muted{font-size:13px;opacity:.75;margin-top:8px}
.qhse-onboarding-wizard__checklist{list-style:none;padding:0;margin:16px 0}
.qhse-onboarding-wizard__checklist li{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border-color,#e2e8f0);
  font-size:14px;line-height:1.4}
.qhse-onboarding-wizard__checklist li:last-child{border-bottom:none}
.qhse-onboarding-wizard__tick{width:22px;height:22px;border-radius:6px;border:1px solid var(--border-color,#e2e8f0);
  flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}
.qhse-onboarding-wizard__tick.is-yes{background:color-mix(in srgb,var(--app-accent,#14b8a6) 25%,transparent);border-color:var(--app-accent,#14b8a6);color:var(--app-accent,#14b8a6)}
.qhse-onboarding-wizard__cta-row{display:grid;gap:10px;margin:16px 0}
.qhse-onboarding-wizard__link{background:none;border:none;color:var(--app-accent,#14b8a6);cursor:pointer;font-size:13px;text-decoration:underline;padding:0;margin-left:auto}
`;
  overlay.append(style);

  const panel = el('div', 'qhse-onboarding-wizard__panel');
  const head = el('div', 'qhse-onboarding-wizard__head');
  const title = el('h1', 'qhse-onboarding-wizard__title', '');
  title.id = 'qhse-ob-title';
  const sub = el('p', 'qhse-onboarding-wizard__sub', '');
  head.append(title, sub);

  const stepsRow = el('div', 'qhse-onboarding-wizard__steps');
  for (let i = 0; i < 5; i += 1) {
    stepsRow.append(el('span', `qhse-onboarding-wizard__dot${i === screen ? ' is-on' : ''}`));
  }

  const body = el('div', 'qhse-onboarding-wizard__body');
  const errBox = el('div', 'qhse-onboarding-wizard__error');
  errBox.hidden = true;

  const actions = el('div', 'qhse-onboarding-wizard__actions');
  const later = el('button', 'qhse-onboarding-wizard__link', 'Continuer plus tard');
  later.type = 'button';
  later.addEventListener('click', () => onClose());

  panel.append(head, stepsRow, body, errBox, actions);
  overlay.append(panel);

  async function patchUser(payload) {
    const res = await qhseFetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = 'Mise à jour impossible';
      try {
        const j = await res.json();
        if (j?.error) msg = j.error;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    const j = await res.json();
    onCacheUpdate({
      onboardingCompleted: Boolean(j.onboardingCompleted),
      onboardingStep: typeof j.onboardingStep === 'number' ? j.onboardingStep : Number(j.onboardingStep) || 0
    });
    return j;
  }

  function setError(msg) {
    if (!msg) {
      errBox.hidden = true;
      errBox.textContent = '';
      return;
    }
    errBox.hidden = false;
    errBox.textContent = msg;
  }

  function updateDots() {
    const dots = stepsRow.querySelectorAll('.qhse-onboarding-wizard__dot');
    dots.forEach((d, i) => {
      d.classList.toggle('is-on', i === screen);
    });
  }

  function render() {
    setError('');
    body.replaceChildren();
    actions.replaceChildren();
    updateDots();

    if (screen === 0) {
      title.textContent = 'Bienvenue sur AfricaQHSE';
      sub.textContent =
        'Parcours de démarrage : environ 30 secondes pour les fondamentaux. AfricaQHSE centralise QHSE, conformité et terrain.';

      const values = el('div', 'qhse-onboarding-wizard__values');
      const v1 = el('div', 'qhse-onboarding-wizard__value');
      v1.append(
        el('strong', '', 'Une vision unique'),
        document.createTextNode(' : incidents, risques, audits et documents au même endroit.')
      );
      const v2 = el('div', 'qhse-onboarding-wizard__value');
      v2.append(
        el('strong', '', 'Conformité pilotée'),
        document.createTextNode(' : traçabilité et indicateurs pour vos référentiels.')
      );
      const v3 = el('div', 'qhse-onboarding-wizard__value');
      v3.append(
        el('strong', '', 'Équipe alignée'),
        document.createTextNode(' : sites, rôles et actions partagés en temps réel.')
      );
      values.append(v1, v2, v3);
      const hint = el('p', 'qhse-onboarding-wizard__muted', 'Lecture indicative : ~30 s. Passez à l’étape suivante quand vous êtes prêt.');
      body.append(values, hint);

      const next = el('button', 'btn btn-primary', 'Suivant');
      next.type = 'button';
      next.addEventListener('click', async () => {
        try {
          await patchUser({ onboardingStep: 1 });
          screen = 1;
          render();
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      });
      actions.append(next, later);
      return;
    }

    if (screen === 1) {
      title.textContent = 'Créez votre premier site';
      sub.textContent = 'Renseignez le site principal ; vous pourrez en ajouter d’autres plus tard.';

      const fName = el('div', 'qhse-onboarding-wizard__field');
      fName.append(el('label', '', 'Nom du site'));
      const inName = document.createElement('input');
      inName.type = 'text';
      inName.required = true;
      inName.value = siteName;
      inName.placeholder = 'Ex. Usine Dakar';
      inName.addEventListener('input', () => {
        siteName = inName.value;
      });
      fName.append(inName);

      const fAddr = el('div', 'qhse-onboarding-wizard__field');
      fAddr.append(el('label', '', 'Adresse (optionnel)'));
      const inAddr = document.createElement('input');
      inAddr.type = 'text';
      inAddr.value = siteAddress;
      inAddr.placeholder = 'Ville, pays…';
      inAddr.addEventListener('input', () => {
        siteAddress = inAddr.value;
      });
      fAddr.append(inAddr);

      body.append(fName, fAddr);

      const back = el('button', 'btn', 'Retour');
      back.type = 'button';
      back.addEventListener('click', () => {
        screen = 0;
        render();
      });
      const next = el('button', 'btn btn-primary', 'Créer le site');
      next.type = 'button';
      next.addEventListener('click', async () => {
        const name = String(siteName || '').trim();
        if (!name) {
          setError('Le nom du site est requis.');
          return;
        }
        try {
          const res = await qhseFetch('/api/sites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              address: String(siteAddress || '').trim() || undefined
            })
          });
          if (!res.ok) {
            let msg = 'Création du site refusée';
            try {
              const j = await res.json();
              if (j?.error) msg = j.error;
            } catch {
              /* ignore */
            }
            throw new Error(msg);
          }
          siteCreated = true;
          await patchUser({ onboardingStep: 2 });
          screen = 2;
          render();
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      });
      actions.append(back, next, later);
      return;
    }

    if (screen === 2) {
      title.textContent = 'Invitez votre équipe';
      sub.textContent =
        'Ajoutez une ou plusieurs adresses e-mail (séparées par une virgule ou un retour à la ligne). Aucun mot de passe n’est requis pour l’instant.';

      const fMail = el('div', 'qhse-onboarding-wizard__field');
      fMail.append(el('label', '', 'E-mails'));
      const ta = document.createElement('textarea');
      ta.value = inviteEmails;
      ta.placeholder = 'collegue@entreprise.com, autre@entreprise.com';
      ta.addEventListener('input', () => {
        inviteEmails = ta.value;
      });
      fMail.append(ta);

      const fRole = el('div', 'qhse-onboarding-wizard__field');
      fRole.append(el('label', '', 'Rôle attribué'));
      const sel = document.createElement('select');
      ROLE_OPTIONS.forEach((r) => {
        const o = document.createElement('option');
        o.value = r.value;
        o.textContent = r.label;
        sel.append(o);
      });
      sel.value = inviteRole;
      sel.addEventListener('change', () => {
        inviteRole = sel.value;
      });
      fRole.append(sel);

      body.append(fMail, fRole);

      const back = el('button', 'btn', 'Retour');
      back.type = 'button';
      back.addEventListener('click', () => {
        screen = 1;
        render();
      });
      const next = el('button', 'btn btn-primary', 'Envoyer les invitations');
      next.type = 'button';
      next.addEventListener('click', async () => {
        const emails = parseEmailList(inviteEmails);
        invitesAttempted = true;
        try {
          for (const email of emails) {
            if (!basicEmailOk(email)) {
              throw new Error(`E-mail invalide : ${email}`);
            }
            const res = await qhseFetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: nameFromEmail(email),
                email,
                role: inviteRole
              })
            });
            if (!res.ok) {
              let msg = `Échec pour ${email}`;
              try {
                const j = await res.json();
                if (j?.error) msg = j.error;
              } catch {
                /* ignore */
              }
              throw new Error(msg);
            }
          }
          await patchUser({ onboardingStep: 3 });
          screen = 3;
          render();
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      });
      const skip = el('button', 'btn', 'Passer cette étape');
      skip.type = 'button';
      skip.addEventListener('click', async () => {
        invitesAttempted = true;
        try {
          await patchUser({ onboardingStep: 3 });
          screen = 3;
          render();
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      });
      actions.append(back, next, skip, later);
      return;
    }

    if (screen === 3) {
      title.textContent = 'Déclarez votre premier incident ou risque';
      sub.textContent =
        'Ouvrez le module concerné ; vous pourrez revenir au tableau de bord à tout moment.';

      const row = el('div', 'qhse-onboarding-wizard__cta-row');
      const bInc = el('button', 'btn btn-primary', 'Déclarer un incident');
      bInc.type = 'button';
      bInc.addEventListener('click', async () => {
        try {
          ctaChosen = true;
          await patchUser({ onboardingStep: 4 });
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          return;
        }
        qhseNavigate('incidents');
        onClose();
      });
      const bRisk = el('button', 'btn btn-primary', 'Enregistrer un risque');
      bRisk.type = 'button';
      bRisk.addEventListener('click', async () => {
        try {
          ctaChosen = true;
          await patchUser({ onboardingStep: 4 });
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          return;
        }
        qhseNavigate('risks');
        onClose();
      });
      row.append(bInc, bRisk);
      body.append(row);

      const back = el('button', 'btn', 'Retour');
      back.type = 'button';
      back.addEventListener('click', () => {
        screen = 2;
        render();
      });
      const next = el('button', 'btn', 'Suivant');
      next.type = 'button';
      next.addEventListener('click', async () => {
        try {
          await patchUser({ onboardingStep: 4 });
          screen = 4;
          render();
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      });
      actions.append(back, next, later);
      return;
    }

    title.textContent = 'Vous êtes prêt !';
    sub.textContent = 'Récapitulatif de votre démarrage sur AfricaQHSE.';

    const ul = el('ul', 'qhse-onboarding-wizard__checklist');
    const items = [
      { ok: true, text: 'Présentation et valeurs clés' },
      { ok: siteCreated, text: 'Premier site créé' },
      { ok: invitesAttempted, text: 'Étape invitations parcourue' },
      { ok: ctaChosen, text: 'Incident ou risque ouvert (recommandé)' },
      { ok: true, text: 'Tableau de bord et navigation latérale' }
    ];
    items.forEach((it) => {
      const li = el('li', '');
      const tick = el('span', `qhse-onboarding-wizard__tick${it.ok ? ' is-yes' : ''}`, it.ok ? '✓' : '');
      li.append(tick, el('span', '', it.text));
      ul.append(li);
    });
    const prog = el(
      'p',
      'qhse-onboarding-wizard__muted',
      `Progression : ${items.filter((x) => x.ok).length} / ${items.length} points cochés sur ce parcours.`
    );
    body.append(ul, prog);

    const back = el('button', 'btn', 'Retour');
    back.type = 'button';
    back.addEventListener('click', () => {
      screen = 3;
      render();
    });
    const finish = el('button', 'btn btn-primary', 'Terminer');
    finish.type = 'button';
    finish.addEventListener('click', async () => {
      try {
        await patchUser({ onboardingCompleted: true, onboardingStep: 5 });
        onFinished();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
    actions.append(back, finish);
  }

  render();
  return overlay;
}

// --- Parcours d’accueil produit (une fois par navigateur, localStorage) ---

export const STORAGE_KEY = 'qhse_onboarding_done_v1';
const PRODUCT_TOUR_STORAGE_KEY = STORAGE_KEY;

const PRODUCT_TOUR_STEPS = [
  {
    id: 'welcome',
    icon: '👋',
    title: 'Bienvenue sur AfricaQHSE',
    desc: 'Votre plateforme de pilotage QHSE est prete. Decouvrez les fonctionnalites cles en 4 etapes.',
    action: null
  },
  {
    id: 'incident',
    icon: '⚠️',
    title: 'Declarez votre premier incident',
    desc: "Signalez tout evenement SST : accident, quasi-accident, situation dangereuse. Chaque declaration ameliore la prevention.",
    action: { label: 'Aller aux incidents', page: 'incidents' }
  },
  {
    id: 'risk',
    icon: '🎯',
    title: 'Evaluez vos risques',
    desc: "Construisez votre registre des risques avec cotation probabilite × gravite. L'IA vous suggere des mesures de prevention.",
    action: { label: 'Voir les risques', page: 'risks' }
  },
  {
    id: 'audit',
    icon: '✅',
    title: 'Planifiez un audit',
    desc: 'Programmez vos audits internes et suivez les scores de conformite dans le temps.',
    action: { label: 'Planifier un audit', page: 'audits' }
  },
  {
    id: 'done',
    icon: '🚀',
    title: 'Vous etes pret !',
    desc: 'AfricaQHSE est configure. Consultez le guide utilisateur pour aller plus loin.',
    action: { label: 'Télécharger le guide PDF', href: '/guide-utilisateur-africaqhse.pdf' }
  }
];

export function shouldShowOnboarding() {
  return !localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY);
}

export function markOnboardingDone() {
  localStorage.setItem(PRODUCT_TOUR_STORAGE_KEY, '1');
}

/**
 * Assistant visuel post-connexion (première visite sur ce navigateur).
 * @param {() => void} [onComplete]
 */
export function showOnboardingWizard(onComplete) {
  if (!shouldShowOnboarding()) return;
  if (document.getElementById('onboarding-overlay')) return;

  let currentStep = 0;

  const overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.75);
    z-index:9999;display:flex;align-items:center;justify-content:center;
    padding:16px;backdrop-filter:blur(4px);`;

  function close() {
    markOnboardingDone();
    overlay.remove();
    if (typeof onComplete === 'function') onComplete();
  }

  function render() {
    const step = PRODUCT_TOUR_STEPS[currentStep];
    const isLast = currentStep === PRODUCT_TOUR_STEPS.length - 1;
    const isFirst = currentStep === 0;

    overlay.innerHTML = `
      <div style="background:var(--surface-1, #ffffff);color:var(--text-primary, #1e293b);border:1px solid var(--border-color, #e2e8f0);
                  box-shadow:0 20px 60px rgba(0,0,0,0.15);border-radius:16px;max-width:480px;width:100%;padding:32px;position:relative">

        <button type="button" id="ob-close" style="position:absolute;top:16px;right:16px;background:none;
          border:none;color:var(--text-muted,#64748b);font-size:20px;cursor:pointer;line-height:1">✕</button>

        <div style="display:flex;gap:6px;margin-bottom:24px">
          ${PRODUCT_TOUR_STEPS.map(
            (_, i) => `
            <div style="flex:1;height:4px;border-radius:2px;
              background:${i <= currentStep ? 'var(--color-primary,#3b82f6)' : 'var(--border-color,#e2e8f0)'};
              transition:background 0.3s"></div>`
          ).join('')}
        </div>

        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:48px;margin-bottom:12px">${step.icon}</div>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:var(--text-primary, #1e293b)">
            ${escapeHtml(step.title)}
          </h2>
          <p style="margin:0;font-size:14px;color:var(--text-secondary, #64748b);line-height:1.6">
            ${escapeHtml(step.desc)}
          </p>
        </div>

        ${
          step.action
            ? `
          <div style="text-align:center;margin-bottom:20px">
            ${
              step.action.href
                ? `<a href="${escapeHtml(step.action.href)}" target="_blank" rel="noopener noreferrer"
                   class="btn btn-secondary" style="display:inline-block">
                   ${escapeHtml(step.action.label)}
                 </a>`
                : `<button type="button" id="ob-action" class="btn btn-secondary">
                   ${escapeHtml(step.action.label)}
                 </button>`
            }
          </div>`
            : ''
        }

        <div style="display:flex;gap:12px;justify-content:space-between;align-items:center">
          <button type="button" id="ob-prev" class="btn btn-ghost btn-sm"
            style="visibility:${isFirst ? 'hidden' : 'visible'}">
            ← Precedent
          </button>
          <span style="font-size:12px;color:var(--text-muted,#64748b)">
            ${currentStep + 1} / ${PRODUCT_TOUR_STEPS.length}
          </span>
          <button type="button" id="ob-next" class="btn btn-primary btn-sm">
            ${isLast ? 'Terminer 🎉' : 'Suivant →'}
          </button>
        </div>
      </div>`;

    overlay.querySelector('#ob-close')?.addEventListener('click', close);
    overlay.querySelector('#ob-prev')?.addEventListener('click', () => {
      currentStep--;
      render();
    });
    overlay.querySelector('#ob-next')?.addEventListener('click', () => {
      if (isLast) {
        close();
        return;
      }
      currentStep++;
      render();
    });
    overlay.querySelector('#ob-action')?.addEventListener('click', () => {
      if (step.action?.page) {
        close();
        window.dispatchEvent(new CustomEvent('qhse-navigate', { detail: { page: step.action.page } }));
      }
    });
  }

  render();
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}
