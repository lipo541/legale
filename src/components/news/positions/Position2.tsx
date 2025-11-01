'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { newsTranslations } from '@/translations/news'

interface PostTranslation {
  title: string
  slug: string
  category?: string
  excerpt?: string
}

interface Post {
  id: string
  featured_image_url?: string
  published_at: string
  created_at?: string
  post_translations: PostTranslation[]
}

interface Position2Props {
  posts: Post[]
}

// Vertical News Feed
export default function Position2({ posts }: Position2Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (posts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>{t.noPostsPosition2}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {posts.map((post) => {
        const translation = post.post_translations?.[0]
        if (!translation) return null
        
        const publishedDate = post.published_at 
          ? new Date(post.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
          : post.created_at ? new Date(post.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : ''

        return (
          <Link
            key={post.id}
            href={`/${locale}/news/${translation.slug}`}
            onMouseEnter={() => setHoveredId(post.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`group relative block cursor-pointer rounded-xl p-4 transition-all duration-300 ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10' 
                : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            {/* Animated border */}
            <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
              hoveredId === post.id 
                ? isDark 
                  ? 'opacity-100 ring-1 ring-white/20' 
                  : 'opacity-100 ring-1 ring-black/20'
                : 'opacity-0'
            }`} />
            
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  {publishedDate}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                }`}>
                  {translation.category}
                </span>
              </div>
              
              <h3 className={`text-[11px] md:text-xs font-medium leading-snug transition-opacity ${
                isDark ? 'text-white' : 'text-black'
              } ${hoveredId === post.id ? 'opacity-60' : 'opacity-100'}`}>
                {translation.title}
              </h3>
              
              {translation.excerpt && (
                <p className={`text-[10px] md:text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  {translation.excerpt.slice(0, 80)}...
                </p>
              )}
              
              {/* Arrow indicator */}
              <div className={`flex items-center gap-1 text-[10px] font-medium transition-all duration-300 ${
                isDark ? 'text-white/60' : 'text-black/60'
              } ${hoveredId === post.id ? 'translate-x-1' : 'translate-x-0'}`}>
                <span>წაიკითხე</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
