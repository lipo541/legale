import { test, expect } from '@playwright/test';

const LOCALE = process.env.E2E_LOCALE ?? 'ka';

function hasCreds(): boolean {
  return !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * Detects the specific failure mode we saw on iOS/macOS Safari:
 * repeated refresh-token requests to Supabase: /auth/v1/token?grant_type=refresh_token
 * leading to 429 and/or infinite loops.
 */
test.describe('Auth: refresh-token loop smoke', () => {
  test('does not spam refresh_token requests (login + tab switch)', async ({ page, context, baseURL }) => {
    test.skip(!hasCreds(), 'Set E2E_EMAIL and E2E_PASSWORD to run refresh-loop test');

    const email = requireEnv('E2E_EMAIL');
    const password = requireEnv('E2E_PASSWORD');

    const refreshTokenRequests: Array<{ url: string; method: string; at: number }> = [];
    const refreshTokenResponses: Array<{ url: string; status: number; at: number }> = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/auth/v1/token') && url.includes('grant_type=refresh_token')) {
        refreshTokenRequests.push({ url, method: req.method(), at: Date.now() });
      }
    });

    page.on('response', (res) => {
      const url = res.url();
      if (url.includes('/auth/v1/token') && url.includes('grant_type=refresh_token')) {
        const status = res.status();
        refreshTokenResponses.push({ url, status, at: Date.now() });
        console.log(`[e2e][refresh_token] status=${status} url=${url}`);
      }
    });

    // 1) Login
    console.log(`[e2e] baseURL=${baseURL ?? 'n/a'} login=/${LOCALE}/login`);
    await page.goto(`/${LOCALE}/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#email', { state: 'visible' });

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'შესვლა', exact: true }).click();

    // Let client auth settle.
    await page.waitForTimeout(5000);

    // 2) Tab switch / second page navigation
    const page2 = await context.newPage();
    await page2.goto(`/${LOCALE}`, { waitUntil: 'domcontentloaded' });
    await page2.waitForTimeout(2000);

    // Bring original back; force a lightweight reload to simulate a visibility refresh.
    await page.bringToFront();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // 3) Assertions
    // With our configuration (autoRefreshToken disabled), expected refresh_token calls is 0.
    // We still allow a small margin in case browser/SDK behavior changes.
    const WINDOW_MS = 30_000;
    const now = Date.now();
    const windowed = refreshTokenResponses.filter((r) => now - r.at <= WINDOW_MS);

    const summary = {
      requests: refreshTokenRequests.length,
      responses: refreshTokenResponses.length,
      windowedResponses: windowed.length,
      statuses: refreshTokenResponses.map((r) => r.status),
      sample: refreshTokenResponses[0]?.url ?? null,
    };

    expect(
      windowed.length,
      `Unexpected refresh_token spam in last ${WINDOW_MS}ms: ${JSON.stringify(summary)}`
    ).toBeLessThanOrEqual(1);

    const rateLimited = refreshTokenResponses.find((r) => r.status === 429);
    expect(rateLimited, `Saw refresh_token 429. Summary=${JSON.stringify(summary)}`).toBeFalsy();

    const badRequest = refreshTokenResponses.find((r) => r.status >= 400);
    expect(badRequest, `Saw refresh_token error status. Summary=${JSON.stringify(summary)}`).toBeFalsy();
  });
});
