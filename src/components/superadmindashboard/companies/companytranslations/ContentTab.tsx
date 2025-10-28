'use client'

import { useCompanyTranslations } from '@/contexts/CompanyTranslationsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ContentTab({ companyId }: { companyId: string }) {
  const { translations, activeLanguage, updateContentField } = useCompanyTranslations()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const currentData = translations[activeLanguage].content

  useEffect(() => {
    const fetchAvatar = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', companyId)
        .single()
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url)
      }
    }
    fetchAvatar()
  }, [companyId])

  const getPlaceholder = (field: string): string => {
    const placeholders: Record<string, Record<string, string>> = {
      company_overview: {
        georgian: 'კომპანიის დეტალური აღწერა ქართულად...',
        english: 'Detailed company overview in English...',
        russian: 'Подробный обзор компании на русском...'
      },
      summary: {
        georgian: 'მოკლე შესავალი კომპანიის შესახებ...',
        english: 'Brief introduction about the company...',
        russian: 'Краткое введение о компании...'
      },
      mission_statement: {
        georgian: 'კომპანიის მისია...',
        english: 'Company mission statement...',
        russian: 'Миссия компании...'
      },
      vision_values: {
        georgian: 'ხედვა და ღირებულებები...',
        english: 'Vision and values...',
        russian: 'Видение и ценности...'
      },
      history: {
        georgian: 'კომპანიის ისტორია...',
        english: 'Company history...',
        russian: 'История компании...'
      },
      how_we_work: {
        georgian: 'როგორ ვმუშაობთ...',
        english: 'How we work...',
        russian: 'Как мы работаем...'
      },
      avatar_alt_text: {
        georgian: 'კომპანიის ლოგოს აღწერა',
        english: 'Company logo description',
        russian: 'Описание логотипа компании'
      }
    }
    return placeholders[field]?.[activeLanguage] || ''
  }

  return (
    <div className="space-y-6">
      {/* Avatar Alt Text - With Logo Preview */}
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
        <div className="flex items-start gap-4 mb-4">
          {/* Logo Preview */}
          <div className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={currentData.avatar_alt_text || 'Company logo'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className={`w-10 h-10 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              🏢 კომპანიის ლოგოს Alt ტექსტი
            </h4>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              აღწერეთ რას ასახავს კომპანიის ლოგო (Accessibility & SEO)
            </p>
          </div>
        </div>

        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            Alt ტექსტი ({activeLanguage === 'georgian' ? '🇬🇪 ქართული' : activeLanguage === 'english' ? '🇬🇧 English' : '🇷🇺 Русский'})
          </label>
          <input
            type="text"
            value={currentData.avatar_alt_text}
            onChange={(e) => updateContentField(activeLanguage, 'avatar_alt_text', e.target.value)}
            placeholder={getPlaceholder('avatar_alt_text')}
            className={`w-full rounded-lg border px-4 py-2 transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-blue-400'
                : 'border-black/10 bg-black/5 text-black focus:border-blue-600'
            }`}
          />
          <div className="mt-2 flex items-start gap-2">
            <span className="text-xs">💡</span>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              მაგალითი: &ldquo;სამართლის ფირმა Legal Partners-ის ლოგო&rdquo;, &ldquo;Legal Partners law firm logo&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Company Overview */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          📋 კომპანიის აღწერა (Overview)
        </label>
        <textarea
          value={currentData.company_overview}
          onChange={(e) => updateContentField(activeLanguage, 'company_overview', e.target.value)}
          placeholder={getPlaceholder('company_overview')}
          rows={6}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          დეტალური აღწერა კომპანიის შესახებ
        </p>
      </div>

      {/* Summary */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          ✨ მოკლე შესავალი (Summary)
        </label>
        <textarea
          value={currentData.summary}
          onChange={(e) => updateContentField(activeLanguage, 'summary', e.target.value)}
          placeholder={getPlaceholder('summary')}
          rows={3}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          მოკლე შესავალი, რომელიც გამოჩნდება პროფილზე
        </p>
      </div>

      {/* Mission Statement */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          🎯 მისია (Mission Statement)
        </label>
        <textarea
          value={currentData.mission_statement}
          onChange={(e) => updateContentField(activeLanguage, 'mission_statement', e.target.value)}
          placeholder={getPlaceholder('mission_statement')}
          rows={4}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Vision & Values */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          🌟 ხედვა და ღირებულებები (Vision & Values)
        </label>
        <textarea
          value={currentData.vision_values}
          onChange={(e) => updateContentField(activeLanguage, 'vision_values', e.target.value)}
          placeholder={getPlaceholder('vision_values')}
          rows={4}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* History */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          📖 ისტორია (History)
        </label>
        <textarea
          value={currentData.history}
          onChange={(e) => updateContentField(activeLanguage, 'history', e.target.value)}
          placeholder={getPlaceholder('history')}
          rows={5}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          კომპანიის ისტორია ან დაარსების ამბავი
        </p>
      </div>

      {/* How We Work */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          ⚙️ როგორ ვმუშაობთ (How We Work)
        </label>
        <textarea
          value={currentData.how_we_work}
          onChange={(e) => updateContentField(activeLanguage, 'how_we_work', e.target.value)}
          placeholder={getPlaceholder('how_we_work')}
          rows={5}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          აღწერა თუ როგორ მუშაობს კომპანია
        </p>
      </div>
    </div>
  )
}
