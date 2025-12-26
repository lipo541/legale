'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { Tag } from 'lucide-react'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'
import type { PracticeCardProps } from '../types'
import { generatePracticeAriaLabel } from './utils'

type PracticeCardGridProps = Omit<PracticeCardProps, 'viewMode'>

export default function PracticeCardGrid({
  hero_image_url,
  translation,
  locale,
}: PracticeCardGridProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const ariaLabel = generatePracticeAriaLabel(translation, locale)

  return (
    <Link
      href={`/${locale}/practices/${translation.slug}`}
      className={`group flex flex-col h-full rounded-lg overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 hover:shadow-2xl focus-visible:ring-white/50'
          : 'bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl focus-visible:ring-black/50'
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
            <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-2.5 py-1 text-white shadow-lg">
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
