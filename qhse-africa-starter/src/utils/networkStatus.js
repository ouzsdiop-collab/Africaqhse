const listeners = new Set();

export function isOnline() {
  return navigator.onLine !== false;
}

export function subscribeNetworkStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(online) {
  listeners.forEach(fn => {
    try { fn(online); } catch {}
  });
  const indicator = document.getElementById('network-indicator');
  if (indicator) indicator.classList.toggle('offline', !online);
}

export function syncNetworkIndicatorUi() {
  const indicator = document.getElementById('network-indicator');
  if (indicator) indicator.classList.toggle('offline', !isOnline());
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notify(true));
  window.addEventListener('offline', () => notify(false));

  if (!navigator.onLine) {
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('network-indicator')?.classList.add('offline');
    });
  }
}
