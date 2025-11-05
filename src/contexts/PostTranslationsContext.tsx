'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { createPost, updatePost } from '@/lib/supabase/posts'

// Types
type Language = 'georgian' | 'english' | 'russian'
type TabType = 'content' | 'category' | 'seo' | 'social'

interface PostTranslationData {
  // Content fields
  title: string
  excerpt: string
  content: string
  featured_image?: string
  
  // Category field
  category: string
  category_id?: string | null
  
  // SEO fields
  meta_title: string
  meta_description: string
  keywords: string
  slug: string
  
  // Social Media fields (Open Graph - works for all platforms)
  og_title: string
  og_description: string
  og_image?: string
  social_hashtags: string
}

interface PostTranslations {
  georgian: PostTranslationData
  english: PostTranslationData
  russian: PostTranslationData
}

interface PostContextType {
  activeTab: TabType
  activeLanguage: Language
  translations: PostTranslations
  loading: boolean
  saving: boolean
  // Post metadata (language-independent)
  displayPosition: number | null // 1-10 for NewsPage positions, null for AllPostsSection
  positionOrder: number // Order within slider positions
  status: 'draft' | 'pending' | 'published' | 'archived'
  postId: string | null // For editing existing posts
  categoryId: string | null // Category ID (language-independent)
  // OG Image upload state
  ogImageFile: File | null
  ogImagePreview: string | null
  setActiveTab: (tab: TabType) => void
  setActiveLanguage: (lang: Language) => void
  updateField: (field: keyof PostTranslationData, value: string) => void
  updateAllLanguages: (field: keyof PostTranslationData, values: { georgian: string, english: string, russian: string }) => void
  setDisplayPosition: (position: number | null) => void
  setPositionOrder: (order: number) => void
  setStatus: (status: 'draft' | 'pending' | 'published' | 'archived') => void
  setPostId: (id: string | null) => void
  setCategoryId: (id: string | null) => void
  setOgImageFile: (file: File | null) => void
  setOgImagePreview: (preview: string | null) => void
  savePost: () => Promise<void>
}

// Initial empty translation data
const emptyTranslationData: PostTranslationData = {
  title: '',
  excerpt: '',
  content: '',
  featured_image: '',
  category: '',
  meta_title: '',
  meta_description: '',
  keywords: '',
  slug: '',
  og_title: '',
  og_description: '',
  og_image: '',
  social_hashtags: '',
}

// Context
const PostTranslationsContext = createContext<PostContextType | undefined>(undefined)

// Provider
interface InitialPostData {
  id?: string
  status?: string
  display_position?: number | null
  position_order?: number
  featured_image_url?: string
  post_translations?: Array<{
    language: string
    title?: string
    excerpt?: string
    content?: string
    category?: string
    category_id?: string | null
    meta_title?: string
    meta_description?: string
    keywords?: string
    og_title?: string
    og_description?: string
    og_image?: string
    social_hashtags?: string
    slug?: string
    word_count?: number
    reading_time?: number
  }>
}

export function PostTranslationsProvider({ 
  children, 
  initialData, 
  editMode 
}: { 
  children: ReactNode
  initialData?: InitialPostData
  editMode?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [activeLanguage, setActiveLanguage] = useState<Language>('georgian')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Post metadata (language-independent)
  const [displayPosition, setDisplayPosition] = useState<number | null>(null)
  const [positionOrder, setPositionOrder] = useState<number>(0)
  const [status, setStatus] = useState<'draft' | 'pending' | 'published' | 'archived'>('draft')
  const [postId, setPostId] = useState<string | null>(null) // null = new post, string = editing existing
  const [categoryId, setCategoryId] = useState<string | null>(null) // Category ID
  
  // OG Image upload state
  const [ogImageFile, setOgImageFile] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null)
  
  const [translations, setTranslations] = useState<PostTranslations>({
    georgian: { ...emptyTranslationData },
    english: { ...emptyTranslationData },
    russian: { ...emptyTranslationData },
  })

  // Load initial data if in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      // Set post metadata
      setPostId(initialData.id || null)
      setStatus((initialData.status as 'draft' | 'pending' | 'published' | 'archived') || 'draft')
      setDisplayPosition(initialData.display_position ?? null)
      setPositionOrder(initialData.position_order || 0)

      // Load translations
      if (initialData.post_translations && Array.isArray(initialData.post_translations)) {
        const georgianTrans = initialData.post_translations.find((t) => t.language === 'ka')
        const englishTrans = initialData.post_translations.find((t) => t.language === 'en')
        const russianTrans = initialData.post_translations.find((t) => t.language === 'ru')

        // Load OG Image preview if exists (from any translation, usually they're the same)
        const ogImageUrl = georgianTrans?.og_image || englishTrans?.og_image || russianTrans?.og_image
        if (ogImageUrl) {
          setOgImagePreview(ogImageUrl)
        }

        setTranslations({
          georgian: georgianTrans ? {
            title: georgianTrans.title || '',
            excerpt: georgianTrans.excerpt || '',
            content: georgianTrans.content || '',
            featured_image: initialData.featured_image_url || '',
            category: georgianTrans.category || '',
            category_id: georgianTrans.category_id || null,
            meta_title: georgianTrans.meta_title || '',
            meta_description: georgianTrans.meta_description || '',
            keywords: georgianTrans.keywords || '',
            slug: georgianTrans.slug || '',
            og_title: georgianTrans.og_title || '',
            og_description: georgianTrans.og_description || '',
            og_image: georgianTrans.og_image || '',
            social_hashtags: georgianTrans.social_hashtags || '',
          } : { ...emptyTranslationData },
          english: englishTrans ? {
            title: englishTrans.title || '',
            excerpt: englishTrans.excerpt || '',
            content: englishTrans.content || '',
            featured_image: initialData.featured_image_url || '',
            category: englishTrans.category || '',
            category_id: englishTrans.category_id || null,
            meta_title: englishTrans.meta_title || '',
            meta_description: englishTrans.meta_description || '',
            keywords: englishTrans.keywords || '',
            slug: englishTrans.slug || '',
            og_title: englishTrans.og_title || '',
            og_description: englishTrans.og_description || '',
            og_image: englishTrans.og_image || '',
            social_hashtags: englishTrans.social_hashtags || '',
          } : { ...emptyTranslationData },
          russian: russianTrans ? {
            title: russianTrans.title || '',
            excerpt: russianTrans.excerpt || '',
            content: russianTrans.content || '',
            featured_image: initialData.featured_image_url || '',
            category: russianTrans.category || '',
            category_id: russianTrans.category_id || null,
            meta_title: russianTrans.meta_title || '',
            meta_description: russianTrans.meta_description || '',
            keywords: russianTrans.keywords || '',
            slug: russianTrans.slug || '',
            og_title: russianTrans.og_title || '',
            og_description: russianTrans.og_description || '',
            og_image: russianTrans.og_image || '',
            social_hashtags: russianTrans.social_hashtags || '',
          } : { ...emptyTranslationData },
        })
      }
    }
  }, [editMode, initialData])

  const updateField = (field: keyof PostTranslationData, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value
      }
    }))
  }

  const updateAllLanguages = (
    field: keyof PostTranslationData, 
    values: { georgian: string, english: string, russian: string }
  ) => {
    setTranslations(prev => ({
      georgian: {
        ...prev.georgian,
        [field]: values.georgian
      },
      english: {
        ...prev.english,
        [field]: values.english
      },
      russian: {
        ...prev.russian,
        [field]: values.russian
      }
    }))
  }

  const savePost = async () => {
    setSaving(true)
    try {
      // Get featured image file from georgian translation (same for all languages)
      const featuredImageFile = translations.georgian.featured_image || undefined

      const postData = {
        translations,
        displayPosition,
        positionOrder,
        status,
        featuredImageFile,
        ogImageFile, // Add OG image file
        categoryId, // Add category ID
      }

      let result
      if (postId) {
        // Update existing post
        result = await updatePost(postId, postData)
        alert('პოსტი წარმატებით განახლდა!')
      } else {
        // Create new post
        result = await createPost(postData)
        setPostId(result.postId) // Save postId for future updates
        alert('პოსტი წარმატებით შეინახა!')
      }

      console.log('Post saved successfully:', result)
    } catch (error) {
      console.error('Error saving post:', error)
      alert('შეცდომა შენახვისას: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PostTranslationsContext.Provider
      value={{
        activeTab,
        activeLanguage,
        translations,
        loading,
        saving,
        displayPosition,
        positionOrder,
        status,
        postId,
        categoryId,
        ogImageFile,
        ogImagePreview,
        setActiveTab,
        setActiveLanguage,
        updateField,
        updateAllLanguages,
        setDisplayPosition,
        setPositionOrder,
        setStatus,
        setPostId,
        setCategoryId,
        setOgImageFile,
        setOgImagePreview,
        savePost,
      }}
    >
      {children}
    </PostTranslationsContext.Provider>
  )
}

// Hook
export function usePostTranslations() {
  const context = useContext(PostTranslationsContext)
  if (!context) {
    throw new Error('usePostTranslations must be used within PostTranslationsProvider')
  }
  return context
}
