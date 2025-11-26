'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'
import { Cookie, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Section {
  id: string
  title: string
  content: string
}

interface CookiesContentProps {
  locale: Locale
}

export default function CookiesContent({ locale }: CookiesContentProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [lastUpdated, setLastUpdated] = useState('')

  // Fetch content from database
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      
      // Get cookies page
      const { data: pageData } = await supabase
        .from('legal_pages')
        .select('id, updated_at')
        .eq('page_type', 'cookies')
        .single()

      if (pageData) {
        setLastUpdated(pageData.updated_at)

        // Get translation for current locale
        const { data: translationData } = await supabase
          .from('legal_page_translations')
          .select('title, intro, content')
          .eq('legal_page_id', pageData.id)
          .eq('language', locale)
          .single()

        if (translationData) {
          setTitle(translationData.title)
          setIntro(translationData.intro || '')
          setSections(Array.isArray(translationData.content) ? translationData.content : [])
        }
      }
      
      setLoading(false)
    }

    fetchContent()
  }, [locale, supabase])

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return new Date().getFullYear().toString()
    return new Date(dateString).toLocaleDateString(
      locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    )
  }

  // Labels
  const labels = {
    ka: { lastUpdated: 'ბოლო განახლება', allRights: 'ყველა უფლება დაცულია' },
    en: { lastUpdated: 'Last Updated', allRights: 'All rights reserved' },
    ru: { lastUpdated: 'Последнее обновление', allRights: 'Все права защищены' }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
        <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-150 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header Section */}
      <div className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-16">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
          }`}>
            <Cookie className={`w-3.5 h-3.5 ${isDark ? 'text-white/70' : 'text-black/70'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {labels[locale].lastUpdated}: {formatDate(lastUpdated)}
            </span>
          </div>
          
          <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
            {title}
          </h1>
          
          {intro && (
            <p className={`text-sm leading-relaxed max-w-[700px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {intro}
            </p>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-12">
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                {section.title}
              </h2>
              <div 
                className={`text-sm leading-relaxed prose-sm ${isDark ? 'text-white/60 prose-invert' : 'text-black/60'}`}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </section>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className={`border-t mt-16 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-8">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            © {new Date().getFullYear()} LegalGE. {labels[locale].allRights}.
          </p>
        </div>
      </div>
    </div>
  )
}
