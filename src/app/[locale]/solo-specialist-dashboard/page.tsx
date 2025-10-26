import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SoloSpecialistDashboard from '@/components/solospecialistdashboard/SoloSpecialistDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()
  
  // Redirect based on role
  if (profile?.role === 'COMPANY') {
    redirect('/company-dashboard')
  } else if (profile?.role === 'SUPER_ADMIN') {
    redirect('/admin')
  } else if (profile?.role === 'SOLO_SPECIALIST' || profile?.role === 'SPECIALIST') {
    // Show specialist dashboard
    return <SoloSpecialistDashboard />
  } else {
    // Regular user
    redirect('/')
  }
}
