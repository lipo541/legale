'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Locale, getWindowWidth } from '@/lib/enums'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'
import Link from 'next/link'
import { IoTimeOutline, IoCalendarOutline, IoArrowBack, IoDocumentTextOutline, IoChevronForward, IoBriefcaseOutline, IoLogoFacebook, IoLogoLinkedin, IoLogoTwitter, IoChevronDown, IoChevronUp } from 'react-icons/io5'

// Import from local modules
import { usePracticeServices, useShareHandler } from './hooks'
import { formatPracticeDate } from './components/utils'
import { getPracticeDetailText } from '@/translations/practiceDetail'
import type { PracticeDetailProps } from './types'

export default function PracticeDetail({ 
  practice, 
  translation, 
  locale
}: PracticeDetailProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Use custom hooks
  const { services, filteredServices, loading: servicesLoading, searchTerm, setSearchTerm } = usePracticeServices({
    practiceId: practice.id,
    locale,
  })
  const { handleShare } = useShareHandler()

  // State for mobile dropdown and formatted dates
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [formattedCreatedAt, setFormattedCreatedAt] = useState<string>('')
  const [formattedUpdatedAt, setFormattedUpdatedAt] = useState<string>('')

  // Get localized text
  const text = getPracticeDetailText(locale)

  // Format dates on client side to avoid hydration mismatch
  useEffect(() => {
    setFormattedCreatedAt(formatPracticeDate(practice.createdAt, locale))
    setFormattedUpdatedAt(formatPracticeDate(practice.updatedAt, locale))
  }, [practice.createdAt, practice.updatedAt, locale])

  // Share handler with data
  const onShare = (platform: 'facebook' | 'linkedin' | 'twitter') => {
    handleShare(platform, {
      title: translation.ogTitle || translation.metaTitle || translation.title,
      description: translation.ogDescription || translation.metaDescription || '',
    })
  }

  return (
    <div className={`min-h-screen ${isDark ? 'text-white' : 'text-black'}`}>
      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-4 md:py-6 max-w-[1200px]">
        {/* Back Link - Above grid */}
        <div className="mb-6">
          <Link
            href={`/${locale}/practices`}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
              isDark 
                ? 'text-white/60 hover:text-white' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <IoArrowBack className="h-3.5 w-3.5" />
            <span>{text.back}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* LEFT SIDEBAR - Services */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div id="services-sidebar" className={`sticky top-20 rounded-2xl border backdrop-blur-md ${
              isDark 
                ? 'bg-black/40 border-white/10' 
                : 'bg-white/20 border-white/30 shadow-xl'
            }`}>
              {/* Services Header - Clickable on mobile */}
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                aria-expanded={isServicesOpen}
                aria-controls="services-list-content"
                aria-label={isServicesOpen ? text.closeServices : text.openServices}
                className={`w-full p-6 flex items-center justify-between lg:pointer-events-none ${
                  isDark ? 'hover:bg-white/5 lg:hover:bg-transparent' : 'hover:bg-black/5 lg:hover:bg-transparent'
                } transition-colors rounded-t-2xl`}
              >
                <div className="flex items-center gap-3">
                  <IoBriefcaseOutline className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
                  <div className="text-left">
                    <h2 className="text-xl font-bold">{text.services}</h2>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {text.servicesAvailable(services.length)}
                    </p>
                  </div>
                </div>
                <div className="lg:hidden">
                  {isServicesOpen ? (
                    <IoChevronUp className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
                  ) : (
                    <IoChevronDown className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
                  )}
                </div>
              </button>

              {/* Collapsible Content - Always open on desktop, collapsible on mobile */}
              <div 
                id="services-list-content"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isServicesOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                } lg:!max-h-none lg:!opacity-100 px-6 ${isServicesOpen ? 'pb-6' : 'pb-0'} lg:pb-6`}
              >
                {/* Search Bar */}
                <div className="mb-6">
                  <div className={`relative rounded-lg border backdrop-blur-md ${
                    isDark 
                      ? 'bg-black/40 border-white/10' 
                      : 'bg-white/20 border-white/30 shadow-xl'
                  }`}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={text.searchServices}
                      role="search"
                      aria-label={text.searchServices}
                      className={`w-full px-4 py-2.5 pr-10 text-sm rounded-lg bg-transparent outline-none ${
                        isDark 
                          ? 'text-white placeholder:text-white/40' 
                          : 'text-black placeholder:text-gray-500'
                      }`}
                    />
                    <svg 
                      className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                        isDark ? 'text-white/40' : 'text-gray-400'
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Services List */}
                <div className={`space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 
                scrollbar-thin
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:rounded-full
                ${isDark 
                  ? '[&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30 scrollbar-thumb-white/20 scrollbar-track-transparent' 
                  : '[&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 scrollbar-thumb-black/20 scrollbar-track-transparent'
                }
              `}>
                {servicesLoading ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {text.loading}
                    </p>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {searchTerm ? text.noSearchResults : text.noServices}
                    </p>
                  </div>
                ) : (
                  filteredServices.map((service) => (
                    <Link
                      key={service.id}
                      href={`/${locale}/practices/${translation.slug}/${service.slug}`}
                      scroll={false}
                      onClick={() => {
                        // On mobile, close sidebar and scroll to content after navigation
                        const isMobile = getWindowWidth() < 1024
                        if (isMobile) {
                          setIsServicesOpen(false)
                        }
                        
                        // Wait for navigation to complete, then scroll to content
                        setTimeout(() => {
                          const contentElement = document.getElementById('practice-content')
                          if (contentElement) {
                            const offset = 80 // Account for header
                            const elementPosition = contentElement.getBoundingClientRect().top
                            const offsetPosition = elementPosition + window.pageYOffset - offset

                            window.scrollTo({
                              top: offsetPosition,
                              behavior: 'smooth'
                            })
                          }
                        }, 300)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all group ${
                        isDark 
                          ? 'hover:bg-white/5 text-white/80 hover:text-white' 
                          : 'hover:bg-black/5 text-gray-700 hover:text-black'
                      }`}
                    >
                      <IoDocumentTextOutline className={`h-4 w-4 flex-shrink-0 ${
                        isDark ? 'text-white/60 group-hover:text-white' : 'text-gray-400 group-hover:text-black'
                      }`} />
                      <span className="flex-1 truncate">{service.title}</span>
                      <IoChevronForward className={`h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDark ? 'text-white' : 'text-black'
                      }`} />
                    </Link>
                  ))
                )}
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT - Practice Details */}
          <main id="practice-content" className="lg:col-span-8 xl:col-span-9">
            {/* Title Card */}
            <div className={`rounded-2xl p-4 md:p-6 mb-8 border backdrop-blur-md ${
              isDark 
                ? 'bg-black/40 border-white/10' 
                : 'bg-white/20 border-white/30 shadow-xl'
            }`}>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                {translation.title}
              </h1>
            </div>

            {/* Practice Image */}
            <div className={`relative rounded-2xl overflow-hidden mb-8 border backdrop-blur-md ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
            }`}>
              <div className="relative w-full">
                <img
                  src={getOptimizedImageUrl(practice.pageHeroImageUrl, imagePresets.practiceHero)}
                  alt={translation.pageHeroImageAlt}
                  className="w-full h-auto"
                  loading="eager"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-news.svg';
                  }}
                />
              </div>
            </div>

            {/* Meta Information */}
            <div className={`rounded-2xl p-4 md:p-6 mb-8 border backdrop-blur-md ${
              isDark 
                ? 'bg-black/40 border-white/10' 
                : 'bg-white/20 border-white/30 shadow-xl'
            }`}>
              {/* Meta Info - Stacked on mobile, horizontal on desktop */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Reading Time */}
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                      <IoTimeOutline className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        {text.readingTime}
                      </p>
                      <p className="text-xs font-semibold">
                        {translation.readingTime} {text.minutes}
                      </p>
                    </div>
                  </div>

                  {/* Published Date */}
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                      <IoCalendarOutline className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        {text.published}
                      </p>
                      <p className="text-xs font-semibold whitespace-nowrap">
                        {formattedCreatedAt || '...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Share Buttons - Below on mobile, right side on desktop */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onShare('facebook')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                        : 'bg-black/5 hover:bg-black/10 text-black border border-black/10'
                    }`}
                  >
                    <IoLogoFacebook className="h-3.5 w-3.5" />
                    <span className="sm:inline">Facebook</span>
                  </button>
                  <button
                    onClick={() => onShare('linkedin')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                        : 'bg-black/5 hover:bg-black/10 text-black border border-black/10'
                    }`}
                  >
                    <IoLogoLinkedin className="h-3.5 w-3.5" />
                    <span className="sm:inline">LinkedIn</span>
                  </button>
                  <button
                    onClick={() => onShare('twitter')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 text-white border border-black/10'
                        : 'bg-black/5 hover:bg-black/10 text-black border border-black/10'
                    }`}
                  >
                    <IoLogoTwitter className="h-3.5 w-3.5" />
                    <span className="sm:inline">Twitter</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <article className={`rounded-2xl p-6 md:p-8 lg:p-10 border backdrop-blur-md ${
              isDark 
                ? 'bg-black/40 border-white/10' 
                : 'bg-white/20 border-white/30 shadow-xl'
            }`}>
              <div 
                className={`prose prose-lg md:prose-xl max-w-none ${
                  isDark 
                    ? 'prose-invert prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-blockquote:border-cyan-400/30 prose-code:text-cyan-400 prose-pre:bg-white/5' 
                    : 'prose-headings:text-black prose-p:text-gray-700 prose-strong:text-black prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-blockquote:border-blue-300 prose-code:text-blue-600 prose-pre:bg-gray-100'
                }`}
                dangerouslySetInnerHTML={{ __html: translation.description }}
              />

              {/* Last Updated */}
              <div className={`mt-12 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                  {text.updated}: <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{formattedUpdatedAt || '...'}</span>
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}
