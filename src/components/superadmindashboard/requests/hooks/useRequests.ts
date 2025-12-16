'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  AccessRequest, 
  VerificationRequest, 
  CompanyVerificationRequest,
  RequestFilters,
  RequestStats,
  VerificationStats
} from '../types'

const ITEMS_PER_PAGE = 10

export function useRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
  const [companySpecialistRequests, setCompanySpecialistRequests] = useState<VerificationRequest[]>([])
  const [companyRequests, setCompanyRequests] = useState<CompanyVerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RequestFilters>({
    searchQuery: '',
    statusFilter: 'ALL',
    verificationStatusFilter: 'ALL',
    dateFrom: '',
    dateTo: ''
  })
  const [currentPage, setCurrentPage] = useState(1)

  const supabase = createClient()

  // Fetch access requests
  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select(`
          *,
          profiles!access_requests_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching requests:', error)
      } else {
        const requestsWithEmail = (data || []).map(req => ({
          ...req,
          user_email: req.profiles?.email || null
        }))
        setRequests(requestsWithEmail)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }, [supabase])

  // Fetch solo specialist verification requests
  const fetchVerificationRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role_title, phone_number, avatar_url, slug, bio, philosophy, languages, focus_areas, representative_matters, teaching_writing_speaking, credentials_memberships, values_how_we_work, verification_status, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_notes, created_at, updated_at')
        .eq('role', 'SOLO_SPECIALIST')
        .in('verification_status', ['pending', 'verified', 'rejected'])
        .order('verification_requested_at', { ascending: false })

      if (error) {
        console.error('Error fetching verification requests:', error)
      } else {
        setVerificationRequests(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }, [supabase])

  // Fetch company specialist verification requests
  const fetchCompanySpecialistRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role_title, phone_number, avatar_url, slug, bio, philosophy, languages, focus_areas, representative_matters, teaching_writing_speaking, credentials_memberships, values_how_we_work, verification_status, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_notes, created_at, updated_at, role, company_id')
        .eq('role', 'SPECIALIST')
        .in('verification_status', ['pending', 'verified', 'rejected'])
        .order('verification_requested_at', { ascending: false })

      if (error) {
        console.error('Error fetching company specialist requests:', error)
      } else {
        setCompanySpecialistRequests(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }, [supabase])

  // Fetch company verification requests
  const fetchCompanyRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_slug, phone_number, avatar_url, bio, verification_status, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_notes, created_at, updated_at')
        .eq('role', 'COMPANY')
        .in('verification_status', ['pending', 'verified', 'rejected'])
        .order('verification_requested_at', { ascending: false })

      if (error) {
        console.error('Error fetching company requests:', error)
      } else {
        setCompanyRequests(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([
        fetchRequests(),
        fetchVerificationRequests(),
        fetchCompanySpecialistRequests(),
        fetchCompanyRequests()
      ])
      setLoading(false)
    }
    fetchAll()
  }, [fetchRequests, fetchVerificationRequests, fetchCompanySpecialistRequests, fetchCompanyRequests])

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchRequests(),
      fetchVerificationRequests(),
      fetchCompanySpecialistRequests(),
      fetchCompanyRequests()
    ])
    setLoading(false)
  }, [fetchRequests, fetchVerificationRequests, fetchCompanySpecialistRequests, fetchCompanyRequests])

  // Filter access requests
  const filteredAccessRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = 
        request.full_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.user_email?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.phone_number?.toLowerCase().includes(filters.searchQuery.toLowerCase())

      const matchesStatus = filters.statusFilter === 'ALL' || request.status === filters.statusFilter

      // Date filter
      let matchesDate = true
      if (filters.dateFrom) {
        matchesDate = new Date(request.created_at) >= new Date(filters.dateFrom)
      }
      if (filters.dateTo && matchesDate) {
        matchesDate = new Date(request.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [requests, filters])

  // Filter verification requests
  const filteredVerificationRequests = useMemo(() => {
    return verificationRequests.filter((request) => {
      const matchesSearch = 
        request.full_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.email?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.phone_number?.toLowerCase().includes(filters.searchQuery.toLowerCase())

      const matchesStatus = filters.verificationStatusFilter === 'ALL' || request.verification_status === filters.verificationStatusFilter

      // Date filter
      let matchesDate = true
      const dateField = request.verification_requested_at || request.created_at
      if (filters.dateFrom) {
        matchesDate = new Date(dateField) >= new Date(filters.dateFrom)
      }
      if (filters.dateTo && matchesDate) {
        matchesDate = new Date(dateField) <= new Date(filters.dateTo + 'T23:59:59')
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [verificationRequests, filters])

  // Filter company specialist requests
  const filteredCompanySpecialistRequests = useMemo(() => {
    return companySpecialistRequests.filter((request) => {
      const matchesSearch = 
        request.full_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.email?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.phone_number?.toLowerCase().includes(filters.searchQuery.toLowerCase())

      const matchesStatus = filters.verificationStatusFilter === 'ALL' || request.verification_status === filters.verificationStatusFilter

      // Date filter
      let matchesDate = true
      const dateField = request.verification_requested_at || request.created_at
      if (filters.dateFrom) {
        matchesDate = new Date(dateField) >= new Date(filters.dateFrom)
      }
      if (filters.dateTo && matchesDate) {
        matchesDate = new Date(dateField) <= new Date(filters.dateTo + 'T23:59:59')
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [companySpecialistRequests, filters])

  // Filter company requests
  const filteredCompanyRequests = useMemo(() => {
    return companyRequests.filter((request) => {
      const matchesSearch = 
        request.full_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.email?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        request.company_slug?.toLowerCase().includes(filters.searchQuery.toLowerCase())

      const matchesStatus = filters.verificationStatusFilter === 'ALL' || request.verification_status === filters.verificationStatusFilter

      // Date filter
      let matchesDate = true
      const dateField = request.verification_requested_at || request.created_at
      if (filters.dateFrom) {
        matchesDate = new Date(dateField) >= new Date(filters.dateFrom)
      }
      if (filters.dateTo && matchesDate) {
        matchesDate = new Date(dateField) <= new Date(filters.dateTo + 'T23:59:59')
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [companyRequests, filters])

  // Stats
  const accessStats: RequestStats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length
  }), [requests])

  const verificationStats: VerificationStats = useMemo(() => ({
    total: verificationRequests.length,
    pending: verificationRequests.filter(r => r.verification_status === 'pending').length,
    verified: verificationRequests.filter(r => r.verification_status === 'verified').length,
    rejected: verificationRequests.filter(r => r.verification_status === 'rejected').length
  }), [verificationRequests])

  const companySpecialistStats: VerificationStats = useMemo(() => ({
    total: companySpecialistRequests.length,
    pending: companySpecialistRequests.filter(r => r.verification_status === 'pending').length,
    verified: companySpecialistRequests.filter(r => r.verification_status === 'verified').length,
    rejected: companySpecialistRequests.filter(r => r.verification_status === 'rejected').length
  }), [companySpecialistRequests])

  const companyStats: VerificationStats = useMemo(() => ({
    total: companyRequests.length,
    pending: companyRequests.filter(r => r.verification_status === 'pending').length,
    verified: companyRequests.filter(r => r.verification_status === 'verified').length,
    rejected: companyRequests.filter(r => r.verification_status === 'rejected').length
  }), [companyRequests])

  // Pagination helpers
  const getPaginatedData = useCallback(<T,>(data: T[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [currentPage])

  const getTotalPages = useCallback((totalItems: number) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE)
  }, [])

  // Update filter
  const updateFilter = useCallback((key: keyof RequestFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filter changes
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      statusFilter: 'ALL',
      verificationStatusFilter: 'ALL',
      dateFrom: '',
      dateTo: ''
    })
    setCurrentPage(1)
  }, [])

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.searchQuery) count++
    if (filters.statusFilter !== 'ALL') count++
    if (filters.verificationStatusFilter !== 'ALL') count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    return count
  }, [filters])

  return {
    // Data
    requests,
    verificationRequests,
    companySpecialistRequests,
    companyRequests,
    // Filtered data
    filteredAccessRequests,
    filteredVerificationRequests,
    filteredCompanySpecialistRequests,
    filteredCompanyRequests,
    // Stats
    accessStats,
    verificationStats,
    companySpecialistStats,
    companyStats,
    // State
    loading,
    filters,
    currentPage,
    // Actions
    setCurrentPage,
    updateFilter,
    resetFilters,
    refreshAll,
    // Helpers
    getPaginatedData,
    getTotalPages,
    activeFiltersCount,
    ITEMS_PER_PAGE
  }
}
