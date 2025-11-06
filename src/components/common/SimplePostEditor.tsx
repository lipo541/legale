'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Image as ImageIcon, Loader2, FileText, X, Eye, EyeOff, Edit2 } from 'lucide-react'
import dynamic from 'next/dynamic'

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
}

export default function SimplePostEditor({ onCancel, onSuccess, editMode, postData }: SimplePostEditorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Active language state
  const [activeLanguage, setActiveLanguage] = useState<'georgian' | 'english' | 'russian'>('georgian')

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
      console.log('📝 Loading post data:', postData)
      console.log('📝 Post translations:', postData.post_translations)
      
      const georgianTranslation = postData.post_translations?.find(t => t.language === 'ka')
      const englishTranslation = postData.post_translations?.find(t => t.language === 'en')
      const russianTranslation = postData.post_translations?.find(t => t.language === 'ru')
      
      // Load Georgian data
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
        
        // Auto-expand social media section if any field is filled
        if (georgianTranslation.og_title || georgianTranslation.og_description || 
            georgianTranslation.og_image || georgianTranslation.social_hashtags) {
          setShowSocialMedia(true)
        }
      }

      // Load English data
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

      // Load Russian data
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

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    // Categories will be assigned by SuperAdmin, so we don't need to load them
    return
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('გთხოვთ აირჩიოთ სურათის ფაილი')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს')
        return
      }

      setFeaturedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setFeaturedImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove image
  const handleRemoveImage = () => {
    setFeaturedImage(null)
    setFeaturedImagePreview(null)
    setExistingImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle OG image selection
  const handleOgImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('გთხოვთ აირჩიოთ სურათის ფაილი')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს')
        return
      }

      setOgImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setOgImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove OG image
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
      const filePath = fileName

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('სურათის ატვირთვა ვერ მოხერხდა')
    } finally {
      setUploading(false)
    }
  }

  // Save post
  const handleSave = async () => {
    // Validation - At least Georgian title and content required
    if (!translations.georgian.title.trim()) {
      alert('გთხოვთ შეიყვანოთ ქართული სათაური')
      return
    }

    if (!translations.georgian.content.trim()) {
      alert('გთხოვთ შეიყვანოთ ქართული შინაარსი')
      return
    }

    setSaving(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('მომხმარებელი არ არის ავტორიზებული')

      let featuredImageUrl = existingImageUrl
      let ogImageUrl = existingOgImageUrl

      // Upload new featured image if selected
      if (featuredImage) {
        featuredImageUrl = await uploadImage(featuredImage)
      }

      // Upload new OG image if selected
      if (ogImage) {
        ogImageUrl = await uploadImage(ogImage)
      }

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

        // Update all translations
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

        alert('პოსტი წარმატებით განახლდა!')
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

        // Create translations
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

        alert('პოსტი წარმატებით გაიგზავნა! სუპერადმინი გადახედავს და დაამატებს დამატებით ინფორმაციას.')
      }

      // Call success callback
      if (onSuccess) {
        onSuccess()
      } else if (onCancel) {
        onCancel()
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('შეცდომა: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Minimal Header */}
        <div className="mb-8 flex items-center justify-between">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className={`flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60 disabled:opacity-40 ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              უკან
            </button>
          )}
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`ml-auto flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60 ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}
          >
            {showPreview ? (
              <>
                <Edit2 className="h-4 w-4" />
                რედაქტირება
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                გადახედვა
              </>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {!showPreview && (
            /* Language Tabs */
            <div className="flex gap-2">
              <button
                onClick={() => setActiveLanguage('georgian')}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  activeLanguage === 'georgian'
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDark
                    ? 'bg-white/10 text-white/60 hover:bg-white/20'
                    : 'bg-black/10 text-black/60 hover:bg-black/20'
                }`}
              >
                ქართული
              </button>
              <button
                onClick={() => setActiveLanguage('english')}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  activeLanguage === 'english'
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDark
                    ? 'bg-white/10 text-white/60 hover:bg-white/20'
                    : 'bg-black/10 text-black/60 hover:bg-black/20'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setActiveLanguage('russian')}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  activeLanguage === 'russian'
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDark
                    ? 'bg-white/10 text-white/60 hover:bg-white/20'
                    : 'bg-black/10 text-black/60 hover:bg-black/20'
                }`}
              >
                Русский
              </button>
            </div>
          )}

          {showPreview ? (
            /* Preview Mode */
            <div className="space-y-6">
              {featuredImagePreview && (
                <div className="relative aspect-[2/1] overflow-hidden rounded-lg">
                  <img
                    src={featuredImagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-3">
                <h1 className={`text-4xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentData.title || 'სათაური'}
                </h1>
                {currentData.excerpt && (
                  <p className={`text-lg leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {currentData.excerpt}
                  </p>
                )}
              </div>
              <div
                className={`prose prose-lg max-w-none ${isDark ? 'prose-invert' : 'prose-gray'}`}
                dangerouslySetInnerHTML={{ __html: currentData.content || '<p className="text-gray-400">შინაარსი არ არის</p>' }}
              />
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-8">
              {/* Featured Image */}
              <div className="group">
                <div className="space-y-3">
                  {featuredImagePreview ? (
                    <div className="relative aspect-[2/1] overflow-hidden rounded-lg">
                      <img
                        src={featuredImagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={handleRemoveImage}
                        disabled={saving || uploading}
                        className={`absolute right-3 top-3 rounded-full p-2 backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-50 ${
                          isDark ? 'bg-black/60 text-white' : 'bg-white/90 text-gray-900'
                        }`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving || uploading}
                      className={`flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed transition-all hover:border-solid disabled:opacity-50 ${
                        isDark
                          ? 'border-white/10 hover:border-white/30 hover:bg-white/5'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <ImageIcon className={`mx-auto h-10 w-10 ${isDark ? 'text-white/30' : 'text-gray-300'}`} />
                        <p className={`mt-3 text-sm font-medium ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          სურათის ატვირთვა
                        </p>
                      </div>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <input
                  type="text"
                  value={currentData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="სათაური"
                  disabled={saving}
                  className={`w-full border-0 border-b-2 bg-transparent px-0 py-3 text-4xl font-bold placeholder:font-normal focus:outline-none focus:ring-0 disabled:opacity-50 ${
                    isDark
                      ? 'border-white/10 text-white placeholder:text-white/20 focus:border-white/30'
                      : 'border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-gray-400'
                  }`}
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className={`mb-2 block text-xs font-medium uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                  ამონარიდი
                </label>
                <textarea
                  value={currentData.excerpt}
                  onChange={(e) => updateField('excerpt', e.target.value)}
                  placeholder="მოკლე აღწერა..."
                  rows={3}
                  disabled={saving}
                  className={`w-full resize-none rounded-lg border px-4 py-3 text-sm leading-relaxed transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-white/10'
                      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:ring-gray-100'
                  }`}
                />
              </div>

              {/* Content (Rich Text Editor) */}
              <div>
                <label className={`mb-2 block text-xs font-medium uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                  შინაარსი
                </label>
                <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <RichTextEditor
                    content={currentData.content}
                    onChange={(value) => updateField('content', value)}
                  />
                </div>
              </div>

              {/* Social Media Section - Collapsible */}
              <div className={`rounded-lg border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowSocialMedia(!showSocialMedia)}
                  disabled={saving}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-all disabled:opacity-50 ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h3v8h-3v-8zm-3 0H7v8h3v-8zm6-4h-3v3h3V7z"/>
                    </svg>
                    <span className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-900'}`}>
                      Social Media
                    </span>
                    {(currentData.ogTitle || currentData.ogDescription || ogImagePreview || currentData.socialHashtags) && (
                      <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                        ✓
                      </span>
                    )}
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform ${showSocialMedia ? 'rotate-180' : ''} ${
                      isDark ? 'text-white/60' : 'text-gray-600'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSocialMedia && (
                  <div className={`space-y-4 border-t px-4 py-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    {/* OG Title */}
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        OG სათაური
                      </label>
                      <input
                        type="text"
                        value={currentData.ogTitle}
                        onChange={(e) => updateField('ogTitle', e.target.value)}
                        placeholder="სოციალურ მედიაში გამოსაჩენი სათაური"
                        disabled={saving}
                        className={`w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 disabled:opacity-50 ${
                          isDark
                            ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-white/10'
                            : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:ring-gray-100'
                        }`}
                      />
                    </div>

                    {/* OG Description */}
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        OG აღწერა
                      </label>
                      <textarea
                        value={currentData.ogDescription}
                        onChange={(e) => updateField('ogDescription', e.target.value)}
                        placeholder="სოციალურ მედიაში გამოსაჩენი აღწერა"
                        rows={2}
                        disabled={saving}
                        className={`w-full resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed transition-all focus:outline-none focus:ring-1 disabled:opacity-50 ${
                          isDark
                            ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-white/10'
                            : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:ring-gray-100'
                        }`}
                      />
                    </div>

                    {/* Hashtags */}
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        Hashtags
                      </label>
                      <input
                        type="text"
                        value={currentData.socialHashtags}
                        onChange={(e) => updateField('socialHashtags', e.target.value)}
                        placeholder="#სამართალი #იურიდიული #კონსულტაცია"
                        disabled={saving}
                        className={`w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 disabled:opacity-50 ${
                          isDark
                            ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-white/10'
                            : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:ring-gray-100'
                        }`}
                      />
                    </div>

                    {/* OG Image */}
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        OG სურათი
                      </label>
                      {ogImagePreview ? (
                        <div className="relative aspect-[2/1] overflow-hidden rounded-lg">
                          <img
                            src={ogImagePreview}
                            alt="OG Preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={handleRemoveOgImage}
                            disabled={saving || uploading}
                            className={`absolute right-2 top-2 rounded-full p-1.5 backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-50 ${
                              isDark ? 'bg-black/60 text-white' : 'bg-white/90 text-gray-900'
                            }`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className={`flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-all hover:border-solid disabled:opacity-50 ${
                            isDark
                              ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-center">
                            <ImageIcon className={`mx-auto h-6 w-6 ${isDark ? 'text-white/30' : 'text-gray-300'}`} />
                            <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                              1200x630px
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleOgImageSelect}
                            className="hidden"
                            disabled={saving || uploading}
                          />
                        </label>
                      )}
                    </div>

                    {/* Info */}
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                      Open Graph თეგები გამოჩნდება Facebook, Twitter, LinkedIn და სხვა პლატფორმებზე გაზიარებისას.
                    </p>

                    {/* Social Media Preview */}
                    {(currentData.ogTitle || currentData.ogDescription || ogImagePreview) && (
                      <div className="space-y-3">
                        <div className={`flex items-center gap-2 pt-2 border-t ${isDark ? 'border-white/10 text-white/60' : 'border-gray-200 text-gray-600'}`}>
                          <Eye className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Preview - როგორ გამოჩნდება</span>
                        </div>
                        
                        {/* Facebook/LinkedIn Preview */}
                        <div>
                          <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook / LinkedIn / Twitter
                          </div>
                          <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-white'}`}>
                            {ogImagePreview && (
                              <div className="relative aspect-[1.91/1] overflow-hidden">
                                <img 
                                  src={ogImagePreview} 
                                  alt="Social Preview" 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-3">
                              <div className={`mb-1 text-[10px] uppercase ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                yoursite.com
                              </div>
                              <div className={`mb-1 line-clamp-2 text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {currentData.ogTitle || currentData.title || 'სათაური'}
                              </div>
                              <div className={`line-clamp-2 text-xs leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                                {currentData.ogDescription || currentData.excerpt || 'აღწერა გამოჩნდება აქ...'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hashtags Preview */}
                        {currentData.socialHashtags && (
                          <div className={`rounded-lg border p-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                            <div className={`mb-1 text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                              Hashtags:
                            </div>
                            <div className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              {currentData.socialHashtags}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || uploading || !translations.georgian.title.trim() || !translations.georgian.content.trim()}
            className={`flex-1 rounded-lg px-6 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              isDark
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                შენახვა...
              </span>
            ) : (
              editMode ? 'განახლება' : 'გამოქვეყნება'
            )}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving || uploading}
              className={`rounded-lg px-6 py-3 font-medium transition-opacity hover:opacity-60 disabled:opacity-40 ${
                isDark
                  ? 'text-white/70'
                  : 'text-gray-600'
              }`}
            >
              გაუქმება
            </button>
          )}
        </div>

        {/* Minimal Info Notice */}
        {!editMode && (
          <p className={`mt-6 text-center text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            ქართული ენა სავალდებულოა. ინგლისური და რუსული - არჩევითი.
          </p>
        )}
      </div>
    </div>
  )
}
