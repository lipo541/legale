'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { Plus, Upload, X, Image as ImageIcon, Trash2, Eye, ChevronDown, ChevronRight, Save } from 'lucide-react'
import Image from 'next/image'

interface Banner {
  id: string
  image_url_ka: string
  image_url_en: string
  image_url_ru: string
  category_id: string | null
  created_at: string
  is_active: boolean
  display_order: number
}

interface Category {
  id: string
  slug: string
  name_ka: string
  name_en: string
  name_ru: string
  parent_id: string | null
  level: number
  children?: Category[]
}

interface FileState {
  ka: File | null
  en: File | null
  ru: File | null
}

interface PreviewState {
  ka: string | null
  en: string | null
  ru: string | null
}

export default function NewsBannerPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [showModal, setShowModal] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'ka' | 'en' | 'ru'>('ka')
  const [selectedFiles, setSelectedFiles] = useState<FileState>({ ka: null, en: null, ru: null })
  const [previewUrls, setPreviewUrls] = useState<PreviewState>({ ka: null, en: null, ru: null })
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [uploading, setUploading] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [hasOrderChanges, setHasOrderChanges] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchBanners()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      // Fetch all categories with translations - matching posts implementation
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('post_categories')
        .select(`
          id,
          parent_id,
          post_category_translations (
            language,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: true })

      if (categoriesError) throw categoriesError

      // Transform data to hierarchical structure
      const categoryMap = new Map<string, Category & { children: Category[] }>()
      
      categoriesData?.forEach((cat: { id: string; parent_id: string | null; post_category_translations: Array<{ language: string; name: string; slug: string }> }) => {
        const ka = cat.post_category_translations.find((t: { language: string }) => t.language === 'ka')
        const en = cat.post_category_translations.find((t: { language: string }) => t.language === 'en')
        const ru = cat.post_category_translations.find((t: { language: string }) => t.language === 'ru')

        categoryMap.set(cat.id, {
          id: cat.id,
          parent_id: cat.parent_id,
          level: 0, // will be calculated below
          slug: ka?.slug || '', // Using Georgian slug as primary
          name_ka: ka?.name || '',
          name_en: en?.name || '',
          name_ru: ru?.name || '',
          children: []
        })
      })

      // Build tree structure and calculate levels
      const flatCategories: Category[] = []
      categoryMap.forEach((category) => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id)
          if (parent) {
            parent.children.push(category)
            category.level = parent.level + 1
          }
        } else {
          category.level = 0
        }
        flatCategories.push(category)
      })

      setCategories(flatCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const buildCategoryTree = () => {
    const tree: Category[] = []
    const categoryMap = new Map<string, Category & { children: Category[] }>()

    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          parent.children.push(category)
        }
      } else {
        tree.push(category)
      }
    })

    return tree
  }

  useEffect(() => {
    fetchBanners()
    fetchCategories()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('news_banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, lang: 'ka' | 'en' | 'ru') => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [lang]: file }))
      const url = URL.createObjectURL(file)
      setPreviewUrls(prev => ({ ...prev, [lang]: url }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles.ka || !selectedFiles.en || !selectedFiles.ru) {
      alert('გთხოვთ ატვირთოთ ბანერი სამივე ენაზე!')
      return
    }

    try {
      setUploading(true)

      const urls: { ka: string; en: string; ru: string } = { ka: '', en: '', ru: '' }

      for (const lang of ['ka', 'en', 'ru'] as const) {
        const file = selectedFiles[lang]
        if (!file) continue

        const fileExt = file.name.split('.').pop()
        const fileName = `${lang}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('banner')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('banner')
          .getPublicUrl(fileName)

        urls[lang] = publicUrl
      }

      // Get the next display order
      const { data: maxOrderData } = await supabase
        .from('news_banners')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      const nextOrder = (maxOrderData?.display_order || 0) + 1

      const { error: dbError } = await supabase
        .from('news_banners')
        .insert([
          {
            image_url_ka: urls.ka,
            image_url_en: urls.en,
            image_url_ru: urls.ru,
            category_id: selectedCategoryId || null,
            is_active: true,
            display_order: nextOrder
          }
        ])

      if (dbError) throw dbError

      setShowModal(false)
      setSelectedFiles({ ka: null, en: null, ru: null })
      setPreviewUrls({ ka: null, en: null, ru: null })
      setSelectedLanguage('ka')
      setSelectedCategoryId('')
      
      fetchBanners()
      alert('ბანერი წარმატებით აიტვირთა!')
    } catch (error) {
      console.error('Error uploading banner:', error)
      alert('ბანერის ატვირთვისას მოხდა შეცდომა')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (banner: Banner) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ბანერის წაშლა?')) return

    try {
      for (const lang of ['ka', 'en', 'ru'] as const) {
        const imageUrl = banner[`image_url_${lang}`]
        const urlParts = imageUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]

        await supabase.storage.from('banner').remove([fileName])
      }

      const { error: dbError } = await supabase
        .from('news_banners')
        .delete()
        .eq('id', banner.id)

      if (dbError) throw dbError

      fetchBanners()
      alert('ბანერი წარმატებით წაიშალა')
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('ბანერის წაშლისას მოხდა შეცდომა')
    }
  }

  const handleOrderChange = (bannerId: string, newOrder: number) => {
    if (newOrder < 1 || newOrder > 999) return

    // Update UI immediately
    setBanners(prev => 
      prev.map(b => b.id === bannerId ? { ...b, display_order: newOrder } : b)
    )

    // Mark that we have unsaved changes
    setHasOrderChanges(true)
  }

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true)

      // Update all banners with their current display_order
      const updates = banners.map(banner => 
        supabase
          .from('news_banners')
          .update({ display_order: banner.display_order })
          .eq('id', banner.id)
      )

      await Promise.all(updates)

      setHasOrderChanges(false)
      await fetchBanners()
      alert('რიგითობა წარმატებით შეინახა!')
    } catch (error) {
      console.error('Error saving order:', error)
      alert('რიგითობის შენახვისას მოხდა შეცდომა')
    } finally {
      setSavingOrder(false)
    }
  }

  const resetModal = () => {
    setShowModal(false)
    setSelectedFiles({ ka: null, en: null, ru: null })
    setPreviewUrls({ ka: null, en: null, ru: null })
    setSelectedLanguage('ka')
    setSelectedCategoryId('')
    setShowCategoryDropdown(false)
    setExpandedCategories(new Set())
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'ყველა კატეგორია'
    const category = categories.find(c => c.id === categoryId)
    return category?.name_ka || 'უცნობი კატეგორია'
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const renderCategoryTreeItem = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategoryId === category.id

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
            isSelected
              ? isDark
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-500/10 text-blue-600'
              : isDark
              ? 'hover:bg-white/5 text-white/80'
              : 'hover:bg-black/5 text-black/80'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCategoryExpansion(category.id)
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <div
            onClick={() => {
              setSelectedCategoryId(category.id)
              setShowCategoryDropdown(false)
            }}
            className="flex-1 text-sm"
          >
            {category.name_ka}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mb-12">
        <h1 className={`text-5xl font-semibold tracking-tight mb-3 ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          News Banners
        </h1>
        <p className={`text-lg ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Create and manage promotional banners for your news section
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => setShowModal(true)}
          className={`group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-full font-medium transition-all duration-200 ${
            isDark
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-black text-white hover:bg-black/90'
          }`}
        >
          <Plus className="h-5 w-5" />
          <span>New Banner</span>
        </button>

        {hasOrderChanges && (
          <button
            onClick={handleSaveOrder}
            disabled={savingOrder}
            className={`group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-full font-medium transition-all duration-200 ${
              savingOrder
                ? isDark
                  ? 'bg-emerald-500/50 text-white cursor-not-allowed'
                  : 'bg-emerald-500/50 text-white cursor-not-allowed'
                : isDark
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {savingOrder ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Order</span>
              </>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className={`h-8 w-8 animate-spin rounded-full border-2 ${
            isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'
          }`} />
        </div>
      ) : banners.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-32 rounded-2xl border ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}>
          <div className={`mb-6 rounded-full p-6 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <ImageIcon className={`h-12 w-12 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          </div>
          <h3 className={`text-xl font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            No banners yet
          </h3>
          <p className={`${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Get started by creating your first banner
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                      Banner Set
                    </h3>
                    
                    {/* Order Number Input */}
                    <div className="flex items-center gap-2">
                      <label className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        #
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={banner.display_order}
                        onChange={(e) => handleOrderChange(banner.id, parseInt(e.target.value) || 1)}
                        className={`w-20 px-3 py-1.5 rounded-lg text-center font-semibold text-lg transition-all ${
                          hasOrderChanges
                            ? isDark
                              ? 'bg-yellow-500/20 text-yellow-300 border-2 border-yellow-500/50 hover:bg-yellow-500/30 focus:bg-yellow-500/30'
                              : 'bg-yellow-100 text-yellow-900 border-2 border-yellow-500/50 hover:bg-yellow-200 focus:bg-yellow-200'
                            : isDark
                            ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20 focus:bg-white/20 focus:border-white/40'
                            : 'bg-black/5 text-black border border-black/20 hover:bg-black/10 focus:bg-black/10 focus:border-black/40'
                        } outline-none`}
                      />
                    </div>

                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      banner.is_active
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-500/10 text-emerald-600'
                        : isDark
                        ? 'bg-white/10 text-white/60'
                        : 'bg-black/10 text-black/60'
                    }`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </div>
                    {banner.category_id && (
                      <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {getCategoryName(banner.category_id)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {new Date(banner.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <button
                      onClick={() => handleDelete(banner)}
                      className={`p-2 rounded-full transition-colors ${
                        isDark
                          ? 'hover:bg-red-500/20 text-red-400'
                          : 'hover:bg-red-500/10 text-red-600'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { lang: 'ka', label: 'ქართული', url: banner.image_url_ka },
                    { lang: 'en', label: 'English', url: banner.image_url_en },
                    { lang: 'ru', label: 'Русский', url: banner.image_url_ru }
                  ].map((item) => (
                    <div key={item.lang} className="group relative">
                      <div className={`mb-2 text-sm font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                        {item.label}
                      </div>
                      <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: '40%' }}>
                        <Image
                          src={item.url}
                          alt={`${item.label} banner`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
                          <button
                            onClick={() => window.open(item.url, '_blank')}
                            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm text-black opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resetModal}
          />
          
          <div className={`relative w-full max-w-2xl rounded-3xl p-8 shadow-2xl ${
            isDark ? 'bg-zinc-900' : 'bg-white'
          }`}>
            <button
              onClick={resetModal}
              className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <X className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
            </button>

            <h2 className={`text-3xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              New Banner
            </h2>
            <p className={`mb-6 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Upload banner images for all three languages
            </p>

            {/* Category Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${
                isDark ? 'text-white/80' : 'text-black/80'
              }`}>
                აირჩიეთ კატეგორია (არასავალდებულო)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors text-left flex items-center justify-between ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white hover:border-white/20'
                      : 'bg-white border-black/10 text-black hover:border-black/20'
                  }`}
                >
                  <span>{getCategoryName(selectedCategoryId)}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    showCategoryDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {showCategoryDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCategoryDropdown(false)}
                    />
                    <div className={`absolute z-20 w-full mt-2 rounded-xl border overflow-hidden shadow-lg max-h-80 overflow-y-auto ${
                      isDark
                        ? 'bg-[#1c1c1e] border-white/10'
                        : 'bg-white border-black/10'
                    }`}>
                      <div
                        onClick={() => {
                          setSelectedCategoryId('')
                          setShowCategoryDropdown(false)
                        }}
                        className={`px-3 py-2 cursor-pointer transition-colors ${
                          !selectedCategoryId
                            ? isDark
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-blue-500/10 text-blue-600'
                            : isDark
                            ? 'hover:bg-white/5 text-white/80'
                            : 'hover:bg-black/5 text-black/80'
                        }`}
                      >
                        ყველა კატეგორია
                      </div>
                      {buildCategoryTree().map(category => renderCategoryTreeItem(category, 0))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex gap-2 p-1 rounded-xl" style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
              }}>
                {[
                  { value: 'ka' as const, label: 'ქართული' },
                  { value: 'en' as const, label: 'English' },
                  { value: 'ru' as const, label: 'Русский' }
                ].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setSelectedLanguage(lang.value)}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all relative ${
                      selectedLanguage === lang.value
                        ? isDark
                          ? 'bg-white text-black shadow-lg'
                          : 'bg-black text-white shadow-lg'
                        : isDark
                        ? 'text-white/60 hover:text-white/80'
                        : 'text-black/60 hover:text-black/80'
                    }`}
                  >
                    {lang.label}
                    {selectedFiles[lang.value] && (
                      <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        isDark ? 'bg-emerald-400' : 'bg-emerald-500'
                      }`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, selectedLanguage)}
                className="hidden"
                id={`banner-file-input-${selectedLanguage}`}
              />
              
              <label
                htmlFor={`banner-file-input-${selectedLanguage}`}
                className={`block cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
                  previewUrls[selectedLanguage]
                    ? 'border-transparent p-0'
                    : isDark
                    ? 'border-white/20 hover:border-white/40 p-12'
                    : 'border-black/20 hover:border-black/40 p-12'
                }`}
              >
                {previewUrls[selectedLanguage] ? (
                  <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: '40%' }}>
                    <Image
                      src={previewUrls[selectedLanguage]!}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                      isDark ? 'bg-black/50 text-white' : 'bg-white/90 text-black'
                    }`}>
                      {selectedFiles[selectedLanguage]?.name}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className={`mb-4 inline-flex rounded-full p-4 ${
                      isDark ? 'bg-white/5' : 'bg-black/5'
                    }`}>
                      <Upload className={`h-8 w-8 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                    </div>
                    <p className={`text-base font-medium mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                      Click to upload
                    </p>
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="mb-6">
              <p className={`text-sm mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                Upload progress:
              </p>
              <div className="flex gap-2">
                {[
                  { lang: 'ka' as const, label: 'ქართული' },
                  { lang: 'en' as const, label: 'English' },
                  { lang: 'ru' as const, label: 'Русский' }
                ].map((lang) => (
                  <div
                    key={lang.lang}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium text-center ${
                      selectedFiles[lang.lang]
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-500/10 text-emerald-600'
                        : isDark
                        ? 'bg-white/5 text-white/40'
                        : 'bg-black/5 text-black/40'
                    }`}
                  >
                    {lang.label} {selectedFiles[lang.lang] ? '✓' : '○'}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFiles.ka || !selectedFiles.en || !selectedFiles.ru}
              className={`w-full py-4 rounded-full font-medium transition-all ${
                uploading || !selectedFiles.ka || !selectedFiles.en || !selectedFiles.ru
                  ? isDark
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-black/10 text-black/30 cursor-not-allowed'
                  : isDark
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </span>
              ) : (
                'Upload Banner'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
