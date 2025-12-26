'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'
import type { PracticeCardProps } from '../types'
import { generatePracticeAriaLabel } from './utils'

type PracticeCardListProps = Omit<PracticeCardProps, 'viewMode'>

export default function PracticeCardList({
  hero_image_url,
  translation,
  locale,
}: PracticeCardListProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const ariaLabel = generatePracticeAriaLabel(translation, locale)

  return (
    <Link
      href={`/${locale}/practices/${translation.slug}`}
      className={`group flex items-center gap-3 md:gap-4 rounded-lg overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 hover:shadow-xl focus-visible:ring-white/50'
          : 'bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl focus-visible:ring-black/50'
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
            <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-2 py-0.5 text-white shadow-lg">
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
