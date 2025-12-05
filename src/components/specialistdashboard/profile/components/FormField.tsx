'use client'

import { LucideIcon } from 'lucide-react'

interface FormFieldProps {
  label: string
  icon?: LucideIcon
  value: string
  isEditing: boolean
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  type?: 'text' | 'tel' | 'email'
  isDark: boolean
  description?: string
}

export default function FormField({
  label,
  icon: Icon,
  value,
  isEditing,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  type = 'text',
  isDark,
  description
}: FormFieldProps) {
  return (
    <div>
      <label className={`mb-1.5 lg:mb-2 flex items-center gap-1.5 text-[10px] lg:text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        {Icon && <Icon className="h-3 lg:h-3.5 w-3 lg:w-3.5" />}
        {label} {required && '*'}
      </label>
      {isEditing && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm transition-colors ${
            isDark 
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20 placeholder:text-white/30' 
              : 'border-black/10 bg-black/[0.02] text-black focus:border-black/20 placeholder:text-black/30'
          }`}
        />
      ) : (
        <div>
          <p className={`text-xs lg:text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            {value || 'N/A'}
          </p>
          {description && (
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
