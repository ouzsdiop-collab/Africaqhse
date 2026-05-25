import { qhseFetch } from '../../utils/qhseFetch.js';
import { unlockAdminGateSession } from '../../utils/adminGateSession.js';

function createInput() {
  const input = document.createElement('input');
  input.type = 'password';
  input.name = 'code';
  input.autocomplete = 'current-password';
  input.required = true;
  input.placeholder = 'Code d’accès';
  input.className = 'sc-input admin-gate-input';
  return input;
}

export function createAdminGateLoginView({ onUnlock }) {
  const root = document.createElement('main');
  root.className = 'admin-gate-root';

  const card = document.createElement('section');
  card.className = 'content-card card-soft admin-gate-card';

  const title = document.createElement('h1');
  title.textContent = 'Admin QHSE Control';
  title.className = 'admin-gate-title';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Espace réservé';
  subtitle.className = 'admin-gate-subtitle';

  const form = document.createElement('form');
  form.className = 'admin-gate-form';

  const usernameField = document.createElement('input');
  usernameField.type = 'text';
  usernameField.name = 'username';
  usernameField.autocomplete = 'username';
  usernameField.value = 'admin-qhse-control';
  usernameField.hidden = true;

  const input = createInput();
  const msg = document.createElement('p');
  msg.className = 'admin-gate-message';

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn btn-primary';
  btn.textContent = 'Accéder';

  function setLoading(v) {
    btn.disabled = v;
    input.disabled = v;
    btn.textContent = v ? 'Vérification…' : 'Accéder';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    msg.textContent = '';
    const code = String(input.value || '').trim();
    if (!code) {
      msg.textContent = 'Code d’accès incorrect.';
      return;
    }
    setLoading(true);
    try {
      const res = await qhseFetch('/api/admin-gate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.ok) {
        unlockAdminGateSession();
        onUnlock?.();
        return;
      }
      if (res.status === 503 || payload?.code === 'ADMIN_GATE_CONFIG_MISSING') {
        msg.textContent = 'Configuration admin indisponible.';
      } else if (res.status === 401 || res.status === 403) {
        msg.textContent = 'Code d’accès incorrect.';
      } else {
        msg.textContent = 'Impossible de contacter le serveur.';
      }
    } catch {
      msg.textContent = 'Impossible de contacter le serveur.';
    } finally {
      setLoading(false);
    }
  });

  form.append(usernameField, input, btn, msg);
  card.append(title, subtitle, form);
  root.append(card);
  return root;
}
