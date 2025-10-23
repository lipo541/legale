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
  
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 transition-colors duration-300 ${
      isDark ? 'bg-black' : 'bg-white'
    }`}>
      <div className="text-center max-w-md">
        <div className={`text-9xl font-bold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          404
        </div>

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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 border ${
              isDark ? 'border-white/20 text-white hover:bg-white hover:text-black' : 'border-black/20 text-black hover:bg-black hover:text-white'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            უკან დაბრუნება
          </button>

          <Link
            href={`/${currentLocale}`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 bg-white text-black hover:bg-black hover:text-white shadow-sm"
          >
            <Home className="w-5 h-5" />
            მთავარ გვერდზე
          </Link>
        </div>

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
