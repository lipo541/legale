// ==================== Service Module Types ====================
// Centralized type definitions for all service-related components

import { Locale, UserRole } from '@/lib/enums'

// ==================== Locale Type ====================
export type LocaleString = 'ka' | 'en' | 'ru'

// ==================== Service Types ====================
export interface ServiceItem {
  id: string
  title: string
  slug: string
}

export interface ServiceTranslation {
  title: string
  slug: string
  description: string
  image_alt: string
  practice_title?: string
  practice_slug?: string
}

// ==================== Service Detail Types ====================
export interface ServiceData {
  id: string
  practiceId: string
  imageUrl: string
  ogImageUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface ServiceTranslationData {
  title: string
  slug: string
  description: string // HTML content
  imageAlt: string
  wordCount: number
  readingTime: number
  metaTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
}

export interface ServicePracticeData {
  id: string
  title: string
  slug: string
}

export interface ServiceDetailProps {
  service: ServiceData
  translation: ServiceTranslationData
  practice: ServicePracticeData
  locale: Locale
}

// ==================== Service Card Types ====================
export interface ServiceCardProps {
  id: string
  image_url: string
  translation: ServiceTranslation
  locale: LocaleString
  viewMode?: 'grid' | 'list'
}

// ==================== Specialist Types ====================
export interface Specialist {
  id: string
  full_name: string
  role_title: string
  avatar_url: string | null
  slug: string | null
  role: UserRole.SPECIALIST | UserRole.SOLO_SPECIALIST
}

export interface ServiceSpecialistCardProps {
  serviceId: string
  locale: Locale
}

// ==================== Hook Types ====================
export interface UseServiceSpecialistsResult {
  specialists: Specialist[]
  loading: boolean
}

export interface UseServiceItemsResult {
  services: ServiceItem[]
  loading: boolean
}

// ==================== Share Types ====================
export type SharePlatform = 'facebook' | 'linkedin' | 'twitter'
