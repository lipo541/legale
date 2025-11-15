'use client'

import { LucideIcon } from 'lucide-react'

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
  rows = 4,
  required = false,
  isDark,
  mono = false
}: TextAreaFieldProps) {
  return (
    <div>
      <label className={`mb-2 lg:mb-3 flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {Icon && <Icon className="h-3 lg:h-4 w-3 lg:w-4" />}
        {label} {required && '*'}
      </label>
      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full rounded-lg border px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base transition-colors resize-none ${
            mono ? 'font-mono text-xs lg:text-sm' : ''
          } ${
            isDark 
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20' 
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      ) : (
        <p className={`text-xs lg:text-base whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          {value || 'N/A'}
        </p>
      )}
    </div>
  )
}
