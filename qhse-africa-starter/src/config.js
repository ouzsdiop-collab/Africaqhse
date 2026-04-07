/**
 * Base URL de l’API (backend Express).
 * Surcharge possible avant le chargement du module principal :
 *   <script>window.__QHSE_API_BASE__ = 'http://127.0.0.1:3001';</script>
 */
const DEFAULT_API_BASE = 'http://localhost:3001';

function isTypicalDevStaticPort(port) {
  const p = String(port || '');
  if (p === '5500' || p === '8080' || p === '3000') return true;
  /** Vite : 5173 par défaut, ports suivants si strictPort: false */
  if (/^517[3-9]$/.test(p)) return true;
  return false;
}

function isLocalDevHostname(hostname) {
  const h = String(hostname || '');
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/**
 * Même hostname que la page → évite les blocages navigateur / PNA entre localhost et 127.0.0.1.
 * IPv6 loopback : URL correcte avec crochets.
 */
function devApiBaseFromPageHostname(hostname) {
  const h = String(hostname || '');
  if (h === '::1') {
    return 'http://[::1]:3001';
  }
  return `http://${h}:3001`;
}

export function getApiBase() {
  if (typeof window === 'undefined') {
    return DEFAULT_API_BASE;
  }
  const raw = window.__QHSE_API_BASE__;
  if (raw != null && String(raw).trim() !== '') {
    const custom = String(raw).replace(/\/$/, '');
    if (
      custom === window.location.origin &&
      isTypicalDevStaticPort(window.location.port)
    ) {
      return devApiBaseFromPageHostname(window.location.hostname);
    }
    return custom;
  }
  const h = window.location.hostname;
  const port = String(window.location.port || '');
  /** Dev : API sur le même hôte que le front (5173 → :3001). CORS activé côté Express. */
  if (isLocalDevHostname(h) && isTypicalDevStaticPort(port)) {
    return devApiBaseFromPageHostname(h);
  }
  /** Vite --host (ex. 192.168.x.x:5173) : API sur la même IP. */
  if (isTypicalDevStaticPort(port) && /^517/.test(port) && h && !isLocalDevHostname(h)) {
    return `http://${h}:3001`;
  }
  return DEFAULT_API_BASE;
}
