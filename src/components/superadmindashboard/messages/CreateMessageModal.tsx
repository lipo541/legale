'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'
import { X, Send, AlertCircle } from 'lucide-react'
import { createGlobalMessage, updateGlobalMessage } from '@/lib/actions/messages'
import { GlobalMessage, MessageFormData } from '@/lib/types'
import { MessageTargetRole, MessagePriority } from '@/lib/enums'
import { useToast } from '@/contexts/ToastContext'

// Lazy load RichTextEditor for better performance
const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-[200px] flex items-center justify-center text-sm opacity-50">იტვირთება...</div>
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
    { value: MessageTargetRole.SOLO_SPECIALIST, label: 'Solo Specialist' },
    { value: MessageTargetRole.COMPANY, label: 'Company' },
    { value: MessageTargetRole.MODERATOR, label: 'Moderator' }
  ]

  const priorities = [
    { value: MessagePriority.LOW, label: 'დაბალი' },
    { value: MessagePriority.NORMAL, label: 'ჩვეულებრივი' },
    { value: MessagePriority.HIGH, label: 'მაღალი' },
    { value: MessagePriority.URGENT, label: 'სასწრაფო' }
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

    // Check titles
    if (!formData.titles.ka.trim()) newErrors.push('ქართული სათაური აუცილებელია')
    if (!formData.titles.en.trim()) newErrors.push('ინგლისური სათაური აუცილებელია')
    if (!formData.titles.ru.trim()) newErrors.push('რუსული სათაური აუცილებელია')

    // Check contents - remove HTML tags to check if there's actual content
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()
    if (!stripHtml(formData.contents.ka)) newErrors.push('ქართული ტექსტი აუცილებელია')
    if (!stripHtml(formData.contents.en)) newErrors.push('ინგლისური ტექსტი აუცილებელია')
    if (!stripHtml(formData.contents.ru)) newErrors.push('რუსული ტექსტი აუცილებელია')

    // Check target roles
    if (formData.target_roles.size === 0) {
      newErrors.push('მინიმუმ ერთი როლი უნდა აირჩიოთ')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

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
      showToast(
        isEditMode ? 'შეტყობინება განახლდა' : 'შეტყობინება შეიქმნა',
        'success'
      )
      onClose()
    } else {
      showToast(result.message || 'Error occurred', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
          isDark ? 'bg-gray-900 text-white' : 'bg-white text-black'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
          isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-black/10'
        }`}>
          <h2 className="text-2xl font-bold">
            {isEditMode ? 'შეტყობინების რედაქტირება' : 'ახალი შეტყობინება'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-500 mb-1">შეცდომები:</h3>
                  <ul className="list-disc list-inside text-sm text-red-500/80">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Target Roles */}
          <div>
            <label className="block text-sm font-medium mb-3">
              მიმღები როლები *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableRoles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.target_roles.has(role.value)
                      ? isDark
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-blue-500/10 border-blue-500'
                      : isDark
                      ? 'border-white/10 hover:bg-white/5'
                      : 'border-black/10 hover:bg-black/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.target_roles.has(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-3">
              პრიორიტეტი
            </label>
            <div className="grid grid-cols-4 gap-3">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => setFormData({ ...formData, priority: priority.value })}
                  className={`p-3 rounded-lg border transition-all ${
                    formData.priority === priority.value
                      ? isDark
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-blue-500/10 border-blue-500'
                      : isDark
                      ? 'border-white/10 hover:bg-white/5'
                      : 'border-black/10 hover:bg-black/5'
                  }`}
                >
                  <span className="text-sm font-medium">{priority.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium mb-3">
              ვადის გასვლა (არასავალდებულო)
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at?.toISOString().slice(0, 16) || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expires_at: e.target.value ? new Date(e.target.value) : undefined
                })
              }
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/5 border-white/10 focus:border-blue-500'
                  : 'bg-black/5 border-black/10 focus:border-blue-500'
              } outline-none transition-colors`}
            />
          </div>

          {/* Language Tabs */}
          <div>
            <div className="flex gap-2 mb-4">
              {(['ka', 'en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeLanguage === lang
                      ? isDark
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-500 text-white'
                      : isDark
                      ? 'bg-white/5 hover:bg-white/10'
                      : 'bg-black/5 hover:bg-black/10'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                სათაური ({activeLanguage.toUpperCase()}) *
              </label>
              <input
                type="text"
                value={formData.titles[activeLanguage]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titles: { ...formData.titles, [activeLanguage]: e.target.value }
                  })
                }
                placeholder={`შეიყვანეთ სათაური ${activeLanguage === 'ka' ? 'ქართულად' : activeLanguage === 'en' ? 'ინგლისურად' : 'რუსულად'}`}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDark
                    ? 'bg-white/5 border-white/10 focus:border-blue-500'
                    : 'bg-black/5 border-black/10 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ტექსტი ({activeLanguage.toUpperCase()}) *
              </label>
              <RichTextEditor
                content={formData.contents[activeLanguage]}
                onChange={(html) =>
                  setFormData({
                    ...formData,
                    contents: { ...formData.contents, [activeLanguage]: html }
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t ${
          isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-black/10'
        }`}>
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-white/5 hover:bg-white/10'
                : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            გაუქმება
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-5 h-5" />
            {loading ? 'იგზავნება...' : isEditMode ? 'განახლება' : 'გაგზავნა'}
          </button>
        </div>
      </div>
    </div>
  )
}
