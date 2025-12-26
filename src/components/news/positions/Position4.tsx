'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Archive, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { newsTranslations } from '@/translations/news'

// Compact Archive Info Card
export default function Position4() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  const [totalPosts, setTotalPosts] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTotalPosts()
  }, [])

  const fetchTotalPosts = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      if (error) {
        console.error('Error fetching count:', error)
        setTotalPosts(0)
        return
      }
      
      setTotalPosts(count || 0)
    } catch (error) {
      console.error('Unexpected error:', error)
      setTotalPosts(0)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString('ka-GE')
  }

  if (loading) {
    return (
      <div className={`flex h-full items-center justify-center rounded-xl ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
      </div>
    )
  }

  return (
    <Link href={`/${locale}/news/archive`} className="block h-full overflow-hidden">
      {/* Mobile: Clean, minimal stats bar */}
      <div className={`md:hidden group h-full rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-200 active:scale-[0.98] ${
        isDark 
          ? 'bg-black/40 border-white/10' 
          : 'bg-white/20 border-white/30 shadow-xl'
      }`}>
        <div className="flex h-full items-center justify-between px-4 py-3">
          {/* Left: Icon + Number */}
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${
              isDark ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <Archive className={`h-4 w-4 ${isDark ? 'text-white/70' : 'text-black/70'}`} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-semibold tabular-nums ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {formatNumber(totalPosts)}
                </span>
                <span className={`text-[10px] ${
                  isDark ? 'text-white/30' : 'text-black/30'
                }`}>+</span>
              </div>
              <p className={`text-[11px] ${
                isDark ? 'text-white/50' : 'text-black/50'
              }`}>
                {t.legalArticles}
              </p>
            </div>
          </div>
          
          {/* Right: Arrow */}
          <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
            isDark ? 'text-white/40' : 'text-black/40'
          }`} />
        </div>
      </div>

      {/* Desktop: Original card design */}
      <div className={`hidden md:block group relative h-full overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
        isDark 
          ? 'bg-black/40 border-white/10 hover:bg-black/50 hover:border-white/20' 
          : 'bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/50 shadow-xl'
      }`}>
        {/* Decorative accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          isDark ? 'bg-gradient-to-r from-blue-500/50 to-purple-500/50' : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`} />

        <div className="relative flex h-full flex-col justify-between p-2 sm:p-3 md:p-3 lg:p-4 overflow-hidden">
          {/* Header with Icon */}
          <div className="flex items-start justify-between">
            <div className={`rounded-lg p-1.5 ${
              isDark ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <Archive className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2} />
            </div>
            
            {/* Small badge */}
            <span className={`text-[9px] md:text-[10px] lg:text-xs font-medium px-1.5 py-0.5 rounded-full ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/60'
            }`}>
              {t.total}
            </span>
          </div>

          {/* Main Content */}
          <div className="space-y-0.5 md:space-y-1">
            {/* Dynamic Number */}
            <div className="flex items-baseline gap-1">
              <span className={`text-lg md:text-xl lg:text-2xl font-bold tabular-nums ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {formatNumber(totalPosts)}
              </span>
              <span className={`text-sm md:text-base lg:text-lg font-semibold ${
                isDark ? 'text-white/50' : 'text-black/40'
              }`}>
                +
              </span>
            </div>

            {/* Description */}
            <p className={`text-[10px] md:text-[11px] lg:text-xs font-medium leading-tight line-clamp-1 ${
              isDark ? 'text-white/80' : 'text-black/80'
            }`}>
              {t.legalArticles}
            </p>

            {/* CTA Link */}
            <div className={`group/link inline-flex items-center gap-1 text-[9px] md:text-[10px] font-medium transition-colors ${
              isDark 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-700'
            }`}>
              <span className="line-clamp-1">{t.viewAllInArchive}</span>
              <ArrowRight className="h-2.5 w-2.5 flex-shrink-0 transition-transform group-hover/link:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Subtle background pattern */}
        <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-5 ${
          isDark ? 'bg-white' : 'bg-black'
        }`} />
      </div>
    </Link>
  )
}
