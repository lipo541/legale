'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { usePostTranslations } from '@/contexts/PostTranslationsContext'
import { X } from 'lucide-react'

export default function SocialTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { translations, activeLanguage, updateField, ogImageFile, ogImagePreview, setOgImageFile, setOgImagePreview } = usePostTranslations()
  const currentData = translations[activeLanguage]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('მხოლოდ JPG, PNG და WebP ფორმატები დაშვებულია')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setOgImagePreview(reader.result as string)
      setOgImageFile(file)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setOgImagePreview(null)
    setOgImageFile(null)
    // Clear og_image URL from all translations
    updateField('og_image', '')
  }

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

        {/* Social Media Hashtags */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            Social Media Hashtags ({activeLanguage === 'georgian' ? 'ქართული' : activeLanguage === 'english' ? 'English' : 'Русский'})
          </label>
          <input
            type="text"
            value={currentData.social_hashtags}
            onChange={(e) => updateField('social_hashtags', e.target.value)}
            placeholder="#სამართალი #იურიდიული #კონსულტაცია"
            className={`w-full px-4 py-2.5 rounded-lg transition-all ${
              isDark
                ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-emerald-500'
                : 'bg-black/5 border border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500'
            }`}
          />
          <p className={`mt-1 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            გამოიყენეთ ჰეშთეგები სოციალურ მედიაში გასაზიარებლად
          </p>
        </div>

        {/* OG Image */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            OG სურათი (Social Media Share)
          </label>
          
          {/* Upload Button */}
          <label
            className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              ogImagePreview
                ? 'border-transparent'
                : isDark
                ? 'border-white/20 bg-[#0d0d0d] hover:border-white/40 hover:bg-white/5'
                : 'border-black/20 bg-gray-50 hover:border-black/40 hover:bg-gray-100'
            }`}
          >
            {ogImagePreview ? (
              <div className="relative w-full h-full">
                <img 
                  src={ogImagePreview} 
                  alt="OG Preview" 
                  className="w-full h-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    removeImage()
                  }}
                  className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                    isDark
                      ? 'bg-black/60 hover:bg-black/80 text-white'
                      : 'bg-white/60 hover:bg-white/80 text-black'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center p-4 text-center">
                <div className={`mb-3 rounded-full p-3 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                  <svg className={`h-6 w-6 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className={`mb-1 text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  დააჭირეთ ატვირთვისთვის
                </p>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  რეკომენდირებული: 1200x630px
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  JPG, PNG, WebP (მაქს. 5MB)
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          <p className={`mt-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            ეს სურათი გამოჩნდება როცა პოსტს სოციალურ მედიაში გააზიარებენ (Facebook, Twitter, LinkedIn და ა.შ.)
          </p>
        </div>
      </div>

      {/* Social Media Preview */}
      <div className={`rounded-lg p-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
        <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Social Media Preview
        </h3>
        <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          {ogImagePreview && (
            <img 
              src={ogImagePreview} 
              alt="Preview" 
              className="w-full h-48 object-cover"
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
