// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * E2E : démarrez `npm run dev` (API + Vite) ou définissez E2E_SKIP_WEBSERVER=1 si déjà lancé.
 * Comptes seed : voir backend/prisma/seed.js (ex. admin@qhse.local / Demo2026!).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';

const skipWebServer = Boolean(process.env.E2E_SKIP_WEBSERVER);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: skipWebServer
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000
      }
});
