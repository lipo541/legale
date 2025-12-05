'use client'

import { LucideIcon } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface TextAreaFieldProps {
  label: string
  icon?: LucideIcon
  value: string
  isEditing: boolean
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
  isDark: boolean
  mono?: boolean
}

export default function TextAreaField({
  label,
  icon: Icon,
  value,
  isEditing,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  isDark,
  mono = false
}: TextAreaFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && isEditing) {
      textarea.style.height = 'auto'
      const minHeight = rows * 24 // approximate line height
      textarea.style.height = Math.max(textarea.scrollHeight, minHeight) + 'px'
    }
  }, [value, isEditing, rows])

  return (
    <div>
      <label className={`mb-1.5 lg:mb-2 flex items-center gap-1.5 text-[10px] lg:text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        {Icon && <Icon className="h-3 lg:h-3.5 w-3 lg:w-3.5" />}
        {label} {required && '*'}
      </label>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full rounded-lg border px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm transition-colors overflow-hidden ${
            mono ? 'font-mono' : ''
          } ${
            isDark 
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20 placeholder:text-white/30' 
              : 'border-black/10 bg-black/[0.02] text-black focus:border-black/20 placeholder:text-black/30'
          }`}
        />
      ) : (
        <p className={`text-xs lg:text-sm whitespace-pre-wrap ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          {value || 'N/A'}
        </p>
      )}
    </div>
  )
}
