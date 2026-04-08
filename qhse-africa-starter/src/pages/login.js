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
        <div class="section-kicker">QHSE Control</div>
        <h3>Connexion</h3>
        <p class="dashboard-muted-lead" style="margin:8px 0 0">
          Accédez à votre espace sécurisé : tableau de bord, modules et notifications adaptés à votre rôle et à votre organisation.
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
        <button type="button" class="btn login-skip">Continuer en exploration (sans compte)</button>
      </div>
      <div class="login-org-panel" style="display:none;margin-top:14px;padding:12px;border-radius:8px;background:var(--card-bg-2, rgba(0,0,0,.04));border:1px solid var(--border-subtle, rgba(0,0,0,.08))">
        <label class="field field-full">
          <span>Organisation</span>
          <select class="control-input login-org-select" required></select>
        </label>
        <button type="button" class="btn btn-primary login-org-continue" style="margin-top:10px;width:100%">
          Continuer avec cette organisation
        </button>
      </div>
      <p class="login-hint login-hint--dev" style="margin:14px 0 0;font-size:12px;color:var(--text3);line-height:1.45;display:none">
        Développement local — après <code style="font-size:11px">npx prisma db seed</code> : ex.
        <code style="font-size:11px">qhse@qhse.local</code> / <code style="font-size:11px">Demo2026!</code>
        (voir <code style="font-size:11px">backend/prisma/seed.js</code>).
      </p>
    </form>
  `;

  const form = card.querySelector('.login-form');
  const emailEl = card.querySelector('.login-email');
  const passEl = card.querySelector('.login-password');
  const submitBtn = card.querySelector('.login-submit');
  const skipBtn = card.querySelector('.login-skip');
  const orgPanel = card.querySelector('.login-org-panel');
  const orgSelect = card.querySelector('.login-org-select');
  const orgContinue = card.querySelector('.login-org-continue');
  const devHintEl = card.querySelector('.login-hint--dev');
  if (devHintEl instanceof HTMLElement && import.meta.env.DEV) {
    devHintEl.style.display = 'block';
  }

  function hideOrgPanel() {
    if (orgPanel) orgPanel.style.display = 'none';
    if (orgSelect) orgSelect.innerHTML = '';
  }

  function showOrgPicker(tenants) {
    if (!orgPanel || !orgSelect || !Array.isArray(tenants) || !tenants.length) return;
    orgSelect.innerHTML = '';
    for (const t of tenants) {
      const slug = typeof t.slug === 'string' ? t.slug : '';
      if (!slug) continue;
      const opt = document.createElement('option');
      opt.value = slug;
      const name = typeof t.name === 'string' && t.name ? t.name : slug;
      opt.textContent = name;
      orgSelect.appendChild(opt);
    }
    if (!orgSelect.options.length) return;
    orgPanel.style.display = 'block';
  }

  async function submitLogin(tenantSlug) {
    const email = String(emailEl.value || '').trim();
    const password = passEl.value || '';
    if (!email || !password) {
      showToast('Saisissez e-mail et mot de passe', 'error');
      return;
    }
    const prevLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion…';
    hideOrgPanel();
    try {
      const payload = { email, password };
      if (tenantSlug) payload.tenantSlug = tenantSlug;
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 || (res.status === 400 && Array.isArray(body.tenants) && body.tenants.length)) {
        showToast(typeof body.error === 'string' ? body.error : 'Choisissez une organisation', 'error');
        showOrgPicker(body.tenants || []);
        return;
      }
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
        body.token,
        { tenant: body.tenant, tenants: body.tenants }
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
  }

  orgContinue?.addEventListener('click', () => {
    const slug = orgSelect?.value?.trim();
    if (!slug) {
      showToast('Sélectionnez une organisation', 'error');
      return;
    }
    void submitLogin(slug);
  });

  skipBtn.addEventListener('click', () => {
    window.location.hash = 'dashboard';
    onSuccess();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitLogin('');
  });

  wrap.append(card);
  return wrap;
}
