import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - with error handling
  try {
    const { error } = await supabase.auth.getUser();
    
    // If there's an auth error (invalid token, etc), clear the session
    if (error) {
      console.error('Auth error in middleware:', error.message);
      
      // Clear all auth cookies
      const authCookies = request.cookies.getAll().filter(cookie => 
        cookie.name.includes('supabase') || cookie.name.includes('auth')
      );
      
      authCookies.forEach(cookie => {
        response.cookies.delete(cookie.name);
      });
    }
  } catch (err) {
    console.error('Unexpected error in middleware auth:', err);
  }

  return response;
}
