import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompanyDashboard from '@/components/companydashboard/CompanyDashboard'

export default async function CompanyDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only COMPANY role can access this dashboard
  if (!profile || profile.role !== 'COMPANY') {
    redirect('/')
  }

  return <CompanyDashboard />
}
