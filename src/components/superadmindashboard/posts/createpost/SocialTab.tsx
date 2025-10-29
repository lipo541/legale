'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { usePostTranslations } from '@/contexts/PostTranslationsContext'

export default function SocialTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { translations, activeLanguage, updateField } = usePostTranslations()
  const currentData = translations[activeLanguage]

  return (
    <div className="space-y-6">
      {/* Open Graph Section */}
      <div className="space-y-6">
        <div className={`flex items-center space-x-2 pb-3 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h3v8h-3v-8zm-3 0H7v8h3v-8zm6-4h-3v3h3V7z"/>
          </svg>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            Open Graph (Facebook, Twitter, LinkedIn, WhatsApp)
          </h3>
        </div>

        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          Open Graph თეგები გამოიყენება ყველა სოციალურ პლატფორმაზე - Facebook, Twitter/X, LinkedIn, WhatsApp და სხვა.
        </p>

        {/* OG Title */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            OG სათაური
          </label>
          <input
            type="text"
            value={currentData.og_title}
            onChange={(e) => updateField('og_title', e.target.value)}
            placeholder="Facebook-ზე გამოსაჩენი სათაური"
            className={`w-full px-4 py-2.5 rounded-lg transition-all ${
              isDark
                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500'
                : 'bg-black/5 border border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* OG Description */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            OG აღწერა
          </label>
          <textarea
            value={currentData.og_description}
            onChange={(e) => updateField('og_description', e.target.value)}
            placeholder="Facebook-ზე გამოსაჩენი აღწერა"
            rows={3}
            className={`w-full px-4 py-2.5 rounded-lg transition-all resize-none ${
              isDark
                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500'
                : 'bg-black/5 border border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* OG Image */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            OG სურათის URL
          </label>
          <input
            type="text"
            value={currentData.og_image || ''}
            onChange={(e) => updateField('og_image', e.target.value)}
            placeholder="https://example.com/og-image.jpg (რეკომენდებული: 1200x630px)"
            className={`w-full px-4 py-2.5 rounded-lg transition-all ${
              isDark
                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500'
                : 'bg-black/5 border border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500'
            }`}
          />
          {currentData.og_image && (
            <div className={`mt-3 rounded-lg p-2 border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <img
                src={currentData.og_image}
                alt="OG Preview"
                className="max-h-48 rounded object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"%3E%3Crect fill="%23ddd" width="1200" height="630"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3E1200x630%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Social Media Preview */}
      <div className={`rounded-lg p-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
        <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Social Media Preview
        </h3>
        <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          {currentData.og_image && (
            <img 
              src={currentData.og_image} 
              alt="Preview" 
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div className="p-4">
            <div className={`text-xs uppercase mb-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              yoursite.com
            </div>
            <div className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
              {currentData.og_title || 'Open Graph სათაური'}
            </div>
            <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {currentData.og_description || 'Open Graph აღწერა გამოჩნდება აქ...'}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className={`rounded-lg p-4 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Open Graph რჩევები
            </h3>
            <div className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <ul className="list-disc list-inside space-y-1">
                <li>OG სურათი: 1200x630px (ოპტიმალური ზომა)</li>
                <li>OG სათაური: მაქსიმუმ 60 სიმბოლო</li>
                <li>OG აღწერა: 150-160 სიმბოლო</li>
                <li>გამოიყენეთ მაღალი ხარისხის, მიმზიდველი სურათები</li>
                <li>OG თეგები მუშაობს: Facebook, Twitter, LinkedIn, WhatsApp, Telegram და სხვა</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
