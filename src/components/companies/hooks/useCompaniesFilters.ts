/**
 * Custom Hook: useCompaniesFilters
 * Manages filter state for companies page with debounced search
 */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { UseCompaniesFiltersReturn } from '../types'

export function useCompaniesFilters(): UseCompaniesFiltersReturn {
  // Individual state values
  const [searchTerm, setSearchTermState] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompanyState] = useState<string | null>(null)
  const [selectedSpecialization, setSelectedSpecializationState] = useState<string | null>(null)
  const [selectedCity, setSelectedCityState] = useState<string | null>(null)

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term)
  }, [])

  const setSelectedCompany = useCallback((company: string | null) => {
    setSelectedCompanyState(company)
  }, [])

  const setSelectedSpecialization = useCallback((spec: string | null) => {
    setSelectedSpecializationState(spec)
  }, [])

  const setSelectedCity = useCallback((city: string | null) => {
    setSelectedCityState(city)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTermState('')
    setDebouncedSearchTerm('')
    setSelectedCompanyState(null)
    setSelectedSpecializationState(null)
    setSelectedCityState(null)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearchTerm !== '' ||
      selectedCompany !== null ||
      selectedSpecialization !== null ||
      selectedCity !== null
    )
  }, [debouncedSearchTerm, selectedCompany, selectedSpecialization, selectedCity])

  return {
    // State values (direct access)
    searchTerm,
    debouncedSearchTerm,
    selectedCompany,
    selectedSpecialization,
    selectedCity,
    // Setters
    setSearchTerm,
    setSelectedCompany,
    setSelectedSpecialization,
    setSelectedCity,
    clearFilters,
    hasActiveFilters,
  }
}
