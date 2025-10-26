'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
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
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react'
import PracticesPage from './practices/PracticesPage'
import ServicesPage from './services/ServicesPage'
import RequestsPage from './requests/RequestsPage'
import UsersPage from './users/UsersPage'
import SpecialistsPage from './specialists/SpecialistsPage'
import SoloSpecialistsPage from './solospecialists/SoloSpecialistsPage'
import CompaniesPage from './companies/CompaniesPage'
import AuthorsPage from './authors/AuthorsPage'
import ModeratorsPage from './moderators/ModeratorsPage'

export default function SuperAdminDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'practices', label: 'Practices', icon: Briefcase },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'specialists', label: 'Specialists', icon: Users },
    { id: 'solospecialists', label: 'Solo Specialists', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'authors', label: 'Authors', icon: FileText },
    { id: 'moderators', label: 'Moderators', icon: ShieldAlert },
    { id: 'requests', label: 'All Requests', icon: ClipboardList },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'slider', label: 'Slider', icon: Presentation },
    { id: 'legal-pages', label: 'Legal Pages', icon: FileStack },
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
              სისტემის სტატისტიკა და მონაცემები
            </p>
            {/* TODO: Dashboard კომპონენტი */}
          </div>
        )
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
        return (
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Posts
            </h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              პოსტების მართვა
            </p>
            {/* TODO: Posts მართვა */}
          </div>
        )
      case 'categories':
        return (
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Categories
            </h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              კატეგორიების მართვა
            </p>
            {/* TODO: Categories მართვა */}
          </div>
        )
      case 'slider':
        return (
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Slider
            </h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მთავარი გვერდის სლაიდერის მართვა
            </p>
            {/* TODO: Slider მართვა */}
          </div>
        )
      case 'legal-pages':
        return (
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Legal Pages
            </h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              იურიდიული გვერდების მართვა (Privacy, Terms, etc.)
            </p>
            {/* TODO: Legal Pages მართვა */}
          </div>
        )
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
              Legal Ge
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
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
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
