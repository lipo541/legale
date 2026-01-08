'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'

// ============================================================================
// Lazy Loaded Pages
// ============================================================================
import PracticesPage from './practices/PracticesPage'
import ServicesPage from './services/ServicesPage'
import RequestsPage from './requests/RequestsPage'
import UsersPage from './users/UsersPage'
import CompanySpecialistsPage from './specialists/CompanySpecialistsPage'
import SoloSpecialistsPage from './solospecialists/SoloSpecialistsPage'
import CompaniesPage from './companies/CompaniesPage'
import AuthorsPage from './authors/AuthorsPage'
import ModeratorsPage from './moderators/ModeratorsPage'
import PostsPage from './posts/PostsPage'
import NewsBannerPage from './newsbanner/NewsBannerPage'
import TeamCreatePage from './teamcreate/TeamCreatePage'
import MessagesPage from './messages/MessagesPage'
import CategoryAdd from './categories/CategoryAdd'
import ServiceCategoryAdd from './services/ServiceCategoryAdd'
import LegalPagesPage from './legalpages/LegalPagesPage'
import { HeroManager } from './hero'

// ============================================================================
// Types
// ============================================================================

type MenuItemId = 
  | 'dashboard' | 'messages' | 'practices' | 'services' 
  | 'users' | 'specialists' | 'solospecialists' | 'companies'
  | 'authors' | 'moderators' | 'requests' | 'posts'
  | 'categories' | 'service-categories' | 'slider' | 'legal-pages' | 'newsbanner' | 'create-team'

// ============================================================================
// Main Component
// ============================================================================

export default function SuperAdminDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const searchParams = useSearchParams()

  // State
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard')

  // ============================================================================
  // Effects
  // ============================================================================

  // Sync activeTab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as MenuItemId | null
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

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
        return <CompanySpecialistsPage />
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
      case 'service-categories':
        return <ServiceCategoryAdd />
      case 'slider':
        return <HeroManager />
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
      {/* Main Content */}
      <main className="min-h-screen pb-16 lg:pb-0 lg:pr-14">
        {renderContent()}
      </main>
    </div>
  )
}
