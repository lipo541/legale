'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useSpecialistTranslations } from '@/contexts/SpecialistTranslationsContext'

export default function SeoTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { activeLanguage, data, updateSeoField } = useSpecialistTranslations()

  const currentData = data.seo[activeLanguage]

  // Helper to get placeholder text based on active language
  const getPlaceholder = (fieldKey: string): string => {
    const placeholders: Record<string, Record<typeof activeLanguage, string>> = {
      seo_title: {
        georgian: 'SEO სათაური ქართულად',
        english: 'SEO Title in English',
        russian: 'SEO заголовок на русском'
      },
      seo_description: {
        georgian: 'SEO აღწერა ქართულად',
        english: 'SEO Description in English',
        russian: 'SEO описание на русском'
      },
      seo_keywords: {
        georgian: 'იურისტი, ადვოკატი, სამართალი',
        english: 'lawyer, attorney, law',
        russian: 'юрист, адвокат, право'
      }
    }
    return placeholders[fieldKey]?.[activeLanguage] || ''
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* SEO Title */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          SEO სათაური (Meta Title)
        </label>
        <input
          type="text"
          value={currentData.seo_title}
          onChange={(e) => updateSeoField('seo_title', e.target.value)}
          placeholder={getPlaceholder('seo_title')}
          maxLength={60}
          className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className={`text-[9px] sm:text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <span className="hidden sm:inline">რეკომენდებული: </span>50-60 სიმბ.
          </p>
          <p className={`text-[9px] sm:text-[10px] ${
            currentData.seo_title.length > 60 
              ? 'text-red-500' 
              : currentData.seo_title.length > 50 
              ? 'text-yellow-500' 
              : isDark ? 'text-white/40' : 'text-black/40'
          }`}>
            {currentData.seo_title.length}/60
          </p>
        </div>
      </div>

      {/* SEO Description */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          SEO აღწერა (Meta Description)
        </label>
        <textarea
          rows={3}
          value={currentData.seo_description}
          onChange={(e) => updateSeoField('seo_description', e.target.value)}
          placeholder={getPlaceholder('seo_description')}
          maxLength={160}
          className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className={`text-[9px] sm:text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <span className="hidden sm:inline">რეკომენდებული: </span>150-160 სიმბ.
          </p>
          <p className={`text-[9px] sm:text-[10px] ${
            currentData.seo_description.length > 160 
              ? 'text-red-500' 
              : currentData.seo_description.length > 150 
              ? 'text-yellow-500' 
              : isDark ? 'text-white/40' : 'text-black/40'
          }`}>
            {currentData.seo_description.length}/160
          </p>
        </div>
      </div>

      {/* SEO Keywords */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          საძიებო სიტყვები (Keywords)
        </label>
        <input
          type="text"
          value={currentData.seo_keywords}
          onChange={(e) => updateSeoField('seo_keywords', e.target.value)}
          placeholder={getPlaceholder('seo_keywords')}
          className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-[9px] sm:text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          გამოყავით მძიმით
        </p>
      </div>

      {/* SEO Tips */}
      <div className={`rounded-lg border p-2 sm:p-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
        <h4 className={`text-[11px] sm:text-xs font-medium mb-1 sm:mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          💡 SEO რჩევები
        </h4>
        <ul className={`text-[9px] sm:text-[10px] space-y-0.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          <li>• სათაური: მოკლე და აღწერითი (50-60)</li>
          <li>• აღწერა: მიმზიდველი (150-160)</li>
          <li>• რელევანტური საძიებო სიტყვები</li>
        </ul>
      </div>
    </div>
  )
}
