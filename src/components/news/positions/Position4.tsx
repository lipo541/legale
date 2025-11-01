'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Archive, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Compact Archive Info Card
export default function Position4() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
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
    <Link href={`/${locale}/news/archive`} className="block h-full">
      <div className={`group relative h-full overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 hover:border-white/20' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-black/10 hover:border-black/20'
      }`}>
        {/* Decorative accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          isDark ? 'bg-gradient-to-r from-blue-500/50 to-purple-500/50' : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`} />

        <div className="relative flex h-full flex-col justify-between p-5">
          {/* Header with Icon */}
          <div className="flex items-start justify-between">
            <div className={`rounded-lg p-2 ${
              isDark ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <Archive className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2} />
            </div>
            
            {/* Small badge */}
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/60'
            }`}>
              სულ
            </span>
          </div>

          {/* Main Content */}
          <div className="space-y-2">
            {/* Dynamic Number */}
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl md:text-3xl font-bold tabular-nums ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {formatNumber(totalPosts)}
              </span>
              <span className={`text-lg md:text-xl font-semibold ${
                isDark ? 'text-white/50' : 'text-black/40'
              }`}>
                +
              </span>
            </div>

            {/* Description */}
            <p className={`text-xs font-medium leading-snug ${
              isDark ? 'text-white/80' : 'text-black/80'
            }`}>
              სამართლებრივი სტატია
            </p>

            {/* CTA Link */}
            <div className={`group/link inline-flex items-center gap-1 text-[10px] font-medium transition-colors ${
              isDark 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-700'
            }`}>
              <span>იხილეთ ყველა არქივში</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
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
