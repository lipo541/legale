// ==================== Practice Types ====================
// Centralized type definitions for practice components

import type { Locale } from '@/lib/enums'

// Re-export Locale for convenience
export type { Locale }

// Locale string type (for components that use string literals)
export type LocaleString = 'ka' | 'en' | 'ru'

// ==================== Common Types ====================
export type ViewMode = 'grid' | 'list'
export type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a'
export type ResultType = 'practices' | 'services'

// ==================== Practice Types ====================
export interface PracticeTranslation {
  title: string
  slug: string
  description: string
  hero_image_alt: string
  word_count?: number
  reading_time?: number
  category?: string
  services_count?: number
}

export interface PracticeData {
  id: string
  hero_image_url: string
  practice_translations: PracticeTranslation[]
  services?: Array<{ count: number }>
}

// ==================== Service Types ====================
export interface ServiceTranslation {
  title: string
  slug: string
  description: string
  image_alt: string
}

export interface ServiceData {
  id: string
  image_url: string
  practice_id: string
  service_translations: ServiceTranslation[]
  practices: Array<{
    practice_translations: Array<{
      title: string
      slug: string
    }>
  }>
}

// Simple service for sidebar
export interface Service {
  id: string
  title: string
  slug: string
}

// ==================== Practice Card Props ====================
export interface PracticeCardProps {
  id: string
  hero_image_url: string
  translation: PracticeTranslation
  locale: LocaleString
  viewMode?: ViewMode
}

// ==================== Practice Detail Types ====================
export interface PracticeDetailData {
  id: string
  heroImageUrl: string
  pageHeroImageUrl: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface PracticeDetailTranslation {
  title: string
  slug: string
  description: string // HTML content
  heroImageAlt: string
  pageHeroImageAlt: string
  wordCount: number
  readingTime: number
  metaTitle: string | null
  metaDescription: string | null
  focusKeyword: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImageUrl: string | null
}

export interface PracticeDetailProps {
  practice: PracticeDetailData
  translation: PracticeDetailTranslation
  locale: Locale
}

// ==================== Filter Types ====================
export interface FilterOption {
  value: string
  label: string
}

export interface PracticeFiltersState {
  searchQuery: string
  debouncedSearchQuery: string
  categoryFilter: string
  sortBy: SortOption
  viewMode: ViewMode
  activeTab: ResultType
  displayCount: number
}

// ==================== Share Types ====================
export type SharePlatform = 'facebook' | 'linkedin' | 'twitter'

// ==================== Page Props (Server → Client) ====================
export interface PracticePageInitialData {
  practices: PracticeData[]
  services: ServiceData[]
  categories: string[]
}

export interface PracticePageClientProps {
  initialData: PracticePageInitialData
  locale: LocaleString
}
