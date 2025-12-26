// ==================== Companies Module Types ====================
// Centralized type definitions for all company-related components

// ==================== Locale Type ====================
export type LocaleString = 'ka' | 'en' | 'ru'

// ==================== Company Type ====================
export interface Company {
  id: string
  full_name: string
  company_slug: string
  logo_url?: string | null
  summary?: string | null
  address?: string | null
  phone_number?: string | null
  website?: string | null
  role: string
  status: string
}

// ==================== Filter Types ====================
export interface Specialization {
  id: string
  name: string
}

export interface CityData {
  id: string
  name: string
  name_ka?: string
  name_en?: string
  name_ru?: string
}

export interface CompanyFilters {
  searchTerm: string
  debouncedSearchTerm: string
  selectedCompany: string | null
  selectedSpecialization: string | null
  selectedCity: string | null
}

export type ViewMode = 'grid' | 'list'
export type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a'

// ==================== Statistics Types ====================
export interface CompaniesStats {
  totalCompanies: number
  totalSpecialists: number
  totalServices: number
}

// ==================== Page Initial Data (Server → Client) ====================
export interface CompaniesPageInitialData {
  companies: Company[]
  stats: CompaniesStats
  cities: CityData[]           // Cities for filter dropdown (pre-fetched from server)
  specializations: Specialization[] // Specializations for filter dropdown
}

export interface CompaniesPageClientProps {
  initialData: CompaniesPageInitialData
  locale: string
}

// ==================== Hero Props ====================
export interface CompaniesHeroProps {
  totalCompanies?: number
  locale: string
}

// ==================== Filter State Hook Return ====================
export interface UseCompaniesFiltersReturn {
  // State values
  searchTerm: string
  debouncedSearchTerm: string
  selectedCompany: string | null
  selectedSpecialization: string | null
  selectedCity: string | null
  // Setters
  setSearchTerm: (term: string) => void
  setSelectedCompany: (company: string | null) => void
  setSelectedSpecialization: (spec: string | null) => void
  setSelectedCity: (city: string | null) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

// ==================== Sort & View State Hook Return ====================
export interface UseCompaniesViewReturn {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
}

// ==================== Data Hook Types ====================
export interface UseCompaniesDataProps {
  initialCompanies: Company[]
  filters: CompanyFilters
  locale: string
  sortBy: string
}

export interface UseCompaniesDataReturn {
  companies: Company[]
  loading: boolean
  error: Error | null
  hasActiveFilters: boolean
}
