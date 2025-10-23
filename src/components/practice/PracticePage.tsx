'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Search, Command } from 'lucide-react'
import PracticeCard from './PracticeCard'

export default function PracticePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className={`min-h-screen py-8 md:py-12 lg:py-16 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="container mx-auto px-4 max-w-[1200px]">
        {/* Page Title */}
        <div className="mb-6 md:mb-8">
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {locale === 'ka' ? 'პრაქტიკა' : locale === 'en' ? 'Practice' : 'Практика'}
          </h1>

          {/* Search Bar */}
          <div className="relative w-full">
            <div className={`relative flex items-center rounded-lg border transition-colors ${
              isDark 
                ? 'bg-white/5 border-white/10 focus-within:border-white/20' 
                : 'bg-white border-black/10 focus-within:border-black/20'
            }`}>
              <Search className={`absolute left-3 md:left-4 h-4 w-4 md:h-5 md:w-5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'ka' 
                    ? 'პრაქტიკების და სერვისების ძიება...' 
                    : locale === 'en' 
                    ? 'Search practices and services...' 
                    : 'Поиск практик и услуг...'
                }
                className={`w-full py-2.5 md:py-3 pl-10 md:pl-12 pr-16 md:pr-20 rounded-lg bg-transparent outline-none transition-colors text-sm md:text-base ${
                  isDark 
                    ? 'text-white placeholder:text-white/40' 
                    : 'text-black placeholder:text-black/40'
                }`}
              />
              <div className={`absolute right-2 md:right-3 flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}>
                <Command className={`h-2.5 w-2.5 md:h-3 md:w-3 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                <span className={`text-[10px] md:text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  K
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <PracticeCard />
        </div>
      </div>
    </div>
  )
}
