'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
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
  }>
}

interface ArchivePageProps {
  locale: string
}

export default function ArchivePage({ locale }: ArchivePageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

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

        setCategories(rootCategories)

        // Fetch all published posts
        const postsRes = await fetch(`/api/news/posts?locale=${locale}&status=published`)
        const postsData = await postsRes.json()
        
        setPosts(postsData)
        setFilteredPosts(postsData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [locale])

  // Filter posts by category
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredPosts(posts)
    } else {
      const filtered = posts.filter(post => {
        // Check if post belongs to selected category or its subcategories
        if (post.category_id === selectedCategory) return true
        
        // Check if selected category is a parent
        const category = findCategoryById(selectedCategory, categories)
        if (category?.subcategories) {
          const subcategoryIds = category.subcategories.map(sub => sub.id)
          return subcategoryIds.includes(post.category_id)
        }
        
        return false
      })
      setFilteredPosts(filtered)
    }
  }, [selectedCategory, posts, categories])

  const findCategoryById = (id: string, cats: Category[]): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.subcategories) {
        const found = findCategoryById(id, cat.subcategories)
        if (found) return found
      }
    }
    return null
  }

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
        <div className={`text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          იტვირთება...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/${locale}/news`}
          className={`mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors ${
            isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>უკან ბლოგზე</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            არქივი
          </h1>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            სულ {filteredPosts.length} სტატია
          </p>
        </div>

        <div className="flex gap-8">
          {/* Left Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <div className={`sticky top-8 rounded-xl p-4 ${
              isDark ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <h2 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                კატეგორიები
              </h2>
              
              {/* All Posts Option */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center py-2 px-3 text-sm font-medium transition-colors rounded-lg mb-2 ${
                  !selectedCategory
                    ? isDark
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-100 text-blue-600'
                    : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                ყველა სტატია
              </button>

              <div className="space-y-1">
                {categories.map(category => renderCategory(category))}
              </div>
            </div>
          </div>

          {/* Right Content - Posts */}
          <div className="flex-1">
            {filteredPosts.length === 0 ? (
              <div className={`text-center py-16 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                <p className="text-lg">სტატიები არ მოიძებნა</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map(post => {
                  const translation = post.post_translations[0]
                  
                  return (
                    <Link
                      key={post.id}
                      href={`/${locale}/news/${translation.slug}`}
                      className={`flex gap-4 p-4 rounded-xl transition-all hover:scale-[0.99] ${
                        isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                      }`}
                    >
                      {/* Image */}
                      {post.featured_image_url && (
                        <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={post.featured_image_url}
                            alt={translation.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold mb-2 line-clamp-2 ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                          {translation.title}
                        </h3>
                        
                        <p className={`text-sm mb-3 line-clamp-2 ${
                          isDark ? 'text-white/60' : 'text-black/60'
                        }`}>
                          {translation.excerpt}
                        </p>

                        <div className={`flex items-center gap-2 text-xs ${
                          isDark ? 'text-white/40' : 'text-black/40'
                        }`}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
