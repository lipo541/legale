// User Roles
export enum UserRole {
  USER = 'USER',
  SPECIALIST = 'SPECIALIST',
  SOLO_SPECIALIST = 'SOLO_SPECIALIST',
  COMPANY = 'COMPANY',
  AUTHOR = 'AUTHOR',
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR'
}

// Message Target Roles (excluding SUPER_ADMIN as they send messages)
export enum MessageTargetRole {
  USER = 'USER',
  AUTHOR = 'AUTHOR',
  SPECIALIST = 'SPECIALIST',
  SOLO_SPECIALIST = 'SOLO_SPECIALIST',
  COMPANY = 'COMPANY',
  MODERATOR = 'MODERATOR'
}

// Message Priority
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Specialist Status
export enum SpecialistStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED'
}

// Service Status
export enum ServiceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// Supported Locales
export enum Locale {
  KA = 'ka',
  EN = 'en',
  RU = 'ru'
}

// Type Guards
export function isValidLocale(locale: string): locale is Locale {
  return Object.values(Locale).includes(locale as Locale)
}

export function isSpecialistRole(role: string): role is UserRole.SPECIALIST | UserRole.SOLO_SPECIALIST {
  return role === UserRole.SPECIALIST || role === UserRole.SOLO_SPECIALIST
}

// Window type guard
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

export function getWindowWidth(): number {
  if (!isClient()) return 0
  return window.innerWidth
}
