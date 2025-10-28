'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useCompanyTranslations } from '@/contexts/CompanyTranslationsContext'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'
import { useState, useRef } from 'react'

export default function SocialTab({ companyId }: { companyId: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { activeLanguage, translations, updateSocialField } = useCompanyTranslations()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentData = translations[activeLanguage].social
  const supabase = createClient()

  const getPlaceholder = (fieldKey: string): string => {
    const placeholders: Record<string, Record<typeof activeLanguage, string>> = {
      social_title: {
        georgian: 'სოციალური მედიის სათაური',
        english: 'Social media title',
        russian: 'Заголовок для соцсетей'
      },
      social_description: {
        georgian: 'აღწერა სოციალური მედიისთვის',
        english: 'Description for social media',
        russian: 'Описание для соцсетей'
      },
      social_hashtags: {
        georgian: '#სამართალი #იურისტი #საქართველო',
        english: '#law #lawyer #georgia',
        russian: '#право #юрист #грузия'
      }
    }
    return placeholders[fieldKey]?.[activeLanguage] || ''
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('გთხოვთ აირჩიოთ სურათის ფაილი')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    setUploading(true)
    try {
      // Create file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${companyId}/${activeLanguage === 'georgian' ? 'ka' : activeLanguage === 'english' ? 'en' : 'ru'}/social-image.${fileExt}`

      // Delete old image if exists
      if (currentData.social_image_url) {
        const oldPath = currentData.social_image_url.split('/').slice(-3).join('/')
        await supabase.storage.from('company-social-images').remove([oldPath])
      }

      // Upload new image
      const { data, error } = await supabase.storage
        .from('company-social-images')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-social-images')
        .getPublicUrl(fileName)

      updateSocialField(activeLanguage, 'social_image_url', publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('სურათის ატვირთვა ვერ მოხერხდა')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async () => {
    if (!currentData.social_image_url) return

    try {
      const path = currentData.social_image_url.split('/').slice(-3).join('/')
      await supabase.storage.from('company-social-images').remove([path])
      updateSocialField(activeLanguage, 'social_image_url', null)
    } catch (error) {
      console.error('Error removing image:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Social Title */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          📱 Social Media სათაური
        </label>
        <input
          type="text"
          value={currentData.social_title}
          onChange={(e) => updateSocialField(activeLanguage, 'social_title', e.target.value)}
          placeholder={getPlaceholder('social_title')}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          სათაური, რომელიც გამოჩნდება სოციალურ მედიაში გაზიარებისას
        </p>
      </div>

      {/* Social Description */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          💬 Social Media აღწერა
        </label>
        <textarea
          rows={3}
          value={currentData.social_description}
          onChange={(e) => updateSocialField(activeLanguage, 'social_description', e.target.value)}
          placeholder={getPlaceholder('social_description')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          აღწერა სოციალური მედიისთვის (Facebook, Twitter, LinkedIn)
        </p>
      </div>

      {/* Social Hashtags */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          #️⃣ ჰეშთეგები
        </label>
        <input
          type="text"
          value={currentData.social_hashtags}
          onChange={(e) => updateSocialField(activeLanguage, 'social_hashtags', e.target.value)}
          placeholder={getPlaceholder('social_hashtags')}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          ჰეშთეგები გამოყავით სფეისებით
        </p>
      </div>

      {/* Social Image Upload */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          🖼️ Social Media სურათი
        </label>
        
        {currentData.social_image_url ? (
          <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <img 
              src={currentData.social_image_url} 
              alt="Social media preview" 
              className="w-full h-64 object-cover"
            />
            <div className="p-3 flex items-center justify-between">
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სურათი ატვირთულია
              </p>
              <button
                onClick={handleRemoveImage}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                }`}
              >
                <X className="h-3 w-3" />
                წაშლა
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="social-image-upload"
            />
            <label
              htmlFor="social-image-upload"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  : 'border-black/20 hover:border-black/40 hover:bg-black/5'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className={`h-10 w-10 animate-spin mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    ატვირთვა...
                  </p>
                </>
              ) : (
                <>
                  <Upload className={`h-10 w-10 mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    დააჭირეთ სურათის ასატვირთად
                  </p>
                  <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    PNG, JPG, GIF (მაქს. 5MB)
                  </p>
                </>
              )}
            </label>
          </div>
        )}
        
        <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          რეკომენდებული ზომა: 1200x630px (Facebook, Twitter, LinkedIn)
        </p>
      </div>

      {/* Social Media Preview Info */}
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-500/10 border-purple-500/30'}`}>
        <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
          📲 Social Media რჩევები
        </h4>
        <ul className={`text-xs space-y-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          <li>• სურათი გამოჩნდება Facebook, Twitter, LinkedIn-ზე გაზიარებისას</li>
          <li>• სათაური: 55-60 სიმბოლო</li>
          <li>• აღწერა: 150-300 სიმბოლო</li>
          <li>• გამოიყენეთ მაღალი ხარისხის სურათები</li>
        </ul>
      </div>
    </div>
  )
}
