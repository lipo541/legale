'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
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

export default function SoloSpecialistDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'posts', label: 'My Posts', icon: FileText },
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
              სოლო სპეციალისტის პანელი
            </p>
            
            {/* Dashboard Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <User className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>1</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Active Profile</p>
                  </div>
                </div>
              </div>

              {/* Posts Card */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Published Posts</p>
                  </div>
                </div>
              </div>

              {/* Views Card */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                    <LayoutDashboard className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>0</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Profile Views</p>
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
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-4 p-6 rounded-xl border transition-all duration-200 ${
                    isDark 
                      ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                    <User className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Edit Profile</h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Update your information</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-4 p-6 rounded-xl border transition-all duration-200 ${
                    isDark 
                      ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>My Posts</h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Create and manage posts</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )
      case 'profile':
        return <ProfilePage />
      case 'posts':
        return <MyPostsPage />
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
      <main className={`flex-1 p-8 ${isDark ? 'bg-black' : 'bg-white'}`}>
        {renderContent()}
      </main>
    </div>
  )
}
