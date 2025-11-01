'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { ArrowDownAZ, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { newsTranslations } from '@/translations/news'
import FocusTrap from '@/components/common/FocusTrap'

export type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'most-read'

interface NewsSortProps {
  onSortChange: (sortBy: SortOption) => void
  currentSort?: SortOption
}

export default function NewsSort({ 
  onSortChange,
  currentSort = 'newest'
}: NewsSortProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const sortOptions: { value: SortOption; label: string }[] = useMemo(() => [
    { value: 'newest', label: t.sortNewest },
    { value: 'oldest', label: t.sortOldest },
    { value: 'a-z', label: t.sortAZ },
    { value: 'z-a', label: t.sortZA },
    { value: 'most-read', label: t.sortMostRead },
  ], [t])

  const selectedOption = sortOptions.find(opt => opt.value === currentSort)

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => (prev + 1) % sortOptions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => (prev - 1 + sortOptions.length) % sortOptions.length)
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(sortOptions.length - 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSortChange(sortOptions[focusedIndex].value)
          setIsOpen(false)
          buttonRef.current?.focus()
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
  }, [isOpen, focusedIndex, sortOptions, onSortChange])

  // Reset focused index when opening
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = sortOptions.findIndex(opt => opt.value === currentSort)
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }, [isOpen, sortOptions, currentSort])

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg border transition-all duration-300 hover:scale-[1.01] ${
          isDark
            ? 'bg-white/5 border-white/10 hover:border-white/20 text-white'
            : 'bg-white border-black/10 hover:border-black/20 text-black'
        }`}
        aria-label={`${t.sortBy}: ${selectedOption?.label}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="sort-menu"
      >
        <ArrowDownAZ className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap truncate">
          {selectedOption?.label}
        </span>
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
              id="sort-menu"
              role="listbox"
              aria-label={t.sortByAriaLabel}
              className={`absolute top-full left-0 mt-2 w-48 rounded-lg border shadow-xl z-20 overflow-hidden max-h-48 sm:max-h-64 overflow-y-auto ${
                isDark
                  ? 'bg-black border-white/10'
                  : 'bg-white border-black/10'
              }`}
            >
              {sortOptions.map((option, index) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={currentSort === option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setIsOpen(false)
                    buttonRef.current?.focus()
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 ${
                    focusedIndex === index
                      ? isDark
                        ? 'bg-white/20 text-white'
                        : 'bg-black/10 text-black'
                      : currentSort === option.value
                      ? isDark
                        ? 'bg-white/10 text-white font-medium'
                        : 'bg-black/5 text-black font-medium'
                      : isDark
                      ? 'text-white/70 hover:bg-white/5 hover:text-white'
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FocusTrap>
        </>
      )}
    </div>
  )
}
