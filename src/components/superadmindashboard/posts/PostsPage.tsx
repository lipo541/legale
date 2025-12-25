'use client'

import { useState, useEffect, useCallback, useMemo, memo, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import CreatePostPage from './createpost/CreatePostPage'
import FocalPointSelector from '@/components/moderatordashboard/FocalPointSelector'
import Modal from '@/components/common/Modal'
import { 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  Plus,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Trash,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Post {
  id: string
  author_id: string
  practice_id: string | null
  display_position: number | null
  position_order: number | null
  status: 'draft' | 'published' | 'archived'
  featured_image_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  is_homepage_featured: boolean
  homepage_featured_order: number | null
  post_translations: Array<{
    id: string
    language: string
    title: string
    excerpt: string
    content: string
    category: string
    category_id: string | null
    slug: string
    meta_title?: string
    meta_description?: string
    keywords?: string
    og_title?: string
    og_description?: string
    og_image?: string
    social_hashtags?: string
    word_count?: number
    reading_time?: number
  }>
  author?: {
    email: string
    full_name?: string
  }
}

interface Category {
  id: string
  georgian: string
  english: string
  russian: string
  parent_id: string | null
  subcategories: Category[]
}

interface Author {
  id: string
  email: string
  full_name?: string
}

type SortColumn = 'created_at' | 'title' | 'author' | 'category' | 'status' | 'position'
type SortOrder = 'asc' | 'desc'

// ============================================================================
// Memoized Components
// ============================================================================

const StatsCard = memo(function StatsCard({ 
  label, 
  value, 
  isDark 
}: { 
  label: string
  value: number
  isDark: boolean 
}) {
  return (
    <div className={`rounded-lg border p-3 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
    }`}>
      <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        {value}
      </div>
      <div className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {label}
      </div>
    </div>
  )
})

const CategoryItem = memo(function CategoryItem({ 
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
  onSelect: (categoryId: string) => void
}) {
  const hasSubcategories = category.subcategories.length > 0

  return (
    <div className="space-y-0.5">
      <div 
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
          isSelected
            ? isDark
              ? 'bg-emerald-500/20 border border-emerald-500/30'
              : 'bg-emerald-500/10 border border-emerald-500/20'
            : isDark
            ? 'hover:bg-white/5 border border-transparent'
            : 'hover:bg-black/5 border border-transparent'
        }`}
        style={{ marginLeft: `${level * 10}px` }}
        onClick={() => onSelect(category.id)}
      >
        {hasSubcategories ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(category.id)
            }}
            className={`p-0.5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
          >
            <ChevronRight className={`h-2.5 w-2.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          </button>
        ) : (
          <div className="w-2.5 flex-shrink-0" />
        )}
        
        <span className={`text-[10px] flex-1 leading-tight ${
          isSelected
            ? isDark
              ? 'text-emerald-400 font-medium'
              : 'text-emerald-600 font-medium'
            : isDark
            ? 'text-white/80'
            : 'text-black/80'
        }`}>
          {category.georgian} / {category.english}
        </span>
        
        {isSelected && (
          <Check className={`h-3 w-3 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
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

// ============================================================================
// Main Component
// ============================================================================

export default function PostsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // State
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'published' | 'archived'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [authorFilter, setAuthorFilter] = useState<string>('ALL')
  const [positionFilter, setPositionFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortColumn>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  // Multi-select
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  
  // Categories & Authors
  const [categories, setCategories] = useState<Category[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  
  // Position management
  const [pendingOrderChanges, setPendingOrderChanges] = useState<Record<string, number | null>>({})
  const [showFilters, setShowFilters] = useState(true)
  
  // Focal Point
  const [focalPointModal, setFocalPointModal] = useState<{
    isOpen: boolean
    postId: string | null
    imageUrl: string
    postTitle: string
    currentFocalPoint: { x: number; y: number }
  }>({
    isOpen: false,
    postId: null,
    imageUrl: '',
    postTitle: '',
    currentFocalPoint: { x: 50, y: 50 }
  })

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

  // Helper to show modal
  const showModal = useCallback((
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm',
    message: string,
    onConfirm?: () => void
  ) => {
    setModalConfig({
      isOpen: true,
      type,
      message,
      onConfirm
    })
  }, [])

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_translations (*),
          author:profiles!posts_author_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('post_categories')
        .select(`
          id,
          parent_id,
          post_category_translations (
            language,
            name
          )
        `)
        .order('created_at', { ascending: true })

      if (error) throw error

      interface CategoryData {
        id: string
        parent_id: string | null
        post_category_translations: Array<{ language: string; name: string }>
      }

      const transformedCategories = (data || []).map((cat: CategoryData) => {
        const ka = cat.post_category_translations.find(t => t.language === 'ka')
        const en = cat.post_category_translations.find(t => t.language === 'en')
        const ru = cat.post_category_translations.find(t => t.language === 'ru')

        return {
          id: cat.id,
          parent_id: cat.parent_id,
          georgian: ka?.name || '',
          english: en?.name || '',
          russian: ru?.name || '',
          subcategories: []
        }
      })

      // Build hierarchical structure
      const categoryMap = new Map(transformedCategories.map((c: Category) => [c.id, { ...c }]))
      const rootCategories: Category[] = []

      transformedCategories.forEach((cat: Category) => {
        const category = categoryMap.get(cat.id)!
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id)
          if (parent) {
            parent.subcategories.push(category)
          }
        } else {
          rootCategories.push(category)
        }
      })

      setCategories(rootCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [supabase])

  const fetchAuthors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email', { ascending: true })

      if (error) throw error
      setAuthors(data || [])
    } catch (error) {
      console.error('Error fetching authors:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchPosts()
    fetchCategories()
    fetchAuthors()
  }, [fetchPosts, fetchCategories, fetchAuthors])

  // ============================================================================
  // Category Helper Functions
  // ============================================================================

  const findCategoryById = useCallback((categories: Category[], id: string): Category | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat
      if (cat.subcategories.length > 0) {
        const found = findCategoryById(cat.subcategories, id)
        if (found) return found
      }
    }
    return null
  }, [])

  // ============================================================================
  // Filtering & Sorting Logic
  // ============================================================================

  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts]

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(post => {
        const georgianTranslation = post.post_translations?.find(t => t.language === 'ka')
        const englishTranslation = post.post_translations?.find(t => t.language === 'en')
        const russianTranslation = post.post_translations?.find(t => t.language === 'ru')
        
        return (
          georgianTranslation?.title?.toLowerCase().includes(searchLower) ||
          englishTranslation?.title?.toLowerCase().includes(searchLower) ||
          russianTranslation?.title?.toLowerCase().includes(searchLower) ||
          georgianTranslation?.excerpt?.toLowerCase().includes(searchLower) ||
          georgianTranslation?.slug?.toLowerCase().includes(searchLower) ||
          post.author?.email?.toLowerCase().includes(searchLower) ||
          post.author?.full_name?.toLowerCase().includes(searchLower) ||
          post.id.toLowerCase().includes(searchLower)
        )
      })
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(post => post.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      const allCategoryIds = new Set<string>()
      
      // Get selected category and all its subcategories
      const collectCategoryIds = (cats: Category[]) => {
        cats.forEach(cat => {
          if (cat.id === categoryFilter) {
            allCategoryIds.add(cat.id)
            const addSubcategories = (subcats: Category[]) => {
              subcats.forEach(sub => {
                allCategoryIds.add(sub.id)
                if (sub.subcategories.length > 0) {
                  addSubcategories(sub.subcategories)
                }
              })
            }
            addSubcategories(cat.subcategories)
          }
          if (cat.subcategories.length > 0) {
            collectCategoryIds(cat.subcategories)
          }
        })
      }
      
      collectCategoryIds(categories)
      
      result = result.filter(post => {
        const georgianTranslation = post.post_translations?.find(t => t.language === 'ka')
        return georgianTranslation?.category_id && allCategoryIds.has(georgianTranslation.category_id)
      })
    }

    // Author filter
    if (authorFilter !== 'ALL') {
      result = result.filter(post => post.author_id === authorFilter)
    }

    // Position filter
    if (positionFilter !== 'ALL') {
      if (positionFilter === 'NONE') {
        result = result.filter(post => post.display_position === null)
      } else {
        result = result.filter(post => post.display_position === parseInt(positionFilter))
      }
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(post => new Date(post.created_at) >= new Date(dateFrom))
    }
    if (dateTo) {
      result = result.filter(post => new Date(post.created_at) <= new Date(dateTo))
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'title':
          aValue = a.post_translations?.find(t => t.language === 'ka')?.title || ''
          bValue = b.post_translations?.find(t => t.language === 'ka')?.title || ''
          break
        case 'author':
          aValue = a.author?.full_name || a.author?.email || ''
          bValue = b.author?.full_name || b.author?.email || ''
          break
        case 'category':
          const aCat = a.post_translations?.find(t => t.language === 'ka')?.category_id || ''
          const bCat = b.post_translations?.find(t => t.language === 'ka')?.category_id || ''
          const aCatName = aCat ? (findCategoryById(categories, aCat)?.georgian || '') : ''
          const bCatName = bCat ? (findCategoryById(categories, bCat)?.georgian || '') : ''
          aValue = aCatName
          bValue = bCatName
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'position':
          aValue = a.display_position ?? 999
          bValue = b.display_position ?? 999
          if (aValue === bValue) {
            aValue = a.position_order ?? 999
            bValue = b.position_order ?? 999
          }
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue)
      }

      // Type guard for number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return result
  }, [posts, searchTerm, statusFilter, categoryFilter, authorFilter, positionFilter, dateFrom, dateTo, sortBy, sortOrder, categories, findCategoryById])

  // Pagination
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedPosts.slice(startIndex, endIndex)
  }, [filteredAndSortedPosts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedPosts.length / itemsPerPage)

  // Authors with posts
  const authorsWithPosts = useMemo(() => {
    const authorIds = new Set(posts.map(p => p.author_id))
    return authors
      .filter(author => authorIds.has(author.id))
      .sort((a, b) => {
        const aName = a.full_name || a.email
        const bName = b.full_name || b.email
        return aName.localeCompare(bName)
      })
  }, [posts, authors])

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }, [sortBy, sortOrder])

  const handleSelectAll = useCallback(() => {
    if (selectedPosts.size === paginatedPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(paginatedPosts.map(p => p.id)))
    }
  }, [selectedPosts.size, paginatedPosts])

  const handleSelectPost = useCallback((postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }, [selectedPosts])

  const handleBulkDelete = useCallback(async () => {
    if (selectedPosts.size === 0) return
    
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedPosts.size} პოსტის წაშლა?`, async () => {
      try {
        for (const postId of selectedPosts) {
          await supabase.from('posts').delete().eq('id', postId)
        }
        
        setPosts(posts.filter(p => !selectedPosts.has(p.id)))
        setSelectedPosts(new Set())
        showModal('success', `${selectedPosts.size} პოსტი წარმატებით წაიშალა`)
      } catch (error) {
        console.error('Error bulk deleting:', error)
        showModal('error', 'შეცდომა წაშლისას')
      }
    })
  }, [selectedPosts, posts, supabase, showModal])

  const handleBulkStatusChange = useCallback(async (newStatus: Post['status']) => {
    if (selectedPosts.size === 0) return

    try {
      for (const postId of selectedPosts) {
        await supabase.from('posts').update({ status: newStatus }).eq('id', postId)
      }
      
      setPosts(posts.map(p => 
        selectedPosts.has(p.id) ? { ...p, status: newStatus } : p
      ))
      setSelectedPosts(new Set())
      showModal('success', `${selectedPosts.size} პოსტის სტატუსი შეიცვალა`)
    } catch (error) {
      console.error('Error bulk status change:', error)
      showModal('error', 'შეცდომა სტატუსის შეცვლისას')
    }
  }, [selectedPosts, posts, supabase, showModal])

  const handleDelete = useCallback(async (postId: string) => {
    showModal('confirm', 'დარწმუნებული ხართ რომ გსურთ პოსტის წაშლა?', async () => {
      try {
        const postToDelete = posts.find(p => p.id === postId)
        
        if (postToDelete?.featured_image_url) {
          const urlParts = postToDelete.featured_image_url.split('/post-images/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1]
            await supabase.storage.from('post-images').remove([filePath])
          }
        }

        const { error } = await supabase.from('posts').delete().eq('id', postId)
        if (error) throw error

        setPosts(posts.filter(p => p.id !== postId))
        showModal('success', 'პოსტი წარმატებით წაიშალა')
      } catch (error) {
        console.error('Error deleting post:', error)
        showModal('error', 'შეცდომა პოსტის წაშლისას')
      }
    })
  }, [posts, supabase, showModal])

  const handleStatusChange = useCallback(async (postId: string, newStatus: Post['status']) => {
    try {
      const { error } = await supabase.from('posts').update({ status: newStatus }).eq('id', postId)
      if (error) throw error

      setPosts(posts.map(p => p.id === postId ? { ...p, status: newStatus } : p))
    } catch (error) {
      console.error('Error updating status:', error)
      showModal('error', 'შეცდომა სტატუსის შეცვლისას')
    }
  }, [posts, supabase, showModal])

  const handlePositionChange = useCallback(async (postId: string, newPosition: string) => {
    try {
      const positionValue = newPosition === '' || newPosition === 'null' ? null : parseInt(newPosition)

      if (positionValue !== null && (positionValue < 1 || positionValue > 10)) {
        showModal('warning', 'პოზიცია უნდა იყოს 1-დან 10-მდე')
        return
      }

      if (positionValue === 1) {
        const post = posts.find(p => p.id === postId)
        if (!post || !post.featured_image_url) {
          showModal('error', 'პოსტს არ აქვს სურათი')
          return
        }

        const georgianTranslation = post.post_translations.find(t => t.language === 'ka')
        const focalPoint = await fetchFocalPoint(postId)

        setFocalPointModal({
          isOpen: true,
          postId,
          imageUrl: post.featured_image_url,
          postTitle: georgianTranslation?.title || 'უსათაურო',
          currentFocalPoint: focalPoint
        })
        return
      }

      const { error } = await supabase.from('posts').update({ display_position: positionValue }).eq('id', postId)
      if (error) throw error

      setPosts(posts.map(p => p.id === postId ? { ...p, display_position: positionValue } : p))
      fetchPosts()
    } catch (error) {
      console.error('Error updating position:', error)
      showModal('error', 'შეცდომა პოზიციის შეცვლისას')
    }
  }, [posts, supabase, fetchPosts, showModal])

  const fetchFocalPoint = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_display_settings')
        .select('focal_point_x, focal_point_y')
        .eq('post_id', postId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data ? { x: data.focal_point_x, y: data.focal_point_y } : { x: 50, y: 50 }
    } catch (error) {
      console.error('Error fetching focal point:', error)
      return { x: 50, y: 50 }
    }
  }

  const handleFocalPointSave = useCallback(async (x: number, y: number) => {
    if (!focalPointModal.postId) return

    try {
      await supabase.from('post_display_settings').upsert(
        { post_id: focalPointModal.postId, focal_point_x: x, focal_point_y: y },
        { onConflict: 'post_id' }
      )

      const { error } = await supabase.from('posts').update({ display_position: 1 }).eq('id', focalPointModal.postId)
      if (error) throw error

      setPosts(posts.map(p => p.id === focalPointModal.postId ? { ...p, display_position: 1 } : p))
      showModal('success', 'Focal Point და პოზიცია შენახულია')
      fetchPosts()
    } catch (error) {
      console.error('Error saving focal point:', error)
      throw error
    }
  }, [focalPointModal.postId, posts, supabase, fetchPosts, showModal])

  const handlePositionOrderChange = useCallback((postId: string, newOrder: string) => {
    const orderValue = newOrder === '' ? null : parseInt(newOrder)
    setPendingOrderChanges(prev => ({ ...prev, [postId]: orderValue }))
  }, [])

  const savePositionOrder = useCallback(async (postId: string) => {
    try {
      const orderValue = pendingOrderChanges[postId]
      const { error } = await supabase.from('posts').update({ position_order: orderValue }).eq('id', postId)
      if (error) throw error

      setPosts(posts.map(p => p.id === postId ? { ...p, position_order: orderValue } : p))
      setPendingOrderChanges(prev => {
        const newPending = { ...prev }
        delete newPending[postId]
        return newPending
      })
      
      fetchPosts()
    } catch (error) {
      console.error('Error updating position order:', error)
      showModal('error', 'შეცდომა რიგითობის შეცვლისას')
    }
  }, [pendingOrderChanges, posts, supabase, fetchPosts, showModal])

  const cancelPositionOrderChange = useCallback((postId: string) => {
    setPendingOrderChanges(prev => {
      const newPending = { ...prev }
      delete newPending[postId]
      return newPending
    })
  }, [])

  // Homepage Featured Toggle Handler
  const handleToggleHomepageFeatured = useCallback(async (postId: string, currentStatus: boolean) => {
    try {
      // Check current featured count if trying to add
      if (!currentStatus) {
        const featuredCount = posts.filter(p => p.is_homepage_featured).length
        if (featuredCount >= 8) {
          showModal('error', 'მაქსიმუმ 8 Featured პოსტი შესაძლებელია')
          return
        }
      }

      const newStatus = !currentStatus
      const { error } = await supabase
        .from('posts')
        .update({ is_homepage_featured: newStatus })
        .eq('id', postId)

      if (error) throw error

      // Update local state immediately
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { 
            ...p, 
            is_homepage_featured: newStatus,
            homepage_featured_order: newStatus 
              ? Math.max(...posts.filter(x => x.is_homepage_featured).map(x => x.homepage_featured_order || 0), 0) + 1 
              : null
          }
        }
        return p
      }))
      
      showModal('success', newStatus ? 'პოსტი დაემატა მთავარ გვერდზე' : 'პოსტი წაიშალა მთავარი გვერდიდან')
      fetchPosts()
    } catch (error) {
      console.error('Error toggling homepage featured:', error)
      showModal('error', 'შეცდომა Featured სტატუსის შეცვლისას')
    }
  }, [posts, supabase, fetchPosts, showModal])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setCategoryFilter('ALL')
    setAuthorFilter('ALL')
    setPositionFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
    setCategorySearchTerm('')
  }, [])

  // ============================================================================
  // Category Helper Functions
  // ============================================================================

  const toggleCategoryExpand = useCallback((categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  const handleCategorySelect = useCallback((categoryId: string) => {
    setCategoryFilter(categoryId)
    setIsCategoryDropdownOpen(false)
    setCategorySearchTerm('')
    setCurrentPage(1)
  }, [])

  const filterCategories = useCallback((categories: Category[], searchTerm: string): Category[] => {
    if (!searchTerm.trim()) return categories

    const search = searchTerm.toLowerCase()
    const filtered: Category[] = []

    const filterCategory = (cat: Category): Category | null => {
      const matchesSearch = 
        cat.georgian.toLowerCase().includes(search) ||
        cat.english.toLowerCase().includes(search) ||
        cat.russian.toLowerCase().includes(search)

      const filteredSubs = cat.subcategories
        .map(sub => filterCategory(sub))
        .filter((sub): sub is Category => sub !== null)

      if (matchesSearch || filteredSubs.length > 0) {
        return {
          ...cat,
          subcategories: filteredSubs
        }
      }

      return null
    }

    categories.forEach(cat => {
      const filtered_cat = filterCategory(cat)
      if (filtered_cat) filtered.push(filtered_cat)
    })

    return filtered
  }, [])

  // ============================================================================
  // Render Functions
  // ============================================================================

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-40" />
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  if (showCreatePost) {
    return <CreatePostPage onCancel={() => { setShowCreatePost(false); fetchPosts() }} />
  }

  if (editingPostId) {
    const postToEdit = posts.find(p => p.id === editingPostId)
    if (postToEdit) {
      return (
        <CreatePostPage 
          onCancel={() => { setEditingPostId(null); fetchPosts() }} 
          editMode={true}
          postData={postToEdit}
        />
      )
    }
  }

  return (
    <div className={`min-h-screen p-4 transition-colors ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              პოსტების მართვა
            </h1>
            <p className={`mt-1 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სრული კონტროლი ყველა პოსტზე
            </p>
          </div>
          
          <button
            onClick={() => setShowCreatePost(true)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            ახალი პოსტი
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
          <StatsCard label="სულ პოსტი" value={posts.length} isDark={isDark} />
          <StatsCard label="Draft" value={posts.filter(p => p.status === 'draft').length} isDark={isDark} />
          <StatsCard label="Published" value={posts.filter(p => p.status === 'published').length} isDark={isDark} />
          <StatsCard label="Archived" value={posts.filter(p => p.status === 'archived').length} isDark={isDark} />
          <StatsCard label="პოზიციებზე" value={posts.filter(p => p.display_position !== null).length} isDark={isDark} />
          <StatsCard label="ნაპოვნი" value={filteredAndSortedPosts.length} isDark={isDark} />
        </div>

        {/* Filters Toggle */}
        <div className="mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-black/5 hover:bg-black/10'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showFilters ? 'ფილტრების დამალვა' : 'ფილტრების ჩვენება'}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className={`mb-4 rounded-xl border p-3 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className={`absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`} />
                <input
                  type="text"
                  placeholder="ძებნა სათაურით, ავტორით, ID-ით..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-lg border py-1.5 pl-8 pr-3 text-[10px] transition-colors ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                      : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
                  }`}
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`w-full rounded-lg border px-2 py-1 text-[10px] transition-colors text-left flex items-center justify-between ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                >
                  <span className="truncate text-[10px]">
                    {categoryFilter === 'ALL' 
                      ? 'ყველა კატეგორია' 
                      : findCategoryById(categories, categoryFilter)?.georgian || 'არჩეული კატეგორია'
                    }
                  </span>
                  <ChevronDown className={`h-3 w-3 flex-shrink-0 ml-1 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsCategoryDropdownOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className={`absolute left-0 top-full mt-1 z-20 max-h-[450px] w-full min-w-[280px] max-w-[95vw] md:min-w-[400px] md:max-w-[500px] overflow-hidden rounded-lg border shadow-xl ${
                      isDark ? 'border-white/10 bg-zinc-900' : 'border-black/10 bg-white'
                    }`}>
                      {/* Search */}
                      <div className={`sticky top-0 p-2 border-b ${isDark ? 'border-white/10 bg-zinc-900' : 'border-black/10 bg-white'}`}>
                        <div className="relative">
                          <Search className={`absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 ${
                            isDark ? 'text-white/40' : 'text-black/40'
                          }`} />
                          <input
                            type="text"
                            placeholder="ძებნა კატეგორიაში..."
                            value={categorySearchTerm}
                            onChange={(e) => setCategorySearchTerm(e.target.value)}
                            className={`w-full rounded-md border py-1 pl-7 pr-2 text-[10px] ${
                              isDark 
                                ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                                : 'border-black/10 bg-white text-black placeholder:text-black/40'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Categories List */}
                      <div className="p-2 overflow-y-auto max-h-[380px]">
                        {/* Hierarchical Categories */}
                        <div className="space-y-0.5">
                          {filterCategories(categories, categorySearchTerm).map(cat => (
                            <CategoryItem
                              key={cat.id}
                              category={cat}
                              level={0}
                              isExpanded={expandedCategories.includes(cat.id)}
                              isSelected={categoryFilter === cat.id}
                              isDark={isDark}
                              expandedCategories={expandedCategories}
                              onToggle={toggleCategoryExpand}
                              onSelect={handleCategorySelect}
                            />
                          ))}
                        </div>

                        {/* All Categories Option */}
                        <div
                          onClick={() => handleCategorySelect('ALL')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer mt-2 ${
                            categoryFilter === 'ALL'
                              ? isDark
                                ? 'bg-emerald-500/20 border border-emerald-500/30'
                                : 'bg-emerald-500/10 border border-emerald-500/20'
                              : isDark
                              ? 'hover:bg-white/5 border border-transparent'
                              : 'hover:bg-black/5 border border-transparent'
                          }`}
                        >
                          <span className={`text-[10px] flex-1 ${
                            categoryFilter === 'ALL'
                              ? isDark ? 'text-emerald-400 font-medium' : 'text-emerald-600 font-medium'
                              : isDark ? 'text-white/80' : 'text-black/80'
                          }`}>
                            ყველა კატეგორია
                          </span>
                          {categoryFilter === 'ALL' && (
                            <Check className={`h-3 w-3 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          )}
                        </div>

                        {filterCategories(categories, categorySearchTerm).length === 0 && (
                          <div className={`text-[10px] text-center py-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                            კატეგორია ვერ მოიძებნა
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  <option value="draft" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Draft</option>
                  <option value="published" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Published</option>
                  <option value="archived" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Archived</option>
                  <option value="ALL" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>ყველა სტატუსი</option>
                </select>
              </div>

              {/* Author Filter */}
              <div>
                <select
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  <option value="ALL" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>ყველა ავტორი</option>
                  {authorsWithPosts.map(author => (
                    <option key={author.id} value={author.id} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>
                      {author.full_name || author.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  <option value="ALL" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>ყველა პოზიცია</option>
                  <option value="NONE" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>პოზიციის გარეშე</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pos => (
                    <option key={pos} value={pos} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position {pos}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                />
              </div>

              {/* Date To */}
              <div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                />
              </div>

              {/* Clear Filters */}
              <div>
                <button
                  onClick={clearFilters}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                    isDark 
                      ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <RefreshCw className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedPosts.size > 0 && (
          <div className={`mb-3 flex items-center gap-2 rounded-lg border p-2 ${
            isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-500/30 bg-blue-500/10'
          }`}>
            <span className="text-[10px] font-medium text-blue-500">
              არჩეულია: {selectedPosts.size}
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-500/20"
            >
              <Trash className="h-3 w-3" />
              წაშლა
            </button>
            <button
              onClick={() => handleBulkStatusChange('published')}
              className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-500 hover:bg-green-500/20"
            >
              Published
            </button>
            <button
              onClick={() => handleBulkStatusChange('draft')}
              className="flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-[10px] font-medium text-yellow-500 hover:bg-yellow-500/20"
            >
              Draft
            </button>
            <button
              onClick={() => handleBulkStatusChange('archived')}
              className="flex items-center gap-1 rounded-md bg-gray-500/10 px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-500/20"
            >
              Archived
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              იტვირთება...
            </div>
          </div>
        ) : filteredAndSortedPosts.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <FileText className={`mx-auto mb-2 h-8 w-8 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              პოსტები არ მოიძებნა
            </p>
          </div>
        ) : (
          <>
            <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                    <tr>
                      <th className="px-2 py-2">
                        <button onClick={handleSelectAll}>
                          {selectedPosts.size === paginatedPosts.length ? (
                            <CheckSquare className="h-3.5 w-3.5" />
                          ) : (
                            <Square className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('title')}>
                          სათაური
                          <SortIcon column="title" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('author')}>
                          ავტორი
                          <SortIcon column="author" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('category')}>
                          კატეგორია
                          <SortIcon column="category" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('status')}>
                          სტატუსი
                          <SortIcon column="status" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('position')}>
                          პოზ.
                          <SortIcon column="position" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        რიგ.
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <span title="Homepage Featured">🏠</span>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('created_at')}>
                          თარიღი
                          <SortIcon column="created_at" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        მოქმედებები
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-black/10'}`}>
                    {paginatedPosts.map((post) => {
                      const isExpanded = expandedPostId === post.id
                      const georgianTranslation = post.post_translations?.find(t => t.language === 'ka')
                      const categoryId = georgianTranslation?.category_id
                      const category = categoryId ? findCategoryById(categories, categoryId) : null
                      
                      return (
                        <Fragment key={post.id}>
                          <tr className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                            <td className="px-2 py-2">
                              <button onClick={() => handleSelectPost(post.id)}>
                                {selectedPosts.has(post.id) ? (
                                  <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                  <Square className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1.5 max-w-[200px]">
                                {post.featured_image_url && (
                                  <img 
                                    src={post.featured_image_url} 
                                    alt="" 
                                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                                  />
                                )}
                                <span className={`text-[10px] truncate ${isDark ? 'text-white' : 'text-black'}`}>
                                  {georgianTranslation?.title || 'უსათაურო'}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                                {post.author?.full_name || post.author?.email || 'უცნობი'}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                                {category ? category.georgian : '-'}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={post.status}
                                onChange={(e) => handleStatusChange(post.id, e.target.value as Post['status'])}
                                className={`w-full max-w-[90px] rounded-md border px-1.5 py-1 text-[10px] font-medium ${
                                  post.status === 'published'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/30'
                                    : post.status === 'draft'
                                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                    : 'bg-gray-500/10 text-gray-500 border-gray-500/30'
                                }`}
                                style={isDark ? { colorScheme: 'dark' } : {}}
                              >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={post.display_position ?? 'null'}
                                onChange={(e) => handlePositionChange(post.id, e.target.value)}
                                className={`w-full max-w-[80px] rounded-md border px-1.5 py-1 text-[10px] ${
                                  post.display_position
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                    : isDark
                                    ? 'bg-white/5 text-white/70 border-white/10'
                                    : 'bg-black/5 text-black/70 border-black/10'
                                }`}
                                style={isDark ? { colorScheme: 'dark' } : {}}
                              >
                                <option value="null">-</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pos => (
                                  <option key={pos} value={pos}>Pos {pos}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={
                                    pendingOrderChanges[post.id] !== undefined 
                                      ? (pendingOrderChanges[post.id] ?? '') 
                                      : (post.position_order ?? '')
                                  }
                                  onChange={(e) => handlePositionOrderChange(post.id, e.target.value)}
                                  placeholder="-"
                                  min="0"
                                  className={`w-12 rounded-md border px-1.5 py-1 text-[10px] ${
                                    pendingOrderChanges[post.id] !== undefined
                                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                      : isDark
                                      ? 'bg-white/5 text-white border-white/10'
                                      : 'bg-black/5 text-black border-black/10'
                                  }`}
                                />
                                {pendingOrderChanges[post.id] !== undefined && (
                                  <div className="flex gap-0.5">
                                    <button
                                      onClick={() => savePositionOrder(post.id)}
                                      className="rounded-md bg-green-500/10 p-1 text-green-500 border border-green-500/30"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => cancelPositionOrderChange(post.id)}
                                      className="rounded-md bg-red-500/10 p-1 text-red-500 border border-red-500/30"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <button
                                onClick={() => handleToggleHomepageFeatured(post.id, post.is_homepage_featured)}
                                className={`
                                  relative w-8 h-4 rounded-full transition-colors
                                  ${post.is_homepage_featured 
                                    ? 'bg-yellow-500' 
                                    : isDark ? 'bg-white/20' : 'bg-black/20'
                                  }
                                `}
                                title={post.is_homepage_featured 
                                  ? `Featured #${post.homepage_featured_order}` 
                                  : 'Not featured'
                                }
                              >
                                <div className={`
                                  absolute top-0.5 w-3 h-3 rounded-full transition-transform
                                  ${post.is_homepage_featured 
                                    ? 'translate-x-4 bg-white' 
                                    : 'translate-x-0.5 bg-white'
                                  }
                                `} />
                              </button>
                              {post.is_homepage_featured && post.homepage_featured_order && (
                                <span className="ml-1 text-[9px] font-bold text-yellow-500">
                                  #{post.homepage_featured_order}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                                {new Date(post.created_at).toLocaleDateString('ka-GE')}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                  className={`rounded-md p-1 transition-colors ${
                                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                  }`}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingPostId(post.id)}
                                  className={`rounded-md p-1 transition-colors ${
                                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                  }`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(post.id)}
                                  className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className={`px-3 py-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div>
                                      <span className={isDark ? 'text-white/40' : 'text-black/40'}>Post ID:</span>
                                      <span className={`ml-1 font-mono ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {post.id}
                                      </span>
                                    </div>
                                    <div>
                                      <span className={isDark ? 'text-white/40' : 'text-black/40'}>Slug:</span>
                                      <span className={`ml-1 font-mono ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {georgianTranslation?.slug}
                                      </span>
                                    </div>
                                  </div>
                                  {post.featured_image_url && (
                                    <img 
                                      src={post.featured_image_url} 
                                      alt="Featured" 
                                      className="h-32 w-48 rounded-lg object-cover"
                                    />
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className={`mt-3 flex items-center justify-between rounded-lg border p-2 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">თითო გვერდზე:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className={`rounded-md border px-2 py-1 text-[10px] ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  <option value={10} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>10</option>
                  <option value={25} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>25</option>
                  <option value={50} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>50</option>
                  <option value={100} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`rounded-md border px-2 py-1 text-[10px] ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  წინა
                </button>
                <span className="text-[10px]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`rounded-md border px-2 py-1 text-[10px] ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  შემდეგი
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Focal Point Modal */}
      <FocalPointSelector
        isOpen={focalPointModal.isOpen}
        onClose={() => setFocalPointModal({ ...focalPointModal, isOpen: false })}
        imageUrl={focalPointModal.imageUrl}
        postTitle={focalPointModal.postTitle}
        currentFocalPoint={focalPointModal.currentFocalPoint}
        onSave={handleFocalPointSave}
      />

      {/* General Modal */}
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
