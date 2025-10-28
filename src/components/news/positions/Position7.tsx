'use client'

import { useTheme } from '@/contexts/ThemeContext'

// Quick Link Card
export default function Position7() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`group relative h-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[0.98] ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        {/* Icon */}
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110 ${
          isDark ? 'bg-white/10' : 'bg-black/10'
        }`}>
          <svg className={`h-6 w-6 ${isDark ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        
        {/* Text */}
        <div className="space-y-1">
          <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            ბიბლიოთეკა
          </h4>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            სამართლებრივი რესურსები
          </p>
        </div>
      </div>
    </div>
  )
}
