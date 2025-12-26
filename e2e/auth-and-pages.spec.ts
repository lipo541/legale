import { test, expect } from '@playwright/test';

const LOCALE = process.env.E2E_LOCALE ?? 'ka';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function hasCreds(): boolean {
  return !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;
}

const LOADING_RE = /loading\.{0,3}|იტვირთება\.{0,3}/i;

test.describe('Auth/session stability', () => {
  test('login persists and client pages load', async ({ page, context, baseURL }) => {
    test.skip(!hasCreds(), 'Set E2E_EMAIL and E2E_PASSWORD to run login test');

    const email = requireEnv('E2E_EMAIL');
    const password = requireEnv('E2E_PASSWORD');

    const authRefreshResponses: Array<{ url: string; status: number }> = [];
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/auth/refresh')) {
        authRefreshResponses.push({ url, status: response.status() });
      }
    });

    await page.goto(`/${LOCALE}/login`, { waitUntil: 'networkidle' });

    // Wait for form to be ready
    await page.waitForSelector('#email', { state: 'visible' });
    await page.waitForSelector('#password', { state: 'visible' });

    // Fill credentials using ID selectors
    await page.locator('#email').click();
    await page.locator('#email').fill(email);
    
    await page.locator('#password').click();
    await page.locator('#password').fill(password);

    // Verify inputs are filled
    const emailVal = await page.locator('#email').inputValue();
    const passVal = await page.locator('#password').inputValue();
    console.log('Email filled:', emailVal.length > 0 ? '[OK]' : '[EMPTY]');
    console.log('Password filled:', passVal.length > 0 ? '[OK]' : '[EMPTY]');

    // Click login and wait for navigation
    await page.getByRole('button', { name: 'შესვლა', exact: true }).click();
    
    // Wait a bit for any error to appear or redirect to happen
    await page.waitForTimeout(3000);
    
    // Check for error message on page
    const errorText = await page.locator('text=/შესვლა ვერ მოხერხდა|Invalid|missing email|არასწორი/i').count();
    if (errorText > 0) {
      const errContent = await page.content();
      console.log('Login error detected on page');
      // Extract error div content
      const errorDiv = await page.locator('[class*="red"]').first().textContent().catch(() => 'no error div');
      console.log('Error message:', errorDiv);
    }

    // Should redirect away from login page
    await expect(page).not.toHaveURL(new RegExp(`/${LOCALE}/login`), { timeout: 20000 });

    // Basic cookie presence check (names vary by Supabase project; keep it generic)
    const cookies = await context.cookies(baseURL ?? undefined);
    const hasSupabaseCookie = cookies.some((c) => c.name.startsWith('sb-') || c.name.includes('supabase'));
    expect(hasSupabaseCookie).toBeTruthy();

    // Header shouldn't get stuck in Loading state
    await expect(page.locator('header')).not.toContainText(LOADING_RE);

    // Client-side pages that currently break in prod
    await page.goto(`/${LOCALE}/companies`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).not.toContainText(LOADING_RE);

    await page.goto(`/${LOCALE}/news`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).not.toContainText(LOADING_RE);

    // Tab switch scenario: new tab should not kill the session
    const page2 = await context.newPage();
    await page2.goto(`/${LOCALE}`, { waitUntil: 'domcontentloaded' });
    await page.bringToFront();

    const cookiesAfter = await context.cookies(baseURL ?? undefined);
    const stillHasSupabaseCookie = cookiesAfter.some((c) => c.name.startsWith('sb-') || c.name.includes('supabase'));
    expect(stillHasSupabaseCookie).toBeTruthy();

    // If refresh endpoint was called, it must not be returning 401/403
    const badRefresh = authRefreshResponses.find((r) => r.status === 401 || r.status === 403);
    expect(badRefresh).toBeFalsy();
  });
});
