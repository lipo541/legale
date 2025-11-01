'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Search, X } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { newsTranslations } from '@/translations/news'

interface NewsSearchProps {
  onSearch: (query: string) => void
  resultsCount?: number
  placeholder?: string
  autoFocus?: boolean
}

export default function NewsSearch({ 
  onSearch, 
  resultsCount, 
  placeholder,
  autoFocus = false 
}: NewsSearchProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search - 300ms delay
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearch(query.trim())
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, onSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }, [onSearch])

  // Command+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }

      // ESC to clear and blur
      if (e.key === 'Escape') {
        if (query) {
          handleClear()
        } else {
          inputRef.current?.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [query, handleClear])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div
        className={`relative flex items-center rounded-xl border transition-all duration-200 ${
          isFocused
            ? isDark
              ? 'border-blue-500 bg-white/10 shadow-lg shadow-blue-500/20'
              : 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
            : isDark
            ? 'border-white/10 bg-white/5 hover:border-white/20'
            : 'border-black/10 bg-black/5 hover:border-black/20'
        }`}
      >
        {/* Search Icon */}
        <div className="pointer-events-none absolute left-3 flex items-center">
          <Search
            className={`h-4 w-4 transition-colors ${
              isFocused
                ? isDark
                  ? 'text-blue-400'
                  : 'text-blue-600'
                : isDark
                ? 'text-white/40'
                : 'text-black/40'
            }`}
          />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || t.searchPlaceholder}
          autoFocus={autoFocus}
          aria-label={t.searchAriaLabel}
          aria-describedby="search-description"
          className={`w-full rounded-xl py-2.5 pl-10 pr-20 text-sm outline-none transition-colors placeholder:text-sm ${
            isDark
              ? 'bg-transparent text-white placeholder:text-white/40'
              : 'bg-transparent text-black placeholder:text-black/40'
          }`}
        />

        {/* Results Counter & Clear Button */}
        <div className="absolute right-2 flex items-center gap-2">
          {/* Results Counter */}
          {query && resultsCount !== undefined && (
            <div
              className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-blue-500/10 text-blue-700'
              }`}
            >
              {resultsCount}
            </div>
          )}

          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              className={`group rounded-lg p-1.5 transition-all hover:scale-110 active:scale-95 ${
                isDark
                  ? 'hover:bg-white/10 active:bg-white/20'
                  : 'hover:bg-black/10 active:bg-black/20'
              }`}
            >
              <X
                className={`h-4 w-4 transition-colors ${
                  isDark
                    ? 'text-white/60 group-hover:text-white'
                    : 'text-black/60 group-hover:text-black'
                }`}
              />
            </button>
          )}

          {/* Keyboard Shortcut Hint */}
          {!query && !isFocused && (
            <div
              className={`hidden items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium md:flex ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white/40'
                  : 'border-black/10 bg-black/5 text-black/40'
              }`}
            >
              <kbd className="text-[10px]">⌘</kbd>
              <kbd className="text-[10px]">K</kbd>
            </div>
          )}
        </div>
      </div>

      {/* Screen Reader Description */}
      <span id="search-description" className="sr-only">
        {t.searchDescription}
      </span>

      {/* Active Search Indicator */}
      {query && (
        <div className="mt-2 flex items-center justify-between">
          <p
            className={`text-xs ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}
          >
            {resultsCount !== undefined && resultsCount > 0
              ? t.resultsFound.replace('{count}', resultsCount.toString())
              : t.noResults}
          </p>
          
          {/* Quick Clear Link */}
          <button
            onClick={handleClear}
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
    </div>
  )
}
