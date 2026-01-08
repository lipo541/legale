'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Plus, ChevronRight, Trash2, Check, X, Edit, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/common/Modal'

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
  seo_title?: string
  seo_description?: string
}

interface CategoryData {
  id: string
  parent_id: string | null
  service_category_translations: CategoryTranslation[]
}

interface CategoryFormData {
  id?: string
  georgian: string
  english: string
  russian: string
  description_ka: string
  description_en: string
  description_ru: string
  seo_title_ka: string
  seo_title_en: string
  seo_title_ru: string
  seo_description_ka: string
  seo_description_en: string
  seo_description_ru: string
}

interface FormMode {
  type: 'create' | 'edit' | 'subcategory' | null
  parentId: string | null
  categoryId: string | null
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateSlug = (text: string): string => {
  const translitMap: { [key: string]: string } = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k', 
    'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 
    'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'w', 
    'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 
    'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  }

  let slug = text.toLowerCase().trim()
  slug = slug.split('').map(char => translitMap[char] || char).join('')
  return slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

const emptyFormData: CategoryFormData = {
  georgian: '',
  english: '',
  russian: '',
  description_ka: '',
  description_en: '',
  description_ru: '',
  seo_title_ka: '',
  seo_title_en: '',
  seo_title_ru: '',
  seo_description_ka: '',
  seo_description_en: '',
  seo_description_ru: ''
}

// ============================================================================
// Memoized Form Component - RESPONSIVE DESIGN
// ============================================================================

const CategoryForm = memo(function CategoryForm({ 
  category, 
  setCategory, 
  isDark,
  onGetSlugs
}: { 
  category: CategoryFormData
  setCategory: (cat: CategoryFormData | ((prev: CategoryFormData) => CategoryFormData)) => void
  isDark: boolean
  onGetSlugs: (slugs: { ka: string; en: string; ru: string }) => void
}) {
  const [slugs, setSlugs] = useState({ ka: '', en: '', ru: '' })

  // Auto-generate and sync slugs
  useEffect(() => {
    const newSlugs = {
      ka: category.georgian ? generateSlug(category.georgian) : '',
      en: category.english ? generateSlug(category.english) : '',
      ru: category.russian ? generateSlug(category.russian) : ''
    }
    setSlugs(newSlugs)
    onGetSlugs(newSlugs)
  }, [category.georgian, category.english, category.russian, onGetSlugs])

  const handleSlugChange = useCallback((lang: 'ka' | 'en' | 'ru', value: string) => {
    const newSlugs = { ...slugs, [lang]: value }
    setSlugs(newSlugs)
    onGetSlugs(newSlugs)
  }, [slugs, onGetSlugs])

  return (
    <div className="space-y-2">
      {/* RESPONSIVE: grid-cols-1 on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Georgian */}
        <div className="space-y-1.5">
          <label className={`text-[10px] font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            ქართულად *
          </label>
          <input
            type="text"
            value={category.georgian}
            onChange={(e) => setCategory({ ...category, georgian: e.target.value })}
            placeholder="მაგ: იურიდიული კონსულტაცია"
            className={`w-full px-2 py-1.5 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                : 'bg-white border-black/10 text-black placeholder:text-black/40'
            }`}
          />
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Slug
            </label>
            <input
              type="text"
              value={slugs.ka}
              onChange={(e) => handleSlugChange('ka', e.target.value)}
              placeholder="ავტომატური"
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Title
            </label>
            <input
              type="text"
              value={category.seo_title_ka}
              onChange={(e) => setCategory({ ...category, seo_title_ka: e.target.value })}
              placeholder="SEO სათაური"
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Description
            </label>
            <textarea
              value={category.seo_description_ka}
              onChange={(e) => setCategory({ ...category, seo_description_ka: e.target.value })}
              placeholder="SEO აღწერა"
              rows={2}
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 resize-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
        </div>

        {/* English */}
        <div className="space-y-1.5">
          <label className={`text-[10px] font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            English *
          </label>
          <input
            type="text"
            value={category.english}
            onChange={(e) => setCategory({ ...category, english: e.target.value })}
            placeholder="e.g: Legal Consultation"
            className={`w-full px-2 py-1.5 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                : 'bg-white border-black/10 text-black placeholder:text-black/40'
            }`}
          />
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Slug
            </label>
            <input
              type="text"
              value={slugs.en}
              onChange={(e) => handleSlugChange('en', e.target.value)}
              placeholder="auto-generated"
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Title
            </label>
            <input
              type="text"
              value={category.seo_title_en}
              onChange={(e) => setCategory({ ...category, seo_title_en: e.target.value })}
              placeholder="SEO Title"
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Description
            </label>
            <textarea
              value={category.seo_description_en}
              onChange={(e) => setCategory({ ...category, seo_description_en: e.target.value })}
              placeholder="SEO Description"
              rows={2}
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 resize-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
        </div>

        {/* Russian */}
        <div className="space-y-1.5">
          <label className={`text-[10px] font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            Русский *
          </label>
          <input
            type="text"
            value={category.russian}
            onChange={(e) => setCategory({ ...category, russian: e.target.value })}
            placeholder="напр: Юридическая консультация"
            className={`w-full px-2 py-1.5 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                : 'bg-white border-black/10 text-black placeholder:text-black/40'
            }`}
          />
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Slug
            </label>
            <input
              type="text"
              value={slugs.ru}
              onChange={(e) => handleSlugChange('ru', e.target.value)}
              placeholder="автоматически"
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Title
            </label>
            <input
              type="text"
              value={category.seo_title_ru}
              onChange={(e) => setCategory({ ...category, seo_title_ru: e.target.value })}
              placeholder="SEO Заголовок"
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Description
            </label>
            <textarea
              value={category.seo_description_ru}
              onChange={(e) => setCategory({ ...category, seo_description_ru: e.target.value })}
              placeholder="SEO Описание"
              rows={2}
              className={`w-full px-2 py-1 text-[10px] rounded-md border transition-colors focus:outline-none focus:border-blue-500 resize-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export default function ServiceCategoryAdd() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  
  // Form state
  const [formData, setFormData] = useState<CategoryFormData>(emptyFormData)
  const [formMode, setFormMode] = useState<FormMode>({ type: null, parentId: null, categoryId: null })
  const [formSlugs, setFormSlugs] = useState({ ka: '', en: '', ru: '' })

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm'
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'info',
    message: '',
    onConfirm: undefined
  })

  const showModal = useCallback((
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm',
    message: string,
    onConfirm?: () => void
  ) => {
    setModalConfig({ isOpen: true, type, message, onConfirm })
  }, [])

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = useCallback(async () => {
    setLoading(true)

    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select(`
          id,
          parent_id,
          service_category_translations (
            language,
            name,
            slug,
            seo_title,
            seo_description
          )
        `)
        .order('sort_order', { ascending: true })

      if (categoriesError) throw categoriesError

      // Transform to nested structure
      const categoryMap = new Map<string, Category>()
      
      categoriesData?.forEach((cat: CategoryData) => {
        const ka = cat.service_category_translations.find((t) => t.language === 'ka')
        const en = cat.service_category_translations.find((t) => t.language === 'en')
        const ru = cat.service_category_translations.find((t) => t.language === 'ru')

        categoryMap.set(cat.id, {
          id: cat.id,
          parent_id: cat.parent_id,
          georgian: ka?.name || '',
          english: en?.name || '',
          russian: ru?.name || '',
          subcategories: []
        })
      })

      // Build tree
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
      showModal('error', 'კატეგორიების ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }, [supabase, showModal])

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  const handleCreate = useCallback(async () => {
    if (!formData.georgian || !formData.english || !formData.russian) {
      showModal('warning', 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი')
      return
    }

    setSaving(true)

    try {
      // Create category
      const { data: category, error: categoryError } = await supabase
        .from('service_categories')
        .insert({ parent_id: formMode.parentId })
        .select()
        .single()

      if (categoryError) throw categoryError

      // Create translations
      const translations = [
        {
          category_id: category.id,
          language: 'ka',
          name: formData.georgian,
          slug: formSlugs.ka || generateSlug(formData.georgian),
          seo_title: formData.seo_title_ka || null,
          seo_description: formData.seo_description_ka || null
        },
        {
          category_id: category.id,
          language: 'en',
          name: formData.english,
          slug: formSlugs.en || generateSlug(formData.english),
          seo_title: formData.seo_title_en || null,
          seo_description: formData.seo_description_en || null
        },
        {
          category_id: category.id,
          language: 'ru',
          name: formData.russian,
          slug: formSlugs.ru || generateSlug(formData.russian),
          seo_title: formData.seo_title_ru || null,
          seo_description: formData.seo_description_ru || null
        }
      ]

      const { error: translationsError } = await supabase
        .from('service_category_translations')
        .insert(translations)

      if (translationsError) throw translationsError

      resetForm()
      await loadCategories()
      
      showModal('success', 'კატეგორია წარმატებით შეიქმნა!')
    } catch (error) {
      console.error('Error creating category:', error)
      showModal('error', 'კატეგორიის შექმნა ვერ მოხერხდა')
    } finally {
      setSaving(false)
    }
  }, [formData, formMode.parentId, formSlugs, supabase, showModal, loadCategories])

  const handleUpdate = useCallback(async () => {
    if (!formData.georgian || !formData.english || !formData.russian || !formMode.categoryId) {
      showModal('warning', 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი')
      return
    }

    setSaving(true)

    try {
      const updates = [
        {
          language: 'ka',
          name: formData.georgian,
          slug: formSlugs.ka || generateSlug(formData.georgian),
          seo_title: formData.seo_title_ka || null,
          seo_description: formData.seo_description_ka || null
        },
        {
          language: 'en',
          name: formData.english,
          slug: formSlugs.en || generateSlug(formData.english),
          seo_title: formData.seo_title_en || null,
          seo_description: formData.seo_description_en || null
        },
        {
          language: 'ru',
          name: formData.russian,
          slug: formSlugs.ru || generateSlug(formData.russian),
          seo_title: formData.seo_title_ru || null,
          seo_description: formData.seo_description_ru || null
        }
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('service_category_translations')
          .update({ 
            name: update.name, 
            slug: update.slug,
            seo_title: update.seo_title,
            seo_description: update.seo_description
          })
          .eq('category_id', formMode.categoryId)
          .eq('language', update.language)

        if (error) throw error
      }

      resetForm()
      await loadCategories()
      
      showModal('success', 'კატეგორია წარმატებით განახლდა!')
    } catch (error) {
      console.error('Error updating category:', error)
      showModal('error', 'კატეგორიის განახლება ვერ მოხერხდა')
    } finally {
      setSaving(false)
    }
  }, [formData, formMode.categoryId, formSlugs, supabase, showModal, loadCategories])

  const handleDelete = useCallback((categoryId: string) => {
    showModal('confirm', 'დარწმუნებული ხართ რომ გსურთ კატეგორიის წაშლა?', async () => {
      try {
        const { error } = await supabase
          .from('service_categories')
          .delete()
          .eq('id', categoryId)

        if (error) throw error

        await loadCategories()
        showModal('success', 'კატეგორია წაშლილია')
      } catch (error) {
        console.error('Error deleting category:', error)
        showModal('error', 'კატეგორიის წაშლა ვერ მოხერხდა')
      }
    })
  }, [supabase, showModal, loadCategories])

  const handleEdit = useCallback(async (categoryId: string) => {
    try {
      const { data: translations, error } = await supabase
        .from('service_category_translations')
        .select('*')
        .eq('category_id', categoryId)

      if (error) throw error

      const ka = translations?.find((t) => t.language === 'ka')
      const en = translations?.find((t) => t.language === 'en')
      const ru = translations?.find((t) => t.language === 'ru')

      setFormData({
        id: categoryId,
        georgian: ka?.name || '',
        english: en?.name || '',
        russian: ru?.name || '',
        description_ka: '',
        description_en: '',
        description_ru: '',
        seo_title_ka: ka?.seo_title || '',
        seo_title_en: en?.seo_title || '',
        seo_title_ru: ru?.seo_title || '',
        seo_description_ka: ka?.seo_description || '',
        seo_description_en: en?.seo_description || '',
        seo_description_ru: ru?.seo_description || ''
      })
      
      setFormMode({ type: 'edit', parentId: null, categoryId })
    } catch (error) {
      console.error('Error loading category for edit:', error)
      showModal('error', 'კატეგორიის ჩატვირთვა ვერ მოხერხდა')
    }
  }, [supabase, showModal])

  // ============================================================================
  // Form Helpers
  // ============================================================================

  const resetForm = useCallback(() => {
    setFormData(emptyFormData)
    setFormMode({ type: null, parentId: null, categoryId: null })
    setFormSlugs({ ka: '', en: '', ru: '' })
  }, [])

  const openCreateForm = useCallback(() => {
    resetForm()
    setFormMode({ type: 'create', parentId: null, categoryId: null })
  }, [resetForm])

  const openSubcategoryForm = useCallback((parentId: string) => {
    resetForm()
    setFormMode({ type: 'subcategory', parentId, categoryId: null })
  }, [resetForm])

  const toggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  // ============================================================================
  // Recursive Category Renderer
  // ============================================================================

  const renderCategory = useCallback((category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.includes(category.id)
    const hasSubcategories = category.subcategories.length > 0
    const isEditing = formMode.type === 'edit' && formMode.categoryId === category.id
    const isCreatingSub = formMode.type === 'subcategory' && formMode.parentId === category.id

    return (
      <div key={category.id} className="space-y-1">
        {/* Edit Form */}
        {isEditing ? (
          <div 
            className={`space-y-3 p-3 rounded-lg ${
              isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-500/5 border border-blue-500/10'
            }`}
            style={{ marginLeft: `${level * 20}px` }}
          >
            <CategoryForm 
              category={formData}
              setCategory={setFormData}
              isDark={isDark}
              onGetSlugs={setFormSlugs}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  saving
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                შენახვა
              </button>
              <button
                onClick={resetForm}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-black/10 text-black/70 hover:bg-black/20'
                }`}
              >
                <X className="h-3.5 w-3.5" />
                გაუქმება
              </button>
            </div>
          </div>
        ) : (
          <div 
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
              isDark 
                ? 'hover:bg-white/5 border border-white/10' 
                : 'hover:bg-black/5 border border-black/10'
            }`}
            style={{ marginLeft: `${level * 20}px` }}
          >
            {hasSubcategories ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className={`p-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <ChevronRight className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            ) : (
              <div className="w-4" />
            )}
            
            <span className={`text-xs flex-1 truncate ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {category.georgian} / {category.english} / {category.russian}
            </span>
            
            <button
              onClick={() => handleEdit(category.id)}
              className={`p-1 rounded-md transition-colors flex-shrink-0 ${
                isDark
                  ? 'hover:bg-blue-500/20 text-blue-400'
                  : 'hover:bg-blue-500/10 text-blue-600'
              }`}
              title="რედაქტირება"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => openSubcategoryForm(category.id)}
              className={`p-1 rounded-md transition-colors flex-shrink-0 ${
                isDark
                  ? 'hover:bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-emerald-500/10 text-emerald-600'
              }`}
              title="სუბკატეგორიის დამატება"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => handleDelete(category.id)}
              className={`p-1 rounded-md transition-colors flex-shrink-0 ${
                isDark
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-red-500/10 text-red-600'
              }`}
              title="წაშლა"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Subcategories */}
        {isExpanded && hasSubcategories && (
          <div className="space-y-1">
            {category.subcategories.map(sub => renderCategory(sub, level + 1))}
          </div>
        )}

        {/* Add Subcategory Form */}
        {isCreatingSub && (
          <div 
            className={`space-y-3 p-3 rounded-lg ${
              isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/5 border border-emerald-500/10'
            }`}
            style={{ marginLeft: `${(level + 1) * 20}px` }}
          >
            <CategoryForm 
              category={formData}
              setCategory={setFormData}
              isDark={isDark}
              onGetSlugs={setFormSlugs}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  saving
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                დამატება
              </button>
              <button
                onClick={resetForm}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-black/10 text-black/70 hover:bg-black/20'
                }`}
              >
                <X className="h-3.5 w-3.5" />
                გაუქმება
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }, [
    expandedCategories, 
    formMode, 
    formData, 
    isDark, 
    saving, 
    handleUpdate, 
    resetForm, 
    toggleExpand, 
    handleEdit, 
    openSubcategoryForm, 
    handleDelete, 
    handleCreate
  ])

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        იტვირთება...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          სერვისის კატეგორიები
        </h2>
        
        {/* Create Button */}
        <button
          onClick={openCreateForm}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            formMode.type === 'create'
              ? 'bg-emerald-500 text-white'
              : isDark
              ? 'bg-white/10 text-white/80 hover:bg-white/20'
              : 'bg-black/10 text-black/80 hover:bg-black/20'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          შექმენი კატეგორია
        </button>
      </div>

      {/* Create Main Category Form */}
      {formMode.type === 'create' && (
        <div className={`space-y-3 p-3 rounded-lg ${
          isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/5 border border-emerald-500/10'
        }`}>
          <CategoryForm 
            category={formData}
            setCategory={setFormData}
            isDark={isDark}
            onGetSlugs={setFormSlugs}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                saving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              შექმნა
            </button>
            <button
              onClick={resetForm}
              disabled={saving}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/20'
                  : 'bg-black/10 text-black/70 hover:bg-black/20'
              }`}
            >
              <X className="h-3.5 w-3.5" />
              გაუქმება
            </button>
          </div>
        </div>
      )}

      {/* Categories Tree */}
      <div className="space-y-2">
        <h3 className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          არსებული კატეგორიები:
        </h3>
        
        {categories.length > 0 ? (
          <div className="space-y-1">
            {categories.map(category => renderCategory(category))}
          </div>
        ) : (
          <div className={`text-center py-8 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            კატეგორიები ჯერ არ არის დამატებული
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        showCancel={modalConfig.type === 'confirm'}
        confirmText={modalConfig.type === 'confirm' ? 'დიახ' : 'კარგი'}
        cancelText="გაუქმება"
      />
    </div>
  )
}
