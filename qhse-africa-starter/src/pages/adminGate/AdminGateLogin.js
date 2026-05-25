import { qhseFetch } from '../../utils/qhseFetch.js';
import { unlockAdminGateSession } from '../../utils/adminGateSession.js';

function createInput() {
  const input = document.createElement('input');
  input.type = 'password';
  input.name = 'code';
  input.autocomplete = 'current-password';
  input.required = true;
  input.placeholder = 'Code d’accès';
  input.className = 'sc-input';
  input.style.width = '100%';
  input.style.padding = '.85rem .95rem';
  input.style.borderRadius = '.7rem';
  input.style.border = '1px solid #334155';
  input.style.background = '#0b1220';
  input.style.color = '#e2e8f0';
  return input;
}

export function createAdminGateLoginView({ onUnlock }) {
  const root = document.createElement('main');
  root.style.minHeight = '100vh';
  root.style.display = 'grid';
  root.style.placeItems = 'center';
  root.style.background = 'radial-gradient(circle at top, #111827 0%, #020617 55%, #000 100%)';
  root.style.color = '#e2e8f0';

  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  card.style.width = 'min(460px, calc(100vw - 2rem))';
  card.style.padding = '1.5rem';

  const title = document.createElement('h1');
  title.textContent = 'Admin QHSE Control';
  title.style.margin = '0 0 .35rem';
  title.style.fontSize = '1.5rem';
  title.style.color = '#f8fafc';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Espace réservé';
  subtitle.style.margin = '0 0 1rem';
  subtitle.style.color = '#94a3b8';

  const form = document.createElement('form');
  form.style.display = 'grid';
  form.style.gap = '.75rem';

  const input = createInput();
  const msg = document.createElement('p');
  msg.style.margin = '0';
  msg.style.minHeight = '1.2rem';
  msg.style.fontSize = '.92rem';

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
    msg.style.color = '#fca5a5';
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
      if (payload?.code === 'ADMIN_GATE_CONFIG_MISSING') {
        msg.textContent = 'Configuration admin indisponible.';
      } else {
        msg.textContent = 'Code d’accès incorrect.';
      }
    } catch {
      msg.textContent = 'Configuration admin indisponible.';
    } finally {
      setLoading(false);
    }
  });

  form.append(input, btn, msg);
  card.append(title, subtitle, form);
  root.append(card);
  return root;
}
