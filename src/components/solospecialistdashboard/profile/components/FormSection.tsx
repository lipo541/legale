'use client'

import { ReactNode } from 'react'
import { Edit, Save, X, Loader2 } from 'lucide-react'

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
  showBorder = true
}: FormSectionProps) {
  return (
    <div className={`mb-8 pb-8 ${showBorder ? 'border-b border-white/10' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </h2>
        {!isEditing && (
          <button
            onClick={onEdit}
            className={`rounded-lg p-2 transition-all hover:scale-110 ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          </button>
        )}
      </div>
      
      {children}
      
      {isEditing && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                შენახვა...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                შენახვა
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            <X className="h-4 w-4 inline mr-1" />
            გაუქმება
          </button>
        </div>
      )}
    </div>
  )
}
