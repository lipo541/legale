'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard,
  Briefcase,
  Wrench,
  Users,
  Building2,
  ClipboardList,
  FileText,
  Grid,
  Presentation,
  FileStack,
  ShieldAlert,
  UserPlus,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Menu,
  X,
  Trash2
} from 'lucide-react'

// ============================================================================
// Lazy Loaded Pages
// ============================================================================
import PracticesPage from './practices/PracticesPage'
import ServicesPage from './services/ServicesPage'
import RequestsPage from './requests/RequestsPage'
import UsersPage from './users/UsersPage'
import SpecialistsPage from './specialists/SpecialistsPage'
import SoloSpecialistsPage from './solospecialists/SoloSpecialistsPage'
import CompaniesPage from './companies/CompaniesPage'
import AuthorsPage from './authors/AuthorsPage'
import ModeratorsPage from './moderators/ModeratorsPage'
import PostsPage from './posts/PostsPage'
import NewsBannerPage from './newsbanner/NewsBannerPage'
import TeamCreatePage from './teamcreate/TeamCreatePage'
import MessagesPage from './messages/MessagesPage'
import CategoryAdd from './categories/CategoryAdd'
import LegalPagesPage from './legalpages/LegalPagesPage'
import CacheClearButton from './common/CacheClearButton'

// ============================================================================
// Types
// ============================================================================

type MenuItemId = 
  | 'dashboard' | 'messages' | 'practices' | 'services' 
  | 'users' | 'specialists' | 'solospecialists' | 'companies'
  | 'authors' | 'moderators' | 'requests' | 'posts'
  | 'categories' | 'slider' | 'legal-pages' | 'newsbanner' | 'create-team'

interface MenuItem {
  id: MenuItemId
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

// ============================================================================
// Constants
// ============================================================================

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'messages', label: 'Messages', icon: Bell },
  { id: 'practices', label: 'Practices', icon: Briefcase },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'specialists', label: 'Specialists', icon: Users },
  { id: 'solospecialists', label: 'Solo Spec', icon: Users },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'authors', label: 'Authors', icon: FileText },
  { id: 'moderators', label: 'Moderators', icon: ShieldAlert },
  { id: 'requests', label: 'Requests', icon: ClipboardList },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'categories', label: 'Categories', icon: Grid },
  { id: 'slider', label: 'Slider', icon: Presentation },
  { id: 'legal-pages', label: 'Legal Pages', icon: FileStack },
  { id: 'newsbanner', label: 'Banner', icon: Presentation },
  { id: 'create-team', label: 'Create Team', icon: UserPlus },
]

// ============================================================================
// Memoized Components
// ============================================================================

const NavItem = memo(function NavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
  isDark,
  badge
}: {
  item: MenuItem
  isActive: boolean
  isCollapsed: boolean
  onClick: () => void
  isDark: boolean
  badge?: number
}) {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={`
        relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium
        transition-all duration-200
        ${isActive
          ? isDark
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-emerald-500/10 text-emerald-600'
          : isDark
            ? 'text-white/60 hover:bg-white/5 hover:text-white'
            : 'text-black/60 hover:bg-black/5 hover:text-black'
        }
      `}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && (
        <span className="flex-1 text-left truncate">{item.label}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className={`
          flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold
          bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-sm shadow-orange-500/30
          ${isCollapsed ? 'absolute -right-0.5 -top-0.5' : ''}
        `}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
})

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
        relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 
        transition-all duration-200 min-w-[60px]
        ${isActive
          ? isDark
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-emerald-500/10 text-emerald-600'
          : isDark
            ? 'text-white/60 hover:bg-white/5 hover:text-white'
            : 'text-black/60 hover:bg-black/5 hover:text-black'
        }
      `}
    >
      <Icon className="h-4 w-4" />
      <span className="text-[9px] font-medium truncate max-w-[56px]">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-1 text-[8px] font-bold text-white shadow-sm shadow-orange-500/30">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export default function SuperAdminDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // State
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [draftCount, setDraftCount] = useState(0)
  const [practicesDraftCount, setPracticesDraftCount] = useState(0)
  const [servicesDraftCount, setServicesDraftCount] = useState(0)

  // ============================================================================
  // Effects
  // ============================================================================

  // Fetch draft counts for posts, practices, and services
  useEffect(() => {
    const fetchDraftCounts = async () => {
      // Fetch posts draft count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
      
      if (postsCount !== null) {
        setDraftCount(postsCount)
      }

      // Fetch practices draft count
      const { count: practicesCount } = await supabase
        .from('practices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
      
      if (practicesCount !== null) {
        setPracticesDraftCount(practicesCount)
      }

      // Fetch services draft count
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
      
      if (servicesCount !== null) {
        setServicesDraftCount(servicesCount)
      }
    }

    fetchDraftCounts()
    
    // Real-time subscriptions
    const postsChannel = supabase
      .channel('draft-posts-changes-admin')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchDraftCounts()
      )
      .subscribe()

    const practicesChannel = supabase
      .channel('draft-practices-changes-admin')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'practices' },
        () => fetchDraftCounts()
      )
      .subscribe()

    const servicesChannel = supabase
      .channel('draft-services-changes-admin')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'services' },
        () => fetchDraftCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postsChannel)
      supabase.removeChannel(practicesChannel)
      supabase.removeChannel(servicesChannel)
    }
  }, [supabase])

  // Sync activeTab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItemId | null
    if (tab && MENU_ITEMS.some(item => item.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTabChange = useCallback((tabId: MenuItemId) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Get menu items with badges
  const menuItemsWithBadges = MENU_ITEMS.map(item => ({
    ...item,
    badge: item.id === 'posts' 
      ? draftCount 
      : item.id === 'practices' 
        ? practicesDraftCount 
        : item.id === 'services' 
          ? servicesDraftCount 
          : undefined
  }))

  // ============================================================================
  // Render Content
  // ============================================================================

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Dashboard
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სისტემის სტატისტიკა და მონაცემები
            </p>
            {/* TODO: Dashboard stats */}
          </div>
        )
      case 'messages':
        return <MessagesPage />
      case 'practices':
        return <PracticesPage />
      case 'services':
        return <ServicesPage />
      case 'users':
        return <UsersPage />
      case 'specialists':
        return <SpecialistsPage />
      case 'solospecialists':
        return <SoloSpecialistsPage />
      case 'companies':
        return <CompaniesPage />
      case 'authors':
        return <AuthorsPage />
      case 'moderators':
        return <ModeratorsPage />
      case 'requests':
        return <RequestsPage />
      case 'posts':
        return <PostsPage />
      case 'categories':
        return <CategoryAdd />
      case 'slider':
        return (
          <div className="p-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Slider
            </h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მთავარი გვერდის სლაიდერის მართვა
            </p>
          </div>
        )
      case 'legal-pages':
        return <LegalPagesPage />
      case 'newsbanner':
        return <NewsBannerPage />
      case 'create-team':
        return <TeamCreatePage />
      default:
        return null
    }
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-black' : 'bg-white'}`}>
      
      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden lg:flex min-h-screen">
        
        {/* Main Content - LEFT */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>

        {/* Sidebar - RIGHT */}
        <aside
          className={`
            relative flex flex-col border-l transition-all duration-300
            ${sidebarCollapsed ? 'w-14' : 'w-52'}
            ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}
          `}
        >
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              absolute -left-3 top-4 z-10 flex h-6 w-6 items-center justify-center
              rounded-full border shadow-sm transition-colors
              ${isDark 
                ? 'border-white/10 bg-black hover:bg-white/10' 
                : 'border-black/10 bg-white hover:bg-black/5'
              }
            `}
          >
            {sidebarCollapsed ? (
              <ChevronLeft className={`h-3.5 w-3.5 ${isDark ? 'text-white' : 'text-black'}`} />
            ) : (
              <ChevronRight className={`h-3.5 w-3.5 ${isDark ? 'text-white' : 'text-black'}`} />
            )}
          </button>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 pt-4">
            {menuItemsWithBadges.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                isCollapsed={sidebarCollapsed}
                onClick={() => handleTabChange(item.id)}
                isDark={isDark}
                badge={item.badge}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className={`border-t p-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            {sidebarCollapsed ? (
              <button
                className={`
                  w-full flex items-center justify-center rounded-lg p-2
                  ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}
                `}
                title="Clear Cache"
              >
                <Trash2 className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            ) : (
              <CacheClearButton />
            )}
          </div>
        </aside>
      </div>

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="lg:hidden min-h-screen flex flex-col">
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-16">
          {renderContent()}
        </main>

        {/* Bottom Navigation Bar */}
        <div className={`
          fixed bottom-0 left-0 right-0 z-40 border-t
          ${isDark ? 'border-white/10 bg-black/95 backdrop-blur-lg' : 'border-black/10 bg-white/95 backdrop-blur-lg'}
        `}>
          {/* Collapsed State - Just a handle */}
          {!mobileMenuOpen && (
            <div className="flex items-center justify-between px-2 py-1.5">
              {/* Quick access items */}
              <div className="flex items-center gap-1 overflow-x-auto flex-1 hide-scrollbar">
                {menuItemsWithBadges.slice(0, 5).map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    onClick={() => handleTabChange(item.id)}
                    isDark={isDark}
                    badge={item.badge}
                  />
                ))}
              </div>
              
              {/* Expand button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`
                  flex items-center gap-1 rounded-lg px-3 py-2 ml-2
                  ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}
                `}
              >
                <Menu className="h-4 w-4" />
                <ChevronUp className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Expanded State - Full menu */}
          {mobileMenuOpen && (
            <div className={`
              max-h-[70vh] overflow-y-auto
              ${isDark ? 'bg-black' : 'bg-white'}
            `}>
              {/* Header */}
              <div className={`
                sticky top-0 flex items-center justify-between px-3 py-2 border-b
                ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}
              `}>
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  ნავიგაცია
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-1 rounded-lg px-2 py-1 text-xs
                    ${isDark ? 'text-white/60 hover:bg-white/10' : 'text-black/60 hover:bg-black/10'}
                  `}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Grid of all items */}
              <div className="grid grid-cols-4 gap-1 p-2">
                {menuItemsWithBadges.map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    onClick={() => handleTabChange(item.id)}
                    isDark={isDark}
                    badge={item.badge}
                  />
                ))}
              </div>

              {/* Cache Clear */}
              <div className={`p-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <CacheClearButton />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Hide scrollbar styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
