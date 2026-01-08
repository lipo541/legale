'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import ProfilePage from '@/components/specialistdashboard/profile/ProfilePage'
import DashboardPage from '@/components/specialistdashboard/dashboard/DashboardPage'
import MyPostsPage from '@/components/common/MyPostsPage'
import { createClient } from '@/lib/supabase/client'
import { specialistDashboardTranslations, Locale } from '@/translations/specialist-dashboard'

// ============================================================================
// Types
// ============================================================================

type MenuItemId = 'dashboard' | 'profile' | 'posts'

interface UserProfile {
  full_name?: string
  email?: string
  avatar_url?: string
  verification_status?: string
  slug?: string
}

// ============================================================================
// Main Component
// ============================================================================

export default function SpecialistDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Get current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'
  const t = specialistDashboardTranslations[currentLocale] || specialistDashboardTranslations.ka
  
  // State
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [postsCount, setPostsCount] = useState(0)
  const [viewsCount, setViewsCount] = useState(0)

  // ============================================================================
  // Effects
  // ============================================================================

  // Sync activeTab with URL (like SuperAdminDashboard)
  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItemId | null
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, verification_status')
          .eq('id', user.id)
          .single()

        // Fetch slug from specialist_translations for current locale
        const { data: translationData } = await supabase
          .from('specialist_translations')
          .select('slug')
          .eq('specialist_id', user.id)
          .eq('language', currentLocale)
          .single()
        
        setVerificationStatus(profile?.verification_status || null)
        setUserProfile({
          full_name: profile?.full_name,
          email: user.email,
          avatar_url: profile?.avatar_url,
          verification_status: profile?.verification_status,
          slug: translationData?.slug || undefined
        })

        // Fetch posts count
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id)
        
        setPostsCount(count || 0)
      }
    }
    
    fetchUserData()
  }, [supabase, currentLocale])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTabChange = (tabId: MenuItemId) => {
    setActiveTab(tabId)
  }

  // ============================================================================
  // Render Content
  // ============================================================================

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            userProfile={userProfile}
            postsCount={postsCount}
            viewsCount={viewsCount}
            verificationStatus={verificationStatus}
            onNavigate={handleTabChange}
            locale={currentLocale}
          />
        )
      case 'profile':
        return <ProfilePage locale={currentLocale} />
      case 'posts':
        return <MyPostsPage locale={currentLocale} />
      default:
        return null
    }
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Main Content - with padding for right sidebar on desktop and bottom nav on mobile */}
      <main className="min-h-screen pb-16 lg:pb-0 lg:pr-14">
        {renderContent()}
      </main>
    </div>
  )
}
