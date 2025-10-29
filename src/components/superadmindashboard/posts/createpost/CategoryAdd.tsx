'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Plus, ChevronRight, Trash2, Check, X, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  parent_id: string | null
  georgian: string
  english: string
  russian: string
  subcategories: Category[]
}

interface PostTranslation {
  language: string
  category_id?: string | null
}

interface PostData {
  post?: {
    category_id?: string | null
  }
  post_translations?: PostTranslation[]
}

interface CategoryAddProps {
  editMode?: boolean
  postData?: PostData
}

export default function CategoryAdd({ editMode, postData }: CategoryAddProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  
  // Get selected category from post data (if editing)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  // Slug states
  const [currentSlugs, setCurrentSlugs] = useState({ ka: '', en: '', ru: '' })
  const [editSlugs, setEditSlugs] = useState({ ka: '', en: '', ru: '' })
  const [subSlugs, setSubSlugs] = useState({ ka: '', en: '', ru: '' })
  
  // Form state for new category
  const [newCategory, setNewCategory] = useState({
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
  })

  // Form state for editing category
  const [editCategory, setEditCategory] = useState({
    id: '',
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
  })

  useEffect(() => {
    loadCategories()
    
    // Load selected category from post data (edit mode)
    if (editMode && postData) {
      const georgianTranslation = postData.post_translations?.find((t) => t.language === 'ka')
      if (georgianTranslation?.category_id) {
        setSelectedCategoryId(georgianTranslation.category_id)
      }
    }
  }, [])

  const loadCategories = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Fetch all categories with translations
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

      interface CategoryTranslation {
        language: string
        name: string
      }

      interface CategoryData {
        id: string
        parent_id: string | null
        post_category_translations: CategoryTranslation[]
      }

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
      alert('კატეგორიების ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (parentId: string | null = null, slugs?: { ka: string; en: string; ru: string }) => {
    if (!newCategory.georgian || !newCategory.english || !newCategory.russian) {
      alert('გთხოვთ შეავსოთ ყველა სავალდებულო ველი')
      return
    }

    const supabase = createClient()

    try {
      // 1. Create category
      const { data: category, error: categoryError } = await supabase
        .from('post_categories')
        .insert({ parent_id: parentId })
        .select()
        .single()

      if (categoryError) throw categoryError

      // 2. Create translations with provided slugs or auto-generate
      const translations = [
        {
          category_id: category.id,
          language: 'ka',
          name: newCategory.georgian,
          slug: slugs?.ka || generateSlug(newCategory.georgian),
          description: newCategory.description_ka || null,
          seo_title: newCategory.seo_title_ka || null,
          seo_description: newCategory.seo_description_ka || null
        },
        {
          category_id: category.id,
          language: 'en',
          name: newCategory.english,
          slug: slugs?.en || generateSlug(newCategory.english),
          description: newCategory.description_en || null,
          seo_title: newCategory.seo_title_en || null,
          seo_description: newCategory.seo_description_en || null
        },
        {
          category_id: category.id,
          language: 'ru',
          name: newCategory.russian,
          slug: slugs?.ru || generateSlug(newCategory.russian),
          description: newCategory.description_ru || null,
          seo_title: newCategory.seo_title_ru || null,
          seo_description: newCategory.seo_description_ru || null
        }
      ]

      const { error: translationsError } = await supabase
        .from('post_category_translations')
        .insert(translations)

      if (translationsError) throw translationsError

      // Reset form
      setNewCategory({
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
      })
      setIsCreating(false)
      setCreatingSubFor(null)

      // Reload categories
      await loadCategories()
      
      alert('კატეგორია წარმატებით შეიქმნა!')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('კატეგორიის შექმნა ვერ მოხერხდა')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ კატეგორიის წაშლა?')) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('post_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      await loadCategories()
      alert('კატეგორია წაშლილია')
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('კატეგორიის წაშლა ვერ მოხერხდა')
    }
  }

  const handleEditCategory = async (categoryId: string, categoryData: Category) => {
    // Load category data for editing
    setEditCategory({
      id: categoryId,
      georgian: categoryData.georgian,
      english: categoryData.english,
      russian: categoryData.russian,
      description_ka: '',
      description_en: '',
      description_ru: '',
      seo_title_ka: '',
      seo_title_en: '',
      seo_title_ru: '',
      seo_description_ka: '',
      seo_description_en: '',
      seo_description_ru: ''
    })
    setEditingCategory(categoryId)
  }

  const handleUpdateCategory = async (slugs?: { ka: string; en: string; ru: string }) => {
    if (!editCategory.georgian || !editCategory.english || !editCategory.russian) {
      alert('გთხოვთ შეავსოთ ყველა სავალდებულო ველი')
      return
    }

    const supabase = createClient()

    try {
      // Update translations with provided slugs or auto-generate
      const updates = [
        {
          language: 'ka',
          name: editCategory.georgian,
          slug: slugs?.ka || generateSlug(editCategory.georgian),
          seo_title: editCategory.seo_title_ka || null,
          seo_description: editCategory.seo_description_ka || null
        },
        {
          language: 'en',
          name: editCategory.english,
          slug: slugs?.en || generateSlug(editCategory.english),
          seo_title: editCategory.seo_title_en || null,
          seo_description: editCategory.seo_description_en || null
        },
        {
          language: 'ru',
          name: editCategory.russian,
          slug: slugs?.ru || generateSlug(editCategory.russian),
          seo_title: editCategory.seo_title_ru || null,
          seo_description: editCategory.seo_description_ru || null
        }
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('post_category_translations')
          .update({ 
            name: update.name, 
            slug: update.slug,
            seo_title: update.seo_title,
            seo_description: update.seo_description
          })
          .eq('category_id', editCategory.id)
          .eq('language', update.language)

        if (error) throw error
      }

      // Reset edit state
      setEditingCategory(null)
      setEditCategory({
        id: '',
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
      })

      // Reload categories
      await loadCategories()
      
      alert('კატეგორია წარმატებით განახლდა!')
    } catch (error) {
      console.error('Error updating category:', error)
      alert('კატეგორიის განახლება ვერ მოხერხდა')
    }
  }

  const generateSlug = (text: string): string => {
    const translitMap: { [key: string]: string } = {
      'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'w', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
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

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.includes(category.id)
    const hasSubcategories = category.subcategories.length > 0
    const isEditing = editingCategory === category.id

    return (
      <div key={category.id} className="space-y-1">
        {/* Edit Form */}
        {isEditing ? (
          <div 
            className={`space-y-3 p-4 rounded-lg ${
              isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-500/5 border border-blue-500/10'
            }`}
            style={{ marginLeft: `${level * 20}px` }}
          >
            <CategoryForm 
              category={editCategory}
              setCategory={setEditCategory as (cat: CategoryFormData | ((prev: CategoryFormData) => CategoryFormData)) => void}
              isDark={isDark}
              onGetSlugs={setEditSlugs}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateCategory(editSlugs)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Check className="h-4 w-4" />
                შენახვა
              </button>
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setEditCategory({
                    id: '',
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
                  })
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-black/10 text-black/70 hover:bg-black/20'
                }`}
              >
                <X className="h-4 w-4" />
                გაუქმება
              </button>
            </div>
          </div>
        ) : (
          <div 
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isDark 
                ? 'hover:bg-white/5 border border-white/10' 
                : 'hover:bg-black/5 border border-black/10'
            }`}
            style={{ marginLeft: `${level * 20}px` }}
          >
            {hasSubcategories && (
              <button
                onClick={() => toggleExpand(category.id)}
                className={`p-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <ChevronRight className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
            {!hasSubcategories && <div className="w-5" />}
            
            <span className={`text-sm flex-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {category.georgian} / {category.english} / {category.russian}
            </span>
            
            <button
              onClick={() => handleEditCategory(category.id, category)}
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? 'hover:bg-blue-500/20 text-blue-400'
                  : 'hover:bg-blue-500/10 text-blue-600'
              }`}
              title="რედაქტირება"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCreatingSubFor(category.id)}
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? 'hover:bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-emerald-500/10 text-emerald-600'
              }`}
              title="სუბკატეგორიის დამატება"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleDeleteCategory(category.id)}
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-red-500/10 text-red-600'
              }`}
              title="წაშლა"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {isExpanded && hasSubcategories && (
          <div className="space-y-1">
            {category.subcategories.map(sub => renderCategory(sub, level + 1))}
          </div>
        )}

        {/* Add Subcategory Form */}
        {creatingSubFor === category.id && (
          <div 
            className={`space-y-3 p-4 rounded-lg ${
              isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/5 border border-emerald-500/10'
            }`}
            style={{ marginLeft: `${(level + 1) * 20}px` }}
          >
            <CategoryForm 
              category={newCategory}
              setCategory={setNewCategory as (cat: CategoryFormData | ((prev: CategoryFormData) => CategoryFormData)) => void}
              isDark={isDark}
              onGetSlugs={setSubSlugs}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleCreateCategory(category.id, subSlugs)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                <Check className="h-4 w-4" />
                დამატება
              </button>
              <button
                onClick={() => {
                  setCreatingSubFor(null)
                  setNewCategory({
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
                  })
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-black/10 text-black/70 hover:bg-black/20'
                }`}
              >
                <X className="h-4 w-4" />
                გაუქმება
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        იტვირთება...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <button
        onClick={() => setIsCreating(!isCreating)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isCreating
            ? isDark
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500 text-white'
            : isDark
            ? 'bg-white/10 text-white/80 hover:bg-white/20'
            : 'bg-black/10 text-black/80 hover:bg-black/20'
        }`}
      >
        <Plus className="h-4 w-4" />
        შექმენი კატეგორია
      </button>

      {/* Create Main Category Form */}
      {isCreating && (
        <div className={`space-y-4 p-4 rounded-lg ${
          isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/5 border border-emerald-500/10'
        }`}>
          <CategoryForm 
            category={newCategory}
            setCategory={setNewCategory as (cat: CategoryFormData | ((prev: CategoryFormData) => CategoryFormData)) => void}
            isDark={isDark}
            onGetSlugs={setCurrentSlugs}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleCreateCategory(null, currentSlugs)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <Check className="h-4 w-4" />
              შექმნა
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewCategory({
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
                })
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/20'
                  : 'bg-black/10 text-black/70 hover:bg-black/20'
              }`}
            >
              <X className="h-4 w-4" />
              გაუქმება
            </button>
          </div>
        </div>
      )}

      {/* Categories Tree */}
      <div className="space-y-2">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          {editMode && selectedCategoryId ? 'არჩეული კატეგორია:' : 'არსებული კატეგორიები:'}
        </h3>

        {/* Show selected category in edit mode */}
        {editMode && selectedCategoryId && (() => {
          // Find selected category recursively
          const findCategory = (cats: Category[], id: string): { category: Category; parent: Category | null } | null => {
            for (const cat of cats) {
              if (cat.id === id) {
                return { category: cat, parent: null }
              }
              if (cat.subcategories.length > 0) {
                const found = findCategory(cat.subcategories, id)
                if (found) {
                  return { category: found.category, parent: found.parent || cat }
                }
              }
            }
            return null
          }

          const result = findCategory(categories, selectedCategoryId)
          if (!result) return null

          return (
            <div className={`mb-4 rounded-lg border p-4 ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-500/5 border-emerald-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {result.category.georgian} / {result.category.english} / {result.category.russian}
                  </p>
                  {result.parent && (
                    <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      Subcategory of: {result.parent.georgian}
                    </p>
                  )}
                  <p className={`mt-1 text-xs font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    ID: {selectedCategoryId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white/70 hover:bg-white/20'
                      : 'bg-black/10 text-black/70 hover:bg-black/20'
                  }`}
                >
                  შეცვლა
                </button>
              </div>
            </div>
          )
        })()}
        
        {categories.length > 0 ? (
          <div className="space-y-1">
            {categories.map(category => renderCategory(category))}
          </div>
        ) : (
          <div className={`text-center py-8 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            კატეგორიები ჯერ არ არის დამატებული
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to generate slug
function generateSlugHelper(text: string): string {
  const translitMap: { [key: string]: string } = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'w', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
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

// Separate Form Component
function CategoryForm({ 
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
  const [georgianSlug, setGeorgianSlug] = useState('')
  const [englishSlug, setEnglishSlug] = useState('')
  const [russianSlug, setRussianSlug] = useState('')

  // Auto-generate slugs when names change
  useEffect(() => {
    if (category.georgian) {
      const slug = generateSlugHelper(category.georgian)
      setGeorgianSlug(slug)
      onGetSlugs({ ka: slug, en: englishSlug, ru: russianSlug })
    }
  }, [category.georgian])

  useEffect(() => {
    if (category.english) {
      const slug = generateSlugHelper(category.english)
      setEnglishSlug(slug)
      onGetSlugs({ ka: georgianSlug, en: slug, ru: russianSlug })
    }
  }, [category.english])

  useEffect(() => {
    if (category.russian) {
      const slug = generateSlugHelper(category.russian)
      setRussianSlug(slug)
      onGetSlugs({ ka: georgianSlug, en: englishSlug, ru: slug })
    }
  }, [category.russian])

  // Also update when slugs are manually edited
  useEffect(() => {
    onGetSlugs({ ka: georgianSlug, en: englishSlug, ru: russianSlug })
  }, [georgianSlug, englishSlug, russianSlug])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {/* Georgian */}
        <div className="space-y-1.5">
          <label className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            ქართულად *
          </label>
          <input
            type="text"
            value={category.georgian}
            onChange={(e) => setCategory({ ...category, georgian: e.target.value })}
            placeholder="მაგ: ახალი ამბები"
            className={`w-full px-3 py-2 text-sm rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                : 'bg-white border-black/10 text-black placeholder:text-black/40'
            }`}
          />
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Slug (ქართული)
            </label>
            <input
              type="text"
              value={georgianSlug}
              onChange={(e) => setGeorgianSlug(e.target.value)}
              placeholder="ავტომატურად გენერირდება"
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Title
            </label>
            <input
              type="text"
              value={category.seo_title_ka || ''}
              onChange={(e) => setCategory({ ...category, seo_title_ka: e.target.value })}
              placeholder="SEO სათაური"
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Description
            </label>
            <textarea
              value={category.seo_description_ka || ''}
              onChange={(e) => setCategory({ ...category, seo_description_ka: e.target.value })}
              placeholder="SEO აღწერა"
              rows={2}
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 resize-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
        </div>

        {/* English */}
        <div className="space-y-1.5">
          <label className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            English *
          </label>
          <input
            type="text"
            value={category.english}
            onChange={(e) => setCategory({ ...category, english: e.target.value })}
            placeholder="e.g: News"
            className={`w-full px-3 py-2 text-sm rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                : 'bg-white border-black/10 text-black placeholder:text-black/40'
            }`}
          />
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Slug (English)
            </label>
            <input
              type="text"
              value={englishSlug}
              onChange={(e) => setEnglishSlug(e.target.value)}
              placeholder="auto-generated"
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Title
            </label>
            <input
              type="text"
              value={category.seo_title_en || ''}
              onChange={(e) => setCategory({ ...category, seo_title_en: e.target.value })}
              placeholder="SEO Title"
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Description
            </label>
            <textarea
              value={category.seo_description_en || ''}
              onChange={(e) => setCategory({ ...category, seo_description_en: e.target.value })}
              placeholder="SEO Description"
              rows={2}
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 resize-none ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
        </div>

        {/* Russian */}
        <div className="space-y-1.5">
          <label className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            Русский *
          </label>
          <input
            type="text"
            value={category.russian}
            onChange={(e) => setCategory({ ...category, russian: e.target.value })}
            placeholder="напр: Новости"
            className={`w-full px-3 py-2 text-sm rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                : 'bg-white border-black/10 text-black placeholder:text-black/40'
            }`}
          />
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Slug (Русский)
            </label>
            <input
              type="text"
              value={russianSlug}
              onChange={(e) => setRussianSlug(e.target.value)}
              placeholder="автоматически"
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Title
            </label>
            <input
              type="text"
              value={category.seo_title_ru || ''}
              onChange={(e) => setCategory({ ...category, seo_title_ru: e.target.value })}
              placeholder="SEO Заголовок"
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60 placeholder:text-white/30'
                  : 'bg-black/5 border-black/10 text-black/60 placeholder:text-black/30'
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              SEO Description
            </label>
            <textarea
              value={category.seo_description_ru || ''}
              onChange={(e) => setCategory({ ...category, seo_description_ru: e.target.value })}
              placeholder="SEO Описание"
              rows={2}
              className={`w-full px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-blue-500 resize-none ${
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
}
