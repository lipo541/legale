'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'
import Link from 'next/link'
import { IoTimeOutline, IoCalendarOutline, IoShareSocialOutline, IoArrowBack, IoEyeOutline, IoDocumentTextOutline, IoChevronForward, IoBriefcaseOutline } from 'react-icons/io5'
import { createClient } from '@/lib/supabase/client'

interface Service {
  id: string
  title: string
  slug: string
}

interface PracticeDetailProps {
  practice: {
    id: string
    heroImageUrl: string
    pageHeroImageUrl: string
    status: string
    createdAt: string
    updatedAt: string
  }
  translation: {
    title: string
    slug: string
    description: string // HTML content
    heroImageAlt: string
    pageHeroImageAlt: string
    wordCount: number
    readingTime: number
    metaTitle: string | null
    metaDescription: string | null
    focusKeyword: string | null
    ogTitle: string | null
    ogDescription: string | null
    ogImageUrl: string | null
  }
  locale: 'ka' | 'en' | 'ru'
  relatedPractices?: Array<{
    id: string
    title: string
    slug: string
    heroImageUrl: string
    heroImageAlt: string
    readingTime: number
  }>
}

export default function PracticeDetail({ 
  practice, 
  translation, 
  locale,
  relatedPractices = []
}: PracticeDetailProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // State for services
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)

  // Fetch services for this practice
  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true)
      
      try {
        // Fetch services for this practice
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id')
          .eq('practice_id', practice.id)
          .eq('status', 'published')

        if (servicesError) {
          console.error('Error fetching services:', servicesError)
          return
        }

        if (!servicesData || servicesData.length === 0) {
          setServices([])
          setServicesLoading(false)
          return
        }

        // Fetch translations for these services
        const serviceIds = servicesData.map(s => s.id)
        const { data: translationsData, error: translationsError } = await supabase
          .from('service_translations')
          .select('service_id, title, slug')
          .in('service_id', serviceIds)
          .eq('language', locale)

        if (translationsError) {
          console.error('Error fetching service translations:', translationsError)
          return
        }

        // Combine services with their translations
        const servicesWithTranslations: Service[] = servicesData
          .map(service => {
            const translation = translationsData?.find(t => t.service_id === service.id)
            if (!translation) return null
            return {
              id: service.id,
              title: translation.title,
              slug: translation.slug
            }
          })
          .filter((s): s is Service => s !== null)

        setServices(servicesWithTranslations)
      } catch (error) {
        console.error('Fetch error:', error)
      } finally {
        setServicesLoading(false)
      }
    }

    fetchServices()
  }, [practice.id, locale, supabase])

  // Format date based on locale
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    
    const localeMap = {
      ka: 'ka-GE',
      en: 'en-US',
      ru: 'ru-RU'
    }
    
    return date.toLocaleDateString(localeMap[locale], options)
  }

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: translation.ogTitle || translation.metaTitle || translation.title,
      text: translation.ogDescription || translation.metaDescription || '',
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      alert(locale === 'ka' ? 'ბმული დაკოპირდა!' : locale === 'en' ? 'Link copied!' : 'Ссылка скопирована!')
    }
  }

  // Localized text
  const text = {
    services: locale === 'ka' ? 'Services' : locale === 'en' ? 'Services' : 'Услуги',
    servicesAvailable: locale === 'ka' ? `${services.length} სერვისი ხელმისაწვდომია` : locale === 'en' ? `${services.length} services available` : `${services.length} услуг доступно`,
    searchServices: locale === 'ka' ? 'სერვისების ძებნა...' : locale === 'en' ? 'Search services...' : 'Поиск услуг...',
    noServices: locale === 'ka' ? 'სერვისები არ მოიძებნა' : locale === 'en' ? 'No services found' : 'Услуги не найдены',
    loading: locale === 'ka' ? 'იტვირთება...' : locale === 'en' ? 'Loading...' : 'Загрузка...',
    back: locale === 'ka' ? 'უკან' : locale === 'en' ? 'Back' : 'Назад',
    share: locale === 'ka' ? 'გაზიარება' : locale === 'en' ? 'Share' : 'Поделиться',
    readingTime: locale === 'ka' ? 'წაკითხვის დრო' : locale === 'en' ? 'Reading Time' : 'Время чтения',
    minutes: locale === 'ka' ? 'წთ' : locale === 'en' ? 'min' : 'мин',
    published: locale === 'ka' ? 'გამოქვეყნდა' : locale === 'en' ? 'Published' : 'Опубликовано',
    updated: locale === 'ka' ? 'განახლდა' : locale === 'en' ? 'Updated' : 'Обновлено',
    wordCount: locale === 'ka' ? 'სიტყვების რაოდენობა' : locale === 'en' ? 'Word Count' : 'Количество слов',
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
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
          
          {/* LEFT SIDEBAR - Services (Static) */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className={`sticky top-20 rounded-2xl p-6 border ${
              isDark 
                ? 'border-white/10' 
                : 'border-gray-200'
            }`}>
              {/* Services Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <IoBriefcaseOutline className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
                  <h2 className="text-xl font-bold">{text.services}</h2>
                </div>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                  {text.servicesAvailable}
                </p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className={`relative rounded-lg border ${
                  isDark ? 'border-white/10' : 'border-gray-200'
                }`}>
                  <input
                    type="text"
                    placeholder={text.searchServices}
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
              <div className="space-y-2">
                {servicesLoading ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {text.loading}
                    </p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {text.noServices}
                    </p>
                  </div>
                ) : (
                  services.map((service) => (
                    <button
                      key={service.id}
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
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT - Practice Details (Dynamic) */}
          <main className="lg:col-span-8 xl:col-span-9">
            {/* Title Card */}
            <div className={`rounded-2xl p-4 md:p-6 mb-8 border ${
              isDark 
                ? 'border-white/10' 
                : 'border-gray-200'
            }`}>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 leading-tight">
                {translation.title}
              </h1>

              {/* Meta Information */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                    <p className="text-xs font-semibold">
                      {formatDate(practice.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Word Count */}
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                    <IoEyeOutline className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {text.wordCount}
                    </p>
                    <p className="text-xs font-semibold">
                      {translation.wordCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <button
                  onClick={handleShare}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 text-white' 
                      : 'bg-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  <IoShareSocialOutline className="h-3.5 w-3.5" />
                  {text.share}
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div className={`relative rounded-2xl overflow-hidden mb-8 ${
              isDark ? 'border border-white/10' : 'border border-gray-200'
            }`}>
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
                <Image
                  src={practice.pageHeroImageUrl}
                  alt={translation.pageHeroImageAlt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 60vw"
                  quality={90}
                />
              </div>
            </div>

            {/* Main Content */}
            <article className={`rounded-2xl p-6 md:p-8 lg:p-10 border ${
              isDark 
                ? 'border-white/10' 
                : 'border-gray-200'
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
                  {text.updated}: <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{formatDate(practice.updatedAt)}</span>
                </p>
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}
