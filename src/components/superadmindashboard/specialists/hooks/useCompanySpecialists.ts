'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  CompanySpecialistProfile, 
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
// useCompanySpecialists Hook
// ============================================================================

interface UseCompanySpecialistsOptions {
  initialItemsPerPage?: number
}

export function useCompanySpecialists(options: UseCompanySpecialistsOptions = {}) {
  const { initialItemsPerPage = 25 } = options

  // -------------------------------------------------------------------------
  // Core State
  // -------------------------------------------------------------------------
  const [specialists, setSpecialists] = useState<CompanySpecialistProfile[]>([])
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
    convertingToSolo: null,
    changingCompany: null
  })

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  const [filters, setFilters] = useState<FiltersState>(defaultFilters)

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
        .select(`
          *,
          company:company_id(full_name, is_blocked)
        `)
        .eq('role', 'SPECIALIST')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching company specialists:', error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const specialistsWithCompany = (data || []).map((specialist: any) => ({
          ...specialist,
          company_name: specialist.company?.full_name || null,
          company_is_blocked: specialist.company?.is_blocked || false
        }))
        setSpecialists(specialistsWithCompany)
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
      }
    } catch (error) {
      console.error('Error loading cities:', error)
    }
  }, [supabase])

  // -------------------------------------------------------------------------
  // Initial Load
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchSpecialists()
    fetchCompanies()
  }, [fetchSpecialists, fetchCompanies])

  // -------------------------------------------------------------------------
  // Filtered Specialists
  // -------------------------------------------------------------------------
  const filteredSpecialists = useMemo(() => {
    let result = [...specialists]

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      result = result.filter(s =>
        s.full_name?.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower) ||
        s.slug?.toLowerCase().includes(searchLower) ||
        s.role_title?.toLowerCase().includes(searchLower) ||
        s.company_name?.toLowerCase().includes(searchLower)
      )
    }

    // Verification filter
    if (filters.verificationFilter !== 'ALL') {
      result = result.filter(s => s.verification_status === filters.verificationFilter)
    }

    // Block filter
    if (filters.blockFilter !== 'ALL') {
      result = result.filter(s =>
        filters.blockFilter === 'blocked' ? s.is_blocked : !s.is_blocked
      )
    }

    // Info activate filter
    if (filters.infoActivateFilter !== 'ALL') {
      result = result.filter(s =>
        filters.infoActivateFilter === 'active' ? s.info_activate : !s.info_activate
      )
    }

    // Company filter
    if (filters.companyFilter !== 'ALL') {
      result = result.filter(s => s.company_id === filters.companyFilter)
    }

    // Date filters
    if (filters.dateFrom) {
      result = result.filter(s => new Date(s.created_at) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      result = result.filter(s => new Date(s.created_at) <= new Date(filters.dateTo + 'T23:59:59'))
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | number | null = null
      let bValue: string | number | null = null

      switch (sortBy) {
        case 'full_name':
          aValue = a.full_name?.toLowerCase() || ''
          bValue = b.full_name?.toLowerCase() || ''
          break
        case 'email':
          aValue = a.email?.toLowerCase() || ''
          bValue = b.email?.toLowerCase() || ''
          break
        case 'verification_status':
          aValue = a.verification_status || ''
          bValue = b.verification_status || ''
          break
        case 'company_name':
          aValue = a.company_name?.toLowerCase() || ''
          bValue = b.company_name?.toLowerCase() || ''
          break
        case 'created_at':
        case 'updated_at':
        default:
          aValue = new Date(a[sortBy] || 0).getTime()
          bValue = new Date(b[sortBy] || 0).getTime()
          break
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [specialists, filters, sortBy, sortOrder])

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------
  const stats = useMemo((): SpecialistStats => ({
    total: specialists.length,
    verified: specialists.filter(s => s.verification_status === 'verified').length,
    pending: specialists.filter(s => s.verification_status === 'pending').length,
    blocked: specialists.filter(s => s.is_blocked).length,
    rejected: specialists.filter(s => s.verification_status === 'rejected').length,
    filtered: filteredSpecialists.length
  }), [specialists, filteredSpecialists])

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  const totalPages = Math.ceil(filteredSpecialists.length / itemsPerPage)
  
  const paginatedSpecialists = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSpecialists.slice(start, start + itemsPerPage)
  }, [filteredSpecialists, currentPage, itemsPerPage])

  // -------------------------------------------------------------------------
  // Filter Handlers
  // -------------------------------------------------------------------------
  const updateFilter = useCallback(<K extends keyof FiltersState>(
    key: K,
    value: FiltersState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }, [])

  // -------------------------------------------------------------------------
  // Sort Handler
  // -------------------------------------------------------------------------
  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }, [sortBy])

  // -------------------------------------------------------------------------
  // Selection Handlers
  // -------------------------------------------------------------------------
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedSpecialists.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedSpecialists.map(s => s.id)))
    }
  }, [paginatedSpecialists, selectedIds.size])

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    // Data
    specialists,
    companies,
    specialistCities,
    filteredSpecialists,
    paginatedSpecialists,
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
