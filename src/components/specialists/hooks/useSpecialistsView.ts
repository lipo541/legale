/**
 * Custom Hook: useSpecialistsView
 * Manages view mode and sort preferences with localStorage persistence
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ViewMode, SortOption, UseSpecialistsViewReturn } from '../types'

const VIEW_MODE_KEY = 'specialists-view-mode'
const SORT_BY_KEY = 'specialists-sort-by'

export function useSpecialistsView(): UseSpecialistsViewReturn {
  // Initialize with defaults to avoid hydration mismatch
  const [viewMode, setViewModeState] = useState<ViewMode>('grid')
  const [sortBy, setSortByState] = useState<SortOption>('newest')

  // Load from localStorage after mount
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_MODE_KEY)
    if (savedView === 'list' || savedView === 'grid') {
      setViewModeState(savedView)
    }

    const savedSort = localStorage.getItem(SORT_BY_KEY)
    if (savedSort) {
      setSortByState(savedSort as SortOption)
    }
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }, [])

  const setSortBy = useCallback((sort: SortOption) => {
    setSortByState(sort)
    localStorage.setItem(SORT_BY_KEY, sort)
  }, [])

  return {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
  }
}
