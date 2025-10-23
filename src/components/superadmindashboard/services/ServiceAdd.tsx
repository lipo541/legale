"use client"

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'
import { ArrowLeft, Languages, Clock, Loader2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Lazy load RichTextEditor for better performance
const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center border rounded-lg">
    <Loader2 className="animate-spin" size={32} />
  </div>
})

type Language = 'ka' | 'en' | 'ru'

interface ServiceAddProps {
  onBack: () => void
  editData?: ServiceWithTranslations | null
}

interface Translation {
  title: string
  slug: string
  description: string
  imageAlt: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
}

interface Practice {
  id: string
  translations: {
    ka: string
    en: string
    ru: string
  }
}

interface ServiceTranslation {
  id: string
  service_id: string
  language: Language
  title: string
  slug: string
  description: string
  image_alt: string
  meta_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  word_count: number
  reading_time: number
}

interface ServiceWithTranslations {
  id: string
  practice_id: string
  image_url: string
  og_image_url: string | null
  status: string
  created_at: string
  updated_at: string
  service_translations: ServiceTranslation[]
}

const languageLabels: Record<Language, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский'
}

export default function ServiceAdd({ onBack, editData }: ServiceAddProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const isEditMode = !!editData

  const [activeLanguage, setActiveLanguage] = useState<Language>('ka')
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'social'>('content')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [practices, setPractices] = useState<Practice[]>([])
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null)
  const [isPracticeDropdownOpen, setIsPracticeDropdownOpen] = useState(false)

  const [translations, setTranslations] = useState<Record<Language, Translation>>({
    ka: { title: '', slug: '', description: '', imageAlt: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '' },
    en: { title: '', slug: '', description: '', imageAlt: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '' },
    ru: { title: '', slug: '', description: '', imageAlt: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '' },
  })

  const [serviceImage, setServiceImage] = useState<File | null>(null)
  const [serviceImagePreview, setServiceImagePreview] = useState<string>('')
  const [ogImage, setOgImage] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string>('')
  
  const [isSlugEditable, setIsSlugEditable] = useState<Record<Language, boolean>>({
    ka: false,
    en: false,
    ru: false
  })

  // Populate fields when in edit mode
  useEffect(() => {
    if (editData) {
      // Set practice ID
      setSelectedPracticeId(editData.practice_id)

      // Set image previews
      if (editData.image_url) {
        setServiceImagePreview(editData.image_url)
      }
      if (editData.og_image_url) {
        setOgImagePreview(editData.og_image_url)
      }

      // Populate translations
      const populatedTranslations: Record<Language, Translation> = {
        ka: { 
          title: '', slug: '', description: '', imageAlt: '',
          metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: ''
        },
        en: { 
          title: '', slug: '', description: '', imageAlt: '',
          metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: ''
        },
        ru: { 
          title: '', slug: '', description: '', imageAlt: '',
          metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: ''
        },
      }

      // Fill in data from existing translations
      editData.service_translations.forEach((trans: ServiceTranslation) => {
        const lang = trans.language as Language
        populatedTranslations[lang] = {
          title: trans.title || '',
          slug: trans.slug || '',
          description: trans.description || '',
          imageAlt: trans.image_alt || '',
          metaTitle: trans.meta_title || '',
          metaDescription: trans.meta_description || '',
          ogTitle: trans.og_title || '',
          ogDescription: trans.og_description || '',
        }
      })

      setTranslations(populatedTranslations)
    }
  }, [editData])

  // Fetch practices with all language translations
  useEffect(() => {
    const fetchPractices = async () => {
      const { data: practicesData, error: practicesError } = await supabase
        .from('practices')
        .select('id')
        .order('created_at', { ascending: false })

      if (practicesError) {
        console.error('Error fetching practices:', practicesError)
        return
      }

      if (!practicesData) return

      // Fetch all language translations for each practice
      const practicesWithTitles = await Promise.all(
        practicesData.map(async (practice) => {
          const { data: translationsData } = await supabase
            .from('practice_translations')
            .select('language, title')
            .eq('practice_id', practice.id)

          const translationsMap: Record<Language, string> = {
            ka: 'უსათაურო პრაქტიკა',
            en: 'Untitled Practice',
            ru: 'Практика без названия'
          }

          translationsData?.forEach((trans: { language: Language; title: string }) => {
            translationsMap[trans.language] = trans.title
          })

          return {
            id: practice.id,
            translations: translationsMap
          }
        })
      )

      setPractices(practicesWithTitles)
    }

    fetchPractices()
  }, [supabase])

  // reading stats (word count + reading time) for current language
  const readingStats = useMemo(() => {
    const desc = translations[activeLanguage].description || ''
    const plain = desc.replace(/<[^>]*>/g, ' ')
    const words = plain.trim().split(/\s+/).filter(Boolean)
    const wordCount = words.length
    const wpm = activeLanguage === 'ka' ? 180 : activeLanguage === 'en' ? 200 : 190
    const readingTime = Math.ceil(wordCount / wpm)
    return { wordCount, readingTime }
  }, [translations, activeLanguage])

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

  const updateTranslation = (lang: Language, field: keyof Translation, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }))
  }

  const updateTranslationFields = (lang: Language, updates: Partial<Translation>) => {
    setTranslations(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        ...updates
      }
    }))
  }

  const handleTitleChange = (lang: Language, value: string) => {
    if (!isSlugEditable[lang]) {
      const newSlug = generateSlug(value)
      updateTranslationFields(lang, { title: value, slug: newSlug })
    } else {
      updateTranslation(lang, 'title', value)
    }
  }

  const toggleSlugEdit = () => {
    setIsSlugEditable(prev => ({
      ...prev,
      [activeLanguage]: !prev[activeLanguage]
    }))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedSlug = generateSlug(e.target.value)
    updateTranslation(activeLanguage, 'slug', sanitizedSlug)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'service' | 'og') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setError('სურათის ზომა არ უნდა აღემატებოდეს 8MB-ს')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'service') {
        setServiceImagePreview(reader.result as string)
        setServiceImage(file)
      } else {
        setOgImagePreview(reader.result as string)
        setOgImage(file)
      }
    }
    reader.readAsDataURL(file)
  }

  const uploadImageToStorage = async (file: File, type: 'service-images' | 'og-images'): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${type}/${fileName}`

      console.log('Uploading image:', { filePath, fileSize: file.size, fileType: file.type })

      const { data, error } = await supabase.storage
        .from('services')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`Image upload failed: ${error.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath)

      console.log('Image uploaded successfully:', publicUrl)
      return publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      throw err
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validation
    if (!translations.ka.title || !translations.ka.slug || !translations.ka.description) {
      setError('ქართული თარგმანი სავალდებულოა')
      return
    }

    if (!selectedPracticeId) {
      setError('აირჩიეთ პრაქტიკა')
      return
    }

    if (!serviceImage && !isEditMode) {
      setError('გთხოვთ ატვირთოთ სერვისის სურათი')
      return
    }

    setIsLoading(true)
    try {
      // Refresh session before proceeding
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
      if (sessionError) {
        throw new Error('Session expired. Please login again.')
      }

      let imageUrl = serviceImagePreview
      let ogImageUrl = ogImagePreview

      // Upload images (only if new images were selected)
      if (serviceImage) {
        console.log('Starting image upload...')
        imageUrl = await uploadImageToStorage(serviceImage, 'service-images')
      }
      if (ogImage) {
        ogImageUrl = await uploadImageToStorage(ogImage, 'og-images')
      }

      let serviceId: string

      if (isEditMode && editData) {
        // UPDATE MODE
        console.log('🔄 Updating service record...')
        const { error: serviceError } = await supabase
          .from('services')
          .update({
            practice_id: selectedPracticeId,
            image_url: imageUrl,
            og_image_url: ogImageUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editData.id)

        if (serviceError) {
          throw new Error(`Failed to update service: ${serviceError.message}`)
        }

        serviceId = editData.id
        console.log('✅ Service updated:', serviceId)

        // Delete existing translations
        console.log('🗑️ Removing old translations...')
        const { error: deleteError } = await supabase
          .from('service_translations')
          .delete()
          .eq('service_id', serviceId)

        if (deleteError) {
          throw new Error(`Failed to delete old translations: ${deleteError.message}`)
        }
      } else {
        // INSERT MODE
        console.log('💾 Creating service record...')
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .insert({ 
            practice_id: selectedPracticeId,
            image_url: imageUrl,
            og_image_url: ogImageUrl || null,
            status: 'draft'
          })
          .select()
          .single()

        if (serviceError) {
          throw new Error(`Failed to create service: ${serviceError.message}`)
        }

        serviceId = service.id
        console.log('✅ Service created:', serviceId)
      }

      // Insert translations (all 3 languages)
      console.log('🌐 Creating translations...')
      const toInsert = (Object.keys(translations) as Language[])
        .map((lang) => {
          // Calculate word count and reading time for each language
          const desc = translations[lang].description || ''
          const plain = desc.replace(/<[^>]*>/g, ' ')
          const words = plain.trim().split(/\s+/).filter(Boolean)
          const wordCount = words.length
          const wpm = lang === 'ka' ? 180 : lang === 'en' ? 200 : 190
          const readingTime = Math.ceil(wordCount / wpm)

          return {
            service_id: serviceId,
            language: lang,
            title: translations[lang].title,
            slug: translations[lang].slug,
            description: translations[lang].description,
            image_alt: translations[lang].imageAlt,
            meta_title: translations[lang].metaTitle || translations[lang].title,
            meta_description: translations[lang].metaDescription || translations[lang].description.replace(/<[^>]*>/g, '').substring(0, 160),
            og_title: translations[lang].ogTitle || translations[lang].metaTitle || translations[lang].title,
            og_description: translations[lang].ogDescription || translations[lang].metaDescription || translations[lang].description.replace(/<[^>]*>/g, '').substring(0, 160),
            word_count: wordCount,
            reading_time: readingTime,
          }
        })

      const { error: insertError } = await supabase
        .from('service_translations')
        .insert(toInsert)

      if (insertError) {
        throw new Error(`Translations creation failed: ${insertError.message}`)
      }

      console.log(`✅ Service ${isEditMode ? 'updated' : 'created'} successfully!`)
      onBack()
    } catch (err) {
      console.error('Service operation error:', err)
      if (err instanceof Error) {
        setError(`შეცდომა: ${err.message}`)
      } else {
        setError(`დაფიქსირდა შეცდომა სერვისის ${isEditMode ? 'განახლებისას' : 'შექმნისას'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPractice = practices.find(p => p.id === selectedPracticeId)

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
          {isEditMode ? 'სერვისის რედაქტირება' : 'ახალი სერვისი'}
        </h1>
        <p className={`mt-1 text-xs md:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {isEditMode ? 'შეცვალეთ სერვისი ყველა ენაზე' : 'შეავსეთ სერვისი ყველა ენაზე'}
        </p>
      </div>

      {error && (
        <div className={`mb-4 rounded-lg border p-3 md:p-4 ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/30 bg-red-50 text-red-700'}`}>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-current opacity-70 hover:opacity-100">x</button>
          </div>
        </div>
      )}

      <div className={`rounded-xl border p-3 md:p-5 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        <div className="mb-4 md:mb-6 border-b ${isDark ? 'border-white/10' : 'border-black/10'}">
          <div className="flex gap-1 md:gap-2 -mb-px">
            <button onClick={() => setActiveTab('content')} className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'content' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/60'}`}>
              📝 Content
            </button>
            <button onClick={() => setActiveTab('seo')} className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'seo' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/60'}`}>
              🔍 SEO
            </button>
            <button onClick={() => setActiveTab('social')} className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors ${activeTab === 'social' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/60'}`}>
              📱 Social Media
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Languages className={`h-3.5 md:h-4 w-3.5 md:w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
            <span className={`text-xs md:text-sm font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>ენის არჩევა</span>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            {(['ka', 'en', 'ru'] as Language[]).map((lang) => (
              <button key={lang} onClick={() => setActiveLanguage(lang)} className={`flex-1 md:flex-none rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all ${activeLanguage === lang ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10'}`}>
                {languageLabels[lang]}
              </button>
            ))}
          </div>
          <p className={`mt-1.5 md:mt-2 text-[10px] md:text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>შეავსე ყველა ენაზე. ტაბებს შორის გადასვლისას ინფორმაცია არ იკარგება.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'content' && (
            <>
              {/* Practice Selector Dropdown */}
              <div className="mb-4 md:mb-5">
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  აირჩიეთ პრაქტიკა <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPracticeDropdownOpen(!isPracticeDropdownOpen)}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
                      isDark 
                        ? 'border-white/10 bg-[#0d0d0d] text-white hover:border-white/20' 
                        : 'border-black/10 bg-white text-black hover:border-black/20'
                    }`}
                  >
                    <span className={selectedPractice ? '' : 'opacity-50'}>
                      {selectedPractice ? selectedPractice.translations[activeLanguage] : 'აირჩიეთ პრაქტიკა'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isPracticeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isPracticeDropdownOpen && (
                    <div className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                      isDark 
                        ? 'border-white/10 bg-[#0d0d0d]' 
                        : 'border-black/10 bg-white'
                    }`}>
                      {practices.length === 0 ? (
                        <div className={`px-3 py-2 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          პრაქტიკები არ მოიძებნა
                        </div>
                      ) : (
                        practices.map((practice) => (
                          <button
                            key={practice.id}
                            type="button"
                            onClick={() => {
                              setSelectedPracticeId(practice.id)
                              setIsPracticeDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              selectedPracticeId === practice.id
                                ? isDark
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-emerald-50 text-emerald-600'
                                : isDark
                                  ? 'text-white hover:bg-white/5'
                                  : 'text-black hover:bg-black/5'
                            }`}
                          >
                            {practice.translations[activeLanguage]}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3 md:mb-4">
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>სათაური ({languageLabels[activeLanguage]})</label>
                <input type="text" value={translations[activeLanguage].title} onChange={(e) => handleTitleChange(activeLanguage, e.target.value)} placeholder="მაგ: სერვისი" className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${isDark ? 'border-white/10 bg-[#0d0d0d] text-white' : 'border-black/10 bg-white text-black'}`} />
              </div>

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
                  value={translations[activeLanguage].slug} 
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

              <div className="mb-3 md:mb-4">
                <div className="mb-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
                  <label className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>აღწერა ({languageLabels[activeLanguage]})</label>
                  <div className={`flex items-center gap-2 md:gap-3 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    <div className="flex items-center gap-1"><span className="font-medium">სიტყვები:</span> <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{readingStats.wordCount}</span></div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{readingStats.readingTime} წთ</span></div>
                  </div>
                </div>

                <RichTextEditor content={translations[activeLanguage].description} onChange={(html) => updateTranslation(activeLanguage, 'description', html)} />
              </div>

              {/* Service Image Upload */}
              <div className="mb-3 md:mb-4">
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  სერვისის სურათი <span className="text-red-500">*</span>
                </label>
                <div className="mb-2">
                  <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    Alt text ({languageLabels[activeLanguage]})
                  </label>
                  <input
                    type="text"
                    value={translations[activeLanguage].imageAlt}
                    onChange={(e) => updateTranslation(activeLanguage, 'imageAlt', e.target.value)}
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
                  {serviceImagePreview ? (
                    <img src={serviceImagePreview} alt="Preview" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex flex-col items-center p-3 md:p-4 text-center">
                      <div className={`mb-2 rounded-full p-2 md:p-3 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                        <svg className={`h-5 md:h-6 w-5 md:w-6 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className={`mb-0.5 text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                        დააჭირეთ ატვირთვისთვის
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        PNG, JPG, WebP up to 8MB
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => handleImageUpload(e, 'service')}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              {/* Meta Title */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Meta Title ({languageLabels[activeLanguage]})
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {translations[activeLanguage].metaTitle.length}/60
                  </span>
                </label>
                <input 
                  type="text" 
                  value={translations[activeLanguage].metaTitle}
                  onChange={(e) => updateTranslation(activeLanguage, 'metaTitle', e.target.value.slice(0, 60))}
                  placeholder={translations[activeLanguage].title || 'Meta Title'}
                  maxLength={60}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  გამოჩნდება Google search results-ში
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Meta Description ({languageLabels[activeLanguage]})
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {translations[activeLanguage].metaDescription.length}/160
                  </span>
                </label>
                <textarea 
                  rows={3}
                  value={translations[activeLanguage].metaDescription}
                  onChange={(e) => updateTranslation(activeLanguage, 'metaDescription', e.target.value.slice(0, 160))}
                  placeholder="Meta აღწერა..."
                  maxLength={160}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  რეკომენდაცია: 120-160 სიმბოლო
                </p>
              </div>

              {/* Google Preview */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <p className={`mb-2 text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  🔍 Google Preview
                </p>
                <div className="space-y-1">
                  <p className="text-blue-600 text-base hover:underline cursor-pointer">
                    {translations[activeLanguage].metaTitle || translations[activeLanguage].title || 'სათაური'}
                  </p>
                  <p className="text-green-700 dark:text-green-600 text-xs">
                    https://yourdomain.ge/{activeLanguage}/services/{translations[activeLanguage].slug || 'slug'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {translations[activeLanguage].metaDescription || 'Meta აღწერა ჩნდება აქ...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* OG Title */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Open Graph Title ({languageLabels[activeLanguage]})
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {translations[activeLanguage].ogTitle.length}/60
                  </span>
                </label>
                <input 
                  type="text" 
                  value={translations[activeLanguage].ogTitle}
                  onChange={(e) => updateTranslation(activeLanguage, 'ogTitle', e.target.value.slice(0, 60))}
                  placeholder={translations[activeLanguage].title || 'სათაური'}
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
                    {translations[activeLanguage].ogDescription.length}/200
                  </span>
                </label>
                <textarea 
                  rows={3} 
                  value={translations[activeLanguage].ogDescription}
                  onChange={(e) => updateTranslation(activeLanguage, 'ogDescription', e.target.value.slice(0, 200))}
                  placeholder="სოციალური მედიის აღწერა..."
                  maxLength={200}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none ${
                    isDark
                      ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                ></textarea>
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  რეკომენდაცია: 150-200 სიმბოლო
                </p>
              </div>

              {/* OG Image Upload */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  OG სურათი (Social Media Share)
                </label>
                <label
                  className={`flex min-h-[120px] md:min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    isDark
                      ? 'border-white/20 bg-[#0d0d0d] hover:border-white/40 hover:bg-white/5'
                      : 'border-black/20 bg-gray-50 hover:border-black/40 hover:bg-gray-100'
                  }`}
                >
                  {ogImagePreview ? (
                    <img src={ogImagePreview} alt="OG Preview" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex flex-col items-center p-3 md:p-4 text-center">
                      <div className={`mb-2 rounded-full p-2 md:p-3 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                        <svg className={`h-5 md:h-6 w-5 md:w-6 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className={`mb-0.5 text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                        დააჭირეთ ატვირთვისთვის
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        რეკომენდირებული: 1200x630px
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleImageUpload(e, 'og')}
                    className="hidden"
                  />
                </label>
                <p className={`mt-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  ეს სურათი გამოჩნდება როცა სერვისს სოციალურ მედიაში გააზიარებენ (Facebook, Twitter, LinkedIn და ა.შ.)
                </p>
              </div>

              {/* Social Media Preview */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <p className={`mb-3 text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  📱 Social Media Preview
                </p>
                <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-white/20 bg-black' : 'border-black/20 bg-white'}`}>
                  <div className="aspect-[1.91/1] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    {ogImagePreview ? (
                      <img 
                        src={ogImagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">OG Image Preview</p>
                    )}
                  </div>
                  <div className="p-3">
                    <p className={`text-xs uppercase mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      yourdomain.ge
                    </p>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                      {translations[activeLanguage].ogTitle || translations[activeLanguage].title || 'სათაური'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {translations[activeLanguage].ogDescription || 'აღწერა'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button type="button" onClick={onBack} disabled={isLoading} className={`w-full sm:w-auto rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isLoading ? 'cursor-not-allowed opacity-50' : isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'}`}>გაუქმება</button>
            <button type="submit" onClick={() => {}} disabled={isLoading} className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${isLoading ? 'cursor-not-allowed bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /><span>მიმდინარეობს...</span></>) : 'შენახვა'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
