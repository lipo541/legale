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
      <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {label} {required && '*'}
      </label>
      {isEditing && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-4 py-3 transition-colors ${
            isDark 
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20' 
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      ) : (
        <div>
          <p className={`text-${readOnly ? 'base' : 'lg'} font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {value || 'N/A'}
          </p>
          {description && (
            <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
