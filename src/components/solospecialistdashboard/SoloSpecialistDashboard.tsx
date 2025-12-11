'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  User,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import ProfilePage from './profile/ProfilePage'
import CreatePostPage from './createpost/CreatePostPage'
import MyPostsPage from '@/components/common/MyPostsPage'
import { createClient } from '@/lib/supabase/client'

type Locale = 'ka' | 'en' | 'ru'

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
  const locale = (pathname?.split('/')[1] as Locale) || 'ka'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    ...(verificationStatus === 'verified' ? [{ id: 'posts', label: 'My Posts', icon: FileText }] : []),
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <h1 className={`text-2xl lg:text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Dashboard
            </h1>
            <p className={`mt-1 lg:mt-2 text-sm lg:text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სოლო სპეციალისტის პანელი
            </p>
            
            {/* Dashboard Stats */}
            <div className="mt-4 lg:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6">
              {/* Profile Card */}
              <div className={`rounded-lg lg:rounded-xl border p-4 lg:p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <User className={`w-5 h-5 lg:w-6 lg:h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>1</p>
                    <p className={`text-xs lg:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Profile</p>
                  </div>
                </div>
              </div>

              {/* Posts Card */}
              <div className={`rounded-lg lg:rounded-xl border p-4 lg:p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                    <FileText className={`w-5 h-5 lg:w-6 lg:h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-xs lg:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Posts</p>
                  </div>
                </div>
              </div>

              {/* Views Card */}
              <div className={`rounded-lg lg:rounded-xl border p-4 lg:p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                    <LayoutDashboard className={`w-5 h-5 lg:w-6 lg:h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-xs lg:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Views</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 lg:mt-8">
              <h2 className={`text-lg lg:text-2xl font-bold mb-3 lg:mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 lg:gap-4 p-4 lg:p-6 rounded-lg lg:rounded-xl border transition-all duration-200 active:scale-95 ${
                    isDark 
                      ? 'border-white/10 bg-white/5 active:bg-white/10' 
                      : 'border-black/10 bg-black/5 active:bg-black/10'
                  }`}
                >
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <User className={`w-5 h-5 lg:w-6 lg:h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-sm lg:text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Edit Profile</h3>
                    <p className={`text-xs lg:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Update info</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-3 lg:gap-4 p-4 lg:p-6 rounded-lg lg:rounded-xl border transition-all duration-200 active:scale-95 ${
                    isDark 
                      ? 'border-white/10 bg-white/5 active:bg-white/10' 
                      : 'border-black/10 bg-black/5 active:bg-black/10'
                  }`}
                >
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                    <FileText className={`w-5 h-5 lg:w-6 lg:h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-sm lg:text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>My Posts</h3>
                    <p className={`text-xs lg:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Manage posts</p>
                  </div>
                </button>
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
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside
        className={`hidden lg:flex relative flex-col border-r transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}
      >
        {/* Header */}
        <div className={`flex h-16 items-center justify-between border-b px-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          {!isCollapsed && (
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Specialist Panel
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`rounded-lg p-2 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
            ) : (
              <ChevronLeft className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
            )}
          </button>
        </div>

        {/* Profile Section - Clickable */}
        <Link 
          href={userProfile?.slug ? `/${locale}/specialists/${userProfile.slug}` : '#'}
          className={`
            flex items-center gap-3 p-4 border-b cursor-pointer
            transition-all duration-200 hover:bg-white/5
            ${isDark ? 'border-white/10' : 'border-black/10'}
            ${!userProfile?.slug ? 'pointer-events-none' : ''}
          `}
        >
          {/* Avatar */}
          <div className={`
            relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0
            bg-gradient-to-br from-emerald-500 to-teal-600
            flex items-center justify-center
            shadow-lg shadow-emerald-500/30
          `}>
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          
          {/* Name & Email */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                {userProfile?.full_name || 'სპეციალისტი'}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {userProfile?.email || ''}
              </p>
            </div>
          )}
        </Link>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500/10 text-emerald-600'
                    : isDark
                    ? 'text-white/60 hover:bg-white/5 hover:text-white'
                    : 'text-black/60 hover:bg-black/5 hover:text-black'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 pb-20 lg:pb-8 px-4 py-4 lg:p-8 ${isDark ? 'bg-black' : 'bg-white'}`}>
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 border-t backdrop-blur-lg z-50 ${
        isDark ? 'border-white/10 bg-black/80' : 'border-black/10 bg-white/80'
      }`}>
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px] ${
                  isActive
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500/10 text-emerald-600'
                    : isDark
                    ? 'text-white/60 active:bg-white/5'
                    : 'text-black/60 active:bg-black/5'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
