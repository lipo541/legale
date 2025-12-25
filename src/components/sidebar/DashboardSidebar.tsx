'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { getClientSingleton } from '@/lib/supabase/client'
import { 
  LayoutDashboard,
  User,
  FileText,
  LogOut,
  Building2,
  Users,
  ClipboardList,
  Briefcase,
  Wrench,
  ShieldAlert,
  Grid,
  Presentation,
  FileStack,
  UserPlus,
  Bell,
  Menu,
  X,
  ChevronUp
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

type MenuItemId = string

interface MenuItem {
  id: MenuItemId
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  href?: string
}

interface UserProfile {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
  logo_url?: string
  role: string
  verification_status?: string
  slug?: string
}

type Locale = 'ka' | 'en' | 'ru'

// ============================================================================
// Translations
// ============================================================================

const translations = {
  ka: {
    dashboard: 'მთავარი',
    profile: 'პროფილი',
    myPosts: 'პოსტები',
    logout: 'გამოსვლა',
    companyProfile: 'კომპანია',
    manageSpecialists: 'სპეციალისტები',
    specialistRequests: 'მოთხოვნები',
    practices: 'პრაქტიკები',
    services: 'სერვისები',
    users: 'მომხმარებლები',
    specialists: 'სპეციალისტები',
    soloSpecialists: 'სოლო სპეც.',
    companies: 'კომპანიები',
    authors: 'ავტორები',
    moderators: 'მოდერატორები',
    requests: 'მოთხოვნები',
    posts: 'პოსტები',
    categories: 'კატეგორიები',
    slider: 'სლაიდერი',
    legalPages: 'გვერდები',
    newsbanner: 'ბანერი',
    createTeam: 'გუნდი',
    messages: 'შეტყობინებები',
    viewProfile: 'პროფილის ნახვა',
    specialist: 'სპეციალისტი',
    company: 'კომპანია',
    admin: 'ადმინისტრატორი',
  },
  en: {
    dashboard: 'Dashboard',
    profile: 'Profile',
    myPosts: 'My Posts',
    logout: 'Logout',
    companyProfile: 'Company',
    manageSpecialists: 'Specialists',
    specialistRequests: 'Requests',
    practices: 'Practices',
    services: 'Services',
    users: 'Users',
    specialists: 'Specialists',
    soloSpecialists: 'Solo Spec.',
    companies: 'Companies',
    authors: 'Authors',
    moderators: 'Moderators',
    requests: 'Requests',
    posts: 'Posts',
    categories: 'Categories',
    slider: 'Slider',
    legalPages: 'Legal',
    newsbanner: 'Banner',
    createTeam: 'Team',
    messages: 'Messages',
    viewProfile: 'View Profile',
    specialist: 'Specialist',
    company: 'Company',
    admin: 'Administrator',
  },
  ru: {
    dashboard: 'Главная',
    profile: 'Профиль',
    myPosts: 'Посты',
    logout: 'Выход',
    companyProfile: 'Компания',
    manageSpecialists: 'Специалисты',
    specialistRequests: 'Запросы',
    practices: 'Практики',
    services: 'Услуги',
    users: 'Пользователи',
    specialists: 'Специалисты',
    soloSpecialists: 'Соло спец.',
    companies: 'Компании',
    authors: 'Авторы',
    moderators: 'Модераторы',
    requests: 'Запросы',
    posts: 'Посты',
    categories: 'Категории',
    slider: 'Слайдер',
    legalPages: 'Страницы',
    newsbanner: 'Баннер',
    createTeam: 'Команда',
    messages: 'Сообщения',
    viewProfile: 'Профиль',
    specialist: 'Специалист',
    company: 'Компания',
    admin: 'Администратор',
  },
}

// ============================================================================
// Dashboard URL mapping by role
// ============================================================================

const getDashboardUrl = (role: string, locale: Locale): string => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return `/${locale}/admin`
    case 'MODERATOR':
      return `/${locale}/moderator-dashboard`
    case 'COMPANY':
      return `/${locale}/company-dashboard`
    case 'SOLO_SPECIALIST':
      return `/${locale}/solo-specialist-dashboard`
    case 'SPECIALIST':
      return `/${locale}/specialist-dashboard`
    case 'AUTHOR':
      return `/${locale}/author-dashboard`
    default:
      return `/${locale}`
  }
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
        group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5
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
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-blue-500 via-purple-500 to-violet-500 ${isDark ? 'shadow-lg shadow-purple-500/50' : ''}`} />
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
          h-4 w-4 flex-shrink-0 transition-all duration-300
          ${isActive 
            ? `scale-110 ${isDark ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}` 
            : 'group-hover:scale-105'
          }
        `} />
        
        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      
      {/* Label with fade-in animation */}
      <span className={`
        font-medium text-xs whitespace-nowrap
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
        group relative flex flex-col items-center justify-center gap-0.5 
        flex-1 py-1.5 px-1 transition-all duration-300
        ${isActive
          ? isDark ? 'text-white' : 'text-black'
          : isDark
            ? 'text-white/50'
            : 'text-black/70'
        }
      `}
    >
      {/* Active indicator - top gradient bar */}
      {isActive && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-gradient-to-r from-blue-500 via-purple-500 to-violet-500 ${isDark ? 'shadow-lg shadow-purple-500/50' : ''}`} />
      )}
      
      {/* Icon container */}
      <div className="relative">
        <Icon className={`
          h-4 w-4 transition-all duration-300
          ${isActive 
            ? `scale-110 ${isDark ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}` 
            : 'group-active:scale-95'
          }
        `} />
        
        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-3 min-w-[12px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      
      {/* Label */}
      <span className={`
        text-[9px] font-medium transition-all duration-200
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

export default function DashboardSidebar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getClientSingleton()
  
  // Use centralized auth context
  const { user: authUser, role: authRole, signOut } = useAuth()
  
  // Get current locale from pathname
  const currentLocale = (pathname?.split('/')[1] as Locale) || 'ka'
  const t = translations[currentLocale] || translations.ka
  
  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [draftPostsCount, setDraftPostsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null)



  // ============================================================================
  // Effects
  // ============================================================================

  // Fetch additional profile data when auth user changes
  useEffect(() => {
    const fetchUserData = async () => {
      // Use auth context user instead of fetching again
      if (!authUser) {
        setUserProfile(null)
        setLastFetchedUserId(null)
        setLoading(false)
        return
      }

      // Skip fetch if we already have data for this user (prevents tab switch re-fetching)
      if (lastFetchedUserId === authUser.id && userProfile) {
        return
      }

      setLoading(true)

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, logo_url, role, verification_status')
        .eq('id', authUser.id)
        .single()

      if (!profile) {
        setUserProfile(null)
        setLoading(false)
        return
      }

      // Fetch slug based on role
      let slug: string | undefined
      if (profile.role === 'SPECIALIST' || profile.role === 'SOLO_SPECIALIST') {
        const { data: translationData } = await supabase
          .from('specialist_translations')
          .select('slug')
          .eq('specialist_id', authUser.id)
          .eq('language', currentLocale)
          .single()
        slug = translationData?.slug
      } else if (profile.role === 'COMPANY') {
        const { data: translationData } = await supabase
          .from('company_translations')
          .select('slug')
          .eq('company_id', authUser.id)
          .eq('language', currentLocale)
          .single()
        slug = translationData?.slug
      }

      setUserProfile({
        id: authUser.id,
        full_name: profile.full_name,
        email: authUser.email,
        avatar_url: profile.avatar_url,
        logo_url: profile.logo_url,
        role: profile.role,
        verification_status: profile.verification_status,
        slug
      })

      // Fetch pending requests count for COMPANY
      if (profile.role === 'COMPANY') {
        const { count } = await supabase
          .from('access_requests')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', authUser.id)
          .eq('status', 'PENDING')
        setPendingRequestsCount(count || 0)
      }

      // Fetch draft posts count for ADMIN/SUPER_ADMIN
      if (profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN') {
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'draft')
        setDraftPostsCount(count || 0)
      }

      // Remember which user we fetched for
      setLastFetchedUserId(authUser.id)
      setLoading(false)
    }
    
    fetchUserData()
    // No more auth listener here - AuthProvider handles it centrally
  }, [supabase, currentLocale, authUser])

  // Sync activeTab with URL
  useEffect(() => {
    if (pathname) {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      if (tab) {
        setActiveTab(tab)
      } else if (pathname.includes('admin')) {
        setActiveTab('dashboard')
      } else if (pathname.includes('company-dashboard')) {
        setActiveTab('dashboard')
      } else if (pathname.includes('specialist-dashboard')) {
        setActiveTab('dashboard')
      } else if (pathname.includes('solo-specialist-dashboard')) {
        setActiveTab('dashboard')
      } else if (pathname.includes('moderator-dashboard')) {
        setActiveTab('dashboard')
      } else if (pathname.includes('author-dashboard')) {
        setActiveTab('dashboard')
      }
    }
  }, [pathname])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTabChange = useCallback((tabId: string) => {
    if (!userProfile) return
    
    setActiveTab(tabId)
    const dashboardUrl = getDashboardUrl(userProfile.role, currentLocale)
    router.push(`${dashboardUrl}?tab=${tabId}`)
  }, [router, userProfile, currentLocale])

  const handleLogout = useCallback(async () => {
    await signOut() // Use centralized signOut from AuthProvider
  }, [signOut])

  // ============================================================================
  // Menu Items by Role
  // ============================================================================

  const getMenuItems = useCallback((): MenuItem[] => {
    if (!userProfile) return []

    switch (userProfile.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return [
          { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
          { id: 'messages', label: t.messages, icon: Bell },
          { id: 'slider', label: t.slider, icon: Presentation },
          { id: 'practices', label: t.practices, icon: Briefcase },
          { id: 'services', label: t.services, icon: Wrench },
          { id: 'users', label: t.users, icon: Users },
          { id: 'specialists', label: t.specialists, icon: Users },
          { id: 'solospecialists', label: t.soloSpecialists, icon: Users },
          { id: 'companies', label: t.companies, icon: Building2 },
          { id: 'authors', label: t.authors, icon: FileText },
          { id: 'moderators', label: t.moderators, icon: ShieldAlert },
          { id: 'requests', label: t.requests, icon: ClipboardList },
          { id: 'posts', label: t.posts, icon: FileText, badge: draftPostsCount },
          { id: 'categories', label: t.categories, icon: Grid },
          { id: 'legal-pages', label: t.legalPages, icon: FileStack },
          { id: 'newsbanner', label: t.newsbanner, icon: Presentation },
          { id: 'create-team', label: t.createTeam, icon: UserPlus },
        ]
      
      case 'MODERATOR':
        return [
          { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
          { id: 'posts', label: t.posts, icon: FileText },
          { id: 'profile', label: t.profile, icon: User },
        ]
      
      case 'COMPANY':
        return [
          { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
          { id: 'company-profile', label: t.companyProfile, icon: Building2 },
          { id: 'manage-specialists', label: t.manageSpecialists, icon: Users },
          { id: 'specialist-requests', label: t.specialistRequests, icon: ClipboardList, badge: pendingRequestsCount },
          { id: 'posts', label: t.myPosts, icon: FileText },
        ]
      
      case 'SPECIALIST':
      case 'SOLO_SPECIALIST':
        const items: MenuItem[] = [
          { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
          { id: 'profile', label: t.profile, icon: User },
        ]
        if (userProfile.verification_status === 'verified') {
          items.push({ id: 'posts', label: t.myPosts, icon: FileText })
        }
        return items
      
      case 'AUTHOR':
        return [
          { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
          { id: 'posts', label: t.myPosts, icon: FileText },
          { id: 'profile', label: t.profile, icon: User },
        ]
      
      default:
        return []
    }
  }, [userProfile, t, pendingRequestsCount, draftPostsCount])

  // Get profile link based on role
  const getProfileLink = useCallback((): string | null => {
    if (!userProfile?.slug) return null
    
    if (userProfile.role === 'SPECIALIST' || userProfile.role === 'SOLO_SPECIALIST') {
      return `/${currentLocale}/specialists/${userProfile.slug}`
    } else if (userProfile.role === 'COMPANY') {
      return `/${currentLocale}/companies/${userProfile.slug}`
    }
    return null
  }, [userProfile, currentLocale])

  // Get avatar/logo
  const getAvatarUrl = (): string | undefined => {
    if (userProfile?.role === 'COMPANY') {
      return userProfile.logo_url
    }
    return userProfile?.avatar_url
  }

  // Get role label
  const getRoleLabel = (): string => {
    if (!userProfile) return ''
    switch (userProfile.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return t.admin
      case 'COMPANY':
        return t.company
      default:
        return t.specialist
    }
  }

  const menuItems = getMenuItems()
  const profileLink = getProfileLink()
  const avatarUrl = getAvatarUrl()

  // Don't render if no user or loading
  if (loading || !userProfile) {
    return null
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <>
      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`
          hidden lg:flex
          fixed right-0 top-16 h-[calc(100vh-64px)] z-40
          flex-col border-l
          transition-all duration-500 ease-out
          ${sidebarExpanded ? 'w-48' : 'w-14'}
          ${isDark 
            ? 'border-white/10 bg-black/70' 
            : 'border-black/10 bg-white/70'
          }
          backdrop-blur-2xl
        `}
      >
        {/* Profile Section */}
        <Link 
          href={profileLink || '#'}
          className={`
            flex items-center gap-3 p-3 border-b cursor-pointer
            transition-all duration-200 hover:bg-white/5
            ${isDark ? 'border-white/10' : 'border-black/10'}
            ${!profileLink ? 'pointer-events-none' : ''}
          `}
          title={profileLink ? t.viewProfile : ''}
        >
          {/* Avatar */}
          <div className={`
            relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0
            bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center
            shadow-lg shadow-purple-500/30
          `}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : userProfile.role === 'COMPANY' ? (
              <Building2 className="w-4 h-4 text-white" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          
          {/* Name & Role */}
          <div className={`
            flex-1 min-w-0 overflow-hidden
            transition-all duration-300 delay-100
            ${sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}
          `}>
            <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
              {userProfile.full_name || getRoleLabel()}
            </p>
            <p className={`text-[10px] truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {getRoleLabel()}
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
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
          p-2 border-t
          ${isDark ? 'border-white/10' : 'border-black/10'}
        `}>
          <button
            onClick={handleLogout}
            className={`
              group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5
              transition-all duration-300
              text-red-500 hover:text-red-400
            `}
          >
            <LogOut className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <span className={`
              font-medium text-xs whitespace-nowrap
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

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <div className={`
        lg:hidden
        fixed bottom-0 left-0 right-0 z-50
        border-t
        ${isDark 
          ? 'border-white/10 bg-black/95 backdrop-blur-lg' 
          : 'border-black/10 bg-white/95 backdrop-blur-lg'
        }
      `}>
        {/* Collapsed State - Quick access + expand button */}
        {!mobileMenuOpen && (
          <div className="flex items-center justify-between px-2 py-1.5 safe-area-pb">
            {/* Quick access items */}
            <div className="flex items-center gap-1 overflow-x-auto flex-1 hide-scrollbar">
              {menuItems.slice(0, menuItems.length > 5 ? 4 : menuItems.length).map((item) => (
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
            
            {/* Expand button - only show if more than 5 items */}
            {menuItems.length > 5 ? (
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
            ) : (
              /* Logout Button for small menus */
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 text-red-500"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-[9px] font-medium">{t.logout}</span>
              </button>
            )}
          </div>
        )}

        {/* Expanded State - Full menu grid */}
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
              {menuItems.map((item) => (
                <MobileNavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => {
                    handleTabChange(item.id)
                    setMobileMenuOpen(false)
                  }}
                  isDark={isDark}
                  badge={item.badge}
                />
              ))}
            </div>

            {/* Logout Button */}
            <div className={`p-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <button
                onClick={handleLogout}
                className={`
                  w-full flex items-center justify-center gap-2 rounded-lg py-2.5 
                  text-red-500 hover:bg-red-500/10 transition-colors
                `}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-medium">{t.logout}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}
