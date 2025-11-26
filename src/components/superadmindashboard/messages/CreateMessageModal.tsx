'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'
import { X, Send, AlertCircle, Loader2 } from 'lucide-react'
import { createGlobalMessage, updateGlobalMessage } from '@/lib/actions/messages'
import { GlobalMessage, MessageFormData } from '@/lib/types'
import { MessageTargetRole, MessagePriority } from '@/lib/enums'
import { useToast } from '@/contexts/ToastContext'

// Lazy load RichTextEditor
const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[150px] flex items-center justify-center rounded-lg border border-dashed border-white/10">
      <Loader2 className="h-5 w-5 animate-spin text-white/40" />
    </div>
  )
})

type MessageWithRoles = GlobalMessage & { target_roles: string[] }

interface CreateMessageModalProps {
  message?: MessageWithRoles | null
  onClose: () => void
}

export default function CreateMessageModal({ message, onClose }: CreateMessageModalProps) {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const isDark = theme === 'dark'
  const isEditMode = !!message

  const [formData, setFormData] = useState<MessageFormData>({
    titles: {
      ka: message?.title_ka || '',
      en: message?.title_en || '',
      ru: message?.title_ru || ''
    },
    contents: {
      ka: message?.content_ka || '',
      en: message?.content_en || '',
      ru: message?.content_ru || ''
    },
    target_roles: new Set(message?.target_roles || []),
    priority: (message?.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
    expires_at: message?.expires_at ? new Date(message.expires_at) : undefined
  })

  const [activeLanguage, setActiveLanguage] = useState<'ka' | 'en' | 'ru'>('ka')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const availableRoles = [
    { value: MessageTargetRole.USER, label: 'User' },
    { value: MessageTargetRole.AUTHOR, label: 'Author' },
    { value: MessageTargetRole.SPECIALIST, label: 'Specialist' },
    { value: MessageTargetRole.SOLO_SPECIALIST, label: 'Solo Spec' },
    { value: MessageTargetRole.COMPANY, label: 'Company' },
    { value: MessageTargetRole.MODERATOR, label: 'Moderator' }
  ]

  const priorities = [
    { value: MessagePriority.LOW, label: 'დაბალი', color: 'bg-gray-500' },
    { value: MessagePriority.NORMAL, label: 'ჩვეული', color: 'bg-blue-500' },
    { value: MessagePriority.HIGH, label: 'მაღალი', color: 'bg-orange-500' },
    { value: MessagePriority.URGENT, label: 'სასწრაფო', color: 'bg-red-500' }
  ]

  const languages = [
    { id: 'ka' as const, label: 'ქართული', flag: '🇬🇪' },
    { id: 'en' as const, label: 'English', flag: '🇬🇧' },
    { id: 'ru' as const, label: 'Русский', flag: '🇷🇺' }
  ]

  const handleRoleToggle = (role: string) => {
    const newRoles = new Set(formData.target_roles)
    if (newRoles.has(role)) {
      newRoles.delete(role)
    } else {
      newRoles.add(role)
    }
    setFormData({ ...formData, target_roles: newRoles })
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

    if (!formData.titles.ka.trim()) newErrors.push('ქართული სათაური აუცილებელია')
    if (!formData.titles.en.trim()) newErrors.push('ინგლისური სათაური აუცილებელია')
    if (!formData.titles.ru.trim()) newErrors.push('რუსული სათაური აუცილებელია')
    if (!stripHtml(formData.contents.ka)) newErrors.push('ქართული ტექსტი აუცილებელია')
    if (!stripHtml(formData.contents.en)) newErrors.push('ინგლისური ტექსტი აუცილებელია')
    if (!stripHtml(formData.contents.ru)) newErrors.push('რუსული ტექსტი აუცილებელია')
    if (formData.target_roles.size === 0) newErrors.push('მინიმუმ ერთი როლი აირჩიეთ')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    const data = {
      title_ka: formData.titles.ka,
      title_en: formData.titles.en,
      title_ru: formData.titles.ru,
      content_ka: formData.contents.ka,
      content_en: formData.contents.en,
      content_ru: formData.contents.ru,
      target_roles: Array.from(formData.target_roles) as Array<'USER' | 'AUTHOR' | 'SPECIALIST' | 'SOLO_SPECIALIST' | 'COMPANY' | 'MODERATOR'>,
      priority: formData.priority,
      expires_at: formData.expires_at?.toISOString() || null
    }

    let result
    if (isEditMode && message) {
      result = await updateGlobalMessage(message.id, data)
    } else {
      result = await createGlobalMessage(data)
    }

    setLoading(false)

    if (result.success) {
      showToast(isEditMode ? 'განახლდა' : 'შეიქმნა', 'success')
      onClose()
    } else {
      showToast(result.message || 'შეცდომა', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col ${
        isDark ? 'bg-zinc-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {isEditMode ? 'რედაქტირება' : 'ახალი შეტყობინება'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/10 text-black/60'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <ul className="text-[10px] text-red-500 space-y-0.5">
                  {errors.map((error, i) => <li key={i}>• {error}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Target Roles */}
          <div>
            <label className={`block text-[10px] font-medium mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მიმღები როლები *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {availableRoles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleToggle(role.value)}
                  className={`px-2 py-1.5 rounded-md text-[9px] font-medium transition-all border ${
                    formData.target_roles.has(role.value)
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'
                      : isDark
                        ? 'border-white/10 text-white/60 hover:bg-white/5'
                        : 'border-black/10 text-black/60 hover:bg-black/5'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority & Expiration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className={`block text-[10px] font-medium mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                პრიორიტეტი
              </label>
              <div className="grid grid-cols-4 gap-1">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`px-2 py-1.5 rounded-md text-[9px] font-medium transition-all border ${
                      formData.priority === p.value
                        ? `${p.color}/20 border-current`
                        : isDark
                          ? 'border-white/10 text-white/60 hover:bg-white/5'
                          : 'border-black/10 text-black/60 hover:bg-black/5'
                    }`}
                    style={formData.priority === p.value ? { 
                      color: p.color.replace('bg-', '').replace('-500', '') === 'gray' ? '#6b7280' :
                             p.color.replace('bg-', '').replace('-500', '') === 'blue' ? '#3b82f6' :
                             p.color.replace('bg-', '').replace('-500', '') === 'orange' ? '#f97316' : '#ef4444'
                    } : {}}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className={`block text-[10px] font-medium mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ვადა (არასავალდებულო)
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at?.toISOString().slice(0, 16) || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  expires_at: e.target.value ? new Date(e.target.value) : undefined
                })}
                className={`w-full px-3 py-1.5 rounded-md border text-[10px] outline-none transition-colors ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500'
                    : 'bg-black/5 border-black/10 text-black focus:border-emerald-500'
                }`}
                style={isDark ? { colorScheme: 'dark' } : {}}
              />
            </div>
          </div>

          {/* Language Tabs */}
          <div>
            <div className="flex gap-1 mb-3">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setActiveLanguage(lang.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    activeLanguage === lang.id
                      ? 'bg-emerald-500 text-white'
                      : isDark
                        ? 'bg-white/5 text-white/60 hover:bg-white/10'
                        : 'bg-black/5 text-black/60 hover:bg-black/10'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                  <span className="sm:hidden">{lang.id.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* Title Input */}
            <div className="mb-3">
              <label className={`block text-[10px] font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სათაური ({activeLanguage.toUpperCase()}) *
              </label>
              <input
                type="text"
                value={formData.titles[activeLanguage]}
                onChange={(e) => setFormData({
                  ...formData,
                  titles: { ...formData.titles, [activeLanguage]: e.target.value }
                })}
                placeholder="შეიყვანეთ სათაური..."
                className={`w-full px-3 py-2 rounded-md border text-xs outline-none transition-colors ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500'
                    : 'bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className={`block text-[10px] font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ტექსტი ({activeLanguage.toUpperCase()}) *
              </label>
              <RichTextEditor
                content={formData.contents[activeLanguage]}
                onChange={(html) => setFormData({
                  ...formData,
                  contents: { ...formData.contents, [activeLanguage]: html }
                })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t flex-shrink-0 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
            }`}
          >
            გაუქმება
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {loading ? 'იგზავნება...' : isEditMode ? 'განახლება' : 'გაგზავნა'}
          </button>
        </div>
      </div>
    </div>
  )
}
