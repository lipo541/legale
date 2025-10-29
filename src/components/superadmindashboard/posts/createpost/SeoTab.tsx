'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { usePostTranslations } from '@/contexts/PostTranslationsContext'

export default function SeoTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { translations, activeLanguage, updateField } = usePostTranslations()
  const currentData = translations[activeLanguage]

  return (
    <div className="space-y-6">
      {/* Meta Title */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Meta სათაური *
        </label>
        <input
          type="text"
          value={currentData.meta_title}
          onChange={(e) => updateField('meta_title', e.target.value)}
          placeholder="SEO სათაური (რეკომენდებული: 50-60 სიმბოლო)"
          className={`w-full px-4 py-2.5 rounded-lg transition-all ${
            isDark
              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500'
              : 'bg-black/5 border border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500'
          }`}
        />
        <p className={`text-sm mt-1 ${
          currentData.meta_title.length > 60 
            ? 'text-red-500 dark:text-red-400' 
            : isDark ? 'text-white/60' : 'text-black/60'
        }`}>
          სიმბოლოები: {currentData.meta_title.length} / 60
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Meta აღწერა *
        </label>
        <textarea
          value={currentData.meta_description}
          onChange={(e) => updateField('meta_description', e.target.value)}
          placeholder="SEO აღწერა (რეკომენდებული: 150-160 სიმბოლო)"
          rows={4}
          className={`w-full px-4 py-2.5 rounded-lg transition-all resize-none ${
            isDark
              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500'
              : 'bg-black/5 border border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500'
          }`}
        />
        <p className={`text-sm mt-1 ${
          currentData.meta_description.length > 160 
            ? 'text-red-500 dark:text-red-400' 
            : isDark ? 'text-white/60' : 'text-black/60'
        }`}>
          სიმბოლოები: {currentData.meta_description.length} / 160
        </p>
      </div>

      {/* Keywords */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          საკვანძო სიტყვები
        </label>
        <input
          type="text"
          value={currentData.keywords}
          onChange={(e) => updateField('keywords', e.target.value)}
          placeholder="საკვანძო სიტყვა 1, საკვანძო სიტყვა 2, საკვანძო სიტყვა 3"
          className={`w-full px-4 py-2.5 rounded-lg transition-all ${
            isDark
              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500'
              : 'bg-black/5 border border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500'
          }`}
        />
        <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          გამოყავით მძიმეებით. რეკომენდებული: 5-10 საკვანძო სიტყვა
        </p>
      </div>

      {/* SEO Preview */}
      <div className={`rounded-lg p-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
        <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Google Search Preview
        </h3>
        <div className="space-y-2">
          <div className={`text-xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            {currentData.meta_title || 'პოსტის სათაური'}
          </div>
          <div className={`text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            https://yoursite.com/blog/{currentData.slug || 'post-slug'}
          </div>
          <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {currentData.meta_description || 'პოსტის აღწერა გამოჩნდება აქ...'}
          </div>
        </div>
      </div>

      {/* SEO Tips */}
      <div className={`rounded-lg p-4 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              SEO რჩევები
            </h3>
            <div className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <ul className="list-disc list-inside space-y-1">
                <li>Meta სათაური: 50-60 სიმბოლო</li>
                <li>Meta აღწერა: 150-160 სიმბოლო</li>
                <li>გამოიყენეთ საკვანძო სიტყვები ბუნებრივად</li>
                <li>URL უნდა იყოს მოკლე და გასაგები</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
