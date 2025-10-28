'use client'

import { useTheme } from '@/contexts/ThemeContext'

// Quick Stats Card
export default function Position4() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`flex h-full flex-col items-center justify-center rounded-2xl p-8 text-center ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${
        isDark ? 'bg-white/10' : 'bg-black/10'
      }`}>
        <svg className={`h-6 w-6 ${isDark ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      
      <div className={`mb-2 text-5xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        2,450+
      </div>
      
      <div className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        სამართლებრივი დოკუმენტი
      </div>
      
      <div className={`mt-6 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
        განახლებულია დღეს
      </div>
    </div>
  )
}
