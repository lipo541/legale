// ==================== Specialists Hooks ====================
// Barrel exports for all specialist-related hooks

export { useSpecialistsFilters } from './useSpecialistsFilters'
export { useSpecialistsView } from './useSpecialistsView'
export { useSpecialistsSort } from './useSpecialistsSort'
export { useSpecialistsData } from './useSpecialistsData'

// Re-export shared hooks from practice module (direct import to avoid barrel loading usePracticeServices)
export { useShareHandler } from '@/components/practice/hooks/useShareHandler'
