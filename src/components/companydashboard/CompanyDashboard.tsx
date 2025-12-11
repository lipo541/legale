'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  CheckCircle,
  FileText,
  BarChart3,
  Grid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import CompanyProfilePage from './companyprofile/CompanyProfilePage'
import ManageSpecialistsPage from './specialists/ManageSpecialistsPage'
import SpecialistRequestsPage from './requests/SpecialistRequestsPage'
import MyPostsPage from '@/components/common/MyPostsPage'

type Locale = 'ka' | 'en' | 'ru'

interface CompanyProfile {
  full_name?: string
  email?: string
  logo_url?: string
  slug?: string
}

export default function CompanyDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pathname = usePathname()
  const locale = (pathname?.split('/')[1] as Locale) || 'ka'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)

  useEffect(() => {
    fetchPendingRequestsCount()
    fetchCompanyProfile()
  }, [locale])

  const fetchCompanyProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, logo_url')
      .eq('id', user.id)
      .single()

    // Fetch slug from company_translations for current locale
    const { data: translationData } = await supabase
      .from('company_translations')
      .select('slug')
      .eq('company_id', user.id)
      .eq('language', locale)
      .single()

    setCompanyProfile({
      full_name: profile?.full_name,
      email: user.email || undefined,
      logo_url: profile?.logo_url,
      slug: translationData?.slug || undefined
    })
  }

  const fetchPendingRequestsCount = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', user.id)
      .eq('status', 'PENDING')

    setPendingRequestsCount(count || 0)
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'company-profile', label: 'Company Profile', icon: Building2 },
    { id: 'manage-specialists', label: 'Manage Specialists', icon: Users },
    { id: 'specialist-requests', label: 'Specialist Requests', icon: ClipboardList, badge: pendingRequestsCount },
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
              კომპანიის სტატისტიკა და მონაცემები
            </p>
            {/* TODO: Dashboard კომპონენტი */}
          </div>
        )
      case 'company-profile':
        return <CompanyProfilePage />
      case 'manage-specialists':
        return <ManageSpecialistsPage />
      case 'specialist-requests':
        return <SpecialistRequestsPage onRequestUpdate={fetchPendingRequestsCount} />
      case 'posts':
        return <MyPostsPage locale={locale} />
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
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Company Panel
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

        {/* Company Profile Section - Clickable */}
        <Link 
          href={companyProfile?.slug ? `/${locale}/companies/${companyProfile.slug}` : '#'}
          className={`
            flex items-center gap-3 p-4 border-b cursor-pointer
            transition-all duration-200 hover:bg-white/5
            ${isDark ? 'border-white/10' : 'border-black/10'}
            ${!companyProfile?.slug ? 'pointer-events-none' : ''}
          `}
        >
          {/* Logo */}
          <div className={`
            relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0
            bg-gradient-to-br from-emerald-500 to-green-600
            flex items-center justify-center
            shadow-lg shadow-emerald-500/30
          `}>
            {companyProfile?.logo_url ? (
              <img 
                src={companyProfile.logo_url} 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-5 h-5 text-white" />
            )}
          </div>
          
          {/* Name & Email */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                {companyProfile?.full_name || 'კომპანია'}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {companyProfile?.email || ''}
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
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-red-500/20 text-red-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  )
}
