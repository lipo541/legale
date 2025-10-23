'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'

export default function NotFound() {
  const { theme } = useTheme()
  const pathname = usePathname()
  const isDark = theme === 'dark'
  
  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 transition-colors duration-300 ${
      isDark ? 'bg-black' : 'bg-white'
    }`}>
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className={`text-9xl font-bold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          404
        </div>

        {/* Error Message */}
        <h1 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          გვერდი ვერ მოიძებნა
        </h1>

        <p className={`text-lg mb-8 transition-colors duration-300 ${
          isDark ? 'text-white/60' : 'text-black/60'
        }`}>
          სამწუხაროდ, თქვენს მიერ მოთხოვნილი გვერდი არ არსებობს.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            style={{
              backgroundColor: isDark ? '#000000' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              color: isDark ? '#FFFFFF' : '#000000',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
              e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
              e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
              e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
              e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-5 h-5" />
            უკან დაბრუნება
          </button>

          <Link
            href={`/${currentLocale}`}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: 'transparent',
              color: '#000000',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF'
              e.currentTarget.style.color = '#000000'
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)'
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-5 h-5" />
            მთავარ გვერდზე
          </Link>
        </div>

        {/* Requested Path Info */}
        <div className={`mt-8 p-4 rounded-lg transition-colors duration-300 ${
          isDark ? 'bg-white/5' : 'bg-black/5'
        }`}>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-white/40' : 'text-black/40'
          }`}>
            მოთხოვნილი გვერდი: <code className="font-mono">{pathname}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
