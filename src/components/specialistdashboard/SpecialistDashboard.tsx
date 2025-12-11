'use client'

import { useState, useEffect, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  LayoutDashboard,
  User,
  FileText,
  LogOut
} from 'lucide-react'
import ProfilePage from '@/components/specialistdashboard/profile/ProfilePage'
import DashboardPage from '@/components/specialistdashboard/dashboard/DashboardPage'
import MyPostsPage from '@/components/common/MyPostsPage'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { specialistDashboardTranslations, Locale } from '@/translations/specialist-dashboard'

// ============================================================================
// Types
// ============================================================================

type MenuItemId = 'dashboard' | 'profile' | 'posts'

interface MenuItem {
  id: MenuItemId
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface UserProfile {
  full_name?: string
  email?: string
  avatar_url?: string
  verification_status?: string
  slug?: string
}

// ============================================================================
// Memoized Desktop Nav Item Component
// ============================================================================

const DesktopNavItem = memo(function DesktopNavItem({
  item,
  isActive,
  isExpanded,
  onClick,
  isDark,
  badge
}: {
  item: MenuItem
  isActive: boolean
  isExpanded: boolean
  onClick: () => void
  isDark: boolean
  badge?: number
}) {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex w-full items-center gap-3 rounded-xl px-3 py-3
        transition-all duration-300 ease-out
        ${isActive
          ? isDark ? 'text-white' : 'text-black'
          : isDark
            ? 'text-white/50 hover:text-white/80'
            : 'text-black/70 hover:text-black'
        }
      `}
    >
      {/* Active indicator - left gradient bar */}
      {isActive && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-blue-500 via-purple-500 to-violet-500 ${isDark ? 'shadow-lg shadow-purple-500/50' : ''}`} />
      )}
      
      {/* Active background glow */}
      {isActive && (
        <div className={`
          absolute inset-0 rounded-xl
          ${isDark ? 'opacity-20 bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-transparent' : 'opacity-100 bg-purple-500/10'}
        `} />
      )}
      
      {/* Icon with glow effect */}
      <div className="relative">
        <Icon className={`
          h-5 w-5 flex-shrink-0 transition-all duration-300
          ${isActive 
            ? `scale-110 ${isDark ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}` 
            : 'group-hover:scale-105'
          }
        `} />
        
        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50 animate-bounce">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      
      {/* Label with fade-in animation */}
      <span className={`
        font-medium text-sm whitespace-nowrap
        transition-all duration-300 delay-100
        ${isExpanded 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 -translate-x-2 w-0 overflow-hidden'
        }
      `}>
        {item.label}
      </span>
    </button>
  )
})

// ============================================================================
// Memoized Mobile Nav Item Component
// ============================================================================

const MobileNavItem = memo(function MobileNavItem({
  item,
  isActive,
  onClick,
  isDark,
  badge
}: {
  item: MenuItem
  isActive: boolean
  onClick: () => void
  isDark: boolean
  badge?: number
}) {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center gap-1 
        flex-1 py-2 px-1 transition-all duration-300
        ${isActive
          ? isDark ? 'text-white' : 'text-black'
          : isDark
            ? 'text-white/50'
            : 'text-black/70'
        }
      `}
    >
      {/* Active indicator - top gradient bar with pulse */}
      {isActive && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full bg-gradient-to-r from-blue-500 via-purple-500 to-violet-500 animate-pulse ${isDark ? 'shadow-lg shadow-purple-500/50' : ''}`} />
      )}
      
      {/* Icon container */}
      <div className="relative">
        <Icon className={`
          h-5 w-5 transition-all duration-300
          ${isActive 
            ? `scale-110 ${isDark ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}` 
            : 'group-active:scale-95'
          }
        `} />
        
        {/* Badge with bounce animation */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50 animate-bounce">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      
      {/* Label */}
      <span className={`
        text-[10px] font-medium transition-all duration-200
        ${isActive ? 'opacity-100' : 'opacity-70'}
      `}>
        {item.label}
      </span>
    </button>
  )
})

// ============================================================================
// Main Component
// ============================================================================

const STORAGE_KEY = 'specialist-dashboard-state'

export default function SpecialistDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const mainContentRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'
  const t = specialistDashboardTranslations[currentLocale] || specialistDashboardTranslations.ka
  
  // State
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [postsCount, setPostsCount] = useState(0)
  const [viewsCount, setViewsCount] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // ============================================================================
  // State Persistence with localStorage
  // ============================================================================

  // Load saved state on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
          const { tab, scrollY } = JSON.parse(savedState)
          const validTabs: MenuItemId[] = ['dashboard', 'profile', 'posts']
          if (tab && validTabs.includes(tab)) {
            setActiveTab(tab)
          }
          // Restore scroll position after a small delay to ensure content is rendered
          if (scrollY && scrollY > 0) {
            setTimeout(() => {
              if (mainContentRef.current) {
                mainContentRef.current.scrollTop = scrollY
              } else {
                window.scrollTo(0, scrollY)
              }
            }, 100)
          }
        }
      } catch (e) {
        console.error('Error loading dashboard state:', e)
      }
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Save state to localStorage
  const saveState = useCallback((tab: MenuItemId, scrollY?: number) => {
    if (typeof window !== 'undefined') {
      try {
        const state = { tab, scrollY: scrollY || 0 }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (e) {
        console.error('Error saving dashboard state:', e)
      }
    }
  }, [])

  // Save scroll position periodically
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        const scrollY = mainContentRef.current?.scrollTop || window.scrollY
        saveState(activeTab, scrollY)
      }, 300) // Debounce scroll saves
    }

    const mainContent = mainContentRef.current
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [activeTab, saveState])

  // ============================================================================
  // Effects
  // ============================================================================

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

  const handleTabChange = useCallback((tabId: MenuItemId) => {
    setActiveTab(tabId)
    // Reset scroll position when changing tabs
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0
    }
    window.scrollTo(0, 0)
    // Save new tab to localStorage
    saveState(tabId, 0)
  }, [saveState])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
  }, [supabase, router])

  // ============================================================================
  // Menu Items
  // ============================================================================

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'profile', label: t.profile, icon: User },
    ...(verificationStatus === 'verified' 
      ? [{ id: 'posts' as MenuItemId, label: t.myPosts, icon: FileText }] 
      : []
    ),
  ]

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
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      
      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden lg:flex min-h-screen">
        
        {/* Main Content - LEFT */}
        <main ref={mainContentRef} className="flex-1 overflow-auto p-6 lg:p-8 lg:pr-24">
          {renderContent()}
        </main>

        {/* Sidebar - RIGHT - Hover to Expand */}
        <aside
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
          className={`
            fixed right-0 top-16 h-[calc(100vh-64px)] z-40
            flex flex-col border-l
            transition-all duration-500 ease-out
            ${sidebarExpanded ? 'w-56' : 'w-16'}
            ${isDark 
              ? 'border-white/10 bg-black/70' 
              : 'border-black/10 bg-white/70'
            }
            backdrop-blur-2xl
          `}
        >
          {/* Profile Section - Clickable to navigate to public profile */}
          <Link 
            href={userProfile?.slug ? `/${currentLocale}/specialists/${userProfile.slug}` : '#'}
            className={`
              flex items-center gap-3 p-4 border-b cursor-pointer
              transition-all duration-200 hover:bg-white/5
              ${isDark ? 'border-white/10' : 'border-black/10'}
              ${!userProfile?.slug ? 'pointer-events-none' : ''}
            `}
            title={userProfile?.slug ? t.viewProfile : ''}
          >
            {/* Avatar */}
            <div className={`
              relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0
              bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center
              shadow-lg shadow-purple-500/30
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
            
            {/* Name & Email - Fade in */}
            <div className={`
              flex-1 min-w-0 overflow-hidden
              transition-all duration-300 delay-100
              ${sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}
            `}>
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                {userProfile?.full_name || t.specialist}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {userProfile?.email || ''}
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <DesktopNavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                isExpanded={sidebarExpanded}
                onClick={() => handleTabChange(item.id)}
                isDark={isDark}
                badge={item.badge}
              />
            ))}
          </nav>

          {/* Logout Button */}
          <div className={`
            p-3 border-t
            ${isDark ? 'border-white/10' : 'border-black/10'}
          `}>
            <button
              onClick={handleLogout}
              className={`
                group relative flex w-full items-center gap-3 rounded-xl px-3 py-3
                transition-all duration-300
                text-red-500 hover:text-red-400
              `}
            >
              <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className={`
                font-medium text-sm whitespace-nowrap
                transition-all duration-300 delay-100
                ${sidebarExpanded 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-2 w-0 overflow-hidden'
                }
              `}>
                {t.logout}
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="lg:hidden min-h-screen flex flex-col">
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 pb-24">
          {renderContent()}
        </main>

        {/* Bottom Navigation Bar - Glass Effect */}
        <nav className={`
          fixed bottom-0 left-0 right-0 z-50
          border-t
          ${isDark 
            ? 'border-white/10 bg-black/60' 
            : 'border-black/10 bg-white/60'
          }
          backdrop-blur-2xl
        `}>
          <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
            {menuItems.map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={() => handleTabChange(item.id)}
                isDark={isDark}
                badge={item.badge}
              />
            ))}
            
            {/* Logout Button - Separated */}
            <button
              onClick={handleLogout}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 text-red-500"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t.logout}</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
          }
          50% { 
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.8);
          }
        }
        
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  )
}
