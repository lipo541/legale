'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react'

interface Translation {
  language: string
  title?: string
  slug?: string
  excerpt?: string
  reading_time?: number
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  seo_title?: string
  seo_description?: string
  translations: Translation[]
}

interface Post {
  id: string
  featured_image_url?: string
  published_at: string
  post_translations: Translation[]
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

interface CategoryPageClientProps {
  category: Category
  posts: Post[]
  locale: string
}

export default function CategoryPageClient({ category, posts, locale }: CategoryPageClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
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

        {/* Category Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-1.5 w-16 rounded-full ${
              isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`} />
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {category.name}
            </h1>
          </div>
          
          {category.description && (
            <p className={`text-lg max-w-3xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {category.description}
            </p>
          )}
          
          <p className={`mt-3 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            სულ {posts.length} სტატია
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className={`py-16 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-lg font-medium">ამ კატეგორიაში პოსტები ჯერ არ არის</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const translation = post.post_translations?.find((t) => t.language === locale) || post.post_translations?.[0]
              
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
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Meta */}
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                      <div className={`flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      {post.author?.full_name && post.author.id && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.location.href = `/${locale}/news/author/${post.author!.id}`
                            }}
                            className={`flex items-center gap-1.5 transition-colors hover:underline ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                          >
                            <User className="h-3.5 w-3.5" />
                            <span>{post.author.full_name}</span>
                          </button>
                          {post.author.role === 'SPECIALIST' && post.author.company?.full_name && post.author.company_id && (
                            <>
                              <span className={`${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                •
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  window.location.href = `/${locale}/news/author/${post.author!.company_id}`
                                }}
                                className={`transition-colors hover:underline ${isDark ? 'text-emerald-400/60 hover:text-emerald-400' : 'text-emerald-600/60 hover:text-emerald-600'}`}
                              >
                                {post.author.company.full_name}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {translation?.reading_time && (
                        <div className={`flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{translation.reading_time} წთ</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className={`mb-3 text-xl font-semibold leading-tight line-clamp-2 transition-opacity group-hover:opacity-60 ${
                      isDark ? 'text-white' : 'text-black'
                    }`}>
                      {translation?.title || 'უსათაურო'}
                    </h2>

                    {/* Excerpt */}
                    {translation?.excerpt && (
                      <p className={`line-clamp-3 text-sm leading-relaxed ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
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
