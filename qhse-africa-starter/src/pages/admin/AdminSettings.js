import { adminApi, jsonOrEmpty } from './adminApi.js';

export async function renderAdminSettings() {
  const section = document.createElement('section');
  section.innerHTML = '<h2>Paramètres</h2><div class="admin-card">Configuration de la console admin.</div>';
  const health = await fetch('/api/health').then((r) => r.json()).catch(() => null);
  if (health) {
    const card = document.createElement('article');
    card.className = 'admin-card';
    card.innerHTML = `<h3>Health</h3><pre>${JSON.stringify(health, null, 2)}</pre>`;
    section.append(card);
  }
  const setup = await adminApi('/setup/status').then(jsonOrEmpty).catch(() => null);
  if (setup) {
    const card = document.createElement('article');
    card.className = 'admin-card';
    card.innerHTML = `<h3>Setup mode</h3><pre>${JSON.stringify(setup, null, 2)}</pre>`;
    section.append(card);
  }
  return section;
}
