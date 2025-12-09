import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { locales, defaultLocale } from './src/lib/i18n/config'

// Public pages that should use ISR caching - DO NOT read cookies for these
// Add new public routes here to enable ISR caching for them
const ISR_PATTERNS = [
  '/news/',           // News articles: /news/[slug], /news/archive, /news/author/[id], /news/category/[slug]
  '/specialists/',    // Specialist profiles: /specialists/[slug]
  '/companies/',      // Company profiles: /companies/[slug]
  '/practices/',      // Practice areas and services: /practices/[slug], /practices/[slug]/[service]
  '/teams/',          // Team pages: /teams/[slug]
  '/contact',         // Contact page
  '/privacy',         // Privacy policy
  '/terms',           // Terms of service
  '/cookies',         // Cookie policy
]

// Check if path is a public ISR page (has locale and matches ISR pattern)
function isISRPage(pathname: string): boolean {
  // Check if path starts with a valid locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`)
  )
  if (!hasLocale) return false
  
  // Extract path after locale (e.g., /ka/news/slug -> /news/slug)
  const pathAfterLocale = pathname.replace(/^\/(ka|en|ru)/, '')
  
  // Check if path matches any ISR pattern
  return ISR_PATTERNS.some(pattern => pathAfterLocale.startsWith(pattern))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 🚀 ISR OPTIMIZATION: Skip middleware entirely for public pages
  // This prevents cookie reading and allows Vercel edge caching
  if (isISRPage(pathname)) {
    return NextResponse.next()
  }
  
  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!pathnameHasLocale) {
    // Check if user has a preferred locale in cookies
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value as typeof defaultLocale | undefined
    const locale = localeCookie && locales.includes(localeCookie) ? localeCookie : defaultLocale

    // Redirect to locale-prefixed URL
    const newPathname = pathname === '/' ? '' : pathname
    const newUrl = new URL(`/${locale}${newPathname}`, request.url)
    newUrl.search = request.nextUrl.search
    return NextResponse.redirect(newUrl)
  }

  // Run Supabase session middleware (only for auth-required pages)
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next (Next.js internals)
     * - auth/callback (OAuth callback - should not be locale-redirected)
     * - static files with extensions
     */
    '/((?!api|_next|favicon.ico|auth/callback|.*\\..*).*)',
  ],
}
