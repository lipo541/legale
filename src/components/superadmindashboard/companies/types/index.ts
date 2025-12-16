// ============================================================================
// Companies - TypeScript Types & Interfaces
// ============================================================================

export type Language = 'ka' | 'en' | 'ru'

export type VerificationStatus = 'verified' | 'unverified' | 'pending' | 'rejected'

export type SortColumn = 'full_name' | 'email' | 'created_at' | 'updated_at' | 'verification_status'

export type SortOrder = 'asc' | 'desc'

// Filter types
export type VerificationFilter = 'ALL' | VerificationStatus
export type BlockFilter = 'ALL' | 'blocked' | 'active'

// ============================================================================
// Company Profile Interface
// ============================================================================

export interface CompanyProfile {
  id: string
  email: string | null
  full_name: string | null
  role: 'COMPANY'
  avatar_url: string | null
  company_slug: string | null
  phone_number: string | null
  created_at: string
  updated_at: string
  is_blocked: boolean | null
  blocked_by: string | null
  blocked_at: string | null
  block_reason: string | null
  verification_status: VerificationStatus | null
  verification_reviewed_at: string | null
  verification_reviewed_by: string | null
  verification_notes: string | null
  // Company Overview
  company_overview: string | null
  summary: string | null
  mission_statement: string | null
  vision_values: string | null
  history: string | null
  how_we_work: string | null
  // Contact
  website: string | null
  address: string | null
  map_link: string | null
  // Social Links
  facebook_link: string | null
  instagram_link: string | null
  linkedin_link: string | null
  twitter_link: string | null
  // Logo
  logo_url: string | null
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
// Edit Form Interface
// ============================================================================

export interface CompanyEditForm {
  full_name: string
  email: string
  phone_number: string
  company_slug: string
  company_overview: string
  summary: string
  mission_statement: string
  vision_values: string
  history: string
  how_we_work: string
  website: string
  address: string
  map_link: string
  facebook_link: string
  instagram_link: string
  linkedin_link: string
  twitter_link: string
}

// ============================================================================
// Filters Interface
// ============================================================================

export interface CompanyFilters {
  search: string
  verification: VerificationFilter
  blocked: BlockFilter
  dateFrom: string
  dateTo: string
}

// ============================================================================
// Stats Interface
// ============================================================================

export interface CompanyStats {
  total: number
  verified: number
  unverified: number
  pending: number
  blocked: number
}

// ============================================================================
// Modal Config Interface
// ============================================================================

export interface ModalConfig {
  isOpen: boolean
  type: 'success' | 'error' | 'confirm' | 'info'
  message: string
  onConfirm?: () => void
}

// ============================================================================
// Default Values
// ============================================================================

export const defaultEditForm: CompanyEditForm = {
  full_name: '',
  email: '',
  phone_number: '',
  company_slug: '',
  company_overview: '',
  summary: '',
  mission_statement: '',
  vision_values: '',
  history: '',
  how_we_work: '',
  website: '',
  address: '',
  map_link: '',
  facebook_link: '',
  instagram_link: '',
  linkedin_link: '',
  twitter_link: ''
}

export const defaultFilters: CompanyFilters = {
  search: '',
  verification: 'ALL',
  blocked: 'ALL',
  dateFrom: '',
  dateTo: ''
}

export const defaultModalConfig: ModalConfig = {
  isOpen: false,
  type: 'info',
  message: '',
  onConfirm: undefined
}
