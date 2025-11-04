'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, User, Clock, FolderOpen } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Translation {
  language: string
  name?: string
  slug?: string
}

interface Category {
  id: string
  parent_id: string | null
  post_category_translations: Translation[]
}

interface PostTranslation {
  language: string
  title?: string
  slug?: string
  excerpt?: string
  reading_time?: number
}

interface Author {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  company_id: string | null
  slug: string | null
  company_slug: string | null
  company?: {
    id: string
    full_name: string | null
    company_slug: string | null
  } | null
}

interface Post {
  id: string
  category_id: string | null
  featured_image_url?: string
  published_at: string
  post_translations: PostTranslation[]
  category: Category | null
}

interface AuthorPageClientProps {
  author: Author
  posts: Post[]
  locale: string
}

export default function AuthorPageClient({ author, posts, locale }: AuthorPageClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const authorName = author.full_name || author.email

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  // Group posts by category
  const postsByCategory = useMemo(() => {
    const grouped = new Map<string, { category: Category | null; posts: Post[] }>()

    posts.forEach((post) => {
      const categoryId = post.category_id || 'uncategorized'
      
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, {
          category: post.category,
          posts: []
        })
      }

      grouped.get(categoryId)!.posts.push(post)
    })

    return Array.from(grouped.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.category?.post_category_translations?.find(t => t.language === locale)?.name || 'კატეგორიის გარეშე',
      categorySlug: data.category?.post_category_translations?.find(t => t.language === locale)?.slug,
      posts: data.posts
    }))
  }, [posts, locale])

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts
    return posts.filter(post => {
      const categoryId = post.category_id || 'uncategorized'
      return categoryId === selectedCategory
    })
  }, [posts, selectedCategory])

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

        {/* Author Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                }`}>
                  <User className={`h-12 w-12 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-1.5 w-16 rounded-full ${
                  isDark ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                }`} />
                <span className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {author.role === 'COMPANY' ? 'კომპანია' : author.role === 'SPECIALIST' ? 'სპეციალისტი' : 'ავტორი'}
                </span>
              </div>
              
              {/* Author Name - Clickable only for SPECIALIST and COMPANY */}
              {(author.role === 'SPECIALIST' || author.role === 'COMPANY') ? (
                <button
                  onClick={() => {
                    const profilePath = author.role === 'COMPANY' 
                      ? `/${locale}/companies/${author.company_slug || author.id}`
                      : `/${locale}/specialists/${author.slug || author.id}`
                    window.location.href = profilePath
                  }}
                  className={`text-4xl font-bold mb-3 transition-colors hover:opacity-80 text-left ${isDark ? 'text-white' : 'text-black'}`}
                >
                  {authorName}
                </button>
              ) : (
                <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                  {authorName}
                </h1>
              )}
              
              {/* Company Name */}
              {author.role === 'SPECIALIST' && author.company?.full_name && author.company_id && (
                <div className="mb-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.location.href = `/${locale}/news/author/${author.company_id}`
                    }}
                    className={`text-lg font-medium transition-colors hover:underline ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                  >
                    {author.company.full_name}
                  </button>
                  <span className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    - კომპანიის სპეციალისტი
                  </span>
                </div>
              )}
              
              {author.bio && (
                <p className={`text-lg max-w-3xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {author.bio}
                </p>
              )}
              
              <p className={`mt-3 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                სულ {posts.length} სტატია • {postsByCategory.length} კატეგორია
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === null
                  ? isDark
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                  : isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              ყველა ({posts.length})
            </button>
            {postsByCategory.map(({ categoryId, categoryName, posts: categoryPosts }) => (
              <button
                key={categoryId}
                onClick={() => setSelectedCategory(categoryId)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === categoryId
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                {categoryName} ({categoryPosts.length})
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className={`py-16 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-lg font-medium">
              {author.role === 'COMPANY' 
                ? 'ამ კომპანიას პოსტები არ აქვს განთავსებული'
                : 'პოსტები ჯერ არ არის'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const translation = post.post_translations?.find((t) => t.language === locale) || post.post_translations?.[0]
              const categoryTranslation = post.category?.post_category_translations?.find(t => t.language === locale)
              
              return (
                <Link
                  key={post.id}
                  href={`/${locale}/news/${translation?.slug || post.id}`}
                  className={`group overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[0.98] ${
                    isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    {post.featured_image_url ? (
                      <Image
                        src={post.featured_image_url}
                        alt={translation?.title || 'Post image'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
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

                    {/* Category Badge */}
                    {categoryTranslation && (
                      <div className="absolute left-3 top-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${
                          isDark ? 'bg-black/60 text-white' : 'bg-white/90 text-black'
                        }`}>
                          <FolderOpen className="h-3 w-3" />
                          {categoryTranslation.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Meta */}
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                      <div className={`flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      {translation?.reading_time && (
                        <div className={`flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{translation.reading_time} წთ</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className={`mb-2 line-clamp-2 text-xl font-bold transition-colors group-hover:text-blue-500 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}>
                      {translation?.title || 'Untitled'}
                    </h2>

                    {/* Excerpt */}
                    {translation?.excerpt && (
                      <p className={`line-clamp-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        {translation.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
