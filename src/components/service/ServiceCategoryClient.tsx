'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'
import { ChevronRight, Folder, Clock, ArrowRight, FileText, Sparkles } from 'lucide-react'
import { useState, useMemo } from 'react'
import Breadcrumb from '@/components/common/Breadcrumb'
import SkipLink from '@/components/common/SkipLink'
import EmptyState from '@/components/common/EmptyState'
import ViewModeToggle from '@/components/common/ViewModeToggle'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Service {
  id: string
  title: string
  slug: string
  description: string
  imageUrl: string
  imageAlt: string
  readingTime: number
  practiceId: string
  categoryId: string | null
  createdAt: string
}

interface BreadcrumbItem {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface SubcategoryMapItem {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

interface Translation {
  language: string
  slug: string
  name: string
}

export interface ServiceCategoryClientProps {
  category: {
    id: string
    name: string
    description: string | null
    slug: string
    parentId: string | null
  }
  services: Service[]
  locale: string
  parentBreadcrumbs: BreadcrumbItem[]
  siblingCategories: Category[]
  childCategories: Category[]
  subcategoryMap: SubcategoryMapItem[]
  practiceMap: Record<string, { title: string; slug: string }>
  allTranslations: Translation[]
}

// ============================================================================
// Translations
// ============================================================================

const translations = {
  ka: {
    backToHome: 'მთავარი',
    categories: 'კატეგორიები',
    services: 'სერვისები',
    servicesInCategory: 'სერვისი ამ კატეგორიაში',
    noServices: 'ამ კატეგორიაში სერვისები არ მოიძებნა',
    noServicesDesc: 'მალე დაემატება ახალი სერვისები',
    readMore: 'ვრცლად',
    minRead: 'წთ წასაკითხად',
    subcategories: 'ქვეკატეგორიები',
    relatedCategories: 'მსგავსი კატეგორიები',
    viewAll: 'ყველას ნახვა',
    practice: 'პრაქტიკა',
    totalServices: 'სერვისი',
  },
  en: {
    backToHome: 'Home',
    categories: 'Categories',
    services: 'Services',
    servicesInCategory: 'service in this category',
    noServices: 'No services found',
    noServicesDesc: 'New services will be added soon',
    readMore: 'Read more',
    minRead: 'min read',
    subcategories: 'Subcategories',
    relatedCategories: 'Related Categories',
    viewAll: 'View all',
    practice: 'Practice',
    totalServices: 'services',
  },
  ru: {
    backToHome: 'Главная',
    categories: 'Категории',
    services: 'Услуги',
    servicesInCategory: 'услуга в этой категории',
    noServices: 'Услуги не найдены',
    noServicesDesc: 'Новые услуги будут добавлены в ближайшее время',
    readMore: 'Подробнее',
    minRead: 'мин чтения',
    subcategories: 'Подкатегории',
    relatedCategories: 'Похожие категории',
    viewAll: 'Смотреть все',
    practice: 'Практика',
    totalServices: 'услуг',
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function truncateText(text: string, maxLength: number): string {
  const stripped = stripHtml(text)
  if (stripped.length <= maxLength) return stripped
  return stripped.slice(0, maxLength).trim() + '...'
}

// ============================================================================
// Main Component
// ============================================================================

export default function ServiceCategoryClient({
  category,
  services,
  locale,
  parentBreadcrumbs,
  siblingCategories,
  childCategories,
  subcategoryMap,
  practiceMap,
}: ServiceCategoryClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = translations[locale as keyof typeof translations] || translations.ka
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)

  // Filter services by selected subcategory
  const filteredServices = useMemo(() => {
    if (!selectedSubcategory) return services
    return services.filter(s => s.categoryId === selectedSubcategory)
  }, [services, selectedSubcategory])

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: t.backToHome, href: `/${locale}` },
    { label: t.categories, href: `/${locale}/category` },
    ...parentBreadcrumbs.map(crumb => ({
      label: crumb.name,
      href: `/${locale}/category/${encodeURIComponent(crumb.slug)}`
    })),
    { label: category.name }
  ]

  return (
    <div className="min-h-screen py-8 md:py-12 lg:py-16">
      {/* Skip to Main Content Link */}
      <SkipLink target="#main-content" />

      <div className="mx-auto px-6 sm:px-8 lg:px-10 max-w-[1200px]">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl backdrop-blur-md ${
                  isDark ? 'bg-white/10' : 'bg-black/5'
                }`}>
                  <Folder className={`h-6 w-6 ${isDark ? 'text-white/70' : 'text-black/70'}`} />
                </div>
                <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {category.name}
                </h1>
              </div>
              
              {category.description && (
                <p className={`text-sm md:text-base max-w-2xl mb-4 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  {stripHtml(category.description)}
                </p>
              )}

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${
                isDark ? 'bg-black/40 border-white/10 text-white/80' : 'bg-white/20 border-white/30 text-black/80 shadow-xl'
              }`}>
                <FileText className="h-4 w-4" />
                <span className="font-medium">{services.length}</span>
                <span className="text-sm">{t.servicesInCategory}</span>
              </div>
            </div>

            {/* Stats Badge & View Mode */}
            <div className="flex items-center gap-4">
              <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
              }`}>
                <Sparkles className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                <div className="text-right">
                  <div className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    {t.totalServices}
                  </div>
                  <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {services.length}
                  </div>
                </div>
              </div>
              
              <ViewModeToggle view={viewMode} onChange={(value) => setViewMode(value as 'grid' | 'list')} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div id="main-content" tabIndex={-1} className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 space-y-6">
            {/* Child Categories Filter */}
            {childCategories.length > 0 && (
              <div className={`p-4 rounded-xl border backdrop-blur-md ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
              }`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                  {t.subcategories}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                      !selectedSubcategory
                        ? isDark 
                          ? 'bg-white/20 text-white backdrop-blur-md' 
                          : 'bg-black/10 text-black'
                        : isDark 
                          ? 'text-white/70 hover:bg-white/10' 
                          : 'text-black/70 hover:bg-black/5'
                    }`}
                  >
                    {t.viewAll} ({services.length})
                  </button>
                  {childCategories.map(child => {
                    const count = services.filter(s => s.categoryId === child.id).length
                    return (
                      <button
                        key={child.id}
                        onClick={() => setSelectedSubcategory(child.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                          selectedSubcategory === child.id
                            ? isDark 
                              ? 'bg-white/20 text-white backdrop-blur-md' 
                              : 'bg-black/10 text-black'
                            : isDark 
                              ? 'text-white/70 hover:bg-white/10' 
                              : 'text-black/70 hover:bg-black/5'
                        }`}
                      >
                        {child.name} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sibling Categories */}
            {siblingCategories.length > 0 && (
              <div className={`p-4 rounded-xl border backdrop-blur-md ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
              }`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                  {t.relatedCategories}
                </h3>
                <div className="space-y-2">
                  {siblingCategories.map(sibling => (
                    <Link
                      key={sibling.id}
                      href={`/${locale}/category/${encodeURIComponent(sibling.slug)}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                        isDark 
                          ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                          : 'text-black/70 hover:bg-black/5 hover:text-black'
                      }`}
                    >
                      <Folder className="h-4 w-4" />
                      {sibling.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Services Grid/List */}
          <div className="flex-1">
            {filteredServices.length === 0 ? (
              <EmptyState
                type="no-data"
                title={t.noServices}
                description={t.noServicesDesc}
              />
            ) : (
              <div className={`grid ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8'
                  : 'grid-cols-1 gap-3 md:gap-4'
              }`}>
                {filteredServices.map(service => (
                  viewMode === 'grid' ? (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      locale={locale} 
                      isDark={isDark} 
                      t={t}
                      practiceMap={practiceMap}
                      subcategoryMap={subcategoryMap}
                    />
                  ) : (
                    <ServiceListItem 
                      key={service.id} 
                      service={service} 
                      locale={locale} 
                      isDark={isDark} 
                      t={t}
                      practiceMap={practiceMap}
                      subcategoryMap={subcategoryMap}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Service Card Component (Grid View)
// ============================================================================

function ServiceCard({ 
  service, 
  locale, 
  isDark, 
  t,
  practiceMap,
  subcategoryMap
}: { 
  service: Service
  locale: string
  isDark: boolean
  t: typeof translations.ka
  practiceMap: Record<string, { title: string; slug: string }>
  subcategoryMap: SubcategoryMapItem[]
}) {
  const practice = practiceMap[service.practiceId]
  const subcategory = subcategoryMap.find(s => s.id === service.categoryId)

  return (
    <Link
      href={`/${locale}/services/${encodeURIComponent(service.slug)}`}
      className={`group flex flex-col h-full rounded-lg overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${
        isDark
          ? 'bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 hover:shadow-2xl'
          : 'bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl'
      }`}
    >
      {/* Image */}
      {service.imageUrl && (
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={getOptimizedImageUrl(service.imageUrl, imagePresets.serviceCard)}
            alt={service.imageAlt || service.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Subcategory Badge */}
          {subcategory && (
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-md text-xs font-medium backdrop-blur-md ${
                isDark ? 'bg-black/60 text-white border border-white/10' : 'bg-white/90 text-black'
              }`}>
                {subcategory.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 md:p-5 flex flex-col flex-1">
        <h3 className={`font-semibold mb-2 line-clamp-2 transition-colors ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          {service.title}
        </h3>

        <p className={`text-sm mb-4 line-clamp-2 flex-1 ${
          isDark ? 'text-white/60' : 'text-black/60'
        }`}>
          {truncateText(service.description, 120)}
        </p>

        <div className="flex items-center justify-between mt-auto">
          {practice && (
            <span className={`text-xs px-2 py-1 rounded-md ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/70'
            }`}>
              {practice.title}
            </span>
          )}
          
          {service.readingTime > 0 && (
            <span className={`flex items-center gap-1 text-xs ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}>
              <Clock className="h-3 w-3" />
              {service.readingTime} {t.minRead}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ============================================================================
// Service List Item Component (List View)
// ============================================================================

function ServiceListItem({ 
  service, 
  locale, 
  isDark, 
  t,
  practiceMap,
  subcategoryMap
}: { 
  service: Service
  locale: string
  isDark: boolean
  t: typeof translations.ka
  practiceMap: Record<string, { title: string; slug: string }>
  subcategoryMap: SubcategoryMapItem[]
}) {
  const practice = practiceMap[service.practiceId]
  const subcategory = subcategoryMap.find(s => s.id === service.categoryId)

  return (
    <Link
      href={`/${locale}/services/${encodeURIComponent(service.slug)}`}
      className={`group flex items-center gap-4 md:gap-6 rounded-lg p-4 md:p-5 backdrop-blur-md transition-all duration-300 ${
        isDark
          ? 'bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20'
          : 'bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-xl'
      }`}
    >
      {/* Image */}
      {service.imageUrl && (
        <div className="relative w-28 h-20 md:w-36 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={getOptimizedImageUrl(service.imageUrl, imagePresets.cardThumbnail)}
            alt={service.imageAlt || service.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold mb-1 line-clamp-1 transition-colors ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          {service.title}
        </h3>
        
        <p className={`text-sm mb-2 line-clamp-2 ${
          isDark ? 'text-white/60' : 'text-black/60'
        }`}>
          {truncateText(service.description, 180)}
        </p>

        <div className="flex items-center flex-wrap gap-2">
          {practice && (
            <span className={`text-xs px-2 py-1 rounded-md ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/70'
            }`}>
              {t.practice}: {practice.title}
            </span>
          )}
          {subcategory && (
            <span className={`text-xs px-2 py-1 rounded-md ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/70'
            }`}>
              {subcategory.name}
            </span>
          )}
          {service.readingTime > 0 && (
            <span className={`flex items-center gap-1 text-xs ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}>
              <Clock className="h-3 w-3" />
              {service.readingTime} {t.minRead}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1 ${
        isDark ? 'text-white/40' : 'text-black/40'
      }`} />
    </Link>
  )
}
