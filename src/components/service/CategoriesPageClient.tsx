'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Command, FolderOpen, ChevronRight, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Breadcrumb from '@/components/common/Breadcrumb'
import SkipLink from '@/components/common/SkipLink'
import EmptyState from '@/components/common/EmptyState'
import ViewModeToggle from '@/components/common/ViewModeToggle'

// Types
interface CategoryTranslation {
  name: string
  slug: string
}

interface CategoryData {
  id: string
  parent_id: string | null
  sort_order: number
  is_active: boolean
  service_category_translations: CategoryTranslation[]
  services: { count: number }[]
}

interface CategoriesPageClientProps {
  initialData: {
    categories: CategoryData[]
    parentCategories: CategoryData[]
    childCategories: Record<string, CategoryData[]>
  }
  locale: 'ka' | 'en' | 'ru'
}

// Translations
const translations = {
  ka: {
    title: 'სერვისების კატეგორიები',
    subtitle: 'იპოვეთ თქვენთვის საჭირო იურიდიული მომსახურება კატეგორიების მიხედვით',
    searchPlaceholder: 'კატეგორიის ძებნა...',
    servicesCount: 'სერვისი',
    servicesCountPlural: 'სერვისი',
    subcategories: 'ქვეკატეგორია',
    subcategoriesPlural: 'ქვეკატეგორია',
    viewAll: 'ყველას ნახვა',
    noCategories: 'კატეგორიები არ მოიძებნა',
    noCategoriesDescription: 'ამჟამად კატეგორიები არ არის დამატებული',
    breadcrumb: 'კატეგორიები',
    totalCategories: 'კატეგორია',
  },
  en: {
    title: 'Service Categories',
    subtitle: 'Find the legal services you need organized by category',
    searchPlaceholder: 'Search categories...',
    servicesCount: 'service',
    servicesCountPlural: 'services',
    subcategories: 'subcategory',
    subcategoriesPlural: 'subcategories',
    viewAll: 'View all',
    noCategories: 'No categories found',
    noCategoriesDescription: 'No categories have been added yet',
    breadcrumb: 'Categories',
    totalCategories: 'categories',
  },
  ru: {
    title: 'Категории услуг',
    subtitle: 'Найдите нужные юридические услуги по категориям',
    searchPlaceholder: 'Поиск категорий...',
    servicesCount: 'услуга',
    servicesCountPlural: 'услуг',
    subcategories: 'подкатегория',
    subcategoriesPlural: 'подкатегорий',
    viewAll: 'Смотреть все',
    noCategories: 'Категории не найдены',
    noCategoriesDescription: 'Категории пока не добавлены',
    breadcrumb: 'Категории',
    totalCategories: 'категорий',
  },
}

export default function CategoriesPageClient({ initialData, locale }: CategoriesPageClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = translations[locale]

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    (searchParams.get('view') as 'grid' | 'list') ||
    (typeof window !== 'undefined' ? (localStorage.getItem('categories-view-mode') as 'grid' | 'list') : null) ||
    'grid'
  )

  const { parentCategories, childCategories } = initialData

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update URL
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery)
    if (viewMode !== 'grid') params.set('view', viewMode)
    
    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [debouncedSearchQuery, viewMode, router])

  useEffect(() => {
    updateURL()
  }, [debouncedSearchQuery, viewMode, updateURL])

  // Save view preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('categories-view-mode', viewMode)
    }
  }, [viewMode])

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('category-search')?.focus()
      }
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('category-search')
        if (document.activeElement === searchInput && searchQuery) {
          setSearchQuery('')
          searchInput?.blur()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  // Filter categories by search
  const filteredParentCategories = useMemo(() => {
    return parentCategories.filter(cat => {
      if (!debouncedSearchQuery.trim()) return true
      const query = debouncedSearchQuery.toLowerCase()
      const translation = cat.service_category_translations[0]
      return translation?.name?.toLowerCase().includes(query)
    })
  }, [parentCategories, debouncedSearchQuery])

  // Get service count for category (including children)
  const getTotalServiceCount = useCallback((categoryId: string): number => {
    const parent = parentCategories.find(c => c.id === categoryId)
    let count = parent?.services?.[0]?.count || 0
    
    const children = childCategories[categoryId] || []
    children.forEach(child => {
      count += child.services?.[0]?.count || 0
    })
    
    return count
  }, [parentCategories, childCategories])

  return (
    <div className="min-h-screen py-8 md:py-12 lg:py-16">
      {/* Skip to Main Content Link */}
      <SkipLink target="#main-content" />

      <div className="mx-auto px-6 sm:px-8 lg:px-10 max-w-[1200px]">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: t.breadcrumb }]} />

        {/* Compact Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {t.title}
              </h1>
              <p className={`text-sm md:text-base ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                {t.subtitle}
              </p>
            </div>
            
            {/* Stats Badge */}
            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
            }`}>
              <Sparkles className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              <div className="text-right">
                <div className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {t.totalCategories}
                </div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {parentCategories.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & View Mode */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <div className={`relative flex items-center rounded-lg border backdrop-blur-md transition-colors duration-300 focus-within:ring-2 focus-within:ring-offset-2 ${
              isDark
                ? 'bg-black/40 border-white/10 focus-within:border-white/20 focus-within:ring-white/20'
                : 'bg-white/20 border-white/30 focus-within:border-white/50 focus-within:ring-black/20 shadow-xl'
            }`}>
              <Search className={`absolute left-3 md:left-4 h-4 w-4 md:h-5 md:w-5 ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`} />
              <input
                id="category-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full py-2.5 md:py-3 pl-10 md:pl-12 pr-16 md:pr-20 rounded-lg bg-transparent outline-none transition-colors text-sm md:text-base ${
                  isDark
                    ? 'text-white placeholder:text-white/40'
                    : 'text-black placeholder:text-black/40'
                }`}
                aria-label={t.searchPlaceholder}
              />
              <div className={`absolute right-2 md:right-3 flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}>
                <Command className={`h-2.5 w-2.5 md:h-3 md:w-3 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`} />
                <span className={`text-[10px] md:text-xs font-medium ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  K
                </span>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-end">
            <ViewModeToggle view={viewMode} onChange={(value) => setViewMode(value as 'grid' | 'list')} />
          </div>
        </div>

        {/* Content */}
        <div id="main-content" tabIndex={-1}>
          {filteredParentCategories.length === 0 ? (
            <EmptyState
              type={debouncedSearchQuery ? 'no-results' : 'no-data'}
              title={t.noCategories}
              description={t.noCategoriesDescription}
            />
          ) : (
            <div className={`grid ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'
                : 'grid-cols-1 gap-3 md:gap-4'
            }`}>
              {filteredParentCategories.map((category) => {
                const translation = category.service_category_translations[0]
                const children = childCategories[category.id] || []
                const totalServices = getTotalServiceCount(category.id)

                if (viewMode === 'grid') {
                  return (
                    <Link
                      key={category.id}
                      href={`/${locale}/service/${translation.slug}`}
                      className={`group flex flex-col h-full rounded-lg overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${
                        isDark
                          ? 'bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 hover:shadow-2xl'
                          : 'bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl'
                      }`}
                    >
                      {/* Card Content */}
                      <div className="p-5 md:p-6 flex flex-col flex-1">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                          isDark
                            ? 'bg-white/10 text-white/70'
                            : 'bg-black/5 text-black/70'
                        }`}>
                          <FolderOpen className="w-6 h-6" />
                        </div>

                        {/* Title */}
                        <h2 className={`text-lg md:text-xl font-semibold mb-3 transition-colors ${
                          isDark ? 'text-white group-hover:text-white' : 'text-black group-hover:text-black'
                        }`}>
                          {translation.name}
                        </h2>

                        {/* Stats */}
                        <div className={`flex items-center gap-4 text-sm mb-4 ${
                          isDark ? 'text-white/50' : 'text-black/50'
                        }`}>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {totalServices} {totalServices === 1 ? t.servicesCount : t.servicesCountPlural}
                          </span>
                          {children.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FolderOpen className="w-4 h-4" />
                              {children.length} {children.length === 1 ? t.subcategories : t.subcategoriesPlural}
                            </span>
                          )}
                        </div>

                        {/* Subcategories preview */}
                        {children.length > 0 && (
                          <div className={`mt-auto pt-4 border-t ${
                            isDark ? 'border-white/10' : 'border-black/10'
                          }`}>
                            <div className="flex flex-wrap gap-2">
                              {children.slice(0, 3).map((child) => (
                                <span
                                  key={child.id}
                                  className={`text-xs px-2 py-1 rounded ${
                                    isDark
                                      ? 'bg-white/10 text-white/70'
                                      : 'bg-black/5 text-black/70'
                                  }`}
                                >
                                  {child.service_category_translations[0]?.name}
                                </span>
                              ))}
                              {children.length > 3 && (
                                <span className={`text-xs px-2 py-1 ${
                                  isDark ? 'text-white/40' : 'text-black/40'
                                }`}>
                                  +{children.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Arrow */}
                        <div className={`mt-4 flex items-center text-sm font-medium ${
                          isDark ? 'text-white/60' : 'text-black/60'
                        }`}>
                          {t.viewAll}
                          <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  )
                }

                // List View
                return (
                  <Link
                    key={category.id}
                    href={`/${locale}/service/${translation.slug}`}
                    className={`group flex items-center gap-4 md:gap-6 rounded-lg p-4 md:p-5 backdrop-blur-md transition-all duration-300 ${
                      isDark
                        ? 'bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20'
                        : 'bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-xl'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg flex items-center justify-center ${
                      isDark
                        ? 'bg-white/10 text-white/70'
                        : 'bg-black/5 text-black/70'
                    }`}>
                      <FolderOpen className="w-6 h-6 md:w-7 md:h-7" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-base md:text-lg font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-black'
                      }`}>
                        {translation.name}
                      </h2>

                      <div className={`flex items-center gap-4 text-sm ${
                        isDark ? 'text-white/50' : 'text-black/50'
                      }`}>
                        <span>{totalServices} {totalServices === 1 ? t.servicesCount : t.servicesCountPlural}</span>
                        {children.length > 0 && (
                          <span>{children.length} {children.length === 1 ? t.subcategories : t.subcategoriesPlural}</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 ${
                      isDark ? 'text-white/40' : 'text-black/40'
                    }`} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
