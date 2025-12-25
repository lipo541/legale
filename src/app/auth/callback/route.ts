export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Session exchange error:', error)
        return NextResponse.redirect(`${origin}/ka/login?error=auth_failed`)
      }

      if (data.session && data.user) {
        // Session is now stored in cookies by the Supabase client
        console.log('Session created for user:', data.user.id)
        
        // Force set cookies with proper attributes
        const cookieStore = await cookies()
        const response = NextResponse.redirect(`${origin}/ka`)
        
        // Check user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        // Determine redirect URL based on role
        let redirectUrl = `${origin}/ka`
        
        if (!profileError && profile?.role) {
          switch (profile.role) {
            case 'SUPER_ADMIN':
            case 'ADMIN':
              redirectUrl = `${origin}/ka/admin`
              break
            case 'SOLO_SPECIALIST':
              redirectUrl = `${origin}/ka/solo-specialist-dashboard`
              break
            case 'SPECIALIST':
              redirectUrl = `${origin}/ka/specialist-dashboard`
              break
            case 'COMPANY':
              redirectUrl = `${origin}/ka/company-dashboard`
              break
            case 'AUTHOR':
              redirectUrl = `${origin}/ka/author-dashboard`
              break
          }
        }
        
        return NextResponse.redirect(redirectUrl)
      }
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(`${origin}/ka/login?error=unexpected`)
    }
  }

  // If there was an error or no code, redirect to home
  console.log('No auth code provided')
  return NextResponse.redirect(`${origin}/ka/login`)
}
