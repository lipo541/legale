'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'

interface PracticeTranslation {
  title: string
  slug: string
  description: string
  hero_image_alt: string
  word_count?: number
  reading_time?: number
  category?: string
  services_count?: number
}

interface PracticeCardProps {
  id: string
  hero_image_url: string
  translation: PracticeTranslation
  locale: 'ka' | 'en' | 'ru'
  viewMode?: 'grid' | 'list'
}

export default function PracticeCard({
  hero_image_url,
  translation,
  locale,
  viewMode = 'grid',
}: PracticeCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Grid View (default)
  if (viewMode === 'grid') {
    const ariaLabel = locale === 'ka' 
      ? `პრაქტიკა: ${translation.title}. სერვისები: ${translation.services_count ?? 0}. ${translation.category ? `კატეგორია: ${translation.category}` : ''}`
      : locale === 'en'
      ? `Practice: ${translation.title}. Services: ${translation.services_count ?? 0}. ${translation.category ? `Category: ${translation.category}` : ''}`
      : `Практика: ${translation.title}. Услуги: ${translation.services_count ?? 0}. ${translation.category ? `Категория: ${translation.category}` : ''}`

    return (
      <Link
        href={`/${locale}/practices/${translation.slug}`}
        className={`group flex flex-col h-full rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isDark
            ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:shadow-2xl focus-visible:ring-white/50'
            : 'bg-white hover:bg-gray-50 border border-black/10 hover:border-black/20 shadow-sm hover:shadow-xl focus-visible:ring-black/50'
        }`}
        aria-label={ariaLabel}
        role="article"
      >
      {/* Image Section with Text Overlay */}
      <div className={`relative aspect-[4/3] overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-white/5 to-white/10' : 'bg-gradient-to-br from-black/5 to-black/10'
      }`}>
        <img
          src={getOptimizedImageUrl(hero_image_url, imagePresets.practiceCard)}
          alt={translation.hero_image_alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          loading="lazy"
        />
        
        {/* Dark Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Text Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 z-10">
          {/* Title */}
          <div className="text-sm md:text-base font-semibold mb-1 text-white line-clamp-2 drop-shadow-lg leading-tight">
            {translation.title}
          </div>
          
          {/* Services Count */}
          <div className="flex items-center gap-1">
            <span className="text-xs md:text-sm text-white/70">
              {locale === 'ka' ? 'სერვისები' : locale === 'en' ? 'Services' : 'Услуги'}:{' '}
              <span className="font-semibold text-white">
                {translation.services_count ?? 0}
              </span>
            </span>
          </div>
        </div>

        {/* Category Badge - Top */}
        {translation.category && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-black">
              <Tag className="h-3 w-3" />
              <span className="text-[10px] md:text-xs font-medium">
                {translation.category}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
    )
  }

  // List View
  const ariaLabel = locale === 'ka' 
    ? `პრაქტიკა: ${translation.title}. სერვისები: ${translation.services_count ?? 0}. ${translation.category ? `კატეგორია: ${translation.category}` : ''}`
    : locale === 'en'
    ? `Practice: ${translation.title}. Services: ${translation.services_count ?? 0}. ${translation.category ? `Category: ${translation.category}` : ''}`
    : `Практика: ${translation.title}. Услуги: ${translation.services_count ?? 0}. ${translation.category ? `Категория: ${translation.category}` : ''}`

  return (
    <Link
      href={`/${locale}/practices/${translation.slug}`}
      className={`group flex items-center gap-3 md:gap-4 rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:shadow-xl focus-visible:ring-white/50'
          : 'bg-white hover:bg-gray-50 border border-black/10 hover:border-black/20 shadow-sm hover:shadow-lg focus-visible:ring-black/50'
      }`}
      aria-label={ariaLabel}
      role="article"
    >
      {/* Image Section - Smaller in list view */}
      <div className={`relative w-24 md:w-32 aspect-[4/3] flex-shrink-0 overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-white/5 to-white/10' : 'bg-gradient-to-br from-black/5 to-black/10'
      }`}>
        <img
          src={getOptimizedImageUrl(hero_image_url, imagePresets.cardThumbnail)}
          alt={translation.hero_image_alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          loading="lazy"
        />
        
        {/* Category Badge */}
        {translation.category && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-black">
              <Tag className="h-2.5 w-2.5" />
              <span className="text-[9px] md:text-[10px] font-medium">
                {translation.category}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section - Horizontal layout */}
      <div className="flex-1 py-2 md:py-3 pr-3 md:pr-4 flex items-center justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div
            className={`text-sm md:text-base font-semibold mb-1 transition-colors duration-300 line-clamp-1 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            {translation.title}
          </div>
          
          {/* Services Count */}
          <span
            className={`text-xs md:text-sm ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}
          >
            {locale === 'ka' ? 'სერვისები' : locale === 'en' ? 'Services' : 'Услуги'}:{' '}
            <span className={`font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {translation.services_count ?? 0}
            </span>
          </span>
        </div>

        {/* Read More Button */}
        <span
          className={`flex items-center gap-1 text-xs md:text-sm font-medium transition-all duration-300 group-hover:gap-2 whitespace-nowrap ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {locale === 'ka' ? 'ვრცლად' : locale === 'en' ? 'Read more' : 'Подробнее'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
