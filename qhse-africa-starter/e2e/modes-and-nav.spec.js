// @ts-check
/**
 * Parcours démo : mode global Essentiel / Expert et navigation hash complémentaire.
 */
import { test, expect } from '@playwright/test';

const DEMO_EMAIL = process.env.QHSE_E2E_EMAIL || 'admin@qhse.local';
const DEMO_PASSWORD = process.env.QHSE_E2E_PASSWORD || 'Demo2026!';
const API_BASE = process.env.E2E_API_BASE || 'http://127.0.0.1:3001';

async function prepareLoggedInSession(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('qhse_onboarding_done_v1', '1');
    } catch {
      /* ignore */
    }
  });
}

async function dismissOnboardingOverlay(page) {
  await page.evaluate(() => {
    document.getElementById('onboarding-overlay')?.remove();
    document.querySelector('.qhse-onboarding-wizard')?.remove();
  });
}

test.describe('Modes et navigation', () => {
  test('navigation lazy vers Audits', async ({ page }) => {
    await page.goto('/#audits');
    await expect(page.locator('.audit-premium-page')).toBeVisible({ timeout: 45_000 });
  });

  test('connexion puis accès Paramètres par hash', async ({ page, request }) => {
    const health = await request.get(`${API_BASE}/api/health`).catch(() => null);
    test.skip(!health?.ok(), 'API absente — lancez `npm run dev` (API + Vite).');

    await prepareLoggedInSession(page);
    await page.goto('/#login');
    await expect(page.locator('.lv2-form')).toBeVisible({ timeout: 30_000 });
    await page.locator('.lv2-email').fill(DEMO_EMAIL);
    await page.locator('.lv2-password').fill(DEMO_PASSWORD);
    await page.locator('.lv2-submit').click();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 30_000 });
    await dismissOnboardingOverlay(page);

    await page.goto('/#settings');
    await expect(page.locator('.settings-page')).toBeVisible({ timeout: 45_000 });
  });

  test('bascule Essentiel ↔ Expert (bureau)', async ({ page, request }) => {
    const health = await request.get(`${API_BASE}/api/health`).catch(() => null);
    test.skip(!health?.ok(), 'API absente — lancez `npm run dev` (API + Vite).');

    await page.setViewportSize({ width: 1280, height: 800 });
    await prepareLoggedInSession(page);
    await page.goto('/#login');
    await expect(page.locator('.lv2-form')).toBeVisible({ timeout: 30_000 });
    await page.locator('.lv2-email').fill(DEMO_EMAIL);
    await page.locator('.lv2-password').fill(DEMO_PASSWORD);
    await page.locator('.lv2-submit').click();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 30_000 });
    await dismissOnboardingOverlay(page);

    const modeSwitch = page.locator('.display-mode-switch');
    await expect(modeSwitch).toBeVisible({ timeout: 15_000 });

    await modeSwitch.locator('[data-set-mode="terrain"]').click();
    await expect(page).toHaveURL(/#terrain-mode/, { timeout: 15_000 });
    await expect(page.locator('.terrain-mode-page')).toBeVisible();

    await modeSwitch.locator('[data-set-mode="expert"]').click();
    await expect(page).toHaveURL(/#dashboard/, { timeout: 15_000 });
  });
});
