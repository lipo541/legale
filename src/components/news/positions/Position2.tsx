'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'

// Vertical News Feed
export default function Position2() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const news = [
    { id: 1, title: 'ახალი საგადასახადო რეგულაციები', date: '27 ოქტ', category: 'რეგულაცია' },
    { id: 2, title: 'საბანკო სექტორის განახლება', date: '26 ოქტ', category: 'ფინანსები' },
    { id: 3, title: 'კორპორატიული სამართალი', date: '25 ოქტ', category: 'ბიზნესი' }
  ]

  return (
    <div className="flex h-full flex-col gap-3">
      {news.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          className={`group relative cursor-pointer rounded-xl p-4 transition-all duration-300 ${
            isDark 
              ? 'bg-white/5 hover:bg-white/10' 
              : 'bg-black/5 hover:bg-black/10'
          }`}
        >
          {/* Animated border */}
          <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
            hoveredId === item.id 
              ? isDark 
                ? 'opacity-100 ring-1 ring-white/20' 
                : 'opacity-100 ring-1 ring-black/20'
              : 'opacity-0'
          }`} />
          
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                {item.date}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
              }`}>
                {item.category}
              </span>
            </div>
            
            <h3 className={`text-sm font-medium leading-snug transition-opacity ${
              isDark ? 'text-white' : 'text-black'
            } ${hoveredId === item.id ? 'opacity-60' : 'opacity-100'}`}>
              {item.title}
            </h3>
            
            {/* Arrow indicator */}
            <div className={`flex items-center gap-1 text-xs font-medium transition-all duration-300 ${
              isDark ? 'text-white/60' : 'text-black/60'
            } ${hoveredId === item.id ? 'translate-x-1' : 'translate-x-0'}`}>
              <span>წაიკითხე</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
