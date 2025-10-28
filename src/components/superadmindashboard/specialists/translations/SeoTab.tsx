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
    <div className="space-y-6">
      {/* SEO Title */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          SEO სათაური (Meta Title)
        </label>
        <input
          type="text"
          value={currentData.seo_title}
          onChange={(e) => updateSeoField('seo_title', e.target.value)}
          placeholder={getPlaceholder('seo_title')}
          maxLength={60}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            რეკომენდებული: 50-60 სიმბოლო
          </p>
          <p className={`text-xs ${
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
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          SEO აღწერა (Meta Description)
        </label>
        <textarea
          rows={4}
          value={currentData.seo_description}
          onChange={(e) => updateSeoField('seo_description', e.target.value)}
          placeholder={getPlaceholder('seo_description')}
          maxLength={160}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            რეკომენდებული: 150-160 სიმბოლო
          </p>
          <p className={`text-xs ${
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
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          საძიებო სიტყვები (Keywords)
        </label>
        <input
          type="text"
          value={currentData.seo_keywords}
          onChange={(e) => updateSeoField('seo_keywords', e.target.value)}
          placeholder={getPlaceholder('seo_keywords')}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          გამოყავით მძიმით (მაგ: იურისტი, ადვოკატი, სამართალი)
        </p>
      </div>

      {/* SEO Tips */}
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
        <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
          💡 SEO რჩევები
        </h4>
        <ul className={`text-xs space-y-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          <li>• სათაური უნდა იყოს მოკლე და აღწერითი (50-60 სიმბოლო)</li>
          <li>• აღწერა უნდა იყოს მიმზიდველი და ინფორმაციული (150-160 სიმბოლო)</li>
          <li>• გამოიყენეთ რელევანტური საძიებო სიტყვები</li>
          <li>• თითოეული ენისთვის მოარგეთ კონტენტი</li>
        </ul>
      </div>
    </div>
  )
}
