import { test, expect } from '@playwright/test';

const LOCALE = process.env.E2E_LOCALE ?? 'ka';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

test.describe('Session Diagnostic - Full Debug', () => {
  test('diagnose auth/session issues', async ({ page, context, baseURL }) => {
    const email = requireEnv('E2E_EMAIL');
    const password = requireEnv('E2E_PASSWORD');

    // ========== COLLECTORS ==========
    const networkLogs: Array<{ url: string; status: number; method: string; type: string }> = [];
    const requestFailures: Array<{ url: string; method: string; failure?: string }> = [];
    const pageErrors: string[] = [];
    const requestStarts: Array<{ url: string; method: string; resourceType: string }> = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const authEvents: string[] = [];

    page.on('pageerror', (err) => {
      const msg = err?.stack || err?.message || String(err);
      pageErrors.push(msg);
      console.log('[PAGEERROR]', msg.slice(0, 800));
    });

    page.on('requestfailed', (request) => {
      const url = request.url();
      const method = request.method();
      const failure = request.failure()?.errorText;
      requestFailures.push({ url, method, failure });
      if (url.includes('/_next/') || url.includes('supabase') || url.includes('/api/')) {
        console.log(`[REQUEST FAILED] ${method} ${url} -> ${failure}`);
      }
    });

    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const resourceType = request.resourceType();
      if (
        url.includes('/_next/') ||
        url.includes('__next') ||
        url.includes('supabase.co/rest/') ||
        url.includes('/api/')
      ) {
        requestStarts.push({ url, method, resourceType });
      }
    });

    // Monitor ALL network responses (selectively log interesting ones)
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      const method = response.request().method();

      // Any failing Next.js assets or data endpoints are critical (often breaks hydration)
      if (status >= 400 && (url.includes('/_next/') || url.includes('/favicon') || url.includes('/manifest') || url.includes('/robots') || url.includes('/sitemap'))) {
        console.log(`[ASSET ERROR] ${method} ${url} -> ${status}`);
        try {
          const body = await response.text();
          console.log(`[ASSET ERROR BODY] ${url} ->`, body.slice(0, 300));
        } catch {}
      }
      
      // Log auth-related requests
      if (url.includes('/auth/') || url.includes('supabase') || url.includes('/api/')) {
        networkLogs.push({ url, status, method, type: 'api' });
        
        // Log response body for auth errors
        if (status >= 400) {
          try {
            const body = await response.text();
            console.log(`[NET ERROR] ${method} ${url} -> ${status}:`, body.slice(0, 500));
          } catch {}
        }
      }
      
      // Log Supabase REST API calls
      if (url.includes('supabase.co/rest/')) {
        networkLogs.push({ url: url.split('?')[0], status, method, type: 'supabase-rest' });
        if (status >= 400) {
          try {
            const body = await response.text();
            console.log(`[SUPABASE ERROR] ${method} ${url.split('?')[0]} -> ${status}:`, body.slice(0, 300));
          } catch {}
        }
      }
    });

    // Monitor console
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('[CONSOLE ERROR]', text);
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(text);
        // Always log hydration-related warnings; otherwise log only auth/session-related ones
        if (/hydration|did not match|Text content does not match|Expected server HTML/i.test(text)) {
          console.log('[CONSOLE WARN][HYDRATION]', text);
        } else if (/(auth|session|token|supabase|cookie)/i.test(text)) {
          console.log('[CONSOLE WARN]', text);
        }
      }
      // Capture auth state changes
      if (text.includes('SIGNED_') || text.includes('TOKEN_') || text.includes('session') || text.includes('invalid_grant')) {
        authEvents.push(text);
        console.log('[AUTH EVENT]', text);
      }
    });

    // ========== STEP 1: Check initial state (no auth) ==========
    console.log('\n========== STEP 1: Initial State (Guest) ==========');
    await page.goto(`/${LOCALE}`, { waitUntil: 'networkidle' });
    
    let cookies = await context.cookies(baseURL ?? undefined);
    const initialCookies = cookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase'));
    console.log('Initial sb-* cookies:', initialCookies.length);
    initialCookies.forEach(c => console.log(`  - ${c.name}: expires=${c.expires}, httpOnly=${c.httpOnly}, secure=${c.secure}`));

    // Check localStorage
    const initialLocalStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('sb-') || key.includes('supabase'))) {
          items[key] = localStorage.getItem(key)?.slice(0, 100) + '...' || '';
        }
      }
      return items;
    });
    console.log('Initial localStorage sb-* keys:', Object.keys(initialLocalStorage).length);
    Object.entries(initialLocalStorage).forEach(([k, v]) => console.log(`  - ${k}: ${v.slice(0, 50)}...`));

    // ========== STEP 2: Login ==========
    console.log('\n========== STEP 2: Login ==========');
    await page.goto(`/${LOCALE}/login`, { waitUntil: 'networkidle' });
    
    await page.waitForSelector('#email', { state: 'visible' });
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    
    // Clear network logs before login
    networkLogs.length = 0;
    
    await page.getByRole('button', { name: 'შესვლა', exact: true }).click();
    await page.waitForTimeout(5000); // Wait for auth to complete
    
    // Check if still on login page (error)
    const currentUrl = page.url();
    console.log('Post-login URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      const errorText = await page.locator('[class*="red"]').first().textContent().catch(() => null);
      console.log('Login error:', errorText || 'Unknown error - still on login page');
      
      // Check network for auth errors
      const authErrors = networkLogs.filter(n => n.status >= 400);
      console.log('Auth network errors:', authErrors);
      
      throw new Error(`Login failed: ${errorText || 'stuck on login page'}`);
    }

    // ========== STEP 3: Post-Login State ==========
    console.log('\n========== STEP 3: Post-Login State ==========');
    
    cookies = await context.cookies(baseURL ?? undefined);
    const postLoginCookies = cookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase'));
    console.log('Post-login sb-* cookies:', postLoginCookies.length);
    postLoginCookies.forEach(c => {
      console.log(`  - ${c.name}:`);
      console.log(`      domain=${c.domain}, path=${c.path}`);
      console.log(`      httpOnly=${c.httpOnly}, secure=${c.secure}, sameSite=${c.sameSite}`);
      console.log(`      expires=${new Date(c.expires * 1000).toISOString()}`);
    });

    const postLoginLocalStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('sb-') || key.includes('supabase'))) {
          items[key] = localStorage.getItem(key) || '';
        }
      }
      return items;
    });
    console.log('Post-login localStorage sb-* keys:', Object.keys(postLoginLocalStorage).length);
    Object.keys(postLoginLocalStorage).forEach(k => console.log(`  - ${k}`));

    // Check Header auth state
    const headerText = await page.locator('header').textContent();
    const headerHasLoading = /loading|იტვირთება/i.test(headerText || '');
    console.log('Header shows "Loading...":', headerHasLoading);
    console.log('Header text sample:', headerText?.slice(0, 200));

    // ========== STEP 4: Navigate to Client-Side Pages ==========
    console.log('\n========== STEP 4: Client-Side Page Test (/companies) ==========');
    networkLogs.length = 0;
    consoleErrors.length = 0;
    consoleWarnings.length = 0;
    requestFailures.length = 0;
    pageErrors.length = 0;
    requestStarts.length = 0;
    
    await page.goto(`/${LOCALE}/companies`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000); // Wait for client-side data fetch

    // Hydration/runtime sanity checks
    const runtimeInfo = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map(s => (s as HTMLScriptElement).src);
      const nextScripts = scriptSrcs.filter(s => s.includes('/_next/'));

      // Next App Router runtime often uses __next_f
      const hasNextF = !!w.__next_f;
      const hasNextData = !!w.__NEXT_DATA__;

      return {
        hasNextData,
        hasNextF,
        nextScriptsCount: nextScripts.length,
        sampleNextScript: nextScripts[0] || null,
        hasReactDevtoolsHook: !!w.__REACT_DEVTOOLS_GLOBAL_HOOK__,
      };
    });
    console.log('Runtime/hydration hints:', runtimeInfo);

    const resourceInfo = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const nextResources = entries
        .map(e => e.name)
        .filter(n => n.includes('/_next/'));
      const supabaseResources = entries
        .map(e => e.name)
        .filter(n => n.includes('supabase.co'));

      return {
        nextResourcesCount: nextResources.length,
        nextSample: nextResources.slice(0, 5),
        supabaseResourcesCount: supabaseResources.length,
        supabaseSample: supabaseResources.slice(0, 5),
      };
    });
    console.log('Loaded resource hints:', resourceInfo);

    const hydrationSignals = await page.evaluate(() => {
      return {
        htmlHasDarkClass: document.documentElement.classList.contains('dark'),
        localStorageTheme: localStorage.getItem('theme'),
        locationHref: window.location.href,
      };
    });
    console.log('Hydration signals:', hydrationSignals);

    const headerAfterCompanies = await page.locator('header').textContent();
    const headerLoadingAfterCompanies = /loading\.{0,3}|Loading\.{0,3}|იტვირთება\.{0,3}/i.test(headerAfterCompanies || '');
    console.log('Header shows Loading after /companies:', headerLoadingAfterCompanies);

    // Interaction test: theme toggle should flip html.dark class if hydrated
    const themeBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const themeToggleButtons = page.getByRole('button', { name: /Switch to (Light|Dark) theme/i });
    const toggleCount = await themeToggleButtons.count();
    console.log('Theme toggle buttons found:', toggleCount);
    if (toggleCount > 0) {
      await themeToggleButtons.first().click({ timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(300);
      const themeAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      console.log('Theme interaction changed dark class:', themeBefore !== themeAfter);
    }
    
    // Check page state
    const companiesContent = await page.locator('main').textContent();
    const companiesStuck = /იტვირთება|loading/i.test(companiesContent || '');
    console.log('/companies stuck on loader:', companiesStuck);
    
    if (companiesStuck) {
      console.log('\n--- DIAGNOSTIC: Why /companies is stuck ---');

      // Check whether Next.js assets failed to load (common reason for non-hydrated pages)
      const assetFailures = requestFailures.filter(f => f.url.includes('/_next/'));
      console.log('Failed /_next/* requests:', assetFailures.length);
      assetFailures.slice(0, 10).forEach(f => console.log(`  ${f.method} ${f.url} -> ${f.failure}`));

      const startedSupabase = requestStarts.filter(r => r.url.includes('supabase.co/rest/'));
      const startedNext = requestStarts.filter(r => r.url.includes('/_next/') || r.url.includes('__next'));
      console.log('Request starts (supabase/rest):', startedSupabase.length);
      startedSupabase.slice(0, 10).forEach(r => console.log(`  ${r.method} ${r.url} (${r.resourceType})`));
      console.log('Request starts (/_next/*):', startedNext.length);
      startedNext.slice(0, 10).forEach(r => console.log(`  ${r.method} ${r.url} (${r.resourceType})`));

      const anyFailures = requestFailures.length;
      console.log('Total request failures:', anyFailures);

      console.log('Page (runtime) errors:', pageErrors.length);
      pageErrors.slice(0, 5).forEach(e => console.log(`  ${e.slice(0, 200)}`));
      
      // Check Supabase REST calls
      const supabaseCalls = networkLogs.filter(n => n.type === 'supabase-rest');
      console.log('Supabase REST API calls made:', supabaseCalls.length);
      supabaseCalls.forEach(c => console.log(`  ${c.method} ${c.url} -> ${c.status}`));
      
      // Check for 401/403 errors
      const authFailures = networkLogs.filter(n => n.status === 401 || n.status === 403);
      console.log('Auth failures (401/403):', authFailures.length);
      authFailures.forEach(f => console.log(`  ${f.method} ${f.url} -> ${f.status}`));
      
      // Check console errors
      console.log('Console errors:', consoleErrors.length);
      consoleErrors.forEach(e => console.log(`  ${e.slice(0, 200)}`));

      const hydrationWarnings = consoleWarnings.filter(w => /hydration|did not match|Text content does not match|Expected server HTML/i.test(w));
      console.log('Console warnings:', consoleWarnings.length);
      console.log('Hydration-related warnings:', hydrationWarnings.length);
      hydrationWarnings.slice(0, 5).forEach(w => console.log(`  ${w.slice(0, 250)}`));

      // Print the first few warnings verbatim; these often include cookie/storage/security blockers.
      consoleWarnings.slice(0, 10).forEach(w => console.log(`[WARN] ${w.slice(0, 400)}`));
      
      // Re-check cookies (might have been cleared)
      const currentCookies = await context.cookies(baseURL ?? undefined);
      const sbCookiesNow = currentCookies.filter(c => c.name.includes('sb-'));
      console.log('sb-* cookies still present:', sbCookiesNow.length);

      const sbAuthCookie = sbCookiesNow.find(c => c.name.includes('auth-token'));
      if (sbAuthCookie) {
        console.log('sb auth cookie flags:', {
          httpOnly: sbAuthCookie.httpOnly,
          secure: sbAuthCookie.secure,
          sameSite: sbAuthCookie.sameSite,
          domain: sbAuthCookie.domain,
          path: sbAuthCookie.path,
        });
        // Do NOT print value; just length/prefix to detect truncation patterns
        console.log('sb auth cookie value length:', sbAuthCookie.value?.length ?? 0);
        console.log('sb auth cookie value prefix:', (sbAuthCookie.value || '').slice(0, 30));
      }
      
      // Check if session was lost
      const sessionLost = sbCookiesNow.length === 0 && postLoginCookies.length > 0;
      console.log('SESSION LOST after navigation:', sessionLost);
      
      // Check localStorage again
      const lsNow = await page.evaluate(() => {
        return Object.keys(localStorage).filter(k => k.includes('sb-')).length;
      });
      console.log('localStorage sb-* keys now:', lsNow);
    }

    // ========== STEP 5: Test /api/auth/refresh ==========
    console.log('\n========== STEP 5: Test /api/auth/refresh endpoint ==========');
    const refreshResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        const body = await res.text();
        return { status: res.status, body: body.slice(0, 500) };
      } catch (e: any) {
        return { status: -1, body: e.message };
      }
    });
    console.log('/api/auth/refresh response:', refreshResponse.status);
    console.log('Response body:', refreshResponse.body);

    // ========== STEP 6: Check getSession from client ==========
    console.log('\n========== STEP 6: Client-side getSession() ==========');
    const sessionCheck = await page.evaluate(async () => {
      try {
        // Try to access Supabase client from window if exposed
        const win = window as any;
        if (win.__SUPABASE_CLIENT__) {
          const { data, error } = await win.__SUPABASE_CLIENT__.auth.getSession();
          return { 
            hasSession: !!data?.session,
            userId: data?.session?.user?.id,
            error: error?.message 
          };
        }
        return { hasSession: null, note: 'Supabase client not exposed on window' };
      } catch (e: any) {
        return { error: e.message };
      }
    });
    console.log('Client getSession result:', sessionCheck);

    // ========== SUMMARY ==========
    console.log('\n========== DIAGNOSTIC SUMMARY ==========');
    console.log('1. Login successful:', !currentUrl.includes('/login'));
    console.log('2. Post-login cookies set:', postLoginCookies.length);
    console.log('3. Header stuck on Loading:', headerHasLoading);
    console.log('4. /companies stuck on Loading:', companiesStuck);
    console.log('5. Console errors during test:', consoleErrors.length);
    console.log('6. Auth network failures:', networkLogs.filter(n => n.status === 401 || n.status === 403).length);
    console.log('7. /api/auth/refresh status:', refreshResponse.status);
    console.log('8. Request failures:', requestFailures.length);
    console.log('9. Page errors:', pageErrors.length);
    console.log('10. Console warnings:', consoleWarnings.length);
    
    // Fail test with diagnostic info if client pages are broken
    if (companiesStuck) {
      throw new Error(`Client-side page stuck. Check logs above for root cause.`);
    }
  });
});
