'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { User, FileText, LayoutDashboard } from 'lucide-react'
import ProfilePage from './profile/ProfilePage'
import MyPostsPage from '@/components/common/MyPostsPage'
import { createClient } from '@/lib/supabase/client'

type Locale = 'ka' | 'en' | 'ru'

type MenuItemId = 'dashboard' | 'profile' | 'posts'

interface UserProfile {
  full_name?: string
  email?: string
  avatar_url?: string
  slug?: string
}

export default function SoloSpecialistDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = (pathname?.split('/')[1] as Locale) || 'ka'
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Sync activeTab with URL (like SuperAdminDashboard)
  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItemId | null
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
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
          .eq('language', locale)
          .single()

        setVerificationStatus(profile?.verification_status || null)
        setUserProfile({
          full_name: profile?.full_name,
          email: user.email || undefined,
          avatar_url: profile?.avatar_url,
          slug: translationData?.slug || undefined
        })
      }
    }
    
    fetchUserData()
  }, [locale])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Dashboard
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სოლო სპეციალისტის პანელი
            </p>
            
            {/* Dashboard Stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Profile Card */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <User className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>1</p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Profile</p>
                  </div>
                </div>
              </div>

              {/* Posts Card */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                    <FileText className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Posts</p>
                  </div>
                </div>
              </div>

              {/* Views Card */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                    <LayoutDashboard className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Views</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'profile':
        return <ProfilePage />
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
