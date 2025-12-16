'use client'

import { memo } from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import type { VerificationStatus } from '../types'

// ============================================================================
// Verification Badge - Memoized Component
// ============================================================================

interface VerificationBadgeProps {
  status: VerificationStatus | null
  isDark: boolean
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const VerificationBadge = memo(function VerificationBadge({
  status,
  isDark,
  size = 'md',
  showLabel = true
}: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1.5 text-sm'
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          label: 'დადასტურებული',
          icon: CheckCircle,
          className: isDark 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        }
      case 'pending':
        return {
          label: 'განხილვაში',
          icon: Clock,
          className: isDark 
            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
            : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
        }
      case 'rejected':
        return {
          label: 'უარყოფილი',
          icon: XCircle,
          className: isDark 
            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
            : 'bg-red-500/10 text-red-600 border-red-500/20'
        }
      case 'unverified':
      default:
        return {
          label: 'არადასტურებული',
          icon: null,
          className: isDark 
            ? 'bg-white/10 text-white/60 border-white/10' 
            : 'bg-black/10 text-black/60 border-black/10'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${config.className}`}>
      {Icon && <Icon className={iconSize} />}
      {showLabel && config.label}
    </span>
  )
})

export default VerificationBadge
