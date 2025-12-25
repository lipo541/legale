// ============================================================================
// Company Specialists - TypeScript Types & Interfaces
// ============================================================================

export type Language = 'ka' | 'en' | 'ru'

export type VerificationStatus = 'verified' | 'unverified' | 'pending' | 'rejected'

export type SortColumn = 'full_name' | 'email' | 'created_at' | 'updated_at' | 'verification_status' | 'company_name'

export type SortOrder = 'asc' | 'desc'

// Filter types
export type VerificationFilter = 'ALL' | VerificationStatus
export type BlockFilter = 'ALL' | 'blocked' | 'active'
export type InfoActivateFilter = 'ALL' | 'active' | 'inactive'

// ============================================================================
// Company Specialist Profile Interface
// ============================================================================

export interface CompanySpecialistProfile {
  id: string
  email: string | null
  full_name: string | null
  role: 'SPECIALIST'
  role_title: string | null
  phone_number: string | null
  slug: string | null
  avatar_url: string | null
  bio: string | null
  philosophy: string | null
  languages: string[] | null
  focus_areas: string[] | null
  representative_matters: string[] | null
  teaching_writing_speaking: string | null
  credentials_memberships: string[] | null
  values_how_we_work: Record<string, string> | null
  verification_status: VerificationStatus | null
  verification_notes: string | null
  verification_reviewed_at: string | null
  is_blocked: boolean | null
  info_activate: boolean | null
  is_homepage_featured: boolean | null
  homepage_featured_order: number | null
  created_at: string
  updated_at: string
  // Company-specific fields
  company_id: string | null
  company_slug: string | null
  company_name?: string | null
  company_is_blocked?: boolean
}

// ============================================================================
// City Interface
// ============================================================================

export interface City {
  id: string
  name_ka: string
  name_en: string
  name_ru: string
}

// ============================================================================
// Company Interface
// ============================================================================

export interface Company {
  id: string
  full_name: string
  company_slug: string
}

// ============================================================================
// Edit Form Interface
// ============================================================================

export interface SpecialistEditForm {
  full_name: string
  email: string
  role_title: string
  phone_number: string
  slug: string
  bio: string
  philosophy: string
  languages: string[]
  focus_areas_text: string
  representative_matters_text: string
  teaching_writing_speaking: string
  credentials_memberships_text: string
  values_how_we_work: Record<string, string>
}

// ============================================================================
// Filter State Interface
// ============================================================================

export interface FiltersState {
  searchTerm: string
  verificationFilter: VerificationFilter
  blockFilter: BlockFilter
  infoActivateFilter: InfoActivateFilter
  companyFilter: string  // 'ALL' or company_id - specific to company specialists
  dateFrom: string
  dateTo: string
}

// ============================================================================
// Loading States Interface
// ============================================================================

export interface LoadingStates {
  fetching: boolean
  deleting: string | null
  updating: string | null
  uploadingPhoto: string | null
  blocking: string | null
  changingVerification: string | null
  togglingInfoActivate: string | null
  convertingToSolo: string | null
  changingCompany: string | null
}

// ============================================================================
// Modal Config Interface
// ============================================================================

export interface ModalConfig {
  isOpen: boolean
  type: 'confirm' | 'success' | 'error' | 'info'
  message: string
  onConfirm?: () => void
}

// ============================================================================
// Specialist Stats Interface
// ============================================================================

export interface SpecialistStats {
  total: number
  verified: number
  pending: number
  blocked: number
  rejected: number
  filtered: number
}

// ============================================================================
// Default Values
// ============================================================================

export const defaultFilters: FiltersState = {
  searchTerm: '',
  verificationFilter: 'ALL',
  blockFilter: 'ALL',
  infoActivateFilter: 'ALL',
  companyFilter: 'ALL',
  dateFrom: '',
  dateTo: ''
}

export const defaultLoadingStates: LoadingStates = {
  fetching: true,
  deleting: null,
  updating: null,
  uploadingPhoto: null,
  blocking: null,
  changingVerification: null,
  togglingInfoActivate: null,
  convertingToSolo: null,
  changingCompany: null
}

export const defaultEditForm: SpecialistEditForm = {
  full_name: '',
  email: '',
  role_title: '',
  phone_number: '',
  slug: '',
  bio: '',
  philosophy: '',
  languages: [],
  focus_areas_text: '',
  representative_matters_text: '',
  teaching_writing_speaking: '',
  credentials_memberships_text: '',
  values_how_we_work: {}
}

export const defaultModalConfig: ModalConfig = {
  isOpen: false,
  type: 'info',
  message: ''
}

// ============================================================================
// Available Languages
// ============================================================================

export const AVAILABLE_LANGUAGES = ['English', 'Georgian', 'Russian', 'German', 'Spanish']
