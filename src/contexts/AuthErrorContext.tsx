'use client'

import { createContext, useContext, useEffect, ReactNode, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthErrorContext = createContext<null>(null)

export function AuthErrorProvider({ children }: { children: ReactNode }) {
  const isHandlingError = useRef(false)
  
  useEffect(() => {
    const supabase = createClient()
    
    // Listen for auth errors globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent multiple simultaneous error handlers
      if (isHandlingError.current) {
        return
      }
      
      // Handle failed token refresh
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.error('Token refresh failed - clearing auth state')
        isHandlingError.current = true
        
        try {
          await supabase.auth.signOut()
        } catch (e) {
          console.error('Error signing out:', e)
        }
        
        // Redirect to home after a brief delay
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/ka'
          }
        }, 500)
      }
      
      // Handle signed out event
      if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        isHandlingError.current = false
      }
    })
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [])
  
  return <>{children}</>
}

export const useAuthError = () => {
  return useContext(AuthErrorContext)
}
