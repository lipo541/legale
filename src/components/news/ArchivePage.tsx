'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ChevronRight, ChevronDown, ArrowLeft, Tag, Filter, X } from 'lucide-react'
import NewsSearch from './common/NewsSearch'
import NewsSort, { SortOption } from './common/NewsSort'
import ViewModeToggle from '@/components/common/ViewModeToggle'
import { newsTranslations } from '@/translations/news'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  postCount?: number
  subcategories?: Category[]
}

interface Post {
  id: string
  featured_image_url?: string
  published_at: string
  category_id: string
  post_translations: Array<{
    title: string
    excerpt: string
    slug: string
    language: string
    reading_time?: number
  }>
  author?: {
    email: string
    full_name?: string
  }
}

interface ArchivePageProps {
  locale: string
}

export default function ArchivePage({ locale }: ArchivePageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  // Search, Filter, Sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [displayLimit, setDisplayLimit] = useState(12)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const POSTS_PER_PAGE = 12

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showMobileFilters])

  // Fetch categories and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all categories with translations
        const categoriesRes = await fetch(`/api/news/categories?locale=${locale}`)
        const categoriesData = await categoriesRes.json()

        interface CategoryData {
          id: string
          name: string
          slug: string
          parent_id?: string
        }

        // Build category hierarchy
        const categoryMap = new Map<string, Category>()
        const rootCategories: Category[] = []

        categoriesData.forEach((cat: CategoryData) => {
          const category: Category = {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parent_id: cat.parent_id || null,
            postCount: 0,
            subcategories: []
          }
          categoryMap.set(cat.id, category)
        })

        // Organize into hierarchy
        categoryMap.forEach(category => {
          if (category.parent_id) {
            const parent = categoryMap.get(category.parent_id)
            if (parent) {
              parent.subcategories!.push(category)
            }
          } else {
            rootCategories.push(category)
          }
        })

        // Fetch all published posts
        const postsRes = await fetch(`/api/news/posts?locale=${locale}&status=published`)
        const postsData = await postsRes.json()
        
        // Calculate post counts for categories
        postsData.forEach((post: Post) => {
          const category = categoryMap.get(post.category_id)
          if (category) {
            category.postCount = (category.postCount || 0) + 1
            // Also increment parent's count
            if (category.parent_id) {
              const parent = categoryMap.get(category.parent_id)
              if (parent) {
                parent.postCount = (parent.postCount || 0) + 1
              }
            }
          }
        })

        setCategories(rootCategories)
        setPosts(postsData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [locale])

  // Get all subcategory IDs for a category
  const getAllSubcategoryIds = useCallback((category: Category): string[] => {
    let ids = [category.id]
    if (category.subcategories) {
      category.subcategories.forEach(sub => {
        ids = [...ids, ...getAllSubcategoryIds(sub)]
      })
    }
    return ids
  }, [])

  // Find category by ID
  const findCategoryById = useCallback((id: string, cats: Category[]): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.subcategories) {
        const found = findCategoryById(id, cat.subcategories)
        if (found) return found
      }
    }
    return null
  }, [])

  // Get category name by ID
  const getCategoryNameById = useCallback((id: string): string => {
    const category = findCategoryById(id, categories)
    return category?.name || ''
  }, [categories, findCategoryById])

  // Filtered and sorted posts using useMemo
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts

    // Apply category filter
    if (selectedCategory) {
      const category = findCategoryById(selectedCategory, categories)
      if (category) {
        const allowedIds = getAllSubcategoryIds(category)
        filtered = filtered.filter(post => allowedIds.includes(post.category_id))
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(post => {
        const translation = post.post_translations?.find(t => t.language === locale) || post.post_translations?.[0]
        const title = translation?.title?.toLowerCase() || ''
        const excerpt = translation?.excerpt?.toLowerCase() || ''
        const categoryName = getCategoryNameById(post.category_id).toLowerCase()
        
        return title.includes(query) || excerpt.includes(query) || categoryName.includes(query)
      })
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const aTranslation = a.post_translations?.find(t => t.language === locale) || a.post_translations?.[0]
      const bTranslation = b.post_translations?.find(t => t.language === locale) || b.post_translations?.[0]
      
      switch (sortBy) {
        case 'newest':
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        case 'oldest':
          return new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
        case 'a-z':
          return (aTranslation?.title || '').localeCompare(bTranslation?.title || '', locale)
        case 'z-a':
          return (bTranslation?.title || '').localeCompare(aTranslation?.title || '', locale)
        case 'most-read':
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        default:
          return 0
      }
    })

    // Apply pagination
    const paginated = sorted.slice(0, displayLimit)

    return { all: sorted, paginated, total: sorted.length }
  }, [posts, selectedCategory, searchQuery, sortBy, locale, displayLimit, categories, findCategoryById, getAllSubcategoryIds, getCategoryNameById])

  // Handlers with useCallback
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setDisplayLimit(POSTS_PER_PAGE)
  }, [])

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort)
  }, [])

  const handleLoadMore = useCallback(() => {
    setDisplayLimit(prev => prev + POSTS_PER_PAGE)
  }, [])

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const renderCategory = (category: Category, level = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategory === category.id

    return (
      <div key={category.id} style={{ marginLeft: level * 16 }}>
        <button
          onClick={() => {
            if (hasSubcategories) {
              toggleCategory(category.id)
            }
            setSelectedCategory(category.id === selectedCategory ? null : category.id)
            setSearchQuery('')
            setDisplayLimit(POSTS_PER_PAGE)
          }}
          className={`w-full flex items-center justify-between py-2 px-3 text-sm font-medium transition-colors rounded-lg ${
            isSelected
              ? isDark
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-100 text-blue-600'
              : isDark
              ? 'text-white/70 hover:text-white hover:bg-white/5'
              : 'text-black/70 hover:text-black hover:bg-black/5'
          }`}
        >
          <span className="flex items-center gap-2">
            {hasSubcategories && (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
            {category.name}
          </span>
          {category.postCount !== undefined && category.postCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              isSelected
                ? isDark
                  ? 'bg-blue-400/20 text-blue-300'
                  : 'bg-blue-600/20 text-blue-700'
                : isDark
                ? 'bg-white/10 text-white/60'
                : 'bg-black/10 text-black/60'
            }`}>
              {category.postCount}
            </span>
          )}
        </button>

        {hasSubcategories && isExpanded && (
          <div className="mt-1">
            {category.subcategories!.map(sub => renderCategory(sub, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className={`h-8 w-8 mx-auto mb-4 animate-spin rounded-full border-4 border-current border-t-transparent ${
            isDark ? 'text-white/40' : 'text-black/40'
          }`} />
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {t?.loading || 'იტვირთება...'}
          </p>
        </div>
      </div>
    )
  }

  const hasActiveFilters = searchQuery.trim() || selectedCategory !== null

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-8">
        {/* Back Button */}
        <Link
          href={`/${locale}/news`}
          className={`mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors ${
            isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t?.backToBlog || 'უკან ბლოგზე'}</span>
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            {t?.archiveTitle || 'არქივი'}
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {selectedCategory 
              ? `${getCategoryNameById(selectedCategory)}: ${filteredAndSortedPosts.total} ${t?.posts || 'სტატია'}`
              : `${t?.totalPosts || 'სულ'} ${posts.length} ${t?.posts || 'სტატია'}`
            }
          </p>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-6 space-y-3">
          <NewsSearch 
            onSearch={handleSearch}
            resultsCount={hasActiveFilters ? filteredAndSortedPosts.total : undefined}
          />
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className={`lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    : 'bg-black/5 hover:bg-black/10 text-black border border-black/10'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t?.categories || 'კატეგორიები'}</span>
                {selectedCategory && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/20 text-blue-600'
                  }`}>1</span>
                )}
              </button>

              <div className="flex-1 max-w-xs hidden sm:block">
                <NewsSort 
                  onSortChange={handleSortChange}
                  currentSort={sortBy}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Sort - Only on very small screens */}
              <div className="sm:hidden flex-1">
                <NewsSort 
                  onSortChange={handleSortChange}
                  currentSort={sortBy}
                />
              </div>
              <ViewModeToggle view={viewMode} onChange={setViewMode} />
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowMobileFilters(false)}
            />
            
            {/* Drawer */}
            <div className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] ${
              isDark ? 'bg-[#0a0a0a]' : 'bg-white'
            } shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300`}>
              {/* Header */}
              <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'
              }`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  {t?.categories || 'კატეგორიები'}
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                  }`}
                  aria-label="Close filters"
                >
                  <X className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
                </button>
              </div>

              {/* Categories */}
              <div className="p-4">
                {/* All Posts Option */}
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchQuery('')
                    setDisplayLimit(POSTS_PER_PAGE)
                    setShowMobileFilters(false)
                  }}
                  className={`w-full flex items-center justify-between py-3 px-3 text-sm font-medium transition-colors rounded-lg mb-2 ${
                    !selectedCategory
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-100 text-blue-600'
                      : isDark
                      ? 'text-white/70 hover:text-white hover:bg-white/5'
                      : 'text-black/70 hover:text-black hover:bg-black/5'
                  }`}
                >
                  <span>{t?.allPosts || 'ყველა სტატია'}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    !selectedCategory
                      ? isDark
                        ? 'bg-blue-400/20 text-blue-300'
                        : 'bg-blue-600/20 text-blue-700'
                      : isDark
                      ? 'bg-white/10 text-white/60'
                      : 'bg-black/10 text-black/60'
                  }`}>
                    {posts.length}
                  </span>
                </button>

                <div className="space-y-1">
                  {categories.map(category => (
                    <MobileCategoryItem
                      key={category.id}
                      category={category}
                      selectedCategory={selectedCategory}
                      expandedCategories={expandedCategories}
                      onToggleCategory={toggleCategory}
                      onSelectCategory={(id) => {
                        setSelectedCategory(id === selectedCategory ? null : id)
                        setSearchQuery('')
                        setDisplayLimit(POSTS_PER_PAGE)
                        setShowMobileFilters(false)
                      }}
                      isDark={isDark}
                      level={0}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Left Sidebar - Categories (Desktop Only) */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className={`sticky top-8 rounded-xl p-4 ${
              isDark ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <h2 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                {t?.categories || 'კატეგორიები'}
              </h2>
              
              {/* All Posts Option */}
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSearchQuery('')
                  setDisplayLimit(POSTS_PER_PAGE)
                }}
                className={`w-full flex items-center justify-between py-2 px-3 text-sm font-medium transition-colors rounded-lg mb-2 ${
                  !selectedCategory
                    ? isDark
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-100 text-blue-600'
                    : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>{t?.allPosts || 'ყველა სტატია'}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  !selectedCategory
                    ? isDark
                      ? 'bg-blue-400/20 text-blue-300'
                      : 'bg-blue-600/20 text-blue-700'
                    : isDark
                    ? 'bg-white/10 text-white/60'
                    : 'bg-black/10 text-black/60'
                }`}>
                  {posts.length}
                </span>
              </button>

              <div className="space-y-1">
                {categories.map(category => renderCategory(category))}
              </div>
            </div>
          </div>

          {/* Right Content - Posts */}
          <div className="flex-1">
            {/* No Results State */}
            {filteredAndSortedPosts.total === 0 ? (
              <div className={`text-center py-16 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium">{t?.noResults || 'სტატიები არ მოიძებნა'}</p>
                <p className="mt-1 text-sm">{t?.noResultsDescription || 'სცადეთ სხვა საძიებო პარამეტრები'}</p>
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchQuery('')
                    setDisplayLimit(POSTS_PER_PAGE)
                  }}
                  className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  {t?.clearFilters || 'ფილტრების გასუფთავება'}
                </button>
              </div>
            ) : (
              <>
                {/* Posts Grid/List */}
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "space-y-4"
                }>
                  {filteredAndSortedPosts.paginated.map(post => {
                    const translation = post.post_translations[0]
                    const categoryName = getCategoryNameById(post.category_id)
                    
                    return viewMode === 'grid' ? (
                      // Grid View
                      <Link
                        key={post.id}
                        href={`/${locale}/news/${translation.slug}`}
                        className={`group block rounded-xl transition-all hover:scale-[0.99] overflow-hidden ${
                          isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                        }`}
                      >
                        {/* Image */}
                        {post.featured_image_url && (
                          <div className="relative w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <Image
                              src={post.featured_image_url}
                              alt={translation.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 384px"
                              unoptimized={post.featured_image_url.includes('supabase.co')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}

                        <div className="p-3 sm:p-4">
                          {/* Category Badge */}
                          {categoryName && (
                            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 mb-2 sm:mb-3 rounded-md text-xs font-medium ${
                              isDark
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              <Tag className="h-3 w-3" />
                              <span className="hidden sm:inline">{categoryName}</span>
                            </div>
                          )}

                          <h3 className={`text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2 line-clamp-2 ${
                            isDark ? 'text-white' : 'text-black'
                          }`}>
                            {translation.title}
                          </h3>
                          
                          <p className={`text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 ${
                            isDark ? 'text-white/60' : 'text-black/60'
                          }`}>
                            {translation.excerpt}
                          </p>

                          <div className={`flex items-center gap-2 sm:gap-3 text-xs ${
                            isDark ? 'text-white/40' : 'text-black/40'
                          }`}>
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="text-[10px] sm:text-xs">{formatDate(post.published_at)}</span>
                            </div>
                            {translation.reading_time && (
                              <span className="hidden sm:inline text-xs">
                                {translation.reading_time} {t?.readingTimeMinutes || 'წუთი'}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      // List View - Responsive
                      <Link
                        key={post.id}
                        href={`/${locale}/news/${translation.slug}`}
                        className={`group flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all hover:scale-[0.99] ${
                          isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                        }`}
                      >
                        {/* Image - Smaller on mobile */}
                        {post.featured_image_url && (
                          <div className="relative flex-shrink-0 rounded-lg overflow-hidden w-24 h-24 sm:w-32 sm:h-24 md:w-48 md:h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <Image
                              src={post.featured_image_url}
                              alt={translation.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 192px"
                              unoptimized={post.featured_image_url.includes('supabase.co')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* Category Badge */}
                          {categoryName && (
                            <div className="mb-1.5 sm:mb-2 flex items-center gap-2">
                              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium ${
                                isDark
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-blue-500/10 text-blue-600'
                              }`}>
                                <Tag className="h-3 w-3" />
                                <span className="hidden sm:inline">{categoryName}</span>
                              </div>
                            </div>
                          )}

                          <h3 className={`text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2 ${
                            isDark ? 'text-white' : 'text-black'
                          }`}>
                            {translation.title}
                          </h3>
                          
                          <p className={`text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 hidden sm:block ${
                            isDark ? 'text-white/60' : 'text-black/60'
                          }`}>
                            {translation.excerpt}
                          </p>

                          <div className={`mt-auto flex items-center gap-2 sm:gap-3 text-xs ${
                            isDark ? 'text-white/40' : 'text-black/40'
                          }`}>
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="text-[10px] sm:text-xs">{formatDate(post.published_at)}</span>
                            </div>
                            {translation.reading_time && (
                              <span className="hidden sm:inline text-xs">
                                {translation.reading_time} {t?.readingTimeMinutes || 'წუთი'}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Load More Button */}
                {filteredAndSortedPosts.paginated.length < filteredAndSortedPosts.total && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      className={`group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isDark 
                          ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20' 
                          : 'bg-black/5 hover:bg-black/10 text-black border border-black/10 hover:border-black/20'
                      }`}
                    >
                      <span>{t?.loadMore || 'მეტის ნახვა'}</span>
                      <span className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        ({filteredAndSortedPosts.total - filteredAndSortedPosts.paginated.length} {t?.remaining || 'დარჩა'})
                      </span>
                      <svg 
                        className="h-4 w-4 transition-transform group-hover:translate-y-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Category Item Component
interface MobileCategoryItemProps {
  category: Category
  selectedCategory: string | null
  expandedCategories: Set<string>
  onToggleCategory: (id: string) => void
  onSelectCategory: (id: string) => void
  isDark: boolean
  level: number
}

function MobileCategoryItem({
  category,
  selectedCategory,
  expandedCategories,
  onToggleCategory,
  onSelectCategory,
  isDark,
  level
}: MobileCategoryItemProps) {
  const hasSubcategories = category.subcategories && category.subcategories.length > 0
  const isExpanded = expandedCategories.has(category.id)
  const isSelected = selectedCategory === category.id

  return (
    <div style={{ marginLeft: level * 16 }}>
      <button
        onClick={() => {
          if (hasSubcategories) {
            onToggleCategory(category.id)
          }
          onSelectCategory(category.id)
        }}
        className={`w-full flex items-center justify-between py-3 px-3 text-sm font-medium transition-colors rounded-lg ${
          isSelected
            ? isDark
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-blue-100 text-blue-600'
            : isDark
            ? 'text-white/70 hover:text-white hover:bg-white/5'
            : 'text-black/70 hover:text-black hover:bg-black/5'
        }`}
      >
        <span className="flex items-center gap-2">
          {hasSubcategories && (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
          {category.name}
        </span>
        {category.postCount !== undefined && category.postCount > 0 && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            isSelected
              ? isDark
                ? 'bg-blue-400/20 text-blue-300'
                : 'bg-blue-600/20 text-blue-700'
              : isDark
              ? 'bg-white/10 text-white/60'
              : 'bg-black/10 text-black/60'
          }`}>
            {category.postCount}
          </span>
        )}
      </button>

      {hasSubcategories && isExpanded && (
        <div className="mt-1">
          {category.subcategories!.map(sub => (
            <MobileCategoryItem
              key={sub.id}
              category={sub}
              selectedCategory={selectedCategory}
              expandedCategories={expandedCategories}
              onToggleCategory={onToggleCategory}
              onSelectCategory={onSelectCategory}
              isDark={isDark}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}