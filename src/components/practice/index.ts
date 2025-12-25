// ==================== Practice Module ====================
// Barrel export for all practice-related components, hooks, and types

// Main components
export { default as PracticePage } from './PracticePage'
export { default as PracticePageClient } from './PracticePageClient'
export { default as PracticeDetail } from './PracticeDetail'
export { default as PracticeCard } from './PracticeCard'
export { default as PracticeCardSkeleton } from './PracticeCardSkeleton'

// Sub-components
export { PracticeCardGrid, PracticeCardList } from './components'

// Hooks
export { useShareHandler, usePracticeServices } from './hooks'

// Types
export type {
  ViewMode,
  SortOption,
  ResultType,
  PracticeTranslation,
  PracticeData,
  ServiceTranslation,
  ServiceData,
  Service,
  PracticeCardProps,
  PracticeDetailData,
  PracticeDetailTranslation,
  PracticeDetailProps,
  FilterOption,
  PracticeFiltersState,
  SharePlatform,
} from './types'
