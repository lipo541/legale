import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { locales, defaultLocale } from './src/lib/i18n/config'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
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

  // Run Supabase session middleware
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next (Next.js internals)
     * - static files with extensions
     * - Public pages that should use ISR caching:
     *   - /[locale]/news/[slug] (news articles)
     *   - /[locale]/specialists/[slug] (specialist profiles)
     *   - /[locale]/companies/[slug] (company profiles)
     *   - /[locale]/practices/[practiceSlug] (practice areas)
     *   - /[locale]/practices/[practiceSlug]/[serviceSlug] (services)
     *   - /[locale]/teams/[slug] (team pages)
     *   - /[locale]/news/category/[slug] (news categories)
     *   - /[locale]/news/author/[authorId] (author pages)
     */
    '/((?!api|_next|favicon.ico|.*\\..*|ka/news/[^/]+$|en/news/[^/]+$|ka/specialists/[^/]+$|en/specialists/[^/]+$|ka/companies/[^/]+$|en/companies/[^/]+$|ka/practices/[^/]+$|en/practices/[^/]+$|ka/practices/[^/]+/[^/]+$|en/practices/[^/]+/[^/]+$|ka/teams/[^/]+$|en/teams/[^/]+$|ka/news/category/[^/]+$|en/news/category/[^/]+$|ka/news/author/[^/]+$|en/news/author/[^/]+$).*)',
  ],
}
