'use client'

import { memo } from 'react'
import { Clock, CheckCircle, XCircle, Building2, User } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { AccessStatus, VerificationStatus } from '../types'

interface StatusBadgeProps {
  status: AccessStatus | VerificationStatus
  type?: 'access' | 'verification'
}

function StatusBadge({ status, type = 'access' }: StatusBadgeProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Access status badges
  if (type === 'access') {
    switch (status) {
      case 'PENDING':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'
          }`}>
            <Clock className="h-2.5 w-2.5" />
            მოლოდინში
          </span>
        )
      case 'APPROVED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'
          }`}>
            <CheckCircle className="h-2.5 w-2.5" />
            დამტკიცებული
          </span>
        )
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
          }`}>
            <XCircle className="h-2.5 w-2.5" />
            უარყოფილი
          </span>
        )
      default:
        return null
    }
  }

  // Verification status badges
  switch (status) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'
        }`}>
          <Clock className="h-2.5 w-2.5" />
          მოლოდინში
        </span>
      )
    case 'verified':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'
        }`}>
          <CheckCircle className="h-2.5 w-2.5" />
          ვერიფიცირებული
        </span>
      )
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
        }`}>
          <XCircle className="h-2.5 w-2.5" />
          უარყოფილი
        </span>
      )
    default:
      return null
  }
}

interface RequestTypeBadgeProps {
  type: 'SPECIALIST' | 'COMPANY' | 'SOLO_SPECIALIST'
}

export function RequestTypeBadge({ type }: RequestTypeBadgeProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (type === 'COMPANY') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'
      }`}>
        <Building2 className="h-2.5 w-2.5" />
        კომპანია
      </span>
    )
  }

  if (type === 'SOLO_SPECIALIST') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-600'
      }`}>
        <User className="h-2.5 w-2.5" />
        სოლო
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
      isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
    }`}>
      <User className="h-2.5 w-2.5" />
      სპეციალისტი
    </span>
  )
}

export default memo(StatusBadge)
