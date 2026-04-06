/** Retour visuel court, accessible (mock — pas de file d’attente). */
export function showToast(message, variant = 'success') {
  const existing = document.querySelector('.app-toast');
  if (existing) existing.remove();

  const tone =
    variant === 'error'
      ? 'error'
      : variant === 'info'
        ? 'info'
        : variant === 'warning'
          ? 'warning'
          : 'success';

  const el = document.createElement('div');
  el.className = `app-toast app-toast--${tone}`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;

  document.body.append(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('app-toast--in'));
  });

  const t = window.setTimeout(() => el.remove(), 2800);
  el.addEventListener(
    'click',
    () => {
      window.clearTimeout(t);
      el.remove();
    },
    { once: true }
  );
}
