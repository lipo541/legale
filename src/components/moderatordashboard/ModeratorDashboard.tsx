'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  LayoutDashboard,
  FileText,
  Shield
} from 'lucide-react'
import PostsPage from '@/components/superadmindashboard/posts/PostsPage'
import { getClientSingleton } from '@/lib/supabase/client'
import CacheClearButton from '@/components/superadmindashboard/common/CacheClearButton'

type MenuItemId = 'dashboard' | 'posts' | 'profile'

export default function ModeratorDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')
  const [draftCount, setDraftCount] = useState(0)
  const isFetching = useRef(false)
  const mountedRef = useRef(true)

  // Sync activeTab with URL (like SuperAdminDashboard)
  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItemId | null
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Fetch draft posts count
  useEffect(() => {
    mountedRef.current = true
    const supabase = getClientSingleton()
    
    const fetchDraftCount = async () => {
      if (isFetching.current) return
      isFetching.current = true
      
      try {
        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'draft')
        
        if (!error && count !== null && mountedRef.current) {
          setDraftCount(count)
        }
      } finally {
        isFetching.current = false
      }
    }

    fetchDraftCount()
    
    return () => {
      mountedRef.current = false
    }
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Dashboard
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მოდერატორის პანელი
            </p>
            
            {/* Dashboard Stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Moderator Status Card */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                    <Shield className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Active</p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Moderator Status</p>
                  </div>
                </div>
              </div>

              {/* Posts Card */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <FileText className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{draftCount}</p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Draft Posts</p>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                    <LayoutDashboard className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>Recent Actions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-4">
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-purple-500/5' : 'border-purple-500/20 bg-purple-500/5'}`}>
                <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  Welcome to Moderator Dashboard
                </h3>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  როგორც მოდერატორს, თქვენ გაქვთ სრული წვდომა პოსტების მართვაზე. 
                  შეგიძლიათ შეცვალოთ სტატუსი, განაახლოთ კონტენტი, და მართოთ ყველა პუბლიკაცია.
                </p>
              </div>
            </div>
          </div>
        )
      case 'posts':
        return (
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Posts Management
              </h1>
              <CacheClearButton />
            </div>
            <PostsPage />
          </div>
        )
      case 'profile':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Profile
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მოდერატორის პროფილი
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
