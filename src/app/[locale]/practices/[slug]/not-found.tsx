'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'

export default function PracticeNotFound() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'

  const text = {
    title: locale === 'ka' 
      ? 'პრაქტიკა ვერ მოიძებნა' 
      : locale === 'en' 
      ? 'Practice Not Found' 
      : 'Практика не найдена',
    description: locale === 'ka'
      ? 'სამწუხაროდ, თქვენ მიერ მოთხოვნილი პრაქტიკა არ არსებობს ან წაშლილია.'
      : locale === 'en'
      ? 'Sorry, the practice you requested does not exist or has been removed.'
      : 'К сожалению, запрошенная практика не существует или была удалена.',
    backToPractices: locale === 'ka' 
      ? 'პრაქტიკებზე დაბრუნება' 
      : locale === 'en' 
      ? 'Back to Practices' 
      : 'Вернуться к практикам',
    goHome: locale === 'ka' 
      ? 'მთავარ გვერდზე' 
      : locale === 'en' 
      ? 'Go Home' 
      : 'На главную',
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDark ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 text-center">
        <div className={`max-w-2xl mx-auto rounded-2xl p-12 ${
          isDark 
            ? 'bg-gradient-to-br from-gray-900 to-black border border-white/10' 
            : 'bg-white border border-gray-200 shadow-xl'
        }`}>
          {/* Icon */}
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isDark ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <FileQuestion className={`w-12 h-12 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`} />
          </div>

          {/* Title */}
          <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {text.title}
          </h1>

          {/* Description */}
          <p className={`text-lg mb-8 ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}>
            {text.description}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/practices`}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              {text.backToPractices}
            </Link>

            <Link
              href={`/${locale}`}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-gray-100 text-black hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <Home className="w-5 h-5" />
              {text.goHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
