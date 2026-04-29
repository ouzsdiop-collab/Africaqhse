// @ts-check
import { test, expect } from '@playwright/test';

const DEMO_EMAIL = process.env.QHSE_E2E_EMAIL || 'admin@qhse.local';
const DEMO_PASSWORD = process.env.QHSE_E2E_PASSWORD || 'Demo2026!';

test.describe('Smoke QHSE', () => {
  test('la coque application se monte', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 60_000 });
  });

  test('navigation lazy vers Incidents', async ({ page }) => {
    await page.goto('/#incidents');
    await expect(page.locator('.incidents-page--premium')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole('heading', { name: 'Incidents terrain' })).toBeVisible();
  });

  test('écran login : pas de CTA démo mines ; accès direct #mines-demo toujours disponible', async ({ page }) => {
    await page.goto('/#login');
    await expect(page.locator('.lv2-form')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.lv2-form-title')).toHaveText(/Connexion à votre espace/);
    await expect(
      page.getByRole('button', { name: /Essayer la démonstration terrain/i })
    ).toHaveCount(0);

    await page.goto('/#mines-demo');
    await expect(page.locator('.mines-demo-page')).toBeVisible({ timeout: 30_000 });
  });

  test('connexion JWT puis tableau de bord', async ({ page, request }) => {
    const apiBase = process.env.E2E_API_BASE || 'http://127.0.0.1:3001';
    const health = await request.get(`${apiBase}/api/health`).catch(() => null);
    test.skip(!health?.ok(), 'API absente — lancez `npm run dev` (API + Vite) pour ce scénario');

    await page.goto('/#login');
    await expect(page.locator('.lv2-form')).toBeVisible({ timeout: 30_000 });
    await page.locator('.lv2-email').fill(DEMO_EMAIL);
    await page.locator('.lv2-password').fill(DEMO_PASSWORD);
    await page.locator('.lv2-submit').click();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/#dashboard/);
  });

  test('API readiness (base SQL)', async ({ request }) => {
    const apiBase = process.env.E2E_API_BASE || 'http://127.0.0.1:3001';
    const res = await request.get(`${apiBase}/api/health/ready`).catch(() => null);
    test.skip(!res, 'API absente');
    expect([200, 503]).toContain(res.status());
  });

  test('navigation lazy vers Risques', async ({ page }) => {
    await page.goto('/#risks');
    await expect(page.locator('.risks-page--premium')).toBeVisible({ timeout: 45_000 });
    await expect(
      page.getByRole('heading', { name: /Registre des risques opérationnels/i })
    ).toBeVisible();
  });
});
