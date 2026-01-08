'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import CompanyProfilePage from './companyprofile/CompanyProfilePage'
import ManageSpecialistsPage from './specialists/ManageSpecialistsPage'
import SpecialistRequestsPage from './requests/SpecialistRequestsPage'
import MyPostsPage from '@/components/common/MyPostsPage'

type Locale = 'ka' | 'en' | 'ru'

type MenuItemId = 'dashboard' | 'company-profile' | 'manage-specialists' | 'specialist-requests' | 'posts'

export default function CompanyDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = (pathname?.split('/')[1] as Locale) || 'ka'
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  // Sync activeTab with URL (like SuperAdminDashboard)
  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItemId | null
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchPendingRequestsCount()
  }, [locale])

  const fetchPendingRequestsCount = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', user.id)
      .eq('status', 'PENDING')

    setPendingRequestsCount(count || 0)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Dashboard
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              კომპანიის სტატისტიკა და მონაცემები
            </p>
            {/* TODO: Dashboard კომპონენტი */}
          </div>
        )
      case 'company-profile':
        return <CompanyProfilePage />
      case 'manage-specialists':
        return <ManageSpecialistsPage />
      case 'specialist-requests':
        return <SpecialistRequestsPage onRequestUpdate={fetchPendingRequestsCount} />
      case 'posts':
        return <MyPostsPage locale={locale} />
      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Main Content - with padding for right sidebar on desktop and bottom nav on mobile */}
      <main className="min-h-screen pb-16 lg:pb-0 lg:pr-14">
        {renderContent()}
      </main>
    </div>
  )
}
