'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'
import PostsPage from '@/components/superadmindashboard/posts/PostsPage'
import { createClient } from '@/lib/supabase/client'

export default function ModeratorDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [draftCount, setDraftCount] = useState(0)

  // Fetch draft posts count
  useEffect(() => {
    const fetchDraftCount = async () => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
      
      if (!error && count !== null) {
        setDraftCount(count)
      }
    }

    fetchDraftCount()
    
    // Optional: Set up real-time subscription for draft count updates
    const supabase = createClient()
    const channel = supabase
      .channel('draft-posts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts', filter: 'status=eq.draft' },
        () => {
          fetchDraftCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'posts', label: 'Posts', icon: FileText, badge: draftCount },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Dashboard
            </h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მოდერატორის პანელი
            </p>
            
            {/* Dashboard Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Moderator Status Card */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                    <Shield className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Active</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Moderator Status</p>
                  </div>
                </div>
              </div>

              {/* Posts Card */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Managed Posts</p>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                    <LayoutDashboard className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Recent Actions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-4 p-6 rounded-xl border transition-all duration-200 ${
                    isDark 
                      ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Manage Posts</h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Review and moderate posts</p>
                  </div>
                </button>

                <div className={`flex items-center gap-4 p-6 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                    <Shield className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Moderator Role</h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Full content moderation access</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-8">
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-purple-500/5' : 'border-purple-500/20 bg-purple-500/5'}`}>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  Welcome to Moderator Dashboard
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  როგორც მოდერატორს, თქვენ გაქვთ სრული წვდომა პოსტების მართვაზე. 
                  შეგიძლიათ შეცვალოთ სტატუსი, განაახლოთ კონტენტი, და მართოთ ყველა პუბლიკაცია.
                </p>
              </div>
            </div>
          </div>
        )
      case 'posts':
        return <PostsPage />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}
      >
        {/* Header */}
        <div className={`flex h-16 items-center justify-between border-b px-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          {!isCollapsed && (
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Moderator Panel
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

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-purple-500/10 text-purple-600'
                    : isDark
                    ? 'text-white/60 hover:bg-white/5 hover:text-white'
                    : 'text-black/60 hover:bg-black/5 hover:text-black'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                )}
                {/* Draft Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    isCollapsed ? 'absolute -right-1 -top-1' : ''
                  } bg-red-500 text-white`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 ${isDark ? 'bg-black' : 'bg-white'}`}>
        {renderContent()}
      </main>
    </div>
  )
}
