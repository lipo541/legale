import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import type { DashboardButtonProps, UserRole } from '../types'
import type { Locale } from '@/lib/i18n/config'

// Role to URL mapping
const getDashboardUrl = (role: UserRole, locale: Locale): string => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return `/${locale}/admin`
    case 'MODERATOR':
      return `/${locale}/moderator-dashboard`
    case 'COMPANY':
      return `/${locale}/company-dashboard`
    case 'SOLO_SPECIALIST':
      return `/${locale}/solo-specialist-dashboard`
    case 'SPECIALIST':
      return `/${locale}/specialist-dashboard`
    case 'AUTHOR':
      return `/${locale}/author-dashboard`
    case 'USER':
    default:
      return `/${locale}/complete-profile`
  }
}

// Check if role is admin-like
const isAdminRole = (role: UserRole): boolean => {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}

export default function DashboardButton({ 
  role, 
  locale, 
  isDark, 
  label,
  adminLabel,
  hasPendingRequest = false,
  isMobile = false,
  onClick
}: DashboardButtonProps) {
  // For USER role, show profile button with pending request badge
  if (!role || role === 'USER') {
    return (
      <Link
        href={`/${locale}/complete-profile`}
        onClick={onClick}
        style={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          color: isDark ? '#FFFFFF' : '#000000',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
        onMouseEnter={!isMobile ? (e) => {
          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
        } : undefined}
        onMouseLeave={!isMobile ? (e) => {
          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
        } : undefined}
        className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-2 px-4 py-2 rounded-lg ${isMobile ? 'text-base' : 'text-xs'} font-medium transition-all duration-300 ${isMobile ? 'active:scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
      >
        {hasPendingRequest ? (
          <>
            {label}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              განხილვაშია
            </span>
          </>
        ) : (
          label
        )}
      </Link>
    )
  }

  // For all other roles, show dashboard button
  const href = getDashboardUrl(role, locale)
  const buttonLabel = isAdminRole(role) && adminLabel ? adminLabel : label

  return (
    <Link 
      href={href}
      onClick={onClick}
      style={{
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        color: isDark ? '#FFFFFF' : '#000000',
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
      onMouseEnter={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
        e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
      } : undefined}
      onMouseLeave={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
        e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
      } : undefined}
      className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-2 px-4 py-2 rounded-lg ${isMobile ? 'text-base' : 'text-xs'} font-medium transition-all duration-300 ${isMobile ? 'active:scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
    >
      <LayoutDashboard className="w-4 h-4" />
      {buttonLabel}
    </Link>
  )
}
