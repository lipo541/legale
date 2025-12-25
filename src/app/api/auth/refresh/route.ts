import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get current user to validate session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: userError?.message || 'No active session',
        shouldLogout: true 
      }, { status: 401 })
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ 
        success: false, 
        error: sessionError.message,
        shouldLogout: true 
      }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found',
        shouldLogout: true 
      }, { status: 401 })
    }

    // Check if token needs refresh (expires in less than 5 minutes)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    if (expiresAt - now < fiveMinutes) {
      // Token expiring soon, refresh it
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('[API/refresh] Refresh error:', refreshError.message)
        return NextResponse.json({ 
          success: false, 
          error: refreshError.message,
          shouldLogout: refreshError.message.includes('Refresh Token') || refreshError.message.includes('invalid_grant')
        }, { status: 401 })
      }

      return NextResponse.json({ 
        success: true, 
        session: {
          access_token: refreshData.session?.access_token,
          expires_at: refreshData.session?.expires_at,
          user: {
            id: refreshData.user?.id,
            email: refreshData.user?.email
          }
        },
        refreshed: true
      })
    }

    // Session is still valid
    return NextResponse.json({ 
      success: true, 
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
        user: {
          id: user.id,
          email: user.email
        }
      },
      refreshed: false
    })

  } catch (error) {
    console.error('[API/refresh] Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
