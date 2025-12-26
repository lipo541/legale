'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { newsTranslations } from '@/translations/news'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'

interface PostTranslation {
  title: string
  excerpt?: string
  slug: string
  reading_time?: number
  category?: string
}

interface Post {
  id: string
  featured_image_url?: string
  published_at?: string
  post_translations: PostTranslation[]
}

interface Position6Props {
  posts: Post[]
}

// Featured Post Card - Compact & Visual
export default function Position6({ posts }: Position6Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  const post = posts[0] || null

  if (!post) {
    return (
      <div className={`relative h-full overflow-hidden rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-white/60'}`}>{t.noPostsPosition6}</p>
      </div>
    )
  }

  const translation = post.post_translations[0]

  return (
    <Link href={`/${locale}/news/${translation.slug}`} className="block h-full overflow-hidden">
      {/* Mobile: Horizontal compact card */}
      <div className={`md:hidden group flex h-full items-center gap-3 p-2 rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-300 active:scale-[0.98] ${
        isDark 
          ? 'bg-black/40 border-white/10' 
          : 'bg-white/20 border-white/30 shadow-xl'
      }`}>
        {/* Left: Square image */}
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
          {post.featured_image_url ? (
            <img
              src={getOptimizedImageUrl(post.featured_image_url, imagePresets.cardThumbnail)}
              alt={translation.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`h-full w-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          )}
        </div>
        
        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          <span className={`inline-block mb-0.5 rounded px-1 py-0.5 text-[10px] font-medium ${
            isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
          }`}>
            {translation.category}
          </span>
          <h3 className={`text-xs font-medium leading-snug line-clamp-2 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {translation.title}
          </h3>
        </div>
      </div>

      {/* Tablet: Horizontal card with image left, content right */}
      <div className={`hidden md:flex lg:hidden group h-full items-center gap-3 p-3 rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-300 hover:scale-[0.99] ${
        isDark 
          ? 'bg-black/40 border-white/10 hover:bg-black/50 hover:border-white/20' 
          : 'bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/50 shadow-xl'
      }`}>
        {/* Left: Image */}
        <div className="relative h-full w-[40%] flex-shrink-0 overflow-hidden rounded-lg">
          {post.featured_image_url ? (
            <img
              src={getOptimizedImageUrl(post.featured_image_url, imagePresets.cardLarge)}
              alt={translation.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={`h-full w-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          )}
        </div>
        
        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className={`inline-block self-start mb-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-600 text-white`}>
            {translation.category}
          </span>
          <h3 className={`text-sm font-semibold leading-snug line-clamp-3 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {translation.title}
          </h3>
          {translation.excerpt && (
            <p className={`mt-1.5 text-[11px] leading-relaxed line-clamp-2 ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              {translation.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Desktop: Original vertical card */}
      <div className={`hidden lg:block group relative h-full overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
        isDark 
          ? 'bg-black/40 border-white/10 hover:bg-black/50 hover:border-white/20' 
          : 'bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/50 shadow-xl'
      }`}>
        {/* Image Section (Top Half) */}
        {post.featured_image_url && (
          <div className="relative h-[70%] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <img
              src={getOptimizedImageUrl(post.featured_image_url, imagePresets.cardLarge)}
              alt={translation.title}
              className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-t from-zinc-900 via-transparent to-transparent' 
                : 'bg-gradient-to-t from-black via-transparent to-transparent'
            }`} />
            
            {/* Category Badge on Image */}
            <div className="absolute top-2 left-2">
              <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm bg-red-600 text-white">
                {translation.category}
              </span>
            </div>
          </div>
        )}

        {/* Content Section (Bottom Half) */}
        <div className="relative flex h-[30%] flex-col justify-center p-2">
          <h3 className={`text-xs font-semibold leading-snug line-clamp-2 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {translation.title}
          </h3>
        </div>
      </div>
    </Link>
  )
}
