import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Static Supabase client for ISR (Incremental Static Regeneration) pages.
 * 
 * This client does NOT use cookies, which allows Next.js to properly cache
 * and revalidate pages. Use this for all public, read-only pages like:
 * - News articles
 * - Specialist profiles
 * - Company profiles
 * - Practice/Service pages
 * - Category pages
 * - Author pages
 * - Team pages
 * 
 * DO NOT use this for:
 * - Dashboard pages (need user session)
 * - Any page that requires authentication
 * - Any page that writes data
 * 
 * @returns Supabase client without cookie management
 */
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
