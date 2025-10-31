'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'

interface ServiceTranslation {
  title: string
  slug: string
  description: string
  image_alt: string
  practice_title?: string
  practice_slug?: string
}

interface ServiceCardProps {
  id: string
  image_url: string
  translation: ServiceTranslation
  locale: 'ka' | 'en' | 'ru'
  viewMode?: 'grid' | 'list'
}

export default function ServiceCard({
  id,
  image_url,
  translation,
  locale,
  viewMode = 'grid',
}: ServiceCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Grid View (default)
  if (viewMode === 'grid') {
    const ariaLabel = locale === 'ka' 
      ? `სერვისი: ${translation.title}. ${translation.practice_title ? `პრაქტიკა: ${translation.practice_title}` : ''}`
      : locale === 'en'
      ? `Service: ${translation.title}. ${translation.practice_title ? `Practice: ${translation.practice_title}` : ''}`
      : `Услуга: ${translation.title}. ${translation.practice_title ? `Практика: ${translation.practice_title}` : ''}`

    return (
      <Link
        href={`/${locale}/practices/${translation.practice_slug}/${translation.slug}`}
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
        <Image
          src={image_url}
          alt={translation.image_alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-102"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
          
          {/* Practice Reference */}
          {translation.practice_title && (
            <div className="flex items-center gap-1">
              <span className="text-xs md:text-sm text-white/70">
                {locale === 'ka' ? 'პრაქტიკა' : locale === 'en' ? 'Practice' : 'Практика'}:{' '}
                <span className="font-semibold text-white">
                  {translation.practice_title}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Service Badge - Top */}
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 rounded-full bg-blue-500/90 backdrop-blur-sm px-2.5 py-1 text-white">
            <FileText className="h-3 w-3" />
            <span className="text-[10px] md:text-xs font-medium">
              {locale === 'ka' ? 'სერვისი' : locale === 'en' ? 'Service' : 'Услуга'}
            </span>
          </div>
        </div>
      </div>
    </Link>
    )
  }

  // List View
  const ariaLabel = locale === 'ka' 
    ? `სერვისი: ${translation.title}. ${translation.practice_title ? `პრაქტიკა: ${translation.practice_title}` : ''}`
    : locale === 'en'
    ? `Service: ${translation.title}. ${translation.practice_title ? `Practice: ${translation.practice_title}` : ''}`
    : `Услуга: ${translation.title}. ${translation.practice_title ? `Практика: ${translation.practice_title}` : ''}`

  return (
    <Link
      href={`/${locale}/practices/${translation.practice_slug}/${translation.slug}`}
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
        <Image
          src={image_url}
          alt={translation.image_alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-102"
          sizes="(max-width: 640px) 128px, 192px"
          loading="lazy"
        />
        
        {/* Service Badge */}
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-1 rounded-full bg-blue-500/90 backdrop-blur-sm px-2 py-0.5 text-white">
            <FileText className="h-2.5 w-2.5" />
            <span className="text-[9px] md:text-[10px] font-medium">
              {locale === 'ka' ? 'სერვისი' : locale === 'en' ? 'Service' : 'Услуга'}
            </span>
          </div>
        </div>
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
          
          {/* Practice Reference */}
          {translation.practice_title && (
            <span
              className={`text-xs md:text-sm ${
                isDark ? 'text-white/50' : 'text-black/50'
              }`}
            >
              {locale === 'ka' ? 'პრაქტიკა' : locale === 'en' ? 'Practice' : 'Практика'}:{' '}
              <span className={`font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {translation.practice_title}
              </span>
            </span>
          )}
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
