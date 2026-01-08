'use client'

import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Share2, 
  Clock, 
  Loader2, 
  ChevronDown,
  Save,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ============================================================================
// Lazy Loaded Components
// ============================================================================

const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center border rounded-lg bg-white/5">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  )
})

// ============================================================================
// TypeScript Interfaces
// ============================================================================

type Language = 'ka' | 'en' | 'ru'
type TabId = 'content' | 'seo' | 'social'

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
  socialHashtags: string
}

interface Practice {
  id: string
  translations: Record<Language, string>
}

interface ServiceCategory {
  id: string
  parent_id: string | null
  translations: Record<Language, string>
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
  social_hashtags: string | null
  word_count: number
  reading_time: number
}

interface ServiceWithTranslations {
  id: string
  practice_id: string
  category_id: string | null
  image_url: string
  og_image_url: string | null
  status: string
  created_at: string
  updated_at: string
  service_translations: ServiceTranslation[]
}

// ============================================================================
// Constants
// ============================================================================

const TABS = [
  { id: 'content' as TabId, label: 'Content', icon: FileText },
  { id: 'seo' as TabId, label: 'SEO', icon: Search },
  { id: 'social' as TabId, label: 'Social Media', icon: Share2 },
] as const

const LANGUAGES = [
  { id: 'ka' as Language, label: 'ქართული', flag: '🇬🇪' },
  { id: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { id: 'ru' as Language, label: 'Русский', flag: '🇷🇺' },
] as const

const EMPTY_TRANSLATION: Translation = {
  title: '',
  slug: '',
  description: '',
  imageAlt: '',
  metaTitle: '',
  metaDescription: '',
  ogTitle: '',
  ogDescription: '',
  socialHashtags: '',
}

const TRANSLITERATION_MAP: Record<string, string> = {
  // Georgian
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 
  'ქ': 'q', 'ღ': 'gh', 'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 
  'წ': 'w', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
  // Russian
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateSlug = (text: string): string => {
  let slug = text.toLowerCase().trim()
  slug = slug.split('').map(char => TRANSLITERATION_MAP[char] || char).join('')
  return slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

const calculateReadingStats = (html: string, lang: Language) => {
  const plain = html.replace(/<[^>]*>/g, ' ')
  const words = plain.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const wpm = lang === 'ka' ? 180 : lang === 'en' ? 200 : 190
  const readingTime = Math.max(1, Math.ceil(wordCount / wpm))
  return { wordCount, readingTime }
}

// ============================================================================
// Memoized Components
// ============================================================================

const TabButton = memo(({ 
  tab, 
  isActive, 
  onClick, 
  disabled, 
  isDark 
}: { 
  tab: typeof TABS[number]
  isActive: boolean
  onClick: () => void
  disabled: boolean
  isDark: boolean
}) => {
  const Icon = tab.icon
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-3 py-2 text-xs font-medium 
        transition-all relative disabled:opacity-50 disabled:cursor-not-allowed
        ${isActive
          ? isDark ? 'text-emerald-400' : 'text-emerald-600'
          : isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
        }
      `}
      aria-label={`Switch to ${tab.label} tab`}
      aria-selected={isActive}
      role="tab"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {tab.label}
      {isActive && (
        <div 
          className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
})
TabButton.displayName = 'TabButton'

const LanguageButton = memo(({ 
  language, 
  isActive, 
  onClick, 
  disabled, 
  isDark 
}: { 
  language: typeof LANGUAGES[number]
  isActive: boolean
  onClick: () => void
  disabled: boolean
  isDark: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-1.5 rounded-lg text-xs font-medium 
      transition-all disabled:opacity-50 disabled:cursor-not-allowed
      ${isActive
        ? isDark
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
        : isDark
          ? 'bg-white/10 text-white/60 hover:bg-white/20 border border-transparent'
          : 'bg-black/10 text-black/60 hover:bg-black/20 border border-transparent'
      }
    `}
    aria-label={`Switch to ${language.label} language`}
    aria-pressed={isActive}
  >
    <span className="mr-1" aria-hidden="true">{language.flag}</span>
    {language.label}
  </button>
))
LanguageButton.displayName = 'LanguageButton'

const PracticeDropdownItem = memo(({
  practice,
  isSelected,
  onClick,
  isDark,
  activeLanguage
}: {
  practice: Practice
  isSelected: boolean
  onClick: () => void
  isDark: boolean
  activeLanguage: Language
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
      isSelected
        ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
        : isDark ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'
    }`}
  >
    {practice.translations[activeLanguage]}
  </button>
))
PracticeDropdownItem.displayName = 'PracticeDropdownItem'

const CategoryDropdownItem = memo(({
  category,
  isSelected,
  onClick,
  isDark,
  activeLanguage,
  level = 0
}: {
  category: ServiceCategory
  isSelected: boolean
  onClick: () => void
  isDark: boolean
  activeLanguage: Language
  level?: number
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
      isSelected
        ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
        : isDark ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'
    }`}
    style={{ paddingLeft: `${12 + level * 16}px` }}
  >
    {level > 0 && <span className="mr-1 opacity-50">└</span>}
    {category.translations[activeLanguage]}
  </button>
))
CategoryDropdownItem.displayName = 'CategoryDropdownItem'

// ============================================================================
// Image Upload Component
// ============================================================================

const ImageUploader = memo(({
  preview,
  onUpload,
  type,
  isDark,
  label,
  hint,
  required = false
}: {
  preview: string
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  type: 'service' | 'og'
  isDark: boolean
  label: string
  hint: string
  required?: boolean
}) => (
  <div>
    <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <label
      className={`flex h-32 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
        isDark
          ? 'border-white/20 bg-[#0d0d0d] hover:border-white/40 hover:bg-white/5'
          : 'border-black/20 bg-gray-50 hover:border-black/40 hover:bg-gray-100'
      }`}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="h-full w-full rounded-lg object-cover" />
      ) : (
        <div className="flex flex-col items-center p-2 text-center">
          <div className={`mb-1.5 rounded-full p-1.5 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
            <svg className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className={`mb-0.5 text-[10px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            ატვირთვა
          </p>
          <p className={`text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>{hint}</p>
        </div>
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onUpload}
        className="hidden"
      />
    </label>
  </div>
))
ImageUploader.displayName = 'ImageUploader'

// ============================================================================
// Main Component
// ============================================================================

export default function ServiceAdd({ onBack, editData }: ServiceAddProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  const isEditMode = !!editData

  // ============================================================================
  // State
  // ============================================================================

  const [activeLanguage, setActiveLanguage] = useState<Language>('ka')
  const [activeTab, setActiveTab] = useState<TabId>('content')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [practices, setPractices] = useState<Practice[]>([])
  const [practicesLoading, setPracticesLoading] = useState(true)
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null)
  const [isPracticeDropdownOpen, setIsPracticeDropdownOpen] = useState(false)

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  const [translations, setTranslations] = useState<Record<Language, Translation>>({
    ka: { ...EMPTY_TRANSLATION },
    en: { ...EMPTY_TRANSLATION },
    ru: { ...EMPTY_TRANSLATION },
  })

  const [serviceImage, setServiceImage] = useState<File | null>(null)
  const [serviceImagePreview, setServiceImagePreview] = useState<string>('')
  const [ogImage, setOgImage] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string>('')
  
  const [isSlugEditable, setIsSlugEditable] = useState<Record<Language, boolean>>({
    ka: false, en: false, ru: false
  })

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const readingStats = useMemo(() => {
    return calculateReadingStats(translations[activeLanguage].description, activeLanguage)
  }, [translations, activeLanguage])

  const selectedPractice = useMemo(() => {
    return practices.find(p => p.id === selectedPracticeId)
  }, [practices, selectedPracticeId])

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId)
  }, [categories, selectedCategoryId])

  // Build hierarchical category list for dropdown
  const sortedCategories = useMemo(() => {
    const result: Array<{ category: ServiceCategory; level: number }> = []
    const parentCategories = categories.filter(c => !c.parent_id)
    
    const addWithChildren = (category: ServiceCategory, level: number) => {
      result.push({ category, level })
      const children = categories.filter(c => c.parent_id === category.id)
      children.forEach(child => addWithChildren(child, level + 1))
    }
    
    parentCategories.forEach(cat => addWithChildren(cat, 0))
    return result
  }, [categories])

  const currentTranslation = translations[activeLanguage]

  // ============================================================================
  // Effects
  // ============================================================================

  // Populate edit data
  useEffect(() => {
    if (!editData) return

    setSelectedPracticeId(editData.practice_id)
    setSelectedCategoryId(editData.category_id)
    if (editData.image_url) setServiceImagePreview(editData.image_url)
    if (editData.og_image_url) setOgImagePreview(editData.og_image_url)

    const populated: Record<Language, Translation> = {
      ka: { ...EMPTY_TRANSLATION },
      en: { ...EMPTY_TRANSLATION },
      ru: { ...EMPTY_TRANSLATION },
    }

    editData.service_translations.forEach((trans) => {
      const lang = trans.language as Language
      populated[lang] = {
        title: trans.title || '',
        slug: trans.slug || '',
        description: trans.description || '',
        imageAlt: trans.image_alt || '',
        metaTitle: trans.meta_title || '',
        metaDescription: trans.meta_description || '',
        ogTitle: trans.og_title || '',
        ogDescription: trans.og_description || '',
        socialHashtags: trans.social_hashtags || '',
      }
    })

    setTranslations(populated)
  }, [editData])

  // Fetch practices
  useEffect(() => {
    const fetchPractices = async () => {
      setPracticesLoading(true)
      try {
        const { data: practicesData } = await supabase
          .from('practices')
          .select('id')
          .order('created_at', { ascending: false })

        if (!practicesData) return

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

            translationsData?.forEach((trans: { language: string; title: string }) => {
              translationsMap[trans.language as Language] = trans.title
            })

            return { id: practice.id, translations: translationsMap }
          })
        )

        setPractices(practicesWithTitles)
      } catch {
        // Silently handle error
      } finally {
        setPracticesLoading(false)
      }
    }

    fetchPractices()
  }, [supabase])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const { data: categoriesData } = await supabase
          .from('service_categories')
          .select('id, parent_id')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (!categoriesData) return

        const categoriesWithTitles = await Promise.all(
          categoriesData.map(async (category) => {
            const { data: translationsData } = await supabase
              .from('service_category_translations')
              .select('language, name')
              .eq('category_id', category.id)

            const translationsMap: Record<Language, string> = {
              ka: 'უსახელო კატეგორია',
              en: 'Untitled Category',
              ru: 'Категория без названия'
            }

            translationsData?.forEach((trans: { language: string; name: string }) => {
              translationsMap[trans.language as Language] = trans.name
            })

            return { id: category.id, parent_id: category.parent_id, translations: translationsMap }
          })
        )

        setCategories(categoriesWithTitles)
      } catch {
        // Silently handle error
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + S = Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (!isLoading) {
        document.getElementById('service-form')?.dispatchEvent(
          new Event('submit', { cancelable: true, bubbles: true })
        )
      }
    }
    
    // Esc = Cancel
    if (e.key === 'Escape' && !isLoading) {
      e.preventDefault()
      onBack()
    }
  }, [isLoading, onBack])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isLoading])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-practice-dropdown]')) {
        setIsPracticeDropdownOpen(false)
      }
      if (!target.closest('[data-category-dropdown]')) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ============================================================================
  // Handlers
  // ============================================================================

  const updateTranslation = useCallback((lang: Language, field: keyof Translation, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value }
    }))
  }, [])

  const handleTitleChange = useCallback((value: string) => {
    if (!isSlugEditable[activeLanguage]) {
      const newSlug = generateSlug(value)
      setTranslations(prev => ({
        ...prev,
        [activeLanguage]: { ...prev[activeLanguage], title: value, slug: newSlug }
      }))
    } else {
      updateTranslation(activeLanguage, 'title', value)
    }
  }, [activeLanguage, isSlugEditable, updateTranslation])

  const handleAutoGenerateSlug = useCallback(() => {
    if (!currentTranslation.title) {
      setError('ჯერ შეიყვანეთ სათაური!')
      return
    }
    const baseSlug = generateSlug(currentTranslation.title)
    const langSuffix = `-${activeLanguage}`
    updateTranslation(activeLanguage, 'slug', baseSlug + langSuffix)
  }, [activeLanguage, currentTranslation.title, updateTranslation])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'service' | 'og') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      setError('სურათის ზომა არ უნდა აღემატებოდეს 8MB-ს')
      return
    }

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
  }, [])

  const uploadImageToStorage = async (file: File, type: 'service-images' | 'og-images'): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${type}/${fileName}`

    const { error } = await supabase.storage
      .from('services')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (error) throw new Error(`Image upload failed: ${error.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('services')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validation
    if (!translations.ka.title || !translations.ka.slug || !translations.ka.description) {
      setError('ქართული თარგმანი სავალდებულოა (სათაური, slug, აღწერა)')
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
      // Check slug uniqueness for all languages BEFORE saving
      const slugsToCheck = (Object.keys(translations) as Language[])
        .filter(lang => translations[lang].slug) // Only check non-empty slugs
        .filter(lang => translations[lang].slug) // Only check non-empty slugs
        .map(lang => ({ lang, slug: translations[lang].slug }))

      for (const { lang, slug } of slugsToCheck) {
        // Build query to check for existing slug
        let query = supabase
          .from('service_translations')
          .select('id, service_id')
          .eq('slug', slug)
          .eq('language', lang)

        // In edit mode, exclude current service's translations
        if (isEditMode && editData) {
          query = query.neq('service_id', editData.id)
        }

        const { data: existingSlug } = await query.maybeSingle()

        // If slug exists on a DIFFERENT service
        if (existingSlug) {
          const langLabel = lang === 'ka' ? 'ქართულ' : lang === 'en' ? 'ინგლისურ' : 'რუსულ'
          setError(`Slug "${slug}" უკვე არსებობს ${langLabel} ენაზე სხვა სერვისში. გთხოვთ შეცვალოთ.`)
          setIsLoading(false)
          return
        }
      }

      await supabase.auth.refreshSession()

      let imageUrl = serviceImagePreview
      let ogImageUrl = ogImagePreview

      if (serviceImage) {
        imageUrl = await uploadImageToStorage(serviceImage, 'service-images')
      }
      if (ogImage) {
        ogImageUrl = await uploadImageToStorage(ogImage, 'og-images')
      }

      let serviceId: string

      if (isEditMode && editData) {
        const { error: serviceError } = await supabase
          .from('services')
          .update({
            practice_id: selectedPracticeId,
            category_id: selectedCategoryId,
            image_url: imageUrl,
            og_image_url: ogImageUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editData.id)

        if (serviceError) throw new Error(`Failed to update service: ${serviceError.message}`)

        serviceId = editData.id
        // Note: We'll delete only specific language translations later, not all
      } else {
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .insert({ 
            practice_id: selectedPracticeId,
            category_id: selectedCategoryId,
            image_url: imageUrl,
            og_image_url: ogImageUrl || null,
            status: 'draft'
          })
          .select()
          .single()

        if (serviceError) throw new Error(`Failed to create service: ${serviceError.message}`)

        serviceId = service.id
      }

      // Insert translations with unique slug check
      // ONLY insert translations that have at least title and slug filled
      const uniqueSuffix = isEditMode ? '' : `-${Date.now().toString(36)}`
      
      const toInsert = (Object.keys(translations) as Language[])
        .filter((lang) => {
          // Only include languages that have required fields filled
          const t = translations[lang]
          return t.title && t.slug
        })
        .map((lang) => {
          const { wordCount, readingTime } = calculateReadingStats(translations[lang].description, lang)
          
          // Add unique suffix to slug for new services to avoid duplicates
          let finalSlug = translations[lang].slug
          if (!isEditMode && finalSlug) {
            finalSlug = `${finalSlug}${uniqueSuffix}`
          }

          return {
            service_id: serviceId,
            language: lang,
            title: translations[lang].title,
            slug: finalSlug,
            description: translations[lang].description,
            image_alt: translations[lang].imageAlt,
            meta_title: translations[lang].metaTitle || translations[lang].title,
            meta_description: translations[lang].metaDescription || translations[lang].description.replace(/<[^>]*>/g, '').substring(0, 160),
            og_title: translations[lang].ogTitle || translations[lang].metaTitle || translations[lang].title,
            og_description: translations[lang].ogDescription || translations[lang].metaDescription || translations[lang].description.replace(/<[^>]*>/g, '').substring(0, 160),
            social_hashtags: translations[lang].socialHashtags || null,
            word_count: wordCount,
            reading_time: readingTime,
          }
        })

      // Check if we have at least one translation to insert
      if (toInsert.length === 0) {
        throw new Error('მინიმუმ ერთი ენის თარგმანი სავალდებულოა (სათაური და slug)')
      }

      // In edit mode, only delete translations for languages we're about to insert
      // This preserves translations for languages we didn't edit
      if (isEditMode) {
        const langsToUpdate = toInsert.map(t => t.language)
        await supabase
          .from('service_translations')
          .delete()
          .eq('service_id', serviceId)
          .in('language', langsToUpdate)
      }

      const { error: insertError, data: insertedData } = await supabase
        .from('service_translations')
        .insert(toInsert)
        .select()

      if (insertError) {
        // If translations failed and this is a new service, clean up the service record
        if (!isEditMode) {
          await supabase.from('services').delete().eq('id', serviceId)
        }
        throw new Error(`Translations creation failed: ${insertError.message}`)
      }

      setSuccessMessage(`სერვისი წარმატებით ${isEditMode ? 'განახლდა' : 'შეიქმნა'}!`)
      setTimeout(() => onBack(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'დაფიქსირდა შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="pb-6" role="main" aria-label={isEditMode ? 'სერვისის რედაქტირება' : 'ახალი სერვისი'}>
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            disabled={isLoading}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
            aria-label="უკან დაბრუნება (Esc)"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            უკან
          </button>
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {isEditMode ? 'სერვისის რედაქტირება' : 'ახალი სერვისი'}
          </h1>
        </div>
        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          შეავსეთ სერვისი ყველა ენაზე • <span className="text-[10px] opacity-70">Ctrl+S შენახვა • Esc გაუქმება</span>
        </p>
      </header>

      {/* Messages */}
      {error && (
        <div className={`mb-4 rounded-lg border p-3 flex items-start gap-2 ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/30 bg-red-50 text-red-700'}`}>
          <div className="flex-1 text-xs">{error}</div>
          <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className={`mb-4 rounded-lg border p-3 ${isDark ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-emerald-500/30 bg-emerald-50 text-emerald-700'}`}>
          <p className="text-xs">{successMessage}</p>
        </div>
      )}

      {/* Main Card */}
      <div className={`rounded-xl border p-4 transition-colors ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        
        {/* Tab Navigation */}
        <nav className={`flex gap-4 mb-4 border-b pb-0 ${isDark ? 'border-white/10' : 'border-black/10'}`} role="tablist">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={isLoading}
              isDark={isDark}
            />
          ))}
        </nav>

        {/* Language Selector */}
        <div className="mb-4">
          <label className={`block text-[10px] font-medium uppercase tracking-wide mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            🌐 ენის არჩევა
          </label>
          <div className="flex gap-1.5" role="tablist">
            {LANGUAGES.map((lang) => (
              <LanguageButton
                key={lang.id}
                language={lang}
                isActive={activeLanguage === lang.id}
                onClick={() => setActiveLanguage(lang.id)}
                disabled={isLoading}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <form id="service-form" onSubmit={handleSubmit}>
          
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Practice Selector */}
              <div data-practice-dropdown>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  აირჩიეთ პრაქტიკა <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPracticeDropdownOpen(!isPracticeDropdownOpen)}
                    disabled={practicesLoading}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs outline-none transition-colors disabled:opacity-50 ${
                      isDark 
                        ? 'border-white/10 bg-[#0d0d0d] text-white hover:border-white/20' 
                        : 'border-black/10 bg-white text-black hover:border-black/20'
                    }`}
                  >
                    <span className={selectedPractice ? '' : 'opacity-50'}>
                      {practicesLoading ? 'იტვირთება...' : selectedPractice ? selectedPractice.translations[activeLanguage] : 'აირჩიეთ პრაქტიკა'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isPracticeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPracticeDropdownOpen && (
                    <div className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                      isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-black/10 bg-white'
                    }`}>
                      {practices.length === 0 ? (
                        <div className={`px-3 py-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          პრაქტიკები არ მოიძებნა
                        </div>
                      ) : (
                        practices.map((practice) => (
                          <PracticeDropdownItem
                            key={practice.id}
                            practice={practice}
                            isSelected={selectedPracticeId === practice.id}
                            onClick={() => {
                              setSelectedPracticeId(practice.id)
                              setIsPracticeDropdownOpen(false)
                            }}
                            isDark={isDark}
                            activeLanguage={activeLanguage}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Category Selector */}
              <div data-category-dropdown>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  აირჩიეთ კატეგორია <span className={`${isDark ? 'text-white/40' : 'text-black/40'}`}>(არასავალდებულო)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    disabled={categoriesLoading}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs outline-none transition-colors disabled:opacity-50 ${
                      isDark 
                        ? 'border-white/10 bg-[#0d0d0d] text-white hover:border-white/20' 
                        : 'border-black/10 bg-white text-black hover:border-black/20'
                    }`}
                  >
                    <span className={selectedCategory ? '' : 'opacity-50'}>
                      {categoriesLoading ? 'იტვირთება...' : selectedCategory ? selectedCategory.translations[activeLanguage] : 'აირჩიეთ კატეგორია'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                      isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-black/10 bg-white'
                    }`}>
                      {/* Clear selection option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(null)
                          setIsCategoryDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                          !selectedCategoryId
                            ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            : isDark ? 'text-white/60 hover:bg-white/5' : 'text-black/60 hover:bg-black/5'
                        }`}
                      >
                        — კატეგორიის გარეშე —
                      </button>
                      {sortedCategories.length === 0 ? (
                        <div className={`px-3 py-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          კატეგორიები არ მოიძებნა
                        </div>
                      ) : (
                        sortedCategories.map(({ category, level }) => (
                          <CategoryDropdownItem
                            key={category.id}
                            category={category}
                            isSelected={selectedCategoryId === category.id}
                            onClick={() => {
                              setSelectedCategoryId(category.id)
                              setIsCategoryDropdownOpen(false)
                            }}
                            isDark={isDark}
                            activeLanguage={activeLanguage}
                            level={level}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  სათაური ({LANGUAGES.find(l => l.id === activeLanguage)?.label}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentTranslation.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="მაგ: სერვისი"
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
                    isDark ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Slug */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoGenerateSlug}
                      className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                        isDark
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                          : 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border border-emerald-500/30'
                      }`}
                    >
                      🔄 ავტო
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSlugEditable(prev => ({ ...prev, [activeLanguage]: !prev[activeLanguage] }))}
                      className={`text-[10px] font-medium transition-colors ${
                        isSlugEditable[activeLanguage]
                          ? 'text-emerald-500'
                          : isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
                      }`}
                    >
                      {isSlugEditable[activeLanguage] ? '🔒 ჩაკეტვა' : '✏️ რედაქტირება'}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={currentTranslation.slug}
                  onChange={(e) => updateTranslation(activeLanguage, 'slug', generateSlug(e.target.value))}
                  placeholder="example-slug"
                  readOnly={!isSlugEditable[activeLanguage]}
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
                    isSlugEditable[activeLanguage]
                      ? isDark ? 'border-white/10 bg-[#0d0d0d] text-white focus:border-emerald-500' : 'border-black/10 bg-white text-black focus:border-emerald-500'
                      : isDark ? 'border-white/5 bg-white/5 text-white/60 cursor-not-allowed' : 'border-black/5 bg-black/5 text-black/60 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                    აღწერა <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-3 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    <span>სიტყვები: <span className="text-emerald-500 font-semibold">{readingStats.wordCount}</span></span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-emerald-500 font-semibold">{readingStats.readingTime} წთ</span>
                    </span>
                  </div>
                </div>
                <RichTextEditor
                  content={currentTranslation.description}
                  onChange={(html) => updateTranslation(activeLanguage, 'description', html)}
                />
              </div>

              {/* Image Alt */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  სურათის Alt Text
                </label>
                <input
                  type="text"
                  value={currentTranslation.imageAlt}
                  onChange={(e) => updateTranslation(activeLanguage, 'imageAlt', e.target.value)}
                  placeholder="სურათის აღწერა..."
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
                    isDark ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Service Image */}
              <ImageUploader
                preview={serviceImagePreview}
                onUpload={(e) => handleImageUpload(e, 'service')}
                type="service"
                isDark={isDark}
                label="სერვისის სურათი"
                hint="PNG, JPG, WebP max 8MB"
                required={!isEditMode}
              />
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Meta Title
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.metaTitle.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  value={currentTranslation.metaTitle}
                  onChange={(e) => updateTranslation(activeLanguage, 'metaTitle', e.target.value.slice(0, 60))}
                  placeholder={currentTranslation.title || 'Meta Title'}
                  maxLength={60}
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
                    isDark ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Meta Description
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.metaDescription.length}/160
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={currentTranslation.metaDescription}
                  onChange={(e) => updateTranslation(activeLanguage, 'metaDescription', e.target.value.slice(0, 160))}
                  placeholder="Meta აღწერა..."
                  maxLength={160}
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors resize-none ${
                    isDark ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Google Preview */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <p className={`mb-2 text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  🔍 Google Preview
                </p>
                <div className="space-y-1">
                  <p className="text-blue-600 text-sm hover:underline cursor-pointer truncate">
                    {currentTranslation.metaTitle || currentTranslation.title || 'სათაური'}
                  </p>
                  <p className="text-green-700 dark:text-green-600 text-[10px] truncate">
                    https://yourdomain.ge/{activeLanguage}/services/{currentTranslation.slug || 'slug'}
                  </p>
                  <p className={`text-xs line-clamp-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {currentTranslation.metaDescription || 'Meta აღწერა ჩნდება აქ...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  OG Title
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.ogTitle.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  value={currentTranslation.ogTitle}
                  onChange={(e) => updateTranslation(activeLanguage, 'ogTitle', e.target.value.slice(0, 60))}
                  placeholder={currentTranslation.title || 'OG სათაური'}
                  maxLength={60}
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
                    isDark ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  OG Description
                  <span className={`ml-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {currentTranslation.ogDescription.length}/200
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={currentTranslation.ogDescription}
                  onChange={(e) => updateTranslation(activeLanguage, 'ogDescription', e.target.value.slice(0, 200))}
                  placeholder="სოციალური მედიის აღწერა..."
                  maxLength={200}
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors resize-none ${
                    isDark ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  Hashtags
                </label>
                <input
                  type="text"
                  value={currentTranslation.socialHashtags}
                  onChange={(e) => updateTranslation(activeLanguage, 'socialHashtags', e.target.value)}
                  placeholder="#სამართალი #იურიდიული #კონსულტაცია"
                  className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
                    isDark ? 'border-white/10 bg-[#0d0d0d] text-white placeholder:text-white/40 focus:border-emerald-500' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* OG Image */}
              <ImageUploader
                preview={ogImagePreview}
                onUpload={(e) => handleImageUpload(e, 'og')}
                type="og"
                isDark={isDark}
                label="OG სურათი"
                hint="რეკომენდირებული: 1200x630px"
              />

              {/* Social Preview */}
              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <p className={`mb-3 text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  📱 Social Media Preview
                </p>
                <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-white/20 bg-black' : 'border-black/20 bg-white'}`}>
                  <div className="aspect-[1.91/1] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    {ogImagePreview ? (
                      <img src={ogImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <p className="text-xs text-gray-500">OG Image Preview</p>
                    )}
                  </div>
                  <div className="p-3">
                    <p className={`text-[10px] uppercase mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      yourdomain.ge
                    </p>
                    <p className={`text-xs font-semibold mb-1 truncate ${isDark ? 'text-white' : 'text-black'}`}>
                      {currentTranslation.ogTitle || currentTranslation.title || 'სათაური'}
                    </p>
                    <p className={`text-[10px] line-clamp-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {currentTranslation.ogDescription || 'აღწერა'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <footer className={`flex gap-2 pt-4 mt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg px-4 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              შენახვა {!isLoading && <span className="text-[10px] opacity-70">(Ctrl+S)</span>}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              გაუქმება {!isLoading && <span className="text-[10px] opacity-70">(Esc)</span>}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
