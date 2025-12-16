// ============================================================================
// useCompanies Hook - Data Fetching, Filtering, Pagination & Selection
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  CompanyProfile, 
  CompanyFilters, 
  CompanyStats, 
  City,
  SortColumn,
  SortOrder 
} from '../types'
import { defaultFilters } from '../types'

export function useCompanies() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [companyCities, setCompanyCities] = useState<Record<string, City[]>>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CompanyFilters>(defaultFilters)
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortColumn>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const supabase = createClient()

  // -------------------------------------------------------------------------
  // Fetch Companies
  // -------------------------------------------------------------------------
  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'COMPANY')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching companies:', error)
      } else {
        setCompanies(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // -------------------------------------------------------------------------
  // Load Company Cities
  // -------------------------------------------------------------------------
  const loadCompanyCities = useCallback(async (companyId: string) => {
    try {
      const { data } = await supabase
        .from('company_cities')
        .select(`
          city_id,
          cities (
            id,
            name_ka,
            name_en,
            name_ru
          )
        `)
        .eq('company_id', companyId)

      if (data) {
        const cityList = data
          .map((item: { cities: City | City[] }) => 
            Array.isArray(item.cities) ? item.cities[0] : item.cities
          )
          .filter(Boolean) as City[]

        setCompanyCities(prev => ({
          ...prev,
          [companyId]: cityList
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
    fetchCompanies()
  }, [fetchCompanies])

  // -------------------------------------------------------------------------
  // Filtered & Sorted Companies
  // -------------------------------------------------------------------------
  const filteredCompanies = useMemo(() => {
    let result = [...companies]

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase()
      result = result.filter(company => 
        company.full_name?.toLowerCase().includes(query) ||
        company.email?.toLowerCase().includes(query) ||
        company.company_slug?.toLowerCase().includes(query) ||
        company.phone_number?.toLowerCase().includes(query) ||
        company.website?.toLowerCase().includes(query) ||
        company.address?.toLowerCase().includes(query)
      )
    }

    // Verification filter
    if (filters.verification !== 'ALL') {
      result = result.filter(company => 
        company.verification_status === filters.verification
      )
    }

    // Block filter
    if (filters.blocked !== 'ALL') {
      result = result.filter(company => 
        filters.blocked === 'blocked' ? company.is_blocked : !company.is_blocked
      )
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter(company => 
        new Date(company.created_at) >= fromDate
      )
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter(company => 
        new Date(company.created_at) <= toDate
      )
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortBy) {
        case 'full_name':
          aVal = a.full_name?.toLowerCase() || ''
          bVal = b.full_name?.toLowerCase() || ''
          break
        case 'email':
          aVal = a.email?.toLowerCase() || ''
          bVal = b.email?.toLowerCase() || ''
          break
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case 'updated_at':
          aVal = new Date(a.updated_at).getTime()
          bVal = new Date(b.updated_at).getTime()
          break
        case 'verification_status':
          aVal = a.verification_status || ''
          bVal = b.verification_status || ''
          break
      }

      if (aVal === null || bVal === null) return 0
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [companies, filters, sortBy, sortOrder])

  // -------------------------------------------------------------------------
  // Paginated Companies
  // -------------------------------------------------------------------------
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCompanies.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCompanies, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------
  const stats: CompanyStats = useMemo(() => ({
    total: companies.length,
    verified: companies.filter(c => c.verification_status === 'verified').length,
    unverified: companies.filter(c => !c.verification_status || c.verification_status === 'unverified').length,
    pending: companies.filter(c => c.verification_status === 'pending').length,
    blocked: companies.filter(c => c.is_blocked).length
  }), [companies])

  // -------------------------------------------------------------------------
  // Filter Handlers
  // -------------------------------------------------------------------------
  const updateFilter = useCallback(<K extends keyof CompanyFilters>(
    key: K,
    value: CompanyFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
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
    if (selectedIds.size === paginatedCompanies.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedCompanies.map(c => c.id)))
    }
  }, [paginatedCompanies, selectedIds.size])

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

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    // Data
    companies,
    companyCities,
    paginatedCompanies,
    filteredCompanies,
    stats,
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
    fetchCompanies,
    loadCompanyCities,
    setCompanies,
    setCompanyCities,
    
    // Supabase client
    supabase
  }
}
