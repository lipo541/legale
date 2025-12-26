import { test, expect } from '@playwright/test';

const LOCALE = process.env.E2E_LOCALE ?? 'ka';
const LOADING_RE = /loading\.{0,3}|იტვირთება\.{0,3}/i;

const publicRoutes = [
  `/${LOCALE}`, // home
  `/${LOCALE}/practices`,
  `/${LOCALE}/specialists`,
  `/${LOCALE}/companies`,
  `/${LOCALE}/news`,
  `/${LOCALE}/news/archive`,
  `/${LOCALE}/contact`,
  `/${LOCALE}/privacy`,
  `/${LOCALE}/terms`,
  `/${LOCALE}/cookies`,
];

test.describe('Public routes should render without hanging loaders', () => {
  for (const route of publicRoutes) {
    test(`GET ${route}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      const status = response?.status();
      if (!status) {
        throw new Error(`No response received for ${route}. Is the server running?`);
      }
      if (status >= 500) {
        const body = await page.content().catch(() => '');
        throw new Error(
          `Server error ${status} for ${route}. ` +
            `This often means missing env vars (e.g. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). ` +
            `Page content preview: ${body.slice(0, 200)}`
        );
      }
      expect(status, `Unexpected HTTP status for ${route}`).toBeLessThan(400);

      // Basic sanity: app chrome exists
      await expect(page.locator('main')).toBeVisible();

      // Some pages render multiple <main> tags (e.g. skip-link wrapper). Prefer the focused one.
      const main = (await page.locator('#main-content').count())
        ? page.locator('#main-content')
        : page.locator('main').first();

      // Avoid getting stuck on any generic loader wording.
      // Exception: /news can legitimately show an infinite-scroll loader while still rendering posts.
      if (route === `/${LOCALE}/news`) {
        await expect(page.locator(`a[href^="/${LOCALE}/news/"]`).first()).toBeVisible();
      } else {
        await expect(main).not.toContainText(LOADING_RE);
      }

      // Fail if we see obvious runtime errors
      expect(
        consoleErrors.filter((e) => !e.includes('Failed to load resource')),
        `Console errors:\n${consoleErrors.join('\n')}`
      ).toEqual([]);
    });
  }
});
