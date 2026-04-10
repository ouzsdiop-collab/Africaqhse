/** Retour visuel court, accessible (pas de file d’attente persistante). */
/**
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} [variant]
 * @param {{ label?: string, action?: () => void, persistent?: boolean, swUpdateBanner?: boolean } | null} [options]
 *   `label` + `action` : bouton d’action (toast persistant tant que non fermé).
 *   `swUpdateBanner` : évite les doublons pour la bannière de mise à jour SW (`data-qhse-sw-update`).
 */
export function showToast(message, variant = 'success', options = null) {
  const actionLabel = options?.label;
  const actionCallback = typeof options?.action === 'function' ? options.action : null;
  const persistent = Boolean(options?.persistent || actionCallback);

  if (options?.swUpdateBanner) {
    if (document.querySelector('.app-toast-live[data-qhse-sw-update="1"]')) return;
  }

  const existing = document.querySelector('.app-toast-live');
  if (existing) existing.remove();

  const tone =
    variant === 'error'
      ? 'error'
      : variant === 'info'
        ? 'info'
        : variant === 'warning'
          ? 'warning'
          : 'success';

  const live = document.createElement('div');
  live.className = 'app-toast-live';
  if (options?.swUpdateBanner) {
    live.dataset.qhseSwUpdate = '1';
  }
  live.setAttribute('role', 'alert');
  live.setAttribute('aria-live', 'assertive');
  live.setAttribute('aria-atomic', 'true');

  const el = document.createElement('div');
  el.className = `app-toast app-toast--${tone}`;
  if (actionCallback) {
    el.classList.add('app-toast--column');
    el.style.cursor = 'default';
  }

  const msg = document.createElement('span');
  msg.className = 'app-toast__msg';
  msg.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'app-toast__close';
  closeBtn.setAttribute('aria-label', 'Fermer la notification');
  closeBtn.textContent = '✕';

  if (actionCallback && actionLabel) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'app-toast__action btn btn-primary';
    actionBtn.textContent = actionLabel;
    actionBtn.style.cssText = 'flex-shrink:0;margin:0;align-self:center;';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      actionCallback();
    });
    el.append(msg, actionBtn, closeBtn);
  } else {
    el.append(msg, closeBtn);
  }

  live.append(el);
  document.body.append(live);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('app-toast--in'));
  });

  let hideTimer = 0;
  const dismiss = () => {
    window.clearTimeout(hideTimer);
    live.remove();
  };

  if (!persistent) {
    hideTimer = window.setTimeout(dismiss, 2800);
  }

  el.addEventListener('click', (e) => {
    if (e.target.closest('.app-toast__close')) return;
    if (e.target.closest('.app-toast__action')) return;
    if (!persistent) dismiss();
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss();
  });
}
