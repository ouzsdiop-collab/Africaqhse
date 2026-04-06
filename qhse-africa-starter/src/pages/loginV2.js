import { getApiBase } from '../config.js';
import { setAuthSession } from '../data/sessionUser.js';
import { showToast } from '../components/toast.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';

const LOGIN_V2_STYLE_ID = 'qhse-loginv2-styles';

function ensureLoginV2Styles() {
  if (document.getElementById(LOGIN_V2_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = LOGIN_V2_STYLE_ID;
  el.textContent = `
.lv2-screen {
  min-height: 100vh;
  display: flex;
  background: #0d1117;
}
.lv2-left {
  width: 42%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 48px 40px;
  position: relative;
  background: rgba(10,14,22,.98);
  border-right: 1px solid rgba(255,255,255,.06);
}
.lv2-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}
.lv2-right-inner {
  width: 100%;
  max-width: 380px;
}
.lv2-logo {
  position: absolute;
  top: 28px; left: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.lv2-logo-name {
  font-size: 14px;
  font-weight: 700;
  color: rgba(226,232,240,.9);
  letter-spacing: -.01em;
}
.lv2-headline {
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 900;
  letter-spacing: -.03em;
  color: #f1f5f9;
  line-height: 1.15;
  margin: 0 0 10px;
}
.lv2-tagline {
  font-size: 13px;
  color: rgba(148,163,184,.65);
  margin: 0 0 28px;
  letter-spacing: .01em;
}
.lv2-sep {
  height: 1px;
  background: rgba(255,255,255,.07);
  margin: 0 0 28px;
}
.lv2-benefits {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.lv2-benefit {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: rgba(203,213,225,.8);
  line-height: 1.5;
}
.lv2-gdpr {
  position: absolute;
  bottom: 24px; left: 32px;
  font-size: 11px;
  color: rgba(148,163,184,.3);
}
.lv2-form-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -.025em;
  color: #f1f5f9;
  margin: 0 0 6px;
}
.lv2-form-sub {
  font-size: 13px;
  color: rgba(148,163,184,.55);
  margin: 0 0 28px;
  line-height: 1.4;
}
.lv2-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.lv2-field-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(148,163,184,.7);
  letter-spacing: .02em;
}
.lv2-input {
  width: 100%;
}
.lv2-password-wrap {
  position: relative;
}
.lv2-password-wrap .lv2-input {
  padding-right: 44px;
}
.lv2-eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(148,163,184,.5);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.lv2-eye-btn:hover {
  color: rgba(148,163,184,.85);
}
.lv2-submit {
  width: 100%;
  min-height: 44px;
  font-size: 14px;
  font-weight: 700;
  margin-top: 20px;
}
.lv2-demo-link {
  display: block;
  margin: 18px auto 0;
  background: none;
  border: none;
  color: rgba(148,163,184,.45);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 150ms;
}
.lv2-demo-link:hover {
  color: rgba(148,163,184,.75);
}
.lv2-mobile-brand {
  display: none;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}
@media (max-width: 768px) {
  .lv2-left { display: none; }
  .lv2-right { padding: 32px 24px; }
  .lv2-mobile-brand { display: flex; }
  .lv2-screen { background: #0d1117; }
}
`;
  document.head.append(el);
}

const CHECK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,.8)" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`;

const EYE_OPEN_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

/**
 * @param {{ onSuccess: () => void }} params
 */
export function createLoginView({ onSuccess }) {
  ensureDashboardStyles();
  ensureLoginV2Styles();

  const screen = document.createElement('div');
  screen.className = 'lv2-screen';

  const left = document.createElement('div');
  left.className = 'lv2-left';
  left.innerHTML = `
    <div class="lv2-logo">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span class="lv2-logo-name">QHSE Control</span>
    </div>
    <div class="lv2-left-main">
      <h1 class="lv2-headline">Pilotez votre conformité QHSE</h1>
      <p class="lv2-tagline">Incidents · Risques · Audits · Actions</p>
      <div class="lv2-sep" aria-hidden="true"></div>
      <div class="lv2-benefits">
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
          <span>Déclaration terrain en moins de 2 minutes</span>
        </div>
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
          <span>Suivi ISO 45001 · 14001 · 9001 intégré</span>
        </div>
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
          <span>Alertes et plans d'actions automatisés</span>
        </div>
      </div>
    </div>
    <p class="lv2-gdpr">Conforme RGPD · Données hébergées EU</p>
  `;

  const leftMain = left.querySelector('.lv2-left-main');
  if (leftMain) {
    leftMain.style.cssText =
      'flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0;width:100%;max-width:100%';
  }

  const right = document.createElement('div');
  right.className = 'lv2-right';

  const inner = document.createElement('div');
  inner.className = 'lv2-right-inner';

  inner.innerHTML = `
    <div class="lv2-mobile-brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>QHSE Control</span>
    </div>
    <form class="lv2-form" novalidate>
      <p class="lv2-form-title">Connexion à votre espace</p>
      <p class="lv2-form-sub">Entrez vos identifiants pour accéder au tableau de bord</p>
      <label class="lv2-field">
        <span class="lv2-field-label">Adresse e-mail</span>
        <input type="email" name="email" class="control-input lv2-input lv2-email" autocomplete="username" placeholder="vous@entreprise.com" />
      </label>
      <label class="lv2-field">
        <span class="lv2-field-label">Mot de passe</span>
        <div class="lv2-password-wrap">
          <input type="password" name="password" class="control-input lv2-input lv2-password" autocomplete="current-password" />
          <button type="button" class="lv2-eye-btn" aria-label="Afficher le mot de passe">
            ${EYE_OPEN_SVG}
          </button>
        </div>
      </label>
      <button type="submit" class="btn btn-primary lv2-submit">Se connecter</button>
      <div class="lv2-sep" style="margin:20px 0" aria-hidden="true"></div>
      <button type="button" class="lv2-demo-link">Continuer en démonstration →</button>
    </form>
  `;

  const form = inner.querySelector('.lv2-form');
  const emailEl = inner.querySelector('.lv2-email');
  const passEl = inner.querySelector('.lv2-password');
  const submitBtn = inner.querySelector('.lv2-submit');
  const skipBtn = inner.querySelector('.lv2-demo-link');
  const lv2EyeBtn = inner.querySelector('.lv2-eye-btn');

  if (lv2EyeBtn && passEl) {
    const eyeHost = lv2EyeBtn;
    lv2EyeBtn.addEventListener('click', () => {
      const isHidden = passEl.type === 'password';
      passEl.type = isHidden ? 'text' : 'password';
      eyeHost.innerHTML = isHidden ? EYE_OFF_SVG : EYE_OPEN_SVG;
      eyeHost.setAttribute(
        'aria-label',
        isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
      );
    });
  }

  skipBtn?.addEventListener('click', () => {
    window.location.hash = 'dashboard';
    onSuccess();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = String(emailEl?.value || '').trim();
    const password = passEl?.value || '';
    if (!email || !password) {
      showToast('Saisissez e-mail et mot de passe', 'error');
      return;
    }
    const prevLabel = submitBtn?.textContent || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion…';
    }
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
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevLabel;
      }
    }
  });

  right.append(inner);
  screen.append(left, right);
  return screen;
}
