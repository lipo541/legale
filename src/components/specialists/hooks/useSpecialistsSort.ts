/**
 * Custom Hook: useSpecialistsSort
 * Provides sorting functionality for specialists
 */

'use client'

import { useCallback } from 'react'
import type { Specialist, SortOption } from '../types'

export function useSpecialistsSort(sortBy: SortOption, locale: string) {
  const sortSpecialists = useCallback(<T extends { full_name: string; id: string }>(
    specialists: T[]
  ): T[] => {
    const sorted = [...specialists]
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => b.id.localeCompare(a.id))
      case 'oldest':
        return sorted.sort((a, b) => a.id.localeCompare(b.id))
      case 'a-z':
        return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name, locale))
      case 'z-a':
        return sorted.sort((a, b) => b.full_name.localeCompare(a.full_name, locale))
      default:
        return sorted
    }
  }, [sortBy, locale])

  return { sortSpecialists }
}
