'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
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

export default function CompanyDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'company-profile', label: 'Company Profile', icon: Building2 },
    { id: 'manage-specialists', label: 'Manage Specialists', icon: Users },
    { id: 'specialist-requests', label: 'Specialist Requests', icon: ClipboardList },
    { id: 'bio-approval', label: 'Bio Approval', icon: CheckCircle },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'categories', label: 'Categories', icon: Grid },
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
        return <SpecialistRequestsPage />
      case 'bio-approval':
        return (
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Bio Approval
            </h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ბიოგრაფიის დამტკიცება
            </p>
            {/* TODO: Bio Approval კომპონენტი */}
          </div>
        )
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
      case 'analytics':
        return (
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Analytics
            </h1>
            <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ანალიტიკა და სტატისტიკა
            </p>
            {/* TODO: Analytics კომპონენტი */}
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
