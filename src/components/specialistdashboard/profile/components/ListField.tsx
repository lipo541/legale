'use client'

import { LucideIcon } from 'lucide-react'

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
  rows = 6,
  isDark,
  description
}: ListFieldProps) {
  return (
    <div>
      <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
      {isEditing ? (
        <>
          <textarea
            value={value}
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
        <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))
          ) : (
            <p>N/A</p>
          )}
        </ul>
      )}
    </div>
  )
}
