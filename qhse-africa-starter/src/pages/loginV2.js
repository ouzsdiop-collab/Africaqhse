import { getApiBase } from '../config.js';
import { setAuthSession } from '../data/sessionUser.js';
import { persistTokensFromLoginResponse } from '../utils/auth.js';
import { showToast } from '../components/toast.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { setCurrentPage, setActiveSiteContext } from '../utils/state.js';
import { setDemoMode } from '../services/demoMode.service.js';
import { DEMO_SITE_ID, DEMO_SITE_LABEL } from '../data/demoModeFixtures.js';

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
.lv2-stats-row {
  display: flex;
  gap: 24px;
  margin: 28px 0 24px;
}
.lv2-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(82,148,247,.08);
  border: 1px solid rgba(82,148,247,.15);
  border-radius: 12px;
  padding: 14px 20px;
  min-width: 80px;
  flex: 1;
}
.lv2-stat-num {
  font-size: 22px;
  font-weight: 800;
  color: rgba(82,148,247,.95);
  letter-spacing: -.02em;
  line-height: 1;
  margin-bottom: 4px;
}
.lv2-stat-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(148,163,184,.6);
  text-transform: uppercase;
  letter-spacing: .04em;
  text-align: center;
}
.lv2-testimonial {
  background: rgba(255,255,255,.04);
  border-left: 3px solid rgba(82,148,247,.5);
  border-radius: 0 10px 10px 0;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.lv2-testimonial-text {
  font-size: 13px;
  color: rgba(203,213,225,.8);
  line-height: 1.6;
  font-style: italic;
  margin: 0 0 6px;
}
.lv2-testimonial-author {
  font-size: 11px;
  color: rgba(148,163,184,.5);
  margin: 0;
}
.lv2-countries {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.lv2-flag {
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.3));
  cursor: default;
  transition: transform 150ms;
}
.lv2-flag:hover {
  transform: scale(1.2);
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
.lv2-secure-note {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  font-size: 11px;
  color: rgba(148,163,184,.35);
  margin: 10px 0 0;
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
.lv2-forgot-btn {
  background: none;
  border: none;
  color: rgba(148,163,184,.55);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  transition: color 150ms;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.lv2-forgot-btn:hover {
  color: rgba(82,148,247,.85);
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

function readResetTokenFromHash() {
  const h = window.location.hash.replace(/^#/, '');
  if (!h.startsWith('reset-password')) return '';
  const qi = h.indexOf('?');
  if (qi < 0) return '';
  return new URLSearchParams(h.slice(qi + 1)).get('token')?.trim() || '';
}

function lv2AuthLeftColumnMini(title, subtitle) {
  const left = document.createElement('div');
  left.className = 'lv2-left';
  left.innerHTML = `
  <div class="lv2-logo">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
         stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <span class="lv2-logo-name">QHSE Control</span>
  </div>
  <div class="lv2-left-main" style="flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0;width:100%;max-width:100%">
    <h1 class="lv2-headline">${title}</h1>
    <p class="lv2-tagline">${subtitle}</p>
  </div>
  <p class="lv2-gdpr">Sécurité des accès · Multi-organisations</p>
`;
  return left;
}

/**
 * @param {{ onNavigate?: () => void }} params
 */
export function createForgotPasswordView({ onNavigate }) {
  ensureDashboardStyles();
  ensureLoginV2Styles();

  const screen = document.createElement('div');
  screen.className = 'lv2-screen';
  const left = lv2AuthLeftColumnMini(
    'Réinitialiser<br>votre accès',
    'Indiquez l’adresse e-mail du compte. Si elle est connue, un lien valable 1 h vous sera envoyé.'
  );

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
    <form class="lv2-form lv2-forgot-form" novalidate>
      <p class="lv2-form-title">Mot de passe oublié</p>
      <p class="lv2-form-sub">Nous vous enverrons un lien sécurisé si un compte existe pour cette adresse.</p>
      <label class="lv2-field">
        <span class="lv2-field-label">Adresse e-mail</span>
        <input type="email" name="email" class="control-input lv2-input lv2-forgot-email" autocomplete="email" placeholder="vous@votre-entreprise.com" />
      </label>
      <button type="submit" class="btn btn-primary lv2-submit">Envoyer le lien</button>
      <button type="button" class="lv2-demo-link lv2-back-login">Retour à la connexion</button>
    </form>
  `;

  const form = inner.querySelector('.lv2-forgot-form');
  const emailEl = inner.querySelector('.lv2-forgot-email');
  const backBtn = inner.querySelector('.lv2-back-login');
  const submitBtn = form?.querySelector('.lv2-submit');

  backBtn?.addEventListener('click', () => {
    window.location.hash = 'login';
    onNavigate?.();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = String(emailEl?.value || '').trim().toLowerCase();
    if (!email) {
      showToast('Saisissez votre adresse e-mail', 'error');
      return;
    }
    const prev = submitBtn?.textContent || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi…';
    }
    try {
      const res = await fetch(`${getApiBase()}/api/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body.error === 'string'
            ? body.error
            : 'Impossible d’envoyer la demande pour le moment.';
        showToast(msg, 'error');
        return;
      }
      showToast(
        typeof body.message === 'string'
          ? body.message
          : 'Si un compte existe, un e-mail a été envoyé.',
        'success'
      );
      window.location.hash = 'login';
      onNavigate?.();
    } catch {
      showToast('Réseau ou serveur indisponible', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prev;
      }
    }
  });

  right.append(inner);
  screen.append(left, right);
  return screen;
}

/**
 * @param {{ onNavigate?: () => void }} params
 */
export function createResetPasswordView({ onNavigate }) {
  ensureDashboardStyles();
  ensureLoginV2Styles();

  const token = readResetTokenFromHash();

  const screen = document.createElement('div');
  screen.className = 'lv2-screen';
  const left = lv2AuthLeftColumnMini(
    'Nouveau<br>mot de passe',
    'Choisissez un mot de passe solide. Après validation, connectez-vous avec vos nouveaux identifiants.'
  );

  const right = document.createElement('div');
  right.className = 'lv2-right';
  const inner = document.createElement('div');
  inner.className = 'lv2-right-inner';

  if (!token) {
    inner.innerHTML = `
      <div class="lv2-mobile-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>QHSE Control</span>
      </div>
      <p class="lv2-form-title">Lien invalide</p>
      <p class="lv2-form-sub">Le lien de réinitialisation est absent ou incomplet. Demandez un nouvel e-mail depuis la page de connexion.</p>
      <button type="button" class="btn btn-primary lv2-submit lv2-back-login-invalid">Retour à la connexion</button>
    `;
    inner.querySelector('.lv2-back-login-invalid')?.addEventListener('click', () => {
      window.location.hash = 'login';
      onNavigate?.();
    });
    right.append(inner);
    screen.append(left, right);
    return screen;
  }

  inner.innerHTML = `
    <div class="lv2-mobile-brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>QHSE Control</span>
    </div>
    <form class="lv2-form lv2-reset-form" novalidate>
      <p class="lv2-form-title">Définir un nouveau mot de passe</p>
      <p class="lv2-form-sub">Le lien expire après une heure.</p>
      <label class="lv2-field">
        <span class="lv2-field-label">Nouveau mot de passe</span>
        <div class="lv2-password-wrap">
          <input type="password" name="password" class="control-input lv2-input lv2-reset-pass" autocomplete="new-password" placeholder="••••••••" />
          <button type="button" class="lv2-eye-btn" aria-label="Afficher le mot de passe">${EYE_OPEN_SVG}</button>
        </div>
      </label>
      <label class="lv2-field">
        <span class="lv2-field-label">Confirmer</span>
        <input type="password" name="password2" class="control-input lv2-input lv2-reset-pass2" autocomplete="new-password" placeholder="••••••••" />
      </label>
      <button type="submit" class="btn btn-primary lv2-submit">Enregistrer</button>
      <button type="button" class="lv2-demo-link lv2-back-login-reset">Retour à la connexion</button>
    </form>
  `;

  const form = inner.querySelector('.lv2-reset-form');
  const passEl = inner.querySelector('.lv2-reset-pass');
  const pass2El = inner.querySelector('.lv2-reset-pass2');
  const eyeBtn = inner.querySelector('.lv2-eye-btn');
  const backBtn = inner.querySelector('.lv2-back-login-reset');
  const submitBtn = form?.querySelector('.lv2-submit');

  backBtn?.addEventListener('click', () => {
    window.location.hash = 'login';
    onNavigate?.();
  });

  if (eyeBtn && passEl) {
    eyeBtn.addEventListener('click', () => {
      const isHidden = passEl.type === 'password';
      passEl.type = isHidden ? 'text' : 'password';
      eyeBtn.innerHTML = isHidden ? EYE_OFF_SVG : EYE_OPEN_SVG;
      eyeBtn.setAttribute(
        'aria-label',
        isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
      );
    });
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passEl?.value || '';
    const password2 = pass2El?.value || '';
    if (!password || password !== password2) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    const prev = submitBtn?.textContent || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enregistrement…';
    }
    try {
      const res = await fetch(`${getApiBase()}/api/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body.error === 'string'
            ? body.error
            : 'Réinitialisation impossible. Demandez un nouveau lien.';
        showToast(msg, 'error');
        return;
      }
      showToast(
        typeof body.message === 'string' ? body.message : 'Mot de passe mis à jour.',
        'success'
      );
      window.location.hash = 'login';
      onNavigate?.();
    } catch {
      showToast('Réseau ou serveur indisponible', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prev;
      }
    }
  });

  right.append(inner);
  screen.append(left, right);
  return screen;
}

/**
 * @param {{ onSuccess: () => void, onNavigate?: () => void }} params
 */
export function createLoginView({ onSuccess, onNavigate }) {
  ensureDashboardStyles();
  ensureLoginV2Styles();

  const screen = document.createElement('div');
  screen.className = 'lv2-screen';

  const left = document.createElement('div');
  left.className = 'lv2-left';
  left.innerHTML = `
  <div class="lv2-logo">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
         stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <span class="lv2-logo-name">QHSE Control</span>
  </div>

  <div class="lv2-left-main">
    <h1 class="lv2-headline">Pilotez votre QHSE.<br>Depuis le terrain.</h1>
    <p class="lv2-tagline">
      La plateforme digitale conçue pour les entreprises africaines.
    </p>
    <div class="lv2-sep" aria-hidden="true"></div>

    <div class="lv2-benefits">
      <div class="lv2-benefit">
        <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Déclaration terrain en <strong>moins de 2 minutes</strong>, même sans connexion</span>
      </div>
      <div class="lv2-benefit">
        <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Conformité <strong>ISO 45001 · ISO 14001 · ISO 9001</strong> intégrée</span>
      </div>
      <div class="lv2-benefit">
        <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Rapports PDF et alertes <strong>automatisés</strong> par email</span>
      </div>
      <div class="lv2-benefit">
        <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Analyse des risques chimiques par <strong>IA</strong> (FDS en 1 clic)</span>
      </div>
    </div>

    <div class="lv2-stats-row">
      <div class="lv2-stat">
        <span class="lv2-stat-num">5+</span>
        <span class="lv2-stat-label">Pays couverts</span>
      </div>
      <div class="lv2-stat">
        <span class="lv2-stat-num">100%</span>
        <span class="lv2-stat-label">Hors connexion</span>
      </div>
      <div class="lv2-stat">
        <span class="lv2-stat-num">IA</span>
        <span class="lv2-stat-label">Intégrée</span>
      </div>
    </div>

    <div class="lv2-testimonial">
      <p class="lv2-testimonial-text">
        "Nous avons réduit notre temps de reporting QHSE de 60 %
        dès le premier mois d'utilisation."
      </p>
      <p class="lv2-testimonial-author">— Responsable QHSE, industrie minière, Sénégal</p>
    </div>

    <div class="lv2-countries">
      <span class="lv2-flag" title="Sénégal">🇸🇳</span>
      <span class="lv2-flag" title="Côte d'Ivoire">🇨🇮</span>
      <span class="lv2-flag" title="Burkina Faso">🇧🇫</span>
      <span class="lv2-flag" title="Mali">🇲🇱</span>
      <span class="lv2-flag" title="Cameroun">🇨🇲</span>
      <span class="lv2-flag" title="France">🇫🇷</span>
      <span class="lv2-flag" title="Belgique">🇧🇪</span>
    </div>
  </div>

  <p class="lv2-gdpr">Sécurité des accès · Journal d'audit · Multi-organisations</p>
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
      <p class="lv2-form-sub">Bienvenue sur QHSE Control — la plateforme QHSE dédiée à l'Afrique.</p>
      <label class="lv2-field">
        <span class="lv2-field-label">Adresse e-mail</span>
        <input type="email" name="email" class="control-input lv2-input lv2-email" autocomplete="username" placeholder="vous@votre-entreprise.com" />
      </label>
      <label class="lv2-field">
        <span class="lv2-field-label">Mot de passe</span>
        <div class="lv2-password-wrap">
          <input type="password" name="password" class="control-input lv2-input lv2-password" autocomplete="current-password" placeholder="••••••••" />
          <button type="button" class="lv2-eye-btn" aria-label="Afficher le mot de passe">
            ${EYE_OPEN_SVG}
          </button>
        </div>
      </label>
      <div style="text-align:right;margin-bottom:4px;margin-top:-8px">
        <button type="button" class="lv2-forgot-btn">
          Mot de passe oublié ?
        </button>
      </div>
      <button type="submit" class="btn btn-primary lv2-submit">Se connecter</button>
      <p class="lv2-secure-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Connexion sécurisée · Données chiffrées
      </p>
      <div class="lv2-org-panel" style="display:none;margin-top:16px;padding:12px;border-radius:10px;background:rgba(15,23,42,.06);border:1px solid rgba(15,23,42,.1)">
        <label class="lv2-field">
          <span class="lv2-field-label">Organisation</span>
          <select class="control-input lv2-input lv2-org-select" required></select>
        </label>
        <button type="button" class="btn btn-primary lv2-org-continue" style="margin-top:12px;width:100%">Continuer</button>
      </div>
      <div class="lv2-sep" style="margin:20px 0" aria-hidden="true"></div>
      <button type="button" class="lv2-demo-link">Accéder à la démo mines →</button>
    </form>
  `;

  const form = inner.querySelector('.lv2-form');
  const emailEl = inner.querySelector('.lv2-email');
  const passEl = inner.querySelector('.lv2-password');
  const submitBtn = inner.querySelector('.lv2-submit');
  const skipBtn = inner.querySelector('.lv2-demo-link');
  const forgotBtn = inner.querySelector('.lv2-forgot-btn');
  const lv2EyeBtn = inner.querySelector('.lv2-eye-btn');
  const orgPanel = inner.querySelector('.lv2-org-panel');
  const orgSelect = inner.querySelector('.lv2-org-select');
  const orgContinue = inner.querySelector('.lv2-org-continue');

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
      opt.textContent = typeof t.name === 'string' && t.name ? t.name : slug;
      orgSelect.appendChild(opt);
    }
    if (!orgSelect.options.length) return;
    orgPanel.style.display = 'block';
  }

  async function submitLogin(tenantSlug) {
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
    hideOrgPanel();
    try {
      const payload = { email, password };
      if (tenantSlug) payload.tenantSlug = tenantSlug;
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
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
      persistTokensFromLoginResponse(body);
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
      setCurrentPage('dashboard');
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
  }

  orgContinue?.addEventListener('click', () => {
    const slug = orgSelect?.value?.trim();
    if (!slug) {
      showToast('Sélectionnez une organisation', 'error');
      return;
    }
    void submitLogin(slug);
  });

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

  forgotBtn?.addEventListener('click', () => {
    window.location.hash = 'forgot-password';
    onNavigate?.();
  });

  skipBtn?.addEventListener('click', () => {
    setDemoMode(true);
    setActiveSiteContext(DEMO_SITE_ID, DEMO_SITE_LABEL);
    setCurrentPage('mines-demo');
    window.location.hash = 'mines-demo';
    onSuccess();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitLogin('');
  });

  if (import.meta.env.DEV) {
    const devHint = document.createElement('p');
    devHint.className = 'lv2-dev-hint';
    devHint.style.cssText =
      'margin:18px 0 0;font-size:11px;color:rgba(148,163,184,.5);line-height:1.5';
    devHint.innerHTML =
      'Développement local — après <code style="font-size:10px;opacity:.95">npx prisma db seed</code> : comptes de test (voir <code style="font-size:10px">backend/prisma/seed.js</code>), ex. <code style="font-size:10px">qhse@qhse.local</code> / <code style="font-size:10px">Demo2026!</code>.';
    inner.appendChild(devHint);
  }

  right.append(inner);
  screen.append(left, right);
  return screen;
}
