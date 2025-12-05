'use client'

import { LucideIcon } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface ListFieldProps {
  label: string
  icon?: LucideIcon
  items: string[]
  isEditing: boolean
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  isDark: boolean
  description?: string
}

export default function ListField({
  label,
  icon: Icon,
  items,
  isEditing,
  value,
  onChange,
  placeholder,
  rows = 4,
  isDark,
  description
}: ListFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const displayValue = value !== undefined && value !== '' ? value : (items && items.length > 0 ? items.join('\n') : '')

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && isEditing) {
      textarea.style.height = 'auto'
      const minHeight = rows * 24 // approximate line height
      textarea.style.height = Math.max(textarea.scrollHeight, minHeight) + 'px'
    }
  }, [displayValue, isEditing, rows])

  return (
    <div>
      <label className={`mb-1.5 lg:mb-2 flex items-center gap-1.5 text-[10px] lg:text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        {Icon && <Icon className="h-3 lg:h-3.5 w-3 lg:w-3.5" />}
        {label}
      </label>
      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`w-full rounded-lg border px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm transition-colors overflow-hidden font-mono ${
              isDark 
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20 placeholder:text-white/30' 
                : 'border-black/10 bg-black/[0.02] text-black focus:border-black/20 placeholder:text-black/30'
            }`}
          />
          {description && (
            <p className={`mt-1 text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {description}
            </p>
          )}
        </>
      ) : (
        <ul className={`list-disc list-inside space-y-0.5 text-xs lg:text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))
          ) : (
            <p className="text-xs">N/A</p>
          )}
        </ul>
      )}
    </div>
  )
}
