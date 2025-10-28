'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useSpecialistTranslations } from '@/contexts/SpecialistTranslationsContext'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

export default function SocialTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { activeLanguage, data, updateSocialField, specialistId } = useSpecialistTranslations()
  const supabase = createClient()

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const currentData = data.social[activeLanguage]

  // Helper to get placeholder text based on active language
  const getPlaceholder = (fieldKey: string): string => {
    const placeholders: Record<string, Record<typeof activeLanguage, string>> = {
      social_title: {
        georgian: 'სოციალური მედიის სათაური ქართულად',
        english: 'Social Media Title in English',
        russian: 'Заголовок для соцсетей на русском'
      },
      social_description: {
        georgian: 'სოციალური მედიის აღწერა ქართულად',
        english: 'Social Media Description in English',
        russian: 'Описание для соцсетей на русском'
      },
      social_hashtags: {
        georgian: '#იურისტი #ადვოკატი #სამართალი',
        english: '#lawyer #attorney #law',
        russian: '#юрист #адვокат #право'
      }
    }
    return placeholders[fieldKey]?.[activeLanguage] || ''
  }

  // Language code mapping
  const langToCode = (lang: typeof activeLanguage): string => {
    const map = { georgian: 'ka', english: 'en', russian: 'ru' }
    return map[lang]
  }

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !specialistId) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('გთხოვთ ატვირთოთ სურათი')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('სურათი ძალიან დიდია (მაქსიმუმ 5MB)')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const langCode = langToCode(activeLanguage)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${specialistId}/${langCode}/${fileName}`

      // Delete old image if exists
      if (currentData.social_image_url) {
        await supabase.storage
          .from('specialist-social-images')
          .remove([currentData.social_image_url])
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('specialist-social-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('specialist-social-images')
        .getPublicUrl(filePath)

      // Update state with file path (not full URL, we'll construct it when needed)
      updateSocialField('social_image_url', filePath)

    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError(error instanceof Error ? error.message : 'ატვირთვა ვერ მოხერხდა')
    } finally {
      setUploading(false)
    }
  }

  // Remove image
  const handleRemoveImage = async () => {
    if (!currentData.social_image_url) return

    try {
      await supabase.storage
        .from('specialist-social-images')
        .remove([currentData.social_image_url])

      updateSocialField('social_image_url', '')
    } catch (error) {
      console.error('Error removing image:', error)
    }
  }

  // Get image URL for preview
  const getImageUrl = (path: string) => {
    if (!path) return null
    const { data: { publicUrl } } = supabase.storage
      .from('specialist-social-images')
      .getPublicUrl(path)
    return publicUrl
  }

  return (
    <div className="space-y-6">
      {/* Social Title */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          Social Media სათაური
        </label>
        <input
          type="text"
          value={currentData.social_title}
          onChange={(e) => updateSocialField('social_title', e.target.value)}
          placeholder={getPlaceholder('social_title')}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          გამოჩნდება როცა პროფილს გააზიარებენ სოციალურ ქსელებში
        </p>
      </div>

      {/* Social Description */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          Social Media აღწერა
        </label>
        <textarea
          rows={4}
          value={currentData.social_description}
          onChange={(e) => updateSocialField('social_description', e.target.value)}
          placeholder={getPlaceholder('social_description')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          მოკლე და მიმზიდველი აღწერა სოციალური გაზიარებისთვის
        </p>
      </div>

      {/* Social Hashtags */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          Hashtags
        </label>
        <input
          type="text"
          value={currentData.social_hashtags}
          onChange={(e) => updateSocialField('social_hashtags', e.target.value)}
          placeholder={getPlaceholder('social_hashtags')}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
        <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          დაამატეთ რელევანტური hashtags (გამოყავით ჰაშით)
        </p>
      </div>

      {/* Social Image Upload */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          სოციალური მედიის სურათი (Open Graph / Twitter Card)
        </label>
        
        {currentData.social_image_url ? (
          <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
            <div className="flex items-start gap-4">
              <img
                src={getImageUrl(currentData.social_image_url) || ''}
                alt="Social preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                  რეკომენდებული ზომა: 1200x630px
                </p>
                <button
                  onClick={handleRemoveImage}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isDark
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
                  }`}
                >
                  <X className="w-4 h-4" />
                  წაშლა
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="social-image-upload"
              className={`flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'border-white/20 bg-white/5 hover:bg-white/10'
                  : 'border-black/20 bg-black/5 hover:bg-black/10'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    იტვირთება...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className={`w-8 h-8 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                      დააჭირეთ სურათის ასატვირთად
                    </p>
                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      PNG, JPG, WEBP (მაქს. 5MB)
                    </p>
                  </div>
                </div>
              )}
            </label>
            <input
              id="social-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        )}

        {uploadError && (
          <p className="mt-2 text-sm text-red-500">{uploadError}</p>
        )}

        <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          რეკომენდებული ზომა: 1200x630px (Facebook, Twitter, LinkedIn)
        </p>
      </div>

      {/* Social Media Preview */}
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
        <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
          📱 Preview
        </h4>
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}>
          {currentData.social_image_url && (
            <img
              src={getImageUrl(currentData.social_image_url) || ''}
              alt="Social preview"
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <div className={`font-semibold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {currentData.social_title || 'Social Media სათაური'}
            </div>
            <div className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {currentData.social_description || 'Social Media აღწერა გამოჩნდება აქ...'}
            </div>
            {currentData.social_hashtags && (
              <div className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {currentData.social_hashtags}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Tips */}
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-500/10 border-purple-500/30'}`}>
        <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
          💡 Social Media რჩევები
        </h4>
        <ul className={`text-xs space-y-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          <li>• სათაური უნდა იყოს დამაინტრიგებელი და ყურადღების მიმზიდველი</li>
          <li>• აღწერა უნდა აიძულებდეს კლიკს და გაზიარებას</li>
          <li>• გამოიყენეთ პოპულარული და რელევანტური hashtags</li>
          <li>• მოარგეთ კონტენტი თითოეული პლატფორმისთვის</li>
        </ul>
      </div>
    </div>
  )
}
