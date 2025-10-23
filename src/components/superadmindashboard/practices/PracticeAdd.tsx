'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { ArrowLeft, Languages, Clock, Loader2 } from 'lucide-react'
import RichTextEditor from '@/components/common/RichTextEditor'
import { createClient } from '@/lib/supabase/client'

type Language = 'ka' | 'en' | 'ru'

interface Translation {
  title: string
  slug: string
  description: string
  heroImageAlt: string
  pageHeroImageAlt: string
  // SEO Fields
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  // Open Graph Fields
  ogTitle: string
  ogDescription: string
}

interface PracticeTranslation {
  id: string
  practice_id: string
  language: Language
  title: string
  slug: string
  description: string
  hero_image_alt: string
  page_hero_image_alt: string
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  word_count: number
  reading_time: number
}

interface Practice {
  id: string
  hero_image_url: string
  page_hero_image_url: string
  status: string
  created_at: string
  updated_at: string
}

interface PracticeWithTranslations extends Practice {
  practice_translations: PracticeTranslation[]
}

interface PracticeAddProps {
  onBack: () => void
  editData?: PracticeWithTranslations | null
}

const languageLabels: Record<Language, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский'
}

export default function PracticeAdd({ onBack, editData }: PracticeAddProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  
  const isEditMode = !!editData
  
  // Active language tab
  const [activeLanguage, setActiveLanguage] = useState<Language>('ka')
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Common fields (same for all languages)
  const [heroImage, setHeroImage] = useState<File | null>(null)
  const [pageHeroImage, setPageHeroImage] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState<string>('')
  const [pageHeroImagePreview, setPageHeroImagePreview] = useState<string>('')
  const [isSlugEditable, setIsSlugEditable] = useState<Record<Language, boolean>>({
    ka: false,
    en: false,
    ru: false
  })
  
  // Translations for each language (stored separately) - NOW WITH SLUG PER LANGUAGE
  const [translations, setTranslations] = useState<Record<Language, Translation>>({
    ka: { 
      title: '', slug: '', description: '', 
      heroImageAlt: '', pageHeroImageAlt: '',
      metaTitle: '', metaDescription: '', focusKeyword: '',
      ogTitle: '', ogDescription: ''
    },
    en: { 
      title: '', slug: '', description: '', 
      heroImageAlt: '', pageHeroImageAlt: '',
      metaTitle: '', metaDescription: '', focusKeyword: '',
      ogTitle: '', ogDescription: ''
    },
    ru: { 
      title: '', slug: '', description: '', 
      heroImageAlt: '', pageHeroImageAlt: '',
      metaTitle: '', metaDescription: '', focusKeyword: '',
      ogTitle: '', ogDescription: ''
    },
  })
  
  // Active tab (Content, SEO, Social)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'social'>('content')

  // Get current translation
  const currentTranslation = translations[activeLanguage]

  // Calculate reading time for current language
  const readingStats = useMemo(() => {
    const description = currentTranslation.description
    
    // Strip HTML tags to get plain text
    const plainText = description.replace(/<[^>]*>/g, ' ')
    
    // Count words (split by spaces and filter empty strings)
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length
    
    // Calculate reading time
    // Average reading speed: Georgian ~180 WPM, English ~200 WPM, Russian ~190 WPM
    const wordsPerMinute = activeLanguage === 'ka' ? 180 : activeLanguage === 'en' ? 200 : 190
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute)
    
    return {
      wordCount,
      readingTime: readingTimeMinutes > 0 ? readingTimeMinutes : 0
    }
  }, [currentTranslation.description, activeLanguage])

  // Populate fields when in edit mode
  useEffect(() => {
    if (editData) {
      // Set image previews
      if (editData.hero_image_url) {
        setHeroImagePreview(editData.hero_image_url)
      }
      if (editData.page_hero_image_url) {
        setPageHeroImagePreview(editData.page_hero_image_url)
      }

      // Populate translations
      const populatedTranslations: Record<Language, Translation> = {
        ka: { 
          title: '', slug: '', description: '', 
          heroImageAlt: '', pageHeroImageAlt: '',
          metaTitle: '', metaDescription: '', focusKeyword: '',
          ogTitle: '', ogDescription: ''
        },
        en: { 
          title: '', slug: '', description: '', 
          heroImageAlt: '', pageHeroImageAlt: '',
          metaTitle: '', metaDescription: '', focusKeyword: '',
          ogTitle: '', ogDescription: ''
        },
        ru: { 
          title: '', slug: '', description: '', 
          heroImageAlt: '', pageHeroImageAlt: '',
          metaTitle: '', metaDescription: '', focusKeyword: '',
          ogTitle: '', ogDescription: ''
        },
      }

      // Fill in data from existing translations
      editData.practice_translations.forEach((trans: PracticeTranslation) => {
        const lang = trans.language as Language
        populatedTranslations[lang] = {
          title: trans.title || '',
          slug: trans.slug || '',
          description: trans.description || '',
          heroImageAlt: trans.hero_image_alt || '',
          pageHeroImageAlt: trans.page_hero_image_alt || '',
          metaTitle: trans.meta_title || '',
          metaDescription: trans.meta_description || '',
          focusKeyword: trans.focus_keyword || '',
          ogTitle: trans.og_title || '',
          ogDescription: trans.og_description || '',
        }
      })

      setTranslations(populatedTranslations)
    }
  }, [editData])

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\u10A0-\u10FF\-]/g, '') // Keep letters (including Georgian), numbers, and -
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start
      .replace(/-+$/, '')          // Trim - from end
  }

  // Update translation field for current language
  const updateTranslation = (field: keyof Translation, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value
      }
    }))
  }

  // Update multiple fields at once
  const updateTranslationFields = (updates: Partial<Translation>) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        ...updates
      }
    }))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    
    // Update both title and slug in one state update
    if (!isSlugEditable[activeLanguage]) {
      const newSlug = generateSlug(newTitle)
      updateTranslationFields({ title: newTitle, slug: newSlug })
    } else {
      updateTranslation('title', newTitle)
    }
  }

  const toggleSlugEdit = () => {
    setIsSlugEditable(prev => ({
      ...prev,
      [activeLanguage]: !prev[activeLanguage]
    }))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only letters (including Georgian), numbers, and hyphens
    const validatedSlug = value
      .toLowerCase()
      .replace(/[^\w\u10A0-\u10FF\-]/g, '') // Keep only letters (incl. Georgian), numbers, and -
      .replace(/\-\-+/g, '-')                 // Replace multiple - with single -
      .replace(/^-+/, '')                      // Remove - from start
    
    updateTranslation('slug', validatedSlug)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'pageHero') => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'hero') {
          setHeroImagePreview(reader.result as string)
          setHeroImage(file)
        } else {
          setPageHeroImagePreview(reader.result as string)
          setPageHeroImage(file)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload image to Supabase Storage
  const uploadImageToStorage = async (file: File, type: 'hero' | 'page-hero' | 'og-images'): Promise<string> => {
    try {
      // Generate unique filename with original extension
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${type}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('practices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Image upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('practices')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      throw err
    }
  }

  // Validate form before saving
  const validateForm = (): string | null => {
    // Check if all languages have title
    if (!translations.ka.title || !translations.en.title || !translations.ru.title) {
      return 'გთხოვთ შეავსოთ სათაური სამივე ენაზე'
    }

    // Check if all languages have slug
    if (!translations.ka.slug || !translations.en.slug || !translations.ru.slug) {
      return 'გთხოვთ შეავსოთ slug სამივე ენაზე'
    }

    // Check if images are uploaded (for new practices) or exist (for editing)
    if (!heroImage && !heroImagePreview) {
      return 'გთხოვთ ატვირთოთ Hero სურათი'
    }

    if (!pageHeroImage && !pageHeroImagePreview) {
      return 'გთხოვთ ატვირთოთ Page Hero სურათი'
    }

    return null
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate form
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setIsLoading(false)
        return
      }

      let heroImageUrl = heroImagePreview
      let pageHeroImageUrl = pageHeroImagePreview

      // Step 1: Upload images to Storage (if new images were selected)
      console.log('📤 Processing images...')
      if (heroImage) {
        heroImageUrl = await uploadImageToStorage(heroImage, 'hero')
      }
      if (pageHeroImage) {
        pageHeroImageUrl = await uploadImageToStorage(pageHeroImage, 'page-hero')
      }
      console.log('✅ Images processed successfully')

      let practiceId: string

      if (isEditMode && editData) {
        // UPDATE MODE
        console.log('🔄 Updating practice record...')
        const { error: practiceError } = await supabase
          .from('practices')
          .update({
            hero_image_url: heroImageUrl,
            page_hero_image_url: pageHeroImageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', editData.id)

        if (practiceError) {
          throw new Error(`Failed to update practice: ${practiceError.message}`)
        }

        practiceId = editData.id
        console.log('✅ Practice updated:', practiceId)

        // Delete existing translations
        console.log('🗑️ Removing old translations...')
        const { error: deleteError } = await supabase
          .from('practice_translations')
          .delete()
          .eq('practice_id', practiceId)

        if (deleteError) {
          throw new Error(`Failed to delete old translations: ${deleteError.message}`)
        }
      } else {
        // INSERT MODE
        console.log('💾 Creating practice record...')
        const { data: practice, error: practiceError } = await supabase
          .from('practices')
          .insert({
            hero_image_url: heroImageUrl,
            page_hero_image_url: pageHeroImageUrl,
            status: 'published'
          })
          .select()
          .single()

        if (practiceError) {
          throw new Error(`Failed to create practice: ${practiceError.message}`)
        }

        practiceId = practice.id
        console.log('✅ Practice created:', practiceId)
      }

      // Step 3: Insert translations (all 3 languages)
      console.log('🌐 Creating translations...')
      const translationsToInsert = Object.entries(translations).map(([lang, trans]) => {
        // Calculate word count and reading time
        const plainText = trans.description.replace(/<[^>]*>/g, ' ')
        const words = plainText.trim().split(/\s+/).filter(w => w.length > 0)
        const wordCount = words.length
        const wpm = lang === 'ka' ? 180 : lang === 'en' ? 200 : 190
        const readingTime = Math.ceil(wordCount / wpm)

        return {
          practice_id: practiceId,
          language: lang,
          title: trans.title,
          slug: trans.slug,
          description: trans.description,
          hero_image_alt: trans.heroImageAlt,
          page_hero_image_alt: trans.pageHeroImageAlt,
          word_count: wordCount,
          reading_time: readingTime,
          // SEO Fields (NEW)
          meta_title: trans.metaTitle || null,
          meta_description: trans.metaDescription || null,
          focus_keyword: trans.focusKeyword || null,
          // Open Graph Fields (NEW)
          og_title: trans.ogTitle || null,
          og_description: trans.ogDescription || null,
          og_image_url: pageHeroImageUrl // Use Page Hero as OG Image (1200x630 recommended)
        }
      })

      const { error: translationsError } = await supabase
        .from('practice_translations')
        .insert(translationsToInsert)

      if (translationsError) {
        throw new Error(`Failed to create translations: ${translationsError.message}`)
      }

      console.log('✅ Translations created successfully')
      console.log(`🎉 Practice ${isEditMode ? 'updated' : 'saved'} successfully!`)

      // Success! Go back to list
      onBack()
    } catch (err) {
      console.error('❌ Save error:', err)
      setError(err instanceof Error ? err.message : 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pb-6">
      {/* Header with Back Button */}
      <div className="mb-4 md:mb-6">
        <button
          onClick={onBack}
          disabled={isLoading}
          className={`mb-2 md:mb-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            isLoading 
              ? 'cursor-not-allowed opacity-50'
              : isDark
              ? 'text-white/60 hover:bg-white/5 hover:text-white'
              : 'text-black/60 hover:bg-black/5 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          უკან დაბრუნება
        </button>
        <h1 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {isEditMode ? 'პრაქტიკის რედაქტირება' : 'New Practice Area'}
        </h1>
        <p className={`mt-1 text-xs md:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {isEditMode ? 'განაახლეთ პრაქტიკის ინფორმაცია ყველა ენაზე' : 'Create a practice area and localize it for every supported language.'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-4 rounded-lg border p-3 md:p-4 ${
          isDark 
            ? 'border-red-500/20 bg-red-500/10 text-red-400' 
            : 'border-red-500/30 bg-red-50 text-red-700'
        }`}>
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className={`rounded-xl border p-3 md:p-5 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        
        {/* Main Tabs: Content, SEO, Social */}
        <div className="mb-4 md:mb-6 border-b ${isDark ? 'border-white/10' : 'border-black/10'}">
          <div className="flex gap-1 md:gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'content'
                  ? isDark
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-emerald-500 text-emerald-600'
                  : isDark
                  ? 'border-transparent text-white/60 hover:text-white'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              📝 Content
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'seo'
                  ? isDark
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-emerald-500 text-emerald-600'
                  : isDark
                  ? 'border-transparent text-white/60 hover:text-white'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              🔍 SEO
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'social'
                  ? isDark
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-emerald-500 text-emerald-600'
                  : isDark
                  ? 'border-transparent text-white/60 hover:text-white'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
            >
              📱 Social Media
            </button>
          </div>
        </div>

        {/* Language Tabs (only for Content, SEO, Social tabs) */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Languages className={`h-3.5 md:h-4 w-3.5 md:w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
            <span className={`text-xs md:text-sm font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              ენის არჩევა
            </span>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            {(['ka', 'en', 'ru'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`flex-1 md:flex-none rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all ${
                  activeLanguage === lang
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : isDark
                    ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>
          <p className={`mt-1.5 md:mt-2 text-[10px] md:text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            შეავსე ყველა ენაზე. ტაბებს შორის გადასვლისას ინფორმაცია არ იკარგება.
          </p>
        </div>

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <>
            {/* Title Field */}
        <div className="mb-3 md:mb-4">
          <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            სათაური ({languageLabels[activeLanguage]})
          </label>
          <input
            type="text"
            value={currentTranslation.title}
            onChange={handleTitleChange}
            placeholder={activeLanguage === 'ka' ? 'მაგ: სისხლის სამართალი' : activeLanguage === 'en' ? 'e.g. Criminal Law' : 'напр. Уголовное право'}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              isDark
                ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Slug Field */}
        <div className="mb-3 md:mb-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              Slug ({languageLabels[activeLanguage]})
            </label>
            <button
              type="button"
              onClick={toggleSlugEdit}
              className={`text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap ${
                isSlugEditable[activeLanguage]
                  ? 'text-emerald-500 hover:text-emerald-600'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              {isSlugEditable[activeLanguage] ? 'ჩაკეტვა' : 'რედაქტირება'}
            </button>
          </div>
          <input
            type="text"
            value={currentTranslation.slug}
            onChange={handleSlugChange}
            placeholder="example-slug"
            readOnly={!isSlugEditable[activeLanguage]}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              isSlugEditable[activeLanguage]
                ? isDark
                  ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                  : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                : isDark
                ? 'border-white/5 bg-white/5 text-white/60 cursor-not-allowed'
                : 'border-black/5 bg-black/5 text-black/60 cursor-not-allowed'
            }`}
          />
          {isSlugEditable[activeLanguage] && (
            <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              მხოლოდ ასოები, რიცხვები და - (დეფისი)
            </p>
          )}
        </div>

        {/* Description Field */}
        <div className="mb-3 md:mb-4">
          <div className="mb-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
            <label className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              აღწერა ({languageLabels[activeLanguage]})
            </label>
            <div className={`flex items-center gap-2 md:gap-3 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <div className="flex items-center gap-1">
                <span className="font-medium">სიტყვები:</span>
                <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {readingStats.wordCount}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-medium hidden xs:inline">წასაკითხად:</span>
                <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {readingStats.readingTime} წთ
                </span>
              </div>
            </div>
          </div>
          
          <RichTextEditor
            content={currentTranslation.description}
            onChange={(html) => updateTranslation('description', html)}
          />
        </div>

        {/* Image Upload Section */}
        <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          {/* Hero Image (list) */}
          <div>
            <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              Hero image (list)
            </label>
            <div className="mb-2">
              <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                Alt text ({languageLabels[activeLanguage]})
              </label>
              <input
                type="text"
                value={currentTranslation.heroImageAlt}
                onChange={(e) => updateTranslation('heroImageAlt', e.target.value)}
                placeholder={activeLanguage === 'ka' ? 'სურათის აღწერა' : activeLanguage === 'en' ? 'Describe the image' : 'Опишите изображение'}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                  isDark
                    ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                }`}
              />
            </div>
            <label
              className={`flex min-h-[120px] md:min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDark
                  ? 'border-white/20 bg-[#0d0d0d] hover:border-white/40 hover:bg-white/5'
                  : 'border-black/20 bg-gray-50 hover:border-black/40 hover:bg-gray-100'
              }`}
            >
              {heroImagePreview ? (
                <img src={heroImagePreview} alt="Preview" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center p-3 md:p-4 text-center">
                  <div className={`mb-2 rounded-full p-2 md:p-3 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                    <svg className={`h-5 md:h-6 w-5 md:w-6 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`mb-0.5 text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                    Click to upload
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    PNG, JPG, WebP up to 8MB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => handleImageUpload(e, 'hero')}
                className="hidden"
              />
            </label>
          </div>

          {/* Page Hero Image (detail page) */}
          <div>
            <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              Page hero image (detail page)
            </label>
            <div className="mb-2">
              <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                Alt text ({languageLabels[activeLanguage]})
              </label>
              <input
                type="text"
                value={currentTranslation.pageHeroImageAlt}
                onChange={(e) => updateTranslation('pageHeroImageAlt', e.target.value)}
                placeholder={activeLanguage === 'ka' ? 'სურათის აღწერა' : activeLanguage === 'en' ? 'Describe the image' : 'Опишите изображение'}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                  isDark
                    ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                }`}
              />
            </div>
            <label
              className={`flex min-h-[120px] md:min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDark
                  ? 'border-white/20 bg-[#0d0d0d] hover:border-white/40 hover:bg-white/5'
                  : 'border-black/20 bg-gray-50 hover:border-black/40 hover:bg-gray-100'
              }`}
            >
              {pageHeroImagePreview ? (
                <img src={pageHeroImagePreview} alt="Preview" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center p-3 md:p-4 text-center">
                  <div className={`mb-2 rounded-full p-2 md:p-3 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                    <svg className={`h-5 md:h-6 w-5 md:w-6 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`mb-0.5 text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                    Click to upload
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    PNG, JPG, WebP up to 8MB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => handleImageUpload(e, 'pageHero')}
                className="hidden"
              />
            </label>
          </div>
        </div>
          </>
        )}

        {/* SEO TAB */}
        {activeTab === 'seo' && (
          <>
            <div className="space-y-4">
              {/* Meta Title */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Meta Title ({languageLabels[activeLanguage]})
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.metaTitle.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  value={currentTranslation.metaTitle}
                  onChange={(e) => updateTranslation('metaTitle', e.target.value.slice(0, 60))}
                  placeholder={`${currentTranslation.title || 'სათაური'} | Your Law Firm`}
                  maxLength={60}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  რეკომენდაცია: 50-60 სიმბოლო. ჩნდება browser tab-სა და Google-ში
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Meta Description ({languageLabels[activeLanguage]})
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.metaDescription.length}/160
                  </span>
                </label>
                <textarea
                  value={currentTranslation.metaDescription}
                  onChange={(e) => updateTranslation('metaDescription', e.target.value.slice(0, 160))}
                  placeholder="მოკლე აღწერა Google search results-ისთვის..."
                  maxLength={160}
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  რეკომენდაცია: 150-160 სიმბოლო. ჩნდება Google search snippet-ში
                </p>
              </div>

              {/* Focus Keyword */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Focus Keyword ({languageLabels[activeLanguage]}) <span className="text-[10px] opacity-60">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={currentTranslation.focusKeyword}
                  onChange={(e) => updateTranslation('focusKeyword', e.target.value)}
                  placeholder={activeLanguage === 'ka' ? 'მაგ: სისხლის სამართალი' : 'e.g. criminal law'}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  მთავარი keyword რომელზეც გინდა რანკინგი
                </p>
              </div>

              {/* Google Preview */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <p className={`mb-2 text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  🔍 Google Preview
                </p>
                <div className="space-y-1">
                  <p className="text-blue-600 text-base hover:underline cursor-pointer">
                    {currentTranslation.metaTitle || currentTranslation.title || 'სათაური'}
                  </p>
                  <p className="text-green-700 dark:text-green-600 text-xs">
                    https://yourdomain.ge/{activeLanguage}/practices/{currentTranslation.slug || 'slug'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {currentTranslation.metaDescription || 'Meta აღწერა ჩნდება აქ...'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SOCIAL MEDIA TAB */}
        {activeTab === 'social' && (
          <>
            <div className="space-y-4">
              {/* OG Title */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Open Graph Title ({languageLabels[activeLanguage]})
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.ogTitle.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  value={currentTranslation.ogTitle}
                  onChange={(e) => updateTranslation('ogTitle', e.target.value.slice(0, 60))}
                  placeholder={currentTranslation.metaTitle || currentTranslation.title || 'სათაური'}
                  maxLength={60}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  Facebook, LinkedIn, WhatsApp share-ზე გამოჩნდება
                </p>
              </div>

              {/* OG Description */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Open Graph Description ({languageLabels[activeLanguage]})
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.ogDescription.length}/200
                  </span>
                </label>
                <textarea
                  value={currentTranslation.ogDescription}
                  onChange={(e) => updateTranslation('ogDescription', e.target.value.slice(0, 200))}
                  placeholder={currentTranslation.metaDescription || 'სოციალური მედიის აღწერა...'}
                  maxLength={200}
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  რეკომენდაცია: 150-200 სიმბოლო
                </p>
              </div>

              {/* Info Box - OG Image uses Page Hero */}
              <div className={`rounded-lg border p-3 ${isDark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-500/20 bg-blue-50'}`}>
                <div className="flex items-start gap-2">
                  <svg className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className={`text-xs font-medium mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      🖼️ Open Graph სურათი
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      ავტომატურად გამოიყენება <strong>Page Hero Image</strong> როგორც Open Graph სურათი Facebook-ის, LinkedIn-ის და WhatsApp-ის გაზიარებისთვის.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Preview */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <p className={`mb-3 text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  📱 Social Media Preview
                </p>
                <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-white/20 bg-black' : 'border-black/20 bg-white'}`}>
                  <div className="aspect-[1.91/1] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    {pageHeroImagePreview ? (
                      <img 
                        src={pageHeroImagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">Page Hero Image Preview</p>
                    )}
                  </div>
                  <div className="p-3">
                    <p className={`text-xs uppercase mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      yourdomain.ge
                    </p>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                      {currentTranslation.ogTitle || currentTranslation.metaTitle || currentTranslation.title || 'სათაური'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {currentTranslation.ogDescription || currentTranslation.metaDescription || 'აღწერა'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={onBack}
            disabled={isLoading}
            className={`w-full sm:w-auto rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isLoading
                ? 'cursor-not-allowed opacity-50'
                : isDark
                ? 'bg-white/5 text-white hover:bg-white/10'
                : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isLoading
                ? 'cursor-not-allowed bg-emerald-400'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEditMode ? 'მიმდინარეობს განახლება...' : 'მიმდინარეობს შენახვა...'}</span>
              </>
            ) : (
              isEditMode ? 'განახლება' : 'შენახვა'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
