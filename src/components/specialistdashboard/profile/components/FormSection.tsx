'use client'

import { ReactNode } from 'react'
import { Edit, Save, X, Loader2 } from 'lucide-react'
import { specialistDashboardTranslations, Locale } from '@/translations/specialist-dashboard'

interface FormSectionProps {
  title: string
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving?: boolean
  isDark: boolean
  children: ReactNode
  showBorder?: boolean
  locale?: Locale
}

export default function FormSection({
  title,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  saving = false,
  isDark,
  children,
  showBorder = true,
  locale = 'ka'
}: FormSectionProps) {
  const t = specialistDashboardTranslations[locale]
  return (
    <div className={`mb-3 lg:mb-4 pb-3 lg:pb-4 ${showBorder ? isDark ? 'border-b border-white/10' : 'border-b border-black/10' : ''}`}>
      <div className="flex items-center justify-between mb-2 lg:mb-3">
        <h2 className={`text-sm lg:text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </h2>
        {!isEditing && (
          <button
            onClick={onEdit}
            className={`rounded-lg p-1.5 transition-all active:scale-95 ${
              isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-black/5 text-black/50'
            }`}
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      
      {children}
      
      {isEditing && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className={`
              rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 
              flex items-center gap-1.5 disabled:opacity-50
              ${isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
              }
            `}
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                {t.save}
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            className={`
              rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 
              flex items-center gap-1.5
              ${isDark 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
              }
            `}
          >
            <X className="h-3 w-3" />
            {t.cancel}
          </button>
        </div>
      )}
    </div>
  )
}
