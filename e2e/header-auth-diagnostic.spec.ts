import { test, expect } from '@playwright/test'

const LOCALE = process.env.E2E_LOCALE ?? 'ka'
const ITERATIONS = Number(process.env.HEADER_ITERATIONS ?? '3')

const HEADER_LOADING_RE = /loading\.{0,3}|იტვირთება\.{0,3}/i

type DecodedSbAuthCookie = {
  access_token?: string
  refresh_token?: string
  expires_at?: number
  expires_in?: number
  token_type?: string
  user?: { id?: string; email?: string }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function hasCreds(): boolean {
  return !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD
}

function redactToken(token: string | undefined | null): string | null {
  if (!token) return null
  if (token.length <= 16) return '[redacted]'
  return `${token.slice(0, 8)}…${token.slice(-6)}`
}

function decodeSbCookieValue(value: string): DecodedSbAuthCookie | null {
  // Supabase cookies commonly look like: base64-<base64(json)>
  // We avoid throwing and return null if format is unexpected.
  try {
    const v = value.startsWith('base64-') ? value.slice('base64-'.length) : value
    const jsonStr = Buffer.from(v, 'base64').toString('utf8')
    const parsed = JSON.parse(jsonStr)
    if (parsed && typeof parsed === 'object') return parsed as DecodedSbAuthCookie
    return null
  } catch {
    return null
  }
}

async function dumpAuthCookies(context: any, baseURL: string | undefined) {
  const cookies = await context.cookies(baseURL ?? undefined)
  const authCookies = cookies.filter((c: any) => c.name.startsWith('sb-') || c.name.includes('supabase'))

  const sbAuthCookie = authCookies.find((c: any) => c.name.endsWith('-auth-token'))
  const decoded = sbAuthCookie?.value ? decodeSbCookieValue(sbAuthCookie.value) : null

  const summary = authCookies.map((c: any) => ({
    name: c.name,
    domain: c.domain,
    path: c.path,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
    expires: c.expires,
    valueLen: c.value?.length ?? 0,
  }))

  return {
    totalCookies: cookies.length,
    authCookiesCount: authCookies.length,
    authCookies: summary,
    decodedSbAuth: decoded
      ? {
          userId: decoded.user?.id ?? null,
          email: decoded.user?.email ?? null,
          expiresAt: decoded.expires_at ?? null,
          tokenType: decoded.token_type ?? null,
          accessToken: redactToken(decoded.access_token),
          refreshToken: redactToken(decoded.refresh_token),
        }
      : null,
  }
}

async function waitForHeaderReady(page: any, label: string) {
  const start = Date.now()
  await expect(page.locator('header')).not.toContainText(HEADER_LOADING_RE, { timeout: 12_000 })
  return { label, ms: Date.now() - start }
}

async function headerTextSample(page: any): Promise<string | null> {
  try {
    return await page.locator('header').innerText()
  } catch {
    return null
  }
}

async function safeJson(response: any) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function safeText(response: any) {
  try {
    return await response.text()
  } catch {
    return null
  }
}

async function readSbLocalStorage(page: any) {
  return await page.evaluate(() => {
    try {
      const keys = Object.keys(localStorage)
      const sbKeys = keys.filter((k) => k.startsWith('sb-') || k.includes('supabase'))
      const sample: Record<string, string> = {}
      for (const k of sbKeys.slice(0, 5)) {
        const v = localStorage.getItem(k)
        sample[k] = v ? `${v.slice(0, 12)}…(len:${v.length})` : 'null'
      }
      return { count: sbKeys.length, keys: sbKeys.slice(0, 25), sample }
    } catch {
      return { count: -1, keys: [], sample: {} }
    }
  })
}

async function checkSupabaseRestAuth(opts: {
  supabaseUrl?: string
  anonKey?: string
  accessToken?: string | null
  pageRequest: any
}) {
  const { supabaseUrl, anonKey, accessToken, pageRequest } = opts
  if (!supabaseUrl || !anonKey || !accessToken) {
    return { skipped: true, reason: 'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / access token' }
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?select=id&limit=1`
  const res = await pageRequest.get(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const bodyText = await safeText(res)
  return {
    skipped: false,
    status: res.status(),
    ok: res.ok(),
    bodySample: bodyText ? bodyText.slice(0, 200) : null,
  }
}

for (let i = 1; i <= ITERATIONS; i++) {
  test.describe(`Header/Auth Diagnostic (iter ${i}/${ITERATIONS})`, () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('header never sticks on Loading after login + navigations', async ({ page, context, baseURL }) => {
      // This diagnostic intentionally does multiple slow navigations + network toggles.
      // Avoid false failures from Playwright's default 60s timeout.
      test.setTimeout(150_000)

      test.skip(!hasCreds(), 'Set E2E_EMAIL and E2E_PASSWORD to run auth diagnostic')

      const email = requireEnv('E2E_EMAIL')
      const password = requireEnv('E2E_PASSWORD')

      const consoleErrors: string[] = []
      const requestFailures: Array<{ method: string; url: string; errorText: string }> = []
      const refreshResponses: Array<{ status: number; ok: boolean }> = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })
      page.on('requestfailed', (req) => {
        requestFailures.push({
          method: req.method(),
          url: req.url(),
          errorText: req.failure()?.errorText ?? 'unknown',
        })
      })
      page.on('response', async (res) => {
        if (res.url().includes('/api/auth/refresh')) {
          refreshResponses.push({ status: res.status(), ok: res.ok() })
        }
      })

      const timings: Array<{ label: string; ms: number }> = []

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const report: any = {
        iteration: `${i}/${ITERATIONS}`,
        ok: true,
        failureStep: null as string | null,
        failureHeaderText: null as string | null,
        url: null as string | null,
        timings,
        cookies: {
          afterRefresh: null,
          afterTabSwitch: null,
          afterRapidTabSwitch: null,
          afterOfflineOnline: null,
          final: null,
        },
        localStorage: {
          guest: null,
          postLogin: null,
          tab2: null,
        },
        refresh: {
          initial: null,
          tabSwitch: null,
          rapidTabSwitch: null,
          afterOfflineOnline: null,
        },
        supabaseRestAuth: {
          afterRefresh: null,
          final: null,
        },
        cookieUserId: null as string | null,
        refreshUserId: null as string | null,
        consoleErrorsCount: 0,
        consoleErrorsSample: [] as string[],
        requestFailuresCount: 0,
        requestFailuresSample: [] as Array<{ method: string; url: string; errorText: string }>,
      }

      const guardHeader = async (label: string, fn: () => Promise<void>) => {
        try {
          await fn()
        } catch (err) {
          report.ok = false
          report.failureStep = label
          report.url = (() => {
            try {
              return page.url()
            } catch {
              return null
            }
          })()
          report.failureHeaderText = await headerTextSample(page)
          // Best-effort snapshots at failure time
          try {
            report.cookies.final = await dumpAuthCookies(context, baseURL)
          } catch {
            report.cookies.final = { error: 'failed_to_read_cookies' }
          }
          report.localStorage.postLogin = report.localStorage.postLogin ?? (await readSbLocalStorage(page))

          // Try refresh endpoint (if online)
          try {
            const r = await page.request.post('/api/auth/refresh')
            report.refresh.afterOfflineOnline = { status: r.status(), body: await safeJson(r) }
          } catch {
            // ignore
          }

          // Supabase REST auth check at failure time (if possible)
          try {
            const rawCookies = await context.cookies(baseURL ?? undefined)
            const sbAuthCookie = rawCookies.find((c: any) => c.name.endsWith('-auth-token'))
            const decodedFull = sbAuthCookie?.value ? decodeSbCookieValue(sbAuthCookie.value) : null
            report.supabaseRestAuth.final = await checkSupabaseRestAuth({
              supabaseUrl,
              anonKey: supabaseAnonKey,
              accessToken: decodedFull?.access_token ?? null,
              pageRequest: page.request,
            })
          } catch {
            // ignore
          }

          // Include errors/failures samples
          report.consoleErrorsCount = consoleErrors.length
          report.consoleErrorsSample = consoleErrors.slice(0, 5)
          report.requestFailuresCount = requestFailures.length
          report.requestFailuresSample = requestFailures.slice(0, 10)

          throw err
        }
      }

      let page2: any = null

      try {
        // 1) Guest home -> Header should become ready quickly
        await page.goto(`/${LOCALE}`, { waitUntil: 'domcontentloaded' })
        await guardHeader('guest-home', async () => {
          timings.push(await waitForHeaderReady(page, 'guest-home'))
        })
        const guestStorage = await readSbLocalStorage(page)
        report.localStorage.guest = guestStorage

        // 2) Login
        await page.goto(`/${LOCALE}/login`, { waitUntil: 'networkidle' })
        await page.waitForSelector('#email', { state: 'visible' })
        await page.locator('#email').fill(email)
        await page.locator('#password').fill(password)
        await page.getByRole('button', { name: 'შესვლა', exact: true }).click()

        // Wait for redirect away from /login
        await expect(page).not.toHaveURL(new RegExp(`/${LOCALE}/login`), { timeout: 20_000 })

        // Header must not be stuck
        await guardHeader('post-login', async () => {
          timings.push(await waitForHeaderReady(page, 'post-login'))
        })

        const postLoginStorage = await readSbLocalStorage(page)
        report.localStorage.postLogin = postLoginStorage

        // 2b) Immediate reload after login (common race-condition trigger)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await guardHeader('post-login:reload', async () => {
          timings.push(await waitForHeaderReady(page, 'post-login:reload'))
        })

        // 3) Call refresh endpoint once (server-side cookie validation)
        const refreshRes = await page.request.post('/api/auth/refresh')
        const refreshBodyInitial = await safeJson(refreshRes)
        report.refresh.initial = { status: refreshRes.status(), body: refreshBodyInitial }

        // Snapshot cookies + decode token after refresh
        const cookieInfoAfterRefresh = await dumpAuthCookies(context, baseURL)
        report.cookies.afterRefresh = cookieInfoAfterRefresh

        // Re-decode from raw cookie value for auth REST check (needs real access token)
        const rawCookies = await context.cookies(baseURL ?? undefined)
        const sbAuthCookie = rawCookies.find((c: any) => c.name.endsWith('-auth-token'))
        const decodedFull = sbAuthCookie?.value ? decodeSbCookieValue(sbAuthCookie.value) : null

        const supabaseRestCheck1 = await checkSupabaseRestAuth({
          supabaseUrl,
          anonKey: supabaseAnonKey,
          accessToken: decodedFull?.access_token ?? null,
          pageRequest: page.request,
        })
        report.supabaseRestAuth.afterRefresh = supabaseRestCheck1

        // 4) Tab switching scenario (background/foreground-like behavior)
        page2 = await context.newPage()
        await page2.goto(`/${LOCALE}/companies`, { waitUntil: 'domcontentloaded' })
        await guardHeader('tab2:/companies', async () => {
          timings.push(await waitForHeaderReady(page2, 'tab2:/companies'))
        })
        const tab2Storage = await readSbLocalStorage(page2)
        report.localStorage.tab2 = tab2Storage
        await page2.bringToFront()
        await page.waitForTimeout(250)
        await page.bringToFront()
        await guardHeader('tab1:back-to-front', async () => {
          timings.push(await waitForHeaderReady(page, 'tab1:back-to-front'))
        })

        const cookieInfoAfterTabSwitch = await dumpAuthCookies(context, baseURL)
        report.cookies.afterTabSwitch = cookieInfoAfterTabSwitch
        const refreshResTab = await page.request.post('/api/auth/refresh')
        const refreshBodyTab = await safeJson(refreshResTab)
        report.refresh.tabSwitch = { status: refreshResTab.status(), body: refreshBodyTab }

        // 4b) Rapid tab switching + background reload (race-condition trigger)
        // Loop a few times quickly switching focus and reloading the background tab.
        for (let t = 1; t <= 5; t++) {
          await page2.bringToFront()
          await page.waitForTimeout(100)

          // Reload page while it's in the background (page2 is front)
          await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {})

          await page.bringToFront()
          await guardHeader(`rapid-tab:${t}`, async () => {
            timings.push(await waitForHeaderReady(page, `rapid-tab:${t}`))
          })
        }

        const cookieInfoAfterRapidTabSwitch = await dumpAuthCookies(context, baseURL)
        report.cookies.afterRapidTabSwitch = cookieInfoAfterRapidTabSwitch
        const refreshResRapid = await page.request.post('/api/auth/refresh')
        const refreshBodyRapid = await safeJson(refreshResRapid)
        report.refresh.rapidTabSwitch = { status: refreshResRapid.status(), body: refreshBodyRapid }

        // 5) Offline/Online flip (simulates connectivity drop)
        await context.setOffline(true)
        await page.goto(`/${LOCALE}/news`, { waitUntil: 'domcontentloaded' }).catch(() => {})
        await page.waitForTimeout(750)
        await context.setOffline(false)

        // Once back online, refresh should be healthy.
        const refreshRes2 = await page.request.post('/api/auth/refresh')
        const refreshBody2 = await safeJson(refreshRes2)
        report.refresh.afterOfflineOnline = { status: refreshRes2.status(), body: refreshBody2 }
        expect(refreshRes2.status()).toBe(200)
        expect(refreshBody2 && typeof refreshBody2 === 'object' && 'success' in refreshBody2).toBeTruthy()

        await page.reload({ waitUntil: 'domcontentloaded' })
        await guardHeader('offline-online:recovered', async () => {
          timings.push(await waitForHeaderReady(page, 'offline-online:recovered'))
        })

        const cookieInfoAfterOffline = await dumpAuthCookies(context, baseURL)
        report.cookies.afterOfflineOnline = cookieInfoAfterOffline

        // 6) Navigate to common client pages (do NOT assert page content, only Header)
        const pagesToProbe = [`/${LOCALE}/companies`, `/${LOCALE}/news`, `/${LOCALE}/specialists`, `/${LOCALE}/practices`]
        for (const p of pagesToProbe) {
          await page.goto(p, { waitUntil: 'domcontentloaded' })
          await guardHeader(`nav:${p}`, async () => {
            timings.push(await waitForHeaderReady(page, `nav:${p}`))
          })

          await page.reload({ waitUntil: 'domcontentloaded' })
          await guardHeader(`reload:${p}`, async () => {
            timings.push(await waitForHeaderReady(page, `reload:${p}`))
          })
        }

        const cookieInfo = await dumpAuthCookies(context, baseURL)
        report.cookies.final = cookieInfo

        const refreshBody = report.refresh.initial?.body
        const refreshUserId = refreshBody?.session?.user?.id ?? null
        const cookieUserId = cookieInfo.decodedSbAuth?.userId ?? null
        report.cookieUserId = cookieUserId
        report.refreshUserId = refreshUserId

        // Final Supabase REST auth check (same token as after refresh)
        report.supabaseRestAuth.final = report.supabaseRestAuth.afterRefresh

        // Hard assertions (auth-focused)
        expect(cookieInfo.authCookiesCount).toBeGreaterThan(0)
        expect(report.refresh.initial?.status).toBe(200)
        expect(refreshBody && typeof refreshBody === 'object' && 'success' in refreshBody).toBeTruthy()
        if (refreshUserId && cookieUserId) {
          expect(refreshUserId).toBe(cookieUserId)
        }
        if (report.supabaseRestAuth.final && report.supabaseRestAuth.final.skipped === false) {
          expect(report.supabaseRestAuth.final.ok).toBeTruthy()
        }
      } finally {
        report.url = report.url ?? (() => {
          try {
            return page.url()
          } catch {
            return null
          }
        })()
        report.consoleErrorsCount = consoleErrors.length
        report.consoleErrorsSample = consoleErrors.slice(0, 5)
        report.requestFailuresCount = requestFailures.length
        report.requestFailuresSample = requestFailures.slice(0, 10)

        console.log(`\n[HEADER/AUTH FULL REPORT] iteration ${i}/${ITERATIONS}`)
        console.log(JSON.stringify(report, null, 2))

        if (page2) {
          await page2.close().catch(() => {})
        }
      }
    })
  })
}
