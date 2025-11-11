// Database Types (will be generated from Supabase)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User Roles
export type UserRole = 'user' | 'author' | 'specialist' | 'company' | 'admin'

// Basic Types (ესენი განახლდება როცა Database Schema შევქმნით)
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  phone: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  verified: boolean
  created_at: string
  updated_at: string
}

export interface Specialist {
  id: string
  user_id: string
  company_id: string | null
  bio: string | null
  years_experience: number
  education: string | null
  certifications: string[] | null
  languages: string[]
  hourly_rate: number | null
  available: boolean
  verified: boolean
  created_at: string
  updated_at: string
}

export interface PracticeArea {
  id: string
  slug: string
  icon: string | null
  parent_id: string | null
  order_index: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  practice_area_id: string
  company_id: string
  slug: string
  price: number | null
  currency: string
  duration: number | null
  active: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  slug: string
  content: string | null
  excerpt: string | null
  image_url: string | null
  reading_time: number | null
  views: number
  published: boolean
  published_at: string | null
  featured: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  slug: string
  color: string
  parent_id: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  user_id: string
  service_id: string | null
  specialist_id: string | null
  subject: string
  message: string
  phone: string | null
  email: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

export interface Translation {
  id: string
  table_name: string
  record_id: string
  field_name: string
  locale: 'ka' | 'en' | 'ru'
  value: string
  created_at: string
  updated_at: string
}

// ============================================================================
// Global Messages System Types
// ============================================================================

export interface GlobalMessage {
  id: string
  title_ka: string
  title_en: string
  title_ru: string
  content_ka: string
  content_en: string
  content_ru: string
  created_by: string
  is_active: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  expires_at: string | null
}

export interface MessageTargetRole {
  message_id: string
  target_role: 'USER' | 'AUTHOR' | 'SPECIALIST' | 'SOLO_SPECIALIST' | 'COMPANY' | 'MODERATOR'
}

export interface UserReadMessage {
  user_id: string
  message_id: string
  read_at: string
}

// Combined type for displaying messages with all related data
export interface MessageWithStatus {
  message_id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  is_read: boolean
  read_at: string | null
  target_roles?: string[]
}

// Type for creating new messages (SuperAdmin only)
export interface CreateMessageData {
  title_ka: string
  title_en: string
  title_ru: string
  content_ka: string
  content_en: string
  content_ru: string
  target_roles: Array<'USER' | 'AUTHOR' | 'SPECIALIST' | 'SOLO_SPECIALIST' | 'COMPANY' | 'MODERATOR'>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: string | null
}

// Type for message form state
export interface MessageFormData {
  titles: {
    ka: string
    en: string
    ru: string
  }
  contents: {
    ka: string
    en: string
    ru: string
  }
  target_roles: Set<string>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: Date | null
}

// Type for message read statistics
export interface MessageReadStat {
  user_id: string
  full_name: string | null
  email: string
  role: string
  read_at: string
}

// Type for message with statistics
export interface MessageWithStats {
  read_count: number
  target_count: number
  read_users?: MessageReadStat[]
}
