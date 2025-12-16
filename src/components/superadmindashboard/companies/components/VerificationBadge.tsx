// ============================================================================
// VerificationBadge Component
// ============================================================================

import { memo } from 'react'
import { CheckCircle, Clock, XCircle, Ban, AlertCircle } from 'lucide-react'
import type { VerificationStatus } from '../types'

interface VerificationBadgeProps {
  status: VerificationStatus | null
  isBlocked?: boolean
  isDark: boolean
  size?: 'sm' | 'md'
}

function VerificationBadge({ status, isBlocked, isDark, size = 'md' }: VerificationBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5'
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  if (isBlocked) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
        isDark 
          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
          : 'bg-red-500/10 text-red-600 border border-red-500/20'
      }`}>
        <Ban className={iconSize} />
        დაბლოკილი
      </span>
    )
  }

  switch (status) {
    case 'verified':
      return (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
          isDark 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
        }`}>
          <CheckCircle className={iconSize} />
          ვერიფიცირებული
        </span>
      )
    case 'pending':
      return (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
          isDark 
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
        }`}>
          <Clock className={iconSize} />
          მოლოდინში
        </span>
      )
    case 'rejected':
      return (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
          isDark 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          <XCircle className={iconSize} />
          უარყოფილი
        </span>
      )
    default:
      return (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
          isDark 
            ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' 
            : 'bg-gray-500/10 text-gray-600 border border-gray-500/20'
        }`}>
          <AlertCircle className={iconSize} />
          არავერიფიცირებული
        </span>
      )
  }
}

export default memo(VerificationBadge)
