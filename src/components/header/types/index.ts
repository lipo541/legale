import type { Locale } from '@/lib/i18n/config'

// ============================================================================
// Header Types
// ============================================================================

export interface NavLink {
  href: string
  label: string
}

export interface HeaderTranslations {
  practices: string
  specialists: string
  companies: string
  news: string
  contact: string
  login: string
  register: string
  logout: string
  dashboard: string
  adminDashboard: string
  myProfile: string
  requestPending: string
}

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MODERATOR' 
  | 'COMPANY' 
  | 'SOLO_SPECIALIST' 
  | 'SPECIALIST' 
  | 'AUTHOR' 
  | 'USER' 
  | null

export interface DashboardRoute {
  role: UserRole
  href: string
  label: string
  isAdmin?: boolean
}

// Props for sub-components
export interface LogoProps {
  isDark: boolean
}

export interface DesktopNavProps {
  navLinks: NavLink[]
  isDark: boolean
}

export interface DashboardButtonProps {
  role: UserRole
  locale: Locale
  isDark: boolean
  label: string
  adminLabel?: string
  hasPendingRequest?: boolean
  isMobile?: boolean
  onClick?: () => void
}

export interface AuthButtonsProps {
  locale: Locale
  isDark: boolean
  translations: Pick<HeaderTranslations, 'login' | 'register' | 'logout'>
  onLogout: () => void
  isMobile?: boolean
  onMobileClick?: () => void
}

export interface MobileMenuProps {
  isOpen: boolean
  navLinks: NavLink[]
  isDark: boolean
  locale: Locale
  translations: HeaderTranslations
  user: { id: string; email?: string } | null
  role: UserRole
  hasPendingRequest: boolean
  loading: boolean
  onToggle: () => void
  onLogout: () => void
}
