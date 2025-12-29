import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load env for E2E runs (local-only; .env* is gitignored)
const envFile = process.env.E2E_ENV_FILE ?? '.env.e2e.local';
dotenv.config({ path: envFile });

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

// Helpful when diagnosing "Playwright saw 500 but browser saw 200".
// This prints once at test startup and makes it obvious which server Playwright is targeting.
// eslint-disable-next-line no-console
console.log(`[playwright] envFile=${envFile} baseURL=${baseURL} locale=${process.env.E2E_LOCALE ?? 'ka'}`);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
