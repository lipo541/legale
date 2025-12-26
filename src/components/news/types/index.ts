/**
 * News Page Types
 * Centralized type definitions for SSR news page
 */

// ============================================================================
// POST TYPES
// ============================================================================

export interface PostTranslation {
  id?: string
  post_id?: string
  language: string
  title: string
  excerpt?: string
  content?: string
  slug: string
  category?: string
  category_id?: string
  category_slug?: string
  reading_time?: number
  meta_title?: string
  meta_description?: string
}

export interface PostDisplaySettings {
  focal_point_x: number
  focal_point_y: number
}

export interface PostAuthor {
  id?: string
  email: string
  full_name?: string
  role?: string
  company_id?: string
  company?: {
    full_name?: string
    company_slug?: string
  }
}

export interface Post {
  id: string
  author_id?: string
  practice_id?: string
  display_position?: number
  position_order?: number
  category_id?: string
  featured_image_url?: string
  published_at: string
  status: string
  created_at?: string
  updated_at?: string
  post_translations: PostTranslation[]
  display_settings?: PostDisplaySettings
  author?: PostAuthor
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
}

export interface GroupedPosts {
  [categoryId: string]: {
    name: string
    slug: string
    posts: Post[]
  }
}

// ============================================================================
// STATS TYPES
// ============================================================================

export interface NewsStats {
  totalPosts: number
  totalCategories: number
}

// ============================================================================
// INITIAL DATA TYPES (SSR)
// ============================================================================

export interface NewsPageInitialData {
  posts: Post[]
  categories: Category[]
  stats: NewsStats
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface NewsLayoutProps {
  locale: string
  initialData: NewsPageInitialData
}

export interface AllPostsSectionProps {
  initialPosts: Post[]
  categories: Category[]
  locale: string
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseNewsDataOptions {
  initialPosts: Post[]
  locale: string
}

export interface UseNewsDataReturn {
  posts: Post[]
  loading: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
}

// ============================================================================
// SORT OPTIONS
// ============================================================================

export type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'most-read'
