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
  const isSigningOut = useRef<boolean>(false)
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

  const clearAuthState = useCallback(() => {
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
  }, [])

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

  // ==================== Public Methods ====================
  const signOut = useCallback(async () => {
    await performSignOut({ redirect: true })
  }, [performSignOut])

  /**
   * Refresh the session manually if needed.
   * Note: With autoRefreshToken: true (default), this is usually not needed.
   * The library handles token refresh automatically.
   */
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Refresh session error:', error)
        return
      }
      if (session && mountedRef.current) {
        const profile = await fetchProfile(session.user.id)
        setAuthState(prev => ({
          ...prev,
          session,
          user: { id: session.user.id, email: session.user.email },
          role: profile.role,
          hasPendingRequest: profile.hasPendingRequest,
          error: null,
        }))
      }
    } catch (err) {
      console.error('Refresh session error:', err)
    }
  }, [supabase, fetchProfile])

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  // ==================== Auth State Change Listener ====================
  /**
   * Official Supabase pattern for onAuthStateChange:
   * 
   * 1. INITIAL_SESSION: Fired immediately after client construction
   * 2. SIGNED_IN: Fired on sign in AND when refocusing tabs (if session exists)
   * 3. SIGNED_OUT: Fired on sign out
   * 4. TOKEN_REFRESHED: Fired when tokens are refreshed
   * 
   * CRITICAL: Don't call other Supabase methods directly in the callback.
   * Use setTimeout(..., 0) to defer any additional Supabase calls.
   * 
   * @see https://supabase.com/docs/reference/javascript/auth-onauthstatechange
   */
  useEffect(() => {
    mountedRef.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // console.log('Auth event:', event, session?.user?.id)

        if (event === 'SIGNED_OUT') {
          clearAuthState()
          return
        }

        if (event === 'INITIAL_SESSION') {
          // Use setTimeout to defer profile fetch (official Supabase recommendation)
          if (session) {
            setTimeout(async () => {
              if (!mountedRef.current) return
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
            }, 0)
          } else {
            // No session on init
            setAuthState(prev => ({
              ...prev,
              loading: false,
              initialized: true,
            }))
          }
          return
        }

        if (event === 'SIGNED_IN' && session) {
          // Check if this is the same user to prevent unnecessary re-renders
          const currentUser = authStateRef.current.user
          if (currentUser && currentUser.id === session.user.id) {
            // Same user - just update session reference
            if (mountedRef.current) {
              setAuthState(prev => ({
                ...prev,
                session,
                error: null,
              }))
            }
            return
          }
          
          // New user - defer profile fetch
          setTimeout(async () => {
            if (!mountedRef.current) return
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
          }, 0)
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
  }, [supabase, fetchProfile, clearAuthState])

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
