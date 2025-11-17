'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { usePostTranslations } from '@/contexts/PostTranslationsContext'
import { X, Share2, CheckCircle, Hash, Image as ImageIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface SocialPreviewProps {
  isDark: boolean
  ogTitle: string
  ogDescription: string
  ogImagePreview: string | null
}

// ============================================================================
// Helper Components
// ============================================================================

const SocialPreview = ({ isDark, ogTitle, ogDescription, ogImagePreview }: SocialPreviewProps) => (
  <div className={`rounded-lg overflow-hidden border ${
    isDark ? 'border-white/10 bg-black/80' : 'border-black/10 bg-white'
  }`}>
    {ogImagePreview && (
      <div className="relative w-full h-40 bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
        <img 
          src={ogImagePreview} 
          alt="Social preview" 
          className="w-full h-full object-cover"
        />
      </div>
    )}
    <div className="p-3">
      <div className={`text-xs uppercase mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
        yoursite.com
      </div>
      <div className={`text-sm font-semibold mb-1 line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>
        {ogTitle || 'Open Graph სათაური'}
      </div>
      <div className={`text-xs line-clamp-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {ogDescription || 'Open Graph აღწერა გამოჩნდება აქ...'}
      </div>
    </div>
  </div>
)

// ============================================================================
// Main Component
// ============================================================================

export default function SocialTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { 
    translations, 
    activeLanguage, 
    updateField, 
    ogImageFile,
    ogImagePreview, 
    setOgImageFile,
    setOgImagePreview 
  } = usePostTranslations()
  
  const currentData = translations[activeLanguage]

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const ogTitleLength = useMemo(() => currentData.og_title?.length || 0, [currentData.og_title])
  const ogDescriptionLength = useMemo(() => currentData.og_description?.length || 0, [currentData.og_description])
  
  const hashtagCount = useMemo(() => {
    if (!currentData.social_hashtags) return 0
    const matches = currentData.social_hashtags.match(/#/g)
    return matches ? matches.length : 0
  }, [currentData.social_hashtags])

  const ogTitleStatus = useMemo(() => {
    if (ogTitleLength === 0) return { color: 'text-white/50', message: '' }
    if (ogTitleLength <= 60) return { color: 'text-emerald-500', message: '✓ ოპტიმალური' }
    if (ogTitleLength <= 90) return { color: 'text-yellow-500', message: '⚠ გრძელია' }
    return { color: 'text-red-500', message: '✕ ძალიან გრძელია' }
  }, [ogTitleLength])

  const ogDescriptionStatus = useMemo(() => {
    if (ogDescriptionLength === 0) return { color: 'text-white/50', message: '' }
    if (ogDescriptionLength >= 150 && ogDescriptionLength <= 160) return { color: 'text-emerald-500', message: '✓ ოპტიმალური' }
    if (ogDescriptionLength <= 200) return { color: 'text-yellow-500', message: '⚠ მისაღები' }
    return { color: 'text-red-500', message: '✕ ძალიან გრძელია' }
  }, [ogDescriptionLength])

  // ============================================================================
  // Event Handlers (useCallback for performance)
  // ============================================================================

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [setOgImagePreview, setOgImageFile])

  const removeImage = useCallback(() => {
    setOgImagePreview(null)
    setOgImageFile(null)
    updateField('og_image', '')
  }, [setOgImagePreview, setOgImageFile, updateField])

  const handleOgTitleChange = useCallback((value: string) => {
    updateField('og_title', value)
  }, [updateField])

  const handleOgDescriptionChange = useCallback((value: string) => {
    updateField('og_description', value)
  }, [updateField])

  const handleHashtagsChange = useCallback((value: string) => {
    updateField('social_hashtags', value)
  }, [updateField])

  const handleAutoFillFromSeo = useCallback(() => {
    // Auto-fill OG title from meta title or post title
    if (!currentData.og_title) {
      const title = currentData.meta_title || currentData.title
      if (title) {
        updateField('og_title', title.slice(0, 60))
      }
    }
    
    // Auto-fill OG description from meta description or excerpt
    if (!currentData.og_description) {
      const description = currentData.meta_description || currentData.excerpt
      if (description) {
        updateField('og_description', description.slice(0, 160))
      }
    }
  }, [currentData.og_title, currentData.og_description, currentData.meta_title, currentData.meta_description, currentData.title, currentData.excerpt, updateField])

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className={`flex items-center gap-2 pb-2 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <Share2 className={`h-4 w-4 ${isDark ? 'text-white/80' : 'text-black/80'}`} aria-hidden="true" />
        <h3 className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Open Graph & Social Media
        </h3>
      </div>

      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        გამოიყენება Facebook, Twitter, LinkedIn, WhatsApp და სხვა პლატფორმებზე
      </p>

      {/* Auto-fill Helper */}
      {(!currentData.og_title || !currentData.og_description) && (currentData.meta_title || currentData.title || currentData.meta_description || currentData.excerpt) && (
        <button
          onClick={handleAutoFillFromSeo}
          className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
            isDark
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20'
          }`}
          aria-label="Auto-fill Open Graph fields from SEO data"
        >
          ✨ ავტომატური შევსება SEO მონაცემებიდან
        </button>
      )}

      {/* OG Title */}
      <div className="space-y-1.5">
        <label htmlFor="og-title" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          OG სათაური
        </label>
        <input
          id="og-title"
          type="text"
          value={currentData.og_title || ''}
          onChange={(e) => handleOgTitleChange(e.target.value)}
          placeholder="სოციალურ მედიაში გამოსაჩენი სათაური"
          maxLength={90}
          className={`w-full px-2 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
            isDark
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
              : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
          }`}
          aria-label="Open Graph title"
          aria-describedby="og-title-help"
        />
        <div className="flex items-center justify-between">
          <p id="og-title-help" className={`text-xs ${ogTitleStatus.color}`}>
            {ogTitleStatus.message || 'რეკომენდებული: 60 სიმბოლომდე'}
          </p>
          <span className={`text-xs ${ogTitleStatus.color}`} aria-live="polite">
            {ogTitleLength} / 60
          </span>
        </div>
      </div>

      {/* OG Description */}
      <div className="space-y-1.5">
        <label htmlFor="og-description" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          OG აღწერა
        </label>
        <textarea
          id="og-description"
          value={currentData.og_description || ''}
          onChange={(e) => handleOgDescriptionChange(e.target.value)}
          placeholder="სოციალურ მედიაში გამოსაჩენი აღწერა"
          rows={3}
          maxLength={200}
          className={`w-full px-2 py-1.5 text-xs rounded-md border transition-colors resize-none focus:outline-none focus:border-emerald-500 ${
            isDark
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
              : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
          }`}
          aria-label="Open Graph description"
          aria-describedby="og-description-help"
        />
        <div className="flex items-center justify-between">
          <p id="og-description-help" className={`text-xs ${ogDescriptionStatus.color}`}>
            {ogDescriptionStatus.message || 'რეკომენდებული: 150-160 სიმბოლო'}
          </p>
          <span className={`text-xs ${ogDescriptionStatus.color}`} aria-live="polite">
            {ogDescriptionLength} / 160
          </span>
        </div>
      </div>

      {/* Social Hashtags */}
      <div className="space-y-1.5">
        <label htmlFor="social-hashtags" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Social Media Hashtags
        </label>
        <div className="relative">
          <Hash className={`absolute left-2 top-2 h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true" />
          <input
            id="social-hashtags"
            type="text"
            value={currentData.social_hashtags || ''}
            onChange={(e) => handleHashtagsChange(e.target.value)}
            placeholder="სამართალი იურიდიული კონსულტაცია"
            className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
            }`}
            aria-label="Social media hashtags"
            aria-describedby="hashtags-help"
          />
        </div>
        <div className="flex items-center justify-between">
          <p id="hashtags-help" className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            თითოეული სიტყვა ავტომატურად იქცევა ჰეშთეგად
          </p>
          <span className={`text-xs ${
            hashtagCount > 0 ? 'text-emerald-500' : isDark ? 'text-white/50' : 'text-black/50'
          }`} aria-live="polite">
            {hashtagCount} ჰეშთეგი
          </span>
        </div>
      </div>

      {/* OG Image Upload */}
      <div className="space-y-1.5">
        <label className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          OG სურათი (1200x630px)
        </label>
        
        <label
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
            ogImagePreview
              ? 'border-transparent'
              : isDark
              ? 'border-white/20 bg-white/5 hover:border-emerald-500/50 hover:bg-white/10'
              : 'border-black/20 bg-black/5 hover:border-emerald-500/50 hover:bg-black/10'
          }`}
        >
          {ogImagePreview ? (
            <div className="relative w-full h-full min-h-[140px]">
              <img 
                src={ogImagePreview} 
                alt="OG image preview" 
                className="w-full h-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  removeImage()
                }}
                className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                  isDark
                    ? 'bg-black/60 hover:bg-black/80 text-white'
                    : 'bg-white/60 hover:bg-white/80 text-black'
                }`}
                aria-label="Remove OG image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center p-4 text-center">
              <div className={`mb-2 rounded-full p-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                <ImageIcon className={`h-5 w-5 ${isDark ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true" />
              </div>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                დააჭირეთ ატვირთვისთვის
              </p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                რეკ: 1200x630px • JPG, PNG, WebP • Max 5MB
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            aria-label="Upload OG image"
          />
        </label>
      </div>

      {/* Social Media Preview */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Share2 className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} aria-hidden="true" />
          <h4 className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            სოციალური მედიის Preview
          </h4>
        </div>
        <SocialPreview
          isDark={isDark}
          ogTitle={currentData.og_title || currentData.meta_title || currentData.title || ''}
          ogDescription={currentData.og_description || currentData.meta_description || currentData.excerpt || ''}
          ogImagePreview={ogImagePreview}
        />
      </div>

      {/* Info Box */}
      <div className={`rounded-lg p-3 border ${
        isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
      }`}>
        <div className="flex gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Open Graph რჩევები
            </h3>
            <ul className={`text-xs space-y-0.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>სურათი: 1200x630px (Facebook, LinkedIn, Twitter)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>სათაური: მაქსიმუმ 60 სიმბოლო</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>აღწერა: 150-160 სიმბოლო ოპტიმალურია</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>გამოიყენეთ მაღალი ხარისხის, მიმზიდველი სურათები</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>ჰეშთეგები: ავტომატურად ემატება # სიმბოლო</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
