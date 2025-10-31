'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Command, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { practiceTranslations } from '@/translations/practices'
import PracticeCard from './PracticeCard'
import PracticeCardSkeleton from './PracticeCardSkeleton'
import ServiceCard from '@/components/service/ServiceCard'
import EmptyState from '@/components/common/EmptyState'
import Breadcrumb from '@/components/common/Breadcrumb'
import Filter from '@/components/common/Filter'
import Sort from '@/components/common/Sort'
import ViewModeToggle from '@/components/common/ViewModeToggle'
import SkipLink from '@/components/common/SkipLink'

interface PracticeData {
  id: string
  hero_image_url: string
  practice_translations: Array<{
    title: string
    slug: string
    description: string
    hero_image_alt: string
    word_count?: number
    reading_time?: number
    category?: string
    services_count?: number
  }>
  services?: Array<{ count: number }>
}

interface ServiceData {
  id: string
  image_url: string
  practice_id: string
  service_translations: Array<{
    title: string
    slug: string
    description: string
    image_alt: string
  }>
  practices: Array<{
    practice_translations: Array<{
      title: string
      slug: string
    }>
  }>
}

type ResultType = 'practices' | 'services'

export default function PracticePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'
  
  // Get translations for current locale
  const t = practiceTranslations[locale]

  // Initialize state from URL params or defaults
  const [practices, setPractices] = useState<PracticeData[]>([])
  const [services, setServices] = useState<ServiceData[]>([])
  const [filteredPractices, setFilteredPractices] = useState<PracticeData[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  const [activeTab, setActiveTab] = useState<ResultType>((searchParams.get('tab') as ResultType) || 'practices')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    (searchParams.get('view') as 'grid' | 'list') || 
    (typeof window !== 'undefined' ? (localStorage.getItem('practices-view-mode') as 'grid' | 'list') : null) || 
    'grid'
  )
  const [displayCount, setDisplayCount] = useState(12)

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update URL params when state changes (debounced)
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery)
    if (activeTab !== 'practices') params.set('tab', activeTab)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    if (viewMode !== 'grid') params.set('view', viewMode)
    
    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : window.location.pathname
    
    router.replace(newUrl, { scroll: false })
  }, [debouncedSearchQuery, activeTab, categoryFilter, sortBy, viewMode, router])

  // Sync URL on state change (debounced)
  useEffect(() => {
    updateURL()
  }, [debouncedSearchQuery, activeTab, categoryFilter, sortBy, viewMode, updateURL])

  // Save view mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('practices-view-mode', viewMode)
    }
  }, [viewMode])

  // Fetch practices and services
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(false)
      const supabase = createClient()

      try {
        // Fetch practices
        const { data: practicesData, error: practicesError } = await supabase
          .from('practices')
          .select(
            `
            id,
            hero_image_url,
            practice_translations!inner (
              title,
              slug,
              description,
              hero_image_alt
            ),
            services:services!practice_id(count)
          `
          )
          .eq('practice_translations.language', locale)
          .eq('services.status', 'published')

        if (practicesError) {
          console.error('Supabase practices error:', practicesError)
          throw practicesError
        }

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select(
            `
            id,
            image_url,
            practice_id,
            service_translations!inner (
              title,
              slug,
              description,
              image_alt
            ),
            practices!inner (
              practice_translations!inner (
                title,
                slug
              )
            )
          `
          )
          .eq('service_translations.language', locale)
          .eq('status', 'published')

        if (servicesError) {
          console.error('Supabase services error:', servicesError)
          throw servicesError
        }

        if (practicesData) {
          const validPractices = practicesData.filter(
            (practice) =>
              practice.practice_translations &&
              practice.practice_translations.length > 0
          )
          setPractices(validPractices as PracticeData[])
          setFilteredPractices(validPractices as PracticeData[])
        }

        if (servicesData) {
          const validServices = servicesData.filter(
            (service) =>
              service.service_translations &&
              service.service_translations.length > 0
          )
          setServices(validServices as ServiceData[])
          setFilteredServices(validServices as ServiceData[])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        console.error('Error details:', JSON.stringify(err, null, 2))
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [locale])

  // Filter and search for practices
  useEffect(() => {
    let filtered = [...practices]

    // Search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter((practice) => {
        const translation = practice.practice_translations[0]
        return (
          translation.title.toLowerCase().includes(query) ||
          translation.description.toLowerCase().includes(query) ||
          translation.category?.toLowerCase().includes(query)
        )
      })
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (practice) =>
          practice.practice_translations[0].category === categoryFilter
      )
    }

    // Sort
    filtered.sort((a, b) => {
      const aTranslation = a.practice_translations[0]
      const bTranslation = b.practice_translations[0]

      switch (sortBy) {
        case 'newest':
          return new Date(b.id).getTime() - new Date(a.id).getTime()
        case 'oldest':
          return new Date(a.id).getTime() - new Date(b.id).getTime()
        case 'a-z':
          return aTranslation.title.localeCompare(bTranslation.title)
        case 'z-a':
          return bTranslation.title.localeCompare(aTranslation.title)
        default:
          return 0
      }
    })

    setFilteredPractices(filtered)
  }, [practices, debouncedSearchQuery, categoryFilter, sortBy])

  // Filter and search for services
  useEffect(() => {
    let filtered = [...services]

    // Search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter((service) => {
        const translation = service.service_translations[0]
        const practiceTranslation = service.practices[0]?.practice_translations[0]
        return (
          translation.title.toLowerCase().includes(query) ||
          translation.description.toLowerCase().includes(query) ||
          practiceTranslation?.title.toLowerCase().includes(query)
        )
      })
    }

    // Sort
    filtered.sort((a, b) => {
      const aTranslation = a.service_translations[0]
      const bTranslation = b.service_translations[0]

      switch (sortBy) {
        case 'newest':
          return new Date(b.id).getTime() - new Date(a.id).getTime()
        case 'oldest':
          return new Date(a.id).getTime() - new Date(b.id).getTime()
        case 'a-z':
          return aTranslation.title.localeCompare(bTranslation.title)
        case 'z-a':
          return bTranslation.title.localeCompare(aTranslation.title)
        default:
          return 0
      }
    })

    setFilteredServices(filtered)
  }, [services, debouncedSearchQuery, sortBy])

  // Keyboard shortcut for search (Command/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('practice-search')?.focus()
      }
      // Escape to clear search if search is focused
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('practice-search')
        if (document.activeElement === searchInput && searchQuery) {
          setSearchQuery('')
          searchInput?.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 12)
  }, [])

  // Get unique categories
  const categories = Array.from(
    new Set(
      practices
        .map((p) => p.practice_translations[0].category)
        .filter(Boolean)
    )
  )

  const filterOptions = [
    { value: 'all', label: t.filterAll },
    ...categories.map((cat) => ({ value: cat!, label: cat! })),
  ]

  const sortOptions = [
    { value: 'newest', label: t.sortNewest },
    { value: 'oldest', label: t.sortOldest },
    { value: 'a-z', label: t.sortAZ },
    { value: 'z-a', label: t.sortZA },
  ]

  // Memoize displayed items to avoid unnecessary re-calculations
  const displayedPractices = useMemo(
    () => filteredPractices.slice(0, displayCount),
    [filteredPractices, displayCount]
  )
  
  const displayedServices = useMemo(
    () => filteredServices.slice(0, displayCount),
    [filteredServices, displayCount]
  )
  
  const hasMore = useMemo(
    () => activeTab === 'practices' 
      ? displayCount < filteredPractices.length
      : displayCount < filteredServices.length,
    [activeTab, displayCount, filteredPractices.length, filteredServices.length]
  )

  return (
    <div
      className={`min-h-screen py-8 md:py-12 lg:py-16 ${
        isDark ? 'bg-black' : 'bg-white'
      }`}
    >
      {/* Skip to Main Content Link */}
      <SkipLink target="#main-content" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: t.breadcrumb }]} />

        {/* Compact Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {t.title}
              </h1>
              <p
                className={`text-sm md:text-base ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}
              >
                {t.subtitle}
              </p>
            </div>
            
            {/* Stats Badge */}
            {!loading && !error && (
              <div
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'
                }`}
              >
                <Sparkles
                  className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`}
                />
                <div className="text-right">
                  <div className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    {t.practices}
                  </div>
                  <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {practices.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <div
              className={`relative flex items-center rounded-lg border transition-colors duration-300 focus-within:ring-2 focus-within:ring-offset-2 ${
                isDark
                  ? 'bg-white/5 border-white/10 focus-within:border-white/20 focus-within:ring-white/20'
                  : 'bg-white border-black/10 focus-within:border-black/20 focus-within:ring-black/20'
              }`}
            >
              <Search
                className={`absolute left-3 md:left-4 h-4 w-4 md:h-5 md:w-5 ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`}
              />
              <input
                id="practice-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full py-2.5 md:py-3 pl-10 md:pl-12 pr-16 md:pr-20 rounded-lg bg-transparent outline-none transition-colors text-sm md:text-base ${
                  isDark
                    ? 'text-white placeholder:text-white/40'
                    : 'text-black placeholder:text-black/40'
                }`}
                aria-label={locale === 'ka' ? 'პრაქტიკებისა და სერვისების ძიება' : locale === 'en' ? 'Search practices and services' : 'Поиск практик и услуг'}
                aria-describedby="search-hint"
              />
              <span id="search-hint" className="sr-only">
                {locale === 'ka' 
                  ? 'გამოიყენეთ Command+K ან Ctrl+K ძიების სწრაფად გასახსნელად. Escape გასასუფთავებლად.'
                  : locale === 'en'
                  ? 'Press Command+K or Ctrl+K to quickly focus search. Press Escape to clear.'
                  : 'Нажмите Command+K или Ctrl+K для быстрого поиска. Escape для очистки.'}
              </span>
              <div
                className={`absolute right-2 md:right-3 flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                  isDark ? 'bg-white/10' : 'bg-black/5'
                }`}
              >
                <Command
                  className={`h-2.5 w-2.5 md:h-3 md:w-3 ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}
                />
                <span
                  className={`text-[10px] md:text-xs font-medium ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}
                >
                  K
                </span>
              </div>
            </div>
          </div>

          {/* Results Tabs */}
          {!loading && !error && (
            <>
              {/* Screen Reader Announcement for Results Count */}
              <div 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
                className="sr-only"
              >
                {activeTab === 'practices' 
                  ? (locale === 'ka' 
                    ? `${filteredPractices.length} პრაქტიკა მოიძებნა`
                    : locale === 'en'
                    ? `${filteredPractices.length} practices found`
                    : `${filteredPractices.length} практик найдено`)
                  : (locale === 'ka'
                    ? `${filteredServices.length} სერვისი მოიძებნა`
                    : locale === 'en'
                    ? `${filteredServices.length} services found`
                    : `${filteredServices.length} услуг найдено`)
                }
              </div>

              <div className={`flex items-center gap-2 pb-4 border-b ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`} role="tablist" aria-label={locale === 'ka' ? 'შედეგების ტიპი' : locale === 'en' ? 'Results type' : 'Тип результатов'}>
                <button
                  onClick={() => setActiveTab('practices')}
                  role="tab"
                  aria-selected={activeTab === 'practices'}
                  aria-controls="practices-panel"
                  className={`relative px-4 py-2 text-sm md:text-base font-medium transition-all duration-300 ${
                    activeTab === 'practices'
                      ? isDark
                        ? 'text-white'
                        : 'text-black'
                      : isDark
                      ? 'text-white/50 hover:text-white/70'
                      : 'text-black/50 hover:text-black/70'
                  }`}
                >
                {t.practices}
                {filteredPractices.length > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === 'practices'
                        ? isDark
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : isDark
                        ? 'bg-white/10 text-white/70'
                        : 'bg-black/10 text-black/70'
                    }`}
                  >
                    {filteredPractices.length}
                  </span>
                )}
                {activeTab === 'practices' && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab('services')}
                role="tab"
                aria-selected={activeTab === 'services'}
                aria-controls="services-panel"
                className={`relative px-4 py-2 text-sm md:text-base font-medium transition-all duration-300 ${
                  activeTab === 'services'
                    ? isDark
                      ? 'text-white'
                      : 'text-black'
                    : isDark
                    ? 'text-white/50 hover:text-white/70'
                    : 'text-black/50 hover:text-black/70'
                }`}
              >
                {t.services}
                {filteredServices.length > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === 'services'
                        ? isDark
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : isDark
                        ? 'bg-white/10 text-white/70'
                        : 'bg-black/10 text-black/70'
                    }`}
                  >
                    {filteredServices.length}
                  </span>
                )}
                {activeTab === 'services' && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}
                  />
                )}
              </button>
            </div>
            </>
          )}

          {/* Filter, Sort, View Mode */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {activeTab === 'practices' && (
                <Filter
                  options={filterOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder={t.filterAll}
                />
              )}
              <Sort options={sortOptions} value={sortBy} onChange={setSortBy} />
            </div>
            <ViewModeToggle view={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Content */}
        <div id="main-content" tabIndex={-1}>
        {loading ? (
          /* Skeleton Loading */
          <div
            className={`grid gap-6 md:gap-8 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}
            aria-busy="true"
            aria-label={locale === 'ka' ? 'იტვირთება...' : locale === 'en' ? 'Loading...' : 'Загрузка...'}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <PracticeCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <EmptyState
            type="error"
            title={t.error}
            description={t.errorDesc}
            actionLabel={t.retry}
            onAction={handleRetry}
          />
        ) : activeTab === 'practices' && filteredPractices.length === 0 ? (
          /* Empty State for Practices */
          <EmptyState
            type={searchQuery || categoryFilter !== 'all' ? 'no-results' : 'no-data'}
            title={searchQuery || categoryFilter !== 'all' ? t.noResults : t.noPractices}
            description={
              searchQuery || categoryFilter !== 'all'
                ? t.noResultsDesc
                : t.noPracticesDesc
            }
          />
        ) : activeTab === 'services' && filteredServices.length === 0 ? (
          /* Empty State for Services */
          <EmptyState
            type={searchQuery ? 'no-results' : 'no-data'}
            title={searchQuery ? t.noResults : locale === 'ka' ? 'სერვისები ჯერ არ არის' : locale === 'en' ? 'No services yet' : 'Услуг пока нет'}
            description={
              searchQuery
                ? t.noResultsDesc
                : locale === 'ka' ? 'მალე დაემატება ახალი სერვისები' : locale === 'en' ? 'New services will be added soon' : 'Новые услуги будут добавлены в ближайшее время'
            }
          />
        ) : (
          /* Cards - Practices or Services */
          <>
            <div
              className={`grid ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'
                  : 'grid-cols-1 gap-3 md:gap-4'
              }`}
              id={activeTab === 'practices' ? 'practices-panel' : 'services-panel'}
              role="tabpanel"
              aria-label={activeTab === 'practices' ? t.practices : t.services}
            >
              {activeTab === 'practices'
                ? displayedPractices.map((practice) => {
                    const servicesCount = practice.services?.[0]?.count || 0
                    return (
                      <PracticeCard
                        key={practice.id}
                        id={practice.id}
                        hero_image_url={practice.hero_image_url}
                        translation={{
                          ...practice.practice_translations[0],
                          services_count: servicesCount,
                        }}
                        locale={locale}
                        viewMode={viewMode}
                      />
                    )
                  })
                : displayedServices.map((service) => {
                    const practiceTranslation = service.practices[0]?.practice_translations[0]
                    return (
                      <ServiceCard
                        key={service.id}
                        id={service.id}
                        image_url={service.image_url}
                        translation={{
                          ...service.service_translations[0],
                          practice_title: practiceTranslation?.title,
                          practice_slug: practiceTranslation?.slug,
                        }}
                        locale={locale}
                        viewMode={viewMode}
                      />
                    )
                  })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className={`px-8 py-3 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white'
                      : 'bg-white hover:bg-gray-50 border border-black/10 hover:border-black/20 text-black shadow-sm hover:shadow-md'
                  }`}
                  aria-label={
                    activeTab === 'practices'
                      ? (locale === 'ka' 
                        ? `დაამატეთ 12 პრაქტიკა. ამჟამად ნაჩვენებია ${displayCount} სულ ${filteredPractices.length}-დან`
                        : locale === 'en'
                        ? `Load 12 more practices. Currently showing ${displayCount} of ${filteredPractices.length} total`
                        : `Загрузить еще 12 практик. Показано ${displayCount} из ${filteredPractices.length}`)
                      : (locale === 'ka'
                        ? `დაამატეთ 12 სერვისი. ამჟამად ნაჩვენებია ${displayCount} სულ ${filteredServices.length}-დან`
                        : locale === 'en'
                        ? `Load 12 more services. Currently showing ${displayCount} of ${filteredServices.length} total`
                        : `Загрузить еще 12 услуг. Показано ${displayCount} из ${filteredServices.length}`)
                  }
                >
                  {t.loadMore}
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
