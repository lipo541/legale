'use client'

import { LucideIcon, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const objectFieldTranslations = {
  ka: {
    name: 'სახელი',
    value: 'მნიშვნელობა',
    add: 'დამატება',
    field: 'ველი'
  },
  en: {
    name: 'Name',
    value: 'Value',
    add: 'Add',
    field: 'Field'
  },
  ru: {
    name: 'Название',
    value: 'Значение',
    add: 'Добавить',
    field: 'Поле'
  }
}

type Locale = 'ka' | 'en' | 'ru'

interface ObjectFieldProps {
  label: string
  icon?: LucideIcon
  value: Record<string, string>
  isEditing: boolean
  onChange?: (value: Record<string, string>) => void
  isDark: boolean
  description?: string
  locale?: Locale
}

export default function ObjectField({
  label,
  icon: Icon,
  value,
  isEditing,
  onChange,
  isDark,
  description,
  locale = 'ka'
}: ObjectFieldProps) {
  const t = objectFieldTranslations[locale]
  const [editableFields, setEditableFields] = useState<Record<string, string>>(value || {})

  // Sync editableFields with value when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditableFields(value || {})
    }
  }, [isEditing, value])

  const handleAddField = () => {
    const newKey = `${t.field} ${Object.keys(editableFields).length + 1}`
    const updated = { ...editableFields, [newKey]: '' }
    setEditableFields(updated)
    onChange?.(updated)
  }

  const handleRemoveField = (key: string) => {
    const updated = { ...editableFields }
    delete updated[key]
    setEditableFields(updated)
    onChange?.(updated)
  }

  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const updated: Record<string, string> = {}
    Object.entries(editableFields).forEach(([k, v]) => {
      updated[k === oldKey ? newKey : k] = v
    })
    setEditableFields(updated)
    onChange?.(updated)
  }

  const handleValueChange = (key: string, newValue: string) => {
    const updated = { ...editableFields, [key]: newValue }
    setEditableFields(updated)
    onChange?.(updated)
  }

  return (
    <div>
      <label className={`mb-1.5 lg:mb-2 flex items-center gap-1.5 text-[10px] lg:text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        {Icon && <Icon className="h-3 lg:h-3.5 w-3 lg:w-3.5" />}
        {label}
      </label>

      {isEditing ? (
        <div className="space-y-2">
          {Object.entries(editableFields).map(([key, val], index) => (
            <div key={index} className={`flex gap-1.5 items-start p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/[0.02]'}`}>
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => handleKeyChange(key, e.target.value)}
                  placeholder={t.name}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition-colors font-medium ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20' 
                      : 'border-black/10 bg-white text-black focus:border-black/20'
                  }`}
                />
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  placeholder={t.value}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20' 
                      : 'border-black/10 bg-white text-black focus:border-black/20'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveField(key)}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  isDark 
                    ? 'text-white/40 hover:text-white/60 hover:bg-white/10' 
                    : 'text-black/40 hover:text-black/60 hover:bg-black/10'
                }`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddField}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              isDark 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            <Plus className="h-3 w-3" />
            {t.add}
          </button>

          {description && (
            <p className={`mt-1 text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {description}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {value && Object.keys(value).length > 0 ? (
            Object.entries(value).map(([key, val]) => (
              <div key={key} className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/[0.02]'}`}>
                <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  {key}
                </p>
                <p className={`text-[10px] lg:text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {val}
                </p>
              </div>
            ))
          ) : (
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>N/A</p>
          )}
        </div>
      )}
    </div>
  )
}
