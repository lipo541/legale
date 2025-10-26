'use client'

import { LucideIcon, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface ObjectFieldProps {
  label: string
  icon?: LucideIcon
  value: Record<string, string>
  isEditing: boolean
  onChange?: (value: Record<string, string>) => void
  isDark: boolean
  description?: string
}

export default function ObjectField({
  label,
  icon: Icon,
  value,
  isEditing,
  onChange,
  isDark,
  description
}: ObjectFieldProps) {
  const [editableFields, setEditableFields] = useState<Record<string, string>>(value || {})

  const handleAddField = () => {
    const newKey = `New Field ${Object.keys(editableFields).length + 1}`
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
      <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>

      {isEditing ? (
        <div className="space-y-3">
          {Object.entries(editableFields).map(([key, val], index) => (
            <div key={index} className={`flex gap-2 items-start p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => handleKeyChange(key, e.target.value)}
                  placeholder="Field Name"
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors font-medium ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-emerald-400 focus:border-white/20' 
                      : 'border-black/10 bg-white text-emerald-600 focus:border-black/20'
                  }`}
                />
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  placeholder="Value"
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20' 
                      : 'border-black/10 bg-white text-black focus:border-black/20'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveField(key)}
                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                  isDark 
                    ? 'text-red-400 hover:bg-red-500/20' 
                    : 'text-red-600 hover:bg-red-500/10'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddField}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] ${
              isDark 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            <Plus className="h-4 w-4" />
            Add Field
          </button>

          {description && (
            <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {description}
            </p>
          )}
        </div>
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
