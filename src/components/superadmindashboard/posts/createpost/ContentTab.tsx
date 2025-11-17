'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { usePostTranslations } from '@/contexts/PostTranslationsContext'
import { ChevronRight, Check, Upload, X } from 'lucide-react'
import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/common/Modal'

// Lazy load RichTextEditor for better performance
const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-xs text-white/60">
      Editor იტვირთება...
    </div>
  )
})

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Category {
  id: string
  parent_id: string | null
  georgian: string
  english: string
  russian: string
  subcategories: Category[]
}

interface CategoryTranslation {
  language: string
  name: string
  slug?: string
  description?: string
}

interface CategoryData {
  id: string
  parent_id: string | null
  post_category_translations: CategoryTranslation[]
}

// ============================================================================
// Memoized Components
// ============================================================================

const CategoryItem = memo(({ 
  category, 
  level = 0,
  isExpanded,
  isSelected,
  isDark,
  expandedCategories,
  onToggle,
  onSelect
}: {
  category: Category
  level?: number
  isExpanded: boolean
  isSelected: boolean
  isDark: boolean
  expandedCategories: string[]
  onToggle: (id: string) => void
  onSelect: (category: Category) => void
}) => {
  const hasSubcategories = category.subcategories.length > 0

  return (
    <div className="space-y-0.5">
      <div 
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer ${
          isSelected
            ? isDark
              ? 'bg-emerald-500/20 border border-emerald-500/30'
              : 'bg-emerald-500/10 border border-emerald-500/20'
            : isDark
            ? 'hover:bg-white/5 border border-transparent'
            : 'hover:bg-black/5 border border-transparent'
        }`}
        style={{ marginLeft: `${level * 12}px` }}
        onClick={() => onSelect(category)}
        role="button"
        tabIndex={0}
        aria-label={`Select category ${category.georgian}`}
      >
        {hasSubcategories ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(category.id)
            }}
            className={`p-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            aria-label={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
          >
            <ChevronRight className={`h-3 w-3 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          </button>
        ) : (
          <div className="w-3" aria-hidden="true" />
        )}
        
        <span className={`text-xs flex-1 ${
          isSelected
            ? isDark
              ? 'text-emerald-400 font-medium'
              : 'text-emerald-600 font-medium'
            : isDark
            ? 'text-white/80'
            : 'text-black/80'
        }`}>
          {category.georgian}
        </span>
        
        {isSelected && (
          <Check className={`h-3.5 w-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} aria-hidden="true" />
        )}
      </div>

      {isExpanded && hasSubcategories && (
        <div className="space-y-0.5">
          {category.subcategories.map(sub => (
            <CategoryItem
              key={sub.id}
              category={sub}
              level={level + 1}
              isExpanded={expandedCategories.includes(sub.id)}
              isSelected={isSelected}
              isDark={isDark}
              expandedCategories={expandedCategories}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
})
CategoryItem.displayName = 'CategoryItem'

// ============================================================================
// Main Component
// ============================================================================

export default function ContentTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { 
    translations, 
    activeLanguage, 
    updateField, 
    updateAllLanguages, 
    displayPosition, 
    positionOrder, 
    setDisplayPosition, 
    setPositionOrder, 
    setCategoryId 
  } = usePostTranslations()
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null)
  
  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  })

  const currentTranslation = translations[activeLanguage]

  // ============================================================================
  // Effects
  // ============================================================================

  // Load featured image preview from translation data
  useEffect(() => {
    if (currentTranslation.featured_image && !featuredImagePreview) {
      setFeaturedImagePreview(currentTranslation.featured_image)
    }
  }, [currentTranslation.featured_image, featuredImagePreview])

  // Load categories from Supabase
  useEffect(() => {
    loadCategories()
  }, [])

  // Load selected category from context when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && currentTranslation.category_id) {
      const found = findCategory(categories, currentTranslation.category_id)
      if (found && found.id !== selectedCategory?.id) {
        setSelectedCategory(found)
      }
    } else if (!currentTranslation.category_id && selectedCategory) {
      setSelectedCategory(null)
    }
  }, [categories, currentTranslation.category_id])

  // ============================================================================
  // Memoized Values
  // ============================================================================

  // Reading stats (word count + reading time) for current language
  const readingStats = useMemo(() => {
    const content = currentTranslation.content || ''
    const plain = content.replace(/<[^>]*>/g, ' ')
    const words = plain.trim().split(/\s+/).filter(Boolean)
    const wordCount = words.length
    const wpm = activeLanguage === 'georgian' ? 180 : activeLanguage === 'english' ? 200 : 190
    const readingTime = Math.ceil(wordCount / wpm)
    return { wordCount, readingTime }
  }, [currentTranslation.content, activeLanguage])

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const findCategory = useCallback((cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.subcategories.length > 0) {
        const found = findCategory(cat.subcategories, id)
        if (found) return found
      }
    }
    return null
  }, [])

  const loadCategories = async () => {
    const supabase = createClient()
    setLoadingCategories(true)

    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('post_categories')
        .select(`
          id,
          parent_id,
          post_category_translations (
            language,
            name,
            slug,
            description
          )
        `)
        .order('created_at', { ascending: true })

      if (categoriesError) throw categoriesError

      // Transform data to nested structure
      const categoryMap = new Map<string, Category>()
      
      categoriesData?.forEach((cat: CategoryData) => {
        const ka = cat.post_category_translations.find((t) => t.language === 'ka')
        const en = cat.post_category_translations.find((t) => t.language === 'en')
        const ru = cat.post_category_translations.find((t) => t.language === 'ru')

        categoryMap.set(cat.id, {
          id: cat.id,
          parent_id: cat.parent_id,
          georgian: ka?.name || '',
          english: en?.name || '',
          russian: ru?.name || '',
          subcategories: []
        })
      })

      // Build tree structure
      const rootCategories: Category[] = []
      categoryMap.forEach((category) => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id)
          if (parent) {
            parent.subcategories.push(category)
          }
        } else {
          rootCategories.push(category)
        }
      })

      setCategories(rootCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const generateSlug = useCallback((text: string): string => {
    const translitMap: { [key: string]: string } = {
      // Georgian
      'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'w', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
      // Russian
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    }

    let slug = text.toLowerCase().trim()
    
    // Transliterate character by character
    slug = slug.split('').map(char => translitMap[char] || char).join('')

    return slug
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-latin, non-numeric, non-space, non-hyphen characters
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/--+/g, '-')           // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start
      .replace(/-+$/, '')            // Trim - from end
  }, [])

  // ============================================================================
  // Event Handlers (useCallback for performance)
  // ============================================================================

  const handleTitleChange = useCallback((value: string) => {
    updateField('title', value)
    // Auto-generate slug only if slug is empty
    if (!currentTranslation.slug && value) {
      const baseSlug = generateSlug(value)
      const langSuffix = activeLanguage === 'georgian' ? '-ka' : activeLanguage === 'english' ? '-en' : '-ru'
      const generatedSlug = baseSlug + langSuffix
      updateField('slug', generatedSlug)
    }
  }, [currentTranslation.slug, activeLanguage, updateField, generateSlug])

  const handleSlugChange = useCallback((value: string) => {
    const sanitizedSlug = generateSlug(value)
    updateField('slug', sanitizedSlug)
  }, [updateField, generateSlug])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        message: 'სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს'
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFeaturedImagePreview(reader.result as string)
      updateField('featured_image', reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [updateField])

  const removeImage = useCallback(() => {
    setFeaturedImagePreview(null)
    updateField('featured_image', '')
  }, [updateField])

  const toggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  const handleSelectCategory = useCallback((category: Category) => {
    setSelectedCategory(category)
    setIsDropdownOpen(false)
    
    // Update category for ALL languages simultaneously
    updateAllLanguages('category', {
      georgian: category.georgian,
      english: category.english,
      russian: category.russian
    })
    
    // Update category_id in main posts table
    setCategoryId(category.id)
    
    // Also update category_id for each translation (for backward compatibility)
    updateAllLanguages('category_id', {
      georgian: category.id,
      english: category.id,
      russian: category.id
    })
  }, [updateAllLanguages, setCategoryId])

  const handleClearCategory = useCallback(() => {
    setSelectedCategory(null)
    setCategoryId(null)
    updateAllLanguages('category_id', { georgian: '', english: '', russian: '' })
    updateAllLanguages('category', { georgian: '', english: '', russian: '' })
  }, [setCategoryId, updateAllLanguages])

  const handleGenerateSlug = useCallback(() => {
    if (!currentTranslation.title) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        message: 'ჯერ შეიყვანეთ სათაური!'
      })
      return
    }
    const baseSlug = generateSlug(currentTranslation.title)
    const langSuffix = activeLanguage === 'georgian' ? '-ka' : activeLanguage === 'english' ? '-en' : '-ru'
    const generatedSlug = baseSlug + langSuffix
    updateField('slug', generatedSlug)
  }, [currentTranslation.title, activeLanguage, updateField, generateSlug])

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-3">
      {/* NewsPage Position Selector */}
      <div className="space-y-1.5">
        <label htmlFor="display-position" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          NewsPage პოზიცია
        </label>
        <select
          id="display-position"
          value={displayPosition || ''}
          onChange={(e) => setDisplayPosition(e.target.value ? parseInt(e.target.value) : null)}
          className={`appearance-none w-full px-3 py-2 pr-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isDark
              ? 'bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20'
              : 'bg-black/5 border border-black/10 text-black/90 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-black/20'
          }`}
          style={isDark ? { 
            colorScheme: 'dark',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center'
          } : {
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(0,0,0,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center'
          }}
          aria-label="Select NewsPage display position"
        >
          <option value="" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>
            AllPostsSection (არ არის Featured)
          </option>
          <optgroup label="Single Positions" style={isDark ? { backgroundColor: '#18181b', color: 'rgba(255,255,255,0.6)' } : { backgroundColor: 'white', color: 'rgba(0,0,0,0.6)' }}>
            <option value="1" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 1 - Hero Slider (Left, Main)</option>
            <option value="2" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 2 - Vertical News Feed</option>
            <option value="4" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 4 - Stats Card</option>
            <option value="6" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 6 - Category Card</option>
            <option value="7" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 7 - Quick Link</option>
          </optgroup>
          <optgroup label="Slider Positions (Multiple Posts)" style={isDark ? { backgroundColor: '#18181b', color: 'rgba(255,255,255,0.6)' } : { backgroundColor: 'white', color: 'rgba(0,0,0,0.6)' }}>
            <option value="3" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 3 - Main Feature Slider (Center)</option>
            <option value="5" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 5 - News Ticker (Right)</option>
            <option value="9" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 9 - Horizontal Carousel</option>
            <option value="10" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 10 - Featured Topics (3D)</option>
          </optgroup>
        </select>
        
        {/* Position Order (for slider positions only) */}
        {displayPosition && [3, 5, 9, 10].includes(displayPosition) && (
          <div className={`mt-1.5 p-2 rounded-lg ${
            isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/5 border border-emerald-500/10'
          }`}>
            <label htmlFor="position-order" className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              რიგითობა Slider-ში
            </label>
            <input
              id="position-order"
              type="number"
              min="0"
              value={positionOrder}
              onChange={(e) => setPositionOrder(parseInt(e.target.value) || 0)}
              className={`w-16 px-2 py-1 rounded-md text-xs ${
                isDark
                  ? 'bg-white/10 border border-white/20 text-white'
                  : 'bg-white border border-black/10 text-black'
              }`}
              aria-label="Slider position order"
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              0 = პირველი, 1 = მეორე, 2 = მესამე და ა.შ.
            </p>
          </div>
        )}
        
        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {displayPosition 
            ? `პოსტი გამოჩნდება NewsPage-ის ${displayPosition} პოზიციაზე ${[3,5,9,10].includes(displayPosition) ? '(Slider)' : ''}`
            : 'პოსტი გამოჩნდება "ყველა პოსტი" სექციაში (AllPostsSection)'}
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-1.5">
        <label className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          აირჩიე კატეგორია
        </label>

        {/* Current Category Info Box */}
        {(currentTranslation.category_id || currentTranslation.category) && (
          <div className={`p-2 rounded-lg border ${
            isDark 
              ? 'bg-blue-500/10 border-blue-500/20' 
              : 'bg-blue-500/5 border-blue-500/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  📌 მიმდინარე კატეგორია:
                </div>
                <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  {selectedCategory ? (
                    <>
                      🇬🇪 {selectedCategory.georgian}
                      <br />
                      🇬🇧 {selectedCategory.english}
                      <br />
                      🇷🇺 {selectedCategory.russian}
                    </>
                  ) : (
                    currentTranslation.category || 'იტვირთება...'
                  )}
                </div>
                {currentTranslation.category_id && (
                  <div className={`text-xs font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    ID: {currentTranslation.category_id}
                  </div>
                )}
              </div>
              <button
                onClick={handleClearCategory}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  isDark
                    ? 'hover:bg-white/10 text-white/60'
                    : 'hover:bg-black/10 text-black/60'
                }`}
                aria-label="Clear category selection"
              >
                წაშლა
              </button>
            </div>
          </div>
        )}
        
        {/* Selected Category Display or Select Button */}
        {selectedCategory ? (
          <div className={`p-3 rounded-md ${
            isDark 
              ? 'bg-emerald-500/10 border border-emerald-500/20' 
              : 'bg-emerald-500/5 border border-emerald-500/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  არჩეული კატეგორია:
                </div>
                <div className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {activeLanguage === 'georgian' && selectedCategory.georgian}
                  {activeLanguage === 'english' && selectedCategory.english}
                  {activeLanguage === 'russian' && selectedCategory.russian}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setIsDropdownOpen(true)
                }}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  isDark
                    ? 'hover:bg-white/10 text-white/60'
                    : 'hover:bg-black/10 text-black/60'
                }`}
                aria-label="Change category selection"
              >
                შეცვლა
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full px-2 py-1.5 rounded-md text-xs text-left transition-colors border ${
              isDark
                ? 'bg-white/10 border-white/20 text-white/60 hover:bg-white/15'
                : 'bg-black/5 border-black/10 text-black/60 hover:bg-black/10'
            }`}
            aria-label="Open category selection dropdown"
          >
            აირჩიეთ კატეგორია...
          </button>
        )}

        {/* Category Dropdown */}
        {isDropdownOpen && (
          <div 
            className={`rounded-md border p-2 space-y-0.5 max-h-48 overflow-y-auto ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
            }`}
            role="listbox"
            aria-label="Category selection"
          >
            {loadingCategories ? (
              <div className={`text-center py-3 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                იტვირთება...
              </div>
            ) : categories.length > 0 ? (
              categories.map((category: Category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isExpanded={expandedCategories.includes(category.id)}
                  isSelected={selectedCategory?.id === category.id}
                  isDark={isDark}
                  expandedCategories={expandedCategories}
                  onToggle={toggleExpand}
                  onSelect={handleSelectCategory}
                />
              ))
            ) : (
              <div className={`text-center py-3 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                კატეგორიები ვერ მოიძებნა
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title Input */}
      <div className="space-y-1.5">
        <label htmlFor="post-title" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          პოსტის სათაური
        </label>
        <input
          id="post-title"
          type="text"
          value={currentTranslation.title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={
            activeLanguage === 'georgian' 
              ? 'შეიყვანეთ სათაური'
              : activeLanguage === 'english'
              ? 'Enter title'
              : 'Введите заголовок'
          }
          className={`w-full px-2 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
            isDark
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
              : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
          }`}
          aria-label="Post title"
        />
      </div>

      {/* Featured Image Upload */}
      <div className="space-y-1.5">
        <label className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          მთავარი სურათი
        </label>
        
        {!featuredImagePreview && !currentTranslation.featured_image ? (
          <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDark
              ? 'border-white/20 hover:border-emerald-500/50 bg-white/5'
              : 'border-black/20 hover:border-emerald-500/50 bg-black/5'
          }`}>
            <div className="flex flex-col items-center justify-center py-3">
              <Upload className={`w-6 h-6 mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true" />
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                დააჭირეთ ან გადმოიტანეთ სურათი
              </p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                PNG, JPG, WEBP (max. 5MB)
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
              aria-label="Upload featured image"
            />
          </label>
        ) : (
          <div className="relative w-full h-32 rounded-lg overflow-hidden">
            <Image
              src={featuredImagePreview || currentTranslation.featured_image || ''}
              alt="Featured image preview"
              fill
              className="object-cover"
            />
            <button
              onClick={removeImage}
              className={`absolute top-1 right-1 p-1 rounded-full transition-colors ${
                isDark
                  ? 'bg-black/60 hover:bg-black/80 text-white'
                  : 'bg-white/60 hover:bg-white/80 text-black'
              }`}
              aria-label="Remove featured image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Slug Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="post-slug" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            URL Slug ({activeLanguage === 'georgian' ? 'ქართული' : activeLanguage === 'english' ? 'ინგლისური' : 'რუსული'})
          </label>
          <button
            type="button"
            onClick={handleGenerateSlug}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                : 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
            aria-label="Auto-generate slug from title"
          >
            🔄 ავტო-გენერაცია
          </button>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md border ${
          isDark
            ? 'bg-white/5 border-white/20'
            : 'bg-black/5 border-black/10'
        }`}>
          <span className={`${isDark ? 'text-white/40' : 'text-black/40'}`} aria-label="URL prefix">
            /blog/
          </span>
          <input
            id="post-slug"
            type="text"
            value={currentTranslation.slug || ''}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="slug-avtomaturad-generirebuli"
            className={`flex-1 bg-transparent border-none outline-none ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
            aria-label="Post URL slug"
          />
        </div>
        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          💡 დააჭირეთ &ldquo;🔄 ავტო-გენერაცია&rdquo; ღილაკს → slug დაგენერირდება სათაურიდან + -{activeLanguage === 'georgian' ? 'ka' : activeLanguage === 'english' ? 'en' : 'ru'} სუფიქსით
        </p>
      </div>

      {/* Excerpt (Short Description) */}
      <div className="space-y-1.5">
        <label htmlFor="post-excerpt" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          მოკლე აღწერა
        </label>
        <textarea
          id="post-excerpt"
          value={currentTranslation.excerpt || ''}
          onChange={(e) => updateField('excerpt', e.target.value)}
          placeholder={
            activeLanguage === 'georgian' 
              ? 'პოსტის მოკლე აღწერა...'
              : activeLanguage === 'english'
              ? 'Short description of the post...'
              : 'Краткое описание поста...'
          }
          rows={2}
          className={`w-full px-2 py-1.5 text-xs rounded-md border transition-colors resize-none focus:outline-none focus:border-emerald-500 ${
            isDark
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
              : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
          }`}
          aria-label="Post excerpt"
        />
        <div className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`} aria-live="polite">
          {currentTranslation.excerpt?.length || 0} სიმბოლო
        </div>
      </div>

      {/* Content (Article) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            სტატია
          </label>
          {/* Reading Stats */}
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`} aria-live="polite">
            <span aria-label={`${readingStats.wordCount} words`}>📝 {readingStats.wordCount}</span>
            <span aria-label={`${readingStats.readingTime} minutes reading time`}>⏱️ {readingStats.readingTime} წთ</span>
          </div>
        </div>
        <RichTextEditor 
          content={currentTranslation.content || ''} 
          onChange={(html) => updateField('content', html)} 
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        message={modalConfig.message}
        showCancel={false}
        confirmText="კარგი"
      />
    </div>
  )
}
