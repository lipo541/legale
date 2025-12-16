// Access Request Types
export interface AccessRequest {
  id: string
  user_id: string
  request_type: 'SPECIALIST' | 'COMPANY' | 'SOLO_SPECIALIST'
  full_name: string
  company_slug: string | null
  phone_number: string
  about: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  user_email?: string
}

// Verification Request Types
export interface VerificationRequest {
  id: string
  email: string | null
  full_name: string | null
  role_title: string | null
  phone_number: string | null
  avatar_url: string | null
  slug: string | null
  bio: string | null
  philosophy: string | null
  languages: string[] | null
  focus_areas: string[] | null
  representative_matters: string[] | null
  teaching_writing_speaking: string | null
  credentials_memberships: string[] | null
  values_how_we_work: Record<string, string> | null
  verification_status: VerificationStatus
  verification_requested_at: string | null
  verification_reviewed_at: string | null
  verification_reviewed_by: string | null
  verification_notes: string | null
  created_at: string
  updated_at: string
  role?: string
  company_id?: string | null
}

export interface CompanyVerificationRequest {
  id: string
  email: string | null
  full_name: string | null
  company_slug: string | null
  phone_number: string | null
  avatar_url: string | null
  bio: string | null
  verification_status: VerificationStatus
  verification_requested_at: string | null
  verification_reviewed_at: string | null
  verification_reviewed_by: string | null
  verification_notes: string | null
  created_at: string
  updated_at: string
}

// Status Types
export type AccessStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified'
export type RequestTab = 'access' | 'verification' | 'companySpecialist' | 'company'

// Filter Types
export interface RequestFilters {
  searchQuery: string
  statusFilter: 'ALL' | AccessStatus
  verificationStatusFilter: 'ALL' | VerificationStatus
  dateFrom: string
  dateTo: string
}

// Stats Types
export interface RequestStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface VerificationStats {
  total: number
  pending: number
  verified: number
  rejected: number
}
