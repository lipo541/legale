'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  LayoutDashboard,
  FileText,
  PenTool
} from 'lucide-react'
import MyPostsPage from '@/components/common/MyPostsPage'

type Locale = 'ka' | 'en' | 'ru'

type MenuItemId = 'dashboard' | 'posts' | 'profile'

export default function AuthorDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = (pathname?.split('/')[1] as Locale) || 'ka'
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')

  // Sync activeTab with URL (like SuperAdminDashboard)
  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItemId | null
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Dashboard
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ავტორის პანელი
            </p>
            
            {/* Dashboard Stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Author Status Card */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <PenTool className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Active</p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Author Status</p>
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
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Published Posts</p>
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
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Total Views</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-4">
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-blue-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
                <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  Welcome to Author Dashboard
                </h3>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  როგორც ავტორს, თქვენ შეგიძლიათ შექმნათ და განათავსოთ სტატიები ქართულ ენაზე. 
                  სუპერადმინი დაამატებს თარგმანებს, კატეგორიებს და SEO ოპტიმიზაციას.
                </p>
              </div>
            </div>
          </div>
        )
      case 'posts':
        return <MyPostsPage locale={locale} />
      case 'profile':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Profile
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ავტორის პროფილი
            </p>
          </div>
        )
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
