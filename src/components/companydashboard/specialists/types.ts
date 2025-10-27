export interface Specialist {
  id: string
  email: string | null
  full_name: string | null
  role: 'SPECIALIST'
  role_title: string | null
  phone_number: string | null
  avatar_url: string | null
  bio: string | null
  philosophy: string | null
  languages: string[] | null
  focus_areas: string[] | null
  representative_matters: string[] | null
  teaching_writing_speaking: string | null
  credentials_memberships: string[] | null
  values_how_we_work: Record<string, string> | null
  verification_status: string | null
  verification_notes: string | null
  verification_reviewed_at: string | null
  company_id: string | null
  company_slug: string | null
  company_name?: string | null
  is_blocked: boolean | null
  blocked_by: string | null
  blocked_at: string | null
  block_reason: string | null
  created_at: string
  updated_at: string
}

export const AVAILABLE_LANGUAGES = ['English', 'Georgian', 'Russian', 'German']
