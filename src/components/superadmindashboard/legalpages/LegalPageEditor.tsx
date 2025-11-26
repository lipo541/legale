'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'
import { ArrowLeft, Languages, Plus, Trash2, GripVertical, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Lazy load RichTextEditor
const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-32 flex items-center justify-center border rounded-lg">
      <Loader2 className="animate-spin" size={24} />
    </div>
  )
})

type Language = 'ka' | 'en' | 'ru'
type PageType = 'privacy' | 'terms' | 'cookies'

interface Section {
  id: string
  title: string
  content: string
}

interface Translation {
  title: string
  intro: string
  sections: Section[]
}

interface LegalPageTranslation {
  id: string
  legal_page_id: string
  language: Language
  title: string
  intro: string
  content: Section[]
  updated_at: string
}

interface LegalPage {
  id: string
  page_type: PageType
  icon: string
  status: string
  updated_at: string
  created_at: string
  legal_page_translations: LegalPageTranslation[]
}

interface LegalPageEditorProps {
  page: LegalPage
  onBack: () => void
}

const languageLabels: Record<Language, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский'
}

const pageLabels: Record<PageType, string> = {
  privacy: 'კონფიდენციალურობის პოლიტიკა',
  terms: 'წესები და პირობები',
  cookies: 'ქუქი-ფაილების პოლიტიკა'
}

export default function LegalPageEditor({ page, onBack }: LegalPageEditorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [activeLanguage, setActiveLanguage] = useState<Language>('ka')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Translations state
  const [translations, setTranslations] = useState<Record<Language, Translation>>({
    ka: { title: '', intro: '', sections: [] },
    en: { title: '', intro: '', sections: [] },
    ru: { title: '', intro: '', sections: [] }
  })

  // Populate from existing data
  useEffect(() => {
    const populated: Record<Language, Translation> = {
      ka: { title: '', intro: '', sections: [] },
      en: { title: '', intro: '', sections: [] },
      ru: { title: '', intro: '', sections: [] }
    }

    page.legal_page_translations.forEach((trans) => {
      const lang = trans.language as Language
      populated[lang] = {
        title: trans.title || '',
        intro: trans.intro || '',
        sections: Array.isArray(trans.content) ? trans.content : []
      }
    })

    setTranslations(populated)
  }, [page])

  // Current translation
  const currentTranslation = translations[activeLanguage]

  // Update translation field
  const updateField = (field: 'title' | 'intro', value: string) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value
      }
    }))
  }

  // Update section
  const updateSection = (index: number, field: 'title' | 'content', value: string) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        sections: prev[activeLanguage].sections.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        )
      }
    }))
  }

  // Add section
  const addSection = () => {
    const newId = `section-${Date.now()}`
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        sections: [
          ...prev[activeLanguage].sections,
          { id: newId, title: '', content: '' }
        ]
      }
    }))
  }

  // Remove section
  const removeSection = (index: number) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ სექციის წაშლა?')) return
    
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        sections: prev[activeLanguage].sections.filter((_, i) => i !== index)
      }
    }))
  }

  // Move section
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= currentTranslation.sections.length) return

    setTranslations(prev => {
      const sections = [...prev[activeLanguage].sections]
      const temp = sections[index]
      sections[index] = sections[newIndex]
      sections[newIndex] = temp
      
      return {
        ...prev,
        [activeLanguage]: {
          ...prev[activeLanguage],
          sections
        }
      }
    })
  }

  // Validate
  const validate = (): string | null => {
    for (const lang of ['ka', 'en', 'ru'] as Language[]) {
      if (!translations[lang].title) {
        return `გთხოვთ შეავსოთ სათაური ${languageLabels[lang]} ენაზე`
      }
    }
    return null
  }

  // Save
  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const validationError = validate()
      if (validationError) {
        setError(validationError)
        setIsLoading(false)
        return
      }

      // Update each translation
      for (const lang of ['ka', 'en', 'ru'] as Language[]) {
        const trans = translations[lang]
        const existingTrans = page.legal_page_translations.find(t => t.language === lang)

        if (existingTrans) {
          // Update
          const { error: updateError } = await supabase
            .from('legal_page_translations')
            .update({
              title: trans.title,
              intro: trans.intro,
              content: trans.sections,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTrans.id)

          if (updateError) throw updateError
        } else {
          // Insert
          const { error: insertError } = await supabase
            .from('legal_page_translations')
            .insert({
              legal_page_id: page.id,
              language: lang,
              title: trans.title,
              intro: trans.intro,
              content: trans.sections
            })

          if (insertError) throw insertError
        }
      }

      // Update page timestamp
      await supabase
        .from('legal_pages')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', page.id)

      setSuccess('წარმატებით შეინახა!')
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'შეცდომა შენახვისას')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <button
          onClick={onBack}
          disabled={isLoading}
          className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            isLoading
              ? 'cursor-not-allowed opacity-50'
              : isDark
              ? 'text-white/60 hover:bg-white/5 hover:text-white'
              : 'text-black/60 hover:bg-black/5 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          უკან დაბრუნება
        </button>
        <h1 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {pageLabels[page.page_type]} - რედაქტირება
        </h1>
        <p className={`mt-1 text-[10px] md:text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          განაახლეთ კონტენტი სამივე ენაზე
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-4 rounded-lg border p-3 ${
          isDark
            ? 'border-red-500/20 bg-red-500/10 text-red-400'
            : 'border-red-500/30 bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs">{error}</p>
            <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className={`mb-4 rounded-lg border p-3 ${
          isDark
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-emerald-500/30 bg-emerald-50 text-emerald-700'
        }`}>
          <p className="text-xs">{success}</p>
        </div>
      )}

      {/* Form */}
      <div className={`rounded-xl border p-3 md:p-5 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        
        {/* Language Tabs */}
        <div className="mb-4 md:mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Languages className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              ენის არჩევა
            </span>
          </div>
          <div className="flex gap-1.5">
            {(['ka', 'en', 'ru'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`flex-1 md:flex-none rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeLanguage === lang
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : isDark
                    ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-3 md:mb-4">
          <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            სათაური ({languageLabels[activeLanguage]}) *
          </label>
          <input
            type="text"
            value={currentTranslation.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="გვერდის სათაური"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              isDark
                ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Intro */}
        <div className="mb-3 md:mb-4">
          <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            შესავალი ({languageLabels[activeLanguage]})
          </label>
          <textarea
            value={currentTranslation.intro}
            onChange={(e) => updateField('intro', e.target.value)}
            placeholder="მოკლე შესავალი ტექსტი"
            rows={2}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Sections */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              სექციები ({languageLabels[activeLanguage]})
            </label>
            <button
              onClick={addSection}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                isDark
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
              }`}
            >
              <Plus className="h-3 w-3" />
              დამატება
            </button>
          </div>

          <div className="space-y-3">
            {currentTranslation.sections.map((section, index) => (
              <div
                key={section.id}
                className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}
              >
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0
                          ? 'opacity-30 cursor-not-allowed'
                          : isDark
                          ? 'hover:bg-white/10'
                          : 'hover:bg-black/10'
                      }`}
                    >
                      <GripVertical className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                    </button>
                  </div>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => removeSection(index)}
                    className={`p-1 rounded transition-colors ${
                      isDark
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-red-600 hover:bg-red-500/10'
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Section Title */}
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                  placeholder="სექციის სათაური"
                  className={`w-full rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors mb-2 ${
                    isDark
                      ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />

                {/* Section Content */}
                <RichTextEditor
                  content={section.content}
                  onChange={(html) => updateSection(index, 'content', html)}
                />
              </div>
            ))}

            {currentTranslation.sections.length === 0 && (
              <div className={`text-center py-6 rounded-lg border-2 border-dashed ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`}>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  სექციები არ არის დამატებული
                </p>
                <button
                  onClick={addSection}
                  className={`mt-2 text-xs font-medium ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  + პირველი სექციის დამატება
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}">
          <button
            onClick={onBack}
            disabled={isLoading}
            className={`w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              isLoading
                ? 'cursor-not-allowed opacity-50'
                : isDark
                ? 'bg-white/5 text-white hover:bg-white/10'
                : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors ${
              isLoading
                ? 'cursor-not-allowed bg-emerald-400'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                მიმდინარეობს...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                შენახვა
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
