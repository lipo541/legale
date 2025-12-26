'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

interface PostTranslation {
  language: string
  title: string
  excerpt?: string
  slug: string
  reading_time?: number
}

interface NewsCardProps {
  id: string
  featured_image_url?: string
  published_at: string
  translations: PostTranslation[]
  locale: string
  categoryName?: string
  categorySlug?: string
  isHomepageFeatured?: boolean
  featuredOrder?: number
}

export default function NewsCard({
  id,
  featured_image_url,
  published_at,
  translations,
  locale,
  categoryName,
  categorySlug,
  isHomepageFeatured,
  featuredOrder
}: NewsCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const translation = translations.find(t => t.language === locale) || translations[0]
  
  // Format date manually to avoid SSR hydration mismatch
  // Node.js and browser have different Intl data, causing inconsistent formatting
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    
    const day = date.getDate()
    const monthIndex = date.getMonth()
    
    // Month names for each locale
    const months: Record<string, string[]> = {
      'ka': ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
      'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      'ru': ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    }
    
    const monthNames = months[locale] || months['ka']
    return `${day} ${monthNames[monthIndex]}`
  }

  return (
    <Link
      href={`/${locale}/news/${translation?.slug || id}`}
      className={`
        group relative flex flex-col overflow-hidden rounded-xl
        transition-all duration-300 hover:scale-[0.98]
        w-[calc(20%-13px)] min-w-[180px] max-w-[230px]
        flex-shrink-0 snap-start
        ${isDark 
          ? 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10' 
          : 'bg-black/[0.02] hover:bg-black/[0.05] border border-black/5 hover:border-black/10'
        }
      `}
    >
      {/* Featured Badge */}
      {isHomepageFeatured && featuredOrder && (
        <div className={`
          absolute top-2 right-2 z-10
          w-5 h-5 rounded-full flex items-center justify-center
          text-[10px] font-bold
          ${isDark 
            ? 'bg-yellow-500/90 text-black' 
            : 'bg-yellow-400 text-black'
          }
        `}>
          {featuredOrder}
        </div>
      )}

      {/* Image Container - 16:10 aspect ratio */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        {featured_image_url ? (
          <img
            src={featured_image_url}
            alt={translation?.title || ''}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${isDark ? 'bg-white/10' : 'bg-black/5'}
          `}>
            <svg 
              className={`h-8 w-8 ${isDark ? 'text-white/20' : 'text-black/20'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        )}
        
        {/* Gradient overlay for better text readability */}
        <div className={`
          absolute inset-x-0 bottom-0 h-16
          bg-gradient-to-t pointer-events-none
          ${isDark ? 'from-black/60 to-transparent' : 'from-white/60 to-transparent'}
        `} />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        {/* Category & Date */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {categoryName && (
            <span className={`
              text-[10px] font-medium uppercase tracking-wide truncate
              ${isDark ? 'text-white/50' : 'text-black/50'}
            `}>
              {categoryName}
            </span>
          )}
          <span className={`
            text-[10px] whitespace-nowrap
            ${isDark ? 'text-white/40' : 'text-black/40'}
          `}>
            {formatDate(published_at)}
          </span>
        </div>

        {/* Title - max 2 lines */}
        <h3 className={`
          text-sm font-semibold leading-tight line-clamp-2
          transition-colors duration-200
          ${isDark 
            ? 'text-white group-hover:text-white/90' 
            : 'text-black group-hover:text-black/80'
          }
        `}>
          {translation?.title || 'Untitled'}
        </h3>

        {/* Reading time if available */}
        {translation?.reading_time && translation.reading_time > 0 && (
          <div className={`
            mt-auto pt-2 text-[10px] flex items-center gap-1
            ${isDark ? 'text-white/30' : 'text-black/30'}
          `}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{translation.reading_time} წთ</span>
          </div>
        )}
      </div>
    </Link>
  )
}
