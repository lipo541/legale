'use client'

import { useState, useEffect, useCallback, useMemo, memo, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import PracticeAdd from './PracticeAdd'
import Modal from '@/components/common/Modal'
import { 
  Scale,
  Eye, 
  Edit, 
  Trash2, 
  Search,
  Plus,
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
  Globe,
  ExternalLink,
  Loader2
} from 'lucide-react'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

type Language = 'ka' | 'en' | 'ru'

interface Practice {
  id: string
  hero_image_url: string
  page_hero_image_url: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
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
  word_count: number
  reading_time: number
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  social_hashtags: string | null
}

interface PracticeWithTranslations extends Practice {
  practice_translations: PracticeTranslation[]
}

type SortColumn = 'created_at' | 'title' | 'status' | 'updated_at'
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

// Translation Status Indicator Component
const TranslationStatus = memo(function TranslationStatus({
  translations,
  isDark
}: {
  translations: PracticeTranslation[]
  isDark: boolean
}) {
  const languages: Language[] = ['ka', 'en', 'ru']
  const flags: Record<Language, string> = { ka: '🇬🇪', en: '🇬🇧', ru: '🇷🇺' }

  return (
    <div className="flex items-center gap-0.5">
      {languages.map(lang => {
        const hasTranslation = translations.some(t => t.language === lang && t.title?.trim())
        return (
          <span
            key={lang}
            className={`text-[10px] ${hasTranslation ? 'opacity-100' : 'opacity-30'}`}
            title={hasTranslation ? `${lang.toUpperCase()} თარგმნილია` : `${lang.toUpperCase()} არ არის თარგმნილი`}
          >
            {flags[lang]}
          </span>
        )
      })}
    </div>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export default function PracticesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // State
  const [practices, setPractices] = useState<PracticeWithTranslations[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPractice, setEditingPractice] = useState<PracticeWithTranslations | null>(null)
  const [expandedPracticeId, setExpandedPracticeId] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'published'>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortColumn>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  // Multi-select
  const [selectedPractices, setSelectedPractices] = useState<Set<string>>(new Set())
  
  // UI State
  const [showFilters, setShowFilters] = useState(true)

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

  const fetchPractices = useCallback(async () => {
    setLoading(true)
    try {
      const { data: practicesWithTranslations, error: practicesError } = await supabase
        .from('practices')
        .select(`
          id, hero_image_url, page_hero_image_url, status, created_at, updated_at,
          practice_translations(*)
        `)
        .order('created_at', { ascending: false })

      if (practicesError) throw practicesError

      setPractices(practicesWithTranslations as PracticeWithTranslations[])
    } catch (error) {
      console.error('Error fetching practices:', error)
      showModal('error', 'შეცდომა პრაქტიკების ჩატვირთვისას')
    } finally {
      setLoading(false)
    }
  }, [supabase, showModal])

  useEffect(() => {
    fetchPractices()
  }, [fetchPractices])

  // ============================================================================
  // Filtering & Sorting Logic
  // ============================================================================

  const filteredAndSortedPractices = useMemo(() => {
    let result = [...practices]

    // Search filter (multi-language)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(practice => {
        const kaTranslation = practice.practice_translations?.find(t => t.language === 'ka')
        const enTranslation = practice.practice_translations?.find(t => t.language === 'en')
        const ruTranslation = practice.practice_translations?.find(t => t.language === 'ru')
        
        return (
          kaTranslation?.title?.toLowerCase().includes(searchLower) ||
          enTranslation?.title?.toLowerCase().includes(searchLower) ||
          ruTranslation?.title?.toLowerCase().includes(searchLower) ||
          kaTranslation?.slug?.toLowerCase().includes(searchLower) ||
          enTranslation?.slug?.toLowerCase().includes(searchLower) ||
          practice.id.toLowerCase().includes(searchLower)
        )
      })
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(practice => practice.status === statusFilter)
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(practice => new Date(practice.created_at) >= new Date(dateFrom))
    }
    if (dateTo) {
      result = result.filter(practice => new Date(practice.created_at) <= new Date(dateTo))
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'title':
          aValue = a.practice_translations?.find(t => t.language === 'ka')?.title || ''
          bValue = b.practice_translations?.find(t => t.language === 'ka')?.title || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
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

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return result
  }, [practices, searchTerm, statusFilter, dateFrom, dateTo, sortBy, sortOrder])

  // Pagination
  const paginatedPractices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedPractices.slice(startIndex, endIndex)
  }, [filteredAndSortedPractices, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedPractices.length / itemsPerPage)

  // Stats
  const stats = useMemo(() => {
    const needsTranslation = practices.filter(p => {
      const hasKa = p.practice_translations.some(t => t.language === 'ka' && t.title?.trim())
      const hasEn = p.practice_translations.some(t => t.language === 'en' && t.title?.trim())
      const hasRu = p.practice_translations.some(t => t.language === 'ru' && t.title?.trim())
      return hasKa && (!hasEn || !hasRu)
    }).length

    return {
      total: practices.length,
      published: practices.filter(p => p.status === 'published').length,
      draft: practices.filter(p => p.status === 'draft').length,
      needsTranslation,
      filtered: filteredAndSortedPractices.length
    }
  }, [practices, filteredAndSortedPractices])

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
    if (selectedPractices.size === paginatedPractices.length) {
      setSelectedPractices(new Set())
    } else {
      setSelectedPractices(new Set(paginatedPractices.map(p => p.id)))
    }
  }, [selectedPractices.size, paginatedPractices])

  const handleSelectPractice = useCallback((practiceId: string) => {
    const newSelected = new Set(selectedPractices)
    if (newSelected.has(practiceId)) {
      newSelected.delete(practiceId)
    } else {
      newSelected.add(practiceId)
    }
    setSelectedPractices(newSelected)
  }, [selectedPractices])

  const handleBulkDelete = useCallback(async () => {
    if (selectedPractices.size === 0) return
    
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedPractices.size} პრაქტიკის წაშლა?`, async () => {
      try {
        for (const practiceId of selectedPractices) {
          await supabase.from('practices').delete().eq('id', practiceId)
        }
        
        setPractices(practices.filter(p => !selectedPractices.has(p.id)))
        setSelectedPractices(new Set())
        showModal('success', `${selectedPractices.size} პრაქტიკა წარმატებით წაიშალა`)
      } catch (error) {
        console.error('Error bulk deleting:', error)
        showModal('error', 'შეცდომა წაშლისას')
      }
    })
  }, [selectedPractices, practices, supabase, showModal])

  const handleBulkStatusChange = useCallback(async (newStatus: Practice['status']) => {
    if (selectedPractices.size === 0) return

    try {
      for (const practiceId of selectedPractices) {
        await supabase.from('practices').update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        }).eq('id', practiceId)
      }
      
      setPractices(practices.map(p => 
        selectedPractices.has(p.id) ? { ...p, status: newStatus } : p
      ))
      setSelectedPractices(new Set())
      showModal('success', `${selectedPractices.size} პრაქტიკის სტატუსი შეიცვალა`)
    } catch (error) {
      console.error('Error bulk status change:', error)
      showModal('error', 'შეცდომა სტატუსის შეცვლისას')
    }
  }, [selectedPractices, practices, supabase, showModal])

  const handleDelete = useCallback(async (practiceId: string) => {
    showModal('confirm', 'დარწმუნებული ხართ რომ გსურთ პრაქტიკის წაშლა?', async () => {
      try {
        const { error } = await supabase.from('practices').delete().eq('id', practiceId)
        if (error) throw error

        setPractices(practices.filter(p => p.id !== practiceId))
        showModal('success', 'პრაქტიკა წარმატებით წაიშალა')
      } catch (error) {
        console.error('Error deleting practice:', error)
        showModal('error', 'შეცდომა პრაქტიკის წაშლისას')
      }
    })
  }, [practices, supabase, showModal])

  const handleStatusChange = useCallback(async (practiceId: string, newStatus: Practice['status']) => {
    try {
      const { error } = await supabase.from('practices').update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      }).eq('id', practiceId)
      if (error) throw error

      setPractices(practices.map(p => p.id === practiceId ? { ...p, status: newStatus } : p))
    } catch (error) {
      console.error('Error updating status:', error)
      showModal('error', 'შეცდომა სტატუსის შეცვლისას')
    }
  }, [practices, supabase, showModal])

  const handleEdit = useCallback(async (practice: PracticeWithTranslations) => {
    const { data: freshTranslations } = await supabase
      .from('practice_translations')
      .select('*')
      .eq('practice_id', practice.id)

    const freshPractice = {
      ...practice,
      practice_translations: freshTranslations || []
    }

    setEditingPractice(freshPractice)
    setShowAddForm(true)
  }, [supabase])

  const handleView = useCallback((practice: PracticeWithTranslations) => {
    const kaTranslation = practice.practice_translations.find(t => t.language === 'ka')
    if (kaTranslation?.slug) {
      window.open(`/ka/practices/${kaTranslation.slug}`, '_blank')
    }
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
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

  // Show Add/Edit Form
  if (showAddForm) {
    return (
      <PracticeAdd 
        onBack={() => {
          setShowAddForm(false)
          setEditingPractice(null)
          fetchPractices()
        }}
        editData={editingPractice}
      />
    )
  }

  return (
    <div className={`min-h-full px-4 sm:px-6 lg:px-8 py-4 ${isDark ? 'text-white' : 'text-black'}`}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title with Icon */}
          <div className="flex items-center gap-3">
            <div className={`relative p-2.5 rounded-xl ${
              isDark 
                ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' 
                : 'bg-gradient-to-br from-purple-500/10 to-blue-500/10'
            }`}>
              <Scale className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              {stats.draft > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[7px] text-white font-bold items-center justify-center">
                    {stats.draft}
                  </span>
                </span>
              )}
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                პრაქტიკები
              </h1>
              <p className={`text-[10px] flex items-center gap-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${stats.published > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {stats.published} გამოქვეყნებული
                </span>
                <span className={isDark ? 'text-white/20' : 'text-black/20'}>•</span>
                <span>იურიდიული პრაქტიკების მართვა</span>
              </p>
            </div>
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="group flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
            <span className="hidden sm:inline">ახალი</span>
            <span className="sm:hidden">დამატება</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatsCard label="სულ პრაქტიკა" value={stats.total} isDark={isDark} />
        <StatsCard label="Published" value={stats.published} isDark={isDark} />
        <StatsCard label="Draft" value={stats.draft} isDark={isDark} />
        <StatsCard label="თარგმანი საჭირო" value={stats.needsTranslation} isDark={isDark} />
        <StatsCard label="ნაპოვნი" value={stats.filtered} isDark={isDark} />
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className={`absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`} />
              <input
                type="text"
                placeholder="ძებნა სათაურით, Slug-ით, ID-ით..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg border py-1.5 pl-8 pr-3 text-[10px] transition-colors ${
                  isDark 
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                    : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
                }`}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className={`w-full appearance-none cursor-pointer rounded-lg border px-3 py-1.5 pr-7 text-[10px] font-medium transition-colors focus:outline-none ${
                  isDark 
                    ? 'border-white/10 bg-zinc-800 text-white hover:bg-zinc-700' 
                    : 'border-black/10 bg-white text-black hover:bg-gray-50'
                }`}
              >
                <option value="ALL">ყველა სტატუსი</option>
                <option value="published">✅ Published</option>
                <option value="draft">⏸️ Draft</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                  isDark ? 'border-white/10 bg-zinc-800 text-white' : 'border-black/10 bg-white text-black'
                }`}
                style={isDark ? { colorScheme: 'dark' } : {}}
              />
            </div>

            {/* Date To + Clear */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                  isDark ? 'border-white/10 bg-zinc-800 text-white' : 'border-black/10 bg-white text-black'
                }`}
                style={isDark ? { colorScheme: 'dark' } : {}}
              />
              <button
                onClick={clearFilters}
                className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  isDark 
                    ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                    : 'border-black/10 bg-black/5 hover:bg-black/10'
                }`}
                title="ფილტრების გასუფთავება"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedPractices.size > 0 && (
        <div className={`mb-3 flex items-center gap-2 rounded-lg border p-2 ${
          isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-500/30 bg-blue-500/10'
        }`}>
          <span className="text-[10px] font-medium text-blue-500">
            არჩეულია: {selectedPractices.size}
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
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className={`h-6 w-6 animate-spin mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>იტვირთება...</span>
        </div>
      ) : filteredAndSortedPractices.length === 0 ? (
        <div className={`rounded-xl border p-8 text-center ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}>
          <Scale className={`mx-auto mb-2 h-8 w-8 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            პრაქტიკები არ მოიძებნა
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
                        {selectedPractices.size === paginatedPractices.length ? (
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
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        თარგმანი
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
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('created_at')}>
                        შექმნა
                        <SortIcon column="created_at" />
                      </div>
                    </th>
                    <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('updated_at')}>
                        განახლება
                        <SortIcon column="updated_at" />
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
                  {paginatedPractices.map((practice) => {
                    const isExpanded = expandedPracticeId === practice.id
                    const kaTranslation = practice.practice_translations?.find(t => t.language === 'ka')
                    const enTranslation = practice.practice_translations?.find(t => t.language === 'en')
                    
                    return (
                      <Fragment key={practice.id}>
                        <tr className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                          <td className="px-2 py-2">
                            <button onClick={() => handleSelectPractice(practice.id)}>
                              {selectedPractices.has(practice.id) ? (
                                <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                              ) : (
                                <Square className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5 max-w-[200px]">
                              {practice.hero_image_url && (
                                <img 
                                  src={practice.hero_image_url} 
                                  alt="" 
                                  className="h-8 w-8 flex-shrink-0 rounded object-cover"
                                />
                              )}
                              <div className="min-w-0">
                                <span className={`text-[10px] truncate block ${isDark ? 'text-white' : 'text-black'}`}>
                                  {kaTranslation?.title || 'უსათაურო'}
                                </span>
                                <span className={`text-[9px] truncate block ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                  {kaTranslation?.slug || '-'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <TranslationStatus 
                              translations={practice.practice_translations} 
                              isDark={isDark} 
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={practice.status}
                              onChange={(e) => handleStatusChange(practice.id, e.target.value as Practice['status'])}
                              className={`w-full max-w-[90px] rounded-md border px-1.5 py-1 text-[10px] font-medium ${
                                practice.status === 'published'
                                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                              }`}
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                              {new Date(practice.created_at).toLocaleDateString('ka-GE')}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                              {new Date(practice.updated_at).toLocaleDateString('ka-GE')}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setExpandedPracticeId(isExpanded ? null : practice.id)}
                                className={`rounded-md p-1 transition-colors ${
                                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                }`}
                                title="დეტალები"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleView(practice)}
                                className={`rounded-md p-1 transition-colors ${
                                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                }`}
                                title="გვერდზე ნახვა"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEdit(practice)}
                                className={`rounded-md p-1 transition-colors ${
                                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                }`}
                                title="რედაქტირება"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(practice.id)}
                                className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-500/10"
                                title="წაშლა"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row - Quick View */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className={`px-3 py-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                              <div className="space-y-3">
                                {/* IDs and Slugs */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                                  <div>
                                    <span className={isDark ? 'text-white/40' : 'text-black/40'}>Practice ID:</span>
                                    <span className={`ml-1 font-mono ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {practice.id.substring(0, 8)}...
                                    </span>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-white/40' : 'text-black/40'}>KA Slug:</span>
                                    <span className={`ml-1 font-mono ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {kaTranslation?.slug || '-'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-white/40' : 'text-black/40'}>EN Slug:</span>
                                    <span className={`ml-1 font-mono ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {enTranslation?.slug || '-'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-white/40' : 'text-black/40'}>Word Count:</span>
                                    <span className={`ml-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {kaTranslation?.word_count || 0} ({kaTranslation?.reading_time || 0} წთ)
                                    </span>
                                  </div>
                                </div>

                                {/* Images & Meta */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {practice.hero_image_url && (
                                    <div>
                                      <span className={`text-[10px] block mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                        Hero სურათი:
                                      </span>
                                      <img 
                                        src={practice.hero_image_url} 
                                        alt="Practice" 
                                        className="h-24 w-36 rounded-lg object-cover"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="space-y-1">
                                    <div>
                                      <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                        Meta Title:
                                      </span>
                                      <span className={`ml-1 text-[10px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {kaTranslation?.meta_title || '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                        Meta Description:
                                      </span>
                                      <p className={`text-[10px] line-clamp-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {kaTranslation?.meta_description || '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                        Focus Keyword:
                                      </span>
                                      <span className={`ml-1 text-[10px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {kaTranslation?.focus_keyword || '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
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
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className={`appearance-none cursor-pointer rounded-md border px-2 py-1 pr-6 text-[10px] ${
                    isDark ? 'border-white/10 bg-zinc-800 text-white' : 'border-black/10 bg-white text-black'
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDark ? 'text-white/50' : 'text-black/50'}`} />
              </div>
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
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`rounded-md border px-2 py-1 text-[10px] ${
                  currentPage === totalPages || totalPages === 0
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
