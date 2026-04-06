import { getApiBase } from '../config.js';
import { setAuthSession } from '../data/sessionUser.js';
import { showToast } from '../components/toast.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';

/**
 * Écran de connexion discret (email + mot de passe) — classes existantes du shell.
 * @param {{ onSuccess: () => void }} params
 */
export function createLoginView({ onSuccess }) {
  ensureDashboardStyles();

  const wrap = document.createElement('div');
  wrap.className = 'login-screen';
  wrap.style.cssText =
    'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box';

  const card = document.createElement('article');
  card.className = 'content-card card-soft';
  card.style.maxWidth = '440px';
  card.style.width = '100%';

  card.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Accès</div>
        <h3>Connexion QHSE</h3>
        <p class="dashboard-muted-lead" style="margin:8px 0 0">
          Identifiez-vous pour aligner permissions, « Mes actions » et notifications sur votre compte.
        </p>
      </div>
    </div>
    <form class="login-form" novalidate>
      <div class="form-grid" style="grid-template-columns:1fr;gap:14px">
        <label class="field field-full">
          <span>Adresse e-mail</span>
          <input type="email" name="email" class="control-input login-email" required autocomplete="username" />
        </label>
        <label class="field field-full">
          <span>Mot de passe</span>
          <input type="password" name="password" class="control-input login-password" required autocomplete="current-password" />
        </label>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;align-items:center">
        <button type="submit" class="btn btn-primary login-submit">Se connecter</button>
        <button type="button" class="btn login-skip">Continuer sans compte (démo)</button>
      </div>
      <p class="login-hint" style="margin:14px 0 0;font-size:12px;color:var(--text3);line-height:1.45">
        Après <code style="font-size:11px">npx prisma db seed</code> : ex. <code style="font-size:11px">qhse@qhse.local</code> — mot de passe démo
        <code style="font-size:11px">QhseDemo2026!</code> (identique pour tous les comptes seed).
      </p>
    </form>
  `;

  const form = card.querySelector('.login-form');
  const emailEl = card.querySelector('.login-email');
  const passEl = card.querySelector('.login-password');
  const submitBtn = card.querySelector('.login-submit');
  const skipBtn = card.querySelector('.login-skip');

  skipBtn.addEventListener('click', () => {
    window.location.hash = 'dashboard';
    onSuccess();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = String(emailEl.value || '').trim();
    const password = passEl.value || '';
    if (!email || !password) {
      showToast('Saisissez e-mail et mot de passe', 'error');
      return;
    }
    const prevLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion…';
    try {
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Connexion impossible', 'error');
        return;
      }
      if (!body.token || !body.user?.id) {
        showToast('Réponse serveur invalide', 'error');
        return;
      }
      setAuthSession(
        {
          id: body.user.id,
          name: body.user.name || '',
          email: body.user.email || '',
          role: body.user.role || ''
        },
        body.token
      );
      showToast(`Bienvenue, ${body.user.name || body.user.email}`, 'success');
      window.location.hash = 'dashboard';
      onSuccess();
    } catch {
      showToast('Réseau ou serveur indisponible', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel;
    }
  });

  wrap.append(card);
  return wrap;
}
