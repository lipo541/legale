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
    // Match all paths including root
    '/',
    '/(ka|en|ru)/:path*',
    '/((?!_next|_static|_vercel|api|favicon.ico|.*\\..*).)*',
  ],
}
