'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PracticeData {
  id: string
  hero_image_url: string
  practice_translations: Array<{
    title: string
    slug: string
    description: string
    hero_image_alt: string
    word_count: number
    reading_time: number
  }>
}

export default function PracticeCard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'

  const [practices, setPractices] = useState<PracticeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPractices() {
      const supabase = createClient()
      
      try {
        const { data, error } = await supabase
          .from('practices')
          .select(`
            id,
            hero_image_url,
            practice_translations!inner (
              title,
              slug,
              description,
              hero_image_alt,
              word_count,
              reading_time
            )
          `)
          .eq('status', 'published')
          .eq('practice_translations.language', locale)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching practices:', error)
          setPractices([])
        } else if (data) {
          // Filter out any practices without translations
          const validPractices = data.filter(
            (practice) => practice.practice_translations && practice.practice_translations.length > 0
          )
          setPractices(validPractices as PracticeData[])
        }
      } catch (err) {
        console.error('Unexpected error fetching practices:', err)
        setPractices([])
      } finally {
        setLoading(false)
      }
    }

    fetchPractices()
  }, [locale])

  // Extract plain text from HTML for preview
  const getPlainTextPreview = (html: string, maxLength: number = 150): string => {
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <>
      {practices.map((practice) => {
        const translation = practice.practice_translations[0]
        const preview = getPlainTextPreview(translation.description)

        return (
          <Link 
            key={practice.id}
            href={`/${locale}/practices/${translation.slug}`}
            className={`group block rounded-lg overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20' 
                : 'bg-white hover:bg-gray-50 border border-black/10 hover:border-black/20 shadow-sm hover:shadow-md'
            }`}
          >
            {/* Image Section */}
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={practice.hero_image_url}
                alt={translation.hero_image_alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Reading Time Badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-white">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-medium">
                  {translation.reading_time} {locale === 'ka' ? 'წთ' : locale === 'en' ? 'min' : 'мин'}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-3 md:p-4">
              {/* Title */}
              <h3 className={`text-base md:text-lg font-bold mb-1.5 line-clamp-2 transition-colors ${
                isDark 
                  ? 'text-white group-hover:text-blue-400' 
                  : 'text-black group-hover:text-blue-600'
              }`}>
                {translation.title}
              </h3>

              {/* Description Preview */}
              <p className={`text-xs md:text-sm mb-3 line-clamp-2 ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}>
                {preview}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Word Count */}
                <span className={`text-[10px] md:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  {translation.word_count.toLocaleString()} {locale === 'ka' ? 'სიტყვა' : locale === 'en' ? 'words' : 'слов'}
                </span>

                {/* Read More Link */}
                <span className={`flex items-center gap-1 text-xs md:text-sm font-medium transition-all ${
                  isDark 
                    ? 'text-blue-400 group-hover:gap-1.5' 
                    : 'text-blue-600 group-hover:gap-1.5'
                }`}>
                  {locale === 'ka' ? 'ვრცლად' : locale === 'en' ? 'Read more' : 'Подробнее'}
                  <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </>
  )
}
