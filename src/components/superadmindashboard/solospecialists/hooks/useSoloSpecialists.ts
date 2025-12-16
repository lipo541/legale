'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  SoloSpecialistProfile, 
  Company, 
  City, 
  FiltersState, 
  LoadingStates,
  SpecialistStats,
  SortColumn,
  SortOrder
} from '../types'
import { defaultFilters, defaultLoadingStates } from '../types'

// ============================================================================
// useSoloSpecialists Hook
// ============================================================================

interface UseSoloSpecialistsOptions {
  initialItemsPerPage?: number
}

export function useSoloSpecialists(options: UseSoloSpecialistsOptions = {}) {
  const { initialItemsPerPage = 25 } = options

  // -------------------------------------------------------------------------
  // Core State
  // -------------------------------------------------------------------------
  const [specialists, setSpecialists] = useState<SoloSpecialistProfile[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [specialistCities, setSpecialistCities] = useState<Record<string, City[]>>({})

  // -------------------------------------------------------------------------
  // Loading States
  // -------------------------------------------------------------------------
  const [loading, setLoading] = useState<LoadingStates>({
    fetching: true,
    deleting: null,
    updating: null,
    uploadingPhoto: null,
    blocking: null,
    changingVerification: null,
    togglingInfoActivate: null,
    convertingToCompany: null
  })

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  const [filters, setFilters] = useState<FiltersState>({
    searchTerm: '',
    verificationFilter: 'ALL',
    blockFilter: 'ALL',
    infoActivateFilter: 'ALL',
    dateFrom: '',
    dateTo: ''
  })

  // -------------------------------------------------------------------------
  // Sorting
  // -------------------------------------------------------------------------
  const [sortBy, setSortBy] = useState<SortColumn>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  // -------------------------------------------------------------------------
  // Multi-select
  // -------------------------------------------------------------------------
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // -------------------------------------------------------------------------
  // Supabase Client (memoized)
  // -------------------------------------------------------------------------
  const supabase = useMemo(() => createClient(), [])

  // -------------------------------------------------------------------------
  // Fetch Functions
  // -------------------------------------------------------------------------
  const fetchSpecialists = useCallback(async () => {
    setLoading(prev => ({ ...prev, fetching: true }))
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'SOLO_SPECIALIST')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching solo specialists:', error)
      } else {
        setSpecialists(data || [])
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }))
    }
  }, [supabase])

  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_slug')
        .eq('role', 'COMPANY')
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Error fetching companies:', error)
      } else {
        setCompanies(data || [])
      }
    } catch (err) {
      console.error('Fetch companies error:', err)
    }
  }, [supabase])

  const loadSpecialistCities = useCallback(async (specialistId: string) => {
    try {
      const { data } = await supabase
        .from('specialist_cities')
        .select(`
          city_id,
          cities (
            id,
            name_ka,
            name_en,
            name_ru
          )
        `)
        .eq('specialist_id', specialistId)

      if (data) {
        const cityList = data
          .map((item: { cities: City | City[] }) => 
            Array.isArray(item.cities) ? item.cities[0] : item.cities
          )
          .filter(Boolean) as City[]
        
        setSpecialistCities(prev => ({
          ...prev,
          [specialistId]: cityList
        }))
        
        return cityList
      }
      return []
    } catch (error) {
      console.error('Error loading cities:', error)
      return []
    }
  }, [supabase])

  // -------------------------------------------------------------------------
  // Initial Fetch
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchSpecialists()
    fetchCompanies()
  }, [fetchSpecialists, fetchCompanies])

  // -------------------------------------------------------------------------
  // Filtering & Sorting Logic (Memoized)
  // -------------------------------------------------------------------------
  const filteredAndSortedSpecialists = useMemo(() => {
    let result = [...specialists]

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      result = result.filter(specialist => 
        specialist.full_name?.toLowerCase().includes(searchLower) ||
        specialist.email?.toLowerCase().includes(searchLower) ||
        specialist.slug?.toLowerCase().includes(searchLower) ||
        specialist.role_title?.toLowerCase().includes(searchLower)
      )
    }

    // Verification filter
    if (filters.verificationFilter !== 'ALL') {
      result = result.filter(specialist => 
        specialist.verification_status === filters.verificationFilter
      )
    }

    // Block filter
    if (filters.blockFilter !== 'ALL') {
      result = result.filter(specialist => 
        filters.blockFilter === 'blocked' 
          ? specialist.is_blocked === true 
          : specialist.is_blocked !== true
      )
    }

    // Info Activate filter
    if (filters.infoActivateFilter !== 'ALL') {
      result = result.filter(specialist => 
        filters.infoActivateFilter === 'active' 
          ? specialist.info_activate === true 
          : specialist.info_activate !== true
      )
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter(specialist => 
        new Date(specialist.created_at) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      result = result.filter(specialist => 
        new Date(specialist.created_at) <= new Date(filters.dateTo)
      )
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'full_name':
          aValue = a.full_name || ''
          bValue = b.full_name || ''
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'verification_status':
          aValue = a.verification_status || ''
          bValue = b.verification_status || ''
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
  }, [specialists, filters, sortBy, sortOrder])

  // -------------------------------------------------------------------------
  // Pagination (Memoized)
  // -------------------------------------------------------------------------
  const paginatedSpecialists = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedSpecialists.slice(startIndex, endIndex)
  }, [filteredAndSortedSpecialists, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedSpecialists.length / itemsPerPage)

  // -------------------------------------------------------------------------
  // Stats (Memoized)
  // -------------------------------------------------------------------------
  const stats: SpecialistStats = useMemo(() => ({
    total: specialists.length,
    verified: specialists.filter(s => s.verification_status === 'verified').length,
    pending: specialists.filter(s => s.verification_status === 'pending').length,
    rejected: specialists.filter(s => s.verification_status === 'rejected').length,
    unverified: specialists.filter(s => !s.verification_status || s.verification_status === 'unverified').length,
    blocked: specialists.filter(s => s.is_blocked === true).length,
    infoActive: specialists.filter(s => s.info_activate === true).length,
    filtered: filteredAndSortedSpecialists.length
  }), [specialists, filteredAndSortedSpecialists])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }, [sortBy])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedSpecialists.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedSpecialists.map(s => s.id)))
    }
  }, [selectedIds.size, paginatedSpecialists])

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      verificationFilter: 'ALL',
      blockFilter: 'ALL',
      infoActivateFilter: 'ALL',
      dateFrom: '',
      dateTo: ''
    })
    setCurrentPage(1)
  }, [])

  const updateFilter = useCallback(<K extends keyof FiltersState>(
    key: K, 
    value: FiltersState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    // Data
    specialists,
    companies,
    specialistCities,
    paginatedSpecialists,
    filteredAndSortedSpecialists,
    stats,
    
    // Loading
    loading,
    setLoading,
    
    // Filters
    filters,
    updateFilter,
    clearFilters,
    
    // Sorting
    sortBy,
    sortOrder,
    handleSort,
    
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    
    // Selection
    selectedIds,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    
    // Actions
    fetchSpecialists,
    loadSpecialistCities,
    setSpecialists,
    setSpecialistCities,
    
    // Supabase
    supabase
  }
}

export default useSoloSpecialists
