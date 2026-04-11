// @ts-check
/**
 * Parcours démo client — aligné sur le seed Prisma (backend/prisma/seed.js).
 * Site mine : id stable KATIOLA_MINE_YAKRO (seed Prisma / même périmètre).
 */
import { test, expect } from '@playwright/test';

const DEMO_EMAIL = process.env.QHSE_E2E_EMAIL || 'admin@qhse.local';
const DEMO_PASSWORD = process.env.QHSE_E2E_PASSWORD || 'Demo2026!';
/** Id Prisma du site « extraction » (seed) — surcharger avec QHSE_E2E_SITE_ID si besoin */
const SITE_MINE_ID = process.env.QHSE_E2E_SITE_ID || 'KATIOLA_MINE_YAKRO';

const INCIDENT_DESC =
  'Chute opérateur plateforme forage Katiola';

async function loginAdmin(page) {
  await page.goto('/#login');
  await expect(page.locator('.lv2-form')).toBeVisible({ timeout: 60_000 });
  await page.locator('.lv2-email').fill(DEMO_EMAIL);
  await page.locator('.lv2-password').fill(DEMO_PASSWORD);
  await page.locator('.lv2-submit').click();
  await expect(page.locator('.app-shell')).toBeVisible({ timeout: 60_000 });
  await page.waitForLoadState('networkidle');
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} kpiKey
 */
async function expectKpiNumericNonNegative(page, kpiKey) {
  const card = page.locator(`[data-kpi-key="${kpiKey}"]`);
  await expect(card).toBeVisible({ timeout: 45_000 });
  const valueEl = card.locator('.metric-value').first();
  const raw = (await valueEl.innerText()).trim();
  expect(raw.toLowerCase(), `KPI ${kpiKey} : pas de libellé d’erreur`).not.toMatch(
    /erreur|indisponible|échec|failed/i
  );
  if (raw === '—') return;
  const n = Number.parseInt(raw.replace(/\D/g, ''), 10);
  expect(Number.isFinite(n), `KPI ${kpiKey} : nombre attendu, reçu « ${raw} »`).toBeTruthy();
  expect(n, `KPI ${kpiKey}`).toBeGreaterThanOrEqual(0);
}

test.describe('Parcours démo client', () => {
  test.beforeEach(async ({ page, request }) => {
    const apiBase = process.env.E2E_API_BASE || 'http://127.0.0.1:3001';
    const health = await request.get(`${apiBase}/api/health`).catch(() => null);
    test.skip(!health?.ok(), 'API absente — lancez `npm run dev` (API + Vite).');
    await loginAdmin(page);
  });

  test('Dashboard mine filtré', async ({ page }) => {
    await page.goto('/#dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.dashboard-page')).toBeVisible({ timeout: 60_000 });

    const siteSelect = page.getByLabel('Choisir le site ou la vue groupe');
    await expect(siteSelect).toBeVisible({ timeout: 15_000 });
    const optCount = await siteSelect.locator('option').count();
    if (optCount > 1) {
      const firstSiteVal = await siteSelect.locator('option').nth(1).getAttribute('value');
      expect(firstSiteVal).toBeTruthy();
      await siteSelect.selectOption(firstSiteVal);
    } else {
      await siteSelect.selectOption(SITE_MINE_ID);
    }

    await expect(page.locator('.app-shell')).toBeVisible();

    await expectKpiNumericNonNegative(page, 'incidents');
    await expectKpiNumericNonNegative(page, 'actionsLate');

    const risksOps = page.locator('.dashboard-ops-card').filter({ hasText: /Risques/i }).first();
    await expect(risksOps).toBeVisible({ timeout: 45_000 });
    const risksVal = risksOps.locator('.dashboard-ops-card__v').first();
    const risksTxt = (await risksVal.innerText()).trim();
    expect(risksTxt.toLowerCase()).not.toMatch(/erreur|indisponible|échec|failed/i);
    const risksN = Number.parseInt(risksTxt.replace(/\D/g, ''), 10);
    if (Number.isFinite(risksN)) {
      expect(risksN).toBeGreaterThanOrEqual(0);
    }

    await expect(page.locator('.app-toast--error')).toHaveCount(0);
  });

  test('Cycle incident complet', async ({ page }) => {
    await page.goto('/#dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.dashboard-page')).toBeVisible({ timeout: 60_000 });

    await page.locator('a.sidebar-v2__item').filter({ hasText: 'Incidents' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.incidents-page--premium')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: /Incidents terrain/i })).toBeVisible();

    const declareBtn = page.getByRole('button', { name: /Déclarer|Nouvel/i });
    await declareBtn.click();
    await expect(page.getByRole('dialog', { name: /Déclarer un incident/i })).toBeVisible({
      timeout: 15_000
    });

    await page.getByRole('button', { name: /^Accident$/i }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    const graveBtn = page.getByRole('button', { name: /^Grave$/i });
    const critiqueBtn = page.getByRole('button', { name: /^Critique$/i });
    if (await graveBtn.isVisible().catch(() => false)) {
      await graveBtn.click();
    } else {
      await critiqueBtn.click();
    }
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.locator('textarea.incidents-field-desc').fill(INCIDENT_DESC);
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.getByRole('button', { name: 'Continuer' }).click();

    const siteSel = page.locator('select.incident-field-site');
    await expect(siteSel).toBeVisible();
    const mineOpt = page.locator(`select.incident-field-site option[data-site-id="${SITE_MINE_ID}"]`).first();
    await expect(mineOpt).toBeAttached({ timeout: 20_000 });
    const siteValue = await mineOpt.getAttribute('value');
    expect(siteValue).toBeTruthy();
    await siteSel.selectOption(siteValue);

    await page.getByRole('button', { name: 'Enregistrer l’incident' }).click();

    await expect(page.getByRole('dialog', { name: /Déclarer un incident/i })).toBeHidden({
      timeout: 25_000
    });

    const row = page
      .locator('.incidents-table-row')
      .filter({ hasText: /Katiola|plateforme forage|Chute opérateur/i })
      .first();
    await expect(row).toBeVisible({ timeout: 30_000 });

    await row.click();
    await expect(page.locator('.incidents-detail-filled')).toBeVisible({ timeout: 20_000 });

    const iaHint = page.getByRole('button', { name: /Analyser|Suggestion|IA/i });
    await expect(iaHint.first()).toBeVisible({ timeout: 20_000 });
  });

  test('Export rapport PDF', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/#audits');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.audit-premium-page')).toBeVisible({ timeout: 60_000 });

    await expect(page.locator('.audit-premium-header__score-val')).toBeVisible({ timeout: 30_000 });

    const auditRow = page.locator('a, button, [role="button"], .list-row, tr').filter({ hasText: /AUD-|audit/i }).first();
    if (await auditRow.isVisible().catch(() => false)) {
      await auditRow.click();
      await page.waitForLoadState('networkidle');
    }

    const pdfBtn = page.getByRole('button', { name: 'Rapport PDF' });
    await expect(pdfBtn).toBeVisible({ timeout: 20_000 });

    const popupPromise = page.waitForEvent('popup', { timeout: 20_000 });
    await pdfBtn.click();
    const popup = await popupPromise;
    const u = popup.url();
    expect(
      /blob:|about:/i.test(u),
      `Ouverture d’un onglet pour le PDF attendue (blob: ou about:), URL : ${u}`
    ).toBeTruthy();
    await popup.close().catch(() => {});
  });
});
