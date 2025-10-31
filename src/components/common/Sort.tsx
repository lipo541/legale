'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { ArrowDownAZ, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import FocusTrap from './FocusTrap'

interface SortOption {
  value: string
  label: string
}

interface SortProps {
  options: SortOption[]
  value: string
  onChange: (value: string) => void
}

export default function Sort({ options, value, onChange }: SortProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => (prev + 1) % options.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => (prev - 1 + options.length) % options.length)
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(options.length - 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onChange(options[focusedIndex].value)
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
  }, [isOpen, focusedIndex, options, onChange])

  // Reset focused index when opening
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = options.findIndex(opt => opt.value === value)
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }, [isOpen, options, value])

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
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 hover:scale-[1.01] ${
          isDark
            ? 'bg-white/5 border-white/10 hover:border-white/20 text-white'
            : 'bg-white border-black/10 hover:border-black/20 text-black'
        }`}
        aria-label={`Sort options. Current: ${selectedOption?.label}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="sort-menu"
      >
        <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">
          {selectedOption?.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
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
            aria-label="Sort options"
            className={`absolute top-full right-0 mt-2 w-48 rounded-lg border shadow-xl z-20 overflow-hidden ${
              isDark
                ? 'bg-black border-white/10'
                : 'bg-white border-black/10'
            }`}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                  buttonRef.current?.focus()
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 ${
                  focusedIndex === index
                    ? isDark
                      ? 'bg-white/20 text-white'
                      : 'bg-black/10 text-black'
                    : value === option.value
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