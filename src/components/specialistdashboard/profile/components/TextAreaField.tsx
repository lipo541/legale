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
      <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {label} {required && '*'}
      </label>
      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            mono ? 'font-mono text-sm' : ''
          } ${
            isDark 
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20' 
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      ) : (
        <p className={`text-base whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          {value || 'N/A'}
        </p>
      )}
    </div>
  )
}
