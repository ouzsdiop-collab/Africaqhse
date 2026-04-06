import { showToast } from './toast.js';
import {
  loadSensitiveAccessConfig,
  loadSensitiveAccessPin,
  isSensitiveActionEnabled,
  shouldPromptSensitiveAccess,
  recordSensitiveAccessSuccess
} from '../data/sensitiveAccessConfig.js';

const STYLE_ID = 'qhse-sensitive-access-gate-styles';

const MODAL_CSS = `
.qhse-sensitive-access-overlay{
  position:fixed;inset:0;z-index:10050;
  display:flex;align-items:center;justify-content:center;
  padding:max(20px,env(safe-area-inset-bottom,20px));
  background:rgba(8,12,22,.55);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
  box-sizing:border-box;
}
.qhse-sensitive-access-dialog{
  position:relative;
  width:min(380px,100%);
  margin:0;padding:0;border:none;border-radius:16px;
  background:var(--color-background-primary,#fff);
  color:var(--color-text-primary,#0f172a);
  box-shadow:0 20px 50px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.06) inset;
  border:1px solid var(--color-border-secondary,rgba(15,23,42,.1));
  overflow:hidden;
  max-height:min(92vh,640px);
  overflow-y:auto;
}
.qhse-sensitive-access-dialog::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:16px 0 0 16px;
  background:linear-gradient(180deg,var(--palette-accent,#14b8a6),#0ea5e9);
  opacity:.9;pointer-events:none;z-index:1;
}
[data-theme='dark'] .qhse-sensitive-access-dialog{
  background:linear-gradient(165deg,#1a2230 0%,#141a24 100%);
  border-color:rgba(148,163,184,.16);
  box-shadow:0 24px 56px rgba(0,0,0,.45);
}
.qhse-sensitive-access-head{
  position:relative;z-index:2;
  padding:18px 22px 14px 22px;
  border-bottom:1px solid var(--color-border-tertiary,rgba(15,23,42,.08));
}
.qhse-sensitive-access-kicker{
  margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
  color:var(--color-text-tertiary,#64748b);
}
.qhse-sensitive-access-title{
  margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.02em;line-height:1.25;
  color:var(--color-text-primary);
}
.qhse-sensitive-access-desc{
  margin:10px 0 0;font-size:13px;line-height:1.55;color:var(--color-text-secondary,#475569);
}
.qhse-sensitive-access-strict{
  margin:12px 0 0;padding:10px 12px;border-radius:12px;
  border:1px dashed rgba(245,158,11,.35);
  background:rgba(245,158,11,.08);
  font-size:12px;line-height:1.45;color:var(--color-text-secondary);
}
.qhse-sensitive-access-body{padding:18px 22px 20px}
.qhse-sensitive-access-label{
  display:block;margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--color-text-tertiary);
}
.qhse-sensitive-access-input{
  width:100%;box-sizing:border-box;
  padding:14px 16px;border-radius:12px;
  border:1px solid var(--color-border-secondary);
  background:var(--color-background-secondary,#f8fafc);
  color:var(--color-text-primary);
  font-size:22px;font-weight:700;letter-spacing:.35em;text-align:center;
  font-variant-numeric:tabular-nums;
}
.qhse-sensitive-access-input:focus{
  outline:none;border-color:rgba(20,184,166,.55);
  box-shadow:0 0 0 3px rgba(20,184,166,.18);
}
.qhse-sensitive-access-error{
  margin:10px 0 0;font-size:12px;font-weight:600;color:var(--color-text-danger,#b91c1c);
  min-height:1.25em;
}
.qhse-sensitive-access-actions{
  display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:18px;
}
.qhse-sensitive-access-actions .btn{min-height:44px;font-weight:700}
`;

function ensureGateStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = MODAL_CSS;
  document.head.append(el);
}

const ACTION_TITLES = {
  confidential_document: 'Document confidentiel',
  export_sensitive: 'Export sensible',
  critical_validation: 'Validation critique',
  security_zone: 'Zone sécurisée',
  sensitive_mutation: 'Enregistrement sensible'
};

/**
 * Demande un code d’accès si la configuration l’exige. N’altère pas la logique métier des appelants.
 * @param {string} actionKey
 * @param {{ contextLabel?: string }} [opts]
 * @returns {Promise<boolean>}
 */
export function ensureSensitiveAccess(actionKey, opts = {}) {
  ensureGateStyles();
  const cfg = loadSensitiveAccessConfig();
  if (!cfg.enabled) return Promise.resolve(true);
  if (!isSensitiveActionEnabled(actionKey, cfg)) return Promise.resolve(true);

  const pin = loadSensitiveAccessPin();
  if (!pin) {
    showToast(
      'Accès renforcé activé sans code enregistré — définissez un code à 6 chiffres dans Paramètres → Sécurité & accès.',
      'warning'
    );
    return Promise.resolve(false);
  }

  if (!shouldPromptSensitiveAccess(cfg)) {
    return Promise.resolve(true);
  }

  const title = ACTION_TITLES[actionKey] || 'Action sensible';
  const contextLabel = opts.contextLabel || '';

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'qhse-sensitive-access-overlay';
    overlay.setAttribute('role', 'presentation');

    const dialog = document.createElement('div');
    dialog.className = 'qhse-sensitive-access-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'qhse-sa-title');

    const head = document.createElement('div');
    head.className = 'qhse-sensitive-access-head';
    const kicker = document.createElement('p');
    kicker.className = 'qhse-sensitive-access-kicker';
    kicker.textContent = 'Sécurité & accès';
    const h = document.createElement('h2');
    h.id = 'qhse-sa-title';
    h.className = 'qhse-sensitive-access-title';
    h.textContent = title;
    const desc = document.createElement('p');
    desc.className = 'qhse-sensitive-access-desc';
    desc.textContent = contextLabel
      ? `Pour continuer : ${contextLabel}. Saisissez votre code à 6 chiffres.`
      : 'Pour continuer, saisissez votre code de vérification à 6 chiffres.';
    head.append(kicker, h, desc);
    if (cfg.protectionLevel === 'strict') {
      const strict = document.createElement('p');
      strict.className = 'qhse-sensitive-access-strict';
      strict.textContent =
        'Niveau de protection élevé : vérifiez l’action et le code avant de confirmer.';
      head.append(strict);
    }

    const body = document.createElement('div');
    body.className = 'qhse-sensitive-access-body';
    const lab = document.createElement('label');
    lab.className = 'qhse-sensitive-access-label';
    lab.setAttribute('for', 'qhse-sa-code-input');
    lab.textContent = 'Code à 6 chiffres';
    const input = document.createElement('input');
    input.id = 'qhse-sa-code-input';
    input.type = 'password';
    input.className = 'qhse-sensitive-access-input';
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]*');
    input.setAttribute('maxlength', '6');
    input.setAttribute('autocomplete', 'one-time-code');
    input.setAttribute('aria-describedby', 'qhse-sa-error');

    const err = document.createElement('p');
    err.id = 'qhse-sa-error';
    err.className = 'qhse-sensitive-access-error';
    err.setAttribute('role', 'alert');

    const actions = document.createElement('div');
    actions.className = 'qhse-sensitive-access-actions';
    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'btn btn-secondary';
    btnCancel.textContent = 'Annuler';
    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'btn btn-primary';
    btnOk.textContent = 'Confirmer';

    const prevBodyOverflow = document.body.style.overflow;

    function cleanup() {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevBodyOverflow;
      overlay.remove();
    }

    function finish(ok) {
      cleanup();
      resolve(ok);
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    }

    btnCancel.addEventListener('click', () => finish(false));
    btnOk.addEventListener('click', () => {
      const v = String(input.value || '').replace(/\D/g, '');
      if (v.length !== 6) {
        err.textContent = 'Le code doit contenir exactement 6 chiffres.';
        return;
      }
      if (v !== pin) {
        err.textContent = 'Code incorrect.';
        input.value = '';
        input.focus();
        return;
      }
      recordSensitiveAccessSuccess(cfg);
      finish(true);
    });

    input.addEventListener('input', () => {
      err.textContent = '';
      input.value = String(input.value || '').replace(/\D/g, '').slice(0, 6);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnOk.click();
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(false);
    });

    actions.append(btnCancel, btnOk);
    body.append(lab, input, err, actions);
    dialog.append(head, body);
    overlay.append(dialog);
    document.body.append(overlay);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    queueMicrotask(() => input.focus());
  });
}
