import { getApiBase } from '../config.js';
import {
  setAuthSession,
  getPasswordSetupToken,
  getPasswordSetupMeta,
  clearPasswordSetupContext,
  setPasswordSetupContext
} from '../data/sessionUser.js';
import { persistTokensFromLoginResponse } from '../utils/auth.js';
import { showToast } from '../components/toast.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { setCurrentPage } from '../utils/state.js';
import { setDemoMode } from '../services/demoMode.service.js';

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
  position: relative;
  overflow: hidden;
}
.lv2-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.lv2-fx-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: .22;
  mix-blend-mode: screen;
}
.lv2-scan {
  position: absolute;
  inset: -20% -40%;
  opacity: 0;
  background: linear-gradient(115deg,
    rgba(34,211,238,0) 0%,
    rgba(34,211,238,.10) 42%,
    rgba(34,197,94,.08) 50%,
    rgba(34,211,238,0) 58%,
    rgba(34,211,238,0) 100%
  );
  transform: translate3d(-30%, -10%, 0) rotate(-8deg);
  will-change: transform, opacity;
  animation: lv2-scan-sweep 9.5s ease-in-out infinite;
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
.lv2-left::before {
  content: "";
  position: absolute;
  inset: -20%;
  pointer-events: none;
  opacity: .62;
  background:
    radial-gradient(900px 600px at 20% 25%, rgba(34,211,238,.10), transparent 60%),
    radial-gradient(900px 600px at 80% 60%, rgba(34,197,94,.07), transparent 62%),
    radial-gradient(700px 520px at 55% 12%, rgba(82,148,247,.08), transparent 65%);
  transform: translate3d(-2%, -1%, 0);
  will-change: transform, opacity;
  animation: lv2-bg-float 14s ease-in-out infinite;
}
.lv2-left::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .07;
  background-image:
    linear-gradient(rgba(255,255,255,.11) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.11) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(60% 45% at 55% 40%, rgba(0,0,0,.9), transparent 70%);
}
.lv2-left > * { position: relative; z-index: 1; }
.lv2-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(900px 700px at 70% 40%, rgba(34,211,238,.06), transparent 62%),
    radial-gradient(900px 700px at 55% 65%, rgba(82,148,247,.06), transparent 66%),
    #0d1117;
}
.lv2-right::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .10;
  background-image:
    linear-gradient(rgba(255,255,255,.10) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.10) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(60% 55% at 55% 45%, rgba(0,0,0,.95), transparent 72%);
}
.lv2-right::after {
  content: "";
  position: absolute;
  inset: -20%;
  pointer-events: none;
  opacity: .45;
  background: radial-gradient(700px 520px at 50% 52%,
    rgba(34,211,238,.10),
    rgba(82,148,247,.08) 32%,
    rgba(13,17,23,0) 68%
  );
  filter: blur(28px);
  transform: translate3d(0,0,0);
}
.lv2-right-inner {
  width: 100%;
  max-width: 380px;
  position: relative;
}
.lv2-logo {
  position: absolute;
  top: 28px; left: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  isolation: isolate;
}
.lv2-logo svg {
  filter: drop-shadow(0 0 14px rgba(34,211,238,.14)) drop-shadow(0 0 26px rgba(34,197,94,.08));
}
.lv2-logo::after {
  content: "";
  position: absolute;
  left: -6px;
  top: -10px;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  pointer-events: none;
  opacity: .85;
  background: linear-gradient(90deg, transparent, rgba(34,211,238,.40), rgba(34,197,94,.30), transparent);
  transform: translate3d(-120%, 0, 0);
  will-change: transform, opacity;
  mix-blend-mode: screen;
  animation: lv2-logo-scan 5.2s ease-in-out infinite;
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
.lv2-ready .lv2-headline,
.lv2-ready .lv2-tagline,
.lv2-ready .lv2-sep,
.lv2-ready .lv2-benefit,
.lv2-ready .lv2-stat,
.lv2-ready .lv2-testimonial,
.lv2-ready .lv2-countries {
  opacity: 1;
  transform: translate3d(0,0,0);
}
.lv2-headline,
.lv2-tagline,
.lv2-sep,
.lv2-benefit,
.lv2-stat,
.lv2-testimonial,
.lv2-countries {
  opacity: 0;
  transform: translate3d(0, 10px, 0);
  will-change: transform, opacity;
  transition: transform 520ms cubic-bezier(.2,.8,.2,1), opacity 520ms ease;
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
  position: relative;
  transition: transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, box-shadow 220ms ease;
  will-change: transform;
}
.lv2-stat::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  pointer-events: none;
  opacity: 0;
  box-shadow:
    0 0 0 1px rgba(34,211,238,.22),
    0 0 22px rgba(34,211,238,.10),
    0 0 36px rgba(34,197,94,.08);
  transition: opacity 220ms ease;
}
.lv2-stat:hover {
  transform: translate3d(0,-2px,0) scale(1.02);
  border-color: rgba(82,148,247,.22);
}
.lv2-stat:hover::after { opacity: 1; }
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
.lv2-form {
  position: relative;
  isolation: isolate;
  border-radius: 16px;
  padding: 18px 18px 16px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  border: 1px solid rgba(82,148,247,.18);
  box-shadow:
    0 26px 70px rgba(0,0,0,.55),
    0 0 0 1px rgba(15,23,42,.25) inset;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: translate3d(0,0,0);
  transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease, border-color 220ms ease;
}
.lv2-form::after {
  content: "";
  position: absolute;
  inset: -18px -18px -18px -18px;
  border-radius: 22px;
  pointer-events: none;
  opacity: .34;
  filter: blur(22px);
  background: radial-gradient(520px 360px at 50% 45%,
    rgba(82,148,247,.18),
    rgba(34,211,238,.10) 32%,
    rgba(34,197,94,.06) 48%,
    rgba(13,17,23,0) 70%
  );
  z-index: -1;
}
.lv2-form:hover {
  transform: translate3d(0,-2px,0);
  border-color: rgba(34,211,238,.22);
  box-shadow:
    0 32px 84px rgba(0,0,0,.62),
    0 0 0 1px rgba(15,23,42,.25) inset;
}
.lv2-form:active { transform: translate3d(0,-1px,0); }

.lv2-form::marker { content: ''; } /* safety for browsers treating form as list item */

.lv2-form .lv2-scanline {
  position: absolute;
  top: -20%;
  bottom: -20%;
  width: 2px;
  left: 10%;
  opacity: .0;
  pointer-events: none;
  background: linear-gradient(180deg,
    rgba(34,211,238,0),
    rgba(34,211,238,.20),
    rgba(34,197,94,.12),
    rgba(34,211,238,0)
  );
  box-shadow:
    0 0 18px rgba(34,211,238,.10),
    0 0 28px rgba(34,197,94,.06);
  transform: translate3d(-30px,0,0);
  will-change: transform, opacity;
  animation: lv2-card-scan 5.6s ease-in-out infinite;
}
.lv2-form.lv2-card-scan .lv2-scanline { opacity: .38; }

.lv2-form::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(380px 260px at var(--lv2-mx, 40%) var(--lv2-my, 35%),
    rgba(34,211,238,.14),
    rgba(34,197,94,.08) 32%,
    rgba(13,17,23,0) 65%
  );
  transition: opacity 180ms ease;
  mix-blend-mode: screen;
}
.lv2-form.lv2-card-glow::before { opacity: .95; }
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
  position: relative;
}
.lv2-field-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(148,163,184,.7);
  letter-spacing: .02em;
}
.lv2-input {
  width: 100%;
  transition: box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease;
}
.lv2-field:focus-within .lv2-field-label {
  color: rgba(226,232,240,.86);
}
.lv2-field:focus-within .lv2-input {
  transform: translate3d(0,-1px,0);
}
.lv2-field:focus-within .lv2-eye-btn {
  color: rgba(34,211,238,.85);
  transform: translateY(-50%) scale(1.06);
}
.lv2-input:focus {
  box-shadow:
    0 0 0 1px rgba(34,211,238,.28),
    0 0 0 4px rgba(34,211,238,.10),
    0 0 20px rgba(34,197,94,.06);
  border-color: rgba(34,211,238,.24);
}
.lv2-field.is-invalid .lv2-input {
  box-shadow: 0 0 0 1px rgba(248,113,113,.35), 0 0 0 4px rgba(248,113,113,.10);
  border-color: rgba(248,113,113,.35);
}
.lv2-field.is-valid .lv2-input {
  box-shadow: 0 0 0 1px rgba(52,211,153,.26), 0 0 0 4px rgba(52,211,153,.08);
  border-color: rgba(52,211,153,.26);
}
.lv2-form.is-loading .lv2-field::after {
  content: "";
  position: absolute;
  right: 12px;
  top: 32px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(148,163,184,.25);
  border-top-color: rgba(34,211,238,.65);
  opacity: .9;
  transform: translate3d(0,0,0);
  will-change: transform, opacity;
  animation: lv2-spin 900ms linear infinite;
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
  transition: transform 180ms cubic-bezier(.2,.8,.2,1), color 150ms ease, opacity 150ms ease;
}
.lv2-eye-btn:hover {
  color: rgba(148,163,184,.85);
  transform: translateY(-50%) scale(1.06);
}
.lv2-eye-btn:active {
  transform: translateY(-50%) scale(.96);
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
  position: relative;
  overflow: hidden;
  transform: translate3d(0,0,0);
  transition: transform 180ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease;
  will-change: transform;
}
.lv2-submit {
  background-image: linear-gradient(90deg, rgba(82,148,247,.95), rgba(34,211,238,.85), rgba(34,197,94,.72));
  background-size: 180% 100%;
  background-position: 0% 50%;
  transition:
    transform 180ms cubic-bezier(.2,.8,.2,1),
    box-shadow 220ms ease,
    background-position 650ms ease;
}
.lv2-submit::before {
  content: "";
  position: absolute;
  inset: -2px;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(90deg, rgba(34,211,238,0), rgba(34,211,238,.28), rgba(34,197,94,.22), rgba(34,211,238,0));
  transform: translate3d(-60%, 0, 0);
  will-change: transform, opacity;
  transition: opacity 220ms ease;
}
.lv2-submit:hover {
  transform: translate3d(0,-1px,0) scale(1.01);
  box-shadow: 0 10px 30px rgba(0,0,0,.28);
  background-position: 100% 50%;
}
.lv2-submit:hover::before {
  opacity: .85;
  animation: lv2-btn-sheen 2.4s ease-in-out infinite;
}
.lv2-submit:active {
  transform: translate3d(0,0,0) scale(.99);
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
  .lv2-fx-canvas { opacity: .12; }
}

@keyframes lv2-scan-sweep {
  0% { opacity: 0; transform: translate3d(-36%, -10%, 0) rotate(-8deg); }
  12% { opacity: .20; }
  52% { opacity: .18; }
  100% { opacity: 0; transform: translate3d(36%, 12%, 0) rotate(-8deg); }
}

@keyframes lv2-logo-scan {
  0% { transform: translate3d(-140%, 0, 0); opacity: 0; }
  18% { opacity: .85; }
  55% { opacity: .78; }
  100% { transform: translate3d(140%, 0, 0); opacity: 0; }
}
@keyframes lv2-bg-float {
  0% { transform: translate3d(-2%, -1%, 0) scale(1); opacity: .56; }
  50% { transform: translate3d(2%, 1.5%, 0) scale(1.01); opacity: .66; }
  100% { transform: translate3d(-2%, -1%, 0) scale(1); opacity: .56; }
}
@keyframes lv2-spin {
  from { transform: translate3d(0,0,0) rotate(0deg); }
  to { transform: translate3d(0,0,0) rotate(360deg); }
}
@keyframes lv2-btn-sheen {
  0% { transform: translate3d(-65%, 0, 0); }
  60% { transform: translate3d(65%, 0, 0); }
  100% { transform: translate3d(65%, 0, 0); }
}
@keyframes lv2-card-scan {
  0% { opacity: 0; transform: translate3d(-34px,0,0); }
  18% { opacity: .4; }
  58% { opacity: .34; }
  100% { opacity: 0; transform: translate3d(calc(90vw),0,0); }
}
@media (prefers-reduced-motion: reduce) {
  .lv2-left::before,
  .lv2-logo::after,
  .lv2-submit::before { animation: none !important; }
  .lv2-headline,
  .lv2-tagline,
  .lv2-sep,
  .lv2-benefit,
  .lv2-stat,
  .lv2-testimonial,
  .lv2-countries { transition: none !important; opacity: 1 !important; transform: none !important; }
  .lv2-form.is-loading .lv2-field::after { animation: none !important; }
  .lv2-scan { animation: none !important; opacity: 0 !important; }
  .lv2-fx-canvas { display: none !important; }
  .lv2-form { transition: none !important; transform: none !important; }
  .lv2-form .lv2-scanline { animation: none !important; opacity: 0 !important; }
}
`;
  document.head.append(el);
}

const LOGIN_V2_FX_ID = 'qhse-loginv2-fx';

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function isLikelyMobileFx() {
  return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
}

/**
 * Layer FX: canvas particules + scan overlay.
 * @param {HTMLElement} screen
 */
function attachLoginPremiumFx(container) {
  if (!container || !(container instanceof HTMLElement)) return null;
  if (container.querySelector(`[data-${LOGIN_V2_FX_ID}]`)) return null;

  const fx = document.createElement('div');
  fx.className = 'lv2-fx';
  fx.setAttribute(`data-${LOGIN_V2_FX_ID}`, '1');

  const canvas = document.createElement('canvas');
  canvas.className = 'lv2-fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const scan = document.createElement('div');
  scan.className = 'lv2-scan';
  scan.setAttribute('aria-hidden', 'true');

  fx.append(canvas, scan);
  container.prepend(fx);

  if (!prefersReducedMotion()) {
    startLoginParticles(canvas, { simplify: isLikelyMobileFx() });
  }

  return { fx, canvas, scan };
}

/**
 * Scanline verticale subtile sur la card login (effet cockpit IA).
 * @param {HTMLFormElement} form
 */
function attachCardScanline(form) {
  if (!form) return;
  if (prefersReducedMotion()) return;
  const line = document.createElement('div');
  line.className = 'lv2-scanline';
  line.setAttribute('aria-hidden', 'true');
  form.append(line);
  form.classList.add('lv2-card-scan');
}

/**
 * Particules ultra-légères (canvas) + lignes fines.
 * - n’anime que du canvas (rAF), aucun layout.
 * - désactivé si reduced-motion, simplifié sur mobile.
 * @param {HTMLCanvasElement} canvas
 * @param {{ simplify?: boolean }} opts
 */
function startLoginParticles(canvas, opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const simplify = opts.simplify === true;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  /** @type {{ x:number, y:number, vx:number, vy:number, r:number, a:number }[]} */
  let pts = [];
  let w = 0;
  let h = 0;
  let raf = 0;
  let last = performance.now();
  let running = true;

  const mouse = { x: 0.72, y: 0.44, tx: 0.72, ty: 0.44, active: false };

  function pickCount() {
    const base = w >= 1200 ? 30 : w >= 900 ? 26 : w >= 700 ? 22 : 16;
    return simplify ? Math.max(10, Math.round(base * 0.55)) : base;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.floor(rect.width));
    const nh = Math.max(1, Math.floor(rect.height));
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = pickCount();
    pts = Array.from({ length: count }).map(() => {
      // Concentration centre + droite (ambiance data discrète)
      const x = w * (0.42 + Math.random() * 0.56);
      const y = h * (0.14 + Math.random() * 0.72);
      const sp = simplify ? 0.05 : 0.09;
      const vx = (Math.random() - 0.5) * sp;
      const vy = (Math.random() - 0.5) * sp;
      return { x, y, vx, vy, r: 1 + Math.random() * 1.4, a: 0.25 + Math.random() * 0.45 };
    });
  }

  function tick(now) {
    if (!running) return;
    const dt = Math.min(34, now - last);
    last = now;

    resize();

    // inertie souris (0..1 relatif)
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    const mx = mouse.x * w;
    const my = mouse.y * h;

    ctx.clearRect(0, 0, w, h);

    // draw links first
    const linkDist = simplify ? 92 : 120;
    const linkDist2 = linkDist * linkDist;
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > linkDist2) continue;
        const t = 1 - d2 / linkDist2;
        const alpha = 0.06 * t;
        // cyan/blue dominant, green discret
        ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }

    // particles
    for (const p of pts) {
      // subtle mouse repulsion/attraction
      const dx = p.x - mx;
      const dy = p.y - my;
      const d2 = dx * dx + dy * dy;
      if (mouse.active && d2 < 160 * 160) {
        const f = (simplify ? 0.00035 : 0.0005) * (1 - d2 / (160 * 160));
        p.vx += dx * f;
        p.vy += dy * f;
      }

      // drift + soft bounds
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < 0) (p.x = 0), (p.vx *= -0.9);
      if (p.x > w) (p.x = w), (p.vx *= -0.9);
      if (p.y < 0) (p.y = 0), (p.vy *= -0.9);
      if (p.y > h) (p.y = h), (p.vy *= -0.9);

      // mild damping
      p.vx *= 0.995;
      p.vy *= 0.995;

      const a = p.a * (simplify ? 0.9 : 1);
      ctx.fillStyle = `rgba(82,148,247,${0.18 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // subtle glow dot
      ctx.fillStyle = `rgba(34,211,238,${0.08 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(tick);
  }

  function onPointerMove(e) {
    if (simplify) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / Math.max(1, rect.width);
    const y = (e.clientY - rect.top) / Math.max(1, rect.height);
    mouse.tx = Math.max(0, Math.min(1, x));
    mouse.ty = Math.max(0, Math.min(1, y));
    mouse.active = true;
  }

  function onPointerLeave() {
    mouse.active = false;
    mouse.tx = 0.72;
    mouse.ty = 0.44;
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
  }

  function onVisibility() {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    if (!raf && running) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  // init
  resize();
  seed();
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  raf = requestAnimationFrame(tick);

  // cleanup if removed
  const obs = new MutationObserver(() => {
    if (!document.body.contains(canvas)) {
      obs.disconnect();
      stop();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

/**
 * Glow léger suivant la souris sur la card.
 * @param {HTMLFormElement} form
 */
function attachCardMouseGlow(form) {
  if (!form) return;
  if (prefersReducedMotion()) return;
  // pas d'effet sur touch (évite gêne + perf)
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

  function onMove(e) {
    const r = form.getBoundingClientRect();
    const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
    const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
    form.style.setProperty('--lv2-mx', `${Math.max(0, Math.min(100, x))}%`);
    form.style.setProperty('--lv2-my', `${Math.max(0, Math.min(100, y))}%`);
  }
  function onEnter() {
    form.classList.add('lv2-card-glow');
  }
  function onLeave() {
    form.classList.remove('lv2-card-glow');
  }
  form.addEventListener('pointermove', onMove, { passive: true });
  form.addEventListener('pointerenter', onEnter, { passive: true });
  form.addEventListener('pointerleave', onLeave, { passive: true });
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

/** @param {unknown} s */
function escapeHtmlText(s) {
  const el = document.createElement('div');
  el.textContent = String(s ?? '');
  return el.innerHTML;
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
  attachLoginPremiumFx(right);
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
  attachLoginPremiumFx(right);
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
 * Changement obligatoire après mot de passe provisoire (jeton dédié, sans accès métier).
 * @param {{ onSuccess: () => void, onNavigate?: () => void }} params
 */
export function createFirstPasswordChangeView({ onSuccess, onNavigate }) {
  ensureDashboardStyles();
  ensureLoginV2Styles();

  const token = getPasswordSetupToken();
  const screen = document.createElement('div');
  screen.className = 'lv2-screen';
  const left = lv2AuthLeftColumnMini(
    'Sécurisez<br>votre accès',
    'Votre administrateur vous a attribué un mot de passe provisoire. Définissez un mot de passe définitif pour accéder à votre espace.'
  );
  const right = document.createElement('div');
  right.className = 'lv2-right';
  attachLoginPremiumFx(right);
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
      <p class="lv2-form-title">Session expirée</p>
      <p class="lv2-form-sub">Reconnectez-vous avec votre mot de passe provisoire pour recommencer.</p>
      <button type="button" class="btn btn-primary lv2-submit lv2-back-login-pwd">Retour à la connexion</button>
    `;
    inner.querySelector('.lv2-back-login-pwd')?.addEventListener('click', () => {
      clearPasswordSetupContext();
      window.location.hash = 'login';
      onNavigate?.();
    });
    right.append(inner);
    screen.append(left, right);
    return screen;
  }

  const meta = getPasswordSetupMeta() || {};
  const who =
    typeof meta.name === 'string' && meta.name
      ? meta.name
      : typeof meta.email === 'string'
        ? meta.email
        : 'votre compte';
  const whoSafe = escapeHtmlText(who);
  const tenantName =
    typeof meta.tenantName === 'string' && meta.tenantName ? escapeHtmlText(meta.tenantName) : '';
  const orgLine = tenantName
    ? `<br>Organisation : <strong>${tenantName}</strong>`
    : '';

  inner.innerHTML = `
    <div class="lv2-mobile-brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(82,148,247,.9)" stroke-width="1.75" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>QHSE Control</span>
    </div>
    <form class="lv2-form lv2-first-pwd-form" novalidate>
      <p class="lv2-form-title">Nouveau mot de passe</p>
      <p class="lv2-form-sub">Compte : <strong>${whoSafe}</strong>${orgLine}<br>
        Règles : au moins 10 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.</p>
      <label class="lv2-field">
        <span class="lv2-field-label">Mot de passe</span>
        <div class="lv2-password-wrap">
          <input type="password" name="password" class="control-input lv2-input lv2-first-pwd" autocomplete="new-password" />
          <button type="button" class="lv2-eye-btn" aria-label="Afficher le mot de passe">${EYE_OPEN_SVG}</button>
        </div>
      </label>
      <label class="lv2-field">
        <span class="lv2-field-label">Confirmation</span>
        <input type="password" name="password2" class="control-input lv2-input lv2-first-pwd2" autocomplete="new-password" />
      </label>
      <button type="submit" class="btn btn-primary lv2-submit">Valider et accéder à l’application</button>
      <button type="button" class="lv2-demo-link lv2-first-pwd-cancel">Annuler</button>
    </form>
  `;

  const form = inner.querySelector('.lv2-first-pwd-form');
  const passEl = inner.querySelector('.lv2-first-pwd');
  const pass2El = inner.querySelector('.lv2-first-pwd2');
  const eyeBtn = inner.querySelector('.lv2-eye-btn');
  const cancelBtn = inner.querySelector('.lv2-first-pwd-cancel');
  const submitBtn = form?.querySelector('.lv2-submit');

  cancelBtn?.addEventListener('click', () => {
    clearPasswordSetupContext();
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
    const newPassword = passEl?.value || '';
    const confirm = pass2El?.value || '';
    if (!newPassword || newPassword !== confirm) {
      showToast('Les mots de passe ne correspondent pas ou sont vides', 'error');
      return;
    }
    const prev = submitBtn?.textContent || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enregistrement…';
    }
    try {
      const res = await fetch(`${getApiBase()}/api/auth/change-temporary-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changePasswordToken: token,
          newPassword,
          confirmPassword: confirm
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body.error === 'string' ? body.error : 'Impossible de mettre à jour le mot de passe.';
        showToast(msg, 'error');
        return;
      }
      if (!body.token || !body.user?.id) {
        showToast('Réponse serveur invalide', 'error');
        return;
      }
      setDemoMode(false);
      clearPasswordSetupContext();
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
      showToast('Mot de passe enregistré. Bienvenue !', 'success');
      setCurrentPage('dashboard');
      window.location.hash = 'dashboard';
      onSuccess();
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
    <h1 class="lv2-headline">Incidents, risques, ISO et plans d’actions.<br>Même outil, périmètre par site.</h1>
    <p class="lv2-tagline">
      Registre unique : événements terrain, exigences, actions correctives et pièces justificatives rattachées au site.
    </p>
      <div class="lv2-sep" aria-hidden="true"></div>

      <div class="lv2-benefits">
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Déclaration incident guidée en <strong>moins de deux minutes</strong>, saisie possible sans réseau</span>
      </div>
      <div class="lv2-benefit">
        <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Référentiels <strong>45001, 14001 et 9001</strong> : exigences, preuves et campagnes d’audit</span>
        </div>
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Exports PDF et <strong>rappels</strong> par e-mail sur les échéances suivies</span>
        </div>
        <div class="lv2-benefit">
          <span style="flex-shrink:0;margin-top:2px">${CHECK_SVG}</span>
        <span>Extraction des champs clés des <strong>FDS</strong> pour préparer le registre produits (relecture obligatoire)</span>
      </div>
    </div>

    <div class="lv2-stats-row">
      <div class="lv2-stat">
        <span class="lv2-stat-num" data-count="5" data-suffix="+">0+</span>
        <span class="lv2-stat-label">Pays couverts</span>
      </div>
      <div class="lv2-stat">
        <span class="lv2-stat-num" data-count="12" data-suffix="+">0+</span>
        <span class="lv2-stat-label">Modules QHSE couverts</span>
        </div>
      <div class="lv2-stat">
        <span class="lv2-stat-num" data-text="FDS">FDS</span>
        <span class="lv2-stat-label">Lecture assistée</span>
      </div>
    </div>

    <div class="lv2-testimonial">
      <p class="lv2-testimonial-text">
        « Moins de ressaisie : incidents, actions et extraits PDF partent d’une seule base. Les revues mensuelles sont plus rapides. »
      </p>
      <p class="lv2-testimonial-author">Responsable QHSE, industrie extractive, Sénégal</p>
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

  <p class="lv2-gdpr">Contrôle d’accès, journal des connexions, données isolées par organisation</p>
  `;

  const leftMain = left.querySelector('.lv2-left-main');
  if (leftMain) {
    leftMain.style.cssText =
      'flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0;width:100%;max-width:100%';
  }

  const right = document.createElement('div');
  right.className = 'lv2-right';
  attachLoginPremiumFx(right);

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
      <p class="lv2-form-sub">Connexion chiffrée (TLS). Après authentification, sélection de l’organisation si plusieurs accès.</p>
      <label class="lv2-field">
        <span class="lv2-field-label">E-mail ou identifiant client</span>
        <input type="text" name="identifier" class="control-input lv2-input lv2-email" autocomplete="username" placeholder="vous@entreprise.com ou cli-…" />
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
        Connexion chiffrée (HTTPS). Session protégée.
      </p>
      <div class="lv2-org-panel" style="display:none;margin-top:16px;padding:12px;border-radius:10px;background:rgba(15,23,42,.06);border:1px solid rgba(15,23,42,.1)">
        <label class="lv2-field">
          <span class="lv2-field-label">Organisation</span>
          <select class="control-input lv2-input lv2-org-select" required></select>
        </label>
        <button type="button" class="btn btn-primary lv2-org-continue" style="margin-top:12px;width:100%">Continuer</button>
      </div>
    </form>
  `;

  const form = inner.querySelector('.lv2-form');
  if (form) attachCardMouseGlow(form);
  if (form) attachCardScanline(form);
  const emailEl = inner.querySelector('.lv2-email');
  const passEl = inner.querySelector('.lv2-password');
  const submitBtn = inner.querySelector('.lv2-submit');
  const forgotBtn = inner.querySelector('.lv2-forgot-btn');
  const lv2EyeBtn = inner.querySelector('.lv2-eye-btn');
  const orgPanel = inner.querySelector('.lv2-org-panel');
  const orgSelect = inner.querySelector('.lv2-org-select');
  const orgContinue = inner.querySelector('.lv2-org-continue');

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** @param {Element | null} fieldEl */
  function setFieldState(fieldEl, state) {
    if (!(fieldEl instanceof HTMLElement)) return;
    fieldEl.classList.toggle('is-invalid', state === 'invalid');
    fieldEl.classList.toggle('is-valid', state === 'valid');
  }

  /** @param {Element | null} fieldEl */
  function validateRequired(fieldEl, raw) {
    const v = String(raw || '').trim();
    setFieldState(fieldEl, v ? 'valid' : 'invalid');
    return !!v;
  }

  function initImmediateFeedback() {
    const emailField = emailEl?.closest?.('.lv2-field') || null;
    const passField = passEl?.closest?.('.lv2-field') || null;

    emailEl?.addEventListener?.('blur', () => validateRequired(emailField, emailEl.value));
    passEl?.addEventListener?.('blur', () => validateRequired(passField, passEl.value));

    emailEl?.addEventListener?.('input', () => {
      if (emailField instanceof HTMLElement && emailField.classList.contains('is-invalid')) {
        validateRequired(emailField, emailEl.value);
      }
    });
    passEl?.addEventListener?.('input', () => {
      if (passField instanceof HTMLElement && passField.classList.contains('is-invalid')) {
        validateRequired(passField, passEl.value);
      }
    });
  }

  function initStaggerEntrance() {
    if (reduceMotion) {
      screen.classList.add('lv2-ready');
      return;
    }
    const nodes = [
      left.querySelector('.lv2-headline'),
      left.querySelector('.lv2-tagline'),
      left.querySelector('.lv2-sep'),
      ...Array.from(left.querySelectorAll('.lv2-benefit')),
      ...Array.from(left.querySelectorAll('.lv2-stat')),
      left.querySelector('.lv2-testimonial'),
      left.querySelector('.lv2-countries')
    ].filter(Boolean);

    nodes.forEach((n, i) => {
      if (!(n instanceof HTMLElement)) return;
      n.style.transitionDelay = `${120 + i * 55}ms`;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => screen.classList.add('lv2-ready'));
    });
  }

  function animateKpis() {
    if (reduceMotion) return;
    const els = Array.from(left.querySelectorAll('.lv2-stat-num'));
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      const fixedText = el.getAttribute('data-text');
      if (fixedText) {
        el.textContent = fixedText;
        continue;
      }
      const target = Number(el.getAttribute('data-count') || '0');
      const suffix = el.getAttribute('data-suffix') || '';
      if (!Number.isFinite(target) || target <= 0) continue;

      const duration = 900 + Math.min(700, target * 6);
      const start = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const v = Math.round(target * easeOut(p));
        el.textContent = `${v}${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = `0${suffix}`;
      requestAnimationFrame(tick);
    }
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
      opt.textContent = typeof t.name === 'string' && t.name ? t.name : slug;
      orgSelect.appendChild(opt);
    }
    if (!orgSelect.options.length) return;
    orgPanel.style.display = 'block';
  }

  async function submitLogin(tenantSlug) {
    const identifier = String(emailEl?.value || '').trim();
    const password = passEl?.value || '';
    if (!identifier || !password) {
      showToast('Saisissez votre identifiant et le mot de passe', 'error');
      validateRequired(emailEl?.closest?.('.lv2-field') || null, identifier);
      validateRequired(passEl?.closest?.('.lv2-field') || null, password);
      return;
    }
    const prevLabel = submitBtn?.textContent || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion…';
    }
    form?.classList?.add('is-loading');
    if (emailEl) emailEl.disabled = true;
    if (passEl) passEl.disabled = true;
    hideOrgPanel();
    try {
      const payload = { identifier, password };
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
      if (body.mustChangePassword === true && body.changePasswordToken) {
        setDemoMode(false);
        setPasswordSetupContext(body.changePasswordToken, {
          name: body.user?.name,
          email: body.user?.email,
          tenantName: body.tenant?.name
        });
        showToast('Première connexion : définissez un mot de passe définitif.', 'success');
        window.location.hash = 'first-password';
        onNavigate?.();
        return;
      }
      if (!body.token || !body.user?.id) {
        showToast('Réponse serveur invalide', 'error');
        return;
      }
      setDemoMode(false);
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
      form?.classList?.remove('is-loading');
      if (emailEl) emailEl.disabled = false;
      if (passEl) passEl.disabled = false;
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
      if (!reduceMotion && eyeHost instanceof HTMLElement) {
        eyeHost.style.transform = 'translateY(-50%) scale(1.06)';
        window.setTimeout(() => {
          eyeHost.style.transform = '';
        }, 160);
      }
    });
  }

  forgotBtn?.addEventListener('click', () => {
    window.location.hash = 'forgot-password';
    onNavigate?.();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitLogin('');
  });

  initStaggerEntrance();
  initImmediateFeedback();
  animateKpis();

  if (import.meta.env.DEV) {
    const devHint = document.createElement('p');
    devHint.className = 'lv2-dev-hint';
    devHint.style.cssText =
      'margin:18px 0 0;font-size:11px;color:rgba(148,163,184,.5);line-height:1.5';
    devHint.innerHTML =
      'Développement local : après <code style="font-size:10px;opacity:.95">npx prisma db seed</code> : comptes de test (voir <code style="font-size:10px">backend/prisma/seed.js</code>), ex. <code style="font-size:10px">qhse@qhse.local</code> / <code style="font-size:10px">Demo2026!</code>.';
    inner.appendChild(devHint);
  }

  right.append(inner);
  screen.append(left, right);
  return screen;
}
