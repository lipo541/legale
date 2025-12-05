'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Image as ImageIcon, Loader2, X, Eye, Edit2, Share2, ChevronDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import { specialistDashboardTranslations, Locale } from '@/translations/specialist-dashboard'

// Dynamically import TipTap editor (client-side only)
const RichTextEditor = dynamic(
  () => import('@/components/common/RichTextEditor'),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-lg" /> }
)

interface SimplePostEditorProps {
  onCancel?: () => void
  onSuccess?: () => void
  editMode?: boolean
  postData?: {
    id?: string
    status?: string
    featured_image_url?: string
    post_translations?: Array<{
      language: string
      title?: string
      excerpt?: string
      content?: string
      og_title?: string
      og_description?: string
      og_image?: string
      social_hashtags?: string
    }>
  }
  locale: Locale
}

type Language = 'georgian' | 'english' | 'russian'

export default function SimplePostEditor({ onCancel, onSuccess, editMode, postData, locale }: SimplePostEditorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { showToast } = useToast()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ogImageInputRef = useRef<HTMLInputElement>(null)
  const t = specialistDashboardTranslations[locale] || specialistDashboardTranslations.ka

  // Active language state
  const [activeLanguage, setActiveLanguage] = useState<Language>('georgian')

  // Form state - Multi-language fields
  const [translations, setTranslations] = useState({
    georgian: { title: '', excerpt: '', content: '', ogTitle: '', ogDescription: '', socialHashtags: '' },
    english: { title: '', excerpt: '', content: '', ogTitle: '', ogDescription: '', socialHashtags: '' },
    russian: { title: '', excerpt: '', content: '', ogTitle: '', ogDescription: '', socialHashtags: '' }
  })

  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  // Social Media OG Image (shared across languages)
  const [ogImage, setOgImage] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null)
  const [existingOgImageUrl, setExistingOgImageUrl] = useState<string | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSocialMedia, setShowSocialMedia] = useState(false)

  // Get current language data
  const currentData = translations[activeLanguage]

  // Update field in current language
  const updateField = (field: keyof typeof currentData, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value
      }
    }))
  }

  // Load existing post data if in edit mode
  useEffect(() => {
    if (editMode && postData) {
      const georgianTranslation = postData.post_translations?.find(t => t.language === 'ka')
      const englishTranslation = postData.post_translations?.find(t => t.language === 'en')
      const russianTranslation = postData.post_translations?.find(t => t.language === 'ru')
      
      if (georgianTranslation) {
        setTranslations(prev => ({
          ...prev,
          georgian: {
            title: georgianTranslation.title || '',
            excerpt: georgianTranslation.excerpt || '',
            content: georgianTranslation.content || '',
            ogTitle: georgianTranslation.og_title || '',
            ogDescription: georgianTranslation.og_description || '',
            socialHashtags: georgianTranslation.social_hashtags || ''
          }
        }))
        
        if (georgianTranslation.og_image) {
          setExistingOgImageUrl(georgianTranslation.og_image)
          setOgImagePreview(georgianTranslation.og_image)
        }
        
        if (georgianTranslation.og_title || georgianTranslation.og_description || 
            georgianTranslation.og_image || georgianTranslation.social_hashtags) {
          setShowSocialMedia(true)
        }
      }

      if (englishTranslation) {
        setTranslations(prev => ({
          ...prev,
          english: {
            title: englishTranslation.title || '',
            excerpt: englishTranslation.excerpt || '',
            content: englishTranslation.content || '',
            ogTitle: englishTranslation.og_title || '',
            ogDescription: englishTranslation.og_description || '',
            socialHashtags: englishTranslation.social_hashtags || ''
          }
        }))
      }

      if (russianTranslation) {
        setTranslations(prev => ({
          ...prev,
          russian: {
            title: russianTranslation.title || '',
            excerpt: russianTranslation.excerpt || '',
            content: russianTranslation.content || '',
            ogTitle: russianTranslation.og_title || '',
            ogDescription: russianTranslation.og_description || '',
            socialHashtags: russianTranslation.social_hashtags || ''
          }
        }))
      }
      
      if (postData.featured_image_url) {
        setExistingImageUrl(postData.featured_image_url)
        setFeaturedImagePreview(postData.featured_image_url)
      }
    }
  }, [editMode, postData])

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast(t.selectImageFile, 'error')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(t.imageTooLarge, 'error')
        return
      }
      setFeaturedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setFeaturedImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Handle OG image selection
  const handleOgImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast(t.selectImageFile, 'error')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(t.imageTooLarge, 'error')
        return
      }
      setOgImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setOgImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Remove images
  const handleRemoveImage = () => {
    setFeaturedImage(null)
    setFeaturedImagePreview(null)
    setExistingImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveOgImage = () => {
    setOgImage(null)
    setOgImagePreview(null)
    setExistingOgImageUrl(null)
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error(t.imageUploadError)
    } finally {
      setUploading(false)
    }
  }

  // Save post
  const handleSave = async () => {
    if (!translations.georgian.title.trim()) {
      showToast(t.enterGeorgianTitle, 'error')
      return
    }
    if (!translations.georgian.content.trim()) {
      showToast(t.enterGeorgianContent, 'error')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t.userNotAuthorized)

      let featuredImageUrl = existingImageUrl
      let ogImageUrl = existingOgImageUrl

      if (featuredImage) featuredImageUrl = await uploadImage(featuredImage)
      if (ogImage) ogImageUrl = await uploadImage(ogImage)

      if (editMode && postData?.id) {
        // UPDATE existing post
        const { error: postError } = await supabase
          .from('posts')
          .update({
            featured_image_url: featuredImageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', postData.id)

        if (postError) throw postError

        const updatePromises = []

        // Georgian
        if (translations.georgian.title || translations.georgian.content) {
          updatePromises.push(
            supabase
              .from('post_translations')
              .update({
                title: translations.georgian.title.trim(),
                excerpt: translations.georgian.excerpt.trim(),
                content: translations.georgian.content,
                og_title: translations.georgian.ogTitle.trim() || null,
                og_description: translations.georgian.ogDescription.trim() || null,
                og_image: ogImageUrl || null,
                social_hashtags: translations.georgian.socialHashtags.trim() || null,
                updated_at: new Date().toISOString()
              })
              .eq('post_id', postData.id)
              .eq('language', 'ka')
          )
        }

        // English
        if (translations.english.title || translations.english.content) {
          updatePromises.push(
            supabase
              .from('post_translations')
              .upsert({
                post_id: postData.id,
                language: 'en',
                title: translations.english.title.trim(),
                excerpt: translations.english.excerpt.trim(),
                content: translations.english.content,
                slug: `draft-${postData.id}-en-${Date.now()}`,
                og_title: translations.english.ogTitle.trim() || null,
                og_description: translations.english.ogDescription.trim() || null,
                og_image: ogImageUrl || null,
                social_hashtags: translations.english.socialHashtags.trim() || null,
                updated_at: new Date().toISOString()
              })
          )
        }

        // Russian
        if (translations.russian.title || translations.russian.content) {
          updatePromises.push(
            supabase
              .from('post_translations')
              .upsert({
                post_id: postData.id,
                language: 'ru',
                title: translations.russian.title.trim(),
                excerpt: translations.russian.excerpt.trim(),
                content: translations.russian.content,
                slug: `draft-${postData.id}-ru-${Date.now()}`,
                og_title: translations.russian.ogTitle.trim() || null,
                og_description: translations.russian.ogDescription.trim() || null,
                og_image: ogImageUrl || null,
                social_hashtags: translations.russian.socialHashtags.trim() || null,
                updated_at: new Date().toISOString()
              })
          )
        }

        const results = await Promise.all(updatePromises)
        const errors = results.filter(r => r.error)
        if (errors.length > 0) throw errors[0].error

        showToast(t.postUpdated, 'success')
      } else {
        // CREATE new post
        const { data: newPost, error: postError } = await supabase
          .from('posts')
          .insert({
            author_id: user.id,
            status: 'draft',
            featured_image_url: featuredImageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (postError) throw postError

        const translationsToInsert = []

        // Georgian (required)
        translationsToInsert.push({
          post_id: newPost.id,
          language: 'ka',
          title: translations.georgian.title.trim(),
          excerpt: translations.georgian.excerpt.trim(),
          content: translations.georgian.content,
          slug: `draft-${newPost.id}-ka-${Date.now()}`,
          og_title: translations.georgian.ogTitle.trim() || null,
          og_description: translations.georgian.ogDescription.trim() || null,
          og_image: ogImageUrl || null,
          social_hashtags: translations.georgian.socialHashtags.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        // English (optional)
        if (translations.english.title.trim() && translations.english.content.trim()) {
          translationsToInsert.push({
            post_id: newPost.id,
            language: 'en',
            title: translations.english.title.trim(),
            excerpt: translations.english.excerpt.trim(),
            content: translations.english.content,
            slug: `draft-${newPost.id}-en-${Date.now()}`,
            og_title: translations.english.ogTitle.trim() || null,
            og_description: translations.english.ogDescription.trim() || null,
            og_image: ogImageUrl || null,
            social_hashtags: translations.english.socialHashtags.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }

        // Russian (optional)
        if (translations.russian.title.trim() && translations.russian.content.trim()) {
          translationsToInsert.push({
            post_id: newPost.id,
            language: 'ru',
            title: translations.russian.title.trim(),
            excerpt: translations.russian.excerpt.trim(),
            content: translations.russian.content,
            slug: `draft-${newPost.id}-ru-${Date.now()}`,
            og_title: translations.russian.ogTitle.trim() || null,
            og_description: translations.russian.ogDescription.trim() || null,
            og_image: ogImageUrl || null,
            social_hashtags: translations.russian.socialHashtags.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }

        const { error: translationError } = await supabase
          .from('post_translations')
          .insert(translationsToInsert)

        if (translationError) throw translationError

        showToast(t.postCreated, 'success')
      }

      if (onSuccess) onSuccess()
      else if (onCancel) onCancel()
    } catch (error) {
      console.error('Error saving post:', error)
      showToast(t.error + (error as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Language tab indicator
  const hasContent = (lang: Language) => {
    return translations[lang].title.trim() || translations[lang].content.trim()
  }

  return (
    <div className="w-full max-w-[900px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
      {/* Header */}
      <div className="mb-4 lg:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/10 text-black/60'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {editMode ? t.editPostTitle : t.newPostTitle}
            </h1>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {editMode ? t.editExisting : t.createNewArticle}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
          }`}
        >
          {showPreview ? <Edit2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {showPreview ? t.editing : t.preview}
        </button>
      </div>

      {/* Main Card */}
      <div className={`rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
        {/* Language Tabs */}
        {!showPreview && (
          <div className={`flex gap-1 p-2 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            {(['georgian', 'english', 'russian'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                disabled={saving}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                  activeLanguage === lang
                    ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                    : isDark ? 'text-white/60 hover:bg-white/10' : 'text-black/60 hover:bg-black/10'
                }`}
              >
                {lang === 'georgian' ? t.georgian : lang === 'english' ? t.english : t.russian}
                {lang !== 'georgian' && hasContent(lang) && (
                  <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                    isDark ? 'bg-white' : 'bg-black'
                  }`} />
                )}
              </button>
            ))}
          </div>
        )}

        {showPreview ? (
          /* Preview Mode */
          <div className="p-4 lg:p-6 space-y-4">
            {featuredImagePreview && (
              <div className="relative aspect-[2/1] overflow-hidden rounded-lg">
                <img src={featuredImagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <h1 className={`text-2xl lg:text-3xl font-bold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {currentData.title || t.title}
              </h1>
              {currentData.excerpt && (
                <p className={`text-sm lg:text-base leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {currentData.excerpt}
                </p>
              )}
            </div>
            <div
              className={`prose prose-sm lg:prose-base max-w-none ${isDark ? 'prose-invert' : ''}`}
              dangerouslySetInnerHTML={{ __html: currentData.content || `<p>${t.noContent}</p>` }}
            />
          </div>
        ) : (
          /* Edit Mode */
          <div className="p-3 lg:p-4 space-y-4">
            {/* Featured Image */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {t.featuredImage}
              </label>
              {featuredImagePreview ? (
                <div className="relative aspect-[2/1] overflow-hidden rounded-lg">
                  <img src={featuredImagePreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    onClick={handleRemoveImage}
                    disabled={saving || uploading}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-50 ${
                      isDark ? 'bg-black/60 text-white' : 'bg-white/90 text-black'
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving || uploading}
                  className={`flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed transition-all hover:border-solid disabled:opacity-50 ${
                    isDark ? 'border-white/10 hover:border-white/30 hover:bg-white/5' : 'border-black/10 hover:border-black/30 hover:bg-black/[0.02]'
                  }`}
                >
                  <div className="text-center">
                    <ImageIcon className={`mx-auto h-8 w-8 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
                    <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {t.uploadImage}
                    </p>
                  </div>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>

            {/* Title */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {t.title} *
              </label>
              <input
                type="text"
                value={currentData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={activeLanguage === 'georgian' ? t.enterTitle : activeLanguage === 'english' ? t.enterTitleEn : t.enterTitleRu}
                disabled={saving}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/30'
                    : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/30'
                } focus:outline-none`}
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {t.excerpt}
              </label>
              <textarea
                value={currentData.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                placeholder={t.shortDescription}
                rows={2}
                disabled={saving}
                className={`w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/30'
                    : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/30'
                } focus:outline-none`}
              />
            </div>

            {/* Content */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {t.content} *
              </label>
              <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <RichTextEditor
                  content={currentData.content}
                  onChange={(value) => updateField('content', value)}
                />
              </div>
            </div>

            {/* Social Media Section - Collapsible */}
            <div className={`rounded-lg border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <button
                onClick={() => setShowSocialMedia(!showSocialMedia)}
                disabled={saving}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-all disabled:opacity-50 ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Share2 className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                  <span className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    {t.socialMedia}
                  </span>
                  {(currentData.ogTitle || currentData.ogDescription || ogImagePreview) && (
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>✓</span>
                  )}
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSocialMedia ? 'rotate-180' : ''} ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>

              {showSocialMedia && (
                <div className={`space-y-3 border-t px-3 py-3 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                  {/* OG Title */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {t.ogTitle}
                    </label>
                    <input
                      type="text"
                      value={currentData.ogTitle}
                      onChange={(e) => updateField('ogTitle', e.target.value)}
                      placeholder={t.ogTitlePlaceholder}
                      disabled={saving}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20'
                          : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/20'
                      } focus:outline-none`}
                    />
                  </div>

                  {/* OG Description */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {t.ogDescription}
                    </label>
                    <textarea
                      value={currentData.ogDescription}
                      onChange={(e) => updateField('ogDescription', e.target.value)}
                      placeholder={t.ogDescriptionPlaceholder}
                      rows={2}
                      disabled={saving}
                      className={`w-full resize-none rounded-lg border px-2.5 py-1.5 text-xs leading-relaxed transition-colors disabled:opacity-50 ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20'
                          : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/20'
                      } focus:outline-none`}
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {t.hashtags}
                    </label>
                    <input
                      type="text"
                      value={currentData.socialHashtags}
                      onChange={(e) => updateField('socialHashtags', e.target.value)}
                      placeholder={t.hashtagsPlaceholder}
                      disabled={saving}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20'
                          : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/20'
                      } focus:outline-none`}
                    />
                  </div>

                  {/* OG Image */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {t.ogImage}
                    </label>
                    {ogImagePreview ? (
                      <div className="relative aspect-[1.91/1] overflow-hidden rounded-lg max-w-xs">
                        <img src={ogImagePreview} alt="OG Preview" className="h-full w-full object-cover" />
                        <button
                          onClick={handleRemoveOgImage}
                          disabled={saving || uploading}
                          className={`absolute top-1.5 right-1.5 p-1 rounded-full backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-50 ${
                            isDark ? 'bg-black/60 text-white' : 'bg-white/90 text-black'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => ogImageInputRef.current?.click()}
                        disabled={saving || uploading}
                        className={`flex h-20 w-40 items-center justify-center rounded-lg border-2 border-dashed transition-all hover:border-solid disabled:opacity-50 ${
                          isDark ? 'border-white/10 hover:border-white/20' : 'border-black/10 hover:border-black/20'
                        }`}
                      >
                        <div className="text-center">
                          <ImageIcon className={`mx-auto h-5 w-5 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
                          <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>1200x630px</p>
                        </div>
                      </button>
                    )}
                    <input ref={ogImageInputRef} type="file" accept="image/*" onChange={handleOgImageSelect} className="hidden" />
                  </div>

                  <p className={`text-[10px] leading-relaxed ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                    {t.ogInfo}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center justify-end gap-2 p-3 lg:p-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving || uploading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-black/60 hover:text-black hover:bg-black/10'
              }`}
            >
              {t.cancel}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || uploading || !translations.georgian.title.trim() || !translations.georgian.content.trim()}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            {saving ? (
              <><Loader2 className="h-3 w-3 animate-spin" />{t.saving}</>
            ) : (
              editMode ? t.update : t.create
            )}
          </button>
        </div>
      </div>

      {/* Info Notice */}
      {!editMode && !showPreview && (
        <p className={`mt-3 text-center text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
          {t.postInfoNotice}
        </p>
      )}
    </div>
  )
}
