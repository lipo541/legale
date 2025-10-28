'use client'

import { useTheme } from '@/contexts/ThemeContext'

// Featured Category Card
export default function Position6() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`group relative h-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[0.98] ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
        isDark 
          ? 'bg-gradient-to-br from-white/10 to-transparent' 
          : 'bg-gradient-to-br from-black/10 to-transparent'
      }`} />
      
      <div className="relative flex h-full flex-col justify-between p-6">
        {/* Icon */}
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 ${
          isDark ? 'bg-white/10' : 'bg-black/10'
        }`}>
          <svg className={`h-7 w-7 ${isDark ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            ანალიტიკა
          </h3>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            სამართლებრივი ტენდენციები და მიმოხილვები
          </p>
          
          {/* Arrow */}
          <div className={`flex items-center gap-1 pt-2 text-xs font-medium transition-all group-hover:translate-x-1 ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            <span>იხილე ყველა</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
