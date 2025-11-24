'use client'

import { useState, useEffect, useCallback, useMemo, memo, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import ServiceAdd from './ServiceAdd'
import Modal from '@/components/common/Modal'
import { 
  Layers,
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
  Globe,
  ExternalLink
} from 'lucide-react'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

type Language = 'ka' | 'en' | 'ru'

interface Service {
  id: string
  practice_id: string
  image_url: string
  og_image_url: string | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
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

interface ServiceWithTranslations extends Service {
  service_translations: ServiceTranslation[]
}

interface Practice {
  id: string
  title: string
}

type SortColumn = 'created_at' | 'title' | 'practice' | 'status' | 'updated_at'
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
  translations: ServiceTranslation[]
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

export default function ServicesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // State
  const [services, setServices] = useState<ServiceWithTranslations[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithTranslations | null>(null)
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'published'>('ALL')
  const [practiceFilter, setPracticeFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortColumn>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  // Multi-select
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  
  // Practices
  const [practices, setPractices] = useState<Practice[]>([])
  
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

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch services with translations using Supabase nested select
      // This bypasses the 1000 row limit for translations
      const { data: servicesWithTranslations, error: servicesError } = await supabase
        .from('services')
        .select(`
          id, practice_id, image_url, og_image_url, status, created_at, updated_at,
          service_translations(*)
        `)
        .order('created_at', { ascending: false })

      if (servicesError) throw servicesError

      setServices(servicesWithTranslations as ServiceWithTranslations[])
    } catch (error) {
      console.error('Error fetching services:', error)
      showModal('error', 'შეცდომა სერვისების ჩატვირთვისას')
    } finally {
      setLoading(false)
    }
  }, [supabase, showModal])

  const fetchPractices = useCallback(async () => {
    try {
      const { data: practicesData, error: practicesError } = await supabase
        .from('practices')
        .select('id')
        .order('created_at', { ascending: false })

      if (practicesError) throw practicesError

      // Fetch practice translations (Georgian only for dropdown)
      const { data: translationsData, error: translationsError } = await supabase
        .from('practice_translations')
        .select('practice_id, title')
        .eq('language', 'ka')

      if (translationsError) throw translationsError

      // Combine practices with their Georgian titles
      const practicesWithTitles = (practicesData || []).map(practice => {
        const translation = (translationsData || []).find(t => t.practice_id === practice.id)
        return {
          id: practice.id,
          title: translation?.title || 'N/A'
        }
      })

      setPractices(practicesWithTitles)
    } catch (error) {
      console.error('Error fetching practices:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchServices()
    fetchPractices()
  }, [fetchServices, fetchPractices])

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getPracticeTitle = useCallback((practiceId: string): string => {
    const practice = practices.find(p => p.id === practiceId)
    return practice?.title || '-'
  }, [practices])

  // ============================================================================
  // Filtering & Sorting Logic
  // ============================================================================

  const filteredAndSortedServices = useMemo(() => {
    let result = [...services]

    // Search filter (multi-language)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(service => {
        const kaTranslation = service.service_translations?.find(t => t.language === 'ka')
        const enTranslation = service.service_translations?.find(t => t.language === 'en')
        const ruTranslation = service.service_translations?.find(t => t.language === 'ru')
        
        return (
          kaTranslation?.title?.toLowerCase().includes(searchLower) ||
          enTranslation?.title?.toLowerCase().includes(searchLower) ||
          ruTranslation?.title?.toLowerCase().includes(searchLower) ||
          kaTranslation?.slug?.toLowerCase().includes(searchLower) ||
          enTranslation?.slug?.toLowerCase().includes(searchLower) ||
          service.id.toLowerCase().includes(searchLower)
        )
      })
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(service => service.status === statusFilter)
    }

    // Practice filter
    if (practiceFilter !== 'ALL') {
      result = result.filter(service => service.practice_id === practiceFilter)
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(service => new Date(service.created_at) >= new Date(dateFrom))
    }
    if (dateTo) {
      result = result.filter(service => new Date(service.created_at) <= new Date(dateTo))
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'title':
          aValue = a.service_translations?.find(t => t.language === 'ka')?.title || ''
          bValue = b.service_translations?.find(t => t.language === 'ka')?.title || ''
          break
        case 'practice':
          aValue = getPracticeTitle(a.practice_id)
          bValue = getPracticeTitle(b.practice_id)
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
  }, [services, searchTerm, statusFilter, practiceFilter, dateFrom, dateTo, sortBy, sortOrder, getPracticeTitle])

  // Pagination
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedServices.slice(startIndex, endIndex)
  }, [filteredAndSortedServices, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage)

  // Stats
  const stats = useMemo(() => {
    const needsTranslation = services.filter(s => {
      const hasKa = s.service_translations.some(t => t.language === 'ka' && t.title?.trim())
      const hasEn = s.service_translations.some(t => t.language === 'en' && t.title?.trim())
      const hasRu = s.service_translations.some(t => t.language === 'ru' && t.title?.trim())
      return hasKa && (!hasEn || !hasRu)
    }).length

    return {
      total: services.length,
      published: services.filter(s => s.status === 'published').length,
      draft: services.filter(s => s.status === 'draft').length,
      needsTranslation,
      filtered: filteredAndSortedServices.length
    }
  }, [services, filteredAndSortedServices])

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
    if (selectedServices.size === paginatedServices.length) {
      setSelectedServices(new Set())
    } else {
      setSelectedServices(new Set(paginatedServices.map(s => s.id)))
    }
  }, [selectedServices.size, paginatedServices])

  const handleSelectService = useCallback((serviceId: string) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId)
    } else {
      newSelected.add(serviceId)
    }
    setSelectedServices(newSelected)
  }, [selectedServices])

  const handleBulkDelete = useCallback(async () => {
    if (selectedServices.size === 0) return
    
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedServices.size} სერვისის წაშლა?`, async () => {
      try {
        for (const serviceId of selectedServices) {
          await supabase.from('services').delete().eq('id', serviceId)
        }
        
        setServices(services.filter(s => !selectedServices.has(s.id)))
        setSelectedServices(new Set())
        showModal('success', `${selectedServices.size} სერვისი წარმატებით წაიშალა`)
      } catch (error) {
        console.error('Error bulk deleting:', error)
        showModal('error', 'შეცდომა წაშლისას')
      }
    })
  }, [selectedServices, services, supabase, showModal])

  const handleBulkStatusChange = useCallback(async (newStatus: Service['status']) => {
    if (selectedServices.size === 0) return

    try {
      for (const serviceId of selectedServices) {
        await supabase.from('services').update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        }).eq('id', serviceId)
      }
      
      setServices(services.map(s => 
        selectedServices.has(s.id) ? { ...s, status: newStatus } : s
      ))
      setSelectedServices(new Set())
      showModal('success', `${selectedServices.size} სერვისის სტატუსი შეიცვალა`)
    } catch (error) {
      console.error('Error bulk status change:', error)
      showModal('error', 'შეცდომა სტატუსის შეცვლისას')
    }
  }, [selectedServices, services, supabase, showModal])

  const handleDelete = useCallback(async (serviceId: string) => {
    showModal('confirm', 'დარწმუნებული ხართ რომ გსურთ სერვისის წაშლა?', async () => {
      try {
        const { error } = await supabase.from('services').delete().eq('id', serviceId)
        if (error) throw error

        setServices(services.filter(s => s.id !== serviceId))
        showModal('success', 'სერვისი წარმატებით წაიშალა')
      } catch (error) {
        console.error('Error deleting service:', error)
        showModal('error', 'შეცდომა სერვისის წაშლისას')
      }
    })
  }, [services, supabase, showModal])

  const handleStatusChange = useCallback(async (serviceId: string, newStatus: Service['status']) => {
    try {
      const { error } = await supabase.from('services').update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      }).eq('id', serviceId)
      if (error) throw error

      setServices(services.map(s => s.id === serviceId ? { ...s, status: newStatus } : s))
    } catch (error) {
      console.error('Error updating status:', error)
      showModal('error', 'შეცდომა სტატუსის შეცვლისას')
    }
  }, [services, supabase, showModal])

  const handleEdit = useCallback(async (service: ServiceWithTranslations) => {
    // Fetch fresh data from database to ensure we have latest translations
    const { data: freshTranslations } = await supabase
      .from('service_translations')
      .select('*')
      .eq('service_id', service.id)

    const freshService = {
      ...service,
      service_translations: freshTranslations || []
    }

    setEditingService(freshService)
    setShowAddForm(true)
  }, [supabase])

  const handleView = useCallback((service: ServiceWithTranslations) => {
    const kaTranslation = service.service_translations.find(t => t.language === 'ka')
    if (kaTranslation?.slug) {
      window.open(`/ka/services/${kaTranslation.slug}`, '_blank')
    }
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPracticeFilter('ALL')
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
      <ServiceAdd 
        onBack={() => {
          setShowAddForm(false)
          setEditingService(null)
          fetchServices()
        }}
        editData={editingService}
      />
    )
  }

  return (
    <div className={`min-h-screen p-4 transition-colors ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              სერვისების მართვა
            </h1>
            <p className={`mt-1 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სრული კონტროლი ყველა სერვისზე
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            ახალი სერვისი
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          <StatsCard label="სულ სერვისი" value={stats.total} isDark={isDark} />
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
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

              {/* Practice Filter */}
              <div>
                <select
                  value={practiceFilter}
                  onChange={(e) => setPracticeFilter(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  <option value="ALL" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>ყველა პრაქტიკა</option>
                  {practices.map(practice => (
                    <option key={practice.id} value={practice.id} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>
                      {practice.title}
                    </option>
                  ))}
                </select>
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
                  <option value="ALL" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>ყველა სტატუსი</option>
                  <option value="published" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Published</option>
                  <option value="draft" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Draft</option>
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
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                />
                {/* Clear Filters */}
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
        {selectedServices.size > 0 && (
          <div className={`mb-3 flex items-center gap-2 rounded-lg border p-2 ${
            isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-500/30 bg-blue-500/10'
          }`}>
            <span className="text-[10px] font-medium text-blue-500">
              არჩეულია: {selectedServices.size}
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
          <div className="flex items-center justify-center py-12">
            <div className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              იტვირთება...
            </div>
          </div>
        ) : filteredAndSortedServices.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <Layers className={`mx-auto mb-2 h-8 w-8 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სერვისები არ მოიძებნა
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
                          {selectedServices.size === paginatedServices.length ? (
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
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('practice')}>
                          პრაქტიკა
                          <SortIcon column="practice" />
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
                    {paginatedServices.map((service) => {
                      const isExpanded = expandedServiceId === service.id
                      const kaTranslation = service.service_translations?.find(t => t.language === 'ka')
                      const enTranslation = service.service_translations?.find(t => t.language === 'en')
                      
                      return (
                        <Fragment key={service.id}>
                          <tr className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                            <td className="px-2 py-2">
                              <button onClick={() => handleSelectService(service.id)}>
                                {selectedServices.has(service.id) ? (
                                  <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                  <Square className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1.5 max-w-[200px]">
                                {service.image_url && (
                                  <img 
                                    src={service.image_url} 
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
                              <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                                {getPracticeTitle(service.practice_id)}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <TranslationStatus 
                                translations={service.service_translations} 
                                isDark={isDark} 
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={service.status}
                                onChange={(e) => handleStatusChange(service.id, e.target.value as Service['status'])}
                                className={`w-full max-w-[90px] rounded-md border px-1.5 py-1 text-[10px] font-medium ${
                                  service.status === 'published'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/30'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                }`}
                                style={isDark ? { colorScheme: 'dark' } : {}}
                              >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                                {new Date(service.created_at).toLocaleDateString('ka-GE')}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                                {new Date(service.updated_at).toLocaleDateString('ka-GE')}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                                  className={`rounded-md p-1 transition-colors ${
                                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                  }`}
                                  title="დეტალები"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleView(service)}
                                  className={`rounded-md p-1 transition-colors ${
                                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                  }`}
                                  title="გვერდზე ნახვა"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEdit(service)}
                                  className={`rounded-md p-1 transition-colors ${
                                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                                  }`}
                                  title="რედაქტირება"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(service.id)}
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
                              <td colSpan={8} className={`px-3 py-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                <div className="space-y-3">
                                  {/* IDs and Slugs */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                                    <div>
                                      <span className={isDark ? 'text-white/40' : 'text-black/40'}>Service ID:</span>
                                      <span className={`ml-1 font-mono ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {service.id.substring(0, 8)}...
                                      </span>
                                    </div>
                                    <div>
                                      <span className={isDark ? 'text-white/40' : 'text-black/40'}>Practice ID:</span>
                                      <span className={`ml-1 font-mono ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {service.practice_id.substring(0, 8)}...
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
                                  </div>

                                  {/* SEO Preview */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Image */}
                                    {service.image_url && (
                                      <div>
                                        <span className={`text-[10px] block mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          სურათი:
                                        </span>
                                        <img 
                                          src={service.image_url} 
                                          alt="Service" 
                                          className="h-24 w-36 rounded-lg object-cover"
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Meta Info */}
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
                                          Word Count:
                                        </span>
                                        <span className={`ml-1 text-[10px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                          {kaTranslation?.word_count || 0} სიტყვა ({kaTranslation?.reading_time || 0} წთ)
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
      </div>

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
