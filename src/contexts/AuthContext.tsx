'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { getClientSingleton } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

// ==================== Types ====================
export interface AuthUser {
  id: string
  email?: string
}

export interface AuthProfile {
  role: string | null
  hasPendingRequest: boolean
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  role: string | null
  hasPendingRequest: boolean
  loading: boolean
  initialized: boolean
  error: string | null
}

export interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

// ==================== Context ====================
const AuthContext = createContext<AuthContextValue | null>(null)

// ==================== Constants ====================
const SIGNOUT_DEBOUNCE_MS = 2000
const SESSION_FETCH_DEBOUNCE_MS = 1000

// Profile cache duration - 5 minutes
const PROFILE_CACHE_DURATION_MS = 5 * 60 * 1000

// ==================== Provider ====================
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const supabase = getClientSingleton()
  
  // State
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    hasPendingRequest: false,
    loading: true,
    initialized: false,
    error: null,
  })

  // Refs
  const lastSignOutTime = useRef<number>(0)
  const lastFetchTime = useRef<number>(0)
  const isSigningOut = useRef<boolean>(false)
  const isFetching = useRef<boolean>(false)
  const mountedRef = useRef<boolean>(true)
  
  // Profile cache to avoid DB queries on every SIGNED_IN event
  const profileCache = useRef<{
    userId: string
    role: string | null
    hasPendingRequest: boolean
    cachedAt: number
  } | null>(null)
  const authStateRef = useRef(authState)
  
  // Keep ref in sync
  authStateRef.current = authState

  // Get locale
  const currentLocale = pathname?.split('/')[1] || 'ka'

  const clearAuthState = () => {
    // Clear profile cache
    profileCache.current = null
    
    setAuthState({
      user: null,
      session: null,
      role: null,
      hasPendingRequest: false,
      loading: false,
      initialized: true,
      error: null,
    })
  }

  // ==================== Fetch Profile ====================
  const fetchProfile = useCallback(async (userId: string, options?: { skipCache?: boolean }): Promise<AuthProfile> => {
    // Check cache first (unless skipCache is true)
    const now = Date.now()
    const cache = profileCache.current
    
    if (!options?.skipCache && cache && cache.userId === userId) {
      const cacheAge = now - cache.cachedAt
      if (cacheAge < PROFILE_CACHE_DURATION_MS) {
        return {
          role: cache.role,
          hasPendingRequest: cache.hasPendingRequest,
        }
      }
    }
    
    try {
      const [profileRes, requestRes] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', userId).single(),
        supabase.from('access_requests')
          .select('id, status')
          .eq('user_id', userId)
          .eq('status', 'PENDING')
          .maybeSingle()
      ])
      
      const result = {
        role: profileRes.data?.role || null,
        hasPendingRequest: !!requestRes.data,
      }
      
      // Update cache
      profileCache.current = {
        userId,
        role: result.role,
        hasPendingRequest: result.hasPendingRequest,
        cachedAt: now,
      }

      return result
    } catch {
      return { role: null, hasPendingRequest: false }
    }
  }, [supabase])

  // ==================== Sign Out ====================
  const performSignOut = useCallback(async (options?: { 
    redirect?: boolean
  }) => {
    const { redirect = true } = options || {}
    const now = Date.now()

    // Debounce
    if (now - lastSignOutTime.current < SIGNOUT_DEBOUNCE_MS) {
      return
    }

    if (isSigningOut.current) {
      return
    }

    lastSignOutTime.current = now
    isSigningOut.current = true

    try {
      // Clear state first
      clearAuthState()

      // Server-side logout (optional but good for cleanup)
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {
        // Silent fail
      }

      // Client-side signOut - this is the source of truth
      await supabase.auth.signOut({ scope: 'global' })

      // Redirect
      if (redirect && typeof window !== 'undefined') {
        window.location.href = `/${currentLocale}`
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even if error
      if (redirect && typeof window !== 'undefined') {
        window.location.href = `/${currentLocale}`
      }
    } finally {
      isSigningOut.current = false
    }
  }, [supabase, currentLocale])

  // ==================== Fetch Session ====================
  const fetchSession = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now()
    
    if (!options?.force && now - lastFetchTime.current < SESSION_FETCH_DEBOUNCE_MS) {
      return
    }

    if (isFetching.current) {
      return
    }

    lastFetchTime.current = now
    isFetching.current = true

    try {
      // Standard Supabase getSession call - no timeouts, no race conditions
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (!mountedRef.current) return

      if (sessionError) {
        console.error('Session error:', sessionError)
        setAuthState(prev => ({
          ...prev,
          user: null,
          session: null,
          role: null,
          hasPendingRequest: false,
          loading: false,
          initialized: true,
          error: sessionError.message,
        }))
        return
      }

      if (!session) {
        clearAuthState()
        return
      }

      // Fetch profile for the session
      const profile = await fetchProfile(session.user.id)

      if (!mountedRef.current) return

      setAuthState({
        user: { id: session.user.id, email: session.user.email },
        session,
        role: profile.role,
        hasPendingRequest: profile.hasPendingRequest,
        loading: false,
        initialized: true,
        error: null,
      })
    } catch (err) {
      console.error('Auth context error:', err)
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          initialized: true,
          error: err instanceof Error ? err.message : 'Unknown error',
        }))
      }
    } finally {
      isFetching.current = false
    }
  }, [supabase, fetchProfile])

  // ==================== Public Methods ====================
  const signOut = useCallback(async () => {
    await performSignOut({ redirect: true })
  }, [performSignOut])

  const refreshSession = useCallback(async () => {
    await fetchSession({ force: true })
  }, [fetchSession])

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  // ==================== Auth State Change Listener ====================
  useEffect(() => {
    mountedRef.current = true

    // Initial fetch
    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // console.log('Auth state change:', event, session?.user?.id)

        if (event === 'SIGNED_OUT') {
          clearAuthState()
          return
        }

        if (event === 'SIGNED_IN' && session) {
          // Check if this is the same user - if so, don't update state to prevent re-renders
          const currentUser = authStateRef.current.user
          if (currentUser && currentUser.id === session.user.id) {
            // Just update session without changing user reference
            if (mountedRef.current) {
              setAuthState(prev => ({
                ...prev,
                session,
                error: null,
              }))
            }
            return
          }
          
          // New user - fetch profile and update state
          const profile = await fetchProfile(session.user.id)
          
          if (mountedRef.current) {
            setAuthState({
              user: { id: session.user.id, email: session.user.email },
              session,
              role: profile.role,
              hasPendingRequest: profile.hasPendingRequest,
              loading: false,
              initialized: true,
              error: null,
            })
          }
          return
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          if (mountedRef.current) {
            setAuthState(prev => ({
              ...prev,
              session,
              error: null,
            }))
          }
          return
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [supabase, fetchSession, fetchProfile])

  // ==================== Context Value ====================
  const value: AuthContextValue = {
    ...authState,
    signOut,
    refreshSession,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ==================== Hooks ====================
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthUser() {
  const { user, role, hasPendingRequest, loading } = useAuth()
  return { user, role, hasPendingRequest, loading }
}

export function useAuthActions() {
  const { signOut, refreshSession, clearError } = useAuth()
  return { signOut, refreshSession, clearError }
}

export function useIsAuthenticated() {
  const { user, loading, initialized } = useAuth()
  return { isAuthenticated: !!user, loading, initialized }
}
