'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useCompanyTranslations } from '@/contexts/CompanyTranslationsContext'

export default function SeoTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { activeLanguage, translations, updateSeoField } = useCompanyTranslations()

  const currentData = translations[activeLanguage].seo

  const getPlaceholder = (fieldKey: string): string => {
    const placeholders: Record<string, Record<typeof activeLanguage, string>> = {
      meta_title: {
        georgian: 'SEO სათაური ქართულად',
        english: 'SEO Title in English',
        russian: 'SEO заголовок на русском'
      },
      meta_description: {
        georgian: 'SEO აღწერა ქართულად',
        english: 'SEO Description in English',
        russian: 'SEO описание на русском'
      },
      meta_keywords: {
        georgian: 'სამართლის ფირმა, იურისტი, ადვოკატი',
        english: 'law firm, lawyer, attorney',
        russian: 'юридическая фирма, юрист, адвокат'
      }
    }
    return placeholders[fieldKey]?.[activeLanguage] || ''
  }

  return (
    <div className="space-y-4">
      {/* SEO Title */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          SEO სათაური (Meta Title)
        </label>
        <input
          type="text"
          value={currentData.meta_title}
          onChange={(e) => updateSeoField(activeLanguage, 'meta_title', e.target.value)}
          placeholder={getPlaceholder('meta_title')}
          maxLength={60}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className={`text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            რეკომენდებული: 50-60 სიმბოლო
          </p>
          <p className={`text-[9px] ${
            currentData.meta_title.length > 60 
              ? 'text-red-500' 
              : currentData.meta_title.length > 50 
              ? 'text-yellow-500' 
              : isDark ? 'text-white/40' : 'text-black/40'
          }`}>
            {currentData.meta_title.length}/60
          </p>
        </div>
      </div>

      {/* SEO Description */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          SEO აღწერა (Meta Description)
        </label>
        <textarea
          rows={3}
          value={currentData.meta_description}
          onChange={(e) => updateSeoField(activeLanguage, 'meta_description', e.target.value)}
          placeholder={getPlaceholder('meta_description')}
          maxLength={160}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className={`text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            რეკომენდებული: 150-160 სიმბოლო
          </p>
          <p className={`text-[9px] ${
            currentData.meta_description.length > 160 
              ? 'text-red-500' 
              : currentData.meta_description.length > 150 
              ? 'text-yellow-500' 
              : isDark ? 'text-white/40' : 'text-black/40'
          }`}>
            {currentData.meta_description.length}/160
          </p>
        </div>
      </div>

      {/* SEO Keywords */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          საძიებო სიტყვები (Keywords)
        </label>
        <input
          type="text"
          value={currentData.meta_keywords}
          onChange={(e) => updateSeoField(activeLanguage, 'meta_keywords', e.target.value)}
          placeholder={getPlaceholder('meta_keywords')}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          გამოყავით მძიმით (მაგ: სამართლის ფირმა, იურისტი, ადვოკატი)
        </p>
      </div>

      {/* SEO Tips */}
      <div className={`rounded-lg border p-3 ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
        <h4 className={`text-[10px] font-semibold mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
          💡 SEO რჩევები
        </h4>
        <ul className={`text-[9px] space-y-0.5 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          <li>• სათაური: 50-60 სიმბოლო</li>
          <li>• აღწერა: 150-160 სიმბოლო</li>
          <li>• გამოიყენეთ რელევანტური საძიებო სიტყვები</li>
        </ul>
      </div>
    </div>
  )
}
