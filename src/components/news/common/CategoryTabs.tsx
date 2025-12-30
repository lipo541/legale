'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useRef, useEffect } from 'react'
import { newsTranslations } from '@/translations/news'

interface CategoryTabsProps {
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  activeCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
  locale: string
  postCounts?: Map<string, number>
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  locale,
  postCounts
}: CategoryTabsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Scroll active tab into view on mount and when active changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const activeTab = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const activeRect = activeTab.getBoundingClientRect()
      
      // Calculate scroll position to center the active tab
      const scrollLeft = activeTab.offsetLeft - (containerRect.width / 2) + (activeRect.width / 2)
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  }, [activeCategory])

  return (
    <div className="mb-6 md:mb-8">
      {/* Tabs Container */}
      <div 
        ref={scrollRef}
        className={`
          flex gap-2 md:gap-3
          overflow-x-auto snap-x snap-mandatory
          pb-2 md:pb-0
          md:overflow-visible md:flex-wrap md:justify-center
          scrollbar-thin
          ${isDark 
            ? 'scrollbar-thumb-white/20 scrollbar-track-transparent' 
            : 'scrollbar-thumb-black/20 scrollbar-track-transparent'
          }
        `}
      >
        {/* "All" Tab */}
        <button
          ref={activeCategory === null ? activeRef : null}
          onClick={() => onCategoryChange(null)}
          className={`
            flex-shrink-0 snap-start
            px-4 py-2 md:px-5 md:py-2.5
            rounded-full
            text-xs md:text-sm font-medium
            transition-all duration-200
            active:scale-[0.98]
            whitespace-nowrap
            ${activeCategory === null
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
              : isDark
                ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                : 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
            }
          `}
        >
          {t.allCategories || 'ყველა'}
        </button>

        {/* Category Tabs - only show categories with posts */}
        {categories
          .filter(category => !postCounts || (postCounts.get(category.id) || 0) > 0)
          .map((category) => {
          const isActive = activeCategory === category.id
          const count = postCounts?.get(category.id) || 0
          
          return (
            <button
              key={category.id}
              ref={isActive ? activeRef : null}
              onClick={() => onCategoryChange(category.id)}
              className={`
                flex-shrink-0 snap-start
                flex items-center gap-1.5 md:gap-2
                px-4 py-2 md:px-5 md:py-2.5
                rounded-full
                text-xs md:text-sm font-medium
                transition-all duration-200
                active:scale-[0.98]
                whitespace-nowrap
                ${isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : isDark
                    ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    : 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
                }
              `}
            >
              <span>{category.name}</span>
              {count > 0 && (
                <span className={`
                  rounded-full px-1.5 py-0.5 text-[10px] font-medium
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : isDark
                      ? 'bg-white/10 text-white/60'
                      : 'bg-black/10 text-black/60'
                  }
                `}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
