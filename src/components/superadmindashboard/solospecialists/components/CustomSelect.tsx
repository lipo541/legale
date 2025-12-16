'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  isDark: boolean
  placeholder?: string
}

const CustomSelect = memo(function CustomSelect({
  value,
  onChange,
  options,
  isDark,
  placeholder = 'აირჩიეთ...'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-lg border px-2 py-1.5 sm:py-2 text-xs font-medium transition-colors focus:outline-none ${
          isDark 
            ? 'border-white/10 bg-zinc-800 text-white hover:bg-zinc-700' 
            : 'border-black/10 bg-white text-black hover:bg-gray-50'
        }`}
      >
        <span className={selectedOption ? '' : 'opacity-50'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-white/50' : 'text-black/50'}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full rounded-lg border shadow-lg overflow-hidden ${
          isDark 
            ? 'border-white/10 bg-zinc-800' 
            : 'border-black/10 bg-white'
        }`}>
          <div className="max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-xs text-left transition-colors ${
                  value === option.value
                    ? isDark 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-emerald-500/20 text-emerald-600'
                    : isDark
                      ? 'text-white hover:bg-white/10'
                      : 'text-black hover:bg-black/5'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default CustomSelect
