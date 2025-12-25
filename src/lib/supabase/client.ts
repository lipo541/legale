import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance for client-side
let clientInstance: SupabaseClient | null = null

/**
 * Get singleton Supabase client instance
 * This ensures only ONE client exists across the entire app,
 * preventing multiple onAuthStateChange subscriptions
 */
export function getClientSingleton(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: always create new instance (no singleton needed)
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Disable automatic token refresh to prevent SIGNED_IN spam
          autoRefreshToken: true,
          persistSession: true,
          // Don't detect session from URL (prevents re-auth on visibility)
          detectSessionInUrl: false,
        }
      }
    )
  }
  
  return clientInstance
}

/**
 * @deprecated Use getClientSingleton() instead for better auth state management
 * Kept for backwards compatibility during migration
 */
export function createClient() {
  // Redirect to singleton for consistency
  return getClientSingleton()
}
