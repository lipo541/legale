import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      // Determine redirect based on role
      if (!profileError && (profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN')) {
        return NextResponse.redirect(`${origin}/ka/admin`)
      }
      
      // Default redirect to home page
      return NextResponse.redirect(`${origin}/ka`)
    }
  }

  // If there was an error or no code, redirect to home
  return NextResponse.redirect(`${origin}/ka`)
}
