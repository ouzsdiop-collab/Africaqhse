const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export function getApiBase() {
  if (typeof window === 'undefined') {
    return DEFAULT_API_BASE;
  }
  const raw = window.__QHSE_API_BASE__;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  return DEFAULT_API_BASE;
}