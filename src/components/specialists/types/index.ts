// ==================== Specialists Module Types ====================
// Centralized type definitions for all specialist-related components

// ==================== Locale Type ====================
export type LocaleString = 'ka' | 'en' | 'ru'

// ==================== Base Specialist Types ====================
export interface BaseSpecialist {
  id: string
  full_name: string
  role_title: string | null
  bio: string | null
  avatar_url?: string | null
  slug?: string
  email?: string | null
  phone_number?: string | null
  info_activate?: boolean
}

// Solo specialist (without company info)
export interface SoloSpecialist extends BaseSpecialist {}

// Company specialist (with company info)
export interface CompanySpecialist extends BaseSpecialist {
  company: string
  company_slug?: string
  company_email?: string | null
  company_phone?: string | null
  company_id?: string
}

export type Specialist = SoloSpecialist | CompanySpecialist

// ==================== Card Props ====================
export interface SpecialistCardProps {
  specialist: SoloSpecialist | CompanySpecialist
  type: 'solo' | 'company'
  viewMode?: 'grid' | 'list'
  locale?: string
}

// ==================== Filter Types ====================
export interface SpecialistFilters {
  searchTerm: string
  debouncedSearchTerm: string
  selectedCity: string | null
  selectedSpecialistType: 'solo' | 'company' | null
  selectedServices: string[]
  selectedLanguages: string[]
}

export type ViewMode = 'grid' | 'list'
export type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a'

// ==================== Statistics Types ====================
export interface SpecialistsStats {
  totalCompanies: number
  totalSpecialists: number
  totalServices: number
}

// ==================== City & Service Types ====================
export interface City {
  id: string
  name: string
}

export interface Service {
  id: string
  title: string
  practice_id?: string
}

export interface Practice {
  id: string
  title: string
}

// City data from server (with translations)
export interface CityData {
  id: string
  name: string
  name_ka?: string
  name_en?: string
  name_ru?: string
  count?: number
}

// Service data from server (with translation)
export interface ServiceData {
  id: string
  title: string
  service_id?: string
}

// ==================== Page Initial Data (Server → Client) ====================
export interface SpecialistsPageInitialData {
  soloSpecialists: SoloSpecialist[]
  companySpecialists: CompanySpecialist[]
  stats: SpecialistsStats
  cities: CityData[]      // Cities for filter dropdown (pre-fetched from server)
  services: ServiceData[] // Services for filter dropdown (pre-fetched from server)
}

export interface SpecialistsPageClientProps {
  initialData: SpecialistsPageInitialData
  locale: string
}

// ==================== Featured Section Props ====================
export interface FeaturedSpecialistsSectionProps {
  specialists?: Specialist[]
  locale: string
}

// ==================== Hero Props ====================
export interface SpecialistsHeroProps {
  totalSpecialists?: number
  locale: string
}

// ==================== Filter State Hook Return ====================
export interface UseSpecialistsFiltersReturn {
  // State values
  searchTerm: string
  debouncedSearchTerm: string
  selectedCity: string | null
  selectedSpecialistType: 'solo' | 'company' | null
  selectedServices: string[]
  selectedLanguages: string[]
  // Setters
  setSearchTerm: (term: string) => void
  setSelectedCity: (city: string | null) => void
  setSelectedSpecialistType: (type: 'solo' | 'company' | null) => void
  setSelectedServices: (services: string[]) => void
  setSelectedLanguages: (languages: string[]) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

// ==================== Sort & View State Hook Return ====================
export interface UseSpecialistsViewReturn {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
}

// ==================== Skeleton Props ====================
export interface SpecialistCardSkeletonProps {
  viewMode?: ViewMode
}

// ==================== Share Types ====================
export type SharePlatform = 'facebook' | 'linkedin' | 'twitter'
