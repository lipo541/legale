/**
 * Custom Hook: useSpecialistsFilters
 * Manages filter state for specialists page with debounced search
 */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { UseSpecialistsFiltersReturn } from '../types'

export function useSpecialistsFilters(): UseSpecialistsFiltersReturn {
  // Individual state values
  const [searchTerm, setSearchTermState] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCity, setSelectedCityState] = useState<string | null>(null)
  const [selectedSpecialistType, setSelectedSpecialistTypeState] = useState<'solo' | 'company' | null>(null)
  const [selectedServices, setSelectedServicesState] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguagesState] = useState<string[]>([])

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

  const setSelectedCity = useCallback((city: string | null) => {
    setSelectedCityState(city)
  }, [])

  const setSelectedSpecialistType = useCallback((type: 'solo' | 'company' | null) => {
    setSelectedSpecialistTypeState(type)
  }, [])

  const setSelectedServices = useCallback((services: string[]) => {
    setSelectedServicesState(services)
  }, [])

  const setSelectedLanguages = useCallback((languages: string[]) => {
    setSelectedLanguagesState(languages)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTermState('')
    setDebouncedSearchTerm('')
    setSelectedCityState(null)
    setSelectedSpecialistTypeState(null)
    setSelectedServicesState([])
    setSelectedLanguagesState([])
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearchTerm !== '' ||
      selectedCity !== null ||
      selectedSpecialistType !== null ||
      selectedServices.length > 0 ||
      selectedLanguages.length > 0
    )
  }, [debouncedSearchTerm, selectedCity, selectedSpecialistType, selectedServices, selectedLanguages])

  return {
    // State values (direct access)
    searchTerm,
    debouncedSearchTerm,
    selectedCity,
    selectedSpecialistType,
    selectedServices,
    selectedLanguages,
    // Setters
    setSearchTerm,
    setSelectedCity,
    setSelectedSpecialistType,
    setSelectedServices,
    setSelectedLanguages,
    clearFilters,
    hasActiveFilters,
  }
}
