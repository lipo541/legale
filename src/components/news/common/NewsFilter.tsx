'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { newsTranslations } from '@/translations/news'
import { createClient } from '@/lib/supabase/client'
import FocusTrap from '@/components/common/FocusTrap'

interface Category {
  id: string
  name: string
}

interface NewsFilterProps {
  onFilterChange: (selectedCategories: string[]) => void
  selectedCategories?: string[]
}

export default function NewsFilter({ 
  onFilterChange,
  selectedCategories = []
}: NewsFilterProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch categories from Supabase
  const fetchCategories = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const { data: categoriesData, error } = await supabase
        .from('post_category_translations')
        .select(`
          category_id,
          name,
          language,
          post_categories!inner(parent_id)
        `)
        .eq('language', locale)
        .is('post_categories.parent_id', null)

      if (error) throw error

      const uniqueCategories = new Map<string, Category>()
      categoriesData?.forEach((cat) => {
        if (!uniqueCategories.has(cat.category_id)) {
          uniqueCategories.set(cat.category_id, {
            id: cat.category_id,
            name: cat.name
          })
        }
      })

      setCategories(Array.from(uniqueCategories.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      ))
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleToggleCategory = useCallback((categoryId: string) => {
    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    
    onFilterChange(newSelection)
  }, [selectedCategories, onFilterChange])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => (prev + 1) % categories.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => (prev - 1 + categories.length) % categories.length)
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(categories.length - 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          handleToggleCategory(categories[focusedIndex].id)
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          buttonRef.current?.focus()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, categories, handleToggleCategory])

  const handleClearAll = () => {
    onFilterChange([])
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  const activeCount = selectedCategories.length
  const displayText = activeCount > 0 
    ? `${t.filterButton} (${activeCount})` 
    : t.allCategories

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg border transition-all duration-300 hover:scale-[1.01] ${
          activeCount > 0
            ? isDark
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-600'
            : isDark
            ? 'bg-white/5 border-white/10 hover:border-white/20 text-white'
            : 'bg-white border-black/10 hover:border-black/20 text-black'
        }`}
        aria-label={`${t.filterButton}. ${displayText}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="filter-menu"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{displayText}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Options with Focus Trap */}
          <FocusTrap 
            isActive={isOpen}
            onEscape={() => {
              setIsOpen(false)
              buttonRef.current?.focus()
            }}
            restoreFocus={false}
          >
            <div
              ref={menuRef}
              id="filter-menu"
              role="listbox"
              aria-label={t.filterTitle}
              aria-multiselectable="true"
              className={`absolute top-full left-0 mt-2 w-72 rounded-lg border shadow-xl z-20 overflow-hidden ${
                isDark
                  ? 'bg-black border-white/10'
                  : 'bg-white border-black/10'
              }`}
            >
              {/* Header with Clear Button */}
              {activeCount > 0 && (
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                  isDark ? 'border-white/10' : 'border-black/10'
                }`}>
                  <span className={`text-sm font-medium ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    {t.filterTitle}
                  </span>
                  <button
                    onClick={handleClearAll}
                    className={`text-xs font-medium transition-colors ${
                      isDark
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {t.clearFilters}
                  </button>
                </div>
              )}

              {/* Categories List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div
                      className={`h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    />
                  </div>
                ) : categories.length === 0 ? (
                  <div
                    className={`py-8 text-center text-sm ${
                      isDark ? 'text-white/40' : 'text-black/40'
                    }`}
                  >
                    {t.allCategories}
                  </div>
                ) : (
                  categories.map((category, index) => {
                    const isSelected = selectedCategories.includes(category.id)
                    
                    return (
                      <button
                        key={category.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleToggleCategory(category.id)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 flex items-center gap-3 ${
                          focusedIndex === index
                            ? isDark
                              ? 'bg-white/20 text-white'
                              : 'bg-black/10 text-black'
                            : isSelected
                            ? isDark
                              ? 'bg-white/10 text-white font-medium'
                              : 'bg-black/5 text-black font-medium'
                            : isDark
                            ? 'text-white/70 hover:bg-white/5 hover:text-white'
                            : 'text-black/70 hover:bg-black/5 hover:text-black'
                        }`}
                        onMouseEnter={() => setFocusedIndex(index)}
                      >
                        {/* Checkbox */}
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border flex-shrink-0 ${
                            isSelected
                              ? isDark
                                ? 'border-white bg-white'
                                : 'border-black bg-black'
                              : isDark
                              ? 'border-white/20'
                              : 'border-black/20'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className={`h-3 w-3 ${isDark ? 'text-black' : 'text-white'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        
                        <span>{category.name}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </FocusTrap>
        </>
      )}
    </div>
  )
}
