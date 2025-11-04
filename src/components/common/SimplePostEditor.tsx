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
    }>
  }
}

export default function SimplePostEditor({ onCancel, onSuccess, editMode, postData }: SimplePostEditorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state - ONLY Georgian fields
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Load existing post data if in edit mode
  useEffect(() => {
    if (editMode && postData) {
      const georgianTranslation = postData.post_translations?.find(t => t.language === 'ka')
      if (georgianTranslation) {
        setTitle(georgianTranslation.title || '')
        setExcerpt(georgianTranslation.excerpt || '')
        setContent(georgianTranslation.content || '')
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
    // Validation
    if (!title.trim()) {
      alert('გთხოვთ შეიყვანოთ სათაური')
      return
    }

    if (!content.trim()) {
      alert('გთხოვთ შეიყვანოთ შინაარსი')
      return
    }

    setSaving(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('მომხმარებელი არ არის ავტორიზებული')

      let featuredImageUrl = existingImageUrl

      // Upload new image if selected
      if (featuredImage) {
        featuredImageUrl = await uploadImage(featuredImage)
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

        // Update Georgian translation
        const { error: translationError } = await supabase
          .from('post_translations')
          .update({
            title: title.trim(),
            excerpt: excerpt.trim(),
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('post_id', postData.id)
          .eq('language', 'ka')

        if (translationError) throw translationError

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

        // Create Georgian translation (only Georgian!)
        const { error: translationError } = await supabase
          .from('post_translations')
          .insert({
            post_id: newPost.id,
            language: 'ka',
            title: title.trim(),
            excerpt: excerpt.trim(),
            content: content,
            slug: '', // Will be generated by admin
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (translationError) throw translationError

        alert('პოსტი წარმატებით გაიგზავნა! სუპერადმინი გადახედავს და დაამატებს თარგმანებს.')
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
        <div className="space-y-8">
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
                  {title || 'სათაური'}
                </h1>
                {excerpt && (
                  <p className={`text-lg leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {excerpt}
                  </p>
                )}
              </div>
              <div
                className={`prose prose-lg max-w-none ${isDark ? 'prose-invert' : 'prose-gray'}`}
                dangerouslySetInnerHTML={{ __html: content || '<p className="text-gray-400">შინაარსი არ არის</p>' }}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
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
                    content={content}
                    onChange={setContent}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || uploading || !title.trim() || !content.trim()}
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
            პოსტი წარედგინება დასამტკიცებლად. სუპერადმინი დაამატებს თარგმანებს და SEO-ს.
          </p>
        )}
      </div>
    </div>
  )
}
