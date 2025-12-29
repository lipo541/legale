import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance for client-side (browser only)
let clientInstance: SupabaseClient | null = null

/**
 * Get singleton Supabase client instance for browser
 * 
 * Official @supabase/ssr configuration:
 * - autoRefreshToken: true (default) - library handles tab visibility automatically
 * - detectSessionInUrl: true (default) - required for PKCE flow
 * - persistSession: true (default) - stored in cookies by SSR package
 * 
 * The library automatically:
 * - Refreshes tokens only when tab is in foreground
 * - Prevents race conditions across multiple tabs
 * - Uses LockManager API to sync events across tabs
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
    // Use official defaults - DO NOT override auth options
    // @supabase/ssr handles everything automatically:
    // - autoRefreshToken: true (refreshes only when tab visible)
    // - detectSessionInUrl: true (required for OAuth/PKCE redirects)
    // - persistSession: true (cookies managed by SSR package)
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  return clientInstance
}

/**
 * Create a new Supabase client
 * For most cases, use getClientSingleton() instead
 */
export function createClient() {
  return getClientSingleton()
}
