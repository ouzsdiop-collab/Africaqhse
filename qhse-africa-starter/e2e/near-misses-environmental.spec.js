// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Couvre les pages presque-accidents / environnement pour le rôle QHSE — zone non
 * couverte par smoke.spec.js et où une dérive de la matrice de permissions UI
 * (front) par rapport au backend, ou un mauvais format de réponse API, bloque
 * silencieusement la page sans faire échouer les tests unitaires.
 */
const QHSE_EMAIL = process.env.QHSE_E2E_EMAIL || 'qhse@qhse.local';
const QHSE_PASSWORD = process.env.QHSE_E2E_PASSWORD || 'Demo2026!';

async function loginAsQhse(page, request) {
  const apiBase = process.env.E2E_API_BASE || 'http://127.0.0.1:3001';
  const health = await request.get(`${apiBase}/api/health`).catch(() => null);
  test.skip(!health?.ok(), 'API absente — lancez `npm run dev` (API + Vite) pour ce scénario');

  await page.goto('/#login');
  await expect(page.locator('.lv2-form')).toBeVisible({ timeout: 30_000 });
  await page.locator('.lv2-email').fill(QHSE_EMAIL);
  await page.locator('.lv2-password').fill(QHSE_PASSWORD);
  await page.locator('.lv2-submit').click();
  await expect(page.locator('.app-shell')).toBeVisible({ timeout: 30_000 });
}

test.describe('Presque-accidents et environnement (rôle QHSE)', () => {
  test('le rôle QHSE a accès en lecture/écriture aux presque-accidents', async ({ page, request }) => {
    await loginAsQhse(page, request);
    await page.goto('/#near-misses');
    await expect(page.locator('#near-misses-page-anchor')).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText('non autorisée')).toHaveCount(0);
    await expect(page.getByText('Pareto par catégorie')).toBeVisible();
    await expect(page.locator('.nm-btn-create')).toBeEnabled();
  });

  test('le rôle QHSE peut lier une action depuis un presque-accident existant', async ({ page, request }) => {
    await loginAsQhse(page, request);
    await page.goto('/#near-misses');
    await expect(page.locator('#near-misses-page-anchor')).toBeVisible({ timeout: 30_000 });

    const linkButton = page.getByRole('button', { name: 'Créer une action liée' });
    await expect(linkButton.first()).toBeVisible({ timeout: 15_000 });
  });

  test('le rôle QHSE a accès à la page environnement avec tendance vs période précédente', async ({ page, request }) => {
    await loginAsQhse(page, request);
    await page.goto('/#environmental');
    await expect(page.locator('body')).not.toContainText('non autorisé', { timeout: 30_000 });

    await expect(
      page.getByText(/vs 30 j précédents|Nouveau sur 30 j/).first()
    ).toBeVisible({ timeout: 20_000 });
  });
});
