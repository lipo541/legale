'use client'

import { LucideIcon } from 'lucide-react'

interface JsonFieldProps {
  label: string
  icon?: LucideIcon
  value: Record<string, string>
  isEditing: boolean
  textValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  isDark: boolean
  description?: string
}

export default function JsonField({
  label,
  icon: Icon,
  value,
  isEditing,
  textValue,
  onChange,
  placeholder,
  rows = 8,
  isDark,
  description
}: JsonFieldProps) {
  return (
    <div>
      <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
      {isEditing ? (
        <>
          <textarea
            value={textValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none font-mono text-sm ${
              isDark 
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20' 
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
          {description && (
            <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {description}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          {value && Object.keys(value).length > 0 ? (
            Object.entries(value).map(([key, val]) => (
              <div key={key} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {key}
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {val}
                </p>
              </div>
            ))
          ) : (
            <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>N/A</p>
          )}
        </div>
      )}
    </div>
  )
}
