'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revalidateGlobalCache() {
  const supabase = await createClient()
  
  // 1. Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }

  // 2. Check role (Security)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only allow ADMIN and SUPER_ADMIN
  if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
     throw new Error('Forbidden')
  }

  // 3. Revalidate the entire site (Layout level)
  revalidatePath('/', 'layout')
  
  return { success: true, timestamp: Date.now() }
}
