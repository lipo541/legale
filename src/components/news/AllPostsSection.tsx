'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

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
    email: string
    full_name?: string
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
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts>({})
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadPosts()
  }, [locale])

  const loadPosts = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          post_translations!inner (*),
          author:profiles!posts_author_id_fkey(email, full_name)
        `)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .not('category_id', 'is', null)
        .order('published_at', { ascending: false })

      if (postsError) {
        console.error('Posts query error:', postsError)
        throw postsError
      }

      console.log('Posts fetched:', postsData?.length || 0)

      // Deduplicate posts by ID
      const uniquePosts = postsData ? Array.from(
        new Map(postsData.map(post => [post.id, post])).values()
      ) : []

      // Get unique category IDs
      const categoryIds = [...new Set(uniquePosts.map(post => post.category_id).filter(Boolean))]
      console.log('Category IDs:', categoryIds)

      // Only fetch categories if we have category IDs
      if (categoryIds.length === 0) {
        console.log('No posts with categories found')
        setGroupedPosts({})
        setTotalCount(0)
        return
      }

      // Fetch category translations AND parent info
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('post_category_translations')
        .select(`
          category_id, 
          name, 
          slug, 
          language,
          post_categories!inner(parent_id)
        `)
        .in('category_id', categoryIds)
        .eq('language', locale)

      if (categoriesError) {
        console.error('Categories query error:', categoriesError)
        throw categoriesError
      }

      console.log('Categories fetched:', categoriesData?.length || 0)

      // Get all parent category IDs
      interface CategoryRecord {
        parent_id?: string
      }

      const parentIds = [...new Set(
        categoriesData
          ?.map(cat => {
            const categoryRecord = Array.isArray(cat.post_categories) 
              ? cat.post_categories[0] 
              : cat.post_categories
            return (categoryRecord as CategoryRecord)?.parent_id
          })
          .filter(Boolean) as string[]
      )]

      // Fetch parent category translations
      interface ParentCategoryData {
        category_id: string
        name: string
        slug: string
        language: string
      }

      let parentCategoriesData: ParentCategoryData[] = []
      if (parentIds.length > 0) {
        const { data: parentsData } = await supabase
          .from('post_category_translations')
          .select('category_id, name, slug, language')
          .in('category_id', parentIds)
          .eq('language', locale)
        
        parentCategoriesData = parentsData || []
      }

      // Create category map with parent info
      const categoryMap = new Map()
      categoriesData?.forEach(cat => {
        const categoryRecord = Array.isArray(cat.post_categories) 
          ? cat.post_categories[0] 
          : cat.post_categories
        const parentId = categoryRecord?.parent_id
        
        categoryMap.set(cat.category_id, {
          name: cat.name,
          slug: cat.slug,
          parentId: parentId || null
        })
      })

      // Create parent category map
      const parentCategoryMap = new Map()
      parentCategoriesData.forEach(parent => {
        parentCategoryMap.set(parent.category_id, {
          name: parent.name,
          slug: parent.slug
        })
      })

      // Group posts by PARENT category (or by category if no parent)
      const grouped: GroupedPosts = {}
      uniquePosts.forEach((post) => {
        if (post.category_id) {
          const categoryInfo = categoryMap.get(post.category_id)
          
          // Use parent category for grouping if exists, otherwise use the category itself
          const groupByCategoryId = categoryInfo?.parentId || post.category_id
          const groupByInfo = categoryInfo?.parentId 
            ? parentCategoryMap.get(categoryInfo.parentId)
            : categoryInfo
          
          if (!grouped[groupByCategoryId]) {
            grouped[groupByCategoryId] = {
              name: groupByInfo?.name || 'უკატეგორიო',
              slug: groupByInfo?.slug || 'uncategorized',
              posts: []
            }
          }
          grouped[groupByCategoryId].posts.push(post)
        }
      })

      console.log('Grouped posts:', Object.keys(grouped).length, 'categories')

      setGroupedPosts(grouped)
      setTotalCount(uniquePosts.length)
    } catch (error) {
      console.error('Error fetching posts:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

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
          <span className="ml-3">იტვირთება...</span>
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
          <p className="text-lg font-medium">პოსტები ჯერ არ არის</p>
          <p className="mt-1 text-sm">ავტორების მიერ ატვირთული სიახლეები აქ გამოჩნდება</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-20">
      {/* Main Section Header */}
      <div className="mb-10 text-center">
        <h2 className={`text-xl md:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          ყველა სტატია
        </h2>
        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          სულ {totalCount} გამოქვეყნებული სტატია • {categories.length} კატეგორია
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-16">
        {categories.map((categoryId) => {
          const categoryData = groupedPosts[categoryId]
          const { name, slug, posts } = categoryData
          
          return (
            <div key={categoryId}>
              {/* Category Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`h-0.5 w-10 rounded-full ${
                    isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`} />
                  <h3 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {name}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                  }`}>
                    {posts.length}
                  </span>
                </div>
                
                <Link 
                  href={`/${locale}/news/category/${slug}`}
                  className={`group flex items-center gap-1 text-xs font-medium transition-colors ${
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <span>ყველას ნახვა</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => {
                  const translation = post.post_translations?.find((t) => t.language === locale) || post.post_translations?.[0]
                  
                  return (
                    <Link
                      key={post.id}
                      href={`/${locale}/news/${translation.slug}`}
                      className={`group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[0.98] block ${
                        isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        {post.featured_image_url ? (
                          <Image
                            src={post.featured_image_url}
                            alt={translation.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className={`h-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className={`h-12 w-12 ${isDark ? 'text-white/20' : 'text-black/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Meta info */}
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                              {formatDate(post.published_at)}
                            </span>
                            {post.author?.full_name && (
                              <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                {post.author.full_name}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                            {translation?.reading_time ?? '-'} წთ
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`mb-1.5 text-xs md:text-sm font-semibold leading-tight line-clamp-2 transition-opacity group-hover:opacity-60 ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                          {translation.title}
                        </h3>

                        {/* Excerpt */}
                        <p className={`mb-3 line-clamp-2 text-xs leading-relaxed ${
                          isDark ? 'text-white/60' : 'text-black/60'
                        }`}>
                          {translation.excerpt}
                        </p>

                        {/* Action */}
                        <div className="flex justify-end pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                          <button className={`flex items-center gap-0.5 text-[10px] font-medium transition-all group-hover:translate-x-1 ${
                            isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
                          }`}>
                            <span>ვრცლად</span>
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
