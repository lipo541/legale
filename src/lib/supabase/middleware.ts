import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Official Supabase SSR middleware pattern
 * 
 * CRITICAL: This must be called on every request to refresh expired sessions.
 * The response object MUST be recreated when cookies change (setAll is called).
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest) {
  // Start with a response that passes through the request
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // First, set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // CRITICAL: Recreate response to include updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Do not run any code between createServerClient and getUser()
  // getUser() validates the JWT on the server and refreshes if needed
  // Do NOT use getSession() here - it doesn't validate the JWT!
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Handle auth errors (but ignore "Auth session missing" for public routes)
  if (error && error.message !== 'Auth session missing!') {
    // Log only unexpected errors
    console.error('Middleware auth error:', error.message)
  }

  // CRITICAL: Always return supabaseResponse, not a new NextResponse
  // This ensures refreshed session cookies are sent to the browser
  return supabaseResponse
}
