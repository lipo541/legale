'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import NewsSearch from './common/NewsSearch'
import NewsFilter from './common/NewsFilter'
import NewsSort, { SortOption } from './common/NewsSort'
import ViewModeToggle from '@/components/common/ViewModeToggle'
import { newsTranslations } from '@/translations/news'

interface PostTranslation {
  language: string
  title: string
  excerpt?: string
  slug: string
  reading_time?: number
}

interface Post {
  id: string
  category_id?: string
  featured_image_url?: string
  published_at: string
  post_translations: PostTranslation[]
  author?: {
    id: string
    email: string
    full_name?: string
    role?: string
    company_id?: string
    company?: {
      full_name?: string
      company_slug?: string
    }
  }
}

interface GroupedPosts {
  [categoryId: string]: {
    name: string
    slug: string
    posts: Post[]
  }
}

export default function AllPostsSection() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts>({})
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Search, Filter, Sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Load posts function with useCallback
  const loadPosts = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          post_translations!inner (*),
          author:profiles!posts_author_id_fkey(
            id, 
            email, 
            full_name,
            role,
            company_id
          )
        `)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .not('category_id', 'is', null)
        .order('published_at', { ascending: false })

      if (postsError) {
        console.error('Posts query error:', postsError)
        throw postsError
      }

      // Deduplicate posts by ID
      const uniquePosts = postsData ? Array.from(
        new Map(postsData.map(post => [post.id, post])).values()
      ) : []

      // Fetch company info for authors who are specialists
      const companyIds = uniquePosts
        .filter(post => post.author?.role === 'SPECIALIST' && post.author?.company_id)
        .map(post => post.author!.company_id!)
      
      const companyMap = new Map<string, { full_name: string; company_slug: string }>()
      
      if (companyIds.length > 0) {
        const { data: companiesData } = await supabase
          .from('profiles')
          .select('id, full_name, company_slug')
          .in('id', [...new Set(companyIds)])
        
        companiesData?.forEach((company: { id: string; full_name: string | null; company_slug: string | null }) => {
          if (company.id) {
            companyMap.set(company.id, {
              full_name: company.full_name || '',
              company_slug: company.company_slug || ''
            })
          }
        })
      }

      // Attach company info to posts
      uniquePosts.forEach((post: Post) => {
        if (post.author?.company_id && companyMap.has(post.author.company_id)) {
          post.author.company = companyMap.get(post.author.company_id)
        }
      })

      // Get unique category IDs
      const categoryIds = [...new Set(uniquePosts.map(post => post.category_id).filter(Boolean))]

      // Only fetch categories if we have category IDs
      if (categoryIds.length === 0) {
        setGroupedPosts({})
        setTotalCount(0)
        setLoading(false)
        return
      }

      // Fetch ALL categories with parent info (to build complete hierarchy)
      const { data: allCategoriesData, error: allCategoriesError } = await supabase
        .from('post_categories')
        .select('id, parent_id')

      if (allCategoriesError) {
        console.error('All categories query error:', allCategoriesError)
        throw allCategoriesError
      }

      // Create parent hierarchy map
      interface CategoryHierarchy {
        id: string
        parent_id: string | null
      }

      const categoryHierarchyMap = new Map<string, string | null>()
      allCategoriesData?.forEach((cat: CategoryHierarchy) => {
        categoryHierarchyMap.set(cat.id, cat.parent_id)
      })

      // Function to find root parent category recursively
      const findRootCategory = (categoryId: string): string => {
        const parentId = categoryHierarchyMap.get(categoryId)
        if (!parentId) {
          // No parent, this is the root
          return categoryId
        }
        // Recursively find the root
        return findRootCategory(parentId)
      }

      // Get all unique root category IDs
      const rootCategoryIds = [...new Set(
        categoryIds.map(catId => findRootCategory(catId))
      )]

      // Fetch root category translations
      const { data: rootCategoriesData, error: rootCategoriesError } = await supabase
        .from('post_category_translations')
        .select('category_id, name, slug, language')
        .in('category_id', rootCategoryIds)
        .eq('language', locale)

      if (rootCategoriesError) {
        console.error('Root categories query error:', rootCategoriesError)
        throw rootCategoriesError
      }

      // Create root category map
      interface RootCategoryData {
        category_id: string
        name: string
        slug: string
      }

      const rootCategoryMap = new Map<string, RootCategoryData>()
      rootCategoriesData?.forEach((cat: RootCategoryData) => {
        rootCategoryMap.set(cat.category_id, {
          category_id: cat.category_id,
          name: cat.name,
          slug: cat.slug
        })
      })

      // Group posts by ROOT category
      const grouped: GroupedPosts = {}
      uniquePosts.forEach((post) => {
        if (post.category_id) {
          // Find the root category for this post's category
          const rootCategoryId = findRootCategory(post.category_id)
          const rootCategoryInfo = rootCategoryMap.get(rootCategoryId)
          
          if (!grouped[rootCategoryId]) {
            grouped[rootCategoryId] = {
              name: rootCategoryInfo?.name || t.uncategorized,
              slug: rootCategoryInfo?.slug || 'uncategorized',
              posts: []
            }
          }
          grouped[rootCategoryId].posts.push(post)
        }
      })

      setGroupedPosts(grouped)
      setTotalCount(uniquePosts.length)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [locale, t.uncategorized])

  useEffect(() => {
    loadPosts()
  }, [locale, loadPosts])

  // Filtered and sorted posts using useMemo for performance
  const filteredAndSortedPosts = useMemo(() => {
    const allPosts: Post[] = []
    
    // Flatten all posts from grouped structure
    Object.values(groupedPosts).forEach(category => {
      allPosts.push(...category.posts)
    })
    
    // Apply search filter
    let filtered = allPosts
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = allPosts.filter(post => {
        const translation = post.post_translations?.find(t => t.language === locale) || post.post_translations?.[0]
        const title = translation?.title?.toLowerCase() || ''
        const excerpt = translation?.excerpt?.toLowerCase() || ''
        const categoryName = groupedPosts[post.category_id || '']?.name?.toLowerCase() || ''
        
        return title.includes(query) || excerpt.includes(query) || categoryName.includes(query)
      })
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(post => {
        if (!post.category_id) return false
        
        // Get category info to check parent
        const categoryIds = Object.keys(groupedPosts)
        return selectedCategories.some(selectedCat => {
          // Check if post's category matches or if post's parent category matches
          return post.category_id === selectedCat || categoryIds.includes(selectedCat)
        })
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
          // TODO: Implement view count sorting when available
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        default:
          return 0
      }
    })
    
    // Re-group all sorted posts by category (no pagination limit)
    const regrouped: GroupedPosts = {}
    sorted.forEach(post => {
      if (post.category_id) {
        const categoryId = post.category_id
        
        // Find the parent category for grouping
        let groupId = categoryId
        let categoryInfo = groupedPosts[categoryId]
        
        if (!categoryInfo) {
          // Search in all categories to find this post's category
          for (const [catId, catData] of Object.entries(groupedPosts)) {
            if (catData.posts.some(p => p.id === post.id)) {
              groupId = catId
              categoryInfo = catData
              break
            }
          }
        }
        
        if (!regrouped[groupId]) {
          regrouped[groupId] = {
            name: categoryInfo?.name || t.uncategorized,
            slug: categoryInfo?.slug || 'uncategorized',
            posts: []
          }
        }
        regrouped[groupId].posts.push(post)
      }
    })
    
    return { grouped: regrouped, total: sorted.length, displayed: sorted.length }
  }, [groupedPosts, searchQuery, selectedCategories, sortBy, locale, t.uncategorized])

  // Handlers with useCallback
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((categories: string[]) => {
    setSelectedCategories(categories)
  }, [])

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="mt-16">
        <div className={`flex items-center justify-center py-12 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="ml-3">{t.loading}</span>
        </div>
      </div>
    )
  }

  const categories = Object.keys(groupedPosts)

  if (categories.length === 0) {
    return (
      <div className="mt-16">
        <div className={`py-16 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-lg font-medium">{t.noPosts}</p>
          <p className="mt-1 text-sm">{t.noPostsDescription}</p>
        </div>
      </div>
    )
  }

  const displayedPosts = filteredAndSortedPosts.grouped
  const displayedCategories = Object.keys(displayedPosts)
  const hasActiveFilters = searchQuery.trim() || selectedCategories.length > 0

  return (
    <div className="mt-12 md:mt-20">
      {/* Main Section Header */}
      <div className="mb-6 md:mb-10 text-center">
        <h2 className={`text-lg md:text-2xl font-bold mb-1.5 md:mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          {t.allPostsTitle}
        </h2>
        <p className={`text-[10px] md:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          {t.allPostsStats
            .replace('{postsCount}', totalCount.toString())
            .replace('{categoriesCount}', categories.length.toString())}
        </p>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
        {/* Search Bar */}
        <NewsSearch 
          onSearch={handleSearch}
          resultsCount={hasActiveFilters ? filteredAndSortedPosts.total : undefined}
        />
        
        {/* Filter, Sort, View Mode */}
        <div className="flex items-center justify-between gap-2 md:gap-3 flex-wrap">
          <div className="flex items-center gap-2 md:gap-3">
            <NewsFilter 
              onFilterChange={handleFilterChange}
              selectedCategories={selectedCategories}
            />
            <NewsSort 
              onSortChange={handleSortChange}
              currentSort={sortBy}
            />
          </div>
          <ViewModeToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* No Results State */}
      {displayedCategories.length === 0 && hasActiveFilters && (
        <div className={`py-16 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">{t.noResults}</p>
          <p className="mt-1 text-sm">{t.noResultsDescription}</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategories([])
            }}
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            {t.clearFilters}
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-10 md:space-y-16">
        {displayedCategories.map((categoryId) => {
          const categoryData = displayedPosts[categoryId]
          const { name, slug, posts } = categoryData
          
          return (
            <div key={categoryId}>
              {/* Category Header */}
              <div className="mb-4 md:mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-2.5">
                  <div className={`h-0.5 w-6 md:w-10 rounded-full ${
                    isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`} />
                  <h3 className={`text-sm md:text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {name}
                  </h3>
                  <span className={`rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] font-medium ${
                    isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                  }`}>
                    {posts.length}
                  </span>
                </div>
                
                <Link 
                  href={`/${locale}/news/category/${slug}`}
                  className={`group flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs font-medium transition-colors ${
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <span>{t.viewAll}</span>
                  <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Posts Horizontal Scroll */}
              <div className={`${
                viewMode === 'grid' 
                  ? 'flex gap-3 md:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin' 
                  : 'grid grid-cols-1 gap-3 md:gap-4'
              } ${isDark ? 'scrollbar-thumb-white/20 scrollbar-track-white/5' : 'scrollbar-thumb-black/20 scrollbar-track-black/5'}`}>
                {posts.map((post) => {
                  const translation = post.post_translations?.find((t) => t.language === locale) || post.post_translations?.[0]
                  
                  return (
                    <Link
                      key={post.id}
                      href={`/${locale}/news/${translation.slug}`}
                      className={`group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[0.98] ${
                        viewMode === 'grid' 
                          ? 'flex flex-col flex-shrink-0 w-72 md:w-80 snap-start' 
                          : 'flex flex-row'
                      } ${
                        isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                      }`}
                    >
                      {/* Image */}
                      <div className={`relative overflow-hidden flex-shrink-0 ${
                        viewMode === 'grid' 
                          ? 'h-40 md:h-48 w-full' 
                          : 'h-28 md:h-32 w-32 md:w-48'
                      }`}>
                        {post.featured_image_url ? (
                          <Image
                            src={post.featured_image_url}
                            alt={translation.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading="lazy"
                          />
                        ) : (
                          <div className={`h-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className={`h-8 md:h-12 w-8 md:w-12 ${isDark ? 'text-white/20' : 'text-black/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex flex-col flex-1 ${viewMode === 'grid' ? 'p-3 md:p-4' : 'p-3 md:p-5'}`}>
                        {/* Meta info */}
                        <div className="mb-1.5 md:mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                            <span className={`text-[9px] md:text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                              {formatDate(post.published_at)}
                            </span>
                            {post.author?.full_name && post.author.id && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    window.location.href = `/${locale}/news/author/${post.author!.id}`
                                  }}
                                  className={`text-[9px] md:text-[10px] transition-colors hover:underline ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                                >
                                  {post.author.full_name}
                                </button>
                                {post.author.role === 'SPECIALIST' && post.author.company?.full_name && post.author.company_id && (
                                  <>
                                    <span className={`text-[9px] md:text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      •
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        window.location.href = `/${locale}/news/author/${post.author!.company_id}`
                                      }}
                                      className={`text-[9px] md:text-[10px] transition-colors hover:underline ${isDark ? 'text-emerald-400/60 hover:text-emerald-400' : 'text-emerald-600/60 hover:text-emerald-600'}`}
                                    >
                                      {post.author.company.full_name}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <span className={`text-[9px] md:text-[10px] flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                            {translation?.reading_time ?? '-'} {t.readingTimeMinutes}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`mb-1 md:mb-1.5 font-semibold leading-tight transition-opacity group-hover:opacity-60 ${
                          viewMode === 'grid' 
                            ? 'text-xs md:text-sm line-clamp-2' 
                            : 'text-xs md:text-base line-clamp-2'
                        } ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                          {translation.title}
                        </h3>

                        {/* Excerpt */}
                        <p className={`mb-2 md:mb-2.5 text-[10px] md:text-xs leading-relaxed ${
                          viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-2 md:line-clamp-3'
                        } ${
                          isDark ? 'text-white/60' : 'text-black/60'
                        }`}>
                          {translation.excerpt}
                        </p>

                        {/* Action */}
                        <div className="flex justify-end pt-2 md:pt-2.5 mt-auto border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                          <button className={`flex items-center gap-0.5 text-[9px] md:text-[10px] font-medium transition-all group-hover:translate-x-1 ${
                            isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
                          }`}>
                            <span>{t.readMore}</span>
                            <svg className="h-2 md:h-2.5 w-2 md:w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
