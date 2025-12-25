'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { HeroSlideButton, HeroButtonFormData } from '@/lib/types/hero'
import { Plus, Trash2, Link, Phone, User, Briefcase, Building } from 'lucide-react'

interface HeroButtonEditorProps {
  buttons: HeroSlideButton[]
  onChange: (buttons: HeroSlideButton[]) => void
}

const ACTION_TYPES = [
  { value: 'link', label: 'ლინკი', icon: Link },
  { value: 'contact', label: 'კონტაქტი', icon: Phone },
  { value: 'specialist', label: 'სპეციალისტი', icon: User },
  { value: 'practice', label: 'პრაქტიკა', icon: Briefcase },
  { value: 'company', label: 'კომპანია', icon: Building },
] as const

const VARIANTS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'outline', label: 'Outline' },
] as const

export default function HeroButtonEditor({ buttons, onChange }: HeroButtonEditorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<'ka' | 'en' | 'ru'>('ka')

  const addButton = () => {
    const newButton: HeroSlideButton = {
      id: `temp-${Date.now()}`,
      slide_id: '',
      text_ka: '',
      text_en: '',
      text_ru: '',
      action_type: 'link',
      action_url: '',
      open_in_new_tab: false,
      variant: 'primary',
      display_order: buttons.length,
      created_at: new Date().toISOString()
    }
    onChange([...buttons, newButton])
  }

  const removeButton = (index: number) => {
    const newButtons = buttons.filter((_, i) => i !== index)
    onChange(newButtons)
  }

  const updateButton = (index: number, updates: Partial<HeroSlideButton>) => {
    const newButtons = buttons.map((btn, i) => 
      i === index ? { ...btn, ...updates } : btn
    )
    onChange(newButtons)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
          ღილაკები
        </h3>
        <button
          type="button"
          onClick={addButton}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
            ${isDark 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-black/10 text-black hover:bg-black/20'
            }
          `}
        >
          <Plus className="w-4 h-4" />
          დამატება
        </button>
      </div>

      {buttons.length === 0 ? (
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          ღილაკები არ არის დამატებული
        </p>
      ) : (
        <div className="space-y-4">
          {buttons.map((button, index) => (
            <div
              key={button.id}
              className={`
                p-4 rounded-lg border
                ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  ღილაკი #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeButton(index)}
                  className="p-1 rounded hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Language Tabs */}
              <div className="flex gap-1 mb-3">
                {(['ka', 'en', 'ru'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveTab(lang)}
                    className={`
                      px-3 py-1 rounded text-xs font-medium uppercase
                      ${activeTab === lang
                        ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                        : isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                      }
                    `}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Button Text */}
              <input
                type="text"
                value={button[`text_${activeTab}`]}
                onChange={(e) => updateButton(index, { [`text_${activeTab}`]: e.target.value })}
                placeholder={`ღილაკის ტექსტი (${activeTab.toUpperCase()})`}
                className={`
                  w-full px-3 py-2 rounded-lg text-sm mb-3
                  ${isDark 
                    ? 'bg-white/10 text-white placeholder:text-white/40 border-white/10' 
                    : 'bg-black/5 text-black placeholder:text-black/40 border-black/10'
                  }
                  border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                `}
              />

              {/* Action Type */}
              <div className="grid grid-cols-5 gap-1 mb-3">
                {ACTION_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateButton(index, { action_type: value })}
                    className={`
                      flex flex-col items-center gap-1 p-2 rounded-lg text-xs
                      ${button.action_type === value
                        ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                        : isDark ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-black/10 text-black/60 hover:bg-black/20'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Action URL (for link type) */}
              {button.action_type === 'link' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={button.action_url || ''}
                    onChange={(e) => updateButton(index, { action_url: e.target.value })}
                    placeholder="URL (მაგ: /ka/practices ან https://...)"
                    className={`
                      w-full px-3 py-2 rounded-lg text-sm
                      ${isDark 
                        ? 'bg-white/10 text-white placeholder:text-white/40 border-white/10' 
                        : 'bg-black/5 text-black placeholder:text-black/40 border-black/10'
                      }
                      border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    `}
                  />
                  <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    <input
                      type="checkbox"
                      checked={button.open_in_new_tab}
                      onChange={(e) => updateButton(index, { open_in_new_tab: e.target.checked })}
                      className="rounded"
                    />
                    ახალ ტაბში გახსნა
                  </label>
                </div>
              )}

              {/* Specialist/Practice/Company ID inputs */}
              {button.action_type === 'specialist' && (
                <input
                  type="text"
                  value={button.specialist_id || ''}
                  onChange={(e) => updateButton(index, { specialist_id: e.target.value })}
                  placeholder="სპეციალისტის ID"
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm
                    ${isDark 
                      ? 'bg-white/10 text-white placeholder:text-white/40 border-white/10' 
                      : 'bg-black/5 text-black placeholder:text-black/40 border-black/10'
                    }
                    border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  `}
                />
              )}

              {button.action_type === 'practice' && (
                <input
                  type="text"
                  value={button.practice_id || ''}
                  onChange={(e) => updateButton(index, { practice_id: e.target.value })}
                  placeholder="პრაქტიკის ID"
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm
                    ${isDark 
                      ? 'bg-white/10 text-white placeholder:text-white/40 border-white/10' 
                      : 'bg-black/5 text-black placeholder:text-black/40 border-black/10'
                    }
                    border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  `}
                />
              )}

              {button.action_type === 'company' && (
                <input
                  type="text"
                  value={button.company_id || ''}
                  onChange={(e) => updateButton(index, { company_id: e.target.value })}
                  placeholder="კომპანიის ID"
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm
                    ${isDark 
                      ? 'bg-white/10 text-white placeholder:text-white/40 border-white/10' 
                      : 'bg-black/5 text-black placeholder:text-black/40 border-black/10'
                    }
                    border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  `}
                />
              )}

              {/* Variant */}
              <div className="flex gap-2 mt-3">
                {VARIANTS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateButton(index, { variant: value })}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      ${button.variant === value
                        ? value === 'primary'
                          ? 'bg-blue-500 text-white'
                          : value === 'secondary'
                            ? isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
                            : 'border-2 border-current'
                        : isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
