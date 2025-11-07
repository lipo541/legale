'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { locales, localeLabels, type Locale } from '@/lib/i18n/config'

type Language = Locale

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const isDark = theme === 'dark'

  // Extract current locale from pathname
  const currentLang = (pathname.split('/')[1] as Locale) || 'ka'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const switchLanguage = async (newLocale: Locale) => {
    // Save preference to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    
    // Import getTranslatedUrl dynamically
    const { getTranslatedUrl } = await import('@/lib/i18n/getTranslatedUrl')
    
    // Get the translated URL
    const newPathname = await getTranslatedUrl(pathname, newLocale, currentLang)
    
    router.push(newPathname)
    router.refresh()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1 px-3 py-2 border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
          isOpen 
            ? isDark 
              ? 'rounded-t-lg border-white/10 text-white bg-white/10' 
              : 'rounded-t-lg border-black/10 text-black bg-black/5'
            : isDark
              ? 'rounded-lg border-white/10 text-white hover:bg-white/10'
              : 'rounded-lg border-black/10 text-black hover:bg-black/5'
        }`}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium">{localeLabels[currentLang]}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-white/50' : 'text-black/50'}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 -mt-px rounded-b-lg border-x border-b shadow-2xl w-full z-50 overflow-hidden backdrop-blur-md transition-all duration-150 ${
            isDark 
              ? 'bg-gray-900/95 border-white/20' 
              : 'bg-white/95 border-black/20'
          }`}
        >
          {locales
            .filter(lang => lang !== currentLang)
            .map((lang) => (
            <button
              key={lang}
              onClick={() => switchLanguage(lang)}
              className={`w-full px-4 py-3 text-center text-sm font-medium transition-all duration-150 ${
                isDark
                  ? 'text-white/90 hover:bg-white/10 hover:text-white'
                  : 'text-black/90 hover:bg-black/5 hover:text-black'
              }`}
            >
              {localeLabels[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
